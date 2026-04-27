import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';
import type { Express } from 'express';
import { OcrPersistenciaService } from './ocr-persistencia.service';
import { OcrIaService } from './ocr-ia.service';
import { normalizarDocumentosOCR } from './utils/corrigir-cpj-cnpj.util';

@Controller('ocr')
export class OcrController {
  constructor(
    private readonly ocrService: OcrService,
    private readonly ocrPersistenciaService: OcrPersistenciaService,
    private readonly ocrIaService: OcrIaService,
  ) {}

  @Post('pdf')
  @UseInterceptors(FileInterceptor('file'))
  async processPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('PDF não enviado.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Envie apenas arquivo PDF.');
    }

    return this.ocrService.processPdf(file);
  }

  @Get('job/:jobId')
  async buscarJob(@Param('jobId') jobId: string) {
    return this.ocrPersistenciaService.buscarJob(jobId);
  }

  @Get('job/:jobId/atos')
  async buscarAtosPorJob(@Param('jobId') jobId: string) {
    return this.ocrPersistenciaService.buscarAtosPorJob(jobId);
  }

  @Get('matricula/:matricula')
  async buscarPorMatricula(@Param('matricula') matricula: string) {
    return this.ocrPersistenciaService.buscarPorMatricula(matricula);
  }

  @Get('atos/pendentes-ia')
  async buscarAtosPendentesIA(@Query('limit') limit?: string) {
    return this.ocrPersistenciaService.buscarAtosPendentesIA(
      limit ? Number(limit) : 20,
    );
  }

  @Post('atos/:id/revisar-ia')
  async revisarAtoIA(@Param('id') id: string) {
    const ato = await this.ocrPersistenciaService.buscarAtoPorId(id);

    if (!ato) {
      throw new NotFoundException('Ato não encontrado.');
    }

    const textoParaIA = normalizarDocumentosOCR(ato.texto);

    const revisao = await this.ocrIaService.revisarTextoAto({
      numero_ato: ato.numero_ato,
      tipo: ato.tipo,
      texto: textoParaIA,
    });

    return this.ocrPersistenciaService.salvarRevisaoIA(id, revisao);
  }
}
