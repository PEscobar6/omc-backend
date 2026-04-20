import { BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/auth.entity';
import { ValidRoles } from './interfaces/valid-roles.interface';
import { AuthService } from './auth.service';

const mockUser = (): User => ({
  id: 'uuid-1',
  name: 'Admin OMC',
  email: 'admin@omc.com',
  password: bcrypt.hashSync('Admin123!', 10),
  role: ValidRoles.ADMIN,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('AuthService', () => {
  let service: AuthService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('signed-token');
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('given valid email and password, when login is called, then it returns user data and a JWT token', async () => {
      const user = mockUser();
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.login({ email: user.email, password: 'Admin123!' });

      expect(result.token).toBe('signed-token');
      expect(result.email).toBe(user.email);
      expect(result).not.toHaveProperty('password');
    });

    it('given an email that does not exist, when login is called, then it throws UnauthorizedException', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@email.com', password: 'Admin123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('given a wrong password, when login is called, then it throws UnauthorizedException', async () => {
      const user = mockUser();
      mockRepository.findOne.mockResolvedValue(user);

      await expect(
        service.login({ email: user.email, password: 'WrongPassword1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('given a login attempt, when login is called, then it queries only the required select fields', async () => {
      const user = mockUser();
      mockRepository.findOne.mockResolvedValue(user);

      await service.login({ email: user.email, password: 'Admin123!' });

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: user.email },
        select: { id: true, email: true, password: true, name: true, role: true },
      });
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('given valid registration data, when create is called, then it returns user data without the password field', async () => {
      const user = mockUser();
      mockRepository.create.mockReturnValue(user);
      mockRepository.save.mockResolvedValue(user);

      const result = await service.create({
        name: user.name,
        email: user.email,
        password: 'Admin123!',
      });

      expect(result).not.toHaveProperty('password');
      expect(result?.token).toBe('signed-token');
    });

    it('given a plain-text password, when create is called, then it stores a bcrypt hash instead', async () => {
      const user = mockUser();
      mockRepository.create.mockReturnValue(user);
      mockRepository.save.mockResolvedValue(user);

      await service.create({ name: 'Test', email: 'test@test.com', password: 'Admin123!' });

      const savedPayload = mockRepository.create.mock.calls[0][0];
      expect(savedPayload.password).not.toBe('Admin123!');
      expect(bcrypt.compareSync('Admin123!', savedPayload.password)).toBe(true);
    });

    it('given a duplicate email, when create is called, then it throws BadRequestException', async () => {
      mockRepository.create.mockReturnValue(mockUser());
      mockRepository.save.mockRejectedValue({ code: '23505', detail: 'Email already exists' });

      await expect(
        service.create({ name: 'Test', email: 'admin@omc.com', password: 'Admin123!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('given an unexpected DB error, when create is called, then it throws InternalServerErrorException', async () => {
      mockRepository.create.mockReturnValue(mockUser());
      mockRepository.save.mockRejectedValue({ code: '99999' });

      await expect(
        service.create({ name: 'Test', email: 'test@test.com', password: 'Admin123!' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ── checkAuthStatus ───────────────────────────────────────────────────────

  describe('checkAuthStatus', () => {
    it('given an authenticated user, when checkAuthStatus is called, then it returns user data with a refreshed token', async () => {
      const user = mockUser();

      const result = await service.checkAuthStatus(user);

      expect(result.token).toBe('signed-token');
      expect(result.email).toBe(user.email);
      expect(result).not.toHaveProperty('password');
    });

    it('given an authenticated user, when checkAuthStatus is called, then it signs the token with all required payload fields', async () => {
      const user = mockUser();

      await service.checkAuthStatus(user);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    });
  });
});
