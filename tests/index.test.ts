import { add } from '../src/index';
describe('add function', () => {
  test('should add two numbers correctly', () => {
    expect(add(1, 2)).toBe(3);
  });
  test('should return a negative number when adding a positive and a negative number', () => {
    expect(add(1, -2)).toBe(-1);
  });
  test('should return zero when adding zero and zero', () => {
    expect(add(0, 0)).toBe(0);
  });
});
