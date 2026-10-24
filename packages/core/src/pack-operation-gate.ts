/** Per-pack, in-process single-flight guard.
 * Does not provide cross-process or crash-persistent locking.
 */
export class PackOperationGate {
 private readonly active=new Set<string>();
 async run<T>(id:string,operation:()=>Promise<T>):Promise<{status:'busy'}|{status:'ok';value:T}>{
  if(typeof id!=='string'||!/^[a-z0-9][a-z0-9._-]{0,99}$/.test(id)||this.active.has(id))return {status:'busy'};
  this.active.add(id);
  try{return {status:'ok',value:await operation()};}
  finally{this.active.delete(id);}
 }
}
