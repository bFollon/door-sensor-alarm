export class Alarm {
  constructor(
    public timeout: NodeJS.Timeout,
    public receipt?: string,
  ) {}

  static fromTimeout(timeout: NodeJS.Timeout): Alarm {
    return new Alarm(timeout, undefined);
  }
}
