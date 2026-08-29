import assert from "node:assert/strict";
import test from "node:test";

import { getImageGalleryLayout } from "../src/lib/image-gallery-layout.ts";

test("uses a full-width contained layout for one exam question image", () => {
  assert.deepEqual(getImageGalleryLayout(1, "full"), {
    gridClassName: "grid-cols-1",
    imageClassName: "max-h-[32rem] w-full object-contain",
  });
});

test("keeps the gallery grid layout for multiple images", () => {
  assert.deepEqual(getImageGalleryLayout(2, "full"), {
    gridClassName: "grid-cols-2 sm:grid-cols-3",
    imageClassName: "aspect-square w-full object-cover",
  });
});
