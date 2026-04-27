import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OcrJob } from './schemas/ocr-job.schema';
import { OcrAto } from './schemas/ocr-ato.schema';
import { OCRResult } from './types/ocr-result.type';
import { precisaRevisaoIA } from './utils/precisa-revisao-ia.util';
import { removerAssinaturaFinal } from './utils/remover-assinatura.utils';

@Injectable()
export class OcrPersistenciaService {
  constructor(
    @InjectModel(OcrJob.name)
    private readonly ocrJobModel: Model<OcrJob>,

    @InjectModel(OcrAto.name)
    private readonly ocrAtoModel: Model<OcrAto>,
  ) {}

  async salvarResultado(
    resultado: OCRResult,
    nomeArquivo?: string,
  ): Promise<void> {
    const { jobId, identificacao, totalPaginas, totalAtos, atos } = resultado;

    await this.ocrJobModel.updateOne(
      { jobId },
      {
        $set: {
          jobId,
          matricula: identificacao.matricula,
          cnm: identificacao.cnm,
          totalPaginas,
          totalAtos,
          status: 'PROCESSADO',
          nomeArquivo: nomeArquivo ?? null,
          erro: null,
        },
      },
      { upsert: true },
    );

    if (!atos.length) return;

    const operations = atos.map((ato) => ({
      updateOne: {
        filter: {
          jobId,
          numero_ato: ato.numero_ato,
        },
        update: {
          $set: {
            jobId,
            matricula: identificacao.matricula,
            cnm: identificacao.cnm,
            numero_ato: ato.numero_ato,
            tipo: ato.tipo,
            texto: ato.texto,
            pagina_inicio: ato.pagina_inicio,
            confianca_ocr: ato.confianca_ocr,
            marcador_original: ato.marcador_original,
            status: precisaRevisaoIA(ato) ? 'PENDENTE_IA' : 'EXTRAIDO',
          },
        },
        upsert: true,
      },
    }));

    await this.ocrAtoModel.bulkWrite(operations);
  }

  async salvarErro(jobId: string, erro: unknown, nomeArquivo?: string) {
    await this.ocrJobModel.updateOne(
      { jobId },
      {
        $set: {
          jobId,
          status: 'ERRO',
          nomeArquivo: nomeArquivo ?? null,
          erro: erro instanceof Error ? erro.message : String(erro),
        },
      },
      { upsert: true },
    );
  }

  async buscarJob(jobId: string) {
    return this.ocrJobModel.findOne({ jobId }).lean();
  }

  async buscarAtosPorJob(jobId: string) {
    return this.ocrAtoModel
      .find({ jobId })
      .sort({ pagina_inicio: 1, numero_ato: 1 })
      .lean();
  }

  async buscarPorMatricula(matricula: string) {
    const job = await this.ocrJobModel
      .findOne({ matricula })
      .sort({ createdAt: -1 })
      .lean();

    if (!job) return null;

    const atos = await this.buscarAtosPorJob(job.jobId);

    return {
      job,
      atos,
    };
  }

  async buscarAtosPendentesIA(limit = 20) {
    return this.ocrAtoModel
      .find({ status: 'PENDENTE_IA' })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
  }

  async buscarAtoPorId(id: string) {
    return this.ocrAtoModel.findById(id).lean();
  }

  async salvarRevisaoIA(
    id: string,
    revisao: {
      texto_revisado: string;
      houve_correcao: boolean;
      observacoes: string[];
      alertas_ia: {
        tipo:
          | 'CPF_INCOMPLETO'
          | 'CNPJ_INCOMPLETO'
          | 'CGC_INCOMPLETO'
          | 'DOCUMENTO_SUSPEITO';
        valor_detectado: string;
        descricao: string;
      }[];
    },
  ) {
    return this.ocrAtoModel.findByIdAndUpdate(
      id,
      {
        $set: {
          texto_revisado: removerAssinaturaFinal(revisao.texto_revisado),
          houve_correcao_ia: revisao.houve_correcao,
          observacoes_ia: revisao.observacoes,
          status: 'REVISADO_IA',
          alertas_ia: revisao.alertas_ia ?? [],
        },
      },
      { returnDocument: 'after' },
    );
  }
}
