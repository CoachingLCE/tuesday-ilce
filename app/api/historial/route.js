import { NextResponse } from 'next/server';
import { conManejo } from '../../../lib/apiHandler';
import { requireUsuario } from '../../../lib/requireUsuario';
import { leerHistorialCompleto } from '../../../lib/datosHistorial';
import { paginaDeHistorial } from '../../../lib/historialMeses';

export const GET = conManejo(async (request) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const desde = searchParams.get('desde') || '';
  const hasta = searchParams.get('hasta') || '';
  const filtroUsuario = (searchParams.get('usuario') || '').toLowerCase();

  // Historial MES A MES (pedido de Diego): sin filtros devuelve solo UN mes (el actual, o el último que tenga movimientos; con `mes=` se pide
  // otro), más la lista de meses con movimientos y cuántos tiene cada uno. Con `todo=1` o con filtros (usuario, desde, hasta) devuelve todo
  // lo que coincide, de cualquier mes. El tope ya no es un corte silencioso de 500: son 2000, y la respuesta dice cuántos había (`total`).
  const todos = await leerHistorialCompleto();
  const usuarios = [...new Set(todos.map((h) => h.usuario).filter(Boolean))].sort();
  const pagina = paginaDeHistorial({
    registros: todos, campoFecha: 'fecha', mes: searchParams.get('mes') || '', todo: searchParams.get('todo') === '1',
    hayFiltros: !!(desde || hasta || filtroUsuario),
    filtrar: (lista) => {
      let h = lista;
      if (desde) h = h.filter((x) => x.fecha && x.fecha.slice(0, 10) >= desde);
      if (hasta) h = h.filter((x) => x.fecha && x.fecha.slice(0, 10) <= hasta);
      if (filtroUsuario) h = h.filter((x) => (x.usuario || '').toLowerCase() === filtroUsuario);
      return h;
    }
  });
  const MAX = 2000;
  const total = pagina.registros.length;
  return NextResponse.json({ historial: pagina.registros.slice(0, MAX), meses: pagina.meses, mes: pagina.mes, usuarios, total, truncado: total > MAX });
})
