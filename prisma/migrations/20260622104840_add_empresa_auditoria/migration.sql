-- CreateEnum
CREATE TYPE "EmpresaStatus" AS ENUM ('ACTIVA', 'SUSPENDIDA', 'INACTIVA');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rfc" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "codigo_postal_fiscal" TEXT NOT NULL,
    "regimen_fiscal" TEXT NOT NULL,
    "logo_url" TEXT,
    "color_primario" TEXT,
    "color_secundario" TEXT,
    "tema" TEXT DEFAULT 'light',
    "estado" "EmpresaStatus" NOT NULL DEFAULT 'ACTIVA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sucursal" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "es_matriz" BOOLEAN NOT NULL DEFAULT false,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "payload" JSONB,
    "contexto" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_rfc_key" ON "Empresa"("rfc");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sucursal" ADD CONSTRAINT "Sucursal_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
