import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
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
    return this.configService.get<string>('MOBIREACH_USERNAME') || 'advsoft';
  }

  private get password(): string {
    return this.configService.get<string>('MOBIREACH_PASSWORD') || 'Dhaka@0088';
  }

  private get sender(): string {
    return this.configService.get<string>('MOBIREACH_SENDER_ID') || '01805976387';
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
          signal: AbortSignal.timeout(3000),
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
        signal: AbortSignal.timeout(3000),
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

  /**
   * Send an SMS message using live MobiReach Gateway (`POST /sms/send`).
   */
  async sendSms(rawPhone: string, content: string): Promise<SendSmsResult> {
    const receiver = this.normalizePhoneNumber(rawPhone);
    const isDev =
      process.env.NODE_ENV !== 'production' ||
      this.configService.get<string>('SMS_SIMULATE') === 'true';

    try {
      let token = await this.getAccessToken(false);
      if (!token) {
        if (isDev) {
          this.logger.warn(
            `\n===========================================================\n` +
              `[DEV SMS GATEWAY] MobiReach auth unavailable. Simulating SMS:\n` +
              `To: ${receiver}\n` +
              `Content: "${content}"\n` +
              `===========================================================\n`,
          );
          return {
            success: true,
            messageId: `sim_${Date.now()}`,
          };
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
        signal: AbortSignal.timeout(3000),
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
            signal: AbortSignal.timeout(3000),
          });
        }
      }

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.error(`MobiReach send failed (${res.status}): ${errorText}`);
        if (isDev) {
          this.logger.warn(
            `\n===========================================================\n` +
              `[DEV SMS GATEWAY] MobiReach returned ${res.status}. Simulating delivery:\n` +
              `To: ${receiver}\n` +
              `Content: "${content}"\n` +
              `===========================================================\n`,
          );
          return {
            success: true,
            messageId: `sim_${Date.now()}`,
          };
        }
        return {
          success: false,
          error: `SMS Gateway error (${res.status})`,
        };
      }

      const result = await res.json().catch(() => ({}));
      this.logger.log(`MobiReach SMS sent to ${receiver}. Response: ${JSON.stringify(result)}`);
      return {
        success: true,
        messageId: result?.message_id || `sms_${Date.now()}`,
      };
    } catch (error: any) {
      this.logger.error(`Error sending SMS via MobiReach: ${error.message}`);
      if (isDev) {
        this.logger.warn(
          `\n===========================================================\n` +
            `[DEV SMS GATEWAY] MobiReach error (${error.message}). Simulating delivery:\n` +
            `To: ${receiver}\n` +
            `Content: "${content}"\n` +
            `===========================================================\n`,
        );
        return {
          success: true,
          messageId: `sim_${Date.now()}`,
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
