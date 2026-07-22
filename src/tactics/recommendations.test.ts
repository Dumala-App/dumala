import { describe, expect, it } from 'vitest';
import { DEFAULT_STRATEGY_CONTEXT, type StrategyContext } from './strategyContext';
import {
  analyzeFormation,
  assessCoachLensFit,
  assessCurrentPlan,
  pickCoherentPair,
  recommendMatchupStrategy,
  FORMAT_EXCLUSION_PENALTY,
  LENS_MAX_CONTRIBUTION,
  type RankedStrategyCard
} from './recommendations';
import { ATTACK_STRATEGY_CARDS, DEFENSE_STRATEGY_CARDS } from './strategyLibrary';
import { COACH_MODELS, getActiveCoachModels } from './knowledge/coachModels';

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

describe('coach lens', () => {
  it('applies lens boosts to matching strategy cards with reasons', () => {
    const base = { ourFormation: '4-4-2', opponentFormation: '4-4-2', matchFormat: '11-a-side' as const };
    const withoutLens = recommendMatchupStrategy(base);
    const withLens = recommendMatchupStrategy({ ...base, coachLensId: 'mourinho-pragmatic-transition' });

    const before = withoutLens.attackScores.find(entry => entry.card.id === 'attack-quick-counter')!;
    const after = withLens.attackScores.find(entry => entry.card.id === 'attack-quick-counter')!;
    expect(after.score - before.score).toBe(3);
    expect(after.reasons.some(reason => reason.label === 'Coach lens' && reason.value.includes('Mourinho'))).toBe(true);

    const defenseBefore = withoutLens.defenseScores.find(entry => entry.card.id === 'defense-low-block')!;
    const defenseAfter = withLens.defenseScores.find(entry => entry.card.id === 'defense-low-block')!;
    expect(defenseAfter.score - defenseBefore.score).toBe(3);

    expect(withLens.coachLens).toMatchObject({
      id: 'mourinho-pragmatic-transition',
      coachName: 'Jose Mourinho',
      modelName: 'Compact block and transition attack'
    });
    expect(withLens.coachLens?.fit.status).toBe('unset');
    expect(withoutLens.coachLens).toBeNull();
  });

  it('applies lens penalties so a lens expresses what it avoids', () => {
    const base = { ourFormation: '4-4-2', opponentFormation: '4-4-2', matchFormat: '11-a-side' as const };
    const withoutLens = recommendMatchupStrategy(base);
    const withLens = recommendMatchupStrategy({ ...base, coachLensId: 'mourinho-pragmatic-transition' });

    const before = withoutLens.attackScores.find(entry => entry.card.id === 'attack-possession-game')!;
    const after = withLens.attackScores.find(entry => entry.card.id === 'attack-possession-game')!;

    expect(after.score - before.score).toBe(-3);
    expect(after.reasons.some(reason => (
      reason.label === 'Coach lens' && reason.tone === 'warning' && reason.value.includes('Mourinho')
    ))).toBe(true);
  });

  it('keeps every lens contribution inside the magnitude cap', () => {
    const base = { ourFormation: '4-3-3', opponentFormation: '4-4-2', matchFormat: '11-a-side' as const };
    const withoutLens = recommendMatchupStrategy(base);
    const baseline = new Map(
      [...withoutLens.attackScores, ...withoutLens.defenseScores].map(entry => [entry.card.id, entry.score])
    );

    getActiveCoachModels().forEach(model => {
      const withLens = recommendMatchupStrategy({ ...base, coachLensId: model.id });
      [...withLens.attackScores, ...withLens.defenseScores].forEach(entry => {
        const delta = entry.score - baseline.get(entry.card.id)!;
        expect(Math.abs(delta)).toBeLessThanOrEqual(LENS_MAX_CONTRIBUTION);
      });
    });
  });

  it('cannot rescue a plan the match format rules out', () => {
    // The format hard-exclusion penalty must outweigh the strongest possible lens
    // boost, so no lens can promote a plan that cannot physically be run.
    expect(LENS_MAX_CONTRIBUTION).toBeLessThan(FORMAT_EXCLUSION_PENALTY);

    const excluded = ATTACK_STRATEGY_CARDS.find(card => card.formatAvoid?.includes('5-a-side'));
    expect(excluded).toBeDefined();

    const lensedModel = getActiveCoachModels().find(model => (
      model.strategyBoosts.some(boost => boost.strategyId === excluded!.id)
    ));

    if (lensedModel) {
      const result = recommendMatchupStrategy({
        ourFormation: '4-3-3',
        opponentFormation: '4-4-2',
        matchFormat: '5-a-side',
        coachLensId: lensedModel.id
      });
      expect(result.recommendedAttack.id).not.toBe(excluded!.id);
    }
  });

  it('gives every active lens an opinion on both attack and defense', () => {
    const base = { ourFormation: '4-3-3', opponentFormation: '4-4-2', matchFormat: '11-a-side' as const };
    const withoutLens = recommendMatchupStrategy(base);

    getActiveCoachModels().forEach(model => {
      const withLens = recommendMatchupStrategy({ ...base, coachLensId: model.id });
      const attackMoved = withLens.attackScores.some(entry => (
        entry.score !== withoutLens.attackScores.find(other => other.card.id === entry.card.id)!.score
      ));
      const defenseMoved = withLens.defenseScores.some(entry => (
        entry.score !== withoutLens.defenseScores.find(other => other.card.id === entry.card.id)!.score
      ));

      expect(attackMoved, `${model.id} should move attack scores`).toBe(true);
      expect(defenseMoved, `${model.id} should move defense scores`).toBe(true);
    });
  });
});

describe('coach lens fit', () => {
  const mourinho = COACH_MODELS.find(model => model.id === 'mourinho-pragmatic-transition')!;

  it('treats a default context as nothing to disagree with', () => {
    const fit = assessCoachLensFit(mourinho, DEFAULT_STRATEGY_CONTEXT, false);

    expect(fit.status).toBe('unset');
    expect(fit.weight).toBe(1);
    expect(fit.note).toBeUndefined();
  });

  it('reports an aligned lens at full weight', () => {
    const fit = assessCoachLensFit(
      mourinho,
      { ...DEFAULT_STRATEGY_CONTEXT, matchState: 'protect-lead', riskLevel: 'safe' },
      true
    );

    expect(fit.status).toBe('aligned');
    expect(fit.weight).toBe(1);
    expect(fit.diverged).toHaveLength(0);
    expect(fit.note).toContain('full weight');
  });

  it('flags a partially divergent context and reduces lens weight', () => {
    const fit = assessCoachLensFit(
      mourinho,
      { ...DEFAULT_STRATEGY_CONTEXT, matchState: 'chasing-goal', riskLevel: 'safe' },
      true
    );

    expect(fit.status).toBe('partial');
    expect(fit.weight).toBeLessThan(1);
    expect(fit.diverged.map(item => item.key)).toEqual(['matchState']);
    expect(fit.note).toContain('protect lead');
    expect(fit.note).toContain('chasing goal');
  });

  it('flags a fully divergent context and heavily reduces lens weight', () => {
    const fit = assessCoachLensFit(
      mourinho,
      { ...DEFAULT_STRATEGY_CONTEXT, matchState: 'chasing-goal', riskLevel: 'aggressive' },
      true
    );

    expect(fit.status).toBe('diverged');
    expect(fit.weight).toBeLessThan(0.6);
    expect(fit.diverged).toHaveLength(2);
  });

  it('shrinks the scoring effect of a lens used outside its situation', () => {
    const alignedContext = { ...DEFAULT_STRATEGY_CONTEXT, matchState: 'protect-lead' as const, riskLevel: 'safe' as const };
    const divergedContext = { ...DEFAULT_STRATEGY_CONTEXT, matchState: 'chasing-goal' as const, riskLevel: 'aggressive' as const };
    const base = { ourFormation: '4-4-2', opponentFormation: '4-4-2', matchFormat: '11-a-side' as const };

    const lensDelta = (context: StrategyContext) => {
      const withoutLens = recommendMatchupStrategy({ ...base, context });
      const withLens = recommendMatchupStrategy({ ...base, context, coachLensId: mourinho.id });
      const before = withoutLens.defenseScores.find(entry => entry.card.id === 'defense-low-block')!;
      const after = withLens.defenseScores.find(entry => entry.card.id === 'defense-low-block')!;
      return after.score - before.score;
    };

    expect(lensDelta(alignedContext)).toBe(3);
    expect(lensDelta(divergedContext)).toBeLessThan(lensDelta(alignedContext));
    expect(lensDelta(divergedContext)).toBeGreaterThan(0);
  });

  it('surfaces a lens fit warning on cards the lens moved', () => {
    const recommendation = recommendMatchupStrategy({
      ourFormation: '4-4-2',
      opponentFormation: '4-4-2',
      matchFormat: '11-a-side',
      context: { ...DEFAULT_STRATEGY_CONTEXT, matchState: 'chasing-goal', riskLevel: 'aggressive' },
      coachLensId: mourinho.id
    });

    const moved = recommendation.defenseScores.find(entry => entry.card.id === 'defense-low-block')!;
    const untouched = recommendation.defenseScores.find(entry => entry.card.id === 'defense-man-to-man')!;

    expect(moved.reasons.some(reason => reason.label === 'Lens fit' && reason.tone === 'warning')).toBe(true);
    expect(untouched.reasons.some(reason => reason.label === 'Lens fit')).toBe(false);
    expect(recommendation.coachLens?.fit.status).toBe('diverged');
  });

  it('ignores unknown lens ids and leaves scoring untouched', () => {
    const base = { ourFormation: '4-3-3', opponentFormation: '3-5-2', matchFormat: '11-a-side' as const };
    const withoutLens = recommendMatchupStrategy(base);
    const bogusLens = recommendMatchupStrategy({ ...base, coachLensId: 'not-a-real-model' });

    expect(bogusLens.coachLens).toBeNull();
    expect(bogusLens.recommendedAttack.id).toBe(withoutLens.recommendedAttack.id);
    expect(bogusLens.attackScores.map(entry => entry.score)).toEqual(withoutLens.attackScores.map(entry => entry.score));
    expect(bogusLens.defenseScores.map(entry => entry.score)).toEqual(withoutLens.defenseScores.map(entry => entry.score));
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
