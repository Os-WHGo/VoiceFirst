/** Original Canadian English continuation scripts, draft pending language/audio review. */
import type {ExpandedPilotSeed} from './a2-b2-expanded-pilots.js';
export const expandedPilotEnglish={
 A2:{
  unitId:'plans-and-invitations',
  continuation:[
   'Sunday could work. Is the museum open in the afternoon?',
   'The notice says it opens at one. Could we meet near the entrance at two instead?',
   'Two in the afternoon sounds good, but let us check that the hours have not changed.',
   'Agreed. I will confirm the opening time first and send a message if our plan needs to change.'
  ],
  checks:[
   ['Which day was suggested after the first invitation?','Sunday instead','They both agreed to visit on Saturday.'],
   ['What meeting time is proposed?','at two instead','They agreed to meet at nine in the morning.'],
   ['What must be confirmed before the plan is final?','confirm the opening time first','They will go regardless of the museum opening hours.']
  ],
  spokenFollowUp:'Invite a fictional friend to a weekend activity, explain a scheduling conflict, and confirm a conditional alternative.',
  noMicAlternative:'Write two short fictional messages: an invitation and a response proposing a different day and time.'
 },
 B1:{
  unitId:'workplace-collaboration',
  continuation:[
   'I can set up the room before the meeting, but please tell me what equipment you will check.',
   'I will test the projector and microphones after lunch, then send you a short update before the guests arrive.',
   'That helps. If the projector fails, should I arrange a backup screen or wait for your update?',
   'Arrange the backup screen if the test fails. I will report the result; neither of us should assume the equipment works.'
  ],
  checks:[
   ['When can the second colleague check the equipment?','after lunch','The equipment is already confirmed as working.'],
   ['What specific checks are promised?','projector and microphones','The colleague will repair the building wiring.'],
   ['When is a backup screen needed?','if the test fails','The backup screen is required even if every test succeeds.']
  ],
  spokenFollowUp:'Confirm who prepares the room, who checks equipment, and what condition triggers a backup plan.',
  noMicAlternative:'Write a fictional handover note naming each responsibility and the condition for using a backup screen.'
 },
 B2:{
  unitId:'argument-and-evidence',
  continuation:[
   'What evidence would make the decision fairer to people who travel after normal working hours?',
   'We should ask evening riders directly and compare passenger counts from several weekdays, not just one busy night.',
   'Would those figures alone prove that the route should run permanently?',
   'No. We must also examine costs and accessibility, so any recommendation remains provisional until the review is complete.'
  ],
  checks:[
   ['Which group was missing from the original survey?','evening commuters','The survey included all residents who use late buses.'],
   ['What additional evidence is proposed?','passenger counts from several weekdays','One busy evening provides a representative complete sample.'],
   ['What is the status of the final recommendation?','remains provisional','The permanent service has already been approved.']
  ],
  spokenFollowUp:'Give a balanced provisional recommendation that explicitly states sampling limits, further evidence and trade-offs.',
  noMicAlternative:'Draft a short fictional recommendation separating observed data, missing evidence and a conditional conclusion.'
 }
} as const satisfies Readonly<Record<'A2'|'B1'|'B2',ExpandedPilotSeed>>;
