import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { DistrictQueryDto, ThanaQueryDto, PostOfficeQueryDto } from './dto/index.js';

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
}

