/** Pure npm audit regression assessment, reusable without network. */
export const BASELINE=Object.freeze({critical:0,high:15,moderate:7,low:0,total:22});
export const KNOWN_ADVISORIES=new Set([
 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
 'https://github.com/advisories/GHSA-86w9-cpqp-85rv',
 'https://github.com/advisories/GHSA-w5hq-g745-h8pq'
]);
export function assessAudit(audit){
 if(!audit||typeof audit!=='object'||!audit.vulnerabilities||!audit.metadata?.vulnerabilities)throw Error('Unexpected npm audit schema');
 const counts=audit.metadata.vulnerabilities;
 const reasons=[];
 for(const [level,max] of Object.entries(BASELINE)){
  if(!Number.isInteger(counts[level])||counts[level]<0)reasons.push('Missing/invalid count: '+level);
  else if(counts[level]>max)reasons.push(level+' increased from baseline '+max+' to '+counts[level]);
 }
 const advisoryUrls=new Set();
 for(const [name,v] of Object.entries(audit.vulnerabilities)){
  if(!Array.isArray(v.via))throw Error('Invalid via for '+name);
  for(const item of v.via){
   if(item&&typeof item==='object'){
    if(typeof item.url!=='string'||!item.url.startsWith('https://github.com/advisories/'))reasons.push('Unrecognized advisory URL for '+name);
    else advisoryUrls.add(item.url);
   }
  }
 }
 const unknown=[...advisoryUrls].filter(url=>!KNOWN_ADVISORIES.has(url)).sort();
 if(unknown.length)reasons.push('New advisory IDs: '+unknown.join(', '));
 return {ok:reasons.length===0,reasons,counts,advisoryUrls:[...advisoryUrls].sort(),baseline:BASELINE};
}
