import { useEffect, useMemo, useRef, useState } from 'react';
import { MUNICIPIOS, TRAMOS, porId, claveTramo } from './lib/grafo.js';
import { bfs, dfs, dijkstra, PSEUDOCODIGO } from './lib/algoritmos.js';

/* ---------- proyección lat/lon → SVG ---------- */
const W = 600, H = 700;
const LON0 = -77.12, LON1 = -76.30, LAT0 = 0.28, LAT1 = 1.26;
// Ajuste esquemático del Valle de Sibundoy (municipios a 5-8 km entre sí) para que se lean en pantalla.
const POS = { SAN: [1.150, -77.075], COL: [1.215, -77.0], SIB: [1.240, -76.925], SFR: [1.185, -76.855] };
const lonDe = (m) => (POS[m.id] ? POS[m.id][1] : m.lon);
const latDe = (m) => (POS[m.id] ? POS[m.id][0] : m.lat);
const px = (lon) => 30 + ((lon - LON0) / (LON1 - LON0)) * (W - 60);
const py = (lat) => 30 + ((LAT1 - lat) / (LAT1 - LAT0)) * (H - 60);
// desplazamiento de etiquetas [dx, dy, anchor] para que no se pisen
const ETQ = {
  MOC: [14, -8, 'start'], VIL: [-14, 5, 'end'], PCA: [14, 5, 'start'], PAS: [14, 5, 'start'],
  ORI: [-14, 5, 'end'], HOR: [-14, 5, 'end'], DOR: [-14, 8, 'end'], PGU: [0, 26, 'middle'],
  SFR: [0, 26, 'middle'], SIB: [0, -30, 'middle'], COL: [0, 26, 'middle'], SAN: [0, 26, 'middle'],
};

const INFO = {
  bfs: { nombre: 'BFS', largo: 'Búsqueda en anchura', estructura: 'Cola (FIFO)', col: 'Nivel', complejidad: 'O(V + E)',
    uso: 'Ruta con menos tramos (menos transbordos o peajes), sin mirar los km.' },
  dfs: { nombre: 'DFS', largo: 'Búsqueda en profundidad', estructura: 'Pila (LIFO)', col: 'Prof.', complejidad: 'O(V + E)',
    uso: 'Comprobar si existe conexión. Esta demo se detiene al alcanzar el destino; no garantiza la ruta más corta.' },
  dijkstra: { nombre: 'Dijkstra', largo: 'Camino más corto con pesos', estructura: 'Cola de prioridad (montículo mínimo)', col: 'Dist.', complejidad: 'O((V + E) log V)',
    uso: 'Ruta de menor distancia o menor tiempo cuando los tramos tienen pesos distintos.' },
};

const correr = (alg, o, d, peso, cerrados) => (alg === 'bfs' ? bfs(o, d, cerrados) : alg === 'dfs' ? dfs(o, d, cerrados) : dijkstra(o, d, peso, cerrados));
const fmtMin = (m) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;

export default function App() {
  const [alg, setAlg] = useState('dijkstra');
  const [origen, setOrigen] = useState('MOC');
  const [destino, setDestino] = useState('HOR');
  const [peso, setPeso] = useState('min');
  const [paso, setPaso] = useState(0);
  const [play, setPlay] = useState(false);
  const [vel, setVel] = useState(700);
  const [cerrados, setCerrados] = useState([]);
  const logRef = useRef(null);

  const res = useMemo(() => correr(alg, origen, destino, peso, cerrados), [alg, origen, destino, peso, cerrados]);
  const comparacion = useMemo(() => ['bfs', 'dfs', 'dijkstra'].map((a) => correr(a, origen, destino, peso, cerrados)), [origen, destino, peso, cerrados]);
  const total = res.pasos.length;
  const s = res.pasos[Math.min(paso, total - 1)];
  const final = paso >= total - 1;

  useEffect(() => { setPaso(0); setPlay(false); }, [alg, origen, destino, peso, cerrados]);
  useEffect(() => {
    if (!play) return;
    if (final) { setPlay(false); return; }
    const t = setTimeout(() => setPaso((p) => p + 1), vel);
    return () => clearTimeout(t);
  }, [play, paso, final, vel]);
  useEffect(() => {
    const el = logRef.current?.querySelector('[data-actual="true"]');
    if (el && logRef.current) logRef.current.scrollTop = el.offsetTop - logRef.current.offsetTop - 40;
  }, [paso]);

  const enCamino = new Set();
  const nodosCamino = new Set(s.camino || []);
  (s.camino || []).forEach((v, i, c) => i && enCamino.add(claveTramo(c[i - 1], v)));
  const arbol = new Set(Object.entries(s.prev).filter(([, p]) => p).map(([v, p]) => claveTramo(v, p)));
  const enFrontera = new Set(s.estructura.map((x) => x.id));
  const activa = s.arista ? claveTramo(...s.arista) : null;

  const estadoNodo = (id) => {
    if (nodosCamino.has(id)) return 'camino';
    if (id === s.actual) return 'actual';
    if (s.visitados.includes(id)) return 'visitado';
    if (enFrontera.has(id)) return 'frontera';
    return 'libre';
  };

  const intercambiar = () => { setOrigen(destino); setDestino(origen); };
  const info = INFO[alg];
  const unidad = alg === 'dijkstra' ? (peso === 'km' ? 'km' : 'min') : '';
  const escenario = (tipo) => {
    setPlay(false); setPaso(0); setCerrados([]);
    setOrigen(tipo === 'dfs' ? 'PGU' : 'MOC'); setDestino(tipo === 'dfs' ? 'ORI' : 'HOR');
    setAlg(tipo === 'dfs' ? 'dfs' : 'dijkstra'); setPeso(tipo === 'km' ? 'km' : 'min');
    if (tipo === 'cierre') { setDestino('DOR'); setAlg('dfs'); setCerrados([claveTramo('HOR', 'DOR')]); }
  };

  return (
    <div className="app">
      <header className="cabecera">
        <div className="cab-int">
          <p className="eyebrow">Estructuras de datos avanzadas · Práctica de grafos</p>
          <h1>Rutas del Putumayo</h1>
          <p className="lead">12 cabeceras y 12 conexiones en un modelo del Putumayo. Escoja origen, destino y algoritmo, y siga paso a paso cómo BFS, DFS y Dijkstra recorren la red.</p>
          <p className="autores">Fabian Andres Coral Garcia · Jorge Montoya · Cristian</p>
        </div>
      </header>

      <section className="controles" aria-label="Configuración">
        <div className="grupo">
          <span className="lbl">Algoritmo</span>
          <div className="seg" role="tablist">
            {Object.keys(INFO).map((k) => (
              <button key={k} role="tab" aria-selected={alg === k} className={alg === k ? 'on' : ''} onClick={() => setAlg(k)}>
                {INFO[k].nombre}
              </button>
            ))}
          </div>
        </div>
        <div className="grupo od">
          <label className="lbl" htmlFor="origen">Origen</label>
          <select id="origen" value={origen} onChange={(e) => setOrigen(e.target.value)}>
            {MUNICIPIOS.map((m) => <option key={m.id} value={m.id} disabled={m.id === destino}>{m.nombre}</option>)}
          </select>
          <button className="icono" onClick={intercambiar} aria-label="Intercambiar origen y destino" title="Intercambiar">Intercambiar</button>
          <label className="lbl" htmlFor="destino">Destino</label>
          <select id="destino" value={destino} onChange={(e) => setDestino(e.target.value)}>
            {MUNICIPIOS.map((m) => <option key={m.id} value={m.id} disabled={m.id === origen}>{m.nombre}</option>)}
          </select>
        </div>
        <div className="grupo">
          <span className="lbl">Peso (Dijkstra)</span>
          <div className="seg">
            <button className={peso === 'km' ? 'on' : ''} onClick={() => setPeso('km')} disabled={alg !== 'dijkstra'}>Distancia</button>
            <button className={peso === 'min' ? 'on' : ''} onClick={() => setPeso('min')} disabled={alg !== 'dijkstra'}>Tiempo</button>
          </div>
        </div>
      </section>

      <section className="escenarios" aria-label="Casos de demostración">
        <strong>Demostración guiada</strong>
        <button onClick={() => escenario('km')}>01 · Menos kilómetros</button>
        <button onClick={() => escenario('min')}>02 · Menos tiempo</button>
        <button onClick={() => escenario('dfs')}>03 · DFS y sus límites</button>
        <button onClick={() => escenario('cierre')}>04 · Vía cerrada</button>
      </section>

      <details className="cierres">
        <summary>Simular cierres de vías · {cerrados.length} de {TRAMOS.length} tramos cerrados</summary>
        <p>Marque los tramos que quiere cerrar. El grafo y los tres algoritmos se recalculan con la misma red.</p>
        <div className="lista-cierres">{TRAMOS.map(([a, b]) => {
          const k = claveTramo(a, b);
          return <label key={k}><input type="checkbox" checked={cerrados.includes(k)} onChange={() => setCerrados((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k])} />{porId[a].nombre} — {porId[b].nombre}</label>;
        })}</div>
        <button onClick={() => setCerrados([])} disabled={!cerrados.length}>Restablecer todas las vías</button>
      </details>

      <main className="rejilla">
        <section className="mapa-card" aria-label="Mapa del grafo">
          <div className="mapa-cab">
            <div>
              <strong>{info.nombre}</strong> <span className="tenue">· {info.largo}</span>
            </div>
            <span className="contador">Paso {Math.min(paso + 1, total)} / {total}</span>
          </div>
          <div className="svg-wrap">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Grafo de municipios del Putumayo">
              <defs>
                <pattern id="topo" width="22" height="22" patternUnits="userSpaceOnUse">
                  <path d="M0 11 Q 5.5 6 11 11 T 22 11" className="topo" />
                </pattern>
              </defs>
              <rect x="0" y="0" width={W} height={H} fill="url(#topo)" />
              <text x={W - 24} y={H - 20} className="norte" textAnchor="end">Norte arriba · coordenadas aproximadas</text>
              {TRAMOS.map(([a, b, km, min]) => {
                const k = claveTramo(a, b);
                const A = porId[a], B = porId[b];
                const cerrado = cerrados.includes(k);
                const cls = cerrado ? 'cerrado' : enCamino.has(k) ? 'camino' : k === activa ? 'activa' : arbol.has(k) ? 'arbol' : '';
                const mx = (px(lonDe(A)) + px(lonDe(B))) / 2, my = (py(latDe(A)) + py(latDe(B))) / 2;
                const valle = ['SFR-SIB', 'COL-SIB', 'COL-SAN'].includes(k);
                return (
                  <g key={k} className={`tramo ${cls}`}>
                    <title>{porId[a].nombre} — {porId[b].nombre}: {cerrado ? 'Vía cerrada' : `${km} km, ${min} minutos`}</title>
                    <line x1={px(lonDe(A))} y1={py(latDe(A))} x2={px(lonDe(B))} y2={py(latDe(B))} />
                    {!valle && (
                      <g transform={`translate(${mx},${my})`}>
                        <rect x="-27" y="-10" width="54" height="20" rx="4" className="peso-bg" />
                        <text className="peso" textAnchor="middle" dy="4">
                          {cerrado ? 'Cerrada' : alg === 'dijkstra' && peso === 'min' ? `${min} min` : `${km} km`}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
              {MUNICIPIOS.map((m) => {
                const [dx, dy, anc] = ETQ[m.id];
                const st = estadoNodo(m.id);
                const x = px(lonDe(m)), y = py(latDe(m));
                const d = s.dist[m.id];
                return (
                  <g key={m.id} className={`nodo ${st} ${m.id === origen ? 'es-origen' : ''} ${m.id === destino ? 'es-destino' : ''}`}>
                    {(m.id === origen || m.id === destino) && <circle cx={x} cy={y} r="15" className="anillo" />}
                    <circle cx={x} cy={y} r={m.capital ? 10 : 8} />
                    <text x={x + dx} y={y + dy} textAnchor={anc} className="nombre">{m.nombre}</text>
                    {d != null && (
                      <text x={x + dx} y={y + dy + 14} textAnchor={anc} className="dist">
                        {alg === 'dijkstra' ? `${d} ${unidad}` : `${alg === 'bfs' ? 'nivel' : 'prof.'} ${d}`}
                      </text>
                    )}
                  </g>
                );
              })}
              <text x={px(-76.96)} y={py(1.075)} textAnchor="middle" className="region">Valle de Sibundoy</text>
            </svg>
          </div>
          <ul className="leyenda">
            <li><i className="sw libre" />Sin descubrir</li>
            <li><i className="sw frontera" />En {alg === 'dfs' ? 'la pila' : 'la cola'}</li>
            <li><i className="sw actual" />Procesando</li>
            <li><i className="sw visitado" />Visitado</li>
            <li><i className="sw camino" />Ruta final</li>
            <li><i className="sw cerrado" />Vía cerrada</li>
          </ul>
          <div className="reproductor">
            <button onClick={() => { setPaso(0); setPlay(false); }} aria-label="Reiniciar">Reiniciar</button>
            <button onClick={() => setPaso((p) => Math.max(p - 1, 0))} disabled={paso === 0} aria-label="Paso anterior">Anterior</button>
            <button className="primario" onClick={() => (final ? (setPaso(0), setPlay(true)) : setPlay(!play))}>
              {play ? 'Pausa' : final ? 'Repetir' : 'Reproducir'}
            </button>
            <button onClick={() => setPaso((p) => Math.min(p + 1, total - 1))} disabled={final} aria-label="Paso siguiente">Siguiente</button>
            <button onClick={() => { setPaso(total - 1); setPlay(false); }} disabled={final}>Ir al final</button>
            <label className="vel" htmlFor="vel">Velocidad
              <input id="vel" type="range" min="150" max="1500" step="50" value={1650 - vel} onChange={(e) => setVel(1650 - +e.target.value)} />
            </label>
          </div>
          <label className="progreso" htmlFor="paso">Explorar la traza
            <input id="paso" type="range" min="0" max={total - 1} value={Math.min(paso, total - 1)} onChange={(e) => { setPlay(false); setPaso(Number(e.target.value)); }} />
          </label>
        </section>

        <aside className="panel">
          <div className="bloque explicacion" aria-live="polite">
            <span className="lbl">Qué está pasando</span>
            <p>{s.msg}</p>
          </div>

          <div className="bloque">
            <span className="lbl">{info.estructura}</span>
            <div className={`estructura ${alg}`}>
              {s.estructura.length === 0 && <span className="vacia">vacía</span>}
              {s.estructura.map((x, i) => (
                <span key={i} className={`ficha ${x.obsoleto ? 'obsoleta' : ''}`}>
                  {porId[x.id].nombre}<small>{x.etiqueta}</small>
                </span>
              ))}
            </div>
            <p className="ayuda">
              {alg === 'bfs' && 'Sale por la izquierda (frente), entra por la derecha (final).'}
              {alg === 'dfs' && 'El primero de la izquierda es el TOPE: es el próximo en salir.'}
              {alg === 'dijkstra' && 'Ordenada por distancia: siempre sale la menor. Las tachadas son entradas viejas.'}
            </p>
          </div>

          <div className="bloque">
            <span className="lbl">Pseudocódigo</span>
            <ol className="pseudo">
              {PSEUDOCODIGO[alg].map((l, i) => <li key={i} className={s.linea === i ? 'on' : ''}><code>{l}</code></li>)}
            </ol>
          </div>

          <div className="bloque">
            <span className="lbl">Tabla de {alg === 'dijkstra' ? 'distancias' : alg === 'bfs' ? 'niveles' : 'profundidades'}</span>
            <div className="tabla-wrap" ref={logRef}>
              <table>
                <thead><tr><th>Municipio</th><th className="num">{info.col}</th><th>Previo</th><th>Estado</th></tr></thead>
                <tbody>
                  {MUNICIPIOS.map((m) => {
                    const st = estadoNodo(m.id);
                    return (
                      <tr key={m.id} data-actual={m.id === s.actual} className={`fila ${st}`}>
                        <td>{m.nombre}</td>
                        <td className="num">{s.dist[m.id] ?? '∞'}</td>
                        <td>{s.prev[m.id] ? porId[s.prev[m.id]].nombre : '—'}</td>
                        <td><span className={`pill ${st}`}>{{ libre: 'sin ver', frontera: 'en espera', actual: 'actual', visitado: 'cerrado', camino: 'en ruta' }[st]}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </aside>
      </main>

      <section className={`resultado ${final ? 'listo' : ''}`} aria-label="Resultado">
        <div className="res-ruta">
          <span className="lbl">Ruta encontrada por {info.nombre}</span>
          <p className="ruta" role="status">{final ? (res.camino.length ? res.camino.map((id) => porId[id].nombre).join('  →  ') : 'Sin conexión: no existe una ruta con las vías habilitadas.') : 'Reproduzca o avance hasta el final para ver la ruta.'}</p>
        </div>
        <dl className="cifras">
          <div><dt>Distancia</dt><dd>{final && res.camino.length ? `${res.km} km` : '—'}</dd></div>
          <div><dt>Tiempo estimado</dt><dd>{final && res.camino.length ? fmtMin(res.min) : '—'}</dd></div>
          <div><dt>Tramos</dt><dd>{final && res.camino.length ? res.saltos : '—'}</dd></div>
          <div><dt>Nodos explorados</dt><dd>{final ? res.explorados : '—'}</dd></div>
        </dl>
      </section>

      <section className="comparar">
        <h2>Los tres algoritmos, mismo viaje</h2>
        <p className="tenue">{porId[origen].nombre} → {porId[destino].nombre}. Dijkstra usa el peso elegido arriba ({peso === 'km' ? 'distancia' : 'tiempo'}).</p>
        <div className="tabla-wrap">
          <table>
            <thead><tr><th>Algoritmo</th><th>Estructura</th><th>Ruta</th><th className="num">km</th><th className="num">Tiempo</th><th className="num">Tramos</th><th className="num">Explorados</th><th>Complejidad</th></tr></thead>
            <tbody>
              {comparacion.map((r) => {
                const mejorKm = Math.min(...comparacion.filter((x) => x.camino.length).map((x) => x.km));
                const mejorMin = Math.min(...comparacion.filter((x) => x.camino.length).map((x) => x.min));
                return (
                  <tr key={r.algoritmo} className={r.algoritmo === alg ? 'sel' : ''}>
                    <td><strong>{INFO[r.algoritmo].nombre}</strong></td>
                    <td>{INFO[r.algoritmo].estructura}</td>
                    <td className="ruta-cel">{r.camino.length ? r.camino.map((id) => porId[id].nombre).join(' → ') : 'Sin conexión'}</td>
                    <td className={`num ${r.camino.length && r.km === mejorKm ? 'mejor' : ''}`}>{r.camino.length ? r.km : '—'}</td>
                    <td className={`num ${r.camino.length && r.min === mejorMin ? 'mejor' : ''}`}>{r.camino.length ? fmtMin(r.min) : '—'}</td>
                    <td className="num">{r.camino.length ? r.saltos : '—'}</td>
                    <td className="num">{r.explorados}</td>
                    <td><code>{INFO[r.algoritmo].complejidad}</code></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="usos">
          {Object.entries(INFO).map(([k, v]) => (
            <article key={k}>
              <h3>{v.nombre} <span className="tenue">{v.complejidad}</span></h3>
              <p>{v.uso}</p>
            </article>
          ))}
        </div>
        <p className="tip"><strong>Con todas las vías abiertas:</strong> Mocoa → La Hormiga por distancia da 176 km; por tiempo, 183 km y 3 h 58 min (29 minutos menos). Puerto Guzmán → Orito: DFS recorre 231 km; BFS y Dijkstra, 162 km.</p>
        <p className="ayuda">Las complejidades corresponden al núcleo de los algoritmos sobre una lista de adyacencia. Esta demo añade copias de estado en cada paso y ordena la cola de prioridad para mostrarla; guardar y reproducir la traza tiene un costo adicional. La cola mostrada ordenada no es la distribución interna del montículo.</p>
      </section>

      <footer className="pie">
        <p>Modelo académico de 12 cabeceras y 12 conexiones; no representa toda la red vial del departamento. La Hormiga es cabecera de Valle del Guamuez y La Dorada, de San Miguel. Se conserva el conjunto de datos aportado por el grupo: distancias y tiempos aproximados, con tramos repartidos proporcionalmente y sin validación vial independiente. No usar para navegación. Puerto Leguízamo no forma parte del modelo.</p>
      </footer>
    </div>
  );
}
