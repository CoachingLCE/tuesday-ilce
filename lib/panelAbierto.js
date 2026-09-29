// Mecanismo simple para que el botón flotante "❓ Necesito ayuda" se oculte mientras haya
// un panel/modal de pantalla completa abierto (detalle de tarea, actividad del tablero) —
// evita que se superponga con sus botones (ej. "Comentar").
let contador = 0;
const listeners = new Set();

function avisar() {
  const hayAlguno = contador > 0;
  listeners.forEach((fn) => fn(hayAlguno));
}

export function marcarPanelAbierto() {
  contador += 1;
  avisar();
}

export function marcarPanelCerrado() {
  contador = Math.max(0, contador - 1);
  avisar();
}

// Devuelve una función para desuscribirse (para usar en el cleanup de un useEffect).
export function suscribirsePanelAbierto(fn) {
  listeners.add(fn);
  fn(contador > 0);
  return () => listeners.delete(fn);
}
