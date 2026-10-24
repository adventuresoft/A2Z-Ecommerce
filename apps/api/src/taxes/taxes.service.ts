import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateTaxClassDto,
  PaginatedTaxClassResponseDto,
  TaxClassQueryDto,
  TaxClassResponseDto,
  UpdateTaxClassDto,
} from './dto/index.js';

export interface CalculatedLineItemTax {
  unitPrice: number;
  quantity: number;
  netUnitPrice: number;
  unitTax: number;
  totalGross: number;
  totalTax: number;
  totalNet: number;
  taxRate: number;
  taxClassName: string;
}

export interface CalculatedOrderTaxSummary {
  totalGross: number;
  totalTax: number;
  totalNet: number;
  items: CalculatedLineItemTax[];
}

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaxClassDto): Promise<TaxClassResponseDto> {
    const existing = await this.prisma.taxClass.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Tax class with code "${dto.code}" already exists.`);
    }

    const isDefault = dto.isDefault ?? false;

    return this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.taxClass.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const created = await tx.taxClass.create({
        data: {
          name: dto.name.trim(),
          code: dto.code.trim().toUpperCase(),
          rate: new Prisma.Decimal(dto.rate),
          isDefault,
          isActive: dto.isActive ?? true,
          description: dto.description?.trim() || null,
        },
      });

      return this.formatTaxClass(created);
    });
  }

  async findAll(query: TaxClassQueryDto): Promise<PaginatedTaxClassResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.TaxClassWhereInput = {};

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (typeof query.isActive === 'boolean') {
      where.isActive = query.isActive;
    }

    const [total, items] = await Promise.all([
      this.prisma.taxClass.count({ where }),
      this.prisma.taxClass.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isDefault: 'desc' }, { rate: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: {
              categories: true,
              products: true,
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((item) => this.formatTaxClass(item)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string): Promise<TaxClassResponseDto> {
    const taxClass = await this.prisma.taxClass.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            categories: true,
            products: true,
          },
        },
      },
    });

    if (!taxClass) {
      throw new NotFoundException(`Tax class with ID "${id}" was not found.`);
    }

    return this.formatTaxClass(taxClass);
  }

  async update(id: string, dto: UpdateTaxClassDto): Promise<TaxClassResponseDto> {
    const current = await this.prisma.taxClass.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Tax class with ID "${id}" was not found.`);
    }

    if (dto.code && dto.code.trim().toUpperCase() !== current.code) {
      const existing = await this.prisma.taxClass.findUnique({
        where: { code: dto.code.trim().toUpperCase() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Tax class with code "${dto.code}" already exists.`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.taxClass.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const updated = await tx.taxClass.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          code: dto.code?.trim().toUpperCase(),
          rate: typeof dto.rate === 'number' ? new Prisma.Decimal(dto.rate) : undefined,
          isDefault: dto.isDefault,
          isActive: dto.isActive,
          description: dto.description !== undefined ? dto.description?.trim() || null : undefined,
        },
        include: {
          _count: {
            select: {
              categories: true,
              products: true,
            },
          },
        },
      });

      return this.formatTaxClass(updated);
    });
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const taxClass = await this.prisma.taxClass.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            categories: true,
            products: true,
          },
        },
      },
    });

    if (!taxClass) {
      throw new NotFoundException(`Tax class with ID "${id}" was not found.`);
    }

    if (taxClass.isDefault) {
      throw new BadRequestException('Cannot delete the default tax class. Set another tax class as default first.');
    }

    const assignedCount = taxClass._count.categories + taxClass._count.products;
    if (assignedCount > 0) {
      // Soft-deactivate if items are assigned
      await this.prisma.taxClass.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        success: true,
        message: `Tax class has ${assignedCount} assigned catalog associations and has been deactivated instead of deleted.`,
      };
    }

    await this.prisma.taxClass.delete({ where: { id } });
    return {
      success: true,
      message: 'Tax class successfully deleted.',
    };
  }

  /**
   * Resolves the active tax class for a catalog product or category.
   * Inheritance: Product -> Category -> Store Default -> Zero Tax.
   */
  async resolveEffectiveTaxClass(params: {
    productId?: string;
    categoryId?: string;
  }): Promise<{ taxRate: number; taxClassName: string; taxClassId: string | null }> {
    // 1. Check Product override
    if (params.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: params.productId },
        select: {
          taxClassId: true,
          categoryId: true,
          taxClass: { select: { id: true, name: true, rate: true, isActive: true } },
        },
      });

      if (product?.taxClass && product.taxClass.isActive) {
        return {
          taxRate: Number(product.taxClass.rate),
          taxClassName: product.taxClass.name,
          taxClassId: product.taxClass.id,
        };
      }

      if (!params.categoryId && product?.categoryId) {
        params.categoryId = product.categoryId;
      }
    }

    // 2. Check Category default
    if (params.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: params.categoryId },
        select: {
          taxClassId: true,
          taxClass: { select: { id: true, name: true, rate: true, isActive: true } },
        },
      });

      if (category?.taxClass && category.taxClass.isActive) {
        return {
          taxRate: Number(category.taxClass.rate),
          taxClassName: category.taxClass.name,
          taxClassId: category.taxClass.id,
        };
      }
    }

    // 3. Store Default fallback
    const defaultTaxClass = await this.prisma.taxClass.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (defaultTaxClass) {
      return {
        taxRate: Number(defaultTaxClass.rate),
        taxClassName: defaultTaxClass.name,
        taxClassId: defaultTaxClass.id,
      };
    }

    // 4. Default zero tax
    return {
      taxRate: 0,
      taxClassName: 'Zero-Rated / Exempt',
      taxClassId: null,
    };
  }

  /**
   * Reverse-calculates tax-inclusive line item VAT.
   * netUnitPrice = unitPrice / (1 + (taxRate / 100))
   * taxAmount = totalGross - totalNet
   */
  calculateLineItemTax(
    unitPrice: number,
    quantity: number,
    taxRate: number,
    taxClassName = 'Standard VAT',
  ): CalculatedLineItemTax {
    const qty = Math.max(1, quantity);
    const grossTotal = Number((unitPrice * qty).toFixed(2));

    if (taxRate <= 0) {
      return {
        unitPrice,
        quantity: qty,
        netUnitPrice: unitPrice,
        unitTax: 0,
        totalGross: grossTotal,
        totalTax: 0,
        totalNet: grossTotal,
        taxRate: 0,
        taxClassName: taxClassName || 'Zero-Rated / Exempt',
      };
    }

    const netUnitPrice = Number((unitPrice / (1 + taxRate / 100)).toFixed(2));
    const unitTax = Number((unitPrice - netUnitPrice).toFixed(2));
    const totalTax = Number((unitTax * qty).toFixed(2));
    const totalNet = Number((grossTotal - totalTax).toFixed(2));

    return {
      unitPrice,
      quantity: qty,
      netUnitPrice,
      unitTax,
      totalGross: grossTotal,
      totalTax,
      totalNet,
      taxRate,
      taxClassName,
    };
  }

  /**
   * Calculates order-level tax summary from line items.
   */
  calculateOrderTax(
    items: Array<{
      unitPrice: number;
      quantity: number;
      taxRate: number;
      taxClassName?: string;
    }>,
  ): CalculatedOrderTaxSummary {
    const calculatedItems = items.map((item) =>
      this.calculateLineItemTax(item.unitPrice, item.quantity, item.taxRate, item.taxClassName),
    );

    const totalGross = Number(
      calculatedItems.reduce((acc, i) => acc + i.totalGross, 0).toFixed(2),
    );
    const totalTax = Number(
      calculatedItems.reduce((acc, i) => acc + i.totalTax, 0).toFixed(2),
    );
    const totalNet = Number((totalGross - totalTax).toFixed(2));

    return {
      totalGross,
      totalTax,
      totalNet,
      items: calculatedItems,
    };
  }

  private formatTaxClass(
    taxClass: {
      id: string;
      name: string;
      code: string;
      rate: Prisma.Decimal | number;
      isDefault: boolean;
      isActive: boolean;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      _count?: { categories: number; products: number };
    },
  ): TaxClassResponseDto {
    return {
      id: taxClass.id,
      name: taxClass.name,
      code: taxClass.code,
      rate: Number(taxClass.rate),
      isDefault: taxClass.isDefault,
      isActive: taxClass.isActive,
      description: taxClass.description,
      categoriesCount: taxClass._count?.categories ?? 0,
      productsCount: taxClass._count?.products ?? 0,
      createdAt: taxClass.createdAt,
      updatedAt: taxClass.updatedAt,
    };
  }
}
