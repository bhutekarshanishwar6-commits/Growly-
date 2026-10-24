const STORAGE_KEY = "growlyDataV1";
const quotes = [
"Small steps build big tomorrows.","Progress grows from consistency.","Every day is a new chance to grow.",
"Your effort today becomes your strength tomorrow.","Keep planting. Keep growing.","Consistency turns small actions into big changes.",
"Grow at your own pace.","One small action can change your entire day.","Your garden grows when you do.",
"Progress doesn't need to be perfect.","Keep showing up for yourself.","Every completed day is another flower.",
"Your future self is built by today's actions.","Little progress is still progress.","Stay consistent. Let the results bloom.",
"Start where you are. Grow from there.","Your habits are seeds. Your future is the garden.","Don't rush the growth. Enjoy the journey.",
"Every effort counts.","Keep going — you're growing.","Today's discipline becomes tomorrow's confidence.",
"Plant the habit. Grow the result.","Your consistency is creating something beautiful.","Better every day, not perfect every day.",
"Small actions create meaningful change.","Your garden reflects the care you give yourself.","Keep watering your goals.",
"Growth takes time, but every step matters.","Make today count.","Another day. Another opportunity to grow."
];
const icons = {Study:"📚",Coding:"💻",Fitness:"💪",Reading:"📖",Mindfulness:"🧘",Personal:"🌱",Custom:"🌼"};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let data = loadData();
let activeFilter = "All";
let currentGardenId = null;

function uid(){return "g_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7)}
function isoToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function dateObj(iso){const [y,m,d]=iso.split("-").map(Number);return new Date(y,m-1,d)}
function daysBetween(a,b){return Math.round((dateObj(b)-dateObj(a))/86400000)}
function seededDayNumber(){const d=new Date();return Math.floor(new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime()/86400000)}
function defaultGardens(){
  const today=isoToday();
  const make=(name,description,category,completed,streak)=>({
    id:uid(),name,description,category,duration:31,startDate:formatISO(new Date(Date.now()-completed*86400000)),
    completedDates:buildDemoDates(completed),completedDays:completed,streak,longestStreak:streak,growthLevel:calculateGrowthLevel(Math.round(completed/31*100)),
    flowers:completed,dailyTarget:"1 action",status:completed>=31?"completed":"active"
  });
  return [make("Workout Garden","A stronger me, one day at a time.","Fitness",12,5),make("Coding Garden","Build. Learn. Grow.","Coding",8,3),make("Reading Garden","A calmer, wiser me.","Reading",18,7),make("Mindfulness Garden","Be present. Be better.","Mindfulness",5,2)];
}
function buildDemoDates(n){const out=[];const today=new Date();for(let i=n;i>0;i--){const d=new Date(today);d.setDate(today.getDate()-i);if(i%6!==0)out.push(formatISO(d))}return out.slice(-n)}
function formatISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function loadData(){
  try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const d=JSON.parse(raw);d.gardens=(d.gardens||[]).map(normalizeGarden);d.profile={name:d.name||"",age:"",gender:"",address:"",work:"",email:"",phone:"",about:"",...(d.profile||{})};d.reminder={enabled:false,time:"19:00",lastNotified:"",...(d.reminder||{})};return d}}
  catch(e){}
  const fresh={name:"",profile:{name:"",age:"",gender:"",address:"",work:"",email:"",phone:"",about:""},theme:"light",reduceMotion:false,reminder:{enabled:false,time:"19:00",lastNotified:""},gardens:defaultGardens(),activeGardenId:null};
  fresh.activeGardenId=fresh.gardens[0]?.id||null;saveData(fresh);return fresh;
}
function normalizeGarden(g){return {...g,completedDates:Array.isArray(g.completedDates)?[...new Set(g.completedDates)].sort():[],completedDays:undefined,status:undefined,flowers:undefined}}
function saveData(d=data){localStorage.setItem(STORAGE_KEY,JSON.stringify(d))}
function hydrateGarden(g){
  g.completedDates=[...new Set(g.completedDates||[])].sort();
  g.completedDays=g.completedDates.length;
  g.streak=calculateStreak(g.completedDates);
  g.longestStreak=calculateLongestStreak(g.completedDates);
  g.status=g.completedDays>=g.duration?"completed":"active";
  g.growthLevel=calculateGrowthLevel(calculateProgress(g));
  g.flowers=g.completedDays;
  return g;
}
function calculateProgress(g){return Math.min(100,Math.round((g.completedDays/g.duration)*100))}
function calculateGrowthLevel(p){if(p>=100)return"Full Garden";if(p>=85)return"Beautiful Garden";if(p>=70)return"Flowering Plant";if(p>=50)return"Growing Plant";if(p>=30)return"Small Plant";if(p>=15)return"Sprout";return"Seed"}
function calculateStreak(dates){
  if(!dates.length)return 0;const set=new Set(dates), today=isoToday();let cursor=today, count=0;
  if(!set.has(cursor)){const y=new Date();y.setDate(y.getDate()-1);cursor=formatISO(y);if(!set.has(cursor))return 0}
  while(set.has(cursor)){count++;const d=dateObj(cursor);d.setDate(d.getDate()-1);cursor=formatISO(d)}return count;
}
function calculateLongestStreak(dates){
  if(!dates.length)return 0;const s=[...new Set(dates)].sort();let longest=1,current=1;
  for(let i=1;i<s.length;i++){if(daysBetween(s[i-1],s[i])===1)current++;else current=1;longest=Math.max(longest,current)}return longest;
}
function pointsForGarden(g){const bonus7=g.longestStreak>=7?25:0,bonus14=g.longestStreak>=14?50:0,bonus30=g.completedDays>=30?100:0;return g.completedDays*10+bonus7+bonus14+bonus30}
function totalStats(){data.gardens.forEach(hydrateGarden);const totalDays=data.gardens.reduce((a,g)=>a+g.completedDays,0);const totalPossible=data.gardens.reduce((a,g)=>a+g.duration,0);return{totalGoals:data.gardens.length,active:data.gardens.filter(g=>g.status==="active").length,completedDays:totalDays,currentStreak:Math.max(0,...data.gardens.map(g=>g.streak)),longestStreak:Math.max(0,...data.gardens.map(g=>g.longestStreak)),flowers:data.gardens.reduce((a,g)=>a+g.flowers,0),points:data.gardens.reduce((a,g)=>a+pointsForGarden(g),0),percent:totalPossible?Math.round(totalDays/totalPossible*100):0}}
function timePeriod(){const h=new Date().getHours();if(h>=5&&h<12)return"morning";if(h>=12&&h<17)return"afternoon";if(h>=17&&h<21)return"evening";return"night"}
function updateDynamicHeader(){
  const p=timePeriod(), name=data.name||"Grower", g=getActiveGarden(), done=g?.completedDates?.includes(isoToday());
  const greeting={morning:`Good morning, ${name} 🌿`,afternoon:`Good afternoon, ${name} 🌿`,evening:`Good evening, ${name} 🌿`,night:`Good night, ${name} 🌙`}[p];
  const normal={morning:"Start small today — your future self will thank you.",afternoon:"Keep going — every small action is helping you grow.",evening:"Another day, another step toward a better you.",night:"Rest well — tomorrow is another chance to grow."}[p];
  const doneText={morning:`Good morning, ${name} 🌿 You’re already growing today.`,afternoon:`Good afternoon, ${name} 🌿 Keep your momentum going.`,evening:`Good evening, ${name} 🌿 One more small step.`,night:`Good night, ${name} 🌙 Rest and grow again tomorrow.`}[p];
  $("#greeting").textContent=greeting;$("#subtitle").textContent=done?doneText:normal;
  $("#currentDate").textContent=new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(new Date());
}
function updateDailyQuote(){const idx=Math.abs(seededDayNumber())%quotes.length;$("#dailyQuote").textContent=quotes[idx]}
function getActiveGarden(){return data.gardens.find(g=>g.id===data.activeGardenId)||data.gardens[0]}
function renderGardenVisual(el,g){
  if(!el)return;const p=calculateProgress(g), flowers=p>=70?Math.max(1,Math.min(5,Math.ceil(p/20))):p>=30?1:0;
  el.innerHTML=`<div class="garden-ground"></div><div class="stem" style="height:${Math.max(22,p*.48)}%"></div>
  <div class="leaf l1"></div><div class="leaf l2"></div><div class="leaf l3"></div>${flowers?`<div class="flower"><i></i><b></b></div>`:""}
  <span class="floating-leaf fl1">🍃</span><span class="floating-leaf fl2">🍃</span><span class="floating-leaf fl3">🍃</span>`;
}
function renderDashboard(){
  data.gardens.forEach(hydrateGarden);const g=getActiveGarden();
  if(!g){$("#activeGardenName").textContent="Your first garden is waiting";$("#activeGardenDesc").textContent="Plant a goal to begin growing.";$("#dashboardGardens").innerHTML=emptyGardenHTML();updateStats();return}
  const p=calculateProgress(g);$("#activeGardenName").textContent=g.name;$("#activeGardenDesc").textContent=g.description;
  $("#activeDay").textContent=g.completedDays;$("#activeDuration").textContent=g.duration;$("#activePercent").textContent=p+"%";
  $("#activeProgressBar").style.width=p+"%";$("#activeStreak").textContent=g.streak;$("#activeRemaining").textContent=Math.max(0,g.duration-g.completedDays);$("#activeFlowers").textContent=g.flowers;
  $("#completeBtn").disabled=g.completedDates.includes(isoToday());$("#completeBtn").textContent=g.completedDates.includes(isoToday())?"✓ Today's Flower Added":"🌼 Add Today's Flower";
  renderGardenVisual($("#activeGardenVisual"),g);$("#dashboardGardens").innerHTML=data.gardens.slice(0,4).map(gardenCardHTML).join("");updateStats();
}
function emptyGardenHTML(){return`<div class="card garden-mini" style="grid-column:1/-1;text-align:center;padding:35px"><div class="garden-icon" style="margin:0 auto 14px">🌱</div><h3>Your garden is waiting to be planted.</h3><p>Create your first goal and start growing.</p><button class="primary-btn" data-page="new">Create Your First Goal 🌱</button></div>`}
function gardenCardHTML(g){const p=calculateProgress(g);return`<article class="card garden-mini" data-open="${g.id}" tabindex="0"><div class="garden-icon">${icons[g.category]||"🌱"}</div><h3>${esc(g.name)}</h3><p>${esc(g.description)}</p><div class="mini-progress"><i style="width:${p}%"></i></div><div class="mini-foot"><span>${g.completedDays}/${g.duration} days</span><span>🔥 ${g.streak}</span></div></article>`}
function updateStats(){const s=totalStats();$("#totalGoals").textContent=s.totalGoals;$("#completedDays").textContent=s.completedDays;$("#currentStreak").textContent=s.currentStreak;$("#totalFlowers").textContent=s.flowers;$("#overallPercent").textContent=s.percent+"%"}
function renderGardens(){
  const list=data.gardens.filter(g=>activeFilter==="All"||g.status.toLowerCase()===activeFilter.toLowerCase()||g.category===activeFilter);
  $("#allGardens").innerHTML=list.length?list.map(g=>{const p=calculateProgress(g);return`<article class="card garden-large"><div class="large-top"><div class="garden-icon">${icons[g.category]||"🌱"}</div><div><h3>${esc(g.name)}</h3><p>${esc(g.description)}</p></div></div><div class="large-meta"><span>${g.growthLevel}</span><b>${p}%</b></div><div class="mini-progress"><i style="width:${p}%"></i></div><div class="mini-foot"><span>🔥 ${g.streak} streak</span><span>🌼 ${g.flowers} flowers</span></div><div class="garden-actions"><button data-detail="${g.id}">Open</button><button data-edit="${g.id}">Edit</button><button data-reset="${g.id}">Reset</button><button data-delete="${g.id}">Delete</button></div></article>`}).join(""):`<div class="card" style="grid-column:1/-1;padding:40px;text-align:center"><h2>No gardens here.</h2><p style="color:var(--muted)">Try another filter or plant a new goal.</p></div>`;
}
function renderProgress(){
  const s=totalStats();$("#metrics").innerHTML=[["Total Goals",s.totalGoals],["Active Gardens",s.active],["Completed Days",s.completedDays],["Current Streak",s.currentStreak],["Longest Streak",s.longestStreak],["Consistency",s.percent+"%"],["Total Flowers",s.flowers],["Improvement Points",s.points]].map(x=>`<div class="card metric"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("");
  const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(formatISO(d))}
  $("#weeklyChart").innerHTML=days.map(iso=>{const count=data.gardens.filter(g=>g.completedDates.includes(iso)).length;const h=Math.max(4,Math.round(count/Math.max(1,data.gardens.length)*100));return`<div class="bar-col"><div class="bar" style="height:${h}%"></div><span>${new Intl.DateTimeFormat(undefined,{weekday:"short"}).format(dateObj(iso)).slice(0,3)}</span></div>`}).join("");
  $("#donutValue").textContent=s.percent+"%";$("#donut").style.background=`conic-gradient(var(--green) 0 ${s.percent}%,var(--surface-2) ${s.percent}% 100%)`;$("#donutLegend").innerHTML=data.gardens.slice(0,5).map(g=>`<div><i></i>${esc(g.name)} · ${calculateProgress(g)}%</div>`).join("");
  $("#goalBars").innerHTML=data.gardens.map(g=>`<div class="goal-line"><span>${esc(g.name)}</span><div class="progress-track"><span style="width:${calculateProgress(g)}%"></span></div><b>${calculateProgress(g)}%</b></div>`).join("")||"<p style='color:var(--muted)'>Plant a goal to see analytics.</p>";
  renderLineChart();
}
function renderLineChart(){const w=500,h=190,pad=15;const vals=[10,20,18,32,35,42,46,50,55,61,65,70].map((v,i)=>Math.min(100,v+(data.gardens.length*2)));const pts=vals.map((v,i)=>`${pad+i*(w-2*pad)/(vals.length-1)},${h-pad-v*(h-2*pad)/100}`).join(" ");$("#monthlyChart").innerHTML=`<svg class="line-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="var(--green)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${pts} ${w-pad},${h-pad} ${pad},${h-pad}" fill="var(--green)" opacity=".08"/></svg>`}
function renderAll(){data.gardens.forEach(hydrateGarden);saveData();renderDashboard();renderGardens();renderProgress();updateDynamicHeader();updateDailyQuote();scheduleReminderCheck();$("#nameInput").value=data.name||"";$("#themeToggle").checked=data.theme==="dark";$("#motionToggle").checked=!!data.reduceMotion;applyTheme()}
function createGarden(values){
  const duration=Number(values.duration);const g={id:uid(),name:values.name.trim(),description:values.description.trim()||"Small actions, meaningful growth.",category:values.category,duration,startDate:isoToday(),completedDates:[],streak:0,longestStreak:0,growthLevel:"Seed",flowers:0,dailyTarget:values.dailyTarget.trim()||"1 action",status:"active"};
  data.gardens.push(g);data.activeGardenId=g.id;saveData();renderAll();closeModal();showToast("🌱 Goal planted successfully!");navigate("home");
}
function completeToday(id=getActiveGarden()?.id){
  const g=data.gardens.find(x=>x.id===id);if(!g)return;if(g.completedDates.includes(isoToday())){showToast("🌿 Today's action is already complete.");return}
  g.completedDates.push(isoToday());hydrateGarden(g);data.activeGardenId=g.id;saveData();renderAll();showToast(g.completedDays>=g.duration?"🌸 Your garden is blooming!":"🌼 Today's flower has been added!");animateGrowth();
  if([7,14,30].includes(g.streak))setTimeout(()=>showToast(`🔥 ${g.streak} day streak achieved!`),450);
}
function animateGrowth(){const el=$("#activeGardenVisual");if(el){el.animate([{transform:"scale(.98)"},{transform:"scale(1.02)"},{transform:"scale(1)"}],{duration:600,easing:"ease-out"})}}
function editGarden(id){const g=data.gardens.find(x=>x.id===id);if(!g)return;openModal(`<h2>Edit Garden</h2><p class="modal-sub">Update your garden details.</p><form id="editForm"><div class="form-grid"><div class="form-field full"><label>Goal Name</label><input name="name" required value="${attr(g.name)}"></div><div class="form-field full"><label>Description</label><textarea name="description" rows="3">${esc(g.description)}</textarea></div><div class="form-field"><label>Category</label><select name="category">${["Study","Coding","Fitness","Reading","Mindfulness","Personal","Custom"].map(c=>`<option ${c===g.category?"selected":""}>${c}</option>`).join("")}</select></div><div class="form-field"><label>Daily Target</label><input name="dailyTarget" value="${attr(g.dailyTarget)}"></div></div><div class="modal-actions"><button type="button" class="secondary-btn" data-close>Cancel</button><button class="primary-btn">Save Changes</button></div></form>`);$("#editForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);g.name=f.get("name").trim();g.description=f.get("description").trim();g.category=f.get("category");g.dailyTarget=f.get("dailyTarget").trim();saveData();renderAll();closeModal();showToast("Garden updated 🌿")}}
function openDetails(id){const g=data.gardens.find(x=>x.id===id);if(!g)return;data.activeGardenId=id;saveData();const p=calculateProgress(g);openModal(`<div class="detail-hero"><div class="detail-visual">${icons[g.category]||"🌱"}</div><div><span class="label">${esc(g.category)}</span><h2>${esc(g.name)}</h2><p class="modal-sub">${esc(g.description)}</p><div class="progress-track"><span style="width:${p}%"></span></div><small style="color:var(--muted)">${p}% · ${esc(g.growthLevel)}</small></div></div><div class="detail-stats"><div class="detail-stat"><b>${g.streak}</b><span>Current Streak</span></div><div class="detail-stat"><b>${g.longestStreak}</b><span>Longest Streak</span></div><div class="detail-stat"><b>${g.completedDays}</b><span>Completed Days</span></div><div class="detail-stat"><b>${Math.max(0,g.duration-g.completedDays)}</b><span>Remaining Days</span></div><div class="detail-stat"><b>${g.flowers}</b><span>Flowers Grown</span></div><div class="detail-stat"><b>${pointsForGarden(g)}</b><span>Improvement Points</span></div></div><h3 style="font-family:'Playfair Display',serif;margin:0">Habit Calendar</h3>${calendarHTML(g)}<div class="modal-actions"><button class="secondary-btn" data-edit="${g.id}">Edit Garden</button><button class="danger-btn" data-reset="${g.id}">Reset Progress</button><button class="danger-btn" data-delete="${g.id}">Delete</button><button class="primary-btn" data-complete="${g.id}">${g.completedDates.includes(isoToday())?"✓ Completed Today":"Complete Today's Action"}</button></div>`)}
function calendarHTML(g){const start=dateObj(g.startDate),end=new Date(start);end.setDate(end.getDate()+g.duration-1);const first=start.getDay();let cells=Array(first).fill('<div class="cal-day empty"></div>');for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const iso=formatISO(d);const today=iso===isoToday();const done=g.completedDates.includes(iso);cells.push(`<div class="cal-day ${done?"done":""} ${today?"today":""}" title="${done?"Action completed":"No action"}">${done?"🌱":d.getDate()}</div>`)}return`<div class="calendar">${["S","M","T","W","T","F","S"].map(x=>`<div class="day-name">${x}</div>`).join("")}${cells.join("")}</div>`}
function openCreateModal(){openModal(`<h2>Plant a New Goal 🌱</h2><p class="modal-sub">Choose one small action you want to nurture.</p><form id="createForm"><div class="form-grid"><div class="form-field full"><label>Goal Name</label><input name="name" required placeholder="e.g. Study Garden"></div><div class="form-field full"><label>Description</label><textarea name="description" rows="3" placeholder="What are you growing toward?"></textarea></div><div class="form-field"><label>Category</label><select name="category">${["Study","Coding","Fitness","Reading","Mindfulness","Personal","Custom"].map(x=>`<option>${x}</option>`).join("")}</select></div><div class="form-field"><label>Duration</label><select name="duration">${[7,21,30,31,60,90].map(x=>`<option value="${x}" ${x===31?"selected":""}>${x} days</option>`).join("")}</select></div><div class="form-field full"><label>Daily Target</label><input name="dailyTarget" placeholder="e.g. 30 minutes"></div></div><div class="modal-actions"><button type="button" class="secondary-btn" data-close>Cancel</button><button class="primary-btn">Plant My Goal 🌱</button></div></form>`);$("#createForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);createGarden(Object.fromEntries(f.entries()))}}
function confirmAction(type,id){const g=data.gardens.find(x=>x.id===id);if(!g)return;const text=type==="delete"?`Delete "${esc(g.name)}"? This cannot be undone.`:`Reset all progress for "${esc(g.name)}"? Your garden will return to a seed.`;openModal(`<h2>${type==="delete"?"Delete Garden":"Reset Progress"}</h2><p class="modal-sub">${text}</p><div class="modal-actions"><button class="secondary-btn" data-close>Cancel</button><button class="danger-btn" id="confirmDanger">${type==="delete"?"Delete Garden":"Reset Progress"}</button></div>`);$("#confirmDanger").onclick=()=>{if(type==="delete"){data.gardens=data.gardens.filter(x=>x.id!==id);if(data.activeGardenId===id)data.activeGardenId=data.gardens[0]?.id||null;showToast("Goal deleted successfully.")}else{g.completedDates=[];hydrateGarden(g);showToast("Progress reset 🌱")}saveData();renderAll();closeModal()}}
function openModal(html){$("#modalContent").innerHTML=html;$("#modalBackdrop").classList.remove("hidden")}
function closeModal(){$("#modalBackdrop").classList.add("hidden");$("#modalContent").innerHTML=""}
function showToast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;$("#toastContainer").appendChild(t);setTimeout(()=>{t.classList.add("out");setTimeout(()=>t.remove(),300)},2600)}
function navigate(page){$$(".page").forEach(p=>p.classList.add("hidden"));$(`#${page}Page`).classList.remove("hidden");$$(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.page===page));if(page==="gardens")renderGardens();if(page==="progress")renderProgress();if(page==="settings"){fillProfile();fillReminder();}window.scrollTo({top:0,behavior:"smooth"});$("#sidebar").classList.remove("open")}
function fillReminder(){
  const r=data.reminder||{enabled:false,time:"19:00",lastNotified:""};
  if($("#reminderTime"))$("#reminderTime").value=r.time||"19:00";
  if($("#reminderToggle"))$("#reminderToggle").checked=!!r.enabled;
  updateReminderStatus();
}
function updateReminderStatus(){
  const r=data.reminder||{};
  const el=$("#reminderStatus"); if(!el)return;
  el.textContent=r.enabled?`Daily reminder is set for ${formatReminderTime(r.time||"19:00")}. 🌱`:`Reminder is off.`;
}
function formatReminderTime(t){const [h,m]=String(t||"19:00").split(":").map(Number);const d=new Date();d.setHours(h||0,m||0);return d.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});}
function saveReminder(){
  const time=$("#reminderTime").value||"19:00";
  data.reminder={...(data.reminder||{}),time,enabled:$("#reminderToggle").checked,lastNotified:""};
  saveData();updateReminderStatus();
  if(data.reminder.enabled) requestNotificationPermission();
  showToast(data.reminder.enabled?`Reminder set for ${formatReminderTime(time)} 🔔`:`Daily reminder turned off.`);
}
async function requestNotificationPermission(){
  if(!("Notification" in window))return;
  if(Notification.permission==="default"){try{await Notification.requestPermission()}catch(e){}}
}
function showPlantReminder(manual=false){
  const g=getActiveGarden();
  const target=g?.dailyTarget||"today’s small action";
  showToast(`🌱 Time to plant your habit — ${target}.`);
  if("Notification" in window && Notification.permission==="granted"){
    try{new Notification("Growly — Time to grow 🌱",{body:`Complete ${target} and keep your plant growing!`,icon:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🌿%3C/text%3E%3C/svg%3E"})}catch(e){}
  }
}
function checkReminder(){
  const r=data.reminder; if(!r?.enabled||!r.time)return;
  const now=new Date(), hh=String(now.getHours()).padStart(2,"0"),mm=String(now.getMinutes()).padStart(2,"0"), today=isoToday();
  const g=getActiveGarden();
  if(g?.completedDates?.includes(today))return;
  if(`${hh}:${mm}`===r.time && r.lastNotified!==today){r.lastNotified=today;saveData();showPlantReminder();}
}
function scheduleReminderCheck(){setInterval(checkReminder,30000);checkReminder()}
function applyTheme(){document.body.classList.toggle("dark",data.theme==="dark");document.body.classList.toggle("reduce-motion",!!data.reduceMotion)}
function fillProfile(){
  const p=data.profile||{};
  if($("#nameInput"))$("#nameInput").value=p.name||data.name||"";
  if($("#ageInput"))$("#ageInput").value=p.age||"";
  if($("#genderInput"))$("#genderInput").value=p.gender||"";
  if($("#addressInput"))$("#addressInput").value=p.address||"";
  if($("#workInput"))$("#workInput").value=p.work||"";
  if($("#emailInput"))$("#emailInput").value=p.email||"";
  if($("#phoneInput"))$("#phoneInput").value=p.phone||"";
  if($("#aboutInput"))$("#aboutInput").value=p.about||"";
}
function saveProfile(){
  data.profile={...(data.profile||{}),name:$("#nameInput").value.trim(),age:$("#ageInput").value.trim(),gender:$("#genderInput").value,address:$("#addressInput").value.trim(),work:$("#workInput").value.trim(),email:$("#emailInput").value.trim(),phone:$("#phoneInput").value.trim(),about:$("#aboutInput").value.trim()};
  data.name=data.profile.name||"Grower";saveData();renderAll();fillProfile();showToast("Profile saved 🌿");
}
function saveName(){saveProfile()}

const AUTH_KEY="growlyAuthV1";
function getAuth(){try{return JSON.parse(localStorage.getItem(AUTH_KEY)||"null")}catch(e){return null}}
function setAuth(v){localStorage.setItem(AUTH_KEY,JSON.stringify(v))}
function showAuthPanel(which){
  $("#loginPanel").classList.toggle("hidden",which!=="login");
  $("#registerPanel").classList.toggle("hidden",which!=="register");
}
function startAuth(){
  $("#authOverlay").classList.remove("hidden");
  showAuthPanel("login");
}
function finishLogin(){
  $("#authOverlay").classList.add("hidden");
  fillProfile();
  if(!data.name && data.profile?.name)data.name=data.profile.name;
  renderAll();showWelcome();
}
function handleRegister(e){
  e.preventDefault();
  const name=$("#registerName").value.trim(),email=$("#registerEmail").value.trim().toLowerCase(),pass=$("#registerPass").value;
  if(pass.length<4){showToast("Password must be at least 4 characters.");return}
  setAuth({email,password:pass,name,createdAt:new Date().toISOString()});
  data.profile={...(data.profile||{}),name,email};data.name=name;saveData();
  $("#registerForm").reset();finishLogin();showToast("Account created. Welcome to Growly 🌱");
}
function handleLogin(e){
  e.preventDefault();const auth=getAuth();const user=$("#loginUser").value.trim().toLowerCase(),pass=$("#loginPass").value;
  if(!auth){showAuthPanel("register");showToast("Create your Growly account first.");return}
  if((user===String(auth.email).toLowerCase()||user===String(auth.name).toLowerCase())&&pass===auth.password){finishLogin();showToast("Welcome back 🌿")}
  else showToast("Login details do not match this device.");
}
function logout(){
  $("#authOverlay").classList.remove("hidden");$("#loginForm").reset();showAuthPanel("login");showToast("Logged out.");
}
function pdfEscape(s){return String(s??"").replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)").replace(/[^\x20-\x7E]/g,"")}
function pdfWrap(text,max=92){
  const words=String(text??"").split(/\s+/),lines=[];let line="";
  words.forEach(w=>{if(!w)return;const test=line?line+" "+w:w;if(test.length>max){if(line)lines.push(line);line=w}else line=test});if(line)lines.push(line);return lines;
}
function buildPDF(lines){
  const pageW=595,pageH=842,margin=48,leading=15,content=[];
  let page=[];
  const pushPage=()=>{content.push(page);page=[]};
  lines.forEach(item=>{
    const arr=pdfWrap(item.text,item.bold?78:92);
    arr.forEach((line,i)=>{if(page.length>=48)pushPage();page.push({text:line,bold:item.bold&&i===0,size:item.size||10})});
    if(item.space)page.push({text:"",size:6});
  });
  if(page.length)pushPage();
  const objs=[];
  objs.push("<< /Type /Catalog /Pages 2 0 R >>");
  const pageRefs=[];let next=3;
  content.forEach(()=>{pageRefs.push(next);next+=2});
  objs.push(`<< /Type /Pages /Kids [${pageRefs.map(n=>n+" 0 R").join(" ")}] /Count ${content.length} >>`);
  content.forEach((pg,idx)=>{
    const pageObj=next;next++;const streamObj=next;next++;
    const commands=["BT","/F1 20 Tf",`${margin} ${pageH-margin} Td`];
    pg.forEach((l,i)=>{
      if(i>0)commands.push(`0 -${leading} Td`);
      if(l.bold)commands.push("/F1 13 Tf"); else commands.push(`/F1 ${l.size} Tf`);
      commands.push(`(${pdfEscape(l.text)}) Tj`);
    });
    commands.push("ET");const stream=commands.join("\n");
    objs[pageObj-1]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 ${next} 0 R >> >> /Contents ${streamObj} 0 R >>`;
    objs[streamObj-1]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  const fontObj=next;objs[fontObj-1]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  let pdf="%PDF-1.4\n",offsets=[0];
  objs.forEach((o,i)=>{offsets[i+1]=pdf.length;pdf+=`${i+1} 0 obj\n${o}\nendobj\n`});
  const xref=pdf.length;pdf+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;
  for(let i=1;i<offsets.length;i++)pdf+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";
  pdf+=`trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf],{type:"application/pdf"});
}
function formatReportDate(date){
  const d=new Date(date+"T00:00:00");
  return Number.isNaN(d.getTime())?date:d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
}
function getReportMonthSummary(gs){
  const months={};
  gs.forEach(g=>{
    (g.completedDates||[]).forEach(date=>{
      const key=String(date).slice(0,7);
      months[key]=(months[key]||0)+1;
    });
  });
  return Object.entries(months).sort((a,b)=>a[0].localeCompare(b[0]));
}
function generateImprovementPDF(){
  const p=data.profile||{}, gs=data.gardens||[];
  gs.forEach(hydrateGarden);
  const stats=totalStats();
  const overall=stats.percent||0;
  const reportDate=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const lines=[
    {text:"GROWLY - IMPROVEMENT REPORT",bold:true,size:18,space:true},
    {text:`Generated on: ${reportDate}`},
    {text:"Small Actions, A Fuller You.",space:true},
    {text:"PROFILE DETAILS",bold:true},
    {text:`Name: ${p.name||data.name||"Grower"}`},
    {text:`Age: ${p.age||"Not provided"}`},
    {text:`Gender: ${p.gender||"Not provided"}`},
    {text:`Working As: ${p.work||"Not provided"}`},
    {text:`Address: ${p.address||"Not provided"}`},
    {text:`Email: ${p.email||"Not provided"}`},
    {text:`Phone: ${p.phone||"Not provided"}`},
    {text:`Improvement Focus: ${p.about||"Not provided"}`,space:true},
    {text:"OVERALL IMPROVEMENT",bold:true},
    {text:`Overall consistency: ${overall}%`},
    {text:`Total gardens: ${stats.totalGoals}`},
    {text:`Active gardens: ${stats.active}`},
    {text:`Completed days: ${stats.completedDays}`},
    {text:`Flowers planted: ${stats.flowers}`},
    {text:`Current streak: ${stats.currentStreak} days`},
    {text:`Longest streak: ${stats.longestStreak} days`},
    {text:`Total improvement points: ${stats.points}`,space:true},
    {text:"GARDEN-WISE PROGRESS",bold:true}
  ];
  if(!gs.length) lines.push({text:"No gardens recorded yet."});
  gs.forEach((g,i)=>{
    const dates=[...(g.completedDates||[])].sort();
    lines.push({text:`${i+1}. ${g.name||"Unnamed Garden"}`,bold:true});
    lines.push({text:`Category: ${g.category||"General"} | Status: ${g.status||"active"}`});
    lines.push({text:`Goal: ${g.description||"Not provided"}`});
    lines.push({text:`Daily target: ${g.dailyTarget||"1 action"} | Duration: ${g.duration||0} days`});
    lines.push({text:`Progress: ${calculateProgress(g)}% | Completed days: ${g.completedDays||0}/${g.duration||0}`});
    lines.push({text:`Remaining days: ${Math.max(0,(g.duration||0)-(g.completedDays||0))} | Current streak: ${g.streak||0}`});
    lines.push({text:`Longest streak: ${g.longestStreak||0} | Flowers planted: ${g.flowers||0} | Improvement points: ${pointsForGarden(g)}`});
    lines.push({text:`Flowers planted on: ${dates.length?dates.map(formatReportDate).join(", "):"No completed days yet."}`,space:true});
  });
  const monthSummary=getReportMonthSummary(gs);
  lines.push({text:"MONTHLY ACTIVITY",bold:true});
  if(monthSummary.length){
    monthSummary.forEach(([month,count])=>{
      const [y,m]=month.split("-").map(Number);
      const label=new Date(y,m-1,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"});
      lines.push({text:`${label}: ${count} flower${count===1?"":"s"} planted`});
    });
  }else lines.push({text:"No monthly activity recorded yet."});
  lines.push({text:"REMINDER SETTINGS",bold:true});
  lines.push({text:`Daily reminder: ${data.reminder?.enabled?"Enabled":"Disabled"}`});
  if(data.reminder?.enabled) lines.push({text:`Reminder time: ${formatReminderTime(data.reminder.time||"19:00")}`});
  lines.push({text:"ACTIVITY SUMMARY",bold:true});
  const allDates=[...new Set(gs.flatMap(g=>g.completedDates||[]))].sort();
  lines.push({text:`Unique active days: ${allDates.length}`});
  if(allDates.length){
    lines.push({text:`First completed day: ${formatReportDate(allDates[0])}`});
    lines.push({text:`Most recent completed day: ${formatReportDate(allDates[allDates.length-1])}`});
  }
  lines.push({text:"KEEP GROWING",bold:true},{text:"This report contains the profile and progress data currently recorded in Growly. Keep completing small daily actions consistently."});
  const blob=buildPDF(lines),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=`growly-improvement-report-${isoToday()}.pdf`;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);showToast("Complete improvement PDF generated 📄");
}
function exportData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`growly-progress-${isoToday()}.json`;a.click();URL.revokeObjectURL(a.href);showToast("Progress exported successfully.")}
function importData(file){const r=new FileReader();r.onload=()=>{try{const incoming=JSON.parse(r.result);if(!incoming||!Array.isArray(incoming.gardens))throw Error();data={...data,...incoming,gardens:incoming.gardens.map(g=>hydrateGarden(g))};saveData();renderAll();showToast("Progress imported 🌱")}catch(e){showToast("That file is not valid Growly data.")}};r.readAsText(file)}
function resetAll(){openModal(`<h2>Reset everything?</h2><p class="modal-sub">This removes all gardens and returns Growly to a fresh start.</p><div class="modal-actions"><button class="secondary-btn" data-close>Cancel</button><button class="danger-btn" id="resetConfirm">Reset Everything</button></div>`);$("#resetConfirm").onclick=()=>{localStorage.removeItem(STORAGE_KEY);data={name:"",theme:"light",reduceMotion:false,gardens:[],activeGardenId:null};saveData();closeModal();renderAll();showWelcome();}}
function showWelcome(){if(!data.name)$("#welcomeOverlay").classList.remove("hidden")}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function attr(s){return esc(s)}

document.addEventListener("click",e=>{
  const nav=e.target.closest("[data-page]");if(nav){if(nav.dataset.page==="new")openCreateModal();else navigate(nav.dataset.page);return}
  const open=e.target.closest("[data-open]");if(open){openDetails(open.dataset.open);return}
  const detail=e.target.closest("[data-detail]");if(detail){openDetails(detail.dataset.detail);return}
  const edit=e.target.closest("[data-edit]");if(edit){editGarden(edit.dataset.edit);return}
  const del=e.target.closest("[data-delete]");if(del){confirmAction("delete",del.dataset.delete);return}
  const reset=e.target.closest("[data-reset]");if(reset){confirmAction("reset",reset.dataset.reset);return}
  const comp=e.target.closest("[data-complete]");if(comp){completeToday(comp.dataset.complete);closeModal();return}
  if(e.target.matches("[data-close]"))closeModal();
});
$("#completeBtn").onclick=()=>completeToday();
$("#viewActiveBtn").onclick=()=>{const g=getActiveGarden();if(g)openDetails(g.id)};
$("#newGoalBtn1").onclick=openCreateModal;
$("#modalClose").onclick=closeModal;
$("#modalBackdrop").onclick=e=>{if(e.target===$("#modalBackdrop"))closeModal()};
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");
$("#mobileProfileBtn").onclick=()=>navigate("settings");
$("#saveNameBtn")?.addEventListener("click",saveName);
$("#saveProfileBtn")?.addEventListener("click",saveProfile);
$("#saveReminderBtn")?.addEventListener("click",saveReminder);
$("#testReminderBtn")?.addEventListener("click",()=>showPlantReminder(true));
$("#generatePdfBtn")?.addEventListener("click",generateImprovementPDF);
$("#generatePdfBtn2")?.addEventListener("click",generateImprovementPDF);
$("#logoutBtn")?.addEventListener("click",logout);
$("#themeToggle").onchange=e=>{data.theme=e.target.checked?"dark":"light";saveData();applyTheme()};
$("#motionToggle").onchange=e=>{data.reduceMotion=e.target.checked;saveData();applyTheme()};
$("#exportBtn").onclick=exportData;
$("#importBtn").onclick=()=>$("#importFile").click();
$("#importFile").onchange=e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value=""};
$("#resetAllBtn").onclick=resetAll;
$("#startGrowing").onclick=()=>{const name=$("#welcomeName").value.trim();data.name=name||"Grower";saveData();$("#welcomeOverlay").classList.add("hidden");renderAll();showToast("Welcome to Growly 🌱")};
$("#welcomeName").addEventListener("keydown",e=>{if(e.key==="Enter")$("#startGrowing").click()});
$("#gardenFilters").onclick=e=>{const b=e.target.closest(".filter");if(!b)return;activeFilter=b.dataset.filter;$$(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderGardens()};

$("#loginForm").addEventListener("submit",handleLogin);
$("#registerForm").addEventListener("submit",handleRegister);
$("#showRegisterBtn").onclick=()=>showAuthPanel("register");
$("#showLoginBtn").onclick=()=>showAuthPanel("login");
(function init(){
  data.gardens.forEach(hydrateGarden);saveData();applyTheme();renderAll();fillProfile();fillReminder();startAuth();if(getAuth())$("#welcomeOverlay").classList.add("hidden");
  updateDynamicHeader();updateDailyQuote();scheduleReminderCheck();
  setInterval(()=>{const oldQuote=$("#dailyQuote").textContent;updateDynamicHeader();updateDailyQuote();scheduleReminderCheck();if(oldQuote!==$("#dailyQuote").textContent)renderDashboard()},30000);
  setInterval(()=>{renderDashboard();renderProgress()},60000);
  if("serviceWorker" in navigator){navigator.serviceWorker.register("service-worker.js").catch(()=>{})}
})();
