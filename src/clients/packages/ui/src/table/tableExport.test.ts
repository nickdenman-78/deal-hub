import { describe, it, expect } from 'vitest';
import { csvField, toCsv, exportFileName } from './tableExport';
import type { DataTableColumn } from './types';

interface Row {
  id: number;
  reference: string;
  name: string;
  consortium: { name: string } | null;
  startDate: Date | null;
  amount: number;
}

const ROWS: Row[] = [
  {
    id: 1,
    reference: 'LGIRET06',
    name: 'Lithgow Group',
    consortium: { name: 'Stanwell Retail' },
    startDate: new Date(Date.UTC(2024, 6, 1)),
    amount: 1840.5,
  },
  {
    id: 2,
    reference: 'GLDRET01',
    name: 'Gladstone, Alumina',
    consortium: null,
    startDate: null,
    amount: 0,
  },
];

const COLUMNS: DataTableColumn<Row>[] = [
  { id: 'reference', header: 'Reference', field: 'reference' },
  { id: 'name', header: 'Name', field: 'name' },
  { id: 'consortium', header: 'Consortium', exportValue: (row) => row.consortium?.name ?? '' },
  { id: 'startDate', header: 'Start', exportValue: (row) => row.startDate, exportType: 'date' },
  { id: 'amount', header: 'Amount', field: 'amount', exportType: 'number' },
  { id: 'actions', excludeFromExport: true },
];

describe('csvField', () => {
  it('leaves an ordinary value alone', () => {
    expect(csvField('LGIRET06')).toBe('LGIRET06');
  });

  it('quotes a value containing a comma', () => {
    expect(csvField('Gladstone, Alumina')).toBe('"Gladstone, Alumina"');
  });

  it('doubles an embedded quote, which is what RFC 4180 asks for', () => {
    expect(csvField('He said "no"')).toBe('"He said ""no"""');
  });

  it('quotes a value containing a newline', () => {
    expect(csvField('one\ntwo')).toBe('"one\ntwo"');
  });

  it('renders null and undefined as empty rather than the word', () => {
    expect(csvField(null)).toBe('');
    expect(csvField(undefined)).toBe('');
  });

  it('keeps zero, which is a value and not an absence', () => {
    expect(csvField(0)).toBe('0');
  });
});

describe('toCsv', () => {
  it('writes a header row from the column headers', () => {
    expect(toCsv(ROWS, COLUMNS).split('\r\n')[0]).toBe('Reference,Name,Consortium,Start,Amount');
  });

  it('omits a column marked excludeFromExport', () => {
    expect(toCsv(ROWS, COLUMNS)).not.toContain('actions');
  });

  it('omits a column with no header — an actions column by another name', () => {
    const csv = toCsv(ROWS, [{ id: 'chevron' }, { id: 'reference', header: 'Reference', field: 'reference' }]);
    expect(csv.split('\r\n')[0]).toBe('Reference');
  });

  it('reads a plain column through its field', () => {
    expect(toCsv(ROWS, COLUMNS).split('\r\n')[1]).toContain('LGIRET06');
  });

  it('reads a slot-rendered column through exportValue', () => {
    expect(toCsv(ROWS, COLUMNS).split('\r\n')[1]).toContain('Stanwell Retail');
  });

  it('writes a Date as an ISO day, not a locale string', () => {
    // dd/mm/yyyy is a date in one locale and text in another, and the export
    // is a file somebody else opens.
    expect(toCsv(ROWS, COLUMNS).split('\r\n')[1]).toContain('2024-07-01');
  });

  it('quotes a field containing a comma so the row keeps its shape', () => {
    const row = toCsv(ROWS, COLUMNS).split('\r\n')[2];
    expect(row).toContain('"Gladstone, Alumina"');
    expect(row.split(',').length).toBeGreaterThan(5);
  });

  it('exports a number as a number, not a formatted label', () => {
    expect(toCsv(ROWS, COLUMNS).split('\r\n')[1]).toContain('1840.5');
  });

  it('keeps a zero amount rather than blanking it', () => {
    expect(toCsv(ROWS, COLUMNS).split('\r\n')[2]).toContain(',0');
  });

  it('renders an absent value as empty', () => {
    // Second row has no consortium and no start date.
    expect(toCsv(ROWS, COLUMNS).split('\r\n')[2]).toBe('GLDRET01,"Gladstone, Alumina",,,0');
  });

  it('terminates rows with CRLF', () => {
    expect(toCsv(ROWS, COLUMNS)).toContain('\r\n');
  });

  it('writes a header even with no rows, so the file says what it is', () => {
    expect(toCsv([], COLUMNS)).toBe('Reference,Name,Consortium,Start,Amount');
  });
});

describe('exportFileName', () => {
  it('stamps the name so files sort and do not collide', () => {
    const at = new Date(2026, 7, 31, 14, 8);
    expect(exportFileName('retail-deals', at)).toBe('retail-deals-2026-08-31-1408.csv');
  });

  it('pads single-digit parts', () => {
    const at = new Date(2026, 0, 5, 9, 7);
    expect(exportFileName('deals', at)).toBe('deals-2026-01-05-0907.csv');
  });
});
