// Loka: the page. Builds each world's text, the rail and read mode, and turns scrolling into the camera path
// the cosmos follows (camAt). The 3D scene itself is in cosmos.js.
import { STOPS, YUGAS, DEEP, QUOTES, FACTS, GLOSSARY, READING } from './content.js';

export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const mobile = matchMedia('(max-width:760px)');
const $=id=>document.getElementById(id);

const storyEl = document.getElementById('story');
// the glossary: the first time a card uses a listed word, it becomes a tap-to-define term
const GL_RX = Object.entries(GLOSSARY).map(([k,g])=>[k,new RegExp('\\b(?:'+g[2]+')\\b','i')]);
function gloss(html, used){
  let inA=0;
  return html.split(/(<[^>]+>)/).map(seg=>{
    if(seg.startsWith('<')){ if(/^<a[\s>]/i.test(seg)) inA++; else if(/^<\/a>/i.test(seg)) inA--; return seg; }
    if(inA||!seg.trim()) return seg;
    const hits=[];
    for(const [k,rx] of GL_RX){ if(used.has(k)) continue; const m=rx.exec(seg);
      if(m && !hits.some(h=>m.index<h.i+h.n && h.i<m.index+m[0].length)){ hits.push({i:m.index,n:m[0].length,k,t:m[0]}); used.add(k); } }
    hits.sort((a,b)=>a.i-b.i); let out='', p=0;
    for(const h of hits){ out+=seg.slice(p,h.i)+`<button type="button" class="gl" data-term="${h.k}" aria-expanded="false">${h.t}</button>`; p=h.i+h.n; }
    return out+seg.slice(p);
  }).join('');
}
// read mode's extras: a world's facts, and at the end the glossary and further reading
const factsHTML = f=>`<div class="facts"><div class="label">At a glance</div><dl>${f.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></div>`;
const GLOSS_LIST = `<div class="glossary"><h3>Glossary</h3><dl>${Object.values(GLOSSARY).sort((a,b)=>a[0].localeCompare(b[0])).map(g=>`<div><dt>${g[0]}</dt><dd>${g[1]}</dd></div>`).join('')}</dl></div>`;
const READING_LIST = `<div class="reading"><h3>Further reading</h3><ul>${READING.map(([t,d])=>`<li><span>${t}</span>${d}</li>`).join('')}</ul></div>`;
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
  const used = new Set(), q = QUOTES[s.id], f = FACTS[s.id];
  sec.innerHTML = `<div class="card">
    ${s.kicker?`<div class="kicker">${s.kicker}</div>`:''}
    <h2>${s.title}</h2>
    ${s.deva||iast?`<div class="names">${s.deva?`<span class="deva" lang="sa">${s.deva}</span>`:''}${iast?`<span class="iast">${iast}</span>`:''}</div>`:''}
    <div class="body">${gloss(s.body,used)}</div>
    ${world?`<button class="more-btn" aria-expanded="false">Read more</button>`:''}
    <div class="x-more">
      ${q?`<figure class="quote"><blockquote>${q.text}</blockquote><figcaption>${q.cite}</figcaption></figure>`:''}
      ${DEEP[s.id]?`<div class="deep">${s.id==='intro'?'':'<div class="label">In depth</div>'}${gloss(DEEP[s.id],used)}${f?factsHTML(f):''}${s.id==='intro'?CONTENTS:''}${s.id==='end'?GLOSS_LIST+READING_LIST:''}</div>`:''}
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

// tap or hover a term for its definition
const pop=document.createElement('div'); pop.className='gpop'; pop.setAttribute('role','tooltip'); pop.id='gpop'; pop.hidden=true; document.body.appendChild(pop);
let popFor=null; const canHover=matchMedia('(hover:hover)');
function showGloss(b){ const g=GLOSSARY[b.dataset.term]; if(!g) return; if(popFor&&popFor!==b) popFor.setAttribute('aria-expanded','false');
  pop.innerHTML=`<b>${g[0]}</b>${g[1]}`; pop.hidden=false; const r=b.getBoundingClientRect(), w=Math.min(300,innerWidth-24);
  pop.style.width=w+'px'; const x=Math.min(Math.max(12,r.left-12),innerWidth-w-12); let y=r.bottom+8; if(y+pop.offsetHeight>innerHeight-12) y=r.top-pop.offsetHeight-8;
  pop.style.left=x+'px'; pop.style.top=y+'px'; popFor=b; b.setAttribute('aria-expanded','true'); b.setAttribute('aria-describedby','gpop'); }
function hideGloss(){ if(popFor){ popFor.setAttribute('aria-expanded','false'); popFor.removeAttribute('aria-describedby'); } pop.hidden=true; popFor=null; }
document.addEventListener('click',e=>{ const b=e.target.closest('.gl'); if(b){ if(popFor===b&&!canHover.matches) hideGloss(); else showGloss(b); } else if(!e.target.closest('.gpop')) hideGloss(); });
document.addEventListener('mouseover',e=>{ const b=e.target.closest('.gl'); if(b&&canHover.matches) showGloss(b); });
document.addEventListener('mouseout',e=>{ const b=e.target.closest('.gl'); if(b&&b===popFor&&canHover.matches&&!b.contains(e.relatedTarget)) hideGloss(); });
document.addEventListener('focusin',e=>{ const b=e.target.closest('.gl'); if(b) showGloss(b); });
document.addEventListener('focusout',e=>{ if(e.target.closest('.gl')) hideGloss(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') hideGloss(); });
addEventListener('scroll',hideGloss,{passive:true});

// stories set in Bharata, one from each age; until a story is live, say "coming soon" once, not on every row
const storyCard=(s,age,soon=true)=>{ const tag=s.href?'a':'div'; return `<${tag} class="st${s.flag?' flag':''}"${s.href?` href="${s.href}"`:''}><div class="st-t">${s.t}${s.flag?' <span class="badge">Flagship saga</span>':''}</div><div class="st-d">${s.d}</div><div class="st-s"><span>${age?age+' · ':''}${s.s}</span>${s.href?'<b>Read the saga →</b>':soon?'<em>Coming soon</em>':''}</div></${tag}>`; };
function renderStories(){
  const box=$('stories'); if(!box) return; const live=YUGAS.some(Y=>Y.stories[0].href);
  box.innerHTML=`<div class="label">Stories set in Bharata${live?'':' · coming soon'}</div>`+YUGAS.map(Y=>storyCard(Y.stories[0],Y.name+' yuga',live)).join('');
}
renderStories();

// scrolling: each stop has an anchor point at the middle of its section. Around each anchor the camera holds the
// stop's shot, which moves slowly as you scroll through the section (a push in, a few degrees of arc). Between anchors
// it flies to the next stop, along a smooth curve through the stop's waypoints when it has any, so it can dive
// through the world it is leaving; otherwise it eases round the axis and down, as before.
let anchors=[];
function measure(){ anchors=sections.map(s=>Math.max(0,s.offsetTop+s.offsetHeight/2-innerHeight/2)); anchors[0]=0; }
measure(); addEventListener('load',measure); document.fonts&&document.fonts.ready.then(measure);
const lerp=(a,b,t)=>a+(b-a)*t, glerp=(a,b,t)=>a*Math.pow(b/a,t), ease=t=>t*t*(3-2*t);
const HOLD=.18;                                            // the share of each gap the camera spends holding a shot, at each end
// a stop's shot at s: 0 as you arrive, .5 at its anchor, 1 as you leave. A shot gives [arrive, leave] pairs for its
// angle a, distance d and height h above the world, and where it looks; a stop without one holds its single view.
function shotAt(S,s){ const q=S.shot||{}, L=(v,d)=>Array.isArray(v)?lerp(v[0],v[1],ease(s)):(v??d);
  return { ang:L(q.a,S.ang), dist:L(q.d,S.dist), cy:S.y+L(q.h,S.h), look:q.look||S.look||[0,S.y,0] }; }
// Catmull-Rom through the points, by component (angle, distance, height), so the path stays a smooth curve
function through(P,e){ const n=P.length-1, x=Math.min(n-1e-6,Math.max(0,e*n)), i=Math.floor(x), t=x-i;
  const p=k=>k<0?P[0].map((v,j)=>2*v-P[1][j]):k>n?P[n].map((v,j)=>2*v-P[n-1][j]):P[k];
  const a=p(i-1), b=p(i), c=p(i+1), d=p(i+2), t2=t*t, t3=t2*t;
  return b.map((_,j)=>.5*(2*b[j]+(-a[j]+c[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t2+(-a[j]+3*b[j]-3*c[j]+d[j])*t3)); }
function camAt(sc){
  const n=anchors.length; let i=0,f=0;
  if(sc<=anchors[0]){i=0;f=0;} else if(sc>=anchors[n-1]){i=n-2;f=1;}
  else { while(i<n-2 && sc>=anchors[i+1]) i++; f=(sc-anchors[i])/Math.max(1,anchors[i+1]-anchors[i]); }
  const A=STOPS[i], B=STOPS[i+1];
  const out=(v,look,fog)=>({ ang:v.ang, dist:v.dist, cy:v.cy, lx:look[0], ly:look[1], lz:look[2], fog });
  if(f<=HOLD){ const v=shotAt(A,.5+.5*f/HOLD); return out(v,v.look,A.fog); }                  // holding A's shot, leaving it
  if(f>=1-HOLD){ const v=shotAt(B,.5*(f-(1-HOLD))/HOLD); return out(v,v.look,B.fog); }        // holding B's shot, arriving
  const e=ease((f-HOLD)/(1-2*HOLD)), a=shotAt(A,1), b=shotAt(B,0), fog=glerp(A.fog,B.fog,e);
  const look=a.look.map((v,j)=>lerp(v,b.look[j],e));
  if(A.via){ const [ang,dist,cy]=through([[a.ang,a.dist,a.cy],...A.via,[b.ang,b.dist,b.cy]],e); return out({ang,dist,cy},look,fog); }
  return out({ ang:lerp(a.ang,b.ang,e), dist:glerp(a.dist,b.dist,e), cy:lerp(a.cy,b.cy,e) },look,fog);
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
