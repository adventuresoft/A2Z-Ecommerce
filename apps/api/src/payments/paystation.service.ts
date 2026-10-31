import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/index.js';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import {
  PaystationInitiateResponseDto,
  PaystationVerifyResponseDto,
} from './dto/paystation.dto.js';

interface PaystationRawInitiateResponse {
  status_code: string;
  status: string;
  message?: string;
  payment_amount?: string;
  invoice_number?: string;
  payment_url?: string;
}

interface PaystationRawStatusData {
  invoice_number: string;
  trx_status: string;
  trx_id: string;
  request_amount?: string;
  payment_amount?: string;
  order_date_time?: string;
  payer_mobile_no?: string;
  payment_method?: string;
  reference?: string;
  checkout_items?: string;
}

interface PaystationRawStatusResponse {
  status_code: string;
  status: string;
  message?: string;
  data?: PaystationRawStatusData;
}

@Injectable()
export class PaystationService {
  private readonly logger = new Logger(PaystationService.name);
  private readonly merchantId: string;
  private readonly password: string;
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.merchantId = this.configService.get<string>(
      'PAYSTATION_MERCHANT_ID',
      '104-1653730183',
    );
    this.password = this.configService.get<string>(
      'PAYSTATION_PASSWORD',
      'gamecoderstorepass',
    );
    this.baseUrl = this.configService
      .get<string>('PAYSTATION_BASE_URL', 'https://sandbox.paystation.com.bd')
      .replace(/\/+$/, '');
  }

  /**
   * Resolve active credentials (database setting overrides config defaults)
   */
  private async getCredentials(): Promise<{
    merchantId: string;
    password: string;
    baseUrl: string;
  }> {
    const setting = await this.prisma.paymentMethodSetting.findUnique({
      where: { code: 'PAYSTATION' },
    });

    const merchantId = setting?.merchantId?.trim() || this.merchantId;
    const password = setting?.password?.trim() || this.password;

    let baseUrl = this.baseUrl;
    if (setting && setting.isSandbox === false) {
      baseUrl = this.configService
        .get<string>(
          'PAYSTATION_PRODUCTION_BASE_URL',
          'https://api.paystation.com.bd',
        )
        .replace(/\/+$/, '');
    }

    return { merchantId, password, baseUrl };
  }

  /**
   * Initiate PayStation Hosted Gateway Checkout
   */
  async initiatePayment(
    orderId: string,
    customCallbackUrl?: string,
  ): Promise<PaystationInitiateResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        items: true,
        user: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(`Order '${order.orderNumber}' has already been paid.`);
    }

    const callbackUrl =
      customCallbackUrl ||
      this.configService.get<string>(
        'PAYSTATION_CALLBACK_URL',
        'http://localhost:3000/checkout/payment-callback',
      );

    const { merchantId, password, baseUrl } = await this.getCredentials();

    // Format sanitized customer mobile
    const rawPhone = order.recipientPhone || order.user?.phone || '01712345678';
    const sanitizedPhone = rawPhone.replace(/^\+?880?/, '0');

    // Build form data per PayStation gateway specifications
    const formData = new FormData();
    formData.append('invoice_number', order.orderNumber);
    formData.append('currency', 'BDT');
    formData.append('payment_amount', order.grandTotal.toString());
    formData.append('reference', order.orderNumber);
    formData.append('cust_name', order.recipientName || order.user?.name || 'AZ Shopper');
    formData.append('cust_phone', sanitizedPhone);
    formData.append('cust_email', order.user?.email || 'customer@example.com');
    formData.append(
      'cust_address',
      `${order.shippingStreet}, ${order.shippingCity}`,
    );
    formData.append('callback_url', callbackUrl);
    formData.append(
      'checkout_items',
      order.items
        .map((i) => i.productTitle)
        .slice(0, 3)
        .join(', ') || `Order ${order.orderNumber}`,
    );
    formData.append('merchantId', merchantId);
    formData.append('password', password);

    try {
      this.logger.log(
        `Initiating PayStation payment for Order: ${order.orderNumber}, Amount: ${order.grandTotal} BDT using Merchant ID: ${merchantId}`,
      );

      const response = await fetch(`${baseUrl}/initiate-payment`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Gateway returned HTTP status ${response.status}`);
      }

      const result = (await response.json()) as PaystationRawInitiateResponse;

      if (result.status !== 'success' || !result.payment_url) {
        this.logger.error(
          `PayStation initiation failed: ${result.message || 'Unknown error'}`,
          result,
        );
        throw new BadRequestException(
          result.message || 'PayStation payment gateway could not generate checkout session',
        );
      }

      // Update or create pending payment record
      const existingPaystationPayment = order.payments.find(
        (p) => p.method === PaymentMethod.PAYSTATION && p.status === PaymentStatus.PENDING,
      );

      if (existingPaystationPayment) {
        await this.prisma.payment.update({
          where: { id: existingPaystationPayment.id },
          data: {
            notes: `PayStation URL generated: ${result.payment_url}`,
          },
        });
      } else {
        await this.prisma.payment.create({
          data: {
            orderId: order.id,
            method: PaymentMethod.PAYSTATION,
            status: PaymentStatus.PENDING,
            amount: order.grandTotal,
            currency: 'BDT',
            notes: `PayStation URL generated: ${result.payment_url}`,
          },
        });
      }

      return {
        status: 'success',
        payment_url: result.payment_url,
        invoice_number: result.invoice_number || order.orderNumber,
        message: result.message || 'Payment link generated successfully',
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error connecting to PayStation gateway: ${msg}`);
      throw new BadRequestException(
        `Failed to reach PayStation gateway: ${msg}`,
      );
    }
  }

  /**
   * Verify Payment Status with PayStation
   */
  async verifyPayment(invoiceNumber: string): Promise<PaystationVerifyResponseDto> {
    this.logger.log(`Verifying PayStation status for invoice: ${invoiceNumber}`);

    try {
      const { merchantId, baseUrl } = await this.getCredentials();

      const response = await fetch(`${baseUrl}/transaction-status`, {
        method: 'POST',
        headers: {
          merchantId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoice_number: invoiceNumber }),
      });

      if (!response.ok) {
        throw new Error(`PayStation status inquiry returned HTTP status ${response.status}`);
      }

      const result = (await response.json()) as PaystationRawStatusResponse;

      if (result.status !== 'success' || !result.data) {
        return {
          verified: false,
          status: 'NOT_FOUND',
          orderNumber: invoiceNumber,
          message: result.message || 'No transaction found on PayStation gateway',
        };
      }

      const data = result.data;
      const trxStatus = (data.trx_status || '').toLowerCase();
      const trxId = data.trx_id || '';

      // Find local order
      const order = await this.prisma.order.findUnique({
        where: { orderNumber: invoiceNumber },
        include: { payments: true },
      });

      if (trxStatus === 'success' || trxStatus === 'successful') {
        if (order) {
          // Perform database state transition in atomic transaction
          await this.prisma.$transaction(async (tx) => {
            // Update order
            await tx.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: PaymentStatus.PAID,
                orderStatus:
                  order.orderStatus === OrderStatus.PENDING
                    ? OrderStatus.CONFIRMED
                    : order.orderStatus,
              },
            });

            // Find or update payment record
            const targetPayment =
              order.payments.find((p) => p.method === PaymentMethod.PAYSTATION) ||
              order.payments[0];

            if (targetPayment) {
              await tx.payment.update({
                where: { id: targetPayment.id },
                data: {
                  status: PaymentStatus.PAID,
                  paidAt: new Date(),
                  transactionRef: trxId || targetPayment.transactionRef || invoiceNumber,
                  notes: `PayStation Verified via Server-to-Server API (TrxID: ${trxId})`,
                },
              });
            } else {
              await tx.payment.create({
                data: {
                  orderId: order.id,
                  method: PaymentMethod.PAYSTATION,
                  status: PaymentStatus.PAID,
                  amount: order.grandTotal,
                  currency: 'BDT',
                  paidAt: new Date(),
                  transactionRef: trxId,
                  notes: `PayStation Verified (TrxID: ${trxId})`,
                },
              });
            }

            // Record status history if pending
            if (order.orderStatus === OrderStatus.PENDING) {
              await tx.orderStatusHistory.create({
                data: {
                  orderId: order.id,
                  fromStatus: OrderStatus.PENDING,
                  toStatus: OrderStatus.CONFIRMED,
                  notes: `Order confirmed automatically via PayStation (TrxID: ${trxId})`,
                },
              });
            }
          });
        }

        return {
          verified: true,
          status: 'Success',
          trx_id: trxId,
          orderNumber: invoiceNumber,
          orderId: order?.id,
          message: 'Payment verified and order confirmed successfully.',
        };
      }

      if (trxStatus === 'processing') {
        return {
          verified: false,
          status: 'Processing',
          trx_id: trxId,
          orderNumber: invoiceNumber,
          orderId: order?.id,
          message: 'Payment is currently processing at the payment gateway.',
        };
      }

      // Mark payment failed if gateway returned Failed or Cancelled
      if (order) {
        const targetPayment =
          order.payments.find((p) => p.method === PaymentMethod.PAYSTATION) ||
          order.payments[0];

        if (targetPayment && targetPayment.status !== PaymentStatus.PAID) {
          await this.prisma.payment.update({
            where: { id: targetPayment.id },
            data: {
              status: PaymentStatus.FAILED,
              notes: `PayStation gateway returned status: ${data.trx_status}`,
            },
          });
        }
      }

      return {
        verified: false,
        status: data.trx_status || 'Failed',
        trx_id: trxId,
        orderNumber: invoiceNumber,
        orderId: order?.id,
        message: `Payment transaction was not completed: ${data.trx_status}`,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error verifying transaction with PayStation: ${msg}`);
      throw new BadRequestException(`PayStation verification inquiry failed: ${msg}`);
    }
  }

  /**
   * Raw Transaction Status Inquiry
   */
  async getTransactionDetails(invoiceNumber: string): Promise<PaystationRawStatusResponse> {
    const { merchantId, baseUrl } = await this.getCredentials();

    const response = await fetch(`${baseUrl}/transaction-status`, {
      method: 'POST',
      headers: {
        merchantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice_number: invoiceNumber }),
    });

    return (await response.json()) as PaystationRawStatusResponse;
  }
}
