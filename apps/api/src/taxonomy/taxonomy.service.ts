import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SkillStatus } from '@prisma/client';
import type {
  ProfessionQueryDto,
  SkillQueryDto,
  SuggestionQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProfessionDto,
  UpdateProfessionDto,
  CreateSkillDto,
  SuggestSkillDto,
  MergeSkillDto,
} from './dto/index.js';

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Public Queries
  // ---------------------------------------------------------------------------

  async getCategories(includeInactive = false) {
    return this.prisma.professionCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getProfessions(query?: ProfessionQueryDto, includeInactive = false) {
    return this.prisma.profession.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(query?.categoryId ? { categoryId: query.categoryId } : {}),
      },
      include: {
        category: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getSkills(query?: SkillQueryDto) {
    return this.prisma.skill.findMany({
      where: {
        status: SkillStatus.ACTIVE,
        ...(query?.professionId ? { professionId: query.professionId } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  // ---------------------------------------------------------------------------
  // Freelancer Suggestions
  // ---------------------------------------------------------------------------

  async suggestSkill(userId: string, dto: SuggestSkillDto) {
    const profession = await this.prisma.profession.findUnique({
      where: { id: dto.professionId },
    });

    if (!profession || !profession.isActive) {
      throw new NotFoundException('Profession not found or inactive');
    }

    const trimmedName = dto.name.trim();

    // Check if an active skill already exists under this profession (case-insensitive)
    const existingActive = await this.prisma.skill.findFirst({
      where: {
        professionId: dto.professionId,
        status: SkillStatus.ACTIVE,
        name: { equals: trimmedName, mode: 'insensitive' },
      },
    });

    if (existingActive) {
      throw new ConflictException(
        `Skill '${trimmedName}' already exists under this profession`,
      );
    }

    // Check if user already has a pending suggestion for this skill
    const existingPending = await this.prisma.skill.findFirst({
      where: {
        professionId: dto.professionId,
        status: SkillStatus.PENDING,
        name: { equals: trimmedName, mode: 'insensitive' },
        suggestedById: userId,
      },
    });

    if (existingPending) {
      throw new ConflictException(
        'You have already submitted a pending suggestion for this skill',
      );
    }

    return this.prisma.skill.create({
      data: {
        professionId: dto.professionId,
        name: trimmedName,
        bnName: dto.bnName?.trim() || null,
        status: SkillStatus.PENDING,
        suggestedById: userId,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Admin Management & Moderation
  // ---------------------------------------------------------------------------

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.professionCategory.create({
      data: {
        name: dto.name.trim(),
        bnName: dto.bnName?.trim() || null,
        icon: dto.icon?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.professionCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Profession category not found');
    }

    return this.prisma.professionCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.bnName !== undefined ? { bnName: dto.bnName?.trim() || null } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon?.trim() || null } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async createProfession(dto: CreateProfessionDto) {
    const category = await this.prisma.professionCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.profession.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        bnName: dto.bnName?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateProfession(id: string, dto: UpdateProfessionDto) {
    const profession = await this.prisma.profession.findUnique({
      where: { id },
    });
    if (!profession) {
      throw new NotFoundException('Profession not found');
    }

    if (dto.categoryId) {
      const category = await this.prisma.professionCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    return this.prisma.profession.update({
      where: { id },
      data: {
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.bnName !== undefined ? { bnName: dto.bnName?.trim() || null } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async createSkill(dto: CreateSkillDto) {
    const profession = await this.prisma.profession.findUnique({
      where: { id: dto.professionId },
    });
    if (!profession) {
      throw new NotFoundException('Profession not found');
    }

    const trimmedName = dto.name.trim();
    const existing = await this.prisma.skill.findUnique({
      where: {
        professionId_name: {
          professionId: dto.professionId,
          name: trimmedName,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Skill already exists under this profession');
    }

    return this.prisma.skill.create({
      data: {
        professionId: dto.professionId,
        name: trimmedName,
        bnName: dto.bnName?.trim() || null,
        status: SkillStatus.ACTIVE,
      },
    });
  }

  async getPendingSuggestions(query?: SuggestionQueryDto) {
    return this.prisma.skill.findMany({
      where: {
        status: SkillStatus.PENDING,
        ...(query?.professionId ? { professionId: query.professionId } : {}),
      },
      include: {
        profession: {
          select: { id: true, name: true, bnName: true },
        },
        suggestedBy: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveSuggestion(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
    });
    if (!skill) {
      throw new NotFoundException('Skill suggestion not found');
    }

    return this.prisma.skill.update({
      where: { id },
      data: {
        status: SkillStatus.ACTIVE,
      },
    });
  }

  async rejectSuggestion(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
    });
    if (!skill) {
      throw new NotFoundException('Skill suggestion not found');
    }

    return this.prisma.skill.update({
      where: { id },
      data: {
        status: SkillStatus.REJECTED,
      },
    });
  }

  async mergeSuggestion(id: string, dto: MergeSkillDto) {
    const suggestion = await this.prisma.skill.findUnique({
      where: { id },
    });
    if (!suggestion) {
      throw new NotFoundException('Skill suggestion not found');
    }

    if (id === dto.targetSkillId) {
      throw new BadRequestException('Cannot merge a skill into itself');
    }

    const targetSkill = await this.prisma.skill.findUnique({
      where: { id: dto.targetSkillId },
    });
    if (!targetSkill || targetSkill.status !== SkillStatus.ACTIVE) {
      throw new NotFoundException('Target active skill not found');
    }

    return this.prisma.skill.update({
      where: { id },
      data: {
        status: SkillStatus.REJECTED,
        mergedIntoId: dto.targetSkillId,
      },
    });
  }
}

