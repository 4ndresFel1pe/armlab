/**
 * Robots de ejemplo, portados del objeto PRESETS del prototipo HTML.
 *
 * En el HTML los parámetros estaban en centímetros y grados. Aquí se siguen
 * escribiendo en esas unidades, para que se lean igual que en el prototipo, y
 * los ayudantes R() y P() los convierten a SI (metros y radianes).
 */
import type { Joint, Robot } from './types';
import type { Task } from './jacobian';

const deg = (g: number) => (g * Math.PI) / 180;
const cm = (c: number) => c / 100;

/**
 * Articulación de revoluta.
 * theta y alpha en grados; d y a en cm; límites de q (= theta) en grados.
 */
function R(
  theta: number,
  d: number,
  a: number,
  alpha: number,
  qMinDeg = -180,
  qMaxDeg = 180,
): Joint {
  return {
    type: 'R',
    theta: deg(theta),
    d: cm(d),
    a: cm(a),
    alpha: deg(alpha),
    qMin: deg(qMinDeg),
    qMax: deg(qMaxDeg),
  };
}

/**
 * Articulación prismática.
 * theta y alpha en grados; d y a en cm; límites de q (= d) en cm.
 */
function P(
  theta: number,
  d: number,
  a: number,
  alpha: number,
  qMinCm = 0,
  qMaxCm = 20,
): Joint {
  return {
    type: 'P',
    theta: deg(theta),
    d: cm(d),
    a: cm(a),
    alpha: deg(alpha),
    qMin: cm(qMinCm),
    qMax: cm(qMaxCm),
  };
}

/** Un robot de ejemplo. */
export interface Preset extends Robot {
  /** Espacio de tarea sugerido para la manipulabilidad. Si no se indica: 'pos'. */
  task?: Task;
}

export type PresetKey =
  | 'servo4'
  | 'planar2'
  | 'planar3'
  | 'anthro'
  | 'scara'
  | 'cyl'
  | 'cart'
  | 'stanford'
  | 'puma';

// Argumentos de R() y P(): (θ, d, a, α, qMin, qMax)
export const PRESETS: Record<PresetKey, Preset> = {
  servo4: {
    name: 'Brazo de servos 4R (tipo Arduino)',
    joints: [
      R(25, 8, 0, 90, -90, 90),
      R(60, 0, 12, 0, 0, 180),
      R(-70, 0, 12, 0, -150, 150),
      R(-30, 0, 6, 0, -90, 90),
    ],
  },
  planar2: {
    name: 'Planar 2R',
    task: 'xy',
    joints: [R(30, 0, 12, 0), R(60, 0, 10, 0)],
  },
  planar3: {
    name: 'Planar 3R',
    task: 'xy',
    joints: [R(30, 0, 10, 0), R(45, 0, 8, 0), R(-30, 0, 5, 0)],
  },
  anthro: {
    name: 'Antropomórfico 3R (codo)',
    joints: [R(30, 15, 0, 90), R(45, 0, 15, 0), R(-60, 0, 12, 0)],
  },
  scara: {
    name: 'SCARA (RRPR)',
    joints: [
      R(20, 20, 15, 0, -130, 130),
      R(40, 0, 12, 180, -145, 145),
      P(0, 6, 0, 0, 0, 15),
      R(0, 3, 0, 0),
    ],
  },
  cyl: {
    name: 'Cilíndrico (RPP)',
    joints: [R(30, 8, 0, 0), P(0, 15, 0, -90, 5, 30), P(0, 12, 0, 0, 4, 22)],
  },
  cart: {
    name: 'Cartesiano (PPP)',
    joints: [
      P(0, 12, 0, -90, 4, 24),
      P(-90, 10, 0, -90, 4, 24),
      P(0, 10, 0, 0, 4, 24),
    ],
  },
  stanford: {
    name: 'Stanford (RRP + muñeca esférica)',
    joints: [
      R(20, 20, 0, -90),
      R(60, 6, 0, 90),
      P(0, 15, 0, 0, 8, 30),
      R(0, 0, 0, -90),
      R(30, 0, 0, 90),
      R(0, 5, 0, 0),
    ],
  },
  puma: {
    name: '6R tipo PUMA (muñeca esférica)',
    joints: [
      R(30, 40, 0, 90),
      R(20, 0, 30, 0, -200, 45),
      R(-110, 12, 2, -90, -225, 45),
      R(0, 30, 0, 90, -110, 170),
      R(45, 0, 0, -90, -100, 100),
      R(0, 6, 0, 0, -266, 266),
    ],
  },
};
