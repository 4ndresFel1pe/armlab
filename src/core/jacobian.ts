/**
 * Jacobiano geométrico de una cadena serial.
 *
 * Portado de geometricJacobian() y taskJacobian() del prototipo HTML.
 */
import type { Joint, Mat4, Matrix, Vec3 } from './types';
import { col3, cross3, sub3 } from './linalg';

/**
 * Jacobiano geométrico 6 × n.
 *
 *   Revoluta:    J_i = [ z(i-1) × (o_n − o(i-1)) ;  z(i-1) ]
 *   Prismática:  J_i = [ z(i-1) ;  0 ]
 *
 * Filas 0–2: velocidad lineal (m/rad en revoluta, m/m en prismática).
 * Filas 3–5: velocidad angular (rad/rad).
 *
 * @param T  marcos T[0] … T[n] de `forwardKinematics`.
 */
export function geometricJacobian(joints: Joint[], T: Mat4[]): Matrix {
  const n = joints.length;
  const on = col3(T[n], 3); // o_n: origen del efector
  const J: Matrix = Array.from({ length: 6 }, () => new Array<number>(n).fill(0));

  for (let i = 0; i < n; i++) {
    const z = col3(T[i], 2); // z_{i-1}: eje de la articulación i
    const o = col3(T[i], 3); // o_{i-1}: origen del marco i-1
    const isR = joints[i].type === 'R';
    const lin: Vec3 = isR ? cross3(z, sub3(on, o)) : z;
    const ang: Vec3 = isR ? z : [0, 0, 0];
    for (let r = 0; r < 3; r++) {
      J[r][i] = lin[r];
      J[r + 3][i] = ang[r];
    }
  }

  return J;
}

/** Espacio de tarea: qué parte del movimiento del efector interesa. */
export type Task = 'pos' | 'xy' | 'rot' | 'full';

/** Filas del Jacobiano que corresponden a cada espacio de tarea. */
const TASK_ROWS: Record<Task, number[]> = {
  pos: [0, 1, 2], // velocidad lineal: J_v
  xy: [0, 1], // solo el plano XY (brazos planares)
  rot: [3, 4, 5], // velocidad angular: J_ω
  full: [0, 1, 2, 3, 4, 5], // Jacobiano completo
};

/** Submatriz del Jacobiano para un espacio de tarea. Devuelve copias de las filas. */
export function taskJacobian(J: Matrix, task: Task): Matrix {
  return TASK_ROWS[task].map((r) => J[r].slice());
}
