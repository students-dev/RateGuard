export class RateGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateGuardError';
  }
}

export class ConfigurationError extends RateGuardError {
  constructor(message: string) {
    super(`[Configuration] ${message}`);
    this.name = 'ConfigurationError';
  }
}