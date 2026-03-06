// ═══════════════════════════════════════════════════════════
// BATTLEGROUND 2D — Client (Phaser 3)
// ═══════════════════════════════════════════════════════════
const socket = io();

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
    // BG gradient
    const bg=this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a,0x0a0a1a,0x1a0a2e,0x1a0a2e,1);
    bg.fillRect(0,0,W,H);
    // Stars
    for(let i=0;i<120;i++){
      const g=this.add.graphics();
      g.fillStyle(0xffffff,Math.random()*0.8+0.2);
      g.fillCircle(Math.random()*W,Math.random()*H,Math.random()*1.5+0.5);
    }
    // Title
    this.add.text(W/2,H*0.18,'BATTLEGROUND 2D',{
      fontSize:Math.min(52,W/12)+'px',fontStyle:'bold',
      color:'#ffd700',stroke:'#ff6600',strokeThickness:4,
      shadow:{blur:20,color:'#ff6600',fill:true}
    }).setOrigin(0.5);
    this.add.text(W/2,H*0.27,'탑다운 배틀로얄 | 최대 8인',{
      fontSize:'16px',color:'#9ca3af'
    }).setOrigin(0.5);

    // Name input
    const inputDiv=document.createElement('div');
    inputDiv.style.cssText=`position:fixed;left:50%;top:${H*0.38}px;transform:translateX(-50%);
      display:flex;flex-direction:column;align-items:center;gap:14px;width:300px;z-index:5;`;
    const inp=document.createElement('input');
    inp.placeholder='닉네임 입력';
    inp.maxLength=14;
    inp.style.cssText=`width:100%;padding:12px 16px;border-radius:10px;border:2px solid rgba(255,215,0,0.4);
      background:rgba(255,255,255,0.08);color:#fff;font-size:16px;outline:none;text-align:center;`;
    inp.addEventListener('focus',()=>inp.style.borderColor='#ffd700');
    inp.addEventListener('blur',()=>inp.style.borderColor='rgba(255,215,0,0.4)');
    inputDiv.appendChild(inp);

    const mkBtn=(text,bg,cb)=>{
      const b=document.createElement('button');
      b.textContent=text;
      b.style.cssText=`width:100%;padding:13px;border:none;border-radius:10px;background:${bg};
        color:#111;font-size:15px;font-weight:700;cursor:pointer;transition:transform .1s;`;
      b.onmouseenter=()=>b.style.transform='translateY(-2px)';
      b.onmouseleave=()=>b.style.transform='';
      b.onclick=cb;
      return b;
    };
    const btnOnline=mkBtn('🌐 온라인 매칭하기','linear-gradient(135deg,#ffd700,#f97316)',()=>{
      const name=inp.value.trim()||'플레이어';
      document.body.removeChild(inputDiv);
      this.scene.start('Wait',{name,mode:'online'});
    });
    const btnSolo=mkBtn('🎮 솔로 테스트','rgba(255,255,255,0.15)',()=>{
      const name=inp.value.trim()||'플레이어';
      document.body.removeChild(inputDiv);
      socket.emit('solo',{name});
    });
    btnSolo.style.color='#fff';
    inputDiv.appendChild(btnOnline);
    inputDiv.appendChild(btnSolo);
    document.body.appendChild(inputDiv);
    this.inputDiv=inputDiv;

    // Controls hint
    const hints=[
      'WASD: 이동  |  마우스: 조준  |  좌클릭: 사격',
      'R: 재장전  |  E: 메카탑승  |  F: 아이템줍기',
      'G: 수류탄  |  1/2: 무기전환  |  우클릭: 조준경',
      '숫자키 3~8: 아이템 사용  |  Shift: 달리기',
    ];
    hints.forEach((h,i)=>{
      this.add.text(W/2,H*0.72+i*22,h,{fontSize:'13px',color:'#6b7280'}).setOrigin(0.5);
    });

    socket.on('game_start', data=>{
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
    btn.style.cssText=`padding:10px 32px;border:1px solid rgba(255,255,255,0.3);border-radius:8px;
      background:transparent;color:#9ca3af;font-size:14px;cursor:pointer;`;
    btn.onclick=()=>{ socket.emit('cancel'); document.body.removeChild(cancelDiv); this.scene.start('Menu'); };
    cancelDiv.appendChild(btn);
    document.body.appendChild(cancelDiv);
    this.cancelDiv=cancelDiv;

    socket.emit('join',{name:this.name});
    socket.on('waiting',({count})=>{ if(this.countText) this.countText.setText(`대기 중 ${count}명`); });
    socket.on('game_start',data=>{
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
  }

  create() {
    const W=this.scale.width, H=this.scale.height;
    this.W=W; this.H=H;

    // Static map RT
    this._buildMap();

    // Camera
    this.cameras.main.setBounds(0,0,this.mapSize,this.mapSize);
    this.cameras.main.setZoom(1);

    // Input
    this.keys=this.input.keyboard.addKeys('W,A,S,D,R,G,E,F,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,SHIFT');
    this.input.mouse.disableContextMenu();

    // Fog-of-war canvas texture
    this.fogCT=this.textures.createCanvas('fog',W,H);
    this.fogImg=this.add.image(0,0,'fog').setOrigin(0,0).setDepth(80).setScrollFactor(0);

    // Minimap canvas
    const MM=160;
    this.mmSize=MM;
    this.mmCT=this.textures.createCanvas('mm',MM,MM);
    this.mmImg=this.add.image(W-MM-12,12,'mm').setOrigin(0,0).setDepth(95).setScrollFactor(0);
    // MM border
    const mmBorder=this.add.graphics().setScrollFactor(0).setDepth(94);
    mmBorder.lineStyle(2,0xffd700,0.7);
    mmBorder.strokeRect(W-MM-12,12,MM,MM);

    // HUD layer (depth 90+)
    this._buildHUD();

    // Crosshair
    this.crosshair=this.add.graphics().setDepth(92).setScrollFactor(0);

    // Socket events
    this._setupSocket();

    // Start at spawn
    this.camX=this.spawn.x; this.camY=this.spawn.y;
    this.cameras.main.centerOn(this.camX,this.camY);
  }

  // ── Map ──────────────────────────────────────────────────
  _buildMap() {
    const MS=this.mapSize;
    const g=this.add.graphics().setDepth(0);

    // Base ground
    g.fillStyle(0x7a6040); g.fillRect(0,0,MS,MS);

    // Roads
    g.fillStyle(0x5a5a52,0.6);
    g.fillRect(0,MS/2-40,MS,80);
    g.fillRect(MS/2-40,0,80,MS);

    // Forest NW
    g.fillStyle(0x3a6a28);
    for(let i=0;i<200;i++) g.fillCircle(100+Math.random()*700,100+Math.random()*1000,18+Math.random()*22);
    // Forest SE
    for(let i=0;i<150;i++) g.fillCircle(3100+Math.random()*700,3000+Math.random()*800,18+Math.random()*22);

    // City
    g.fillStyle(0x606060); g.fillRect(1560,1560,810,810);
    g.fillStyle(0x505050,0.5);
    for(let i=0;i<12;i++) g.fillRect(1570+i*60,1560,4,810);
    for(let i=0;i<12;i++) g.fillRect(1560,1570+i*60,810,4);

    // Military base
    g.fillStyle(0x384228); g.fillRect(3340,140,480,530);
    g.lineStyle(3,0x4a5a32); g.strokeRect(3340,140,480,530);
    g.fillStyle(0x2a3218);
    [3440,3640].forEach(x=>{ [200,360].forEach(y=>g.fillRect(x,y,10,10)); });

    // Trees (dark circles on forest)
    g.fillStyle(0x1e3a12);
    for(let i=0;i<60;i++) g.fillCircle(120+Math.random()*660,120+Math.random()*960,10+Math.random()*12);
    for(let i=0;i<50;i++) g.fillCircle(3120+Math.random()*660,3020+Math.random()*760,10+Math.random()*12);

    // Buildings
    for(const o of this.obstacles) {
      g.fillStyle(0x888888); g.fillRect(o.x,o.y,o.w,o.h);
      g.fillStyle(0xa0a0a0,0.3);
      g.fillRect(o.x+4,o.y+4,o.w-8,6);
      g.lineStyle(2,0x555555); g.strokeRect(o.x,o.y,o.w,o.h);
    }

    // Border
    g.lineStyle(12,0x1a1a1a); g.strokeRect(0,0,MS,MS);
    g.fillStyle(0x1a1a1a);
    g.fillRect(0,0,MS,8); g.fillRect(0,MS-8,MS,8);
    g.fillRect(0,0,8,MS); g.fillRect(MS-8,0,8,MS);
  }

  // ── HUD ──────────────────────────────────────────────────
  _buildHUD() {
    const W=this.W, H=this.H;
    const d=90, sf=0;

    // === Bottom bar bg ===
    const bbg=this.add.graphics().setScrollFactor(sf).setDepth(d);
    bbg.fillStyle(0x000000,0.55);
    bbg.fillRect(0,H-90,W,90);

    // HP bar track
    this.hpTrack=this.add.graphics().setScrollFactor(sf).setDepth(d+1);
    this.hpFill =this.add.graphics().setScrollFactor(sf).setDepth(d+1);
    this.hpText =this.add.text(14,H-80,'HP: 100',{fontSize:'13px',color:'#fff',fontStyle:'bold'}).setScrollFactor(sf).setDepth(d+2);

    // Armor
    this.helmetIcon=this.add.text(14,H-62,'',{fontSize:'18px'}).setScrollFactor(sf).setDepth(d+2);
    this.vestIcon  =this.add.text(40,H-62,'',{fontSize:'18px'}).setScrollFactor(sf).setDepth(d+2);
    this.helmetLv  =this.add.text(14,H-44,'',{fontSize:'10px',color:'#60a5fa'}).setScrollFactor(sf).setDepth(d+2);
    this.vestLv    =this.add.text(40,H-44,'',{fontSize:'10px',color:'#34d399'}).setScrollFactor(sf).setDepth(d+2);

    // Zone timer (top center)
    this.zoneBg=this.add.graphics().setScrollFactor(sf).setDepth(d);
    this.zoneText=this.add.text(W/2,14,'',{fontSize:'14px',color:'#4488ff',fontStyle:'bold',
      stroke:'#000',strokeThickness:3}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5,0);

    // Kill feed (top left)
    this.feedTexts=[];
    for(let i=0;i<5;i++)
      this.feedTexts.push(this.add.text(12,12+i*22,'',{fontSize:'12px',color:'#fff',
        stroke:'#000',strokeThickness:3}).setScrollFactor(sf).setDepth(d+2));

    // Player count (top right, above minimap)
    this.aliveText=this.add.text(W-this.mmSize-12,this.mmSize+18,'',{
      fontSize:'13px',color:'#ffd700',fontStyle:'bold',stroke:'#000',strokeThickness:3
    }).setScrollFactor(sf).setDepth(d+2);

    // Weapon slots (bottom center)
    this.weapSlots=[];
    for(let i=0;i<2;i++) {
      const cx=W/2-70+i*140;
      const slotBg=this.add.graphics().setScrollFactor(sf).setDepth(d);
      this.weapSlots.push({
        bg: slotBg,
        icon: this.add.text(cx,H-60,'',{fontSize:'22px'}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5),
        name: this.add.text(cx,H-36,'',{fontSize:'11px',color:'#d1d5db'}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5),
        mag:  this.add.text(cx,H-22,'',{fontSize:'11px',color:'#fbbf24'}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5),
      });
    }
    const WICONS={pistol:'🔫',rifle:'🔫',sniper:'🎯',shotgun:'🔫',smg:'🔫',lmg:'🔫'};
    this._wicons=WICONS;

    // Ammo (right of weapons)
    this.ammoText=this.add.text(W/2+90,H-60,'',{fontSize:'14px',color:'#fbbf24',fontStyle:'bold'}).setScrollFactor(sf).setDepth(d+2);
    this.ammoReserveText=this.add.text(W/2+90,H-40,'',{fontSize:'11px',color:'#9ca3af'}).setScrollFactor(sf).setDepth(d+2);

    // Inventory (bottom right)
    this.invSlots=[];
    for(let i=0;i<6;i++) {
      const ix=W-210+i*34, iy=H-42;
      this.invSlots.push({
        bg:this.add.graphics().setScrollFactor(sf).setDepth(d),
        icon:this.add.text(ix+17,iy+17,'',{fontSize:'14px'}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5),
        key:this.add.text(ix+4,iy+3,String(i+3),{fontSize:'9px',color:'#6b7280'}).setScrollFactor(sf).setDepth(d+2),
      });
    }

    // Reload bar
    this.reloadBg  =this.add.graphics().setScrollFactor(sf).setDepth(d+3).setVisible(false);
    this.reloadFill=this.add.graphics().setScrollFactor(sf).setDepth(d+3).setVisible(false);
    this.reloadText=this.add.text(W/2,H-100,'재장전 중...',{fontSize:'12px',color:'#fbbf24'}).setScrollFactor(sf).setDepth(d+3).setOrigin(0.5).setVisible(false);

    // Pickup hint
    this.pickupHint=this.add.text(W/2,H-100,'',{fontSize:'13px',color:'#86efac',stroke:'#000',strokeThickness:3}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5).setVisible(false);

    // Mecha timer
    this.mechaTimerText=this.add.text(W/2,H-135,'',{fontSize:'18px',color:'#4488ff',fontStyle:'bold',stroke:'#000',strokeThickness:4}).setScrollFactor(sf).setDepth(d+2).setOrigin(0.5).setVisible(false);

    // Scope text
    this.scopeText=this.add.text(W-this.mmSize-12,this.mmSize+36,'',{fontSize:'11px',color:'#c084fc'}).setScrollFactor(sf).setDepth(d+2);
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

    socket.on('you_died',({killer,weapon})=>{
      this.dead=true;
      this._showDead(killer,weapon);
    });

    socket.on('game_over',({winner})=>{
      this.gameOver=true;
      this._showGameOver(winner);
    });

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

    // Camera follow
    this.cameras.main.centerOn(this.camX,this.camY);
  }

  _handleInput() {
    if (this.dead||this.gameOver) return;
    const K=this.keys;
    const inp={
      up:   K.W.isDown,
      down: K.S.isDown,
      left: K.A.isDown,
      right:K.D.isDown,
      sprint:K.SHIFT.isDown,
    };
    const cam=this.cameras.main;
    const mx=this.input.mousePointer.x+cam.scrollX;
    const my=this.input.mousePointer.y+cam.scrollY;
    const me=this.gs?.players.find(p=>p.sid===this.myId);
    const angle=me?Math.atan2(my-me.y,mx-me.x):0;

    // Send input 20x/s
    const now=Date.now();
    if(!this.lastSendT||now-this.lastSendT>=50) {
      socket.emit('input',{input:inp,angle});
      this.lastSendT=now;
    }

    // Shooting (left click held)
    if (this.input.mousePointer.isDown&&!this.throwing) {
      if (now-this.lastShoot>60) {
        socket.emit('shoot',{angle}); this.lastShoot=now;
        // Client-side bullet flash
        if (me) this.explosionFx.push({x:me.x,y:me.y,r:8,t:now,dur:60,muzzle:true});
      }
    }

    // Right click: toggle aim
    if (this.input.mousePointer.rightButtonDown()&&!this.wasRClick) {
      this.aiming=!this.aiming;
      socket.emit('input',{input:inp,angle,aiming:this.aiming});
    }
    this.wasRClick=this.input.mousePointer.rightButtonDown();

    // R: reload
    if (Phaser.Input.Keyboard.JustDown(K.R)) socket.emit('reload');
    // E: mecha
    if (Phaser.Input.Keyboard.JustDown(K.E)) socket.emit('mecha');
    // F: pickup
    if (Phaser.Input.Keyboard.JustDown(K.F)) this._pickupNearest();
    // 1/2: weapon switch
    if (Phaser.Input.Keyboard.JustDown(K.ONE)) { socket.emit('switch',{slot:0}); this.activeSlot=0; }
    if (Phaser.Input.Keyboard.JustDown(K.TWO)) { socket.emit('switch',{slot:1}); this.activeSlot=1; }
    // G: throw (click sets target)
    if (Phaser.Input.Keyboard.JustDown(K.G)&&me) {
      const inv=this.gs.myInventory||[];
      const gtype=inv.find(t=>['grenade','smoke','flash'].includes(t));
      if (gtype) {
        this.throwing=!this.throwing;
        this.selectedGrenade=this.throwing?gtype:null;
      }
    }
    if (this.throwing&&me&&this.input.mousePointer.isDown&&!this.wasLClick2) {
      socket.emit('throw',{type:this.selectedGrenade,x:mx,y:my});
      this.throwing=false; this.selectedGrenade=null;
    }
    this.wasLClick2=this.throwing&&this.input.mousePointer.isDown;

    // 3-8: use heal
    const healKeys=[K.THREE,K.FOUR,K.FIVE,K.SIX,K.SEVEN,K.EIGHT];
    healKeys.forEach((k,i)=>{
      if (Phaser.Input.Keyboard.JustDown(k)) {
        const inv=this.gs?.myInventory||[];
        if (inv[i]) socket.emit('heal',{type:inv[i]});
      }
    });

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
    // Clear previous dynamic graphics
    if (this._dynG) this._dynG.destroy();
    this._dynG=this.add.graphics().setDepth(10);
    const g=this._dynG;

    const me=this.gs.players.find(p=>p.sid===this.myId);

    // Smoke areas
    for(const s of (this.gs.smokes||[])) {
      g.fillStyle(0x888888,0.5); g.fillCircle(s.x,s.y,s.r);
      g.fillStyle(0xaaaaaa,0.2); g.fillCircle(s.x,s.y,s.r*0.7);
    }

    // Items on ground (only near player)
    const items=this.gs.items||[];
    let nearest=null, nearDist=80;
    for(const item of items) {
      const col=Phaser.Display.Color.HexStringToColor(ITEM_COLOR[item.type]||'#ffffff');
      g.fillStyle(col.color,0.9);
      g.fillCircle(item.x,item.y,8);
      g.lineStyle(2,0xffffff,0.5); g.strokeCircle(item.x,item.y,8);
      if (me) {
        const d=Math.hypot(item.x-me.x,item.y-me.y);
        if (d<nearDist) { nearDist=d; nearest=item; }
      }
    }
    this.nearestItem=nearest;

    // Mechas
    for(const m of (this.gs.mechas||[])) {
      if (m.hp<=0) continue;
      const haveP=!!m.pilotId;
      g.fillStyle(haveP?0x2244ff:0x4466cc,0.9); g.fillRect(m.x-22,m.y-22,44,44);
      g.lineStyle(3,haveP?0x88aaff:0x4488ff); g.strokeRect(m.x-22,m.y-22,44,44);
      // HP bar
      const hw=40*(m.hp/m.maxHp);
      g.fillStyle(0x333333); g.fillRect(m.x-20,m.y-30,40,5);
      g.fillStyle(0x4488ff); g.fillRect(m.x-20,m.y-30,hw,5);
    }

    // Other players
    for(const p of (this.gs.players||[])) {
      if (!p.alive) continue;
      const isMe=(p.sid===this.myId);
      const col=isMe?0x00ff88:(p.inMecha?0x4488ff:0xff4444);

      if (p.inMecha) {
        // Big mecha body around pilot
        g.lineStyle(3,col); g.strokeRect(p.x-24,p.y-24,48,48);
      }

      // Body circle
      g.fillStyle(col,isMe?1:0.9); g.fillCircle(p.x,p.y,14);
      // Direction indicator
      const a=p.angle||0;
      g.lineStyle(3,0xffffff,0.9);
      g.strokeLineShape(new Phaser.Geom.Line(p.x,p.y,p.x+Math.cos(a)*20,p.y+Math.sin(a)*20));

      // Armor ring
      if (p.helmet>0) {
        g.lineStyle(2,[0xffffff,0x60a5fa,0xfbbf24][p.helmet-1]||0x60a5fa,0.7);
        g.strokeCircle(p.x,p.y,17);
      }

      // HP bar (above player)
      if (!isMe) {
        const hw=26*(p.hp/100);
        g.fillStyle(0x1a1a1a,0.8); g.fillRect(p.x-13,p.y-24,26,5);
        g.fillStyle(p.hp>50?0x22c55e:p.hp>25?0xf59e0b:0xef4444);
        g.fillRect(p.x-13,p.y-24,hw,5);
      }

      // Name
      if (!isMe) {
        this.add.text(p.x,p.y-30,p.name,{
          fontSize:'10px',color:'#e5e7eb',stroke:'#000',strokeThickness:3
        }).setDepth(11).setOrigin(0.5).setName('__nametag')
          .once('destroy',()=>{});
        // (will be cleaned up next frame when dynG is destroyed)
      }
    }

    // Bullets
    for(const b of (this.gs.bullets||[])) {
      const col=b.type==='missile'?0xff6600:(WEAPON_COLOR[b.type]||0xffff44);
      g.fillStyle(col,1);
      if (b.type==='missile') g.fillRect(b.x-3,b.y-3,6,6);
      else g.fillCircle(b.x,b.y,3);
    }

    // Grenade throw indicator
    if (this.throwing&&me) {
      g.lineStyle(2,0xfbcb04,0.8);
      g.strokeCircle(me.x,me.y,340);
      const cam=this.cameras.main;
      const mx=this.input.mousePointer.x+cam.scrollX;
      const my2=this.input.mousePointer.y+cam.scrollY;
      const a=Math.atan2(my2-me.y,mx-me.x);
      const dist=Math.min(340,Math.hypot(mx-me.x,my2-me.y));
      const lx=me.x+Math.cos(a)*dist, ly=me.y+Math.sin(a)*dist;
      g.fillStyle(0xfbcb04,0.7); g.fillCircle(lx,ly,10);
      g.lineStyle(1,0xfbcb04,0.4);
      g.lineBetween(me.x,me.y,lx,ly);
    }

    // Safe zone overlay
    const sz=this.gs.sz;
    if (sz) {
      g.lineStyle(3,0x4488ff,0.8); g.strokeCircle(sz.cx,sz.cy,sz.r);
      // Next zone (dashed effect - just a thin line)
      if (this.gs.shrinking) {
        g.lineStyle(2,0x4488ff,0.3); g.strokeCircle(sz.ncx,sz.ncy,sz.nr);
      }
    }

    // Mecha proximity indicator
    if (me&&!me.inMecha) {
      for(const m of (this.gs.mechas||[])) {
        if (!m.pilotId&&Math.hypot(m.x-me.x,m.y-me.y)<65) {
          g.lineStyle(2,0xffd700,0.9); g.strokeCircle(m.x,m.y,26);
        }
      }
    }

    // Crosshair
    this._drawCrosshair(me);
  }

  _drawCrosshair(me) {
    const g=this.crosshair;
    g.clear();
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
    if (this.throwing) {
      g.lineStyle(2,0xfbcb04,0.9); g.strokeCircle(cx,cy,14);
    }
  }

  // ── Fog ──────────────────────────────────────────────────
  _updateFog() {
    const me=this.gs?.players.find(p=>p.sid===this.myId);
    if (!me||!me.alive) return;
    const cam=this.cameras.main;
    const sx=me.x-cam.scrollX, sy=me.y-cam.scrollY;
    const scope=this.gs.myScope;
    const baseVis=this.aiming&&scope?{scope2x:420,scope4x:490,scope8x:560,scope12x:650}[scope]||350:350;

    const ctx=this.fogCT.context;
    ctx.clearRect(0,0,this.W,this.H);
    ctx.fillStyle='rgba(0,0,0,0.88)';
    ctx.fillRect(0,0,this.W,this.H);

    // Erase vision circle with gradient
    const grad=ctx.createRadialGradient(sx,sy,baseVis*0.65,sx,sy,baseVis);
    grad.addColorStop(0,'rgba(0,0,0,1)');
    grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalCompositeOperation='destination-out';
    ctx.fillStyle=grad;
    ctx.beginPath(); ctx.arc(sx,sy,baseVis,0,Math.PI*2); ctx.fill();

    // Smoke reduces vision further (draw small dark circles in smoke)
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

    // Scope zoom
    if (this.aiming&&scope) {
      const zoom={scope2x:1.6,scope4x:2.2,scope8x:2.8,scope12x:3.4}[scope]||1;
      this.cameras.main.setZoom(zoom);
    } else {
      this.cameras.main.setZoom(1);
    }
  }

  // ── Minimap ───────────────────────────────────────────────
  _updateMinimap() {
    if (!this.gs) return;
    const MM=this.mmSize, SC=MM/this.mapSize;
    const ctx=this.mmCT.context;
    ctx.clearRect(0,0,MM,MM);
    ctx.fillStyle='#0a0a14';
    ctx.fillRect(0,0,MM,MM);

    // Terrain hint
    ctx.fillStyle='#1a3010'; ctx.fillRect(0,0,MM*0.2,MM*0.28);
    ctx.fillStyle='#1a1a18'; ctx.fillRect(MM*0.39,MM*0.39,MM*0.22,MM*0.22);
    ctx.fillStyle='#0e1208'; ctx.fillRect(MM*0.835,MM*0.035,MM*0.13,MM*0.14);

    // Roads
    ctx.fillStyle='rgba(100,100,90,0.5)';
    ctx.fillRect(0,MM/2-2,MM,4); ctx.fillRect(MM/2-2,0,4,MM);

    // Obstacles (mini)
    ctx.fillStyle='#666';
    for(const o of this.obstacles)
      ctx.fillRect(o.x*SC,o.y*SC,Math.max(2,o.w*SC),Math.max(2,o.h*SC));

    // All item dots (from allItems)
    ctx.fillStyle='rgba(251,207,36,0.4)';
    for(const i of (this.gs.allItems||[]))
      ctx.fillRect(i.x*SC-1,i.y*SC-1,2,2);

    // Safe zone
    const sz=this.gs.sz;
    if (sz) {
      ctx.strokeStyle='rgba(68,136,255,0.8)';ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(sz.cx*SC,sz.cy*SC,sz.r*SC,0,Math.PI*2); ctx.stroke();
      if (this.gs.shrinking) {
        ctx.strokeStyle='rgba(68,136,255,0.3)';ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(sz.ncx*SC,sz.ncy*SC,sz.nr*SC,0,Math.PI*2); ctx.stroke();
      }
    }

    // Mechas
    for(const m of (this.gs.mechas||[])) {
      ctx.fillStyle=m.pilotId?'#4488ff':'#88aaff';
      ctx.fillRect(m.x*SC-3,m.y*SC-3,6,6);
    }

    // Players
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
    const me=this.gs.players?.find(p=>p.sid===this.myId);

    // HP
    const hp=Math.max(0,this.gs.myHp||0);
    const hpPct=hp/100;
    const hpCol=hp>50?0x22c55e:hp>25?0xf59e0b:0xef4444;
    this.hpTrack.clear(); this.hpFill.clear();
    this.hpTrack.fillStyle(0x1a1a1a,0.8); this.hpTrack.fillRect(12,H-85,160,14);
    this.hpFill.fillStyle(hpCol); this.hpFill.fillRect(12,H-85,160*hpPct,14);
    this.hpText.setText(`HP: ${Math.ceil(hp)}`);

    // Armor
    const hlv=this.gs.myHelmet||0, vlv=this.gs.myVest||0;
    this.helmetIcon.setText(hlv?'⛑️':''); this.helmetLv.setText(hlv?`Lv${hlv}`:'');
    this.vestIcon.setText(vlv?'🦺':''); this.vestLv.setText(vlv?`Lv${vlv}`:'');

    // Weapons
    const wnames={pistol:'권총',rifle:'라이플',sniper:'저격총',shotgun:'산탄총',smg:'SMG',lmg:'LMG'};
    const wicons={pistol:'🔫',rifle:'🔫',sniper:'🎯',shotgun:'🔫',smg:'🔫',lmg:'🔫'};
    for(let i=0;i<2;i++) {
      const sl=this.weapSlots[i];
      const wt=this.gs.myWeapons?.[i];
      const isActive=this.gs.players?.find(p=>p.sid===this.myId)?.activeWeapon===i || this.activeSlot===i;
      sl.bg.clear();
      sl.bg.fillStyle(isActive?0x1e3a5f:0x111827,0.8);
      sl.bg.fillRect(W/2-100+i*140-30,H-68,60,56);
      if (isActive) { sl.bg.lineStyle(2,0x4488ff); sl.bg.strokeRect(W/2-100+i*140-30,H-68,60,56); }
      sl.icon.setText(wt?(wicons[wt]||'🔫'):'');
      sl.name.setText(wt?(wnames[wt]||wt):'');
      sl.mag.setText(wt?`${this.gs.myMag?.[i]||0}발`:'');
    }

    // Active weapon ammo
    const aw=this.gs.myWeapons?.[this.activeSlot];
    const ammoMap={pistol:'pistol',rifle:'rifle',sniper:'sniper',shotgun:'shotgun',smg:'smg',lmg:'rifle'};
    const ammoType=ammoMap[aw];
    this.ammoText.setText(aw?`${this.gs.myMag?.[this.activeSlot]||0}`:'');
    this.ammoReserveText.setText(ammoType?`/ ${this.gs.myAmmo?.[ammoType]||0}`:'');

    // Inventory
    const inv=this.gs.myInventory||[];
    for(let i=0;i<6;i++) {
      const sl=this.invSlots[i];
      const item=inv[i];
      sl.bg.clear();
      sl.bg.fillStyle(0x111827,0.8); sl.bg.fillRect(W-210+i*34,H-44,30,30);
      if (item) { sl.bg.lineStyle(1,0x374151); sl.bg.strokeRect(W-210+i*34,H-44,30,30); }
      sl.icon.setText(item?(ITEM_ICON[item]||'?'):'');
    }

    // Kill feed (with expire)
    const now=Date.now();
    const validFeed=(this.gs.killFeed||[]).slice(0,5);
    for(let i=0;i<5;i++) {
      const entry=validFeed[i];
      if (entry) {
        const txt=entry.killer?`${entry.killer} ⚡ ${entry.victim}`:` 💀 ${entry.victim}`;
        this.feedTexts[i].setText(txt);
        this.feedTexts[i].setAlpha(1);
      } else {
        this.feedTexts[i].setText('');
      }
    }

    // Zone timer
    const phase=this.gs.phase||0;
    const shrinking=this.gs.shrinking;
    if (phase<5) {
      this.zoneText.setText(shrinking?'🔵 블루존 수축 중!':'🔵 블루존 이동 예정');
      this.zoneText.setColor(shrinking?'#4488ff':'#88aaff');
    } else {
      this.zoneText.setText('⚡ 최후의 전장!');
    }

    // Alive count
    const aliveCount=(this.gs.players||[]).filter(p=>p.alive).length;
    this.aliveText.setText(`👥 ${aliveCount}명 생존`);

    // Scope display
    const sc=this.gs.myScope;
    this.scopeText.setText(sc?`🔭 ${{scope2x:'2배',scope4x:'4배',scope8x:'8배',scope12x:'12배'}[sc]}배율 조준경`:'');

    // Reload bar
    if (this.gs.reloading&&this.reloadTimer>0) {
      const elapsed=Date.now()-(this.reloadStart||Date.now());
      const pct=Math.min(1,elapsed/this.reloadTimer);
      this.reloadBg.clear(); this.reloadFill.clear();
      this.reloadBg.fillStyle(0x1a1a1a,0.9); this.reloadBg.fillRect(W/2-60,H-108,120,10);
      this.reloadFill.fillStyle(0xfbbf24); this.reloadFill.fillRect(W/2-60,H-108,120*pct,10);
      this.reloadBg.setVisible(true); this.reloadFill.setVisible(true); this.reloadText.setVisible(true);
      if (pct>=1) { this.reloadBg.setVisible(false); this.reloadFill.setVisible(false); this.reloadText.setVisible(false); }
    } else {
      this.reloadBg.setVisible(false); this.reloadFill.setVisible(false); this.reloadText.setVisible(false);
    }

    // Pickup hint
    if (this.nearestItem) {
      this.pickupHint.setText(`[F] ${ITEM_ICON[this.nearestItem.type]||''} ${this.nearestItem.type} 줍기`).setVisible(true);
    } else {
      this.pickupHint.setVisible(false);
    }

    // Mecha timer
    if (this.mechaTimeLeft>0) {
      this.mechaTimeLeft=Math.max(0,this.mechaTimeLeft-dt);
      this.mechaTimerText.setText(`🤖 ${this.mechaTimeLeft.toFixed(1)}초`).setVisible(true);
    } else {
      this.mechaTimerText.setVisible(false);
    }

    // Grenade mode hint
    if (this.throwing) {
      this.pickupHint.setText(`💣 ${this.selectedGrenade} 투척 - 클릭으로 투척 지점 선택`).setVisible(true);
    }
  }

  // ── Explosion FX ─────────────────────────────────────────
  _updateEffects(dt) {
    if (!this._fxG) this._fxG=this.add.graphics().setDepth(15);
    const g=this._fxG;
    g.clear();
    const now=Date.now();
    this.explosionFx=this.explosionFx.filter(e=>now-e.t<e.dur);
    for(const e of this.explosionFx) {
      const pct=1-(now-e.t)/e.dur;
      if (e.muzzle) {
        g.fillStyle(0xffff44,pct*0.8); g.fillCircle(e.x,e.y,e.r*pct);
      } else {
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
    const div=document.createElement('div');
    div.style.cssText=`position:fixed;inset:0;background:rgba(0,0,0,0.75);
      display:flex;align-items:center;justify-content:center;z-index:50;flex-direction:column;gap:16px;`;
    div.innerHTML=`
      <div style="font-size:3rem">💀</div>
      <div style="color:#ef4444;font-size:2rem;font-weight:bold;font-family:sans-serif">사망</div>
      <div style="color:#9ca3af;font-size:1rem;font-family:sans-serif">
        ${killer?`${killer}에게 [${weapon}]으로 사망`:`[${weapon}]으로 사망`}
      </div>
      <button onclick="location.reload()" style="margin-top:12px;padding:12px 36px;
        background:linear-gradient(135deg,#ffd700,#f97316);border:none;border-radius:10px;
        color:#111;font-size:1rem;font-weight:700;cursor:pointer;">메뉴로</button>
    `;
    document.body.appendChild(div);
  }

  _showGameOver(winner) {
    const isWinner=winner&&this.gs?.players?.find(p=>p.sid===this.myId)?.name===winner;
    const div=document.createElement('div');
    div.style.cssText=`position:fixed;inset:0;background:rgba(0,0,0,0.82);
      display:flex;align-items:center;justify-content:center;z-index:50;flex-direction:column;gap:18px;`;
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
        color:#111;font-size:1.1rem;font-weight:700;cursor:pointer;">메뉴로 돌아가기</button>
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
  input: { mouse: { preventDefaultWheel: false } },
};

const game = new Phaser.Game(config);

// Handle socket game_start from menu (solo mode)
socket.on('game_start', data=>{
  const scene=game.scene.getScene('Game');
  if (!scene||!game.scene.isActive('Menu')) return;
  game.scene.getScene('Menu')?.scene?.start('Game',data);
});
