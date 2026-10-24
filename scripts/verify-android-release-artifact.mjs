#!/usr/bin/env node
/** CLI adapter for real Android SDK tool output. No APK compilation is performed. */
import {readFileSync} from 'node:fs';
import {inspectReleaseApk} from './android-release-artifact-policy.mjs';
const files=process.argv.slice(2);
if(files.length!==4){console.error('Usage: node scripts/verify-android-release-artifact.mjs entries.txt signature.txt badging.txt manifest.txt');process.exit(2);}
const [entries,signature,packageBadging,manifest]=files.map(path=>readFileSync(path,'utf8'));
const result=inspectReleaseApk({entries:entries.split(/\r?\n/).filter(Boolean),signature,packageBadging,manifest});
console.log(JSON.stringify(result,null,2));
if(!result.ok)process.exitCode=1;
