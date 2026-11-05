import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { LocationSelectionState, AreaType } from './useLocationCascade.js';

describe('LocationCascade state transitions', () => {
  it('resets downstream selections when division is changed', () => {
    const currentState: LocationSelectionState = {
      divisionId: 4,
      districtId: 14,
      thanaId: 365,
      postOfficeId: 10,
      areaType: 'city_corporation',
      cityCorporationId: 1,
      wardId: 5,
      paurashavaId: null,
      unionId: null,
    };

    // Simulate changing division
    const nextDivisionId = 1;
    const nextState: LocationSelectionState = {
      ...currentState,
      divisionId: nextDivisionId,
      districtId: null,
      thanaId: null,
      postOfficeId: null,
      areaType: null,
      cityCorporationId: null,
      wardId: null,
      paurashavaId: null,
      unionId: null,
    };

    assert.equal(nextState.divisionId, 1);
    assert.equal(nextState.districtId, null);
    assert.equal(nextState.thanaId, null);
    assert.equal(nextState.postOfficeId, null);
    assert.equal(nextState.areaType, null);
    assert.equal(nextState.cityCorporationId, null);
    assert.equal(nextState.wardId, null);
  });

  it('resets local sub-units when areaType is changed', () => {
    const currentState: LocationSelectionState = {
      divisionId: 4,
      districtId: 14,
      thanaId: 365,
      postOfficeId: 10,
      areaType: 'city_corporation',
      cityCorporationId: 1,
      wardId: 5,
      paurashavaId: null,
      unionId: null,
    };

    // Switch from city_corporation to paurashava
    const nextAreaType: AreaType = 'paurashava';
    const nextState: LocationSelectionState = {
      ...currentState,
      areaType: nextAreaType,
      cityCorporationId: null,
      wardId: null,
      paurashavaId: null,
      unionId: null,
    };

    assert.equal(nextState.areaType, 'paurashava');
    assert.equal(nextState.cityCorporationId, null);
    assert.equal(nextState.wardId, null);
    assert.equal(nextState.paurashavaId, null);
  });

  it('keeps base selections when changing between thanas under same district', () => {
    const currentState: LocationSelectionState = {
      divisionId: 4,
      districtId: 14,
      thanaId: 365,
      postOfficeId: 10,
      areaType: 'union',
      cityCorporationId: null,
      wardId: null,
      paurashavaId: null,
      unionId: 22,
    };

    const nextThanaId = 366;
    const nextState: LocationSelectionState = {
      ...currentState,
      thanaId: nextThanaId,
      postOfficeId: null,
      unionId: null,
    };

    assert.equal(nextState.divisionId, 4);
    assert.equal(nextState.districtId, 14);
    assert.equal(nextState.thanaId, 366);
    assert.equal(nextState.postOfficeId, null);
    assert.equal(nextState.unionId, null);
  });
});

