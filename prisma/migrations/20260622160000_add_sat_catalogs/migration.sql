-- CreateTable
CREATE TABLE "SatPais" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    CONSTRAINT "SatPais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatEstado" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "pais_id" TEXT NOT NULL,
    CONSTRAINT "SatEstado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatMunicipio" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado_id" TEXT NOT NULL,
    CONSTRAINT "SatMunicipio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatCodigoPostal" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "estado_id" TEXT NOT NULL,
    "municipio_id" TEXT,
    CONSTRAINT "SatCodigoPostal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatColonia" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo_postal_id" TEXT NOT NULL,
    CONSTRAINT "SatColonia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatProductoServicio" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nivel" TEXT,
    "incluye_iva" BOOLEAN NOT NULL DEFAULT false,
    "incluye_ieps" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SatProductoServicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatUnidadMedida" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "simbolo" TEXT,
    CONSTRAINT "SatUnidadMedida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatRegimenFiscal" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    CONSTRAINT "SatRegimenFiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatUsoCfdi" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    CONSTRAINT "SatUsoCfdi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SatPais_codigo_key" ON "SatPais"("codigo");

-- CreateIndex
CREATE INDEX "SatPais_nombre_idx" ON "SatPais"("nombre");

-- CreateIndex
CREATE INDEX "SatEstado_pais_id_idx" ON "SatEstado"("pais_id");

-- CreateIndex
CREATE INDEX "SatEstado_nombre_idx" ON "SatEstado"("nombre");

-- CreateIndex
CREATE INDEX "SatMunicipio_estado_id_idx" ON "SatMunicipio"("estado_id");

-- CreateIndex
CREATE INDEX "SatMunicipio_nombre_idx" ON "SatMunicipio"("nombre");

-- CreateIndex
CREATE INDEX "SatCodigoPostal_codigo_idx" ON "SatCodigoPostal"("codigo");

-- CreateIndex
CREATE INDEX "SatCodigoPostal_estado_id_idx" ON "SatCodigoPostal"("estado_id");

-- CreateIndex
CREATE INDEX "SatCodigoPostal_municipio_id_idx" ON "SatCodigoPostal"("municipio_id");

-- CreateIndex
CREATE INDEX "SatColonia_codigo_postal_id_idx" ON "SatColonia"("codigo_postal_id");

-- CreateIndex
CREATE INDEX "SatColonia_nombre_idx" ON "SatColonia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "SatProductoServicio_codigo_key" ON "SatProductoServicio"("codigo");

-- CreateIndex
CREATE INDEX "SatProductoServicio_codigo_idx" ON "SatProductoServicio"("codigo");

-- CreateIndex
CREATE INDEX "SatProductoServicio_descripcion_idx" ON "SatProductoServicio"("descripcion");

-- CreateIndex
CREATE UNIQUE INDEX "SatUnidadMedida_codigo_key" ON "SatUnidadMedida"("codigo");

-- CreateIndex
CREATE INDEX "SatUnidadMedida_nombre_idx" ON "SatUnidadMedida"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "SatRegimenFiscal_codigo_key" ON "SatRegimenFiscal"("codigo");

-- CreateIndex
CREATE INDEX "SatRegimenFiscal_nombre_idx" ON "SatRegimenFiscal"("nombre");

-- CreateIndex
CREATE INDEX "SatRegimenFiscal_tipo_idx" ON "SatRegimenFiscal"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "SatUsoCfdi_codigo_key" ON "SatUsoCfdi"("codigo");

-- CreateIndex
CREATE INDEX "SatUsoCfdi_nombre_idx" ON "SatUsoCfdi"("nombre");

-- CreateIndex
CREATE INDEX "SatUsoCfdi_tipo_idx" ON "SatUsoCfdi"("tipo");

-- AddForeignKey
ALTER TABLE "SatEstado" ADD CONSTRAINT "SatEstado_pais_id_fkey" FOREIGN KEY ("pais_id") REFERENCES "SatPais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatMunicipio" ADD CONSTRAINT "SatMunicipio_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "SatEstado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatCodigoPostal" ADD CONSTRAINT "SatCodigoPostal_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "SatEstado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatCodigoPostal" ADD CONSTRAINT "SatCodigoPostal_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "SatMunicipio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatColonia" ADD CONSTRAINT "SatColonia_codigo_postal_id_fkey" FOREIGN KEY ("codigo_postal_id") REFERENCES "SatCodigoPostal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
