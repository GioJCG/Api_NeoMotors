export interface EmisorData {
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  codigoPostalFiscal: string;
  certificadoCer?: string;
  numeroCertificado?: string;
}

export interface ReceptorData {
  rfc: string;
  nombre: string;
  domicilioFiscalReceptor: string;
  regimenFiscalReceptor: string;
  usoCfdi: string;
}

export interface ConceptoData {
  cantidad: number;
  claveProdServ: string;
  claveUnidad: string;
  unidad: string;
  noIdentificacion?: string;
  descripcion: string;
  precioUnitario: number;
  importe: number;
  descuento: number;
  iva: number;
  objetoImp: string;
  base: number;
}

export interface XmlBuildParams {
  emisor: EmisorData;
  receptor: ReceptorData;
  conceptos: ConceptoData[];
  folio: string;
  serie?: string;
  lugarExpedicion: string;
  tipoComprobante: string;
  exportacion: string;
  formaPago: string;
  metodoPago: string;
  usoCfdi: string;
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
  relacionTipo?: string;
  relacionUuid?: string;
}

export interface XmlBuilder {
  buildCadenaOriginal(xml: string): string;
  buildXml(params: XmlBuildParams): string;
  insertSello(xml: string, sello: string): string;
  insertTimbre(xml: string, timbre: {
    uuid: string; fechaTimbrado: string; selloCFD: string;
    noCertificadoSAT: string; selloSAT: string;
  }): string;
}
