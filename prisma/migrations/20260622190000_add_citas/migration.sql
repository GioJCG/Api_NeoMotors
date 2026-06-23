-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT,
    "cliente_id" TEXT NOT NULL,
    "vehiculo_id" TEXT NOT NULL,
    "fecha" TIMESTAMPTZ NOT NULL,
    "hora" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PROGRAMADA',
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cita_empresa_id_idx" ON "Cita"("empresa_id");
CREATE INDEX "Cita_sucursal_id_idx" ON "Cita"("sucursal_id");
CREATE INDEX "Cita_cliente_id_idx" ON "Cita"("cliente_id");
CREATE INDEX "Cita_vehiculo_id_idx" ON "Cita"("vehiculo_id");
CREATE INDEX "Cita_fecha_idx" ON "Cita"("fecha");

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
