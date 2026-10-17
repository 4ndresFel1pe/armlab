import { describe, it, expect } from 'vitest';
import type { Joint, Vec3 } from './types';
import { forwardKinematics, endEffectorPosition, rpyZYX } from './kinematics';

/** Compara dos vectores componente por componente, con tolerancia. */
function expectVecClose(actual: Vec3, expected: Vec3) {
  actual.forEach((value, k) => expect(value).toBeCloseTo(expected[k]));
}

/** Brazo planar 2R con eslabones de 1 m. */
const arm: Joint[] = [
  { type: 'R', theta: 0, d: 0, a: 1, alpha: 0, qMin: -Math.PI, qMax: Math.PI },
  { type: 'R', theta: 0, d: 0, a: 1, alpha: 0, qMin: -Math.PI, qMax: Math.PI },
];

describe('forwardKinematics', () => {
  it('q = [0, 0]: estirado sobre x, la punta queda en (2, 0, 0)', () => {
    expectVecClose(endEffectorPosition(arm, [0, 0]), [2, 0, 0]);
  });

  it('q = [π/2, 0]: estirado sobre y, la punta queda en (0, 2, 0)', () => {
    expectVecClose(endEffectorPosition(arm, [Math.PI / 2, 0]), [0, 2, 0]);
  });

  it('q = [0, π/2]: codo doblado, la punta queda en (1, 1, 0)', () => {
    expectVecClose(endEffectorPosition(arm, [0, Math.PI / 2]), [1, 1, 0]);
  });

  it('devuelve n matrices A y n + 1 marcos T, con T[0] = identidad', () => {
    const { A, T } = forwardKinematics(arm);
    expect(A).toHaveLength(2);
    expect(T).toHaveLength(3);
    expect(T[0]).toEqual([
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ]);
  });

  it('sin q usa los valores guardados en cada articulación', () => {
    const bent: Joint[] = [arm[0], { ...arm[1], theta: Math.PI / 2 }];
    expectVecClose(endEffectorPosition(bent), [1, 1, 0]);
  });

  it('pasar q no modifica el arreglo de articulaciones', () => {
    forwardKinematics(arm, [1, 2]);
    expect(arm[0].theta).toBe(0);
    expect(arm[1].theta).toBe(0);
  });

  it('prismática: q es d y desplaza la punta sobre z', () => {
    const slider: Joint[] = [
      { type: 'P', theta: 0, d: 0, a: 0, alpha: 0, qMin: 0, qMax: 0.5 },
    ];
    expectVecClose(endEffectorPosition(slider, [0.3]), [0, 0, 0.3]);
  });
});

describe('rpyZYX', () => {
  it('el brazo planar girado π/4 + π/4 tiene yaw = π/2 y roll = pitch = 0', () => {
    const { T } = forwardKinematics(arm, [Math.PI / 4, Math.PI / 4]);
    expectVecClose(rpyZYX(T[2]), [0, 0, Math.PI / 2]);
  });
});
