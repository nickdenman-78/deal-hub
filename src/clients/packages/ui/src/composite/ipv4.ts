/*
 * IPv4 parsing, formatting and subnet arithmetic. Pure — no DOM, no Vue — so
 * the parts worth getting exactly right can be tested without mounting
 * anything.
 */

export interface Ipv4Value {
  octets: [number, number, number, number];
  /** CIDR prefix length, 0–32. Absent for a bare address. */
  prefix?: number;
}

export interface Ipv4Subnet {
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  /** Usable host addresses. See the /31 and /32 notes below. */
  usableHosts: number;
  mask: string;
}

const OCTET = /^\d{1,3}$/;

/**
 * A single octet or prefix component.
 *
 * LEADING ZEROS ARE REJECTED, and that is a security decision rather than
 * pedantry. `inet_aton` and much of libc read `010` as OCTAL 8, while most
 * language-level parsers read it as decimal 10 — so `127.0.0.010` can be one
 * host to a validator and a different one to whatever finally opens the
 * socket. Refusing the ambiguous form outright is the only reading both agree
 * on. (Same class of bug as the SSRF filter bypasses that rely on it.)
 */
function parseComponent(raw: string, max: number): number | null {
  if (!OCTET.test(raw)) return null;
  if (raw.length > 1 && raw.startsWith('0')) return null;
  const value = Number(raw);
  return value <= max ? value : null;
}

/**
 * Parses `a.b.c.d` or `a.b.c.d/nn`. Returns null for anything else — this is
 * deliberately strict, so it never quietly accepts a partially-typed address.
 */
export function parseIpv4(raw: string | null | undefined): Ipv4Value | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;

  const slashCount = (trimmed.match(/\//g) ?? []).length;
  if (slashCount > 1) return null;

  const [address, prefixPart] = trimmed.split('/');
  if (address === undefined) return null;

  const parts = address.split('.');
  if (parts.length !== 4) return null;

  const octets: number[] = [];
  for (const part of parts) {
    const value = parseComponent(part, 255);
    if (value === null) return null;
    octets.push(value);
  }

  if (prefixPart === undefined) {
    return { octets: octets as [number, number, number, number] };
  }

  const prefix = parseComponent(prefixPart, 32);
  if (prefix === null) return null;
  return { octets: octets as [number, number, number, number], prefix };
}

export function formatIpv4(value: Ipv4Value): string {
  const address = value.octets.join('.');
  return value.prefix === undefined ? address : `${address}/${value.prefix}`;
}

export function toInt(octets: readonly number[]): number {
  // >>> 0 because << 24 on an octet ≥ 128 produces a negative 32-bit int in JS,
  // and every comparison downstream would then be against a negative number.
  return (((octets[0] ?? 0) << 24) | ((octets[1] ?? 0) << 16) | ((octets[2] ?? 0) << 8) | (octets[3] ?? 0)) >>> 0;
}

export function fromInt(value: number): string {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join('.');
}

/**
 * Network, broadcast and usable range for a prefixed address.
 *
 * Null when there is no prefix — a bare address has no subnet, and returning
 * a /32 by default would show an operator arithmetic they did not ask for.
 */
export function subnetOf(value: Ipv4Value): Ipv4Subnet | null {
  if (value.prefix === undefined) return null;

  const prefix = value.prefix;
  const ip = toInt(value.octets);
  // A shift of 32 is a shift of 0 in JS (the count is taken mod 32), so /0
  // would produce an all-ones mask instead of all-zeros. Special-cased.
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;

  /*
   * /31 and /32 are not "2 minus 2" and "1 minus 2".
   *   /32 — a single host route. One address, itself.
   *   /31 — RFC 3021: both addresses are usable on a point-to-point link,
   *         because such a link needs no network or broadcast address.
   * Subtracting 2 unconditionally is the classic off-by-two here, and it
   * yields 0 and -1.
   */
  const total = 2 ** (32 - prefix);
  const usableHosts = prefix >= 31 ? total : total - 2;

  return {
    network: fromInt(network),
    broadcast: fromInt(broadcast),
    firstHost: fromInt(prefix >= 31 ? network : (network + 1) >>> 0),
    lastHost: fromInt(prefix >= 31 ? broadcast : (broadcast - 1) >>> 0),
    usableHosts,
    mask: fromInt(mask),
  };
}

/** True when the address has host bits set outside its own prefix. */
export function hasHostBits(value: Ipv4Value): boolean {
  if (value.prefix === undefined) return false;
  const ip = toInt(value.octets);
  const mask = value.prefix === 0 ? 0 : (0xffffffff << (32 - value.prefix)) >>> 0;
  return (ip & ~mask) >>> 0 !== 0;
}
