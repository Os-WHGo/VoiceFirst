/** Read-only source-map provenance. This does not classify exploitability. */
const watched=['deepmerge','glob','minimatch','uuid','zod'];

export function inspectMobileBundleSources(sourceMaps){
 if(!Array.isArray(sourceMaps)||!sourceMaps.length)throw Error('No Metro source maps were generated');
 const found=new Set();
 let sourcesInspected=0;
 function visit(map){
  if(!map||typeof map!=='object')throw Error('Invalid Metro source map');
  if(Array.isArray(map.sections)){
   for(const section of map.sections)visit(section.map);
   return;
  }
  if(!Array.isArray(map.sources))throw Error('Missing Metro source list');
  for(const source of map.sources){
   if(typeof source!=='string')continue;
   sourcesInspected++;
   const path='/'+source.replaceAll('\\','/');
   for(const name of watched){
    if(path.includes('/node_modules/'+name+'/')||path.endsWith('/node_modules/'+name))found.add(name);
   }
  }
 }
 for(const map of sourceMaps)visit(map);
 if(sourcesInspected===0)throw Error('Source maps contain no module sources');
 return {mapsInspected:sourceMaps.length,sourcesInspected,
  advisoryPackagesInJsBundle:[...found].sort(),
  interpretation:'Only JS modules in temporary Metro source maps are inspected. Native code, build-time tooling and real exploitability are not established.'};
}
