import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import fs from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateProductDto,
  CreateProductVariantDto,
  PaginatedProductResponseDto,
  PaginatedVariantResponseDto,
  ProductImageResponseDto,
  ProductQueryDto,
  ProductResponseDto,
  ProductVariantResponseDto,
  ReorderProductImagesDto,
  UpdateProductDto,
  UpdateProductImageDto,
  UpdateProductVariantDto,
  VariantQueryDto,
} from './dto/index.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Format text into a clean lowercase kebab-case slug
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
   * Generate a unique slug by appending incremental numeric counters
   */
  private async generateUniqueSlug(
    baseText: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = this.slugify(baseText) || 'product';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.product.findUnique({
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
   * Safely delete a file from disk
   */
  private unlinkFile(imageUrl: string): void {
    try {
      if (imageUrl && imageUrl.startsWith('/uploads/products/')) {
        const filename = imageUrl.replace('/uploads/products/', '');
        const fullPath = join(process.cwd(), 'uploads', 'products', filename);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch {
      // Ignore filesystem unlink errors to prevent blocking DB operations
    }
  }

  /**
   * Map raw product entity to ProductResponseDto
   */
  private mapProductResponse(product: any): ProductResponseDto {
    const images: ProductImageResponseDto[] = (product.images || []).map(
      (img: any) => ({
        id: img.id,
        productId: img.productId,
        imageUrl: img.imageUrl,
        altText: img.altText,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
        createdAt: img.createdAt,
      }),
    );

    const primaryImage =
      images.find((img) => img.isPrimary) ||
      (product.thumbnailUrl
        ? {
            id: 'thumbnail',
            productId: product.id,
            imageUrl: product.thumbnailUrl,
            altText: product.title,
            isPrimary: true,
            sortOrder: -1,
            createdAt: product.createdAt,
          }
        : images.length > 0
          ? images[0]
          : null);

    const variants: ProductVariantResponseDto[] = (product.variants || []).map(
      (v: any) => {
        const attributes = (v.attributes || []).map((attrRel: any) => ({
          attributeValueId: attrRel.attributeValueId,
          value: attrRel.attributeValue?.value || '',
          label: attrRel.attributeValue?.label || null,
          colorCode: attrRel.attributeValue?.colorCode || null,
          attributeName: attrRel.attributeValue?.attribute?.name || '',
          attributeSlug: attrRel.attributeValue?.attribute?.slug || '',
        }));

        const regPrice = Number(v.regularPrice);
        const slPrice = v.salePrice !== null && v.salePrice !== undefined ? Number(v.salePrice) : null;

        return {
          id: v.id,
          productId: v.productId,
          sku: v.sku,
          barcode: v.barcode,
          regularPrice: regPrice,
          salePrice: slPrice,
          weightGrams: v.weightGrams,
          imageId: v.imageId,
          imageUrl: v.imageUrl || v.image?.imageUrl || null,
          image: v.image
            ? {
                id: v.image.id,
                productId: v.image.productId,
                imageUrl: v.image.imageUrl,
                altText: v.image.altText,
                isPrimary: v.image.isPrimary,
                sortOrder: v.image.sortOrder,
                createdAt: v.image.createdAt,
              }
            : null,
          isActive: v.isActive,
          attributes,
          productTitle: product.title,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        };
      },
    );

    const prices: number[] = variants
      .map((v) => (v.salePrice !== null ? v.salePrice : v.regularPrice))
      .filter((p): p is number => typeof p === 'number' && !isNaN(p));

    const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : undefined;

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      thumbnailUrl: product.thumbnailUrl || null,
      categoryId: product.categoryId,
      category: {
        id: product.category?.id || product.categoryId,
        name: product.category?.name || '',
        slug: product.category?.slug || '',
      },
      brandId: product.brandId,
      brand: product.brand
        ? {
            id: product.brand.id,
            name: product.brand.name,
            slug: product.brand.slug,
          }
        : null,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      images,
      variants,
      primaryImage,
      minPrice,
      maxPrice,
      variantCount: variants.length,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Create a new product with initial variants and attribute bindings
   */
  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    // 1. Validate Category
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException(
        `Category with ID '${dto.categoryId}' does not exist`,
      );
    }

    // 2. Validate Brand if supplied
    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: dto.brandId },
        select: { id: true },
      });
      if (!brand) {
        throw new BadRequestException(
          `Brand with ID '${dto.brandId}' does not exist`,
        );
      }
    }

    // 3. Resolve slug
    let slug: string;
    if (dto.slug && dto.slug.trim()) {
      const normalized = this.slugify(dto.slug);
      const existing = await this.prisma.product.findUnique({
        where: { slug: normalized },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(
          `Product slug '${normalized}' is already in use`,
        );
      }
      slug = normalized;
    } else {
      slug = await this.generateUniqueSlug(dto.title);
    }

    // 4. Resolve variants
    let variantInputs: CreateProductVariantDto[] = [];
    if (dto.variants && dto.variants.length > 0) {
      variantInputs = dto.variants;
    } else {
      // Fallback simple product variant
      const regularPrice = dto.regularPrice ?? 0.01;
      const sku =
        dto.sku && dto.sku.trim()
          ? dto.sku.trim()
          : `${slug.toUpperCase().replace(/[^A-Z0-9]/g, '')}-001`;

      variantInputs = [
        {
          sku,
          regularPrice,
          salePrice: dto.salePrice,
          weightGrams: dto.weightGrams,
          isActive: true,
        },
      ];
    }

    // 5. Validate variants (SKU uniqueness, salePrice <= regularPrice)
    const skus = new Set<string>();
    for (const v of variantInputs) {
      const normalizedSku = v.sku.trim();
      if (skus.has(normalizedSku)) {
        throw new ConflictException(
          `Duplicate SKU '${normalizedSku}' in request payload`,
        );
      }
      skus.add(normalizedSku);

      if (v.salePrice !== undefined && v.salePrice !== null) {
        if (v.salePrice > v.regularPrice) {
          throw new BadRequestException(
            `Sale price (${v.salePrice}) cannot be greater than regular price (${v.regularPrice}) for SKU '${normalizedSku}'`,
          );
        }
      }

      // Check DB uniqueness
      const existingSku = await this.prisma.productVariant.findUnique({
        where: { sku: normalizedSku },
        select: { id: true },
      });
      if (existingSku) {
        throw new ConflictException(
          `SKU '${normalizedSku}' already exists in catalog`,
        );
      }
    }

    // 6. Validate AttributeValue IDs if any
    for (const v of variantInputs) {
      if (v.attributeValueIds && v.attributeValueIds.length > 0) {
        const found = await this.prisma.attributeValue.findMany({
          where: { id: { in: v.attributeValueIds } },
          select: { id: true },
        });
        if (found.length !== v.attributeValueIds.length) {
          throw new BadRequestException(
            `One or more attribute value IDs do not exist`,
          );
        }
      }
    }

    // 7. Persist in transaction
    const createdProduct = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          title: dto.title.trim(),
          slug,
          description: dto.description,
          shortDescription: dto.shortDescription?.trim() || null,
          thumbnailUrl: dto.thumbnailUrl?.trim() || null,
          categoryId: dto.categoryId,
          brandId: dto.brandId || null,
          isFeatured: dto.isFeatured ?? false,
          isActive: dto.isActive ?? true,
        },
      });

      for (const v of variantInputs) {
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: v.sku.trim(),
            barcode: v.barcode?.trim() || null,
            regularPrice: v.regularPrice,
            salePrice: v.salePrice ?? null,
            weightGrams: v.weightGrams ?? null,
            imageId: v.imageId || null,
            imageUrl: v.imageUrl?.trim() || null,
            isActive: v.isActive ?? true,
          },
        });

        if (v.attributeValueIds && v.attributeValueIds.length > 0) {
          await tx.productVariantAttributeValue.createMany({
            data: v.attributeValueIds.map((attrValId) => ({
              variantId: variant.id,
              attributeValueId: attrValId,
            })),
          });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: {
          category: true,
          brand: true,
          images: { orderBy: { sortOrder: 'asc' } },
          variants: {
            include: {
              image: true,
              attributes: {
                include: {
                  attributeValue: {
                    include: { attribute: true },
                  },
                },
              },
            },
          },
        },
      });
    });

    return this.mapProductResponse(createdProduct);
  }

  /**
   * Find paginated products with filter and search
   */
  async findAll(query: ProductQueryDto): Promise<PaginatedProductResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { slug: { contains: term, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.brandId) {
      where.brandId = query.brandId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'createdAt';
    const sortDir = query.sortOrder || 'desc';
    orderBy[sortField] = sortDir;

    const [total, items] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          brand: true,
          images: { orderBy: { sortOrder: 'asc' } },
          variants: {
            include: {
              image: true,
              attributes: {
                include: {
                  attributeValue: {
                    include: { attribute: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: items.map((p) => this.mapProductResponse(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Find a single product by ID or slug
   */
  async findOne(idOrSlug: string): Promise<ProductResponseDto> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      idOrSlug,
    );

    const product = await this.prisma.product.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: {
          include: {
            image: true,
            attributes: {
              include: {
                attributeValue: {
                  include: { attribute: true },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product '${idOrSlug}' not found`);
    }

    return this.mapProductResponse(product);
  }

  /**
   * Update master product attributes and details
   */
  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: true },
    });
    if (!existing) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    // Validate category if provided
    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const cat = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { id: true },
      });
      if (!cat) {
        throw new BadRequestException(
          `Category with ID '${dto.categoryId}' does not exist`,
        );
      }
    }

    // Validate brand if provided
    if (dto.brandId && dto.brandId !== existing.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: dto.brandId },
        select: { id: true },
      });
      if (!brand) {
        throw new BadRequestException(
          `Brand with ID '${dto.brandId}' does not exist`,
        );
      }
    }

    // Handle slug update
    let slug = existing.slug;
    if (dto.slug && dto.slug.trim()) {
      const normalized = this.slugify(dto.slug);
      if (normalized !== existing.slug) {
        const conflict = await this.prisma.product.findUnique({
          where: { slug: normalized },
          select: { id: true },
        });
        if (conflict && conflict.id !== id) {
          throw new ConflictException(
            `Product slug '${normalized}' is already in use`,
          );
        }
        slug = normalized;
      }
    }

    // Validate variants if provided
    if (dto.variants !== undefined && Array.isArray(dto.variants) && dto.variants.length > 0) {
      const skus = new Set<string>();
      for (const v of dto.variants) {
        const normalizedSku = v.sku.trim();
        if (skus.has(normalizedSku)) {
          throw new ConflictException(
            `Duplicate SKU '${normalizedSku}' in request payload`,
          );
        }
        skus.add(normalizedSku);

        if (v.salePrice !== undefined && v.salePrice !== null) {
          if (v.salePrice > v.regularPrice) {
            throw new BadRequestException(
              `Sale price (${v.salePrice}) cannot be greater than regular price (${v.regularPrice}) for SKU '${normalizedSku}'`,
            );
          }
        }

        const existingSku = await this.prisma.productVariant.findUnique({
          where: { sku: normalizedSku },
          select: { id: true, productId: true },
        });
        if (existingSku && existingSku.productId !== id) {
          throw new ConflictException(
            `SKU '${normalizedSku}' already exists in catalog under another product`,
          );
        }

        if (v.imageId) {
          const foundImg = await this.prisma.productImage.findFirst({
            where: { id: v.imageId, productId: id },
            select: { id: true },
          });
          if (!foundImg) {
            throw new BadRequestException(
              `Image with ID '${v.imageId}' does not belong to this product`,
            );
          }
        }

        if (v.attributeValueIds && v.attributeValueIds.length > 0) {
          const found = await this.prisma.attributeValue.findMany({
            where: { id: { in: v.attributeValueIds } },
            select: { id: true },
          });
          if (found.length !== v.attributeValueIds.length) {
            throw new BadRequestException(
              `One or more attribute value IDs do not exist`,
            );
          }
        }
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          title: dto.title !== undefined ? dto.title.trim() : undefined,
          slug,
          description: dto.description !== undefined ? dto.description : undefined,
          shortDescription:
            dto.shortDescription !== undefined
              ? dto.shortDescription?.trim() || null
              : undefined,
          thumbnailUrl:
            dto.thumbnailUrl !== undefined
              ? dto.thumbnailUrl?.trim() || null
              : undefined,
          categoryId: dto.categoryId !== undefined ? dto.categoryId : undefined,
          brandId: dto.brandId !== undefined ? dto.brandId || null : undefined,
          isFeatured: dto.isFeatured !== undefined ? dto.isFeatured : undefined,
          isActive: dto.isActive !== undefined ? dto.isActive : undefined,
        },
      });

      if (dto.variants !== undefined && Array.isArray(dto.variants) && dto.variants.length > 0) {
        // Remove existing variants for this product
        await tx.productVariant.deleteMany({
          where: { productId: id },
        });

        // Insert new / updated variants
        for (const v of dto.variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: id,
              sku: v.sku.trim(),
              barcode: v.barcode?.trim() || null,
              regularPrice: v.regularPrice,
              salePrice: v.salePrice ?? null,
              weightGrams: v.weightGrams ?? null,
              imageId: v.imageId || null,
              imageUrl: v.imageUrl?.trim() || null,
              isActive: v.isActive ?? true,
            },
          });

          if (v.attributeValueIds && v.attributeValueIds.length > 0) {
            await tx.productVariantAttributeValue.createMany({
              data: v.attributeValueIds.map((attrValId) => ({
                variantId: variant.id,
                attributeValueId: attrValId,
              })),
            });
          }
        }
      }
    });

    return this.findOne(id);
  }

  /**
   * Delete product, variants, images, and unlinks files from disk
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    // Delete files from disk
    for (const img of product.images) {
      this.unlinkFile(img.imageUrl);
    }

    // Delete in DB (cascades to images, variants, variant attributes)
    await this.prisma.product.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Product '${product.title}' and associated assets deleted successfully`,
    };
  }

  /**
   * Upload multiple gallery images for a product
   */
  async uploadImages(
    productId: string,
    files: Express.Multer.File[],
  ): Promise<ProductImageResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image file is required');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID '${productId}' not found`);
    }

    const hasPrimary = product.images.some((img) => img.isPrimary);
    const maxSort =
      product.images.length > 0
        ? Math.max(...product.images.map((img) => img.sortOrder))
        : -1;

    const createdImages = await this.prisma.$transaction(async (tx) => {
      const records = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isPrimary = !hasPrimary && i === 0;
        const img = await tx.productImage.create({
          data: {
            productId,
            imageUrl: `/uploads/products/${file.filename}`,
            isPrimary,
            sortOrder: maxSort + i + 1,
          },
        });
        records.push(img);
      }
      return records;
    });

    return createdImages.map((img) => ({
      id: img.id,
      productId: img.productId,
      imageUrl: img.imageUrl,
      altText: img.altText,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
      createdAt: img.createdAt,
    }));
  }

  /**
   * Update gallery image details (primary cover, alt text, sortOrder)
   */
  async updateImage(
    productId: string,
    imageId: string,
    dto: UpdateProductImageDto,
  ): Promise<ProductImageResponseDto> {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException(`Image with ID '${imageId}' not found for product`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        // Demote previous primary images
        await tx.productImage.updateMany({
          where: { productId, id: { not: imageId } },
          data: { isPrimary: false },
        });
      }

      return tx.productImage.update({
        where: { id: imageId },
        data: {
          altText: dto.altText !== undefined ? dto.altText : undefined,
          isPrimary: dto.isPrimary !== undefined ? dto.isPrimary : undefined,
          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : undefined,
        },
      });
    });

    return {
      id: updated.id,
      productId: updated.productId,
      imageUrl: updated.imageUrl,
      altText: updated.altText,
      isPrimary: updated.isPrimary,
      sortOrder: updated.sortOrder,
      createdAt: updated.createdAt,
    };
  }

  /**
   * Delete a single gallery image and unlink from disk
   */
  async deleteImage(
    productId: string,
    imageId: string,
  ): Promise<{ success: boolean; message: string }> {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException(`Image with ID '${imageId}' not found`);
    }

    this.unlinkFile(image.imageUrl);

    await this.prisma.productImage.delete({
      where: { id: imageId },
    });

    // If deleted image was primary, make the next image primary if available
    if (image.isPrimary) {
      const next = await this.prisma.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await this.prisma.productImage.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }

    return { success: true, message: 'Image deleted successfully' };
  }

  /**
   * Reorder gallery images
   */
  async reorderImages(
    productId: string,
    dto: ReorderProductImagesDto,
  ): Promise<ProductImageResponseDto[]> {
    const images = await this.prisma.productImage.findMany({
      where: { productId, id: { in: dto.imageIds } },
    });

    if (images.length !== dto.imageIds.length) {
      throw new BadRequestException('One or more image IDs are invalid');
    }

    await this.prisma.$transaction(
      dto.imageIds.map((id, index) =>
        this.prisma.productImage.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    const reordered = await this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });

    return reordered.map((img) => ({
      id: img.id,
      productId: img.productId,
      imageUrl: img.imageUrl,
      altText: img.altText,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
      createdAt: img.createdAt,
    }));
  }

  /**
   * Query variants across products (global SKU index)
   */
  async findAllVariants(query: VariantQueryDto): Promise<PaginatedVariantResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductVariantWhereInput = {};

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { sku: { contains: term, mode: 'insensitive' } },
        { barcode: { contains: term, mode: 'insensitive' } },
        { product: { title: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.productVariant.count({ where }),
      this.prisma.productVariant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { title: true } },
          image: true,
          attributes: {
            include: {
              attributeValue: {
                include: { attribute: true },
              },
            },
          },
        },
      }),
    ]);

    const data: ProductVariantResponseDto[] = items.map((v) => ({
      id: v.id,
      productId: v.productId,
      sku: v.sku,
      barcode: v.barcode,
      regularPrice: Number(v.regularPrice),
      salePrice: v.salePrice !== null ? Number(v.salePrice) : null,
      weightGrams: v.weightGrams,
      imageId: v.imageId,
      imageUrl: v.imageUrl || v.image?.imageUrl || null,
      image: v.image
        ? {
            id: v.image.id,
            productId: v.image.productId,
            imageUrl: v.image.imageUrl,
            altText: v.image.altText,
            isPrimary: v.image.isPrimary,
            sortOrder: v.image.sortOrder,
            createdAt: v.image.createdAt,
          }
        : null,
      isActive: v.isActive,
      attributes: v.attributes.map((attrRel) => ({
        attributeValueId: attrRel.attributeValueId,
        value: attrRel.attributeValue?.value || '',
        label: attrRel.attributeValue?.label || null,
        colorCode: attrRel.attributeValue?.colorCode || null,
        attributeName: attrRel.attributeValue?.attribute?.name || '',
        attributeSlug: attrRel.attributeValue?.attribute?.slug || '',
      })),
      productTitle: v.product?.title || '',
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Update a specific product variant (price, barcode, imageId, isActive)
   */
  async updateVariant(
    id: string,
    dto: UpdateProductVariantDto,
  ): Promise<ProductVariantResponseDto> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!variant) {
      throw new NotFoundException(`Variant with ID '${id}' not found`);
    }

    // Check SKU conflict
    if (dto.sku && dto.sku.trim() !== variant.sku) {
      const conflict = await this.prisma.productVariant.findUnique({
        where: { sku: dto.sku.trim() },
        select: { id: true },
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException(
          `SKU '${dto.sku.trim()}' is already in use by another variant`,
        );
      }
    }

    // Validate prices
    const regPrice = dto.regularPrice ?? Number(variant.regularPrice);
    const salePrice =
      dto.salePrice !== undefined
        ? dto.salePrice
        : variant.salePrice !== null
          ? Number(variant.salePrice)
          : null;

    if (salePrice !== null && salePrice > regPrice) {
      throw new BadRequestException(
        `Sale price (${salePrice}) cannot exceed regular price (${regPrice})`,
      );
    }

    // Validate Option B imageId belonging to same parent product
    if (dto.imageId) {
      const image = await this.prisma.productImage.findFirst({
        where: { id: dto.imageId, productId: variant.productId },
        select: { id: true },
      });
      if (!image) {
        throw new BadRequestException(
          `Image with ID '${dto.imageId}' does not belong to parent product`,
        );
      }
    }

    // Update variant and attributes in transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.productVariant.update({
        where: { id },
        data: {
          sku: dto.sku !== undefined ? dto.sku.trim() : undefined,
          barcode: dto.barcode !== undefined ? dto.barcode?.trim() || null : undefined,
          regularPrice: dto.regularPrice !== undefined ? dto.regularPrice : undefined,
          salePrice: dto.salePrice !== undefined ? dto.salePrice : undefined,
          weightGrams: dto.weightGrams !== undefined ? dto.weightGrams : undefined,
          imageId: dto.imageId !== undefined ? dto.imageId : undefined,
          imageUrl:
            dto.imageUrl !== undefined
              ? dto.imageUrl?.trim() || null
              : undefined,
          isActive: dto.isActive !== undefined ? dto.isActive : undefined,
        },
      });

      if (dto.attributeValueIds) {
        await tx.productVariantAttributeValue.deleteMany({
          where: { variantId: id },
        });

        if (dto.attributeValueIds.length > 0) {
          await tx.productVariantAttributeValue.createMany({
            data: dto.attributeValueIds.map((attrValId) => ({
              variantId: id,
              attributeValueId: attrValId,
            })),
          });
        }
      }
    });

    const updated = await this.prisma.productVariant.findUniqueOrThrow({
      where: { id },
      include: {
        product: { select: { title: true } },
        image: true,
        attributes: {
          include: {
            attributeValue: {
              include: { attribute: true },
            },
          },
        },
      },
    });

    return {
      id: updated.id,
      productId: updated.productId,
      sku: updated.sku,
      barcode: updated.barcode,
      regularPrice: Number(updated.regularPrice),
      salePrice: updated.salePrice !== null ? Number(updated.salePrice) : null,
      weightGrams: updated.weightGrams,
      imageId: updated.imageId,
      imageUrl: updated.imageUrl || updated.image?.imageUrl || null,
      image: updated.image
        ? {
            id: updated.image.id,
            productId: updated.image.productId,
            imageUrl: updated.image.imageUrl,
            altText: updated.image.altText,
            isPrimary: updated.image.isPrimary,
            sortOrder: updated.image.sortOrder,
            createdAt: updated.image.createdAt,
          }
        : null,
      isActive: updated.isActive,
      attributes: updated.attributes.map((attrRel) => ({
        attributeValueId: attrRel.attributeValueId,
        value: attrRel.attributeValue?.value || '',
        label: attrRel.attributeValue?.label || null,
        colorCode: attrRel.attributeValue?.colorCode || null,
        attributeName: attrRel.attributeValue?.attribute?.name || '',
        attributeSlug: attrRel.attributeValue?.attribute?.slug || '',
      })),
      productTitle: updated.product?.title || '',
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete an individual variant
   */
  async deleteVariant(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id },
      select: { id: true, sku: true, productId: true },
    });
    if (!variant) {
      throw new NotFoundException(`Variant with ID '${id}' not found`);
    }

    const count = await this.prisma.productVariant.count({
      where: { productId: variant.productId },
    });
    if (count <= 1) {
      throw new BadRequestException(
        'Cannot delete the only remaining variant for a product. Deactivate it or delete the product instead.',
      );
    }

    await this.prisma.productVariant.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Variant '${variant.sku}' deleted successfully`,
    };
  }
}
