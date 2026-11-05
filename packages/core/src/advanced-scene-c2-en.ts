/** Original C2 Canadian English six-turn listening drafts. Not authorized for playback. */
import type {AdvancedSceneSeed} from './advanced-listening-storyboards.js';
export const c2ListeningEnglish=[
 {
  level:'C2',unitId:'idiomatic-mastery',title:'Partnership negotiations',
  context:'Two analysts explain figurative expressions heard in a fictional meeting.',
  turns:[
   ['speaker-a','When the chair warned that we could burn our bridges, was she referring to the ferry route?'],
   ['speaker-b','No. She meant rejecting the partnership so firmly that returning to it later would be difficult.'],
   ['speaker-a','So translating her remark as a transport problem would misrepresent the risk.'],
   ['speaker-b','In the minutes, say the move could damage future cooperation, not that any bridge is unsafe.'],
   ['speaker-a','She also said we should keep our powder dry. How should we explain that?'],
   ['speaker-b','Here it means keeping our strongest arguments in reserve until we have better evidence, not saving supplies.']
  ],
  checks:[
   [1,'What decision does the first idiom warn against?','rejecting the partnership so firmly',
    'A definitive rejection could make future collaboration more difficult.','The organization plans to close a physical bridge.'],
   [3,'What consequence should the minutes describe?','damage future cooperation',
    'The practical risk concerns future relationships between partners.','A structural engineering inspection has failed.'],
   [5,'What is meant by the second expression here?','keeping our strongest arguments in reserve',
    'The team should save some arguments until the evidence improves.','The speakers must store emergency equipment underground.']
  ],
  spokenFollowUp:'Rephrase both idioms for a non-native listener without claiming a literal transport risk.',
  noMicAlternative:'Write a fictional minutes entry that preserves the implied risks without literal translations.'
 },
 {
  level:'C2',unitId:'subtle-implications',title:'Reading a chair’s response',
  context:'Two colleagues consider what the public record can and cannot imply.',
  turns:[
   ['speaker-a','The chair called our fictional plan ambitious, paused, and ended the discussion. Was that approval?'],
   ['speaker-b','After a long silence, the chair proposed another review instead of calling for a vote.'],
   ['speaker-a','Would you classify that long pause as a rejection rather than a delay?'],
   ['speaker-b','It might be a polite deferral, but we cannot infer the chair’s private intention from a pause alone.'],
   ['speaker-a','Then how should the minutes record the exchange without guessing at motives?'],
   ['speaker-b','State that no vote was taken and another review was requested, without claiming anyone privately opposed the plan.']
  ],
  checks:[
   [1,'What formal action was proposed instead of a decision?','another review instead of calling for a vote',
    'The chair postponed formal approval and requested more deliberation.','The proposal won unanimous support in a recorded vote.'],
   [3,'What cannot be established from the silence?','cannot infer the chair’s private intention',
    'The listener should treat a suggested motive as uncertain.','Silence alone establishes that the chair disliked the team.'],
   [5,'Which verified facts belong in the public minutes?','no vote was taken and another review was requested',
    'Official records should distinguish events from speculation about motives.','The official record must state that the chair rejected the plan.']
  ],
  spokenFollowUp:'Summarize what happened and offer a cautious interpretation without claiming to know motives.',
  noMicAlternative:'Write a factual two-sentence summary and a separately qualified inference.'
 }
] as const satisfies readonly AdvancedSceneSeed[];
