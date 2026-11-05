import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { LocationsValidationService } from './locations-validation.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('LocationsValidationService', () => {
  let service: LocationsValidationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      division: {
        findUnique: vi.fn(),
      },
      district: {
        findUnique: vi.fn(),
      },
      thana: {
        findUnique: vi.fn(),
      },
      postOffice: {
        findUnique: vi.fn(),
      },
      cityCorporation: {
        findUnique: vi.fn(),
      },
      paurashava: {
        findUnique: vi.fn(),
      },
      union: {
        findUnique: vi.fn(),
      },
      ward: {
        findUnique: vi.fn(),
      },
    };
    service = new LocationsValidationService(mockPrisma as unknown as PrismaService);
  });

  const validBasePayload = {
    divisionId: 4,
    districtId: 14,
    thanaId: 365,
    postOfficeId: 10,
  };

  const setupValidAncestry = () => {
    mockPrisma.division.findUnique.mockResolvedValue({ id: 4, status: true });
    mockPrisma.district.findUnique.mockResolvedValue({ id: 14, divisionId: 4, status: true });
    mockPrisma.thana.findUnique.mockResolvedValue({ id: 365, districtId: 14, status: true });
    mockPrisma.postOffice.findUnique.mockResolvedValue({ id: 10, thanaId: 365, status: true });
  };

  it('throws error when mandatory base IDs are missing', async () => {
    await expect(
      service.validateLocationSelection({
        divisionId: 0,
        districtId: 14,
        thanaId: 365,
        postOfficeId: 10,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws error when no local type (CityCorp, Paurashava, Union) is provided', async () => {
    await expect(
      service.validateLocationSelection({
        ...validBasePayload,
      }),
    ).rejects.toThrow('Must select exactly one local area type');
  });

  it('throws error when multiple local types are provided', async () => {
    await expect(
      service.validateLocationSelection({
        ...validBasePayload,
        cityCorporationId: 1,
        paurashavaId: 2,
      }),
    ).rejects.toThrow('Cannot combine multiple local area types');
  });

  it('throws error when City Corporation is selected without a ward', async () => {
    await expect(
      service.validateLocationSelection({
        ...validBasePayload,
        cityCorporationId: 1,
      }),
    ).rejects.toThrow('Ward is required when a City Corporation is selected');
  });

  it('throws error when Ward is provided with Paurashava', async () => {
    await expect(
      service.validateLocationSelection({
        ...validBasePayload,
        paurashavaId: 1,
        wardId: 5,
      }),
    ).rejects.toThrow('Ward cannot be selected for Paurashava or Union');
  });

  it('validates successfully for valid City Corporation + Ward selection', async () => {
    setupValidAncestry();
    mockPrisma.cityCorporation.findUnique.mockResolvedValue({ id: 1, districtId: 14, status: true });
    mockPrisma.ward.findUnique.mockResolvedValue({ id: 5, cityCorporationId: 1 });

    const result = await service.validateLocationSelection({
      ...validBasePayload,
      cityCorporationId: 1,
      wardId: 5,
    });

    expect(result).toEqual({
      divisionId: 4,
      districtId: 14,
      thanaId: 365,
      postOfficeId: 10,
      cityCorporationId: 1,
      wardId: 5,
      paurashavaId: null,
      unionId: null,
    });
  });

  it('validates successfully for valid Paurashava selection', async () => {
    setupValidAncestry();
    mockPrisma.paurashava.findUnique.mockResolvedValue({ id: 2, districtId: 14, status: true });

    const result = await service.validateLocationSelection({
      ...validBasePayload,
      paurashavaId: 2,
    });

    expect(result).toEqual({
      divisionId: 4,
      districtId: 14,
      thanaId: 365,
      postOfficeId: 10,
      cityCorporationId: null,
      wardId: null,
      paurashavaId: 2,
      unionId: null,
    });
  });

  it('validates successfully for valid Union selection', async () => {
    setupValidAncestry();
    mockPrisma.union.findUnique.mockResolvedValue({ id: 50, thanaId: 365, status: true });

    const result = await service.validateLocationSelection({
      ...validBasePayload,
      unionId: 50,
    });

    expect(result).toEqual({
      divisionId: 4,
      districtId: 14,
      thanaId: 365,
      postOfficeId: 10,
      cityCorporationId: null,
      wardId: null,
      paurashavaId: null,
      unionId: 50,
    });
  });

  it('throws error when district does not belong to division', async () => {
    mockPrisma.division.findUnique.mockResolvedValue({ id: 4, status: true });
    mockPrisma.district.findUnique.mockResolvedValue({ id: 14, divisionId: 99, status: true });

    await expect(
      service.validateLocationSelection({
        ...validBasePayload,
        paurashavaId: 1,
      }),
    ).rejects.toThrow('Selected district does not belong to the selected division');
  });

  it('throws error when thana does not belong to district', async () => {
    mockPrisma.division.findUnique.mockResolvedValue({ id: 4, status: true });
    mockPrisma.district.findUnique.mockResolvedValue({ id: 14, divisionId: 4, status: true });
    mockPrisma.thana.findUnique.mockResolvedValue({ id: 365, districtId: 99, status: true });

    await expect(
      service.validateLocationSelection({
        ...validBasePayload,
        paurashavaId: 1,
      }),
    ).rejects.toThrow('Selected thana does not belong to the selected district');
  });

  it('throws error when post office does not belong to thana', async () => {
    mockPrisma.division.findUnique.mockResolvedValue({ id: 4, status: true });
    mockPrisma.district.findUnique.mockResolvedValue({ id: 14, divisionId: 4, status: true });
    mockPrisma.thana.findUnique.mockResolvedValue({ id: 365, districtId: 14, status: true });
    mockPrisma.postOffice.findUnique.mockResolvedValue({ id: 10, thanaId: 999, status: true });

    await expect(
      service.validateLocationSelection({
        ...validBasePayload,
        paurashavaId: 1,
      }),
    ).rejects.toThrow('Selected post office does not belong to the selected thana');
  });

  it('throws error when ward does not belong to city corporation', async () => {
    setupValidAncestry();
    mockPrisma.cityCorporation.findUnique.mockResolvedValue({ id: 1, districtId: 14, status: true });
    mockPrisma.ward.findUnique.mockResolvedValue({ id: 5, cityCorporationId: 999 });

    await expect(
      service.validateLocationSelection({
        ...validBasePayload,
        cityCorporationId: 1,
        wardId: 5,
      }),
    ).rejects.toThrow('Selected ward does not belong to the selected city corporation');
  });
});

