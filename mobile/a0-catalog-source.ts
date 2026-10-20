/** Strict runtime boundary for A0 authored catalogs. Never silently fall back to a partial course. */
import {loadA0CandidateCatalog,type A0CatalogLoad} from '@voicefirst/core';
export interface A0CatalogSource {id:string;read():unknown}
export type A0CatalogState=
 | {kind:'candidate';sourceId:string;catalog:Extract<A0CatalogLoad,{kind:'candidate'}>}
 | {kind:'blocked';sourceId:string;issues:readonly {path:string;code:string}[]};
export function readA0CatalogSource(source:A0CatalogSource):A0CatalogState {
 try {
  const catalog=loadA0CandidateCatalog(source.read());
  return catalog.kind==='candidate'
   ?{kind:'candidate',sourceId:source.id,catalog}
   :{kind:'blocked',sourceId:source.id,issues:catalog.issues};
 } catch {
  return {kind:'blocked',sourceId:source.id,issues:[{path:'$',code:'SOURCE_READ_FAILED'}]};
 }
}
