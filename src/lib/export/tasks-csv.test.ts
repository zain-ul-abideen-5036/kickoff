import { describe, expect, it } from 'vitest';
import { EMBER_AND_OAK } from '@/lib/domain/fixtures';
import { defaultSettings } from '@/lib/domain/settings';
import { generateBrief } from '@/lib/engine/generate';
import { briefTasks, csvCell, tasksCsv, toCsv } from './tasks-csv';

const brief = generateBrief({
  id: 'brief-1234',
  ref: 'KO-0142',
  answers: EMBER_AND_OAK,
  settings: defaultSettings(),
});

describe('csvCell', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
    expect(csvCell(5)).toBe('5');
  });
  it('defuses spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+1')).toBe("'+1");
    expect(csvCell('-2')).toBe("'-2");
    expect(csvCell('@cmd')).toBe("'@cmd");
  });
  it('ends rows with CRLF', () => {
    expect(toCsv([['a', 'b']])).toBe('a,b\r\n');
  });
});

describe('briefTasks', () => {
  const tasks = briefTasks(brief);

  it('makes one task per page, feature and content to collect', () => {
    expect(tasks.filter((t) => t.labels === 'Page')).toHaveLength(7);
    expect(tasks.filter((t) => t.labels.startsWith('Feature'))).toHaveLength(brief.features.length);
    expect(tasks.filter((t) => t.labels === 'Content').map((t) => t.name)).toEqual([
      'Collect: Written text',
      'Collect: Lunch, dinner and tasting menus',
      'Collect: Private dining capacity and set menus',
    ]);
  });

  it('groups tasks by phase in order with due weeks from the timeline', () => {
    const sections = [...new Set(tasks.map((t) => t.section))];
    expect(sections).toEqual(['Discovery', 'Design', 'Build', 'Content and QA', 'Launch']);
    expect(tasks.find((t) => t.name === 'Build page: Home')?.dueWeek).toBe(4);
    expect(tasks.at(-1)).toMatchObject({ section: 'Launch', dueWeek: 6 });
  });

  it('puts the kickoff questions on the kickoff call task', () => {
    expect(tasks.find((t) => t.name === 'Kickoff call')?.description).toContain('ResDiary');
  });

  it('keeps feature priorities', () => {
    expect(tasks.find((t) => t.name === 'Feature: Gift vouchers')?.priority).toBe('Could');
  });
});

describe('tasksCsv', () => {
  it('starts with the import headers', () => {
    expect(tasksCsv(brief).split('\r\n')[0]).toBe('Name,Description,Section,Due week,Labels,Priority');
  });
});
