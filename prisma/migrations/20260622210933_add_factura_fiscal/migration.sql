-- CreateEnum
CREATE TYPE "FacturaStatus" AS ENUM ('GENERADA', 'TIMBRADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "FacturaFiscal" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "orden_trabajo_id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "uuid" TEXT,
    "estado" "FacturaStatus" NOT NULL DEFAULT 'GENERADA',
    "xml_timbrado" TEXT,
    "fecha_timbrado" TIMESTAMPTZ,
    "receptor_rfc" TEXT NOT NULL,
    "receptor_nombre" TEXT NOT NULL,
    "receptor_domicilio" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "metodo_pago" TEXT NOT NULL DEFAULT 'PUE',
    "forma_pago" TEXT NOT NULL DEFAULT '01',
    "uso_cfdi" TEXT NOT NULL DEFAULT 'G03',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    CONSTRAINT "FacturaFiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaFiscalDetalle" (
    "id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "clave_prod_serv" TEXT NOT NULL DEFAULT '78111805',
    "clave_unidad" TEXT NOT NULL DEFAULT 'E48',
    "unidad" TEXT NOT NULL DEFAULT 'Servicio',
    "descripcion" TEXT NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "importe" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT "FacturaFiscalDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FacturaFiscal_uuid_key" ON "FacturaFiscal"("uuid");
CREATE UNIQUE INDEX "FacturaFiscal_empresa_id_folio_key" ON "FacturaFiscal"("empresa_id", "folio");
CREATE INDEX "FacturaFiscal_empresa_id_idx" ON "FacturaFiscal"("empresa_id");
CREATE INDEX "FacturaFiscal_orden_trabajo_id_idx" ON "FacturaFiscal"("orden_trabajo_id");
CREATE INDEX "FacturaFiscal_uuid_idx" ON "FacturaFiscal"("uuid");
CREATE INDEX "FacturaFiscalDetalle_factura_id_idx" ON "FacturaFiscalDetalle"("factura_id");

-- AddForeignKey
ALTER TABLE "FacturaFiscal" ADD CONSTRAINT "FacturaFiscal_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FacturaFiscal" ADD CONSTRAINT "FacturaFiscal_orden_trabajo_id_fkey" FOREIGN KEY ("orden_trabajo_id") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FacturaFiscalDetalle" ADD CONSTRAINT "FacturaFiscalDetalle_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "FacturaFiscal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
