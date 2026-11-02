/** Calendar-day helpers for learner-local ISO dates (YYYY-MM-DD). No clock or timezone access. */
const dayPattern=/^\d{4}-\d{2}-\d{2}$/;
export function isLocalDay(value:unknown):value is string{
 if(typeof value!=='string'||!dayPattern.test(value))return false;
 const stamp=Date.parse(`${value}T12:00:00Z`);
 return Number.isFinite(stamp)&&new Date(stamp).toISOString().slice(0,10)===value;
}
export function addLocalDays(day:string,days:number):string{
 if(!isLocalDay(day)||!Number.isSafeInteger(days))throw new Error('Invalid local day');
 return new Date(Date.parse(`${day}T12:00:00Z`)+days*86400000).toISOString().slice(0,10);
}
/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function localDaysBetween(from:string,to:string):number{
 if(!isLocalDay(from)||!isLocalDay(to))throw new Error('Invalid local day');
 return Math.round((Date.parse(`${to}T12:00:00Z`)-Date.parse(`${from}T12:00:00Z`))/86400000);
}
/** Learner-local calendar day of an instant. `utcOffsetMinutes` is minutes EAST of UTC (UTC-7 is -420).
 * Note that JavaScript's Date#getTimezoneOffset() returns minutes WEST, hence the sign flip in deviceLocalDay. */
export function localDayAt(instant:Date,utcOffsetMinutes:number):string{
 if(!(instant instanceof Date)||Number.isNaN(instant.getTime()))throw new Error('Invalid instant');
 if(!Number.isSafeInteger(utcOffsetMinutes)||Math.abs(utcOffsetMinutes)>14*60)throw new Error('Invalid UTC offset');
 return new Date(instant.getTime()+utcOffsetMinutes*60000).toISOString().slice(0,10);
}
/** The device's current local day, following its time zone and daylight-saving rules at that instant. */
export function deviceLocalDay(now:Date=new Date()):string{return localDayAt(now,-now.getTimezoneOffset());}
