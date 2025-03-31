import * as t from 'io-ts';
import { fold } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

enum SensorState {
  OPEN = 'open',
  CLOSED = 'closed',
}

const sensorStateCodec = t.union([
  t.literal(SensorState.OPEN),
  t.literal(SensorState.CLOSED),
]);

class Sensor {
  _id: string;
  state: SensorState;
  lastUpdated: number;

  constructor(
    _id: string,
    state: SensorState,
    lastUpdated: number = Date.now(),
  ) {
    this._id = _id;
    this.state = state;
    this.lastUpdated = lastUpdated;
  }

  private updateState(newState: SensorState): void {
    this.state = newState;
    this.lastUpdated = Date.now();
  }

  open(): void {
    this.updateState(SensorState.OPEN);
  }

  close(): void {
    this.updateState(SensorState.CLOSED);
  }
}

const sensorCodec = t.type({
  _id: t.string,
  state: sensorStateCodec,
  lastUpdated: t.number,
});

type SensorCodecType = t.TypeOf<typeof sensorCodec>;

const sensorClassCodec = new t.Type<
  Sensor,
  t.OutputOf<typeof sensorCodec>,
  unknown
>(
  'SensorClass',
  (input): input is Sensor => input instanceof Sensor,
  (input, context) =>
    pipe(
      sensorCodec.validate(input, context),
      fold(
        () => t.failure(input, context),
        (validated: SensorCodecType) =>
          t.success(
            new Sensor(validated._id, validated.state, validated.lastUpdated),
          ),
      ),
    ),
  (sensor) => ({ ...sensor }),
);

export { Sensor, sensorCodec, sensorClassCodec, SensorState, sensorStateCodec };
