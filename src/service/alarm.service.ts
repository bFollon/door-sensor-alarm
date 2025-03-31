import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime, Duration } from 'luxon';
import { PushoverService } from 'src/notifications/pushover.service';
import { Sensor, SensorState } from 'src/sensor/sensor.model';

@Injectable()
export class AlarmService {
  private readonly logger = new Logger(AlarmService.name);
  private alarms: Map<string, NodeJS.Timeout> = new Map();
  private readonly alarmDelay: Duration;

  constructor(
    private readonly configService: ConfigService,
    private readonly pushoverService: PushoverService,
  ) {
    this.alarmDelay = Duration.fromObject({
      seconds: this.configService.get<number>('ALARM_DELAY_MINUTES', 10),
    });
  }

  setAlarm(sensorId: string): void {
    this.clearAlarm(sensorId);

    this.logger.log(
      `Alarm interval is set to ${this.alarmDelay.toFormat('m:s')}`,
    );

    const timeout = setTimeout(
      () => this.triggerAlarm(sensorId),
      this.alarmDelay.toMillis(),
    );
    this.alarms.set(sensorId, timeout);
  }

  clearAlarm(sensorId: string): void {
    const timeout = this.alarms.get(sensorId);
    if (timeout) {
      clearInterval(timeout);
      this.alarms.delete(sensorId);
    }
  }

  private triggerAlarm(sensorId: string): void {
    this.pushoverService
      .sendNotification(
        `Alarm triggered for sensor: ${sensorId}`,
        'Door Sensor Alarm',
      )
      .catch((error) => {
        this.logger.error('Error sending alarm notification:', error);
      });
    this.logger.log(`Alarm triggered for sensor: ${sensorId}`);
  }

  checkAlarm(sensor: Sensor): void {
    if (sensor.state === SensorState.OPEN) {
      if (
        DateTime.fromMillis(sensor.lastUpdated).plus(this.alarmDelay) <
        DateTime.now()
      ) {
        this.triggerAlarm(sensor._id);
      }
    }
  }
}
