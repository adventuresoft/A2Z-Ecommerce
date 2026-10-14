import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CategoryQueryDto,
  CategoryResponseDto,
  CategoryTreeNodeDto,
  CreateCategoryDto,
  PaginatedCategoryResponseDto,
  UpdateCategoryDto,
} from './dto/index.js';

export interface ParentOptionDto {
  id: string;
  name: string;
  slug: string;
  depth: number;
}

export interface CategoryWithBreadcrumbsDto extends CategoryResponseDto {
  breadcrumbs: { id: string; name: string; slug: string }[];
  children: { id: string; name: string; slug: string; imageUrl?: string | null; sortOrder: number }[];
}

@Injectable()
export class CategoriesService {
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
  private async generateUniqueSlug(baseText: string, excludeId?: string): Promise<string> {
    const baseSlug = this.slugify(baseText) || 'category';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.category.findUnique({
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
   * Compute the hierarchy depth of a category (1 for Root, 2 for Subcategory, 3 for Leaf)
   */
  private async getCategoryDepth(categoryId: string): Promise<number> {
    let depth = 1;
    let currentId: string | null = categoryId;

    while (currentId) {
      const cat: { parentId: string | null } | null =
        await this.prisma.category.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });

      if (!cat) break;
      if (cat.parentId) {
        depth++;
        currentId = cat.parentId;
        if (depth > 10) break; // sanity boundary
      } else {
        break;
      }
    }

    return depth;
  }

  /**
   * Compute the maximum depth of descendants under a given category
   */
  private async getSubtreeHeight(categoryId: string): Promise<number> {
    const directChildren = await this.prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });

    if (directChildren.length === 0) {
      return 1;
    }

    let maxChildHeight = 0;
    for (const child of directChildren) {
      const childHeight = await this.getSubtreeHeight(child.id);
      if (childHeight > maxChildHeight) {
        maxChildHeight = childHeight;
      }
    }

    return 1 + maxChildHeight;
  }

  /**
   * Get all descendant IDs of a category (to prevent cycle assignment)
   */
  private async getDescendantIds(categoryId: string): Promise<string[]> {
    const directChildren = await this.prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });

    let descendants: string[] = [];
    for (const child of directChildren) {
      descendants.push(child.id);
      const childDescendants = await this.getDescendantIds(child.id);
      descendants = descendants.concat(childDescendants);
    }

    return descendants;
  }

  /**
   * Create a new category with 3-level depth check and unique slug resolution
   */
  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // 1. Resolve slug
    let slug: string;
    if (dto.slug && dto.slug.trim()) {
      const normalized = this.slugify(dto.slug);
      const exists = await this.prisma.category.findUnique({
        where: { slug: normalized },
        select: { id: true },
      });
      if (exists) {
        throw new ConflictException(`Category slug '${normalized}' is already in use`);
      }
      slug = normalized;
    } else {
      slug = await this.generateUniqueSlug(dto.name);
    }

    // 2. Validate parent category and hierarchy depth
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
        select: { id: true, parentId: true },
      });

      if (!parent) {
        throw new NotFoundException(`Parent category with ID '${dto.parentId}' does not exist`);
      }

      const parentDepth = await this.getCategoryDepth(dto.parentId);
      if (parentDepth >= 3) {
        throw new BadRequestException(
          'Categories cannot exceed 3 levels of depth. Selected parent is already at maximum level.',
        );
      }
    }

    // 3. Persist record
    const category = await this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        imageUrl: dto.imageUrl?.trim() || null,
        parentId: dto.parentId || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : 0,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { children: true },
        },
      },
    });

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      parentId: category.parentId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      parent: category.parent,
      counts: {
        subcategories: category._count.children,
        products: 0,
      },
    };
  }

  /**
   * Paginated admin query with search, parent filter, active filter, and sorting
   */
  async findAllAdmin(query: CategoryQueryDto): Promise<PaginatedCategoryResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {};

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { slug: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (query.parentId !== undefined) {
      if (query.parentId === 'root' || query.parentId === 'null' || query.parentId === '') {
        where.parentId = null;
      } else {
        where.parentId = query.parentId;
      }
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const sortField = query.sortBy || 'sortOrder';
    const sortDir = query.sortOrder || 'asc';
    const orderBy: Prisma.CategoryOrderByWithRelationInput = {
      [sortField]: sortDir,
    };

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          parent: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { children: true },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      items: items.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        parentId: cat.parentId,
        isActive: cat.isActive,
        sortOrder: cat.sortOrder,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        parent: cat.parent,
        counts: {
          subcategories: cat._count.children,
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
   * Return eligible parent categories for create/edit dropdowns (Levels 1 and 2 only)
   * If excludeId is provided, excludes that category and all its descendants to prevent cycles.
   */
  async getParentOptions(excludeId?: string): Promise<ParentOptionDto[]> {
    const allCategories = await this.prisma.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: { sortOrder: 'asc' },
    });

    let excludedIds = new Set<string>();
    if (excludeId) {
      excludedIds.add(excludeId);
      const descendants = await this.getDescendantIds(excludeId);
      for (const d of descendants) {
        excludedIds.add(d);
      }
    }

    // Map to find depths
    const parentMap = new Map<string, string | null>();
    for (const cat of allCategories) {
      parentMap.set(cat.id, cat.parentId);
    }

    const getDepth = (id: string): number => {
      let depth = 1;
      let curr = parentMap.get(id);
      while (curr) {
        depth++;
        curr = parentMap.get(curr);
        if (depth > 10) break;
      }
      return depth;
    };

    const results: ParentOptionDto[] = [];
    for (const cat of allCategories) {
      if (excludedIds.has(cat.id)) continue;
      const depth = getDepth(cat.id);
      // Only Level 1 and Level 2 can be parents (Max Depth = 3)
      if (depth < 3) {
        results.push({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          depth,
        });
      }
    }

    return results;
  }

  /**
   * Find single category by ID for administrative editing
   */
  async findOneAdmin(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { children: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      parentId: category.parentId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      parent: category.parent,
      counts: {
        subcategories: category._count.children,
        products: 0,
      },
    };
  }

  /**
   * Update category with hierarchy depth check, cycle prevention, and slug uniqueness
   */
  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true, slug: true, parentId: true },
    });

    if (!existing) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    // 1. Slug handling
    let targetSlug = existing.slug;
    if (dto.slug && dto.slug.trim() && dto.slug !== existing.slug) {
      const normalized = this.slugify(dto.slug);
      const conflict = await this.prisma.category.findUnique({
        where: { slug: normalized },
        select: { id: true },
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Category slug '${normalized}' is already in use`);
      }
      targetSlug = normalized;
    }

    // 2. Parent & hierarchy check
    let targetParentId = existing.parentId;
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent.');
      }

      if (dto.parentId) {
        // Prevent cycles: parentId cannot be a descendant of id
        const descendants = await this.getDescendantIds(id);
        if (descendants.includes(dto.parentId)) {
          throw new BadRequestException('Cannot set a descendant category as parent (cycle detected).');
        }

        const parentDepth = await this.getCategoryDepth(dto.parentId);
        const subtreeHeight = await this.getSubtreeHeight(id);

        if (parentDepth + subtreeHeight - 1 > 3) {
          throw new BadRequestException(
            `Moving this category exceeds the maximum hierarchy depth of 3 levels.`,
          );
        }

        targetParentId = dto.parentId;
      } else {
        targetParentId = null;
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        slug: targetSlug,
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl?.trim() || null } : {}),
        parentId: targetParentId,
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { children: true },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      imageUrl: updated.imageUrl,
      parentId: updated.parentId,
      isActive: updated.isActive,
      sortOrder: updated.sortOrder,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      parent: updated.parent,
      counts: {
        subcategories: updated._count.children,
        products: 0,
      },
    };
  }

  /**
   * Delete category with strict dependency safeguards
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { children: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    if (category._count.children > 0) {
      throw new ConflictException(
        `Cannot delete category '${category.name}' because it contains ${category._count.children} subcategories. Please reassign or delete them first.`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Category '${category.name}' deleted successfully.`,
    };
  }

  /**
   * Public storefront: Get active nested category tree
   */
  async findPublicTree(): Promise<CategoryTreeNodeDto[]> {
    const activeCategories = await this.prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        parentId: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    const categoryMap = new Map<string, CategoryTreeNodeDto>();
    for (const cat of activeCategories) {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        children: [],
      });
    }

    const tree: CategoryTreeNodeDto[] = [];
    for (const cat of activeCategories) {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children.push(node);
      } else if (!cat.parentId) {
        tree.push(node);
      }
    }

    return tree;
  }

  /**
   * Public storefront: Find active category by slug with ancestor breadcrumbs
   */
  async findBySlug(slug: string): Promise<CategoryWithBreadcrumbsDto> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: {
          select: { id: true, name: true, slug: true, parentId: true },
        },
        children: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, imageUrl: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    // Build breadcrumbs
    const breadcrumbs: { id: string; name: string; slug: string }[] = [];
    let currentParentId = category.parentId;

    const ancestorChain: { id: string; name: string; slug: string }[] = [];
    while (currentParentId) {
      const p = await this.prisma.category.findUnique({
        where: { id: currentParentId },
        select: { id: true, name: true, slug: true, parentId: true },
      });
      if (!p) break;
      ancestorChain.unshift({ id: p.id, name: p.name, slug: p.slug });
      currentParentId = p.parentId;
    }

    breadcrumbs.push(...ancestorChain);
    breadcrumbs.push({ id: category.id, name: category.name, slug: category.slug });

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      parentId: category.parentId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      parent: category.parent ? { id: category.parent.id, name: category.parent.name, slug: category.parent.slug } : null,
      counts: {
        subcategories: category.children.length,
        products: 0,
      },
      breadcrumbs,
      children: category.children,
    };
  }
}
