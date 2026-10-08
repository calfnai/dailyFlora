import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, reference, result } from './helpers/cloudHarness.mjs';

test('unverified allowlisted email cannot become an administrator; disabled accounts cannot log in', async()=>{
  const h=harness(), user=await h.seed('reserved@example.test');
  assert.equal((await h.request('adminSummary',{},user.token)).status,403);
  await h.db.collection('dailyflora-beta-users').doc(user.user.id).update({disabledAt:new Date()});
  assert.equal((await h.request('login',{email:user.user.email,password:'TestPassword-20261001'})).status,401);
});
test('invalid image and zero balance fail before upload and reservation',async()=>{
  const h=harness(), user=await h.seed();
  assert.equal((await h.request('createReferenceTask',{...reference,referenceDataUrl:'data:image/webp;base64,YWJj'},user.token)).status,400);
  assert.equal(h.table('dailyflora-beta-tasks').length,0);
  await h.db.collection('dailyflora-beta-point-accounts').where({userId:user.user.id}).update({balance:0});
  assert.equal((await h.request('createReferenceTask',reference,user.token)).status,402);
  assert.equal(h.files.size,0);
});
test('10 simultaneous submissions reserve once, preserve files and charge once',async()=>{
  const h=harness(), user=await h.seed();
  const replies=await Promise.all(Array.from({length:10},()=>h.request('createReferenceTask',reference,user.token)));
  assert.ok(replies.every(r=>r.status===200),JSON.stringify(replies));
  assert.equal(h.table('dailyflora-beta-tasks').length,1);
  assert.equal(h.files.size,2);
  assert.equal(h.table('dailyflora-beta-point-accounts')[0].balance,20);
  assert.equal(h.table('dailyflora-beta-points-ledger').length,1);
});
async function claimed(h){ const member=await h.seed(),admin=await h.seed('admin@example.test','admin'); const task=await h.request('createReferenceTask',reference,member.token); const batch=await h.request('adminCreateWorkerBatch',{},admin.token);return {member,admin,task:task.task,batch:batch.batch}; }
test('simultaneous complete/fail yields one terminal outcome and a matching balance',async()=>{
  const h=harness(),{member,task,batch}=await claimed(h);
  await Promise.all([h.request('workerCompleteTask',{batchToken:batch.token,taskId:task.id,result}),h.request('workerFailTask',{batchToken:batch.token,taskId:task.id,errorMessage:'test failure'})]);
  const saved=h.table('dailyflora-beta-tasks')[0], account=h.table('dailyflora-beta-point-accounts').find(a=>a.userId===member.user.id);
  assert.equal(h.table('dailyflora-beta-generations').length,saved.status==='completed'?1:0);
  assert.equal(account.balance,saved.status==='completed'?20:30);
});
test('repeated completion has one generation, public rendering parameters and no private rename',async()=>{
  const h=harness(),{member,task,batch}=await claimed(h);
  const replies=await Promise.all(Array.from({length:8},()=>h.request('workerCompleteTask',{batchToken:batch.token,taskId:task.id,result})));
  assert.ok(replies.every(r=>r.status===200),JSON.stringify(replies));
  assert.equal(h.table('dailyflora-beta-generations').length,1);
  const generation=h.table('dailyflora-beta-generations')[0];
  await h.request('renameGeneration',{generationId:generation.id,name:'新私人名称'},member.token);
  const publicResult=await h.request('getPublicGeneration',{publicId:generation.publicId});
  assert.equal(publicResult.generation.renderParams.spread,1.3);
  assert.deepEqual(publicResult.generation.colors,['#ff0000']);
  assert.notEqual(publicResult.generation.name,'新私人名称');
  assert.equal(publicResult.generation.userId,undefined);
  await h.request('deleteGeneration',{generationId:generation.id},member.token);
  assert.equal((await h.request('getPublicGeneration',{publicId:generation.publicId})).status,404);
  assert.equal(h.table('dailyflora-beta-tasks')[0].publicId,null);
});
test('expired lease is recovered by dashboard exactly once without worker credentials',async()=>{
  const h=harness(),{member,task}=await claimed(h);
  await h.db.collection('dailyflora-beta-tasks').where({id:task.id}).update({workerBatchExpiresAt:new Date(Date.now()-1000)});
  await Promise.all([h.request('memberDashboard',{},member.token),h.request('memberDashboard',{},member.token)]);
  const saved=h.table('dailyflora-beta-tasks')[0];
  assert.equal(saved.status,'failed');assert.ok(saved.refundedAt);
  assert.equal(h.table('dailyflora-beta-point-accounts').find(a=>a.userId===member.user.id).balance,30);
  assert.equal(h.table('dailyflora-beta-points-ledger').filter(a=>a.type==='generation-refund').length,1);
});
test('manual grants reject missing users and deduplicate a reference with operator audit',async()=>{
  const h=harness(),admin=await h.seed('admin@example.test','admin'), member=await h.seed();
  const input={userId:member.user.id,amount:20,reason:'Payment checked',idempotencyKey:'bank-ref-1'};
  assert.equal((await h.request('adminGrantPoints',{...input,userId:'missing'},admin.token)).status,404);
  await Promise.all(Array.from({length:5},()=>h.request('adminGrantPoints',input,admin.token)));
  assert.equal(h.table('dailyflora-beta-point-accounts').find(a=>a.userId===member.user.id).balance,50);
  assert.equal(h.table('dailyflora-beta-points-ledger')[0].operatorId,admin.user.id);
  assert.equal((await h.request('adminGrantPoints',{...input,amount:100},admin.token)).status,409);
});
test('favorites and dashboard paginate past 100 records',async()=>{
  const h=harness(),member=await h.seed();
  for(let i=0;i<125;i++) await h.request('saveFavorite',{favorite:{id:`f-${i}`,date:'2026-10-01',seed:`${i}`}},member.token);
  assert.equal((await h.request('listFavorites',{offset:100},member.token)).favorites.length,25);
  const page=await h.request('memberDashboard',{offset:100},member.token);
  assert.equal(page.snapshot.favorites.length,25);assert.equal(page.snapshot.hasMore,false);
});
test('password reset revokes every prior session and consumes its token',async()=>{
  const h=harness(),member=await h.seed();
  const crypto=await import('node:crypto');
  await h.db.collection('dailyflora-beta-resets').add({userId:member.user.id,tokenHash:crypto.createHash('sha256').update('reset-test').digest('hex'),expiresAt:new Date(Date.now()+60000)});
  const reset=await h.request('resetPassword',{token:'reset-test',password:'NewPassword-20261001'});
  assert.equal(reset.status,200,JSON.stringify(reset));
  assert.equal((await h.request('me',{},member.token)).status,401);
  assert.equal((await h.request('me',{},reset.token)).status,200);
  assert.notEqual((await h.request('resetPassword',{token:'reset-test',password:'OtherPassword-20261001'})).status,200);
});
