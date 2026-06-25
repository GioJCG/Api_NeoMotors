import { Injectable } from '@nestjs/common';
import { XmlBuilder, XmlBuildParams } from '../interfaces/xml-builder.interface';

@Injectable()
export class CfdiXmlBuilderService implements XmlBuilder {
  buildCadenaOriginal(xml: string): string {
    const match = xml.match(/<cfdi:Comprobante[\s\S]*?<\/cfdi:Comprobante>/);
    if (!match) return xml;
    return match[0]
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  }

  buildXml(params: XmlBuildParams): string {
    const conceptosXml = params.conceptos
      .map((c) => {
        const base = c.base.toFixed(2);
        const ivaStr = c.iva.toFixed(2);
        return `<cfdi:Concepto ClaveProdServ="${c.claveProdServ}" NoIdentificacion="${c.noIdentificacion || ''}" Cantidad="${c.cantidad}" ClaveUnidad="${c.claveUnidad}" Unidad="${this.escapeXml(c.unidad)}" Descripcion="${this.escapeXml(c.descripcion)}" ValorUnitario="${c.precioUnitario.toFixed(2)}" Importe="${c.importe.toFixed(2)}" ObjetoImp="${c.objetoImp}">
          <cfdi:Impuestos>
            <cfdi:Traslados>
              <cfdi:Traslado Base="${base}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${ivaStr}" />
            </cfdi:Traslados>
          </cfdi:Impuestos>
        </cfdi:Concepto>`;
      })
      .join('\n    ');

    const fecha = new Date().toISOString().replace(/\.\d{3}Z/, '-06:00');
    const relacionXml = params.relacionTipo && params.relacionUuid
      ? `
  <cfdi:CfdiRelacionados TipoRelacion="${params.relacionTipo}">
    <cfdi:CfdiRelacionado UUID="${params.relacionUuid}" />
  </cfdi:CfdiRelacionados>`
      : '';

    const baseIva = params.subtotal - params.descuento;

    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd" Version="4.0" Folio="${params.serie ? params.serie + params.folio : params.folio}" Fecha="${fecha}" Sello="" NoCertificado="${params.emisor.numeroCertificado || '00000000000000000000'}" Certificado="${(params.emisor.certificadoCer || '').substring(0, 20)}..." SubTotal="${params.subtotal.toFixed(2)}" Descuento="${params.descuento.toFixed(2)}" Moneda="MXN" Total="${params.total.toFixed(2)}" TipoDeComprobante="${params.tipoComprobante}" Exportacion="${params.exportacion}" MetodoPago="${params.metodoPago}" FormaPago="${params.formaPago}" LugarExpedicion="${params.lugarExpedicion}">
  <cfdi:InformacionGlobal Anio="${new Date().getFullYear()}" Meses="01" Periodicidad="01" />${relacionXml}
  <cfdi:Emisor Rfc="${params.emisor.rfc}" Nombre="${this.escapeXml(params.emisor.razonSocial)}" RegimenFiscal="${params.emisor.regimenFiscal}" />
  <cfdi:Receptor Rfc="${params.receptor.rfc}" Nombre="${this.escapeXml(params.receptor.nombre)}" DomicilioFiscalReceptor="${params.receptor.domicilioFiscalReceptor}" RegimenFiscalReceptor="${params.receptor.regimenFiscalReceptor}" UsoCFDI="${params.receptor.usoCfdi}" />
  <cfdi:Conceptos>
    ${conceptosXml}
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${params.iva.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${baseIva.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${params.iva.toFixed(2)}" />
    </cfdi:Traslados>
  </cfdi:Impuestos>
</cfdi:Comprobante>`;
  }

  insertSello(xml: string, sello: string): string {
    return xml.replace(/Sello=""/, `Sello="${sello}"`);
  }

  insertTimbre(
    xml: string,
    timbre: {
      uuid: string; fechaTimbrado: string; selloCFD: string;
      noCertificadoSAT: string; selloSAT: string;
    },
  ): string {
    const complemento = `
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" xsi:schemaLocation="http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd" Version="1.1" UUID="${timbre.uuid}" FechaTimbrado="${timbre.fechaTimbrado}" SelloCFD="${timbre.selloCFD}" NoCertificadoSAT="${timbre.noCertificadoSAT}" SelloSAT="${timbre.selloSAT}" />
  </cfdi:Complemento>`;
    return xml.replace('</cfdi:Comprobante>', `${complemento}\n</cfdi:Comprobante>`);
  }

  private escapeXml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
}
