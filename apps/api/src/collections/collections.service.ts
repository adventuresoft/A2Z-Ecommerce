import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CollectionQueryDto,
  CreateCollectionDto,
  UpdateCollectionDto,
} from './dto/index.js';

@Injectable()
export class CollectionsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultCollections();
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueSlug(baseText: string, excludeId?: string): Promise<string> {
    const baseSlug = this.slugify(baseText) || 'collection';
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.collection.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing || existing.id === excludeId) {
        return slug;
      }

      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
  }

  /**
   * Seed default collections (flash-sale, new-arrivals, archive) if they don't already exist
   */
  async seedDefaultCollections() {
    const defaults = [
      {
        name: 'Flash Sale Deals',
        slug: 'flash-sale',
        description: 'Limited-time mega savings on flagship gadgets, laptops, and authentic tech in Bangladesh.',
        badgeText: 'Live Flash Deals',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        seoTitle: 'Exclusive Flash Sale & Instant Discounts | A to Z Ecommerce',
        seoDescription: 'Score instant limited-time discounts on top electronics and smartphones with nationwide fast delivery.',
        sortOrder: 1,
      },
      {
        name: 'New Arrivals',
        slug: 'new-arrivals',
        description: 'Freshly launched premium electronics, gaming hardware, and smart appliances just added to our catalog.',
        badgeText: 'Just Landed',
        isActive: true,
        seoTitle: 'New Arrivals & Fresh Electronics | A to Z Ecommerce Bangladesh',
        seoDescription: 'Explore freshly dropped laptops, smartphones, and gear with official warranty in Bangladesh.',
        sortOrder: 2,
      },
      {
        name: 'Clearance & Archive',
        slug: 'archive',
        description: 'Past season inventory, clearance stock, and last-chance deals at unprecedented prices.',
        badgeText: 'Final Clearance',
        isActive: true,
        seoTitle: 'Archive & Clearance Tech Deals | A to Z Ecommerce',
        seoDescription: 'Save big on archived inventory and clearance items before they are gone forever.',
        sortOrder: 3,
      },
    ];

    for (const item of defaults) {
      const exists = await this.prisma.collection.findUnique({
        where: { slug: item.slug },
      });
      if (!exists) {
        await this.prisma.collection.create({
          data: item,
        });
      }
    }
  }

  /**
   * Public: Get collection details and its products by unique slug
   */
  async findBySlug(slug: string, page = 1, limit = 24) {
    const collection = await this.prisma.collection.findUnique({
      where: { slug },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        products: {
          include: {
            product: {
              include: {
                category: { select: { id: true, name: true, slug: true } },
                brand: { select: { id: true, name: true, slug: true } },
                images: { where: { isPrimary: true }, take: 1 },
                variants: {
                  take: 1,
                  select: { id: true, regularPrice: true, salePrice: true, sku: true },
                },
              },
            },
          },
          orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with slug '${slug}' not found`);
    }

    // Build conditions for matching products
    const categoryIds = collection.categories.map((c) => c.categoryId);
    const tagIds = collection.tags.map((t) => t.tagId);
    const pinnedProductIds = collection.products.map((p) => p.productId);

    // If child categories exist for the selected categories, include them too
    let allCategoryIds = [...categoryIds];
    if (categoryIds.length > 0) {
      const childCategories = await this.prisma.category.findMany({
        where: { parentId: { in: categoryIds } },
        select: { id: true },
      });
      allCategoryIds = [...new Set([...categoryIds, ...childCategories.map((c) => c.id)])];
    }

    const orConditions: Prisma.ProductWhereInput[] = [];
    if (pinnedProductIds.length > 0) {
      orConditions.push({ id: { in: pinnedProductIds } });
    }
    if (allCategoryIds.length > 0) {
      orConditions.push({ categoryId: { in: allCategoryIds } });
    }
    if (tagIds.length > 0) {
      orConditions.push({ tags: { some: { tagId: { in: tagIds } } } });
    }

    // If no rules or products were selected, fall back to featured/active products so the page isn't totally blank
    const whereClause: Prisma.ProductWhereInput = {
      isActive: true,
      ...(orConditions.length > 0 ? { OR: orConditions } : {}),
    };

    const skip = (page - 1) * limit;
    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
          variants: {
            select: { id: true, regularPrice: true, salePrice: true, sku: true },
            take: 5,
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where: whereClause }),
    ]);

    return {
      collection: {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        bannerUrl: collection.bannerUrl,
        badgeText: collection.badgeText,
        isActive: collection.isActive,
        startDate: collection.startDate,
        endDate: collection.endDate,
        seoTitle: collection.seoTitle,
        seoDescription: collection.seoDescription,
        categories: collection.categories.map((c) => c.category),
        tags: collection.tags.map((t) => t.tag),
      },
      products,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Admin: List all collections with pagination and filter
   */
  async findAdminAll(query: CollectionQueryDto) {
    const { search, isActive, page = 1, limit = 20 } = query;
    const where: Prisma.CollectionWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        include: {
          _count: {
            select: {
              categories: true,
              tags: true,
              products: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.collection.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Get single collection by ID with related IDs
   */
  async findAdminById(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        tags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
        products: {
          include: {
            product: { select: { id: true, title: true, slug: true, thumbnailUrl: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID '${id}' not found`);
    }

    return {
      ...collection,
      categoryIds: collection.categories.map((c) => c.categoryId),
      tagIds: collection.tags.map((t) => t.tagId),
      productIds: collection.products.map((p) => p.productId),
    };
  }

  /**
   * Admin: Create a new collection
   */
  async create(dto: CreateCollectionDto) {
    const slug = dto.slug
      ? await this.generateUniqueSlug(dto.slug)
      : await this.generateUniqueSlug(dto.name);

    const { categoryIds, tagIds, productIds, ...rest } = dto;

    return this.prisma.collection.create({
      data: {
        ...rest,
        slug,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        categories: categoryIds && categoryIds.length > 0
          ? {
              create: categoryIds.map((categoryId) => ({ categoryId })),
            }
          : undefined,
        tags: tagIds && tagIds.length > 0
          ? {
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
        products: productIds && productIds.length > 0
          ? {
              create: productIds.map((productId, index) => ({
                productId,
                sortOrder: index,
                isPinned: true,
              })),
            }
          : undefined,
      },
      include: {
        categories: true,
        tags: true,
        products: true,
      },
    });
  }

  /**
   * Admin: Update an existing collection
   */
  async update(id: string, dto: UpdateCollectionDto) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID '${id}' not found`);
    }

    let slug = collection.slug;
    if (dto.slug && dto.slug !== collection.slug) {
      slug = await this.generateUniqueSlug(dto.slug, id);
    }

    const { categoryIds, tagIds, productIds, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      // Sync categories if passed
      if (categoryIds !== undefined) {
        await tx.collectionCategory.deleteMany({ where: { collectionId: id } });
        if (categoryIds.length > 0) {
          await tx.collectionCategory.createMany({
            data: categoryIds.map((categoryId) => ({ collectionId: id, categoryId })),
          });
        }
      }

      // Sync tags if passed
      if (tagIds !== undefined) {
        await tx.collectionTag.deleteMany({ where: { collectionId: id } });
        if (tagIds.length > 0) {
          await tx.collectionTag.createMany({
            data: tagIds.map((tagId) => ({ collectionId: id, tagId })),
          });
        }
      }

      // Sync products if passed
      if (productIds !== undefined) {
        await tx.collectionProduct.deleteMany({ where: { collectionId: id } });
        if (productIds.length > 0) {
          await tx.collectionProduct.createMany({
            data: productIds.map((productId, index) => ({
              collectionId: id,
              productId,
              sortOrder: index,
              isPinned: true,
            })),
          });
        }
      }

      return tx.collection.update({
        where: { id },
        data: {
          ...rest,
          slug,
          startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : undefined,
          endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : undefined,
        },
        include: {
          categories: true,
          tags: true,
          products: true,
        },
      });
    });
  }

  /**
   * Admin: Delete collection
   */
  async delete(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID '${id}' not found`);
    }

    return this.prisma.collection.delete({
      where: { id },
    });
  }
}

