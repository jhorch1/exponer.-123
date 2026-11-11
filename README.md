# Rutas del Putumayo · BFS, DFS y Dijkstra

Frontend en React + Vite que muestra **paso a paso** cómo funcionan tres algoritmos de grafos sobre la red vial de 12 municipios del Putumayo (Colombia).

**Práctica:** Estructuras de datos avanzadas y algoritmos eficientes · Instituto Tecnológico del Putumayo.

## Qué muestra

- Mapa del grafo (nodos = municipios, aristas = tramos de carretera con km y minutos).
- Animación paso a paso con reproducir / pausa / avanzar / retroceder y control de velocidad.
- La estructura de datos de cada algoritmo en vivo: **cola** (BFS), **pila** (DFS) y **cola de prioridad / montículo mínimo** (Dijkstra).
- Pseudocódigo con la línea que se ejecuta resaltada.
- Tabla de distancias, predecesores (`prev[]`) y estado de cada nodo.
- Ruta final con distancia, tiempo, tramos y nodos explorados.
- Comparación de los tres algoritmos para el mismo origen y destino.

## Ejecutar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/ para publicar
npm run build:single  # genera dist-single/index.html (un solo archivo)
```

Para publicar en GitHub Pages: mueva `deploy-pages.yml` a `.github/workflows/deploy-pages.yml`, suba el repositorio
y en GitHub active *Settings → Pages → Source: GitHub Actions*. Cada push a `main` vuelve a publicar.

## Estructura

```
src/
  lib/grafo.js        # municipios, tramos y lista de adyacencia
  lib/algoritmos.js   # BFS, DFS, Dijkstra (con montículo propio) que generan la traza
  App.jsx             # interfaz: mapa SVG, reproductor, panel de estado
  index.css           # estilos (tema claro y oscuro)
```

## Algoritmos

| Algoritmo | Estructura | Complejidad | Qué garantiza |
|---|---|---|---|
| BFS | Cola (FIFO) | O(V + E) | Camino con **menos tramos** |
| DFS | Pila (LIFO) | O(V + E) | **Un** camino (conectividad), no el más corto |
| Dijkstra | Cola de prioridad (montículo binario) | O((V + E) log V) | Camino de **menor peso** (km o minutos), pesos ≥ 0 |

Representación: **lista de adyacencia** (el grafo es disperso: 12 nodos, 12 aristas).

### Casos para la exposición

- **Mocoa → La Hormiga**: Dijkstra por distancia elige la vía directa desde Puerto Asís (176 km, 4 h 27 min);
  por tiempo prefiere pasar por Orito (183 km, 3 h 58 min).
- **Puerto Guzmán → Orito**: DFS devuelve una ruta de 231 km; BFS y Dijkstra, la de 162 km.
- **Santiago → La Dorada**: el recorrido más largo de la red (9 tramos).

## Datos

Distancias y tiempos **aproximados**, redondeados a partir de calculadoras públicas:
[calcularruta.com](https://www.calcularruta.com/de-mocoa-a-puerto-asis.html) (Mocoa–Puerto Asís 87 km; Puerto Asís–La Hormiga por Orito 96 km; Villagarzón–Puerto Guzmán 32 km; Mocoa–San Francisco 77 km),
[distanciasentre.com](https://www.distanciasentre.com/) y [geodatos.net](https://www.geodatos.net/en/distances/cities/colombia/putumayo).
Los tramos internos se repartieron proporcionalmente. Puerto Leguízamo no se incluye porque no tiene conexión por carretera.
En el mapa, los municipios del Valle de Sibundoy se separan un poco para que se lean.
