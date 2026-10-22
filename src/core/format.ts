/**
 * Formato del archivo .armlab.json: la columna vertebral del proyecto.
 *
 * Es lo que el usuario descarga, lo que vuelve a cargar arrastrándolo y, si
 * algún día llegan las cuentas (Fase 5), lo que se guarda tal cual en la base
 * de datos. Por eso lleva versión desde el primer día.
 *
 * TypeScript puro: respeta la regla de `core/` (sin React, sin three.js, sin DOM).
 */
import type { Joint, JointType, Robot } from './types';
import { clamp } from './linalg';

export const FORMAT_NAME = 'armlab';
export const FORMAT_VERSION = 1;

/** Tope de articulaciones que acepta un archivo (el editor permite menos). */
export const MAX_FILE_JOINTS = 12;

/** Lo que el usuario está editando: estructura del robot + pose actual. */
export interface Design {
  robot: Robot;
  /** Valor de cada variable articular, en SI. Mismo largo que `robot.joints`. */
  pose: number[];
}

/** La forma exacta del archivo .json que se descarga. */
export interface ArmLabFile {
  format: typeof FORMAT_NAME;
  formatVersion: number;
  savedAt: string;
  /** Las unidades quedan escritas en el archivo: es autodescriptivo. */
  units: { length: 'm'; angle: 'rad' };
  robot: { name: string; joints: Joint[] };
  pose: number[];
}

// ---------------------------------------------------------------- escribir

export function serialize(design: Design): string {
  const file: ArmLabFile = {
    format: FORMAT_NAME,
    formatVersion: FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    units: { length: 'm', angle: 'rad' },
    robot: {
      name: design.robot.name,
      // Se copian solo los campos de Joint, en orden fijo. Si el robot trae
      // algo más (por ejemplo `task` de un Preset), no se cuela en el archivo.
      joints: design.robot.joints.map(j => ({
        type: j.type,
        theta: j.theta,
        d: j.d,
        a: j.a,
        alpha: j.alpha,
        qMin: j.qMin,
        qMax: j.qMax,
      })),
    },
    pose: [...design.pose],
  };
  return JSON.stringify(file, null, 2);
}

// ----------------------------------------------------------------- leer

export type ParseResult =
  | { ok: true; design: Design }
  | { ok: false; error: string };

export function parse(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es JSON válido.' };
  }

  if (!isObject(raw)) {
    return { ok: false, error: 'El archivo no contiene un objeto.' };
  }
  if (raw.format !== FORMAT_NAME) {
    return { ok: false, error: 'Este archivo no es un diseño de ArmLab.' };
  }
  if (!isFiniteNumber(raw.formatVersion)) {
    return { ok: false, error: 'El archivo no indica su versión de formato.' };
  }
  if (raw.formatVersion > FORMAT_VERSION) {
    return {
      ok: false,
      error:
        `El archivo usa la versión ${raw.formatVersion} del formato y esta ` +
        `página entiende hasta la ${FORMAT_VERSION}. Actualice la página.`,
    };
  }

  const data = migrate(raw);
  const robot = data.robot;

  if (!isObject(robot) || !Array.isArray(robot.joints)) {
    return { ok: false, error: 'El archivo no describe ningún robot.' };
  }
  if (robot.joints.length === 0) {
    return { ok: false, error: 'El robot no tiene articulaciones.' };
  }
  if (robot.joints.length > MAX_FILE_JOINTS) {
    return { ok: false, error: 'El robot tiene demasiadas articulaciones.' };
  }

  const joints: Joint[] = [];
  for (let i = 0; i < robot.joints.length; i++) {
    const j = parseJoint(robot.joints[i]);
    if (!j) return { ok: false, error: `La articulación ${i + 1} está dañada.` };
    joints.push(j);
  }

  if (!Array.isArray(data.pose) || data.pose.length !== joints.length) {
    return { ok: false, error: 'La pose no corresponde con las articulaciones.' };
  }
  // Una pose fuera de los límites no se rechaza: se acota. Un valor que no es
  // número se reemplaza por el más cercano a cero dentro de los límites.
  const pose = data.pose.map((v: unknown, i: number) => {
    const { qMin, qMax } = joints[i];
    return clamp(isFiniteNumber(v) ? v : 0, qMin, qMax);
  });

  const name =
    typeof robot.name === 'string' && robot.name.trim()
      ? robot.name.trim().slice(0, 60)
      : 'Brazo sin nombre';

  return { ok: true, design: { robot: { name, joints }, pose } };
}

/**
 * Punto de entrada para convertir archivos viejos al formato actual.
 * Hoy no hace nada porque solo existe la versión 1. El día que cambie el
 * formato, aquí se escribe la conversión y los archivos de los usuarios
 * siguen abriendo.
 */
function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  // if (raw.formatVersion === 1) { ...convertir a 2... }
  return raw;
}

// ------------------------------------------------------------- ayudantes

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Devuelve la articulación validada, o null si algo no cuadra. */
function parseJoint(v: unknown): Joint | null {
  if (!isObject(v)) return null;
  if (v.type !== 'R' && v.type !== 'P') return null;

  const { theta, d, a, alpha, qMin, qMax } = v;
  if (
    !isFiniteNumber(theta) || !isFiniteNumber(d) ||
    !isFiniteNumber(a) || !isFiniteNumber(alpha) ||
    !isFiniteNumber(qMin) || !isFiniteNumber(qMax)
  ) {
    return null;
  }
  if (qMin >= qMax) return null;

  return { type: v.type as JointType, theta, d, a, alpha, qMin, qMax };
}
