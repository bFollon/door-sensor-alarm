import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime, Duration } from 'luxon';
import { PushoverService } from 'src/notifications/pushover.service';
import { Sensor, SensorState } from 'src/sensor/sensor.model';
import { Alarm } from './alarm.model';
import { PushoverResponse } from 'src/notifications/pushover.model';
import { Either, fold } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

@Injectable()
export class AlarmService {
  private readonly logger = new Logger(AlarmService.name);
  private alarms: Map<string, Alarm> = new Map();
  private readonly alarmDelay: Duration;

  constructor(
    private readonly configService: ConfigService,
    private readonly pushoverService: PushoverService,
  ) {
    this.alarmDelay = Duration.fromISO(
      this.configService.get<string>('ALARM_DELAY_ISO_8601', 'PT10M'),
    );
  }

  setAlarm(sensorId: string): void {
    this.clearAlarm(sensorId);

    this.logger.log(
      `Alarm interval is set to ${this.alarmDelay.toFormat('h:m:s')}`,
    );

    const timeout = setTimeout(
      () => void this.triggerAlarm(sensorId),
      this.alarmDelay.toMillis(),
    );
    this.alarms.set(sensorId, Alarm.fromTimeout(timeout));
  }

  clearAlarm(sensorId: string): void {
    const alarm = this.alarms.get(sensorId);
    if (alarm) {
      if (alarm.receipt) {
        void this.pushoverService.cancelNotification(alarm.receipt);
      }
      clearInterval(alarm.timeout);
      this.alarms.delete(sensorId);
    }
  }

  private async triggerAlarm(sensorId: string): Promise<void> {
    const response: Either<string, PushoverResponse> =
      await this.pushoverService.sendNotification(
        `${sensorId} has been open for at least ${this.alarmDelay.toFormat('h:m:s')}`,
        `${sensorId} left open`,
      );

    pipe(
      response,
      fold(
        (error: string) => {
          this.logger.error(`Failed to send notification: ${error}`);
        },
        (res: PushoverResponse) => {
          if (res.receipt) {
            const alarm = this.alarms.get(sensorId);
            if (alarm) {
              alarm.receipt = res.receipt;
              this.alarms.set(sensorId, alarm);
              this.logger.log(`Alarm receipt registered: ${res.receipt}`);
            }
          }
          this.logger.log(`Alarm triggered for sensor: ${sensorId}`);
        },
      ),
    );
  }

  checkAlarm(sensor: Sensor): void {
    if (sensor.state === SensorState.OPEN) {
      if (
        DateTime.fromMillis(sensor.lastUpdated).plus(this.alarmDelay) <
        DateTime.now()
      ) {
        void this.triggerAlarm(sensor._id);
      }
    }
  }
}
