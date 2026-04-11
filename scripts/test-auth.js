#!/usr/bin/env node
const http = require('http');
const https = require('https');
const { URL } = require('url');

const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

class CookieJar{
  constructor(){ this.map = {}; }
  setFromResponse(res){
    const sc = res.headers.raw()['set-cookie'];
    if(!sc) return;
    for(const cookie of sc){
      const [pair,...rest] = cookie.split(';').map(s=>s.trim());
      const [name,value] = pair.split('=');
      this.map[name] = value;
    }
  }
  getCookieHeader(){
    return Object.entries(this.map).map(([k,v])=>`${k}=${v}`).join('; ');
  }
  get(name){ return this.map[name]; }
}

async function waitFor(url, timeoutSec=30){
  const deadline = Date.now() + timeoutSec*1000;
  while(Date.now() < deadline){
    try{
      const r = await fetch(url, { method: 'GET' });
      if(r.ok) return true;
    }catch(e){}
    await sleep(1000);
  }
  return false;
}

async function testLogin({url, path, body}){
  const jar = new CookieJar();
  const full = `${url}${path}`;
  const res = await fetch(full, { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify(body) });
  const text = await res.text();
  jar.setFromResponse(res);
  return { status: res.status, body: text, jar };
}

async function postWithJar(url, path, jar, opts={}){
  const full = `${url}${path}`;
  const headers = Object.assign({}, opts.headers || {});
  const cookie = jar.getCookieHeader();
  if(cookie) headers['cookie'] = cookie;
  const res = await fetch(full, { method: opts.method || 'POST', headers, body: opts.body });
  const text = await res.text();
  jar.setFromResponse(res);
  return { status: res.status, body: text, headers: res.headers.raw(), jar };
}

(async ()=>{
  const base = process.env.BASE_URL || 'http://localhost:3000';
  console.log('Waiting for', base);
  const ok = await waitFor(base, 20);
  if(!ok){ console.error('Server not responding at', base); process.exit(2); }
  console.log('Server reachable — running auth tests');

  // Admin
  console.log('\n== Admin login test ==');
  const adminCreds = { username: 'admin1006', password: '10062001' };
  try{
    const login = await testLogin({ url: base, path: '/api/auth/admin', body: adminCreds });
    console.log('LOGIN status', login.status);
    console.log('LOGIN body', login.body);
    if(login.jar.get('refresh_id') && login.jar.get('refresh_sig') && login.jar.get('csrf_token')){
      console.log('Cookies set: refresh_id, refresh_sig, csrf_token present');
    } else {
      console.error('Missing expected cookies on admin login', Object.keys(login.jar.map));
    }

    const refresh = await postWithJar(base, '/api/auth/refresh', login.jar, { method: 'POST' });
    console.log('REFRESH status', refresh.status);
    console.log('REFRESH body', refresh.body);

    const csrf = login.jar.get('csrf_token') || '';
    const logout = await postWithJar(base, '/api/auth/logout', login.jar, { method: 'POST', headers: csrf ? { 'x-csrf-token': csrf } : {} });
    console.log('LOGOUT status', logout.status);
    console.log('LOGOUT body', logout.body);

  } catch(e){ console.error('Admin test failed', e); }

  // Customer (if exists)
  console.log('\n== Customer login test ==');
  try{
    const cust = await testLogin({ url: base, path: '/api/customers/login', body: { email: 'user@example.com', password: 'password' } });
    console.log('CUSTOMER LOGIN status', cust.status);
    console.log('CUSTOMER LOGIN body', cust.body);
  } catch(e){ console.error('Customer test error', e); }

  // Shop and tech are similar; attempt shop via /api/auth/shop
  console.log('\n== Shop login test ==');
  try{
    const shop = await testLogin({ url: base, path: '/api/auth/shop', body: { username: 'testshop', password: 'password' } });
    console.log('SHOP LOGIN status', shop.status);
    console.log('SHOP LOGIN body', shop.body);
  } catch(e){ console.error('Shop test error', e); }

  console.log('\nAuth tests completed — review outputs above.');
})();
