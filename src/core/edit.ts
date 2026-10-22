/**
 * Operaciones de edición del diseño.
 *
 * Todas son funciones puras: reciben el diseño anterior y devuelven uno nuevo,
 * **nunca** modifican el que recibieron. Cada una toca el robot y la pose en el
 * mismo paso, así es imposible alargar uno y olvidar el otro.
 *
 * Si una operación no aplica (agregar con el tope lleno, quitar la última
 * articulación…), devuelve el mismo objeto que recibió. React ve que el estado
 * es idéntico y no repinta: es la forma correcta de rechazar un cambio.
 *
 * Viven en `core/` (no en App.tsx) para poder probarlas sin React.
 */
import type { Joint, JointType, Robot } from './types';
import type { Design } from './format';
import { jointValue } from './dh';
import { clamp } from './linalg';

/** Tope de articulaciones del editor. Un archivo puede traer hasta 12. */
export const MAX_JOINTS = 8;

/**
 * Lo que se puede cambiar con `patchJoint`: todo menos el tipo.
 * El tipo se cambia con `changeJointType`, que además ajusta límites y pose.
 */
export type JointPatch = Partial<Omit<Joint, 'type'>>;

/** El diseño que se obtiene al abrir un robot: su estructura y su pose inicial. */
export function designFromRobot(robot: Robot): Design {
  return { robot, pose: robot.joints.map(jointValue) };
}

/** Articulación que se agrega al presionar "Agregar articulación". */
export function defaultJoint(): Joint {
  return {
    type: 'R',
    theta: 0,
    d: 0,
    a: 0.1,                      // 10 cm
    alpha: 0,
    qMin: -Math.PI,
    qMax: Math.PI,
  };
}

/** Límites por defecto según el tipo, en unidades SI. */
export function defaultLimits(type: JointType): { qMin: number; qMax: number } {
  return type === 'R'
    ? { qMin: -Math.PI, qMax: Math.PI }   // ±180°
    : { qMin: 0, qMax: 0.2 };             // 0 a 20 cm
}

/**
 * Mueve una articulación (lo que hace el deslizador). Solo cambia la pose:
 * el robot sigue siendo el mismo objeto.
 */
export function setJointValue(design: Design, index: number, value: number): Design {
  const { qMin, qMax } = design.robot.joints[index];
  return {
    ...design,
    pose: design.pose.map((v, i) => (i === index ? clamp(value, qMin, qMax) : v)),
  };
}

/** Cambia uno o varios campos de una articulación y reacota su pose. */
export function patchJoint(design: Design, index: number, patch: JointPatch): Design {
  const joints = design.robot.joints.map((j, i) =>
    i === index ? { ...j, ...patch } : j,
  );
  const { qMin, qMax } = joints[index];
  if (!(qMin < qMax)) return design;      // límites cruzados: se rechaza

  // Si el usuario baja qMax por debajo de la posición actual, la pose se
  // ajusta sola. Sin esto, el brazo quedaría fuera de sus propios límites.
  const pose = design.pose.map((v, i) =>
    i === index ? clamp(v, qMin, qMax) : v,
  );
  return { robot: { ...design.robot, joints }, pose };
}

/**
 * Cambia el tipo de una articulación. La variable articular pasa a ser otra
 * (θ ↔ d), con otros límites y otras unidades.
 *
 * El parámetro que era variable queda fijo en su valor actual, y el que era
 * fijo pasa a ser la variable, arrancando donde estaba (acotado a los límites
 * nuevos). Así el brazo no salta: solo cambia qué mueve el deslizador.
 */
export function changeJointType(design: Design, index: number, type: JointType): Design {
  const old = design.robot.joints[index];
  if (old.type === type) return design;

  const q = design.pose[index];
  const limits = defaultLimits(type);
  let joint: Joint;
  let start: number;

  if (type === 'P') {
    start = clamp(old.d, limits.qMin, limits.qMax);
    joint = { ...old, type, theta: q, d: start, ...limits };
  } else {
    start = clamp(old.theta, limits.qMin, limits.qMax);
    joint = { ...old, type, theta: start, d: q, ...limits };
  }

  const joints = design.robot.joints.map((j, i) => (i === index ? joint : j));
  const pose = design.pose.map((v, i) => (i === index ? start : v));
  return { robot: { ...design.robot, joints }, pose };
}

/** Agrega una articulación al final de la cadena. */
export function addJoint(design: Design): Design {
  if (design.robot.joints.length >= MAX_JOINTS) return design;   // tope sensato
  const j = defaultJoint();
  return {
    robot: { ...design.robot, joints: [...design.robot.joints, j] },
    pose: [...design.pose, jointValue(j)],
  };
}

/** Quita una articulación. Nunca deja el robot sin articulaciones. */
export function removeJoint(design: Design, index: number): Design {
  if (design.robot.joints.length <= 1) return design;
  return {
    robot: {
      ...design.robot,
      joints: design.robot.joints.filter((_, i) => i !== index),
    },
    pose: design.pose.filter((_, i) => i !== index),
  };
}

export function renameRobot(design: Design, name: string): Design {
  return { ...design, robot: { ...design.robot, name } };
}
