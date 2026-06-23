-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rfc" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_empresa_id_rfc_key" ON "Cliente"("empresa_id", "rfc");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_empresa_id_email_key" ON "Cliente"("empresa_id", "email");

-- CreateIndex
CREATE INDEX "Cliente_empresa_id_idx" ON "Cliente"("empresa_id");

-- CreateIndex
CREATE INDEX "Cliente_nombre_idx" ON "Cliente"("nombre");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
