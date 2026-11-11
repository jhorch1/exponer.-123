# Rutas del Putumayo · BFS, DFS y Dijkstra

Frontend en React + Vite que muestra **paso a paso** cómo funcionan tres algoritmos de grafos sobre la red vial de 12 municipios del Putumayo (Colombia).

Versión completada localmente a partir del proyecto de https://github.com/jhorch1/exponer.-123.
Integrantes: Fabian Andres Coral Garcia, Jorge Montoya y Cristian.
Se modelan 12 cabeceras y 12 conexiones, no toda la red vial del departamento.

## Entrega y demostración

El archivo `Rutas-del-Putumayo.html` de la entrega se abre directamente en un navegador, sin instalación ni internet. Incluye cuatro casos guiados, cierre de cualquier tramo, detección de destinos inaccesibles y barra para recorrer la traza. Los cambios de configuración reinician la reproducción.

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
npm test             # todas las parejas; oráculo Floyd–Warshall y cierres
```

Para publicar en GitHub Pages: el flujo ya está en `.github/workflows/deploy-pages.yml`; suba los cambios a un repositorio autorizado
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

Estas cotas excluyen la construcción/ordenación de la lista y la generación de la traza. BFS usa índice de cabeza; DFS y Dijkstra consultan nodos procesados con `Set`. El espacio auxiliar sin traza es O(V) para BFS y O(V+E) para esta versión de DFS y Dijkstra, que permiten entradas pendientes repetidas. Cada foto copia estados; Dijkstra además ordena una copia del montículo para la visualización. La cola mostrada no es el arreglo interno del heap.

Pruebas: las 144 parejas en 14 escenarios (red abierta, cada uno de los 12 cierres individuales y red completamente cerrada), cuatro ejecuciones por pareja: 8.064 ejecuciones. BFS se contrasta con mínimos de aristas; Dijkstra con mínimos de km y minutos mediante Floyd–Warshall. DFS se comprueba por conectividad y validez del camino. También se prueban origen=destino y entradas inválidas. No se exige que DFS devuelva un óptimo.

Representación: **lista de adyacencia** (el grafo es disperso: 12 nodos, 12 aristas).

### Casos para la exposición

- **Mocoa → La Hormiga**: Dijkstra por distancia elige la vía directa desde Puerto Asís (176 km, 4 h 27 min);
  por tiempo prefiere pasar por Orito (183 km, 3 h 58 min).
- **Puerto Guzmán → Orito**: DFS devuelve una ruta de 231 km; BFS y Dijkstra, la de 162 km.
- **Santiago → La Dorada**: el recorrido más largo de la red (9 tramos).
- **Mocoa → La Dorada con La Hormiga–La Dorada cerrada**: los tres algoritmos informan que no hay conexión. Restablecer la vía hace accesible el destino.

## Datos

Distancias y tiempos **aproximados**, redondeados a partir de calculadoras públicas:
[calcularruta.com](https://www.calcularruta.com/de-mocoa-a-puerto-asis.html) (Mocoa–Puerto Asís 87 km; Puerto Asís–La Hormiga por Orito 96 km; Villagarzón–Puerto Guzmán 32 km; Mocoa–San Francisco 77 km),
[distanciasentre.com](https://www.distanciasentre.com/) y [geodatos.net](https://www.geodatos.net/en/distances/cities/colombia/putumayo).
Los tramos internos se repartieron proporcionalmente. Las fuentes anteriores son las declaradas en el material original del grupo y no fueron verificadas de forma independiente en esta revisión. No utilizar como información de navegación. Puerto Leguízamo no forma parte de este modelo.
En el mapa, los municipios del Valle de Sibundoy se separan un poco para que se lean.
