(()=>{
'use strict';
const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=()=>{let d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const uid=()=>crypto.randomUUID();
const cfg=window.PULSO_CONFIG||{};
const connected=!!(window.supabase&&cfg.supabaseUrl&&cfg.supabasePublishableKey);
const db=connected?window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey):null;
const demoKey='pulso-demo-v1';
const pages=['inicio','rutinas','entrenar','ejercicios','progreso','nutricion','comunidad'];
const labels=['Inicio','Rutinas','Entrenar','Ejercicios','Progreso','Nutrición e IMC','Comunidad'];
let user=null, profile=null, exercises=window.PULSO_EXERCISES||[], plans=[], sessions=[], sets=[], leaders=[];
let selectedPlan='', selectedSession='', query='', muscle='Todos', messageTimer=0;
const id=x=>x.id||x.slug;
const ex=x=>exercises.find(e=>id(e)===x);
const fmt=x=>new Date(x+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'});
const month=()=>iso().slice(0,7)+'-01';
const notice=(txt,error=false)=>{const el=$('#notice');el.hidden=false;el.textContent=txt;el.dataset.kind=error?'error':'success';clearTimeout(messageTimer);messageTimer=setTimeout(()=>el.hidden=true,6500)};
const persist=()=>{if(!connected)localStorage.setItem(demoKey,JSON.stringify({plans,sessions,sets}))};
const heading=(k,t,p='')=>'<div class="heading"><p class="eyebrow">'+esc(k)+'</p><h1>'+esc(t)+'</h1><p class="muted">'+esc(p)+'</p></div>';
const tag=(txt,bright=false)=>'<span class="tag '+(bright?'lime':'')+'">'+esc(txt)+'</span>';
const button=(action,txt,key='',style='ghost')=>'<button type="button" class="'+style+'" data-action="'+action+'" data-id="'+esc(key)+'">'+esc(txt)+'</button>';
const link=(p,t)=>'<a class="text-link" href="#'+p+'">'+esc(t)+' ↗</a>';
const art=e=>'<div class="exercise-art motion-'+esc(e.motion)+'" role="img" aria-label="Ilustración animada orientativa de '+esc(e.name)+'"><svg viewBox="0 0 180 110" aria-hidden="true"><ellipse class="ground" cx="90" cy="99" rx="62" ry="4"/><g class="body-figure"><circle class="head" cx="90" cy="25" r="11"/><path class="torso" d="M89 40 L89 69"/><path class="arm arm-left" d="M89 45 L67 63 L58 48"/><path class="arm arm-right" d="M89 45 L110 63 L121 49"/><path class="leg leg-left" d="M89 69 L70 91 L59 95"/><path class="leg leg-right" d="M89 69 L107 91 L119 95"/><path class="weight" d="M50 45h17m-15-8v16m13-16v16M114 45h17m-15-8v16m13-16v16"/></g></svg><span class="art-caption">GUÍA VISUAL · ILUSTRACIÓN</span></div>';
const preview=e=>'<span>'+esc(ex(e.exercise_id)?.name||'Ejercicio')+'</span>';
function render(){
 let page=location.hash.slice(1)||'inicio';if(!pages.includes(page))page='inicio';
 document.querySelectorAll('.page').forEach(x=>x.hidden=x.id!=='page-'+page);
 document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('active',x.dataset.nav===page));
 document.body.classList.remove('menu-open');$('#menu-toggle').setAttribute('aria-expanded','false');
 $('#section-name').textContent=labels[pages.indexOf(page)];
 $('#mode-badge').textContent=!connected?'DEMO':user?'CONECTADO':'SIN SESIÓN';
 $('#connection-label').textContent=!connected?'Modo demostración':user?'Tus datos están sincronizados':'Iniciá sesión para guardar';
 $('#account-button').textContent=user?'Mi cuenta':connected?'Iniciar sesión':'Modo demo';
 const fn={inicio:home,rutinas:routinePage,entrenar:trainingPage,ejercicios:exercisePage,progreso:progressPage,nutricion:nutritionPage,comunidad:socialPage}[page];
 $('#page-'+page).innerHTML=fn();
}
function home(){
 const weekly=sessions.filter(s=>{let d=new Date(iso()+'T12:00:00');d.setDate(d.getDate()-6);return new Date(s.workout_date+'T12:00:00')>=d}).length;
 const latest=[...sessions].sort((a,b)=>b.workout_date.localeCompare(a.workout_date));
 return heading('TU PANEL','¡A movernos!','Entrená con constancia, registrá tus logros y disfrutá el proceso.')
 +'<section class="hero"><div><p class="hero-label">TU PROGRESO EMPIEZA HOY</p><h2>Una repetición más.<br><em>Un paso adelante.</em></h2><p>Rutinas, registro rápido y evolución en un solo lugar.</p><a href="#entrenar" class="primary button-link">Empezar entrenamiento ↗</a></div><div class="hero-visual"><div class="hero-circle"><span>↗</span><b>KEEP<br>MOVING</b></div></div></section>'
 +'<div class="stats"><article class="stat"><span>ENTRENAMIENTOS · 7 DÍAS</span><strong>'+weekly+'</strong><small>Constancia</small></article><article class="stat"><span>SERIES REGISTRADAS</span><strong>'+sets.length+'</strong><small>Desde que empezaste</small></article><article class="stat"><span>ÚLTIMA SESIÓN</span><strong>'+(latest[0]?fmt(latest[0].workout_date):'—')+'</strong><small>'+(latest[0]?esc(latest[0].routine_name):'Sin sesiones')+'</small></article></div>'
 +'<div class="split"><section class="panel"><div class="panel-title"><h2>Tus rutinas</h2>'+link('rutinas','Ver todas')+'</div>'+(plans.length?plans.slice(0,3).map(r=>'<div class="simple-row"><div class="row-icon">▦</div><div><b>'+esc(r.name)+'</b><small>'+esc(r.focus)+' · '+(r.items?.length||0)+' ejercicios</small></div>'+button('pick-plan','Entrenar',r.id,'small primary')+'</div>').join(''):'<p class="empty compact">Creá tu primera rutina en el generador.</p>')+'<a href="#rutinas" class="outline button-link full">+ Crear rutina</a></section>'
 +'<section class="panel"><div class="panel-title"><h2>Actividad reciente</h2>'+link('progreso','Ver progreso')+'</div>'+(latest.length?latest.slice(0,3).map(s=>'<div class="simple-row"><div class="row-icon">✓</div><div><b>'+esc(s.routine_name)+'</b><small>'+fmt(s.workout_date)+' · '+sets.filter(x=>x.session_id===s.id).length+' series</small></div></div>').join(''):'<div class="empty compact">Registrá tu primer entrenamiento.</div>')+'<div class="hint">Priorizá la técnica, el descanso y la progresión gradual.</div></section></div>';
}
function routinePage(){
 return heading('PLANIFICÁ','Generador de rutinas','Creá planes de 2, 3 o 4 días con ejercicios del catálogo.')
 +'<section class="panel"><h2>Crear rutina</h2><form id="generator-form" class="form-grid"><label>Nombre del plan<input name="name" value="Mi plan semanal" maxlength="55" required></label><label>Días por semana<select name="days"><option value="2">2 días</option><option value="3" selected>3 días</option><option value="4">4 días</option></select></label><label>Objetivo<select name="focus"><option>General</option><option>Fuerza</option><option>Movilidad</option></select></label><label>Experiencia<select name="level"><option>Inicial</option><option>Intermedio</option></select></label><button class="primary" type="submit">Generar mi plan ↗</button></form><p class="muted fine">Rutina orientativa: adaptala a tu capacidad, incluí descansos y pedí orientación de técnica.</p></section>'
 +'<div class="panel-title"><h2>Mis rutinas · '+plans.length+'</h2></div><div class="cards-grid">'+(plans.length?plans.map(r=>'<article class="routine-card"><div class="routine-top">'+tag(r.focus,true)+'<span class="muted">'+r.days+' días</span></div><h3>'+esc(r.name)+'</h3><p>'+r.items.length+' ejercicios · '+esc(r.level)+'</p><div class="routine-preview">'+r.items.slice(0,5).map(preview).join('')+'</div><div class="flex">'+button('pick-plan','Entrenar',r.id,'primary')+button('remove-plan','Eliminar',r.id)+'</div></article>').join(''):'<div class="empty">Todavía no tenés rutinas.</div>')+'</div>';
}
function exercisePage(){
 const muscles=['Todos',...new Set(exercises.map(x=>x.muscle))];
 const visible=exercises.filter(e=>(muscle==='Todos'||e.muscle===muscle)&&[e.name,e.muscle,e.equipment].join(' ').toLowerCase().includes(query));
 return heading('TÉCNICA','Biblioteca de ejercicios','Guías animadas orientativas. Consultá videos confiables para aprender la técnica.')
 +'<section class="panel filters"><label>Buscar<input id="exercise-search" type="search" value="'+esc(query)+'" placeholder="Sentadilla, bíceps…"></label><label>Grupo muscular<select id="muscle-filter">'+muscles.map(x=>'<option '+(muscle===x?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></label></section>'
 +'<div class="exercise-grid">'+visible.map(e=>'<article class="exercise-card">'+art(e)+'<div class="exercise-card-body">'+tag(e.muscle)+'<h3>'+esc(e.name)+'</h3><p>'+esc(e.equipment)+' · '+esc(e.level)+'</p><small>'+esc(e.cue)+'</small><div class="card-actions"><a class="text-link" href="https://www.youtube.com/results?search_query='+encodeURIComponent('técnica '+e.name+' ejercicio')+'" target="_blank" rel="noopener noreferrer">Buscar video ↗</a></div></div></article>').join('')+'</div>';
}
function trainingPage(){
 const plan=plans.find(p=>p.id===selectedPlan)||plans[0],session=sessions.find(s=>s.id===selectedSession)||sessions.find(s=>s.workout_date===iso());
 if(!plan)return heading('ENTRENAR','Registrar entrenamiento','Los kilos y repeticiones son privados.')+'<section class="panel"><div class="empty"><h2>Primero generá una rutina</h2><a class="primary button-link" href="#rutinas">Ir a rutinas</a></div></section>';
 const selector='<label class="select-label">Rutina activa<select id="training-plan">'+plans.map(p=>'<option value="'+esc(p.id)+'" '+(p.id===plan.id?'selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select></label>';
 return heading('HOY ES TU DÍA','Registrar entrenamiento','Anotá peso y repeticiones durante tu descanso, serie por serie.')
 +'<section class="panel"><div class="panel-title"><h2>'+esc(plan.name)+'</h2>'+selector+'</div>'+(session?'<div class="hint">Sesión del '+fmt(session.workout_date)+' activa · '+sets.filter(s=>s.session_id===session.id).length+' series registradas</div>':button('start-session','Iniciar sesión de hoy',plan.id,'primary'))+'</section>'
 +'<div class="training-list">'+plan.items.map(item=>{let e=ex(item.exercise_id);if(!e)return '';let prev=sets.filter(s=>s.session_id===session?.id&&s.exercise_id===id(e));return '<section class="panel"><div class="train-head">'+art(e)+'<div><h3>'+esc(e.name)+'</h3><small>'+esc(e.muscle)+' · '+item.sets+' series de '+esc(item.reps)+'</small></div></div><div class="set-head"><span>SET</span><span>PESO (KG)</span><span>REPS</span><span>GUARDAR</span></div>'+prev.map(s=>'<div class="set-row"><b>'+s.set_number+'</b><span>'+s.weight_kg+' kg</span><span>'+s.reps+' reps</span><span>✓</span></div>').join('')+'<form class="set-row save-set-form" data-ex="'+esc(id(e))+'"><b>'+Math.min(prev.length+1,100)+'</b><input type="number" name="kg" inputmode="decimal" min="0" max="1000" step=".25" required value="0" aria-label="Peso en kilos"><input type="number" name="reps" inputmode="numeric" min="1" max="100" required value="10" aria-label="Repeticiones"><button class="primary small" '+(!session?'disabled':'')+' type="submit">Guardar</button></form></section>'}).join('')+'</div>';
}
function progressPage(){
 const counts=Array.from({length:7},(_,i)=>{let d=new Date(iso()+'T12:00:00');d.setDate(d.getDate()-(6-i));const s=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');return {date:s,n:sessions.filter(x=>x.workout_date===s).length}});
 const recent=[...sets].sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||'')).slice(0,12);
 return heading('TU EVOLUCIÓN','Mi progreso','El historial es privado y el avance no se compara con el cuerpo de otras personas.')
 +'<div class="stats"><article class="stat"><span>DÍAS ENTRENADOS</span><strong>'+sessions.length+'</strong></article><article class="stat"><span>SERIES REGISTRADAS</span><strong>'+sets.length+'</strong></article><article class="stat"><span>EJERCICIOS PRACTICADOS</span><strong>'+new Set(sets.map(s=>s.exercise_id)).size+'</strong></article></div>'
 +'<section class="panel"><h2>Últimos 7 días</h2><div class="bars">'+counts.map(c=>'<div class="bar-col"><div class="bar-track"><div class="bar" style="height:'+(c.n?90:2)+'%"></div></div><span>'+fmt(c.date)+'</span></div>').join('')+'</div><p class="muted fine">Un día de descanso también suma al progreso.</p></section>'
 +'<section class="panel"><h2>Últimas series</h2>'+(recent.length?recent.map(s=>'<div class="simple-row"><div class="row-icon">↗</div><div><b>'+esc(ex(s.exercise_id)?.name||'Ejercicio')+'</b><small>'+fmt(sessions.find(x=>x.id===s.session_id)?.workout_date||iso())+'</small></div><strong>'+s.weight_kg+' kg · '+s.reps+' reps</strong></div>').join(''):'<div class="empty compact">Todavía no hay registros.</div>')+'</section>';
}
function nutritionPage(){
 return heading('BIENESTAR','Nutrición e IMC','Hábitos para sentirte bien y entrenar mejor. No es una dieta médica ni un objetivo de peso.')
 +'<section class="panel"><h2>Comer variado, descansar y tomar agua</h2><p class="muted">No necesitás contar calorías para comenzar a moverte. Comé suficiente, adaptá tus comidas a tus necesidades, alergias y preferencias.</p></section>'
 +'<div class="cards-grid">'+window.PULSO_FOOD.map(f=>'<article class="food-card"><div class="food-symbol">'+f.icon+'</div><h3>'+esc(f.name)+'</h3><p>'+esc(f.examples)+'</p></article>').join('')+'</div>'
 +'<div class="split"><section class="panel"><h2>Calculadora de IMC (adultos)</h2><p class="muted fine">El IMC es una estimación limitada, no mide la salud ni la fuerza. Para menores de 20 años no corresponde interpretar el resultado con categorías de adultos.</p><form id="bmi-form" class="form-grid"><label>Edad<input name="age" type="number" min="1" max="120" required></label><label>Estatura (cm)<input name="height" type="number" min="80" max="250" required></label><label>Peso (kg)<input name="weight" type="number" min="15" max="350" step=".1" required></label><button class="primary" type="submit">Calcular</button></form><div id="bmi-result" class="bmi-result" role="status">Tus medidas solo se usan para el cálculo en pantalla y no se guardan.</div></section>'
 +'<section class="panel"><h2>Hábitos sostenibles</h2><ul class="habit-list"><li>✓ Comé alimentos variados.</li><li>✓ Hidratate según tu actividad y clima.</li><li>✓ Dormí y recuperate.</li><li>✓ Entrená con progresión y buena técnica.</li><li>✓ Ante dudas de alimentación o crecimiento, consultá a un profesional.</li></ul></section></div>';
}
function socialPage(){
 const badges=[['✦','Primer paso',1],['✹','En movimiento',5],['★','Constancia',10],['◆','Gran recorrido',20]];
 return heading('JUNTOS','Comunidad y logros','Ranking voluntario por días entrenados; nunca se publican cargas, peso corporal ni IMC.')
 +'<div class="split"><section class="panel"><h2>Ranking mensual</h2>'+(connected?(user?(leaders.length?leaders.map((r,i)=>'<div class="simple-row"><span class="rank">'+(i+1)+'</span><div><b>'+esc(r.profiles?.alias||'Atleta')+'</b><small>'+r.days_count+' día(s) este mes</small></div></div>').join(''):'<p class="empty compact">Todavía no hay participantes que compartan su constancia.</p>'):'<p class="empty compact">Iniciá sesión para ver el ranking voluntario.</p>'):'<p class="empty compact">El ranking real estará disponible cuando conectes Supabase.</p>')+'</section>'
 +'<section class="panel"><h2>Tu perfil social</h2>'+(connected&&user?'<form id="profile-form" class="profile-form"><label>Apodo<input name="alias" minlength="3" maxlength="32" required value="'+esc(profile?.alias||'')+'"></label><label class="checkbox"><input type="checkbox" name="share" '+(profile?.share_opt_in?'checked':'')+'>Quiero aparecer en el ranking de días entrenados. Puedo desactivarlo cuando quiera.</label><button type="submit" class="primary">Guardar preferencias</button></form>':'<p class="empty compact">El perfil y el ranking se activan al iniciar sesión en Supabase.</p>')+'</section></div><section class="panel"><h2>Medallas personales</h2><div class="badges">'+badges.map(b=>'<div class="achievement '+(sessions.length>=b[2]?'unlocked':'locked')+'"><div>'+b[0]+'</div><b>'+b[1]+'</b><small>'+b[2]+' día(s)</small></div>').join('')+'</div></section>';
}
async function load(){
 if(!connected){try{let d=JSON.parse(localStorage.getItem(demoKey)||'{}');plans=d.plans||[];sessions=d.sessions||[];sets=d.sets||[]}catch{}return}
 // El catálogo es público. Los registros solo se piden con sesión autenticada.
 const catalog=await db.from('exercises').select('*').order('name');
 if(catalog.error)throw catalog.error;exercises=catalog.data||exercises;
 if(!user){plans=[];sessions=[];sets=[];profile=null;leaders=[];return}
 const rs=await Promise.all([db.from('routine_plans').select('*,routine_exercises(*)').order('created_at',{ascending:false}),db.from('workout_sessions').select('*').order('workout_date',{ascending:false}).limit(250),db.from('profiles').select('user_id,alias,share_opt_in').eq('user_id',user.id).maybeSingle(),db.from('leaderboard_entries').select('user_id,month_start,days_count,profiles!inner(alias,share_opt_in)').eq('month_start',month()).order('days_count',{ascending:false}).limit(30)]);
 for(const r of rs)if(r.error)throw r.error;
 plans=(rs[0].data||[]).map(p=>({...p,items:(p.routine_exercises||[]).sort((a,b)=>a.sort_order-b.sort_order)}));
 sessions=rs[1].data||[];profile=rs[2].data;leaders=rs[3].data||[];
 if(!profile){let r=await db.from('profiles').insert({user_id:user.id,alias:'Atleta-'+user.id.slice(0,8)}).select().single();if(r.error)throw r.error;profile=r.data}
 sets=[];if(sessions.length){const r=await db.from('workout_sets').select('*').in('session_id',sessions.map(s=>s.id));if(r.error)throw r.error;sets=r.data||[]}
}
async function refresh(){try{await load();render()}catch(e){console.error(e);notice(e.message||'No se pudieron cargar los datos',true)}}
function generated(name,days,focus,level){
 const template={2:[['Piernas','Pecho','Espalda','Core','Hombros'],['Glúteos','Piernas','Espalda','Core','Pecho']],3:[['Pecho','Hombros','Tríceps','Core'],['Espalda','Bíceps','Core'],['Piernas','Glúteos','Core']],4:[['Pecho','Espalda','Hombros','Core'],['Piernas','Glúteos','Core'],['Espalda','Bíceps','Tríceps','Core'],['Piernas','Glúteos','Core']]};
 let eligible=exercises.filter(e=>level==='Intermedio'||e.level==='Inicial');
 return template[days].map((groups,i)=>{let items=[];for(let m of groups){const e=eligible.find(x=>x.muscle===m&&!items.some(y=>y.exercise_id===id(x)));if(e)items.push({exercise_id:id(e),sets:focus==='Movilidad'?2:3,reps:e.reps})}for(let e of eligible){if(items.length>=5)break;if(!items.some(y=>y.exercise_id===id(e)))items.push({exercise_id:id(e),sets:2,reps:e.reps})}return{id:uid(),name:name+' · Día '+(i+1),days,level,focus,items}});
}
async function addPlan(p){
 if(connected){
  if(!user)throw Error('Iniciá sesión para guardar rutinas');
  const x=await db.from('routine_plans').insert({user_id:user.id,name:p.name,days:p.days,focus:p.focus,level:p.level}).select().single();
  if(x.error)throw x.error;
  let items=p.items.map((a,i)=>({...a,plan_id:x.data.id,sort_order:i}));
  const y=await db.from('routine_exercises').insert(items);if(y.error){await db.from('routine_plans').delete().eq('id',x.data.id);throw y.error}
 }else{plans.unshift(p);persist()}await refresh();
}
async function startSession(){
 if(connected&&!user)throw Error('Iniciá sesión para registrar entrenamientos');
 const p=plans.find(r=>r.id===selectedPlan)||plans[0];if(!p)throw Error('Primero creá una rutina');
 const existing=sessions.find(s=>s.workout_date===iso());
 if(existing){selectedSession=existing.id;render();notice('Continuamos la sesión de hoy');return}
 const s={id:uid(),workout_date:iso(),routine_name:p.name,user_id:user?.id||'demo'};
 if(connected){const r=await db.from('workout_sessions').insert({workout_date:s.workout_date,routine_name:s.routine_name,user_id:user.id}).select().single();if(r.error)throw r.error;selectedSession=r.data.id}
 else{sessions.unshift(s);selectedSession=s.id;persist()}await refresh();notice('Sesión iniciada');
}
async function addSet(form){
 const session=sessions.find(s=>s.id===selectedSession)||sessions.find(s=>s.workout_date===iso());
 if(!session)throw Error('Primero iniciá la sesión');
 const exercise_id=form.dataset.ex,weight_kg=Number(form.elements.kg.value),reps=Number(form.elements.reps.value);
 if(!Number.isFinite(weight_kg)||weight_kg<0||weight_kg>1000||!Number.isInteger(reps)||reps<1||reps>100)throw Error('Revisá el peso y las repeticiones');
 const prior=sets.filter(x=>x.session_id===session.id&&x.exercise_id===exercise_id);
 const item={session_id:session.id,exercise_id,set_number:prior.length+1,reps,weight_kg};
 if(connected){const r=await db.from('workout_sets').insert(item);if(r.error)throw r.error}
 else{sets.push({...item,id:uid(),created_at:new Date().toISOString()});persist()}
 await refresh();notice('Serie guardada ✓');
}
async function removePlan(key){
 if(connected){const r=await db.from('routine_plans').delete().eq('id',key);if(r.error)throw r.error}
 else{plans=plans.filter(p=>p.id!==key);persist()}if(selectedPlan===key)selectedPlan='';await refresh();
}
async function saveProfile(form){
 if(!connected||!user)throw Error('Iniciá sesión');
 const alias=form.elements.alias.value.trim(),share_opt_in=form.elements.share.checked;
 if(alias.length<3||alias.length>32)throw Error('El apodo debe tener entre 3 y 32 caracteres');
 const r=await db.from('profiles').update({alias,share_opt_in}).eq('user_id',user.id);
 if(r.error)throw r.error;await refresh();notice('Preferencias guardadas');
}
document.addEventListener('submit',async ev=>{
 const f=ev.target;if(!['generator-form','save-set-form','bmi-form','profile-form','auth-form'].includes(f.id)&&!f.classList.contains('save-set-form'))return;
 ev.preventDefault();
 try{
 if(f.id==='generator-form'){if(connected&&!user)throw Error('Iniciá sesión para generar y guardar rutinas');const x=new FormData(f);for(const p of generated(String(x.get('name')).trim(),Number(x.get('days')),x.get('focus'),x.get('level')))await addPlan(p);location.hash='#rutinas';notice('Rutinas creadas')}
 else if(f.classList.contains('save-set-form'))await addSet(f);
 else if(f.id==='profile-form')await saveProfile(f);
 else if(f.id==='bmi-form'){let x=new FormData(f),age=Number(x.get('age')),height=Number(x.get('height'))/100,weight=Number(x.get('weight'));$('#bmi-result').textContent=age<20?'Para menores de 20 años no se interpreta el IMC con categorías de adultos. Consultá a un profesional para una evaluación adecuada a la edad.':'IMC estimado: '+(weight/(height*height)).toFixed(1)+'. Es solo un indicador general y no describe tu salud, fuerza ni composición corporal.'}
 else if(f.id==='auth-form'){if(!connected)return;const email=$('#auth-email').value.trim(),password=$('#auth-password').value;const r=await db.auth.signInWithPassword({email,password});if(r.error)throw r.error;$('#auth-dialog').close();notice('Sesión iniciada')}
 }catch(e){notice(e.message||'No se pudo completar la acción',true)}
});
document.addEventListener('click',async ev=>{
 const b=ev.target.closest('[data-action]');if(!b)return;
 try{
  const action=b.dataset.action,key=b.dataset.id;
  if(action==='pick-plan'){selectedPlan=key;selectedSession='';location.hash='#entrenar';render()}
  if(action==='start-session')await startSession();
  if(action==='remove-plan'){if(confirm('¿Eliminar esta rutina?'))await removePlan(key)}
 }catch(e){notice(e.message||'Error al guardar',true)}
});
$('#signup-btn').addEventListener('click',async()=>{
 if(!connected)return;const email=$('#auth-email').value.trim(),password=$('#auth-password').value;
 if(!email||password.length<6){$('#auth-feedback').textContent='Ingresá un correo y contraseña de al menos 6 caracteres.';return}
 const r=await db.auth.signUp({email,password});$('#auth-feedback').textContent=r.error?r.error.message:'Revisá tu correo para confirmar la cuenta (si está habilitado).';
});
$('#account-button').addEventListener('click',async()=>{
 if(!connected){notice('Modo demo. Podés probar la app sin cuenta.');return}
 if(user){if(confirm('¿Cerrar sesión?')){const r=await db.auth.signOut();if(r.error)notice(r.error.message,true)}}
 else $('#auth-dialog').showModal()
});
$('#menu-toggle').addEventListener('click',()=>{let open=document.body.classList.toggle('menu-open');$('#menu-toggle').setAttribute('aria-expanded',String(open))});
document.addEventListener('input',ev=>{if(ev.target.id==='exercise-search'){query=ev.target.value.toLowerCase();let pos=ev.target.selectionStart;let page=$('#page-ejercicios');page.innerHTML=exercisePage();let el=$('#exercise-search');el.focus();el.setSelectionRange(pos,pos)}});
document.addEventListener('change',ev=>{if(ev.target.id==='muscle-filter'){muscle=ev.target.value;$('#page-ejercicios').innerHTML=exercisePage()}if(ev.target.id==='training-plan'){selectedPlan=ev.target.value;render()}});
window.addEventListener('hashchange',render);
(async()=>{try{
 if(connected){const r=await db.auth.getSession();if(r.error)throw r.error;user=r.data.session?.user||null;db.auth.onAuthStateChange((evt,session)=>{user=session?.user||null;setTimeout(refresh,0)})}
 await refresh();
}catch(e){console.error(e);notice('No se pudo iniciar: '+e.message,true);render()}})();
})();