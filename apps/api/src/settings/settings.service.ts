import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  type BatchUpdateSettingsDto,
  type CreateSettingDto,
  type QuerySettingsDto,
  SettingResponseDto,
  type UpdateSettingDto,
} from './dto/index.js';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to cast raw string database value into runtime JS type based on dataType hint
   */
  parseSettingValue(value: string, dataType: string): any {
    switch (dataType?.toUpperCase()) {
      case 'NUMBER': {
        const num = Number(value);
        return isNaN(num) ? value : num;
      }
      case 'BOOLEAN': {
        return value?.toLowerCase() === 'true' || value === '1';
      }
      case 'JSON': {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      case 'STRING':
      default:
        return value;
    }
  }

  private mapToResponseDto(setting: {
    key: string;
    value: string;
    dataType: string;
    group: string;
    isPublic: boolean;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): SettingResponseDto {
    return {
      key: setting.key,
      value: setting.value,
      parsedValue: this.parseSettingValue(setting.value, setting.dataType),
      dataType: setting.dataType,
      group: setting.group,
      isPublic: setting.isPublic,
      description: setting.description,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }

  /**
   * List settings with optional group and public visibility filtering
   */
  async findAll(query?: QuerySettingsDto): Promise<SettingResponseDto[]> {
    const where: { group?: string; isPublic?: boolean } = {};

    if (query?.group) {
      where.group = query.group.toUpperCase();
    }
    if (query?.isPublic !== undefined) {
      where.isPublic = query.isPublic;
    }

    const settings = await this.prisma.storeSetting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    return settings.map((s) => this.mapToResponseDto(s));
  }

  /**
   * Retrieve a single setting by its unique key
   */
  async findByKey(key: string): Promise<SettingResponseDto> {
    const setting = await this.prisma.storeSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Store setting with key '${key}' not found`);
    }

    return this.mapToResponseDto(setting);
  }

  private validateSettingValue(key: string, value: string): void {
    if (key === 'storefront.hero_banners') {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
          throw new Error('Expected an array of hero banners');
        }
        for (const item of parsed) {
          if (!item.id || typeof item.id !== 'string') {
            throw new Error('Each banner must have an id string');
          }
          if (!item.title || typeof item.title !== 'string') {
            throw new Error('Each banner must have a title string');
          }
          if (!item.imageUrl || typeof item.imageUrl !== 'string') {
            throw new Error('Each banner must have an imageUrl string');
          }
        }
      } catch (err: any) {
        throw new BadRequestException(
          `Invalid storefront.hero_banners payload: ${err.message}`,
        );
      }
    }
  }

  /**
   * Retrieve all public settings as a key-value dictionary for storefront clients
   */
  async getPublicSettings(): Promise<Record<string, any>> {
    const publicSettings = await this.prisma.storeSetting.findMany({
      where: { isPublic: true },
    });

    const result: Record<string, any> = {};
    for (const setting of publicSettings) {
      result[setting.key] = this.parseSettingValue(
        setting.value,
        setting.dataType,
      );
    }

    // Include processed active heroBanners array if present
    if (
      result['storefront.hero_banners'] &&
      Array.isArray(result['storefront.hero_banners'])
    ) {
      result.heroBanners = result['storefront.hero_banners']
        .filter((b: any) => b.isActive !== false)
        .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    return result;
  }

  /**
   * Retrieve unique group names present in settings
   */
  async getGroups(): Promise<string[]> {
    const settings = await this.prisma.storeSetting.findMany({
      select: { group: true },
      distinct: ['group'],
      orderBy: { group: 'asc' },
    });
    return settings.map((s) => s.group);
  }

  /**
   * Create a new setting
   */
  async create(dto: CreateSettingDto): Promise<SettingResponseDto> {
    this.validateSettingValue(dto.key, dto.value);

    const existing = await this.prisma.storeSetting.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException(
        `Store setting with key '${dto.key}' already exists`,
      );
    }

    const created = await this.prisma.storeSetting.create({
      data: {
        key: dto.key,
        value: dto.value,
        dataType: dto.dataType ?? 'STRING',
        group: dto.group ? dto.group.toUpperCase() : 'GENERAL',
        isPublic: dto.isPublic ?? false,
        description: dto.description ?? null,
      },
    });

    return this.mapToResponseDto(created);
  }

  /**
   * Update an existing setting by key
   */
  async update(key: string, dto: UpdateSettingDto): Promise<SettingResponseDto> {
    await this.findByKey(key);

    if (dto.value !== undefined) {
      this.validateSettingValue(key, dto.value);
    }

    const updated = await this.prisma.storeSetting.update({
      where: { key },
      data: {
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.dataType !== undefined && { dataType: dto.dataType }),
        ...(dto.group !== undefined && { group: dto.group.toUpperCase() }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Atomic batch update of multiple settings in a single transaction
   */
  async batchUpdate(
    dto: BatchUpdateSettingsDto,
  ): Promise<SettingResponseDto[]> {
    if (!dto.settings || dto.settings.length === 0) {
      return [];
    }

    const updatedKeys: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.settings) {
        await tx.storeSetting.upsert({
          where: { key: item.key },
          update: {
            value: item.value,
            ...(item.isPublic !== undefined && { isPublic: item.isPublic }),
            ...(item.description !== undefined && {
              description: item.description,
            }),
          },
          create: {
            key: item.key,
            value: item.value,
            dataType: 'STRING',
            group: 'GENERAL',
            isPublic: item.isPublic ?? false,
            description: item.description ?? null,
          },
        });
        updatedKeys.push(item.key);
      }
    });

    const updatedRecords = await this.prisma.storeSetting.findMany({
      where: { key: { in: updatedKeys } },
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    return updatedRecords.map((r) => this.mapToResponseDto(r));
  }

  /**
   * Delete a setting by key
   */
  async delete(key: string): Promise<{ success: boolean; message: string }> {
    await this.findByKey(key);

    await this.prisma.storeSetting.delete({
      where: { key },
    });

    return {
      success: true,
      message: `Store setting '${key}' deleted successfully`,
    };
  }

  /**
   * Programmatic helper for other modules to fetch typed values directly
   */
  async getSettingValue<T = any>(key: string, defaultValue?: T): Promise<T> {
    const setting = await this.prisma.storeSetting.findUnique({
      where: { key },
    });
    if (!setting) {
      return defaultValue as T;
    }
    return this.parseSettingValue(setting.value, setting.dataType) as T;
  }
}
