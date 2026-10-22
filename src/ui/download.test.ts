import { describe, it, expect } from 'vitest';
import { slug } from './download';

describe('slug', () => {
  it('quita tildes, espacios y símbolos', () => {
    expect(slug('Brazo Antropomórfico 3R')).toBe('brazo-antropomorfico-3r');
    expect(slug('Stanford (RRP + muñeca esférica)')).toBe('stanford-rrp-muneca-esferica');
  });

  it('nunca devuelve un nombre vacío', () => {
    expect(slug('')).toBe('brazo');
    expect(slug('¿¡!?')).toBe('brazo');
  });

  it('no termina en guion aunque se corte a 50 caracteres', () => {
    const s = slug('a'.repeat(49) + ' b');
    expect(s.length).toBeLessThanOrEqual(50);
    expect(s.endsWith('-')).toBe(false);
  });
});
