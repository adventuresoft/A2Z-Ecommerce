import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AccessPayload } from '../auth/interfaces/token-payload.interface.js';
import { PaystationService } from './paystation.service.js';
import {
  InitiatePaystationDto,
  PaystationInitiateResponseDto,
  PaystationVerifyResponseDto,
  VerifyPaystationDto,
} from './dto/paystation.dto.js';

@ApiTags('PayStation Gateway')
@Controller('payments/paystation')
export class PaystationController {
  constructor(private readonly paystationService: PaystationService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate an authenticated PayStation hosted checkout payment session for an owned order',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment session successfully initiated with payment_url',
    type: PaystationInitiateResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Order does not belong to authenticated user' })
  async initiate(
    @Body() dto: InitiatePaystationDto,
    @CurrentUser() user: AccessPayload,
  ): Promise<PaystationInitiateResponseDto> {
    return this.paystationService.initiatePayment(dto.orderId, dto.callbackUrl, {
      sub: user.sub,
      role: user.role,
    });
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify PayStation payment status and update order/payment records',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification result from PayStation',
    type: PaystationVerifyResponseDto,
  })
  async verify(
    @Body() dto: VerifyPaystationDto,
  ): Promise<PaystationVerifyResponseDto> {
    return this.paystationService.verifyPayment(dto.invoice_number);
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Server-to-server PayStation IPN callback performing authoritative verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Verified callback reconciliation result',
    type: PaystationVerifyResponseDto,
  })
  async handleCallbackPost(
    @Body() body: Record<string, unknown>,
    @Query('invoice_number') queryInvoice?: string,
  ): Promise<PaystationVerifyResponseDto> {
    const invoiceNumber =
      (typeof body?.invoice_number === 'string' && body.invoice_number.trim()) ||
      (typeof queryInvoice === 'string' && queryInvoice.trim()) ||
      '';
    if (!invoiceNumber) {
      throw new BadRequestException('invoice_number is required');
    }
    return this.paystationService.verifyPayment(invoiceNumber);
  }

  @Get('callback')
  @ApiOperation({
    summary: 'GET callback alias performing authoritative server-to-server PayStation verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Verified callback reconciliation result',
    type: PaystationVerifyResponseDto,
  })
  async handleCallbackGet(
    @Query('invoice_number') invoiceNumber?: string,
  ): Promise<PaystationVerifyResponseDto> {
    if (!invoiceNumber || !invoiceNumber.trim()) {
      throw new BadRequestException('invoice_number is required');
    }
    return this.paystationService.verifyPayment(invoiceNumber.trim());
  }

  @Get('status/:invoiceNumber')
  @ApiOperation({
    summary: 'Query and verify transaction status for an invoice number',
  })
  @ApiResponse({
    status: 200,
    description: 'Current verified transaction status',
    type: PaystationVerifyResponseDto,
  })
  async getStatus(
    @Param('invoiceNumber') invoiceNumber: string,
  ): Promise<PaystationVerifyResponseDto> {
    return this.paystationService.verifyPayment(invoiceNumber);
  }
}
