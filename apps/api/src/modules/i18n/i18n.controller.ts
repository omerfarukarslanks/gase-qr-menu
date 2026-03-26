import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { I18nService } from './i18n.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('i18n')
@Controller('api/i18n')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Public()
  @Get('languages')
  @ApiOperation({ summary: 'Get all supported languages' })
  getSupportedLanguages() {
    return this.i18nService.getSupportedLanguages();
  }

  @Public()
  @Get('store/:storeId/languages')
  @ApiOperation({ summary: 'Get languages for a store' })
  getStoreLanguages(@Param('storeId') storeId: string) {
    return this.i18nService.getLanguages(storeId);
  }

  @Post('store/:storeId/languages')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a language to a store' })
  addLanguage(
    @Param('storeId') storeId: string,
    @Body() dto: { languageCode: string; name: string; isDefault?: boolean },
  ) {
    return this.i18nService.addLanguage(storeId, dto);
  }

  @Delete('store/:storeId/languages/:languageCode')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a language from a store' })
  removeLanguage(
    @Param('storeId') storeId: string,
    @Param('languageCode') languageCode: string,
  ) {
    return this.i18nService.removeLanguage(storeId, languageCode);
  }

  @Put('store/:storeId/languages/:languageCode/default')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Set default language for a store' })
  setDefault(
    @Param('storeId') storeId: string,
    @Param('languageCode') languageCode: string,
  ) {
    return this.i18nService.setDefaultLanguage(storeId, languageCode);
  }
}
