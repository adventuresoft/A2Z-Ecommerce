import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateTagDto,
  PaginatedTagResponseDto,
  PublicTagDto,
  TagQueryDto,
  TagResponseDto,
  UpdateTagDto,
} from './dto/index.js';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to format a string into a clean lowercase kebab-case slug
   */
  slugify(text: string): string {
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
  async generateUniqueSlug(
    baseText: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = this.slugify(baseText) || 'tag';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.tag.findUnique({
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
   * Map database Tag entity to TagResponseDto including product count
   */
  private mapTagResponse(tag: any): TagResponseDto {
    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      colorCode: tag.colorCode || null,
      isActive: tag.isActive,
      productCount: tag._count?.products ?? 0,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  /**
   * Create a new tag
   */
  async create(dto: CreateTagDto): Promise<TagResponseDto> {
    let slug: string;
    if (dto.slug && dto.slug.trim()) {
      const normalized = this.slugify(dto.slug);
      const exists = await this.prisma.tag.findUnique({
        where: { slug: normalized },
        select: { id: true },
      });
      if (exists) {
        throw new ConflictException(
          `Tag slug '${normalized}' is already in use`,
        );
      }
      slug = normalized;
    } else {
      slug = await this.generateUniqueSlug(dto.name);
    }

    const tag = await this.prisma.tag.create({
      data: {
        name: dto.name.trim(),
        slug,
        colorCode: dto.colorCode?.trim() || null,
        isActive: dto.isActive ?? true,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return this.mapTagResponse(tag);
  }

  /**
   * List tags with pagination, search, status filter, and sorting
   */
  async findAll(query: TagQueryDto): Promise<PaginatedTagResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.TagWhereInput = {};

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { slug: { contains: s, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    let orderBy: Prisma.TagOrderByWithRelationInput = { name: 'asc' };
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    if (query.sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    } else if (query.sortBy === 'productCount') {
      orderBy = { products: { _count: sortOrder } };
    } else {
      orderBy = { name: sortOrder };
    }

    const [items, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      this.prisma.tag.count({ where }),
    ]);

    return {
      items: items.map((tag) => this.mapTagResponse(tag)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Find a single tag by UUID or slug
   */
  async findOne(idOrSlug: string): Promise<TagResponseDto> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const tag = await this.prisma.tag.findFirst({
      where: isUuid ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag '${idOrSlug}' not found`);
    }

    return this.mapTagResponse(tag);
  }

  /**
   * Update a tag
   */
  async update(id: string, dto: UpdateTagDto): Promise<TagResponseDto> {
    const existing = await this.prisma.tag.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Tag with ID '${id}' not found`);
    }

    let slug = existing.slug;
    if (dto.slug && dto.slug.trim()) {
      const normalized = this.slugify(dto.slug);
      if (normalized !== existing.slug) {
        const conflict = await this.prisma.tag.findUnique({
          where: { slug: normalized },
          select: { id: true },
        });
        if (conflict && conflict.id !== id) {
          throw new ConflictException(
            `Tag slug '${normalized}' is already in use`,
          );
        }
        slug = normalized;
      }
    } else if (dto.name && dto.name.trim() !== existing.name && !dto.slug) {
      slug = await this.generateUniqueSlug(dto.name, id);
    }

    const updated = await this.prisma.tag.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        slug,
        ...(dto.colorCode !== undefined && {
          colorCode: dto.colorCode?.trim() || null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return this.mapTagResponse(updated);
  }

  /**
   * Delete a tag (ProductTag associations are cleanly cascaded)
   */
  async delete(id: string): Promise<{ message: string; id: string }> {
    const existing = await this.prisma.tag.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!existing) {
      throw new NotFoundException(`Tag with ID '${id}' not found`);
    }

    await this.prisma.tag.delete({
      where: { id },
    });

    return {
      message: `Tag '${existing.name}' was successfully deleted`,
      id,
    };
  }

  /**
   * Get public active tags for storefront tag clouds and filter options
   */
  async findPublicTags(): Promise<PublicTagDto[]> {
    const tags = await this.prisma.tag.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      colorCode: t.colorCode || null,
      productCount: t._count?.products ?? 0,
    }));
  }

  /**
   * Helper to resolve existing tag IDs and create new tags on-the-fly by name.
   * Can be used within Prisma transactions or standalone.
   */
  async resolveOrCreateTags(
    tagIds: string[] = [],
    tagNames: string[] = [],
    tx?: Prisma.TransactionClient,
  ): Promise<string[]> {
    const client = tx || this.prisma;
    const finalTagIds = new Set<string>();

    // 1. Verify existing tag IDs
    if (tagIds.length > 0) {
      const existing = await client.tag.findMany({
        where: { id: { in: tagIds } },
        select: { id: true },
      });
      for (const t of existing) {
        finalTagIds.add(t.id);
      }
    }

    // 2. Resolve or create new tags by name
    for (const rawName of tagNames) {
      const name = rawName.trim();
      if (!name) continue;

      const slugCandidate = this.slugify(name);
      if (!slugCandidate) continue;

      // Look up if tag already exists by slug or name (case-insensitive)
      let tag = await client.tag.findFirst({
        where: {
          OR: [
            { slug: slugCandidate },
            { name: { equals: name, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });

      if (!tag) {
        // Need to create new tag with unique slug
        const uniqueSlug = await this.generateUniqueSlug(name);
        tag = await client.tag.create({
          data: {
            name,
            slug: uniqueSlug,
            isActive: true,
          },
          select: { id: true },
        });
      }

      finalTagIds.add(tag.id);
    }

    return Array.from(finalTagIds);
  }
}
