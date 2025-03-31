import { Injectable, Logger } from '@nestjs/common';
import { DataStoreService } from 'src/data/datastore.service';
import { AlarmService } from 'src/service/alarm.service';
import { Sensor, SensorState } from './sensor.model';
import { sensorClassCodec } from '../sensor/sensor.model';
import { Either, fold, right } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

@Injectable()
export class SensorService {
  private readonly logger = new Logger(SensorService.name);

  constructor(
    private readonly dbs: DataStoreService,
    private readonly alarmService: AlarmService,
  ) {
    this.checkAllSensors();
  }

  private checkAllSensors() {
    this.logger.log('Checking all sensors on startup...');

    this.dbs.db.find({}, (err: any, sensors: Sensor[]) => {
      if (err) {
        this.logger.error('Error fetching sensors:', err);
        return;
      }

      sensors.forEach((sensor) => {
        this.logger.log(`Checking sensor: ${sensor._id}`);
        this.alarmService.checkAlarm(sensor);
      });
    });
  }

  private createSensor(sensorId: string): Either<any, Sensor> {
    this.logger.log(
      `Sensor with ID ${sensorId} not found. Automatically creating a new sensor.`,
    );
    const sensor = new Sensor(sensorId, SensorState.OPEN);
    return right(sensor);
  }

  async doorOpened(sensorId: string) {
    const sensorJson = await this.dbs.db.findOneAsync({ _id: sensorId });

    const maybeSensor = sensorJson
      ? sensorClassCodec.decode(sensorJson)
      : this.createSensor(sensorId);

    await pipe(
      maybeSensor,
      fold(
        (errors) => {
          this.logger.error('Failed to decode sensor data:', errors);
          return null;
        },
        async (sensor) => {
          this.alarmService.setAlarm(sensor._id);

          sensor.open();
          const query = { _id: sensor._id };
          const update = sensorClassCodec.encode(sensor);
          const options = { upsert: true };
          try {
            await this.dbs.db.updateAsync(query, update, options);
          } catch (error) {
            this.logger.error('Error updating sensor:', error);
          }
        },
      ),
    );
  }

  async doorClosed(sensorId: string) {
    const sensorJson = await this.dbs.db.findOneAsync({ _id: sensorId });

    if (sensorJson) {
      await pipe(
        sensorClassCodec.decode(sensorJson),
        fold(
          (errors) => {
            this.logger.error('Failed to decode sensor data:', errors);
            return null;
          },
          async (sensor) => {
            this.alarmService.clearAlarm(sensor._id);

            sensor.close();
            const query = { _id: sensor._id };
            const update = sensorClassCodec.encode(sensor);
            const options = { upsert: true };
            try {
              await this.dbs.db.updateAsync(query, update, options);
            } catch (error) {
              this.logger.error('Error updating sensor:', error);
            }
          },
        ),
      );
    } else {
      this.logger.warn(`Sensor with ID ${sensorId} not found.`);
    }
  }
}
