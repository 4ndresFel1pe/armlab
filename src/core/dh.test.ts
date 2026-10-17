import { describe, it, expect } from 'vitest';
import { dhMatrix } from './dh';

describe('dhMatrix', () => {
  it('con todo en cero salvo a, da una traslación en x', () => {
    const A = dhMatrix(0, 0, 0.5, 0);
    expect(A[0][3]).toBeCloseTo(0.5);  // posición x
    expect(A[1][3]).toBeCloseTo(0);    // posición y
    expect(A[2][3]).toBeCloseTo(0);    // posición z
  });

  it('girar 90 grados pone la traslación sobre y', () => {
    const A = dhMatrix(Math.PI / 2, 0, 0.5, 0);
    expect(A[0][3]).toBeCloseTo(0);
    expect(A[1][3]).toBeCloseTo(0.5);
  });
});