import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../core/database';
import { config } from '../../core/config';
import { logger } from '../../core/logger';
import { RegisterInput, LoginInput, AuthResponse, User } from './auth.types';

const SALT_ROUNDS = 10;

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await db
      .selectFrom('users')
      .select(['id'])
      .where('email', '=', data.email)
      .executeTakeFirst();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const user = await db
      .insertInto('users')
      .values({
        email: data.email,
        password_hash: passwordHash,
        name: data.name,
      })
      .returning(['id', 'email', 'name', 'created_at'])
      .executeTakeFirstOrThrow();

    logger.info(`New user registered: ${user.email}`);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Create session
    await this.createSession(user.id, tokens.accessToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    // Find user
    const user = await db
      .selectFrom('users')
      .select(['id', 'email', 'name', 'password_hash'])
      .where('email', '=', data.email)
      .executeTakeFirst();

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await db
      .updateTable('users')
      .set({ last_login_at: new Date() })
      .where('id', '=', user.id)
      .execute();

    logger.info(`User logged in: ${user.email}`);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Create session
    await this.createSession(user.id, tokens.accessToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tokens,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const user = await db
      .selectFrom('users')
      .select(['id', 'email', 'name', 'created_at', 'last_login_at'])
      .where('id', '=', userId)
      .executeTakeFirst();

    return user || null;
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { userId: string; email: string } {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as any;
      return {
        userId: payload.userId,
        email: payload.email,
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Logout user (invalidate session)
   */
  async logout(userId: string, token: string): Promise<void> {
    const tokenHash = this.hashToken(token);

    await db
      .deleteFrom('user_sessions')
      .where('user_id', '=', userId)
      .where('token_hash', '=', tokenHash)
      .execute();

    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(
    userId: string,
    email: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: string }> {
    const payload = { userId, email };

    const accessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    const refreshToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwtExpiresIn,
    };
  }

  /**
   * Create user session
   */
  private async createSession(userId: string, token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db
      .insertInto('user_sessions')
      .values({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .execute();
  }

  /**
   * Hash token for storage
   */
  private hashToken(token: string): string {
    return bcrypt.hashSync(token, 10);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const result = await db
      .deleteFrom('user_sessions')
      .where('expires_at', '<', new Date())
      .executeTakeFirst();

    if (result.numDeletedRows) {
      logger.info(`Cleaned up ${result.numDeletedRows} expired sessions`);
    }
  }
}

export const authService = new AuthService();
