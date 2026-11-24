/** Compact question tuple: [text, "optA|optB|optC|optD", correctIndex, level] */
export type QT = [text: string, opts: string, correct: number, level: "e" | "m" | "h"];

export interface UnitDef {
  slug: string;
  title: string;
  summary: string;
  topics: string[];
  qs: QT[];
}

export interface PaperDef {
  slug: "m1" | "m2" | "m3" | "m4";
  code: string;
  title: string;
  short: string;
  semester: 1 | 2;
  summary: string;
  skills: string[];
  units: UnitDef[];
}
