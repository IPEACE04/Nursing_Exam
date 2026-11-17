import assert from "node:assert/strict";
import test from "node:test";
import { inflateRawSync } from "node:zlib";
import writeExcelFile from "write-excel-file/node";
import {
  getScoreSheetData,
  SCORE_WORKBOOK_OPTIONS,
} from "../src/lib/score-workbook.ts";

function unzip(buffer: Buffer) {
  const files = new Map<string, string>();
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(end >= 0, "Workbook must be a real ZIP archive");
  let cursor = buffer.readUInt32LE(end + 16);
  const count = buffer.readUInt16LE(end + 10);
  for (let index = 0; index < count; index++) {
    assert.equal(buffer.readUInt32LE(cursor), 0x02014b50);
    const method = buffer.readUInt16LE(cursor + 10);
    const size = buffer.readUInt32LE(cursor + 20);
    const nameSize = buffer.readUInt16LE(cursor + 28);
    const extraSize = buffer.readUInt16LE(cursor + 30);
    const commentSize = buffer.readUInt16LE(cursor + 32);
    const local = buffer.readUInt32LE(cursor + 42);
    const name = buffer
      .subarray(cursor + 46, cursor + 46 + nameSize)
      .toString();
    const start =
      local +
      30 +
      buffer.readUInt16LE(local + 26) +
      buffer.readUInt16LE(local + 28);
    const bytes = buffer.subarray(start, start + size);
    files.set(name, (method === 8 ? inflateRawSync(bytes) : bytes).toString());
    cursor += 46 + nameSize + extraSize + commentSize;
  }
  return files;
}

test("score export is an Excel workbook with text IDs, Thai, missing results, and no injected formulas", async () => {
  const rows = [
    {
      id: "001234",
      name: "นักศึกษา ก",
      testType: "PreTest" as const,
      score: "0/20",
      duration: "00:00:00",
      completedAt: "2026-01-01 07:00",
    },
    {
      id: "001234",
      name: "นักศึกษา ก",
      testType: "PostTest" as const,
      score: "ยังไม่ได้สอบ",
      duration: "",
      completedAt: "",
    },
    {
      id: "uuid",
      name: '=HYPERLINK("https://example.test")',
      testType: "PreTest" as const,
      score: "5/20",
      duration: "01:01:01",
      completedAt: "2026-02-01 08:30",
    },
    {
      id: "uuid",
      name: "+SUM(1,1)",
      testType: "PostTest" as const,
      score: "20/20",
      duration: "00:10:00",
      completedAt: "2026-03-01 09:15",
    },
  ];
  const buffer = await writeExcelFile(
    getScoreSheetData(rows),
    SCORE_WORKBOOK_OPTIONS,
  ).toBuffer();
  const files = unzip(buffer);
  assert.ok(files.has("[Content_Types].xml"));
  assert.ok(files.get("xl/workbook.xml")?.includes('name="Scores"'));
  const worksheet = files.get("xl/worksheets/sheet1.xml")!;
  const strings = files.get("xl/sharedStrings.xml")!;
  assert.equal((worksheet.match(/<row\b/g) ?? []).length, 5);
  assert.equal(worksheet.includes("<f"), false);
  for (const text of [
    "ID",
    "Name",
    "ประเภทสอบ",
    "Score",
    "ระยะเวลา",
    "วันที่สอบ",
    "2026-01-01 07:00",
    "001234",
    "นักศึกษา ก",
    "PreTest",
    "PostTest",
    "0/20",
    "ยังไม่ได้สอบ",
    "01:01:01",
  ]) {
    assert.ok(strings.includes(text), `Workbook contains ${text}`);
  }
  assert.ok(
    worksheet.includes('t="s"'),
    "User data must be stored as text cells",
  );
});
