import { Processor, WorkerHost } from '@nestjs/bullmq';

import { OcrPersistenciaService } from './ocr-persistencia.service';
import { OcrIaService } from './ocr-ia.service';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('ocr-ia')
export class OcrIaProcessor extends WorkerHost {
  private readonly logger = new Logger(OcrIaProcessor.name);
  constructor(
    private readonly ocrPersistenciaService: OcrPersistenciaService,
    private readonly ocrIaService: OcrIaService,
  ) {
    super();
  }

  async process(job: Job) {
    const { atoId } = job.data;
    const start = Date.now();

    this.logger.log(`🔥 IA recebendo job ato ${atoId}`);

    try {
      const ato = await this.ocrPersistenciaService.buscarAtoPorId(atoId);

      if (!ato) return;

      const revisao = await this.ocrIaService.revisarTextoAto({
        numero_ato: ato.numero_ato,
        tipo: ato.tipo,
        texto: ato.texto,
      });

      await this.ocrPersistenciaService.salvarRevisaoIA(atoId, revisao);

      const duration = Date.now() - start;

      this.logger.log({
        message: '✅ IA finalizou',
        atoId,
        numero_ato: ato.numero_ato,
        duration: `${duration}ms`,
      });
    } catch (error: any) {
      const duration = Date.now() - start;

      this.logger.error(
        `❌ Erro na IA ato ${atoId} após ${duration}ms`,
        error.stack,
      );
      throw error;
    }
  }
}
