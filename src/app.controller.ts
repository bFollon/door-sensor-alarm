import { Controller, Get, Post, Param, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { SensorService } from './sensor/sensor.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly sensorService: SensorService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/door-opened/:sensorId')
  async doorOpened(@Param('sensorId') sensorId: string): Promise<string> {
    this.logger.log(`Door opened event received for sensor ID: ${sensorId}`);
    await this.sensorService.doorOpened(sensorId);
    return `Door opened for sensor ID: ${sensorId}`;
  }

  @Post('/door-closed/:sensorId')
  async doorClosed(@Param('sensorId') sensorId: string): Promise<string> {
    this.logger.log(`Door closed event received for sensor ID: ${sensorId}`);
    await this.sensorService.doorClosed(sensorId);
    return `Door closed for sensor ID: ${sensorId}`;
  }
}
