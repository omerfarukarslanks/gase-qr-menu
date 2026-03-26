import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('campaigns')
@Controller('api/campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a campaign' })
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignService.create(dto);
  }

  @Get('store/:storeId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List campaigns for a store' })
  findAll(@Param('storeId') storeId: string, @Query() query: PaginationQueryDto) {
    return this.campaignService.findAll(storeId, query);
  }

  @Public()
  @Get('store/:storeId/active')
  @ApiOperation({ summary: 'Get active campaigns (public)' })
  findActive(@Param('storeId') storeId: string) {
    return this.campaignService.findActive(storeId);
  }

  @Public()
  @Get('store/:storeId/validate/:couponCode')
  @ApiOperation({ summary: 'Validate a coupon code' })
  validateCoupon(
    @Param('storeId') storeId: string,
    @Param('couponCode') couponCode: string,
  ) {
    return this.campaignService.validateCoupon(storeId, couponCode);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get campaign by ID' })
  findOne(@Param('id') id: string) {
    return this.campaignService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update campaign' })
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Deactivate campaign' })
  remove(@Param('id') id: string) {
    return this.campaignService.remove(id);
  }
}
