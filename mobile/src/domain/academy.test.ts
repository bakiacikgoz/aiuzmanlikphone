import { describe, expect, it } from 'vitest';

import {
  calculatePlacementResult,
  calculateProgressPercent,
  countCorrectPlacementAnswers,
  formatDuration,
  formatLabResultMessage,
  getPlacementStepLabel,
  getQuizResultMessage,
  isLastPlacementQuestion,
  runPerceptronLab,
} from './academy';

describe('academy domain helpers', () => {
  it('maps placement scores to the intermediate learning path used by the reference result screen', () => {
    const result = calculatePlacementResult(4, 5);

    expect(result.level).toBe('intermediate');
    expect(result.label).toBe('Orta');
    expect(result.recommendedPathSlug).toBe('orta-ai-engineering');
  });

  it('runs the perceptron mini lab with the reference slider values', () => {
    const output = runPerceptronLab({
      x1: 0.6,
      x2: -0.3,
      w1: 0.8,
      w2: -0.5,
      bias: 0.1,
    });

    expect(output.z).toBeCloseTo(0.73, 5);
    expect(output.output).toBe(1);
  });

  it('keeps progress and duration formatting stable for compact mobile cards', () => {
    expect(calculateProgressPercent(24, 42)).toBe(57);
    expect(formatDuration(144)).toBe('~ 2.4 Saat');
  });

  it('tracks placement as a real multi-question flow', () => {
    expect(getPlacementStepLabel(0, 5)).toBe('Soru 1 / 5');
    expect(getPlacementStepLabel(4, 5)).toBe('Soru 5 / 5');
    expect(isLastPlacementQuestion(3, 5)).toBe(false);
    expect(isLastPlacementQuestion(4, 5)).toBe(true);
  });

  it('counts placement answers without relying on hardcoded screen scores', () => {
    const correctCount = countCorrectPlacementAnswers(
      [
        { answerIndex: 1 },
        { answerIndex: 0 },
        { answerIndex: 3 },
      ],
      { 0: 1, 1: 2, 2: 3 },
    );

    expect(correctCount).toBe(2);
  });

  it('formats quiz and lab results without forcing navigation away', () => {
    expect(getQuizResultMessage({ isCorrect: true })).toBe('Dogru cevap. XP eklendi.');
    expect(getQuizResultMessage({ isCorrect: false, explanation: 'ReLU negatifleri 0 yapar.' })).toBe('ReLU negatifleri 0 yapar.');
    expect(formatLabResultMessage({ status: 'passed', output: 1, z: 0.73 })).toBe('Lab sonucu: passed. Cikti 1, z = 0.73.');
  });
});
