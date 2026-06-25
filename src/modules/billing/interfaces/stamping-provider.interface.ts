export interface StampingResult {
  xmlTimbrado: string;
  uuid: string;
  fechaTimbrado: Date;
  noCertificadoSAT: string;
  selloSAT: string;
}

export interface CancellationResult {
  acuse: string;
  fechaCancelacion: Date;
  estatus: string;
}

export interface StampingProvider {
  timbrar(
    xml: string,
    csd: { certificadoCer: string; llaveKey: string; password: string },
  ): Promise<StampingResult>;

  cancelar(
    uuid: string,
    csd: { certificadoCer: string; llaveKey: string; password: string },
    motivo: string,
    uuidSustituto?: string,
  ): Promise<CancellationResult>;

  consultarEstatus(uuid: string): Promise<{ estatusSAT: string; estatusCancelacion?: string }>;
}
