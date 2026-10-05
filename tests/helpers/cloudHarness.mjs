// Logic-level regression adapter. This is not evidence of deployed database behavior.
import vm from 'node:vm';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
const code = readFileSync(new URL('../../dailyflora-cloud/uniCloud-aliyun/cloudfunctions/dailyflora-api-beta/index.js', import.meta.url), 'utf8');
export function harness() {
  let tables = new Map(), serial = 0, transactions = Promise.resolve();
  const files = new Map();
  const read = (row, key) => key.split('.').reduce((v, k) => v?.[k], row);
  const command = Object.fromEntries(['gt','gte','lt','exists','in','inc'].map(op => [op, value => ({op,value})]));
  const table = name => { if (!tables.has(name)) tables.set(name, []); return tables.get(name); };
  const match = (row, query) => Object.entries(query).every(([key, expected]) => {
    const value = read(row, key);
    if (!expected?.op) return value === expected;
    return ({ gt: () => value > expected.value, gte: () => value >= expected.value, lt: () => value < expected.value,
      exists: () => (value !== undefined) === expected.value, in: () => expected.value.includes(value) })[expected.op]?.();
  });
  function collection(name, query = {}, sort = [], offset = 0, limit = 1000, single = false, tx = false) {
    const rows = () => {
      let result = table(name).filter(row => match(row, query));
      for (const [key, direction] of sort) result.sort((a,b) => (read(a,key) > read(b,key) ? 1 : read(a,key) < read(b,key) ? -1 : 0) * (direction === 'desc' ? -1 : 1));
      return result.slice(offset, offset + limit);
    };
    return {
      where: next => collection(name, {...query,...next}, sort, offset, limit, false, tx),
      doc: id => collection(name, {_id:id}, sort, 0, 1, true, tx),
      orderBy: (key,dir) => collection(name, query, [...sort,[key,dir]], offset, limit, single, tx),
      skip: value => collection(name, query, sort, value, limit, single, tx),
      limit: value => collection(name, query, sort, offset, value, single, tx),
      get: async () => ({data: structuredClone(single && tx ? rows()[0] || null : rows())}),
      count: async () => ({total: rows().length}),
      add: async record => {
        const item = structuredClone({...record, _id: record._id || `test-${++serial}`});
        if (table(name).some(row => row._id === item._id)) throw Error('duplicate key');
        table(name).push(item); return {id:item._id};
      },
      update: async patch => {
        const selected = rows();
        for (const row of selected) for (const [key,value] of Object.entries(patch)) {
          const path = key.split('.'), end = path.pop(); let node = row;
          for (const part of path) node = node[part] ||= {};
          node[end] = value?.op === 'inc' ? (node[end] || 0) + value.value : structuredClone(value);
        }
        return {updated:selected.length};
      },
      remove: async () => { const selected = rows(); tables.set(name, table(name).filter(row => !selected.includes(row))); return {deleted:selected.length}; }
    };
  }
  const db = {command, collection, runTransaction: callback => {
    const result = transactions.then(async () => {
      const backup = structuredClone(tables);
      try { return await callback({ collection: name => collection(name,{},[],0,1000,false,true) }); }
      catch (error) { tables = backup; throw error; }
    });
    transactions = result.catch(() => {}); return result;
  }};
  const cloud = {database:()=>db, uploadFile:async ({cloudPath,fileContent}) => { files.set(cloudPath,fileContent); return {fileID:cloudPath}; },
    deleteFile:async ({fileList}) => { fileList.forEach(id=>files.delete(id)); return {fileList:fileList.map(fileID=>({fileID,code:'SUCCESS'}))}; },
    getTempFileURL:async ({fileList}) => ({fileList:fileList.map(id=>({tempFileURL:`https://private.example/${id}`}))}),
    httpclient:{request:async()=>({status:200,data:{}})} };
  const context=vm.createContext({require:name=>{if(name==='crypto')return crypto;throw Error(name);},uniCloud:cloud,exports:{},Buffer,Date,process:{env:{DAILYFLORA_BETA_ADMIN_EMAILS:'reserved@example.test',DIRECTMAIL_ACCESS_KEY_ID:'test',DIRECTMAIL_ACCESS_KEY_SECRET:'test',DIRECTMAIL_ACCOUNT_NAME:'test'}},console});
  vm.runInContext(code,context);
  const request=async(action,body={},token='')=>{const result=await context.exports.main({httpMethod:'POST',headers:{},body:JSON.stringify({action,token,...body})}); return {status:result.statusCode,...JSON.parse(result.body)};};
  const seed=async(email='member@example.test',role='user',balance=30)=>{
    const user=await request('register',{email,name:'测试用户',password:'TestPassword-20261001',termsVersion:'test'});
    if (!user.user) throw Error(JSON.stringify(user));
    await collection('dailyflora-beta-users').doc(user.user.id).update({role});
    await collection('dailyflora-beta-point-accounts').where({userId:user.user.id}).update({balance});
    return user;
  };
  return {request,seed,table,db,files,context};
}
// Actual browser-compatible 1x1 WebP; no real customer image is used.
const image='data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
export const reference={idempotencyKey:'one-task',referenceDataUrl:image,thumbnailDataUrl:image,bouquetName:'私人名字',style:'air',preference:'red'};
export const result={title:'Red flowers',summary:'Red arrangement',flowers:['Rose'],colors:['#ff0000'],seed:'stable-red',themeId:'dewberry-morning',renderParams:{density:'high',render:'high',spread:1.3,height:1.2,airiness:0.7}};
