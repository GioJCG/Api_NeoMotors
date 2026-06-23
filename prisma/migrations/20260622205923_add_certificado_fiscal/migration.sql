-- CreateTable
CREATE TABLE "CertificadoFiscal" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "rfc" TEXT NOT NULL,
    "certificado_cer" TEXT NOT NULL,
    "llave_key" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "vigencia_desde" TIMESTAMPTZ NOT NULL,
    "vigencia_hasta" TIMESTAMPTZ NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "emisor_razon_social" TEXT,
    "serie" TEXT,
    "numero_certificado" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by" TEXT,
    CONSTRAINT "CertificadoFiscal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CertificadoFiscal_empresa_id_key" ON "CertificadoFiscal"("empresa_id");
CREATE INDEX "CertificadoFiscal_empresa_id_idx" ON "CertificadoFiscal"("empresa_id");

-- AddForeignKey
ALTER TABLE "CertificadoFiscal" ADD CONSTRAINT "CertificadoFiscal_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
