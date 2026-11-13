// Loka: the cosmos. The 3D scene behind the text, from the real night sky and the egg of the universe
// down to Ananta Shesha. It follows the camera path that page.js works out from the scroll position.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { S, STOPS, YUGAS } from './content.js';
import { reduce, mobile, camAt, measure, noWebGL } from './page.js';

let renderer;
try { renderer=new THREE.WebGLRenderer({canvas:document.getElementById('gl'),antialias:true,powerPreference:'high-performance'}); }
catch(err){ console.warn('WebGL unavailable, using read mode',err); noWebGL(); }

if(renderer){
const lowTier = mobile.matches || (navigator.hardwareConcurrency||8) <= 4;
renderer.setPixelRatio(Math.min(devicePixelRatio, lowTier?1.5:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1;
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2('#05040a',.0004);
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,4000);

const AD=THREE.AdditiveBlending;
const GLOW=(()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d');
  const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.22,'rgba(255,255,255,.7)'); gr.addColorStop(.5,'rgba(255,255,255,.18)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr; g.fillRect(0,0,64,64); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; })();

function makePoints(pos,col,size,opacity=1){
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  if(col) g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const m=new THREE.PointsMaterial({size,map:GLOW,transparent:true,opacity,depthWrite:false,blending:AD,vertexColors:!!col,sizeAttenuation:true});
  return new THREE.Points(g,m);
}
function sprite(color,scale,opacity=1){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color,transparent:true,opacity,depthWrite:false,blending:AD})); s.scale.set(scale,scale,1); return s; }
const rnd=(a,b)=>a+Math.random()*(b-a);

// lights
const ambient=new THREE.AmbientLight(0xffffff,.55); scene.add(ambient);
const sunLight=new THREE.DirectionalLight(0xfff0d8,1.8); scene.add(sunLight);
const fill=new THREE.PointLight(0xd6deff,320,140,1.6); fill.position.set(0,-310,40); scene.add(fill);

// ---- the real sky: NASA SVS Deep Star Maps 2020 (Hipparcos-2, Tycho-2, Gaia DR2) ----
const NOISE=`
float hash(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*vnoise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }`;
const SKY=lowTier?'2k':'4k';
const skyTex=new THREE.Texture();
const skyListeners=[]; const onSky=t=>skyListeners.forEach(f=>f(t));   // things that reflect the real sky
const SKYFN=`vec3 skyAt(sampler2D sky, vec3 d){ float ra=atan(-d.z,d.x), dec=asin(clamp(d.y,-1.0,1.0)); return texture2D(sky,vec2(0.5-ra/6.2831853,0.5+dec/3.1415927)).rgb; }`;
new THREE.TextureLoader().load(`assets/sky/starmap-${SKY}.jpg`,
  t=>{ t.colorSpace=THREE.SRGBColorSpace; t.generateMipmaps=false; t.minFilter=THREE.LinearFilter; t.wrapS=THREE.RepeatWrapping; skyMat.uniforms.map.value=t; onSky(t); },
  undefined, e=>console.error('sky map not loaded',e));
const skyMat=new THREE.ShaderMaterial({
  uniforms:{ map:{value:skyTex}, texel:{value:new THREE.Vector2(1/(lowTier?2048:4096),1/(lowTier?1024:2048))}, time:{value:0}, intensity:{value:1}, gain:{value:1.5}, tint:{value:new THREE.Color(1,1,1)},
             nebA:{value:new THREE.Color('#ffcf8a')}, nebB:{value:new THREE.Color('#6d8cff')}, neb:{value:.05} },
  vertexShader:`varying vec3 vDir; void main(){ vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader:`uniform sampler2D map; uniform vec2 texel; uniform float time,intensity,gain,neb; uniform vec3 tint,nebA,nebB; varying vec3 vDir;
  ${NOISE}
  void main(){
    vec3 d=normalize(vDir);
    // celestial coordinates: north celestial pole on the cosmic axis (+y); RA increases to the left, as seen from inside
    float ra=atan(-d.z,d.x), dec=asin(clamp(d.y,-1.0,1.0));
    vec2 uv=vec2(0.5-ra/6.2831853, 0.5+dec/3.1415927);
    vec3 c=texture2D(map,uv).rgb;
    // split the map into the soft Milky Way glow and sharp star points
    vec2 o=texel*3.0;
    vec3 glow=min(min(min(texture2D(map,uv+vec2(o.x,0.0)).rgb,texture2D(map,uv-vec2(o.x,0.0)).rgb),min(texture2D(map,uv+vec2(0.0,o.y)).rgb,texture2D(map,uv-vec2(0.0,o.y)).rgb)),
                  min(min(texture2D(map,uv+o).rgb,texture2D(map,uv-o).rgb),min(texture2D(map,uv+vec2(o.x,-o.y)).rgb,texture2D(map,uv-vec2(o.x,-o.y)).rgb)));
    glow=min(glow,c);   // a min-filter keeps the diffuse Milky Way and drops the point stars
    vec3 pts=max(c-glow,0.0);
    float pl=dot(pts,vec3(0.2126,0.7152,0.0722));
    glow=max(glow-vec3(0.0009),0.0);                                     // black point: deep space stays black
    c = glow*gain*1.25 + pow(pts,vec3(1.5))*gain*1.6;                      // faint stars and Milky Way; bright stars are drawn as points   // crisp stars; the brightest pass 1.0 and bloom
    float n=fbm(d*2.1+vec3(0.0,time*0.004,0.0)), n2=fbm(d*4.7-vec3(time*0.003));
    float m=smoothstep(0.48,0.86,n)*(0.35+0.65*n2);
    vec3 nc=mix(nebA,nebB,smoothstep(0.3,0.7,n2))*m*neb;  // faint nebula haze, tinted by the age
    gl_FragColor=vec4((c*tint+nc)*intensity,1.0);
  }`,
  side:THREE.BackSide, depthWrite:false, depthTest:false, fog:false });
const sky=new THREE.Mesh(new THREE.SphereGeometry(3000,64,32),skyMat); sky.renderOrder=-10; scene.add(sky);

// the brightest 7,000 real stars, drawn as crisp points (positions and colours extracted from the NASA map)
const starU={ time:{value:0}, pr:{value:renderer.getPixelRatio()} };
const starsGroup=new THREE.Group(); scene.add(starsGroup);
// stars.bin: 8 bytes a star, little-endian: RA (uint16, 0–360°), Dec (int16, ±90°), brightness, red, green, blue (uint8 each)
fetch('assets/sky/stars.bin').then(r=>{ if(!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(buf=>{
  const v=new DataView(buf), n=buf.byteLength/8, pos=new Float32Array(n*3), col=new Float32Array(n*3), br=new Float32Array(n), sd=new Float32Array(n), R=2800, D2R=Math.PI/180;
  for(let i=0;i<n;i++){ const o=i*8, a=v.getUint16(o,true)/65535*360*D2R, d=v.getInt16(o+2,true)/32767*90*D2R;
    pos[i*3]=R*Math.cos(d)*Math.cos(a); pos[i*3+1]=R*Math.sin(d); pos[i*3+2]=-R*Math.cos(d)*Math.sin(a);
    br[i]=v.getUint8(o+4)/255; col[i*3]=v.getUint8(o+5)/255; col[i*3+1]=v.getUint8(o+6)/255; col[i*3+2]=v.getUint8(o+7)/255; sd[i]=Math.random(); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('tint',new THREE.BufferAttribute(col,3));
  g.setAttribute('bright',new THREE.BufferAttribute(br,1)); g.setAttribute('seed',new THREE.BufferAttribute(sd,1));
  const m=new THREE.ShaderMaterial({ uniforms:starU,
    vertexShader:`attribute float bright, seed; attribute vec3 tint; uniform float time, pr; varying vec3 vC; varying float vA;
      void main(){ vC=tint; float tw=0.82+0.18*sin(time*(1.3+seed*2.6)+seed*40.0);
        vA=(0.16+3.2*bright*bright*bright)*mix(1.0,tw,smoothstep(0.2,0.6,bright));
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        gl_PointSize=(1.4+5.5*bright*bright)*pr; }`,
    fragmentShader:`varying vec3 vC; varying float vA;
      void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d)*2.0; if(r>1.0) discard;
        float core=exp(-r*r*14.0), halo=exp(-r*5.0)*0.18;
        gl_FragColor=vec4(vC*(core+halo)*vA,1.0); }`,
    blending:AD, depthWrite:false, depthTest:true, transparent:true });
  const pts=new THREE.Points(g,m); pts.frustumCulled=false; pts.renderOrder=-9; starsGroup.add(pts);
}).catch(e=>console.error('star list not loaded',e));

// faint near dust, so travelling between worlds has parallax (the sky itself is infinitely far)
{ const pos=[]; for(let i=0;i<1600;i++){ const a=Math.random()*Math.PI*2, r=rnd(30,240); pos.push(Math.cos(a)*r,rnd(-400,300),Math.sin(a)*r); }
  var dust=makePoints(pos,null,.35,.28); dust.material.color=new THREE.Color('#cfd8ff'); scene.add(dust); }

// ---- the cosmic egg: a glass shell that glows at its edges ----
const EGG={a:165,b:345,cy:-50};
const eggGeo=new THREE.SphereGeometry(1,96,64); eggGeo.scale(EGG.a,EGG.b,EGG.a); eggGeo.computeVertexNormals();
const eggMat=new THREE.ShaderMaterial({
  uniforms:{ time:{value:0}, col:{value:new THREE.Color('#ffd58a')}, near:{value:0}, inside:{value:0} },
  vertexShader:`varying vec3 vN,vW,vP; void main(){ vP=position; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader:`uniform float time,near,inside; uniform vec3 col; varying vec3 vN,vW,vP;
  ${NOISE}
  void main(){
    vec3 V=normalize(cameraPosition-vW), N=normalize(vN);
    float f=pow(clamp(1.0-abs(dot(N,V)),0.0,1.0),2.6);
    float ang=atan(vP.z,vP.x);
    float film=0.5+0.5*sin(vP.y*0.045+f*7.0+time*0.35);                       // thin-film colour shift
    vec3 irid=mix(col,vec3(0.55,0.78,1.0),film*0.45);
    float flow=pow(clamp(abs(sin(ang*3.0+time*0.12)),0.0,1.0),140.0)*smoothstep(0.2,0.8,f);                // slow meridian light lines
    float veil=smoothstep(0.55,0.9,fbm(vP*0.018+vec3(0.0,time*0.02,0.0)));      // drifting veils in the glass
    float a=(f*0.55+flow*0.12+veil*0.08+0.008)*(1.0-0.85*inside)+near*0.3;
    gl_FragColor=vec4(irid*(f*0.9+flow*0.5+veil*0.35+near*2.0),a);
  }`,
  transparent:true, depthWrite:false, blending:AD, side:THREE.DoubleSide });
const eggMesh=new THREE.Mesh(eggGeo,eggMat); eggMesh.position.y=EGG.cy; scene.add(eggMesh);
{ const pos=[]; for(let i=0;i<1400;i++){ const u=Math.random()*2-1, ph=Math.random()*Math.PI*2, sq=Math.sqrt(1-u*u);
    pos.push(EGG.a*sq*Math.cos(ph), EGG.cy+EGG.b*u, EGG.a*sq*Math.sin(ph)); }
  var eggMotes=makePoints(pos,null,1.6,.35); eggMotes.material.color=new THREE.Color('#e3b964'); scene.add(eggMotes); }

// cosmic axis + rising dharma motes
const axisMat=new THREE.MeshBasicMaterial({color:YUGAS[0].tint,transparent:true,opacity:.45,blending:AD,depthWrite:false});
const axis=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,582,8,1,true),axisMat); axis.position.y=-21; scene.add(axis);
const DN=900; const dpos=new Float32Array(DN*3); const dspd=new Float32Array(DN);
for(let i=0;i<DN;i++){ const a=Math.random()*Math.PI*2, r=Math.pow(Math.random(),2)*2.4; dpos[i*3]=Math.cos(a)*r; dpos[i*3+1]=rnd(-312,270); dpos[i*3+2]=Math.sin(a)*r; dspd[i]=rnd(3,9); }
const dGeo=new THREE.BufferGeometry(); dGeo.setAttribute('position',new THREE.BufferAttribute(dpos,3));
const dharmaPts=new THREE.Points(dGeo,new THREE.PointsMaterial({size:.38,map:GLOW,transparent:true,opacity:.4,depthWrite:false,blending:AD,color:YUGAS[0].tint})); scene.add(dharmaPts);

// a loka = stacked layers of glowing gas (a shader), sparkle stars, and for the lower worlds, jewel lights
const spinners=[], discs=[];
const DU={ time:{value:0}, dharma:{value:1} };   // shared by every disc
const discMat=(o,layer)=>new THREE.ShaderMaterial({
  uniforms:{ time:DU.time, dharma:DU.dharma, fade:{value:1}, layer:{value:layer}, seed:{value:o.seed},
    colA:{value:new THREE.Color(o.A)}, colB:{value:new THREE.Color(o.B)}, colC:{value:new THREE.Color(o.C)},
    arms:{value:o.arms}, twist:{value:o.twist}, speed:{value:o.speed}, dust:{value:o.dust}, core:{value:o.core}, bright:{value:o.bright}, hole:{value:o.hole} },
  vertexShader:`varying vec2 vP; uniform float layer; void main(){ vP=position.xy/${'${R}'}; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader:`uniform float time,dharma,fade,layer,seed,arms,twist,speed,dust,core,bright,hole; uniform vec3 colA,colB,colC; varying vec2 vP;
  ${NOISE}
  void main(){
    float r=length(vP); if(r>1.0) discard;
    float rot=time*speed;
    float a=r<1e-4?0.0:atan(vP.y,vP.x);
    vec2 q=vec2(cos(a-rot),sin(a-rot))*r;
    float w=fbm(vec3(q*2.6,seed+layer*1.3));                                   // domain warp
    float phase=a*arms-log(r+0.04)*twist-rot*arms+w*2.4;
    float arm=pow(max(0.0,0.5+0.5*cos(phase)),2.2);                                      // spiral arms
    float gas=fbm(vec3(q*5.5+w*1.2,seed*1.7+layer*3.1+time*0.012));             // gas clumps
    float dens=mix(gas,gas*arm*2.3,0.85);
    float lane=pow(max(0.0,0.5+0.5*cos(phase+0.9)),6.0)*dust*smoothstep(0.12,0.45,r);   // dark dust lanes trailing each arm
    float prof=(1.0-smoothstep(0.62,1.0,r))*smoothstep(hole,hole+0.22,r);
    float coreG=exp(-r*r*55.0)*core*0.55;
    vec3 col=mix(colA,colB,smoothstep(0.0,0.42,r)); col=mix(col,colC,smoothstep(0.38,1.0,r));
    float spark=pow(max(0.0,vnoise(vec3(q*95.0,seed+layer*7.0))),22.0)*prof*3.0;      // embedded young stars
    vec3 c=col*dens*prof*(1.0-lane*0.9)*bright + colA*coreG*bright + vec3(1.0,0.95,0.9)*spark*bright;
    c*=(0.55+0.45*dharma)*fade;
    c*= (layer==0.0)?1.0:0.6;
    gl_FragColor=vec4(clamp(c,0.0,40.0),1.0);
  }`,
  transparent:true, depthWrite:false, blending:AD, side:THREE.DoubleSide });
function loka(y,r,o){
  const grp=new THREE.Group(); grp.position.y=y;
  const layers=lowTier?[0,1]:[0,1,2];
  layers.forEach(L=>{ const geo=new THREE.CircleGeometry(r*(1-L*.06),160); const mat=discMat(o,L);
    mat.vertexShader=mat.vertexShader.replace('${R}',(r*(1-L*.06)).toFixed(2));
    const m=new THREE.Mesh(geo,mat); m.rotation.x=-Math.PI/2; m.position.y=[0,.9,-.9][L]*(o.thick||1); m.renderOrder=1; grp.add(m); (grp.userData.mats=grp.userData.mats||[]).push(mat); });
  grp.userData.fade=1;
  // sparkle stars sitting in the disc
  { const pos=[],col=[]; const A=new THREE.Color(o.A),C=new THREE.Color(o.C);
    for(let i=0;i<(o.stars??500);i++){ const a=Math.random()*Math.PI*2, rr=r*(.15+.85*Math.pow(Math.random(),.7));
      pos.push(Math.cos(a)*rr,rnd(-1,1)*(o.thick||1),Math.sin(a)*rr); const c=A.clone().lerp(C,rr/r), b=rnd(.4,1); col.push(c.r*b,c.g*b,c.b*b); }
    grp.add(makePoints(pos,col,.42,.9)); }
  if(o.gems){ const gp=[],gc=[]; const pal=['#ff4d6d','#4cc9ff','#ffd166','#7cff9b','#c77dff'].map(h=>new THREE.Color(h));
    for(let i=0;i<o.gems;i++){ const a=Math.random()*Math.PI*2, rr=r*Math.sqrt(Math.random()); gp.push(Math.cos(a)*rr,rnd(-.4,1.6),Math.sin(a)*rr); const c=pal[i%pal.length]; gc.push(c.r*1.4,c.g*1.4,c.b*1.4); }
    grp.add(makePoints(gp,gc,1.5,1)); }
  scene.add(grp); spinners.push([grp,(o.spin||1)*.3]); discs.push(grp); return grp;
}

// upper worlds: made of light
const satya=loka(6*S,30,{A:'#ffe9d0',B:'#ffb27e',C:'#c2457e',arms:8,twist:.7,speed:.012,dust:.35,core:.25,bright:.42,hole:0,seed:1,stars:400});   // a lotus of light
loka(5*S,36,{A:'#fff0ff',B:'#e0a6ff',C:'#6a46ff',arms:3,twist:3.4,speed:.01,dust:.45,core:1.2,bright:1.05,hole:0,seed:2});
loka(4*S,40,{A:'#f2f6ff',B:'#a8bcff',C:'#3d5cff',arms:2,twist:4.6,speed:.009,dust:.55,core:1.3,bright:1.0,hole:0,seed:3});
loka(3*S,44,{A:'#ecfcff',B:'#8fe2ff',C:'#2678b0',arms:4,twist:3.0,speed:.008,dust:.5,core:1.0,bright:.95,hole:0,seed:4});
loka(2*S,48,{A:'#fffbe6',B:'#ffd46a',C:'#c0781e',arms:2,twist:5.2,speed:.007,dust:.7,core:1.5,bright:1.05,hole:0,seed:5});
loka(1*S,52,{A:'#fff0dc',B:'#ffb47e',C:'#8a4a7a',arms:3,twist:2.0,speed:.006,dust:.35,core:.4,bright:.8,hole:.18,seed:6,thick:2.2});   // the open sky

// Satyaloka lotus: real petal shapes that glow at their edges, so the flower reads against the light
function petalGeo(len,wid,cup,curl){
  const g=new THREE.PlaneGeometry(1,1,10,28), p=g.attributes.position, uv=g.attributes.uv;
  for(let i=0;i<p.count;i++){ const u=uv.getX(i), v=uv.getY(i);
    const w=wid*Math.pow(Math.sin(Math.PI*(0.1+0.9*v)),0.85)*(1-0.25*v);
    p.setXYZ(i,(u-.5)*w, cup*v*v+Math.abs(u-.5)*w*curl, v*len); }
  g.computeVertexNormals(); return g; }
const petalMat=(base,tip,glow)=>new THREE.ShaderMaterial({
  uniforms:{ time:DU.time, colBase:{value:new THREE.Color(base)}, colTip:{value:new THREE.Color(tip)}, glow:{value:glow} },
  vertexShader:`varying vec2 vUv; varying vec3 vN,vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader:`uniform float time,glow; uniform vec3 colBase,colTip; varying vec2 vUv; varying vec3 vN,vW;
    void main(){
      float side=min(vUv.x,1.0-vUv.x);
      float edge=1.0-smoothstep(0.0,0.16,side);
      float vein=pow(max(0.0,1.0-abs(fract(vUv.x*6.0)-0.5)*2.0),14.0)*(1.0-vUv.y)*0.5;
      float fres=pow(clamp(1.0-abs(dot(normalize(vN),normalize(cameraPosition-vW))),0.0,1.0),2.0);
      float pulse=0.9+0.1*sin(time*0.8+vUv.y*3.0);
      vec3 col=mix(colBase,colTip,smoothstep(0.0,1.0,vUv.y));
      vec3 c=col*(0.16+vein)+colTip*edge*0.9+col*fres*0.35+vec3(1.0,0.92,0.8)*edge*smoothstep(0.7,1.0,vUv.y)*0.6;
      gl_FragColor=vec4(c*glow*pulse,1.0);
    }`,
  transparent:true, depthWrite:false, blending:AD, side:THREE.DoubleSide });
{ const lot=new THREE.Group(); lot.position.y=6*S+.4;
  const ring=(n,len,wid,cup,curl,tilt,base,tip,glow,off)=>{ const geo=petalGeo(len,wid,cup,curl), mat=petalMat(base,tip,glow);
    for(let i=0;i<n;i++){ const piv=new THREE.Object3D(); piv.rotation.y=i/n*Math.PI*2+off; const m=new THREE.Mesh(geo,mat); m.rotation.x=-tilt; piv.add(m); lot.add(piv); } };
  ring(16,15,5.2,1.4,.25,.12,'#b8336a','#ffc2d8',.8,0);          // outer petals, lying open
  ring(12,11,4.6,2.2,.3,.45,'#d04a7a','#ffd6e2',.7,.26);         // middle ring, lifting
  ring(8,7,3.8,2.6,.35,.95,'#e8a060','#fff0d8',.55,.1);            // inner petals, nearly upright
  // the seed-pod at the heart
  const pod=new THREE.Mesh(new THREE.CylinderGeometry(2.2,1.6,1.2,40),new THREE.MeshStandardMaterial({color:'#e0b24a',emissive:'#6a4a10',metalness:.5,roughness:.35}));
  pod.position.y=1.6; lot.add(pod);
  { const pp=[]; for(let i=0;i<14;i++){ const a=i/14*Math.PI*2, r=i%2?.9:1.5; pp.push(Math.cos(a)*r,2.25,Math.sin(a)*r); } const d=makePoints(pp,null,.55,1); d.material.color=new THREE.Color('#fff1c4'); lot.add(d); }
  const core=sprite('#fff3d6',4,.15); core.position.y=2.6; lot.add(core); lot.scale.setScalar(.9); scene.add(lot); var lotus=lot; }

// sun (top of Bhuvarloka) and Dhruva (top of Svarloka)
const billboards=[];
function billboard(size,frag,uniforms){ const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.ShaderMaterial({
    uniforms:Object.assign({time:DU.time},uniforms),
    vertexShader:`varying vec2 vUv; void main(){ vUv=uv*2.0-1.0; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:`uniform float time; varying vec2 vUv; ${NOISE}\n`+frag, transparent:true, depthWrite:false, blending:AD }));
  billboards.push(m); return m; }
// the sun: a limb-darkened disc with a moving corona
const sun=new THREE.Group(); sun.position.set(26,1.5*S,0); scene.add(sun);
const sunBB=billboard(48,`uniform float fade; void main(){ float r=length(vUv), a=r<1e-4?0.0:atan(vUv.y,vUv.x);
  float disc=1.0-smoothstep(0.2,0.215,r); float limb=pow(max(0.0,1.0-r/0.21),0.45);
  float gran=0.85+0.15*fbm(vec3(vUv*26.0,time*0.15));
  float streak=fbm(vec3(cos(a)*3.0,sin(a)*3.0,r*4.0-time*0.18));
  float corona=exp(-(r-0.2)*7.0)*(0.55+0.9*streak)*step(0.19,r)*(1.0-smoothstep(0.5,1.0,r));
  vec3 c=vec3(1.0,0.86,0.6)*disc*limb*gran*2.2 + vec3(1.0,0.62,0.28)*corona*1.1 + vec3(1.0,0.5,0.2)*exp(-r*4.0)*0.35;
  gl_FragColor=vec4(c*fade,1.0); }`,{fade:{value:1}}); sun.add(sunBB);
// Dhruva: a pole star with Webb-style diffraction spikes
const dhruva=new THREE.Group(); dhruva.position.set(0,2.5*S,0); scene.add(dhruva);
const dhruvaFade={value:1};
dhruva.add(billboard(34,`uniform float fade; void main(){ float r=length(vUv), a=r<1e-4?0.0:atan(vUv.y,vUv.x);
  float tw=0.85+0.15*sin(time*2.3)+0.05*sin(time*7.1);
  float core=exp(-r*r*900.0)*4.0 + exp(-r*22.0)*0.9;
  float sp=0.0;
  for(int i=0;i<3;i++){ float th=float(i)*1.0471976+1.5707963; float d=abs(sin(a-th))*r; sp+=exp(-d*260.0)*exp(-r*3.2); }
  float sp2=exp(-abs(vUv.y)*420.0)*exp(-abs(vUv.x)*6.0)*0.5;        // the faint horizontal pair
  vec3 c=vec3(0.82,0.9,1.0)*(core+sp*1.6+sp2)*tw;
  gl_FragColor=vec4(c*fade,1.0); }`,{fade:dhruvaFade}));

// ---- textures (water: three.js, MIT; land + rock: Poly Haven, CC0) ----
function tex(name,srgb,rx=1,ry=1){ const t=new THREE.Texture(); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx,ry);
  t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace; t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  new THREE.ImageLoader().load(`assets/tex/${name}.jpg`,img=>{ t.image=img; t.needsUpdate=true; },undefined,e=>console.error('texture',name,e));
  return t; }
const T={ waterN:tex('water_nor',false), landD:tex('land_diff',true), landN:tex('land_nor',false) };

// Bhu-mandala: Meru + seven continents + seven oceans, as lit surfaces
const bhu=new THREE.Group(); scene.add(bhu);
const bhuU={ sky:{value:null}, sunPos:{value:new THREE.Vector3(26,60,0)} };
skyListeners.push(t=>{ bhuU.sky.value=t; });
// [inner, outer, liquid?, shore/ground colour, deep/second colour, options]
const RINGS=[
  [0,10,0,'#5b8a3a','#8a9a48',{seed:1}],                                                                  // Jambudvipa
  [10,15,1,'#2f9fc4','#06304f',{refl:.65,amp:1.0,speed:1.0,foam:.8,size:1,seed:2}],                        // salt
  [15,20,0,'#7a8240','#a8925a',{seed:3}],                                                                  // Plaksha
  [20,25,1,'#cfc96a','#5f6f1c',{refl:.5,amp:.7,speed:.7,foam:.45,size:1.2,seed:4}],                       // sugarcane juice
  [25,30.5,0,'#4f7040','#748450',{seed:5}],                                                                  // Shalmali
  [30.5,36,1,'#8e1a3e','#2c0210',{refl:.7,amp:.8,speed:.8,foam:.2,size:1.1,seed:6}],                         // wine
  [36,42,0,'#8a7c46','#b49a5c',{seed:7}],                                                                  // Kusha
  [42,48,1,'#ffcc5a','#a35c10',{refl:.45,amp:.35,speed:.3,foam:0,glow:.3,size:1.6,seed:8}],               // ghee
  [48,54.5,0,'#66665a','#8a8068',{seed:9}],                                                                  // Krauncha
  [54.5,61,1,'#cfc8b4','#a89e84',{refl:.15,amp:.2,speed:.2,foam:0,size:2.0,cream:1,seed:10}],              // curd
  [61,68,0,'#447848','#6a9858',{seed:11}],                                                                 // Shaka
  [68,75,1,'#dcd8d0','#b8b2a8',{refl:.3,amp:.35,speed:.35,foam:.1,sheen:1,size:1.6,seed:12}],            // milk
  [75,82.5,0,'#76765a','#9a906c',{seed:13}],                                                                 // Pushkara
  [82.5,90,1,'#7fd0ff','#08457a',{refl:.75,amp:1.1,speed:1.1,foam:.6,size:.9,seed:14}] ];                    // fresh water
const ringMat=(a,b,liquid,c1,c2,o)=>new THREE.ShaderMaterial({
  uniforms:{ time:DU.time, sky:bhuU.sky, sunPos:bhuU.sunPos, wN:{value:T.waterN}, lD:{value:T.landD}, lN:{value:T.landN},
    rIn:{value:a}, rOut:{value:b}, liquid:{value:liquid}, colA:{value:new THREE.Color(c1)}, colB:{value:new THREE.Color(c2)},
    refl:{value:o.refl??0}, amp:{value:o.amp??1}, speed:{value:o.speed??1}, foam:{value:o.foam??0}, glow:{value:o.glow??0},
    sheen:{value:o.sheen??0}, cream:{value:o.cream??0}, size:{value:o.size??1}, seed:{value:o.seed} },
  vertexShader:`varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader:`uniform sampler2D sky,wN,lD,lN; uniform vec3 sunPos,colA,colB;
  uniform float time,rIn,rOut,liquid,refl,amp,speed,foam,glow,sheen,cream,size,seed; varying vec3 vW;
  ${NOISE}
  ${SKYFN}
  void main(){
    vec2 p=vW.xz; float r=length(p);
    vec3 V=normalize(cameraPosition-vW), L=normalize(sunPos-vW);
    float edgeD=min(rIn>0.0?r-rIn:99.0, rOut-r);
    vec3 c;
    if(liquid>0.5){
      // two layers of real ripple normals drifting in different directions
      float t=time*speed;
      vec2 u1=p*0.055/size+vec2(t*0.011,t*0.007), u2=p*0.13/size+vec2(-t*0.016,t*0.012), u3=p*0.021/size+vec2(t*0.004,-t*0.006);
      vec3 sN=texture2D(wN,u1).rgb+texture2D(wN,u2).rgb+texture2D(wN,u3).rgb*0.8-1.4;
      vec3 N=normalize(vec3(sN.x*amp,0.55+sN.z*0.4,sN.y*amp));
      if(cream>0.5){ float lump=fbm(vec3(p*0.6,seed+t*0.05)); N=normalize(N+vec3(lump-0.5,0.0,vnoise(vec3(p*0.6,seed))-0.5)*0.35); }
      float NV=clamp(dot(N,V),0.0,1.0);
      float fres=min(0.03+0.97*pow(1.0-NV,5.0),0.6);
      vec3 env=min(skyAt(sky,reflect(-V,N))*1.8,vec3(0.6));
      vec3 H=normalize(L+V);
      float glit=pow(max(dot(N,H),0.0),900.0)*3.0*refl;                      // sun glitter on the ripples
      float sheenSpec=pow(max(dot(N,H),0.0),240.0)*0.06*refl;
      float mid=clamp(edgeD/max(0.5,(rOut-rIn)*0.5),0.0,1.0);
      vec3 body=mix(colA,colB,smoothstep(0.0,1.0,mid));
      float scatter=0.45+0.55*max(dot(N,L),0.0);
      c=body*scatter*(1.0-refl*fres*0.85)+env*refl*fres+vec3(1.0,0.93,0.8)*(glit+sheenSpec);
      c+=sheen*(0.5+0.5*cos(6.2831*(fres*2.2+vec3(0.0,0.33,0.67))))*0.16*(0.25+fres);   // pearly milk
      c+=colA*glow*(0.75+0.25*sin(time*0.5+r*0.35));                                   // ghee glows from within
      // foam that hugs the coasts and breaks up with the ripples
      float fn=texture2D(wN,u2*1.7).r*0.6+vnoise(vec3(p*1.4,t*0.3))*0.4;
      float fm=(1.0-smoothstep(0.0,0.35+0.9*fn,edgeD))*foam;
      c=mix(c,vec3(0.92,0.95,0.97)*(0.6+0.4*max(dot(N,L),0.0)),clamp(fm*1.2,0.0,0.85));
    } else {
      // real aerial terrain, sampled at two scales so it doesn't visibly tile, then tinted per continent
      vec2 uA=p*0.075+seed*0.37, uB=p*0.019+seed*0.13;
      vec3 dA=texture2D(lD,uA).rgb, dB=texture2D(lD,uB).rgb;
      vec3 alb=mix(dA,dB,0.4);
      float lum=dot(alb,vec3(0.299,0.587,0.114));
      vec3 tint=mix(colA,colB,smoothstep(0.2,0.55,lum));
      alb=mix(alb,tint*lum*2.9,0.6);
      vec3 nm=texture2D(lN,uA).rgb*2.0-1.0;
      vec3 N=normalize(vec3(nm.x*1.4,nm.z,nm.y*1.4));
      float dif=0.45+0.8*max(dot(N,L),0.0);
      c=alb*dif;
      float beach=1.0-smoothstep(0.0,0.35+0.5*lum,edgeD);                               // sandy coasts
      c=mix(c,vec3(0.74,0.66,0.48)*dif,beach*0.55);
    }
    if(!gl_FrontFacing) c*=0.15;
    gl_FragColor=vec4(c,1.0);
  }`,
  side:THREE.DoubleSide });
RINGS.forEach(([a,b,liq,c1,c2,o])=>{
  const geo=a===0?new THREE.CircleGeometry(b,160):new THREE.RingGeometry(a,b,256,3);
  const m=new THREE.Mesh(geo,ringMat(a,b,liq,c1,c2,o)); m.rotation.x=-Math.PI/2; m.position.y=liq?-.04:0; bhu.add(m); });
// Bharata, the southern part of Jambudvipa
{ const g=new THREE.RingGeometry(3.4,9.6,48,1,Math.PI/2-.55,1.1); const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:'#c9d36a',transparent:true,opacity:.12,blending:AD,depthWrite:false,side:THREE.DoubleSide}));
  m.rotation.x=-Math.PI/2; m.position.y=.06; bhu.add(m); var bharataGlow=m; }

// ---- Meru: a mountain of gold rock, wider at the summit than the base (VP 2.2) ----
const goldEnv=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer),.04).texture;
// small JS value noise for shaping rock
const jh=(x,y,z)=>{ const s=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453; return s-Math.floor(s); };
const jn=(x,y,z)=>{ const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi, u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf);
  const l=(a,b,t)=>a+(b-a)*t; return l(l(l(jh(xi,yi,zi),jh(xi+1,yi,zi),u),l(jh(xi,yi+1,zi),jh(xi+1,yi+1,zi),u),v),l(l(jh(xi,yi,zi+1),jh(xi+1,yi,zi+1),u),l(jh(xi,yi+1,zi+1),jh(xi+1,yi+1,zi+1),u),v),w); };
const jf=(x,y,z)=>{ let a=.5,s=0; for(let i=0;i<4;i++){ s+=a*jn(x,y,z); x*=2.07; y*=2.07; z*=2.07; a*=.5; } return s; };
function rocky(geo,amp,freq,ridge=0){ const p=geo.attributes.position, n=new THREE.Vector3(), v=new THREE.Vector3(); geo.computeVertexNormals(); const nr=geo.attributes.normal;
  for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i); n.fromBufferAttribute(nr,i); const a=Math.atan2(v.z,v.x);
    const d=(jf(v.x*freq,v.y*freq*.6,v.z*freq)-.5)*amp + ridge*Math.pow(Math.abs(Math.sin(a*9+v.y*.3)),3)*amp*.6;
    v.addScaledVector(n,d); p.setXYZ(i,v.x,v.y,v.z); } geo.computeVertexNormals(); return geo; }
const rockMat=new THREE.MeshStandardMaterial({ color:'#e8b450', normalMap:tex('rock_nor',false,5,3), normalScale:new THREE.Vector2(1.1,1.1),
  roughnessMap:tex('rock_rough',false,5,3), metalness:.95, roughness:.42, envMap:goldEnv, envMapIntensity:1.0, emissive:'#2a1a04', emissiveIntensity:.25 });   // the rock's shape, in gold
const meruMat=new THREE.MeshStandardMaterial({color:'#e6b450',metalness:1,roughness:.22,envMap:goldEnv,envMapIntensity:.7,emissive:'#3a2508',emissiveIntensity:.15});
const meru=new THREE.Group(); bhu.add(meru);
let meruTop=9.6;
{ const prof=[]; const H=meruTop;
  for(let i=0;i<=24;i++){ const t=i/24, y=-0.6+t*(H+0.6); const r=1.25+2.35*Math.pow(t,1.35)+.18*Math.sin(t*19); prof.push(new THREE.Vector2(r,y)); }
  prof.push(new THREE.Vector2(3.75,H+.15)); prof.push(new THREE.Vector2(3.2,H+.35)); prof.push(new THREE.Vector2(0.01,H+.4));
  const geo=rocky(new THREE.LatheGeometry(prof,160),.5,.8,.45); const m=new THREE.Mesh(geo,rockMat); meru.add(m); }
// the city of Brahma on the summit
{ const top=meruTop+.4; const dome=new THREE.Mesh(new THREE.SphereGeometry(1.15,40,20,0,Math.PI*2,0,Math.PI/2),meruMat); dome.position.y=top; meru.add(dome);
  const drum=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.4,.5,40),meruMat); drum.position.y=top; meru.add(drum);
  const fin=new THREE.Mesh(new THREE.ConeGeometry(.18,1.1,12),meruMat); fin.position.y=top+1.6; meru.add(fin);
  for(let i=0;i<12;i++){ const a=i/12*Math.PI*2, R=2.65; const tw=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.8,10),meruMat); tw.position.set(Math.cos(a)*R,top+.3,Math.sin(a)*R); meru.add(tw);
    const sp=new THREE.Mesh(new THREE.ConeGeometry(.24,.9,10),meruMat); sp.position.set(Math.cos(a)*R,top+1.1,Math.sin(a)*R); meru.add(sp); } }
// four mountains brace Meru on each side (VP 2.2; BP 5.16 names them differently)
[0,1,2,3].forEach(i=>{ const a=i*Math.PI/2+Math.PI/4; const g=rocky(new THREE.ConeGeometry(2.1,5.2,48,10),.45,1.3,.6); const c=new THREE.Mesh(g,rockMat);
  c.position.set(Math.cos(a)*4.6,2.35,Math.sin(a)*4.6); c.rotation.y=a; bhu.add(c); });
const meruCap=sprite('#fff1d6',6,.25); meruCap.position.y=meruTop+2.2; bhu.add(meruCap);
// Lokaloka: the ring of mountains at the edge, where light ends
{ const N=720, pos=[], uv=[], idx=[]; for(let i=0;i<=N;i++){ const a=i/N*Math.PI*2, h=2.2+2.6*jf(Math.cos(a)*9,1.3,Math.sin(a)*9)*(0.7+0.6*Math.abs(Math.sin(a*23)))+Math.random()*.5;
    pos.push(Math.cos(a)*90.2,-.1,Math.sin(a)*90.2, Math.cos(a)*92.4,h,Math.sin(a)*92.4, Math.cos(a)*94.6,-.1,Math.sin(a)*94.6); const u=i/N*90; uv.push(u,0, u,1, u,0); }
  for(let i=0;i<N;i++){ const o=i*3, n=o+3; idx.push(o,o+1,n, o+1,n+1,n, o+1,o+2,n+1, o+2,n+2,n+1); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
  const lokaloka=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#7a6444',map:tex('rock_diff',true,1,1),normalMap:tex('rock_nor',false,1,1),roughness:.9,metalness:.05,side:THREE.DoubleSide})); bhu.add(lokaloka); }

// lower worlds
loka(-1*S,50,{A:'#d6c8ff',B:'#6c4cff',C:'#1c0e46',arms:3,twist:2.6,speed:-.006,dust:.85,core:.5,bright:.55,hole:.1,seed:11,gems:70});
const vitala=loka(-2*S,50,{A:'#fff2b8',B:'#ffb81e',C:'#4a2600',arms:2,twist:3.2,speed:-.006,dust:.8,core:.8,bright:.6,hole:.08,seed:12,gems:50});
{ const pts=[]; for(let i=0;i<=200;i++){ const a=i/200*Math.PI*2, r=30+Math.sin(a*6)*2.5; pts.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a*9)*.6,Math.sin(a)*r)); }
  const river=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),400,.55,8,true),new THREE.MeshBasicMaterial({color:'#ffcf57',transparent:true,opacity:.85,blending:AD,depthWrite:false}));
  vitala.add(river); }
const sutala=loka(-3*S,50,{A:'#ffe6b8',B:'#ff8a2a',C:'#4a1400',arms:4,twist:2.4,speed:-.005,dust:.6,core:1.0,bright:.75,hole:.05,seed:13,gems:60});
{ const g=sprite('#ffb060',30,.55); g.position.y=2; sutala.add(g); }
loka(-4*S,50,{A:'#ffd6d6',B:'#ff4a4a',C:'#32000e',arms:3,twist:3.8,speed:-.005,dust:.85,core:.6,bright:.55,hole:.1,seed:14,gems:60});
loka(-5*S,50,{A:'#d6fff6',B:'#2dd4bf',C:'#00302b',arms:5,twist:2.2,speed:-.005,dust:.8,core:.5,bright:.55,hole:.12,seed:15,gems:80});
loka(-6*S,50,{A:'#ffc4b4',B:'#e02a2a',C:'#220004',arms:2,twist:4.4,speed:-.004,dust:.95,core:.7,bright:.5,hole:.1,seed:16,gems:50});
loka(-7*S,50,{A:'#e6f6ff',B:'#4cc9ff',C:'#24104e',arms:3,twist:3.0,speed:-.004,dust:.7,core:.6,bright:.6,hole:.08,seed:17,gems:520});

// Ananta Shesha. The seven hooded heads are cut from "King Cobra" by Anthony Yanez (CC BY 4.0) and smoothed (tools/cobra_export.py);
// the coils are generated: one body that rises at the cosmic axis and tapers, turn by turn, to the tip of the tail.
let sheshaTick=null;
{ const base=-8.5*S;
  const camA=STOPS.find(s=>s.id==='shesha').ang, F=new THREE.Vector3(Math.sin(camA),0,Math.cos(camA)), side=new THREE.Vector3(F.z,0,-F.x);
  const SCUTES=12;   // belly plates per body-circumference of length
  // scales drawn in the shader, for the hoods and heads: rows of rounded, overlapping scales laid on the model in its own
  // space (projected three ways and blended by the surface's direction), each one slightly domed and a shade different
  // from its neighbours. They fade out as they shrink toward a pixel, so they never shimmer.
  const SCALES=`varying vec3 vObj, vObjN;
    float nHash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    vec3 scaleCell(vec2 p){                  // x: dome height, y: the groove between scales, z: a random value per scale
      const vec2 r=vec2(1.0,1.5); vec2 h=r*.5;
      vec2 a=mod(p,r)-h, b=mod(p-h,r)-h, ia=floor(p/r), ib=floor((p-h)/r)+.5;
      bool A=dot(a,a)<dot(b,b); vec2 q=(A?a:b)/.56, id=A?ia:ib;
      float l=length(q), dome=(1.0-l*l)*.7+.3*clamp(.5-q.y*.5,0.,1.);   // a little raised along the lower, overlapping edge
      return vec3(dome, smoothstep(.7,1.0,l), nHash(id)); }
    vec3 scalesAt(vec3 p, vec3 n, float sz, out float fade){
      vec3 w=pow(abs(n),vec3(4.0)); w/=w.x+w.y+w.z+1e-4;
      vec3 c=w.z*scaleCell(p.xy/sz)+w.x*scaleCell(p.zy/sz+vec2(9.1,0.))+w.y*scaleCell(p.xz/sz+vec2(3.7,17.3));
      fade=1.0-smoothstep(.1,.32,length(fwidth(p))/sz); return c; }
    vec3 nagaBump(vec3 sp, vec3 sn, float h, float fd){   // bump from a height, by screen-space derivatives
      vec3 sx=dFdx(sp), sy=dFdy(sp), r1=cross(sy,sn), r2=cross(sn,sx); float det=dot(sx,r1)*fd;
      vec3 g=sign(det)*(dFdx(h)*r1+dFdy(h)*r2); return normalize(abs(det)*sn-g); }`;
  // snake skin: ivory scales under a light glossy coat. Each geometry also carries per-vertex contact shadow (ao),
  // how much it faces down (belly), and distance along the body (along), which the shader uses for the belly plates and banding.
  // scl>0 draws scales of that size instead of the texture; edge>0 darkens surfaces seen edge-on, so overlapping hoods separate.
  const skin=(map,nor,color,{side:sd=THREE.FrontSide,bump=1.1,coil=false,scl=0,edge=0,rows=0,cut=null}={})=>{
    const o={ color, map, normalMap:nor, normalScale:new THREE.Vector2(bump,bump), roughness:.36, metalness:0, envMap:goldEnv, envMapIntensity:.26, side:sd };
    const m = lowTier ? new THREE.MeshStandardMaterial(o)
      : new THREE.MeshPhysicalMaterial({ ...o, clearcoat:.32, clearcoatRoughness:.24, iridescence:.2, iridescenceIOR:1.3, iridescenceThicknessRange:[220,420],
          sheen:.16, sheenRoughness:.6, sheenColor:new THREE.Color('#f3e6cf') });
    m.onBeforeCompile=sh=>{
      if(coil) sh.uniforms.uTime=DU.time;
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float ao, belly, along;\nvarying float vAo, vBelly, vAlong;'+(coil?'\nattribute vec3 lat; attribute float wav; uniform float uTime;':'')+(scl?'\nvarying vec3 vObj, vObjN;':'')+(rows?'\nattribute float aro; varying float vAro;':''))
        .replace('#include <begin_vertex>','#include <begin_vertex>\nvAo=ao; vBelly=belly; vAlong=along;'+(coil?'\ntransformed+=lat*sin(along*1.15-uTime*1.3)*wav;':'')+(scl?'\nvObj=position; vObjN=normal;':'')+(rows?'\nvAro=aro;':''));
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vAo, vBelly, vAlong;'+(scl||rows?'\n'+SCALES:'')+(rows?'\nvarying float vAro;':''))
        .replace('#include <map_fragment>',`#include <map_fragment>
        ${cut!==null?`if(vObj.y<${cut.toFixed(2)}) discard;`:''}
        ${coil?`{ float f=fract(vAlong*${SCUTES}.0), seam=smoothstep(0.0,0.14,f)*(1.0-smoothstep(0.84,1.0,f));
          vec3 plate=vec3(0.93,0.89,0.80)*(0.74+0.26*seam);                                  // the wide belly plates, with dark seams between them
          float band=smoothstep(0.3,0.7,0.5+0.5*sin(vAlong*0.85+2.0*sin(vAlong*0.21)));    // soft pale-and-taupe bands along the back
          diffuseColor.rgb*=mix(1.0,0.8,band*(1.0-vBelly));
          diffuseColor.rgb=mix(diffuseColor.rgb,plate,vBelly); }`:''}`)
        .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        ${edge?`diffuseColor.rgb*=mix(${(1-edge).toFixed(2)},1.0,smoothstep(.0,.55,abs(dot(normal,normalize(vViewPosition)))));`:''}
        ${scl?`{ float fd; vec3 c=scalesAt(vObj,normalize(vObjN),${scl.toFixed(3)},fd);
          normal=nagaBump(-vViewPosition,normal,(c.x*.6-c.y*.4)*fd*${(scl*.22).toFixed(3)},faceDirection);
          diffuseColor.rgb*=(1.0-c.y*.3*fd)*(1.0+(c.z-.5)*.12*fd); }`:''}
        ${rows?`{ vec2 tp=vec2(vAro,vAlong)*${rows}.0; float fd=(1.0-smoothstep(.1,.32,length(fwidth(tp))))*(1.0-smoothstep(.3,.65,vBelly));
          vec3 c=scaleCell(tp);                    // rows of scales running along the body; the belly keeps its wide plates
          normal=nagaBump(-vViewPosition,normal,(c.x*.6-c.y*.4)*fd*.16,faceDirection);
          diffuseColor.rgb*=(1.0-c.y*.3*fd)*(1.0+(c.z-.5)*.12*fd); }`:''}`)
        .replace('#include <aomap_fragment>','#include <aomap_fragment>\n  reflectedLight.indirectDiffuse*=vAo*0.7; reflectedLight.indirectSpecular*=mix(1.0,vAo,0.7);');
    };
    m.customProgramCacheKey=()=>'naga'+(coil?'-coil':'')+(scl?'-s'+scl:'')+(edge?'-e'+edge:'')+(rows?'-r'+rows:'')+(cut!==null?'-c'+cut:'');   // each variant compiles its own shader
    return m; };
  const coilMat=skin(null,null,'#d3c9b6',{coil:true,rows:34});
  // the hoods: smooth pale scales in front, darker and finer behind; the heads carry the larger plates of a cobra's crown
  const NECK_CUT=2.6;   // below this the cut neck flares (it bent down into the original's coils), so it is hidden and the roots take over
  const frontMat=skin(null,null,'#dcd3c2',{side:THREE.DoubleSide,scl:.62,edge:.42,cut:NECK_CUT}), backMat=skin(null,null,'#a69780',{side:THREE.DoubleSide,scl:.46,edge:.3,cut:NECK_CUT}),
        headMat=skin(null,null,'#d2c7b3',{side:THREE.DoubleSide,scl:.7,edge:.3});

  // the body: it rises a little at the cosmic axis, where it splits into the seven necks, then spirals outward and down
  const TOP=base+13, HS=1.3, TRUNK=base+5.5, cp=[new THREE.Vector3(0,TRUNK,0),new THREE.Vector3(0,TRUNK-2.4,0),new THREE.Vector3(3,base+2.6,1.8)];
  for(let i=0;i<=240;i++){ const u=i/240, a=.65+u*Math.PI*2*3.1, r=12+u*24;
    cp.push(new THREE.Vector3(Math.cos(a)*r, base+2.2-u*9+Math.pow(Math.max(0,u-.93)/.07,2)*2.2, Math.sin(a)*r)); }
  const curve=new THREE.CatmullRomCurve3(cp,false,'centripetal'), LEN=curve.getLength();
  const radiusAt=s=>{ const cap=3, R0=4.8, neck=14, R1=4; if(s<cap) return R0*Math.sqrt(Math.max(0,1-((cap-s)/cap)**2));
    if(s<neck) return R0+(R1-R0)*(s-cap)/(neck-cap);
    const u=(s-neck)/(LEN-neck); return u<.86 ? R1-(R1-2.2)*u/.86 : 2.2*Math.pow(Math.max(0,1-(u-.86)/.14),.7)+.06; };
  // a slightly flattened body, flatter still underneath, with its belly turned down on the coils and toward the viewer
  // where the body rears up (as a cobra's does)
  function tubeGeometry(curve,LEN,radiusAt,segs,radial,kTex,{contact=true,aoAt=null,wavAt=()=>0,shape=[1.1,.92,.8]}={}){
    const P=new THREE.Vector3(), T=new THREE.Vector3(), D=new THREE.Vector3(), U=new THREE.Vector3(), W=new THREE.Vector3(), N=new THREE.Vector3(), DOWN=new THREE.Vector3(0,-1,0);
    const n=(segs+1)*(radial+1), pos=new Float32Array(n*3), nor=new Float32Array(n*3), uv=new Float32Array(n*2), alg=new Float32Array(n), aro=new Float32Array(n), bel=new Float32Array(n), lat=new Float32Array(n*3), wav=new Float32Array(n), idx=[];
    const spine=[]; let along=0, prev=0;
    for(let i=0;i<=segs;i++){ const t=i/segs, s=t*LEN, r=radiusAt(s); along+=(s-prev)/(2*Math.PI*Math.max(r,1.2)); prev=s;
      curve.getPointAt(t,P); curve.getTangentAt(t,T); spine.push([P.x,P.y,P.z,r,s]);
      D.copy(DOWN).lerp(F,THREE.MathUtils.smoothstep(Math.abs(T.y),.55,.9)).normalize();
      U.copy(D).addScaledVector(T,-D.dot(T)).normalize().negate(); W.crossVectors(T,U).normalize(); const wv=wavAt(t,s);
      for(let j=0;j<=radial;j++){ const v=j/radial*Math.PI*2, cx=Math.cos(v), sy=Math.sin(v), o=i*(radial+1)+j;
        const w=r*shape[0], h=r*(sy<0?shape[2]:shape[1]);
        pos[o*3]=P.x+W.x*cx*w+U.x*sy*h; pos[o*3+1]=P.y+W.y*cx*w+U.y*sy*h; pos[o*3+2]=P.z+W.z*cx*w+U.z*sy*h;
        N.copy(W).multiplyScalar(cx/w).addScaledVector(U,sy/h).normalize(); nor[o*3]=N.x; nor[o*3+1]=N.y; nor[o*3+2]=N.z;
        uv[o*2]=j/radial*2; uv[o*2+1]=along*kTex; alg[o]=along; aro[o]=j/radial; bel[o]=THREE.MathUtils.smoothstep(-sy,.5,.88)*(1-THREE.MathUtils.smoothstep(Math.abs(T.y),.5,.85));
        lat[o*3]=W.x; lat[o*3+1]=W.y; lat[o*3+2]=W.z; wav[o]=wv; } }
    for(let i=0;i<segs;i++) for(let j=0;j<radial;j++){ const a=i*(radial+1)+j, b=a+radial+1; idx.push(a,b,a+1, b,b+1,a+1); }
    // contact shadow: darken skin that sits close to another stretch of the body (one turn resting on the next)
    const ao=new Float32Array(n), M=spine.filter((_,i)=>i%2===0);
    if(!contact) for(let o=0;o<n;o++) ao[o]=aoAt(Math.floor(o/(radial+1))/segs);
    else for(let o=0;o<n;o++){ const i=Math.floor(o/(radial+1)), si=spine[i][4], ri=spine[i][3], x=pos[o*3], y=pos[o*3+1], z=pos[o*3+2]; let gap=1e9;
      for(const c of M){ if(Math.abs(c[4]-si)<ri*3+5) continue; const dx=x-c[0], dy=y-c[1], dz=z-c[2], g=Math.sqrt(dx*dx+dy*dy+dz*dz)-c[3]*1.05; if(g<gap) gap=g; }
      ao[o]=.32+.68*THREE.MathUtils.smoothstep(gap,0,4.5)*(1-.25*bel[o]); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3));
    g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.setAttribute('along',new THREE.BufferAttribute(alg,1)); g.setAttribute('aro',new THREE.BufferAttribute(aro,1)); g.setAttribute('belly',new THREE.BufferAttribute(bel,1));
    g.setAttribute('ao',new THREE.BufferAttribute(ao,1)); g.setAttribute('lat',new THREE.BufferAttribute(lat,3)); g.setAttribute('wav',new THREE.BufferAttribute(wav,1));
    g.setIndex(idx); return g; }
  // the wave stays out of the rising trunk, where the necks join, and grows toward the tail so its tip curls
  const coil=new THREE.Mesh(tubeGeometry(curve,LEN,radiusAt,lowTier?600:1100,lowTier?16:28,2.2,
    {wavAt:(t,s)=>THREE.MathUtils.smoothstep(s,24,60)*(.12+1.3*THREE.MathUtils.smoothstep(t,.82,1))}),coilMat); coil.castShadow=coil.receiveShadow=true; scene.add(coil);
  const sp=[],sc=[]; const A=new THREE.Color('#fff1d8'),B=new THREE.Color('#ffffff'), P=new THREE.Vector3();
  for(let i=0;i<500;i++){ const t=Math.random(), r=radiusAt(t*LEN)+1.6; curve.getPointAt(t,P); sp.push(P.x+rnd(-r,r),P.y+rnd(-r,r),P.z+rnd(-r,r)); const c=A.clone().lerp(B,Math.random()); sc.push(c.r,c.g,c.b); }
  scene.add(makePoints(sp,sc,.35,.16));
  const halo=sprite('#ffe9c4',95,.04); halo.position.set(0,base,0); scene.add(halo);

  // light for Shesha alone: a warm key from above and in front that casts real shadows (the hoods shade the body, the coils
  // shade one another), and a cool rim from behind that traces his outline against the dark
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const key=new THREE.SpotLight(0xffeed4,1.5,0,.62,.55,0);
  key.position.set(F.x*22+side.x*88,base+100,F.z*22+side.z*88); key.target.position.set(0,base+8,0); scene.add(key,key.target);
  key.castShadow=true; key.shadow.mapSize.set(lowTier?1024:2048,lowTier?1024:2048); key.shadow.camera.near=60; key.shadow.camera.far=220;
  key.shadow.bias=-.0003; key.shadow.normalBias=.06;
  const rim=new THREE.PointLight(0xaec6ff,700,170,1.6); rim.position.set(-F.x*58,base+38,-F.z*58); scene.add(rim);

  // seven hooded heads fan out of the neck, facing the viewer at this stop, each with a jewel on its hood
  const gemGeo=new THREE.OctahedronGeometry(.5,0), gemMat=new THREE.MeshStandardMaterial({color:'#6e0616',emissive:'#c20c26',emissiveIntensity:.75,metalness:.1,roughness:.1,envMap:goldEnv,envMapIntensity:1.2});
  // eyes: glossy and dark, with a glowing gold iris and a dark vertical slit for a pupil
  const eyeMat=new THREE.MeshStandardMaterial({color:'#0d0904',roughness:.14,metalness:0,envMap:goldEnv,envMapIntensity:.7,emissive:new THREE.Color(1.45,.62,.05)});
  eyeMat.onBeforeCompile=sh=>{
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 eye; varying vec3 vEye;').replace('#include <begin_vertex>','#include <begin_vertex>\nvEye=eye;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vEye;')
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      { vec3 e=normalize(vEye); float slit=(1.0-smoothstep(.1,.17,abs(e.x)))*(1.0-smoothstep(.55,.7,abs(e.y)))*smoothstep(.3,.55,e.z);
        totalEmissiveRadiance*=(1.0-slit)*(.35+.65*smoothstep(.1,.75,e.z)); }`); };
  eyeMat.customProgramCacheKey=()=>'naga-eye';
  const mouthMat=new THREE.MeshStandardMaterial({color:'#77624f',roughness:.6});
  // a forked tongue, which each head flicks out now and then
  const tongueGeo=(()=>{ const parts=[[0,0,0,0,-.03,1.4,.09,.06],[0,-.03,1.4,-.22,-.04,2.0,.06,.014],[0,-.03,1.4,.22,-.04,2.0,.06,.014]].map(([x0,y0,z0,x1,y1,z1,r0,r1])=>{
      const a=new THREE.Vector3(x0,y0,z0), b=new THREE.Vector3(x1,y1,z1), g=new THREE.CylinderGeometry(r1,r0,a.distanceTo(b),5,1,true);
      g.translate(0,a.distanceTo(b)/2,0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize())); g.translate(a.x,a.y,a.z); return g; });
    const pos=[],idx=[]; let off=0; parts.forEach(g=>{ pos.push(...g.attributes.position.array); idx.push(...g.index.array.map(i=>i+off)); off+=g.attributes.position.count; });
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g; })();
  const tongueMat=new THREE.MeshStandardMaterial({color:'#4a0d14',roughness:.35,emissive:'#2a0408'});
  const dec=(b,T)=>{ const s=atob(b), u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return new T(u.buffer); };
  const HP=new THREE.Vector3(-2.3,19.4,8.2);   // the back of the skull, where it meets the hood: each head nods about this point
  const NOD=.2, YAW=.15;                       // heads tipped forward to show the crown and eyes; the fan opens outward
  fetch('assets/models/shesha_hood.json').then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); }).then(M=>{
    const MATS={front:frontMat,back:backMat,head:headMat,eyes:eyeMat,mouth:mouthMat};
    const parts=M.meshes.map(m=>{ const g=new THREE.BufferGeometry(), p=dec(m.pos,Float32Array), nr=dec(m.nor,Float32Array), cnt=p.length/3;
      if(m.name==='eyes'){
        // the eyes, half as large again about their own centres, each with a frame for drawing the pupil
        const E=[0,1].map(()=>({c:new THREE.Vector3(),n:new THREE.Vector3(),k:0})), which=i=>p[i*3]<-2.3?0:1;
        for(let i=0;i<cnt;i++){ const e=E[which(i)]; e.c.x+=p[i*3]; e.c.y+=p[i*3+1]; e.c.z+=p[i*3+2]; e.n.x+=nr[i*3]; e.n.y+=nr[i*3+1]; e.n.z+=nr[i*3+2]; e.k++; }
        E.forEach(e=>{ e.c.divideScalar(e.k); e.n.set(Math.sign(e.c.x+2.3),.15,.25).normalize(); e.t=new THREE.Vector3(0,0,1).addScaledVector(e.n,-e.n.z).normalize(); e.b=new THREE.Vector3().crossVectors(e.n,e.t); });
        const eye=new Float32Array(cnt*3), V=new THREE.Vector3();
        for(let i=0;i<cnt;i++){ const e=E[which(i)]; V.set(p[i*3],p[i*3+1],p[i*3+2]).sub(e.c);
          const o=V.clone().normalize(); eye[i*3]=o.dot(e.t); eye[i*3+1]=o.dot(e.b); eye[i*3+2]=o.dot(e.n);
          V.multiplyScalar(1.5).add(e.c).addScaledVector(e.n,-.08); p[i*3]=V.x; p[i*3+1]=V.y; p[i*3+2]=V.z; }
        g.setAttribute('eye',new THREE.BufferAttribute(eye,3)); }
      g.setAttribute('position',new THREE.BufferAttribute(p,3)); g.setAttribute('normal',new THREE.BufferAttribute(nr,3));
      g.setIndex(new THREE.BufferAttribute(dec(m.idx,Uint16Array),1));
      // necks darken where they rise out of the body, heads under the jaw; no belly plates or bands here
      const ao=new Float32Array(cnt), y=i=>p[i*3+1];
      for(let i=0;i<cnt;i++) ao[i]=m.name==='head' ? .45+.55*THREE.MathUtils.smoothstep(y(i),18.4,20.6) : .42+.58*THREE.MathUtils.smoothstep(y(i),.5,6);
      g.setAttribute('ao',new THREE.BufferAttribute(ao,1)); g.setAttribute('belly',new THREE.BufferAttribute(new Float32Array(cnt),1)); g.setAttribute('along',new THREE.BufferAttribute(new Float32Array(cnt),1));
      return [g,MATS[m.name],m.name]; });
    const jf=M.hoodFront, sn=M.snout, heads=[];
    for(let k=-3;k<=3;k++){ const ak=Math.abs(k), outer=new THREE.Group(), inner=new THREE.Group(), head=new THREE.Group();
      head.position.copy(HP); inner.add(head);
      parts.forEach(([g,m,name])=>{ const mesh=new THREE.Mesh(g,m); mesh.castShadow=name!=='eyes'; mesh.receiveShadow=true;
        if(name==='front'||name==='back') inner.add(mesh); else { mesh.position.copy(HP).negate(); head.add(mesh); } });
      inner.rotation.set(-.12,0,-.174);                       // stand the cut neck upright: the original leans forward and a little to one side
      const tongue=new THREE.Mesh(tongueGeo,tongueMat); tongue.position.set(sn[0],sn[1]-.5,sn[2]-.45).sub(HP); tongue.rotation.x=-.12; tongue.scale.setScalar(.001); head.add(tongue);
      const gem=new THREE.Mesh(gemGeo,gemMat); gem.position.set(jf[0],jf[1],jf[2]+.25); gem.scale.set(.9,1.2,.55); inner.add(gem);
      inner.add(makePoints([jf[0],jf[1],jf[2]+.6],[1.8,.14,.1],2.2,.35));
      outer.add(inner);
      outer.position.set(0,TOP-(3.0+ak*.85)*HS,0).addScaledVector(side,k*1.2*HS).addScaledVector(F,(.6-ak*1.1)*HS);
      const rx=ak*.05, rz=-k*.27; outer.rotation.set(rx,camA+k*YAW,rz,'YXZ'); outer.scale.setScalar(HS*(1-ak*.06));
      scene.add(outer); heads.push({o:outer,h:head,tongue,rx,rz,ph:k*1.7,look:k*.06,next:2+Math.random()*8,t0:-9});
    }
    // the body splits into the seven necks: a smooth root runs from inside the trunk up into each cobra neck,
    // in the same skin as the coils, darker low down where the necks press together
    heads.forEach((h,i)=>{ const k=i-3, ak=Math.abs(k); h.o.updateMatrixWorld(true); const inner=h.o.children[0];
      // the cut neck leans, so its centre at this height is off to one side (measured from the model's cross-sections)
      const E=inner.localToWorld(new THREE.Vector3(...M.neck.join)), dir=inner.localToWorld(new THREE.Vector3(...M.neck.up)).sub(E).normalize();
      const S0=new THREE.Vector3(0,base+.8,0).addScaledVector(side,k*.5).addScaledVector(F,.7-ak*.45);
      const rc=new THREE.CatmullRomCurve3([S0,S0.clone().add(new THREE.Vector3(0,2.2,0)),E.clone().addScaledVector(dir,-2.6),E],false,'centripetal'), L=rc.getLength();
      const rN=Math.min(M.neck.half[0]/1.12,M.neck.half[1]/.95)*.99*h.o.scale.x;   // just inside the neck's skin there
      const root=new THREE.Mesh(tubeGeometry(rc,L,s=>rN*(1+.1*(1-s/L)),40,lowTier?14:22,2.2,{contact:false,shape:[1.12,.95,.95],aoAt:u=>.32+.5*THREE.MathUtils.smoothstep(u,.0,.7)}),coilMat);
      root.castShadow=root.receiveShadow=true; scene.add(root); });
    // the hoods sway, each in its own slow rhythm, and the heads nod and glance a little on their own
    sheshaTick=t=>heads.forEach(h=>{ h.o.rotation.z=h.rz+Math.sin(t*.42+h.ph)*.032; h.o.rotation.x=h.rx+Math.sin(t*.31+h.ph*1.3)*.026;
      h.h.rotation.x=NOD+Math.sin(t*.53+h.ph*.8)*.035; h.h.rotation.y=h.look+Math.sin(t*.23+h.ph*2.1)*.07;
      // a flick: out, three quick waggles, back in, about every five to twelve seconds per head
      if(t>h.next){ h.t0=t; h.next=t+5+Math.random()*7; }
      const u=(t-h.t0)/.9, out=u<0||u>1?0:Math.sin(Math.PI*u)**.5;
      h.tongue.scale.set(1,1,Math.max(.001,out)); h.tongue.rotation.x=-.12+Math.sin((t-h.t0)*26)*.16*out; h.tongue.visible=out>.01; });
    heads.forEach(h=>{ h.h.rotation.x=NOD; h.h.rotation.y=h.look; });
  }).catch(e=>console.error('shesha model',e));
}

// 3D labels
const labelsEl=document.getElementById('labels');
const LABELS=[
  {pos:new THREE.Vector3(0,12.5,0), t:'Mount Meru', s:'wider at the top · VP 2.2'},
  {pos:new THREE.Vector3(0,.8,-7.6), t:'Bharata', s:'the land of action'},
  {pos:new THREE.Vector3(0,4,-93), t:'Lokaloka', s:'where light ends'},
  {pos:new THREE.Vector3(0,2.5*S+3,0), t:'Dhruva', s:'the pole star'},
  {pos:sun.position, t:'The sun', s:'Bhuvarloka ends here', dyn:true},
];
LABELS.forEach(l=>{ const d=document.createElement('div'); d.className='l3'; d.innerHTML=`${l.t}<small>${l.s}</small>`; labelsEl.appendChild(d); l.el=d; });
const tmp=new THREE.Vector3();
function updateLabels(){
  LABELS.forEach(l=>{
    const p=l.dyn?tmp.copy(l.pos).add(new THREE.Vector3(0,7,0)):tmp.copy(l.pos);
    const near=Math.abs(cur.ly-p.y)<34 && camera.position.distanceTo(p)<230;
    p.project(camera); const vis=near && p.z<1 && Math.abs(p.x)<1.1 && Math.abs(p.y)<1.1;
    l.el.style.opacity=vis?1:0;
    if(vis){ l.el.style.transform=`translate(${((p.x+1)/2*innerWidth).toFixed(1)}px,${((1-p.y)/2*innerHeight).toFixed(1)}px) translate(-50%,-100%)`; }
  });
}

// the age's colours: the scene stays in the Satya yuga (the time dial that changed this is parked on the time-dial branch)
const yC={color:new THREE.Color(YUGAS[0].tint),bg:new THREE.Color(YUGAS[0].bg),dharma:1,nebA:new THREE.Color('#ffd59a'),nebB:new THREE.Color('#7fa2ff')};
const cur=camAt(scrollY);

// ---- filmic finish: bloom, ACES colour, vignette, grain, a touch of lens fringing ----
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), .7, .55, .95);
if(lowTier) bloom.resolution.set(innerWidth/2,innerHeight/2);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const finish=new ShaderPass({
  uniforms:{ tDiffuse:{value:null}, time:{value:0}, grain:{value:lowTier?.035:.045}, vig:{value:.55}, ca:{value:lowTier?0:.006},
             flash:{value:0}, flashCol:{value:new THREE.Color('#ffe2a8')}, res:{value:new THREE.Vector2(innerWidth,innerHeight)} },
  vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader:`uniform sampler2D tDiffuse; uniform float time,grain,vig,ca,flash; uniform vec3 flashCol; uniform vec2 res; varying vec2 vUv;
  float rnd(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
  void main(){
    vec2 cc=vUv-0.5; float r2=dot(cc,cc); vec2 off=cc*ca*(0.4+r2*2.0);
    vec3 c=vec3(texture2D(tDiffuse,vUv+off).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-off).b);
    c*=1.0-vig*smoothstep(0.12,0.62,r2*1.5);
    c+=flashCol*flash;
    c+=(rnd(vUv*res+fract(time*7.0)*91.0)-0.5)*grain;
    gl_FragColor=vec4(c,1.0);
  }` });
composer.addPass(finish);

function resize(){ renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight); finish.uniforms.res.value.set(innerWidth,innerHeight); starU.pr.value=renderer.getPixelRatio();
  if(lowTier) bloom.resolution.set(innerWidth/2,innerHeight/2);
  camera.aspect=innerWidth/innerHeight;
  // keep the cosmos to the right of the reading card on wide screens
  if(innerWidth>760) camera.setViewOffset(innerWidth,innerHeight,-innerWidth*.15,0,innerWidth,innerHeight); else camera.setViewOffset(innerWidth,innerHeight,0,innerHeight*.18,innerWidth,innerHeight);
  camera.updateProjectionMatrix(); measure(); }
addEventListener('resize',resize); resize();

let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  if(document.body.classList.contains('read')) return;
  const dt=Math.min(.05,(now-last)/1000); last=now; const t=now/1000;
  const tg=camAt(scrollY); const k=reduce?1:1-Math.exp(-dt*3.2);
  for(const key in tg) cur[key]+=(tg[key]-cur[key])*k;
  const drift=reduce?0:Math.sin(t*.07)*.12;
  const a=cur.ang+drift, d=cur.dist*(camera.aspect<.8?1.35:1);
  camera.position.set(Math.sin(a)*d,cur.y+cur.h,Math.cos(a)*d);
  camera.lookAt(cur.lx,cur.ly,cur.lz);
  scene.fog.density=cur.fog*(camera.aspect<.8?.8:1);

  scene.fog.color.copy(yC.bg).multiplyScalar(.5);
  sky.position.copy(camera.position); starsGroup.position.copy(camera.position); starU.time.value=reduce?0:t;
  skyMat.uniforms.time.value=t; skyMat.uniforms.nebA.value.copy(yC.nebA); skyMat.uniforms.nebB.value.copy(yC.nebB);
  skyMat.uniforms.intensity.value=.7+.35*yC.dharma; skyMat.uniforms.neb.value=.012+.03*(1-yC.dharma);
  skyMat.uniforms.tint.value.setRGB(1,1,1).lerp(yC.color,.12);
  // the egg glows as you pass through its shell
  { const p=camera.position, e=Math.sqrt((p.x/EGG.a)**2+((p.y-EGG.cy)/EGG.b)**2+(p.z/EGG.a)**2);
    const nearK=Math.exp(-Math.abs(e-1)*45); eggMat.uniforms.near.value=nearK; eggMat.uniforms.inside.value=e<1?1:0;
    eggMat.uniforms.time.value=t; eggMat.uniforms.col.value.copy(yC.color).lerp(new THREE.Color('#ffd58a'),.6);
    finish.uniforms.flash.value=reduce?0:nearK*.18; }
  finish.uniforms.time.value=t;
  axisMat.color.copy(yC.color); dharmaPts.material.color.copy(yC.color);
  dhruvaFade.value=THREE.MathUtils.smoothstep(camera.position.distanceTo(dhruva.position),14,32);
  { const m=dharmaPts.material, tgt=Math.abs(cur.ly)<12?.03:.4; m.opacity+=(tgt-m.opacity)*Math.min(1,dt*3); }   // the rising motes would haze the view of the earth
  dGeo.setDrawRange(0,Math.round(DN*(.12+.88*yC.dharma)));
  meruMat.emissive.setRGB(.23,.15,.03); meruCap.material.color.copy(yC.color);
  dust.material.opacity=.15+.15*yC.dharma; ambient.intensity=.3+.35*yC.dharma;
  const sf=.5+.5*yC.dharma;
  bharataGlow.material.opacity=.1+.08*Math.sin(t*1.4);
  bhuU.sunPos.value.copy(sun.position);

  if(!reduce){
    spinners.forEach(([g,s])=>g.rotation.y+=dt*.02*s);
    lotus.rotation.y+=dt*.05; bhu.rotation.y=0;
    const sa=t*.08; sun.position.set(Math.cos(sa)*26,1.5*S,Math.sin(sa)*26);
    for(let i=0;i<DN;i++){ let y=dpos[i*3+1]+dspd[i]*dt; if(y>270) y=-312; dpos[i*3+1]=y; }
    dGeo.attributes.position.needsUpdate=true;
    if(sheshaTick) sheshaTick(t);
  }
  sunLight.position.copy(sun.position);
  DU.time.value=reduce?0:t; DU.dharma.value=yC.dharma;
  billboards.forEach(b=>b.quaternion.copy(camera.quaternion));
  { const sy=sun.position.y, between=(sy-cur.ly)*(sy-camera.position.y)<0 && Math.abs(sy-cur.ly)>8; const f=sunBB.material.uniforms.fade; f.value+=((between?.08:1)-f.value)*Math.min(1,dt*3); }
  { const far=camera.position.length()>300; discs.forEach(g=>{ g.visible=far||Math.abs(g.position.y-camera.position.y)<170;
      // a world that sits between the camera and the world we're looking at turns faint, so it doesn't fog the view
      const dy=g.position.y-cur.ly, between=!far && dy*(g.position.y-camera.position.y)<0 && Math.abs(dy)>8;
      // and one the camera is passing through, near its centre (on the way to and from the sky stop)
      const inside=Math.abs(g.position.y-camera.position.y)<9 && Math.hypot(camera.position.x,camera.position.z)<55;
      g.userData.fade+=((between||inside?0:1)-g.userData.fade)*Math.min(1,dt*3); g.userData.mats.forEach(m=>m.uniforms.fade.value=g.userData.fade); }); }
  composer.render();
  updateLabels();
}
requestAnimationFrame(frame);
}
