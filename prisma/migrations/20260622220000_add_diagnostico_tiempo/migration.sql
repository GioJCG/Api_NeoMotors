-- CreateTable
CREATE TABLE "Diagnostico" (
    "id" TEXT NOT NULL,
    "orden_trabajo_id" TEXT NOT NULL,
    "tecnico_id" TEXT NOT NULL,
    "sintomas" TEXT,
    "fallas_encontradas" TEXT,
    "desgastes_piezas" TEXT,
    "conclusion" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    CONSTRAINT "Diagnostico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiempoTecnico" (
    "id" TEXT NOT NULL,
    "orden_trabajo_id" TEXT NOT NULL,
    "tecnico_id" TEXT NOT NULL,
    "hora_inicio" TIMESTAMPTZ NOT NULL,
    "hora_fin" TIMESTAMPTZ,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    CONSTRAINT "TiempoTecnico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Diagnostico_orden_trabajo_id_idx" ON "Diagnostico"("orden_trabajo_id");
CREATE INDEX "Diagnostico_tecnico_id_idx" ON "Diagnostico"("tecnico_id");
CREATE INDEX "Diagnostico_created_at_idx" ON "Diagnostico"("created_at");

-- CreateIndex
CREATE INDEX "TiempoTecnico_orden_trabajo_id_idx" ON "TiempoTecnico"("orden_trabajo_id");
CREATE INDEX "TiempoTecnico_tecnico_id_idx" ON "TiempoTecnico"("tecnico_id");
CREATE INDEX "TiempoTecnico_estado_idx" ON "TiempoTecnico"("estado");

-- AddForeignKey
ALTER TABLE "Diagnostico" ADD CONSTRAINT "Diagnostico_orden_trabajo_id_fkey" FOREIGN KEY ("orden_trabajo_id") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Diagnostico" ADD CONSTRAINT "Diagnostico_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TiempoTecnico" ADD CONSTRAINT "TiempoTecnico_orden_trabajo_id_fkey" FOREIGN KEY ("orden_trabajo_id") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TiempoTecnico" ADD CONSTRAINT "TiempoTecnico_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
