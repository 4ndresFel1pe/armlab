/**
 * Tipos base del núcleo de ArmLab.
 *
 * CONVENCIÓN DE UNIDADES: todo el núcleo trabaja en SI.
 *   - longitudes en metros
 *   - ángulos en radianes
 *   - masas en kilogramos
 * La conversión a centímetros y grados ocurre solo en la interfaz.
 */

/** Tipo de articulación: Revoluta (gira) o Prismática (desliza). */
export type JointType = 'R' | 'P';

/**
 * Una articulación descrita con los cuatro parámetros DH estándar.
 *
 * La variable articular q es:
 *   - theta, si el tipo es 'R'
 *   - d,     si el tipo es 'P'
 * El otro parámetro queda fijo.
 */
export interface Joint {
  type: JointType;
  /** Ángulo de x(i-1) a x(i) alrededor de z(i-1). Radianes. */
  theta: number;
  /** Desplazamiento sobre z(i-1). Metros. */
  d: number;
  /** Longitud del eslabón, sobre x(i). Metros. */
  a: number;
  /** Torsión: ángulo de z(i-1) a z(i) alrededor de x(i). Radianes. */
  alpha: number;
  /** Límite inferior de q. Radianes si es 'R', metros si es 'P'. */
  qMin: number;
  /** Límite superior de q. */
  qMax: number;
}

/** Un robot: una cadena serial de articulaciones. */
export interface Robot {
  name: string;
  joints: Joint[];
}

/** Vector de 3 componentes: [x, y, z]. */
export type Vec3 = [number, number, number];

/** Fila de una matriz 4x4. */
export type Row4 = [number, number, number, number];

/**
 * Matriz homogénea 4x4, almacenada por filas.
 * M[fila][columna] — igual que en los libros de texto.
 */
export type Mat4 = [Row4, Row4, Row4, Row4];

/** Matriz de tamaño variable (el Jacobiano es 6 x n). */
export type Matrix = number[][];