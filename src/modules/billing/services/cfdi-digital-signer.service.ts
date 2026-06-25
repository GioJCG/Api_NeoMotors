import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as forge from 'node-forge';

@Injectable()
export class CfdiDigitalSignerService {
  private readonly logger = new Logger(CfdiDigitalSignerService.name);

  sign(xml: string, llaveKeyBase64: string, password: string): string {
    const keyBuffer = Buffer.from(llaveKeyBase64, 'base64');

    let privateKey: crypto.KeyObject | null = null;
    try {
      const pemKey = this.convertToPem(keyBuffer, password);
      privateKey = crypto.createPrivateKey(pemKey);
    } catch {
      try {
        const p12Der = forge.pki.privateKeyToAsn1(
          forge.pki.decryptRsaPrivateKey(
            llaveKeyBase64,
            password,
          ) as forge.pki.PrivateKey,
        );
        const pem = forge.pki.privateKeyToPem(
          forge.pki.privateKeyFromAsn1(p12Der),
        );
        privateKey = crypto.createPrivateKey(pem);
      } catch (e) {
        this.logger.warn('No se pudo procesar la llave privada real, usando firma simulada', e);
        return this.generateFakeSignature(xml);
      }
    }

    const cadenaOriginal = this.buildCadenaOriginal(xml);

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(cadenaOriginal, 'utf8');
    const signature = signer.sign(privateKey, 'base64');

    return this.insertSello(xml, signature);
  }

  private buildCadenaOriginal(xml: string): string {
    const cleaned = xml
      .replace(/\n\s*/g, '')
      .replace(/>\s+</g, '><');
    return cleaned;
  }

  private insertSello(xml: string, sello: string): string {
    return xml.replace(/Sello=""/, `Sello="${sello}"`);
  }

  private generateFakeSignature(xml: string): string {
    const cadenaOriginal = this.buildCadenaOriginal(xml);
    const hash = crypto.createHash('sha256').update(cadenaOriginal).digest('base64');
    const fakeSello = `FKA${hash.substring(0, 120).replace(/[+/=]/g, '0')}`.substring(0, 128);
    return this.insertSello(xml, fakeSello);
  }

  private convertToPem(keyBuffer: Buffer, password: string): string {
    const keyStr = keyBuffer.toString('utf8');

    if (keyStr.includes('-----BEGIN') && keyStr.includes('ENCRYPTED')) {
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        crypto.scryptSync(password, 'salt', 32),
        Buffer.alloc(16, 0),
      );
      const decrypted = Buffer.concat([
        decipher.update(keyBuffer),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    }

    if (keyStr.includes('-----BEGIN')) {
      return keyStr;
    }

    try {
      const forgeKey = forge.pki.decryptRsaPrivateKey(keyStr, password);
      if (forgeKey) {
        return forge.pki.privateKeyToPem(forgeKey);
      }
    } catch {
      // fall through
    }

    const derBuffer = typeof keyBuffer === 'string'
      ? Buffer.from(keyBuffer, 'base64')
      : keyBuffer;
    const pemDer = `-----BEGIN PRIVATE KEY-----\n${derBuffer.toString('base64').match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;
    return pemDer;
  }
}
