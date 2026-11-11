import test from 'node:test';
import assert from 'node:assert/strict';
import { bfs, dfs, dijkstra } from './algoritmos.js';
import { MUNICIPIOS, TRAMOS, claveTramo, listaAdyacencia } from './grafo.js';

const ids = MUNICIPIOS.map((m) => m.id);
// Oráculo independiente: Floyd–Warshall para todas las parejas.
function distancias(peso, cerrados) {
  const d = Object.fromEntries(ids.map((a) => [a, Object.fromEntries(ids.map((b) => [b, a === b ? 0 : Infinity]))]));
  for (const [a, b, km, min] of TRAMOS) {
    if (cerrados.includes(claveTramo(a, b))) continue;
    d[a][b] = d[b][a] = peso === 'km' ? km : peso === 'min' ? min : 1;
  }
  for (const k of ids) for (const a of ids) for (const b of ids) d[a][b] = Math.min(d[a][b], d[a][k] + d[k][b]);
  return d;
}

test('Todas las parejas: rutas válidas y óptimos frente a Floyd–Warshall, con cierres', () => {
  const escenarios = [[], ...TRAMOS.map(([a, b]) => [claveTramo(a, b)]), TRAMOS.map(([a, b]) => claveTramo(a, b))];
  for (const cerrados of escenarios) {
    const adj = listaAdyacencia(cerrados);
    const oraculos = Object.fromEntries(['km', 'min', 'saltos'].map((p) => [p, distancias(p, cerrados)]));
    for (const a of ids) for (const b of ids) {
      const resultados = [bfs(a, b, cerrados), dfs(a, b, cerrados), dijkstra(a, b, 'km', cerrados), dijkstra(a, b, 'min', cerrados)];
      for (const r of resultados) {
        assert.equal(Boolean(r.camino.length), Number.isFinite(oraculos.km[a][b]));
        assert.equal(new Set(r.camino).size, r.camino.length, 'El camino no tiene ciclos');
        let km = 0, min = 0;
        if (r.camino.length) { assert.equal(r.camino[0], a); assert.equal(r.camino.at(-1), b); }
        for (let i = 1; i < r.camino.length; i++) {
          const e = adj[r.camino[i - 1]].find((v) => v.to === r.camino[i]);
          assert.ok(e, 'Cada arista debe existir y estar habilitada'); km += e.km; min += e.min;
        }
        assert.equal(r.km, km); assert.equal(r.min, min);
        assert.deepEqual(r.pasos.at(-1).camino, r.camino);
        if (!r.camino.length) assert.equal(r.pasos.at(-1).actual, null, 'Un destino inaccesible no se marca como procesado');
      }
      if (resultados[0].camino.length) {
        assert.equal(resultados[0].saltos, oraculos.saltos[a][b]);
        assert.equal(resultados[2].km, oraculos.km[a][b]);
        assert.equal(resultados[3].min, oraculos.min[a][b]);
      }
    }
  }
});

test('Casos de la sustentación y datos de entrada', () => {
  assert.equal(dijkstra('MOC', 'HOR', 'km').km, 176);
  assert.equal(dijkstra('MOC', 'HOR', 'min').min, 238);
  assert.equal(dfs('PGU', 'ORI').km, 231);
  assert.equal(bfs('PGU', 'ORI').km, 162);
  assert.deepEqual(dfs('MOC', 'DOR', [claveTramo('HOR', 'DOR')]).camino, []);
  assert.throws(() => bfs('XXX', 'MOC'), RangeError);
  assert.throws(() => dijkstra('MOC', 'HOR', 'otro'), RangeError);
});
