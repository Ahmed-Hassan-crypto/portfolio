import * as THREE from 'three';

/* ── Safety: force-dismiss loader after max wait ── */
const FORCE_DISMISS = 6000;
let loaderDismissed = false;
function dismissLoader() {
    if (loaderDismissed) return;
    loaderDismissed = true;
    document.getElementById('loader').classList.add('hidden');
}
setTimeout(dismissLoader, FORCE_DISMISS);

/* ── State ── */
let scrollProg = 0;
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
const mob = innerWidth < 768;

/* ── Scene ── */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0B0B0F, 0.005);

const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);
cam.position.set(0, 0, 12);

const ren = new THREE.WebGLRenderer({ antialias: !mob, alpha: false });
ren.setSize(innerWidth, innerHeight);
ren.setPixelRatio(Math.min(devicePixelRatio, 2));
ren.toneMapping = THREE.ACESFilmicToneMapping;
ren.toneMappingExposure = 1.0;
ren.setClearColor(0x0B0B0F, 1);
document.getElementById('canvas-container').appendChild(ren.domElement);

/* ── Lights ── */
scene.add(new THREE.AmbientLight(0x1a1510, 0.4));
const L1 = new THREE.PointLight(0xD4A017, 2.5, 60); L1.position.set(5, 5, 5); scene.add(L1);
const L2 = new THREE.PointLight(0x14B8A6, 1.8, 60); L2.position.set(-5, -3, 3); scene.add(L2);
const L3 = new THREE.PointLight(0xE85D4A, 1.2, 50); L3.position.set(0, -5, -5); scene.add(L3);

/* ── Stars ── */
(function () {
    const n = mob ? 2500 : 4500;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - .5) * 200;
        pos[i * 3 + 1] = (Math.random() - .5) * 200;
        pos[i * 3 + 2] = (Math.random() - .5) * 200;
        const t = Math.random();
        if (t < .5) { col[i * 3] = .85 + Math.random() * .15; col[i * 3 + 1] = .75 + Math.random() * .2; col[i * 3 + 2] = .55 + Math.random() * .3; }
        else if (t < .8) { col[i * 3] = .08 + Math.random() * .1; col[i * 3 + 1] = .65 + Math.random() * .15; col[i * 3 + 2] = .55 + Math.random() * .15; }
        else { col[i * 3] = .9; col[i * 3 + 1] = .9; col[i * 3 + 2] = .85; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: .12, vertexColors: true, transparent: true, opacity: .85, sizeAttenuation: true, depthWrite: false })));
})();

/* ── Nebula sprites ── */
(function () {
    const cfgs = [[212, 160, 23, 15, 8, -25, 35], [20, 184, 166, -18, -5, -20, 30], [232, 93, 74, 5, -12, -30, 28], [212, 160, 23, -10, 15, -18, 22], [20, 184, 166, 20, -8, -15, 25], [80, 40, 120, -20, 0, -35, 40]];
    cfgs.forEach(([r, g, b, x, y, z, s]) => {
        const c = document.createElement('canvas'); c.width = c.height = 256;
        const ctx = c.getContext('2d');
        const grd = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        grd.addColorStop(0, `rgba(${r},${g},${b},0.18)`);
        grd.addColorStop(0.4, `rgba(${r},${g},${b},0.06)`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grd; ctx.fillRect(0, 0, 256, 256);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
        sp.scale.set(s, s, 1); sp.position.set(x, y, z); scene.add(sp);
    });
})();

/* ── Crystal ── */
const cDetail = mob ? 2 : 3;
const cGeo = new THREE.IcosahedronGeometry(Math.max(.1, 2.5), cDetail);
const origP = cGeo.attributes.position.array.slice();

const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xD4A017, metalness: .92, roughness: .08,
    emissive: 0x3D2E00, emissiveIntensity: .35,
    clearcoat: 1, clearcoatRoughness: .05,
    transparent: true, opacity: .88
});
const wireMat = new THREE.MeshBasicMaterial({ color: 0x14B8A6, wireframe: true, transparent: true, opacity: .1, depthWrite: false });

const crystal = new THREE.Mesh(cGeo, crystalMat);
const wire = new THREE.Mesh(cGeo, wireMat);
wire.scale.set(1.025, 1.025, 1.025);
const cGrp = new THREE.Group();
cGrp.add(crystal); cGrp.add(wire);
scene.add(cGrp);

/* ── Orbiters ── */
const orbGrp = new THREE.Group();
const orbCount = mob ? 5 : 10;
for (let i = 0; i < orbCount; i++) {
    const geo = i % 2 === 0
        ? new THREE.OctahedronGeometry(Math.max(.01, .1 + Math.random() * .12), 0)
        : new THREE.TetrahedronGeometry(Math.max(.01, .1 + Math.random() * .1), 0);
    const gold = i % 3 !== 0;
    const mat = new THREE.MeshStandardMaterial({ color: gold ? 0xD4A017 : 0x14B8A6, emissive: gold ? 0x3D2E00 : 0x0D3D3A, metalness: .8, roughness: .2 });
    const m = new THREE.Mesh(geo, mat);
    m.userData = { a: (i / orbCount) * Math.PI * 2, r: 3.2 + Math.random() * 2, s: .15 + Math.random() * .25, yA: (Math.random() - .5) * 2.5, yS: .3 + Math.random() * .4, t: Math.random() * .5 };
    orbGrp.add(m);
}
scene.add(orbGrp);

/* ── Floating wireframe shapes ── */
const floaters = [];
const fGeos = [
    new THREE.TetrahedronGeometry(Math.max(.01, .25), 0),
    new THREE.OctahedronGeometry(Math.max(.01, .2), 0),
    new THREE.BoxGeometry(.25, .25, .25),
    new THREE.IcosahedronGeometry(Math.max(.01, .18), 0)
];
for (let i = 0; i < (mob ? 12 : 22); i++) {
    const mat = new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xD4A017 : i % 3 === 1 ? 0x14B8A6 : 0xE85D4A, wireframe: true, transparent: true, opacity: .06 + Math.random() * .1, depthWrite: false });
    const m = new THREE.Mesh(fGeos[i % fGeos.length], mat);
    m.position.set((Math.random() - .5) * 35, (Math.random() - .5) * 25, -5 - Math.random() * 25);
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    m.userData = { rx: (Math.random() - .5) * .4, ry: (Math.random() - .5) * .4, fS: .15 + Math.random() * .35, fA: .15 + Math.random() * .4, bY: m.position.y };
    scene.add(m); floaters.push(m);
}

/* ── Rings ── */
const ring1 = new THREE.Mesh(new THREE.TorusGeometry(Math.max(.01, 3.8), .008, 8, 100), new THREE.MeshBasicMaterial({ color: 0xD4A017, transparent: true, opacity: .12, depthWrite: false }));
ring1.rotation.x = Math.PI * .5; scene.add(ring1);
const ring2 = new THREE.Mesh(new THREE.TorusGeometry(Math.max(.01, 4.5), .005, 8, 120), new THREE.MeshBasicMaterial({ color: 0x14B8A6, transparent: true, opacity: .07, depthWrite: false }));
ring2.rotation.x = Math.PI * .35; ring2.rotation.z = Math.PI * .15; scene.add(ring2);

/* ── Dismiss loader once scene is ready ── */
dismissLoader();

/* ── Mouse ── */
window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / innerHeight) * 2 + 1;
});

/* ── Scroll ── */
window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollProg = max > 0 ? window.scrollY / max : 0;
}, { passive: true });

/* ── Resize ── */
window.addEventListener('resize', () => {
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
    ren.setSize(innerWidth, innerHeight);
});

/* ── Section observer for nav dots + reveals ── */
const sections = document.querySelectorAll('.section');
const dots = document.querySelectorAll('.ndot');
const secObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            const id = e.target.id;
            dots.forEach(d => { d.classList.toggle('active', d.getAttribute('href') === '#' + id); });
        }
    });
}, { threshold: 0.35 });
sections.forEach(s => secObs.observe(s));

const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('v'); });
}, { threshold: 0.1 });
document.querySelectorAll('.rv').forEach(el => revObs.observe(el));

/* ── Header scroll state ── */
window.addEventListener('scroll', () => {
    document.getElementById('site-header').classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── 3D Tilt on project cards ── */
document.querySelectorAll('.pj-c').forEach(card => {
    card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) translateY(0)';
    });
});

/* ── Animate ── */
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth mouse
    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;

    // Crystal displacement
    const pos = cGeo.attributes.position;
    const cnt = pos.count;
    const b = scrollProg * 2.5;
    for (let i = 0; i < cnt; i++) {
        const ox = origP[i * 3], oy = origP[i * 3 + 1], oz = origP[i * 3 + 2];
        const f1 = Math.sin(ox * 3 + t * .8) * Math.cos(oy * 3 + t * .6) * Math.sin(oz * 3 + t);
        const f2 = Math.sin(ox * 5 + t * 1.3) * Math.cos(oz * 5 + t * .9) * Math.sin(oy * 4.5 + t * .7);
        const f3 = Math.cos(oy * 4 + t) * Math.sin(oz * 4.5 + t * 1.2) * Math.cos(ox * 4 + t * .5);
        let n;
        if (b < 1) n = f1 * (1 - b) + f2 * b;
        else if (b < 2) n = f2 * (2 - b) + f3 * (b - 1);
        else n = f3;
        const sc = 1 + n * .14;
        pos.array[i * 3] = ox * sc; pos.array[i * 3 + 1] = oy * sc; pos.array[i * 3 + 2] = oz * sc;
    }
    pos.needsUpdate = true;
    cGeo.computeVertexNormals();

    cGrp.rotation.y = t * .08 + scrollProg * Math.PI * 1.5 + mouse.sx * .25;
    cGrp.rotation.x = Math.sin(t * .12) * .15 + mouse.sy * .1;
    cGrp.rotation.z = Math.cos(t * .1) * .05;

    // Orbiters
    orbGrp.children.forEach(m => {
        const d = m.userData;
        const a = d.a + t * d.s;
        m.position.x = Math.cos(a) * d.r;
        m.position.z = Math.sin(a) * d.r * Math.cos(d.t);
        m.position.y = Math.sin(t * d.yS + d.a) * d.yA;
        m.rotation.x = t * .6; m.rotation.y = t * .8;
    });

    // Floaters
    floaters.forEach(m => {
        const d = m.userData;
        m.rotation.x += d.rx * .008; m.rotation.y += d.ry * .008;
        m.position.y = d.bY + Math.sin(t * d.fS) * d.fA;
    });

    // Rings
    ring1.rotation.z = t * .05;
    ring2.rotation.y = t * .03;

    // Lights subtle motion
    L1.position.x = 5 + Math.sin(t * .3) * 2;
    L1.position.y = 5 + Math.cos(t * .25) * 2;
    L2.position.x = -5 + Math.cos(t * .35) * 2;
    L2.position.y = -3 + Math.sin(t * .4) * 1.5;

    // Camera drift
    const tx = mouse.sx * 1.2;
    const ty = mouse.sy * 0.8;
    cam.position.x += (tx - cam.position.x) * 0.03;
    cam.position.y += (ty - cam.position.y) * 0.03;
    cam.lookAt(0, 0, 0);

    ren.render(scene, cam);
}
animate();
