import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: `${configService.get<string>('API_URL') || 'http://localhost:3000'}/api/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (...args: any[]) => void,
  ): any {
    const { name, emails } = profile;
    const user = {
      email: emails?.[0]?.value,
      nombre: name?.givenName
        ? `${name.givenName} ${name.familyName || ''}`.trim()
        : profile.displayName,
      provider: 'google',
      providerId: profile.id,
    };
    done(null, user);
  }
}
