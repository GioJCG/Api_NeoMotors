import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || '',
      callbackURL: `${configService.get<string>('API_URL') || 'http://localhost:3000'}/api/v1/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (...args: any[]) => void,
  ): any {
    const user = {
      email: profile.emails?.[0]?.value || `${profile.id}@github.local`,
      nombre: profile.displayName || profile.username,
      provider: 'github',
      providerId: profile.id,
    };
    done(null, user);
  }
}
