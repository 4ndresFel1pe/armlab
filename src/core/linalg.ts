/**
 * Álgebra lineal mínima para el núcleo de ArmLab.
 *
 * Portado del bloque ==MATH-START== / ==MATH-END== del prototipo
 * "Simulador de Brazo Robótico.html". Las matrices son arreglos de filas:
 * M[fila][columna].
 */
import type { Vec3, Mat4, Matrix } from './types';

/** Matriz identidad n×n. */
export function eye(n: number): Matrix {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
}

/** Producto de matrices A (m×k) · B (k×n). */
export function matMul(A: Matrix, B: Matrix): Matrix {
  const m = A.length;
  const k = B.length;
  const n = B[0].length;
  const C = Array.from({ length: m }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let p = 0; p < k; p++) {
      const a = A[i][p];
      if (a === 0) continue; // atajo: un cero no aporta nada a la suma
      for (let j = 0; j < n; j++) C[i][j] += a * B[p][j];
    }
  }
  return C;
}

/** Transpuesta de A. */
export function transpose(A: Matrix): Matrix {
  return A[0].map((_, j) => A.map((row) => row[j]));
}

/** Columna c de una matriz homogénea 4×4, solo filas 0–2. */
export function col3(T: Mat4, c: number): Vec3 {
  return [T[0][c], T[1][c], T[2][c]];
}

/** Resta de vectores: a − b. */
export function sub3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Producto cruz: a × b. */
export function cross3(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** Magnitud (norma euclidiana) de un vector. */
export function norm3(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

/** Acota v al rango [lo, hi]. */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export interface EigenResult {
  /** Valores propios, en el orden en que los dejó el algoritmo. */
  values: number[];
  /** vectors[k][p] = componente k del vector propio p. */
  vectors: number[][];
}

/**
 * Valores y vectores propios de una matriz simétrica (método de Jacobi).
 * No modifica S: trabaja sobre una copia.
 */
export function symEig(S: Matrix): EigenResult {
  const n = S.length;
  const A = S.map((row) => row.slice());
  const V = eye(n);

  for (let sweep = 0; sweep < 60; sweep++) {
    // Suma de cuadrados fuera de la diagonal: si es despreciable, terminó.
    let off = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    }
    if (off < 1e-22) break;

    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        // Rotación de Jacobi que anula A[p][q]
        const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = A[k][p];
          const akq = A[k][q];
          A[k][p] = c * akp - s * akq;
          A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k];
          const aqk = A[q][k];
          A[p][k] = c * apk - s * aqk;
          A[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p];
          const vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq;
          V[k][q] = s * vkp + c * vkq;
        }
      }
    }
  }

  return { values: A.map((row, i) => row[i]), vectors: V };
}

/**
 * Resuelve A·x = b para un sistema 3×3 por regla de Cramer.
 * Si A es singular (determinante ≈ 0) devuelve [0, 0, 0].
 */
export function solve3(A: Matrix, b: Vec3): Vec3 {
  const det = (M: Matrix) =>
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
    M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
    M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);

  const D = det(A);
  if (Math.abs(D) < 1e-14) return [0, 0, 0];

  // x[c] = det(A con la columna c reemplazada por b) / det(A)
  const x = (c: number) =>
    det(A.map((row, r) => row.map((v, k) => (k === c ? b[r] : v)))) / D;
  return [x(0), x(1), x(2)];
}
