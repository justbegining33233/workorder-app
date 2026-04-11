#!/usr/bin/env node
const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(({default: f}) => f(...args)));
const io = require('socket.io-client');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const SOCKET_FALLBACK = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

const jwt = require('jsonwebtoken');

async function login(path, body){
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(body) });
  const text = await res.text();
  let json=null;
  try{ json = JSON.parse(text); } catch(e){}
  let decoded = null;
  if (json && json.accessToken) {
    try { decoded = jwt.decode(json.accessToken); } catch (err) {}
  }
  return { status: res.status, body: json || text, decoded };
}

async function test(){
  console.log('Starting quick E2E checks');

  const users = [
    { name: 'admin', path: '/api/auth/admin', creds: { username: 'admin1006', password: '10062001' }, check: '/api/admin/users' },
    { name: 'shop', path: '/api/auth/shop', creds: { username: 'ras', password: 'password123' }, check: '/api/shop/team' },
    { name: 'tech', path: '/api/auth/tech', creds: { username: 'man1@gmail.com', password: 'password123' }, check: '/api/tech/profile' },
  ];

  for(const u of users){
    try{
      console.log(`\n== Testing ${u.name} login ==`);
      const r = await login(u.path, u.creds);
      console.log('Login status', r.status);
      if(r.status===200 && r.body && r.body.accessToken){
        console.log('Access token present for', u.name);
        const token = r.body.accessToken;

        // Try a representative protected endpoint
        try{
          let checkUrl = `${BASE}${u.check}`;
          // For shop, append shopId query if available
          if(u.name === 'shop'){
            const shopId = r.decoded?.id || (r.body && r.body.id);
            if(shopId) checkUrl = `${checkUrl}?shopId=${shopId}`;
          }
          // For tech, use /api/techs/{id}
          if(u.name === 'tech'){
            const techId = r.decoded?.id || (r.body && r.body.id);
            if(techId) checkUrl = `${BASE}/api/techs/${techId}`;
          }

          const p = await fetch(checkUrl, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
          console.log(`Protected ${checkUrl} status:`, p.status);
          try{ console.log('Response snippet:', (await p.text()).substring(0,200)); }catch(e){}
        }catch(e){ console.error('Protected endpoint failed', e); }

        // Try socket connection to fallback (3001)
        console.log('Testing socket connection to fallback:', SOCKET_FALLBACK);
        await new Promise((resolve) => {
          const s = io(SOCKET_FALLBACK, { path: '/api/socket', auth: { token }, transports: ['websocket','polling'], reconnectionAttempts: 0, timeout:5000 });
          let done=false;
          s.on('connect', ()=>{ console.log(`Socket connected as ${u.name} id=${s.id}`); done=true; s.close(); resolve(); });
          s.on('connect_error', (err)=>{ if(!done){ console.error('Socket connect_error', err && err.message); done=true; s.close(); resolve(); } });
          setTimeout(()=>{ if(!done){ console.error('Socket connection timed out'); s.close(); resolve(); } }, 6000);
        });

      } else {
        console.error('Login failed or no token returned:', r.body);
      }
    } catch(e){ console.error('Error testing', u.name, e); }
  }

  console.log('\nQuick E2E checks completed');
}

test().catch(e=>{ console.error('Quick E2E script error', e); process.exit(1); });
