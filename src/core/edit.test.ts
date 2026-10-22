import { describe, it, expect } from 'vitest';
import {
  MAX_JOINTS,
  addJoint,
  changeJointType,
  designFromRobot,
  patchJoint,
  removeJoint,
  renameRobot,
  setJointValue,
} from './edit';
import type { Design } from './format';
import { PRESETS } from './presets';
import { endEffectorPosition } from './kinematics';

/**
 * Congela el diseño por completo. Si una operación intenta modificarlo en vez
 * de devolver uno nuevo, JavaScript lanza un error y la prueba falla.
 */
function frozen(design: Design): Design {
  design.robot.joints.forEach(j => Object.freeze(j));
  Object.freeze(design.robot.joints);
  Object.freeze(design.robot);
  Object.freeze(design.pose);
  return Object.freeze(design);
}

/** Diseño de prueba: un copia nueva cada vez, para que las pruebas no se crucen. */
const servo4 = () => frozen(designFromRobot(structuredClone(PRESETS.servo4)));
const planar2 = () => frozen(designFromRobot(structuredClone(PRESETS.planar2)));
const scara = () => frozen(designFromRobot(structuredClone(PRESETS.scara)));

/** Robot y pose siempre del mismo largo: la invariante que sostiene todo. */
function expectConsistent(d: Design) {
  expect(d.pose).toHaveLength(d.robot.joints.length);
  d.pose.forEach((v, i) => {
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(d.robot.joints[i].qMin);
    expect(v).toBeLessThanOrEqual(d.robot.joints[i].qMax);
  });
}

describe('setJointValue', () => {
  it('mueve una articulación y acota a sus límites', () => {
    const d = setJointValue(servo4(), 0, 10);       // límite de q1: ±90°
    expect(d.pose[0]).toBeCloseTo(Math.PI / 2);
    expectConsistent(d);
  });

  it('no crea un robot nuevo: mover un deslizador no es editar', () => {
    const before = servo4();
    expect(setJointValue(before, 1, 0.5).robot).toBe(before.robot);
  });
});

describe('patchJoint', () => {
  it('cambia un parámetro DH sin tocar los demás', () => {
    const before = planar2();
    const d = patchJoint(before, 1, { a: 0.15 });
    expect(d.robot.joints[1].a).toBe(0.15);
    expect(d.robot.joints[1].alpha).toBe(before.robot.joints[1].alpha);
    expect(d.robot.joints[0]).toBe(before.robot.joints[0]);
  });

  it('si los límites se encogen, la pose se ajusta sola', () => {
    const d = patchJoint(servo4(), 1, { qMax: 0.1 });   // la pose era 60°
    expect(d.pose[1]).toBe(0.1);
    expectConsistent(d);
  });

  it('rechaza límites cruzados devolviendo el mismo diseño', () => {
    const before = servo4();
    expect(patchJoint(before, 0, { qMin: 2, qMax: 1 })).toBe(before);
  });
});

describe('changeJointType', () => {
  it('de revoluta a prismática: límites en metros, no en radianes', () => {
    const d = changeJointType(servo4(), 1, 'P');
    const j = d.robot.joints[1];
    expect(j.type).toBe('P');
    expect(j.qMin).toBe(0);
    expect(j.qMax).toBeCloseTo(0.2);
    expectConsistent(d);
  });

  it('el brazo no salta al cambiar el tipo (R → P)', () => {
    const before = servo4();
    const after = changeJointType(before, 0, 'P');      // d1 = 8 cm, cabe en 0–20 cm
    const p0 = endEffectorPosition(before.robot.joints, before.pose);
    const p1 = endEffectorPosition(after.robot.joints, after.pose);
    p1.forEach((v, k) => expect(v).toBeCloseTo(p0[k], 12));
  });

  it('el brazo no salta al cambiar el tipo (P → R)', () => {
    const before = scara();
    const after = changeJointType(before, 2, 'R');      // la prismática del SCARA
    const p0 = endEffectorPosition(before.robot.joints, before.pose);
    const p1 = endEffectorPosition(after.robot.joints, after.pose);
    p1.forEach((v, k) => expect(v).toBeCloseTo(p0[k], 12));
    expectConsistent(after);
  });

  it('ida y vuelta R → P → R deja la articulación como estaba', () => {
    const before = planar2();
    const back = changeJointType(changeJointType(before, 0, 'P'), 0, 'R');
    expect(back.robot.joints[0].theta).toBeCloseTo(before.pose[0]);
    expect(back.pose[0]).toBeCloseTo(before.pose[0]);
  });

  it('mismo tipo: no cambia nada', () => {
    const before = servo4();
    expect(changeJointType(before, 0, 'R')).toBe(before);
  });
});

describe('addJoint / removeJoint', () => {
  it('agregar alarga robot y pose juntos', () => {
    const d = addJoint(planar2());
    expect(d.robot.joints).toHaveLength(3);
    expectConsistent(d);
  });

  it(`no pasa de ${MAX_JOINTS} articulaciones`, () => {
    let d = planar2();
    for (let i = 0; i < 20; i++) d = addJoint(d);
    expect(d.robot.joints).toHaveLength(MAX_JOINTS);
    expectConsistent(d);
  });

  it('quitar acorta robot y pose juntos, y quita la correcta', () => {
    const before = servo4();
    const d = removeJoint(before, 1);
    expect(d.robot.joints).toHaveLength(3);
    expect(d.robot.joints[1]).toBe(before.robot.joints[2]);
    expect(d.pose[1]).toBe(before.pose[2]);
    expectConsistent(d);
  });

  it('nunca deja el robot sin articulaciones', () => {
    let d = planar2();
    for (let i = 0; i < 5; i++) d = removeJoint(d, 0);
    expect(d.robot.joints).toHaveLength(1);
    expectConsistent(d);
  });
});

describe('renameRobot', () => {
  it('cambia el nombre y nada más', () => {
    const before = servo4();
    const d = renameRobot(before, 'Mi brazo');
    expect(d.robot.name).toBe('Mi brazo');
    expect(d.robot.joints).toBe(before.robot.joints);
    expect(d.pose).toBe(before.pose);
  });
});
