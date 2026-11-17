import type { SheetData } from "write-excel-file/browser";
import type { AdminScoreExportRow } from "../types/index.ts";

export const SCORE_WORKBOOK_OPTIONS = {
  sheet: "Scores",
  stickyRowsCount: 1,
  columns: [
    { width: 38 },
    { width: 32 },
    { width: 16 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ],
};

export function getScoreSheetData(rows: AdminScoreExportRow[]): SheetData {
  return [
    ["ID", "Name", "ประเภทสอบ", "Score", "ระยะเวลา", "วันที่สอบ"].map((value) => ({
      type: String,
      value,
      fontWeight: "bold" as const,
    })),
    ...rows.map((row) =>
      [row.id, row.name, row.testType, row.score, row.duration, row.completedAt].map(
        (value) => ({ type: String, value }),
      ),
    ),
  ];
}
