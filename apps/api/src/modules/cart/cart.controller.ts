import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('cart')
@Public()
@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  @ApiOperation({ summary: 'Add item to cart' })
  addItem(@Body() dto: AddToCartDto) {
    return this.cartService.addItem(dto);
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get cart by session ID' })
  getCart(@Param('sessionId') sessionId: string) {
    return this.cartService.getCart(sessionId);
  }

  @Put(':sessionId/items/:productId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateItem(
    @Param('sessionId') sessionId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(sessionId, productId, dto);
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Clear cart' })
  clearCart(@Param('sessionId') sessionId: string) {
    return this.cartService.clearCart(sessionId);
  }
}
