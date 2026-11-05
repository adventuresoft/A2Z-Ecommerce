import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  DistrictQueryDto,
  ThanaQueryDto,
  PostOfficeQueryDto,
  CityCorporationQueryDto,
  PaurashavaQueryDto,
  UnionQueryDto,
  WardQueryDto,
} from './dto/index.js';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDivisions() {
    return this.prisma.division.findMany({
      where: { status: true },
      select: {
        id: true,
        name: true,
        bnName: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getDistricts(query?: DistrictQueryDto) {
    return this.prisma.district.findMany({
      where: {
        status: true,
        ...(query?.divisionId ? { divisionId: query.divisionId } : {}),
      },
      select: {
        id: true,
        divisionId: true,
        name: true,
        bnName: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getThanas(query?: ThanaQueryDto) {
    return this.prisma.thana.findMany({
      where: {
        status: true,
        ...(query?.districtId ? { districtId: query.districtId } : {}),
      },
      select: {
        id: true,
        districtId: true,
        name: true,
        bnName: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getPostOffices(query?: PostOfficeQueryDto) {
    return this.prisma.postOffice.findMany({
      where: {
        status: true,
        ...(query?.thanaId ? { thanaId: query.thanaId } : {}),
      },
      select: {
        id: true,
        thanaId: true,
        name: true,
        bnName: true,
        postalCode: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCityCorporations(query?: CityCorporationQueryDto) {
    return this.prisma.cityCorporation.findMany({
      where: {
        status: true,
        ...(query?.districtId ? { districtId: query.districtId } : {}),
      },
      select: {
        id: true,
        districtId: true,
        name: true,
        bnName: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getPaurashavas(query?: PaurashavaQueryDto) {
    return this.prisma.paurashava.findMany({
      where: {
        status: true,
        ...(query?.districtId ? { districtId: query.districtId } : {}),
      },
      select: {
        id: true,
        districtId: true,
        name: true,
        bnName: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getUnions(query?: UnionQueryDto) {
    return this.prisma.union.findMany({
      where: {
        status: true,
        ...(query?.thanaId ? { thanaId: query.thanaId } : {}),
      },
      select: {
        id: true,
        thanaId: true,
        name: true,
        bnName: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getWards(query?: WardQueryDto) {
    return this.prisma.ward.findMany({
      where: {
        ...(query?.cityCorporationId ? { cityCorporationId: query.cityCorporationId } : {}),
      },
      select: {
        id: true,
        cityCorporationId: true,
        wardNo: true,
        name: true,
        bnName: true,
      },
      orderBy: { wardNo: 'asc' },
    });
  }
}

