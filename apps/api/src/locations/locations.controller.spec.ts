import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocationsController } from './locations.controller.js';
import type { LocationsService } from './locations.service.js';

describe('LocationsController', () => {
  let controller: LocationsController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      getDivisions: vi.fn(),
      getDistricts: vi.fn(),
      getThanas: vi.fn(),
      getPostOffices: vi.fn(),
      getCityCorporations: vi.fn(),
      getPaurashavas: vi.fn(),
      getUnions: vi.fn(),
      getWards: vi.fn(),
    };
    controller = new LocationsController(mockService as unknown as LocationsService);
  });

  it('getDivisions calls locationsService.getDivisions', async () => {
    const data = [{ id: 4, name: 'Dhaka', bnName: 'ঢাকা' }];
    mockService.getDivisions.mockResolvedValueOnce(data);

    const result = await controller.getDivisions();
    expect(result).toBe(data);
    expect(mockService.getDivisions).toHaveBeenCalled();
  });

  it('getDistricts calls locationsService.getDistricts with query', async () => {
    const data = [{ id: 14, divisionId: 4, name: 'Dhaka', bnName: 'ঢাকা' }];
    mockService.getDistricts.mockResolvedValueOnce(data);

    const result = await controller.getDistricts({ divisionId: 4 });
    expect(result).toBe(data);
    expect(mockService.getDistricts).toHaveBeenCalledWith({ divisionId: 4 });
  });

  it('getThanas calls locationsService.getThanas with query', async () => {
    const data = [{ id: 365, districtId: 14, name: 'Savar', bnName: 'সাভার' }];
    mockService.getThanas.mockResolvedValueOnce(data);

    const result = await controller.getThanas({ districtId: 14 });
    expect(result).toBe(data);
    expect(mockService.getThanas).toHaveBeenCalledWith({ districtId: 14 });
  });

  it('getPostOffices calls locationsService.getPostOffices with query', async () => {
    const data = [{ id: 1, thanaId: 365, name: 'Savar', bnName: 'সাভার', postalCode: '1340' }];
    mockService.getPostOffices.mockResolvedValueOnce(data);

    const result = await controller.getPostOffices({ thanaId: 365 });
    expect(result).toBe(data);
    expect(mockService.getPostOffices).toHaveBeenCalledWith({ thanaId: 365 });
  });

  it('getCityCorporations calls locationsService.getCityCorporations with query', async () => {
    const data = [{ id: 1, districtId: 14, name: 'Dhaka North', bnName: 'ঢাকা উত্তর' }];
    mockService.getCityCorporations.mockResolvedValueOnce(data);

    const result = await controller.getCityCorporations({ districtId: 14 });
    expect(result).toBe(data);
    expect(mockService.getCityCorporations).toHaveBeenCalledWith({ districtId: 14 });
  });

  it('getPaurashavas calls locationsService.getPaurashavas with query', async () => {
    const data = [{ id: 1, districtId: 14, name: 'Savar', bnName: 'সাভার' }];
    mockService.getPaurashavas.mockResolvedValueOnce(data);

    const result = await controller.getPaurashavas({ districtId: 14 });
    expect(result).toBe(data);
    expect(mockService.getPaurashavas).toHaveBeenCalledWith({ districtId: 14 });
  });

  it('getUnions calls locationsService.getUnions with query', async () => {
    const data = [{ id: 1, thanaId: 365, name: 'Amin Bazar', bnName: 'আমিন বাজার' }];
    mockService.getUnions.mockResolvedValueOnce(data);

    const result = await controller.getUnions({ thanaId: 365 });
    expect(result).toBe(data);
    expect(mockService.getUnions).toHaveBeenCalledWith({ thanaId: 365 });
  });

  it('getWards calls locationsService.getWards with query', async () => {
    const data = [{ id: 1, cityCorporationId: 1, wardNo: 1, name: 'Ward 1', bnName: 'ওয়ার্ড ১' }];
    mockService.getWards.mockResolvedValueOnce(data);

    const result = await controller.getWards({ cityCorporationId: 1 });
    expect(result).toBe(data);
    expect(mockService.getWards).toHaveBeenCalledWith({ cityCorporationId: 1 });
  });
});

