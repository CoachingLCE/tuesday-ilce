'use client';

// Se muestra en vez de redirigir cuando alguien ve una sección en el menú pero no tiene permiso
// para entrar — en vez de mandarlo de vuelta a Inicio sin explicación, entra a la pantalla y ve
// este mensaje en lugar del contenido real (mismo criterio que ya usamos en Seguimiento).
export default function AccesoDenegado({ seccion }) {
  return (
    <div className="max-w-md mx-auto mt-20 text-center px-6">
      <p className="text-4xl mb-4">🔒</p>
      <h2 className="text-lg font-bold mb-2">No tenés acceso{seccion ? ` a ${seccion}` : ''}</h2>
      <p className="text-textSec text-sm">
        Si creés que deberías poder verla, pedile a un Admin que te dé acceso desde Accesos.
      </p>
    </div>
  );
}
