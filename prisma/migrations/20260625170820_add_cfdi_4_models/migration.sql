/*
  Warnings:

  - Added the required column `lugar_expedicion` to the `FacturaFiscal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FacturaFiscal" ADD COLUMN     "acuse_cancelacion" TEXT,
ADD COLUMN     "es_pago" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "exportacion" TEXT NOT NULL DEFAULT '01',
ADD COLUMN     "fecha_cancelacion" TIMESTAMP(3),
ADD COLUMN     "lugar_expedicion" TEXT NOT NULL,
ADD COLUMN     "motivo_cancelacion" TEXT,
ADD COLUMN     "objeto_imp" TEXT NOT NULL DEFAULT '02',
ADD COLUMN     "pago_monto" DECIMAL(65,30),
ADD COLUMN     "pago_tipo_cambio" DECIMAL(65,30),
ADD COLUMN     "relacion_tipo" TEXT,
ADD COLUMN     "relacion_uuid" TEXT,
ADD COLUMN     "serie" TEXT,
ADD COLUMN     "sucursal_id" TEXT,
ADD COLUMN     "tipo_comprobante" TEXT NOT NULL DEFAULT 'I',
ADD COLUMN     "uuid_sustituto" TEXT;

-- AlterTable
ALTER TABLE "FacturaFiscalDetalle" ADD COLUMN     "no_identificacion" TEXT,
ADD COLUMN     "objeto_imp" TEXT NOT NULL DEFAULT '02';

-- CreateTable
CREATE TABLE "SatFormaPago" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "bancarizado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SatFormaPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatMetodoPago" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "SatMetodoPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatObjetoImp" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "SatObjetoImp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatTipoRelacion" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "SatTipoRelacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatTipoComprobante" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "SatTipoComprobante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SatFormaPago_codigo_key" ON "SatFormaPago"("codigo");

-- CreateIndex
CREATE INDEX "SatFormaPago_nombre_idx" ON "SatFormaPago"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "SatMetodoPago_codigo_key" ON "SatMetodoPago"("codigo");

-- CreateIndex
CREATE INDEX "SatMetodoPago_nombre_idx" ON "SatMetodoPago"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "SatObjetoImp_codigo_key" ON "SatObjetoImp"("codigo");

-- CreateIndex
CREATE INDEX "SatObjetoImp_nombre_idx" ON "SatObjetoImp"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "SatTipoRelacion_codigo_key" ON "SatTipoRelacion"("codigo");

-- CreateIndex
CREATE INDEX "SatTipoRelacion_nombre_idx" ON "SatTipoRelacion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "SatTipoComprobante_codigo_key" ON "SatTipoComprobante"("codigo");

-- CreateIndex
CREATE INDEX "SatTipoComprobante_nombre_idx" ON "SatTipoComprobante"("nombre");

-- AddForeignKey
ALTER TABLE "FacturaFiscal" ADD CONSTRAINT "FacturaFiscal_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
