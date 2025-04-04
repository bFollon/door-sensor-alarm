import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PushoverResponse } from './pushover.model';
import { Either, right, left } from 'fp-ts/lib/Either';
import { format } from 'util';

@Injectable()
export class PushoverService {
  private readonly logger = new Logger(PushoverService.name);

  private readonly pushoverUrl: string;
  private readonly pushoverCancelUrl: string;

  private readonly userKey: string;
  private readonly appToken: string;

  private readonly pushoverPriority: number;
  private readonly pushoverRetry: number;
  private readonly pushoverExpire: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.pushoverUrl = this.configService.get<string>('PUSHOVER_URL', '');
    this.pushoverCancelUrl = this.configService.get<string>(
      'PUSHOVER_CANCEL_URL',
      '',
    );
    this.userKey = this.configService.get<string>('PUSHOVER_USER_KEY', '');
    this.appToken = this.configService.get<string>('PUSHOVER_APP_TOKEN', '');

    this.pushoverPriority = this.configService.get<number>(
      'PUSHOVER_PRIORITY',
      0,
    );
    this.pushoverRetry = this.configService.get<number>('PUSHOVER_RETRY', 30);
    this.pushoverExpire = this.configService.get<number>(
      'PUSHOVER_EXPIRE',
      120,
    );
  }

  async sendNotification(
    message: string,
    title?: string,
  ): Promise<Either<string, PushoverResponse>> {
    const data = new URLSearchParams();
    data.append('user', this.userKey);
    data.append('token', this.appToken);
    data.append('message', message);
    data.append('priority', this.pushoverPriority.toString());
    data.append('retry', this.pushoverRetry.toString());
    data.append('expire', this.pushoverExpire.toString());
    if (title) {
      data.append('title', title);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<PushoverResponse>(
          this.pushoverUrl,
          data.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      return right(response.data);
    } catch (error) {
      this.logger.error('Error sending notification:', error);
      return left('Error sending notification');
    }
  }

  async cancelNotification(receipt: string): Promise<void> {
    const data = new URLSearchParams();
    data.append('user', this.userKey);
    data.append('token', this.appToken);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          format(this.pushoverCancelUrl, receipt),
          data.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      if (response.status === 200) {
        this.logger.log('Notification cancelled successfully');
      } else {
        this.logger.error('Error cancelling notification:', response.status);
      }
    } catch (error) {
      this.logger.error('Error cancelling notification:', error);
    }
  }
}
