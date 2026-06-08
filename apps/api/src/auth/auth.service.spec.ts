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
        password: 'hashed_password',
        createdAt: new Date(),
      };

      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      const result = await service.signup(email, password);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('token');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const email = 'test@example.com';

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({} as any);

      await expect(service.signup(email, 'password')).rejects.toThrow();
    });
  });

  describe('signin', () => {
    it('should return access token for valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockUser = {
        id: '1',
        email,
        password: '$2b$10$hashed', // bcrypt hash
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      const result = await service.signin(email, password);

      expect(result).toHaveProperty('access_token');
    });

    it('should throw error for invalid email', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.signin('notfound@example.com', 'password')).rejects.toThrow();
    });
  });

  describe('validateUser', () => {
    it('should return user for valid token', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.validateUser('1');

      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.validateUser('invalid');

      expect(result).toBeNull();
    });
  });
});
