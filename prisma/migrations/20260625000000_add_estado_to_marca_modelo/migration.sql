-- Add estado column to Marca
ALTER TABLE "Marca" ADD COLUMN IF NOT EXISTS "estado" TEXT NOT NULL DEFAULT 'ACTIVA';

-- Add estado column to Modelo
ALTER TABLE "Modelo" ADD COLUMN IF NOT EXISTS "estado" TEXT NOT NULL DEFAULT 'ACTIVA';
