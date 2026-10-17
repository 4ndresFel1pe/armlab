import type { Joint, Mat4 } from './types';

/**
 * Matriz homogénea de la convención DH estándar:
 *
 *   A = Rot_z(theta) · Trans_z(d) · Trans_x(a) · Rot_x(alpha)
 *
 * @param theta  radianes
 * @param d      metros
 * @param a      metros
 * @param alpha  radianes
 */
export function dhMatrix(
  theta: number,
  d: number,
  a: number,
  alpha: number,
): Mat4 {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);

  return [
    [ct, -st * ca,  st * sa, a * ct],
    [st,  ct * ca, -ct * sa, a * st],
    [0,   sa,       ca,      d     ],
    [0,   0,        0,       1     ],
  ];
}

/** Valor actual de la variable articular q: theta si es 'R', d si es 'P'. */
export function jointValue(j: Joint): number {
  return j.type === 'R' ? j.theta : j.d;
}

/**
 * Los cuatro parámetros DH de una articulación, listos para `dhMatrix`.
 * Si se pasa `q`, sustituye la variable articular correspondiente.
 */
export function dhParams(
  j: Joint,
  q?: number,
): [number, number, number, number] {
  const v = q ?? jointValue(j);
  const theta = j.type === 'R' ? v : j.theta;
  const d = j.type === 'P' ? v : j.d;
  return [theta, d, j.a, j.alpha];
}