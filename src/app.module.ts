import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AlarmService } from './alarm/alarm.service';
import { DataStoreService } from './data/datastore.service';
import { SensorService } from './sensor/sensor.service';
import { HttpModule } from '@nestjs/axios';
import { PushoverService } from './notifications/pushover.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.secrets.env'],
      isGlobal: true, // Makes the configuration available globally
    }),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AlarmService,
    DataStoreService,
    SensorService,
    PushoverService,
  ],
})
export class AppModule {}
