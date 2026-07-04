import { NotFoundException, BadRequestException } from '@nestjs/common';
import { verifyEligibilityCheckConflictAndCreate } from './eligibility-scaffold.util';

describe('verifyEligibilityCheckConflictAndCreate', () => {
  const baseParams = {
    parentNotFoundMessage: 'Parent not found',
    invalidStatusMessage: 'Parent is not eligible',
    conflictMessage: 'Conflict detected',
  };

  it('throws NotFoundException when the parent does not exist', async () => {
    await expect(
      verifyEligibilityCheckConflictAndCreate({
        ...baseParams,
        fetchParent: async () => null,
        validateStatus: () => true,
        checkConflict: async () => false,
        create: async () => ({ id: 'result' }),
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when the parent fails the status check', async () => {
    await expect(
      verifyEligibilityCheckConflictAndCreate({
        ...baseParams,
        fetchParent: async () => ({ status: 'PENDING' }),
        validateStatus: (parent) => parent.status === 'APPROVED',
        checkConflict: async () => false,
        create: async () => ({ id: 'result' }),
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when a conflict is detected', async () => {
    await expect(
      verifyEligibilityCheckConflictAndCreate({
        ...baseParams,
        fetchParent: async () => ({ status: 'APPROVED' }),
        validateStatus: (parent) => parent.status === 'APPROVED',
        checkConflict: async () => true,
        create: async () => ({ id: 'result' }),
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('creates and returns the result when eligible and conflict-free', async () => {
    const create = jest.fn(async (parent: { status: string }) => ({
      id: 'result',
      parentStatus: parent.status,
    }));

    const result = await verifyEligibilityCheckConflictAndCreate({
      ...baseParams,
      fetchParent: async () => ({ status: 'APPROVED' }),
      validateStatus: (parent) => parent.status === 'APPROVED',
      checkConflict: async () => false,
      create,
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'result', parentStatus: 'APPROVED' });
  });

  it('passes the fetched parent through to checkConflict and create', async () => {
    const parent = { status: 'APPROVED', id: 'parent-1' };
    const checkConflict = jest.fn(async () => false);
    const create = jest.fn(async () => ({ id: 'result' }));

    await verifyEligibilityCheckConflictAndCreate({
      ...baseParams,
      fetchParent: async () => parent,
      validateStatus: (p) => p.status === 'APPROVED',
      checkConflict,
      create,
    });

    expect(checkConflict).toHaveBeenCalledWith(parent);
    expect(create).toHaveBeenCalledWith(parent);
  });
});
