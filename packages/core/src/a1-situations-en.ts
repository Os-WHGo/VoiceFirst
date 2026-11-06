/** Authored Canadian English A1 situations. Editorial drafts, no recorded audio. */
import type {A1SituationSeed,A1SituationTopic} from './a1-situational-pilots.js';
export const a1SituationsEnglish:Readonly<Record<A1SituationTopic,A1SituationSeed>>={
 'numbers-time-and-dates':{
  continuation:[
   "Is the class in room three or room four?",
   "The class is in room three on Monday.",
   "Can you repeat the day and time for my friend?",
   "Of course. Monday at two o’clock, in room three.",
  ],
  checks:[
   ["What time does the class start?", "two o’clock in the afternoon.", "The class starts at nine o’clock in the morning."],
   ["Which room will the class use?", "room three on Monday.", "The Monday class meets in room four."],
   ["What information is repeated for the friend?", "Monday at two o’clock, in room three.", "The friend is told to arrive on Tuesday at four."],
  ],
  spokenFollowUp:"Confirm the day, hour and room of a fictional class with another speaker and ask politely to hear them again.",
  noMicAlternative:"Write two short messages confirming a fictional Monday class, its starting time and its room number.",
  mediationPrompt:"Tell a fictional classmate who missed the conversation the class day, time and room without using a real school schedule."
 },
 'family-and-people':{
  continuation:[
   "Does Sam enjoy visiting the community garden?",
   "Yes, Sam enjoys the garden and brings a small notebook.",
   "Can I invite Sam to our fictional group meeting?",
   "Yes, Sam can join us on Saturday afternoon.",
  ],
  checks:[
   ["How is Sam related to the first speaker?", "my cousin.", "Sam is introduced as the speaker’s teacher."],
   ["What does Sam bring to the garden?", "a small notebook.", "Sam carries a large suitcase to the garden."],
   ["When can Sam join the fictional group?", "Saturday afternoon.", "Sam is only available on Wednesday morning."],
  ],
  spokenFollowUp:"Introduce a fictional cousin respectfully, describe one interest and invite them to a small group meeting.",
  noMicAlternative:"Write a fictional description of a cousin and two short messages asking and answering about a meeting.",
  mediationPrompt:"Explain to a fictional newcomer who Sam is, what Sam enjoys and when the group meeting takes place."
 },
 'daily-routines':{
  continuation:[
   "Does the bus leave before eight?",
   "Yes, it leaves at seven thirty from the bus stop.",
   "What do you do when you arrive?",
   "I read a book before I start work at nine.",
  ],
  checks:[
   ["What happens just after breakfast?", "then I take the bus.", "The person goes straight to bed after breakfast."],
   ["At what time does the bus leave?", "at seven thirty", "The bus leaves at half past nine."],
   ["What does the person do before work?", "I read a book before I start work at nine.", "The person goes running after work ends."],
  ],
  spokenFollowUp:"Describe a fictional morning routine using three activities and their times, then ask about the bus departure.",
  noMicAlternative:"Write a three-sentence fictional morning schedule with breakfast, transport and a start-of-work time.",
  mediationPrompt:"Put the fictional traveller’s breakfast, bus and reading activities in order for someone who missed the explanation."
 },
 'basic-needs-and-help':{
  continuation:[
   "Thank you. Which part of the ticket shows the day?",
   "The date is printed at the top, beside the number.",
   "Can you say that again a little more slowly?",
   "Yes. Look at the top of the ticket, beside the number.",
  ],
  checks:[
   ["How will the helper explain the ticket?", "explain it slowly.", "The helper refuses to explain anything."],
   ["Where is the date printed?", "at the top, beside the number.", "The date is written on the back below the barcode."],
   ["Which part should the visitor look at again?", "at the top of the ticket, beside the number.", "The visitor should look under the ticket on the floor."],
  ],
  spokenFollowUp:"Politely ask for help with a fictional ticket, identify where to find a date and request a slower explanation.",
  noMicAlternative:"Write a polite fictional request for ticket help and a second sentence asking for instructions to be repeated.",
  mediationPrompt:"Explain in simple words where the date is located on a fictional ticket for a visitor who did not hear the answer."
 },
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
