/** Authored Canadian English A1 situations. Editorial drafts, no recorded audio. */
import type {A1SituationSeed,A1SituationTopic} from './a1-situational-pilots.js';
export const a1SituationsEnglish:Readonly<Record<A1SituationTopic,A1SituationSeed>>={
 'personal-information':{
  continuation:[
   'Thank you. Do you speak English at the community centre?',
   'Yes, I speak English, and I am learning French this year.',
   'Would you like me to repeat the time of our fictional class?',
   'Yes, please. Could you repeat the time slowly?'
  ],
  checks:[
   ['Which city does the person live in?','I live in Vancouver.','The person lives in Montréal.'],
   ['What other language is the person learning?','learning French this year.','The person says they are learning German.'],
   ['What does the person ask to hear again?','repeat the time slowly?','The person asks for a private home address.']
  ],
  spokenFollowUp:'Introduce a fictional character with a country and city, then ask for a class time to be repeated politely.',
  noMicAlternative:'Write two fictional sentences naming a country and city, then write a polite request to repeat a class time.',
  mediationPrompt:'Tell a fictional new classmate where the speaker lives and what language they are learning, without collecting addresses.'
 },
 'food-and-shopping':{
  continuation:[
   'Yes, please. I would like two apples rather than one.',
   'Two apples cost four dollars in total.',
   'Thank you. Can I have a small bag as well?',
   'Yes. The small bag is free today.'
  ],
  checks:[
   ['How much does one apple cost?','two dollars.','One apple costs five dollars.'],
   ['What is the price for two apples?','four dollars in total.','Two apples cost three dollars in total.'],
   ['How much is the small bag?','free today.','The small bag costs two dollars.']
  ],
  spokenFollowUp:'Role-play buying two apples from a fictional shop, ask the total price and politely request a bag.',
  noMicAlternative:'Write a short fictional shopping exchange with a price, a quantity of two, and a polite bag request.',
  mediationPrompt:'Explain to a fictional friend the price of one apple, the price of two apples, and whether the bag costs extra.'
 },
 'places-and-directions':{
  continuation:[
   'After I turn left, is the library next to the park?',
   'Yes. The library is next to the park, across from a small café.',
   'Should I cross the street at the corner to get there?',
   'No. Stay on this side of the street and follow the signs.'
  ],
  checks:[
   ['What is the second direction after going straight?','turn left at the corner.','The route requires a right turn at the bridge.'],
   ['Where is the library in relation to the park?','next to the park,','The library is far away from the park.'],
   ['Should the visitor cross the street?','Stay on this side of the street','The visitor must cross the street immediately.']
  ],
  spokenFollowUp:'Ask for directions to a fictional library and confirm the order of two steps before repeating the route.',
  noMicAlternative:'Write two simple directions to a fictional library and a question confirming whether to cross a street.',
  mediationPrompt:'Restate the two steps and the instruction about crossing for a fictional visitor who missed the directions.'
 }
};
