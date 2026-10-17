import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { User, Role, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  CreateUserDto,
  PaginatedUsersResponseDto,
  QueryUsersDto,
  UpdateUserDto,
  UserResponseDto,
} from './dto/index.js';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role?: Role;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roleDefinition: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        roleDefinition: true,
      },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        name: data.name,
        phone: data.phone,
        role: data.role ?? 'CUSTOMER',
      },
    });
  }

  async incrementTokenVersion(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  private mapUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      roleId: user.roleId,
      roleDefinition: user.roleDefinition
        ? {
            id: user.roleDefinition.id,
            name: user.roleDefinition.name,
            slug: user.roleDefinition.slug,
            description: user.roleDefinition.description,
            isSystem: user.roleDefinition.isSystem,
            permissions: user.roleDefinition.permissions,
          }
        : null,
      designation: user.designation,
      department: user.department,
      section: user.section,
      location: user.location,
      isActive: user.isActive,
      tokenVersion: user.tokenVersion,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findAll(query: QueryUsersDto): Promise<PaginatedUsersResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined && query.isActive !== '') {
      where.isActive =
        typeof query.isActive === 'boolean'
          ? query.isActive
          : query.isActive === 'true';
    }

    if (query.designation) {
      where.designation = {
        contains: query.designation.trim(),
        mode: 'insensitive',
      };
    }

    if (query.department) {
      where.department = {
        contains: query.department.trim(),
        mode: 'insensitive',
      };
    }

    if (query.section) {
      where.section = {
        contains: query.section.trim(),
        mode: 'insensitive',
      };
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { location: { contains: term, mode: 'insensitive' } },
        { designation: { contains: term, mode: 'insensitive' } },
        { department: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          roleDefinition: true,
        },
      }),
    ]);

    return {
      items: items.map((u) => this.mapUserResponse(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getAdminUserById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roleDefinition: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return this.mapUserResponse(user);
  }

  async createAdminUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException(`User with email '${normalizedEmail}' already exists`);
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    // If roleId is supplied, verify it exists
    if (dto.roleId) {
      const roleDef = await this.prisma.roleDefinition.findUnique({
        where: { id: dto.roleId },
      });
      if (!roleDef) {
        throw new NotFoundException(`Role definition with ID '${dto.roleId}' not found`);
      }
    }

    const created = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        role: dto.role ?? Role.ADMIN,
        roleId: dto.roleId || null,
        designation: dto.designation?.trim() || null,
        department: dto.department?.trim() || null,
        section: dto.section?.trim() || null,
        location: dto.location?.trim() || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        emailVerifiedAt: new Date(),
      },
      include: {
        roleDefinition: true,
      },
    });

    return this.mapUserResponse(created);
  }

  async updateAdminUser(
    id: string,
    dto: UpdateUserDto,
    currentUserId?: string,
  ): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Safety rule: Self-deactivation prevention
    if (currentUserId && currentUserId === id && dto.isActive === false) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    // Safety rule: Do not deactivate or demote the last active SuperAdmin
    if (
      existing.role === Role.SUPER_ADMIN &&
      ((dto.isActive === false) || (dto.role && dto.role !== Role.SUPER_ADMIN))
    ) {
      const activeSuperAdmins = await this.prisma.user.count({
        where: {
          role: Role.SUPER_ADMIN,
          isActive: true,
        },
      });

      if (activeSuperAdmins <= 1) {
        throw new ForbiddenException(
          'Cannot deactivate or demote the only remaining active Super Admin account',
        );
      }
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.phone !== undefined) updateData.phone = dto.phone?.trim() || null;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.designation !== undefined) updateData.designation = dto.designation?.trim() || null;
    if (dto.department !== undefined) updateData.department = dto.department?.trim() || null;
    if (dto.section !== undefined) updateData.section = dto.section?.trim() || null;
    if (dto.location !== undefined) updateData.location = dto.location?.trim() || null;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.roleId !== undefined) {
      if (dto.roleId === null || dto.roleId === '') {
        updateData.roleDefinition = { disconnect: true };
      } else {
        const roleDef = await this.prisma.roleDefinition.findUnique({
          where: { id: dto.roleId },
        });
        if (!roleDef) {
          throw new NotFoundException(`Role definition with ID '${dto.roleId}' not found`);
        }
        updateData.roleDefinition = { connect: { id: dto.roleId } };
      }
    }

    if (dto.password) {
      updateData.passwordHash = await argon2.hash(dto.password, {
        type: argon2.argon2id,
      });
      // Invalidate existing sessions on password change
      updateData.tokenVersion = { increment: 1 };
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roleDefinition: true,
      },
    });

    return this.mapUserResponse(updated);
  }

  async deleteAdminUser(
    id: string,
    currentUserId?: string,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Safety rule: Cannot delete yourself
    if (currentUserId && currentUserId === id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    // Safety rule: Cannot delete the last active Super Admin
    if (existing.role === Role.SUPER_ADMIN) {
      const activeSuperAdmins = await this.prisma.user.count({
        where: {
          role: Role.SUPER_ADMIN,
          isActive: true,
        },
      });

      if (activeSuperAdmins <= 1) {
        throw new ForbiddenException(
          'Cannot delete the only remaining active Super Admin account',
        );
      }
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      success: true,
      message: `User '${existing.email}' (${existing.name}) successfully removed`,
    };
  }
}
