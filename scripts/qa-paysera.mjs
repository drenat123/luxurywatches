import { PGlite } from '../audit-qa-runtime/node_modules/@electric-sql/pglite/dist/index.js';
import ts from 'typescript';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const db = new PGlite();
let checks = 0;
const check = () => { checks++; };
const compile = path => ts.transpileModule(fs.readFileSync(path,'utf8'), { compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},reportDiagnostics:true }).outputText;
const sharedUrl='data:text/javascript;base64,'+Buffer.from(compile('supabase/functions/_shared/paysera.ts')).toString('base64');
const helpers = await import(sharedUrl);
const env = {PAYSERA_PROJECT_ID:'12345',PAYSERA_SIGN_PASSWORD:'qa-only-password',PAYSERA_TEST_MODE:'0',SITE_URL:'https://luxurywatchesks.com'};
const config=helpers.paymentConfig(key=>env[key]);
const signed = (fields, password=env.PAYSERA_SIGN_PASSWORD) => {
 const data=Buffer.from(new URLSearchParams(fields).toString()).toString('base64').replaceAll('+','-').replaceAll('/','_');
 return new URLSearchParams({data,ss1:createHash('md5').update(data+password).digest('hex')});
};
const valid={projectid:'12345',orderid:'LW-TEST123456',amount:'4800',currency:'EUR',status:'1',test:'0'};
assert.equal(helpers.verifiedCallback(signed(valid),config).amount,4800);check();
for(const fields of [{...valid,amount:'47.00'},{...valid,currency:'USD'},{...valid,projectid:'9'},{...valid,test:'1'},{...valid,status:'9'},{...valid,payamount:'4800',paycurrency:'USD'},{...valid,payamount:'4800'}]){
 assert.throws(()=>helpers.verifiedCallback(signed(fields),config));check();
}
assert.throws(()=>helpers.verifiedCallback(signed(valid,'wrong-password'),config));check();
const duplicate=signed(valid);duplicate.append('data',duplicate.get('data'));
assert.throws(()=>helpers.verifiedCallback(duplicate,config));check();
assert.throws(()=>helpers.paymentConfig(key=>key==='PAYSERA_TEST_MODE'?undefined:env[key]));check();
const link=new URL(helpers.paymentLink(valid,env.PAYSERA_SIGN_PASSWORD));
assert.equal(link.origin,'https://www.paysera.com');
assert.equal(link.searchParams.get('sign'),createHash('md5').update(link.searchParams.get('data')+env.PAYSERA_SIGN_PASSWORD).digest('hex'));check();
assert.equal(helpers.cents('52.99'),5299);check();
assert.throws(()=>helpers.cents(-1));check();
try {
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE SCHEMA auth;
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT auth.jwt()->>'role' $$;`);
 for(const file of ['20260908111249_create_ecommerce_schema.sql','20260910120000_add_supplier_catalog_fields.sql','20260910130000_harden_orders_checkout.sql','20260918180000_supplier_order_workflow.sql','20260918183000_admin_order_access.sql','20260919160000_validate_checkout_prices.sql','20260919173000_enable_paysera_after_stock.sql','20260921120000_secure_paysera_payments.sql']){
  await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
 }
 await db.exec(fs.readFileSync('supabase/migrations/20260921120000_secure_paysera_payments.sql','utf8'));check();
 await db.exec(`GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
 GRANT SELECT,UPDATE ON orders TO authenticated;
 CREATE TABLE qa_events (order_id uuid, payment_status text, supplier_status text);
 CREATE FUNCTION qa_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN INSERT INTO qa_events VALUES (NEW.id,NEW.payment_status,NEW.supplier_status); RETURN NEW; END $$;
 CREATE TRIGGER qa_event AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION qa_event();`);
 const pid='11111111-1111-4111-8111-111111111111';
 await db.query('INSERT INTO products(id,name,brand,image,price) VALUES($1,$2,$3,$4,45)',[pid,'QA Watch','QA','/qa.jpg']);
 let index=0;
 async function newOrder(extra={}){
  const row={id:crypto.randomUUID(),order_number:'LW-QATEST'+String(++index).padStart(6,'0'),customer_name:'QA Customer',email:'qa@example.invalid',phone:'+38344123456',address:'QA Street 1',city:'Pejë',payment_method:'paysera',status:'pending_supplier_check',supplier_status:'pending_supplier_check',items:JSON.stringify([{id:pid,quantity:1}]),subtotal:45,shipping:3,total:48,...extra};
  const keys=Object.keys(row);await db.query(`INSERT INTO orders (${keys.join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')})`,keys.map(k=>row[k]));
  return row;
 }
 const claims=async(role)=>db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({role,email:'dreninallbani@gmail.com'})]);
 const prepare=async(o,test=false)=>{await claims('service_role');return (await db.query('SELECT prepare_paysera_payment($1,$2,$3,$4) AS result',[o.id,4800,helpers.paymentLink({...valid,orderid:o.order_number,test:test?'1':'0'},env.PAYSERA_SIGN_PASSWORD),test])).rows[0].result;};
 const callback=async(o,status='1',test=false,amount=4800)=>{await claims('service_role');return (await db.query('SELECT record_paysera_callback($1,$2,$3,$4,$5) AS result',[o.order_number,amount,'EUR',status,test])).rows[0].result;};
 const get=async(o)=>(await db.query('SELECT * FROM orders WHERE id=$1',[o.id])).rows[0];
 const count=async(o)=>(await db.query('SELECT count(*)::int AS n FROM qa_events WHERE order_id=$1',[o.id])).rows[0].n;
 const o=await newOrder();const prepared=await prepare(o);
 assert.equal(prepared.payment_status,'awaiting_payment');assert.equal(prepared.supplier_status,'awaiting_payment');check();
 await prepare(o);assert.equal(await count(o),1);check();
 await assert.rejects(()=>callback(o,'1',false,4500));check();
 await assert.rejects(()=>callback(o,'1',true));check();
 assert.equal(await callback(o,'2'),'pending');assert.equal((await get(o)).payment_status,'awaiting_payment');check();
 const before=await count(o);
 await Promise.all([callback(o),callback(o)]);
 assert.equal(await count(o),before+1);assert.equal((await get(o)).payment_status,'paid');check();
 await callback(o,'0');assert.equal((await get(o)).payment_status,'paid');assert.equal(await count(o),before+1);check();
 const testOrder=await newOrder();await prepare(testOrder,true);
 assert.equal(await callback(testOrder,'1',true),'test_recorded');
 assert.equal((await get(testOrder)).payment_status,'test_paid');assert.equal((await get(testOrder)).paid_at,null);
 assert.equal((await get(testOrder)).supplier_status,'awaiting_payment');check();
 const cancelled=await newOrder();await prepare(cancelled);
 await claims('authenticated');await db.query("UPDATE orders SET supplier_status='cancelled',status='cancelled' WHERE id=$1",[cancelled.id]);
 assert.equal(await callback(cancelled),'review_required');
 assert.equal((await get(cancelled)).supplier_status,'cancelled');assert.equal((await get(cancelled)).payment_status,'paid_review');check();
 const unpaid=await newOrder();await prepare(unpaid);await claims('authenticated');
 await assert.rejects(()=>db.query("UPDATE orders SET payment_status='paid',paid_at=now() WHERE id=$1",[unpaid.id]));check();
 await assert.rejects(()=>db.query("UPDATE orders SET supplier_status='shipped' WHERE id=$1",[unpaid.id]));check();
 await assert.rejects(()=>db.query("UPDATE orders SET total=1 WHERE id=$1",[unpaid.id]));check();
 await assert.rejects(()=>newOrder({paysera_test_mode:true}));check();
 await assert.rejects(()=>newOrder({payment_status:'paid'}));check();
 const noLink=await newOrder();await assert.rejects(()=>callback(noLink));check();
 const info=await newOrder();await prepare(info);assert.equal(await callback(info,'3'),'paid');check();
 await db.exec('SET ROLE authenticated');await claims('authenticated');
 await assert.rejects(()=>db.query('SELECT record_paysera_callback($1,4800,\'EUR\',\'1\',false)',[unpaid.order_number]),/permission denied/);check();
 await assert.rejects(()=>db.query('SELECT prepare_paysera_payment($1,4800,\'https://www.paysera.com/pay/?data=x\',false)',[unpaid.id]),/permission denied/);check();
 await db.exec('RESET ROLE');
 for(const [price,shipping,total] of [[45,3,48],[49.99,3,52.99],[50,0,50],[70,0,70]]){
  await db.query('UPDATE products SET price=$1 WHERE id=$2',[price,pid]);
  const row=await newOrder({subtotal:price,shipping,total});assert.equal(Number((await get(row)).total),total);check();
 }
 // Execute the real callback handler with a fake Supabase transport, never a live service.
 let handler;let rpcCalls=0;let rpcError=null;
 globalThis.Deno={env:{get:key=>({...env,SUPABASE_URL:'https://qa.invalid',SUPABASE_SERVICE_ROLE_KEY:'qa'})[key]},serve:fn=>{handler=fn;}};
 globalThis.__qaClient=()=>({rpc:async()=>{rpcCalls++;return {error:rpcError};}});
 const code=compile('supabase/functions/paysera-callback/index.ts')
  .replace(/import \{ createClient \} from '[^']+';/,"const createClient = globalThis.__qaClient;")
  .replace("'../_shared/paysera.ts'",JSON.stringify(sharedUrl));
 await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 let response=await handler(new Request('https://qa.invalid?'+signed(valid)));assert.equal(response.status,200);assert.equal(await response.text(),'OK');check();
 response=await handler(new Request('https://qa.invalid?'+signed(valid,'wrong')));assert.equal(response.status,400);assert.equal(rpcCalls,1);check();
 rpcError={code:'test_error'};response=await handler(new Request('https://qa.invalid?'+signed(valid)));assert.equal(response.status,500);check();
 response=await handler(new Request('https://qa.invalid',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}));assert.equal(response.status,415);check();
 rpcError=null;response=await handler(new Request('https://qa.invalid',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:signed(valid)}));assert.equal(response.status,200);check();

 // Execute the real administrator endpoint with isolated auth/database transports.
 let paymentRow={id:'22222222-2222-4222-8222-222222222222',order_number:'LW-TEST123456',payment_method:'paysera',payment_status:'unpaid',supplier_status:'pending_supplier_check',total:'48.00',email:'qa@example.invalid'};
 let authenticated=true;let preparations=0;let preparePayload;
 globalThis.__qaClient=()=>({
  auth:{getUser:async()=>({data:{user:authenticated?{email:'dreninallbani@gmail.com'}:null},error:authenticated?null:{message:'Expired'}})},
  from:()=>({select:()=>({eq:()=>({single:async()=>({data:paymentRow,error:null})})})}),
  rpc:async(name,args)=>{preparations++;preparePayload=args;return {data:{...paymentRow,supplier_status:'awaiting_payment',paysera_payment_url:args.p_url,payment_status:'awaiting_payment'},error:null};}
 });
 const paymentCode=compile('supabase/functions/paysera-payment/index.ts')
  .replace(/import \{ createClient \} from '[^']+';/,"const createClient = globalThis.__qaClient;")
  .replace("'../_shared/paysera.ts'",JSON.stringify(sharedUrl));
 await import('data:text/javascript;base64,'+Buffer.from(paymentCode).toString('base64'));
 const adminRequest=(origin='https://luxurywatchesks.com',token='qa-token')=>new Request('https://qa.invalid',{method:'POST',headers:{origin,'Content-Type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify({order_id:paymentRow.id})});
 response=await handler(adminRequest());assert.equal(response.status,200);assert.equal(preparePayload.p_amount,4800);assert.equal(preparePayload.p_test,false);check();
 const paidLink=new URL(preparePayload.p_url);const fields=new URLSearchParams(Buffer.from(paidLink.searchParams.get('data').replaceAll('-','+').replaceAll('_','/'),'base64').toString());
 assert.equal(fields.get('amount'),'4800');assert.equal(fields.get('orderid'),paymentRow.order_number);assert.equal(fields.get('test'),'0');check();
 response=await handler(adminRequest('https://untrusted.invalid'));assert.equal(response.status,403);assert.equal(preparations,1);check();
 response=await handler(adminRequest(undefined,''));assert.equal(response.status,401);check();
 authenticated=false;response=await handler(adminRequest());assert.equal(response.status,401);check();authenticated=true;
 paymentRow={...paymentRow,payment_status:'paid'};
 response=await handler(adminRequest());assert.equal(response.status,409);assert.equal(preparations,1);check();
 paymentRow={...paymentRow,payment_status:'unpaid',supplier_status:'cancelled'};
 response=await handler(adminRequest());assert.equal(response.status,409);check();
 response=await handler(new Request('https://qa.invalid',{method:'OPTIONS',headers:{origin:'https://luxurywatchesks.com'}}));assert.equal(response.status,204);assert.equal(response.headers.get('access-control-allow-origin'),'https://luxurywatchesks.com');check();

 console.log('PASS: '+checks+' Paysera validation, database, permission, shipping and callback-handler checks. No live orders, payments or emails were sent.');
} finally {await db.close();}
