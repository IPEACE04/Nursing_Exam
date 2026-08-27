const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export function appendQuestionMediaToFormData(
  formData: FormData,
  questionImages: File[],
  optionImages: Record<string, File[]>,
): void {
  questionImages.forEach((file) => formData.append("questionImage", file));
  OPTION_KEYS.forEach((key) => {
    (optionImages[key] ?? []).forEach((file) => formData.append(`optionImage${key}`, file));
  });
}
