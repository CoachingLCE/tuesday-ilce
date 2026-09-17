// Paleta de colores compartida por grupos y opciones de estado del tablero.
export const PALETA_COLORES = [
  '#579bfc', '#00c875', '#fdab3d', '#e2445c', '#a25ddc',
  '#037f4c', '#0086c0', '#ff642e', '#9d99b9', '#66ccff'
];

export function colorSiguiente(usados) {
  const disponible = PALETA_COLORES.find((c) => !usados.includes(c));
  return disponible || PALETA_COLORES[usados.length % PALETA_COLORES.length];
}
