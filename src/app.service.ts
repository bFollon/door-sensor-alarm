import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlarmService } from './service/alarm.service'; // Import AlarmService
import { DataStoreService } from './data/datastore.service';

@Injectable()
export class AppService {
  constructor(
    private configService: ConfigService,
    private readonly alarmService: AlarmService,
    private readonly dbs: DataStoreService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }
}
