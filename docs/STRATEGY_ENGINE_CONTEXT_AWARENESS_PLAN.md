# Dumala Strategy Engine Context Awareness Plan

Updated: 2026-06-30

## 1. Purpose

The Strategy Engine should become a practical coaching decision system for the Tactics workspace. It should not pretend to be a black-box AI coach. The strongest near-term version is a transparent, rule-based engine that uses football coaching principles, formation analysis, match context, opponent behavior, and team readiness to recommend realistic attacking and defensive plans.

The goal is to move Dumala from:

> "This formation matchup suggests this tactic."

to:

> "Given our shape, the opponent shape, match state, team condition, risk level, and opponent behavior, these are the best tactical plans and the reasons they fit."

## 2. Coaching Standards Basis

The engine should be grounded in widely recognized coaching frameworks rather than invented labels. The practical basis should be:

1. Game phases:
   - In possession
   - Out of possession
   - Attacking transition
   - Defensive transition
   - Set pieces

2. Tactical principles:
   - Width
   - Depth
   - Support angles
   - Compactness
   - Pressure, cover, and balance
   - Rest-defense
   - Counter-pressing
   - Playing through, around, or over pressure
   - Final-third chance quality: cutbacks, central entries, second balls, and set-piece pressure

3. Coaching observation lens:
   - On the ball: the immediate action, touch, pass, carry, shot, duel, or pressure.
   - Around the ball: nearest support, pressure, cover, overloads, and transition security.
   - Away from the ball: weak-side positioning, blind-side runs, rest-defense, compactness, and far-side threats.

4. Match-management logic:
   - Protecting a lead should reduce unnecessary risk.
   - Chasing a goal should increase chance creation and territory pressure.
   - Tired teams should be protected from high-sprint tactical demands.
   - Fresh teams can press and counter-press more aggressively.
   - Small-sided formats should prefer simpler triggers and shorter tactical chains.

5. Evidence sources to use as reference material:
   - FIFA Training Centre: coaching education, tactical articles, player development, and training methodology.  
     https://www.fifatrainingcentre.com/en/
   - England Football Learning: coaching resources, observation, decision-making, and action-priority thinking.  
     https://learn.englandfootball.com/
   - England Football Learning Action Priority Matrix: useful implementation lens for deciding which strategy improvements have the best impact-to-effort balance.  
     https://learn.englandfootball.com/articles-and-resources/coaching/resources/2026/The-action-priority-matrix
   - IFAB Laws of the Game: set-piece, restart, and match-rule boundaries where tactical recommendations touch laws or restarts.  
     https://www.theifab.com/laws/latest/

These references should guide terminology and logic. Dumala does not need to copy external course content. It should translate standard coaching ideas into explainable, app-specific decisions.

## 3. Coach Model Case Study Library

The Strategy Engine should include a small internal library of famous coaching models. This should not be a "copy this manager" feature. It should be used as reference material for tactical logic, scoring, and explanation.

Each model should teach the engine a repeatable football idea:

- Guardiola teaches positional play, rest-defense, structured build-up, high counter-pressure, and controlled chance creation.
- Mourinho teaches compactness, opposition-specific planning, transition attack, game-state management, and protecting valuable spaces.
- Ancelotti teaches tactical flexibility, player-first system design, role adaptation, and balancing stars inside stable structures.
- Wenger teaches attacking fluency, youth development, technical freedom, quick combinations, and player expression.
- Ferguson teaches tempo changes, wing play, late pressure, squad management, and game momentum.

### Pep Guardiola, Barcelona 2008-2012

Reference themes:

- 4-3-3 base with positional spacing.
- Short passing with intention, not possession for possession's sake.
- False nine movement, especially Messi dropping to create central superiority.
- High pressing after possession loss.
- Fullbacks and wide players creating width.
- Midfield control through Xavi, Iniesta, Busquets-style occupation of central lanes.
- Academy continuity and shared playing identity.

Strategy Engine use:

- Reward `Possession Game`, `Third-Man Combinations`, `False Nine Overload`, `Cutback Patterns`, and `Counter Press` when the team is technically strong and the match state is balanced or chasing.
- Reward central overload and third-man plans against opponents with weak midfield coverage.
- Penalize possession-heavy plans when the team condition is tired, the pitch is poor, or the squad lacks technical midfielders.

Implementation tags:

- `positional-play`
- `false-nine`
- `central-overload`
- `counter-press`
- `third-man`
- `width-and-depth`
- `rest-defense`

Recommended engine behavior:

```ts
if (context.opponentBehavior === 'low-block' && context.riskLevel !== 'safe') {
  reward(['Cutback Patterns', 'Blind-Side Runners', 'Third-Man Combinations']);
}

if (teamProfile.midfieldTechnicalScore >= 7) {
  reward(['Possession Game', 'Box Midfield Rotation', 'False Nine Overload']);
}
```

### Pep Guardiola, Manchester City

Reference themes:

- Build-up flexibility across 4-3-3, 3-2-4-1, 3-2-2-3, and hybrid structures.
- Inverted fullbacks or hybrid defenders moving into midfield.
- Goalkeeper and center backs as active build-up players.
- Rest-defense behind attacks to stop counterattacks before they develop.
- High territory pressure and sustained final-third occupation.
- More direct penalty-box threat when using a true striker such as Erling Haaland.
- Tactical evolution based on league, squad profile, and opponent pressure.

Strategy Engine use:

- Reward `Inverted Fullback Build`, `Press-Resistant Build`, `Box Midfield Rotation`, `Half-Space Overload`, `Set-Piece Pressure`, and `Rest-Defense Net`.
- Against high press, suggest build-up escape or direct release options depending on goalkeeper/distribution strength.
- Against deep blocks, suggest half-space occupation, cutbacks, blind-side runs, and second-ball pressure.
- When protecting a lead, favor rest-defense and compactness over constant overloads.

Implementation tags:

- `inverted-fullback`
- `hybrid-defender`
- `build-up-control`
- `box-midfield`
- `rest-defense`
- `territory-pressure`
- `final-third-occupation`

Recommended engine behavior:

```ts
if (context.opponentBehavior === 'high-press') {
  reward(['Press-Resistant Build', 'Long Ball Counter']);
}

if (context.matchState === 'protect-lead') {
  reward(['Rest-Defense Net', 'Half Press']);
  penalize(['High Press', 'Half-Space Overload']);
}
```

### Jose Mourinho

Reference themes:

- Match-plan specificity.
- Compact defensive structures.
- Protect central areas first.
- Fast counterattacks after regains.
- Strong double pivot or midfield screen.
- Game-state pragmatism.
- Targeting opponent weaknesses rather than imposing one fixed style.

Strategy Engine use:

- Reward `Low Block`, `Zonal Block`, `Half Press`, `Front-Two Screen`, `Long Ball Counter`, and `Quick Counter`.
- When protecting a lead or facing a stronger opponent, recommend compactness and clear outlet rules.
- Against high-possession opponents, recommend counter lanes, second-ball structure, and transition triggers.
- Add warnings when aggressive plans expose the central counter lane.

Implementation tags:

- `compact-block`
- `transition-attack`
- `double-pivot`
- `game-management`
- `opponent-specific`
- `central-protection`

Recommended engine behavior:

```ts
if (context.matchState === 'protect-lead' || context.riskLevel === 'safe') {
  reward(['Low Block', 'Zonal Block', 'Front-Two Screen', 'Quick Counter']);
}

if (context.opponentBehavior === 'strong-midfield') {
  reward(['Out Wide', 'Long Ball Counter', 'Half Press']);
}
```

### Carlo Ancelotti

Reference themes:

- Player-first system design.
- Tactical flexibility instead of one rigid model.
- Midfield diamonds and narrow structures when they fit the squad.
- Deep playmaker usage, such as Pirlo-style build-up references.
- Freedom for elite attackers inside a stable defensive and midfield base.
- Calm game management and role adaptation.

Strategy Engine use:

- Reward flexible plans that fit the actual squad profile.
- If the team has a strong playmaker and two forwards, support `Box Midfield Rotation`, `Third-Man Combinations`, and diamond/narrow buildup.
- If the team has elite wide pace, support `Quick Counter`, `Overload to Isolate`, and transition releases.
- Avoid forcing positional play if player profiles point toward directness or transition.

Implementation tags:

- `player-fit`
- `role-adaptation`
- `diamond-midfield`
- `deep-playmaker`
- `balanced-control`
- `attacker-freedom`

Recommended engine behavior:

```ts
if (teamProfile.playmakerScore >= 8) {
  reward(['Third-Man Combinations', 'Box Midfield Rotation', 'Possession Game']);
}

if (teamProfile.forwardPaceScore >= 8 && context.opponentBehavior !== 'low-block') {
  reward(['Quick Counter', 'Overload to Isolate']);
}
```

### Arsene Wenger

Reference themes:

- Technical development and attacking expression.
- Quick combinations, rotations, and player intuition.
- 4-4-2 and 4-3-3 influences with space coverage and fluid attack.
- Youth development and trust in player learning.
- Athletic, technical, forward-thinking football.

Strategy Engine use:

- Reward `Third-Man Combinations`, `Possession Game`, `Blind-Side Runners`, `Overload to Isolate`, and `Cutback Patterns` when the team has technical attackers.
- For development-focused teams, prefer plans that teach principles rather than only protect results.
- When match state is balanced and risk is balanced or aggressive, support attacking combinations and wide-to-central movement.

Implementation tags:

- `technical-expression`
- `combination-play`
- `youth-development`
- `attacking-fluency`
- `space-coverage`
- `wide-central-rotation`

Recommended engine behavior:

```ts
if (context.matchState === 'balanced' && teamProfile.attackingTechniqueScore >= 7) {
  reward(['Third-Man Combinations', 'Blind-Side Runners', 'Overload to Isolate']);
}

if (context.riskLevel === 'safe') {
  doNotOverReward(['Half-Space Overload', 'False Nine Overload']);
}
```

### Sir Alex Ferguson

Reference themes:

- Tempo, mentality, and game momentum.
- Wing play and crossing threat.
- Late pressure when chasing.
- Squad rotation and freshness.
- Strong dressing-room standards and role clarity.
- Tactical adaptability across eras.

Strategy Engine use:

- Reward `Out Wide`, `Set-Piece Pressure`, `Quick Counter`, `High Press`, and `Counter Press` when chasing late and the team condition is fresh or normal.
- When team condition is tired, prefer simpler direct attacks and set-piece pressure rather than complex rotations.
- Add match-phase weighting so `last-15` changes recommendations strongly.

Implementation tags:

- `late-pressure`
- `wing-play`
- `crossing`
- `set-piece-pressure`
- `tempo-shift`
- `squad-freshness`
- `role-clarity`

Recommended engine behavior:

```ts
if (context.matchState === 'chasing-goal' && context.matchPhase === 'last-15') {
  reward(['Set-Piece Pressure', 'Out Wide', 'Counter Press']);
}

if (context.teamCondition === 'tired' && context.matchPhase === 'last-15') {
  reward(['Set-Piece Pressure', 'Long Ball Counter']);
  penalize(['High Press', 'False Nine Overload']);
}
```

### Case Study References To Maintain

Add these references to the product research backlog:

- Guardiola at Barcelona: positional play, false nine, high pressing, and midfield control.
- Guardiola at Manchester City: 3-2-4-1/3-2-2-3 occupation, inverted fullbacks, hybrid defenders, goalkeeper build-up, and rest-defense.
- Mourinho at Porto, Chelsea, Inter, and Real Madrid: compact defending, transition attack, double-pivot protection, and opponent-specific plans.
- Ancelotti at Milan and Real Madrid: diamond midfield, deep playmaker usage, flexible role design, and elite attacker management.
- Wenger at Arsenal: technical development, attacking fluency, combinations, and player expression.
- Ferguson at Manchester United: wide attacks, tempo shifts, late-game pressure, rotation, and mentality.

Useful starting references:

- Pep Guardiola tactical profile and Barcelona/Manchester City examples: https://en.wikipedia.org/wiki/Pep_Guardiola
- Inverted fullback role overview: https://en.wikipedia.org/wiki/Defender_(association_football)#Inverted_full-backs
- Formation reference, including 3-2-4-1: https://en.wikipedia.org/wiki/Formation_(association_football)
- Jose Mourinho tactical profile and Real Madrid counterattacking example: https://en.wikipedia.org/wiki/Jos%C3%A9_Mourinho
- Carlo Ancelotti tactical profile and Milan diamond/deep playmaker example: https://en.wikipedia.org/wiki/Carlo_Ancelotti
- Arsene Wenger tactical profile and player-development philosophy: https://en.wikipedia.org/wiki/Ars%C3%A8ne_Wenger
- Alex Ferguson career and Manchester United era reference: https://en.wikipedia.org/wiki/Alex_Ferguson
- Coaches' Voice tactical explainers should be preferred where accessible for concepts such as inverted fullbacks, W-M/3-2-2-3 structures, and Manchester City 2022/23.

## 4. Editable Strategy Knowledge Architecture

The coach model library and strategy plan library should be easy to expand. Dumala should not require a developer to rewrite recommendation logic every time a new coach, tactical model, or strategy card is added.

The recommended architecture is:

1. Keep the engine logic stable.
2. Move coach models and strategy metadata into structured data files.
3. Validate those files with schemas.
4. Convert the data into scoring tags at runtime.
5. Add tests that catch broken IDs, missing fields, duplicate tags, and unscored strategies.

This allows future updates such as:

- Adding a new coach model.
- Adding a new tactical era, such as Klopp Liverpool or Sacchi Milan.
- Adding a new attacking plan.
- Adding a new defensive plan.
- Adding new context mappings.
- Adding references without touching the scoring engine.

### Recommended File Structure

Use a dedicated tactics knowledge folder:

```txt
src/tactics/knowledge/
  coachModels.ts
  strategyCards.ts
  strategyTags.ts
  contextRules.ts
  validation.ts
```

Later, if non-developers need to edit the content, the same model can move to JSON:

```txt
src/tactics/knowledge/data/
  coachModels.json
  attackStrategies.json
  defenseStrategies.json
  contextRules.json
```

For the current React/TypeScript app, TypeScript data files are the safest first step because they give autocomplete and compile-time checks.

### Coach Model Schema

Each coach model should be data, not recommendation logic.

```ts
export type CoachModel = {
  id: string;
  coachName: string;
  modelName: string;
  era?: string;
  clubs?: string[];
  summary: string;
  tacticalThemes: string[];
  principles: StrategyTag[];
  preferredContexts: Partial<StrategyContext>;
  strategyBoosts: {
    strategyId: string;
    points: number;
    reason: string;
  }[];
  strategyPenalties?: {
    strategyId: string;
    points: number;
    reason: string;
  }[];
  references: {
    label: string;
    url: string;
    sourceType: 'official' | 'education' | 'analysis' | 'encyclopedia' | 'book' | 'video';
  }[];
  status: 'draft' | 'reviewed' | 'active';
};
```

Example:

```ts
export const COACH_MODELS: CoachModel[] = [
  {
    id: 'guardiola-barcelona-2008-2012',
    coachName: 'Pep Guardiola',
    modelName: 'Barcelona positional play',
    era: '2008-2012',
    clubs: ['Barcelona'],
    summary: 'Possession-oriented positional play with central superiority, width, counter-pressing, and false-nine movement.',
    tacticalThemes: ['positional play', 'false nine', 'central overload', 'counter-press'],
    principles: ['positional-play', 'counter-press', 'third-man', 'width-and-depth'],
    preferredContexts: {
      matchState: 'balanced',
      riskLevel: 'balanced'
    },
    strategyBoosts: [
      {
        strategyId: 'attack-possession-game',
        points: 3,
        reason: 'Guardiola Barcelona model favors controlled possession and positional spacing.'
      },
      {
        strategyId: 'attack-false-nine-overload',
        points: 3,
        reason: 'False-nine movement can create central superiority when the squad has technical attackers.'
      }
    ],
    references: [
      {
        label: 'FIFA Training Centre',
        url: 'https://www.fifatrainingcentre.com/en/',
        sourceType: 'education'
      }
    ],
    status: 'active'
  }
];
```

### Strategy Card Schema

Strategy cards should also be editable data.

```ts
export type StrategyCard = {
  id: string;
  phase: 'attack' | 'defense';
  title: string;
  styleValue: string;
  intent: string;
  bestFor: string;
  details: {
    label: string;
    value: string;
  }[];
  cues: string[];
  watchout: string;
  formationFit: StrategyTag[];
  opponentCounters: StrategyTag[];
  tags: StrategyTag[];
  contextFit?: {
    matchState?: StrategyMatchState[];
    matchPhase?: StrategyMatchPhase[];
    teamCondition?: StrategyTeamCondition[];
    opponentBehavior?: StrategyOpponentBehavior[];
    riskLevel?: StrategyRiskLevel[];
  };
  sourceModelIds?: string[];
  status: 'draft' | 'reviewed' | 'active';
};
```

Rules:

- `id` must be stable and unique.
- `styleValue` is what the UI applies to the active tactic.
- `sourceModelIds` can link a strategy to coach models.
- `contextFit` should only include fields that affect recommendation scoring.
- Avoid descriptive-only fields that do not change engine behavior.

### Strategy Tags Registry

Create a central tag registry so future content stays consistent.

```ts
export type StrategyTag =
  | 'positional-play'
  | 'counter-press'
  | 'rest-defense'
  | 'low-block'
  | 'mid-block'
  | 'high-press'
  | 'wide-overload'
  | 'central-overload'
  | 'third-man'
  | 'false-nine'
  | 'inverted-fullback'
  | 'box-midfield'
  | 'direct-play'
  | 'set-piece-pressure'
  | 'transition-attack'
  | 'compact-block'
  | 'wing-play'
  | 'player-fit';
```

Do not allow random free-text tags in strategy cards. Free-text tags make future scoring messy.

### Adding A New Coach

Future workflow:

1. Add the coach model to `coachModels.ts`.
2. Use a stable ID, such as `klopp-liverpool-2018-2022`.
3. Add tactical themes and principles from the tag registry.
4. Link the model to existing strategy IDs through `strategyBoosts`.
5. Add references.
6. Set status to `draft`.
7. Run validation tests.
8. Promote to `reviewed` or `active` after checking the recommendations.

Example future coach additions:

- Jurgen Klopp: gegenpressing, vertical transitions, fullback creativity, front-three pressing.
- Arrigo Sacchi: compact 4-4-2, zonal defending, coordinated pressing, line movement.
- Marcelo Bielsa: man-oriented pressing, rotations, verticality, overloads, high physical demand.
- Johan Cruyff: positional play foundations, diamonds, technical superiority, youth pathway.
- Antonio Conte: back-three structures, wingback patterns, automatized attacks, compact defending.
- Diego Simeone: compact block, emotional intensity, transition attack, defensive discipline.
- Luis Enrique: positional play, high pressing, vertical possession, flexible front line.
- Roberto De Zerbi: baiting the press, goalkeeper build-up, third-man exits, central risk.

### Adding A New Strategy

Future workflow:

1. Add strategy card data to `strategyCards.ts`.
2. Choose whether it is attack or defense.
3. Link to existing tags.
4. Add context fit only when it directly affects scoring.
5. Add at least one test scenario where this strategy should rank well.
6. Add one warning condition if the strategy can be dangerous.
7. Confirm the UI card remains readable.

Example future strategies:

- Bait the Press Build-Up.
- Wide Diamond Rotation.
- Man-Oriented High Press.
- Asymmetric Fullback Attack.
- Box Crash Final Phase.
- Second-Ball Territory Play.
- Deep Compact Counter.
- Hybrid Back Three Build.

### Validation Rules

Add tests for the knowledge files.

Required validation:

- Every coach model ID is unique.
- Every strategy card ID is unique.
- Every `strategyBoosts.strategyId` points to an existing strategy.
- Every `sourceModelIds` value points to an existing coach model.
- Every tag is in the tag registry.
- Every active strategy has at least:
  - one formation fit tag,
  - one opponent counter tag,
  - one cue,
  - one watchout,
  - one context or formation use case.
- Draft items do not appear in the main recommendation UI unless a debug flag is enabled.

### Admin Editing Later

If Dumala later adds a knowledge-content admin console, the same data model can power an editor.

Potential editor fields:

- Coach name.
- Model name.
- Era.
- Clubs.
- Tactical themes.
- Linked strategy boosts.
- Linked strategy penalties.
- References.
- Status.

The editor should not expose raw scoring code. It should expose controlled dropdowns for tags, strategies, and context values.

### Recommended First Refactor

Before building the full context-aware engine, make the current strategy data easier to maintain:

1. Move current strategy cards from `strategyLibrary.ts` into `src/tactics/knowledge/strategyCards.ts`.
2. Create `strategyTags.ts`.
3. Add `coachModels.ts` with the current famous coach models.
4. Add validation tests.
5. Keep `strategyLibrary.ts` as the public export layer so existing imports do not break.

This keeps the app stable while making future strategy expansion much easier.

## 5. Current System Summary

Current core files:

- `src/tactics/strategyLibrary.ts`: attacking and defensive strategy cards.
- `src/tactics/recommendations.ts`: formation trait detection, tag scoring, threat generation, space generation, and recommendation output.
- `src/components/TacticsView.tsx`: formation selection, opponent formation selection, Shape Impact cards, Matchup Strategy panel, and apply actions.

Current engine strengths:

- Deterministic and testable.
- Works offline.
- Explains formation matchup in plain language.
- Recommends both attack and defense.
- Includes a useful strategy library.
- Lets coaches apply recommended attacking and defensive styles to the tactical board.

Current limitations:

- Recommendations depend mainly on formations.
- It does not know the match situation.
- It does not know if the team is tired or fresh.
- It does not know opponent tendencies beyond formation.
- It does not consider risk appetite.
- It does not yet connect recommendations to player strengths, training plans, or match notes.

## 6. Product Principle

The Strategy Engine should be "coach-confirmed, system-assisted."

The system should suggest, rank, and explain. The coach should still choose. This is important because football tactics are contextual, and grassroots coaches often have important information the app cannot infer automatically.

The engine should therefore:

- Ask for a small number of high-value context inputs.
- Make the recommendation visibly change based on those inputs.
- Show reasons.
- Avoid overclaiming certainty.
- Keep the coach in control with apply buttons and alternatives.

## 7. Context Awareness Scope

### Version 1 Context Inputs

Add a compact Strategy Context section inside the Tactics Strategy Engine panel.

Recommended fields:

| Field | Values | Why it matters |
| --- | --- | --- |
| Match state | Balanced, Protect lead, Chasing goal | Changes risk and territorial intent. |
| Match phase | First half, Second half, Last 15 | Changes urgency, fatigue assumptions, and game management. |
| Team condition | Fresh, Normal, Tired | Controls whether high-press and high-transition plans are realistic. |
| Opponent behavior | Balanced, High press, Low block, Wide overload, Direct play, Strong midfield | Adds tactical information formation alone cannot provide. |
| Risk level | Safe, Balanced, Aggressive | Lets the coach choose how bold the recommendation should be. |

Do not add more fields in version 1. The goal is to improve intelligence without turning the panel into a scouting report form.

### Version 2 Context Inputs

After version 1 is working, add optional advanced context:

- Scoreline.
- Match minute.
- Home or away.
- Competition type: friendly, league, knockout.
- Opponent danger player role: winger, striker, playmaker, target forward, wingback.
- Pitch condition: normal, small pitch, poor surface, wet surface.
- Referee strictness: normal, strict, lenient.

These should not be part of the first implementation unless the first version feels too shallow.

## 8. Recommended Data Model

Add a context type in `src/tactics/recommendations.ts`.

```ts
export type StrategyMatchState = 'balanced' | 'protect-lead' | 'chasing-goal';
export type StrategyMatchPhase = 'first-half' | 'second-half' | 'last-15';
export type StrategyTeamCondition = 'fresh' | 'normal' | 'tired';
export type StrategyOpponentBehavior =
  | 'balanced'
  | 'high-press'
  | 'low-block'
  | 'wide-overload'
  | 'direct-play'
  | 'strong-midfield';
export type StrategyRiskLevel = 'safe' | 'balanced' | 'aggressive';

export type StrategyContext = {
  matchState: StrategyMatchState;
  matchPhase: StrategyMatchPhase;
  teamCondition: StrategyTeamCondition;
  opponentBehavior: StrategyOpponentBehavior;
  riskLevel: StrategyRiskLevel;
};
```

Default context:

```ts
export const DEFAULT_STRATEGY_CONTEXT: StrategyContext = {
  matchState: 'balanced',
  matchPhase: 'first-half',
  teamCondition: 'normal',
  opponentBehavior: 'balanced',
  riskLevel: 'balanced'
};
```

Add compact context fit to strategy cards:

```ts
contextFit?: {
  matchState?: StrategyMatchState[];
  matchPhase?: StrategyMatchPhase[];
  teamCondition?: StrategyTeamCondition[];
  opponentBehavior?: StrategyOpponentBehavior[];
  riskLevel?: StrategyRiskLevel[];
  avoidWhen?: Partial<StrategyContext>;
};
```

This is useful because it directly affects recommendations. It should not become descriptive filler.

## 9. Scoring Model

The engine should keep the current formation scoring and add context scoring.

Recommended scoring layers:

1. Our formation fit: existing `formationFit`.
2. Opponent formation counters: existing `opponentCounters`.
3. Tactical tags: existing `tags`.
4. Context fit: new match context score.
5. Context penalties: reduce unrealistic plans.
6. Explainability reasons: store why the score changed.

Recommended scoring weights:

| Signal | Suggested points |
| --- | ---: |
| Our formation fit | +3 |
| Opponent formation counter | +4 |
| Tag match | +1 |
| Match state fit | +5 |
| Opponent behavior fit | +5 |
| Team condition fit | +3 |
| Risk level fit | +3 |
| Match phase fit | +2 |
| Avoid condition hit | -6 |

Example:

- `High Press` should gain points when team condition is `fresh`, risk is `aggressive`, and opponent behavior is `slow build-up` or `balanced`.
- `High Press` should lose points when team condition is `tired`, match state is `protect-lead`, or match phase is `last-15`.
- `Compact 4-5-1 Block`, `Low Block`, and `Back-Five Shift` should gain points when protecting a lead, tired, or facing wide overload.
- `Cutback Patterns`, `Blind-Side Runners`, and `Set-Piece Pressure` should gain points against low blocks.

## 10. Recommendation Output

Extend `MatchupRecommendation` to include ranked alternatives and context reasons.

```ts
export type StrategyScoreReason = {
  label: string;
  value: string;
  tone: 'positive' | 'warning' | 'neutral';
};

export type RankedStrategyCard = {
  card: TacticalStrategyCard;
  score: number;
  reasons: StrategyScoreReason[];
};
```

Then update:

```ts
attackScores: RankedStrategyCard[];
defenseScores: RankedStrategyCard[];
contextReasons: StrategyScoreReason[];
```

The UI should show:

- Recommended attack.
- Recommended defense.
- Why this plan fits.
- One safe alternative.
- One aggressive alternative.

This is more useful than only showing the top plan.

## 11. Strategy Context Mapping

### Match State

Balanced:

- Rewards flexible plans.
- Keeps current formation matchup important.
- Good default.

Protect lead:

- Rewards compact defensive shapes, lower-risk attacking outlets, rest-defense, and direct counters.
- Penalizes risky fullback overloads, high press, and central over-commitment.

Chasing goal:

- Rewards final-third chance creation, counter-pressing, set-piece pressure, overloads, and aggressive width.
- Penalizes passive low blocks unless team condition is tired or opponent is much stronger.

### Match Phase

First half:

- Balanced and exploratory.
- Lower urgency.

Second half:

- Normal tactical commitment.
- Context from match state becomes more important.

Last 15:

- Strongly affects risk.
- Protect lead should favor compactness and clear outlets.
- Chasing goal should favor territory, second balls, set pieces, and sustained pressure.

### Team Condition

Fresh:

- Can support high press, counter-press, fast transitions, overlapping runs, and aggressive compactness.

Normal:

- No major bias.

Tired:

- Penalize high press, man-to-man, repeated fullback overlap, and constant counter-pressing.
- Favor half press, compact blocks, direct outlets, and set pieces.

### Opponent Behavior

High press:

- Favor press-resistant build, long ball counter, third-man combinations, and direct outlet plans.
- Defensive plan should prepare rest-defense after bypassing pressure.

Low block:

- Favor cutbacks, blind-side runners, half-space overloads, set-piece pressure, and possession game.
- Avoid hopeful crossing as the only answer.

Wide overload:

- Favor anti-overload slide, back-five shift, wide trap, and out-wide counters into vacated space.

Direct play:

- Favor rest-defense, zonal block, back-five shift, second-ball coverage, and compact midfield.

Strong midfield:

- Favor out-wide, overload-to-isolate, long-ball counter, front-two screen, and half press.

Balanced:

- Let formation matchup dominate.

### Risk Level

Safe:

- Favor compactness, rest-defense, low-risk build-up, and clear outlets.

Balanced:

- No major bias.

Aggressive:

- Favor high press, counter press, overloads, high fullbacks, set-piece pressure, and final-third rotations.

## 12. Example Recommendation Behavior

### Scenario A

Our shape: `4-3-3`  
Opponent shape: `3-5-2`  
Match state: Balanced  
Team condition: Normal  
Opponent behavior: Wide overload  
Risk: Balanced

Expected:

- Attack: Out Wide or Overload to Isolate.
- Defense: Anti-Overload Slide or Wide Trap.
- Reason: opponent wingbacks create both a threat and space behind them.

### Scenario B

Our shape: `4-2-3-1`  
Opponent shape: `4-4-2`  
Match state: Protect lead  
Team condition: Tired  
Opponent behavior: Direct play  
Risk: Safe

Expected:

- Attack: Long Ball Counter or Set-Piece Pressure.
- Defense: Compact 4-5-1 Block, Half Press, or Rest-Defense Net.
- Reason: preserve central protection, manage fatigue, and avoid stretched build-up.

### Scenario C

Our shape: `4-3-3`  
Opponent shape: `5-4-1`  
Match state: Chasing goal  
Team condition: Fresh  
Opponent behavior: Low block  
Risk: Aggressive

Expected:

- Attack: Cutback Patterns, Blind-Side Runners, Half-Space Overload, or Set-Piece Pressure.
- Defense: Counter Press or Rest-Defense Net.
- Reason: generate higher-quality entries while protecting against counters.

## 13. UI Plan

Add a compact Strategy Context panel above Matchup Strategy.

Recommended layout:

- Row 1:
  - Match State segmented control
  - Risk Level segmented control

- Row 2:
  - Team Condition segmented control
  - Match Phase segmented control

- Row 3:
  - Opponent Behavior select

The panel should be dense and coach-like. It should not look like a marketing hero or a long form.

Recommended labels:

- Match state
- Team condition
- Opponent behavior
- Risk
- Phase

Recommended helper copy:

> Adjust the match context to tune recommendations.

Avoid long instructional text. The app should feel operational.

## 14. Persistence

Persist the strategy context in local storage using existing storage helpers.

Potential storage key:

```ts
STORAGE_KEYS.strategyContext
```

Validation should be added to `src/persistence/schemas.ts` using zod, matching the enum values above.

Include the context in workspace export and restore if tactics feature state already captures related tactical workspace settings.

## 15. Testing Plan

Add tests to `src/tactics/recommendations.test.ts`.

Required tests:

1. Existing formation-only defaults still pass.
2. Protect lead + tired team reduces high press and favors compact defensive options.
3. Chasing goal + low block favors cutback, blind-side, half-space, or set-piece attacking options.
4. High press opponent favors press-resistant build or direct outlet.
5. Wide overload opponent favors wide defensive plans.
6. Returned recommendations include context reasons.

Add Tactics view test coverage only if UI rendering already has practical test patterns for this panel. Keep UI tests light.

## 16. Implementation Phases

### Phase 1: Core Engine

- Add `StrategyContext` type.
- Add default context.
- Add context scoring.
- Add reason generation.
- Keep current recommendation behavior stable when default context is used.
- Add unit tests.

Success criteria:

- Existing recommendation tests pass.
- New context tests pass.
- Default context does not create surprising changes.

### Phase 2: Strategy Card Mapping

- Add `contextFit` to each attacking and defensive plan.
- Tune scores until recommendations feel coach-realistic.
- Add safe and aggressive alternatives.

Success criteria:

- Each plan has clear tactical conditions where it can win.
- No plan becomes permanently buried.
- High-stress contexts produce sensible recommendations.

### Phase 3: Tactics UI

- Add Strategy Context controls.
- Persist context.
- Show reason chips in the Matchup Strategy panel.
- Show safe and aggressive alternatives.

Success criteria:

- Coaches can change context in under 10 seconds.
- Recommendation visibly updates.
- The explanation is short and actionable.

### Phase 4: Player-Aware Strategy

Use actual squad data.

Potential signals:

- Team speed.
- Stamina/fatigue.
- Defender strength.
- Midfield passing/technical ability.
- Winger 1v1 strength.
- Striker aerial/direct outlet suitability.
- Goalkeeper distribution, if available.

This should be phase 4 because context-aware recommendations are useful even before player-aware scoring exists.

### Phase 5: Training Link

After a strategy is selected, suggest relevant training drills.

Examples:

- High Press -> pressing trap drills, counter-press drills.
- Low Block -> compact defending, clearance and outlet drills.
- Cutback Patterns -> final-third rotation and crossing/cutback drills.
- Press-Resistant Build -> rondos, pivot scan drills, build-up escape drills.

This should connect to the existing Training Planner and drill library, not duplicate training content inside the tactics engine.

## 17. Non-Goals

Do not implement these in the first version:

- AI-generated tactics.
- Video analysis.
- Opponent scouting database.
- Automatic substitution recommendations.
- Full match simulation.
- Player role chemistry model.
- Long tactical essays inside the UI.

Those may come later, but the first version should stay fast, explainable, and testable.

## 18. Risks

1. Too many inputs.
   - Mitigation: keep version 1 to five context fields.

2. Recommendations feel arbitrary.
   - Mitigation: show reason chips and keep the scoring transparent.

3. Strategy cards become hard to tune.
   - Mitigation: use small context arrays and unit tests for important scenarios.

4. UI becomes crowded.
   - Mitigation: compact segmented controls and one select, no long descriptions.

5. Coach overtrusts the recommendation.
   - Mitigation: keep "Apply" as a user action and show alternatives.

## 19. Recommended First Build

The best practical implementation is:

1. Add `StrategyContext`.
2. Add context scoring and reason output.
3. Add `contextFit` to strategy cards.
4. Add Strategy Context controls to the Tactics panel.
5. Show the top recommendation plus one safe alternative and one aggressive alternative.
6. Persist context with the rest of tactics state.
7. Add unit tests for the five most important coaching scenarios.

This keeps the Strategy Engine aligned with coaching standards while staying realistic for Dumala's current local-first architecture.
