import type { FprdsAttributeId, FprdsRole } from '../types';

export interface CoachAttributeLanguage {
  display: string;
  coachPhrase: string;
  playerPhrase: string;
  trainingCue: string;
}

export interface CoachRoleLanguage {
  rolePicture: string;
  standard: string;
}

export interface CoachFeedbackCopyContext {
  rolePicture: string;
  roleStandard: string;
  trendMessage: string;
  strengthCoachPhrase: string;
  strengthDisplayName: string;
  strengthCue: string;
  priorityCoachPhrase: string;
  priorityDisplayName: string;
  priorityCue: string;
  priorityTrainingCue: string;
}

export type CoachFeedbackStatement = (context: CoachFeedbackCopyContext) => string;

export const COACH_ATTRIBUTE_LANGUAGE: Record<FprdsAttributeId, CoachAttributeLanguage> = {
  pace: {
    display: 'Game speed',
    coachPhrase: 'using speed at the right moment',
    playerPhrase: 'changing speed with purpose',
    trainingCue: 'separate after the first touch, then keep the next action clean'
  },
  stamina: {
    display: 'Repeat effort',
    coachPhrase: 'holding your level across repeated actions',
    playerPhrase: 'staying useful late in the session',
    trainingCue: 'recover quickly, reset your shape, and make the next action count'
  },
  agility: {
    display: 'Change of direction',
    coachPhrase: 'adjusting your feet before the moment arrives',
    playerPhrase: 'moving sharply without losing balance',
    trainingCue: 'drop your hips, take one clean adjustment step, then accelerate'
  },
  strength: {
    display: 'Contact strength',
    coachPhrase: 'staying strong through contact',
    playerPhrase: 'holding your space when pressure arrives',
    trainingCue: 'arrive balanced, use your body early, and play after contact'
  },
  firstTouch: {
    display: 'First touch',
    coachPhrase: 'making the first touch solve pressure',
    playerPhrase: 'taking your first touch into the next action',
    trainingCue: 'scan before the pass, open your body, and touch away from pressure'
  },
  shortPassing: {
    display: 'Short passing',
    coachPhrase: 'connecting simple passes at match speed',
    playerPhrase: 'playing clean passes that help the next teammate',
    trainingCue: 'set the ball, pass through the target, and move again'
  },
  finishingBox: {
    display: 'Finishing in the box',
    coachPhrase: 'turning box chances into goals',
    playerPhrase: 'finishing quickly when the chance appears',
    trainingCue: 'set early, pick the finish before the ball arrives, and hit the target'
  },
  shotPower: {
    display: 'Controlled power',
    coachPhrase: 'striking with power without losing accuracy',
    playerPhrase: 'hitting the ball hard and clean',
    trainingCue: 'plant strong, keep the body over the ball, and finish through the strike'
  },
  offensive1v1: {
    display: 'Beating a defender',
    coachPhrase: 'taking on and beating the first defender',
    playerPhrase: 'beating your marker with purpose',
    trainingCue: 'commit the defender, attack the front foot, then explode out of the move'
  },
  attackingHeading: {
    display: 'Attacking headers',
    coachPhrase: 'attacking crosses with timing and direction',
    playerPhrase: 'arriving on time and heading with intent',
    trainingCue: 'separate first, attack the ball at the highest point, and head down or across'
  },
  longPassing: {
    display: 'Long passing',
    coachPhrase: 'switching play or finding distance with control',
    playerPhrase: 'playing longer passes that change the picture',
    trainingCue: 'scan early, set your hips, and drive the pass to the safe side'
  },
  visionPlaymaking: {
    display: 'Playmaking vision',
    coachPhrase: 'seeing the next pass before pressure closes',
    playerPhrase: 'finding the pass that moves the game forward',
    trainingCue: 'scan twice, receive half-turned, and choose before the second touch'
  },
  ballRetention: {
    display: 'Protecting possession',
    coachPhrase: 'keeping the ball when pressure arrives',
    playerPhrase: 'protecting the ball without going backwards too early',
    trainingCue: 'put your body between player and ball, then escape with the next touch'
  },
  pressingInterceptions: {
    display: 'Pressing and interceptions',
    coachPhrase: 'winning the ball by reading the next pass',
    playerPhrase: 'pressing with timing instead of chasing',
    trainingCue: 'show one side, jump on the bad touch, and recover if the press breaks'
  },
  tackling: {
    display: 'Tackling',
    coachPhrase: 'winning duels without giving away the next action',
    playerPhrase: 'defending the duel with control',
    trainingCue: 'slow down first, match the attacker, then tackle when the ball separates'
  },
  defensiveHeading: {
    display: 'Defensive headers',
    coachPhrase: 'clearing aerial danger with direction',
    playerPhrase: 'winning the header and helping the team reset',
    trainingCue: 'find contact early, attack the ball, and clear to a useful area'
  },
  positioningClearances: {
    display: 'Positioning and clearances',
    coachPhrase: 'being in the right place before the danger becomes urgent',
    playerPhrase: 'reading danger early and clearing with control',
    trainingCue: 'check shoulder, protect the central space, and clear away from pressure'
  },
  crossing: {
    display: 'Crossing',
    coachPhrase: 'delivering crosses teammates can attack',
    playerPhrase: 'putting the final ball into a dangerous area',
    trainingCue: 'lift your head before the cross, pick the zone, and drive through the ball'
  },
  reflexes: {
    display: 'Reaction saves',
    coachPhrase: 'reacting quickly while staying set',
    playerPhrase: 'making the save without guessing early',
    trainingCue: 'set before the strike, keep hands active, and push the ball away from danger'
  },
  handling: {
    display: 'Handling security',
    coachPhrase: 'catching and securing the ball cleanly',
    playerPhrase: 'making the save feel calm for the team',
    trainingCue: 'get behind the ball, soft hands first, then secure it into the body'
  },
  divingReach: {
    display: 'Diving reach',
    coachPhrase: 'covering more of the goal when stretched',
    playerPhrase: 'getting across the goal with power',
    trainingCue: 'push from the nearest foot, lead with the hands, and land safely'
  },
  distribution: {
    display: 'Distribution choices',
    coachPhrase: 'starting attacks with the right pass or release',
    playerPhrase: 'choosing the pass that helps the team play out',
    trainingCue: 'scan before collecting, choose early, and play to the teammate advantage'
  }
};

export const COACH_ROLE_LANGUAGE: Record<FprdsRole, CoachRoleLanguage> = {
  ST: {
    rolePicture: 'your value shows when you arrive in scoring areas with calm, direct actions',
    standard: 'be sharp, be available, and make the next chance feel repeatable'
  },
  W: {
    rolePicture: 'your value shows when wide actions create a real problem for the defender',
    standard: 'stretch the pitch, attack space, and turn possession into danger'
  },
  CM: {
    rolePicture: 'your value shows when you control tempo before pressure controls you',
    standard: 'scan early, receive with a plan, and keep the team connected'
  },
  CDM: {
    rolePicture: 'your value shows when you protect the team and play forward simply',
    standard: 'screen danger, win second balls, and make the first pass clean'
  },
  FB: {
    rolePicture: 'your value shows through repeated wide duels, recovery runs, and useful final balls',
    standard: 'defend the wide channel, recover quickly, and support attacks with quality'
  },
  CB: {
    rolePicture: 'your value shows when you manage danger early and restart play calmly',
    standard: 'win the duel, protect the central space, and make the first pass count'
  },
  GK: {
    rolePicture: 'your value shows when your set position, handling, and choices settle the team',
    standard: 'stay ready, secure the ball, and start the next action with purpose'
  }
};

export const getCoachAttributeLanguage = (attributeId: FprdsAttributeId): CoachAttributeLanguage => (
  COACH_ATTRIBUTE_LANGUAGE[attributeId]
);

export const getCoachRoleLanguage = (role: FprdsRole): CoachRoleLanguage => (
  COACH_ROLE_LANGUAGE[role]
);

export const selectCoachStatement = <T>(options: readonly T[], seed: string): T => {
  const hash = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  return options[hash % options.length];
};

export const strengthCue = (label: string): string => {
  if (label === 'Elite') return 'This is becoming part of your identity. Keep the standard high when the drill gets uncomfortable.';
  if (label === 'Advanced') return 'This is already helping your game. The challenge is repeating it when speed and pressure go up.';
  if (label === 'Developing') return 'There is a base here. Now we need cleaner repetitions so it shows up more often.';
  if (label === 'Needs Work') return 'There is a starting point here, but we need to build confidence through simple wins first.';
  return 'Keep the feedback simple and attach it to one clean action.';
};

export const priorityCue = (label: string): string => {
  if (label === 'Elite') return 'protect the standard while chasing the smaller detail that separates good from excellent';
  if (label === 'Advanced') return 'turn a good tool into a reliable habit under pressure';
  if (label === 'Developing') return 'make this the main training thread until the action becomes repeatable';
  if (label === 'Needs Work') return 'slow the action down, rebuild the technique, then add speed once it holds';
  return 'rebuild the action from the simplest version and praise clean repetitions';
};

export const FEEDBACK_HEADLINES = [
  'Start with the clearest coaching point',
  'Keep the message simple and useful',
  'Give the player one thing to own',
  'Lead with belief, then give direction',
  'Make the next action obvious',
  'Turn the assessment into a training target'
] as const;

export const OPENING_STATEMENTS: readonly CoachFeedbackStatement[] = [
  ({ rolePicture, trendMessage }) => `Today I want to keep this simple: ${rolePicture}. ${trendMessage}`,
  ({ rolePicture, trendMessage }) => `This is the main picture from the assessment: ${rolePicture}. ${trendMessage}`,
  ({ rolePicture, trendMessage }) => `The useful part of this report is the training direction. For your role, ${rolePicture}. ${trendMessage}`,
  ({ rolePicture, trendMessage }) => `I want you to understand the assessment as a next step, not a label. In your role, ${rolePicture}. ${trendMessage}`,
  ({ rolePicture, trendMessage }) => `Here is the part we can act on straight away: ${rolePicture}. ${trendMessage}`
];

export const PRAISE_STATEMENTS: readonly CoachFeedbackStatement[] = [
  ({ strengthCoachPhrase, strengthCue: cue }) => `The positive is your ${strengthCoachPhrase}. ${cue}`,
  ({ strengthDisplayName, strengthCue: cue }) => `${strengthDisplayName} gives us something real to build from. ${cue}`,
  ({ strengthCoachPhrase, strengthCue: cue }) => `I want you to recognize the value in ${strengthCoachPhrase}. ${cue}`,
  ({ strengthDisplayName, strengthCue: cue }) => `Do not ignore the good part: ${strengthDisplayName} is giving you a platform. ${cue}`,
  ({ strengthCoachPhrase, strengthCue: cue }) => `Your best moments came from ${strengthCoachPhrase}. ${cue}`
];

export const CORRECTION_STATEMENTS: readonly CoachFeedbackStatement[] = [
  ({ priorityCoachPhrase, priorityCue: cue, priorityTrainingCue }) => `The next step is ${priorityCoachPhrase}. We will ${cue}. Main cue: ${priorityTrainingCue}.`,
  ({ priorityDisplayName, priorityCue: cue, priorityTrainingCue }) => `${priorityDisplayName} is the priority because it can change your next performance quickly. We will ${cue}. Cue it this way: ${priorityTrainingCue}.`,
  ({ priorityCoachPhrase, priorityTrainingCue }) => `The work is not bigger effort, it is cleaner detail: ${priorityCoachPhrase}. Your training cue is: ${priorityTrainingCue}.`,
  ({ priorityDisplayName, priorityCue: cue }) => `The correction is ${priorityDisplayName}. We are not chasing everything at once; we will ${cue}.`,
  ({ priorityCoachPhrase, priorityTrainingCue }) => `If we improve one thing first, make it ${priorityCoachPhrase}. Keep the cue short: ${priorityTrainingCue}.`
];

export const FOCUS_STATEMENTS: readonly CoachFeedbackStatement[] = [
  ({ roleStandard }) => `For the next block, the standard is simple: ${roleStandard}. I want one better habit we can see in training.`,
  ({ priorityDisplayName }) => `Do not carry five targets into training. Carry one: make ${priorityDisplayName.toLowerCase()} more reliable under pressure.`,
  ({ roleStandard, priorityTrainingCue }) => `The team standard is: ${roleStandard}. Your personal cue is: ${priorityTrainingCue}.`,
  ({ priorityCoachPhrase }) => `The win this week is not a perfect score. It is showing me ${priorityCoachPhrase} more often when the session speeds up.`,
  ({ priorityDisplayName }) => `By the next check-in, I want the evidence to be visible: better decisions, cleaner habits, and more confidence around ${priorityDisplayName.toLowerCase()}.`
];

export const CONVERSATION_PROMPTS: readonly CoachFeedbackStatement[] = [
  ({ strengthDisplayName }) => `When ${strengthDisplayName.toLowerCase()} is at its best, what do you notice yourself doing before the action?`,
  ({ priorityDisplayName }) => `What cue will you use for ${priorityDisplayName.toLowerCase()} before I have to remind you?`,
  () => 'What would I see in the next assessment that proves this focus is starting to stick?',
  ({ priorityCoachPhrase }) => `When ${priorityCoachPhrase} breaks down, what usually happens first: timing, confidence, or technique?`,
  () => 'What part of this feedback feels easiest for you to own this week?',
  ({ strengthDisplayName, priorityDisplayName }) => `How can we use your ${strengthDisplayName.toLowerCase()} to help improve ${priorityDisplayName.toLowerCase()}?`,
  () => 'What is one training rep this week that you want me to hold you accountable for?',
  ({ priorityTrainingCue }) => `When the session gets fast, what words will remind you of this cue: ${priorityTrainingCue}?`
];

export const PRIORITY_REASON_STATEMENTS: readonly CoachFeedbackStatement[] = [
  ({ priorityDisplayName, priorityTrainingCue }) => `${priorityDisplayName} has role value and room to grow. Cue it as: ${priorityTrainingCue}.`,
  ({ priorityCoachPhrase, priorityTrainingCue }) => `This focus matters because ${priorityCoachPhrase} shows up often in the role. Training cue: ${priorityTrainingCue}.`,
  ({ priorityDisplayName, priorityCue }) => `${priorityDisplayName} is the best place to spend training attention right now. The aim is to ${priorityCue}.`,
  ({ priorityCoachPhrase }) => `Improving this gives the coach something visible to check: more consistency when ${priorityCoachPhrase}.`
];
