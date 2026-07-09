import type { LibraryArticle } from './types';

export const PRINCIPLE_ARTICLES: readonly LibraryArticle[] = [
  {
    id: 'principle-four-moments',
    category: 'principles',
    title: 'The four moments of the game',
    subtitle: 'The framework behind every modern game model: possession, defence, and the two transitions.',
    tags: ['game model', 'transitions', 'phases of play', 'coaching framework'],
    sections: [
      {
        heading: 'The framework',
        paragraphs: [
          `Modern coaching education divides football into four continuous moments: in possession, out of possession, attacking transition (the seconds after winning the ball), and defensive transition (the seconds after losing it). Set pieces are often treated as a fifth. The insight is that a team is always in exactly one of these moments — and each demands different behaviours from the same eleven players.`,
          `The framework's power is diagnostic. "We defended badly" is vague; "we conceded twice in defensive transition" tells you precisely what to train. Most youth teams practise possession endlessly, defence occasionally, and the transitions — where a huge share of goals are scored and conceded — almost never.`
        ]
      },
      {
        heading: 'The two forgotten moments',
        paragraphs: [
          `Transitions decide modern matches because they are when teams are least organised. At the instant of a turnover, players are positioned for the previous moment: attackers are high and wide when the ball is lost, defenders flat and deep when it is won. Whoever reacts faster — with pre-agreed behaviours, not improvisation — gets a structural advantage several times per half.`,
          `A complete game model answers four questions: How do we attack? How do we press or defend? What do we do in the first five seconds after winning the ball? And after losing it? Even a one-sentence answer to each transforms a team's coherence.`
        ]
      },
      {
        heading: 'Building your own game model',
        paragraphs: [
          `Write one principle per moment, in your players' language. For example: in possession, build through the thirds with width; out of possession, compact mid-block, press on the trigger; won it, first look forward for three seconds; lost it, nearest three counter-press for five seconds, everyone else recovers goal-side. That single paragraph is a real game model — everything else in this library refines it.`
        ]
      }
    ],
    keyIdeas: [
      'Every second of a match belongs to one of four moments — coach all four.',
      'Transitions are where organisation is weakest and goals are cheapest, in both directions.',
      'Pre-agreed transition behaviours beat improvised reactions.',
      'A game model can be four sentences long and still be complete.'
    ],
    trainingIdeas: [
      'Tag each exercise in your session plan with the moment it trains — the gaps in your programme will surprise you.',
      'Play transition games: 6v6 with a third team waiting; whoever concedes goes off, so every goal creates an instant transition.'
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'principle-pressing-triggers',
    category: 'principles',
    title: 'Pressing: triggers, traps & cover',
    subtitle: 'Organised aggression — when to hunt the ball, how to trap it, and what protects you when the press breaks.',
    tags: ['pressing', 'triggers', 'traps', 'cover and balance'],
    sections: [
      {
        heading: 'Pressing is a decision, not a mood',
        paragraphs: [
          `A press is a coordinated attempt to win the ball, and its first rule is that it must be collective: one player sprinting alone is not pressing, it is chasing — and it opens the pass that beats them. Teams therefore press on triggers: shared, visible cues that tell everyone to go at once.`
        ],
        bullets: [
          'A heavy or backward first touch',
          'A back-pass or sideways pass under pressure (press arrives with the ball)',
          'The ball travelling to a touchline — the line is an extra defender',
          'A receiver facing their own goal',
          'A bouncing or aerial ball that must be controlled'
        ]
      },
      {
        heading: 'Curved runs and the trap',
        paragraphs: [
          `Elite pressing is about taking away choices. The first presser approaches on a curve that shows the ball carrier one direction — usually the touchline — while their cover shadow blocks the pass behind them. Teammates mark the remaining short options man-tight, leaving only the risky ball the press wants to provoke. A pressing trap is this staged: a lane is left deliberately open, and the moment the pass enters it, two players collapse on the receiver.`,
          `Height is a separate decision: the same trigger logic works in a high press (in the opponent's third), a mid-press (halfway), or a low block that only presses the box's approaches. Fatigue, scoreline, and opponent quality should move the height — the triggers stay the same.`
        ]
      },
      {
        heading: 'Cover, balance, and the price of failure',
        paragraphs: [
          `Every press has a shape behind it: pressure (first defender), cover (second, protecting the space behind the press), and balance (the far side tucking in against the switch). When a press is beaten, the immediate rule is drop and delay — the nearest player slows the attack while the block reforms. Teams that only train the hunt and never the recovery concede their worst goals with everyone in the picture.`
        ]
      }
    ],
    keyIdeas: [
      'Press on shared triggers, or not at all — a lone presser is a defender lost.',
      'Curved approach runs steer play; cover shadows erase passing lanes.',
      'Traps invite a specific pass and punish it — leave the lane open on purpose.',
      'Behind every press: pressure, cover, balance — and a rehearsed recovery when it breaks.'
    ],
    trainingIdeas: [
      'Trigger call game: possession play where defenders may only press when the coached trigger occurs.',
      'Touchline trap drill: force play wide, then collapse two players on the receiving fullback.'
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'principle-build-up-play',
    category: 'principles',
    title: 'Build-up play: through, around, or over',
    subtitle: 'Escaping pressure from your own third — the free man, the third man, and the honest long ball.',
    tags: ['build-up', 'free man', 'third man', 'playing out'],
    sections: [
      {
        heading: 'The three routes',
        paragraphs: [
          `Every build-up situation has three answers: play through the press (passes between opponents), around it (via fullbacks and switches), or over it (a targeted long ball). Good teams are fluent in all three — dogma is what gets punished. The choice depends on one scan: how many opponents press, and where is our spare player?`
        ]
      },
      {
        heading: 'The free man and the plus-one rule',
        paragraphs: [
          `Build-up arithmetic is simple: keep one more player in the first line than the opponent presses with. Against one striker, two centre-backs suffice; against two, add the keeper or drop the pivot. The free man this creates must do something with the freedom — step forward with the ball until an opponent commits, because a free man who passes sideways immediately has wasted the advantage.`,
          `The third-man combination is build-up's master pattern: when a marked midfielder cannot receive facing forward, they bounce the ball first-time to a third player arriving on the blind side — the pass no marker can intercept because it goes to someone they cannot see. Almost every clean escape from a press is a third-man pattern in disguise.`
        ]
      },
      {
        heading: 'Over the press, on purpose',
        paragraphs: [
          `Playing over is not a failure of courage — it is the correct answer when the opponent commits numbers high. The difference between a clearance and a build-up long ball is design: a named target, players positioned in advance for the second ball, and a plan for the knockdown. Baiting the press to create that long ball (inviting opponents forward, then striking the space they left) is an advanced but learnable pattern.`
        ],
        bullets: [
          'Plus-one in the first line, always',
          'The free man carries until an opponent commits',
          'Third-man bounces beat man-marking',
          'Long balls need a target and second-ball hunters — then they are tactics, not hope'
        ]
      }
    ],
    keyIdeas: [
      'Through, around, or over — fluency in all three routes beats ideology.',
      'Create plus-one against the press; the free man advances with the ball.',
      'The third-man pattern is the most reliable escape from pressure in football.',
      'A structured long ball with second-ball support is legitimate build-up.'
    ],
    trainingIdeas: [
      'Build-out game: 6v4 in the defensive half — score by dribbling over halfway, forcing the free man to carry.',
      'Third-man pattern: wall passes where the bounce always goes to a third runner arriving beyond the presser.'
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'principle-transitions-rest-defense',
    category: 'principles',
    title: 'Transitions & rest defense',
    subtitle: 'The five seconds that decide matches — counter-press or recover, counter-attack or keep, and the structure you set before the ball is even lost.',
    tags: ['counter-press', 'rest defense', 'counter-attack', 'transitions'],
    sections: [
      {
        heading: 'Losing the ball: the five-second choice',
        paragraphs: [
          `The moment possession is lost, a team has two coherent options: counter-press (the nearest players attack the ball immediately, while opponents are still orienting) or recover (everyone sprints goal-side into the defensive block). Both work; mixing them player-by-player does not. The common rule — press for five seconds, then drop if the ball is not won — gives players a clear, trainable decision.`
        ]
      },
      {
        heading: 'Rest defense: insurance bought in advance',
        paragraphs: [
          `Rest defense is the positioning of the players not involved in your own attack, arranged specifically to kill the opponent's counter before it starts. A standard arrangement keeps a plus-one behind the opponent's forwards (two defenders against one striker, three against two) with a pivot screening the central lane. Guardiola's teams concede famously few counter-attacks not through recovery speed but because the insurance is positioned before every ball into the box.`,
          `The give-away habit to coach out: both fullbacks attacking with no agreement about who stays. A simple rule — one attacks, one tucks in — costs almost nothing in attack and prevents the classic 3v2 against you the other way.`
        ]
      },
      {
        heading: 'Winning the ball: counter or keep',
        paragraphs: [
          `Attacking transition has the same two-option clarity. Counter when the regain is high or opponents are committed: first pass forward within two touches, runners break beyond the ball, finish the move within seconds. Keep when the regain is deep and opponents are set: one safe pass out of the pressure zone to reorganise. The worst outcome is the slow counter — too hesitant to hurt, too open to be safe. Coach the first pass after the regain as a deliberate skill; it decides which world you are in.`
        ],
        bullets: [
          'Lost it: counter-press five seconds or recover goal-side — one team-wide rule',
          'Rest defense: plus-one behind their forwards, pivot screens the centre',
          'Won it high: forward within two touches, runners commit',
          'Won it deep: one safe pass, then reorganise'
        ]
      }
    ],
    keyIdeas: [
      'Transitions reward pre-agreed rules because there is no time to think.',
      'Rest defense is set before the ball is lost — it is attacking-phase positioning.',
      'Keep plus-one behind the opponent’s forwards on every attack.',
      'The first pass after a regain determines counter or keep — train it explicitly.'
    ],
    trainingIdeas: [
      'Wave game: attack 8v6, and the instant the ball is lost the attacking team must prevent the counter reaching halfway.',
      'First-pass drill: every regain in small games must go forward if a forward option exists — call it, reward it.'
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'principle-defensive-blocks',
    category: 'principles',
    title: 'Defensive blocks: high, mid & low',
    subtitle: 'Compactness, line height, and shifting as one — the collective defending toolkit.',
    tags: ['low block', 'mid block', 'compactness', 'defensive shape'],
    sections: [
      {
        heading: 'What a block is',
        paragraphs: [
          `A defensive block is the team's organised shape behind the ball, defined by two measurements: height (where the last line stands) and compactness (the distances inside the shape, vertically between lines and horizontally across it). Sacchi's 25-metre ideal remains the reference: whatever the height, the block itself stays short and narrow, forcing play around it rather than through it.`
        ]
      },
      {
        heading: 'Choosing the height',
        paragraphs: [
          `A high block wins the ball near the opponent's goal and keeps your team in their half, but sells space behind the defence — it needs pace at the back, a sweeping keeper, and sustained fitness. A mid block is the balanced default: deny the centre, invite play wide, and counter into the space the opponent's fullbacks leave. A low block protects the box outright, concedes territory and shots from distance by design, and demands concentration plus a rehearsed counter or the pressure never ends.`,
          `Height should move within a match: protect a lead lower, chase a goal higher, drop a line when legs go. Teams that can occupy all three heights — and shift between them on a call from the pitch — are genuinely hard to plan against.`
        ]
      },
      {
        heading: 'The mechanics of shifting',
        paragraphs: [
          `Inside any block the same mechanics repeat. The unit shifts toward the ball side, leaving the far winger deliberately free — the switch pass takes seconds, and the block slides across while it travels. Lines move together: step up when the ball goes backwards, drop when an opponent faces forward with time. And every player defends on the diagonal — close enough to their zone's opponent to press, deep enough to cover the teammate inside them. Communication is the glue; the back line narrates constantly ("step", "drop", "runner") because they see everything.`
        ],
        bullets: [
          'Compact first: ~25m between first and last line, whatever the height',
          'Overshift to the ball side; trust the slide against the switch',
          'Step up on back-passes, drop on a forward-facing carrier',
          'The back line talks the block through the match'
        ]
      }
    ],
    keyIdeas: [
      'Block quality is measured in distances, not effort — compactness is coachable.',
      'High, mid, and low blocks are tools; the scoreline and squad choose between them.',
      'Shift as a unit and concede the switch — the ball is slower than the slide.',
      'A low block without a counter-attack plan is just delayed defeat.'
    ],
    trainingIdeas: [
      'Distance game: play 10v10 and freeze play randomly — measure the front-to-back distance of the defending team.',
      'Height calls: rotate "high / mid / low" calls during a game and have the block re-set within ten seconds.'
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'principle-final-third-creation',
    category: 'principles',
    title: 'Creating chances in the final third',
    subtitle: 'Cutbacks, overloads, blind-side runs, and set pieces — where goals actually come from.',
    tags: ['chance creation', 'cutbacks', 'overloads', 'set pieces'],
    sections: [
      {
        heading: 'Chance quality beats chance quantity',
        paragraphs: [
          `Analytics confirmed what good strikers always knew: where you shoot from matters more than how often. Central shots inside the box are worth many times a hopeful effort from distance. Final-third coaching is therefore about engineering arrival into the golden zone — the width of the six-yard box, extended to the penalty spot — with control of the ball and a defender out of position.`
        ]
      },
      {
        heading: 'The high-value patterns',
        paragraphs: [
          `The cutback is the modern game's signature chance: reach the byline (usually via an overlap or a through-ball into the channel) and pull the ball backwards to a runner arriving at the penalty spot. Defenders retreating toward their own goal cannot see the runner and cannot clear without risk. Elite teams rehearse it as openly as a set piece.`,
          `Two more patterns complete the toolkit. Overload to isolate: crowd one flank until the defence tilts, then switch fast to the far winger 1v1 with the goal of attacking the box before help arrives. And the blind-side run: attackers time runs from behind a defender's field of vision — the marker who checks the ball for one second loses their runner. Against packed low blocks, add second-ball pressure: shots and crosses that are half-cleared fall to midfielders stationed at the edge of the box on purpose.`
        ]
      },
      {
        heading: 'Set pieces: the cheapest goals in football',
        paragraphs: [
          `Roughly a quarter to a third of goals at most levels come from set pieces, yet they receive a fraction of training time. A team needs only a small menu executed well: one near-post corner and one far-post variation, one free-kick delivery zone, a long-throw plan if the thrower exists, and clear marking jobs at the defensive end. At grassroots level, where defending restarts is weakest, set-piece diligence is the single fastest way to add goals to a season.`
        ],
        bullets: [
          'Cutbacks to the penalty spot beat crosses to the head',
          'Overload one side to isolate the other',
          'Blind-side runs attack what the defender cannot see',
          'Rehearse a small set-piece menu until it is automatic'
        ]
      }
    ],
    keyIdeas: [
      'Engineer central, in-box arrivals — shot location outranks shot volume.',
      'The cutback is a rehearsable pattern, not a moment of inspiration.',
      'Overloads exist to create a far-side 1v1; the switch must be fast.',
      'Set pieces are the highest return on training time in football.'
    ],
    trainingIdeas: [
      'Cutback waves: winger reaches the byline, two runners attack penalty spot and far post — finish first time.',
      'Set-piece Fridays: fifteen minutes weekly on the same four routines until execution is automatic.'
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  }
];
