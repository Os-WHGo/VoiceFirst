/** Expo SQLite-backed adapter for the shared A0 persistence contract.
 * The core owns validation; this layer owns device I/O only.
 */
import Storage from 'expo-sqlite/kv-store';
import {type A0StoragePort} from '@voicefirst/core';
export const a0DeviceStorage: A0StoragePort={
 read:(key:string)=>Storage.getItem(key),
 write:async(key:string,value:string)=>{await Storage.setItem(key,value);},
 async compareAndWrite(key:string,expectedRaw:string|null,value:string):Promise<boolean>{
  // SDK57 runs the functional updater in an exclusive SQLite transaction.
  await Storage.setItem(key,(current:string|null)=>{
   if(current!==expectedRaw)throw new Error('A0_STORAGE_CONFLICT');
   return value;
  });
  return true;
 }
};
