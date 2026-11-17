export const CATEGORIES = ["ทั้งหมด", "เทคนิค", "แชร์ความรู้", "ถาม-ตอบ"] as const;
export type Category = (typeof CATEGORIES)[number];

/** Posts loaded per page on the community feed (infinite scroll). */
export const POSTS_PAGE_SIZE = 5;
