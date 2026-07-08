// Registry of published reports. Each report's markdown lives under
// src/reports/content and is imported as a raw string so it is bundled into the
// app (and inlined by the single-file IPFS build) — no runtime fetch needed.
// A report can have several language variants; the index links each one.
// To add a report: drop the .md file(s) in content/ and add an entry here.

import x402Bazaar20260708En from './content/x402-bazaar-2026-07-08.md?raw';
import x402Bazaar20260708Ru from './content/x402-bazaar-2026-07-08.ru.md?raw';

export type Lang = 'en' | 'ru';

/** Display label for a language code, shown as a small link in the index. */
export const LANG_LABEL: Record<Lang, string> = {
  en: 'EN',
  ru: 'RU',
};

export interface ReportVariant {
  title: string;
  /** One short line shown next to the title in the reports index. */
  blurb: string;
  /** Full markdown body. */
  content: string;
}

export interface Report {
  /** URL-safe id used in /reports/:id routes. */
  id: string;
  /** ISO date of the underlying data snapshot. */
  date: string;
  /** Language shown when none is requested; also the index row's title/blurb. */
  defaultLang: Lang;
  /** Per-language content. Keys are the languages this report is available in. */
  variants: Partial<Record<Lang, ReportVariant>>;
}

export const reports: Report[] = [
  {
    id: 'x402-bazaar-2026-07-08',
    date: '2026-07-08',
    defaultLang: 'en',
    variants: {
      en: {
        title: 'The x402 Machine-Payments Marketplace',
        blurb: 'A study of the full Coinbase x402 discovery catalog — 24,927 resources.',
        content: x402Bazaar20260708En,
      },
      ru: {
        title: 'Рынок машинных платежей x402',
        blurb: 'Исследование полного discovery-каталога Coinbase x402 — 24 927 ресурсов.',
        content: x402Bazaar20260708Ru,
      },
    },
  },
];

export function findReport(id: string): Report | undefined {
  return reports.find((r) => r.id === id);
}

/** The requested language variant, falling back to the report's default. */
export function reportVariant(report: Report, lang?: string): { lang: Lang; variant: ReportVariant } {
  if (lang && isLang(lang) && report.variants[lang]) {
    return { lang, variant: report.variants[lang]! };
  }
  return { lang: report.defaultLang, variant: report.variants[report.defaultLang]! };
}

/** Languages a report is available in, default first. */
export function reportLangs(report: Report): Lang[] {
  const langs = Object.keys(report.variants) as Lang[];
  return langs.sort((a, b) => (a === report.defaultLang ? -1 : b === report.defaultLang ? 1 : 0));
}

function isLang(value: string): value is Lang {
  return value === 'en' || value === 'ru';
}
