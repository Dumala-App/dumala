import type { LibraryArticle } from './types';

export const CLUB_DNA_ARTICLES: readonly LibraryArticle[] = [
  {
    id: 'club-ajax-academy-blueprint',
    category: 'club-dna',
    title: 'Ajax & the academy blueprint',
    subtitle: 'How one club turned youth development into a system the whole football world copied.',
    era: '1960s-present',
    origin: 'AFC Ajax, Netherlands',
    tags: ['youth development', 'TIPS model', '4-3-3', 'club identity'],
    sections: [
      {
        heading: 'Why Ajax matters',
        paragraphs: [
          `Ajax won three consecutive European Cups (1971-73) with a core raised in its own academy, did it again in 1995 with a team full of twenty-somethings from De Toekomst ("The Future"), and has exported players and methodology to every major league for fifty years. No institution has proven more repeatedly that development can be a competitive strategy, not just a budget necessity.`
        ]
      },
      {
        heading: 'One club, one game model',
        paragraphs: [
          `Every Ajax team, from under-9s to the first team, traditionally plays the same attacking 4-3-3 with the same principles: build from the back, wingers wide, positional rotation, and pressing after loss. A youth player promoted two age groups up already knows the plan. Positions are taught as roles with defined tasks, so development targets are concrete: an Ajax right winger of any age knows the 1v1, the cross, and the pressing angle are their curriculum.`,
          `Selection historically followed the TIPS model — Technique, Insight, Personality, Speed — with insight (reading the game) and personality (character, coachability) weighted as heavily as physical gifts. Smaller late developers who understood the game were kept when other academies released them.`
        ]
      },
      {
        heading: 'Development over results',
        paragraphs: [
          `Ajax youth teams are instructed to win by playing well, not to play for winning. Coaches are evaluated on players produced, not trophies won at under-12 level. Individual technical training, futsal-style small games, and deliberate exposure to older age groups accelerate the best talents. The academy's product is a first-team-ready footballer — and, financially, one of the most reliable revenue engines in the sport.`
        ],
        bullets: [
          'Same formation and principles across every age group',
          'TIPS selection: Technique, Insight, Personality, Speed',
          'Coaches judged on development, not youth trophies',
          'Best talents play up an age group early and often'
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `You can run a one-club model at any scale: agree a simple shared playing idea across your age groups, define what each position must learn, and judge youth matches by performance behaviours rather than the score. The TIPS lens is also a healthier scouting habit — value the small player who always knows where to pass.`
        ]
      }
    ],
    keyIdeas: [
      'A shared game model across age groups compounds development year over year.',
      'Select on technique and game insight, not just size and speed.',
      'Youth results are a by-product; player production is the goal.',
      'Playing up an age group is a development tool for your best learners.'
    ],
    trainingIdeas: [
      'Write a one-page club playing identity and share it with every coach in your program.',
      'Add a weekly futsal or tight-space session — small pitches multiply touches and decisions.'
    ],
    references: [
      { label: 'Ajax Youth Academy', url: 'https://en.wikipedia.org/wiki/Ajax_Youth_Academy' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'club-la-masia-positional-school',
    category: 'club-dna',
    title: 'La Masia & Barcelona’s positional school',
    subtitle: 'The farmhouse where Cruyff’s ideas became a curriculum — and produced the best midfield of all time.',
    era: '1979-present',
    origin: 'FC Barcelona, Spain',
    tags: ['positional play', 'rondos', 'youth development', 'technical curriculum'],
    sections: [
      {
        heading: 'Why La Masia matters',
        paragraphs: [
          `In 2010, all three Ballon d'Or podium places — Messi, Xavi, Iniesta — belonged to graduates of Barcelona's academy, and the 2011 Champions League final team contained seven. La Masia is the strongest evidence in football history that a specific playing style can be taught systematically from childhood.`
        ]
      },
      {
        heading: 'The curriculum: possession as a language',
        paragraphs: [
          `When Cruyff arrived in 1988 he aligned the whole academy behind positional play. The rondo became the daily alphabet: from six-year-olds to the first team, sessions open with keep-ball circles that train first touch, body orientation, passing angles, and instant counter-pressing. Small-sided positional games (4v4+3 and similar) then teach the grammar — third-man combinations, finding the free man, switching to escape pressure.`,
          `Physical size was famously irrelevant: Xavi, Iniesta and Messi were all considered too small by conventional standards. La Masia bet on brain speed — scanning, decision-making, and one-touch control — trusting that intelligence scales to any level of opponent while size stops mattering at the top.`
        ]
      },
      {
        heading: 'Identity as an inheritance',
        paragraphs: [
          `The academy teaches values alongside tactics: humility, team above individual, and respect for the club's way of playing. Graduates describe knowing the first-team's game before ever training with them. That cultural continuity is why Barcelona could lose coaches and players yet keep an unmistakable style for two decades — the identity lives in the pipeline, not in one dressing room.`
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `Rondos and positional games are free and scale to any age: they generate more touches, scans, and decisions per minute than almost any drill. Protect your small, clever players — they are often your future midfield. And write down your team's way of playing so it can outlive any single season or coach.`
        ]
      }
    ],
    keyIdeas: [
      'A playing style can be a curriculum, taught progressively from the youngest ages.',
      'Rondos train touch, angles, scanning, and pressing simultaneously.',
      'Select and develop for game intelligence; size evens out, brains compound.',
      'Cultural values keep a style alive across generations.'
    ],
    trainingIdeas: [
      'Open every session with age-appropriate rondos: 4v1 for beginners, 5v2 with two-touch limits as players grow.',
      'Play 4v4+3: the three neutrals always support the team in possession, teaching overloads and the free man.'
    ],
    references: [
      { label: 'La Masia', url: 'https://en.wikipedia.org/wiki/La_Masia' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'club-italian-defensive-tradition',
    category: 'club-dna',
    title: 'The Italian defensive tradition',
    subtitle: 'From catenaccio and the libero to Sacchi’s zonal revolution — why Italy taught the world to defend.',
    era: '1947-present',
    origin: 'Italy',
    tags: ['catenaccio', 'zonal marking', 'defensive culture', 'compactness'],
    sections: [
      {
        heading: 'Catenaccio: the door-bolt',
        paragraphs: [
          `Catenaccio ("door-bolt") reached its peak with Helenio Herrera's Grande Inter of the 1960s: strict man-marking across the defence with a libero — a free defender like Armando Picchi, later perfected by Franco Baresi and Gaetano Scirea — sweeping behind the markers. Add lightning counter-attacks through Giacinto Facchetti, arguably the first great attacking fullback, and Inter won back-to-back European Cups (1964, 1965) conceding almost nothing.`,
          `The system's logic was risk elimination: every attacker accounted for, plus one spare. Its cost was passivity — man-markers follow opponents anywhere, so clever movement could drag the whole defence out of shape, and the team surrendered the initiative.`
        ]
      },
      {
        heading: 'The zonal revolution',
        paragraphs: [
          `Sacchi's Milan (1987-91) overthrew the tradition from inside: no libero, a flat back four defending space rather than men, ferocious compactness and an offside trap. Italy absorbed the revolution without losing its soul — defending remained the national art form, but it became collective and positional. The 2006 World Cup winners conceded two goals in seven matches; Cannavaro won the Ballon d'Or as a centre-back.`
        ]
      },
      {
        heading: 'What the tradition actually teaches',
        paragraphs: [
          `Italian defending is a body of craft knowledge more than a formation: the art of delaying an attacker instead of diving in, showing play towards the touchline, defending the box with body position and anticipation, communication as constant narration, and the mentality that a clean sheet is a masterpiece. Paolo Maldini's line summarises it: "If I have to make a tackle, I have already made a mistake" — positioning first, always.`
        ],
        bullets: [
          'Delay, steer, and screen before tackling',
          'Defend the middle; invite play wide',
          'The back line talks constantly and moves as one',
          'Defending is a craft to be proud of, not a punishment'
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `Teach individual defending as technique — approach angle, slowing down before contact, body shape steering the attacker — with the same patience you teach shooting. Most youth teams never train it explicitly; the ones that do concede visibly fewer goals within weeks.`
        ]
      }
    ],
    keyIdeas: [
      'Great defending evolved from marking men (catenaccio) to controlling space (zonal) — know both logics.',
      'Positioning beats tackling: the best defensive action is the one made unnecessary.',
      'Steer attackers to harmless zones instead of chasing the ball.',
      'A defensive culture is built by valuing clean sheets and defensive craft openly.'
    ],
    trainingIdeas: [
      'Run 1v1 defending clinics: approach at speed, decelerate, angle the body, force the weak foot.',
      'Play 2v2 with a covering third defender to teach pressure-and-cover conversations.'
    ],
    references: [
      { label: 'Catenaccio', url: 'https://en.wikipedia.org/wiki/Catenaccio' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'club-spain-tiki-taka-era',
    category: 'club-dna',
    title: 'Spain 2008-2012: possession as defence',
    subtitle: 'Three straight major titles won by a midfield that treated the ball as the best defender.',
    era: '2008-2012',
    origin: 'Spain national team',
    tags: ['tiki-taka', 'midfield control', 'false nine', 'tournament football'],
    sections: [
      {
        heading: 'The achievement',
        paragraphs: [
          `Euro 2008, the 2010 World Cup, and Euro 2012 — no national team before or since has won three consecutive major tournaments. Luis Aragonés built it by dropping bigger names for small technicians and trusting the Barcelona-Xavi blueprint at international level; Vicente del Bosque completed it, finishing Euro 2012 with a 4-0 final and, often, no striker at all.`
        ]
      },
      {
        heading: 'The idea: the ball defends you',
        paragraphs: [
          `Spain's radicalism was defensive: if we have the ball, you cannot score. Possession near 70% shortened matches, drained opponents chasing, and kept Spain's own defence untroubled — the 2010 World Cup was won conceding two goals in seven games and winning every knockout match 1-0. Circulation was patient to the point of provocation, waiting for one moment of disorder per half.`,
          `The structure stacked playmakers — Xavi, Iniesta, Xabi Alonso, Busquets, Silva, Fabregas — accepting overlap in profiles because shared understanding mattered more than positional variety. At Euro 2012 del Bosque played Fabregas as a false nine, effectively fielding six midfielders, and won the final by exhaustion of the opponent's shape.`
        ]
      },
      {
        heading: 'The lessons and the limits',
        paragraphs: [
          `Spain proved that a clear collective identity beats a collection of talents, and that tournament football rewards control and low variance. The era also showed the model's edge cases: against ultra-deep blocks, possession without penetration can stall (Spain's 2014 collapse came when opponents stopped pressing and Spain's circulation lost its purpose). Possession is a means; the intention to hurt must survive inside it.`
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `The transferable core is composure under pressure: teams that can keep the ball for ten calm passes control matches emotionally at any level. Train escape-from-pressure possession and teach players that a sideways pass that keeps the ball is braver than a hopeful long ball that loses it — then add the forward intention so patience never becomes passivity.`
        ]
      }
    ],
    keyIdeas: [
      'Sustained possession is a defensive weapon: opponents cannot score without the ball.',
      'A shared idea can beat superior individual talent — selection should serve the model.',
      'Patience needs a purpose: circulate to disorganise, then penetrate immediately.',
      'Low-variance control football is especially powerful in knockout formats.'
    ],
    trainingIdeas: [
      'Set a "ten calm passes" target after every regain in training games before the team may accelerate.',
      'Play possession games where a goal only counts after a line-breaking pass, keeping penetration inside patience.'
    ],
    references: [
      { label: 'Tiki-taka', url: 'https://en.wikipedia.org/wiki/Tiki-taka' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'club-germany-2014-rebuild',
    category: 'club-dna',
    title: 'Germany 2014: a nation rebuilds its football',
    subtitle: 'How a federation-wide reform turned humiliation in 2000 into a World Cup fourteen years later.',
    era: '2000-2014',
    origin: 'German FA (DFB), Germany national team',
    tags: ['federation reform', 'talent development', 'transition play', 'long-term planning'],
    sections: [
      {
        heading: 'Rock bottom and the response',
        paragraphs: [
          `Germany exited Euro 2000 in the group stage without winning a match, exposing an aging, technically limited player pool. The DFB's answer was structural, not cosmetic: every Bundesliga and second-division club was required to run a certified academy; some 366 regional talent bases with licensed coaches were created so every talented child in the country trained weekly with qualified instruction; and coach education was overhauled to prioritise technique and game intelligence over physicality.`
        ]
      },
      {
        heading: 'A new player, a new style',
        paragraphs: [
          `Within a decade the pipeline delivered a different footballer — Özil, Müller, Kroos, Götze, Hummels: technical, tactically versatile, comfortable in possession. The national team's style evolved with them, blending German transition power with possession structure. The 2014 World Cup victory — including the 7-1 semi-final dismantling of Brazil, the most extreme display of coordinated counter-attacking in tournament history — was explicitly harvested from the 2000 reforms.`,
          `The 7-1 itself is a masterclass worth studying: Germany scored five goals in eighteen first-half minutes not through individual brilliance but through repeated identical mechanisms — win the ball in midfield, play forward within two passes, and flood the box with three runners while Brazil's shape was still turned.`
        ]
      },
      {
        heading: 'The system behind the success',
        paragraphs: [
          `Key ingredients: patience measured in decades, universal access (talent bases meant no child depended on being spotted by a big club), coach quality pushed down to the youngest levels, and alignment between clubs and federation on what a modern player must be able to do. It is the strongest national-scale proof that player production responds to deliberate design.`
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `Two lessons scale down. First, coach education is the highest-leverage investment any club can make — a better-trained coach improves every player they touch for years. Second, transition moments decide matches at every level: train the two-pass counter and defensive reactions to turnovers deliberately, the way Germany 2014 clearly had.`
        ]
      }
    ],
    keyIdeas: [
      'Player production is a design problem: facilities, coach education, and access produce talent at scale.',
      'Reforms take a decade — judge development projects on long horizons.',
      'Elite transition play is a rehearsed pattern: regain, two forward passes, runners in the box.',
      'Investing in coaches multiplies faster than investing in any single player.'
    ],
    trainingIdeas: [
      'Script transition waves: defend a cross, win the ball, and score at the far end within ten seconds.',
      'Send every volunteer coach in your club to at least one licensed course per season.'
    ],
    references: [
      { label: 'German football reforms after Euro 2000', url: 'https://en.wikipedia.org/wiki/Germany_national_football_team' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'club-english-game-evolution',
    category: 'club-dna',
    title: 'England’s evolution: from long ball to pressing laboratory',
    subtitle: 'How the birthplace of 4-4-2 and direct play became the world’s most tactically diverse league.',
    era: '1950s-present',
    origin: 'English football',
    tags: ['direct play', '4-4-2', 'pressing era', 'tactical history'],
    sections: [
      {
        heading: 'The direct tradition',
        paragraphs: [
          `English football's classical identity was built on tempo and territory: two banks of four, wingers crossing early, a target striker, and second balls attacked ferociously. In the 1980s FA analyst Charles Hughes formalised it as POMO — "positions of maximum opportunity" — arguing statistically that most goals came from moves of three passes or fewer, and institutionalising long, direct play through coach education.`,
          `The tradition was not naive: Alf Ramsey's 1966 "wingless wonders" World Cup winners were a tactical innovation, and the era's best direct teams (Clough's Forest aside, who passed) were superbly organised. But by the 1990s the diet of pace and duels had left English teams technically behind Europe.`
        ]
      },
      {
        heading: 'The foreign revolution',
        paragraphs: [
          `The Premier League's wealth imported the world's ideas. Wenger's professionalism and technique-first Arsenal shifted standards in the late 1990s; Mourinho brought Latin game management in 2004; and from 2015-16 the arrival of Guardiola, Klopp, Conte, and Pochettino turned England into a laboratory where positional play, gegenpressing, back-three systems and man-marking presses collided weekly. The pressing derby between Guardiola's City and Klopp's Liverpool produced two of the highest points totals in league history and dragged the entire division's tactical level upward.`
        ]
      },
      {
        heading: 'Synthesis, not replacement',
        paragraphs: [
          `Modern English football did not abandon its DNA — it fused it with the imports. Today's Premier League style is distinct: positional structures executed at traditional English tempo, with throw-ins, set pieces, and second balls treated as seriously as build-up patterns. The lesson of the league's evolution is that tactical cultures grow by absorbing rivals' strengths without surrendering their own.`
        ],
        bullets: [
          'Direct play is a legitimate, coachable strategy — not a failure of ideas',
          'Imported methods raised technical standards without killing native intensity',
          'Set pieces and restarts are undervalued scoring channels at most levels',
          'Tactical cultures advance by synthesis'
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `Respect the direct tradition where it fits your players: a well-drilled 4-4-2 with early service and second-ball hunger wins many grassroots leagues. But steal from the synthesis era — add one pressing trigger, one build-up pattern, one rehearsed set piece per season, and your traditional base becomes a modern team.`
        ]
      }
    ],
    keyIdeas: [
      'Direct play and possession play are both valid strategies — squads and conditions should decide.',
      'Second balls and set pieces decide more grassroots matches than build-up quality.',
      'Import ideas incrementally onto a base your players already master.',
      'Tempo is a tactical weapon in its own right.'
    ],
    trainingIdeas: [
      'Dedicate ten minutes weekly to attacking and defending set pieces — the cheapest goals in football.',
      'Play "second ball" games: every long ball contest is followed by a 3-second race to the loose ball, with points for winning it.'
    ],
    references: [
      { label: 'History of English football tactics', url: 'https://en.wikipedia.org/wiki/Formation_(association_football)' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  }
];
