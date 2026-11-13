// A world of living fire: layers of glowing gas and smoke with sharp, fine filaments, round a burning star.
//
// The fire is painted once, when the page loads, at high resolution: the graphics card renders a few large images of
// a fire cloud from many layers of noise. Noise bending noise makes the swirls; ridged noise, each layer shaped by the
// one before, makes the thin bright filaments; dark smoke between them swallows light. Painting it once costs a moment;
// after that every frame only looks the images up. The cloud is then a stack of transparent sheets through the
// world's thickness, each turning at its own pace and gently churning, so it has depth and parallax as the camera moves.
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
    float shape=(1.0-smoothstep(0.12,1.0,r))*mix(0.3,1.0,lobes);                       // feathered all the way out
    float dens=smoothstep(0.42,0.85,smoke)*shape;
    float fil=smoothstep(0.45,1.3,veins)*smoothstep(0.3,0.62,smoke)*shape;           // filaments live in the gas, not the void
    float fil2=smoothstep(0.8,1.5,fine)*shape*smoothstep(0.3,0.6,smoke);
    float core=exp(-r*r*14.0);                                                        // the star's light on the gas near it
    float heat=dens*0.45+fil*1.45+fil2*1.0+core*1.0;
    vec3 e=fire(heat)*(dens*0.2+fil*1.9+fil2*1.0)*(0.6+1.1*core);
    e+=fire(0.4+0.5*core)*smoothstep(0.25,0.7,smoke)*shape*0.045;                    // a faint red haze through the whole cloud
    e+=vec3(0.42,0.14,1.0)*fil2*(1.0-shape)*smoothstep(1.0,0.5,r)*0.8;               // violet sparks out in the thin gas
    float alpha=clamp(dens*0.6+fil*0.15,0.0,1.0);
    // stored gently compressed, so the faint smoke keeps its detail in eight bits
    gl_FragColor=vec4(sqrt(clamp(e/4.0,0.0,1.0)),alpha); }`;

function paint(renderer, size, seed) {
  const rt = new THREE.WebGLRenderTarget(size, size, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  rt.texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
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

/*  makeNebula(o): returns { group, mats }
    o.R  radius, o.H  half-thickness (scene units)    o.renderer  to paint the fire    o.time  shared time uniform
    o.low  smaller images and fewer sheets, for phones                                                                 */
export function makeNebula(o) {
  const group = new THREE.Group(), mats = [];
  const size = o.low ? 1024 : 2048, art = [paint(o.renderer, size, 1.3), paint(o.renderer, size, 7.9)];
  const N = o.low ? 5 : 9;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1) * 2 - 1;                           // -1 at the bottom sheet, +1 at the top
    const m = new THREE.ShaderMaterial({
      uniforms: { time: o.time, fade: { value: 1 }, art: { value: art[i % 2] }, spin: { value: (i % 2 ? -1 : 1) * (.012 + .006 * (i % 3)) },
        turn: { value: i * 1.3 }, weight: { value: Math.exp(-u * u * 1.6) }, zoom: { value: 1 + .08 * (i % 3) }, flip: { value: i % 4 < 2 ? 1 : -1 } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,   // glows, and hides what is behind it
      vertexShader: `varying vec2 vP; varying vec3 vW; void main(){ vP=position.xy; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform sampler2D art; uniform float time, fade, spin, turn, weight, zoom, flip; varying vec2 vP; varying vec3 vW;
        void main(){
          float a=turn+time*spin, c=cos(a), s=sin(a);
          vec2 q=mat2(c,-s,s,c)*vP*zoom; q.x*=flip;
          // the gas churns: a slow, soft wobble of where each sheet is looked up
          q+=0.012*vec2(sin(q.y*5.0+time*0.35),cos(q.x*4.0-time*0.3));
          if(dot(q,q)>1.0) discard;
          vec2 uv=q*0.5+0.5;
          // the sharp fire, and round it the same fire blurred (a smaller copy the graphics card keeps anyway),
          // so every filament sits in its own soft light
          vec4 t=texture2D(art,uv), b1=texture2D(art,uv,4.2);
          vec3 e=t.rgb*t.rgb*4.0+b1.rgb*b1.rgb*4.0*0.27;
          float op=mix(t.a,b1.a,0.55);
          float flicker=0.85+0.15*sin(time*1.7+dot(q,vec2(9.0,7.0))+turn);
          // a sheet seen edge-on would show as a line: fade it out as the view flattens
          float side=smoothstep(0.05,0.3,abs(normalize(cameraPosition-vW).y));
          float k=weight*side*fade;
          gl_FragColor=vec4(e*k*flicker*3.1,op*k*0.18); }` });
    const sheet = new THREE.Mesh(new THREE.CircleGeometry(1, 96), m);
    sheet.scale.setScalar(o.R); sheet.rotation.x = -Math.PI / 2; sheet.position.y = u * o.H; sheet.frustumCulled = false;
    group.add(sheet); mats.push(m);
  }

  // the burning star: a boiling surface with darker cells, a limb that darkens toward the edge, and a corona
  const starMat = new THREE.ShaderMaterial({ uniforms: { time: o.time, fade: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv*2.0-1.0; gl_Position=projectionMatrix*(modelViewMatrix*vec4(0.0,0.0,0.0,1.0)+vec4(position.xy,0.0,0.0)); }`,
    fragmentShader: `uniform float time, fade; varying vec2 vUv;
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
        gl_FragColor=vec4(c*fade,1.0); }` });
  const star = new THREE.Mesh(new THREE.PlaneGeometry(o.R * .42, o.R * .42), starMat); star.renderOrder = 5; star.frustumCulled = false;
  group.add(star); mats.push(starMat);
  return { group, mats };
}
