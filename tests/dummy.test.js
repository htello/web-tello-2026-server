import { describe, it, expect } from 'vitest';

function sum(a, b) {
  return a + b;
}

describe('Dummy Test', () => {
  it('should sum two numbers', () => {
    expect(sum(1, 2)).toBe(3);
  });

  it('should sum negative numbers', () => {
    expect(sum(-1, -2)).toBe(-3);
  });

  it('should handle zero', () => {
    expect(sum(0, 5)).toBe(5);
  });

  it('should sum decimal numbers', () => {
    expect(sum(0.1, 0.2)).toBeCloseTo(0.3);
  });

  it('should sum large numbers', () => {
    expect(sum(Number.MAX_SAFE_INTEGER, 1)).toBe(Number.MAX_SAFE_INTEGER + 1);
  });

  it('should return NaN with no arguments', () => {
    expect(sum()).toBeNaN();
  });
});
