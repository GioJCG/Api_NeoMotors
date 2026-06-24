import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from './mail.service';
import {
  UserRegisteredEvent,
  ForgotPasswordRequestedEvent,
} from './events/mail.events';

@Injectable()
export class MailListener {
  constructor(private readonly mailService: MailService) {}

  @OnEvent('user.registered')
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    await this.mailService.sendVerificationEmail({
      to: event.email,
      token: event.verificationToken,
    });
  }

  @OnEvent('forgot.password.requested')
  async handleForgotPassword(
    event: ForgotPasswordRequestedEvent,
  ): Promise<void> {
    await this.mailService.sendPasswordResetEmail({
      to: event.email,
      token: event.resetToken,
    });
  }
}
