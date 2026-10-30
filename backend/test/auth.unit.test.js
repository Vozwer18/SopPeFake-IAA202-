const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
process.env.JWT_SECRET = 'only-for-unit-tests-a-secret-longer-than-thirty-two-characters';
// Exercise the real JWT and authorization logic while replacing only DB I/O.
// This suite deliberately does not claim MySQL or Prisma integration coverage.
const dbPath = require.resolve('../src/config/database');
const state = { user: null, reads: 0, writes: [] };
const database = {
  users: {
    async findUnique({where}) { state.reads++; return state.user?.user_id === where.user_id ? state.user : null; },
    async create({data}) { state.writes.push(data); return {user_id:7,...data}; },
  },
  sellers: { async create({data}) { state.writes.push(data); return {seller_id:8,...data}; } },
  async $transaction(fn) { return fn(database); },
};
require.cache[dbPath] = { id:dbPath, filename:dbPath, loaded:true, exports:database };
const {requireAuth,requireRole,protectPage} = require('../src/middleware/auth.middleware');
const auth = require('../src/controllers/auth.controller');
const {accountInput} = require('../src/lib/accounts');

function response() {
  return {
    statusCode:200,
    status(code) {this.statusCode=code;return this;},
    json(body) {this.body=body;return this;},
    redirect(url) {this.statusCode=302;this.location=url;return this;},
  };
}
function user(overrides={}) {return {user_id:1,role:'customer',status:'active',sellers:null,...overrides};}
function token(payload={},options={}) {return jwt.sign({userId:1,...payload},process.env.JWT_SECRET,{algorithm:'HS256',expiresIn:'1h',...options});}
async function authorize(raw, {cookie=false}={}) {
  const req={headers:cookie?{cookie:'soppe_token='+raw}:{authorization:'Bearer '+raw}};
  const res=response();let nextCalled=false;let error;
  await requireAuth(req,res,e=>{nextCalled=true;error=e;});
  if(error) throw error;
  return {req,res,nextCalled};
}

test('JWT authentication and live account authorization',async t=>{
  await t.test('accepts a valid token but derives role and ownership from current database state',async()=>{
    state.user=user();
    const signed=token({role:'admin',sellerId:99});
    const first=await authorize(signed);
    assert.equal(first.nextCalled,true);
    assert.deepEqual(first.req.user,{userId:1,role:'customer',sellerId:null});
    state.user=user({role:'admin'});
    const changed=await authorize(signed);
    assert.equal(changed.req.user.role,'admin');
    state.user=user({status:'blocked'});
    const blocked=await authorize(signed);
    assert.equal(blocked.res.statusCode,401);
    assert.equal(blocked.nextCalled,false);
  });
  await t.test('rejects forged, expired, unsigned, and malformed-cookie tokens before database access',async()=>{
    state.user=user();
    const signed=token();
    const parts=signed.split('.');
    const forged=[parts[0],Buffer.from(JSON.stringify({userId:2,role:'admin'})).toString('base64url'),parts[2]].join('.');
    const expired=token({}, {expiresIn:-1});
    const unsigned=jwt.sign({userId:1},'',{algorithm:'none'});
    const wrongSecret=jwt.sign({userId:1},'another-test-secret-longer-than-thirty-two-characters',{algorithm:'HS256'});
    const before=state.reads;
    for(const raw of [forged,expired,unsigned,wrongSecret,'not-a-jwt']) {
      const result=await authorize(raw);
      assert.equal(result.res.statusCode,401);
      assert.equal(result.nextCalled,false);
    }
    assert.equal((await authorize('%broken',{cookie:true})).res.statusCode,401);
    assert.equal(state.reads,before);
  });
  await t.test('rejects deleted accounts and inactive, missing, or suspended seller profiles',async()=>{
    const signed=token();
    for(const u of [null,user({status:'pending'}),user({role:'seller'}),user({role:'seller',sellers:{seller_id:4,status:'pending'}}),user({role:'seller',sellers:{seller_id:4,status:'suspended'}})]) {
      state.user=u;
      assert.equal((await authorize(signed)).res.statusCode,401);
    }
    state.user=user({role:'seller',sellers:{seller_id:4,status:'active'}});
    assert.deepEqual((await authorize(signed)).req.user,{userId:1,role:'seller',sellerId:4});
  });
  await t.test('accepts HttpOnly-cookie token format and rejects noninteger user identities',async()=>{
    state.user=user();
    assert.equal((await authorize(encodeURIComponent(token()),{cookie:true})).nextCalled,true);
    const reads=state.reads;
    for(const userId of ['1',0,-1,1.5,null]) assert.equal((await authorize(token({userId}))).res.statusCode,401);
    assert.equal(state.reads,reads);
  });
  await t.test('API role and page guards block direct cross-panel access',async()=>{
    const res=response();let next=false;
    requireRole('admin')({user:{role:'customer'}},res,()=>{next=true;});
    assert.equal(res.statusCode,403);assert.equal(next,false);
    state.user=user();
    const req={headers:{authorization:'Bearer '+token()},originalUrl:'/admin-panel.html'};
    const wrong=response();await protectPage('admin')(req,wrong,()=>assert.fail('Cross-panel access passed'));
    assert.equal(wrong.location,'/user-panel.html');
    const guest=response();await protectPage('seller')({headers:{},originalUrl:'/seller-panel.html'},guest,()=>assert.fail('Guest passed'));
    assert.equal(guest.location,'/login.html?next=%2Fseller-panel.html');
  });
});

test('registration validation and password protection',async t=>{
  const input={username:'new_person',fullName:'New Person',email:'PERSON@example.test',password:'LongEnoughPassword123!',role:'customer'};
  await t.test('hashes passwords and normalizes email without returning credential data',async()=>{
    const data=await accountInput(input,['customer','seller']);
    assert.equal(data.email,'person@example.test');
    assert.notEqual(data.password_hash,input.password);
    assert.equal(await bcrypt.compare(input.password,data.password_hash),true);
    assert.equal(await bcrypt.compare('incorrect',data.password_hash),false);
    state.writes=[];
    const res=response();let error;
    await auth.register({body:input},res,e=>{error=e;});
    if(error) throw error;
    assert.equal(res.statusCode,201);
    assert.equal(res.body.data.role,'customer');
    assert.equal('password_hash' in res.body.data,false);
    assert.equal('password' in res.body.data,false);
    assert.match(state.writes[0].password_hash,/^\$2[aby]\$/);
  });
  await t.test('public registration cannot create admins and rejects weak/oversized credentials',async()=>{
    for(const body of [{...input,role:'admin'},{...input,password:'short'},{...input,password:'x'.repeat(73)},{...input,email:'invalid'},{...input,username:'space name'}]) {
      state.writes=[];const res=response();let error;
      await auth.register({body},res,e=>{error=e;});
      assert.equal(error?.status,400);
      assert.equal(state.writes.length,0);
    }
  });
  await t.test('public seller registration creates an approval-pending seller profile',async()=>{
    state.writes=[];const res=response();let error;
    await auth.register({body:{...input,role:'seller'}},res,e=>{error=e;});
    if(error) throw error;
    assert.equal(res.statusCode,201);
    assert.equal(state.writes[0].role,'seller');
    assert.equal(state.writes[1].status,'pending');
    assert.equal(state.writes[1].user_id,7);
  });
});
