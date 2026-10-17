import { describe, it, expect } from 'vitest';
import { PRESETS } from './presets';
import { forwardKinematics, endEffectorPosition } from './kinematics';
import { jointValue } from './dh';
import { norm3 } from './linalg';

describe('PRESETS', () => {
  it('hay nueve robots de ejemplo', () => {
    expect(Object.keys(PRESETS)).toHaveLength(9);
  });

  it('las unidades quedaron convertidas a SI (planar 2R: a1 = 12 cm = 0,12 m)', () => {
    const j = PRESETS.planar2.joints[0];
    expect(j.a).toBeCloseTo(0.12);
    expect(j.theta).toBeCloseTo(Math.PI / 6); // 30°
  });

  // Una prueba por robot: si uno quedó mal portado, el reporte dice cuál.
  for (const [key, robot] of Object.entries(PRESETS)) {
    describe(key, () => {
      it('la cinemática directa no devuelve NaN', () => {
        const { T } = forwardKinematics(robot.joints);
        for (const M of T) {
          for (const row of M) {
            for (const value of row) expect(Number.isFinite(value)).toBe(true);
          }
        }
      });

      it('cada articulación arranca dentro de sus límites', () => {
        for (const j of robot.joints) {
          expect(j.qMin).toBeLessThan(j.qMax);
          expect(jointValue(j)).toBeGreaterThanOrEqual(j.qMin);
          expect(jointValue(j)).toBeLessThanOrEqual(j.qMax);
        }
      });

      it('el efector queda a menos de 2 m de la base (se convirtió de cm a m)', () => {
        expect(norm3(endEffectorPosition(robot.joints))).toBeLessThan(2);
      });
    });
  }
});
