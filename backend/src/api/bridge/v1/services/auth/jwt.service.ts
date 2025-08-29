import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { config } from '../../../config';

export interface TokenPayload extends JwtPayload {
  userId: number;
  companyId: number;
  email: string;
  profile?: string;
  tokenVersion?: number;
}

export interface GenerateTokenOptions {
  expiresIn?: string;
  audience?: string;
  issuer?: string;
}

export interface RefreshTokenPayload extends TokenPayload {
  tokenType: 'refresh';
}

export interface AccessTokenPayload extends TokenPayload {
  tokenType: 'access';
}

export class JWTService {
  private readonly secret: string;
  private readonly algorithm: jwt.Algorithm;
  private readonly defaultAccessTokenExpiration: string;
  private readonly defaultRefreshTokenExpiration: string;

  constructor() {
    this.secret = config.jwt.secret;
    this.algorithm = config.jwt.algorithm as jwt.Algorithm;
    this.defaultAccessTokenExpiration = config.jwt.accessTokenExpiration;
    this.defaultRefreshTokenExpiration = config.jwt.refreshTokenExpiration;
  }

  /**
   * Generate an access token
   */
  generateAccessToken(
    payload: Omit<AccessTokenPayload, 'tokenType' | 'iat' | 'exp'>,
    options?: GenerateTokenOptions
  ): string {
    const tokenPayload: AccessTokenPayload = {
      ...payload,
      tokenType: 'access',
    };

    const signOptions: SignOptions = {
      expiresIn: options?.expiresIn || this.defaultAccessTokenExpiration,
      algorithm: this.algorithm,
      issuer: options?.issuer || 'tucanlink-api-bridge',
      audience: options?.audience || 'tucanlink-modules',
    };

    return jwt.sign(tokenPayload, this.secret, signOptions);
  }

  /**
   * Generate a refresh token
   */
  generateRefreshToken(
    payload: Omit<RefreshTokenPayload, 'tokenType' | 'iat' | 'exp'>,
    options?: GenerateTokenOptions
  ): string {
    const tokenPayload: RefreshTokenPayload = {
      ...payload,
      tokenType: 'refresh',
    };

    const signOptions: SignOptions = {
      expiresIn: options?.expiresIn || this.defaultRefreshTokenExpiration,
      algorithm: this.algorithm,
      issuer: options?.issuer || 'tucanlink-api-bridge',
      audience: options?.audience || 'tucanlink-modules',
    };

    return jwt.sign(tokenPayload, this.secret, signOptions);
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(
    payload: Omit<TokenPayload, 'tokenType' | 'iat' | 'exp'>,
    options?: GenerateTokenOptions
  ): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(payload, options),
      refreshToken: this.generateRefreshToken(payload, options),
    };
  }

  /**
   * Verify a token
   */
  verifyToken<T extends TokenPayload = TokenPayload>(token: string): T {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: [this.algorithm],
        issuer: 'tucanlink-api-bridge',
        audience: 'tucanlink-modules',
      }) as T;

      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const decoded = this.verifyToken<RefreshTokenPayload>(refreshToken);

      // Verify it's a refresh token
      if (decoded.tokenType !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Generate new access token with same payload (excluding token-specific fields)
      const { tokenType, iat, exp, ...payload } = decoded;

      return this.generateAccessToken(payload);
    } catch (error: any) {
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }

  /**
   * Decode a token without verification (useful for getting payload from expired tokens)
   */
  decodeToken<T extends TokenPayload = TokenPayload>(token: string): T | null {
    try {
      const decoded = jwt.decode(token) as T;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Check if a token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Validate token structure and claims
   */
  validateTokenClaims(token: string, expectedClaims?: Partial<TokenPayload>): boolean {
    try {
      const decoded = this.verifyToken(token);

      if (expectedClaims) {
        for (const [key, value] of Object.entries(expectedClaims)) {
          if (decoded[key as keyof TokenPayload] !== value) {
            return false;
          }
        }
      }

      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const jwtService = new JWTService();

// Export for testing purposes
export default JWTService;