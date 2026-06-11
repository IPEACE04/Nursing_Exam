export const CATEGORIES = ["ทั้งหมด", "เทคนิค", "แชร์ความรู้", "ถาม-ตอบ"] as const;
export type Category = (typeof CATEGORIES)[number];
