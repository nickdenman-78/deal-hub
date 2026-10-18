import { describe, expect, it } from 'vitest';
import { formatIpv4, fromInt, hasHostBits, parseIpv4, subnetOf, toInt } from './ipv4';

describe('parseIpv4', () => {
  it('parses a bare address', () => {
    expect(parseIpv4('10.24.0.1')).toEqual({ octets: [10, 24, 0, 1] });
  });

  it('parses CIDR', () => {
    expect(parseIpv4('192.168.1.0/24')).toEqual({ octets: [192, 168, 1, 0], prefix: 24 });
  });

  it('accepts the boundary values', () => {
    expect(parseIpv4('0.0.0.0/0')).toEqual({ octets: [0, 0, 0, 0], prefix: 0 });
    expect(parseIpv4('255.255.255.255/32')).toEqual({ octets: [255, 255, 255, 255], prefix: 32 });
  });

  it('trims surrounding whitespace', () => {
    expect(parseIpv4('  10.0.0.1  ')).toEqual({ octets: [10, 0, 0, 1] });
  });

  /*
   * The security-relevant case. `010` is octal 8 to inet_aton and decimal 10 to
   * most language parsers, so an address containing one can pass a validator as
   * one host and reach the network as another.
   */
  it('rejects leading zeros rather than picking an interpretation', () => {
    expect(parseIpv4('127.0.0.010')).toBeNull();
    expect(parseIpv4('010.0.0.1')).toBeNull();
    // A single zero is not a leading zero.
    expect(parseIpv4('0.0.0.0')).toEqual({ octets: [0, 0, 0, 0] });
    expect(parseIpv4('10.0.0.1/08')).toBeNull();
  });

  it('rejects out-of-range components', () => {
    expect(parseIpv4('256.0.0.1')).toBeNull();
    expect(parseIpv4('10.0.0.1/33')).toBeNull();
  });

  it('rejects the wrong number of octets', () => {
    expect(parseIpv4('10.0.0')).toBeNull();
    expect(parseIpv4('10.0.0.1.5')).toBeNull();
  });

  it('rejects partially-typed values, so the editor never emits a half address as valid', () => {
    expect(parseIpv4('10.0.0.')).toBeNull();
    expect(parseIpv4('...')).toBeNull();
    expect(parseIpv4('')).toBeNull();
    expect(parseIpv4('   ')).toBeNull();
  });

  it('rejects a second slash and non-numeric parts', () => {
    expect(parseIpv4('10.0.0.1/24/8')).toBeNull();
    expect(parseIpv4('10.0.0.a')).toBeNull();
    expect(parseIpv4('10.0.0.1/x')).toBeNull();
    expect(parseIpv4('-1.0.0.1')).toBeNull();
  });

  it('is null for non-strings', () => {
    expect(parseIpv4(null)).toBeNull();
    expect(parseIpv4(undefined)).toBeNull();
  });
});

describe('formatIpv4', () => {
  it('round-trips both forms', () => {
    expect(formatIpv4({ octets: [10, 0, 0, 1] })).toBe('10.0.0.1');
    expect(formatIpv4({ octets: [10, 0, 0, 0], prefix: 8 })).toBe('10.0.0.0/8');
  });

  it('keeps a /0 rather than treating it as absent', () => {
    expect(formatIpv4({ octets: [0, 0, 0, 0], prefix: 0 })).toBe('0.0.0.0/0');
  });
});

describe('toInt / fromInt', () => {
  it('stays unsigned above 127 in the first octet', () => {
    // The bug this guards: (192 << 24) is negative in JS without >>> 0.
    expect(toInt([192, 168, 0, 1])).toBe(3232235521);
    expect(toInt([255, 255, 255, 255])).toBe(4294967295);
  });

  it('round-trips', () => {
    expect(fromInt(toInt([172, 16, 254, 1]))).toBe('172.16.254.1');
  });
});

describe('subnetOf', () => {
  it('is null without a prefix — a bare address has no subnet', () => {
    expect(subnetOf({ octets: [10, 0, 0, 1] })).toBeNull();
  });

  it('computes a /24', () => {
    expect(subnetOf({ octets: [192, 168, 1, 57], prefix: 24 })).toEqual({
      network: '192.168.1.0',
      broadcast: '192.168.1.255',
      firstHost: '192.168.1.1',
      lastHost: '192.168.1.254',
      usableHosts: 254,
      mask: '255.255.255.0',
    });
  });

  /* A shift of 32 is a shift of 0 in JS, so /0 is the case that silently
     produces an all-ones mask if it is not special-cased. */
  it('handles /0 without wrapping the shift', () => {
    const subnet = subnetOf({ octets: [10, 1, 2, 3], prefix: 0 });
    expect(subnet?.mask).toBe('0.0.0.0');
    expect(subnet?.network).toBe('0.0.0.0');
    expect(subnet?.broadcast).toBe('255.255.255.255');
    expect(subnet?.usableHosts).toBe(4294967294);
  });

  /* Subtracting 2 unconditionally gives 0 and -1 here. */
  it('treats /31 as RFC 3021 and /32 as a host route', () => {
    const p31 = subnetOf({ octets: [10, 0, 0, 0], prefix: 31 });
    expect(p31?.usableHosts).toBe(2);
    expect(p31?.firstHost).toBe('10.0.0.0');
    expect(p31?.lastHost).toBe('10.0.0.1');

    const p32 = subnetOf({ octets: [10, 0, 0, 7], prefix: 32 });
    expect(p32?.usableHosts).toBe(1);
    expect(p32?.network).toBe('10.0.0.7');
    expect(p32?.firstHost).toBe('10.0.0.7');
  });
});

describe('hasHostBits', () => {
  it('detects an interface address written as if it were a network', () => {
    expect(hasHostBits({ octets: [10, 0, 0, 5], prefix: 24 })).toBe(true);
    expect(hasHostBits({ octets: [10, 0, 0, 0], prefix: 24 })).toBe(false);
  });

  it('is false without a prefix, since there is nothing to be outside of', () => {
    expect(hasHostBits({ octets: [10, 0, 0, 5] })).toBe(false);
  });

  it('is false for /32, where every bit is network', () => {
    expect(hasHostBits({ octets: [10, 0, 0, 5], prefix: 32 })).toBe(false);
  });
});
