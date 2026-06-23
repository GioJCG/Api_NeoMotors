-- CreateTable
CREATE TABLE "RecepcionVehiculo" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT,
    "cita_id" TEXT,
    "cliente_id" TEXT NOT NULL,
    "vehiculo_id" TEXT NOT NULL,
    "kilometraje" INTEGER NOT NULL,
    "nivel_combustible" TEXT NOT NULL,
    "componentes_faltantes" TEXT,
    "danios_carroceria" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    CONSTRAINT "RecepcionVehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecepcionFoto" (
    "id" TEXT NOT NULL,
    "recepcion_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RecepcionFoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenTrabajo" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT,
    "cliente_id" TEXT NOT NULL,
    "vehiculo_id" TEXT NOT NULL,
    "recepcion_id" TEXT,
    "folio" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'RECIBIDO',
    "descripcion" TEXT,
    "diagnostico" TEXT,
    "total_estimado" DECIMAL(10,2),
    "total_real" DECIMAL(10,2),
    "fecha_inicio" TIMESTAMPTZ,
    "fecha_fin" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    CONSTRAINT "OrdenTrabajo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecepcionVehiculo_cita_id_key" ON "RecepcionVehiculo"("cita_id");

-- CreateIndex
CREATE INDEX "RecepcionVehiculo_empresa_id_idx" ON "RecepcionVehiculo"("empresa_id");
CREATE INDEX "RecepcionVehiculo_sucursal_id_idx" ON "RecepcionVehiculo"("sucursal_id");
CREATE INDEX "RecepcionVehiculo_cliente_id_idx" ON "RecepcionVehiculo"("cliente_id");
CREATE INDEX "RecepcionVehiculo_vehiculo_id_idx" ON "RecepcionVehiculo"("vehiculo_id");
CREATE INDEX "RecepcionVehiculo_created_at_idx" ON "RecepcionVehiculo"("created_at");

-- CreateIndex
CREATE INDEX "RecepcionFoto_recepcion_id_idx" ON "RecepcionFoto"("recepcion_id");

-- CreateIndex
CREATE UNIQUE INDEX "OrdenTrabajo_empresa_id_folio_key" ON "OrdenTrabajo"("empresa_id", "folio");
CREATE INDEX "OrdenTrabajo_empresa_id_idx" ON "OrdenTrabajo"("empresa_id");
CREATE INDEX "OrdenTrabajo_sucursal_id_idx" ON "OrdenTrabajo"("sucursal_id");
CREATE INDEX "OrdenTrabajo_cliente_id_idx" ON "OrdenTrabajo"("cliente_id");
CREATE INDEX "OrdenTrabajo_vehiculo_id_idx" ON "OrdenTrabajo"("vehiculo_id");
CREATE INDEX "OrdenTrabajo_recepcion_id_idx" ON "OrdenTrabajo"("recepcion_id");
CREATE INDEX "OrdenTrabajo_estado_idx" ON "OrdenTrabajo"("estado");

-- AddForeignKey
ALTER TABLE "RecepcionVehiculo" ADD CONSTRAINT "RecepcionVehiculo_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "Cita"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecepcionVehiculo" ADD CONSTRAINT "RecepcionVehiculo_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecepcionVehiculo" ADD CONSTRAINT "RecepcionVehiculo_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecepcionVehiculo" ADD CONSTRAINT "RecepcionVehiculo_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecepcionVehiculo" ADD CONSTRAINT "RecepcionVehiculo_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecepcionFoto" ADD CONSTRAINT "RecepcionFoto_recepcion_id_fkey" FOREIGN KEY ("recepcion_id") REFERENCES "RecepcionVehiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_recepcion_id_fkey" FOREIGN KEY ("recepcion_id") REFERENCES "RecepcionVehiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateSequence for folio
CREATE SEQUENCE IF NOT EXISTS "orden_trabajo_folio_seq";
