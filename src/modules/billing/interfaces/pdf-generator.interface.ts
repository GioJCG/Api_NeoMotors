export interface PdfInvoiceData {
  folio: string;
  serie?: string;
  uuid?: string;
  estado: string;
  fechaTimbrado?: Date;
  createdAt: Date;
  tipoComprobante: string;
  lugarExpedicion: string;
  exportacion: string;

  emisor: {
    rfc: string;
    razonSocial: string;
    regimenFiscal: string;
    codigoPostalFiscal: string;
    logoUrl?: string;
  };

  receptor: {
    rfc: string;
    nombre: string;
    domicilio?: string;
  };

  conceptos: Array<{
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
    total: number;
  }>;

  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
  metodoPago: string;
  formaPago: string;
  usoCfdi: string;
}

export interface PdfGenerator {
  generate(data: PdfInvoiceData): Promise<Buffer>;
}
