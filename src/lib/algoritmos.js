// BFS, DFS y Dijkstra que devuelven una TRAZA paso a paso para animarla.
// Cada paso es una "foto" del estado del algoritmo:
//   linea      -> línea del pseudocódigo que se está ejecutando
//   msg        -> explicación en lenguaje natural
//   actual     -> nodo que se está procesando
//   arista     -> [u, v] que se está revisando (o null)
//   estructura -> contenido de la cola / pila / cola de prioridad
//   visitados  -> nodos ya procesados (cerrados)
//   dist, prev -> distancias y predecesores
//   camino     -> camino final (solo en el último paso)

import { listaAdyacencia, porId } from './grafo.js';

const N = (id) => porId[id].nombre;

function reconstruir(prev, origen, destino) {
  if (destino !== origen && prev[destino] == null) return [];
  const camino = [];
  for (let v = destino; v != null; v = prev[v]) camino.unshift(v);
  return camino;
}

function totales(camino, adj) {
  let km = 0, min = 0;
  for (let i = 0; i < camino.length - 1; i++) {
    const e = adj[camino[i]].find((x) => x.to === camino[i + 1]);
    km += e.km; min += e.min;
  }
  return { km, min, saltos: Math.max(camino.length - 1, 0) };
}

/* ------------------------------------------------------------ BFS */
export function bfs(origen, destino) {
  const adj = listaAdyacencia();
  const pasos = [];
  const dist = { [origen]: 0 }; // aquí dist = nivel (número de tramos)
  const prev = { [origen]: null };
  const cola = [origen];
  const visitados = [];
  const foto = (o) => pasos.push({
    estructura: cola.map((id) => ({ id, etiqueta: `${dist[id]}` })),
    visitados: [...visitados], dist: { ...dist }, prev: { ...prev }, arista: null, actual: null, ...o,
  });

  foto({ linea: 0, msg: `Encolamos ${N(origen)} con nivel 0 y lo marcamos como descubierto.` });
  while (cola.length) {
    const u = cola.shift();
    visitados.push(u);
    foto({ linea: 1, actual: u, msg: `Sacamos ${N(u)} del FRENTE de la cola (FIFO). Nivel ${dist[u]}.` });
    if (u === destino) {
      foto({ linea: 2, actual: u, msg: `¡${N(destino)} encontrado! BFS garantiza el camino con MENOS tramos.` });
      break;
    }
    for (const { to: v } of adj[u]) {
      if (v in dist) {
        foto({ linea: 3, actual: u, arista: [u, v], msg: `${N(v)} ya fue descubierto: se ignora.` });
        continue;
      }
      dist[v] = dist[u] + 1; prev[v] = u; cola.push(v);
      foto({ linea: 4, actual: u, arista: [u, v], msg: `Descubrimos ${N(v)} (nivel ${dist[v]}) y lo ponemos al FINAL de la cola.` });
    }
  }
  return cerrar(pasos, prev, origen, destino, adj, 'bfs');
}

/* ------------------------------------------------------------ DFS */
export function dfs(origen, destino) {
  const adj = listaAdyacencia();
  const pasos = [];
  const prev = { [origen]: null };
  const prof = { [origen]: 0 };
  const pila = [origen];
  const visitados = [];
  const foto = (o) => pasos.push({
    estructura: [...pila].reverse().map((id) => ({ id, etiqueta: `${prof[id]}` })), // tope primero
    visitados: [...visitados], dist: { ...prof }, prev: { ...prev }, arista: null, actual: null, ...o,
  });

  foto({ linea: 0, msg: `Apilamos ${N(origen)}. DFS avanza lo más profundo posible antes de retroceder.` });
  while (pila.length) {
    const u = pila.pop();
    if (visitados.includes(u)) {
      foto({ linea: 1, actual: u, msg: `${N(u)} ya estaba visitado: lo descartamos de la pila.` });
      continue;
    }
    visitados.push(u);
    foto({ linea: 1, actual: u, msg: `Sacamos ${N(u)} del TOPE de la pila (LIFO) y lo visitamos.` });
    if (u === destino) {
      foto({ linea: 2, actual: u, msg: `¡${N(destino)} alcanzado! DFS encuentra UN camino, no necesariamente el más corto.` });
      break;
    }
    // Se apilan en orden inverso para que el primer vecino (alfabético) quede en el tope.
    for (const { to: v } of [...adj[u]].reverse()) {
      if (visitados.includes(v)) {
        foto({ linea: 3, actual: u, arista: [u, v], msg: `${N(v)} ya visitado: no se apila.` });
        continue;
      }
      prev[v] = u; prof[v] = prof[u] + 1; pila.push(v);
      foto({ linea: 4, actual: u, arista: [u, v], msg: `Apilamos ${N(v)} (profundidad ${prof[v]}).` });
    }
  }
  return cerrar(pasos, prev, origen, destino, adj, 'dfs');
}

/* ------------------------------------------------------------ Dijkstra */
// Montículo binario mínimo (cola de prioridad) implementado a mano.
class MinHeap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(x) {
    const a = this.a; a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].d <= a[i].d) break;
      [a[p], a[i]] = [a[i], a[p]]; i = p;
    }
  }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && a[l].d < a[m].d) m = l;
        if (r < a.length && a[r].d < a[m].d) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
  ordenado() { return [...this.a].sort((x, y) => x.d - y.d); }
}

export function dijkstra(origen, destino, peso = 'km') {
  const adj = listaAdyacencia();
  const unidad = peso === 'km' ? 'km' : 'min';
  const pasos = [];
  const dist = { [origen]: 0 };
  const prev = { [origen]: null };
  const pq = new MinHeap();
  pq.push({ id: origen, d: 0 });
  const visitados = [];
  const foto = (o) => pasos.push({
    estructura: pq.ordenado().map(({ id, d }) => ({ id, etiqueta: `${d} ${unidad}`, obsoleto: d > (dist[id] ?? Infinity) })),
    visitados: [...visitados], dist: { ...dist }, prev: { ...prev }, arista: null, actual: null, ...o,
  });

  foto({ linea: 0, msg: `dist[${N(origen)}] = 0, el resto = ∞. Insertamos ${N(origen)} en la cola de prioridad.` });
  while (pq.size) {
    const { id: u, d } = pq.pop();
    if (visitados.includes(u) || d > dist[u]) {
      foto({ linea: 1, actual: u, msg: `Sale ${N(u)} con ${d} ${unidad}, pero es una entrada vieja (ya hay ${dist[u]}). Se descarta.` });
      continue;
    }
    visitados.push(u);
    foto({ linea: 1, actual: u, msg: `Sacamos el MÍNIMO de la cola: ${N(u)} con ${d} ${unidad}. Su distancia queda definitiva.` });
    if (u === destino) {
      foto({ linea: 2, actual: u, msg: `¡${N(destino)} cerrado con ${d} ${unidad}! Es la ruta de menor ${peso === 'km' ? 'distancia' : 'tiempo'}.` });
      break;
    }
    for (const e of adj[u]) {
      const v = e.to; const w = e[peso];
      if (visitados.includes(v)) {
        foto({ linea: 3, actual: u, arista: [u, v], msg: `${N(v)} ya está cerrado: no se relaja.` });
        continue;
      }
      const nueva = dist[u] + w;
      const antes = dist[v];
      if (antes == null || nueva < antes) {
        dist[v] = nueva; prev[v] = u; pq.push({ id: v, d: nueva });
        foto({ linea: 4, actual: u, arista: [u, v], msg: `Relajamos ${N(u)}→${N(v)}: ${dist[u]} + ${w} = ${nueva} ${unidad} ${antes == null ? '(antes ∞)' : `< ${antes}`}. Actualizamos.` });
      } else {
        foto({ linea: 3, actual: u, arista: [u, v], msg: `${N(u)}→${N(v)}: ${dist[u]} + ${w} = ${nueva} ≥ ${antes}. No mejora.` });
      }
    }
  }
  return cerrar(pasos, prev, origen, destino, adj, 'dijkstra');
}

function cerrar(pasos, prev, origen, destino, adj, algoritmo) {
  const camino = reconstruir(prev, origen, destino);
  const tot = totales(camino, adj);
  const ultimo = pasos[pasos.length - 1];
  pasos.push({
    ...ultimo, linea: 5, arista: null, actual: destino, camino,
    msg: camino.length
      ? `Reconstruimos el camino siguiendo prev[] desde el destino: ${camino.map(N).join(' → ')}.`
      : `No hay camino entre ${N(origen)} y ${N(destino)}.`,
  });
  return { algoritmo, pasos, camino, ...tot, explorados: ultimo.visitados.length };
}

export const PSEUDOCODIGO = {
  bfs: [
    'cola ← [origen]; nivel[origen] ← 0',
    'mientras cola no vacía: u ← cola.desencolar()',
    '  si u = destino: terminar',
    '  para cada vecino v de u: si v descubierto → ignorar',
    '    nivel[v] ← nivel[u]+1; prev[v] ← u; cola.encolar(v)',
    'camino ← seguir prev[] desde destino',
  ],
  dfs: [
    'pila ← [origen]',
    'mientras pila no vacía: u ← pila.desapilar(); marcar visitado',
    '  si u = destino: terminar',
    '  para cada vecino v de u: si v visitado → ignorar',
    '    prev[v] ← u; pila.apilar(v)',
    'camino ← seguir prev[] desde destino',
  ],
  dijkstra: [
    'dist[origen] ← 0; resto ← ∞; CP.insertar(origen, 0)',
    'mientras CP no vacía: u ← CP.extraerMin()',
    '  si u = destino: terminar',
    '  para cada vecino v de u (peso w): si v cerrado o no mejora → seguir',
    '    si dist[u]+w < dist[v]: dist[v] ← dist[u]+w; prev[v] ← u; CP.insertar(v)',
    'camino ← seguir prev[] desde destino',
  ],
};
