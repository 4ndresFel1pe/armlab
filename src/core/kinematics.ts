/**
 * Cinemática directa de una cadena serial con la convención DH estándar.
 *
 * Portado de forwardKinematics() y rpyZYX() del prototipo HTML.
 * Todo en SI: metros y radianes.
 */
import type { Joint, Mat4, Vec3 } from './types';
import { dhMatrix, dhParams } from './dh';
import { col3, eye, matMul } from './linalg';

export interface ForwardResult {
  /** A[i] = matriz DH de la articulación i+1 (A[0] es A_1). */
  A: Mat4[];
  /** T[i] = transformación del marco 0 al marco i. T[0] es la identidad; T[n], el efector. */
  T: Mat4[];
}

/**
 * Cinemática directa: T_0^i = A_1 · A_2 ⋯ A_i.
 *
 * @param q  valores articulares opcionales. Si se pasan, se usan en lugar de los
 *           guardados en cada articulación, sin modificar el arreglo `joints`.
 */
export function forwardKinematics(joints: Joint[], q?: number[]): ForwardResult {
  const A: Mat4[] = [];
  // eye(4) y matMul devuelven Matrix (number[][]). Un producto 4×4 · 4×4 siempre
  // da 4×4, así que la aserción `as Mat4` es segura en este archivo.
  const T: Mat4[] = [eye(4) as Mat4];

  joints.forEach((joint, i) => {
    const Ai = dhMatrix(...dhParams(joint, q?.[i]));
    A.push(Ai);
    T.push(matMul(T[i], Ai) as Mat4); // T_0^i = T_0^{i-1} · A_i
  });

  return { A, T };
}

/** Posición del efector final en el marco base (metros). */
export function endEffectorPosition(joints: Joint[], q?: number[]): Vec3 {
  const { T } = forwardKinematics(joints, q);
  return col3(T[joints.length], 3);
}

/**
 * Ángulos roll-pitch-yaw (convención ZYX) de la rotación de T.
 * Devuelve [roll, pitch, yaw] en radianes.
 *
 * Nota: en el prototipo HTML esta función devolvía grados; aquí, como todo el
 * núcleo, devuelve radianes. La conversión a grados la hace la interfaz.
 */
export function rpyZYX(T: Mat4): Vec3 {
  const r11 = T[0][0];
  const r21 = T[1][0];
  const r31 = T[2][0];
  const r32 = T[2][1];
  const r33 = T[2][2];
  return [
    Math.atan2(r32, r33),
    Math.atan2(-r31, Math.hypot(r32, r33)),
    Math.atan2(r21, r11),
  ];
}
