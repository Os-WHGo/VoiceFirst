/** Original second editorial dialogue pilots in Canadian English.
 * Drafted situational continuations; NOT recorded or linguistically approved.
 */
import type {ExpandedPilotSeed} from './a2-b2-expanded-pilots.js';
export const secondPilotEnglish={
 A2:{
  unitId:'housing-and-services',
  continuation:[
   'Tomorrow would work. Could the visit happen in the morning?',
   'We can request a morning visit, but the technician has not confirmed a time.',
   'Should I wait at home for the entire day?',
   'Please wait for a confirmed appointment window. We will send a message when the schedule is set.'
  ],
  checks:[
   ['What day was first suggested for the inspection?','Can someone check it tomorrow?','The inspection was confirmed for the same evening.'],
   ['What part of the visit is still uncertain?','has not confirmed a time','The technician has already confirmed an exact morning appointment.'],
   ['When will the second person send a message?','when the schedule is set','The speaker promised that a technician would arrive without an appointment.']
  ],
  spokenFollowUp:'Describe a fictional household fault, request a repair visit and distinguish a possible morning from a confirmed appointment.',
  noMicAlternative:'Write a short fictional maintenance request and a response that clearly identifies the time still needing confirmation.'
 },
 B1:{
  unitId:'handling-unexpected-situations',
  continuation:[
   'Could someone check whether the smaller room is free and accessible before we invite everyone there?',
   'I can ask the venue coordinator, but we have not received approval yet.',
   'What should we tell participants while we wait for a decision?',
   'Say that the workshop location is undecided; we will update everyone once the coordinator confirms.'
  ],
  checks:[
   ['Under which condition could the smaller room be used?','if it is available','The smaller room has already been reserved and approved.'],
   ['Has the venue coordinator approved the alternative?','have not received approval yet','The venue coordinator has already confirmed the smaller room.'],
   ['What must happen before the workshop location is announced?','once the coordinator confirms','Participants must be told that the original room is open.']
  ],
  spokenFollowUp:'Explain a fictional last-minute room closure, name possible alternatives and avoid announcing a location before approval.',
  noMicAlternative:'Write a fictional notice to participants identifying the confirmed closure and the location decision that is still pending.'
 },
 B2:{
  unitId:'complex-instructions',
  continuation:[
   'Where should I check the reference before taking another action?',
   'Compare the number on the request with the reference in the internal register; never rely on a verbal estimate.',
   'If the two numbers match, can I skip the final approval step?',
   'No. Matching numbers only let you proceed to supervisor review; they do not authorize approval by themselves.'
  ],
  checks:[
   ['When must the initial process be stopped?','If it differs, stop the process','A mismatch may be ignored as long as the request looks familiar.'],
   ['Which source should be used to compare the reference?','internal register','The reference can be accepted solely from an unrecorded verbal estimate.'],
   ['Does a matching reference authorize final approval?','do not authorize approval','Matching references automatically grant final approval without any review.']
  ],
  spokenFollowUp:'Explain a fictional multi-step approval procedure, preserve the stop condition and distinguish preliminary matching from authorization.',
  noMicAlternative:'Write a short fictional procedure that separates verification, mismatch escalation and final supervisor approval.'
 }
} as const satisfies Readonly<Record<'A2'|'B1'|'B2',ExpandedPilotSeed>>;
