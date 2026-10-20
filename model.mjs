// Fictional, deliberately simplified game systems; not a fire engineering model.
import {initEquipment,collectSupply,beginWork,cancelWork,tickEquipment,getLock} from './equipment.mjs';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function seeded(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
export class EscapeGame{
 constructor({seed=Date.now(),floors=20,name='20F · 연무 타워'}={}){
  this.seed=seed>>>0;this.rand=seeded(this.seed);this.floors=clamp(Math.round(Number(floors)||20),4,30);this.name=String(name||'연무 타워').slice(0,60);this.fire=2+Math.floor(this.rand()*(this.floors-2));this.floor=2+Math.floor(this.rand()*(this.floors-2));if(this.floor===this.fire)this.floor=this.floor===this.floors?this.floor-1:this.floor+1;
  this.time=0;this.health=100;this.breath=100;this.dose=0;this.phase='playing';this.zone='corridor';this.posture='stand';this.gear=null;this.gearLeft=0;this.gearUsed=false;this.called=false;this.rescue=0;this.trapped=false;this.transit=null;this.result=null;this.steps=0;this.picked=new Set();this.history=[];
  this.levels=Array.from({length:this.floors+1},(_,f)=>({a:this.rand()>.28,b:this.rand()>.45,wind:this.rand(),item:['분진 마스크','수건','방열 담요'][Math.floor(this.rand()*3)]}));
  this.liftOutcome=['normal','power','stop','smoke'][Math.floor(this.rand()*4)];this.roofOpen=this.rand()>.23;this.character=this.rand()<.5?'male':'female';this.skinTone=Math.floor(this.rand()*3);initEquipment(this);this.notice(`${this.floor}층에서 눈을 떴다. 경보는 울리지만 화재층은 알 수 없다.`);
 }
 supply(id){return collectSupply(this,id)}
 workOn(id,method){return beginWork(this,id,method)}
 cancelWork(){return cancelWork(this)}
 lock(id){return getLock(this,id)}
 notice(text){this.message=text;this.history.push({t:Math.round(this.time),floor:this.floor,text});if(this.history.length>80)this.history.shift();return text}
 smoke(f=this.floor,route='corridor'){
  f=clamp(f,1,this.floors);const d=f-this.fire,abs=Math.abs(d),l=this.levels[f];let s=abs===0?.9:abs===1?.44:abs===2?.2:.045;
  if(route==='a'||route==='b'){const sealed=l[route];s=sealed?s*.25+.035:s+(d>=0?.17:.035);}
  if(route==='lift')s=s*.78+.08+(d>0?.08:0);
  if(route==='terrace'||route==='roof')s=.045+(d>=0?.12:.02)+(abs<=1?.25:0)+l.wind*.16;
  if(route==='roof'&&this.fire>=this.floors-1)s+=.44;
  return clamp(s+Math.min(.22,this.time/900)*(route==='corridor'?1:.55),0,1);
 }
 risk(route,dir='down'){
  if(route==='a'||route==='b'){const next=clamp(this.floor+(dir==='down'?-1:1),1,this.floors);return Math.max(this.smoke(this.floor,route)*.7,this.smoke(next,route));}
  return this.smoke(route==='roof'?this.floors:this.floor,route);
 }
 describe(route){const s=this.risk(route),quality=s>.76?'검은 연기와 강한 열. 통과를 시도하면 매우 위험하다.':s>.42?'짙은 연기가 흐른다. 시야가 짧고 숨이 가빠질 수 있다.':s>.19?'옅은 연기가 스며든다. 안전이 보장된 경로는 아니다.':'연기는 비교적 적다. 너머 상황은 계속 변한다.';
  if(route==='a'||route==='b')return `계단 ${route.toUpperCase()} · ${quality} 아래쪽: ${this.word(this.risk(route,'down'))} / 위쪽: ${this.word(this.risk(route,'up'))}`;
  if(route==='lift')return `승강기 표시등이 켜져 있다. ${quality} 화재 중 승강기는 신뢰할 수 없는 선택이다.`;
  if(route==='terrace')return `바깥으로 열린 작은 테라스. ${quality} 출구가 아니라 구조를 기다리는 곳이다.`;
  if(route==='roof')return `옥상 방화문 ${this.roofOpen?'잠금 해제':'잠김'}. ${quality} 열려 있어도 즉시 탈출 성공은 아니다.`;
  if(route==='exit')return `지상 출입구 · ${quality}`;return quality;
 }
 word(s){return s>.76?'매우 짙음':s>.42?'짙음':s>.19?'옅음':'거의 없음'}
 finish(win,cause){if(this.phase==='ended')return;this.phase='ended';this.result={win,cause,time:this.time,floor:this.floor,steps:this.steps};this.transit=null;this.work=null;this.notice(cause)}
 gearUse(){if(!this.gear)return this.notice('가까운 장비를 먼저 주워야 한다.');if(this.gearLeft>0)return this.notice('이미 사용 중이다.');if(this.gearUsed)return this.notice('효과가 끝난 장비다. 유독가스 보호 장비가 아니다.');this.gearUsed=true;this.gearLeft=this.gear==='분진 마스크'?24:this.gear==='수건'?10:16;return this.notice(`${this.gear} 사용. ${this.gear==='방열 담요'?'잠시 열 노출만 줄인다.':'자극 완화는 제한적이다. 유독가스를 차단하지 않는다.'}`)}
 pickup(){if(this.picked.has(this.floor))return this.notice('이미 챙긴 장비다.');this.gear=this.levels[this.floor].item;this.gearLeft=0;this.gearUsed=false;this.picked.add(this.floor);return this.notice(`${this.gear}를 챙겼다. 장비 버튼으로 사용한다.`)}
 call(){if(this.phase==='ended')return;this.called=true;return this.notice(this.trapped?'비상통화로 갇힌 위치를 알렸다. 구조까지 버텨야 한다.':`${this.floor}층 ${this.zone==='corridor'?'실내':this.zone==='roof'?'옥상':'테라스'} 위치를 알렸다. 실외 대기 지점에서 신호를 보낼 수 있다.`)}
 stair(route,dir){if(this.phase!=='playing'||this.zone!=='corridor')return false;if(this.floor===this.floors&&dir==='up')return this.notice('더 위층은 없다. 옥상 문을 별도로 확인해야 한다.');if(this.floor===1&&dir==='down')return this.exit();const risk=this.risk(route,dir);this.transit={kind:'stairs',route,dir,risk,elapsed:0,duration:.9,to:this.floor+(dir==='down'?-1:1)};this.phase='transit';this.notice(`${route.toUpperCase()} 계단으로 ${dir==='down'?'내려간다':'올라간다'}. ${this.word(risk)} 연기.`);return true}
 elevator(){if(this.phase!=='playing'||this.zone!=='corridor')return false;this.transit={kind:'lift',risk:this.risk('lift'),elapsed:0,duration:8,to:1,outcome:this.liftOutcome};this.phase='transit';this.notice('승강기에 탔다. 운행 상태는 이미 화재의 영향을 받고 있다.');return true}
 outside(zone){if(this.phase!=='playing')return false;if(zone==='roof'&&(this.floor!==this.floors||!this.roofOpen)){this.notice(this.floor!==this.floors?'최상층에서 옥상 문을 확인할 수 있다.':'옥상 문이 잠겨 있다. 다른 경로를 찾아야 한다.');return false}this.zone=zone;this.rescue=0;this.notice(zone==='roof'?'옥상에 나왔다. 아직 구조되지 않았다. 통신하고 주변 연기를 살펴라.':'테라스 진입. 자동 탈출이 아니다. 위치를 알리고 구조를 기다려야 한다.');return true}
 returnInside(){if(this.trapped||this.phase!=='playing')return false;this.zone='corridor';this.rescue=0;this.notice('방화문을 닫고 복도로 돌아왔다.');return true}
 exit(){if(this.floor!==1||this.zone!=='corridor'||this.phase!=='playing')return false;const s=this.smoke(1,'corridor');if(s>.65){this.notice('지상 출입구가 화염과 짙은 연기로 막혀 있다.');return false}this.finish(true,'지상 출입구를 지나 건물 밖으로 나왔다.');return true}
 tick(dt){if(this.phase==='ended'||this.phase==='paused')return;dt=clamp(dt,0,.1);this.time+=dt;const working=this.phase==='working';tickEquipment(this,dt);this.gearLeft=Math.max(0,this.gearLeft-dt);let route=this.zone==='corridor'?'corridor':this.zone,s=this.smoke(this.floor,route),intensity=working?1.7:1;
  if(this.phase==='transit'){const t=this.transit;t.elapsed+=dt;s=t.risk;intensity=t.kind==='stairs'?4.5*3.3/t.duration:1.25;
   if(t.kind==='lift'){if(t.elapsed>3&&t.outcome==='smoke')s=.98;if(t.elapsed>=t.duration){if(t.outcome==='normal'){this.floor=1;this.phase='playing';this.transit=null;this.arrival='lift';this.notice('승강기 문이 열렸다. 1층이다. 아직 출입구까지 나가야 한다.');}else{this.phase='playing';this.zone='lift';this.trapped=true;this.trapSmoke=t.outcome==='smoke'?.97:.22;this.transit=null;this.notice(t.outcome==='smoke'?'승강로에서 검은 연기가 밀려온다. 문은 열리지 않는다.':'층 사이에서 멈췄다. 비상통화로 위치를 알려야 한다.');}}}
   else if(t.elapsed>=t.duration){this.floor=t.to;this.steps++;this.arrival=t.route;this.phase='playing';this.transit=null;this.notice(`${this.floor}층 계단참. 방화문 너머 상황을 다시 확인하자.`)}
  }
  if(this.trapped)s=this.trapSmoke+Math.min(.2,this.time/1200);
  const crouch=this.posture==='crouch'?.8:1;const gas=s*s*4.4*intensity;let irritant=s*.65*intensity*crouch;if(this.disturbance?.floor===this.floor&&this.zone==='corridor')irritant+=.16;if(this.gearLeft>0&&this.gear==='분진 마스크')irritant*=.7;if(this.gearLeft>0&&this.gear==='수건')irritant*=.9;if(this.suppression?.floor===this.floor&&this.zone==='corridor')irritant*=.75;
  this.dose=clamp(this.dose+(gas+irritant)*dt,0,100);this.breath=clamp(100-this.dose,0,100);let heat=Math.max(0,s-.68)*8*intensity;if(this.gearLeft>0&&this.gear==='방열 담요')heat*=.55;if(this.suppression?.floor===this.floor&&this.zone==='corridor')heat*=.8;this.health=clamp(this.health-(heat+Math.max(0,35-this.breath)*.27)*dt,0,100);
  if(this.breath<=0||this.health<=0){this.finish(false,this.trapped?'닫힌 승강기에서 연기 노출을 견디지 못했다.':'연기와 열에 노출돼 더 움직일 수 없게 됐다.');return}
  if(this.zone==='roof'||this.zone==='terrace'||this.trapped){if(this.called)this.rescue+=dt;const target=this.trapped?32:24;const reachable=this.trapped?this.trapSmoke<.5:s<.52;if(this.rescue>=target&&reachable)this.finish(true,this.trapped?'비상통화 후 구조대가 승강기 문을 개방했다.':`${this.zone==='roof'?'옥상':'테라스'}에서 신호를 보낸 뒤 구조대와 만났다.`)}
 }
}
