// ═══════════════════════════════════════════════════════════
// BATTLEGROUND 2D — Client (Phaser 3)
// ═══════════════════════════════════════════════════════════
const socket = io();
const IS_MOBILE = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

const ITEM_COLOR = {
  pistol:'#f59e0b',rifle:'#f59e0b',sniper:'#f59e0b',shotgun:'#f59e0b',smg:'#f59e0b',lmg:'#f59e0b',
  helmet1:'#60a5fa',helmet2:'#60a5fa',helmet3:'#60a5fa',
  vest1:'#34d399',vest2:'#34d399',vest3:'#34d399',
  bandage:'#f87171',medkit:'#f87171',energydrink:'#f87171',painkiller:'#f87171',
  grenade:'#fb923c',smoke:'#9ca3af',flash:'#fde047',
  scope2x:'#c084fc',scope4x:'#c084fc',scope8x:'#c084fc',scope12x:'#c084fc',
  ammo_pistol:'#e5e7eb',ammo_rifle:'#e5e7eb',ammo_sniper:'#e5e7eb',
  ammo_shotgun:'#e5e7eb',ammo_smg:'#e5e7eb',
};
const ITEM_ICON = {
  pistol:'🔫',rifle:'🔫',sniper:'🎯',shotgun:'🔫',smg:'🔫',lmg:'🔫',
  helmet1:'⛑️',helmet2:'⛑️',helmet3:'⛑️',vest1:'🦺',vest2:'🦺',vest3:'🦺',
  bandage:'🩹',medkit:'💊',energydrink:'🥤',painkiller:'💊',
  grenade:'💣',smoke:'🌫️',flash:'⚡',
  scope2x:'🔭',scope4x:'🔭',scope8x:'🔭',scope12x:'🔭',
  ammo_pistol:'🔹',ammo_rifle:'🔹',ammo_sniper:'🔹',ammo_shotgun:'🔹',ammo_smg:'🔹',
};
const WEAPON_COLOR = { pistol:0xf59e0b, rifle:0x22c55e, sniper:0xa855f7,
  shotgun:0xf97316, smg:0x38bdf8, lmg:0xef4444, missile:0xff6600 };

// ═══════════════════════════════════════════════════════════
// MENU SCENE
// ═══════════════════════════════════════════════════════════
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const W=this.scale.width, H=this.scale.height;
    const bg=this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a,0x0a0a1a,0x1a0a2e,0x1a0a2e,1);
    bg.fillRect(0,0,W,H);
    for(let i=0;i<120;i++){
      const g=this.add.graphics();
      g.fillStyle(0xffffff,Math.random()*0.8+0.2);
      g.fillCircle(Math.random()*W,Math.random()*H,Math.random()*1.5+0.5);
    }
    this.add.text(W/2,H*0.15,'BATTLEGROUND 2D',{
      fontSize:Math.min(44,W/10)+'px',fontStyle:'bold',
      color:'#ffd700',stroke:'#ff6600',strokeThickness:4,
      shadow:{blur:20,color:'#ff6600',fill:true}
    }).setOrigin(0.5);
    this.add.text(W/2,H*0.24,'탑다운 배틀로얄 | 최대 8인',{
      fontSize:'15px',color:'#9ca3af'
    }).setOrigin(0.5);

    // Name input + buttons (DOM)
    const inputDiv=document.createElement('div');
    inputDiv.style.cssText=`position:fixed;left:50%;top:${H*0.34}px;transform:translateX(-50%);
      display:flex;flex-direction:column;align-items:center;gap:12px;width:min(300px,85vw);z-index:5;`;
    const inp=document.createElement('input');
    inp.placeholder='닉네임 입력';
    inp.maxLength=14;
    inp.style.cssText=`width:100%;padding:13px 16px;border-radius:10px;border:2px solid rgba(255,215,0,0.4);
      background:rgba(255,255,255,0.08);color:#fff;font-size:16px;outline:none;text-align:center;`;
    inp.addEventListener('focus',()=>inp.style.borderColor='#ffd700');
    inp.addEventListener('blur', ()=>inp.style.borderColor='rgba(255,215,0,0.4)');
    inputDiv.appendChild(inp);

    const mkBtn=(text,bg,cb)=>{
      const b=document.createElement('button');
      b.textContent=text;
      b.style.cssText=`width:100%;padding:14px;border:none;border-radius:10px;background:${bg};
        color:#111;font-size:15px;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent;`;
      b.onclick=cb;
      return b;
    };
    const goOnline=()=>{
      const name=inp.value.trim()||'플레이어';
      document.body.removeChild(inputDiv);
      this.scene.start('Wait',{name,mode:'online'});
    };
    const goSolo=()=>{
      const name=inp.value.trim()||'플레이어';
      document.body.removeChild(inputDiv);
      socket.emit('solo',{name});
    };
    inputDiv.appendChild(mkBtn('🌐 온라인 매칭하기','linear-gradient(135deg,#ffd700,#f97316)',goOnline));
    const soloBtn=mkBtn('🎮 솔로 테스트','rgba(255,255,255,0.15)',goSolo);
    soloBtn.style.color='#fff';
    inputDiv.appendChild(soloBtn);
    document.body.appendChild(inputDiv);
    this.inputDiv=inputDiv;

    // Controls hint
    const hints = IS_MOBILE ? [
      '🕹️ 조이스틱: 이동  |  화면 드래그: 조준',
      '🔫 버튼: 사격(꾹 누르기)  |  📦: 아이템 줍기',
      '🔄: 재장전  |  💣: 수류탄  |  🤖: 메카 탑승',
      '인벤토리 아이콘 탭하면 아이템 사용',
    ] : [
      'WASD: 이동  |  마우스: 조준  |  좌클릭: 사격',
      'R: 재장전  |  E: 메카탑승  |  F: 아이템줍기',
      'G: 수류탄  |  1/2: 무기전환  |  우클릭: 조준경',
      '숫자키 3~8: 아이템 사용  |  Shift: 달리기',
    ];
    hints.forEach((h,i)=>{
      this.add.text(W/2,H*0.70+i*22,h,{fontSize:'12px',color:'#6b7280'}).setOrigin(0.5);
    });

    socket.once('game_start', data=>{
      if(this.inputDiv&&document.body.contains(this.inputDiv)) document.body.removeChild(this.inputDiv);
      this.scene.start('Game',data);
    });
  }
}

// ═══════════════════════════════════════════════════════════
// WAIT SCENE
// ═══════════════════════════════════════════════════════════
class WaitScene extends Phaser.Scene {
  constructor() { super('Wait'); }
  init(data) { this.name=data.name; }
  create() {
    const W=this.scale.width,H=this.scale.height;
    const bg=this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a,0x0a0a1a,0x1a0a2e,0x1a0a2e,1);
    bg.fillRect(0,0,W,H);
    this.add.text(W/2,H*0.35,'🔍 상대방 찾는 중...',{fontSize:'28px',fontStyle:'bold',color:'#ffd700'}).setOrigin(0.5);
    this.countText=this.add.text(W/2,H*0.45,'대기 중 0명',{fontSize:'16px',color:'#9ca3af'}).setOrigin(0.5);
    this.add.text(W/2,H*0.55,'5초 후 자동 시작',{fontSize:'14px',color:'#6b7280'}).setOrigin(0.5);

    const cancelDiv=document.createElement('div');
    cancelDiv.style.cssText=`position:fixed;left:50%;top:${H*0.63}px;transform:translateX(-50%);z-index:5;`;
    const btn=document.createElement('button');
    btn.textContent='취소';
    btn.style.cssText=`padding:12px 36px;border:1px solid rgba(255,255,255,0.3);border-radius:8px;
      background:transparent;color:#9ca3af;font-size:14px;cursor:pointer;`;
    btn.onclick=()=>{ socket.emit('cancel'); document.body.removeChild(cancelDiv); this.scene.start('Menu'); };
    cancelDiv.appendChild(btn);
    document.body.appendChild(cancelDiv);
    this.cancelDiv=cancelDiv;

    socket.emit('join',{name:this.name});
    socket.on('waiting',({count})=>{ if(this.countText) this.countText.setText(`대기 중 ${count}명`); });
    socket.once('game_start',data=>{
      if(this.cancelDiv&&document.body.contains(this.cancelDiv)) document.body.removeChild(this.cancelDiv);
      this.scene.start('Game',data);
    });
  }
}

// ═══════════════════════════════════════════════════════════
// GAME SCENE
// ═══════════════════════════════════════════════════════════
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(d) {
    this.roomId=d.roomId; this.myId=d.myId;
    this.obstacles=d.obstacles||[]; this.spawn=d.spawn;
    this.mapSize=d.mapSize||4000;
    this.gs=null; this.dead=false; this.gameOver=false;
    this.aiming=false; this.throwing=false; this.selectedGrenade=null;
    this.activeSlot=0; this.lastInput={}; this.lastShoot=0;
    this.reloadBar=null; this.reloadTimer=0;
    this.explosionFx=[]; this.killFeedEntries=[];
    this.nearItems=[]; this.nearestItem=null;
    this.mechaTimeLeft=0; this.stunEnd=0;
    this.myAngle=0;
    // Mobile state
    this.mobileState={joyX:0,joyY:0,firing:false,aiming:false,aimAngle:0,sprint:false};
    this._mobOv=null;
  }

  create() {
    const W=this.scale.width, H=this.scale.height;
    this.W=W; this.H=H;

    this._buildMap();

    this.cameras.main.setBounds(0,0,this.mapSize,this.mapSize);
    this.cameras.main.setZoom(1);

    this.keys=this.input.keyboard.addKeys('W,A,S,D,R,G,E,F,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,SHIFT');
    this.input.mouse.disableContextMenu();

    // 중복 텍스처 방지 (씬 재시작 시 발생 가능)
    if (this.textures.exists('fog')) this.textures.remove('fog');
    if (this.textures.exists('mm'))  this.textures.remove('mm');
    this.fogCT=this.textures.createCanvas('fog',W,H);
    this.fogImg=this.add.image(0,0,'fog').setOrigin(0,0).setDepth(80).setScrollFactor(0);

    const MM=IS_MOBILE?110:160;
    this.mmSize=MM;
    this.mmCT=this.textures.createCanvas('mm',MM,MM);
    this.mmImg=this.add.image(W-MM-10,10,'mm').setOrigin(0,0).setDepth(95).setScrollFactor(0);
    const mmBorder=this.add.graphics().setScrollFactor(0).setDepth(94);
    mmBorder.lineStyle(2,0xffd700,0.7);
    mmBorder.strokeRect(W-MM-10,10,MM,MM);

    this._buildHUD();
    this.crosshair=this.add.graphics().setDepth(92).setScrollFactor(0);

    this._setupSocket();

    this.camX=this.spawn.x; this.camY=this.spawn.y;
    this.cameras.main.centerOn(this.camX,this.camY);

    // Mobile controls
    if (IS_MOBILE) this._initMobileControls();

    this.events.once('shutdown', ()=>{
      if (this._mobOv&&document.body.contains(this._mobOv)) document.body.removeChild(this._mobOv);
    });
  }

  // ── Map ──────────────────────────────────────────────────
  _buildMap() {
    const MS=this.mapSize;
    const g=this.add.graphics().setDepth(0);
    g.fillStyle(0x7a6040); g.fillRect(0,0,MS,MS);
    g.fillStyle(0x5a5a52,0.6);
    g.fillRect(0,MS/2-40,MS,80);
    g.fillRect(MS/2-40,0,80,MS);
    g.fillStyle(0x3a6a28);
    for(let i=0;i<200;i++) g.fillCircle(100+Math.random()*700,100+Math.random()*1000,18+Math.random()*22);
    for(let i=0;i<150;i++) g.fillCircle(3100+Math.random()*700,3000+Math.random()*800,18+Math.random()*22);
    g.fillStyle(0x606060); g.fillRect(1560,1560,810,810);
    g.fillStyle(0x505050,0.5);
    for(let i=0;i<12;i++) g.fillRect(1570+i*60,1560,4,810);
    for(let i=0;i<12;i++) g.fillRect(1560,1570+i*60,810,4);
    g.fillStyle(0x384228); g.fillRect(3340,140,480,530);
    g.lineStyle(3,0x4a5a32); g.strokeRect(3340,140,480,530);
    g.fillStyle(0x2a3218);
    [3440,3640].forEach(x=>{ [200,360].forEach(y=>g.fillRect(x,y,10,10)); });
    g.fillStyle(0x1e3a12);
    for(let i=0;i<60;i++) g.fillCircle(120+Math.random()*660,120+Math.random()*960,10+Math.random()*12);
    for(let i=0;i<50;i++) g.fillCircle(3120+Math.random()*660,3020+Math.random()*760,10+Math.random()*12);
    for(const o of this.obstacles) {
      g.fillStyle(0x888888); g.fillRect(o.x,o.y,o.w,o.h);
      g.fillStyle(0xa0a0a0,0.3); g.fillRect(o.x+4,o.y+4,o.w-8,6);
      g.lineStyle(2,0x555555); g.strokeRect(o.x,o.y,o.w,o.h);
    }
    g.lineStyle(12,0x1a1a1a); g.strokeRect(0,0,MS,MS);
    g.fillStyle(0x1a1a1a);
    g.fillRect(0,0,MS,8); g.fillRect(0,MS-8,MS,8);
    g.fillRect(0,0,8,MS); g.fillRect(MS-8,0,8,MS);
  }

  // ── HUD ──────────────────────────────────────────────────
  _buildHUD() {
    const W=this.W, H=this.H;
    const d=90, sf=0;

    const bbg=this.add.graphics().setScrollFactor(sf).setDepth(d);
    bbg.fillStyle(0x000000,0.55);
    bbg.fillRect(0,H-88,W,88);

    this.hpTrack=this.add.graphics().setScrollFactor(sf).setDepth(d+1);
    this.hpFill =this.add.graphics().setScrollFactor(sf).setDepth(d+1);
    this.hpText =this.add.text(14,H-80,'HP: 100',{fontSize:'12px',color:'#fff',fontStyle:'bold'}).setScrollFactor(sf).setDepth(d+2);

    this.helmetIcon=this.add.text(14,H-62,'',{fontSize:'16px'}).setScrollFactor(sf).setDepth(d+2);
    this.vestIcon  =this.add.text(38,H-62,'',{fontSize:'16px'}).setScrollFactor(sf).setDepth(d+2);
    this.helmetLv  =this.add.text(14,H-45,'',{fontSize:'9px',color:'#60a5fa'}).setScrollFactor(sf).setDepth(d+2);
    this.vestLv    =this.add.text(38,H-45,'',{fontSize:'9px',color:'#34d399'}).setScrollFactor(sf).setDepth(d+2);

    this.zoneBg=this.add.graphics().setScrollFactor(sf).setDepth(d);
    this.zoneText=this.add.text(W/2,14,'',{fontSize:'13px',color:'#4488ff',fontStyle:'bold',
      stroke:'#000',strokeThickness:3}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5,0);

    this.feedTexts=[];
    for(let i=0;i<5;i++)
      this.feedTexts.push(this.add.text(12,12+i*20,'',{fontSize:'11px',color:'#fff',
        stroke:'#000',strokeThickness:3}).setScrollFactor(sf).setDepth(d+2));

    this.aliveText=this.add.text(W-this.mmSize-10,this.mmSize+14,'',{
      fontSize:'12px',color:'#ffd700',fontStyle:'bold',stroke:'#000',strokeThickness:3
    }).setScrollFactor(sf).setDepth(d+2);

    this.weapSlots=[];
    for(let i=0;i<2;i++) {
      const cx=W/2-60+i*120;
      const slotBg=this.add.graphics().setScrollFactor(sf).setDepth(d);
      this.weapSlots.push({
        bg: slotBg,
        icon: this.add.text(cx,H-56,'',{fontSize:'20px'}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5),
        name: this.add.text(cx,H-34,'',{fontSize:'10px',color:'#d1d5db'}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5),
        mag:  this.add.text(cx,H-21,'',{fontSize:'10px',color:'#fbbf24'}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5),
      });
    }
    this.ammoText=this.add.text(W/2+80,H-58,'',{fontSize:'13px',color:'#fbbf24',fontStyle:'bold'}).setScrollFactor(sf).setDepth(d+2);
    this.ammoReserveText=this.add.text(W/2+80,H-40,'',{fontSize:'10px',color:'#9ca3af'}).setScrollFactor(sf).setDepth(d+2);

    this.invSlots=[];
    for(let i=0;i<6;i++) {
      const ix=W-208+i*32, iy=H-40;
      this.invSlots.push({
        bg:this.add.graphics().setScrollFactor(sf).setDepth(d),
        icon:this.add.text(ix+16,iy+14,'',{fontSize:'12px'}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5),
        key:this.add.text(ix+3,iy+2,String(i+3),{fontSize:'8px',color:'#6b7280'}).setScrollFactor(sf).setDepth(d+2),
      });
    }

    this.reloadBg  =this.add.graphics().setScrollFactor(sf).setDepth(d+3).setVisible(false);
    this.reloadFill=this.add.graphics().setScrollFactor(sf).setDepth(d+3).setVisible(false);
    this.reloadText=this.add.text(W/2,H-100,'재장전 중...',{fontSize:'12px',color:'#fbbf24'}).setScrollFactor(sf).setDepth(d+3).setOrigin(0.5).setVisible(false);

    this.pickupHint=this.add.text(W/2,H-100,'',{fontSize:'12px',color:'#86efac',stroke:'#000',strokeThickness:3}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5).setVisible(false);
    this.mechaTimerText=this.add.text(W/2,H-130,'',{fontSize:'17px',color:'#4488ff',fontStyle:'bold',stroke:'#000',strokeThickness:4}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5).setVisible(false);
    this.scopeText=this.add.text(W-this.mmSize-10,this.mmSize+30,'',{fontSize:'10px',color:'#c084fc'}).setScrollFactor(sf).setDepth(d+2);
  }

  // ── Mobile Controls ──────────────────────────────────────
  _initMobileControls() {
    const ms = this.mobileState;
    const W = this.W, H = this.H;

    // Overlay container
    const ov = document.createElement('div');
    ov.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:100;
      user-select:none;-webkit-user-select:none;font-family:sans-serif;`;
    document.body.appendChild(ov);
    this._mobOv = ov;

    // ── helper ────────────────────────────────────────────
    const mkEl = (css) => {
      const d = document.createElement('div');
      d.style.cssText = css;
      return d;
    };

    const BTN = 'rgba(8,10,22,0.72)';
    const mkBtn = (icon, label, css, onDown, opts={}) => {
      const sz = opts.sz || 52;
      const b = mkEl(`position:absolute;${css}
        width:${sz}px;height:${sz}px;
        border-radius:${opts.round?'50%':'10px'};
        background:${opts.bg||BTN};
        border:2px solid ${opts.bdr||'rgba(255,255,255,0.22)'};
        pointer-events:auto;touch-action:manipulation;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        box-shadow:0 2px 8px rgba(0,0,0,0.5);`);
      b.innerHTML = `<span style="font-size:${opts.fs||19}px;line-height:1">${icon}</span>`
        + (label ? `<span style="font-size:8px;color:rgba(255,255,255,0.45);margin-top:1px">${label}</span>` : '');
      b.addEventListener('touchstart', e => {
        e.preventDefault(); e.stopPropagation();
        b.style.background = opts.active || 'rgba(255,255,255,0.22)';
        onDown(e);
      }, {passive:false});
      b.addEventListener('touchend', e => {
        b.style.background = opts.bg || BTN;
        if (opts.onUp) opts.onUp(e);
      });
      b.addEventListener('touchcancel', () => {
        b.style.background = opts.bg || BTN;
        if (opts.onUp) opts.onUp();
      });
      ov.appendChild(b);
      return b;
    };

    // ══ JOYSTICK ══════════════════════════════════════════
    const JR = 58, KR = 24, JMax = JR - KR - 3;
    const joyBase = mkEl(`position:absolute;bottom:14px;left:14px;
      width:${JR*2}px;height:${JR*2}px;border-radius:50%;
      background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.14);
      pointer-events:auto;touch-action:none;
      box-shadow:inset 0 0 20px rgba(0,0,0,0.4);`);
    const joyRing = mkEl(`position:absolute;border-radius:50%;
      width:${JR*2-16}px;height:${JR*2-16}px;
      border:1px solid rgba(255,255,255,0.08);
      top:8px;left:8px;pointer-events:none;`);
    const joyKnob = mkEl(`position:absolute;border-radius:50%;
      width:${KR*2}px;height:${KR*2}px;
      background:radial-gradient(circle at 35% 35%, rgba(255,255,255,0.6), rgba(255,255,255,0.2));
      border:2px solid rgba(255,255,255,0.5);
      box-shadow:0 2px 8px rgba(0,0,0,0.6);
      top:${JR-KR}px;left:${JR-KR}px;pointer-events:none;`);
    joyBase.appendChild(joyRing);
    joyBase.appendChild(joyKnob);
    ov.appendChild(joyBase);

    let joyTid = null, jcx = 0, jcy = 0;
    const joyUpdate = (cx, cy) => {
      const dx = cx-jcx, dy = cy-jcy;
      const d = Math.hypot(dx, dy);
      const sx = d > JMax ? (dx/d)*JMax : dx;
      const sy = d > JMax ? (dy/d)*JMax : dy;
      joyKnob.style.left = `${JR-KR+sx}px`;
      joyKnob.style.top  = `${JR-KR+sy}px`;
      ms.joyX = sx/JMax; ms.joyY = sy/JMax;
    };
    joyBase.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      joyTid = t.identifier;
      const r = joyBase.getBoundingClientRect();
      jcx = r.left+JR; jcy = r.top+JR;
      joyUpdate(t.clientX, t.clientY);
    }, {passive:false});
    document.addEventListener('touchmove', e => {
      for (const t of e.changedTouches)
        if (t.identifier === joyTid) { e.preventDefault(); joyUpdate(t.clientX, t.clientY); }
    }, {passive:false});
    const joyEnd = e => {
      for (const t of e.changedTouches) {
        if (t.identifier !== joyTid) continue;
        joyTid = null;
        joyKnob.style.left = `${JR-KR}px`;
        joyKnob.style.top  = `${JR-KR}px`;
        ms.joyX = ms.joyY = 0;
      }
    };
    document.addEventListener('touchend', joyEnd);
    document.addEventListener('touchcancel', joyEnd);

    // ══ AIM ZONE (right side drag) ════════════════════════
    const aimZone = mkEl(`position:absolute;top:0;left:42%;right:0;bottom:200px;
      pointer-events:auto;touch-action:none;`);
    ov.appendChild(aimZone);

    let aimTid = null;
    const aimUpdate = (cx, cy) => {
      ms.aimAngle = Math.atan2(cy - H*0.5, cx - W*0.5);
    };
    aimZone.addEventListener('touchstart', e => {
      e.preventDefault();
      if (aimTid !== null) return;
      const t = e.changedTouches[0];
      aimTid = t.identifier;
      aimUpdate(t.clientX, t.clientY);
    }, {passive:false});
    aimZone.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches)
        if (t.identifier === aimTid) aimUpdate(t.clientX, t.clientY);
    }, {passive:false});
    aimZone.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier !== aimTid) continue;
        aimTid = null;
        // Throw grenade on tap
        if (this.throwing) {
          const cam = this.cameras.main;
          socket.emit('throw', {
            type: this.selectedGrenade,
            x: t.clientX + cam.scrollX,
            y: t.clientY + cam.scrollY
          });
          this.throwing = false; this.selectedGrenade = null;
          if (this._mobGBtn) this._mobGBtn.style.background = BTN;
        }
      }
    });
    aimZone.addEventListener('touchcancel', e => {
      for (const t of e.changedTouches) if (t.identifier === aimTid) aimTid = null;
    });

    // ══ FIRE BUTTON ═══════════════════════════════════════
    const fireBg = 'rgba(160,20,20,0.72)';
    const fireEl = mkEl(`position:absolute;bottom:14px;right:14px;
      width:82px;height:82px;border-radius:50%;
      background:${fireBg};border:3px solid rgba(239,100,100,0.85);
      pointer-events:auto;touch-action:none;
      display:flex;align-items:center;justify-content:center;
      font-size:30px;box-shadow:0 0 18px rgba(239,68,68,0.35);`);
    fireEl.textContent = '🔫';
    ov.appendChild(fireEl);
    let fireTid = null;
    fireEl.addEventListener('touchstart', e => {
      e.preventDefault(); e.stopPropagation();
      fireTid = e.changedTouches[0].identifier;
      ms.firing = true;
      fireEl.style.background = 'rgba(239,68,68,0.92)';
      fireEl.style.transform = 'scale(0.94)';
    }, {passive:false});
    const fireOff = e => {
      if (e) for (const t of e.changedTouches) { if (t.identifier !== fireTid) continue; }
      ms.firing = false; fireTid = null;
      fireEl.style.background = fireBg;
      fireEl.style.transform = '';
    };
    fireEl.addEventListener('touchend', fireOff);
    fireEl.addEventListener('touchcancel', fireOff);

    // ══ AIM / SCOPE TOGGLE ════════════════════════════════
    this._mobAimBtn = mkBtn('🔭','AIM',`bottom:106px;right:14px;`,()=>{
      ms.aiming = !ms.aiming; this.aiming = ms.aiming;
      this._mobAimBtn.style.background = ms.aiming ? 'rgba(109,40,217,0.78)' : BTN;
      this._mobAimBtn.style.borderColor = ms.aiming ? 'rgba(192,132,252,0.9)' : 'rgba(255,255,255,0.22)';
      socket.emit('input',{input:{},angle:ms.aimAngle,aiming:ms.aiming});
    },{round:true});

    // ══ SPRINT TOGGLE ═════════════════════════════════════
    this._mobSpBtn = mkBtn('⚡','달리기',`bottom:142px;left:14px;`,()=>{
      ms.sprint = !ms.sprint;
      this._mobSpBtn.style.background = ms.sprint ? 'rgba(217,119,6,0.7)' : BTN;
    },{sz:44, round:true});

    // ══ ACTION BUTTONS (grid right-center) ════════════════
    // Row 1 (bottom:14)
    mkBtn('🔄','재장전', `bottom:14px;right:106px;`, ()=>socket.emit('reload'));
    mkBtn('②','무기2',  `bottom:14px;right:162px;`, ()=>{
      socket.emit('switch',{slot:1}); this.activeSlot=1;
    });

    // Row 2 (bottom:70)
    mkBtn('📦','줍기',  `bottom:70px;right:106px;`, ()=>this._pickupNearest());
    mkBtn('①','무기1',  `bottom:70px;right:162px;`, ()=>{
      socket.emit('switch',{slot:0}); this.activeSlot=0;
    });

    // Row 3 (bottom:126)
    this._mobGBtn = mkBtn('💣','수류탄',`bottom:126px;right:106px;`, ()=>{
      const inv = this.gs?.myInventory||[];
      const gt = inv.find(t=>['grenade','smoke','flash'].includes(t));
      if (gt) {
        this.throwing = !this.throwing;
        this.selectedGrenade = this.throwing ? gt : null;
        this._mobGBtn.style.background = this.throwing ? 'rgba(234,88,12,0.82)' : BTN;
      }
    });
    mkBtn('🤖','메카',  `bottom:126px;right:162px;`, ()=>socket.emit('mecha'));

    // ══ INVENTORY ROW ═════════════════════════════════════
    const invWrap = mkEl(`position:absolute;bottom:196px;
      left:50%;transform:translateX(-50%);
      display:flex;gap:5px;pointer-events:none;`);
    ov.appendChild(invWrap);
    this._mobInv = [];
    for (let i=0; i<6; i++) {
      const s = mkEl(`width:38px;height:42px;border-radius:8px;
        background:rgba(8,10,22,0.72);border:1px solid rgba(255,255,255,0.18);
        pointer-events:auto;touch-action:manipulation;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        font-size:17px;`);
      s.addEventListener('touchstart', e => {
        e.preventDefault(); e.stopPropagation();
        const inv = this.gs?.myInventory||[];
        if (inv[i]) { socket.emit('heal',{type:inv[i]}); s.style.background='rgba(255,255,255,0.2)'; }
      }, {passive:false});
      s.addEventListener('touchend',()=>s.style.background='rgba(8,10,22,0.72)');
      invWrap.appendChild(s);
      this._mobInv.push(s);
    }

    // Pickup hint on mobile (label below pickup button)
    this._mobPickupLabel = mkEl(`position:absolute;bottom:128px;right:106px;
      width:52px;text-align:center;font-size:8px;color:rgba(134,239,172,0.85);
      pointer-events:none;`);
    ov.appendChild(this._mobPickupLabel);
  }

  // ── Socket ───────────────────────────────────────────────
  _setupSocket() {
    socket.on('state', data=>{
      this.gs=data;
      const me=data.players.find(p=>p.sid===this.myId);
      if (me) { this.camX=me.x; this.camY=me.y; }
    });

    socket.on('reloading',({ms})=>{
      this.reloadTimer=ms; this.reloadStart=Date.now();
      this.reloadBg.setVisible(true);
      this.reloadFill.setVisible(true);
      this.reloadText.setVisible(true);
    });

    socket.on('explosion',({x,y,r})=>{
      this.explosionFx.push({x,y,r,t:Date.now(),dur:600});
    });

    socket.on('flash_hit',({ms})=>{
      this.stunEnd=Date.now()+ms;
      const fl=document.getElementById('flash-overlay');
      fl.style.opacity='1';
      setTimeout(()=>{ fl.style.transition='opacity 2s'; fl.style.opacity='0';
        setTimeout(()=>fl.style.transition='opacity 0.1s',2000); }, 100);
    });

    socket.on('mecha_on',({ends})=>{
      this.mechaTimeLeft=Math.max(0,ends-Date.now())/1000;
      this._toast('🤖 메카 로봇 탑승! 10초간 미사일 발사');
    });
    socket.on('mecha_off',()=>{ this.mechaTimeLeft=0; this._toast('메카 로봇에서 이탈'); });

    socket.on('killed',feed=>{
      const txt=feed.killer?`${feed.killer} → ${feed.victim} [${feed.weapon}]`:`${feed.victim} 사망 [${feed.weapon}]`;
      this.killFeedEntries.unshift({txt,t:Date.now()});
      if(this.killFeedEntries.length>5) this.killFeedEntries.pop();
    });

    socket.on('you_died',({killer,weapon})=>{ this.dead=true; this._showDead(killer,weapon); });
    socket.on('game_over',({winner})=>{ this.gameOver=true; this._showGameOver(winner); });
    socket.on('msg',txt=>this._toast(txt));
  }

  // ── Update ───────────────────────────────────────────────
  update(time,delta) {
    if (!this.gs) return;
    const dt=delta/1000;
    this._handleInput();
    this._render();
    this._updateFog();
    this._updateMinimap();
    this._updateHUD(dt);
    this._updateEffects(dt);
    this.cameras.main.centerOn(this.camX,this.camY);
  }

  // ── Input ────────────────────────────────────────────────
  _handleInput() {
    if (this.dead||this.gameOver) return;
    const K = this.keys;
    const ms = this.mobileState;
    let inp, angle;

    if (IS_MOBILE) {
      inp = {
        up:    ms.joyY < -0.28,
        down:  ms.joyY >  0.28,
        left:  ms.joyX < -0.28,
        right: ms.joyX >  0.28,
        sprint: ms.sprint,
      };
      angle = ms.aimAngle;
    } else {
      inp = {
        up:    K.W.isDown,
        down:  K.S.isDown,
        left:  K.A.isDown,
        right: K.D.isDown,
        sprint: K.SHIFT.isDown,
      };
      const cam = this.cameras.main;
      const mx = this.input.mousePointer.x + cam.scrollX;
      const my = this.input.mousePointer.y + cam.scrollY;
      const me = this.gs?.players.find(p=>p.sid===this.myId);
      angle = me ? Math.atan2(my-me.y, mx-me.x) : 0;
    }

    const now = Date.now();
    if (!this.lastSendT||now-this.lastSendT>=50) {
      socket.emit('input',{input:inp,angle});
      this.lastSendT=now;
    }

    // Shooting
    const firing = IS_MOBILE
      ? ms.firing
      : (this.input.mousePointer.isDown && !this.throwing);
    if (firing) {
      if (now-this.lastShoot>60) {
        socket.emit('shoot',{angle}); this.lastShoot=now;
        const me2=this.gs?.players.find(p=>p.sid===this.myId);
        if (me2) this.explosionFx.push({x:me2.x,y:me2.y,r:8,t:now,dur:60,muzzle:true});
      }
    }

    // Desktop-only keyboard controls
    if (!IS_MOBILE) {
      const me = this.gs?.players.find(p=>p.sid===this.myId);
      const cam = this.cameras.main;
      const mx = this.input.mousePointer.x + cam.scrollX;
      const my = this.input.mousePointer.y + cam.scrollY;

      if (this.input.mousePointer.rightButtonDown()&&!this.wasRClick) {
        this.aiming=!this.aiming;
        socket.emit('input',{input:inp,angle,aiming:this.aiming});
      }
      this.wasRClick=this.input.mousePointer.rightButtonDown();

      if (Phaser.Input.Keyboard.JustDown(K.R)) socket.emit('reload');
      if (Phaser.Input.Keyboard.JustDown(K.E)) socket.emit('mecha');
      if (Phaser.Input.Keyboard.JustDown(K.F)) this._pickupNearest();
      if (Phaser.Input.Keyboard.JustDown(K.ONE)) { socket.emit('switch',{slot:0}); this.activeSlot=0; }
      if (Phaser.Input.Keyboard.JustDown(K.TWO)) { socket.emit('switch',{slot:1}); this.activeSlot=1; }

      if (Phaser.Input.Keyboard.JustDown(K.G)&&me) {
        const inv=this.gs.myInventory||[];
        const gtype=inv.find(t=>['grenade','smoke','flash'].includes(t));
        if (gtype) { this.throwing=!this.throwing; this.selectedGrenade=this.throwing?gtype:null; }
      }
      if (this.throwing&&me&&this.input.mousePointer.isDown&&!this.wasLClick2) {
        socket.emit('throw',{type:this.selectedGrenade,x:mx,y:my});
        this.throwing=false; this.selectedGrenade=null;
      }
      this.wasLClick2=this.throwing&&this.input.mousePointer.isDown;

      const healKeys=[K.THREE,K.FOUR,K.FIVE,K.SIX,K.SEVEN,K.EIGHT];
      healKeys.forEach((k,i)=>{
        if (Phaser.Input.Keyboard.JustDown(k)) {
          const inv=this.gs?.myInventory||[];
          if (inv[i]) socket.emit('heal',{type:inv[i]});
        }
      });
    }

    this.myAngle=angle;
    this.myInput=inp;
  }

  _pickupNearest() {
    if (!this.gs||!this.nearestItem) return;
    socket.emit('pickup',{id:this.nearestItem.id});
  }

  // ── Render ───────────────────────────────────────────────
  _render() {
    if (!this.gs) return;
    if (this._dynG) this._dynG.destroy();
    this._dynG=this.add.graphics().setDepth(10);
    const g=this._dynG;
    const me=this.gs.players.find(p=>p.sid===this.myId);

    for(const s of (this.gs.smokes||[])) {
      g.fillStyle(0x888888,0.5); g.fillCircle(s.x,s.y,s.r);
      g.fillStyle(0xaaaaaa,0.2); g.fillCircle(s.x,s.y,s.r*0.7);
    }

    const items=this.gs.items||[];
    let nearest=null, nearDist=80;
    for(const item of items) {
      const col=Phaser.Display.Color.HexStringToColor(ITEM_COLOR[item.type]||'#ffffff');
      g.fillStyle(col.color,0.9); g.fillCircle(item.x,item.y,8);
      g.lineStyle(2,0xffffff,0.5); g.strokeCircle(item.x,item.y,8);
      if (me) {
        const d=Math.hypot(item.x-me.x,item.y-me.y);
        if (d<nearDist) { nearDist=d; nearest=item; }
      }
    }
    this.nearestItem=nearest;

    for(const m of (this.gs.mechas||[])) {
      if (m.hp<=0) continue;
      const haveP=!!m.pilotId;
      g.fillStyle(haveP?0x2244ff:0x4466cc,0.9); g.fillRect(m.x-22,m.y-22,44,44);
      g.lineStyle(3,haveP?0x88aaff:0x4488ff); g.strokeRect(m.x-22,m.y-22,44,44);
      const hw=40*(m.hp/m.maxHp);
      g.fillStyle(0x333333); g.fillRect(m.x-20,m.y-30,40,5);
      g.fillStyle(0x4488ff); g.fillRect(m.x-20,m.y-30,hw,5);
    }

    for(const p of (this.gs.players||[])) {
      if (!p.alive) continue;
      const isMe=(p.sid===this.myId);
      const col=isMe?0x00ff88:(p.inMecha?0x4488ff:0xff4444);
      if (p.inMecha) { g.lineStyle(3,col); g.strokeRect(p.x-24,p.y-24,48,48); }
      g.fillStyle(col,isMe?1:0.9); g.fillCircle(p.x,p.y,14);
      const a=p.angle||0;
      g.lineStyle(3,0xffffff,0.9);
      g.strokeLineShape(new Phaser.Geom.Line(p.x,p.y,p.x+Math.cos(a)*20,p.y+Math.sin(a)*20));
      if (p.helmet>0) {
        g.lineStyle(2,[0xffffff,0x60a5fa,0xfbbf24][p.helmet-1]||0x60a5fa,0.7);
        g.strokeCircle(p.x,p.y,17);
      }
      if (!isMe) {
        const hw=26*(p.hp/100);
        g.fillStyle(0x1a1a1a,0.8); g.fillRect(p.x-13,p.y-24,26,5);
        g.fillStyle(p.hp>50?0x22c55e:p.hp>25?0xf59e0b:0xef4444);
        g.fillRect(p.x-13,p.y-24,hw,5);
        // 네임태그: 매 프레임 동적 그래픽스(dynG)에 배경박스만 표시 (텍스트 누수 방지)
        g.fillStyle(0x000000,0.55); g.fillRect(p.x-24,p.y-34,48,13);
      }
    }

    for(const b of (this.gs.bullets||[])) {
      const col=b.type==='missile'?0xff6600:(WEAPON_COLOR[b.type]||0xffff44);
      g.fillStyle(col,1);
      if (b.type==='missile') g.fillRect(b.x-3,b.y-3,6,6);
      else g.fillCircle(b.x,b.y,3);
    }

    if (this.throwing&&me) {
      g.lineStyle(2,0xfbcb04,0.8); g.strokeCircle(me.x,me.y,340);
      if (!IS_MOBILE) {
        const cam=this.cameras.main;
        const mx=this.input.mousePointer.x+cam.scrollX;
        const my2=this.input.mousePointer.y+cam.scrollY;
        const a=Math.atan2(my2-me.y,mx-me.x);
        const dist=Math.min(340,Math.hypot(mx-me.x,my2-me.y));
        const lx=me.x+Math.cos(a)*dist, ly=me.y+Math.sin(a)*dist;
        g.fillStyle(0xfbcb04,0.7); g.fillCircle(lx,ly,10);
        g.lineStyle(1,0xfbcb04,0.4); g.lineBetween(me.x,me.y,lx,ly);
      } else {
        // Show throw direction on mobile
        const a=this.mobileState.aimAngle;
        const dist=220;
        const lx=me.x+Math.cos(a)*dist, ly=me.y+Math.sin(a)*dist;
        g.fillStyle(0xfbcb04,0.7); g.fillCircle(lx,ly,10);
        g.lineStyle(1,0xfbcb04,0.4); g.lineBetween(me.x,me.y,lx,ly);
      }
    }

    const sz=this.gs.sz;
    if (sz) {
      g.lineStyle(3,0x4488ff,0.8); g.strokeCircle(sz.cx,sz.cy,sz.r);
      if (this.gs.shrinking) {
        g.lineStyle(2,0x4488ff,0.3); g.strokeCircle(sz.ncx,sz.ncy,sz.nr);
      }
    }

    if (me&&!me.inMecha) {
      for(const m of (this.gs.mechas||[])) {
        if (!m.pilotId&&Math.hypot(m.x-me.x,m.y-me.y)<65) {
          g.lineStyle(2,0xffd700,0.9); g.strokeCircle(m.x,m.y,26);
        }
      }
    }

    this._drawCrosshair(me);
  }

  _drawCrosshair(me) {
    const g=this.crosshair; g.clear();
    if (!me) return;
    const cx=this.W/2, cy=this.H/2;
    const recoil=(me.recoil||0);
    const spread=8+recoil*1.5;
    g.lineStyle(2,0xffffff,0.9);
    g.lineBetween(cx-spread-8,cy,cx-spread,cy);
    g.lineBetween(cx+spread,cy,cx+spread+8,cy);
    g.lineBetween(cx,cy-spread-8,cx,cy-spread);
    g.lineBetween(cx,cy+spread,cx,cy+spread+8);
    g.fillStyle(0xffffff,0.9); g.fillCircle(cx,cy,2);
    if (this.throwing) { g.lineStyle(2,0xfbcb04,0.9); g.strokeCircle(cx,cy,14); }
  }

  // ── Fog ──────────────────────────────────────────────────
  _updateFog() {
    const me=this.gs?.players.find(p=>p.sid===this.myId)
           || this.gs?.players.find(p=>p.alive); // 폴백: 살아있는 첫 플레이어
    if (!me||!me.alive) return;
    const cam=this.cameras.main;
    const sx=me.x-cam.scrollX, sy=me.y-cam.scrollY;
    const scope=this.gs.myScope;
    const baseVis=this.aiming&&scope?{scope2x:420,scope4x:490,scope8x:560,scope12x:650}[scope]||350:350;

    const ctx=this.fogCT.context;
    ctx.clearRect(0,0,this.W,this.H);
    ctx.fillStyle='rgba(0,0,0,0.88)';
    ctx.fillRect(0,0,this.W,this.H);

    const grad=ctx.createRadialGradient(sx,sy,baseVis*0.65,sx,sy,baseVis);
    grad.addColorStop(0,'rgba(0,0,0,1)');
    grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalCompositeOperation='destination-out';
    ctx.fillStyle=grad;
    ctx.beginPath(); ctx.arc(sx,sy,baseVis,0,Math.PI*2); ctx.fill();

    ctx.globalCompositeOperation='source-over';
    for(const s of (this.gs.smokes||[])) {
      const ssx=s.x-cam.scrollX, ssy=s.y-cam.scrollY;
      const dist=Math.hypot(ssx-sx,ssy-sy);
      if (dist<baseVis+s.r) {
        ctx.fillStyle='rgba(0,0,0,0.7)';
        ctx.beginPath(); ctx.arc(ssx,ssy,s.r,0,Math.PI*2); ctx.fill();
      }
    }
    this.fogCT.refresh();

    if (this.aiming&&scope) {
      const zoom={scope2x:1.6,scope4x:2.2,scope8x:2.8,scope12x:3.4}[scope]||1;
      this.cameras.main.setZoom(zoom);
    } else {
      this.cameras.main.setZoom(1);
    }
  }

  // ── Minimap ──────────────────────────────────────────────
  _updateMinimap() {
    if (!this.gs) return;
    const MM=this.mmSize, SC=MM/this.mapSize;
    const ctx=this.mmCT.context;
    ctx.clearRect(0,0,MM,MM);
    ctx.fillStyle='#0a0a14'; ctx.fillRect(0,0,MM,MM);
    ctx.fillStyle='#1a3010'; ctx.fillRect(0,0,MM*0.2,MM*0.28);
    ctx.fillStyle='#1a1a18'; ctx.fillRect(MM*0.39,MM*0.39,MM*0.22,MM*0.22);
    ctx.fillStyle='#0e1208'; ctx.fillRect(MM*0.835,MM*0.035,MM*0.13,MM*0.14);
    ctx.fillStyle='rgba(100,100,90,0.5)';
    ctx.fillRect(0,MM/2-2,MM,4); ctx.fillRect(MM/2-2,0,4,MM);
    ctx.fillStyle='#666';
    for(const o of this.obstacles)
      ctx.fillRect(o.x*SC,o.y*SC,Math.max(2,o.w*SC),Math.max(2,o.h*SC));
    ctx.fillStyle='rgba(251,207,36,0.4)';
    for(const i of (this.gs.allItems||[]))
      ctx.fillRect(i.x*SC-1,i.y*SC-1,2,2);
    const sz=this.gs.sz;
    if (sz) {
      ctx.strokeStyle='rgba(68,136,255,0.8)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(sz.cx*SC,sz.cy*SC,sz.r*SC,0,Math.PI*2); ctx.stroke();
      if (this.gs.shrinking) {
        ctx.strokeStyle='rgba(68,136,255,0.3)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(sz.ncx*SC,sz.ncy*SC,sz.nr*SC,0,Math.PI*2); ctx.stroke();
      }
    }
    for(const m of (this.gs.mechas||[])) {
      ctx.fillStyle=m.pilotId?'#4488ff':'#88aaff';
      ctx.fillRect(m.x*SC-3,m.y*SC-3,6,6);
    }
    for(const p of (this.gs.players||[])) {
      if (!p.alive) continue;
      ctx.fillStyle=p.sid===this.myId?'#00ff88':'#ff4444';
      ctx.beginPath(); ctx.arc(p.x*SC,p.y*SC,p.sid===this.myId?4:3,0,Math.PI*2); ctx.fill();
    }
    this.mmCT.refresh();
  }

  // ── HUD Update ───────────────────────────────────────────
  _updateHUD(dt) {
    if (!this.gs) return;
    const W=this.W, H=this.H;

    const hp=Math.max(0,this.gs.myHp||0);
    const hpPct=hp/100;
    const hpCol=hp>50?0x22c55e:hp>25?0xf59e0b:0xef4444;
    this.hpTrack.clear(); this.hpFill.clear();
    this.hpTrack.fillStyle(0x1a1a1a,0.8); this.hpTrack.fillRect(12,H-83,150,13);
    this.hpFill.fillStyle(hpCol); this.hpFill.fillRect(12,H-83,150*hpPct,13);
    this.hpText.setText(`HP: ${Math.ceil(hp)}`);

    const hlv=this.gs.myHelmet||0, vlv=this.gs.myVest||0;
    this.helmetIcon.setText(hlv?'⛑️':''); this.helmetLv.setText(hlv?`Lv${hlv}`:'');
    this.vestIcon.setText(vlv?'🦺':''); this.vestLv.setText(vlv?`Lv${vlv}`:'');

    const wnames={pistol:'권총',rifle:'라이플',sniper:'저격총',shotgun:'산탄총',smg:'SMG',lmg:'LMG'};
    const wicons={pistol:'🔫',rifle:'🔫',sniper:'🎯',shotgun:'🔫',smg:'🔫',lmg:'🔫'};
    for(let i=0;i<2;i++) {
      const sl=this.weapSlots[i];
      const wt=this.gs.myWeapons?.[i];
      const isActive=this.activeSlot===i;
      sl.bg.clear();
      sl.bg.fillStyle(isActive?0x1e3a5f:0x111827,0.8);
      sl.bg.fillRect(W/2-90+i*120-24,H-66,48,54);
      if (isActive) { sl.bg.lineStyle(2,0x4488ff); sl.bg.strokeRect(W/2-90+i*120-24,H-66,48,54); }
      sl.icon.setText(wt?(wicons[wt]||'🔫'):'');
      sl.name.setText(wt?(wnames[wt]||wt):'');
      sl.mag.setText(wt?`${this.gs.myMag?.[i]||0}발`:'');
    }

    const aw=this.gs.myWeapons?.[this.activeSlot];
    const ammoMap={pistol:'pistol',rifle:'rifle',sniper:'sniper',shotgun:'shotgun',smg:'smg',lmg:'rifle'};
    const ammoType=ammoMap[aw];
    this.ammoText.setText(aw?`${this.gs.myMag?.[this.activeSlot]||0}`:'');
    this.ammoReserveText.setText(ammoType?`/ ${this.gs.myAmmo?.[ammoType]||0}`:'');

    const inv=this.gs.myInventory||[];
    for(let i=0;i<6;i++) {
      const sl=this.invSlots[i];
      const item=inv[i];
      sl.bg.clear();
      sl.bg.fillStyle(0x111827,0.8); sl.bg.fillRect(W-208+i*32,H-42,28,28);
      if (item) { sl.bg.lineStyle(1,0x374151); sl.bg.strokeRect(W-208+i*32,H-42,28,28); }
      sl.icon.setText(item?(ITEM_ICON[item]||'?'):'');
    }

    const validFeed=(this.gs.killFeed||[]).slice(0,5);
    for(let i=0;i<5;i++) {
      const entry=validFeed[i];
      if (entry) {
        this.feedTexts[i].setText(entry.killer?`${entry.killer} ⚡ ${entry.victim}`:` 💀 ${entry.victim}`).setAlpha(1);
      } else {
        this.feedTexts[i].setText('');
      }
    }

    const phase=this.gs.phase||0;
    const shrinking=this.gs.shrinking;
    if (phase<5) {
      this.zoneText.setText(shrinking?'🔵 블루존 수축 중!':'🔵 블루존 이동 예정');
      this.zoneText.setColor(shrinking?'#4488ff':'#88aaff');
    } else {
      this.zoneText.setText('⚡ 최후의 전장!');
    }

    const aliveCount=(this.gs.players||[]).filter(p=>p.alive).length;
    this.aliveText.setText(`👥 ${aliveCount}명 생존`);

    const sc=this.gs.myScope;
    this.scopeText.setText(sc?`🔭 ${{scope2x:'2배',scope4x:'4배',scope8x:'8배',scope12x:'12배'}[sc]}배율`:'');

    if (this.gs.reloading&&this.reloadTimer>0) {
      const elapsed=Date.now()-(this.reloadStart||Date.now());
      const pct=Math.min(1,elapsed/this.reloadTimer);
      this.reloadBg.clear(); this.reloadFill.clear();
      this.reloadBg.fillStyle(0x1a1a1a,0.9); this.reloadBg.fillRect(W/2-60,H-105,120,10);
      this.reloadFill.fillStyle(0xfbbf24); this.reloadFill.fillRect(W/2-60,H-105,120*pct,10);
      this.reloadBg.setVisible(true); this.reloadFill.setVisible(true); this.reloadText.setVisible(true);
      if (pct>=1) { this.reloadBg.setVisible(false); this.reloadFill.setVisible(false); this.reloadText.setVisible(false); }
    } else {
      this.reloadBg.setVisible(false); this.reloadFill.setVisible(false); this.reloadText.setVisible(false);
    }

    if (this.nearestItem&&!IS_MOBILE) {
      this.pickupHint.setText(`[F] ${ITEM_ICON[this.nearestItem.type]||''} ${this.nearestItem.type} 줍기`).setVisible(true);
    } else if (!this.throwing) {
      this.pickupHint.setVisible(false);
    }

    if (this.mechaTimeLeft>0) {
      this.mechaTimeLeft=Math.max(0,this.mechaTimeLeft-dt);
      this.mechaTimerText.setText(`🤖 ${this.mechaTimeLeft.toFixed(1)}초`).setVisible(true);
    } else {
      this.mechaTimerText.setVisible(false);
    }

    if (this.throwing) {
      this.pickupHint.setText(`💣 ${this.selectedGrenade} 투척 - ${IS_MOBILE?'오른쪽 탭':'클릭'}으로 투척`).setVisible(true);
    }

    // Mobile inventory icons update
    if (IS_MOBILE && this._mobInv) {
      this._mobInv.forEach((sl, i) => {
        const item = inv[i];
        sl.innerHTML = item
          ? `<span style="font-size:18px">${ITEM_ICON[item]||'?'}</span><span style="font-size:7px;color:rgba(255,255,255,0.38)">${i+3}</span>`
          : `<span style="font-size:8px;color:rgba(255,255,255,0.2)">${i+3}</span>`;
        sl.style.opacity = item ? '1' : '0.4';
      });
    }

    // Mobile pickup hint
    if (IS_MOBILE && this._mobPickupLabel) {
      this._mobPickupLabel.textContent = this.nearestItem
        ? `${ITEM_ICON[this.nearestItem.type]||''} 줍기!` : '';
    }
  }

  // ── Explosion FX ─────────────────────────────────────────
  _updateEffects(dt) {
    if (!this._fxG) this._fxG=this.add.graphics().setDepth(15);
    const g=this._fxG; g.clear();
    const now=Date.now();
    this.explosionFx=this.explosionFx.filter(e=>now-e.t<e.dur);
    for(const e of this.explosionFx) {
      const pct=1-(now-e.t)/e.dur;
      if (e.muzzle) { g.fillStyle(0xffff44,pct*0.8); g.fillCircle(e.x,e.y,e.r*pct); }
      else {
        g.fillStyle(0xff4400,pct*0.6); g.fillCircle(e.x,e.y,e.r*pct);
        g.fillStyle(0xffaa00,pct*0.8); g.fillCircle(e.x,e.y,e.r*pct*0.6);
        g.fillStyle(0xffffff,pct*0.9); g.fillCircle(e.x,e.y,e.r*pct*0.3);
      }
    }
  }

  // ── Toast / Overlay ───────────────────────────────────────
  _toast(msg) {
    const t=document.getElementById('toast');
    t.textContent=msg; t.style.display='block';
    clearTimeout(this._toastTimer);
    this._toastTimer=setTimeout(()=>t.style.display='none',2500);
  }

  _showDead(killer,weapon) {
    if (this._mobOv) this._mobOv.style.display='none';
    const div=document.createElement('div');
    div.style.cssText=`position:fixed;inset:0;background:rgba(0,0,0,0.75);
      display:flex;align-items:center;justify-content:center;z-index:200;flex-direction:column;gap:16px;`;
    div.innerHTML=`
      <div style="font-size:3rem">💀</div>
      <div style="color:#ef4444;font-size:2rem;font-weight:bold;font-family:sans-serif">사망</div>
      <div style="color:#9ca3af;font-size:1rem;font-family:sans-serif">
        ${killer?`${killer}에게 [${weapon}]으로 사망`:`[${weapon}]으로 사망`}
      </div>
      <button onclick="location.reload()" style="margin-top:12px;padding:14px 40px;
        background:linear-gradient(135deg,#ffd700,#f97316);border:none;border-radius:10px;
        color:#111;font-size:1rem;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent;">메뉴로</button>
    `;
    document.body.appendChild(div);
  }

  _showGameOver(winner) {
    if (this._mobOv) this._mobOv.style.display='none';
    const isWinner=winner&&this.gs?.players?.find(p=>p.sid===this.myId)?.name===winner;
    const div=document.createElement('div');
    div.style.cssText=`position:fixed;inset:0;background:rgba(0,0,0,0.82);
      display:flex;align-items:center;justify-content:center;z-index:200;flex-direction:column;gap:18px;`;
    div.innerHTML=`
      <div style="font-size:3rem">${isWinner?'🏆':'💀'}</div>
      <div style="color:${isWinner?'#ffd700':'#ef4444'};font-size:2.4rem;font-weight:bold;font-family:sans-serif;
        text-shadow:0 0 20px ${isWinner?'rgba(255,215,0,0.6)':'rgba(239,68,68,0.6)'}">
        ${isWinner?'WINNER!':'게임 종료'}
      </div>
      <div style="color:#d1d5db;font-size:1.1rem;font-family:sans-serif">
        ${winner?`🏆 ${winner} 승리!`:'무승부'}
      </div>
      <button onclick="location.reload()" style="margin-top:16px;padding:14px 44px;
        background:linear-gradient(135deg,#ffd700,#f97316);border:none;border-radius:10px;
        color:#111;font-size:1.1rem;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent;">메뉴로 돌아가기</button>
    `;
    document.body.appendChild(div);
  }
}

// ═══════════════════════════════════════════════════════════
// PHASER CONFIG
// ═══════════════════════════════════════════════════════════
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0a0a14',
  scene: [MenuScene, WaitScene, GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    mouse: { preventDefaultWheel: false },
    touch: true,
  },
};

const game = new Phaser.Game(config);

// game_start 는 각 씬(MenuScene/WaitScene)의 socket.once 핸들러가 처리
