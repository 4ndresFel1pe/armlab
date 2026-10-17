import { describe, it, expect } from 'vitest';
import { cross3, norm3, matMul, eye, transpose, symEig, solve3 } from './linalg';

describe('linalg', () => {
  it('cross3: x cruz y da z', () => {
    expect(cross3([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
  });

  it('norm3: vector 3-4-0 mide 5', () => {
    expect(norm3([3, 4, 0])).toBe(5);
  });

  it('matMul: multiplicar por la identidad no cambia nada', () => {
    const A = [[1, 2], [3, 4]];
    expect(matMul(A, eye(2))).toEqual(A);
  });

  it('transpose: una matriz 2x3 pasa a 3x2', () => {
    expect(transpose([[1, 2, 3], [4, 5, 6]])).toEqual([[1, 4], [2, 5], [3, 6]]);
  });

  it('symEig: [[2,1],[1,2]] tiene valores propios 1 y 3', () => {
    const { values } = symEig([[2, 1], [1, 2]]);
    const sorted = [...values].sort((a, b) => a - b);
    expect(sorted[0]).toBeCloseTo(1);
    expect(sorted[1]).toBeCloseTo(3);
  });

  it('solve3: resuelve un sistema conocido', () => {
    const x = solve3([[2, 0, 0], [0, 3, 0], [1, 0, 1]], [4, 9, 5]);
    expect(x[0]).toBeCloseTo(2);
    expect(x[1]).toBeCloseTo(3);
    expect(x[2]).toBeCloseTo(3);
  });

  it('solve3: con matriz singular devuelve ceros', () => {
    expect(solve3([[1, 2, 3], [2, 4, 6], [0, 0, 1]], [1, 1, 1])).toEqual([0, 0, 0]);
  });
});
