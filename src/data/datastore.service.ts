import { Injectable } from '@nestjs/common';
import Datastore from '@seald-io/nedb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DataStoreService {
  readonly db: Datastore;

  constructor(private configService: ConfigService) {
    const databasePath = this.configService.get<string>('DATABASE_PATH');
    const autocompactionInterval = this.configService.get<number>(
      'AUTOCOMPACTION_INTERVAL',
      86400000,
    );

    this.db = new Datastore({ filename: databasePath, autoload: true });
    this.db.setAutocompactionInterval(autocompactionInterval);
  }
}
