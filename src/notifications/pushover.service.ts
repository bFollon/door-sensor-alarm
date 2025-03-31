import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PushoverService {
  private readonly pushoverUrl: string;
  private readonly userKey: string;
  private readonly appToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.pushoverUrl = this.configService.get<string>('PUSHOVER_URL', '');
    this.userKey = this.configService.get<string>('PUSHOVER_USER_KEY', '');
    this.appToken = this.configService.get<string>('PUSHOVER_APP_TOKEN', '');
  }

  async sendNotification(message: string, title?: string): Promise<void> {
    const data = new URLSearchParams();
    data.append('user', this.userKey);
    data.append('token', this.appToken);
    data.append('message', message);
    if (title) {
      data.append('title', title);
    }

    try {
      await firstValueFrom(
        this.httpService.post(this.pushoverUrl, data.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}
