import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (id) => document.getElementById(id);
const state = { type: 'glb', running: false, paused: false, elapsed: 0, duration: 10, lastFrame: 0, raf: null };
const COLORS = { purple: 0x9b7ede, pink: 0xef9fc5, green: 0x78c99a, road: 0xb8afbf, grass: 0xcfe8c8, ink: 0x493d5a };
let scene, camera, renderer, controls, car, ball, trail, trajectoryLine, startFlag, finishFlag;
let positionChart, velocityChart;
let quizIndex = 0, quizScore = 0, selectedAnswer = null, answered = false;

const lessons = {
  glb: { title:'Gerak Lurus Beraturan (GLB)', body:'Pada Gerak Lurus Beraturan, benda bergerak sepanjang lintasan lurus dengan kecepatan tetap. Karena kecepatan tidak berubah terhadap waktu, percepatan bernilai nol. Persamaan posisi untuk posisi awal x₀ adalah x = x₀ + vt. Kemiringan grafik posisi-waktu menyatakan kecepatan.' },
  glbb: { title:'Gerak Lurus Berubah Beraturan (GLBB)', body:'Pada Gerak Lurus Berubah Beraturan, percepatan bernilai konstan sehingga kecepatan berubah secara teratur. Persamaan kecepatan adalah v = v₀ + at, sedangkan perpindahan dari posisi awal adalah Δx = v₀t + ½at². Grafik kecepatan-waktu berupa garis lurus; kemiringannya menyatakan percepatan.' },
  parabola: { title:'Gerak Parabola', body:'Gerak parabola dapat diuraikan menjadi dua komponen. Pada arah horizontal, kecepatan dianggap konstan jika hambatan udara diabaikan: x = v₀ cos(θ)t. Pada arah vertikal, percepatan adalah gravitasi ke bawah: y = y₀ + v₀ sin(θ)t − ½gt². Model demonstrasi ini mengabaikan hambatan udara.' }
};

const quiz = [
  { q:'Pada GLB, besaran apakah yang bernilai konstan?', a:['Percepatan yang selalu berubah','Kecepatan','Posisi benda','Gaya gravitasi'], correct:1, explain:'Benar. GLB memiliki kecepatan konstan dan percepatan nol.' },
  { q:'Persamaan kecepatan pada GLBB dengan percepatan konstan adalah…', a:['v = v₀ + at','x = vt²','a = vt','v = x + t'], correct:0, explain:'Benar. Kecepatan pada GLBB adalah v = v₀ + at.' },
  { q:'Jika hambatan udara diabaikan, percepatan pada arah vertikal gerak parabola adalah…', a:['Nol setiap saat','Selalu searah gerak','Gravitasi ke bawah','Selalu bertambah'], correct:2, explain:'Benar. Percepatan vertikal adalah −g jika arah ke atas dipilih positif.' }
];

function initScene() {
  const host = $('scene');
  try {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f3fc);
    scene.fog = new THREE.Fog(0xf7f3fc, 28, 65);
    camera = new THREE.PerspectiveCamera(43, host.clientWidth / host.clientHeight, 0.1, 200);
    camera.position.set(8, 8, 13);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.8, 0);
    controls.maxPolarAngle = Math.PI * .48;
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd6cbe4, 2.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(5, 12, 8); key.castShadow = true; scene.add(key);
    buildEnvironment();
    buildCar();
    buildBall();
    buildFlags();
    buildTrajectory();
    $('sceneLoading').style.display = 'none';
    onResize();
    window.addEventListener('resize', onResize);
    animateScene();
  } catch (err) {
    $('sceneLoading').textContent = 'WebGL tidak tersedia pada browser ini. Coba perbarui browser atau aktifkan akselerasi grafis.';
    console.error(err);
  }
}
function material(color, roughness=.8) { return new THREE.MeshStandardMaterial({ color, roughness }); }
function buildEnvironment() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 28), material(COLORS.grass));
  ground.rotation.x = -Math.PI/2; ground.position.y = -.05; ground.receiveShadow = true; scene.add(ground);
  const road = new THREE.Mesh(new THREE.BoxGeometry(42, .12, 4), material(COLORS.road));
  road.position.set(0, .03, 0); road.receiveShadow = true; scene.add(road);
  for (const z of [-1.82, 1.82]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(42, .025, .055), material(0xffffff));
    edge.position.set(0,.105,z); scene.add(edge);
  }
  for (let x=-20; x<22; x+=3) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.15,.03,.10), material(0xfff0a8));
    dash.position.set(x,.11,0); scene.add(dash);
  }
  for(let i=0;i<12;i++){
    const x=-19+i*3.5;
    for(const z of [-4.3,4.3]){
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,1.25,7),material(0xa67c68));
      trunk.position.set(x, .58,z); trunk.castShadow=true; scene.add(trunk);
      const leaves=new THREE.Mesh(new THREE.SphereGeometry(.72,12,10),material(i%2?0x8dca86:0xb8e0a8));
      leaves.position.set(x,1.65,z); leaves.castShadow=true; scene.add(leaves);
    }
  }
}
function buildCar() {
  car = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1,.58,1.05), material(COLORS.pink));
  body.position.y=.68; body.castShadow=true; car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.12,.5,.82), material(0xe9dffb));
  cabin.position.set(-.08,1.17,0); cabin.castShadow=true; car.add(cabin);
  for(const x of [-.68,.72]) for(const z of [-.55,.55]){
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.16,18),material(0x565064));
    wheel.rotation.x=Math.PI/2; wheel.position.set(x,.34,z); wheel.castShadow=true; car.add(wheel);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.17,16),material(0xf4eff8));
    hub.rotation.x=Math.PI/2; hub.position.set(x,.34,z); car.add(hub);
  }
  scene.add(car);
}
function buildBall() {
  ball = new THREE.Mesh(new THREE.SphereGeometry(.27,24,18), material(COLORS.pink,.35));
  ball.castShadow=true; scene.add(ball);
}
function makeFlag(color, x) {
  const group=new THREE.Group();
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.8,8),material(color));
  pole.position.y=.9; group.add(pole);
  const flag=new THREE.Mesh(new THREE.BoxGeometry(.65,.34,.05),material(color));
  flag.position.set(.3,1.58,0); group.add(flag); group.position.x=x; scene.add(group); return group;
}
function buildFlags(){startFlag=makeFlag(COLORS.green,-15);finishFlag=makeFlag(COLORS.pink,15);}
function buildTrajectory() {
  const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0)]);
  trajectoryLine=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:COLORS.purple,linewidth:3}));
  scene.add(trajectoryLine);
}
function onResize(){
  if(!renderer||!camera)return;
  const host=$('scene'); camera.aspect=host.clientWidth/host.clientHeight; camera.updateProjectionMatrix();
  renderer.setSize(host.clientWidth,host.clientHeight);
}
function animateScene(){
  requestAnimationFrame(animateScene);
  if(state.running && !state.paused) {
    const now=performance.now();
    if(!state.lastFrame)state.lastFrame=now;
    const dt=Math.min((now-state.lastFrame)/1000,.05);
    state.elapsed=Math.min(state.duration,state.elapsed+dt);
    updateSceneAt(state.elapsed);
    updateMetrics(state.elapsed);
    if(state.elapsed>=state.duration){state.running=false;state.paused=false;$('sceneState').textContent='Simulasi selesai';$('startBtn').textContent='▶ Jalankan lagi';}
  }
  state.lastFrame=performance.now();
  if(controls)controls.update();
  if(renderer&&scene&&camera)renderer.render(scene,camera);
}
function getParams(){
  const type=$('motionType').value;
  const v0=clamp(numberFrom('v0',5),0,30);
  const a=clamp(numberFrom('accel',1),-5,5);
  const angle=clamp(numberFrom('angle',45),1,89)*Math.PI/180;
  const duration=clamp(numberFrom('duration',10),1,20);
  return {type,v0,a,angle,duration};
}
function numberFrom(id,fallback){const n=Number($(id).value);return Number.isFinite(n)?n:fallback}
function clamp(v,min,max){return Math.min(max,Math.max(min,v))}
function sample(t,p){
  const g=9.8;
  if(p.type==='parabola'){
    const vx=p.v0*Math.cos(p.angle), vy=p.v0*Math.sin(p.angle);
    return {x:vx*t,y:Math.max(0,2.2+vy*t-.5*g*t*t),vx,vy:vy-g*t,speed:Math.hypot(vx,vy-g*t),a:-g};
  }
  const a=p.type==='glb'?0:p.a;
  return {x:p.v0*t+.5*a*t*t,y:0.25,vx:p.v0+a*t,vy:0,speed:Math.abs(p.v0+a*t),a};
}
function getEndTime(p){
  if(p.type!=='parabola')return p.duration;
  const vy=p.v0*Math.sin(p.angle), h=2.2;
  const flight=(vy+Math.sqrt(vy*vy+2*9.8*h))/9.8;
  return Math.min(p.duration,Math.max(.1,flight));
}
function updateSceneAt(t){
  const p=getParams(); const s=sample(t,p);
  const end=getEndTime(p); const maxX=Math.max(8,Math.abs(sample(end,p).x)+2);
  const scale=14/maxX;
  if(p.type==='parabola'){
    car.visible=false;ball.visible=true;
    ball.position.set(-12+s.x*scale, s.y*scale*.55+.3,0);
    const points=[];
    const endS=sample(end,p);
    for(let i=0;i<=70;i++){const ti=end*i/70,ss=sample(ti,p);points.push(new THREE.Vector3(-12+ss.x*scale,ss.y*scale*.55+.3,0));}
    trajectoryLine.geometry.dispose();trajectoryLine.geometry=new THREE.BufferGeometry().setFromPoints(points);
    camera.position.lerp(new THREE.Vector3(-1,Math.max(7,Math.min(16,s.y*scale+8)),19),.025);
    controls.target.lerp(new THREE.Vector3(-12+endS.x*scale*.45,1.6,0),.025);
    finishFlag.position.x=-12+endS.x*scale;
  } else {
    ball.visible=false;car.visible=true;
    const visualX=-15+s.x*scale;
    car.position.set(clamp(visualX,-18,18),0,0);
    trajectoryLine.geometry.dispose();
    const pts=[new THREE.Vector3(-15,.14,0),new THREE.Vector3(visualX,.14,0)];
    trajectoryLine.geometry=new THREE.BufferGeometry().setFromPoints(pts);
    camera.position.lerp(new THREE.Vector3(visualX+1,8,15),.025);
    controls.target.lerp(new THREE.Vector3(visualX,0.7,0),.04);
  }
}
function updateMetrics(t){
  const p=getParams(),s=sample(t,p);
  $('metricTime').innerHTML=`${t.toFixed(2)} <small>s</small>`;
  $('metricPosition').innerHTML=`${s.x.toFixed(2)} <small>m</small>`;
  $('metricVelocity').innerHTML=`${(p.type==='parabola'?s.vx:s.vx).toFixed(2)} <small>m/s</small>`;
  $('metricAcceleration').innerHTML=`${s.a.toFixed(2)} <small>m/s²</small>`;
  $('timeProgress').style.width=`${Math.min(100,t/getEndTime(p)*100)}%`;
}
function makeData(){
  const p=getParams(), end=getEndTime(p), N=101;
  const labels=[],pos=[],vel=[];
  for(let i=0;i<N;i++){
    const t=end*i/(N-1),s=sample(t,p);
    labels.push(Number(t.toFixed(2)));pos.push(Number(s.x.toFixed(3)));
    vel.push(Number((p.type==='parabola'?s.vx:s.vx).toFixed(3)));
  }
  return {labels,pos,vel,p,end};
}
function createCharts(){
  const common={responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#493d5a',padding:10}},scales:{x:{title:{display:true,text:'Waktu (s)',color:'#877a98',font:{size:10}},ticks:{maxTicksLimit:6,color:'#9a8fa5',font:{size:9}},grid:{color:'#f3edf6'}},y:{ticks:{color:'#9a8fa5',font:{size:9}},grid:{color:'#f3edf6'}}}};
  positionChart=new Chart($('positionChart'),{type:'line',data:{labels:[],datasets:[{data:[],borderColor:'#a98add',backgroundColor:'#eee4fb',fill:true,tension:.18,pointRadius:0,borderWidth:2.5}]},options:structuredClone(common)});
  velocityChart=new Chart($('velocityChart'),{type:'line',data:{labels:[],datasets:[{data:[],borderColor:'#77bf97',backgroundColor:'#e4f5eb',fill:true,tension:0,pointRadius:0,borderWidth:2.5}]},options:structuredClone(common)});
}
function refreshModel(){
  state.type=$('motionType').value;
  const p=getParams();
  $('sceneTitle').textContent=p.type==='glb'?'Simulasi GLB':p.type==='glbb'?'Simulasi GLBB':'Simulasi Gerak Parabola';
  $('sceneMode').textContent=p.type==='glb'?'GERAK LURUS BERATURAN':p.type==='glbb'?'GERAK LURUS BERUBAH BERATURAN':'GERAK PARABOLA';
  $('accelWrap').hidden=p.type!=='glbb';$('angleWrap').hidden=p.type!=='parabola';
  $('formula').textContent=p.type==='glb'?'x = x₀ + v₀t':p.type==='glbb'?'x = x₀ + v₀t + ½at²':'x = v₀ cos θ · t';
  $('formulaNote').textContent=p.type==='glb'?'Kecepatan tetap, percepatan nol.':p.type==='glbb'?'Percepatan konstan; kecepatan berubah terhadap waktu.':'Komponen horizontal konstan; komponen vertikal dipengaruhi gravitasi.';
  const d=makeData();
  positionChart.data.labels=d.labels;positionChart.data.datasets[0].data=d.pos;
  positionChart.options.scales.y.title={display:true,text:'Posisi (m)',color:'#877a98',font:{size:10}};
  velocityChart.data.labels=d.labels;velocityChart.data.datasets[0].data=d.vel;
  velocityChart.options.scales.y.title={display:true,text:'Kecepatan (m/s)',color:'#877a98',font:{size:10}};
  positionChart.update();velocityChart.update();
  state.duration=d.end;state.elapsed=0;state.running=false;state.paused=false;state.lastFrame=0;
  updateSceneAt(0);updateMetrics(0);
  $('sceneState').textContent='Siap dijalankan';$('startBtn').textContent='▶ Mulai simulasi';
}
function start(){
  if(state.elapsed>=state.duration){state.elapsed=0;updateSceneAt(0);}
  state.running=true;state.paused=false;state.lastFrame=performance.now();
  $('sceneState').textContent='Simulasi berjalan';$('startBtn').textContent='▶ Sedang berjalan';
}
function pause(){
  if(!state.running)return;
  state.paused=!state.paused;
  $('pauseBtn').textContent=state.paused?'▶ Lanjut':'Ⅱ Jeda';
  $('sceneState').textContent=state.paused?'Simulasi dijeda':'Simulasi berjalan';
}
function reset(){
  state.running=false;state.paused=false;state.elapsed=0;state.lastFrame=0;
  $('pauseBtn').textContent='Ⅱ Jeda';$('startBtn').textContent='▶ Mulai simulasi';
  $('sceneState').textContent='Simulasi direset';updateSceneAt(0);updateMetrics(0);
}
function resetCamera(){if(!camera||!controls)return;camera.position.set(8,8,13);controls.target.set(0,.8,0);controls.update();}
function setupLessons(){
  document.querySelectorAll('.lesson-more').forEach(btn=>btn.addEventListener('click',()=>{
    const lesson=lessons[btn.dataset.lesson],panel=$('lessonDetail');
    panel.innerHTML=`<h3>${lesson.title}</h3><p>${lesson.body}</p>`;
    panel.hidden=false;panel.scrollIntoView({behavior:'smooth',block:'nearest'});
  }));
}
function renderQuestion(){
  const item=quiz[quizIndex];selectedAnswer=null;answered=false;
  $('questionText').textContent=item.q;$('quizCount').textContent=`${quizIndex+1} dari ${quiz.length}`;
  $('quizProgress').style.width=`${(quizIndex+1)/quiz.length*100}%`;
  $('quizFeedback').textContent='Pilih satu jawaban.';
  $('checkAnswer').textContent='Periksa jawaban';
  $('answerList').innerHTML='';
  item.a.forEach((answer,i)=>{
    const el=document.createElement('button');el.type='button';el.className='answer-option';
    el.innerHTML=`<span class="answer-letter">${String.fromCharCode(65+i)}</span><span>${answer}</span>`;
    el.addEventListener('click',()=>{
      if(answered)return;
      selectedAnswer=i;document.querySelectorAll('.answer-option').forEach(x=>x.classList.remove('selected'));
      el.classList.add('selected');
    });
    $('answerList').appendChild(el);
  });
}
function checkAnswer(){
  if(!answered){
    if(selectedAnswer===null){$('quizFeedback').textContent='Pilih salah satu jawaban terlebih dahulu.';return;}
    answered=true;const item=quiz[quizIndex],opts=[...document.querySelectorAll('.answer-option')];
    opts[item.correct].classList.add('correct');
    if(selectedAnswer===item.correct){quizScore++;$('quizFeedback').textContent='Benar! '+item.explain;}
    else{opts[selectedAnswer].classList.add('wrong');$('quizFeedback').textContent='Belum tepat. '+item.explain;}
    $('checkAnswer').textContent=quizIndex===quiz.length-1?'Lihat hasil':'Soal berikutnya';
  }else if(quizIndex<quiz.length-1){quizIndex++;renderQuestion();}
  else{
    $('questionText').textContent=`Latihan selesai — skor ${quizScore} dari ${quiz.length}.`;
    $('answerList').innerHTML='<p class="muted">Bagus! Kamu dapat mencoba lagi untuk menguatkan pemahaman konsep.</p>';
    $('quizFeedback').textContent='Tekan ulangi untuk mencoba kembali.';
    $('checkAnswer').textContent='Ulangi latihan';
    $('checkAnswer').onclick=()=>{quizIndex=0;quizScore=0;$('checkAnswer').onclick=checkAnswer;renderQuestion();};
  }
}
function setupNavigation(){
  $('menuToggle').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
  document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click',()=>{
    document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active'));a.classList.add('active');
    $('sidebar').classList.remove('open');
  }));
}
function init(){
  createCharts();initScene();setupLessons();setupNavigation();renderQuestion();
  $('motionType').addEventListener('change',refreshModel);
  ['v0','accel','angle','duration'].forEach(id=>$(id).addEventListener('change',refreshModel));
  $('startBtn').addEventListener('click',start);$('pauseBtn').addEventListener('click',pause);
  $('resetBtn').addEventListener('click',reset);$('resetCamera').addEventListener('click',resetCamera);
  $('checkAnswer').addEventListener('click',checkAnswer);
  refreshModel();
}
init();
