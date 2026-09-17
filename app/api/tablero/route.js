import { NextResponse } from 'next/server';
import { conManejo } from '../../../lib/apiHandler';
import { requireUsuario } from '../../../lib/requireUsuario';
import { tienePermisoVer } from '../../../lib/permisos';
import { leerGrupos, leerColumnas, leerItems } from '../../../lib/datosTablero';

const COLUMNAS_DEFAULT = [
  { id: 'estado', nombre: 'Estado', tipo: 'status', orden: 0, opciones: [
    { id: 'proceso', label: 'En proceso', color: '#fdab3d' },
    { id: 'corregir', label: 'Para corregir', color: '#e2445c' },
    { id: 'listo', label: 'Listo', color: '#00c875' }
  ] },
  { id: 'responsable', nombre: 'Responsable', tipo: 'person', orden: 1, opciones: [] },
  { id: 'fecha', nombre: 'Fecha', tipo: 'date', orden: 2, opciones: [] },
  { id: 'tipo', nombre: 'Tipo', tipo: 'text', orden: 3, opciones: [] }
];

// Bootstrap del tablero: trae grupos + columnas + items de una — si es la primera vez que
// se usa (Sheet recién creado, sin filas todavía en TableroColumnas), se devuelven las 4
// columnas de base (Estado/Responsable/Fecha/Tipo) para no arrancar con un tablero vacío de
// estructura; se guardan de verdad en el Sheet recién cuando alguien las toca por primera vez.
export const GET = conManejo(async (request) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const [grupos, columnas, items] = await Promise.all([leerGrupos(), leerColumnas(), leerItems()]);

  return NextResponse.json({
    grupos,
    columnas: columnas.length ? columnas : COLUMNAS_DEFAULT,
    items
  });
})
