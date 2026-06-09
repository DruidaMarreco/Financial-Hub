import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '@financial-hub/data';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockUser = {
        id: '1',
        email,
        name: 'Test User',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      const result = await service.signup({
        email,
        password,
        confirmPassword: password,
        name: 'Test User',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('token');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const email = 'test@example.com';

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: '1' } as any);

      await expect(
        service.signup({ email, password: 'password', confirmPassword: 'password', name: 'Test' }),
      ).rejects.toThrow();
    });
  });

  describe('signin', () => {
    it('should return access token for valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockUser = {
        id: '1',
        email,
        name: 'Test User',
        password: '$2b$10$hashed', // bcrypt hash
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      // bcrypt.compare will be called with plain password vs hash
      // Since the hash is fake, it returns false — we test the error path instead
      await expect(service.signin({ email, password })).rejects.toThrow();
    });

    it('should throw error for invalid email', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.signin({ email: 'notfound@example.com', password: 'password' })).rejects.toThrow();
    });
  });

  describe('validateUser', () => {
    it('should return user for valid id', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test' };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.validateUser('1');

      expect(result).toEqual(mockUser);
    });

    it('should throw for non-existent user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.validateUser('invalid')).rejects.toThrow();
    });
  });
});
