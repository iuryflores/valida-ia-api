import { Injectable } from '@nestjs/common';
import { createWorker } from 'tesseract.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as pdfPoppler from 'pdf-poppler';
import { extrairAtosDaPagina } from './utils/extrair-atos.util';
import { extrairIdentificacao } from './utils/extrair-matricula.util';
import { normalizarTextoOCR } from './utils/normalizar-texto.util';
import { OCRResult } from './types/ocr-result.type';
import { unificarAtosEntrePaginas } from './utils/unificar-atos-entre-paginas.util';
import { corrigirDatas } from './utils/corrigir-datas.util';
import { extrairMatriculaDoCNM } from './utils/extrair-matricula-cnm.util';
import { OcrPersistenciaService } from './ocr-persistencia.service';

@Injectable()
export class OcrService {
  private readonly tempDir = path.join(process.cwd(), 'tmp', 'ocr');
  constructor(
    private readonly ocrPersistenciaService: OcrPersistenciaService,
  ) {}
  async processPdf(file: Express.Multer.File): Promise<OCRResult> {
    const jobId = crypto.randomUUID();
    const jobDir = path.join(this.tempDir, jobId);
    const pdfPath = path.join(jobDir, 'original.pdf');
    const outputPrefix = path.join(jobDir, 'page');

    await fs.mkdir(jobDir, { recursive: true });
    await fs.writeFile(pdfPath, file.buffer);

    await pdfPoppler.convert(pdfPath, {
      format: 'png',
      out_dir: jobDir,
      out_prefix: 'page',
      page: null,
      scale: 4096,
    });

    const files = await fs.readdir(jobDir);

    const imageFiles = files
      .filter((fileName) => fileName.endsWith('.png'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const worker = await createWorker('por');

    const paginas: { pagina: number; texto: string; confianca: number }[] = [];

    for (let index = 0; index < imageFiles.length; index++) {
      const imagePath = path.join(jobDir, imageFiles[index]);

      const result = await worker.recognize(imagePath);

      const textoNormalizado = normalizarTextoOCR(result.data.text);

      const textoCorrigido = corrigirDatas(textoNormalizado);

      paginas.push({
        pagina: index + 1,
        texto: textoCorrigido,
        confianca: result.data.confidence,
      });
    }

    await worker.terminate();

    const atosExtraidos = paginas.flatMap((pagina) =>
      extrairAtosDaPagina(pagina.texto, pagina.pagina, pagina.confianca),
    );

    const atos = unificarAtosEntrePaginas(atosExtraidos);

    const textoCompleto = paginas.map((p) => p.texto).join('\n');

    const identificacao = extrairIdentificacao(textoCompleto);

    if (!identificacao.matricula) {
      identificacao.matricula = extrairMatriculaDoCNM(identificacao.cnm);
    }

    const resultado: OCRResult = {
      jobId,
      identificacao,
      totalPaginas: paginas.length,
      totalAtos: atos.length,
      paginas,
      atos,
    };

    await this.ocrPersistenciaService.salvarResultado(
      resultado,
      file.originalname,
    );

    return resultado;
  }
}
