import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { StampingProvider, StampingResult, CancellationResult } from '../interfaces/stamping-provider.interface';

@Injectable()
export class SimulatedStampingProvider implements StampingProvider {
  async timbrar(
    xml: string,
    _csd: { certificadoCer: string; llaveKey: string; password: string },
  ): Promise<StampingResult> {
    const uuid = crypto.randomUUID();
    const fechaTimbrado = new Date();
    const fechaStr = fechaTimbrado.toISOString().replace(/\.\d{3}Z/, '-06:00');

    const hash = crypto.createHash('sha256').update(uuid).digest('hex');

    return {
      xmlTimbrado: xml,
      uuid,
      fechaTimbrado,
      noCertificadoSAT: '00001000000500000000',
      selloSAT: hash,
    };
  }

  async cancelar(
    uuid: string,
    _csd: { certificadoCer: string; llaveKey: string; password: string },
    _motivo: string,
    _uuidSustituto?: string,
  ): Promise<CancellationResult> {
    const acuse = `<?xml version="1.0" encoding="UTF-8"?>
<AcuseCancelacion xmlns="http://cancelacfd.sat.gob.mx">
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
