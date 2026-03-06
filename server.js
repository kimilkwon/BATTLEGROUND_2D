import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const app = express();
const http = createServer(app);
const io = new Server(http, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3001;

app.use(express.static(join(__dir, 'client')));

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const MAP  = 4000;
const TICK = 20;
const DT   = 1 / TICK;
const PR   = 14; // player radius

const WEAPONS = {
  pistol:  { dmg:25,  rate:380,  spd:820,  range:640,  ammo:'pistol',  mag:12,  rcl:3,  spr:0.05 },
  rifle:   { dmg:35,  rate:100,  spd:1000, range:900,  ammo:'rifle',   mag:30,  rcl:5,  spr:0.08 },
  sniper:  { dmg:120, rate:1500, spd:2000, range:2200, ammo:'sniper',  mag:5,   rcl:15, spr:0.01 },
  shotgun: { dmg:80,  rate:900,  spd:700,  range:300,  ammo:'shotgun', mag:6,   rcl:20, spr:0.3, pellets:8 },
  smg:     { dmg:20,  rate:75,   spd:920,  range:600,  ammo:'smg',     mag:45,  rcl:2,  spr:0.10 },
  lmg:     { dmg:28,  rate:110,  spd:960,  range:820,  ammo:'rifle',   mag:100, rcl:4,  spr:0.12 },
};

const ARMOR = {
  helmet1:{slot:'helmet',lv:1,red:0.30,dur:50 },
  helmet2:{slot:'helmet',lv:2,red:0.50,dur:100},
  helmet3:{slot:'helmet',lv:3,red:0.70,dur:180},
  vest1:  {slot:'vest',  lv:1,red:0.20,dur:80 },
  vest2:  {slot:'vest',  lv:2,red:0.40,dur:150},
  vest3:  {slot:'vest',  lv:3,red:0.60,dur:250},
};

const HEALS = {
  bandage:     { hp:25, maxHp:75,  ms:3000 },
  medkit:      { hp:75, maxHp:100, ms:8000 },
  energydrink: { hp:25, maxHp:100, ms:2000 },
  painkiller:  { hp:50, maxHp:100, ms:6000 },
};

const SCOPES = {
  scope2x: { mult:2,  vis:1.20 },
  scope4x: { mult:4,  vis:1.40 },
  scope8x: { mult:8,  vis:1.70 },
  scope12x:{ mult:12, vis:2.00 },
};

const GRENADES = {
  grenade:{ r:120, dmg:90,  fuse:2500 },
  smoke:  { r:150, dur:10000 },
  flash:  { r:200, dur:2500  },
};

const RELOAD_MS = { pistol:1500, rifle:2000, sniper:2500, shotgun:2200, smg:1800, lmg:3000 };

const ZONE_PHASES = [
  { wait:90000, shrink:30000, dmg:2  },
  { wait:60000, shrink:20000, dmg:5  },
  { wait:45000, shrink:15000, dmg:10 },
  { wait:30000, shrink:10000, dmg:20 },
  { wait:20000, shrink:10000, dmg:30 },
];

// ═══════════════════════════════════════════════════════════
// MAP OBSTACLES
// ═══════════════════════════════════════════════════════════
const OBSTACLES = (() => {
  const o = [];
  // City 1600-2350
  [[1650,1650,120,100],[1810,1650,100,100],[1950,1650,100,100],
   [1650,1800,80,80],  [1780,1800,120,80], [1950,1800,80,80],
   [1650,1930,200,80], [1900,1930,120,80], [2070,1650,100,220],
   [1560,1650,60,200], [1650,2060,180,80], [1880,2060,100,80],
   [2030,2060,80,80],  [1650,2190,260,80], [1960,2190,150,80],
   [2070,1920,80,100]].forEach(([x,y,w,h])=>o.push({x,y,w,h}));
  // Military base 3350-3800, 140-670
  [[3400,160,400,20],[3400,640,400,20],[3400,160,20,500],[3780,160,20,500],
   [3440,200,170,120],[3640,200,120,120],[3440,360,100,190],
   [3560,360,180,90], [3440,490,320,70]].forEach(([x,y,w,h])=>o.push({x,y,w,h}));
  // Scattered
  [[480,780,80,60],[600,780,60,60],[3180,1180,100,80],[780,2980,120,100],
   [2780,3180,80,80],[1180,2780,100,80],[380,2480,80,60],[3480,2980,100,80],
   [1480,480,80,60],[2480,380,120,80],[600,2000,80,80],[1000,1000,100,80],
   [2800,800,80,80],[1800,3400,100,80],[3000,2400,80,80],[400,3200,100,80],
   [2200,3200,80,80],[700,1600,80,60],[1400,3000,80,60],[2600,1400,80,80],
   [300,1400,100,60],[3600,2200,80,80],[1600,3600,80,60],[3000,600,100,80],
  ].forEach(([x,y,w,h])=>o.push({x,y,w,h}));
  return o;
})();

// ═══════════════════════════════════════════════════════════
// ITEM / MECHA GENERATION
// ═══════════════════════════════════════════════════════════
function genItems() {
  const pool = ['pistol','rifle','sniper','shotgun','smg','lmg',
    'helmet1','helmet2','helmet3','vest1','vest2','vest3',
    'bandage','medkit','energydrink','painkiller',
    'grenade','smoke','flash',
    'scope2x','scope4x','scope8x','scope12x',
    'ammo_pistol','ammo_rifle','ammo_sniper','ammo_shotgun','ammo_smg'];
  const items = [];
  let id = 0;
  for (let i = 0; i < 180; i++) {
    items.push({ id:id++, x:150+Math.random()*3700, y:150+Math.random()*3700,
      type:pool[Math.floor(Math.random()*pool.length)], taken:false });
  }
  // Military high-tier
  ['sniper','lmg','rifle','vest3','helmet3','scope8x','scope12x','medkit','grenade'].forEach(t=>{
    for(let i=0;i<6;i++)
      items.push({id:id++,x:3380+Math.random()*400,y:170+Math.random()*450,type:t,taken:false});
  });
  // City medium-tier
  ['rifle','shotgun','smg','vest2','helmet2','scope4x','medkit','bandage','pistol'].forEach(t=>{
    for(let i=0;i<5;i++)
      items.push({id:id++,x:1600+Math.random()*600,y:1600+Math.random()*600,type:t,taken:false});
  });
  return items;
}

function genMechas() {
  return [
    { id:0, x:3510, y:280, hp:300, maxHp:300, pilotId:null, timerEnd:0, cooldownEnd:0 },
    { id:1, x:3650, y:410, hp:300, maxHp:300, pilotId:null, timerEnd:0, cooldownEnd:0 },
  ];
}

// ═══════════════════════════════════════════════════════════
// GAME ROOM
// ═══════════════════════════════════════════════════════════
class Room {
  constructor(id) {
    this.id = id;
    this.players = new Map();
    this.bullets  = [];
    this.explosions = [];
    this.smokeAreas = [];
    this.flashQ   = [];
    this.items    = genItems();
    this.mechas   = genMechas();
    this.killFeed = [];
    this.state    = 'playing';
    // Safe zone
    this.sz = { cx:MAP/2, cy:MAP/2, r:MAP*0.48, ncx:MAP/2, ncy:MAP/2, nr:MAP*0.22 };
    this.phase = 0; this.shrinking = false; this.phaseMs = 0;
    this.ticker = setInterval(()=>this.tick(), 1000/TICK);
  }

  addPlayer(sid, name) {
    const idx  = this.players.size;
    const a    = (idx/8)*Math.PI*2;
    const dist = 900 + Math.random()*300;
    const x    = Math.max(PR+10, Math.min(MAP-PR-10, MAP/2+Math.cos(a)*dist));
    const y    = Math.max(PR+10, Math.min(MAP-PR-10, MAP/2+Math.sin(a)*dist));
    const p = {
      sid, name, x, y, angle:0, alive:true,
      hp:100, maxHp:100, helmet:null, vest:null,
      weapons:[{type:'pistol'},null], activeWeapon:0,
      mag:[WEAPONS.pistol.mag,0],
      ammo:{ pistol:36, rifle:60, sniper:10, shotgun:18, smg:90, lmg:100 },
      inventory:[], scope:null,
      recoil:0, lastShot:0, reloading:false, reloadEnd:0,
      inMecha:false, mechaId:null, stunEnd:0,
      input:{ up:false, down:false, left:false, right:false, sprint:false },
    };
    this.players.set(sid, p);
    return p;
  }

  removePlayer(sid) {
    const p = this.players.get(sid);
    if (p?.inMecha) { const m=this.mechas.find(m=>m.id===p.mechaId); if(m) m.pilotId=null; }
    this.players.delete(sid);
  }

  tick() {
    if (this.state !== 'playing') return;
    const now = Date.now();
    this._zone();
    this._move(now);
    this._bullets();
    this._effects(now);
    this._checkWin();
    this._broadcast();
  }

  _zone() {
    const pi = ZONE_PHASES[Math.min(this.phase, ZONE_PHASES.length-1)];
    this.phaseMs += 1000/TICK;
    if (!this.shrinking) {
      if (this.phaseMs >= pi.wait) { this.shrinking=true; this.phaseMs=0; this._planZone(); }
    } else {
      const spd = 1/(pi.shrink/(1000/TICK));
      this.sz.cx += (this.sz.ncx-this.sz.cx)*spd;
      this.sz.cy += (this.sz.ncy-this.sz.cy)*spd;
      this.sz.r  += (this.sz.nr -this.sz.r )*spd;
      if (this.phaseMs >= pi.shrink) {
        Object.assign(this.sz, {cx:this.sz.ncx,cy:this.sz.ncy,r:this.sz.nr});
        this.phase++; this.shrinking=false; this.phaseMs=0;
      }
    }
    const dmg = ZONE_PHASES[Math.min(this.phase,ZONE_PHASES.length-1)].dmg / TICK;
    for (const [sid,p] of this.players) {
      if (!p.alive) continue;
      if (Math.hypot(p.x-this.sz.cx, p.y-this.sz.cy) > this.sz.r) {
        p.hp -= dmg;
        if (p.hp <= 0) this._kill(sid, null, '블루존');
      }
    }
  }

  _planZone() {
    const nr = Math.max(80, this.sz.r*(0.38+Math.random()*0.18));
    const off = (this.sz.r-nr)*0.55;
    const a = Math.random()*Math.PI*2;
    const d = Math.random()*off;
    this.sz.ncx = Math.max(nr, Math.min(MAP-nr, this.sz.cx+Math.cos(a)*d));
    this.sz.ncy = Math.max(nr, Math.min(MAP-nr, this.sz.cy+Math.sin(a)*d));
    this.sz.nr  = nr;
  }

  _move(now) {
    for (const [, p] of this.players) {
      if (!p.alive) continue;
      p.recoil = Math.max(0, p.recoil-28*DT);
      if (p.reloading && now >= p.reloadEnd) {
        const w = p.weapons[p.activeWeapon];
        if (w) {
          const def = WEAPONS[w.type];
          const need = def.mag - p.mag[p.activeWeapon];
          const have = p.ammo[def.ammo]||0;
          const load = Math.min(need, have);
          p.mag[p.activeWeapon] += load;
          p.ammo[def.ammo] = have-load;
        }
        p.reloading = false;
      }
      if (p.inMecha) continue;
      const i = p.input;
      const spd = i.sprint ? 220 : 150;
      let dx=(i.right?1:0)-(i.left?1:0), dy=(i.down?1:0)-(i.up?1:0);
      const len = Math.hypot(dx,dy);
      if (len>0) {
        dx=dx/len*spd*DT; dy=dy/len*spd*DT;
        const nx=Math.max(PR,Math.min(MAP-PR,p.x+dx));
        const ny=Math.max(PR,Math.min(MAP-PR,p.y+dy));
        if (!this._obs(nx,p.y,PR)) p.x=nx;
        if (!this._obs(p.x,ny,PR)) p.y=ny;
      }
    }
    // Mecha movement
    for (const m of this.mechas) {
      if (!m.pilotId) continue;
      const p = this.players.get(m.pilotId);
      if (!p||!p.alive) { m.pilotId=null; continue; }
      if (m.timerEnd && now>m.timerEnd) { this._ejectMecha(m.pilotId); m.cooldownEnd=now+15000; continue; }
      const i=p.input, spd=105;
      let dx=(i.right?1:0)-(i.left?1:0), dy=(i.down?1:0)-(i.up?1:0);
      const len=Math.hypot(dx,dy);
      if (len>0) {
        dx=dx/len*spd*DT; dy=dy/len*spd*DT;
        const nx=Math.max(22,Math.min(MAP-22,p.x+dx));
        const ny=Math.max(22,Math.min(MAP-22,p.y+dy));
        if (!this._obs(nx,p.y,22)) { p.x=nx; m.x=nx; }
        if (!this._obs(p.x,ny,22)) { p.y=ny; m.y=ny; }
      } else { m.x=p.x; m.y=p.y; }
    }
  }

  _obs(x,y,r=PR) {
    if (x<r||y<r||x>MAP-r||y>MAP-r) return true;
    for (const o of OBSTACLES)
      if (x+r>o.x&&x-r<o.x+o.w&&y+r>o.y&&y-r<o.y+o.h) return true;
    return false;
  }

  _bullets() {
    const rem=[];
    for (let i=this.bullets.length-1;i>=0;i--) {
      const b=this.bullets[i];
      const steps=3;
      const sdx=b.vx*DT/steps, sdy=b.vy*DT/steps;
      let hit=false;
      for (let s=0;s<steps;s++) {
        b.x+=sdx; b.y+=sdy;
        if (b.x<0||b.x>MAP||b.y<0||b.y>MAP||this._obs(b.x,b.y,4)) { rem.push(i); hit=true; break; }
        for (const [sid,p] of this.players) {
          if (sid===b.sid||!p.alive) continue;
          const hr=p.inMecha?24:PR;
          if (Math.hypot(b.x-p.x,b.y-p.y)<hr) {
            let dmg=b.dmg;
            if (p.inMecha) {
              const m=this.mechas.find(m=>m.id===p.mechaId);
              if (m) {
                m.hp-=dmg*0.4;
                if (m.hp<=0) {
                  this._ejectMecha(sid);
                  this.explosions.push({x:p.x,y:p.y,r:160,dmg:60,sid:b.sid,t:Date.now(),done:false});
                  io.to(this.id).emit('explosion',{x:p.x,y:p.y,r:160});
                }
              }
            } else {
              if (p.vest) {
                const red=dmg*p.vest.red; p.vest.dur-=red*0.4;
                if(p.vest.dur<=0)p.vest=null; dmg-=red;
              }
              p.hp-=dmg;
              if (p.hp<=0) this._kill(sid,b.sid,b.type);
            }
            rem.push(i); hit=true; break;
          }
        }
        if (hit) break;
      }
      if (!hit) { b.life-=DT; if(b.life<=0) rem.push(i); }
    }
    for (let i=rem.length-1;i>=0;i--) this.bullets.splice(rem[i],1);
  }

  _effects(now) {
    for (let i=this.explosions.length-1;i>=0;i--) {
      const ex=this.explosions[i];
      if (!ex.done) {
        ex.done=true;
        for (const [sid,p] of this.players) {
          if(!p.alive) continue;
          const d=Math.hypot(p.x-ex.x,p.y-ex.y);
          if (d<ex.r) { p.hp-=ex.dmg*(1-d/ex.r); if(p.hp<=0)this._kill(sid,ex.sid,'grenade'); }
        }
      }
      if (now-ex.t>1500) this.explosions.splice(i,1);
    }
    for (let i=this.flashQ.length-1;i>=0;i--) {
      const f=this.flashQ[i];
      if (!f.done) {
        f.done=true;
        for (const [sid,p] of this.players) {
          if(!p.alive) continue;
          if (Math.hypot(p.x-f.x,p.y-f.y)<f.r) {
            p.stunEnd=now+2500;
            io.to(sid).emit('flash_hit',{ms:2500});
          }
        }
      }
      if (now-f.t>600) this.flashQ.splice(i,1);
    }
    for (let i=this.smokeAreas.length-1;i>=0;i--)
      if (now-this.smokeAreas[i].t>this.smokeAreas[i].dur) this.smokeAreas.splice(i,1);
  }

  shoot(sid,data) {
    const p=this.players.get(sid);
    if (!p||!p.alive||p.stunEnd>Date.now()) return;
    const now=Date.now();
    if (p.inMecha) {
      const m=this.mechas.find(m=>m.id===p.mechaId);
      if (!m||m.cooldownEnd>now) return;
      const a=data.angle+(Math.random()-0.5)*0.04;
      this.bullets.push({x:p.x+Math.cos(a)*28,y:p.y+Math.sin(a)*28,
        vx:Math.cos(a)*1400,vy:Math.sin(a)*1400,dmg:70,sid,type:'missile',life:3});
      return;
    }
    const w=p.weapons[p.activeWeapon];
    if (!w) return;
    const def=WEAPONS[w.type];
    if (now-p.lastShot<def.rate||p.reloading) return;
    if (p.mag[p.activeWeapon]<=0) { this.reload(sid); return; }
    p.lastShot=now; p.mag[p.activeWeapon]--;
    p.recoil=Math.min(42,p.recoil+def.rcl);
    const pellets=def.pellets||1;
    for (let i=0;i<pellets;i++) {
      const spr=def.spr+(p.recoil/42)*0.22;
      const a=data.angle+(Math.random()-0.5)*spr;
      const life=def.range/def.spd;
      this.bullets.push({x:p.x+Math.cos(a)*22,y:p.y+Math.sin(a)*22,
        vx:Math.cos(a)*def.spd,vy:Math.sin(a)*def.spd,dmg:def.dmg,sid,type:w.type,life});
    }
  }

  throwItem(sid,data) {
    const p=this.players.get(sid);
    if (!p||!p.alive) return;
    const idx=p.inventory.indexOf(data.type);
    if (idx<0) return;
    p.inventory.splice(idx,1);
    const def=GRENADES[data.type];
    if (!def) return;
    // Clamp landing distance
    const dx=data.x-p.x, dy=data.y-p.y;
    const dist=Math.min(Math.hypot(dx,dy),340);
    const a=Math.atan2(dy,dx);
    const lx=p.x+Math.cos(a)*dist, ly=p.y+Math.sin(a)*dist;
    setTimeout(()=>{
      if (data.type==='grenade') {
        this.explosions.push({x:lx,y:ly,r:def.r,dmg:def.dmg,sid,t:Date.now(),done:false});
        io.to(this.id).emit('explosion',{x:lx,y:ly,r:def.r});
      } else if (data.type==='smoke') {
        this.smokeAreas.push({x:lx,y:ly,r:def.r,t:Date.now(),dur:def.dur});
      } else if (data.type==='flash') {
        this.flashQ.push({x:lx,y:ly,r:def.r,t:Date.now(),done:false});
      }
    }, def.fuse||0);
  }

  pickup(sid,itemId) {
    const p=this.players.get(sid);
    if (!p||!p.alive) return;
    const item=this.items.find(i=>i.id===itemId&&!i.taken);
    if (!item||Math.hypot(p.x-item.x,p.y-item.y)>72) return;
    const t=item.type;
    if (WEAPONS[t]) {
      const slot=p.weapons.indexOf(null);
      if (slot>=0) { p.weapons[slot]={type:t}; p.mag[slot]=WEAPONS[t].mag; item.taken=true; }
      return;
    }
    if (ARMOR[t]) {
      const d=ARMOR[t];
      if (d.slot==='helmet') { if(!p.helmet||p.helmet.lv<d.lv){p.helmet={...d};item.taken=true;} }
      else { if(!p.vest||p.vest.lv<d.lv){p.vest={...d};item.taken=true;} }
      return;
    }
    if (SCOPES[t]) { p.scope={type:t,...SCOPES[t]}; item.taken=true; return; }
    if (HEALS[t]||GRENADES[t]) {
      if (p.inventory.length<6) { p.inventory.push(t); item.taken=true; } return;
    }
    if (t.startsWith('ammo_')) {
      const at=t.slice(5);
      p.ammo[at]=(p.ammo[at]||0)+({pistol:30,rifle:30,sniper:10,shotgun:12,smg:45}[at]||30);
      item.taken=true;
    }
  }

  useHeal(sid,type) {
    const p=this.players.get(sid);
    if (!p||!p.alive) return;
    const idx=p.inventory.indexOf(type);
    if (idx<0) return;
    const d=HEALS[type];
    if (!d||p.hp>=d.maxHp) return;
    p.inventory.splice(idx,1);
    p.hp=Math.min(p.maxHp, p.hp+d.hp);
  }

  reload(sid) {
    const p=this.players.get(sid);
    if (!p||p.reloading) return;
    const w=p.weapons[p.activeWeapon];
    if (!w) return;
    const def=WEAPONS[w.type];
    if ((p.ammo[def.ammo]||0)<=0) return;
    if (p.mag[p.activeWeapon]>=def.mag) return;
    p.reloading=true;
    p.reloadEnd=Date.now()+(RELOAD_MS[w.type]||2000);
    io.to(sid).emit('reloading',{ms:RELOAD_MS[w.type]||2000});
  }

  mechaInteract(sid) {
    const p=this.players.get(sid);
    if (!p||!p.alive) return;
    const now=Date.now();
    if (p.inMecha) { this._ejectMecha(sid); return; }
    for (const m of this.mechas) {
      if (m.pilotId||m.cooldownEnd>now||m.hp<=0) continue;
      if (Math.hypot(p.x-m.x,p.y-m.y)>65) continue;
      if (p.hp<=50) { io.to(sid).emit('msg','⚠️ HP가 너무 낮아 탑승 불가!'); return; }
      p.hp*=0.5; p.inMecha=true; p.mechaId=m.id;
      m.pilotId=sid; m.timerEnd=now+10000;
      io.to(sid).emit('mecha_on',{id:m.id,ends:m.timerEnd});
      return;
    }
  }

  _ejectMecha(sid) {
    const p=this.players.get(sid);
    if (!p) return;
    const m=this.mechas.find(m=>m.id===p.mechaId);
    p.inMecha=false; p.mechaId=null;
    if (m) m.pilotId=null;
    io.to(sid).emit('mecha_off');
  }

  _kill(sid,killSid,weapon) {
    const p=this.players.get(sid);
    if (!p||!p.alive) return;
    p.alive=false; p.hp=0;
    if (p.inMecha) this._ejectMecha(sid);
    const kname=killSid?this.players.get(killSid)?.name:null;
    const feed={victim:p.name,killer:kname,weapon,t:Date.now()};
    this.killFeed.unshift(feed);
    if (this.killFeed.length>8) this.killFeed.pop();
    io.to(this.id).emit('killed',feed);
    io.to(sid).emit('you_died',{killer:kname,weapon});
  }

  _checkWin() {
    const alive=[...this.players.values()].filter(p=>p.alive);
    if (this.players.size>=2&&alive.length<=1) {
      this.state='ended'; clearInterval(this.ticker);
      io.to(this.id).emit('game_over',{winner:alive[0]?.name||null});
    }
  }

  _broadcast() {
    const buls=this.bullets.slice(0,300).map(b=>({x:b.x,y:b.y,type:b.type}));
    const smokes=this.smokeAreas.map(s=>({x:s.x,y:s.y,r:s.r}));
    const mechas=this.mechas.map(m=>({id:m.id,x:m.x,y:m.y,hp:m.hp,maxHp:m.maxHp,pilotId:m.pilotId}));
    for (const [sid,me] of this.players) {
      const ps=[...this.players.values()].map(p=>({
        sid:p.sid,name:p.name,x:p.x,y:p.y,angle:p.angle,
        hp:p.hp,alive:p.alive,helmet:p.helmet?.lv||0,vest:p.vest?.lv||0,
        weapon:p.weapons[p.activeWeapon]?.type||null,inMecha:p.inMecha,recoil:p.recoil,
      }));
      // Only send items within vision range (700px) + all if minimap
      const vr=me.scope?(700*me.scope.vis):700;
      const nearItems=this.items.filter(i=>!i.taken&&Math.hypot(i.x-me.x,i.y-me.y)<vr+200);
      io.to(sid).emit('state',{
        players:ps, bullets:buls, mechas, smokes,
        items:nearItems.map(i=>({id:i.id,x:i.x,y:i.y,type:i.type})),
        allItems:this.items.filter(i=>!i.taken).map(i=>({id:i.id,x:i.x,y:i.y})),
        sz:this.sz, phase:this.phase, shrinking:this.shrinking,
        killFeed:this.killFeed.slice(0,5),
        myWeapons:me.weapons.map(w=>w?.type||null),
        myMag:me.mag, myAmmo:me.ammo, myInventory:me.inventory,
        myHp:me.hp, myMaxHp:me.maxHp,
        myHelmet:me.helmet?.lv||0, myVest:me.vest?.lv||0,
        myScope:me.scope?.type||null, reloading:me.reloading,
        mechaTimer:me.inMecha?(this.mechas.find(m=>m.id===me.mechaId)?.timerEnd||0)-Date.now():0,
        stunEnd:me.stunEnd,
      });
    }
  }

  destroy() { clearInterval(this.ticker); rooms.delete(this.id); }
}

// ═══════════════════════════════════════════════════════════
// MATCHMAKING
// ═══════════════════════════════════════════════════════════
const rooms = new Map();
const queue = [];

function startRoom(players) {
  const rid=Math.random().toString(36).slice(2,8).toUpperCase();
  const room=new Room(rid);
  rooms.set(rid, room);
  for (const {sid,name} of players) {
    const s=io.sockets.sockets.get(sid);
    if (!s) continue;
    s.join(rid); s.data.roomId=rid;
    const p=room.addPlayer(sid,name);
    s.emit('game_start',{roomId:rid,myId:sid,mapSize:MAP,obstacles:OBSTACLES,spawn:{x:p.x,y:p.y}});
  }
  io.to(rid).emit('msg',`🎮 게임 시작! 플레이어 ${players.length}명`);
}

io.on('connection', socket => {
  socket.on('join', ({name}) => {
    const i=queue.findIndex(p=>p.sid===socket.id);
    if (i>=0) queue.splice(i,1);
    queue.push({sid:socket.id, name:(name||'플레이어').slice(0,14)});
    socket.emit('waiting',{count:queue.length});
    // Start after 5s wait or when 8 players queued
    if (queue.length>=8) {
      startRoom(queue.splice(0,8));
    } else {
      clearTimeout(socket.data.matchTimer);
      socket.data.matchTimer=setTimeout(()=>{
        if (queue.length>=1) { startRoom(queue.splice(0,Math.min(8,queue.length))); }
      }, 5000);
    }
  });

  socket.on('solo', ({name}) => {
    startRoom([{sid:socket.id, name:(name||'플레이어').slice(0,14)}]);
  });

  socket.on('input', data => {
    const room=rooms.get(socket.data?.roomId);
    const p=room?.players.get(socket.id);
    if (!p||!p.alive) return;
    if (data.input) p.input=data.input;
    if (data.angle!==undefined) p.angle=data.angle;
  });

  socket.on('shoot',  data => { const r=rooms.get(socket.data?.roomId); if(r)r.shoot(socket.id,data); });
  socket.on('throw',  data => { const r=rooms.get(socket.data?.roomId); if(r)r.throwItem(socket.id,data); });
  socket.on('pickup', ({id})=> { const r=rooms.get(socket.data?.roomId); if(r)r.pickup(socket.id,id); });
  socket.on('heal',   ({type})=>{ const r=rooms.get(socket.data?.roomId); if(r)r.useHeal(socket.id,type); });
  socket.on('reload', ()=>    { const r=rooms.get(socket.data?.roomId); if(r)r.reload(socket.id); });
  socket.on('mecha',  ()=>    { const r=rooms.get(socket.data?.roomId); if(r)r.mechaInteract(socket.id); });

  socket.on('switch', ({slot})=>{
    const r=rooms.get(socket.data?.roomId);
    const p=r?.players.get(socket.id);
    if (p&&!p.reloading&&p.weapons[slot]) { p.activeWeapon=slot; p.reloading=false; }
  });

  socket.on('cancel', ()=>{
    const i=queue.findIndex(p=>p.sid===socket.id);
    if (i>=0) queue.splice(i,1);
  });

  socket.on('disconnect', ()=>{
    const i=queue.findIndex(p=>p.sid===socket.id);
    if (i>=0) queue.splice(i,1);
    const room=rooms.get(socket.data?.roomId);
    if (room) {
      room._kill(socket.id,null,'탈주');
      room.removePlayer(socket.id);
      if (room.players.size===0) room.destroy();
    }
  });
});

http.listen(PORT, ()=>console.log(`🎮 BATTLEGROUND 2D → http://localhost:${PORT}`));
