-- CreateTable
CREATE TABLE "Marca" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modelo" (
    "id" TEXT NOT NULL,
    "marca_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    CONSTRAINT "Modelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "marca_id" TEXT NOT NULL,
    "modelo_id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "numero_serie" TEXT,
    "anio" INTEGER,
    "color" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Marca_nombre_key" ON "Marca"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Modelo_marca_id_nombre_key" ON "Modelo"("marca_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_empresa_id_placa_key" ON "Vehiculo"("empresa_id", "placa");

-- CreateIndex
CREATE INDEX "Vehiculo_empresa_id_idx" ON "Vehiculo"("empresa_id");

-- CreateIndex
CREATE INDEX "Vehiculo_cliente_id_idx" ON "Vehiculo"("cliente_id");

-- CreateIndex
CREATE INDEX "Vehiculo_placa_idx" ON "Vehiculo"("placa");

-- AddForeignKey
ALTER TABLE "Modelo" ADD CONSTRAINT "Modelo_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "Marca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "Marca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_modelo_id_fkey" FOREIGN KEY ("modelo_id") REFERENCES "Modelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
