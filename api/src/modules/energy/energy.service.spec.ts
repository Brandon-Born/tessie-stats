/**
 * Energy Service Unit Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EnergyService } from './energy.service';
import { TeslaService } from '../tesla/tesla.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../../database/prisma.service';

describe('EnergyService', () => {
  let service: EnergyService;

  const mockTeslaService = {
    getEnergySites: jest.fn(),
    getSiteLiveData: jest.fn(),
  };

  const mockAuthService = {
    executeTeslaCall: jest.fn(),
  };

  const mockPrismaService = {
    energyDataCache: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnergyService,
        {
          provide: TeslaService,
          useValue: mockTeslaService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EnergyService>(EnergyService);
  });

  describe('getEnergySites', () => {
    it('delegates Tesla calls through AuthService', async () => {
      const sites = [
        {
          energy_site_id: 123,
          site_name: 'Home',
        },
      ];

      mockTeslaService.getEnergySites.mockResolvedValue(sites);
      mockAuthService.executeTeslaCall.mockImplementation(
        (operation: (accessToken: string) => Promise<unknown>) => operation('token-1')
      );

      const result = await service.getEnergySites();

      expect(result).toEqual(sites);
      expect(mockTeslaService.getEnergySites).toHaveBeenCalledTimes(1);
      expect(mockTeslaService.getEnergySites).toHaveBeenCalledWith('token-1');
      expect(mockAuthService.executeTeslaCall).toHaveBeenCalledTimes(1);
    });
  });
});
