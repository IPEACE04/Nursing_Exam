interface CreatedExamRow {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  is_published: boolean;
  created_at: string;
}

export function toAdminExamListItem(exam: CreatedExamRow) {
  return {
    ...exam,
    question_count: 0,
  };
}
