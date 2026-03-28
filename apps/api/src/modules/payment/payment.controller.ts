import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  CreatePaymentDto,
  CreateCashPaymentDto,
  Initiate3DSecureDto,
  Complete3DSecureCallbackDto,
  PaymentListQueryDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('payments')
@Controller('api/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a payment record (cash, etc.)' })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentService.createPayment(dto);
  }

  @Public()
  @Post('cash')
  @ApiOperation({ summary: 'Create a public cash payment for a customer order' })
  createCashPayment(@Body() dto: CreateCashPaymentDto) {
    return this.paymentService.createCashPayment(dto);
  }

  @Public()
  @Post('3d-secure/initiate')
  @ApiOperation({ summary: 'Initiate 3D Secure payment (returns HTML form)' })
  initiate3DSecure(@Body() dto: Initiate3DSecureDto) {
    return this.paymentService.initiate3DSecure(dto);
  }

  @Public()
  @Post('3d-secure/callback')
  @ApiOperation({ summary: '3D Secure callback from iyzico' })
  complete3DSecure(@Body() dto: Complete3DSecureCallbackDto) {
    return this.paymentService.complete3DSecureCallback(dto);
  }

  @Get('order/:orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payments for an order' })
  findByOrder(@Param('orderId') orderId: string) {
    return this.paymentService.findByOrder(orderId);
  }

  @Get('store/:storeId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List payments for a store' })
  findByStore(
    @Param('storeId') storeId: string,
    @Query() query: PaymentListQueryDto,
  ) {
    return this.paymentService.findByStore(storeId, query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment by ID' })
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Post(':id/refund')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Refund a payment' })
  refund(@Param('id') id: string) {
    return this.paymentService.refund(id);
  }
}
