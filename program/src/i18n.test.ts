import { describe, expect, it } from 'vitest';
import { t } from './i18n';

describe('i18n', () => {
  it('looks up translations', () => {
    expect(t('app.title')).toBe('传奇棋');
  });

  it('interpolates params', () => {
    expect(t('phase.setup', { owner: '先手方' })).toBe('先手方 布阵');
    expect(t('round.turn', { round: 2, turn: 3 })).toBe('第 2 轮 · 回合 3');
  });

  it('falls back to the key', () => {
    expect(t('missing.key')).toBe('missing.key');
  });
});
