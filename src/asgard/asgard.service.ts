import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AsgardAuthService } from './asgard-auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AsgardService {
  private readonly logger = new Logger(AsgardService.name);

  private mapearTipoAto(tipo: string): string {
    const mapa: Record<string, string> = {
      REGISTRO: '62885a43-3b11-4ea0-aaa1-e3840358bc20',
      AVERBACAO: 'cd9ebd1c-1ba0-4323-b2c1-2d44e92321e7',
      MATRICULA: 'd8266ade-0e19-4708-b996-c2eb70ef01f1',
    };

    const id = mapa[tipo];

    if (!id) {
      throw new Error(`[ASGARD] Tipo de ato não mapeado: ${tipo}`);
    }

    return id;
  }

  private normalizarNumeroAto(numeroAto: string | number): string {
    return String(numeroAto)
      .trim()
      .toUpperCase()
      .replace(/^R-/, '')
      .replace(/^AV-/, '')
      .replace(/^R\./, '')
      .replace(/^AV\./, '')
      .replace(/\D/g, '');
  }

  private montarPayloadAtoLegado(params: {
    atoCompletoAsgard: any;
    textoRevisado: string;
    idTipoAto: string;
    asgardMatriculaId: string;
  }): any {
    const { atoCompletoAsgard, textoRevisado, idTipoAto, asgardMatriculaId } =
      params;

    return {
      ...atoCompletoAsgard,

      texto: textoRevisado,

      tipoServico: {
        id: idTipoAto,
      },

      tipo_id: idTipoAto,

      indicadorReal: {
        id: asgardMatriculaId,
      },
    };
  }

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly asgardAuthService: AsgardAuthService,

    @InjectModel('OcrAto')
    private readonly ocrAtoModel: Model<any>,
  ) {}

  private get baseUrl(): string {
    return this.configService.getOrThrow<string>('ASGARD_BASE_URL');
  }

  async testarLogin(): Promise<{
    autenticado: boolean;
    headers: Record<string, string>;
  }> {
    const headers = await this.asgardAuthService.getAuthHeaders();

    return {
      autenticado: true,
      headers,
    };
  }

  async buscarMatricula(numeroMatricula: string | number): Promise<any> {
    const headers = await this.asgardAuthService.getAuthHeaders();

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/api/busca/${numeroMatricula}/`,
        {},
        { headers },
      ),
    );

    const retorno =
      response.data?.retornoAsgard ??
      response.data?.data?.retornoAsgard ??
      response.data;

    return this.extrairMatriculaId(retorno);
  }

  extrairMatriculaId(retorno: any): string {
    if (!Array.isArray(retorno)) {
      console.log('[ASGARD] Retorno recebido:', retorno);

      throw new Error('[ASGARD] Retorno da busca não é um array');
    }

    const matricula = retorno.find((item) => item?.tipo === 'MATRICULA');

    if (!matricula?.id) {
      throw new Error('[ASGARD] ID da matrícula não encontrado');
    }

    return matricula.id;
  }

  async prepararEnvioAtoPorMatricula(
    numeroMatricula: string | number,
    numeroAto: string | number,
  ) {
    const asgardMatriculaId = await this.buscarMatricula(numeroMatricula);

    const atosRegistrados = await this.buscarAtosRegistrados(asgardMatriculaId);

    const atoAsgard = this.extrairAtoAsgardPorCodigo(
      atosRegistrados,
      numeroAto,
    );

    const ocrAto = await this.ocrAtoModel
      .findOne({
        matricula: String(numeroMatricula),
        numero_ato: String(numeroAto),
      })
      .lean();

    if (!ocrAto) {
      throw new Error(
        `[OCR] Nenhum ato encontrado no Mongo para a matrícula ${numeroMatricula}`,
      );
    }

    const id_tipo_ato = this.mapearTipoAto(ocrAto.tipo);

    const protocoloId =
      atoAsgard.protocolo_id ??
      atoAsgard.protocoloId ??
      atoAsgard.protocolo?.id ??
      null;

    const atoId = atoAsgard.id_ato ?? atoAsgard.ato_id ?? atoAsgard.id;

    if (!atoId) {
      throw new Error('[ASGARD] ID do ato não encontrado no atoAsgard');
    }

    const atoCompletoAsgard = await this.buscarDadosCompletosAto({
      protocoloId,
      atoId,
    });

    return {
      matricula: String(numeroMatricula),
      numeroAto: String(numeroAto),

      asgardMatriculaId,

      protocoloId,
      asgardAtoId: atoAsgard.id,

      atoAsgard,
      atoCompletoAsgard,

      ocrAtoId: ocrAto._id,
      textoRevisado: ocrAto.texto_revisado,

      tipo: ocrAto.tipo,
      id_tipo_ato: id_tipo_ato,
    };
  }

  async buscarDadosCompletosAto(params: {
    protocoloId: string | null;
    atoId: string;
  }): Promise<any> {
    const headers = await this.asgardAuthService.getAuthHeaders();

    const protocoloIdParam = params.protocoloId || 'null';

    const response = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/api/protocolo/${protocoloIdParam}/ato/${params.atoId}`,
        { headers },
      ),
    );

    return response.data;
  }

  async buscarAtosRegistrados(matriculaId: string): Promise<any[]> {
    const headers = await this.asgardAuthService.getAuthHeaders();

    const response = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/api/indicador-real/${matriculaId}/atos-registrados`,
        { headers },
      ),
    );

    if (!Array.isArray(response.data)) {
      throw new Error('[ASGARD] Retorno de atos registrados não é um array');
    }

    return response.data;
  }

  async buscarAtoLegado(asgardAtoId: string): Promise<any> {
    const headers = await this.asgardAuthService.getAuthHeaders();

    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/api/ato-legado/${asgardAtoId}`, {
        headers,
      }),
    );

    return response.data;
  }

  async atualizarTextoAtoLegado(params: {
    asgardAtoId: string;
    textoRevisado: string;
    idTipoAto: string;
    asgardMatriculaId: string;
  }) {
    const headers = await this.asgardAuthService.getAuthHeaders();

    const atoLegadoCompleto = await this.buscarAtoLegado(params.asgardAtoId);

    const payload = this.montarPayloadAtoLegado({
      atoCompletoAsgard: atoLegadoCompleto,
      textoRevisado: params.textoRevisado,
      idTipoAto: params.idTipoAto,
      asgardMatriculaId: params.asgardMatriculaId,
    });

    console.log(payload);

    const response = await firstValueFrom(
      this.httpService.put(
        `${this.baseUrl}/api/ato-legado/${params.asgardAtoId}`,
        payload,
        { headers },
      ),
    );

    return response.data;
  }

  extrairAtoAsgardPorCodigo(atos: any[], numeroAto: string | number): any {
    const numeroAtoNormalizado = this.normalizarNumeroAto(numeroAto);
    const ato = atos.find(
      (item) => String(item.codigo) === numeroAtoNormalizado,
    );

    if (!ato) {
      throw new Error(
        `[ASGARD] Ato código ${numeroAto} não encontrado na matrícula`,
      );
    }

    return ato;
  }

  async prepararEnvioAto(params: {
    numeroMatricula: string | number;
    numeroAto: string | number;
  }) {
    const { numeroMatricula, numeroAto } = params;

    const asgardMatriculaId = await this.buscarMatricula(numeroMatricula);

    const atosRegistrados = await this.buscarAtosRegistrados(asgardMatriculaId);

    const ocrAto = await this.ocrAtoModel
      .findOne({
        matricula: String(numeroMatricula),
        numero_ato: String(numeroAto),
      })
      .lean();

    if (!ocrAto) {
      throw new Error(
        `[OCR] Nenhum ato encontrado para matrícula ${numeroMatricula} e ato ${numeroAto}`,
      );
    }

    const atoAsgardResumo = this.extrairAtoAsgardPorCodigo(
      atosRegistrados,
      ocrAto.numero_ato,
    );

    const atoLegadoCompleto = await this.buscarAtoLegado(atoAsgardResumo.id);

    return {
      matricula: String(numeroMatricula),
      numeroAto: String(numeroAto),

      asgardMatriculaId,
      asgardAtoId: atoAsgardResumo.id,

      ocrAtoId: ocrAto._id,
      textoRevisado: ocrAto.texto_revisao,
      tipo: ocrAto.tipo,

      atoAsgardResumo,
      atoLegadoCompleto,
    };
  }

  async enviarAtoRevisadoParaAsgard(params: {
    numeroMatricula: string | number;
    numeroAto: string | number;
  }) {
    const { numeroMatricula, numeroAto } = params;

    const asgardMatriculaId = await this.buscarMatricula(numeroMatricula);

    const atosRegistrados = await this.buscarAtosRegistrados(asgardMatriculaId);

    const atoAsgard = this.extrairAtoAsgardPorCodigo(
      atosRegistrados,
      numeroAto,
    );

    const ocrAto = await this.ocrAtoModel
      .findOne({
        matricula: String(numeroMatricula),
        numero_ato: String(numeroAto),
      })
      .lean();

    if (!ocrAto) {
      throw new Error(
        `[OCR] Nenhum ato encontrado para matrícula ${numeroMatricula} e ato ${numeroAto}`,
      );
    }

    if (!ocrAto.texto_revisado) {
      throw new Error(`[OCR] Ato encontrado, mas sem texto revisado.`);
    }

    const protocoloId =
      atoAsgard.protocolo_id ??
      atoAsgard.protocoloId ??
      atoAsgard.protocolo?.id ??
      null;

    const atoId = atoAsgard.id_ato ?? atoAsgard.ato_id ?? atoAsgard.id;

    if (!atoId) {
      throw new Error('[ASGARD] ID do ato não encontrado.');
    }

    const atoCompletoAsgard = await this.buscarDadosCompletosAto({
      protocoloId,
      atoId,
    });

    const idTipoAto = this.mapearTipoAto(ocrAto.tipo);

    const payload = this.montarPayloadAtoLegado({
      atoCompletoAsgard,
      textoRevisado: ocrAto.texto_revisado,
      idTipoAto,
      asgardMatriculaId,
    });

    const retornoAsgard = await this.enviarAtoLegado({
      atoId,
      payload,
    });

    return {
      sucesso: true,
      mensagem: 'Ato revisado enviado para o Asgard com sucesso.',
      matricula: String(numeroMatricula),
      numeroAto: String(numeroAto),
      asgardMatriculaId,
      asgardAtoId: atoId,
      ocrAtoId: ocrAto._id,
      tipo: ocrAto.tipo,
      id_tipo_ato: idTipoAto,
      retornoAsgard,
    };
  }

  async enviarAtoLegado(params: { atoId: string; payload: any }) {
    const headers = await this.asgardAuthService.getAuthHeaders();

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/api/ato-legado/${params.atoId}`,
        params.payload,
        { headers },
      ),
    );

    return response.data;
  }

  async enviarTextoAto(params: {
    atoId: string | number;
    texto: string;
  }): Promise<any> {
    const headers = await this.asgardAuthService.getAuthHeaders();

    this.logger.log(`[ASGARD] Enviando texto do ato ${params.atoId}...`);

    try {
      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.baseUrl}/atos/${params.atoId}`,
          {
            texto: params.texto,
          },
          {
            headers,
            withCredentials: true,
          },
        ),
      );

      this.logger.log(
        `[ASGARD] Texto do ato ${params.atoId} enviado com sucesso.`,
      );

      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      this.logger.error(
        `[ASGARD] Erro ao enviar ato ${params.atoId}. Status: ${status}`,
      );

      this.logger.error(JSON.stringify(data || error.message));

      if (status === 401 || status === 419) {
        await this.asgardAuthService.limparSessao();
      }

      throw error;
    }
  }
}
