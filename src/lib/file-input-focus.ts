interface BlurTarget {
  blur: () => void;
}

interface ClickTarget {
  click: () => void;
}

export function openHiddenFileInput(input: ClickTarget): void {
  input.click();
}

export function releaseFileInputFocus(input: BlurTarget): void {
  input.blur();
}
