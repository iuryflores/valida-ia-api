import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AsgardAuthService {
  private readonly logger = new Logger(AsgardAuthService.name);

  private sessionToken: string | null = null;
  private sessionExpiresAt: number | null = null;

  private readonly SESSION_DURATION_MS = 30 * 60 * 1000;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getAsgardSession(): Promise<string> {
    if (this.isSessionValid()) {
      this.logger.log('[ASGARD AUTH] Sessão válida reutilizada.');
      return this.sessionToken!;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.loginUrl, this.loginPayload, {
          headers: this.loginHeaders,
        }),
      );

      const rawCookie = response.headers['set-cookie']?.[0];

      if (!rawCookie) {
        throw new Error("Cabeçalho 'set-cookie' ausente.");
      }

      this.sessionToken = this.extractSessionToken(rawCookie);
      this.sessionExpiresAt = Date.now() + this.SESSION_DURATION_MS;

      this.logger.log(
        `[ASGARD AUTH] Sessão obtida: ${this.sessionToken.split('=')[0]}`,
      );

      return this.sessionToken;
    } catch (error) {
      this.logger.error('[ASGARD AUTH] Erro ao obter sessão Asgard.');
      throw new Error('Falha ao autenticar na API Asgard.');
    }
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await this.getAsgardSession();

    return {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      Cookie: session,
    };
  }

  async limparSessao(): Promise<void> {
    this.sessionToken = null;
    this.sessionExpiresAt = null;
  }

  private isSessionValid(): boolean {
    return (
      this.sessionToken !== null &&
      this.sessionExpiresAt !== null &&
      Date.now() < this.sessionExpiresAt
    );
  }

  private extractSessionToken(cookie: string): string {
    const token = cookie.split(';')[0];
    const [name, value] = token.split('=');

    if (!name || !value) {
      throw new Error('Formato de token inválido.');
    }

    return token; // retorna "SESSION=TOKEN"
  }

  private get baseUrl(): string {
    return this.configService.getOrThrow<string>('ASGARD_BASE_URL');
  }

  private get loginUrl(): string {
    return `${this.baseUrl}/login`;
  }

  private get loginPayload(): string {
    const username = this.configService.getOrThrow<string>('ASGARD_USERNAME');
    const password = this.configService.getOrThrow<string>('ASGARD_PASSWORD');

    return `username=${username}&password=${password}`;
  }

  private get loginHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }
}
