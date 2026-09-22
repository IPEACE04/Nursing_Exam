import assert from "node:assert/strict";
import test from "node:test";

import {
  encodeFileNameForStorage,
  decodeFileNameFromStorage,
  getFileExtension,
  isImageUrl,
  getFileNameFromUrl,
  formatFileSize,
  validateCommunityFile,
  validateCommunityFiles,
} from "../src/lib/file-utils.ts";

test("identifies image extensions correctly", () => {
  assert.equal(isImageUrl("https://example.com/storage/post/photo.jpg"), true);
  assert.equal(isImageUrl("https://example.com/storage/post/photo.png"), true);
  assert.equal(isImageUrl("https://example.com/storage/post/photo.webp"), true);
  assert.equal(isImageUrl("https://example.com/storage/post/photo.gif"), true);
  assert.equal(isImageUrl("https://example.com/storage/post/document.pdf"), false);
  assert.equal(isImageUrl("https://example.com/storage/post/sheet.xlsx"), false);
  assert.equal(isImageUrl("https://example.com/storage/post/archive.zip"), false);
});

test("encodes and decodes filenames with ASCII, spaces, and Thai characters", () => {
  const ascii = "ConstructScript Presentation.pdf";
  const encAscii = encodeFileNameForStorage(ascii);
  assert.equal(encAscii, "ConstructScript Presentation.pdf");
  assert.equal(decodeFileNameFromStorage(encAscii), ascii);

  const thai = "สรุปพยาบาล_บทที่1.pdf";
  const encThai = encodeFileNameForStorage(thai);
  assert.equal(encThai.startsWith("b64_"), true);
  assert.equal(decodeFileNameFromStorage(encThai), thai);

  const special = "Test #1 & 2%.docx";
  const encSpecial = encodeFileNameForStorage(special);
  assert.equal(encSpecial.startsWith("b64_"), true);
  assert.equal(decodeFileNameFromStorage(encSpecial), special);
});

test("extracts original filename from url path including spaces, legacy, and base64", () => {
  const urlWithSpaces = "https://example.com/community-media/posts/123/uuid-1234_ConstructScript%20Presentation.pdf";
  assert.equal(getFileNameFromUrl(urlWithSpaces), "ConstructScript Presentation.pdf");

  const thai = "สรุปสอบ_พยาบาล.pdf";
  const encThai = encodeFileNameForStorage(thai);
  const thaiUrl = `https://example.com/community-media/posts/123/uuid-1234_${encThai}`;
  assert.equal(getFileNameFromUrl(thaiUrl), thai);

  const legacyUrl = "https://example.com/community-media/posts/123/legacy-photo.webp";
  assert.equal(getFileNameFromUrl(legacyUrl), "legacy-photo.webp");
});

test("extracts file extension", () => {
  assert.equal(getFileExtension("test.PDF"), "pdf");
  assert.equal(getFileExtension("archive.tar.gz"), "gz");
  assert.equal(getFileExtension("noext"), "");
});

test("formats file size", () => {
  assert.equal(formatFileSize(500), "500 B");
  assert.equal(formatFileSize(2048), "2.0 KB");
  assert.equal(formatFileSize(2 * 1024 * 1024), "2.0 MB");
});

test("validates community files: rejects dangerous extensions", async () => {
  const exeFile = new File(["echo bad"], "malware.exe", { type: "application/x-msdownload" });
  assert.equal(await validateCommunityFile(exeFile), "ไม่อนุญาตให้อัปโหลดไฟล์ .exe เพื่อความปลอดภัย");

  const shFile = new File(["rm -rf /"], "script.sh", { type: "text/x-sh" });
  assert.equal(await validateCommunityFile(shFile), "ไม่อนุญาตให้อัปโหลดไฟล์ .sh เพื่อความปลอดภัย");

  const htmlFile = new File(["<script>alert(1)</script>"], "attack.html", { type: "text/html" });
  assert.equal(await validateCommunityFile(htmlFile), "ไม่อนุญาตให้อัปโหลดไฟล์ .html เพื่อความปลอดภัย");
});

test("validates community files: accepts safe documents and images", async () => {
  const pdfFile = new File(["%PDF-1.4 header"], "nursing-guide.pdf", { type: "application/pdf" });
  assert.equal(await validateCommunityFile(pdfFile), null);

  const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const pngFile = new File([pngBytes], "anatomy.png", { type: "image/png" });
  assert.equal(await validateCommunityFile(pngFile), null);
});

test("validates community files: accepts files of any size without limit", async () => {
  const hugeFile = new File([new Uint8Array(50 * 1024 * 1024)], "huge.pdf", { type: "application/pdf" });
  assert.equal(await validateCommunityFile(hugeFile), null);
});

test("validates community files: handles max files limit and unlimited", async () => {
  const files = [
    new File(["a"], "1.pdf"),
    new File(["b"], "2.pdf"),
    new File(["c"], "3.pdf"),
    new File(["d"], "4.pdf"),
    new File(["e"], "5.pdf"),
  ];
  assert.equal(await validateCommunityFiles(files, 4), "สามารถแนบไฟล์ได้ไม่เกิน 4 ไฟล์");
  assert.equal(await validateCommunityFiles(files), null);
});
