import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as forge from 'node-forge';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { UploadCsdDto } from './dto/fiscal.dto';

@Injectable()
export class FiscalService {
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {
    const key = process.env.CSD_ENCRYPTION_KEY || 'neoMotors-csd-encryption-key-32bytes!!';
    this.encryptionKey = crypto.scryptSync(key, 'csd-salt', 32);
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  async uploadCsd(
    dto: UploadCsdDto,
    user: { id: string; roles: string[]; companyId?: string | null },
    ip?: string,
  ) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener empresa activa');

    // Decode and parse .cer
    let cerBuffer: Buffer;
    try {
      cerBuffer = Buffer.from(dto.certificadoCer, 'base64');
    } catch {
      throw new BadRequestException('Error al decodificar el archivo .cer');
    }

    let cert: forge.pki.Certificate;
    try {
      const pem = forge.util.createBuffer(cerBuffer.toString('binary')).getBytes();
      // Try to parse as DER binary
      const asn1 = forge.asn1.fromDer(pem);
      cert = forge.pki.certificateFromAsn1(asn1);
    } catch {
      // Try PEM format
      try {
        const pemText = `-----BEGIN CERTIFICATE-----\n${dto.certificadoCer.match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;
        cert = forge.pki.certificateFromPem(pemText);
      } catch {
        throw new BadRequestException('No se pudo parsear el archivo .cer. Formato inválido.');
      }
    }

    // Extract certificate fields
    const rfc = this.extractRfcFromCert(cert);
    if (!rfc || rfc.length < 10) {
      throw new BadRequestException('No se pudo extraer el RFC del certificado');
    }

    // Validate RFC matches the empresa's RFC
    const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');

    if (empresa.rfc !== rfc) {
      throw new BadRequestException(`El RFC del certificado (${rfc}) no coincide con el RFC de la empresa (${empresa.rfc})`);
    }

    // Validate certificate validity
    const now = new Date();
    const vigenciaDesde = cert.validity.notBefore;
    const vigenciaHasta = cert.validity.notAfter;

    if (now > vigenciaHasta) {
      throw new BadRequestException('El certificado está vencido');
    }

    // Extract additional fields
    const issuerText = cert.issuer?.attributes?.map((a: any) => `${a.name || a.shortName || ''}=${a.value}`).join(', ') || '';
    const subjectFields = cert.subject?.attributes?.reduce((acc: any, a: any) => {
      acc[a.name || a.shortName] = a.value;
      return acc;
    }, {}) || {};
    const emisorRazonSocial = subjectFields?.organizationName || subjectFields?.O || issuerText;
    const serie = cert.serialNumber;
    const numeroCertificado = this.extractSerialNumber(cert);

    // Encrypt key and password
    const encryptedKey = this.encrypt(dto.llaveKey);
    const encryptedPassword = this.encrypt(dto.password);

    // Upsert the certificate record
    const certificado = await this.prisma.certificadoFiscal.upsert({
      where: { empresaId },
      create: {
        empresaId,
        rfc,
        certificadoCer: dto.certificadoCer,
        llaveKey: encryptedKey,
        passwordHash: encryptedPassword,
        vigenciaDesde,
        vigenciaHasta,
        emisorRazonSocial: emisorRazonSocial || null,
        serie: serie || null,
        numeroCertificado: numeroCertificado || null,
      },
      update: {
        rfc,
        certificadoCer: dto.certificadoCer,
        llaveKey: encryptedKey,
        passwordHash: encryptedPassword,
        vigenciaDesde,
        vigenciaHasta,
        emisorRazonSocial: emisorRazonSocial || null,
        serie: serie || null,
        numeroCertificado: numeroCertificado || null,
        activo: true,
        updatedBy: user.id,
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id, accion: 'CARGAR_CSD', entidad: 'CertificadoFiscal', entidadId: certificado.id,
      payload: { rfc, vigenciaDesde, vigenciaHasta }, contexto: `Empresa: ${empresaId}`, ip,
    });

    return {
      message: 'Certificado cargado exitosamente',
      rfc: certificado.rfc,
      vigenciaDesde: certificado.vigenciaDesde,
      vigenciaHasta: certificado.vigenciaHasta,
      emisorRazonSocial: certificado.emisorRazonSocial,
      serie: certificado.serie,
      numeroCertificado: certificado.numeroCertificado,
    };
  }

  async getStatus(user: { id: string; roles: string[]; companyId?: string | null }) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener empresa activa');

    const csd = await this.prisma.certificadoFiscal.findUnique({
      where: { empresaId },
    });

    if (!csd) return { cargado: false };

    const vigente = csd.activo && csd.vigenciaHasta > new Date();

    return {
      cargado: true,
      vigente,
      rfc: csd.rfc,
      vigenciaDesde: csd.vigenciaDesde,
      vigenciaHasta: csd.vigenciaHasta,
      emisorRazonSocial: csd.emisorRazonSocial,
      serie: csd.serie,
      numeroCertificado: csd.numeroCertificado,
    };
  }

  private readonly RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

  private extractRfcFromAttr(attr: any): string | null {
    const raw = String(attr.value).trim();
    if (this.RFC_REGEX.test(raw)) return raw;
    const match = raw.match(/([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})/);
    return match ? match[1] : null;
  }

  private extractRfcFromCert(cert: forge.pki.Certificate): string | null {
    const attrs = cert.subject?.attributes || [];
    const priorityOids = ['2.5.4.45', '2.5.4.5', '2.5.4.3'];
    for (const oid of priorityOids) {
      for (const attr of attrs) {
        if (attr.type === oid) {
          const rfc = this.extractRfcFromAttr(attr);
          if (rfc) return rfc;
        }
      }
    }
    return null;
  }

  private extractSerialNumber(cert: forge.pki.Certificate): string | null {
    try {
      const ext = cert.getExtension('subjectKeyIdentifier') as any;
      if (ext && ext.value) {
        return ext.value.replace(/[^A-Fa-f0-9]/g, '').substring(0, 20);
      }
    } catch {}
    return cert.serialNumber || null;
  }
}
