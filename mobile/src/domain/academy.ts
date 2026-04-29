export type AcademyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type PlacementResult = {
  level: AcademyLevel;
  label: string;
  scorePercent: number;
  recommendedPathSlug: string;
  estimatedHours: number;
};

export type PerceptronInput = {
  x1: number;
  x2: number;
  w1: number;
  w2: number;
  bias: number;
};

export type PerceptronOutput = {
  z: number;
  output: 0 | 1;
};

export type AnsweredQuestion = {
  answerIndex?: number;
};

const placementBands: {
  minPercent: number;
  result: Omit<PlacementResult, 'scorePercent'>;
}[] = [
  {
    minPercent: 85,
    result: {
      level: 'advanced',
      label: 'Ileri',
      recommendedPathSlug: 'ileri-ai-engineering',
      estimatedHours: 12,
    },
  },
  {
    minPercent: 60,
    result: {
      level: 'intermediate',
      label: 'Orta',
      recommendedPathSlug: 'orta-ai-engineering',
      estimatedHours: 10,
    },
  },
  {
    minPercent: 30,
    result: {
      level: 'beginner',
      label: 'Baslangic',
      recommendedPathSlug: 'baslangic-ai-engineering',
      estimatedHours: 6,
    },
  },
  {
    minPercent: 0,
    result: {
      level: 'beginner',
      label: 'Baslangic',
      recommendedPathSlug: 'baslangic-ai-engineering',
      estimatedHours: 6,
    },
  },
];

export function calculatePlacementResult(correctCount: number, questionCount: number): PlacementResult {
  const safeQuestionCount = Math.max(1, questionCount);
  const scorePercent = Math.round((Math.max(0, correctCount) / safeQuestionCount) * 100);
  const band = placementBands.find((item) => scorePercent >= item.minPercent) ?? placementBands.at(-1);

  return {
    ...band!.result,
    scorePercent,
  };
}

export function getPlacementStepLabel(currentIndex: number, totalQuestions: number): string {
  const safeTotal = Math.max(1, totalQuestions);
  const safeIndex = Math.min(Math.max(0, currentIndex), safeTotal - 1);
  return `Soru ${safeIndex + 1} / ${safeTotal}`;
}

export function isLastPlacementQuestion(currentIndex: number, totalQuestions: number): boolean {
  return currentIndex >= Math.max(1, totalQuestions) - 1;
}

export function countCorrectPlacementAnswers(
  questions: AnsweredQuestion[],
  selectedAnswers: Record<number, number | undefined>,
): number {
  return questions.reduce((total, question, index) => {
    if (typeof question.answerIndex !== 'number') return total;
    return selectedAnswers[index] === question.answerIndex ? total + 1 : total;
  }, 0);
}

export function getQuizResultMessage(result: { isCorrect?: boolean; explanation?: string | null }): string {
  if (result.isCorrect) return 'Dogru cevap. XP eklendi.';
  return result.explanation || 'Cevap tekrar incelenmeli.';
}

export function formatLabResultMessage(result: { status?: string; output?: number; z?: number }): string {
  const status = result.status ?? 'passed';
  const output = typeof result.output === 'number' ? result.output : '-';
  const z = typeof result.z === 'number' ? result.z.toFixed(2) : '-';
  return `Lab sonucu: ${status}. Cikti ${output}, z = ${z}.`;
}

export function runPerceptronLab(input: PerceptronInput): PerceptronOutput {
  const z = input.x1 * input.w1 + input.x2 * input.w2 + input.bias;

  return {
    z,
    output: z >= 0 ? 1 : 0,
  };
}

export function calculateProgressPercent(completed: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} dk`;
  }

  const hours = minutes / 60;
  return `~ ${Number.isInteger(hours) ? hours : hours.toFixed(1)} Saat`;
}
