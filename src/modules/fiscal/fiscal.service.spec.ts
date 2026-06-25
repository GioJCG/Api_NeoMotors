import { Test, TestingModule } from '@nestjs/testing';
import { FiscalService } from './fiscal.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import * as forge from 'node-forge';

function makeCertWithAttr(attrType: string, attrValue: string): forge.pki.Certificate {
  const cert = forge.pki.createCertificate();
  cert.subject.attributes = [
    { type: attrType, value: attrValue, valueTagClass: 19 },
  ];
  return cert;
}

function makeCertWithAttrs(attrs: { type: string; value: string }[]): forge.pki.Certificate {
  const cert = forge.pki.createCertificate();
  cert.subject.attributes = attrs.map(a => ({ type: a.type, value: a.value, valueTagClass: 19 }));
  return cert;
}

describe('FiscalService — extractRfcFromCert', () => {
  let service: FiscalService;

  const mockPrisma = {};
  const mockAuditoria = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditoriaService, useValue: mockAuditoria },
      ],
    }).compile();

    service = module.get<FiscalService>(FiscalService);
  });

  it('should extract RFC from OID 2.5.4.45', () => {
    const cert = makeCertWithAttr('2.5.4.45', 'XIA190128J61 / VADA800927DJ3');
    const result = (service as any).extractRfcFromCert(cert);
    expect(result).toBe('XIA190128J61');
  });

  it('should extract RFC from serialNumber (2.5.4.5) when value is exact', () => {
    const cert = makeCertWithAttr('2.5.4.5', 'ROMC800101ABC');
    const result = (service as any).extractRfcFromCert(cert);
    expect(result).toBe('ROMC800101ABC');
  });

  it('should extract RFC from commonName (2.5.4.3) when embedded', () => {
    const cert = makeCertWithAttr('2.5.4.3', 'EMPRESA S.A. DE C.V. ROMC800101ABC');
    const result = (service as any).extractRfcFromCert(cert);
    expect(result).toBe('ROMC800101ABC');
  });

  it('should prioritize OID 2.5.4.45 over other attributes', () => {
    const cert = makeCertWithAttrs([
      { type: '2.5.4.45', value: 'PRIO800101AAA / SOMEOTHER' },
      { type: '2.5.4.5', value: 'SNONLY800101ABC' },
      { type: '2.5.4.3', value: 'CNONLY800101XYZ' },
    ]);
    const result = (service as any).extractRfcFromCert(cert);
    expect(result).toBe('PRIO800101AAA');
  });

  it('should return null when no attribute contains an RFC', () => {
    const cert = makeCertWithAttr('2.5.4.3', 'NO RFC HERE');
    const result = (service as any).extractRfcFromCert(cert);
    expect(result).toBeNull();
  });

  it('should return null when subject has no attributes', () => {
    const cert = forge.pki.createCertificate();
    cert.subject.attributes = [];
    const result = (service as any).extractRfcFromCert(cert);
    expect(result).toBeNull();
  });

  it('should extract RFC from serialNumber with exact match', () => {
    const cert = makeCertWithAttr('2.5.4.5', 'EKUO800101ABC');
    const result = (service as any).extractRfcFromCert(cert);
    expect(result).toBe('EKUO800101ABC');
  });
});
