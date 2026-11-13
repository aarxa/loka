// Loka: the page. Builds each world's text, the rail and read mode, and turns scrolling into the camera path
// the cosmos follows (camAt). The 3D scene itself is in cosmos.js.
import { STOPS, YUGAS, DEEP } from './content.js';

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const mobile = matchMedia('(max-width:760px)');
const $=id=>document.getElementById(id);

const storyEl = document.getElementById('story');
// read mode's contents: every stop after the opening, grouped like the rail
const CONTENTS = (()=>{ const G={up:'Upper worlds',earth:'Earth',low:'Lower worlds',base:'Beneath',z:'And then'}; let prev=null, h='';
  STOPS.slice(1).forEach(s=>{ if(s.grp!==prev && G[s.grp]) h+=`<li class="g">${G[s.grp]}</li>`; prev=s.grp; h+=`<li><a href="#s-${s.id}">${s.rail||s.nav}</a></li>`; });
  return `<nav class="contents" aria-label="Contents"><div class="label">Contents</div><ol>${h}</ol></nav>`; })();
// a story told in this world: a link once it's written, a quiet "coming soon" until then
function linkHTML(l){
  if(l.href) return `<li><a class="story" href="${l.href}"><span class="story-t">${l.label}</span><span class="story-m">${l.note||'Read'} →</span></a></li>`;
  const age = l.yuga!=null ? `${YUGAS[l.yuga].name} yuga · ` : '';
  return `<li><div class="story"><span class="story-t">${l.label}</span><span class="story-m">${age}Coming soon</span></div></li>`;
}
STOPS.forEach(s=>{
  const sec = document.createElement('section');
  sec.className = 'stop' + (s.cls ? ' '+s.cls : '');
  sec.id = 's-'+s.id;
  const world = !s.cls, iast = s.iast && s.iast!==s.title ? s.iast : '';   // the transliteration only when it adds something
  sec.innerHTML = `<div class="card">
    ${s.kicker?`<div class="kicker">${s.kicker}</div>`:''}
    <h2>${s.title}</h2>
    ${s.deva||iast?`<div class="names">${s.deva?`<span class="deva" lang="sa">${s.deva}</span>`:''}${iast?`<span class="iast">${iast}</span>`:''}</div>`:''}
    <div class="body">${s.body}</div>
    ${world?`<button class="more-btn" aria-expanded="false">Read more</button>`:''}
    <div class="x-more">
      ${DEEP[s.id]?`<div class="deep">${s.id==='intro'?'':'<div class="label">In depth</div>'}${DEEP[s.id]}${s.id==='intro'?CONTENTS:''}</div>`:''}
      ${s.extra||''}
      ${s.links?`<div class="stories-here"><div class="label">Stories here</div><ul>${s.links.map(linkHTML).join('')}</ul></div>`:''}
      ${s.src||s.versions?`<div class="meta">${s.src?`<p class="src"><b>Sources</b>${s.src}</p>`:''}${s.versions?`<details class="versions"><summary><b>Versions</b>The texts differ here</summary><p>${s.versions}</p></details>`:''}</div>`:''}
    </div>
  </div>`;
  storyEl.appendChild(sec);
});
const sections = [...document.querySelectorAll('section.stop')];

const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in'); }),{threshold:.25});
sections.forEach(s=>io.observe(s));

// the rail: where you are among the fourteen worlds
const mapEl = document.getElementById('map'); const dots=[]; let prevGrp=null;
const GROUPS={up:'Upper worlds',earth:'Earth',low:'Lower worlds',base:'Beneath'};
STOPS.forEach((s,i)=>{
  if(s.grp!==prevGrp && GROUPS[s.grp]){ const h=document.createElement('div'); h.className='rail-h'; h.setAttribute('aria-hidden','true'); h.textContent=GROUPS[s.grp]; mapEl.appendChild(h); }
  prevGrp=s.grp;
  const b=document.createElement('button'); b.className='rail-i'+(s.grp==='z'?' end':''); b.innerHTML=`<span>${s.rail||s.nav}</span>`; b.setAttribute('aria-label',s.nav);
  b.addEventListener('click',()=>window.scrollTo({top:anchors[i],behavior:reduce?'auto':'smooth'}));
  mapEl.appendChild(b); dots.push(b);
});

// read mode
const readBtn=document.getElementById('readBtn');
function setRead(on){ document.body.classList.toggle('read',on); if(on) document.querySelectorAll('.versions').forEach(d=>d.open=true); readBtn.setAttribute('aria-pressed',on); try{localStorage.setItem('loka-read',on?'1':'0')}catch(e){} requestAnimationFrame(measure); }
readBtn.addEventListener('click',()=>setRead(!document.body.classList.contains('read')));
try{ if(localStorage.getItem('loka-read')==='1') setRead(true); }catch(e){}

document.addEventListener('click',e=>{
  if(e.target.id==='waitBtn'){ document.getElementById('waitNote').textContent='The waitlist opens soon.'; }
  const mb=e.target.closest('.more-btn');
  if(mb){ const c=mb.closest('.card'), open=c.classList.toggle('open'); mb.setAttribute('aria-expanded',open); mb.textContent=open?'Show less':'Read more'; }
});

// stories set in Bharata, one from each age; until a story is live, say "coming soon" once, not on every row
const storyCard=(s,age,soon=true)=>{ const tag=s.href?'a':'div'; return `<${tag} class="st${s.flag?' flag':''}"${s.href?` href="${s.href}"`:''}><div class="st-t">${s.t}${s.flag?' <span class="badge">Flagship saga</span>':''}</div><div class="st-d">${s.d}</div><div class="st-s"><span>${age?age+' · ':''}${s.s}</span>${s.href?'<b>Read the saga →</b>':soon?'<em>Coming soon</em>':''}</div></${tag}>`; };
function renderStories(){
  const box=$('stories'); if(!box) return; const live=YUGAS.some(Y=>Y.stories[0].href);
  box.innerHTML=`<div class="label">Stories set in Bharata${live?'':' · coming soon'}</div>`+YUGAS.map(Y=>storyCard(Y.stories[0],Y.name+' yuga',live)).join('');
}
renderStories();

// scrolling: each stop has an anchor point; between anchors the camera eases from one stop to the next
let anchors=[];
function measure(){ anchors=sections.map(s=>Math.max(0,s.offsetTop+s.offsetHeight/2-innerHeight/2)); anchors[0]=0; }
measure(); addEventListener('load',measure); document.fonts&&document.fonts.ready.then(measure);
const lerp=(a,b,t)=>a+(b-a)*t, glerp=(a,b,t)=>a*Math.pow(b/a,t);
function dwell(f){ const t=Math.min(1,Math.max(0,(f-.18)/.64)); return t*t*(3-2*t); }
function camAt(sc){
  const n=anchors.length; let i=0,f=0;
  if(sc<=anchors[0]){i=0;f=0;} else if(sc>=anchors[n-1]){i=n-2;f=1;}
  else { while(i<n-2 && sc>=anchors[i+1]) i++; f=(sc-anchors[i])/Math.max(1,anchors[i+1]-anchors[i]); }
  const e=dwell(f), A=STOPS[i], B=STOPS[i+1], la=A.look||[0,A.y,0], lb=B.look||[0,B.y,0];
  return { y:lerp(A.y,B.y,e), dist:glerp(A.dist,B.dist,e), h:lerp(A.h,B.h,e), ang:lerp(A.ang,B.ang,e), fog:glerp(A.fog,B.fog,e),
           lx:lerp(la[0],lb[0],e), ly:lerp(la[1],lb[1],e), lz:lerp(la[2],lb[2],e) };
}
function activeIndex(sc){ let best=0,bd=1e9; anchors.forEach((a,i)=>{ const d=Math.abs(a-sc); if(d<bd){bd=d;best=i;} }); return best; }
let lastActive=-1;
function onScroll(){
  const max=document.documentElement.scrollHeight-innerHeight;
  $('progress').style.width=(max>0?scrollY/max*100:0)+'%';
  const a=activeIndex(scrollY); if(a!==lastActive){ dots.forEach((d,i)=>{ d.classList.toggle('on',i===a); if(i===a) d.setAttribute('aria-current','true'); else d.removeAttribute('aria-current'); }); lastActive=a; }
}
addEventListener('scroll',onScroll,{passive:true}); onScroll();

// links into the page: #s-bharata scrolls to that world
if(location.hash){ const el=document.querySelector(location.hash); if(el) setTimeout(()=>{ measure(); window.scrollTo(0,el.offsetTop+el.offsetHeight/2-innerHeight/2); },60); }

// without WebGL, the page falls back to read mode
export function noWebGL(){ setRead(true); readBtn.disabled=true; }
export { camAt, measure, setRead };
