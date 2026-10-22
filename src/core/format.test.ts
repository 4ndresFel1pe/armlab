import { describe, it, expect } from 'vitest';
import { serialize, parse, FORMAT_NAME, FORMAT_VERSION } from './format';
import type { Design } from './format';
import { PRESETS } from './presets';
import { jointValue } from './dh';
import type { Robot } from './types';

/** El diseño que se obtiene al abrir un robot de ejemplo. */
const fromRobot = (robot: Robot): Design => ({
  robot,
  pose: robot.joints.map(jointValue),
});

/**
 * Un archivo mínimo válido, como objeto. Cada prueba de fallo lo daña en un
 * solo punto: así, si falla, se sabe exactamente qué validación no funcionó.
 */
function validFile() {
  return {
    format: FORMAT_NAME,
    formatVersion: FORMAT_VERSION,
    savedAt: '2026-10-21T00:00:00.000Z',
    units: { length: 'm', angle: 'rad' },
    robot: {
      name: 'Prueba',
      joints: [
        { type: 'R', theta: 0, d: 0, a: 0.1, alpha: 0, qMin: -Math.PI, qMax: Math.PI },
      ],
    },
    pose: [0.5],
  };
}

describe('format', () => {
  it('ida y vuelta: lo que se guarda es lo que se lee', () => {
    const design = fromRobot(PRESETS.servo4);

    const result = parse(serialize(design));

    expect(result.ok).toBe(true);
    if (!result.ok) return;                    // para que TypeScript se calme
    expect(result.design.robot.name).toBe(design.robot.name);
    expect(result.design.robot.joints).toEqual(design.robot.joints);
    expect(result.design.pose).toEqual(design.pose);
  });

  // La misma prueba con los nueve robots: incluye prismáticas y nombres con tildes.
  for (const [key, robot] of Object.entries(PRESETS)) {
    it(`ida y vuelta: ${key}`, () => {
      const design = fromRobot(robot);
      const result = parse(serialize(design));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.design.robot.joints).toEqual(design.robot.joints);
      expect(result.design.pose).toEqual(design.pose);
    });
  }

  it('el archivo lleva formato, versión y unidades', () => {
    const file = JSON.parse(serialize(fromRobot(PRESETS.planar2)));
    expect(file.format).toBe('armlab');
    expect(file.formatVersion).toBe(FORMAT_VERSION);
    expect(file.units).toEqual({ length: 'm', angle: 'rad' });
    expect(typeof file.savedAt).toBe('string');
  });

  it('no se cuelan campos que no son del formato (task de un Preset)', () => {
    const file = JSON.parse(serialize(fromRobot(PRESETS.planar2)));
    expect(file.robot.task).toBeUndefined();
  });

  it('el archivo mínimo de las pruebas es válido', () => {
    expect(parse(JSON.stringify(validFile())).ok).toBe(true);
  });

  describe('archivos que se rechazan', () => {
    /** Afirma que el texto se rechaza y devuelve el mensaje de error. */
    function rejects(text: string): string {
      const result = parse(text);
      expect(result.ok).toBe(false);
      return result.ok ? '' : result.error;
    }

    it('texto que no es JSON', () => {
      expect(rejects('esto no es json')).toMatch(/JSON/);
    });

    it('JSON de otra cosa', () => {
      expect(rejects('{"hola": 1}')).toMatch(/ArmLab/);
    });

    it('un arreglo en vez de un objeto', () => {
      rejects('[1, 2, 3]');
    });

    it('versión del futuro', () => {
      const f = { ...validFile(), formatVersion: 99 };
      expect(rejects(JSON.stringify(f))).toMatch(/versión 99/);
    });

    it('sin versión', () => {
      const { formatVersion: _omitida, ...f } = validFile();
      rejects(JSON.stringify(f));
    });

    it('articulación con un parámetro que no es número ("a": null)', () => {
      const f = validFile();
      (f.robot.joints[0] as Record<string, unknown>).a = null;
      expect(rejects(JSON.stringify(f))).toMatch(/articulación 1/);
    });

    it('articulación de un tipo que no existe', () => {
      const f = validFile();
      f.robot.joints[0].type = 'X';
      rejects(JSON.stringify(f));
    });

    it('pose de largo distinto al número de articulaciones', () => {
      const f = { ...validFile(), pose: [0, 0] };
      expect(rejects(JSON.stringify(f))).toMatch(/pose/);
    });

    it('qMin mayor que qMax', () => {
      const f = validFile();
      f.robot.joints[0].qMin = 1;
      f.robot.joints[0].qMax = -1;
      rejects(JSON.stringify(f));
    });

    it('robot sin articulaciones', () => {
      const f = validFile();
      f.robot.joints = [];
      rejects(JSON.stringify(f));
    });
  });

  describe('archivos que se corrigen al abrir', () => {
    it('una pose fuera de los límites queda acotada, no rechazada', () => {
      const f = { ...validFile(), pose: [999] };
      const result = parse(JSON.stringify(f));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.design.pose[0]).toBe(Math.PI);
    });

    it('un valor de pose que no es número pasa a cero', () => {
      const f = { ...validFile(), pose: ['abc'] };
      const result = parse(JSON.stringify(f));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.design.pose[0]).toBe(0);
    });

    it('un nombre vacío se reemplaza', () => {
      const f = validFile();
      f.robot.name = '   ';
      const result = parse(JSON.stringify(f));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.design.robot.name).toBe('Brazo sin nombre');
    });
  });
});
