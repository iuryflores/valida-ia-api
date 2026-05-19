import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AsgardService } from './asgard.service';

@Controller('asgard')
export class AsgardController {
  constructor(private readonly asgardService: AsgardService) {}

  @Post('teste-envio-ato')
  async testeEnvioAto(@Body() body: { atoId: string; texto: string }) {
    return this.asgardService.enviarTextoAto({
      atoId: body.atoId,
      texto: body.texto,
    });
  }

  @Get('teste-busca/:matricula')
  async testarBusca(@Param('matricula') matricula: string) {
    const result = await this.asgardService.buscarMatricula(matricula);

    return {
      sucesso: true,
      matricula,
      retornoAsgard: result,
    };
  }

  @Get('preparar-envio/:matricula/:numeroAto')
  async prepararEnvio(
    @Param('matricula') matricula: string,
    @Param('numeroAto') numeroAto: string,
  ) {
    return this.asgardService.prepararEnvioAtoPorMatricula(
      matricula,
      numeroAto,
    );
  }

  @Post('enviar-ato/:matricula/:numeroAto')
  async enviarAto(
    @Param('matricula') matricula: string,
    @Param('numeroAto') numeroAto: string,
  ) {
    return this.asgardService.enviarAtoRevisadoParaAsgard({
      numeroMatricula: matricula,
      numeroAto,
    });
  }
}
