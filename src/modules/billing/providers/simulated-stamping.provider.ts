import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { StampingProvider, StampingResult, CancellationResult } from '../interfaces/stamping-provider.interface';

@Injectable()
export class SimulatedStampingProvider implements StampingProvider {
  async timbrar(
    xml: string,
    _csd: { certificadoCer: string; llaveKey: string; password: string },
  ): Promise<StampingResult> {
    const uuid = [
      crypto.randomUUID().substring(0, 8),
      crypto.randomUUID().substring(0, 4),
      '4' + crypto.randomUUID().substring(0, 3),
      '8' + crypto.randomUUID().substring(0, 3),
      crypto.randomBytes(6).toString('hex'),
    ].join('-').toUpperCase();

    const fechaTimbrado = new Date();
    const seed = `${uuid}|${fechaTimbrado.toISOString()}|SIMULATED_PAC|${_csd.certificadoCer.substring(0, 20)}`;
    const selloSAT = crypto.createHash('sha512').update(seed).digest('hex');

    return {
      xmlTimbrado: xml,
      uuid,
      fechaTimbrado,
      noCertificadoSAT: '00001000000500000000',
      selloSAT: selloSAT.toUpperCase(),
    };
  }

  async cancelar(
    uuid: string,
    _csd: { certificadoCer: string; llaveKey: string; password: string },
    _motivo: string,
    _uuidSustituto?: string,
  ): Promise<CancellationResult> {
    const folioCancelacion = crypto.randomBytes(12).toString('hex').toUpperCase();
    const acuse = `<?xml version="1.0" encoding="UTF-8"?>
<AcuseCancelacion xmlns="http://cancelacfd.sat.gob.mx" Fecha="${new Date().toISOString()}" RfcEmisor="SIMULATED">
  <FolioCancelacion>${folioCancelacion}</FolioCancelacion>
  <UUID>${uuid}</UUID>
  <Estatus>Cancelado</Estatus>
</AcuseCancelacion>`;

    return {
      acuse,
      fechaCancelacion: new Date(),
      estatus: 'Cancelado',
    };
  }

  async consultarEstatus(uuid: string): Promise<{ estatusSAT: string; estatusCancelacion?: string }> {
    return {
      estatusSAT: 'Vigente',
      estatusCancelacion: undefined,
    };
  }
}
