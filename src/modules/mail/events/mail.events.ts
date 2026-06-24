export class UserRegisteredEvent {
  constructor(
    public readonly email: string,
    public readonly verificationToken: string,
  ) {}
}

export class ForgotPasswordRequestedEvent {
  constructor(
    public readonly email: string,
    public readonly resetToken: string,
  ) {}
}
