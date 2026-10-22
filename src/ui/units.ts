import type { Joint } from '../core/types';

export const toDeg = (rad: number): number => (rad * 180) / Math.PI;
export const toRad = (deg: number): number => (deg * Math.PI) / 180;
export const toCm  = (m: number): number => m * 100;
export const toM   = (cm: number): number => cm / 100;


 //Cómo mostrar la variable articular de una articulación.
 //Una revoluta se mide en grados; una prismática, en centímetros.

export function displayQ(joint: Joint, qSI: number) {
  return joint.type === 'R'
    ? { value: toDeg(qSI), unit: '°',  step: 0.5 }
    : { value: toCm(qSI),  unit: 'cm', step: 0.1 };
}

/** El camino inverso: lo que escribió el usuario, de vuelta a SI. */
export function toSI(joint: Joint, shown: number): number {
  return joint.type === 'R' ? toRad(shown) : toM(shown);
}

/** Número con decimales fijos, con coma decimal (convención en español). */
export function fmt(x: number, decimals = 2): string {
  if (!Number.isFinite(x)) return '—';
  const s = x.toFixed(decimals);
  // Un −0,0001 redondeado da "-0.00": se le quita el signo.
  const clean = Number(s) === 0 ? s.replace('-', '') : s;
  return clean.replace('.', ',').replace('-', '−');
}

/**
 * Lee un número escrito por el usuario. Acepta coma o punto decimal y el signo
 * menos tipográfico (−). Devuelve null si el texto no es un número completo:
 * "", "-", "1,2,3", "abc".
 */
export function parseDecimal(text: string): number | null {
  const t = text.trim().replace(',', '.').replace('−', '-');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  return Number(t);
}

/**
 * Cómo se muestra un número dentro de un campo editable: con coma decimal y
 * sin el ruido de la coma flotante (7,000000000000001 → "7").
 */
export function editableNumber(x: number, decimals = 3): string {
  return String(Number(x.toFixed(decimals))).replace('.', ',');
}
