import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AttributeQueryDto,
  AttributeResponseDto,
  AttributeValueResponseDto,
  CreateAttributeDto,
  CreateAttributeValueDto,
  PublicAttributeDto,
  UpdateAttributeDto,
  UpdateAttributeValueDto,
} from './dto/index.js';

export interface PaginatedAttributeResponseDto {
  items: AttributeResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AttributesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to format a string into a clean lowercase kebab-case slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Helper to generate a unique slug, appending a numeric counter if colliding
   */
  private async generateUniqueSlug(
    baseText: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = this.slugify(baseText) || 'attribute';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.attribute.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        return candidate;
      }

      candidate = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Seam for product count check before attribute deletion
   * TODO(products): Replace with prisma.productAttribute.count({ where: { attributeId } })
   */
  private async countAttributeProducts(_attributeId: string): Promise<number> {
    return 0;
  }

  /**
   * Seam for variant count check before attribute value deletion
   * TODO(products): Replace with prisma.productVariantAttributeValue.count({ where: { attributeValueId } })
   */
  private async countValueVariants(_valueId: string): Promise<number> {
    return 0;
  }

  /**
   * Helper to format full AttributeResponseDto with counts
   */
  private formatAttributeResponse(
    attr: any,
    productsCount = 0,
    variantsCount = 0,
  ): AttributeResponseDto {
    return {
      id: attr.id,
      name: attr.name,
      slug: attr.slug,
      type: attr.type,
      description: attr.description,
      isActive: attr.isActive,
      sortOrder: attr.sortOrder,
      values: (attr.values || []).map((v: any): AttributeValueResponseDto => ({
        id: v.id,
        attributeId: v.attributeId,
        value: v.value,
        label: v.label,
        colorCode: v.colorCode,
        sortOrder: v.sortOrder,
        isActive: v.isActive,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      counts: {
        products: productsCount,
        variants: variantsCount,
      },
      createdAt: attr.createdAt,
      updatedAt: attr.updatedAt,
    };
  }

  /**
   * Create an attribute, optionally creating initial values atomically
   */
  async create(dto: CreateAttributeDto): Promise<AttributeResponseDto> {
    let slug: string;
    if (dto.slug && dto.slug.trim()) {
      const normalized = this.slugify(dto.slug);
      const exists = await this.prisma.attribute.findUnique({
        where: { slug: normalized },
        select: { id: true },
      });
      if (exists) {
        throw new ConflictException(
          `Attribute slug '${normalized}' is already in use`,
        );
      }
      slug = normalized;
    } else {
      slug = await this.generateUniqueSlug(dto.name);
    }

    // Check for duplicate values within the inline values array
    if (dto.values && dto.values.length > 0) {
      const seen = new Set<string>();
      for (const val of dto.values) {
        const trimmed = val.value.trim().toLowerCase();
        if (seen.has(trimmed)) {
          throw new ConflictException(
            `Duplicate value '${val.value}' in attribute values payload`,
          );
        }
        seen.add(trimmed);
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const attr = await tx.attribute.create({
        data: {
          name: dto.name.trim(),
          slug,
          type: dto.type,
          description: dto.description?.trim() || null,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : 0,
        },
      });

      if (dto.values && dto.values.length > 0) {
        for (const v of dto.values) {
          await tx.attributeValue.create({
            data: {
              attributeId: attr.id,
              value: v.value.trim(),
              label: v.label?.trim() || null,
              colorCode: v.colorCode?.trim() || null,
              sortOrder: v.sortOrder !== undefined ? v.sortOrder : 0,
              isActive: v.isActive !== undefined ? v.isActive : true,
            },
          });
        }
      }

      return tx.attribute.findUniqueOrThrow({
        where: { id: attr.id },
        include: {
          values: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });

    return this.formatAttributeResponse(created, 0, 0);
  }

  /**
   * Paginated listing of attributes for admin dashboard
   */
  async findAllAdmin(query: AttributeQueryDto): Promise<PaginatedAttributeResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.AttributeWhereInput = {};

    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const validSortFields = ['name', 'sortOrder', 'createdAt'] as const;
    const sortBy = validSortFields.includes(query.sortBy as any)
      ? (query.sortBy as (typeof validSortFields)[number])
      : 'sortOrder';
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    const orderBy: Prisma.AttributeOrderByWithRelationInput[] = [
      { [sortBy]: sortOrder },
      ...(sortBy !== 'name' ? [{ name: 'asc' as const }] : []),
    ];

    const [items, total] = await Promise.all([
      this.prisma.attribute.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          values: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      this.prisma.attribute.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map((item) => this.formatAttributeResponse(item, 0, 0)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get an attribute by ID for admin
   */
  async findOneAdmin(id: string): Promise<AttributeResponseDto> {
    const attribute = await this.prisma.attribute.findUnique({
      where: { id },
      include: {
        values: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute with ID '${id}' not found`);
    }

    const [productCount, variantCount] = await Promise.all([
      this.countAttributeProducts(id),
      this.countValueVariants(id),
    ]);

    return this.formatAttributeResponse(attribute, productCount, variantCount);
  }

  /**
   * Update an attribute
   */
  async update(id: string, dto: UpdateAttributeDto): Promise<AttributeResponseDto> {
    const existing = await this.prisma.attribute.findUnique({
      where: { id },
      include: { values: true },
    });

    if (!existing) {
      throw new NotFoundException(`Attribute with ID '${id}' not found`);
    }

    let slug = existing.slug;
    if (dto.slug !== undefined && dto.slug.trim()) {
      const normalized = this.slugify(dto.slug);
      if (normalized !== existing.slug) {
        const collision = await this.prisma.attribute.findUnique({
          where: { slug: normalized },
          select: { id: true },
        });
        if (collision && collision.id !== id) {
          throw new ConflictException(
            `Attribute slug '${normalized}' is already in use`,
          );
        }
        slug = normalized;
      }
    }

    const updated = await this.prisma.attribute.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        slug,
        type: dto.type !== undefined ? dto.type : undefined,
        description:
          dto.description !== undefined
            ? dto.description?.trim() || null
            : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : undefined,
      },
      include: {
        values: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return this.formatAttributeResponse(updated, 0, 0);
  }

  /**
   * Remove an attribute (with conflict check)
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.attribute.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existing) {
      throw new NotFoundException(`Attribute with ID '${id}' not found`);
    }

    const productCount = await this.countAttributeProducts(id);
    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete attribute '${existing.name}': it is referenced by ${productCount} product(s). Deactivate it instead.`,
      );
    }

    await this.prisma.attribute.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Attribute '${existing.name}' was successfully deleted`,
    };
  }

  /**
   * Add a value to an attribute
   */
  async createValue(
    attributeId: string,
    dto: CreateAttributeValueDto,
  ): Promise<AttributeValueResponseDto> {
    const attribute = await this.prisma.attribute.findUnique({
      where: { id: attributeId },
    });

    if (!attribute) {
      throw new NotFoundException(
        `Attribute with ID '${attributeId}' not found`,
      );
    }

    const trimmedValue = dto.value.trim();
    const existingVal = await this.prisma.attributeValue.findUnique({
      where: {
        attributeId_value: {
          attributeId,
          value: trimmedValue,
        },
      },
    });

    if (existingVal) {
      throw new ConflictException(
        `Attribute value '${trimmedValue}' already exists for attribute '${attribute.name}'`,
      );
    }

    const created = await this.prisma.attributeValue.create({
      data: {
        attributeId,
        value: trimmedValue,
        label: dto.label?.trim() || null,
        colorCode: dto.colorCode?.trim() || null,
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : 0,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return {
      id: created.id,
      attributeId: created.attributeId,
      value: created.value,
      label: created.label,
      colorCode: created.colorCode,
      sortOrder: created.sortOrder,
      isActive: created.isActive,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * Update an attribute value
   */
  async updateValue(
    attributeId: string,
    valueId: string,
    dto: UpdateAttributeValueDto,
  ): Promise<AttributeValueResponseDto> {
    const existing = await this.prisma.attributeValue.findUnique({
      where: { id: valueId },
    });

    if (!existing || existing.attributeId !== attributeId) {
      throw new NotFoundException(
        `Attribute value with ID '${valueId}' not found for attribute '${attributeId}'`,
      );
    }

    if (dto.value !== undefined) {
      const trimmed = dto.value.trim();
      if (trimmed.toLowerCase() !== existing.value.toLowerCase()) {
        const duplicate = await this.prisma.attributeValue.findUnique({
          where: {
            attributeId_value: {
              attributeId,
              value: trimmed,
            },
          },
        });
        if (duplicate && duplicate.id !== valueId) {
          throw new ConflictException(
            `Attribute value '${trimmed}' already exists for this attribute`,
          );
        }
      }
    }

    const updated = await this.prisma.attributeValue.update({
      where: { id: valueId },
      data: {
        value: dto.value !== undefined ? dto.value.trim() : undefined,
        label: dto.label !== undefined ? dto.label?.trim() || null : undefined,
        colorCode:
          dto.colorCode !== undefined ? dto.colorCode?.trim() || null : undefined,
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
    });

    return {
      id: updated.id,
      attributeId: updated.attributeId,
      value: updated.value,
      label: updated.label,
      colorCode: updated.colorCode,
      sortOrder: updated.sortOrder,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Remove an attribute value (with conflict check)
   */
  async removeValue(
    attributeId: string,
    valueId: string,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.attributeValue.findUnique({
      where: { id: valueId },
    });

    if (!existing || existing.attributeId !== attributeId) {
      throw new NotFoundException(
        `Attribute value with ID '${valueId}' not found for attribute '${attributeId}'`,
      );
    }

    const variantCount = await this.countValueVariants(valueId);
    if (variantCount > 0) {
      throw new ConflictException(
        `Cannot delete attribute value '${existing.value}': it is referenced by ${variantCount} product variant(s). Deactivate it instead.`,
      );
    }

    await this.prisma.attributeValue.delete({
      where: { id: valueId },
    });

    return {
      success: true,
      message: `Attribute value '${existing.value}' was successfully deleted`,
    };
  }

  /**
   * Public list of active attributes and their active values
   */
  async findAllPublic(): Promise<PublicAttributeDto[]> {
    const attributes = await this.prisma.attribute.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        values: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return attributes.map((attr) => ({
      id: attr.id,
      name: attr.name,
      slug: attr.slug,
      type: attr.type,
      description: attr.description,
      sortOrder: attr.sortOrder,
      values: attr.values.map((v) => ({
        id: v.id,
        value: v.value,
        label: v.label,
        colorCode: v.colorCode,
        sortOrder: v.sortOrder,
      })),
    }));
  }

  /**
   * Public lookup by slug
   */
  async findBySlugPublic(slug: string): Promise<PublicAttributeDto> {
    const normalized = this.slugify(slug);
    const attribute = await this.prisma.attribute.findUnique({
      where: { slug: normalized },
      include: {
        values: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!attribute || !attribute.isActive) {
      throw new NotFoundException(
        `Attribute '${slug}' was not found or is currently inactive`,
      );
    }

    return {
      id: attribute.id,
      name: attribute.name,
      slug: attribute.slug,
      type: attribute.type,
      description: attribute.description,
      sortOrder: attribute.sortOrder,
      values: attribute.values.map((v) => ({
        id: v.id,
        value: v.value,
        label: v.label,
        colorCode: v.colorCode,
        sortOrder: v.sortOrder,
      })),
    };
  }
}
