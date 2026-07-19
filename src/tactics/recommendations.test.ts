import { describe, expect, it } from 'vitest';
import { DEFAULT_STRATEGY_CONTEXT } from './strategyContext';
import {
  analyzeFormation,
  assessCurrentPlan,
  pickCoherentPair,
  recommendMatchupStrategy,
  type RankedStrategyCard
} from './recommendations';
import { ATTACK_STRATEGY_CARDS, DEFENSE_STRATEGY_CARDS } from './strategyLibrary';

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

describe('format-aware scoring', () => {
  it('never recommends structurally impossible plans in small-sided formats', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '2-2-1',
      opponentFormation: '1-2-2',
      matchFormat: '6-a-side'
    });

    expect(['Back-Five Shift', 'Compact 4-5-1 Block']).not.toContain(recommendation.recommendedDefense.title);
    expect(['Inverted Fullback Build', 'Box Midfield Rotation', 'False Nine Overload', 'Half-Space Overload'])
      .not.toContain(recommendation.recommendedAttack.title);
  });

  it('penalizes complex plans in small-sided formats with a format warning', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '2-2-1',
      opponentFormation: '1-2-2',
      matchFormat: '6-a-side'
    });

    const boxMidfield = recommendation.attackScores.find(entry => entry.card.id === 'attack-rotation-box-midfield');
    expect(boxMidfield?.reasons.some(reason => reason.label === 'Format' && reason.tone === 'warning')).toBe(true);

    const backFive = recommendation.defenseScores.find(entry => entry.card.id === 'defense-back-five-shift');
    expect(backFive?.reasons.some(reason => reason.label === 'Format' && reason.tone === 'warning')).toBe(true);
  });

  it('leaves 11-a-side scoring unchanged', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '4-3-3',
      opponentFormation: '3-5-2',
      matchFormat: '11-a-side'
    });

    const formatReasons = [...recommendation.attackScores, ...recommendation.defenseScores]
      .flatMap(entry => entry.reasons)
      .filter(reason => reason.label === 'Format');
    expect(formatReasons).toEqual([]);
  });
});

describe('pair coherence', () => {
  const rank = (card: RankedStrategyCard['card'], score: number): RankedStrategyCard => ({ card, score, reasons: [] });
  const possessionGame = ATTACK_STRATEGY_CARDS.find(card => card.id === 'attack-possession-game')!;
  const lowBlock = DEFENSE_STRATEGY_CARDS.find(card => card.id === 'defense-low-block')!;
  const halfPress = DEFENSE_STRATEGY_CARDS.find(card => card.id === 'defense-half-press')!;

  it('keeps a classic protect-lead pairing coherent', () => {
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

    expect(recommendation.pairCoherence.status).toBe('coherent');
  });

  it('swaps the defense when a sustained attack tops a deep block within the margin', () => {
    const result = pickCoherentPair(
      [rank(possessionGame, 20)],
      [rank(lowBlock, 18), rank(halfPress, 15)]
    );

    expect(result.attack?.card.id).toBe('attack-possession-game');
    expect(result.defense?.card.id).toBe('defense-half-press');
    expect(result.coherence.status).toBe('adjusted');
    expect(result.coherence.note).toContain('Half Press');
  });

  it('flags tension when no compatible alternative is close enough', () => {
    const result = pickCoherentPair(
      [rank(possessionGame, 20)],
      [rank(lowBlock, 18), rank(halfPress, 10)]
    );

    expect(result.attack?.card.id).toBe('attack-possession-game');
    expect(result.defense?.card.id).toBe('defense-low-block');
    expect(result.coherence.status).toBe('tension');
    expect(result.coherence.note).toBeTruthy();
  });
});

describe('current plan check', () => {
  const protectLeadTiredContext = {
    ...DEFAULT_STRATEGY_CONTEXT,
    matchState: 'protect-lead' as const,
    matchPhase: 'last-15' as const,
    teamCondition: 'tired' as const,
    opponentBehavior: 'direct-play' as const,
    riskLevel: 'safe' as const
  };

  it('flags a high press as risky when protecting a lead with a tired team', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '4-2-3-1',
      opponentFormation: '4-4-2',
      matchFormat: '11-a-side',
      context: protectLeadTiredContext
    });

    const check = assessCurrentPlan(recommendation, 'Long Ball Counter', 'High Press');
    expect(check.defense?.verdict).toBe('risky');
    expect(check.defense?.note).toBeTruthy();
    expect(['top-pick', 'solid']).toContain(check.attack?.verdict);
  });

  it('marks the recommended plan as the top pick', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '4-3-3',
      opponentFormation: '3-5-2',
      matchFormat: '11-a-side'
    });

    const check = assessCurrentPlan(
      recommendation,
      recommendation.recommendedAttack.styleValue,
      recommendation.recommendedDefense.styleValue
    );
    expect(check.attack?.verdict).toBe('top-pick');
    expect(check.defense?.verdict).toBe('top-pick');
  });

  it('returns null for styles that are not in the library', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '4-3-3',
      opponentFormation: '3-5-2',
      matchFormat: '11-a-side'
    });

    const check = assessCurrentPlan(recommendation, 'Not A Real Style', 'Also Not Real');
    expect(check.attack).toBeNull();
    expect(check.defense).toBeNull();
  });
});
