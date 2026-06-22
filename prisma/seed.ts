import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MODULOS = [
  'dashboard',
  'empresas',
  'sucursales',
  'usuarios',
  'roles',
  'clientes',
  'vehiculos',
  'citas',
  'ordenes',
  'inventario',
  'proveedores',
  'caja',
  'reportes',
  'fiscal',
  'auditoria',
  'superadmin',
] as const;

const ACCIONES = ['crear', 'leer', 'actualizar', 'eliminar', 'aprobar', 'autorizar'] as const;

interface RolDef {
  nombre: string;
  descripcion: string;
  permisoFiltro: (modulo: string, accion: string) => boolean;
}

const ROLES: RolDef[] = [
  {
    nombre: 'SuperUsuario',
    descripcion: 'Acceso total y global a todas las empresas, logs del sistema y catálogos maestros.',
    permisoFiltro: () => true,
  },
  {
    nombre: 'AdministradorEmpresa',
    descripcion: 'Gestión total de los recursos, sucursales, facturación y usuarios de su empresa asignada.',
    permisoFiltro: (modulo, accion) => {
      const prohibidos = ['superadmin'];
      if (prohibidos.includes(modulo)) return false;
      return true;
    },
  },
  {
    nombre: 'SupervisorSucursal',
    descripcion: 'Administra y supervisa la operación diaria de una o más sucursales asignadas.',
    permisoFiltro: (modulo, accion) => {
      const soloLectura = ['empresas', 'reportes', 'auditoria', 'usuarios', 'roles', 'fiscal', 'proveedores'];
      if (soloLectura.includes(modulo) && accion !== 'leer') return false;
      const operacionales = ['dashboard', 'clientes', 'vehiculos', 'citas', 'ordenes', 'inventario', 'caja'];
      if (operacionales.includes(modulo)) return true;
      if (modulo === 'superadmin') return false;
      return accion === 'leer';
    },
  },
  {
    nombre: 'Operador',
    descripcion: 'Captura información y opera exclusivamente los módulos asignados a su sucursal activa.',
    permisoFiltro: (modulo, accion) => {
      const permitidos = ['dashboard', 'clientes', 'vehiculos', 'citas', 'ordenes', 'inventario', 'caja'];
      if (!permitidos.includes(modulo)) return false;
      if (accion === 'eliminar' || accion === 'aprobar' || accion === 'autorizar') return false;
      return true;
    },
  },
  {
    nombre: 'Consulta',
    descripcion: 'Acceso de solo lectura para auditorías o reportería básica.',
    permisoFiltro: (modulo, accion) => {
      if (accion !== 'leer') return false;
      if (modulo === 'superadmin') return false;
      return true;
    },
  },
];

async function main() {
  const permisosCreados: { id: string; nombre: string }[] = [];

  for (const modulo of MODULOS) {
    for (const accion of ACCIONES) {
      const nombre = `${modulo}.${accion}`;
      const permiso = await prisma.permiso.upsert({
        where: { nombre },
        create: {
          nombre,
          descripcion: `Permiso para ${accion} en ${modulo}`,
          modulo,
          accion,
        },
        update: {},
      });
      permisosCreados.push(permiso);
    }
  }

  for (const rolDef of ROLES) {
    const rol = await prisma.rol.upsert({
      where: { nombre: rolDef.nombre },
      create: {
        nombre: rolDef.nombre,
        descripcion: rolDef.descripcion,
        esGlobal: true,
      },
      update: {},
    });

    const permisosAsignar = permisosCreados.filter((p) => {
      const [modulo, accion] = p.nombre.split('.');
      return rolDef.permisoFiltro(modulo, accion);
    });

    for (const permiso of permisosAsignar) {
      await prisma.rolPermiso.upsert({
        where: { rolId_permisoId: { rolId: rol.id, permisoId: permiso.id } },
        create: { rolId: rol.id, permisoId: permiso.id },
        update: {},
      });
    }

    console.log(`Rol "${rolDef.nombre}": ${permisosAsignar.length} permisos asignados`);
  }

  console.log('Seed RBAC completado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
