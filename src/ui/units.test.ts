import { describe, it, expect } from 'vitest';
import { parseDecimal, editableNumber, toCm, toM, toDeg, toRad } from './units';

describe('parseDecimal', () => {
  it('acepta coma y punto decimal', () => {
    expect(parseDecimal('12,5')).toBe(12.5);
    expect(parseDecimal('12.5')).toBe(12.5);
    expect(parseDecimal(' -0,25 ')).toBe(-0.25);
    expect(parseDecimal('−3')).toBe(-3);
    expect(parseDecimal(',5')).toBe(0.5);
  });

  it('un número a medio escribir ya vale: "1," es 1', () => {
    expect(parseDecimal('1,')).toBe(1);
  });

  it('rechaza lo que no es un número completo', () => {
    for (const t of ['', ' ', '-', ',', '1,2,3', 'abc', '1e3', '0x10', '--1']) {
      expect(parseDecimal(t)).toBeNull();
    }
  });
});

describe('editableNumber', () => {
  it('sin ruido de coma flotante y con coma decimal', () => {
    expect(editableNumber(toCm(toM(7)))).toBe('7');
    expect(editableNumber(toDeg(toRad(12.5)))).toBe('12,5');
    expect(editableNumber(-0.25)).toBe('-0,25');
  });
});
