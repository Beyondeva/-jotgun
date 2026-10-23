import { describe, expect, it } from 'vitest';
import { amountToSatang, displayAmount, pressKey, satangToAmountText, type AmountKey } from '../amountInput';

const type = (keys: AmountKey[], start = '') => keys.reduce(pressKey, start);

describe('pressKey', () => {
  it('builds integers and decimals', () => {
    expect(type(['1', '2', '5', '0'])).toBe('1250');
    expect(type(['1', '.', '5'])).toBe('1.5');
  });

  it('starts a decimal with 0 when the dot comes first', () => {
    expect(type(['.', '5'])).toBe('0.5');
  });

  it('allows only one dot and two decimals', () => {
    expect(type(['1', '.', '.', '2', '3', '4'])).toBe('1.23');
  });

  it('replaces a lone leading zero', () => {
    expect(type(['0', '0', '7'])).toBe('7');
  });

  it('caps the integer part at 9 digits', () => {
    expect(type(Array(12).fill('9') as AmountKey[])).toBe('999999999');
  });

  it('backspaces', () => {
    expect(type(['1', '2', 'back'])).toBe('1');
    expect(type(['back'])).toBe('');
  });
});

describe('amount conversions', () => {
  it('turns typed text into satang', () => {
    expect(amountToSatang('1250')).toBe(125000);
    expect(amountToSatang('1250.5')).toBe(125050);
    expect(amountToSatang('0.05')).toBe(5);
    expect(amountToSatang('')).toBe(0);
    expect(amountToSatang('.')).toBe(0);
  });

  it('round-trips satang back to editable text', () => {
    for (const v of [125000, 125050, 125055, 5, 0]) expect(amountToSatang(satangToAmountText(v))).toBe(v);
    expect(satangToAmountText(125050)).toBe('1250.5');
  });

  it('groups thousands for display', () => {
    expect(displayAmount('1234567.8')).toBe('1,234,567.8');
    expect(displayAmount('12.')).toBe('12.');
    expect(displayAmount('')).toBe('0');
  });
});
