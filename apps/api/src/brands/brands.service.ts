import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  BrandQueryDto,
  BrandResponseDto,
  CreateBrandDto,
  PaginatedBrandResponseDto,
  PublicBrandDto,
  UpdateBrandDto,
} from './dto/index.js';

@Injectable()
export class BrandsService {
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
    const baseSlug = this.slugify(baseText) || 'brand';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.brand.findUnique({
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
   * Seam for product count check before brand deletion
   * TODO(products): Replace with prisma.product.count({ where: { brandId } })
   */
  private async countBrandProducts(_brandId: string): Promise<number> {
    return 0;
  }

  /**
   * Helper to handle Prisma errors, notably P2002 unique constraint violations
   */
  private handlePrismaError(error: any, slug?: string): never {
    if (error && typeof error === 'object' && error.code === 'P2002') {
      throw new ConflictException(
        slug
          ? `Brand slug '${slug}' is already in use`
          : 'A brand with this unique property already exists',
      );
    }
    throw error;
  }

  /**
   * Create a new brand with unique slug resolution and conflict safeguards
   */
  async create(dto: CreateBrandDto): Promise<BrandResponseDto> {
    let slug: string;
    if (dto.slug && dto.slug.trim()) {
      const normalized = this.slugify(dto.slug);
      const exists = await this.prisma.brand.findUnique({
        where: { slug: normalized },
        select: { id: true },
      });
      if (exists) {
        throw new ConflictException(
          `Brand slug '${normalized}' is already in use`,
        );
      }
      slug = normalized;
    } else {
      slug = await this.generateUniqueSlug(dto.name);
    }

    try {
      const brand = await this.prisma.brand.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim() || null,
          logoUrl: dto.logoUrl?.trim() || null,
          website: dto.website?.trim() || null,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : 0,
        },
      });

      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        logoUrl: brand.logoUrl,
        website: brand.website,
        isActive: brand.isActive,
        sortOrder: brand.sortOrder,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
        counts: {
          products: 0,
        },
      };
    } catch (error) {
      this.handlePrismaError(error, slug);
    }
  }

  /**
   * Paginated administrative query supporting search, isActive filter, and sorting
   */
  async findAllAdmin(
    query: BrandQueryDto,
  ): Promise<PaginatedBrandResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.BrandWhereInput = {};

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { slug: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const sortField = query.sortBy || 'sortOrder';
    const sortDir = query.sortOrder || 'asc';
    const orderBy: Prisma.BrandOrderByWithRelationInput[] =
      sortField === 'name'
        ? [{ name: sortDir }]
        : [{ [sortField]: sortDir }, { name: 'asc' }];

    const [items, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      items: items.map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        logoUrl: brand.logoUrl,
        website: brand.website,
        isActive: brand.isActive,
        sortOrder: brand.sortOrder,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
        counts: {
          products: 0,
        },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Find single brand by ID for administrative editing
   */
  async findOneAdmin(id: string): Promise<BrandResponseDto> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID '${id}' not found`);
    }

    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: brand.logoUrl,
      website: brand.website,
      isActive: brand.isActive,
      sortOrder: brand.sortOrder,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
      counts: {
        products: 0,
      },
    };
  }

  /**
   * Update brand with slug stability on rename and unique slug validation
   */
  async update(id: string, dto: UpdateBrandDto): Promise<BrandResponseDto> {
    const existing = await this.prisma.brand.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });

    if (!existing) {
      throw new NotFoundException(`Brand with ID '${id}' not found`);
    }

    let targetSlug = existing.slug;
    if (dto.slug && dto.slug.trim() && dto.slug !== existing.slug) {
      const normalized = this.slugify(dto.slug);
      const conflict = await this.prisma.brand.findUnique({
        where: { slug: normalized },
        select: { id: true },
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException(
          `Brand slug '${normalized}' is already in use`,
        );
      }
      targetSlug = normalized;
    }

    try {
      const updated = await this.prisma.brand.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name.trim() } : {}),
          slug: targetSlug,
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.logoUrl !== undefined
            ? { logoUrl: dto.logoUrl?.trim() || null }
            : {}),
          ...(dto.website !== undefined
            ? { website: dto.website?.trim() || null }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        },
      });

      return {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        logoUrl: updated.logoUrl,
        website: updated.website,
        isActive: updated.isActive,
        sortOrder: updated.sortOrder,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        counts: {
          products: 0,
        },
      };
    } catch (error) {
      this.handlePrismaError(error, targetSlug);
    }
  }

  /**
   * Delete brand with product reference safeguards
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID '${id}' not found`);
    }

    const productCount = await this.countBrandProducts(id);
    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete brand '${brand.name}' because it is associated with ${productCount} product(s). Please deactivate the brand or reassign the products first.`,
      );
    }

    await this.prisma.brand.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Brand '${brand.name}' deleted successfully.`,
    };
  }

  /**
   * Public endpoint: List active brands ordered by sortOrder then name
   */
  async findAllPublic(): Promise<PublicBrandDto[]> {
    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        website: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return brands;
  }

  /**
   * Public endpoint: Find single active brand by slug (404 if missing or inactive)
   */
  async findBySlug(slug: string): Promise<PublicBrandDto> {
    const brand = await this.prisma.brand.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        website: true,
        sortOrder: true,
        isActive: true,
      },
    });

    if (!brand || !brand.isActive) {
      throw new NotFoundException(
        `Brand with slug '${slug}' not found or is inactive`,
      );
    }

    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: brand.logoUrl,
      website: brand.website,
      sortOrder: brand.sortOrder,
    };
  }
}
