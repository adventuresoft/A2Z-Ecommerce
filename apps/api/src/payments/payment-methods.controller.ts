import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';
import { ActivePaymentMethodDto } from './dto/index.js';

@ApiTags('Public Payment Methods')
@Controller('payments/methods')
export class PaymentMethodsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('active')
  @ApiOperation({
    summary: 'Retrieve all currently active payment methods for customer checkout',
  })
  @ApiResponse({ status: 200, type: [ActivePaymentMethodDto] })
  async findActive(): Promise<ActivePaymentMethodDto[]> {
    return this.paymentsService.findActivePaymentMethods();
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all currently active payment methods for customer checkout',
  })
  @ApiResponse({ status: 200, type: [ActivePaymentMethodDto] })
  async findAll(): Promise<ActivePaymentMethodDto[]> {
    return this.paymentsService.findActivePaymentMethods();
  }
}
