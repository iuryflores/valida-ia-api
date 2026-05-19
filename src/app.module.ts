import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OcrModule } from './ocr/ocr.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { AsgardModule } from './asgard/asgard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URI'),
      }),
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configSerice: ConfigService) => ({
        connection: {
          host: configSerice.get<string>('REDIS_HOST') ?? '127.0.0.1',
          port: Number(configSerice.get<string>('REDIS_PORT') ?? 6379),
        },
      }),
    }),

    OcrModule,
    AsgardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
