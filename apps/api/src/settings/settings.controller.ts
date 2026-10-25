import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettingResponseDto } from './dto/index.js';
import { SettingsService } from './settings.service.js';

@ApiTags('Store Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all public store settings as a key-value dictionary for storefront clients',
  })
  @ApiResponse({
    status: 200,
    description: 'Key-value map of public store settings',
    schema: {
      type: 'object',
      example: {
        store_name: 'A2Z E-Commerce Store',
        default_currency: 'BDT',
        currency_symbol: '৳',
        enable_cod: true,
      },
    },
  })
  async getPublicSettings(): Promise<Record<string, any>> {
    return this.settingsService.getPublicSettings();
  }

  @Get('public')
  @ApiOperation({
    summary: 'Get all public store settings (hero banners, contact, policies)',
  })
  @ApiResponse({
    status: 200,
    description: 'Key-value map of public store settings with active hero banners',
  })
  async getPublicSettingsExplicit(): Promise<Record<string, any>> {
    return this.settingsService.getPublicSettings();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a single public store setting by key' })
  @ApiParam({ name: 'key', example: 'store_name' })
  @ApiResponse({
    status: 200,
    description: 'Public store setting details',
    type: SettingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Setting not found or not public' })
  async getPublicSettingByKey(@Param('key') key: string) {
    const setting = await this.settingsService.findByKey(key);
    if (!setting.isPublic) {
      throw new NotFoundException(`Store setting with key '${key}' not found`);
    }
    return setting;
  }
}
