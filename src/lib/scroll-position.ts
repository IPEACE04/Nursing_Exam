interface ScrollPositionTarget {
  scrollTo: (options: {
    top: number;
    left?: number;
    behavior?: "auto" | "smooth";
  }) => void;
}

export function restoreScrollPosition(target: ScrollPositionTarget, top: number): void {
  target.scrollTo({ top, left: 0, behavior: "auto" });
}

export function scheduleScrollPositionRestore(
  target: ScrollPositionTarget,
  top: number,
  schedule: (callback: () => void) => void,
): void {
  schedule(() => schedule(() => restoreScrollPosition(target, top)));
}
