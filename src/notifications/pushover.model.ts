import * as t from 'io-ts';
import { fold } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';

class PushoverResponse {
  status: number;
  request: string;
  receipt?: string;

  constructor(status: number, request: string, receipt?: string) {
    this.status = status;
    this.request = request;
    this.receipt = receipt;
  }
}

const pushoverResponseCodec = t.type({
  status: t.number,
  request: t.string,
  receipt: t.union([t.string, t.undefined]),
});

type PushoverResponseCodecType = t.TypeOf<typeof pushoverResponseCodec>;

const pushoverResponseClassCodec = new t.Type<
  PushoverResponse,
  t.OutputOf<typeof pushoverResponseCodec>,
  unknown
>(
  'PushoverResponseClass',
  (input): input is PushoverResponse => input instanceof PushoverResponse,
  (input, context) =>
    pipe(
      pushoverResponseCodec.decode(input),
      fold(
        () => t.failure(input, context),
        (validated: PushoverResponseCodecType) =>
          t.success(
            new PushoverResponse(
              validated.status,
              validated.request,
              validated.receipt,
            ),
          ),
      ),
    ),
  (response) => ({
    status: response.status,
    request: response.request,
    receipt: response.receipt,
  }),
);

export { PushoverResponse, pushoverResponseCodec, pushoverResponseClassCodec };
