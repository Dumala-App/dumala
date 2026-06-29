import { describe, expect, it } from 'vitest';
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
});
