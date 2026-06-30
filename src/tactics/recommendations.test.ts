import { describe, expect, it } from 'vitest';
import { DEFAULT_STRATEGY_CONTEXT } from './strategyContext';
import { analyzeFormation, recommendMatchupStrategy } from './recommendations';

describe('formation analysis', () => {
  it('detects common formation traits', () => {
    expect(analyzeFormation('3-5-2')).toMatchObject({
      defenders: 3,
      midfielders: 5,
      forwards: 2,
      hasBackThree: true,
      hasWingbacks: true,
      hasFrontTwo: true,
      hasCentralOverload: true
    });

    expect(analyzeFormation('4-2-3-1')).toMatchObject({
      defenders: 4,
      midfielders: 5,
      forwards: 1,
      hasDoublePivot: true,
      hasCentralOverload: true
    });
  });
});

describe('matchup recommendations', () => {
  it('targets wingback space when a 4-3-3 faces a 3-5-2', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '4-3-3',
      opponentFormation: '3-5-2',
      matchFormat: '11-a-side'
    });

    expect(recommendation.recommendedAttack.title).toBe('Out Wide');
    expect(recommendation.exploitableSpaces.join(' ')).toContain('wingbacks');
    expect(recommendation.opponentThreats.join(' ')).toContain('Wingbacks');
    expect(recommendation.comparisonInsights.map(insight => insight.label)).toEqual([
      'Shape read',
      'Attack logic',
      'Defensive logic',
      'Coach priority'
    ]);
    expect(recommendation.comparisonInsights[0].value).toContain('4-3-3 vs 3-5-2');
    expect(recommendation.shapeImpactSummary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'our-shape', label: 'Our shape' }),
        expect.objectContaining({ id: 'format-lens', label: 'Format lens', value: 'Full pitch' }),
        expect.objectContaining({ id: 'opponent-problem', value: 'Wingback width' }),
        expect.objectContaining({ id: 'first-action', value: recommendation.recommendedAttack.title })
      ])
    );
  });

  it('uses possession tools when a 4-2-3-1 faces a 4-4-2', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '4-2-3-1',
      opponentFormation: '4-4-2',
      matchFormat: '11-a-side'
    });

    expect(recommendation.recommendedAttack.title).toBe('Possession Game');
    expect(recommendation.recommendedDefense.title).toBe('Half Press');
    expect(recommendation.shapeImpactSummary.find(card => card.id === 'opponent-problem')?.note).toContain('Two forwards');
  });

  it('protects a 5-3-2 against a 4-3-3 front line', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '5-3-2',
      opponentFormation: '4-3-3',
      matchFormat: '11-a-side'
    });

    expect(recommendation.recommendedAttack.title).toBe('Long Ball Counter');
    expect(recommendation.recommendedDefense.title).toBe('Low Block');
    expect(recommendation.opponentThreats.join(' ')).toContain('front three');
    expect(recommendation.shapeImpactSummary.find(card => card.id === 'our-shape')?.value).toBe('Box protection');
  });

  it('uses context to protect a lead with a tired team', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '4-2-3-1',
      opponentFormation: '4-4-2',
      matchFormat: '11-a-side',
      context: {
        ...DEFAULT_STRATEGY_CONTEXT,
        matchState: 'protect-lead',
        matchPhase: 'last-15',
        teamCondition: 'tired',
        opponentBehavior: 'direct-play',
        riskLevel: 'safe'
      }
    });

    expect(['Low Block', 'Compact 4-5-1 Block', 'Rest-Defense Net', 'Half Press']).toContain(recommendation.recommendedDefense.title);
    expect(recommendation.recommendedDefense.title).not.toBe('High Press');
    expect(recommendation.contextReasons.length).toBeGreaterThan(0);
    expect(recommendation.contextReasons.length).toBeLessThanOrEqual(3);
    expect(recommendation.contextReasons.map(reason => reason.label)).toContain('Match state');
    expect(new Set(recommendation.contextReasons.map(reason => reason.label)).size).toBe(recommendation.contextReasons.length);
  });

  it('uses context to chase a goal against a low block', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '4-3-3',
      opponentFormation: '5-4-1',
      matchFormat: '11-a-side',
      context: {
        ...DEFAULT_STRATEGY_CONTEXT,
        matchState: 'chasing-goal',
        matchPhase: 'last-15',
        teamCondition: 'fresh',
        opponentBehavior: 'low-block',
        riskLevel: 'aggressive'
      }
    });

    expect(['Cutback Patterns', 'Blind-Side Runners', 'Half-Space Overload', 'Set-Piece Pressure']).toContain(recommendation.recommendedAttack.title);
    expect(recommendation.contextReasons.some(reason => reason.label === 'Opponent behavior')).toBe(true);
  });

  it('uses context to answer a high press', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '4-2-3-1',
      opponentFormation: '4-3-3',
      matchFormat: '11-a-side',
      context: {
        ...DEFAULT_STRATEGY_CONTEXT,
        opponentBehavior: 'high-press',
        riskLevel: 'safe'
      }
    });

    expect(['Press-Resistant Build', 'Long Ball Counter']).toContain(recommendation.recommendedAttack.title);
  });

  it('uses context to handle wide overloads', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '4-4-2',
      opponentFormation: '3-5-2',
      matchFormat: '11-a-side',
      context: {
        ...DEFAULT_STRATEGY_CONTEXT,
        opponentBehavior: 'wide-overload',
        matchState: 'protect-lead',
        riskLevel: 'safe'
      }
    });

    expect(['Anti-Overload Slide', 'Back-Five Shift', 'Wide Trap']).toContain(recommendation.recommendedDefense.title);
  });
});
