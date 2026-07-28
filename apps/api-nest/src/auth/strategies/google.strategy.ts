import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'disabled',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'disabled',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
    if (!process.env.GOOGLE_CLIENT_ID) {
      this.logger.warn('Google OAuth not configured — set GOOGLE_CLIENT_ID to enable');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return done(new Error('Google OAuth not configured'), undefined);
    }
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      name: name?.givenName + ' ' + (name?.familyName || ''),
      picture: photos?.[0]?.value,
      accessToken,
      provider: 'google',
      providerId: profile.id,
    };
    done(null, user);
  }
}
