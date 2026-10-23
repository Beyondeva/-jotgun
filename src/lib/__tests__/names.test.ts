import { describe, expect, it } from 'vitest';
import { isOwnerName, normalizeName, payeeKey } from '../names';

describe('normalizeName', () => {
  it('drops Thai and English honorifics', () => {
    expect(normalizeName('นาย สมชาย ใจดี')).toBe('สมชาย ใจดี');
    expect(normalizeName('นางสาว มะปราง หวานใจ')).toBe('มะปราง หวานใจ');
    expect(normalizeName('น.ส.มะปราง หวานใจ')).toBe('มะปราง หวานใจ');
    expect(normalizeName('Mr. Somchai Jaidee')).toBe('SOMCHAI JAIDEE');
    expect(normalizeName('MRS  Anna   Lee')).toBe('ANNA LEE');
  });

  it('leaves shop names alone', () => {
    expect(normalizeName('LINE MAN ข้าวมันไก่')).toBe('LINE MAN ข้าวมันไก่');
    expect(normalizeName('Mrs. Fields Cookies')).toBe('FIELDS COOKIES');
  });
});

describe('payeeKey', () => {
  it('removes masked account numbers', () => {
    expect(payeeKey('นาย สมชาย ใจดี xxx-x-x1234-x')).toBe('สมชาย ใจดี');
  });
});

describe('isOwnerName', () => {
  const owners = ['นาย สมชาย ใจดี', 'SOMCHAI JAIDEE'];

  it('matches full and masked surnames', () => {
    expect(isOwnerName('นาย สมชาย ใจดี', owners)).toBe(true);
    expect(isOwnerName('สมชาย ใ***', owners)).toBe(true);
    expect(isOwnerName('MR. SOMCHAI J', owners)).toBe(true);
    expect(isOwnerName('SOMCHAI', owners)).toBe(true);
  });

  it('rejects a different person with the same first name', () => {
    expect(isOwnerName('สมชาย มั่นคง', owners)).toBe(false);
    expect(isOwnerName('MR. SOMCHAI K', owners)).toBe(false);
  });

  it('rejects everyone when no owner is set', () => {
    expect(isOwnerName('สมชาย ใจดี', [])).toBe(false);
  });
});
