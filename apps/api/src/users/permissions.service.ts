import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreatePermissionDto,
  PermissionResponseDto,
  UpdatePermissionDto,
} from './dto/index.js';

const DEFAULT_CORE_MODULES = [
  'user',
  'basic_setting',
  'products',
  'categories',
  'brands',
  'attributes',
  'variants',
  'orders',
  'inventory',
  'shipments',
  'customers',
  'marketing',
  'payments',
  'engagement',
  'reports',
];

const DEFAULT_ACTIONS = ['read', 'create', 'update', 'delete'];

@Injectable()
export class PermissionsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultPermissions();
  }

  async seedDefaultPermissions(): Promise<void> {
    const count = await this.prisma.permissionDefinition.count();
    if (count > 0) {
      return;
    }

    const permissionsToSeed: {
      key: string;
      name: string;
      module: string;
      action: string;
      description: string;
      isSystem: boolean;
    }[] = [];

    for (const mod of DEFAULT_CORE_MODULES) {
      const moduleDisplay = mod.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      for (const act of DEFAULT_ACTIONS) {
        const key = `${mod}.${act}`;
        const actDisplay = act.toUpperCase();
        permissionsToSeed.push({
          key,
          name: `${actDisplay} ${moduleDisplay}`,
          module: mod,
          action: act,
          description: `Permission to ${act} resources in ${moduleDisplay} module`,
          isSystem: true,
        });
      }
    }

    for (const p of permissionsToSeed) {
      await this.prisma.permissionDefinition.upsert({
        where: { key: p.key },
        create: p,
        update: {},
      });
    }
  }

  async getAllPermissions(): Promise<PermissionResponseDto[]> {
    const list = await this.prisma.permissionDefinition.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    return list.map((item) => ({
      id: item.id,
      key: item.key,
      name: item.name,
      module: item.module,
      action: item.action,
      description: item.description,
      isSystem: item.isSystem,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  async createPermission(dto: CreatePermissionDto): Promise<PermissionResponseDto> {
    const normalizedKey = dto.key.toLowerCase().trim();

    const existing = await this.prisma.permissionDefinition.findUnique({
      where: { key: normalizedKey },
    });

    if (existing) {
      throw new ConflictException(`Permission key '${normalizedKey}' already exists`);
    }

    let parsedModule = dto.module?.trim().toLowerCase();
    let parsedAction = dto.action?.trim().toLowerCase();

    if (!parsedModule || !parsedAction) {
      const parts = normalizedKey.split('.');
      if (parts.length >= 2) {
        parsedModule = parsedModule || parts[0];
        parsedAction = parsedAction || parts.slice(1).join('.');
      } else {
        parsedModule = parsedModule || 'custom';
        parsedAction = parsedAction || normalizedKey;
      }
    }

    const name = dto.name?.trim() || `${parsedAction.toUpperCase()} ${parsedModule}`;

    const created = await this.prisma.permissionDefinition.create({
      data: {
        key: normalizedKey,
        name,
        module: parsedModule,
        action: parsedAction,
        description: dto.description?.trim() || null,
        isSystem: false,
      },
    });

    return {
      id: created.id,
      key: created.key,
      name: created.name,
      module: created.module,
      action: created.action,
      description: created.description,
      isSystem: created.isSystem,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async updatePermission(
    id: string,
    dto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const existing = await this.prisma.permissionDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }

    const updated = await this.prisma.permissionDefinition.update({
      where: { id },
      data: {
        name: dto.name?.trim() ?? existing.name,
        description: dto.description?.trim() ?? existing.description,
      },
    });

    return {
      id: updated.id,
      key: updated.key,
      name: updated.name,
      module: updated.module,
      action: updated.action,
      description: updated.description,
      isSystem: updated.isSystem,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deletePermission(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.permissionDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Permission with ID '${id}' not found`);
    }

    if (existing.isSystem) {
      throw new BadRequestException(`Cannot delete system-reserved permission '${existing.key}'`);
    }

    await this.prisma.permissionDefinition.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Permission '${existing.key}' successfully removed`,
    };
  }
}
