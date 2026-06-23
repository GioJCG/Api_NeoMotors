-- CreateTable
CREATE TABLE "Refaccion" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "costo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "unidad" TEXT NOT NULL DEFAULT 'PIEZA',
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    CONSTRAINT "Refaccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventario" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "refaccion_id" TEXT NOT NULL,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "precio_promedio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "refaccion_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stock_anterior" INTEGER NOT NULL,
    "stock_nuevo" INTEGER NOT NULL,
    "referencia" TEXT,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Refaccion_empresa_id_codigo_key" ON "Refaccion"("empresa_id", "codigo");
CREATE INDEX "Refaccion_empresa_id_idx" ON "Refaccion"("empresa_id");
CREATE INDEX "Refaccion_nombre_idx" ON "Refaccion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_empresa_id_sucursal_id_refaccion_id_key" ON "Inventario"("empresa_id", "sucursal_id", "refaccion_id");
CREATE INDEX "Inventario_empresa_id_idx" ON "Inventario"("empresa_id");
CREATE INDEX "Inventario_sucursal_id_idx" ON "Inventario"("sucursal_id");
CREATE INDEX "Inventario_refaccion_id_idx" ON "Inventario"("refaccion_id");

-- CreateIndex
CREATE INDEX "MovimientoInventario_empresa_id_idx" ON "MovimientoInventario"("empresa_id");
CREATE INDEX "MovimientoInventario_sucursal_id_idx" ON "MovimientoInventario"("sucursal_id");
CREATE INDEX "MovimientoInventario_refaccion_id_idx" ON "MovimientoInventario"("refaccion_id");
CREATE INDEX "MovimientoInventario_tipo_idx" ON "MovimientoInventario"("tipo");
CREATE INDEX "MovimientoInventario_created_at_idx" ON "MovimientoInventario"("created_at");

-- AddForeignKey
ALTER TABLE "Refaccion" ADD CONSTRAINT "Refaccion_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_refaccion_id_fkey" FOREIGN KEY ("refaccion_id") REFERENCES "Refaccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_refaccion_id_fkey" FOREIGN KEY ("refaccion_id") REFERENCES "Refaccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
