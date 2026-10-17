import { describe, it, expect } from 'vitest';
import type { Joint } from './types';
import { forwardKinematics } from './kinematics';
import { geometricJacobian, taskJacobian } from './jacobian';
import { singularValues, manipulability } from './manipulability';

/** Brazo planar 2R con eslabones de 1 m. */
const arm: Joint[] = [
  { type: 'R', theta: 0, d: 0, a: 1, alpha: 0, qMin: -Math.PI, qMax: Math.PI },
  { type: 'R', theta: 0, d: 0, a: 1, alpha: 0, qMin: -Math.PI, qMax: Math.PI },
];

/** Manipulabilidad del brazo 2R en el plano XY para una pose q. */
function planarManip(q: number[]) {
  const J = geometricJacobian(arm, forwardKinematics(arm, q).T);
  return manipulability(taskJacobian(J, 'xy'));
}

describe('singularValues', () => {
  it('de una matriz diagonal son sus elementos, de mayor a menor', () => {
    const s = singularValues([[1, 0], [0, 3]]);
    expect(s[0]).toBeCloseTo(3);
    expect(s[1]).toBeCloseTo(1);
  });

  it('una matriz 2×3 tiene 2 valores singulares', () => {
    const s = singularValues([[3, 0, 0], [0, 4, 0]]);
    expect(s).toHaveLength(2);
    expect(s[0]).toBeCloseTo(4);
    expect(s[1]).toBeCloseTo(3);
  });
});

describe('manipulability', () => {
  it('2R estirado (q = [0, 0]) es singular: w ≈ 0 y rango 1', () => {
    const r = planarManip([0, 0]);
    expect(r.w).toBeCloseTo(0);
    expect(r.rank).toBe(1);
    expect(r.full).toBe(2);
    expect(r.kappa).toBe(Infinity);
    expect(r.iso).toBe(0);
  });

  it('2R doblado a 90° (q = [0, π/2]) no es singular: w > 0 y rango completo', () => {
    const r = planarManip([0, Math.PI / 2]);
    expect(r.w).toBeGreaterThan(0.1);
    expect(r.rank).toBe(2);
  });

  it('cumple la fórmula del 2R planar: w = a1 · a2 · |sen q2|', () => {
    for (const q2 of [Math.PI / 6, Math.PI / 3, Math.PI / 2, 2.5]) {
      expect(planarManip([0.7, q2]).w).toBeCloseTo(Math.abs(Math.sin(q2)));
    }
  });

  it('la isotropía está entre 0 y 1', () => {
    const r = planarManip([0.3, 1.2]);
    expect(r.iso).toBeGreaterThan(0);
    expect(r.iso).toBeLessThanOrEqual(1);
  });
});
