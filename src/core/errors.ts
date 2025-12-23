export class RateGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateGuardError';
  }
}
