-- CreateTable
CREATE TABLE "NotificacionTaller" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT,
    "usuario_id" TEXT,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "referencia" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_lectura" TIMESTAMPTZ,
    "prioridad" TEXT NOT NULL DEFAULT 'NORMAL',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificacionTaller_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificacionTaller_empresa_id_idx" ON "NotificacionTaller"("empresa_id");
CREATE INDEX "NotificacionTaller_sucursal_id_idx" ON "NotificacionTaller"("sucursal_id");
CREATE INDEX "NotificacionTaller_usuario_id_idx" ON "NotificacionTaller"("usuario_id");
CREATE INDEX "NotificacionTaller_leida_idx" ON "NotificacionTaller"("leida");
CREATE INDEX "NotificacionTaller_created_at_idx" ON "NotificacionTaller"("created_at");

-- AddForeignKey
ALTER TABLE "NotificacionTaller" ADD CONSTRAINT "NotificacionTaller_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificacionTaller" ADD CONSTRAINT "NotificacionTaller_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificacionTaller" ADD CONSTRAINT "NotificacionTaller_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
