import assert from "node:assert/strict";
import test from "node:test";

import { calculateImageDimensions } from "../src/lib/image-optimizer.ts";

test("reduces oversized landscape images while preserving aspect ratio", () => {
  assert.deepEqual(calculateImageDimensions(4000, 3000), { width: 1600, height: 1200 });
});

test("keeps small images at their original dimensions", () => {
  assert.deepEqual(calculateImageDimensions(900, 600), { width: 900, height: 600 });
});

test("reduces oversized portrait images while preserving aspect ratio", () => {
  assert.deepEqual(calculateImageDimensions(1200, 3000), { width: 640, height: 1600 });
});

test("target image size is optimized under 1MB for mobile networks and serverless payloads", async () => {
  const { TARGET_IMAGE_SIZE_BYTES, MAX_IMAGE_DIMENSION } = await import("../src/lib/image-optimizer.ts");
  assert.ok(TARGET_IMAGE_SIZE_BYTES <= 1024 * 1024, "Target size should be <= 1MB");
  assert.equal(MAX_IMAGE_DIMENSION, 1600);
});

