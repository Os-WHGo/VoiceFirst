/** Original six-turn C1 listening scenes in Canadian English; draft, no recorded voices. */
import type {AdvancedSceneSeed} from './advanced-listening-storyboards.js';
export const c1ListeningEnglish=[
 {
  level:'C1',unitId:'nuance-and-register',title:'Public library briefing',
  context:'Two coordinators prepare a fictional update for residents.',
  turns:[
   ['speaker-a','Are we describing the new library schedule as a success in tomorrow’s update?'],
   ['speaker-b','It has reduced waiting times, but visitors who need step-free access still face a locked side entrance.'],
   ['speaker-a','Then saying it has succeeded for everyone would be courteous, but not accurate.'],
   ['speaker-b','We can say the pilot improved service while access issues remain unresolved.'],
   ['speaker-a','Should we keep the technical project terms when we talk with volunteers?'],
   ['speaker-b','No. Present the same findings in plain language and invite questions rather than minimize the access problem.']
  ],
  checks:[
   [1,'What physical obstacle remains?','a locked side entrance',
    'The pilot helped some visitors but still has an access barrier.','The pilot has removed every access obstacle.'],
   [3,'What qualification belongs in the briefing?','access issues remain unresolved',
    'The speaker proposes acknowledging a remaining problem.','The speaker believes all concerns are resolved.'],
   [5,'How should volunteers hear the findings?','plain language and invite questions',
    'The speaker recommends accessible explanation without hiding limitations.','The speaker recommends suppressing the access issue.']
  ],
  spokenFollowUp:'Explain the findings politely to a resident, keeping the unsolved accessibility issue explicit.',
  noMicAlternative:'Write a fictional two-sentence briefing that reports the improvement and its limitation.'
 },
 {
  level:'C1',unitId:'implicit-meaning',title:'Evening workshop proposal',
  context:'A community team interprets a cautious answer from a director.',
  turns:[
   ['speaker-a','Did the director approve the new evening workshop at the meeting?'],
   ['speaker-b','She called it a possibility but asked us to revisit it after staffing plans are approved.'],
   ['speaker-a','So putting a definite start date on the calendar would be premature?'],
   ['speaker-b','Exactly. I heard interest, not a commitment, and the staffing condition still matters.'],
   ['speaker-a','Could we tell participants we are considering the idea instead?'],
   ['speaker-b','Yes, provided we say no date is confirmed and promise an update after the staffing review.']
  ],
  checks:[
   [1,'What must happen before the idea is revisited?','after staffing plans are approved',
    'The director postponed a decision pending staffing arrangements.','The director approved the workshop immediately.'],
   [3,'What distinction does the team member make?','interest, not a commitment',
    'A positive tone must not be mistaken for a firm promise.','Interest guarantees that the plan will proceed.'],
   [5,'What remains unknown to participants?','no date is confirmed',
    'The team can share its intention without inventing a schedule.','The new workshop already has a confirmed starting date.']
  ],
  spokenFollowUp:'Politely clarify whether the proposal is approved, pending or rejected without inventing motives.',
  noMicAlternative:'Draft a brief update that distinguishes interest from approval and states what happens next.'
 }
] as const satisfies readonly AdvancedSceneSeed[];
