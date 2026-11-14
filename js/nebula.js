// A world of living fire: layers of glowing gas and smoke with sharp, fine filaments, round a burning star.
//
// The fire is painted once, when the page loads, at high resolution: the graphics card renders a few large images of
// a fire cloud from many layers of noise. Noise bending noise makes the swirls; ridged noise, each layer shaped by the
// one before, makes the thin bright filaments; dark smoke between them swallows light. Painting it once costs a moment;
// after that every frame only looks the images up. The cloud is then a stack of transparent sheets through the
// world's thickness, each turning at its own pace and gently churning, so it has depth and parallax as the camera moves.
// Sheets alone look like a stack of discs once the camera is among them, so the same fire also fills the world as a
// true volume of gas, with torn-off wisps of it hanging inside; the sheets show only where they look their best,
// from above and below.
import * as THREE from 'three';

const PAINT = `
  uniform float seed; varying vec2 vUv;
  float h(vec2 p){ vec3 q=fract(vec3(p.xyx)*0.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p), u=f*f*f*(f*(f*6.0-15.0)+10.0);
    return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y); }
  const mat2 ROT=mat2(0.8,0.6,-0.6,0.8);
  float fbm(vec2 p){ float s=0.0,w=0.5; for(int i=0;i<8;i++){ s+=w*n(p); p=ROT*p*2.02+vec2(1.7,9.2); w*=0.5; } return s; }
  // ridged noise, each octave shaped by the one before it: long, thin, branching filaments
  float ridged(vec2 p){ float s=0.0,w=0.6,prev=1.0;
    for(int i=0;i<8;i++){ float r=1.0-abs(n(p)*2.0-1.0); r=r*r*r; s+=r*w*prev; prev=clamp(r*1.6,0.0,1.0); p=ROT*p*2.07+vec2(4.3,2.1); w*=0.52; }
    return s; }
  // the temperature of the gas as colour: deep red, scarlet, orange, yellow, white-hot
  vec3 fire(float t){ vec3 c=mix(vec3(0.16,0.0,0.012),vec3(0.95,0.07,0.012),smoothstep(0.0,0.5,t));
    c=mix(c,vec3(1.0,0.36,0.05),smoothstep(0.4,1.0,t)); c=mix(c,vec3(1.0,0.76,0.34),smoothstep(0.9,1.7,t));
    return mix(c,vec3(1.0,0.97,0.9),smoothstep(1.6,2.6,t)); }
  void main(){
    vec2 q=vUv*2.0-1.0; float r=length(q), a=atan(q.y,q.x);
    // a gentle spiral twist, so the cloud reads as turning round the star
    float tw=2.2*(1.0-r); vec2 s=vec2(cos(a+tw),sin(a+tw))*r;
    vec2 p=s*2.6+seed*vec2(3.1,1.7);
    vec2 w1=vec2(fbm(p),fbm(p+vec2(5.2,1.3)));
    vec2 w2=vec2(fbm(p+3.6*w1+vec2(1.7,9.2)),fbm(p+3.6*w1+vec2(8.3,2.8)));
    float smoke=fbm(p+3.4*w2);                                                       // the body: swirling clouds of gas and smoke
    float veins=ridged(p*1.15+2.6*w2);                                               // filaments that follow the swirls
    float fine=ridged(p*3.1+4.0*w1+vec2(7.7,3.3));
    // the outline: ragged lobes, thinning to nothing at the rim
    float lobes=smoothstep(0.32,0.7,fbm(q*1.6+seed*vec2(2.3,5.1)+w1*0.6));
    float shape=(1.0-smoothstep(0.2,1.0,r))*mix(0.25,1.0,lobes);                       // feathered toward the rim
    float dens=smoothstep(0.42,0.85,smoke)*shape;
    float fil=smoothstep(0.5,1.22,veins)*smoothstep(0.32,0.62,smoke)*shape;          // filaments live in the gas, not the void
    float fil2=smoothstep(0.8,1.5,fine)*shape*smoothstep(0.3,0.6,smoke);
    float core=exp(-r*r*14.0);                                                        // the star's light on the gas near it
    float heat=dens*0.45+fil*1.45+fil2*1.0+core*1.0;
    vec3 e=fire(heat)*(dens*0.16+fil*2.0+fil2*1.08)*(0.6+1.1*core);
    e+=fire(0.4+0.5*core)*smoothstep(0.25,0.7,smoke)*shape*0.022;                    // a faint red haze through the whole cloud
    e+=vec3(0.42,0.14,1.0)*fil2*(1.0-shape)*smoothstep(1.0,0.5,r)*0.8;               // violet sparks out in the thin gas
    float alpha=clamp(dens*0.75+fil*0.24,0.0,1.0);
    // stored gently compressed, so the faint smoke keeps its detail in eight bits
    gl_FragColor=vec4(sqrt(clamp(e/4.0,0.0,1.0)),alpha); }`;

function paint(renderer, size, seed) {
  const rt = new THREE.WebGLRenderTarget(size, size, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  rt.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { seed: { value: seed } }, fragmentShader: PAINT,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`, depthTest: false, depthWrite: false }));
  scene.add(quad);
  const prev = renderer.getRenderTarget(), prevTone = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping; renderer.setRenderTarget(rt); renderer.render(scene, cam);
  renderer.setRenderTarget(prev); renderer.toneMapping = prevTone;
  quad.geometry.dispose(); quad.material.dispose();
  return rt.texture;
}

// The gas itself, shared by every part of the world: where it is, how thick, and how it glows. p is measured from the
// star. The gas is the painted fire, carried slowly round the star and twisted with height, so each height holds a
// different part of it; it thins away above and below the middle of the world.
// the thickness of gas along a ray, from the eye (ro, measured from the star) along rd (a unit vector) for tmax: the
// stretch inside the world's gas, times the gas's average thickness there. A plain function, so other things that sit
// in the gas (the world's own stars) can be veiled by it too.
const DEPTH = `
  float gasDepth(vec3 ro, vec3 rd, float tmax, float R, float H, float HV){
    float ry=abs(rd.y)<1e-5?1e-5:rd.y, ta=(-HV-ro.y)/ry, tb=(HV-ro.y)/ry;
    float a=max(dot(rd.xz,rd.xz),1e-6), b=dot(ro.xz,rd.xz), c=dot(ro.xz,ro.xz)-R*R, d=b*b-a*c;
    if(d<=0.0) return 0.0; d=sqrt(d);
    float s0=max(0.0,max(min(ta,tb),(-b-d)/a)), s1=min(min(max(ta,tb),(-b+d)/a),tmax);
    if(s1<=s0) return 0.0;
    float L=s1-s0, k=0.0;
    for(int i=0;i<4;i++){ vec3 p=ro+rd*(s0+L*(float(i)+0.5)/4.0); float u=p.y/H; k+=exp(-u*u*1.6)*(1.0-smoothstep(0.5,1.0,length(p.xz)/R)); }
    return k/4.0*L; }
`;
const SIG = .2;   // how strongly the gas swallows light, per unit of thickness

// for makeGalaxy's veil: dims each of the world's stars by the gas between it and the eye. c is the star at the centre
export const gasVeil = o => DEPTH + `
  float veil(vec3 w, vec3 c){ vec3 v=w-cameraPosition; float d=max(length(v),1e-4);
    return exp(-gasDepth(cameraPosition-c,v/d,d,${o.R.toFixed(1)},${o.H.toFixed(1)},${(o.H * 1.7).toFixed(2)})*${(.22 * SIG * 1.3).toFixed(4)}); }
`;

const GAS = DEPTH + `
  uniform sampler2D art0, art1; uniform float time, R, H, HV, SIG;
  mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
  float turnAt(float y){ return time*0.015+y*0.09; }
  float profile(float y){ float u=y/H; return exp(-u*u*1.6); }
  vec2 uvA(vec2 q){ return q*0.5+0.5; }
  vec2 uvB(vec2 q){ return (rot(1.3)*q)*vec2(-1.0,1.0)*0.5+0.5; }
  float mixAt(float y){ return 0.5+0.5*sin(y*0.8+1.0); }
  vec4 gasAt(vec3 p, float lod){
    vec2 q=rot(turnAt(p.y))*p.xz/R; if(dot(q,q)>1.0) return vec4(0.0);
    vec4 t=mix(textureLod(art0,uvA(q),lod),textureLod(art1,uvB(q),lod),mixAt(p.y));
    return vec4(t.rgb*t.rgb*4.0,t.a)*profile(p.y); }
  // the stretch of a ray that lies inside the world's gas, from ro along rd (a unit vector): x where it enters, y where it leaves
  vec2 span(vec3 ro, vec3 rd){
    float ry=abs(rd.y)<1e-5?1e-5:rd.y, ta=(-HV-ro.y)/ry, tb=(HV-ro.y)/ry;
    float a=max(dot(rd.xz,rd.xz),1e-6), b=dot(ro.xz,rd.xz), c=dot(ro.xz,ro.xz)-R*R, d=b*b-a*c;
    if(d<=0.0) return vec2(1.0,0.0); d=sqrt(d);
    return vec2(max(0.0,max(min(ta,tb),(-b-d)/a)),min(max(ta,tb),(-b+d)/a)); }
  // how much gas lies between the eye and a point at distance tmax: a quick estimate from the gas's average thickness
  float haze(vec3 ro, vec3 rd, float tmax){ return gasDepth(ro,rd,tmax,R,H,HV)*0.22*SIG; }
`;

/*  makeNebula(o): returns { group, mats, update }
    o.R  radius, o.H  half-thickness (scene units)    o.renderer  to paint the fire    o.time  shared time uniform
    o.low  smaller images, fewer sheets and wisps and a lighter volume, for phones
    update(camera) keeps the wisps drawn far to near; call it each frame while the world is in view                    */
export function makeNebula(o) {
  const group = new THREE.Group(), mats = [];
  const size = o.low ? 1024 : 2048, art = [paint(o.renderer, size, 1.3), paint(o.renderer, size, 7.9)];
  const shared = { time: o.time, art0: { value: art[0] }, art1: { value: art[1] }, R: { value: o.R }, H: { value: o.H }, HV: { value: o.H * 1.7 }, SIG: { value: SIG } };
  const glow = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };   // glows, and hides what is behind it

  // ---- the body of the gas: a real volume, so the camera can fly into it and through it ----
  // Each pixel follows its ray through the world's gas in short steps, adding the glow it passes and losing light to
  // the smoke; the start of the steps shifts at random from pixel to pixel, so they leave no bands. It reads a softened
  // copy of the painted fire, so it carries the cloud's great swirls and lanes, while the sheets and wisps carry the
  // fine filaments. The star's light scattered by the gas is added exactly, so the star glows through the cloud.
  const vol = new THREE.ShaderMaterial({ ...glow, side: THREE.BackSide,
    uniforms: { ...shared, fade: { value: 1 } },
    defines: { STEPS: o.low ? 18 : 22, LOD: (o.low ? 3 : 3.5).toFixed(1) },          // phones: a smaller painting, read a little softer
    vertexShader: `varying vec3 vW, vC; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vC=modelMatrix[3].xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: GAS + `uniform float fade; varying vec3 vW, vC;
      void main(){
        vec3 ro=cameraPosition-vC, rd=normalize(vW-cameraPosition);
        vec2 s=span(ro,rd); if(s.y<=s.x) discard;
        vec3 hq=fract(vec3(gl_FragCoord.xyx)*0.1031); hq+=dot(hq,hq.yzx+33.33);
        float j=fract((hq.x+hq.y)*hq.z+0.618034*floor(time*60.0));   // a new random shift each frame: it reads as film grain
        // short steps close to the eye, where the gas is big on the screen, growing with distance, where a softer copy
        // of the painting is read instead
        const float K=2.6; float L=s.y-s.x, E=exp(K)-1.0;
        vec3 col=vec3(0.0); float T=1.0;
        for(int i=0;i<STEPS;i++){ float u=(float(i)+j)/float(STEPS), x=exp(K*u), dt=L*K*x/(E*float(STEPS));
          vec3 p=ro+rd*(s.x+L*(x-1.0)/E); vec4 g=gasAt(p,LOD+clamp(log2(dt/1.5),0.0,2.0));
          col+=T*g.rgb*dt*1.6*smoothstep(0.08,0.45,length(p.xz)/R);    // not the painting's glow round the star: the light below does that
          T*=exp(-g.a*SIG*dt); }
        // the star's light scattered toward the eye along the ray (exact for a point of light in even gas)
        float tc=dot(-ro,rd), h=sqrt(max(dot(ro,ro)-tc*tc,0.0)+3.0);
        vec3 pc=ro+rd*clamp(tc,s.x,s.y);
        float dens=profile(pc.y)*(1.0-smoothstep(0.2,1.0,length(pc.xz)/R));
        col+=vec3(1.0,0.4,0.11)*(atan((s.y-tc)/h)-atan((s.x-tc)/h))/h*dens*0.18;
        gl_FragColor=vec4(col*fade,(1.0-T)*fade); }` });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(o.R, o.R, o.H * 3.4, 64, 1, false), vol);
  body.renderOrder = -1;                                   // first, behind the sheets, wisps and stars that sit inside it
  group.add(body); mats.push(vol);

  // ---- the sheets: the painted fire at full sharpness, seen from above and below ----
  // Seen from the side, or as the camera passes through one, a sheet would show as a flat disc, so it fades away then
  // and leaves the gas to the volume and the wisps.
  const N = o.low ? 5 : 9;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1) * 2 - 1;                           // -1 at the bottom sheet, +1 at the top
    const m = new THREE.ShaderMaterial({ ...glow, side: THREE.DoubleSide,
      uniforms: { ...shared, fade: { value: 1 }, art: { value: art[i % 2] }, spin: { value: (i % 2 ? -1 : 1) * (.012 + .006 * (i % 3)) },
        turn: { value: i * 1.3 }, weight: { value: Math.exp(-u * u * 1.6) }, zoom: { value: 1 + .08 * (i % 3) }, flip: { value: i % 4 < 2 ? 1 : -1 }, lift: { value: u * o.H } },
      vertexShader: `uniform float lift; varying vec2 vP; varying vec3 vW, vC; void main(){ vP=position.xy; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vC=(modelMatrix*vec4(0.0,0.0,0.0,1.0)).xyz-vec3(0.0,lift,0.0); gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: GAS + `uniform sampler2D art; uniform float fade, spin, turn, weight, zoom, flip; varying vec2 vP; varying vec3 vW, vC;
        void main(){
          float a=turn+time*spin, c=cos(a), s=sin(a);
          vec2 q=mat2(c,-s,s,c)*vP*zoom; q.x*=flip;
          // the gas churns: a slow, soft wobble of where each sheet is looked up
          q+=0.012*vec2(sin(q.y*5.0+time*0.35),cos(q.x*4.0-time*0.3));
          if(dot(q,q)>1.0) discard;
          vec2 uv=q*0.5+0.5;
          // the sharp fire, and close round it a little of the same fire blurred (a smaller copy the graphics card
          // keeps anyway, read at a fixed size so it skips the costly sharp filtering): a tight glow on each filament
          vec4 t=texture2D(art,uv), b1=textureLod(art,uv,3.0);
          vec3 e=t.rgb*t.rgb*4.0+b1.rgb*b1.rgb*4.0*0.14;
          float op=mix(t.a,b1.a,0.3);
          float flicker=0.85+0.15*sin(time*1.7+dot(q,vec2(9.0,7.0))+turn);
          vec3 v=vW-cameraPosition; float dist=length(v); v/=dist;
          float side=smoothstep(0.16,0.5,abs(v.y));                  // seen from the side: fade
          float pass=smoothstep(0.4,2.6,abs(cameraPosition.y-vW.y));   // the camera passing through it: fade
          // and the gas between the eye and this part of the sheet veils it
          float k=weight*side*pass*fade*exp(-haze(cameraPosition-vC,v,dist));
          gl_FragColor=vec4(e*k*flicker*3.6,op*k*0.2); }` });
    const sheet = new THREE.Mesh(new THREE.CircleGeometry(1, 96), m);
    sheet.scale.setScalar(o.R); sheet.rotation.x = -Math.PI / 2; sheet.position.y = u * o.H; sheet.frustumCulled = false;
    group.add(sheet); mats.push(m);
  }

  // ---- wisps: torn-off pieces of the same fire, hanging in the gas, that stream past as the camera moves through ----
  // Each always faces the camera, so it never shows an edge, and dissolves before the camera reaches it rather than
  // bursting through the lens. A wisp sits where its own piece of the painting is, turns with the gas, and lights up
  // only where that piece holds gas, so together they keep the cloud's shape seen from the side and from inside.
  const W = o.low ? 600 : 1600, rnd = (() => { let s = 977; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const P = new Float32Array(W * 4), Q = new Float32Array(W * 4), base = new Float32Array(W * 8);
  for (let i = 0; i < W; i++) {
    const r = Math.sqrt(.02 + .98 * rnd()) * .96, a = rnd() * Math.PI * 2;
    let g = 0; for (let k = 0; k < 4; k++) g += rnd(); g = (g - 2) / .58;          // roughly a bell curve
    base.set([Math.cos(a) * r, Math.max(-1.5, Math.min(1.5, g * .45)) * o.H, Math.sin(a) * r, 3 + 9 * Math.pow(rnd(), 1.5),   // where, and how big
      rnd() < .5 ? 0 : 1, (rnd() - .5) * .16, rnd() * 6.283, 0], i * 8);                                                       // which painting, and its slow turn
  }
  const wg = new THREE.InstancedBufferGeometry(), quad = new THREE.PlaneGeometry(2, 2); wg.index = quad.index; wg.setAttribute('position', quad.attributes.position);
  const iP = new THREE.InstancedBufferAttribute(P, 4), iQ = new THREE.InstancedBufferAttribute(Q, 4);
  iP.setUsage(THREE.DynamicDrawUsage); iQ.setUsage(THREE.DynamicDrawUsage);
  wg.setAttribute('iP', iP); wg.setAttribute('iQ', iQ); wg.instanceCount = W;
  const order = new Uint16Array(W).map((_, i) => i), depth = new Float32Array(W);
  const fill = () => { for (let n = 0; n < W; n++) { const k = order[n] * 8; for (let j = 0; j < 4; j++) { P[n * 4 + j] = base[k + j]; Q[n * 4 + j] = base[k + 4 + j]; } } iP.needsUpdate = iQ.needsUpdate = true; };
  fill();
  const wm = new THREE.ShaderMaterial({ ...glow, uniforms: { ...shared, fade: { value: 1 } },
    vertexShader: GAS + `attribute vec4 iP, iQ; uniform float fade; varying vec2 vC, vUv, vO; varying float vK, vWhich, vPatch;
      void main(){
        vec2 q=iP.xz; float y=iP.y, sz=iP.w;
        vec2 xz=rot(-turnAt(y))*q*R; vec3 p=vec3(xz.x,y,xz.y);
        vec4 w=modelMatrix*vec4(p,1.0), mv=viewMatrix*w; float dist=-mv.z;
        vWhich=iQ.x; vUv=vWhich<0.5?uvA(q):uvB(q);
        float dens=vWhich<0.5?textureLod(art0,vUv,4.0).a:textureLod(art1,vUv,4.0).a;
        vec3 v=w.xyz-cameraPosition; float d=length(v); v/=d;
        // seen steeply from above or below the sheets already show this gas, so the wisps step back there
        float side=1.0-0.8*smoothstep(0.3,0.65,abs(v.y));
        vK=smoothstep(0.04,0.3,dens)*profile(y)*side*fade
          *smoothstep(0.2*sz,0.9*sz,dist)*(1.0-smoothstep(60.0,100.0,dist))
          *exp(-haze(cameraPosition-(modelMatrix*vec4(0.0,0.0,0.0,1.0)).xyz,v,d));
        if(vK<0.002){ gl_Position=vec4(0.0,0.0,2.0,1.0); return; }              // nothing to draw: off the screen
        float a=iQ.z+iQ.y*time; vO=vec2(cos(a),sin(a)); vC=position.xy; vPatch=sz/(2.0*R);
        mv.xy+=position.xy*sz; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform sampler2D art0, art1; varying vec2 vC, vUv, vO; varying float vK, vWhich, vPatch;
      void main(){
        float r=length(vC); if(r>1.0) discard;
        vec2 uv=vUv+mat2(vO.x,-vO.y,vO.y,vO.x)*vC*vPatch;
        vec4 t, b; if(vWhich<0.5){ t=texture2D(art0,uv); b=textureLod(art0,uv,3.0); } else { t=texture2D(art1,uv); b=textureLod(art1,uv,3.0); }
        float m=1.0-smoothstep(0.1,1.0,r); m*=m;
        m*=smoothstep(0.0,0.3,b.a+0.12-r*0.3);                              // thin where its own gas thins: no round outline
        vec3 e=t.rgb*t.rgb*4.0+b.rgb*b.rgb*4.0*0.14;
        gl_FragColor=vec4(e*m*vK*3.5,mix(t.a,b.a,0.3)*m*vK*0.6); }` });
  const wisps = new THREE.Mesh(wg, wm); wisps.frustumCulled = false; group.add(wisps); mats.push(wm);

  // the burning star: a boiling surface with darker cells, a limb that darkens toward the edge, and a corona.
  // From inside the cloud it is seen through the gas, which dims it a little and spreads its light (the volume adds that)
  const starMat = new THREE.ShaderMaterial({ uniforms: { ...shared, fade: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: GAS + `varying vec2 vUv; varying float vT; void main(){ vUv=uv*2.0-1.0;
      vec3 c=(modelMatrix*vec4(0.0,0.0,0.0,1.0)).xyz, v=c-cameraPosition; float d=length(v); vT=exp(-0.6*haze(cameraPosition-c,v/d,d));
      gl_Position=projectionMatrix*(modelViewMatrix*vec4(0.0,0.0,0.0,1.0)+vec4(position.xy,0.0,0.0)); }`,
    fragmentShader: `uniform float time, fade; varying vec2 vUv; varying float vT;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float cells(vec2 p){ vec2 i=floor(p), f=fract(p); float d=1.0;                   // convection cells: distance to the nearest centre
        for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(x,y), c=g+0.5+0.4*sin(time*0.6+6.2831*h(i+g))-f; d=min(d,dot(c,c)); }
        return sqrt(d); }
      void main(){ float r=length(vUv), a=atan(vUv.y,vUv.x);
        float disc=1.0-smoothstep(0.24,0.25,r), limb=pow(max(0.0,1.0-r/0.25),0.4);
        vec2 sp=vUv/0.25; sp=sp*(1.0+0.35*dot(sp,sp));                                  // the cells foreshorten toward the edge
        float gran=0.62+0.38*smoothstep(0.05,0.5,cells(sp*7.0));
        float corona=exp(-(r-0.24)*9.0)*step(0.235,r)*(0.6+0.4*sin(a*7.0+time*0.7)*sin(a*3.0-time*0.4))*(1.0-smoothstep(0.6,1.0,r));
        vec3 c=vec3(1.0,0.86,0.55)*disc*limb*gran*2.6+vec3(1.0,0.5,0.15)*corona*1.3+vec3(1.0,0.35,0.08)*exp(-r*5.0)*0.5;
        gl_FragColor=vec4(c*fade*vT,1.0); }` });
  const star = new THREE.Mesh(new THREE.PlaneGeometry(o.R * .42, o.R * .42), starMat); star.renderOrder = 5; star.frustumCulled = false;
  group.add(star); mats.push(starMat);

  // the wisps blend over one another, so they are drawn far to near: sorted again each frame while the camera is close
  const cam = new THREE.Vector3(), at = new THREE.Vector3();
  function update(camera) {
    group.getWorldPosition(at); cam.copy(camera.position).sub(at);
    if (cam.length() > 170) return;
    const t = o.time.value;
    for (let i = 0; i < W; i++) { const k = i * 8, a = t * .015 + base[k + 1] * .09, c = Math.cos(a), s = Math.sin(a);   // as turnAt() in GAS
      const x = o.R * (c * base[k] - s * base[k + 2]) - cam.x, z = o.R * (s * base[k] + c * base[k + 2]) - cam.z, y = base[k + 1] - cam.y; depth[i] = x * x + y * y + z * z; }
    order.sort((a, b) => depth[b] - depth[a]); fill();
  }
  return { group, mats, update };
}
