import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface LocationSelectionInput {
  divisionId: number;
  districtId: number;
  thanaId: number;
  postOfficeId: number;
  cityCorporationId?: number | null;
  wardId?: number | null;
  paurashavaId?: number | null;
  unionId?: number | null;
}

export interface ValidatedLocationOutput {
  divisionId: number;
  districtId: number;
  thanaId: number;
  postOfficeId: number;
  cityCorporationId?: number | null;
  wardId?: number | null;
  paurashavaId?: number | null;
  unionId?: number | null;
}

@Injectable()
export class LocationsValidationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates mutual exclusivity and ancestor consistency for Bangladesh locations.
   */
  async validateLocationSelection(
    input: LocationSelectionInput,
  ): Promise<ValidatedLocationOutput> {
    if (!input.divisionId || !input.districtId || !input.thanaId || !input.postOfficeId) {
      throw new BadRequestException(
        'divisionId, districtId, thanaId, and postOfficeId are all required',
      );
    }

    const { cityCorporationId, paurashavaId, unionId, wardId } = input;

    // Check mutual exclusivity only if any local area type is provided (they are optional)
    const localTypesCount = [
      cityCorporationId ? 1 : 0,
      paurashavaId ? 1 : 0,
      unionId ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    if (localTypesCount > 1) {
      throw new BadRequestException(
        'Cannot combine multiple local area types. Select at most one among City Corporation, Paurashava, or Union',
      );
    }

    // Ward constraint
    if (wardId && !cityCorporationId) {
      throw new BadRequestException(
        'Ward cannot be selected without a City Corporation',
      );
    }

    // 1. Verify Division
    const division = await this.prisma.division.findUnique({
      where: { id: input.divisionId },
      select: { id: true, status: true },
    });
    if (!division || !division.status) {
      throw new BadRequestException('Selected division is invalid or inactive');
    }

    // 2. Verify District
    const district = await this.prisma.district.findUnique({
      where: { id: input.districtId },
      select: { id: true, divisionId: true, status: true },
    });
    if (!district || !district.status) {
      throw new BadRequestException('Selected district is invalid or inactive');
    }
    if (district.divisionId !== input.divisionId) {
      throw new BadRequestException('Selected district does not belong to the selected division');
    }

    // 3. Verify Thana
    const thana = await this.prisma.thana.findUnique({
      where: { id: input.thanaId },
      select: { id: true, districtId: true, status: true },
    });
    if (!thana || !thana.status) {
      throw new BadRequestException('Selected thana is invalid or inactive');
    }
    if (thana.districtId !== input.districtId) {
      throw new BadRequestException('Selected thana does not belong to the selected district');
    }

    // 4. Verify Post Office
    const postOffice = await this.prisma.postOffice.findUnique({
      where: { id: input.postOfficeId },
      select: { id: true, thanaId: true, status: true },
    });
    if (!postOffice || !postOffice.status) {
      throw new BadRequestException('Selected post office is invalid or inactive');
    }
    if (postOffice.thanaId !== input.thanaId) {
      throw new BadRequestException('Selected post office does not belong to the selected thana');
    }

    // 5. Verify Local Type specifics
    if (cityCorporationId) {
      const cityCorp = await this.prisma.cityCorporation.findUnique({
        where: { id: cityCorporationId },
        select: { id: true, districtId: true, status: true },
      });
      if (!cityCorp || !cityCorp.status) {
        throw new BadRequestException('Selected city corporation is invalid or inactive');
      }
      if (cityCorp.districtId !== input.districtId) {
        throw new BadRequestException(
          'Selected city corporation does not belong to the selected district',
        );
      }

      const ward = await this.prisma.ward.findUnique({
        where: { id: wardId! },
        select: { id: true, cityCorporationId: true },
      });
      if (!ward) {
        throw new BadRequestException('Selected ward is invalid');
      }
      if (ward.cityCorporationId !== cityCorporationId) {
        throw new BadRequestException(
          'Selected ward does not belong to the selected city corporation',
        );
      }
    } else if (paurashavaId) {
      const paurashava = await this.prisma.paurashava.findUnique({
        where: { id: paurashavaId },
        select: { id: true, districtId: true, status: true },
      });
      if (!paurashava || !paurashava.status) {
        throw new BadRequestException('Selected paurashava is invalid or inactive');
      }
      if (paurashava.districtId !== input.districtId) {
        throw new BadRequestException(
          'Selected paurashava does not belong to the selected district',
        );
      }
    } else if (unionId) {
      const union = await this.prisma.union.findUnique({
        where: { id: unionId },
        select: { id: true, thanaId: true, status: true },
      });
      if (!union || !union.status) {
        throw new BadRequestException('Selected union is invalid or inactive');
      }
      if (union.thanaId !== input.thanaId) {
        throw new BadRequestException('Selected union does not belong to the selected thana');
      }
    }

    return {
      divisionId: input.divisionId,
      districtId: input.districtId,
      thanaId: input.thanaId,
      postOfficeId: input.postOfficeId,
      cityCorporationId: cityCorporationId || null,
      wardId: wardId || null,
      paurashavaId: paurashavaId || null,
      unionId: unionId || null,
    };
  }
}

