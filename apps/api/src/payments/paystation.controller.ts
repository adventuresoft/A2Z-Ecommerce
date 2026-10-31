import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate a PayStation hosted checkout payment session for an order',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment session successfully initiated with payment_url',
    type: PaystationInitiateResponseDto,
  })
  async initiate(
    @Body() dto: InitiatePaystationDto,
  ): Promise<PaystationInitiateResponseDto> {
    return this.paystationService.initiatePayment(dto.orderId, dto.callbackUrl);
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
