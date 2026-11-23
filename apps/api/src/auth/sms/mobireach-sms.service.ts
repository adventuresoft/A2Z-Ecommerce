import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  /** True only when live SMS delivery failed and fell back to dev simulation */
  simulated?: boolean;
}

@Injectable()
export class MobiReachSmsService {
  private readonly logger = new Logger(MobiReachSmsService.name);
  private cachedAccessToken: string | null = null;
  private cachedRefreshToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Normalize any Bangladeshi phone number to 8801XXXXXXXXX format
   */
  normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.startsWith('880')) {
      return cleaned;
    }
    if (cleaned.startsWith('01')) {
      return `88${cleaned}`;
    }
    if (cleaned.startsWith('1') && cleaned.length === 10) {
      return `880${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Format phone for local display: 01XXXXXXXXX
   */
  formatLocalPhoneNumber(phone: string): string {
    const normalized = this.normalizePhoneNumber(phone);
    if (normalized.startsWith('880')) {
      return normalized.slice(2);
    }
    return phone;
  }

  private get baseUrl(): string {
    return (
      this.configService.get<string>('MOBIREACH_BASE_URL') ||
      'https://api.mobireach.com.bd'
    ).replace(/\/+$/, '');
  }

  private get username(): string {
    const configured = this.configService.get<string>('MOBIREACH_USERNAME');
    if (process.env.NODE_ENV === 'production') {
      return configured || '';
    }
    return configured || 'advsoft';
  }

  private get password(): string {
    const configured = this.configService.get<string>('MOBIREACH_PASSWORD');
    if (process.env.NODE_ENV === 'production') {
      return configured || '';
    }
    return configured || 'Dhaka@0088';
  }

  private get sender(): string {
    const configured = this.configService.get<string>('MOBIREACH_SENDER_ID');
    if (process.env.NODE_ENV === 'production') {
      return configured || '';
    }
    return configured || '01805976387';
  }

  private async getAccessToken(forceNew = false): Promise<string | null> {
    const now = Date.now();
    if (!forceNew && this.cachedAccessToken && this.tokenExpiresAt > now + 60 * 1000) {
      return this.cachedAccessToken;
    }

    try {
      // 1. Try refresh token if available and not forcing new
      if (!forceNew && this.cachedRefreshToken) {
        const refreshRes = await fetch(`${this.baseUrl}/auth/token/refresh`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.cachedRefreshToken}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        });
        if (refreshRes.ok) {
          const data = (await refreshRes.json()) as {
            token?: string;
            refresh_token?: string;
          };
          if (data.token) {
            this.cachedAccessToken = data.token;
            if (data.refresh_token) {
              this.cachedRefreshToken = data.refresh_token;
            }
            this.tokenExpiresAt = Date.now() + 50 * 60 * 1000; // 50 mins buffer
            return this.cachedAccessToken;
          }
        }
      }

      // 2. Generate new token using username & password
      const res = await fetch(`${this.baseUrl}/auth/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error(`MobiReach token generation failed: ${res.status} ${errText}`);
        return null;
      }

      const data = (await res.json()) as {
        token?: string;
        refresh_token?: string;
      };
      if (data.token) {
        this.cachedAccessToken = data.token;
        this.cachedRefreshToken = data.refresh_token || null;
        this.tokenExpiresAt = Date.now() + 50 * 60 * 1000;
        return this.cachedAccessToken;
      }

      return null;
    } catch (err: any) {
      this.logger.error(`Failed to connect to MobiReach auth: ${err.message}`);
      return null;
    }
  }

  private logDevFallback(receiver: string, content: string, reason: string): SendSmsResult {
    this.logger.warn(
      `\n===========================================================\n` +
        `[DEV SMS FALLBACK] ${reason}\n` +
        `To: ${receiver}\n` +
        `Message: "${content}"\n` +
        `===========================================================\n`,
    );
    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}`,
    };
  }

  /**
   * Send an SMS message using live MobiReach Gateway (`POST /sms/send`).
   * In non-production environments, logs OTP/content ONLY if live SMS fails or is simulated.
   */
  async sendSms(rawPhone: string, content: string): Promise<SendSmsResult> {
    const receiver = this.normalizePhoneNumber(rawPhone);
    const isProduction = process.env.NODE_ENV === 'production';
    const forceSimulate = !isProduction && this.configService.get<string>('SMS_SIMULATE') === 'true';
    const isDev = !isProduction;

    if (forceSimulate) {
      return this.logDevFallback(receiver, content, 'SMS_SIMULATE=true enabled.');
    }

    if (isProduction && (!this.username || !this.password || !this.sender)) {
      return {
        success: false,
        error: 'SMS gateway credentials are not configured in production',
      };
    }

    try {
      let token = await this.getAccessToken(false);
      if (!token) {
        if (isDev) {
          return this.logDevFallback(receiver, content, 'MobiReach auth unavailable.');
        }
        return {
          success: false,
          error: 'Unable to authenticate with MobiReach SMS gateway',
        };
      }

      const payload = {
        sender: this.sender,
        receiver: [receiver],
        content,
        msgType: 'T',
        requestType: 'S',
        contentType: '1',
      };

      let res = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });

      // Retry once with fresh token if unauthorized (401)
      if (res.status === 401) {
        token = await this.getAccessToken(true);
        if (token) {
          res = await fetch(`${this.baseUrl}/sms/send`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(8000),
          });
        }
      }

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.error(`MobiReach send failed (${res.status}): ${errorText}`);
        if (isDev) {
          return this.logDevFallback(
            receiver,
            content,
            `MobiReach returned HTTP ${res.status}: ${errorText}`,
          );
        }
        return {
          success: false,
          error: `SMS Gateway error (${res.status})`,
        };
      }

      const result = (await res.json().catch(() => ({}))) as {
        status?: string;
        description?: string;
        errorCode?: number;
        messageId?: string | number;
        message_id?: string | number;
      };

      const gatewayStatus =
        typeof result?.status === 'string' ? result.status.toUpperCase() : '';
      const hasErrorCode =
        typeof result?.errorCode === 'number' && result.errorCode !== 0;

      if (gatewayStatus === 'FAILED' || hasErrorCode) {
        const reason =
          result?.description ||
          `MobiReach rejected SMS (status=${result?.status}, errorCode=${result?.errorCode})`;
        this.logger.error(`MobiReach gateway failure for ${receiver}: ${JSON.stringify(result)}`);
        if (isDev) {
          return this.logDevFallback(receiver, content, reason);
        }
        return {
          success: false,
          error: reason,
        };
      }

      const rawId = result?.messageId ?? result?.message_id;
      const messageId =
        rawId !== undefined && rawId !== null && String(rawId) !== '0'
          ? String(rawId)
          : `sms_${Date.now()}`;

      // Live SMS succeeded — do NOT log OTP content
      this.logger.log(`MobiReach SMS delivered to ${receiver} (messageId: ${messageId})`);
      return {
        success: true,
        simulated: false,
        messageId,
      };
    } catch (error: any) {
      this.logger.error(`Error sending SMS via MobiReach: ${error.message}`);
      if (isDev) {
        return this.logDevFallback(receiver, content, `MobiReach error (${error.message}).`);
      }
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
