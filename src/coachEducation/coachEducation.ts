export type LearningGoal = {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
};

export type LearningPlan = {
  id: string;
  title: string;
  focus: string;
  createdAt: string;
  goals: LearningGoal[];
};

export type CoachReflection = {
  id: string;
  createdAt: string;
  prompt: string;
  note: string;
};

export type CoachCredential = {
  id: string;
  qualification: string;
  issuer: string;
  licenceNumber: string;
  issuedOn: string;
  expiresOn: string;
  documentName: string;
  verificationState: 'self-recorded';
  showInPortfolio: boolean;
};

export type CoachPortfolio = {
  isPublic: boolean;
  displayName: string;
  headline: string;
  bio: string;
  specialties: string[];
  ageGroups: string;
  experience: string;
  achievements: string[];
};

export type CoachEducationPathway = {
  id: string;
  title: string;
  purpose: string;
  nextAction: string;
};

export const COACH_EDUCATION_PATHWAYS: readonly CoachEducationPathway[] = [
  { id: 'session-planning', title: 'Session planning', purpose: 'Design purposeful, age-appropriate practices with clear outcomes.', nextAction: 'Build a plan and test one observable coaching goal.' },
  { id: 'tactics', title: 'Tactics & game model', purpose: 'Connect formations and principles to the needs of your own team.', nextAction: 'Read one system guide and translate it into three coaching cues.' },
  { id: 'development', title: 'Player development', purpose: 'Support technical, tactical, physical, and psychosocial growth.', nextAction: 'Choose one player need and plan evidence you can observe.' },
  { id: 'conditioning', title: 'Conditioning', purpose: 'Plan safe football-specific load without pretending to provide medical advice.', nextAction: 'Review session intensity and recovery with qualified support.' },
  { id: 'leadership', title: 'Leadership', purpose: 'Improve communication, culture, feedback, and decision-making.', nextAction: 'Journal one moment where your communication changed behavior.' },
  { id: 'safeguarding', title: 'Safeguarding', purpose: 'Create safer environments, especially for children and vulnerable players.', nextAction: 'Review club safeguarding procedures and reporting contacts.' },
  { id: 'first-aid', title: 'First aid readiness', purpose: 'Prepare emergency roles and equipment while deferring treatment to trained people.', nextAction: 'Confirm the emergency action plan and qualified first-aid coverage.' },
  { id: 'laws', title: 'Laws of the Game', purpose: 'Keep training and match preparation aligned with current official laws.', nextAction: 'Use official IFAB/FIFA material and confirm competition-specific rules.' }
];

export type CoachLearningRecord = {
  version: 1;
  plans: LearningPlan[];
  reflections: CoachReflection[];
  credentials: CoachCredential[];
  portfolio: CoachPortfolio;
};

export type OfficialResource = {
  id: string;
  publisher: 'PFF' | 'AFC' | 'FIFA';
  title: string;
  description: string;
  url: string;
  kind: 'Courses' | 'Pathway' | 'Regulations' | 'Learning';
  lastVerified: string;
};

export const COACH_LEARNING_STORAGE_KEY = 'dumala:coach-learning:v1';

export const EMPTY_COACH_LEARNING_RECORD: CoachLearningRecord = {
  version: 1,
  plans: [],
  reflections: [],
  credentials: [],
  portfolio: { isPublic: false, displayName: '', headline: '', bio: '', specialties: [], ageGroups: '', experience: '', achievements: [] }
};

export type RenewalState = 'current' | 'due-soon' | 'expired' | 'no-expiry';

export const credentialRenewalState = (credential: CoachCredential, now = new Date()): RenewalState => {
  if (!credential.expiresOn) return 'no-expiry';
  const expiry = new Date(`${credential.expiresOn}T23:59:59`);
  if (Number.isNaN(expiry.getTime())) return 'no-expiry';
  if (expiry.getTime() < now.getTime()) return 'expired';
  const daysRemaining = (expiry.getTime() - now.getTime()) / 86_400_000;
  return daysRemaining <= 90 ? 'due-soon' : 'current';
};

export const publicPortfolioSnapshot = (record: CoachLearningRecord) => ({
  ...(record.portfolio.isPublic ? record.portfolio : {
    ...record.portfolio, displayName: '', headline: '', bio: '', specialties: [], ageGroups: '', experience: '', achievements: []
  }),
  credentials: record.portfolio.isPublic
    ? record.credentials.filter(credential => credential.showInPortfolio).map(({ documentName: _documentName, ...credential }) => credential)
    : []
});

export const OFFICIAL_COACHING_RESOURCES: readonly OfficialResource[] = [
  {
    id: 'pff-coach-courses',
    publisher: 'PFF',
    title: 'PFF Coach Courses',
    description: 'Current Philippine course notices, requirements, and federation updates.',
    url: 'https://pff.org.ph/category/coach-courses/',
    kind: 'Courses',
    lastVerified: '2026-07-12'
  },
  {
    id: 'pff-programmes',
    publisher: 'PFF',
    title: 'PFF Programs and Projects',
    description: 'The federation overview of grassroots, youth, and professional development work.',
    url: 'https://pff.org.ph/programs-and-projects/',
    kind: 'Pathway',
    lastVerified: '2026-07-12'
  },
  {
    id: 'afc-coach-education',
    publisher: 'AFC',
    title: 'AFC Coach Education',
    description: 'The confederation framework for progressive coach education in Asia.',
    url: 'https://www.the-afc.com/en/more/news/coach_education.html',
    kind: 'Pathway',
    lastVerified: '2026-07-12'
  },
  {
    id: 'afc-convention-regulations',
    publisher: 'AFC',
    title: 'AFC Coaching Convention Regulations',
    description: 'Official minimum standards and responsibilities for member-association education.',
    url: 'https://assets.the-afc.com/downloads/developing-the-game/AFC-Coaching-Convention-Regulations-2024.pdf',
    kind: 'Regulations',
    lastVerified: '2026-07-12'
  },
  {
    id: 'fifa-training-centre',
    publisher: 'FIFA',
    title: 'FIFA Training Centre',
    description: 'Technical learning resources, session ideas, and game insights from FIFA.',
    url: 'https://www.fifatrainingcentre.com/',
    kind: 'Learning',
    lastVerified: '2026-07-12'
  }
];

const isString = (value: unknown): value is string => typeof value === 'string';

export const parseCoachLearningRecord = (raw: string | null): CoachLearningRecord => {
  if (!raw) return EMPTY_COACH_LEARNING_RECORD;
  try {
    const value = JSON.parse(raw) as Partial<CoachLearningRecord>;
    if (value.version !== 1 || !Array.isArray(value.plans) || !Array.isArray(value.reflections)) {
      return EMPTY_COACH_LEARNING_RECORD;
    }
    const plans = value.plans.filter((plan): plan is LearningPlan => {
      if (!plan || typeof plan !== 'object') return false;
      const candidate = plan as LearningPlan;
      return isString(candidate.id) && isString(candidate.title) && isString(candidate.focus)
        && isString(candidate.createdAt) && Array.isArray(candidate.goals);
    });
    const reflections = value.reflections.filter((entry): entry is CoachReflection => {
      if (!entry || typeof entry !== 'object') return false;
      const candidate = entry as CoachReflection;
      return isString(candidate.id) && isString(candidate.createdAt)
        && isString(candidate.prompt) && isString(candidate.note);
    });
    const credentials = Array.isArray(value.credentials) ? value.credentials.filter((entry): entry is CoachCredential => {
      if (!entry || typeof entry !== 'object') return false;
      const candidate = entry as CoachCredential;
      return isString(candidate.id) && isString(candidate.qualification) && isString(candidate.issuer)
        && isString(candidate.licenceNumber) && isString(candidate.issuedOn) && isString(candidate.expiresOn)
        && isString(candidate.documentName) && candidate.verificationState === 'self-recorded'
        && typeof candidate.showInPortfolio === 'boolean';
    }) : [];
    const portfolioCandidate = value.portfolio as Partial<CoachPortfolio> | undefined;
    const portfolio: CoachPortfolio = portfolioCandidate && typeof portfolioCandidate.isPublic === 'boolean'
      ? {
          isPublic: portfolioCandidate.isPublic,
          displayName: isString(portfolioCandidate.displayName) ? portfolioCandidate.displayName : '',
          headline: isString(portfolioCandidate.headline) ? portfolioCandidate.headline : '',
          bio: isString(portfolioCandidate.bio) ? portfolioCandidate.bio : '',
          specialties: Array.isArray(portfolioCandidate.specialties)
            ? portfolioCandidate.specialties.filter(isString)
            : [],
          ageGroups: isString(portfolioCandidate.ageGroups) ? portfolioCandidate.ageGroups : '',
          experience: isString(portfolioCandidate.experience) ? portfolioCandidate.experience : '',
          achievements: Array.isArray(portfolioCandidate.achievements) ? portfolioCandidate.achievements.filter(isString) : []
        }
      : EMPTY_COACH_LEARNING_RECORD.portfolio;
    return { version: 1, plans, reflections, credentials, portfolio };
  } catch {
    return EMPTY_COACH_LEARNING_RECORD;
  }
};

export const learningProgress = (record: CoachLearningRecord): { completed: number; total: number } => {
  const goals = record.plans.flatMap(plan => plan.goals);
  return { completed: goals.filter(goal => goal.completed).length, total: goals.length };
};
