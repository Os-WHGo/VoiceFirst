import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('A1 editor is mounted only inside development view',()=>{
 const app=readFileSync('mobile/App.tsx','utf8');
 const gate=app.indexOf('{__DEV__ && <View style={styles.mission}>');
 const mount=app.indexOf('<A1EditorialPractice known={nativeLanguage} target={target}/>');
 const end=app.indexOf('</View>}',gate);
 assert.ok(gate>=0&&mount>gate&&mount<end);
});
