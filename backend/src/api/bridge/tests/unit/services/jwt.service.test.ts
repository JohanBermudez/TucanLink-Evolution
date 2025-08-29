import JWTService from '../../../v1/services/auth/jwt.service';
import jwt from 'jsonwebtoken';
import { config } from '../../../config';

describe('JWTService', () => {
  let jwtService: JWTService;

  beforeEach(() => {
    jwtService = new JWTService();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const payload = {
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
        profile: 'user',
      };

      const token = jwtService.generateAccessToken(payload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      // Verify token structure
      const decoded = jwt.decode(token) as any;
      expect(decoded).toMatchObject({
        ...payload,
        tokenType: 'access',
      });
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should include custom options in token', () => {
      const payload = {
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
      };

      const options = {
        expiresIn: '1h',
        audience: 'custom-audience',
        issuer: 'custom-issuer',
      };

      const token = jwtService.generateAccessToken(payload, options);
      const decoded = jwt.decode(token, { complete: true }) as any;

      expect(decoded.payload.aud).toBe('custom-audience');
      expect(decoded.payload.iss).toBe('custom-issuer');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const payload = {
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
        profile: 'user',
      };

      const token = jwtService.generateRefreshToken(payload);
      expect(token).toBeTruthy();

      const decoded = jwt.decode(token) as any;
      expect(decoded).toMatchObject({
        ...payload,
        tokenType: 'refresh',
      });
    });

    it('should have longer expiration than access token', () => {
      const payload = {
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
      };

      const accessToken = jwtService.generateAccessToken(payload);
      const refreshToken = jwtService.generateRefreshToken(payload);

      const accessDecoded = jwt.decode(accessToken) as any;
      const refreshDecoded = jwt.decode(refreshToken) as any;

      expect(refreshDecoded.exp - refreshDecoded.iat).toBeGreaterThan(
        accessDecoded.exp - accessDecoded.iat
      );
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const payload = {
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
      };

      const { accessToken, refreshToken } = jwtService.generateTokenPair(payload);

      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
      expect(accessToken).not.toBe(refreshToken);

      const accessDecoded = jwt.decode(accessToken) as any;
      const refreshDecoded = jwt.decode(refreshToken) as any;

      expect(accessDecoded.tokenType).toBe('access');
      expect(refreshDecoded.tokenType).toBe('refresh');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = {
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
      };

      const token = jwtService.generateAccessToken(payload);
      const verified = jwtService.verifyToken(token);

      expect(verified).toMatchObject({
        ...payload,
        tokenType: 'access',
      });
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwtService.verifyToken(invalidToken);
      }).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      const payload = {
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
      };

      // Create an expired token
      const expiredToken = jwt.sign(
        { ...payload, tokenType: 'access' },
        config.jwt.secret,
        {
          expiresIn: '-1s', // Already expired
          algorithm: config.jwt.algorithm as jwt.Algorithm,
          issuer: 'tucanlink-api-bridge',
          audience: 'tucanlink-modules',
        }
      );

      expect(() => {
        jwtService.verifyToken(expiredToken);
      }).toThrow('Token has expired');
    });

    it('should throw error for token with wrong signature', () => {
      const payload = {
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
      };

      const tokenWithWrongSecret = jwt.sign(
        { ...payload, tokenType: 'access' },
        'wrong-secret',
        {
          expiresIn: '15m',
          algorithm: config.jwt.algorithm as jwt.Algorithm,
        }
      );

      expect(() => {
        jwtService.verifyToken(tokenWithWrongSecret);
      }).toThrow('Invalid token');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh a valid refresh token', async () => {
      const payload = {
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
      };

      const refreshToken = jwtService.generateRefreshToken(payload);
      const newAccessToken = await jwtService.refreshAccessToken(refreshToken);

      expect(newAccessToken).toBeTruthy();

      const decoded = jwtService.verifyToken(newAccessToken);
      expect(decoded).toMatchObject({
        ...payload,
        tokenType: 'access',
      });
    });

    it('should throw error when using access token as refresh token', async () => {
      const payload = {
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
      };

      const accessToken = jwtService.generateAccessToken(payload);

      await expect(
        jwtService.refreshAccessToken(accessToken)
      ).rejects.toThrow('Invalid token type');
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(
        jwtService.refreshAccessToken('invalid.refresh.token')
      ).rejects.toThrow('Failed to refresh token');
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const payload = {
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
      };

      const token = jwtService.generateAccessToken(payload);
      const decoded = jwtService.decodeToken(token);

      expect(decoded).toMatchObject({
        ...payload,
        tokenType: 'access',
      });
    });

    it('should return null for invalid token', () => {
      const decoded = jwtService.decodeToken('invalid.token');
      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = jwtService.generateAccessToken({
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
      });

      expect(jwtService.isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const expiredToken = jwt.sign(
        { userId: 1, exp: Math.floor(Date.now() / 1000) - 3600 },
        config.jwt.secret
      );

      expect(jwtService.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(jwtService.isTokenExpired('invalid.token')).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      const token = jwtService.generateAccessToken({
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
      });

      const expiration = jwtService.getTokenExpiration(token);
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const expiration = jwtService.getTokenExpiration('invalid.token');
      expect(expiration).toBeNull();
    });
  });

  describe('validateTokenClaims', () => {
    it('should validate token with correct claims', () => {
      const payload = {
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
      };

      const token = jwtService.generateAccessToken(payload);
      
      const isValid = jwtService.validateTokenClaims(token, {
        userId: 1,
        companyId: 1,
      });

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect claims', () => {
      const token = jwtService.generateAccessToken({
        userId: 1,
        companyId: 1,
        email: 'test@example.com',
      });

      const isValid = jwtService.validateTokenClaims(token, {
        userId: 2, // Different user ID
      });

      expect(isValid).toBe(false);
    });

    it('should return false for invalid token', () => {
      const isValid = jwtService.validateTokenClaims('invalid.token', {
        userId: 1,
      });

      expect(isValid).toBe(false);
    });
  });
});