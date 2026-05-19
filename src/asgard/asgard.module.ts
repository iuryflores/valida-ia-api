import { Module } from '@nestjs/common';
import { AsgardAuthService } from './asgard-auth.service';
import { AsgardService } from './asgard.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AsgardController } from './asgard.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OcrAtoSchema } from 'src/ocr/schemas/ocr-ato.schema';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    MongooseModule.forFeature([{ name: 'OcrAto', schema: OcrAtoSchema }]),
  ],
  controllers: [AsgardController],
  providers: [AsgardAuthService, AsgardService],
  exports: [AsgardAuthService, AsgardService],
})
export class AsgardModule {}
