import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as BaseMicrosoftStrategy } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(BaseMicrosoftStrategy, 'microsoft') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('MICROSOFT_CLIENT_ID') || '',
      clientSecret: configService.get<string>('MICROSOFT_CLIENT_SECRET') || '',
      callbackURL: `${configService.get<string>('API_URL') || 'http://localhost:3000'}/api/v1/auth/microsoft/callback`,
      scope: ['user.read', 'email', 'openid', 'profile'],
      tenant: 'common',
    });
  }

  validate(accessToken: string, refreshToken: string, profile: any, done: (...args: any[]) => void): any {
    const { name, emails, displayName } = profile;
    const user = {
      email: emails?.[0]?.value || `${profile.id}@microsoft.local`,
      nombre: name?.givenName ? `${name.givenName} ${name.familyName || ''}`.trim() : displayName || profile.id,
      provider: 'microsoft',
      providerId: profile.id,
    };
    done(null, user);
  }
}
