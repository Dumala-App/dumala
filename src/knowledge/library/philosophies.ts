import type { LibraryArticle } from './types';

export const PHILOSOPHY_ARTICLES: readonly LibraryArticle[] = [
  {
    id: 'philosophy-michels-total-football',
    category: 'philosophy',
    title: 'Rinus Michels & Total Football',
    subtitle: 'The Dutch revolution that made space, not the ball, the central idea of the game.',
    era: '1965-1988',
    origin: 'Ajax, Barcelona, Netherlands',
    tags: ['total football', 'space', 'pressing', 'positional interchange'],
    sections: [
      {
        heading: 'Who he was',
        paragraphs: [
          `Rinus Michels, nicknamed "The General", took over a struggling Ajax side in 1965 and built the team that won the 1971 European Cup and reached the 1974 World Cup final with the Netherlands. FIFA later named him Coach of the Century. His playing squads — led on the pitch by Johan Cruyff — became the reference point for almost every possession-and-pressing idea that followed.`
        ]
      },
      {
        heading: 'The core idea: space',
        paragraphs: [
          `Michels reduced football to a single question: who controls space? In possession, his teams made the pitch as big as possible — wingers hugging the touchline, defenders spreading wide, midfielders offering depth — so that every player had room and passing angles. Out of possession, the same team made the pitch as small as possible: an aggressive offside trap pushed the back line high, forwards pressed immediately, and the distance between the first and last player shrank to a compact block.`,
          `Positional interchange was the famous symptom, not the point. A fullback could end up at centre forward because the shape mattered more than the shirt number: as long as every zone was occupied, players were free to rotate. That demanded universal footballers — technically able, tactically aware, and fit enough to press for ninety minutes.`
        ]
      },
      {
        heading: 'How his teams played',
        paragraphs: [
          `Ajax and the 1974 Netherlands pressed the ball carrier in packs seconds after losing possession, decades before "gegenpressing" was a word. Build-up was patient but always looking forward, and the third man run — a player arriving into space created by two others combining — was a rehearsed habit rather than an accident.`
        ],
        bullets: [
          'Big pitch in possession, small pitch out of possession',
          'High defensive line with a coordinated offside trap',
          'Immediate collective pressing after losing the ball',
          'Position rotation allowed as long as every zone stays occupied'
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `You do not need eleven Cruyffs to use Michels. Teach players to recognise the two states of the game — spread out when we have it, squeeze together when we lose it — and you are teaching Total Football at any age. Rotations can come later; spacing and the instant reaction to losing the ball are trainable from the youngest groups.`
        ]
      }
    ],
    keyIdeas: [
      'Football is a battle for space: stretch the pitch in possession, shrink it out of possession.',
      'Pressing and the offside trap are one mechanism — the line steps up as the ball is pressed.',
      'Rotation is safe when players think in zones, not positions.',
      'Universal, intelligent players are the product of training design, not luck.'
    ],
    trainingIdeas: [
      'Play possession games where the team in possession must use the full grid and the defending team must stay within two connected zones.',
      'Freeze small-sided games at the moment of turnover and ask: who presses, who covers, who drops?'
    ],
    references: [
      { label: 'Rinus Michels — profile', url: 'https://en.wikipedia.org/wiki/Rinus_Michels' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'philosophy-cruyff-positional-play',
    category: 'philosophy',
    title: 'Johan Cruyff & the birth of positional play',
    subtitle: 'The Dream Team architect who turned Total Football into a teachable system and a club identity.',
    era: '1988-1996',
    origin: 'Barcelona, Ajax',
    tags: ['positional play', 'build-up', '3-4-3 diamond', 'youth development'],
    sections: [
      {
        heading: 'Who he was',
        paragraphs: [
          `Johan Cruyff played the Total Football of Michels, then coached it into a method. His Barcelona "Dream Team" won four consecutive La Liga titles (1991-94) and the club's first European Cup in 1992. More importantly, he rewired the whole club: the same playing model was installed from the first team down to the academy, which is why La Masia later produced Xavi, Iniesta, Busquets and Messi ready-made for one way of playing.`
        ]
      },
      {
        heading: 'The core idea: superiority through position',
        paragraphs: [
          `Cruyff wanted a free man behind every line of opponent pressure. His teams built with three at the back against two strikers, or four against three — always one more than the opponent's first line, so someone could step forward with the ball unopposed. From there, the ball moved to attract opponents, then escaped to the side they had left. "Playing football is very simple," he said, "but playing simple football is the hardest thing there is."`,
          `His famous 3-4-3 diamond packed the centre with a pivot and a number 10 while wingers stayed extremely wide. Defenders had to be footballers first; the goalkeeper was the eleventh outfield player. Risk near his own box was accepted as the price of control everywhere else.`
        ]
      },
      {
        heading: 'Rondos and the training ground',
        paragraphs: [
          `Cruyff made the rondo — a keep-ball circle with outnumbered defenders in the middle — the signature exercise of Barcelona. It compresses his whole game into one drill: passing angles, body shape, one-touch decisions, and pressing when the ball is lost. He judged players less on tricks than on the speed and cleanliness of their decisions.`
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `Adopt his build-up arithmetic: always create plus-one against the press, even if that means the keeper joins the back line. And copy the club logic, not just the tactics — if all your age groups share one playing idea and one vocabulary, every season starts further ahead.`
        ]
      }
    ],
    keyIdeas: [
      'Build with one player more than the opponent presses with — the free man carries the ball forward.',
      'Width and a packed centre coexist: wingers stretch, midfield diamond controls.',
      'The goalkeeper is part of possession.',
      'A shared playing model across all teams multiplies development.'
    ],
    trainingIdeas: [
      'Make rondos a daily habit: 4v2 for younger players, 6v3 with position-specific roles for older ones.',
      'Play build-up games where the attacking team scores extra for reaching midfield through the free man.'
    ],
    references: [
      { label: 'Johan Cruyff — profile', url: 'https://en.wikipedia.org/wiki/Johan_Cruyff' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'philosophy-sacchi-pressing-machine',
    category: 'philosophy',
    title: 'Arrigo Sacchi & the compact 4-4-2',
    subtitle: 'The Milan coach who proved defending is a collective, zonal, proactive act.',
    era: '1987-1991',
    origin: 'AC Milan, Italy',
    tags: ['zonal defending', 'compactness', 'pressing', '4-4-2'],
    sections: [
      {
        heading: 'Who he was',
        paragraphs: [
          `Arrigo Sacchi never played professionally — "you don't have to have been a horse to be a jockey," he answered his critics — yet his AC Milan of 1987-1991 won Serie A and back-to-back European Cups (1989, 1990) and is still cited as one of the greatest club sides ever. He broke with Italy's man-marking, libero-based tradition and replaced it with a zonal, aggressively compact 4-4-2.`
        ]
      },
      {
        heading: 'The core idea: four reference points',
        paragraphs: [
          `Sacchi told his players that every decision on the pitch depends on four references: the ball, the space, the opponents, and the teammates. Man-markers follow one reference (an opponent); Sacchi's defenders read all four and defended space collectively. The unit moved as one — when the ball travelled, all eleven players adjusted.`,
          `Compactness was measurable: he wanted no more than roughly 25 metres between his last defender and first forward. Inside that block, opponents had no room to combine; outside it, the offside trap and the goalkeeper's high starting position handled the space in behind.`
        ]
      },
      {
        heading: 'Pressing as attacking',
        paragraphs: [
          `For Sacchi, defending was the first act of attacking: win the ball high and the goal is close. His famous shadow-play sessions — eleven players moving against no opposition, reacting to an imaginary ball — built the synchronised movement his block required. "Football is born in the brain, not in the body," he insisted.`
        ],
        bullets: [
          'Defend zones and the ball, not individual opponents',
          'Keep the team inside ~25 metres, front line to back line',
          'Step up together when the ball goes backwards',
          'Press with the whole unit or not at all'
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `The 25-metre rule is the most transferable idea in coaching: it gives players a concrete picture of compactness. Walk-through (shadow) sessions cost nothing and teach unit movement faster than any lecture. And 4-4-2 remains the easiest shape in which to teach zonal defending, because every player has one obvious neighbour on each side.`
        ]
      }
    ],
    keyIdeas: [
      'Every decision reads four references: ball, space, opponents, teammates.',
      'Compactness (about 25 metres between lines) is the foundation of collective defending.',
      'The block moves with the ball — eleven players shift together.',
      'Winning the ball high is the fastest route to a chance.'
    ],
    trainingIdeas: [
      'Run shadow-play: the team moves through its defensive shape reacting to a coach-called ball position.',
      'In 8v8 games, award a bonus goal for regains made in the attacking half.'
    ],
    references: [
      { label: 'Arrigo Sacchi — profile', url: 'https://en.wikipedia.org/wiki/Arrigo_Sacchi' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'philosophy-ferguson-management',
    category: 'philosophy',
    title: 'Sir Alex Ferguson: tempo, wings & squad power',
    subtitle: 'Twenty-six years of reinvention built on standards, wide attacks, and relentless late pressure.',
    era: '1986-2013',
    origin: 'Manchester United, Aberdeen',
    tags: ['man-management', 'wing play', 'tempo', 'squad rotation'],
    sections: [
      {
        heading: 'Who he was',
        paragraphs: [
          `Alex Ferguson broke the Old Firm's grip on Scottish football with Aberdeen — beating Real Madrid to win the 1983 Cup Winners' Cup — then rebuilt Manchester United into the dominant force of the Premier League era: 13 league titles, two Champions Leagues, and the 1999 treble. No modern coach lasted longer at the top, and none rebuilt winning teams so many times.`
        ]
      },
      {
        heading: 'The core idea: the club above everyone',
        paragraphs: [
          `Ferguson's system was less a formation than a set of standards. Training intensity never dropped; no player, however famous, was allowed to become bigger than the club, and stars who threatened the dressing room were sold at their peak. He controlled the environment first and trusted football decisions to flow from it.`,
          `Tactically his teams shared constants across eras: genuine wingers attacking fullbacks on both sides, a high tempo that opponents could not sustain, quick forward passing after regains, and wave after wave of pressure late in matches — the phenomenon opponents called "Fergie time" was really conditioning, squad depth, and belief.`
        ]
      },
      {
        heading: 'Youth and rotation',
        paragraphs: [
          `The "Class of '92" (Giggs, Scholes, Beckham, the Nevilles, Butt) proved his conviction that a spine raised in the club's values outperforms one bought each summer. Later, he pioneered systematic rotation — using the full squad across competitions so his teams finished seasons faster than rivals.`
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `Ferguson is the reference for everything that surrounds tactics: consistent standards, honest and individual man-management, and the courage to refresh a winning team before it declines. For match habits, borrow his endgame: prepare set plays and attacking substitutions for the last fifteen minutes, when tired opponents make their worst decisions.`
        ]
      }
    ],
    keyIdeas: [
      'Standards and the dressing room come before tactics.',
      'Width and tempo stress opponents for the full match; fitness turns the last 15 minutes into a weapon.',
      'Develop a homegrown spine that carries the team culture.',
      'Rebuild proactively — refresh the team while it is still winning.'
    ],
    trainingIdeas: [
      'Condition games so goals scored in the final five minutes count double, training composure and urgency together.',
      'Rotate captains and roles in training matches to grow leadership depth.'
    ],
    references: [
      { label: 'Alex Ferguson — profile', url: 'https://en.wikipedia.org/wiki/Alex_Ferguson' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'philosophy-wenger-technical-expression',
    category: 'philosophy',
    title: 'Arsène Wenger: technique, freedom & development',
    subtitle: 'The professor who modernised preparation and trusted players to solve the game themselves.',
    era: '1996-2018',
    origin: 'Arsenal, Monaco',
    tags: ['technical development', 'attacking fluency', 'player autonomy', 'professionalism'],
    sections: [
      {
        heading: 'Who he was',
        paragraphs: [
          `Arsène Wenger arrived at Arsenal in 1996 as an unknown and left twenty-two years later having changed English football's diet, training science, and scouting horizons. His 2003-04 "Invincibles" went an entire league season unbeaten — 49 straight matches in all — playing some of the most fluent attacking football the Premier League has seen.`
        ]
      },
      {
        heading: 'The core idea: the player solves the game',
        paragraphs: [
          `Wenger built structured defence but deliberately under-coached attack. He recruited and developed technically gifted players, gave them principles — pass forward early, combine in tight spaces, arrive in the box in numbers — and refused to script their final-third decisions. He believed over-instruction produces obedient players and dull football; his job was to remove fear.`,
          `Off the pitch he was a moderniser: nutrition plans, stretching routines, data on training loads, and global scouting that found Henry, Vieira, and Fabregas before the market priced them. Preparation was scientific so that play could be free.`
        ]
      },
      {
        heading: 'Development first',
        paragraphs: [
          `Wenger repeatedly promoted teenagers into first-team football and accepted the results cost, especially in the stadium-financing years. His conviction: a player's technique and game intelligence are formed young, so the club that gives minutes earliest wins the development race.`
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `Wenger is the model for development-first coaching. Judge your sessions by touches, combinations, and decisions per player, not by how organised the drill looks. Set principles, then let attackers make their own choices — and treat mistakes in the final third as tuition fees, not offences.`
        ]
      }
    ],
    keyIdeas: [
      'Technical quality and quick combination play are built by repetition and freedom, not scripts.',
      'Structure the defence; liberate the attack.',
      'Professional preparation (diet, recovery, load) is a competitive advantage available to anyone.',
      'Give young players real minutes — development needs risk.'
    ],
    trainingIdeas: [
      'Use small-group combination games (3v3+2, one-touch finishing waves) where players invent the patterns.',
      'Ban yourself from coaching the last third of a possession game — observe decisions, review afterwards.'
    ],
    references: [
      { label: 'Arsène Wenger — profile', url: 'https://en.wikipedia.org/wiki/Ars%C3%A8ne_Wenger' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'philosophy-mourinho-pragmatism',
    category: 'philosophy',
    title: 'José Mourinho: the match plan above the model',
    subtitle: 'Compact defending, lethal transitions, and a different plan for every opponent.',
    era: '2002-present',
    origin: 'Porto, Chelsea, Inter, Real Madrid',
    tags: ['low block', 'transitions', 'game management', 'opponent analysis'],
    sections: [
      {
        heading: 'Who he was',
        paragraphs: [
          `José Mourinho rose through analysis and assistant roles under Bobby Robson and Louis van Gaal, then won the UEFA Cup and a shock Champions League with Porto (2003, 2004), back-to-back Premier League titles with Chelsea, and the 2010 treble with an Inter side that dismantled Guardiola's Barcelona with 25% possession. He is the modern reference for opponent-specific, result-first football.`
        ]
      },
      {
        heading: 'The core idea: play the match, not a style',
        paragraphs: [
          `Where Cruyffians impose one model on every opponent, Mourinho starts from the opponent's strengths and removes them. His teams defend the most valuable spaces — the centre, then the box — with a compact mid or low block, usually behind a double pivot, and concede the areas that don't hurt. "The team that has the ball has fear," he argued: possession exposes you to the counter-attack.`,
          `Transitions are where his teams attack. The moment the ball is won, the first pass goes forward into space behind the opponent's committed fullbacks; two or three runners sprint, and the move ends within seconds. Game state governs everything — a leading Mourinho team lowers the block, kills tempo, and forces the opponent to take risks it then punishes.`
        ]
      },
      {
        heading: 'Psychology as a tool',
        paragraphs: [
          `Mourinho managed pressure as deliberately as space: drawing media fire onto himself, building siege mentalities, and giving players simple, concrete jobs so that big matches felt smaller. His match preparation — opponent videos cut per player, rehearsed scenarios for every scoreline — set standards now common across the professional game.`
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `When your team is outmatched, Mourinho is the playbook: protect the centre, stay compact, and rehearse the counter — first pass forward, runners committed, finish fast. Teach players what to do at each scoreline. A team that knows how to defend a 1-0 wins games its talent shouldn't.`
        ]
      }
    ],
    keyIdeas: [
      'Deny the opponent’s best weapon first; your own style comes second.',
      'Defend central space and the box; concede the wings and long shots.',
      'The counter-attack is a rehearsed pattern, not an escape.',
      'Manage game state deliberately — leading, drawing, and chasing are three different sports.'
    ],
    trainingIdeas: [
      'Train 6-second counters: win the ball in a low block, score within three passes.',
      'Play scenario games: "you are 1-0 up with 10 minutes left" — let the team practise closing a match.'
    ],
    references: [
      { label: 'José Mourinho — profile', url: 'https://en.wikipedia.org/wiki/Jos%C3%A9_Mourinho' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'philosophy-guardiola-juego-de-posicion',
    category: 'philosophy',
    title: 'Pep Guardiola: positional play, evolved',
    subtitle: 'From Barcelona’s false nine to City’s box midfield — control of the ball, the space, and the counter.',
    era: '2008-present',
    origin: 'Barcelona, Bayern Munich, Manchester City',
    tags: ['positional play', 'rest defense', 'overloads', 'build-up'],
    sections: [
      {
        heading: 'Who he was',
        paragraphs: [
          `Cruyff's pivot as a player, Guardiola became the most influential coach of his generation: fourteen trophies in four years at Barcelona (including two Champions Leagues), a Bundesliga hat-trick at Bayern, and a Premier League dynasty plus the 2023 treble at Manchester City. Each stop evolved the same idea rather than repeating it.`
        ]
      },
      {
        heading: 'The core idea: order behind the ball',
        paragraphs: [
          `Guardiola's positional play divides the pitch into vertical lanes and demands balanced occupation: never two players in the same lane on the same line, always a spare man in build-up, always the width held by someone. Passing has intent — his teams circulate to pull opponents out of shape, then accelerate into the space that opens. Famous "15 passes" are not for possession's sake; they organise his own team's structure so it is ready to counter-press the instant the ball is lost.`,
          `That is the least understood half of his model: rest defense. Behind every attack, two or three players plus the keeper hold positions specifically to kill counter-attacks. Overlaps are covered before they happen; his teams concede historically few transition chances despite defending huge spaces.`
        ]
      },
      {
        heading: 'Constant reinvention',
        paragraphs: [
          `At Barcelona, the false nine (Messi dropping into midfield) created central superiority. At Bayern he inverted fullbacks into midfield. At City he built 3-2-4-1 "box midfield" structures, used centre-backs as build-up playmakers, and — with Haaland — added a direct penalty-box reference. The principles never changed; the shapes always did, fitted to the squad and the league.`
        ],
        bullets: [
          'Five-lane pitch: occupy width, half-spaces, and centre in balance',
          'Plus-one in build-up; the free man advances',
          'Overload one side to isolate a 1v1 on the other',
          'Rest defense set before the ball enters the box'
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `Start with two rules that transform any team: no two players in the same vertical lane during build-up, and one designated "brake" player who stays behind the ball on every attack. They give you positional play's spacing and its transition security without needing elite technicians.`
        ]
      }
    ],
    keyIdeas: [
      'Possession is a tool for arriving in space and controlling transitions, not an end.',
      'Balanced lane occupation creates the free man and clean angles automatically.',
      'Overload to isolate: crowd one flank, finish on the other.',
      'Rest defense is planned before the attack starts.'
    ],
    trainingIdeas: [
      'Mark five vertical lanes on the pitch and play 9v9 with a max of one player per lane per line.',
      'Positional rondos (4v4+3) where the three neutrals form the spare-man spine.'
    ],
    references: [
      { label: 'Pep Guardiola — profile', url: 'https://en.wikipedia.org/wiki/Pep_Guardiola' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'philosophy-ancelotti-player-first',
    category: 'philosophy',
    title: 'Carlo Ancelotti: the player-first system',
    subtitle: 'Five Champions Leagues built on adapting the structure to the talent — never the reverse.',
    era: '1999-present',
    origin: 'AC Milan, Real Madrid, and Europe’s top five leagues',
    tags: ['flexibility', 'man-management', 'diamond midfield', 'game intelligence'],
    sections: [
      {
        heading: 'Who he was',
        paragraphs: [
          `Carlo Ancelotti is the only coach to win the league title in all five major European leagues and holds a record five Champions League titles as a coach (two with Milan, three with Real Madrid). His durability across cultures and eras comes from a simple stance: the coach adapts to the players he has.`
        ]
      },
      {
        heading: 'The core idea: fit the system to the squad',
        paragraphs: [
          `At Milan, Ancelotti inherited too many elite playmakers to fit a conventional shape — so he invented one, moving Pirlo to deep playmaker in front of the defence and stacking Rui Costa, Seedorf and Kaká in a diamond or "Christmas tree" (4-3-2-1). At Real Madrid he asked Kroos and Modrić to manage tempo while liberating Ronaldo, Bale or Vinícius from defensive scripts. The structure existed to make his best players' strengths repeatable.`,
          `His teams are quietly well-organised — mid-block defending, disciplined pivots, clear rest-defence duties — because that stable base is what buys the stars their freedom. Flexibility is not looseness; it is a deliberately minimal set of rules.`
        ]
      },
      {
        heading: 'Calm as a method',
        paragraphs: [
          `Ancelotti manages dressing rooms of maximum ego with humour, honesty, and low drama. Players repeatedly describe running through walls for him precisely because he treats them as adults. In knockout football, his sides are famous for staying calm in chaos — the 2022 Champions League run was won almost entirely in final-quarter comebacks.`
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `Pick your shape after you look at your squad, not before. If your best player is a passer, build the team to give them the ball; if it is a runner, build space to run into. And remember his man-management rule: players repay trust more reliably than they repay fear.`
        ]
      }
    ],
    keyIdeas: [
      'Choose the system that multiplies your best players; never force players into a preferred model.',
      'A stable, disciplined base earns creative freedom up front.',
      'Calm, adult man-management outlasts confrontation.',
      'Tempo control — knowing when to slow the game — is a skill worth coaching.'
    ],
    trainingIdeas: [
      'Try your team in two different shapes across two friendlies and judge by which makes your key players most influential.',
      'Coach tempo: in possession games, call "calm" and "kill" phases the team must recognise and execute.'
    ],
    references: [
      { label: 'Carlo Ancelotti — profile', url: 'https://en.wikipedia.org/wiki/Carlo_Ancelotti' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'philosophy-klopp-gegenpressing',
    category: 'philosophy',
    title: 'Jürgen Klopp & gegenpressing',
    subtitle: 'Counter-pressing as the best playmaker — and emotion as a tactical resource.',
    era: '2001-2024',
    origin: 'Mainz, Borussia Dortmund, Liverpool',
    tags: ['counter-press', 'transitions', 'intensity', 'emotional leadership'],
    sections: [
      {
        heading: 'Who he was',
        paragraphs: [
          `Jürgen Klopp took Dortmund to back-to-back Bundesliga titles (2011, 2012) against Bayern's spending power, then rebuilt Liverpool into champions of Europe (2019) and England (2020, the club's first league title in thirty years). His "heavy metal football" made counter-pressing the defining tactic of the 2010s.`
        ]
      },
      {
        heading: 'The core idea: the ball is most winnable just after you lose it',
        paragraphs: [
          `Klopp's signature insight: the moment your team loses possession, the opponent is momentarily disorganised — the player who won it has their head down, teammates are still in defensive positions. Attack that moment. His teams swarm the ball within seconds of losing it, cutting passing lanes rather than just chasing, and regain it in positions where the goal is a pass or two away. "No playmaker in the world can be as good as a good counter-pressing situation," he said.`,
          `In settled possession his Liverpool was more structured than the slogan suggests: a 4-3-3 with a hard-working midfield triangle that ceded creative duties to two extraordinarily attacking fullbacks, wide forwards cutting inside, and a front line whose pressing was the first line of defence.`
        ]
      },
      {
        heading: 'Emotion and identity',
        paragraphs: [
          `Klopp coached the crowd as deliberately as the team, and built playing identities players could believe in emotionally — sprinting was an act of loyalty, not a physical requirement. His fist-pumps and touchline energy were tools: teams that feel a shared cause press two yards harder in minute 88.`
        ],
        bullets: [
          'Counter-press within seconds of losing the ball — before the opponent’s first forward pass',
          'Press passing lanes, not just the ball carrier',
          'Fullbacks as primary creators; midfield as the engine room',
          'Identity and emotion sustain physical output'
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `Counter-pressing is one of the most coachable elite tactics because it needs will more than skill. Give players one rule — "sprint towards the ball for five seconds after we lose it" — and a fallback — "if we haven't won it back, drop into shape." Even young teams can execute this, and it doubles as fitness training with purpose.`
        ]
      }
    ],
    keyIdeas: [
      'The turnover moment is the biggest opportunity in football, in both directions.',
      'Pressing is a team sprint with cut passing lanes, not individual chasing.',
      'A clear emotional identity buys physical intensity.',
      'Five seconds of counter-press, then recover shape — the rule scales to any level.'
    ],
    trainingIdeas: [
      'Play 5v5 where a team that regains within 5 seconds of losing the ball earns a bonus point.',
      'Rondo-to-goal: when the middle team wins the ball in a rondo, they break to score on a real goal.'
    ],
    references: [
      { label: 'Jürgen Klopp — profile', url: 'https://en.wikipedia.org/wiki/J%C3%BCrgen_Klopp' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'philosophy-bielsa-verticality',
    category: 'philosophy',
    title: 'Marcelo Bielsa: verticality & the man-press',
    subtitle: 'The obsessive who influenced a generation — all-pitch marking, relentless running, straight-line attacks.',
    era: '1990-present',
    origin: 'Newell’s Old Boys, Athletic Bilbao, Leeds United, Argentina, Chile, Uruguay',
    tags: ['man-marking press', 'verticality', 'work rate', 'preparation'],
    sections: [
      {
        heading: 'Who he was',
        paragraphs: [
          `Marcelo Bielsa has won less silverware than the other names in this library — an Olympic gold with Argentina, promotions and cult status rather than trophy cabinets — yet Guardiola has called him the best coach in the world, and Pochettino, Sampaoli and a generation of Argentine and Chilean coaches call him their master. His Leeds United side (2018-2022) showed his full method to a global audience.`
        ]
      },
      {
        heading: 'The core idea: protagonism',
        paragraphs: [
          `Bielsa's teams must be protagonists in every match, home or away, whatever the opponent. Out of possession that means man-to-man marking across the entire pitch, with exactly one spare defender behind — if the opponent plays one striker, Bielsa defends with two centre-backs; against two, with three. Every other player hunts their direct opponent everywhere.`,
          `In possession his teams attack vertically: the first look is always forward, wingers stay extremely wide and take on their fullback, and midfield runners flood the box the moment a cross is possible. Rotations are drilled to the point of choreography — Bielsa famously catalogues dozens of distinct game situations and trains a rehearsed answer to each.`
        ]
      },
      {
        heading: 'The cost and the culture',
        paragraphs: [
          `The method demands extreme fitness — his infamous "murderball" training games are full-intensity 11v11 with no stoppages — and squads sometimes fade in spring. But the deeper lesson is his preparation culture: nobody in football watches more video or prepares more thoroughly. His integrity moments (ordering his team to concede a goal to correct an unfair one at Leeds) built trust that outlived results.`
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `Man-marking presses are surprisingly effective at youth level, where opponents struggle to escape 1v1s — and they teach duelling and responsibility like nothing else. Borrow the plus-one rule so you always have cover. And borrow the standard: prepare more than the coach in the other dugout.`
        ]
      }
    ],
    keyIdeas: [
      'Be the protagonist: impose your game regardless of opponent or venue.',
      'Man-mark everywhere with exactly one spare defender behind.',
      'Attack vertically — the first thought is forward.',
      'Preparation depth is a controllable advantage over any rival.'
    ],
    trainingIdeas: [
      'Play match-tempo games with no stoppages ("murderball") in short, measured doses to raise game speed.',
      'Assign man-marking duels in 7v7 and rotate matchups so every player learns to win different 1v1 profiles.'
    ],
    references: [
      { label: 'Marcelo Bielsa — profile', url: 'https://en.wikipedia.org/wiki/Marcelo_Bielsa' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  },
  {
    id: 'philosophy-simeone-block-and-belief',
    category: 'philosophy',
    title: 'Diego Simeone: the block and the badge',
    subtitle: 'Cholismo — a compact 4-4-2, ferocious effort, and identity strong enough to beat richer teams.',
    era: '2011-present',
    origin: 'Atlético Madrid',
    tags: ['mid-block', '4-4-2', 'defensive discipline', 'competitive culture'],
    sections: [
      {
        heading: 'Who he was',
        paragraphs: [
          `Diego Simeone took over a drifting Atlético Madrid in December 2011 and made it a permanent third force against Barcelona and Real Madrid's resources: La Liga titles in 2014 and 2021, two Champions League finals, and Europa League triumphs. "Cholismo" is the clearest modern proof that identity and organisation can outperform payroll.`
        ]
      },
      {
        heading: 'The core idea: effort is non-negotiable, space is sacred',
        paragraphs: [
          `Atlético's base is a 4-4-2 mid or low block of extraordinary discipline. The two banks of four stay within short vertical distance, wide midfielders tuck inside to protect the half-spaces first and press the wing second, and the two strikers screen passes into midfield while steering build-up towards the touchline — where the trap closes. Opponents face forty-five minutes of possession with nothing to show for it.`,
          `Attacks are direct and efficient: quick wide combinations, early crosses, second balls, and set pieces, with the front two expected to create alone against unsettled defences. Simeone treats each phase honestly — his teams do not pretend to be what they are not.`
        ]
      },
      {
        heading: 'Partido a partido',
        paragraphs: [
          `"Game by game" is not a cliché at Atlético; it is method. Simeone narrows focus to the controllable — effort, duels, concentration for ninety minutes — and makes defending a matter of collective pride rather than a chore. Full-backs celebrate blocks like goals. That emotional reframing is his real innovation: he made the unglamorous half of football glamorous to his own players.`
        ]
      },
      {
        heading: 'What grassroots coaches can take',
        paragraphs: [
          `Most grassroots teams face richer, faster, or better-drilled opponents some weeks — Simeone is the template for those days. Two banks of four, short distances, strikers screening the centre, and honest direct attacks. Above all, copy the culture: praise defensive actions as loudly as goals and your team will defend willingly.`
        ]
      }
    ],
    keyIdeas: [
      'A disciplined 4-4-2 block is the most reliable equaliser against stronger teams.',
      'Wide midfielders protect the half-space first, the wing second.',
      'Direct, efficient attacking suits a defence-first game model.',
      'Make defending a source of pride — culture sustains the block.'
    ],
    trainingIdeas: [
      'Defensive shape game: 8 defenders in two banks vs 10 attackers — defenders score by forcing play wide and regaining.',
      'Celebrate and tally blocks, interceptions, and recovery runs in matches the way you tally goals and assists.'
    ],
    references: [
      { label: 'Diego Simeone — profile', url: 'https://en.wikipedia.org/wiki/Diego_Simeone' }
    ],
    status: 'active',
    updatedOn: '2026-07-09'
  }
];
