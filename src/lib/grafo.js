// Grafo de municipios del Putumayo (Colombia).
// Nodos: cabeceras municipales con coordenadas aproximadas (lat, lon).
// Aristas: tramos de carretera. km y minutos son APROXIMADOS, tomados de
// calculadoras de ruta públicas (ver README) y redondeados.

export const MUNICIPIOS = [
  { id: 'MOC', nombre: 'Mocoa', lat: 1.1466, lon: -76.6467, capital: true },
  { id: 'VIL', nombre: 'Villagarzón', lat: 1.0294, lon: -76.6164 },
  { id: 'PCA', nombre: 'Puerto Caicedo', lat: 0.6847, lon: -76.6044 },
  { id: 'PAS', nombre: 'Puerto Asís', lat: 0.5052, lon: -76.4952 },
  { id: 'ORI', nombre: 'Orito', lat: 0.6664, lon: -76.8728 },
  { id: 'HOR', nombre: 'La Hormiga', lat: 0.4211, lon: -76.9064 },
  { id: 'DOR', nombre: 'La Dorada', lat: 0.3442, lon: -76.9125 },
  { id: 'PGU', nombre: 'Puerto Guzmán', lat: 0.9636, lon: -76.4086 },
  { id: 'SFR', nombre: 'San Francisco', lat: 1.1764, lon: -76.8781 },
  { id: 'SIB', nombre: 'Sibundoy', lat: 1.2036, lon: -76.9197 },
  { id: 'COL', nombre: 'Colón', lat: 1.1897, lon: -76.9736 },
  { id: 'SAN', nombre: 'Santiago', lat: 1.1475, lon: -77.0011 },
];

// [origen, destino, km, minutos, nota]
export const TRAMOS = [
  ['MOC', 'VIL', 15, 20, 'Troncal (Ruta 45)'],
  ['VIL', 'PCA', 47, 60, 'Troncal (Ruta 45)'],
  ['PCA', 'PAS', 25, 37, 'Troncal (Ruta 45)'],
  ['VIL', 'PGU', 32, 179, 'Vía secundaria destapada'],
  ['PAS', 'ORI', 58, 70, 'Vía Puerto Asís – Orito'],
  ['ORI', 'HOR', 38, 51, 'Vía Orito – La Hormiga'],
  ['PAS', 'HOR', 89, 150, 'Vía alterna directa'],
  ['HOR', 'DOR', 15, 20, 'Vía a San Miguel'],
  ['MOC', 'SFR', 77, 172, 'Vía Mocoa – San Francisco (montaña)'],
  ['SFR', 'SIB', 8, 12, 'Valle de Sibundoy'],
  ['SIB', 'COL', 5, 8, 'Valle de Sibundoy'],
  ['COL', 'SAN', 6, 9, 'Valle de Sibundoy'],
];

export const porId = Object.fromEntries(MUNICIPIOS.map((m) => [m.id, m]));

// Lista de adyacencia: { MOC: [{ to, km, min, nota }], ... }
// Los vecinos se ordenan alfabéticamente para que el recorrido sea reproducible.
export function listaAdyacencia(cerrados = []) {
  const bloqueados = new Set(cerrados);
  const adj = Object.fromEntries(MUNICIPIOS.map((m) => [m.id, []]));
  for (const [a, b, km, min, nota] of TRAMOS) {
    if (bloqueados.has(claveTramo(a, b))) continue;
    adj[a].push({ to: b, km, min, nota });
    adj[b].push({ to: a, km, min, nota });
  }
  for (const id in adj) {
    adj[id].sort((x, y) => porId[x.to].nombre.localeCompare(porId[y.to].nombre, 'es'));
  }
  return adj;
}

export const claveTramo = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
