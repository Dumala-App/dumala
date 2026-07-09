import type { LibraryArticle } from './types';

export const COACHING_CRAFT_ARTICLES: readonly LibraryArticle[] = [
  {
    id: 'craft-session-design',
    category: 'coaching-craft',
    title: 'Designing a training session that transfers',
    subtitle: 'From arrival activity to final game — structuring practice so it shows up on match day.',
    tags: ['session design', 'practice structure', 'game realism', 'planning'],
    sections: [
      {
        heading: 'One session, one theme',
        paragraphs: [
          `The most common session-planning mistake is coaching everything at once. Effective sessions pick one theme — say, playing through a press, or defending crosses — and let every part of the evening rehearse it at increasing realism. Players should be able to answer "what did we work on tonight?" in one sentence.`
        ]
      },
      {
        heading: 'A reliable arc',
        paragraphs: [
          `A dependable structure moves from simple to game-real: an arrival activity with a ball from the first minute (no queues, no laps), a warm-up that already touches the theme, a practice phase that isolates it (a rondo, a pattern, a small-sided rule game), and a finishing game where the theme must survive real opposition. The proportion matters — the biggest block of time belongs to playing, because football is learned in games.`,
          `Within each part, watch the three killers of learning: lines (players waiting), laps (running without the ball), and lectures (coach talking longer than thirty seconds). A well-designed exercise coaches by its rules — if you must keep explaining, redesign the exercise rather than repeating the speech.`
        ]
      },
      {
        heading: 'Realism and repetition without repetition',
        paragraphs: [
          `Skills transfer when practice looks like the game: direction (two goals, not keep-ball circles forever), opposition (real defenders as soon as possible), and decisions (at least two options, so players choose rather than execute). Vary the surface details — pitch size, numbers, scoring rules — while keeping the theme constant. This "repetition without repetition" builds adaptable skill instead of drill-shaped skill.`
        ],
        bullets: [
          'One theme per session, visible in every exercise',
          'Ball rolling in the first two minutes; biggest time block is the game',
          'No lines, no laps, no lectures',
          'Direction, opposition, and decisions make practice transfer'
        ]
      }
    ],
    keyIdeas: [
      'A session is a story about one theme, told at increasing realism.',
      'Design exercises whose rules do the coaching.',
      'Games are the main course, not the reward for finishing drills.',
      'Vary conditions, keep the theme — adaptable skill beats drill skill.'
    ],
    trainingIdeas: [
      'Audit your last session plan: minutes with ball rolling vs minutes waiting or listening.',
      'Rewrite one favourite drill as a game with a rule that forces the same behaviour.'
    ],
    references: [
      { label: 'England Football Learning', url: 'https://learn.englandfootball.com/' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'craft-small-sided-games',
    category: 'coaching-craft',
    title: 'Small-sided games & the constraints-led approach',
    subtitle: 'Change the rules, change the behaviour — coaching through game design instead of instruction.',
    tags: ['small-sided games', 'constraints', 'game design', 'decision making'],
    sections: [
      {
        heading: 'Why small games work',
        paragraphs: [
          `Cut a 22-player match into 4v4s and every player touches the ball several times more per minute, faces more 1v1s, makes more decisions, and scores more goals. Futsal's outsized role in producing Brazilian and Iberian technicians is no accident: tight spaces at game speed are the densest learning environment football has. For most training objectives below elite level, a well-designed small-sided game outperforms an isolated drill.`
        ]
      },
      {
        heading: 'Constraints: the coach inside the game',
        paragraphs: [
          `The constraints-led approach changes behaviour by changing the game's conditions instead of issuing instructions. Want faster circulation? Two-touch limit. More switches? Score by dribbling through gates on either wing. Quicker counter-pressing? Goals scored within five seconds of a regain count double. Players discover the solution themselves — and self-discovered solutions stick far better than told ones.`,
          `The craft is choosing the lightest constraint that produces the behaviour. Heavy-handed rules (one-touch everywhere, five mandatory passes before shooting) can make the game so artificial that nothing transfers. Adjust one variable at a time — pitch size, player numbers, touch limits, scoring rules, zones — and watch what actually changes.`
        ]
      },
      {
        heading: 'A starter toolkit',
        paragraphs: [
          `Pitch size is the master dial: smaller sharpens touch and pressing, bigger opens passing range and fitness. Overloads (4v3, 6v4) teach attacking decisions with guaranteed success moments; equal numbers teach duels; underloads teach defending and courage. Neutral players ("magic men" who always attack) let weaker groups experience superiority.`
        ],
        bullets: [
          'Touch limits → speed of play',
          'Gate or zone scoring → direction and switches',
          'Time-boxed bonus goals → transitions',
          'Overloads and neutrals → decision quality with success built in'
        ]
      }
    ],
    keyIdeas: [
      'Small-sided games maximise touches, duels, and decisions per minute.',
      'Rules coach better than voices — constrain the game, not the player.',
      'Use the lightest constraint that produces the target behaviour.',
      'Change one variable at a time and observe before adjusting again.'
    ],
    trainingIdeas: [
      'Take your team’s biggest match weakness and design a 5v5 rule that makes solving it the way to win.',
      'Run a futsal block in the off-season and count the touch difference per player.'
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'craft-youth-development-stages',
    category: 'coaching-craft',
    title: 'Youth development: ages, stages & what matters when',
    subtitle: 'Matching coaching priorities to how young players actually grow — and avoiding the classic traps.',
    tags: ['youth development', 'LTPD', 'age-appropriate coaching', 'talent'],
    sections: [
      {
        heading: 'The developmental ladder',
        paragraphs: [
          `Long-term player development models agree on the broad arc. Under about 8, football is organised play: ball mastery, fun, and love of the game are the only serious objectives. From roughly 8 to 12 — the "golden age of learning" — children acquire technique faster than they ever will again; touches, 1v1s, and small games should dominate. Adolescence brings the growth spurt and with it the capacity (and need) for tactical understanding, position-specific work, and physical development. Only in late teens does performance itself become the point.`,
          `Coaching against this ladder wastes it: tactics lectures at under-9 spend the technique window on shape; pure fun at under-16 leaves competitive players unprepared. The question for every age group is "what does this age learn best?" — not "what does the first team do?"`
        ]
      },
      {
        heading: 'The traps',
        paragraphs: [
          `The relative age effect: children born early in the selection year are consistently over-picked because they are temporarily bigger, and late developers — often the more skilful for having survived without physical advantages — are released before they mature. Early specialisation: year-round single-sport training before adolescence raises injury and burnout rates without improving adult outcomes. And results-driven youth coaching: playing the biggest kids long-ball wins under-11 leagues and produces nothing that matters at seventeen.`
        ],
        bullets: [
          'Check birth quarters in your squad — who are you not selecting?',
          'Protect late developers; re-scout the released',
          'Encourage multi-sport childhoods',
          'Judge youth teams on behaviours and development, not tables'
        ]
      },
      {
        heading: 'What development-first looks like',
        paragraphs: [
          `Equal playing time through the younger ages, players rotated through positions (the under-10 striker may be your future centre-back), performance framed as effort and decisions rather than results, and patience with mistakes — a player afraid to lose the ball stops learning to keep it. The clubs that produce players are the ones that keep the most children playing, improving, and in love with the game for the most years.`
        ]
      }
    ],
    keyIdeas: [
      'Ages 8-12 are the technique window — fill them with touches, not tactics.',
      'The relative age effect quietly deletes late-born talent; audit for it.',
      'Rotation through positions builds complete footballers and delays selection errors.',
      'Development-first is a strategy for producing better seniors, not a soft option.'
    ],
    trainingIdeas: [
      'List each player’s birth month and current position history — then plan two rotations for next month.',
      'Set every player one individual development target per term and review it with them.'
    ],
    references: [
      { label: 'FIFA Training Centre — youth development', url: 'https://www.fifatrainingcentre.com/en/' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'craft-matchday-management',
    category: 'coaching-craft',
    title: 'Match-day coaching: talks, touchline & game state',
    subtitle: 'Preparing the team, managing the bench, and making the three or four decisions that actually change a match.',
    tags: ['match day', 'team talk', 'substitutions', 'game management'],
    sections: [
      {
        heading: 'Before: fewer messages, better ones',
        paragraphs: [
          `Players can carry perhaps three team-level ideas into a match; a pre-match talk with ten points delivers none of them. The strong format is short: remind the team of its identity ("what we always do"), give one or two opponent-specific keys, and set the emotional tone deliberately — calm for anxious teams, energising for flat ones. Individual reminders — one job, one sentence, delivered eye-to-eye during the warm-up — land better than anything said to the whole room.`
        ]
      },
      {
        heading: 'During: watch, don’t narrate',
        paragraphs: [
          `A touchline coach shouting every action is a joystick, and joystick-coached players stop scanning and deciding. Elite touchline behaviour is quieter: watch the game's structure (where is the space? which duel is being lost?), save coaching for natural breaks, and speak to players individually at throw-ins and goal kicks. Choose your moments — a team hears its coach's voice in proportion to how rarely it is raised.`,
          `Half-time has a rhythm worth protecting: let players breathe and speak first (they know things you cannot see from the side), then deliver at most two adjustments and reset the emotional level. The best half-time messages are structural ("their left side is open when their fullback presses — attack it") rather than motivational volume.`
        ]
      },
      {
        heading: 'Game state: the third dimension',
        paragraphs: [
          `Winning, drawing, and losing are three different matches. Prepare the team for each in training so match-day changes are recognitions, not surprises: how we close a game out (lower block, corner-flag possession, fresh legs wide), how we chase (higher line, extra attacker, set-piece urgency), and what we never do (panic long balls with fifteen minutes left). Substitutions serve this thinking — plan likely changes before kick-off, use energy subs before players are exhausted rather than after, and treat the bench as tactics, not charity or punishment.`
        ],
        bullets: [
          'Three ideas maximum, pre-match; one job per player',
          'Coach in breaks, not over the ball',
          'Half-time: players first, then two adjustments',
          'Rehearse winning, drawing, and losing modes in training'
        ]
      }
    ],
    keyIdeas: [
      'Message discipline beats message volume at every stage of match day.',
      'Constant touchline instruction trains players not to think.',
      'Half-time is for structure, delivered calmly, after listening.',
      'Game-state behaviour is trainable — closing out and chasing are skills.'
    ],
    trainingIdeas: [
      'End training games with scenario calls: "2-1 up, five minutes left" — and review the decisions made.',
      'Film yourself on the touchline for one match; count instructions per minute.'
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'craft-communication-styles',
    category: 'coaching-craft',
    title: 'Communication & coaching styles',
    subtitle: 'Command, questioning, and guided discovery — matching how you coach to what you want players to learn.',
    tags: ['communication', 'questioning', 'guided discovery', 'feedback'],
    sections: [
      {
        heading: 'The spectrum of styles',
        paragraphs: [
          `Coaching styles run on a spectrum of who solves the problem. Command ("pass now, run there") is fast and clear — right for safety, set-piece jobs, and brand-new content. Question-and-answer ("what did you see when you received?") makes players process their own decisions. Guided discovery designs situations where players find the answer themselves — the coach builds the maze, the players solve it. Trial and error steps back entirely and lets the game teach.`,
          `None is "the" method. The skill is matching style to moment: command for the what, questions for the why, discovery for durable learning. A useful default for development coaching: design first (constraints and games), question second, command sparingly.`
        ]
      },
      {
        heading: 'Questions that actually teach',
        paragraphs: [
          `Weak questions have one right answer the player must guess ("should you have passed?"). Strong questions are open and specific: "What were your options there?", "When did you decide?", "What would make that easier next time?" Give players time to answer — the silence after a good question is where learning happens. And ask at the right moment: immediately for simple observations, at the next break for anything requiring thought.`
        ]
      },
      {
        heading: 'Feedback that builds players',
        paragraphs: [
          `Praise effort, decisions, and behaviours you want repeated — specifically ("great third-man run to arrive there") rather than generically ("well done"). Correct the action, never the person, and watch your ratios: players who mostly hear what they do wrong learn to hide rather than try. The sandwich is less important than sincerity; young players detect performative praise instantly. Finally, learn each player individually — one needs challenge, another needs safety, and the same sentence lands differently on each.`
        ],
        bullets: [
          'Command the what; question the why; design for discovery',
          'Open questions, then genuine silence',
          'Specific praise for repeatable behaviours',
          'Correct actions, protect the person'
        ]
      }
    ],
    keyIdeas: [
      'Vary coaching style by objective — no single style teaches everything.',
      'Self-discovered solutions outlast instructed ones.',
      'Question quality determines whether players think or guess.',
      'Feedback shapes what players dare to attempt.'
    ],
    trainingIdeas: [
      'Pick one exercise per session where you only ask questions — no instructions allowed.',
      'Track your feedback for one session: count specific vs generic, corrective vs reinforcing.'
    ],
    references: [
      { label: 'England Football Learning — coaching resources', url: 'https://learn.englandfootball.com/' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  }
];
