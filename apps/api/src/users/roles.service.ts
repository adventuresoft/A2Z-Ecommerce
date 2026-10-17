import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateRoleDto,
  ModuleCapabilityDto,
  RoleResponseDto,
  UpdateRoleDto,
} from './dto/index.js';

const KNOWN_MODULES = [
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

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultRoles();
  }

  async seedDefaultRoles(): Promise<void> {
    const count = await this.prisma.roleDefinition.count();
    if (count > 0) {
      return;
    }

    const allPermissions = KNOWN_MODULES.flatMap((mod) => [
      `${mod}.read`,
      `${mod}.create`,
      `${mod}.update`,
      `${mod}.delete`,
    ]);

    const adminPermissions = KNOWN_MODULES.flatMap((mod) => [
      `${mod}.read`,
      `${mod}.create`,
      `${mod}.update`,
    ]);

    const shopManagerPermissions = [
      'products.read',
      'products.create',
      'products.update',
      'products.delete',
      'variants.read',
      'variants.create',
      'variants.update',
      'variants.delete',
      'categories.read',
      'categories.create',
      'categories.update',
      'brands.read',
      'brands.create',
      'brands.update',
      'attributes.read',
      'attributes.create',
      'attributes.update',
      'orders.read',
      'orders.update',
      'inventory.read',
      'inventory.update',
    ];

    const defaultRoles = [
      {
        name: 'SuperAdmin',
        slug: 'superadmin',
        description: 'Full unrestricted root system access across all domain capabilities.',
        isSystem: true,
        permissions: allPermissions,
      },
      {
        name: 'Operations Admin',
        slug: 'admin',
        description: 'Operational access to manage catalog, orders, inventory, and shipments without deletion privileges.',
        isSystem: true,
        permissions: adminPermissions,
      },
      {
        name: 'Shop Manager',
        slug: 'shop_manager',
        description: 'Catalog, variant, order, and inventory management capabilities.',
        isSystem: true,
        permissions: shopManagerPermissions,
      },
      {
        name: 'Customer',
        slug: 'customer',
        description: 'Customer storefront account with no administrative abilities.',
        isSystem: true,
        permissions: [],
      },
    ];

    for (const r of defaultRoles) {
      await this.prisma.roleDefinition.upsert({
        where: { slug: r.slug },
        create: r,
        update: {},
      });
    }
  }

  private computeCapabilities(permissions: string[]): ModuleCapabilityDto[] {
    const permSet = new Set(permissions.map((p) => p.toLowerCase().trim()));
    return KNOWN_MODULES.map((mod) => ({
      module: mod,
      read: permSet.has(`${mod}.read`),
      create: permSet.has(`${mod}.create`),
      update: permSet.has(`${mod}.update`),
      delete: permSet.has(`${mod}.delete`),
    }));
  }

  async getAllRoles(): Promise<RoleResponseDto[]> {
    const roles = await this.prisma.roleDefinition.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.permissions,
      permissionCount: r.permissions.length,
      capabilities: this.computeCapabilities(r.permissions),
      userCount: r._count.users,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async getRoleById(id: string): Promise<RoleResponseDto> {
    const r = await this.prisma.roleDefinition.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!r) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.permissions,
      permissionCount: r.permissions.length,
      capabilities: this.computeCapabilities(r.permissions),
      userCount: r._count.users,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async createRole(dto: CreateRoleDto): Promise<RoleResponseDto> {
    const trimmedName = dto.name.trim();
    const slug = (dto.slug || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '_')).trim();

    const existingName = await this.prisma.roleDefinition.findUnique({
      where: { name: trimmedName },
    });
    if (existingName) {
      throw new ConflictException(`Role with name '${trimmedName}' already exists`);
    }

    const existingSlug = await this.prisma.roleDefinition.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Role with slug '${slug}' already exists`);
    }

    const created = await this.prisma.roleDefinition.create({
      data: {
        name: trimmedName,
        slug,
        description: dto.description?.trim() || null,
        isSystem: false,
        permissions: Array.from(new Set(dto.permissions.map((p) => p.trim()))),
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      description: created.description,
      isSystem: created.isSystem,
      permissions: created.permissions,
      permissionCount: created.permissions.length,
      capabilities: this.computeCapabilities(created.permissions),
      userCount: created._count.users,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    const existing = await this.prisma.roleDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    if (dto.name && dto.name.trim() !== existing.name) {
      const clash = await this.prisma.roleDefinition.findUnique({
        where: { name: dto.name.trim() },
      });
      if (clash && clash.id !== id) {
        throw new ConflictException(`Role name '${dto.name.trim()}' is already in use`);
      }
    }

    const updated = await this.prisma.roleDefinition.update({
      where: { id },
      data: {
        name: dto.name?.trim() ?? existing.name,
        description: dto.description !== undefined ? dto.description?.trim() : existing.description,
        permissions: dto.permissions
          ? Array.from(new Set(dto.permissions.map((p) => p.trim())))
          : existing.permissions,
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      isSystem: updated.isSystem,
      permissions: updated.permissions,
      permissionCount: updated.permissions.length,
      capabilities: this.computeCapabilities(updated.permissions),
      userCount: updated._count.users,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteRole(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.roleDefinition.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    if (existing.isSystem) {
      throw new BadRequestException(`Cannot delete system-reserved role '${existing.name}'`);
    }

    if (existing._count.users > 0) {
      throw new BadRequestException(
        `Cannot delete role '${existing.name}' because ${existing._count.users} user(s) are currently assigned to it`,
      );
    }

    await this.prisma.roleDefinition.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Role '${existing.name}' successfully deleted`,
    };
  }
}
