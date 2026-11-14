// A world drawn as a living galaxy: tens of thousands of stars, each on its own orbit, with glowing gas, bright knots
// and dark dust along the spiral arms.
//
// The arms are density waves, as in real spiral galaxies. Every orbit is a slightly squashed loop (with one lobe per
// arm), and each orbit is turned a little further than the one inside it. Where neighbouring orbits crowd together the
// stars bunch up, and that crowding is the arm. The pattern turns slowly and rigidly while the stars flow through it at
// their own speeds (faster near the centre), so the arms keep their shape although nothing in them stands still.
// Gas and dust do not orbit for ever: each puff is born in an arm, drifts out of it with its orbit, and fades.
// Everything moves in the vertex shader, so the CPU does nothing per frame.
import * as THREE from 'three';

const TAU = Math.PI * 2;

// a small seeded random number generator, so each world is the same on every visit
function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const gauss = r => { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };

// the orbits, shared by every layer. a is the orbit's size from 0 (centre) to 1 (rim).
const ORBITS = `
  uniform float time, R, twist, strength, arms, core, omega0, patt, px, fade, glow, hole;
  // how far each orbit is turned. Logarithmic, so the arms open at a constant angle (as real ones do), and trailing
  float thetaA(float a){ return -twist*log(a+0.05); }
  float kA(float a){ return arms*twist*a/(a+0.05); }                           // minus the rate that turn changes, times arms and a
  float eccA(float a){ float k=kA(a); return strength/sqrt(1.0+k*k)*smoothstep(0.03,0.2,a); }
  float omegaA(float a){ return omega0/max(a,core); }                         // a flat rotation curve outside a core that turns as one
  // where neighbouring orbits come closest, so the stars crowd: the middle of an arm (checked against a simulation)
  float armAngle(float a,float t){ return thetaA(a)+patt*t+(atan(-kA(a))+3.14159265)/arms; }
  vec3 orbit(float a,float M,float t,float y){ float r=a*(1.0+eccA(a)*cos(arms*(M-thetaA(a)-patt*t)));
    return vec3(cos(M)*r*R, y, sin(M)*r*R); }
  // keep points at least 1.5 pixels across and dim the smaller ones instead, so nothing shimmers,
  // and no bigger than 70, fading the ones that would be, so puffs close to the camera don't turn into blobs
  float pointSize(float s, vec4 mv, out float dim){ float p=s*px/max(-mv.z,0.1); dim=min(1.0,(p*p)/2.25)*min(1.0,pow(42.0/p,2.0));
  #ifdef VEIL
    dim*=veil((mv.xyz-viewMatrix[3].xyz)*mat3(viewMatrix),modelMatrix[3].xyz);   // a world inside a cloud: the gas between dims each point
  #endif
    return clamp(p,1.5,70.0); }
`;

// one layer of points
function layer({ count, attrs, vertex, fragment, uniforms, blending = THREE.AdditiveBlending, order, head = '' }) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));   // unused: the shader places every point
  for (const [name, size, data] of attrs) g.setAttribute(name, new THREE.BufferAttribute(data, size));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), uniforms.R.value * 1.6);
  const m = new THREE.ShaderMaterial({ uniforms, vertexShader: head + ORBITS + vertex, fragmentShader: fragment,
    transparent: true, depthWrite: false, blending });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = order; p.userData.count = count; return p;
}

/*  makeGalaxy(o): returns { group, mats, lod }
    o.R        radius in scene units            o.arms     number of arms         o.twist   how tightly they wind (2.4: about 23°)
    o.A,B,C    core, disc and rim colours       o.K        colour of the bright knots in the arms
    o.seed     o.thick (vertical scale)         o.speed    1 = default orbit speed; negative turns the other way
    o.strength how strongly the arms crowd      o.bulge    share of stars in the central bulge (0.14)
    o.hole     an empty centre, 0..1 of R       o.gems     jewel lights orbiting in the disc (the lower worlds)
    o.glow     overall brightness               o.scale    how far the light spreads (0.3)
    o.white    how far the stars lean to white (0.3)   o.warmCore false for a world no sun reaches: no warm old centre
    o.young    colour of the young stars in the arms (blue-white)          o.dust     false: no dark dust in the arms
    o.time, o.px: shared uniforms                o.low: fewer points, for phones
    o.veil     GLSL with veil(world, centre), 0..1: how much of each point's light gets through (a world inside a cloud)
    lod(f) draws only that share (0.1..1) of the stars and puffs, a little brighter each, for a world seen from afar  */
export function makeGalaxy(o) {
  const r = rng(o.seed || 1), low = !!o.low, R = o.R, thick = o.thick || 1, hole = o.hole || 0, sc = o.scale ?? .3, wh = o.white ?? .3;
  const dir = Math.sign(o.speed ?? 1) || 1, arms = o.arms || 2;               // a world turning the other way has its arms mirrored, so they still trail
  const A = new THREE.Color(o.A), B = new THREE.Color(o.B), C = new THREE.Color(o.C), K = new THREE.Color(o.K || '#ff8fc8');
  const warm = o.warmCore === false ? new THREE.Color(o.A) : new THREE.Color('#ffe2b8'), young = new THREE.Color(o.young || '#cfe0ff'), white = new THREE.Color(1, 1, 1);
  const omega0 = .011 * (o.speed ?? 1), core = .14, patt = omega0 / .62;    // the pattern turns with the stars at 62% of the radius
  const U = () => ({ time: o.time, px: o.px, fade: { value: 1 }, glow: { value: o.glow ?? 1 }, hole: { value: hole },
    R: { value: R }, twist: { value: (o.twist ?? 2.4) * dir }, strength: { value: o.strength ?? .8 }, arms: { value: arms },
    core: { value: core }, omega0: { value: omega0 }, patt: { value: patt } });
  const omegaA = a => omega0 / Math.max(a, core);
  // how long a puff of gas lives: long enough to drift a set angle out of its arm, whatever its speed relative to the arms
  const lifeFor = (a, drift) => Math.min(140, Math.max(10, drift / Math.max(Math.abs(omegaA(a) - patt), 1e-3)));
  const discA = () => { let a; do { a = -Math.log(1 - r() * .985) * sc; } while (a > 1 || a < hole); return a; };   // exponential disc
  const group = new THREE.Group(), mats = [], thinned = [], head = o.veil ? '#define VEIL\n' + o.veil : '';
  const colour = v => [v.r, v.g, v.b];

  // ---- the smooth light of the disc: the glow of stars too faint to see one by one, brighter along the arms, with
  // clumps of gas that flow with the orbits (two copies, crossfaded, so the flow never winds itself into stripes) and
  // dark lanes of dust on the inner edge of each arm ----
  { const u = U(); Object.assign(u, { cA: { value: A }, cB: { value: B }, cC: { value: C }, cY: { value: young }, seed: { value: (o.seed || 1) * 7.31 }, sc: { value: sc },
      laneSide: { value: -dir } });
    const m = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: ORBITS + `varying vec2 vP; void main(){ vP=position.xy/R; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: ORBITS + `uniform vec3 cA,cB,cC,cY; uniform float seed, laneSide, sc; varying vec2 vP;
        float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))+seed)*43758.5453); }
        float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y); }
        float fbm(vec2 p){ float s=0.0,w=0.5; for(int i=0;i<${low ? 3 : 5};i++){ s+=w*n2(p); p=p*2.03+vec2(1.7,9.2); w*=0.5; } return s; }   // phones: fewer octaves
        float gas(float a,float phi,float t){ float M=phi-omegaA(a)*t; return fbm(vec2(cos(M),sin(M))*a*7.0+vec2(a*3.0)); }
        void main(){
          float a=length(vP); if(a>1.0) discard; float phi=atan(-vP.y,vP.x);
          float d=fract((phi-armAngle(a,time))*arms/6.2831853+0.5)-0.5;
          float arm=exp(-d*d*28.0)*smoothstep(0.05,0.22,a);
          float dl=d-laneSide*0.075, lane=exp(-dl*dl*260.0)*smoothstep(0.24,0.45,a);
          const float T=70.0; float t1=mod(time,T), t2=mod(time+T*0.5,T), w=abs(t1/T*2.0-1.0);
          float g=mix(gas(a,phi,t1-T*0.5),gas(a,phi,t2-T*0.5),w);
          float disc=exp(-a/sc)*(1.0-smoothstep(0.8,1.0,a))*(0.3+0.7*smoothstep(0.0,0.16,a))*smoothstep(hole,hole+0.12,a);
          vec3 col=mix(cA,cB,smoothstep(0.0,0.45,a)); col=mix(col,cC,smoothstep(0.45,1.0,a));
          vec3 c=col*disc*(0.35+1.6*arm*(0.45+g))+cY*arm*smoothstep(0.55,0.8,g)*disc*0.9;
          c*=1.0-lane*0.6;
          gl_FragColor=vec4(c*0.32*fade*glow,1.0); }` });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 160), m); disc.rotation.x = -Math.PI / 2; disc.renderOrder = 0;
    group.add(disc); mats.push(m); }

  // ---- stars: an old, warm bulge and a disc whose stars brighten and turn bluer as they pass through the arms ----
  { const N = low ? 40000 : 120000, fb = hole ? 0 : (o.bulge ?? .14);
    const a = new Float32Array(N), m0 = new Float32Array(N), y = new Float32Array(N), sz = new Float32Array(N), tw = new Float32Array(N), tint = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const bulge = r() < fb; const ai = bulge ? Math.min(.35, Math.abs(gauss(r)) * .07) : discA();   // mixed in order, so any first share is a fair sample
      a[i] = ai; m0[i] = r() * TAU;
      y[i] = gauss(r) * R * thick * (bulge ? .5 * Math.max(ai, .02) + .01 : .012 + .02 * Math.exp(-ai * 4));
      const big = r() < .015;                                                     // a few giants
      sz[i] = R * (big ? .0055 + r() * .005 : .0014 + r() * .0016); tw[i] = r() * TAU;
      // old warm stars in the bulge and the inner disc, the world's own colours further out; the centre is dense, so each star there is dimmer
      const c = bulge ? warm.clone().lerp(A, r() * .25) : warm.clone().lerp(A, Math.min(1, ai / .3)).lerp(B, Math.min(1, ai * 1.4)).lerp(C, Math.max(0, ai - .55) * 1.6);
      c.lerp(white, (bulge ? .1 : wh) + .25 * r()).multiplyScalar((.55 + r() * .7 + (big ? 1.2 : 0)) * (bulge ? .24 : .3 + .7 * Math.min(1, ai / .32)));
      tint.set(colour(c), i * 3);
    }
    const u = U(); u.young = { value: young }; u.gain = { value: 1 };
    const L = layer({ count: N, head, uniforms: u, order: 2,
      attrs: [['a', 1, a], ['m0', 1, m0], ['yo', 1, y], ['sz', 1, sz], ['tw', 1, tw], ['tint', 3, tint]],
      vertex: `attribute float a,m0,yo,sz,tw; attribute vec3 tint; uniform vec3 young; uniform float gain; varying vec3 vC;
        void main(){ float M=m0+omegaA(a)*time; vec3 p=orbit(a,M,time,yo);
          float d=fract((M-armAngle(a,time))*arms/6.2831853+0.5)-0.5;            // where this star is between two arms
          float arm=exp(-d*d*38.0)*smoothstep(0.06,0.25,a);
          float twinkle=0.85+0.15*sin(time*(1.5+fract(tw*7.0)*2.5)+tw);
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; float dim;
          gl_PointSize=pointSize(sz*(1.0+arm*0.5),mv,dim);
          vC=mix(tint,young*1.6,arm*0.4)*(0.8+arm*0.7)*twinkle*dim*fade*glow*gain; }`,
      fragment: `varying vec3 vC; void main(){ vec2 q=gl_PointCoord*2.0-1.0; float d=dot(q,q); if(d>1.0) discard;
        gl_FragColor=vec4(vC*(exp(-d*5.0)+0.12*(1.0-d)),1.0); }` });
    group.add(L); mats.push(L.material); thinned.push(L); }

  // ---- gas, bright knots and dust: born in an arm, carried out of it by their orbits, fading as they go ----
  const puffs = ({ N, size, drift, spread, offset, lifeScale = 1, amin = .16, even = false, colour: col, order, kind }) => {
    amin = Math.max(amin, hole + .05);
    const a = new Float32Array(N), off = new Float32Array(N), ph = new Float32Array(N), life = new Float32Array(N), which = new Float32Array(N),
      y = new Float32Array(N), sz = new Float32Array(N), tint = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      let ai; do { ai = even ? amin + Math.sqrt(r()) * (.95 - amin) : amin + discA() * (1.05 - amin); } while (ai > .97); a[i] = ai;   // the inner arms wind too tightly to hold gas
      off[i] = (offset + gauss(r) * spread) * dir; ph[i] = r(); life[i] = lifeFor(ai, drift) * lifeScale * (.7 + r() * .6);
      which[i] = Math.floor(r() * arms); y[i] = gauss(r) * R * thick * .012;
      sz[i] = R * size * (.6 + r() * .8); tint.set(colour(col(ai)), i * 3);
    }
    const u = U(); u.gain = { value: 1 };
    const L = layer({ count: N, head, uniforms: u, order, blending: kind === 'dust' ? THREE.NormalBlending : THREE.AdditiveBlending,
      attrs: [['a', 1, a], ['off', 1, off], ['ph', 1, ph], ['life', 1, life], ['which', 1, which], ['yo', 1, y], ['sz', 1, sz], ['tint', 3, tint]],
      vertex: `attribute float a,off,ph,life,which,yo,sz; attribute vec3 tint; uniform float gain; varying vec3 vC; varying float vA;
        void main(){ float age=fract(time/life+ph), born=time-age*life;
          float M=armAngle(a,born)+(which+off)*6.2831853/arms+omegaA(a)*(time-born);
          vec3 p=orbit(a,M,time,yo);
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; float dim;
          gl_PointSize=pointSize(sz*(0.7+0.6*age),mv,dim);                       // puffs spread a little as they age
          vA=pow(sin(3.14159265*age),1.5)*dim*fade; vC=tint*glow${kind === 'dust' ? '' : '*gain'}; }`,
      fragment: kind === 'dust'
        ? `varying vec3 vC; varying float vA; void main(){ vec2 q=gl_PointCoord*2.0-1.0; float d=dot(q,q); if(d>1.0) discard;
            gl_FragColor=vec4(vC,vA*pow(1.0-d,2.0)*0.3); }`
        : `varying vec3 vC; varying float vA; void main(){ vec2 q=gl_PointCoord*2.0-1.0; float d=dot(q,q); if(d>1.0) discard;
            gl_FragColor=vec4(vC*vA*${kind === 'knot' ? '(exp(-d*9.0)*1.6+0.1*(1.0-d))' : 'pow(1.0-d,2.0)'},1.0); }` });
    group.add(L); mats.push(L.material); thinned.push(L); };

  // glowing gas in the arms, in the world's own colours
  puffs({ N: low ? 2400 : 6000, size: .05, drift: .5, spread: .075, offset: .02, order: 1, kind: 'gas',
    colour: ai => B.clone().lerp(C, Math.min(1, ai * 1.2)).lerp(r() < .25 ? K : A, .25).multiplyScalar(.028 + r() * .02) });
  // bright knots where new stars are forming, short-lived
  puffs({ N: low ? 260 : 650, size: .013, drift: .22, spread: .035, offset: .03, lifeScale: .6, amin: .2, order: 3, kind: 'knot',
    colour: () => K.clone().lerp(white, r() * .35).multiplyScalar(1.7) });
  // dark dust along the inner edge of each arm (not in a world of fire, where it would draw a dark ring across the flames)
  if (o.dust !== false) puffs({ N: low ? 1300 : 3200, size: .04, drift: .3, spread: .022, offset: -.07, amin: .28, even: true, order: 4, kind: 'dust',
    colour: () => new THREE.Color(.025, .018, .02) });

  // ---- jewels: the lower worlds are lit by the gems on the serpents' hoods (Vishnu Purana 2.5), drawn as bright
  // points of colour that orbit a little above the disc and pulse slowly ----
  if (o.gems) {
    const N = o.gems, pal = ['#ff4d6d', '#4cc9ff', '#ffd166', '#7cff9b', '#c77dff'].map(h => new THREE.Color(h));
    const a = new Float32Array(N), m0 = new Float32Array(N), y = new Float32Array(N), sz = new Float32Array(N), tw = new Float32Array(N), tint = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      a[i] = Math.max(hole + .04, .1 + Math.sqrt(r()) * .85); m0[i] = r() * TAU; y[i] = R * (-.008 + r() * .04);
      sz[i] = R * (.008 + r() * .009); tw[i] = r() * TAU; tint.set(colour(pal[i % pal.length].clone().multiplyScalar(2.2)), i * 3);
    }
    const L = layer({ count: N, head, uniforms: U(), order: 3,
      attrs: [['a', 1, a], ['m0', 1, m0], ['yo', 1, y], ['sz', 1, sz], ['tw', 1, tw], ['tint', 3, tint]],
      vertex: `attribute float a,m0,yo,sz,tw; attribute vec3 tint; varying vec3 vC;
        void main(){ vec3 p=orbit(a,m0+omegaA(a)*time,time,yo);
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; float dim;
          gl_PointSize=pointSize(sz,mv,dim); vC=tint*(0.7+0.3*sin(time*0.8+tw))*dim*fade*glow; }`,
      fragment: `varying vec3 vC; void main(){ vec2 q=gl_PointCoord*2.0-1.0; float d=dot(q,q); if(d>1.0) discard;
        gl_FragColor=vec4(vC*(exp(-d*7.0)*1.4+0.15*(1.0-d)),1.0); }` });
    group.add(L); mats.push(L.material); }

  // from afar, draw a fair share of the stars and puffs (they are stored in random order), each a little brighter
  const lod = f => { f = Math.min(1, Math.max(.1, f));
    for (const L of thinned) { L.geometry.setDrawRange(0, Math.ceil(L.userData.count * f)); if (L.material.uniforms.gain) L.material.uniforms.gain.value = 1 / f; } };

  return { group, mats, lod };
}
