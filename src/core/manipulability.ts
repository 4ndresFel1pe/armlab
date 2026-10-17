/**
 * Valores singulares y manipulabilidad de Yoshikawa.
 *
 * Portado de singularValues() y manipulability() del prototipo HTML.
 */
import type { Matrix } from './types';
import { matMul, symEig, transpose } from './linalg';

/**
 * Valores singulares de M (m × n), ordenados de mayor a menor.
 * Devuelve min(m, n) valores.
 */
export function singularValues(M: Matrix): number[] {
  const m = M.length;
  const n = M[0].length;
  const Mt = transpose(M);
  // Se usa la matriz de Gram más pequeña: MᵀM (n×n) o MMᵀ (m×m).
  const G = n <= m ? matMul(Mt, M) : matMul(M, Mt);
  return symEig(G)
    .values.map((v) => Math.sqrt(Math.max(v, 0))) // max(…, 0): el redondeo puede dar −1e-17
    .sort((a, b) => b - a);
}

export interface ManipulabilityResult {
  /** Filas del Jacobiano de tarea. */
  m: number;
  /** Número de articulaciones. */
  n: number;
  /** Valores singulares, de mayor a menor. */
  s: number[];
  /** Medida de Yoshikawa: w = raíz(det(J·Jᵀ)) */
  w: number;
  rank: number;
  /** Rango máximo posible: min(m, n). */
  full: number;
  /** Número de condición: sigma_max / sigma_min. */
  kappa: number;
  /** Isotropía: 1 / kappa. Entre 0 y 1. */
  iso: number;
}

/**
 * Manipulabilidad de Yoshikawa: w = √det(J Jᵀ) = σ1·σ2···σm  (si n ≥ m).
 * Si n < m se usa √det(Jᵀ J) = producto de los n valores singulares.
 *
 * @param M  Jacobiano de tarea (ver `taskJacobian`).
 */
export function manipulability(M: Matrix): ManipulabilityResult {
  const m = M.length;
  const n = M[0].length;
  const s = singularValues(M);
  const w = s.reduce((product, sigma) => product * sigma, 1);
  const smax = s[0] || 0;
  const smin = s[s.length - 1] || 0;
  // Debajo de esta tolerancia un valor singular se considera cero.
  const tol = 1e-7 * Math.max(1, smax);
  const rank = s.filter((sigma) => sigma > tol).length;

  return {
    m,
    n,
    s,
    w,
    rank,
    full: Math.min(m, n),
    kappa: smin > tol ? smax / smin : Infinity,
    iso: smax > tol ? smin / smax : 0,
  };
}
