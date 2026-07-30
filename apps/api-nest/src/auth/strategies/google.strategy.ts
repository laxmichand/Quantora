import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);
  private readonly configured: boolean;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

    super({
      clientID: clientId || 'placeholder',
      clientSecret: clientSecret || 'placeholder',
      callbackURL: callbackUrl,
      scope: ['email', 'profile'],
    });

    this.configured = !!(clientId && clientSecret);

    if (!this.configured) {
      this.logger.warn(
        'Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET',
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    if (!this.configured) {
      return done(new Error('Google OAuth not configured on this server'), undefined);
    }
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      name: (name?.givenName || '') + ' ' + (name?.familyName || ''),
      picture: photos?.[0]?.value,
      accessToken,
      provider: 'google',
      providerId: profile.id,
    };
    done(null, user);
  }
}
