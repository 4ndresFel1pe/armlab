import { describe, it, expect } from 'vitest';
import type { Joint } from './types';
import { forwardKinematics, endEffectorPosition } from './kinematics';
import { geometricJacobian, taskJacobian } from './jacobian';

/** Brazo planar 2R con eslabones de 1 m. */
const arm: Joint[] = [
  { type: 'R', theta: 0, d: 0, a: 1, alpha: 0, qMin: -Math.PI, qMax: Math.PI },
  { type: 'R', theta: 0, d: 0, a: 1, alpha: 0, qMin: -Math.PI, qMax: Math.PI },
];

describe('geometricJacobian', () => {
  const { T } = forwardKinematics(arm, [0, 0]);
  const J = geometricJacobian(arm, T);

  it('es de 6 × n', () => {
    expect(J).toHaveLength(6);
    J.forEach((row) => expect(row).toHaveLength(2));
  });

  it('estirado sobre x: q1 mueve la punta en +y a 2 m/rad, q2 a 1 m/rad', () => {
    expect(J[1][0]).toBeCloseTo(2);
    expect(J[1][1]).toBeCloseTo(1);
  });

  it('estirado sobre x: ninguna articulación mueve la punta en x', () => {
    expect(J[0][0]).toBeCloseTo(0);
    expect(J[0][1]).toBeCloseTo(0);
  });

  it('las dos revolutas giran alrededor de z: ω_z = 1', () => {
    expect(J[5][0]).toBeCloseTo(1);
    expect(J[5][1]).toBeCloseTo(1);
  });

  it('prismática: la columna es [z ; 0]', () => {
    const slider: Joint[] = [
      { type: 'P', theta: 0, d: 0.1, a: 0, alpha: 0, qMin: 0, qMax: 0.5 },
    ];
    const Js = geometricJacobian(slider, forwardKinematics(slider).T);
    expect(Js.map((row) => row[0])).toEqual([0, 0, 1, 0, 0, 0]);
  });

  it('las filas lineales coinciden con la derivada numérica de la cinemática directa', () => {
    // Brazo espacial 3R tipo codo (con torsión α ≠ 0), en una pose cualquiera.
    const elbow: Joint[] = [
      { type: 'R', theta: 0, d: 0.15, a: 0, alpha: Math.PI / 2, qMin: -Math.PI, qMax: Math.PI },
      { type: 'R', theta: 0, d: 0, a: 0.15, alpha: 0, qMin: -Math.PI, qMax: Math.PI },
      { type: 'R', theta: 0, d: 0, a: 0.12, alpha: 0, qMin: -Math.PI, qMax: Math.PI },
    ];
    const q = [0.4, 0.9, -1.1];
    const Je = geometricJacobian(elbow, forwardKinematics(elbow, q).T);
    const h = 1e-6;
    for (let i = 0; i < q.length; i++) {
      const qPlus = q.map((v, k) => (k === i ? v + h : v));
      const qMinus = q.map((v, k) => (k === i ? v - h : v));
      const pPlus = endEffectorPosition(elbow, qPlus);
      const pMinus = endEffectorPosition(elbow, qMinus);
      for (let r = 0; r < 3; r++) {
        const numeric = (pPlus[r] - pMinus[r]) / (2 * h); // diferencia central
        expect(Je[r][i]).toBeCloseTo(numeric, 6);
      }
    }
  });
});

describe('taskJacobian', () => {
  const J = geometricJacobian(arm, forwardKinematics(arm, [0, 0]).T);

  it("'xy' toma las filas 0 y 1", () => {
    const Jxy = taskJacobian(J, 'xy');
    expect(Jxy).toHaveLength(2);
    expect(Jxy[1][0]).toBeCloseTo(2);
  });

  it("'pos' toma 3 filas y 'full' las 6", () => {
    expect(taskJacobian(J, 'pos')).toHaveLength(3);
    expect(taskJacobian(J, 'full')).toHaveLength(6);
  });

  it('devuelve copias: modificar el resultado no cambia J', () => {
    const Jv = taskJacobian(J, 'pos');
    Jv[0][0] = 99;
    expect(J[0][0]).not.toBe(99);
  });
});
