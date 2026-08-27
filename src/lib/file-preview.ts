export function createFilePreviewUrls(files: File[]): string[] {
  return files.map((file) => URL.createObjectURL(file));
}

export function revokeFilePreviewUrls(urls: string[]): void {
  urls.forEach((url) => URL.revokeObjectURL(url));
}
