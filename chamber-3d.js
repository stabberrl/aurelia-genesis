import * as THREE from "./assets/three.module.js";

const canvas = document.querySelector("#world-3d");
let renderer, scene, camera, root;
let graphicsReady = false;
const objects = new Map(); let world = null; let view = "observer"; let azimuth = .52; let polar = .72;
const colors = { "knowledge-fragment":0x63d3cf, "body-shell":0xdce4ec, "communication-panel":0xf3bb58, movable:0xdb6a56, "energy-source":0x4e92e5, inert:0x9b8159 };
function meshFor(object) { const color = colors[object.researcherRole] || 0x87968f; let mesh;
  if (object.researcherRole === "knowledge-fragment") mesh = new THREE.Mesh(new THREE.OctahedronGeometry(.24), new THREE.MeshStandardMaterial({ color, emissive:color, emissiveIntensity:.35 }));
  else if (object.researcherRole === "body-shell") mesh = new THREE.Mesh(new THREE.CapsuleGeometry(.35, .8, 5, 12), new THREE.MeshStandardMaterial({ color, metalness:.75, roughness:.28 }));
  else if (object.researcherRole === "communication-panel") mesh = new THREE.Mesh(new THREE.BoxGeometry(.65,.65,.12), new THREE.MeshStandardMaterial({ color, emissive:color, emissiveIntensity:.25 }));
  else mesh = new THREE.Mesh(new THREE.BoxGeometry(.55,.55,.55), new THREE.MeshStandardMaterial({ color, roughness:.7 }));
  mesh.castShadow = mesh.receiveShadow = true; return mesh;
}
function worldPosition(x,y,height=.3) { return new THREE.Vector3(x-(world.width-1)/2,height,y-(world.height-1)/2); }
function rebuild(data) { world = data; if (!graphicsReady) return update(data); root.clear(); objects.clear();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(data.width, data.height), new THREE.MeshStandardMaterial({ color:0x17211e, roughness:1 })); floor.rotation.x = -Math.PI/2; floor.receiveShadow=true; root.add(floor);
  const grid = new THREE.GridHelper(Math.max(data.width,data.height), Math.max(data.width,data.height), 0x365047, 0x263830); grid.position.y=.006; root.add(grid);
  data.obstacles.forEach(({x,y}) => { const block=new THREE.Mesh(new THREE.BoxGeometry(.96,1.45,.96),new THREE.MeshStandardMaterial({color:0x283833,roughness:.9})); block.position.copy(worldPosition(x,y,.725)); block.castShadow=true; root.add(block); });
  data.objects.forEach((object) => { const mesh=meshFor(object); mesh.position.copy(worldPosition(object.x,object.y,object.researcherRole==="body-shell"?.62:.35)); root.add(mesh); objects.set(object.id,mesh); });
  const body = data.bodies[0]; const avatar = new THREE.Group(); const core = new THREE.Mesh(new THREE.SphereGeometry(.34,18,14),new THREE.MeshStandardMaterial({color:0x72dcad,emissive:0x1c5940,emissiveIntensity:.7,roughness:.4})); core.position.y=.43; const halo = new THREE.Mesh(new THREE.TorusGeometry(.46,.025,8,32),new THREE.MeshBasicMaterial({color:0x9df3c9,transparent:true,opacity:.8})); halo.rotation.x=Math.PI/2; halo.position.y=.04; avatar.add(core,halo); avatar.name="naia"; root.add(avatar); update(data); }
function update(data) { if (!world) return; world=data; const body=data.bodies[0]; const avatar=graphicsReady ? root.getObjectByName("naia") : null; if (avatar) { avatar.position.copy(worldPosition(body.x,body.y,0)); avatar.rotation.y=body.direction * -Math.PI/2; }
  document.querySelector("#scene-tick").textContent=`TICK ${data.tick}`; document.querySelector("#subject-name").textContent=body.name||"Naia"; document.querySelector("#body-form").textContent=body.form||"básico"; document.querySelector("#body-position").textContent=`${body.x}, ${body.y}`; document.querySelector("#body-direction").textContent=body.directionName||"—";
  const energy=Math.max(0,Math.min(1,body.energy)); const fatigue=Math.max(0,Math.min(1,body.fatigue)); document.querySelector("#energy-value").textContent=`${Math.round(energy*100)}%`; document.querySelector("#fatigue-value").textContent=`${Math.round(fatigue*100)}%`; document.querySelector("#energy-meter").style.width=`${energy*100}%`; document.querySelector("#fatigue-meter").style.width=`${fatigue*100}%`;
  const recent=data.recentEvents?.[0]; document.querySelector("#latest-event").textContent=recent ? `${recent.action} · ${recent.outcome}${recent.details?.touched ? ` · ${recent.details.touched}` : ""}` : "Sin eventos todavía."; document.querySelector("#capabilities").innerHTML=(body.capabilities||[]).map(value=>`<span>${value}</span>`).join("") || "—";
  if (graphicsReady) document.querySelector("#scene-note").textContent=view === "subject" ? "Vista espacial situada tras el cuerpo. La información visible sigue proveniendo del runtime." : "Vista de observador: representa el estado persistido completo de Genesis World.";
}
function frame() { requestAnimationFrame(frame); if (world) { const body=world.bodies[0]; const p=worldPosition(body.x,body.y,.5); if(view==="subject") { const direction=body.direction * -Math.PI/2; camera.position.copy(p).add(new THREE.Vector3(Math.sin(direction)*-3,2.2,Math.cos(direction)*-3)); camera.lookAt(p.x+Math.sin(direction)*2,p.y+.4,p.z+Math.cos(direction)*2); } else { const radius=Math.max(world.width,world.height)*1.18; camera.position.set(Math.sin(azimuth)*Math.cos(polar)*radius,Math.sin(polar)*radius*.72,Math.cos(azimuth)*Math.cos(polar)*radius); camera.lookAt(0,0,0); } } renderer.render(scene,camera); }
function resize(){ const {width,height}=canvas.getBoundingClientRect(); renderer.setSize(width,height,false); camera.aspect=width/height; camera.updateProjectionMatrix(); }
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setClearColor(0x0d1110);
  scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0d1110, 12, 38);
  camera = new THREE.PerspectiveCamera(48, 1, .1, 100); root = new THREE.Group(); scene.add(root);
  scene.add(new THREE.HemisphereLight(0xb8dbc9, 0x17241f, 1.8));
  const lamp = new THREE.DirectionalLight(0xb6ffda, 1.4); lamp.position.set(8, 12, 5); scene.add(lamp);
  graphicsReady = true; new ResizeObserver(resize).observe(canvas); resize(); frame();
} catch (error) {
  canvas.hidden = true;
  document.querySelector("#scene-note").textContent = "Este navegador no pudo iniciar WebGL. La telemetría corporal continuará disponible mientras se habilita una alternativa gráfica.";
}
let dragging=false, px=0,py=0; canvas.addEventListener("pointerdown",e=>{dragging=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId)}); canvas.addEventListener("pointermove",e=>{if(!dragging||view!=="observer")return;azimuth-=(e.clientX-px)*.008;polar=Math.max(.18,Math.min(1.25,polar+(e.clientY-py)*.006));px=e.clientX;py=e.clientY}); canvas.addEventListener("pointerup",()=>dragging=false);
document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>{view=button.dataset.view;document.querySelectorAll("[data-view]").forEach(item=>item.classList.toggle("active",item===button));if(world)update(world)}));
async function refresh(){ try { const response=await fetch("/api/world",{cache:"no-store"}); if(!response.ok)throw new Error(); const data=await response.json(); if(!world||data.tick<world.tick||data.width!==world.width) rebuild(data); else update(data); const connection=document.querySelector("#connection"); connection.classList.add("ok"); connection.querySelector("span").textContent="Runtime conectado"; } catch { document.querySelector("#connection").classList.remove("ok"); document.querySelector("#connection span").textContent="Sin conexión"; } }
refresh(); setInterval(refresh,750);
