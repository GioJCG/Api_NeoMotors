-- CreateTable
CREATE TABLE "Caja" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "saldo_inicial" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_actual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "conteo_fisico" DECIMAL(10,2),
    "diferencia" DECIMAL(10,2),
    "fecha_apertura" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMPTZ,
    "observaciones" TEXT,
    "operador_apertura_id" TEXT NOT NULL,
    "operador_cierre_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "Caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCaja" (
    "id" TEXT NOT NULL,
    "caja_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "saldo_anterior" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_nuevo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "referencia" TEXT,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    CONSTRAINT "MovimientoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT,
    "caja_id" TEXT,
    "orden_trabajo_id" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodo_pago" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "referencia" TEXT,
    "es_parcial" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Caja_empresa_id_idx" ON "Caja"("empresa_id");
CREATE INDEX "Caja_sucursal_id_idx" ON "Caja"("sucursal_id");
CREATE INDEX "Caja_estado_idx" ON "Caja"("estado");

-- CreateIndex
CREATE INDEX "MovimientoCaja_caja_id_idx" ON "MovimientoCaja"("caja_id");
CREATE INDEX "MovimientoCaja_tipo_idx" ON "MovimientoCaja"("tipo");
CREATE INDEX "MovimientoCaja_created_at_idx" ON "MovimientoCaja"("created_at");

-- CreateIndex
CREATE INDEX "Pago_empresa_id_idx" ON "Pago"("empresa_id");
CREATE INDEX "Pago_sucursal_id_idx" ON "Pago"("sucursal_id");
CREATE INDEX "Pago_caja_id_idx" ON "Pago"("caja_id");
CREATE INDEX "Pago_orden_trabajo_id_idx" ON "Pago"("orden_trabajo_id");
CREATE INDEX "Pago_created_at_idx" ON "Pago"("created_at");

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "Sucursal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_operador_apertura_id_fkey" FOREIGN KEY ("operador_apertura_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_operador_cierre_id_fkey" FOREIGN KEY ("operador_cierre_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "Caja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "Caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_orden_trabajo_id_fkey" FOREIGN KEY ("orden_trabajo_id") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
