import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocationsService } from './locations.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('LocationsService', () => {
  let service: LocationsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      division: {
        findMany: vi.fn(),
      },
      district: {
        findMany: vi.fn(),
      },
      thana: {
        findMany: vi.fn(),
      },
      postOffice: {
        findMany: vi.fn(),
      },
      cityCorporation: {
        findMany: vi.fn(),
      },
      paurashava: {
        findMany: vi.fn(),
      },
      union: {
        findMany: vi.fn(),
      },
      ward: {
        findMany: vi.fn(),
      },
    };
    service = new LocationsService(mockPrisma as unknown as PrismaService);
  });

  describe('getDivisions', () => {
    it('should return active divisions ordered by name', async () => {
      const mockDivisions = [{ id: 4, name: 'Dhaka', bnName: 'ঢাকা' }];
      mockPrisma.division.findMany.mockResolvedValueOnce(mockDivisions);

      const result = await service.getDivisions();
      expect(result).toEqual(mockDivisions);
      expect(mockPrisma.division.findMany).toHaveBeenCalledWith({
        where: { status: true },
        select: { id: true, name: true, bnName: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getDistricts', () => {
    it('should filter by divisionId if provided', async () => {
      const mockDistricts = [{ id: 14, divisionId: 4, name: 'Dhaka', bnName: 'ঢাকা' }];
      mockPrisma.district.findMany.mockResolvedValueOnce(mockDistricts);

      const result = await service.getDistricts({ divisionId: 4 });
      expect(result).toEqual(mockDistricts);
      expect(mockPrisma.district.findMany).toHaveBeenCalledWith({
        where: { status: true, divisionId: 4 },
        select: { id: true, divisionId: true, name: true, bnName: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getThanas', () => {
    it('should filter by districtId if provided', async () => {
      const mockThanas = [{ id: 365, districtId: 14, name: 'Savar', bnName: 'সাভার' }];
      mockPrisma.thana.findMany.mockResolvedValueOnce(mockThanas);

      const result = await service.getThanas({ districtId: 14 });
      expect(result).toEqual(mockThanas);
      expect(mockPrisma.thana.findMany).toHaveBeenCalledWith({
        where: { status: true, districtId: 14 },
        select: { id: true, districtId: true, name: true, bnName: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getPostOffices', () => {
    it('should filter by thanaId if provided', async () => {
      const mockPostOffices = [
        { id: 1, thanaId: 365, name: 'Savar', bnName: 'সাভার', postalCode: '1340' },
      ];
      mockPrisma.postOffice.findMany.mockResolvedValueOnce(mockPostOffices);

      const result = await service.getPostOffices({ thanaId: 365 });
      expect(result).toEqual(mockPostOffices);
      expect(mockPrisma.postOffice.findMany).toHaveBeenCalledWith({
        where: { status: true, thanaId: 365 },
        select: {
          id: true,
          thanaId: true,
          name: true,
          bnName: true,
          postalCode: true,
        },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getCityCorporations', () => {
    it('should filter by districtId if provided', async () => {
      const mockCityCorps = [{ id: 1, districtId: 14, name: 'Dhaka North', bnName: 'ঢাকা উত্তর' }];
      mockPrisma.cityCorporation.findMany.mockResolvedValueOnce(mockCityCorps);

      const result = await service.getCityCorporations({ districtId: 14 });
      expect(result).toEqual(mockCityCorps);
      expect(mockPrisma.cityCorporation.findMany).toHaveBeenCalledWith({
        where: { status: true, districtId: 14 },
        select: { id: true, districtId: true, name: true, bnName: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getPaurashavas', () => {
    it('should filter by districtId if provided', async () => {
      const mockPaurashavas = [{ id: 1, districtId: 14, name: 'Savar', bnName: 'সাভার' }];
      mockPrisma.paurashava.findMany.mockResolvedValueOnce(mockPaurashavas);

      const result = await service.getPaurashavas({ districtId: 14 });
      expect(result).toEqual(mockPaurashavas);
      expect(mockPrisma.paurashava.findMany).toHaveBeenCalledWith({
        where: { status: true, districtId: 14 },
        select: { id: true, districtId: true, name: true, bnName: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getUnions', () => {
    it('should filter by thanaId if provided', async () => {
      const mockUnions = [{ id: 1, thanaId: 365, name: 'Amin Bazar', bnName: 'আমিন বাজার' }];
      mockPrisma.union.findMany.mockResolvedValueOnce(mockUnions);

      const result = await service.getUnions({ thanaId: 365 });
      expect(result).toEqual(mockUnions);
      expect(mockPrisma.union.findMany).toHaveBeenCalledWith({
        where: { status: true, thanaId: 365 },
        select: { id: true, thanaId: true, name: true, bnName: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getWards', () => {
    it('should filter by cityCorporationId and order by wardNo asc', async () => {
      const mockWards = [
        { id: 1, cityCorporationId: 1, wardNo: 1, name: 'Ward 1', bnName: 'ওয়ার্ড ১' },
        { id: 2, cityCorporationId: 1, wardNo: 2, name: 'Ward 2', bnName: 'ওয়ার্ড ২' },
      ];
      mockPrisma.ward.findMany.mockResolvedValueOnce(mockWards);

      const result = await service.getWards({ cityCorporationId: 1 });
      expect(result).toEqual(mockWards);
      expect(mockPrisma.ward.findMany).toHaveBeenCalledWith({
        where: { cityCorporationId: 1 },
        select: {
          id: true,
          cityCorporationId: true,
          wardNo: true,
          name: true,
          bnName: true,
        },
        orderBy: { wardNo: 'asc' },
      });
    });
  });
});

