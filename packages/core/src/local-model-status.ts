/** Conservative on-device model inventory interpretation. Installed exact locale
 * means the OS reports it downloaded, not that microphone routing or ASR is tested.
 */
export type LocalModelState='installed'|'missing'|'unknown';
export function localModelState(locale:string,inventory:unknown):LocalModelState {
 if(typeof locale!=='string'||!locale.trim()||!inventory||typeof inventory!=='object')return 'unknown';
 const x=inventory as {locales?:unknown;installedLocales?:unknown};
 if(!Array.isArray(x.locales)||!Array.isArray(x.installedLocales)||
    x.locales.some(v=>typeof v!=='string')||x.installedLocales.some(v=>typeof v!=='string'))return 'unknown';
 const lang=locale.toLowerCase();
 if(x.installedLocales.some(v=>(v as string).toLowerCase()===lang))return 'installed';
 // Devices may omit installed locale data or report a different recognizer.
 // Only call it missing when this exact locale is explicitly supported by the service.
 if(x.locales.some(v=>(v as string).toLowerCase()===lang))return 'missing';
 return 'unknown';
}
