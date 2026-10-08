(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const STORAGE='greenflow_pro_v5'; const LEGACY_STORAGE='greenflow_pro_v4'; const weekFa=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه']; const jsFa=['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7); const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=d=>{d=new Date(d);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}; const today=()=>iso(new Date()); const fromISO=s=>new Date(s+'T12:00:00'); const addDays=(s,n)=>{let d=fromISO(s);d.setDate(d.getDate()+n);return iso(d)};
const faNum=v=>String(v??'').replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]); const jalali=s=>{try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(fromISO(s))}catch{return s}}; const longJ=s=>{try{return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(fromISO(s))}catch{return s}};
const weekStart=s=>{let d=fromISO(s),diff=(d.getDay()+1)%7;d.setDate(d.getDate()-diff);return iso(d)}; const weekdayFa=s=>jsFa[fromISO(s).getDay()]; const fmtMin=n=>{n=Math.max(0,Number(n)||0);let h=Math.floor(n/60),m=n%60;return h?`${faNum(h)}h${m?' '+faNum(m)+'m':''}`:`${faNum(m)}m`};
const defaultState={seq:4,tasks:[{id:'t1',key:'GF-1',title:'Review anomaly detection papers',description:'Read the selected papers and capture the methods, datasets, evaluation metrics, limitations, and useful citations.',priority:'High',estimate:180,due:'',label:'Thesis',status:'doing',subtasks:[{id:'s1',title:'Read methodology section',done:true},{id:'s2',title:'Extract evaluation metrics',done:false}],created:today()},{id:'t2',key:'GF-2',title:'Organize thesis research notes',description:'',priority:'Medium',estimate:90,due:'',label:'Thesis',status:'todo',subtasks:[],created:today()},{id:'t3',key:'GF-3',title:'Prepare weekly research plan',description:'Define the concrete research deliverables for the next week.',priority:'Medium',estimate:45,due:'',label:'Planning',status:'backlog',subtasks:[],created:today()}],routines:[{id:'r1',title:'Walking',time:'18:00',days:['شنبه','دوشنبه','چهارشنبه'],checks:{}}],plans:[],logs:[],reminders:[],settings:{logMode:'week',focus:{minutes:25,remaining:1500,running:false,endAt:null,taskId:'',autoLog:true,startedAt:null}}};
function cloneDefault(){return typeof structuredClone==='function'?structuredClone(defaultState):JSON.parse(JSON.stringify(defaultState))}
function normalizeState(x){if(!x||!Array.isArray(x.tasks))return null;x.seq=x.seq||20;x.routines=Array.isArray(x.routines)?x.routines:[];x.plans=Array.isArray(x.plans)?x.plans:[];x.logs=Array.isArray(x.logs)?x.logs:[];x.reminders=Array.isArray(x.reminders)?x.reminders:[];x.settings=x.settings||{logMode:'week'};if(x.settings.dailyFocusTaskId==null)x.settings.dailyFocusTaskId='';if(x.settings.theme==null)x.settings.theme='light';if(x.settings.dailyGoalMinutes==null)x.settings.dailyGoalMinutes=420;x.settings.focus=x.settings.focus||{minutes:25,remaining:1500,running:false,endAt:null,taskId:'',autoLog:true,startedAt:null};x.routines.forEach(r=>{r.days=Array.isArray(r.days)?r.days:[];r.checks=r.checks||{};if(r.paused==null)r.paused=false;if(r.startDate==null)r.startDate='';if(r.endDate==null)r.endDate=''});return x}
function setSaveStatus(ok,msg){let el=document.querySelector('#saveStatus');if(el){el.textContent=msg|| (ok?'Saved locally':'Storage error');el.classList.toggle('save-error',!ok)}}
function load(){try{let raw=localStorage.getItem(STORAGE)||localStorage.getItem(LEGACY_STORAGE);let x=raw?normalizeState(JSON.parse(raw)):null;if(x){try{localStorage.setItem(STORAGE,JSON.stringify(x))}catch{}return x}}catch(e){}return cloneDefault()}
let state=load(), weekCursor=today(), logCursor=today(), dragged=null, currentDayKey=today();
function save(){try{let raw=JSON.stringify(state);localStorage.setItem(STORAGE,raw);let ok=localStorage.getItem(STORAGE)===raw;setSaveStatus(ok,ok?'Saved locally':'Save verification failed');if(!ok)throw new Error('save verification failed')}catch(e){setSaveStatus(false,'Storage unavailable — export a backup');console.error('GreenFlow save failed',e)}renderNav()}
function routineOccurs(r,d){return !r.paused && (!r.startDate||d>=r.startDate) && (!r.endDate||d<=r.endDate) && (r.days||[]).includes(weekdayFa(d))}
function toast(msg){$('#toastRoot').innerHTML=`<div class="toast">${esc(msg)}</div>`;setTimeout(()=>$('#toastRoot').innerHTML='',1800)}
function nextKey(){let k=`GF-${state.seq++}`;return k} function taskLogs(id){return state.logs.filter(l=>l.taskId===id)} function loggedMin(id){return taskLogs(id).reduce((a,l)=>a+Number(l.minutes||0),0)}
function renderNav(){let b=state.tasks.filter(t=>t.status==='backlog').length,a=state.tasks.filter(t=>['todo','doing'].includes(t.status)).length;$('#navBacklog').textContent=b;$('#navActive').textContent=a}
function openView(id){$$('.view').forEach(v=>v.classList.toggle('active-view',v.id===id));$$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===id));if(id==='logged')renderLogs();window.scrollTo({top:0,behavior:'smooth'})}
function empty(title,sub=''){return `<div class="empty"><strong>${esc(title)}</strong>${esc(sub)}</div>`}
function issueRow(t){let lm=loggedMin(t.id),pct=t.estimate?Math.min(100,Math.round(lm/t.estimate*100)):0;return `<div class="issue-row" data-open-task="${t.id}"><span class="typeicon">✓</span><div class="issue-summary"><b>${esc(t.title)}</b><small>${esc(t.key)} · ${esc(t.label||'Personal')}</small>${t.estimate?`<div class="timebar"><i style="width:${pct}%"></i></div>`:''}</div><span class="status-chip ${t.status}">${t.status==='doing'?'IN PROGRESS':t.status==='todo'?'TO DO':'DONE'}</span><span class="priority-chip ${t.priority.toLowerCase()}">${esc(t.priority)}</span><span class="estimate">${fmtMin(lm)} / ${t.estimate?fmtMin(t.estimate):'—'}</span></div>`}
function applyTheme(){let dark=state.settings.theme==='dark';document.documentElement.dataset.theme=dark?'dark':'light';let l=$('#themeLabel');if(l)l.textContent=dark?'Light mode':'Dark mode';let m=$('#themeColor');if(m)m.content=dark?'#172326':'#dfecef'}
function toggleTheme(){state.settings.theme=state.settings.theme==='dark'?'light':'dark';save();applyTheme()}
let focusTick=null;
function focusData(){let f=state.settings.focus||(state.settings.focus={minutes:25,remaining:1500,running:false,endAt:null,taskId:'',autoLog:true,startedAt:null});if(!Number.isFinite(f.minutes)||f.minutes<1)f.minutes=25;if(!Number.isFinite(f.remaining)||f.remaining<0)f.remaining=f.minutes*60;return f}
function focusRemaining(){let f=focusData();return f.running&&f.endAt?Math.max(0,Math.ceil((f.endAt-Date.now())/1000)):Math.max(0,f.remaining)}
function renderFocus(){let f=focusData(),rem=focusRemaining(),total=Math.max(60,f.minutes*60),pct=Math.max(0,Math.min(1,rem/total)),m=Math.floor(rem/60),sec=rem%60,txt=$('#focusTimerText');if(!txt)return;txt.textContent=`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;$('#focusTimerState').textContent=f.running?'Focusing':(rem===0?'Complete':rem<total?'Paused':'Ready');$('#focusMinutes').value=f.minutes;$('#focusAutoLog').checked=f.autoLog!==false;let active=state.tasks.filter(t=>['todo','doing'].includes(t.status));$('#focusTask').innerHTML='<option value="">No issue — focus only</option>'+active.map(t=>`<option value="${t.id}" ${f.taskId===t.id?'selected':''}>${esc(t.key)} — ${esc(t.title)}</option>`).join('');$('#focusArc').style.strokeDashoffset=String(326.73*(1-pct));$('.focus-card')?.classList.toggle('running',!!f.running);$('#focusStart').textContent=f.running?'Running…':(rem<total&&rem>0?'Resume':'Start focus');$('#focusStart').disabled=!!f.running;$('#focusPause').disabled=!f.running;$$('[data-focus-preset]').forEach(b=>b.classList.toggle('active',Number(b.dataset.focusPreset)===f.minutes&&!f.running&&rem===total))}
function focusSetMinutes(n){let f=focusData();if(f.running)return;n=Math.max(1,Math.min(240,Number(n)||25));f.minutes=n;f.remaining=n*60;f.endAt=null;f.startedAt=null;save();renderFocus()}
function focusStart(){let f=focusData();if(f.running)return;if(f.remaining<=0)f.remaining=f.minutes*60;f.running=true;f.endAt=Date.now()+f.remaining*1000;f.startedAt=f.startedAt||Date.now();save();renderFocus();startFocusTick()}
function focusPause(){let f=focusData();if(!f.running)return;f.remaining=focusRemaining();f.running=false;f.endAt=null;save();renderFocus();stopFocusTick()}
function focusReset(){let f=focusData();f.running=false;f.remaining=f.minutes*60;f.endAt=null;f.startedAt=null;save();renderFocus();stopFocusTick()}
function focusComplete(){let f=focusData();if(!f.running)return;f.running=false;f.remaining=0;f.endAt=null;let mins=f.minutes;if(f.autoLog!==false&&f.taskId&&state.tasks.some(t=>t.id===f.taskId)){state.logs.push({id:uid(),taskId:f.taskId,date:today(),start:'',end:'',minutes:mins,note:'Focus session'});}f.startedAt=null;save();renderAll();renderFocus();stopFocusTick();toast(f.taskId&&f.autoLog!==false?`Focus complete · ${mins}m logged`:'Focus session complete');try{if('Notification'in window&&Notification.permission==='granted')new Notification('GreenFlow',{body:'Focus session complete.'})}catch{}}
function startFocusTick(){stopFocusTick();focusTick=setInterval(()=>{if(focusRemaining()<=0)focusComplete();else renderFocus()},500)}function stopFocusTick(){if(focusTick){clearInterval(focusTick);focusTick=null}}
function renderToday(){let d=today();$('#todayDate').textContent=longJ(d);let active=state.tasks.filter(t=>['todo','doing'].includes(t.status));$('#todayActive').innerHTML=active.length?active.map(issueRow).join(''):empty('No active issues','Move a backlog issue into Active when you are ready.');let ps=state.plans.filter(p=>p.date===d).sort((a,b)=>(a.time||'99').localeCompare(b.time||'99'));$('#todayPlans').innerHTML=ps.length?ps.map(p=>`<div class="plan-row"><button class="check ${p.done?'done':''}" data-plancheck="${p.id}">${p.done?'✓':''}</button><div class="plan-time">${p.time?faNum(p.time):'Anytime'}<small>${p.duration?fmtMin(p.duration):''}</small></div><div class="grow"><b>${esc(p.title)}</b><p>${esc(p.note||'')}</p></div></div>`).join(''):empty('Nothing scheduled','Use Quick plan for one-off events.');let wd=weekdayFa(d),rs=state.routines.filter(r=>routineOccurs(r,d));$('#todayRoutines').innerHTML=rs.length?rs.map(r=>`<div class="routine-check"><button class="check ${r.checks?.[d]?'done':''}" data-rcheck="${r.id}" data-date="${d}">${r.checks?.[d]?'✓':''}</button><div class="grow"><b>${esc(r.title)}</b><p>${r.time?faNum(r.time):'No fixed time'}</p></div></div>`).join(''):empty('No routines today');let df=state.tasks.find(t=>t.id===state.settings.dailyFocusTaskId&&['todo','doing'].includes(t.status));if(!df&&state.settings.dailyFocusTaskId){state.settings.dailyFocusTaskId='';save()}let c=$('#dailyFocusContent'),open=$('#dailyFocusOpen'),start=$('#dailyFocusStart'),choose=$('#dailyFocusChoose');if(df){let lm=loggedMin(df.id),remain=df.estimate?Math.max(0,df.estimate-lm):null;c.innerHTML=`<div class="focus-issue-key">${esc(df.key)} · ${esc(df.priority)}</div><strong>${esc(df.title)}</strong><small>${df.estimate?`${fmtMin(lm)} logged · ${fmtMin(remain)} remaining`:`${fmtMin(lm)} logged`} ${df.due?' · Due '+jalali(df.due):''}</small>`;open.hidden=false;start.hidden=false;choose.textContent='Change';open.dataset.openTask=df.id;start.dataset.focusIssue=df.id}else{c.innerHTML='<strong>No focus issue selected</strong><small>Choose one active issue to make today’s priority.</small>';open.hidden=true;start.hidden=true;choose.textContent='Choose issue'}renderFocus()}
function renderPlanner(){let start=weekStart(weekCursor),end=addDays(start,6);$('#weekLabel').textContent=`${jalali(start)} — ${jalali(end)}`;$('#weekGrid').innerHTML=Array.from({length:7},(_,i)=>{let d=addDays(start,i),ps=state.plans.filter(p=>p.date===d).sort((a,b)=>(a.time||'99').localeCompare(b.time||'99')),rs=state.routines.filter(r=>routineOccurs(r,d));return `<article class="day ${d===today()?'today':''}"><div class="dayhead"><div><b>${weekdayFa(d)}</b><div class="jalali">${jalali(d)}</div></div><button class="dayadd" data-adddate="${d}">＋</button></div>${ps.map(p=>`<div class="mini-plan"><b>${p.time?faNum(p.time)+' · ':''}${esc(p.title)}</b><small>${p.duration?fmtMin(p.duration):''}${p.note?' · '+esc(p.note):''}</small></div>`).join('')}${rs.map(r=>`<label class="mini-routine"><input type="checkbox" data-rcheck="${r.id}" data-date="${d}" ${r.checks?.[d]?'checked':''}> ${esc(r.title)}</label>`).join('')}${!ps.length&&!rs.length?'<div class="empty">No plans</div>':''}</article>`}).join('')}
function renderBacklog(){let q=($('#backlogSearch')?.value||'').toLowerCase(),pf=$('#priorityFilter')?.value||'all',ts=state.tasks.filter(t=>t.status==='backlog'&&(!q||(t.title+' '+t.key+' '+(t.label||'')).toLowerCase().includes(q))&&(pf==='all'||t.priority===pf));$('#backlogList').innerHTML=ts.length?ts.map(t=>`<div class="backlog-item issue-grid" data-open-task="${t.id}"><span class="typeicon">✓</span><span><span class="key">${esc(t.key)}</span><b>${esc(t.title)}</b></span><span class="priority-chip ${t.priority.toLowerCase()}">${esc(t.priority)}</span><span>${t.estimate?fmtMin(t.estimate):'—'}</span><span>${t.due?jalali(t.due):'—'}</span><span><button class="movebtn" data-start="${t.id}">Add to Active</button></span></div>`).join(''):empty('Backlog is empty','Create an issue or clear your filters.')}
function taskCard(t){let lm=loggedMin(t.id);return `<article class="task-card" draggable="true" data-task="${t.id}" data-open-task="${t.id}"><span class="key">${esc(t.key)}</span><h3>${esc(t.title)}</h3>${t.label?`<div class="task-tags"><span class="tag">${esc(t.label)}</span></div>`:''}<div class="task-meta"><span class="priority-chip ${t.priority.toLowerCase()}">${esc(t.priority)}</span><span class="estimate">${lm?fmtMin(lm)+' logged · ':''}${t.estimate?fmtMin(t.estimate):'No estimate'}</span><span class="avatar">ME</span></div></article>`}
function renderBoard(){['todo','doing','done'].forEach(s=>{let ts=state.tasks.filter(t=>t.status===s);$('#count-'+s).textContent=ts.length;$('#col-'+s).innerHTML=ts.length?ts.map(taskCard).join(''):'<div class="empty">Drop issues here</div>'})}
function renderRoutines(){let root=$('#routineCards');root.innerHTML=state.routines.length?state.routines.map(r=>`<article class="routine-card"><div><h3>${esc(r.title)}</h3><div class="routine-time">${r.time?faNum(r.time):'No fixed time'}</div></div><div class="days">${weekFa.map(d=>`<span class="daypill ${(r.days||[]).includes(d)?'on':''}">${d}</span>`).join('')}</div><div class="routine-foot"><span>${r.paused?'Paused':(r.endDate?'Until '+jalali(r.endDate):'Repeats forever')} · ${faNum(Object.values(r.checks||{}).filter(Boolean).length)} completions</span><span><button class="textbtn" data-edit-routine="${r.id}">Edit</button></span></div></article>`).join(''):empty('No routines yet','Create recurring habits without cluttering your Jira board.')}
function logRange(){let mode=state.settings.logMode||'week',d=fromISO(logCursor),start,end;if(mode==='week'){start=weekStart(logCursor);end=addDays(start,6)}else if(mode==='month'){start=iso(new Date(d.getFullYear(),d.getMonth(),1));end=iso(new Date(d.getFullYear(),d.getMonth()+1,0))}else{start=`${d.getFullYear()}-01-01`;end=`${d.getFullYear()}-12-31`}return{start,end}}
function periodDates(start,end,mode){if(mode==='week')return Array.from({length:7},(_,i)=>addDays(start,i));if(mode==='month'){let a=[];for(let d=start;d<=end;d=addDays(d,1))a.push(d);return a}let y=fromISO(start).getFullYear();return Array.from({length:12},(_,i)=>iso(new Date(y,i,1)))}
function renderLogs(){let {start,end}=logRange(),mode=state.settings.logMode||'week',ls=state.logs.filter(l=>l.date>=start&&l.date<=end),dates=periodDates(start,end,mode);$('#logLabel').textContent=mode==='year'?faNum(new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric'}).format(fromISO(start))):`${jalali(start)} — ${jalali(end)}`;let total=ls.reduce((a,l)=>a+Number(l.minutes||0),0),uniq=new Set(ls.map(l=>l.taskId).filter(Boolean));$('#totalLogged').textContent=fmtMin(total);$('#entryCount').textContent=faNum(ls.length);$('#issueCount').textContent=faNum(uniq.size);let activeDays=new Set(ls.map(l=>l.date)).size;$('#dailyAvg').textContent=activeDays?fmtMin(Math.round(total/activeDays)):'0m';let taskIds=[...new Set(ls.map(l=>l.taskId).filter(Boolean))],tasks=taskIds.map(id=>state.tasks.find(t=>t.id===id)).filter(Boolean);if(!tasks.length)tasks=state.tasks.filter(t=>['todo','doing'].includes(t.status)).slice(0,6);let cols=dates.length;let header=dates.map(d=>{if(mode==='year'){let m=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'short'}).format(fromISO(d));return `<div class="ts-cell ${d.slice(0,7)===today().slice(0,7)?'todaycol':''}"><div class="ts-day"><b>${m}</b></div></div>`}return `<div class="ts-cell ${d===today()?'todaycol':''}"><div class="ts-day"><b>${mode==='week'?weekdayFa(d):faNum(fromISO(d).getDate())}</b><small>${mode==='week'?jalali(d).split('/').slice(1).join('/'):''}</small></div></div>`}).join('');let rows=tasks.map(t=>{let cells=dates.map(d=>{let mins;if(mode==='year'){let ym=d.slice(0,7);mins=ls.filter(l=>l.taskId===t.id&&l.date.slice(0,7)===ym).reduce((a,l)=>a+Number(l.minutes||0),0)}else mins=ls.filter(l=>l.taskId===t.id&&l.date===d).reduce((a,l)=>a+Number(l.minutes||0),0);return `<div class="ts-cell daycell ${d===today()?'todaycol':''}" data-logcell="${t.id}" data-logdate="${mode==='year'?d:d}">${mins?`<b>${fmtMin(mins)}</b>`:'＋'}</div>`}).join('');let sum=ls.filter(l=>l.taskId===t.id).reduce((a,l)=>a+Number(l.minutes||0),0);return `<div class="ts-row" style="--cols:${cols}"><div class="ts-cell issue" data-open-task="${t.id}"><span class="typeicon">✓</span>&nbsp;<span><b>${esc(t.title)}</b><br><span class="key">${esc(t.key)}</span></span></div>${cells}<div class="ts-cell total">${sum?fmtMin(sum):'—'}</div></div>`}).join('');$('#timesheet').innerHTML=`<div class="timesheet"><div class="ts-row header" style="--cols:${cols}"><div class="ts-cell issue"><b>Issue</b></div>${header}<div class="ts-cell total">Total</div></div>${rows||`<div class="empty">No issues to display.</div>`}</div>`;let sorted=[...ls].sort((a,b)=>(b.date+(b.start||'')).localeCompare(a.date+(a.start||'')));$('#logActivity').innerHTML=sorted.length?sorted.slice(0,20).map(l=>{let t=state.tasks.find(x=>x.id===l.taskId);return `<div class="activity-row"><div class="wl-icon">◷</div><div class="grow"><b>${esc(t?.title||l.title||'Work')}</b><p>${weekdayFa(l.date)} · ${jalali(l.date)}${l.start?' · '+faNum(l.start):''}${l.note?' · '+esc(l.note):''}</p></div><span class="log-duration">${fmtMin(l.minutes)}</span><button data-delete-log="${l.id}">×</button></div>`}).join(''):empty('No work logged in this period')}
function renderAll(){renderNav();renderToday();renderPlanner();renderBacklog();renderBoard();renderRoutines();renderLogs()}
function modal(html){$('#overlayRoot').innerHTML=`<div class="shade"><div class="modal"><button class="close" data-close>×</button>${html}</div></div>`} function closeOverlay(){$('#overlayRoot').innerHTML=''}
function taskForm(task=null,status='backlog'){let edit=!!task;modal(`<h2>${edit?'Edit issue':'Create issue'}</h2><p class="sub">${edit?esc(task.key):'Project and study work uses the Jira-style workflow.'}</p><form class="form" id="taskForm"><label>Summary<input name="title" required autofocus value="${esc(task?.title||'')}"></label><label>Description <span class="hint">optional</span><textarea name="description" placeholder="Add context, acceptance criteria, notes…">${esc(task?.description||'')}</textarea></label><div class="two"><label>Status<select name="status"><option value="backlog">Backlog</option><option value="todo">To Do</option><option value="doing">In Progress</option><option value="done">Done</option></select></label><label>Priority<select name="priority"><option>Highest</option><option>High</option><option>Medium</option><option>Low</option></select></label></div><div class="two"><label>Original estimate <span class="hint">minutes</span><input type="number" min="0" name="estimate" value="${task?.estimate||''}"></label><label>Due date <span class="hint">optional</span><input type="date" name="due" value="${task?.due||''}"></label></div><label>Label <span class="hint">optional</span><input name="label" value="${esc(task?.label||'')}" placeholder="e.g. Thesis"></label><div class="form-actions">${edit?'<button type="button" class="danger" data-delete-task="'+task.id+'">Delete</button>':''}<button type="button" class="secondary" data-close>Cancel</button><button class="primary">${edit?'Save changes':'Create issue'}</button></div></form>`);let f=$('#taskForm');f.status.value=task?.status||status;f.priority.value=task?.priority||'Medium';f.onsubmit=e=>{e.preventDefault();let x=new FormData(f),obj={title:x.get('title').trim(),description:x.get('description').trim(),status:x.get('status'),priority:x.get('priority'),estimate:Number(x.get('estimate'))||0,due:x.get('due'),label:x.get('label').trim()};if(edit)Object.assign(task,obj);else state.tasks.push({id:uid(),key:nextKey(),subtasks:[],created:today(),...obj});save();closeOverlay();renderAll();toast(edit?'Issue updated':'Issue created')}}
function quickPlan(date=today()){modal(`<h2>Quick plan</h2><p class="sub">One-off event — no Jira issue required.</p><form class="form" id="planForm"><label>Plan<input name="title" required autofocus placeholder="e.g. Go out"></label><div class="two"><label>Date<input type="date" name="date" value="${date}" required><span class="hint">${jalali(date)}</span></label><label>Start time <span class="hint">optional</span><input type="time" name="time"></label></div><div class="two"><label>Duration <span class="hint">minutes</span><input type="number" min="1" name="duration" placeholder="60"></label><label>Note <span class="hint">optional</span><input name="note"></label></div><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary">Add plan</button></div></form>`);$('#planForm').onsubmit=e=>{e.preventDefault();let x=new FormData(e.currentTarget);state.plans.push({id:uid(),title:x.get('title'),date:x.get('date'),time:x.get('time'),duration:Number(x.get('duration'))||0,note:x.get('note'),done:false});save();closeOverlay();renderAll();toast('Plan added')}}
function routineForm(r=null){let edit=!!r;modal(`<h2>${edit?'Edit routine':'New routine'}</h2><p class="sub">Repeats every week on the selected days. Leave End date empty to repeat forever.</p><form class="form" id="routineForm"><label>Name<input name="title" required autofocus value="${esc(r?.title||'')}"></label><div class="two"><label>Preferred time <span class="hint">optional</span><input type="time" name="time" value="${r?.time||''}"></label><label>Start date<input type="date" name="startDate" value="${r?.startDate||today()}"><span class="hint">${jalali(r?.startDate||today())}</span></label></div><label>Repeat on</label><div class="days">${weekFa.map(d=>`<label class="daypill ${(r?.days||[]).includes(d)?'on':''}"><input type="checkbox" name="days" value="${d}" ${(r?.days||[]).includes(d)?'checked':''}> ${d}</label>`).join('')}</div><div class="two"><label>End date <span class="hint">optional — blank = forever</span><input type="date" name="endDate" value="${r?.endDate||''}"></label><label class="toggle-label"><span>Routine status</span><span><input type="checkbox" name="paused" ${r?.paused?'checked':''}> Paused</span></label></div><div class="form-actions">${edit?'<button type="button" class="danger" data-delete-routine="'+r.id+'">Delete</button>':''}<button type="button" class="secondary" data-close>Cancel</button><button class="primary">Save routine</button></div></form>`);$('#routineForm').onsubmit=e=>{e.preventDefault();let x=new FormData(e.currentTarget),days=x.getAll('days');if(!days.length){toast('Choose at least one weekday');return}let obj={title:x.get('title').trim(),time:x.get('time'),days,startDate:x.get('startDate')||'',endDate:x.get('endDate')||'',paused:x.get('paused')==='on'};if(obj.endDate&&obj.startDate&&obj.endDate<obj.startDate){toast('End date must be after start date');return}if(edit)Object.assign(r,obj);else state.routines.push({id:uid(),...obj,checks:{}});save();closeOverlay();renderAll();toast(obj.paused?'Routine saved as paused':(obj.endDate?'Routine saved':'Routine saved · repeats forever'))}}
function exportBackup(){let blob=new Blob([JSON.stringify({app:'GreenFlow Pro',version:5,exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`GreenFlow-backup-${today()}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast('Backup exported')}
function importBackup(file){let reader=new FileReader();reader.onload=()=>{try{let data=JSON.parse(reader.result),incoming=normalizeState(data.state||data);if(!incoming)throw new Error('Invalid backup');state=incoming;save();renderAll();toast('Backup restored')}catch(e){toast('Invalid backup file')}};reader.readAsText(file)}
function logForm(taskId='',date=today()){let task=state.tasks.find(t=>t.id===taskId);modal(`<h2>Log work</h2><p class="sub">Track actual time against a Jira issue.</p><form class="form" id="logForm"><label>Issue<select name="taskId" required><option value="">Select issue…</option>${state.tasks.map(t=>`<option value="${t.id}" ${t.id===taskId?'selected':''}>${esc(t.key)} — ${esc(t.title)}</option>`).join('')}</select></label><div class="two"><label>Date<input type="date" name="date" value="${date}" required><span class="hint">${jalali(date)}</span></label><label>Duration <span class="hint">minutes</span><input type="number" name="minutes" min="1" placeholder="60"></label></div><div class="two"><label>From <span class="hint">optional</span><input type="time" name="start"></label><label>To <span class="hint">optional</span><input type="time" name="end"></label></div><label>Work description <span class="hint">optional</span><input name="note" placeholder="What did you work on?"></label><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary">Log work</button></div></form>`);$('#logForm').onsubmit=e=>{e.preventDefault();let x=new FormData(e.currentTarget),s=x.get('start'),en=x.get('end'),mins=Number(x.get('minutes'))||0;if(!mins&&s&&en){let [sh,sm]=s.split(':').map(Number),[eh,em]=en.split(':').map(Number);mins=eh*60+em-sh*60-sm}if(mins<=0){toast('Enter duration or valid From / To');return}state.logs.push({id:uid(),taskId:x.get('taskId'),date:x.get('date'),start:s,end:en,minutes:mins,note:x.get('note')});save();closeOverlay();renderAll();toast('Work logged')}}
function openTask(id){let t=state.tasks.find(x=>x.id===id);if(!t)return;let logs=taskLogs(id).sort((a,b)=>b.date.localeCompare(a.date)),lm=loggedMin(id),sub=t.subtasks||[];$('#overlayRoot').innerHTML=`<div class="drawer-shade"><aside class="drawer"><div class="drawer-head"><span class="typeicon">✓</span><span class="key">${esc(t.key)}</span><button class="drawer-close" data-close>×</button></div><div class="drawer-body"><div><h2>${esc(t.title)}</h2><div class="drawer-actions"><button class="primary" data-task-log="${t.id}">◷ Log work</button><button class="secondary" data-edit-task="${t.id}">Edit</button><button class="secondary ${state.settings.dailyFocusTaskId===t.id?'focus-selected':''}" data-set-daily-focus="${t.id}">${state.settings.dailyFocusTaskId===t.id?'✓ Daily focus':'Set as Daily Focus'}</button></div><div class="section-title">Description</div><div class="desc ${t.description?'':'emptydesc'}">${t.description?esc(t.description):'No description added.'}</div><div class="section-title">Subtasks</div><div id="subtaskList">${sub.length?sub.map(s=>`<label class="subtask"><input type="checkbox" data-subcheck="${t.id}" data-subid="${s.id}" ${s.done?'checked':''}><span>${esc(s.title)}</span></label>`).join(''):'<div class="empty">No subtasks</div>'}</div><div class="add-sub"><input id="newSubInput" placeholder="Add a subtask"><button data-add-sub="${t.id}">＋</button></div><div class="section-title">Work log</div><div>${logs.length?logs.map(l=>`<div class="worklog"><div class="wl-icon">◷</div><div><b>${weekdayFa(l.date)} · ${jalali(l.date)}</b><small>${l.start?faNum(l.start)+' · ':''}${esc(l.note||'Work logged')}</small></div><strong>${fmtMin(l.minutes)}</strong></div>`).join(''):empty('No work logged yet')}</div></div><aside><div class="side-field"><span>Status</span><b class="status-chip ${t.status}">${t.status==='backlog'?'BACKLOG':t.status==='doing'?'IN PROGRESS':t.status==='todo'?'TO DO':'DONE'}</b></div><div class="side-field"><span>Priority</span><b class="priority-chip ${t.priority.toLowerCase()}">${esc(t.priority)}</b></div><div class="side-field"><span>Label</span><b>${esc(t.label||'None')}</b></div><div class="side-field"><span>Original estimate</span><b>${t.estimate?fmtMin(t.estimate):'Not set'}</b></div><div class="side-field"><span>Time logged</span><b>${fmtMin(lm)}</b></div><div class="side-field"><span>Remaining</span><b>${t.estimate?fmtMin(Math.max(0,t.estimate-lm)):'—'}</b></div><div class="side-field"><span>Due date</span><b>${t.due?jalali(t.due):'Not set'}</b></div></aside></div></aside></div>`}
document.addEventListener('click',e=>{let fp=e.target.closest('[data-focus-preset]');if(fp){focusSetMinutes(Number(fp.dataset.focusPreset));return}let fa=e.target.closest('[data-focus-adjust]');if(fa){focusSetMinutes(focusData().minutes+Number(fa.dataset.focusAdjust));return}if(e.target.closest('#focusStart')){focusStart();return}if(e.target.closest('#focusPause')){focusPause();return}if(e.target.closest('#focusReset')){focusReset();return}let el=e.target.closest('[data-view]');if(el){openView(el.dataset.view);return}if(e.target.closest('[data-close]')){closeOverlay();return}el=e.target.closest('[data-action]');if(el){let a=el.dataset.action;if(a==='new-task')taskForm();if(a==='new-task-active')taskForm(null,'todo');if(a==='quick-plan')quickPlan();if(a==='new-routine')routineForm();if(a==='new-log')logForm();if(a==='export-backup')exportBackup();if(a==='import-backup')$('#backupInput').click();if(a==='toggle-theme')toggleTheme();return}el=e.target.closest('[data-open-task]');if(el&&!e.target.closest('[data-start]')){openTask(el.dataset.openTask);return}el=e.target.closest('[data-edit-task]');if(el){let t=state.tasks.find(x=>x.id===el.dataset.editTask);if(t)taskForm(t);return}el=e.target.closest('[data-task-log]');if(el){logForm(el.dataset.taskLog);return}el=e.target.closest('[data-start]');if(el){let t=state.tasks.find(x=>x.id===el.dataset.start);if(t){t.status='todo';save();renderAll();toast('Moved to Active')}return}el=e.target.closest('[data-plancheck]');if(el){let p=state.plans.find(x=>x.id===el.dataset.plancheck);if(p){p.done=!p.done;save();renderAll()}return}el=e.target.closest('[data-rcheck]');if(el){let r=state.routines.find(x=>x.id===el.dataset.rcheck);if(r){r.checks=r.checks||{};r.checks[el.dataset.date]=!r.checks[el.dataset.date];save();renderAll()}return}el=e.target.closest('[data-adddate]');if(el){quickPlan(el.dataset.adddate);return}el=e.target.closest('[data-week]');if(el){let n=Number(el.dataset.week);weekCursor=n===0?today():addDays(weekCursor,n*7);renderPlanner();return}el=e.target.closest('[data-logmode]');if(el){state.settings.logMode=el.dataset.logmode;$$('[data-logmode]').forEach(b=>b.classList.toggle('selected',b===el));save();renderLogs();return}el=e.target.closest('[data-logmove]');if(el){let n=Number(el.dataset.logmove),m=state.settings.logMode,d=fromISO(logCursor);if(m==='week')logCursor=addDays(logCursor,n*7);else if(m==='month'){d.setMonth(d.getMonth()+n);logCursor=iso(d)}else{d.setFullYear(d.getFullYear()+n);logCursor=iso(d)}renderLogs();return}if(e.target.closest('[data-logtoday]')){logCursor=today();renderLogs();return}el=e.target.closest('[data-logcell]');if(el){let d=el.dataset.logdate;if(state.settings.logMode==='year')d=today().slice(0,4)===d.slice(0,4)&&today().slice(0,7)===d.slice(0,7)?today():d;logForm(el.dataset.logcell,d);return}el=e.target.closest('[data-set-daily-focus]');if(el){state.settings.dailyFocusTaskId=state.settings.dailyFocusTaskId===el.dataset.setDailyFocus?'':el.dataset.setDailyFocus;save();renderToday();openTask(el.dataset.setDailyFocus);toast(state.settings.dailyFocusTaskId?'Daily focus set':'Daily focus cleared');return}el=e.target.closest('[data-focus-issue]');if(el){let f=focusData();f.taskId=el.dataset.focusIssue;save();openView('today');setTimeout(()=>document.querySelector('.focus-card')?.scrollIntoView({behavior:'smooth',block:'center'}),50);return}if(e.target.closest('#dailyFocusChoose')){let active=state.tasks.filter(t=>['todo','doing'].includes(t.status));if(!active.length){toast('No active issues to choose from');return}let cur=state.settings.dailyFocusTaskId,idx=Math.max(-1,active.findIndex(t=>t.id===cur));state.settings.dailyFocusTaskId=active[(idx+1)%active.length].id;save();renderToday();return}el=e.target.closest('[data-delete-log]');if(el){state.logs=state.logs.filter(x=>x.id!==el.dataset.deleteLog);save();renderAll();return}el=e.target.closest('[data-edit-routine]');if(el){let r=state.routines.find(x=>x.id===el.dataset.editRoutine);if(r)routineForm(r);return}el=e.target.closest('[data-delete-task]');if(el&&confirm('Delete this issue and its worklogs?')){state.tasks=state.tasks.filter(x=>x.id!==el.dataset.deleteTask);state.logs=state.logs.filter(x=>x.taskId!==el.dataset.deleteTask);save();closeOverlay();renderAll();return}el=e.target.closest('[data-delete-routine]');if(el&&confirm('Delete this routine?')){state.routines=state.routines.filter(x=>x.id!==el.dataset.deleteRoutine);save();closeOverlay();renderAll();return}el=e.target.closest('[data-subcheck]');if(el){let t=state.tasks.find(x=>x.id===el.dataset.subcheck),s=t?.subtasks?.find(x=>x.id===el.dataset.subid);if(s){s.done=!s.done;save();openTask(t.id);renderToday()}return}el=e.target.closest('[data-add-sub]');if(el){let t=state.tasks.find(x=>x.id===el.dataset.addSub),inp=$('#newSubInput');if(t&&inp?.value.trim()){t.subtasks=t.subtasks||[];t.subtasks.push({id:uid(),title:inp.value.trim(),done:false});save();openTask(t.id)}return}});
document.addEventListener('input',e=>{if(e.target.id==='backlogSearch')renderBacklog()});document.addEventListener('change',e=>{if(e.target.id==='priorityFilter')renderBacklog();if(e.target.id==='backupInput'&&e.target.files?.[0]){importBackup(e.target.files[0]);e.target.value=''}});document.addEventListener('dragstart',e=>{let c=e.target.closest('[data-task]');if(c)dragged=c.dataset.task});$$('.column').forEach(c=>{c.addEventListener('dragover',e=>{e.preventDefault();c.querySelector('.dropzone').classList.add('dragover')});c.addEventListener('dragleave',()=>c.querySelector('.dropzone').classList.remove('dragover'));c.addEventListener('drop',e=>{e.preventDefault();c.querySelector('.dropzone').classList.remove('dragover');let t=state.tasks.find(x=>x.id===dragged);if(t){t.status=c.dataset.status;save();renderAll()}})});
$('#focusMinutes')?.addEventListener('change',e=>focusSetMinutes(e.target.value));$('#focusTask')?.addEventListener('change',e=>{focusData().taskId=e.target.value;save()});$('#focusAutoLog')?.addEventListener('change',e=>{focusData().autoLog=e.target.checked;save()});if(focusData().running){if(focusRemaining()<=0)setTimeout(focusComplete,0);else startFocusTick()}
// Keep date-dependent UI in sync when the calendar day changes.
function handleDayRollover(force=false){
  const now=today();
  if(!force && now===currentDayKey) return false;
  const previous=currentDayKey;
  currentDayKey=now;

  // Today-oriented cursors follow the real current date after midnight.
  weekCursor=now;
  logCursor=now;

  // Daily Focus is intentionally day-scoped. Keep the issue itself/history,
  // but require choosing today's focus again on a new calendar day.
  if(previous && previous!==now && state.settings.dailyFocusTaskId){
    state.settings.dailyFocusTaskId='';
    save();
  }

  renderAll();
  return true;
}

// Re-check when the user returns to the tab/window and while the app stays open.
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible') handleDayRollover();
});
window.addEventListener('focus',()=>handleDayRollover());
setInterval(()=>handleDayRollover(),30000);

/* ===== GreenFlow v10: focus controls, goals, richer planner/logs ===== */
function parseDurationHM(v){v=String(v||'').trim().replace(/\s/g,'');if(!v)return 0;if(/^\d+$/.test(v))return Number(v);let m=v.match(/^(\d+)[,:.](\d{1,2})$/);if(!m)return 0;let h=Number(m[1]),mm=Number(m[2]);return mm<60?h*60+mm:0}
function todayLoggedMin(taskId){let d=today();return state.logs.filter(l=>l.taskId===taskId&&l.date===d).reduce((a,l)=>a+Number(l.minutes||0),0)}
issueRow=function(t){let lm=todayLoggedMin(t.id);return `<div class="issue-row" data-open-task="${t.id}"><span class="typeicon">✓</span><div class="issue-summary"><b>${esc(t.title)}</b><small>${esc(t.key)} · ${esc(t.label||'Personal')}</small></div><span class="status-chip ${t.status}">${t.status==='doing'?'IN PROGRESS':t.status==='todo'?'TO DO':'DONE'}</span><span class="priority-chip ${t.priority.toLowerCase()}">${esc(t.priority)}</span><span class="estimate">Today: ${lm?fmtMin(lm):'0m'}</span></div>`}

function focusElapsedMin(){let f=focusData(),total=f.minutes*60,rem=focusRemaining();return Math.max(0,Math.ceil((total-rem)/60))}
function focusStop(saveLog){let f=focusData();if(!f.running&&focusRemaining()===f.minutes*60)return;let mins=focusElapsedMin();f.remaining=focusRemaining();f.running=false;f.endAt=null;if(saveLog&&mins>0&&f.taskId&&state.tasks.some(t=>t.id===f.taskId)){state.logs.push({id:uid(),taskId:f.taskId,date:today(),start:'',end:'',minutes:mins,note:'Stopped focus session',source:'focus'});toast(`Focus stopped · ${fmtMin(mins)} logged`)}else toast(saveLog?'Focus stopped — no linked issue to log':'Focus cancelled');f.remaining=f.minutes*60;f.startedAt=null;save();stopFocusTick();renderAll()}
const _renderFocusV10=renderFocus;renderFocus=function(){_renderFocusV10();let f=focusData(),active=f.running||focusRemaining()<f.minutes*60;let s=$('#focusStop'),c=$('#focusCancel');if(s){s.disabled=!active;s.title='Stop now and save elapsed time to the linked issue'}if(c){c.disabled=!active;c.title='Cancel this session without logging'}}

function focusStartDialog(taskId){let t=state.tasks.find(x=>x.id===taskId);let f=focusData();modal(`<h2>Start focus</h2><p class="sub">${t?`${esc(t.key)} — ${esc(t.title)}`:'Focus session'}</p><form class="form" id="focusLaunchForm"><label>Focus duration <span class="hint">minutes</span><input name="minutes" type="number" min="1" max="240" value="${f.minutes||25}" required></label><div class="focus-presets"><button type="button" data-launch-min="25">25</button><button type="button" data-launch-min="45">45</button><button type="button" data-launch-min="60">60</button><button type="button" data-launch-min="90">90</button></div><label class="focus-log-toggle"><input name="autoLog" type="checkbox" checked> Log the session to this issue</label><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary">Start focus</button></div></form>`);$('#focusLaunchForm').onsubmit=e=>{e.preventDefault();let x=new FormData(e.currentTarget),mins=Number(x.get('minutes'))||25;f.minutes=mins;f.remaining=mins*60;f.taskId=taskId||'';f.autoLog=x.get('autoLog')==='on';f.running=false;f.endAt=null;f.startedAt=null;save();closeOverlay();openView('today');focusStart();setTimeout(()=>document.querySelector('.focus-card')?.scrollIntoView({behavior:'smooth',block:'center'}),30)}}
function chooseDailyFocus(){let active=state.tasks.filter(t=>['todo','doing'].includes(t.status));modal(`<h2>Choose Daily Focus</h2><p class="sub">Select the issue that matters most today.</p><div class="focus-picker">${active.length?active.map(t=>`<button class="issue-row" style="width:100%;text-align:left;border:0" data-pick-focus="${t.id}"><span class="typeicon">✓</span><div class="issue-summary"><b>${esc(t.title)}</b><small>${esc(t.key)} · ${esc(t.priority)}</small></div></button>`).join(''):empty('No active issues','Move an issue to Active first.')}</div><div class="form-actions"><button class="secondary" data-close>Cancel</button></div>`)}

function renderWeeklyGoal(){
  state.settings.dailyGoalMinutes=Number(state.settings.dailyGoalMinutes)||420;
  const d=today(), mins=state.logs.filter(l=>l.date===d).reduce((a,l)=>a+Number(l.minutes||0),0), goal=state.settings.dailyGoalMinutes, pct=goal?Math.min(100,Math.round(mins/goal*100)):0;
  $('#weeklyGoalBar').style.width=pct+'%';
  $('#weeklyGoalValue').textContent=`${fmtMin(mins)} / ${fmtMin(goal)} · ${pct}%`;
  $('#weeklyGoalText').textContent=mins>=goal?`Daily goal reached · ${fmtMin(mins-goal)} over target.`:`${fmtMin(Math.max(0,goal-mins))} remaining today.`;
  $('#weeklyGoalEdit').textContent='Edit goal';
}
function weeklyGoalDialog(){
  let g=Number(state.settings.dailyGoalMinutes)||420,h=Math.floor(g/60),m=g%60;
  modal(`<h2>Daily time goal</h2><p class="sub">Set your standard work target for each day. Task, focus, and routine logs from today all count.</p><form class="form" id="goalForm"><label>Daily target <span class="hint">H:MM — e.g. 7:00</span><input name="duration" value="${h}:${String(m).padStart(2,'0')}" placeholder="7:00" required></label><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary">Save goal</button></div></form>`);
  $('#goalForm').onsubmit=e=>{e.preventDefault();let mins=parseDurationHM(new FormData(e.currentTarget).get('duration'));if(!mins){toast('Use a duration like 7:00');return}state.settings.dailyGoalMinutes=mins;save();closeOverlay();renderWeeklyGoal();toast('Daily goal saved')};
}

function pParts(d){let ps=new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric'}).formatToParts(fromISO(d)),o={};ps.forEach(p=>{if(['year','month','day'].includes(p.type))o[p.type]=Number(p.value)});return o}
function pMonthName(d){return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long',year:'numeric'}).format(fromISO(d))}
function findPersianMonthStart(d){let p=pParts(d),x=d;for(let i=0;i<35;i++){let prev=addDays(x,-1),pp=pParts(prev);if(pp.month!==p.month||pp.year!==p.year)break;x=prev}return x}
function findPersianMonthEnd(d){let p=pParts(d),x=d;for(let i=0;i<35;i++){let nx=addDays(x,1),pp=pParts(nx);if(pp.month!==p.month||pp.year!==p.year)break;x=nx}return x}
function movePersianMonth(d,n){let x=n>0?addDays(findPersianMonthEnd(d),1):addDays(findPersianMonthStart(d),-1);return x}
function persianYearMonths(d){let py=pParts(d).year,x=d;while(pParts(x).year===py)x=addDays(x,-1);x=addDays(x,1);let arr=[];for(let m=1;m<=12;m++){arr.push(x);x=addDays(findPersianMonthEnd(x),1)}return arr}
function plannerItems(d){let ps=state.plans.filter(p=>p.date===d),rs=state.routines.filter(r=>routineOccurs(r,d));return{ps,rs}}
function renderPlannerWeek(){let start=weekStart(weekCursor),end=addDays(start,6);$('#weekLabel').textContent=`${jalali(start)} — ${jalali(end)}`;$('#weekGrid').className='weekgrid';$('#weekGrid').innerHTML=Array.from({length:7},(_,i)=>{let d=addDays(start,i),{ps,rs}=plannerItems(d);return `<article class="day ${d===today()?'today':''}"><div class="dayhead"><div><b>${weekdayFa(d)}</b><div class="jalali">${jalali(d)}</div></div><button class="dayadd" data-adddate="${d}">＋</button></div>${ps.map(p=>`<div class="mini-plan"><b>${p.time?faNum(p.time)+' · ':''}${esc(p.title)}</b></div>`).join('')}${rs.map(r=>`<label class="mini-routine"><input type="checkbox" data-rcheck="${r.id}" data-date="${d}" ${r.checks?.[d]?'checked':''}> ${esc(r.title)}</label>`).join('')}${!ps.length&&!rs.length?'<div class="empty">No plans</div>':''}</article>`}).join('')}
function renderPlannerMonth(){let s=findPersianMonthStart(weekCursor),e=findPersianMonthEnd(weekCursor),gridStart=weekStart(s),days=[];for(let i=0;i<42;i++)days.push(addDays(gridStart,i));$('#weekLabel').textContent=pMonthName(s);$('#weekGrid').className='month-calendar';let heads=weekFa.map(x=>`<div class="cal-weekday">${x}</div>`).join('');$('#weekGrid').innerHTML=heads+days.map(d=>{let pp=pParts(d),cur=pParts(s),{ps,rs}=plannerItems(d),inside=pp.month===cur.month&&pp.year===cur.year;return `<article class="month-day ${inside?'':'out'} ${d===today()?'today':''}" data-caldate="${d}"><div class="num">${faNum(pp.day)} · ${weekdayFa(d)}</div>${ps.slice(0,3).map(p=>`<div class="cal-item">${p.time?faNum(p.time)+' ':''}${esc(p.title)}</div>`).join('')}${rs.slice(0,2).map(r=>`<div class="cal-item routine">${esc(r.title)}</div>`).join('')}</article>`}).join('')}
function renderPlannerYear(){let months=persianYearMonths(weekCursor),py=pParts(weekCursor).year;$('#weekLabel').textContent=faNum(py);$('#weekGrid').className='year-grid';$('#weekGrid').innerHTML=months.map(ms=>{let me=findPersianMonthEnd(ms),cnt=state.plans.filter(p=>p.date>=ms&&p.date<=me).length,ds=[];for(let d=ms;d<=me;d=addDays(d,1)){let pp=pParts(d),has=state.plans.some(p=>p.date===d)||state.routines.some(r=>routineOccurs(r,d));ds.push(`<span class="${has?'has':''}">${faNum(pp.day)}</span>`)}return `<article class="year-month" data-open-month="${ms}"><h3>${new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long'}).format(fromISO(ms))}</h3><div class="month-stat">${faNum(cnt)} scheduled plans</div><div class="mini-month">${ds.join('')}</div></article>`}).join('')}
renderPlanner=function(){state.settings.plannerMode=state.settings.plannerMode||'week';$$('[data-plannermode]').forEach(b=>b.classList.toggle('selected',b.dataset.plannermode===state.settings.plannerMode));if(state.settings.plannerMode==='month')renderPlannerMonth();else if(state.settings.plannerMode==='year')renderPlannerYear();else renderPlannerWeek()}

quickPlan=function(date=today()){modal(`<h2>Quick plan</h2><p class="sub">One-off scheduled activity — reminders are managed separately.</p><form class="form" id="planForm"><label>Plan<input name="title" required autofocus placeholder="e.g. Go out"></label><div class="two"><label>Date<input type="date" name="date" value="${date}" required><span class="hint">${jalali(date)}</span></label><label>Start time <span class="hint">optional</span><input type="time" name="time"></label></div><div class="two"><label>Duration <span class="hint">optional, H:MM</span><input name="duration" placeholder="1:00"></label><label>Note <span class="hint">optional</span><input name="note"></label></div><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary">Add plan</button></div></form>`);$('#planForm').onsubmit=e=>{e.preventDefault();let x=new FormData(e.currentTarget),dur=parseDurationHM(x.get('duration'));state.plans.push({id:uid(),title:x.get('title').trim(),date:x.get('date'),time:x.get('time'),duration:dur,note:x.get('note').trim(),done:false});save();closeOverlay();renderAll();toast('Plan added')}}

function reminderForm(rem=null){
  const edit=!!rem, d=rem?.date||today();
  modal(`<h2>${edit?'Edit reminder':'New reminder'}</h2><p class="sub">A reminder is separate from Today plans and Jira issues.</p><form class="form" id="reminderForm"><label>Name<input name="title" required autofocus value="${esc(rem?.title||'')}" placeholder="e.g. Dentist appointment / Birthday"></label><label>Date<input type="date" name="date" required value="${d}"><span class="hint">${jalali(d)}</span></label><label>Time <span class="hint">optional</span><input type="time" name="time" value="${rem?.time||''}"></label><div class="form-actions">${edit?`<button type="button" class="danger" data-delete-reminder="${rem.id}">Delete</button>`:''}<button type="button" class="secondary" data-close>Cancel</button><button class="primary">${edit?'Save reminder':'Add reminder'}</button></div></form>`);
  $('#reminderForm').onsubmit=e=>{e.preventDefault();let x=new FormData(e.currentTarget),obj={title:x.get('title').trim(),date:x.get('date'),time:x.get('time'),notified:false};if(edit)Object.assign(rem,obj);else state.reminders.push({id:uid(),...obj});if('Notification'in window&&Notification.permission==='default')Notification.requestPermission().catch(()=>{});save();closeOverlay();renderAll();toast(edit?'Reminder updated':'Reminder added')};
}
function renderReminders(){
 const host=$('#reminderList');if(!host)return;const rows=[...state.reminders].sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
 host.innerHTML=rows.length?rows.map(r=>`<div class="reminder-row"><div class="reminder-mark">♢</div><div class="grow"><b>${esc(r.title)}</b><p>${weekdayFa(r.date)} · ${jalali(r.date)}${r.time?' · '+faNum(r.time):' · No fixed time'}</p></div><button class="secondary small" data-edit-reminder="${r.id}">Edit</button></div>`).join(''):empty('No reminders','Create simple date-based reminders here.');
 const n=$('#navReminders');if(n)n.textContent=state.reminders.filter(r=>r.date>=today()).length;
}

function routineCheckDialog(r,d){let checked=!!r.checks?.[d];if(checked){r.checks[d]=false;state.logs=state.logs.filter(l=>!(l.source==='routine'&&l.routineId===r.id&&l.date===d));save();renderAll();toast('Routine unchecked and its log removed');return}modal(`<h2>Complete routine</h2><p class="sub">${esc(r.title)} · ${weekdayFa(d)} ${jalali(d)}</p><form class="form" id="routineDoneForm"><label>Time spent <span class="hint">optional, H:MM — e.g. 0:45</span><input name="duration" placeholder="0:45"></label><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary">Complete</button></div></form>`);$('#routineDoneForm').onsubmit=e=>{e.preventDefault();let mins=parseDurationHM(new FormData(e.currentTarget).get('duration'));r.checks=r.checks||{};r.checks[d]=true;if(mins>0)state.logs.push({id:uid(),routineId:r.id,date:d,minutes:mins,note:r.title,source:'routine'});save();closeOverlay();renderAll();toast(mins?`Routine complete · ${fmtMin(mins)} logged`:'Routine complete')}}

function logStats(ls){let total=ls.reduce((a,l)=>a+Number(l.minutes||0),0),uniq=new Set(ls.map(l=>l.taskId||('r:'+l.routineId)).filter(Boolean)),activeDays=new Set(ls.map(l=>l.date)).size;$('#totalLogged').textContent=fmtMin(total);$('#entryCount').textContent=faNum(ls.length);$('#issueCount').textContent=faNum(uniq.size);$('#dailyAvg').textContent=activeDays?fmtMin(Math.round(total/activeDays)):'0m'}
const _renderLogsOld=renderLogs;renderLogs=function(){let {start,end}=logRange(),mode=state.settings.logMode||'week',ls=state.logs.filter(l=>l.date>=start&&l.date<=end);logStats(ls);if(mode==='month'){let s=findPersianMonthStart(logCursor),e=findPersianMonthEnd(logCursor);ls=state.logs.filter(l=>l.date>=s&&l.date<=e);logStats(ls);$('#logLabel').textContent=pMonthName(s);let gridStart=weekStart(s),days=Array.from({length:42},(_,i)=>addDays(gridStart,i)),cur=pParts(s);$('#timesheet').innerHTML=`<div class="log-month-calendar">${weekFa.map(x=>`<div class="log-month-head">${x}</div>`).join('')}${days.map(d=>{let pp=pParts(d),inside=pp.month===cur.month&&pp.year===cur.year,dl=ls.filter(l=>l.date===d),mins=dl.reduce((a,l)=>a+Number(l.minutes||0),0),r=dl.filter(l=>l.source==='routine').reduce((a,l)=>a+Number(l.minutes||0),0);return `<div class="log-day ${d===today()?'today':''}" style="${inside?'':'opacity:.3'}"><b>${faNum(pp.day)}</b><div class="daytotal">${mins?fmtMin(mins):'—'}</div><div class="daymeta">${r?`<span class="routine-log-dot"></span>${fmtMin(r)} routine`:dl.length?`${faNum(dl.length)} logs`:''}</div></div>`}).join('')}</div>`;renderLogActivity(ls);return}_renderLogsOld();if(mode==='week')addDailyTotals(ls)}
function addDailyTotals(ls){let ts=$('#timesheet .timesheet');if(!ts)return;let start=weekStart(logCursor),dates=Array.from({length:7},(_,i)=>addDays(start,i)),cells=dates.map(d=>{let m=ls.filter(l=>l.date===d).reduce((a,l)=>a+Number(l.minutes||0),0);return `<div class="ts-cell">${m?fmtMin(m):'—'}</div>`}).join(''),sum=ls.reduce((a,l)=>a+Number(l.minutes||0),0);ts.insertAdjacentHTML('beforeend',`<div class="ts-row daily-total" style="--cols:7"><div class="ts-cell issue">Daily total</div>${cells}<div class="ts-cell total">${fmtMin(sum)}</div></div>`)}
function renderLogActivity(ls){let sorted=[...ls].sort((a,b)=>(b.date+(b.start||'')).localeCompare(a.date+(a.start||'')));$('#logActivity').innerHTML=sorted.length?sorted.slice(0,30).map(l=>{let t=state.tasks.find(x=>x.id===l.taskId),r=state.routines.find(x=>x.id===l.routineId),isR=l.source==='routine';return `<div class="activity-row"><div><span class="${isR?'routine-log-dot':'task-log-dot'}"></span></div><div class="grow"><b>${esc(isR?(r?.title||l.note||'Routine'):(t?.title||'Work'))}</b><p>${isR?'Routine · ':'Task · '}${weekdayFa(l.date)} · ${jalali(l.date)}${l.note&&!isR?' · '+esc(l.note):''}</p></div><span class="log-duration">${fmtMin(l.minutes)}</span><button data-delete-log="${l.id}">×</button></div>`}).join(''):empty('No work logged in this period')}

const _renderTodayV10=renderToday;renderToday=function(){_renderTodayV10();renderWeeklyGoal();let d=today(),rs=state.routines.filter(r=>routineOccurs(r,d));$('#todayRoutines').innerHTML=rs.length?rs.map(r=>{let log=state.logs.find(l=>l.source==='routine'&&l.routineId===r.id&&l.date===d);return `<div class="routine-check"><button class="check ${r.checks?.[d]?'done':''}" data-rcheck="${r.id}" data-date="${d}">${r.checks?.[d]?'✓':''}</button><div class="grow"><b>${esc(r.title)}</b><p>${r.time?faNum(r.time):'No fixed time'}</p></div>${log?`<span class="routine-duration-badge">${fmtMin(log.minutes)} logged</span>`:''}</div>`}).join(''):empty('No routines today')}

function checkReminders(){let now=new Date(),d=today(),hh=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'),changed=false;state.reminders.filter(r=>r.date===d&&!r.notified).forEach(r=>{if(!r.time||hh>=r.time){try{if('Notification'in window&&Notification.permission==='granted')new Notification('GreenFlow reminder',{body:r.title})}catch{}r.notified=true;changed=true;toast(`Reminder: ${r.title}`)}});if(changed){save();renderReminders()}}
setInterval(checkReminders,30000);setTimeout(checkReminders,1200);

// Capture handlers override older generic handlers where behavior changed.
document.addEventListener('click',e=>{
 let el=e.target.closest('#focusStop');if(el){e.preventDefault();e.stopImmediatePropagation();focusStop(true);return}
 el=e.target.closest('#focusCancel');if(el){e.preventDefault();e.stopImmediatePropagation();focusStop(false);return}
 el=e.target.closest('[data-focus-issue]');if(el){e.preventDefault();e.stopImmediatePropagation();focusStartDialog(el.dataset.focusIssue);return}
 if(e.target.closest('#dailyFocusChoose')){e.preventDefault();e.stopImmediatePropagation();chooseDailyFocusV12();return}
 el=e.target.closest('[data-pick-focus]');if(el){e.preventDefault();e.stopImmediatePropagation();state.settings.dailyFocusTaskId=el.dataset.pickFocus;save();closeOverlay();renderToday();toast('Daily focus set');return}
 el=e.target.closest('[data-launch-min]');if(el){e.preventDefault();e.stopImmediatePropagation();let i=$('#focusLaunchForm input[name="minutes"]');if(i)i.value=el.dataset.launchMin;return}
 if(e.target.closest('#weeklyGoalEdit')){e.preventDefault();e.stopImmediatePropagation();weeklyGoalDialog();return}
 el=e.target.closest('[data-rcheck]');if(el){e.preventDefault();e.stopImmediatePropagation();let r=state.routines.find(x=>x.id===el.dataset.rcheck);if(r)routineCheckDialog(r,el.dataset.date);return}
 el=e.target.closest('[data-plannermode]');if(el){e.preventDefault();e.stopImmediatePropagation();state.settings.plannerMode=el.dataset.plannermode;save();renderPlanner();return}
 el=e.target.closest('[data-plannermove]');if(el){e.preventDefault();e.stopImmediatePropagation();let n=Number(el.dataset.plannermove),m=state.settings.plannerMode||'week';if(m==='week')weekCursor=addDays(weekCursor,n*7);else if(m==='month')weekCursor=movePersianMonth(weekCursor,n);else{let months=persianYearMonths(weekCursor);weekCursor=n>0?addDays(findPersianMonthEnd(months[11]),1):addDays(findPersianMonthStart(months[0]),-1)}renderPlanner();return}
 if(e.target.closest('[data-plannercurrent]')){e.preventDefault();e.stopImmediatePropagation();weekCursor=today();renderPlanner();return}
 el=e.target.closest('[data-open-month]');if(el){e.preventDefault();e.stopImmediatePropagation();weekCursor=el.dataset.openMonth;state.settings.plannerMode='month';save();renderPlanner();return}
 el=e.target.closest('[data-caldate]');if(el){e.preventDefault();e.stopImmediatePropagation();quickPlan(el.dataset.caldate);return}
},true);

window.addEventListener('error',e=>{console.error(e.error||e.message)});applyTheme();handleDayRollover(true);openView('today');

// ===== v11: permanent archive + detailed work-log history =====
function archiveTask(id){
  const t=state.tasks.find(x=>x.id===id); if(!t||t.status==='archived') return;
  t.archivedFrom=t.status; t.status='archived'; t.archivedAt=today();
  if(state.settings.dailyFocusTaskId===id) state.settings.dailyFocusTaskId='';
  const f=focusData(); if(f.taskId===id && !f.running) f.taskId='';
  save(); closeOverlay(); renderAll(); toast('Issue archived · history preserved');
}
function restoreTask(id){
  const t=state.tasks.find(x=>x.id===id); if(!t||t.status!=='archived') return;
  t.status=['backlog','todo','doing','done'].includes(t.archivedFrom)?t.archivedFrom:'backlog';
  delete t.archivedAt; delete t.archivedFrom;
  save(); renderAll(); openTask(id); toast('Issue restored');
}
function renderArchive(){
  const host=$('#archiveList'); if(!host)return;
  const q=($('#archiveSearch')?.value||'').trim().toLowerCase(), sf=$('#archiveStatusFilter')?.value||'all';
  const rows=state.tasks.filter(t=>t.status==='archived'&&(!q||(t.title+' '+t.key+' '+(t.label||'')+' '+(t.description||'')).toLowerCase().includes(q))&&(sf==='all'||t.archivedFrom===sf));
  host.innerHTML=rows.length?rows.map(t=>`<div class="archive-item archive-grid" data-open-task="${t.id}"><span><span class="key">${esc(t.key)}</span><b>${esc(t.title)}</b><small>${esc(t.label||'No label')}</small></span><span class="status-chip ${t.archivedFrom||'done'}">${(t.archivedFrom||'done').toUpperCase()}</span><span>${fmtMin(loggedMin(t.id))}</span><span>${t.archivedAt?jalali(t.archivedAt):'—'}</span><span><button class="movebtn" data-restore-task="${t.id}">Restore</button></span></div>`).join(''):empty('Archive is empty','Archive any issue from its detail panel. Nothing is deleted.');
}
const _renderAllV11=renderAll; renderAll=function(){_renderAllV11();renderArchive();};
const _renderNavV11=renderNav; renderNav=function(){_renderNavV11();const a=$('#navArchive');if(a)a.textContent=state.tasks.filter(t=>t.status==='archived').length;};
const _openViewV11=openView; openView=function(id){_openViewV11(id);if(id==='archive')renderArchive();};

function logSourceLabel(l){return l.source==='routine'?'Routine':l.source==='focus' || l.note==='Focus session'?'Focus session':'Manual work';}
function editLogForm(logId,returnTaskId=''){
  const l=state.logs.find(x=>x.id===logId); if(!l)return;
  if(l.source==='routine'){toast('Routine logs are edited from the routine completion');return;}
  modal(`<h2>Edit work log</h2><p class="sub">Update the historical record without changing the issue itself.</p><form class="form" id="editLogForm"><label>Date<input type="date" name="date" value="${l.date}" required><span class="hint">${jalali(l.date)}</span></label><label>Duration <span class="hint">H:MM — e.g. 1:40</span><input name="duration" value="${Math.floor(Number(l.minutes||0)/60)}:${String(Number(l.minutes||0)%60).padStart(2,'0')}" required></label><div class="two"><label>From <span class="hint">optional</span><input type="time" name="start" value="${l.start||''}"></label><label>To <span class="hint">optional</span><input type="time" name="end" value="${l.end||''}"></label></div><label>Work description <span class="hint">optional</span><textarea name="note" placeholder="What exactly was done?">${esc(l.note||'')}</textarea></label><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary">Save log</button></div></form>`);
  $('#editLogForm').onsubmit=e=>{e.preventDefault();const x=new FormData(e.currentTarget),mins=parseDurationHM(x.get('duration'));if(mins<=0){toast('Enter a valid duration');return}Object.assign(l,{date:x.get('date'),minutes:mins,start:x.get('start'),end:x.get('end'),note:x.get('note').trim()});save();closeOverlay();renderAll();if(returnTaskId)openTask(returnTaskId);toast('Work log updated')};
}
openTask=function(id){
  const t=state.tasks.find(x=>x.id===id);if(!t)return;const archived=t.status==='archived',logs=taskLogs(id).sort((a,b)=>(b.date+(b.start||'')).localeCompare(a.date+(a.start||''))),lm=loggedMin(id),sub=t.subtasks||[],displayStatus=archived?(t.archivedFrom||'done'):t.status;
  $('#overlayRoot').innerHTML=`<div class="drawer-shade"><aside class="drawer"><div class="drawer-head"><span class="typeicon">✓</span><span class="key">${esc(t.key)}</span>${archived?'<span class="archive-badge">ARCHIVED</span>':''}<button class="drawer-close" data-close>×</button></div><div class="drawer-body"><div><h2>${esc(t.title)}</h2><div class="drawer-actions">${archived?`<button class="primary" data-restore-task="${t.id}">↩ Restore</button>`:`<button class="primary" data-task-log="${t.id}">◷ Log work</button><button class="secondary" data-edit-task="${t.id}">Edit</button><button class="secondary ${state.settings.dailyFocusTaskId===t.id?'focus-selected':''}" data-set-daily-focus="${t.id}">${state.settings.dailyFocusTaskId===t.id?'✓ Daily focus':'Set as Daily Focus'}</button><button class="secondary archive-action" data-archive-task="${t.id}">Archive</button>`}</div><div class="section-title">Description</div><div class="desc ${t.description?'':'emptydesc'}">${t.description?esc(t.description):'No description added.'}</div><div class="section-title">Subtasks</div><div id="subtaskList">${sub.length?sub.map(s=>`<label class="subtask"><input type="checkbox" data-subcheck="${t.id}" data-subid="${s.id}" ${s.done?'checked':''} ${archived?'disabled':''}><span>${esc(s.title)}</span></label>`).join(''):'<div class="empty">No subtasks</div>'}</div>${archived?'':`<div class="add-sub"><input id="newSubInput" placeholder="Add a subtask"><button data-add-sub="${t.id}">＋</button></div>`}<div class="section-title worklog-title"><span>Work log history</span><span>${logs.length} ${logs.length===1?'entry':'entries'} · ${fmtMin(lm)}</span></div><div class="worklog-history">${logs.length?logs.map(l=>`<div class="worklog detailed"><div class="wl-icon">◷</div><div class="worklog-main"><div class="worklog-meta"><b>${weekdayFa(l.date)} · ${jalali(l.date)}</b><span class="log-source ${l.source==='routine'?'routine-source':''}">${logSourceLabel(l)}</span></div><p>${l.start?`From ${faNum(l.start)}${l.end?' to '+faNum(l.end):''}`:'No clock time'} · <strong>${fmtMin(l.minutes)}</strong></p><div class="worklog-comment ${l.note?'':'muted'}">${l.note?esc(l.note):'No work description / comment.'}</div></div><div class="worklog-tools"><strong>${fmtMin(l.minutes)}</strong>${l.source==='routine'?'':`<button title="Edit log" data-edit-log="${l.id}" data-return-task="${t.id}">Edit</button>`}<button title="Delete log" class="log-delete" data-task-delete-log="${l.id}" data-return-task="${t.id}">Delete</button></div></div>`).join(''):empty('No work logged yet','Future logs and comments will appear here as a permanent history.')}</div></div><aside><div class="side-field"><span>Status</span><b class="status-chip ${displayStatus}">${archived?'ARCHIVED · '+displayStatus.toUpperCase():(displayStatus==='doing'?'IN PROGRESS':displayStatus==='todo'?'TO DO':displayStatus==='backlog'?'BACKLOG':'DONE')}</b></div><div class="side-field"><span>Priority</span><b class="priority-chip ${t.priority.toLowerCase()}">${esc(t.priority)}</b></div><div class="side-field"><span>Label</span><b>${esc(t.label||'None')}</b></div><div class="side-field"><span>Original estimate</span><b>${t.estimate?fmtMin(t.estimate):'Not set'}</b></div><div class="side-field"><span>Time logged</span><b>${fmtMin(lm)}</b></div><div class="side-field"><span>Remaining</span><b>${t.estimate?fmtMin(Math.max(0,t.estimate-lm)):'—'}</b></div><div class="side-field"><span>Due date</span><b>${t.due?jalali(t.due):'Not set'}</b></div>${archived?`<div class="side-field"><span>Archived on</span><b>${t.archivedAt?jalali(t.archivedAt):'—'}</b></div>`:''}</aside></div></aside></div>`;
}

document.addEventListener('input',e=>{if(e.target.id==='archiveSearch')renderArchive()});
document.addEventListener('change',e=>{if(e.target.id==='archiveStatusFilter')renderArchive()});
document.addEventListener('click',e=>{
  let el=e.target.closest('[data-archive-task]');if(el){e.preventDefault();e.stopImmediatePropagation();if(confirm('Archive this issue? Its description, subtasks and all work logs will be preserved.'))archiveTask(el.dataset.archiveTask);return}
  el=e.target.closest('[data-restore-task]');if(el){e.preventDefault();e.stopImmediatePropagation();restoreTask(el.dataset.restoreTask);return}
  el=e.target.closest('[data-edit-log]');if(el){e.preventDefault();e.stopImmediatePropagation();editLogForm(el.dataset.editLog,el.dataset.returnTask||'');return}
  el=e.target.closest('[data-task-delete-log]');if(el){e.preventDefault();e.stopImmediatePropagation();if(confirm('Delete this work-log entry?')){const ret=el.dataset.returnTask;state.logs=state.logs.filter(x=>x.id!==el.dataset.taskDeleteLog);save();renderAll();openTask(ret);toast('Work log deleted')}return}
},true);

// ===== v12: separate reminders + daily goal + robust Daily Focus chooser =====
const _renderAllV12=renderAll;renderAll=function(){_renderAllV12();renderReminders();renderWeeklyGoal();};
const _openViewV12=openView;openView=function(id){_openViewV12(id);if(id==='reminders')renderReminders();};
function chooseDailyFocusV12(){
 const active=state.tasks.filter(t=>['todo','doing'].includes(t.status));
 modal(`<h2>Change Daily Focus</h2><p class="sub">Choose one active issue as today’s primary focus.</p><div class="focus-picker">${active.length?active.map(t=>`<button type="button" class="focus-pick-card ${state.settings.dailyFocusTaskId===t.id?'selected':''}" data-pick-focus-v12="${t.id}"><span class="key">${esc(t.key)}</span><span><b>${esc(t.title)}</b><small>${esc(t.priority)}${t.label?' · '+esc(t.label):''}</small></span>${state.settings.dailyFocusTaskId===t.id?'<i>Current</i>':''}</button>`).join(''):empty('No active issues','Move an issue to To Do or In Progress first.')}</div><div class="form-actions"><button type="button" class="secondary" data-close>Cancel</button></div>`);
}
document.addEventListener('click',e=>{
 if(e.target.closest('#dailyFocusChoose')){e.preventDefault();e.stopImmediatePropagation();chooseDailyFocusV12();return}
 let el=e.target.closest('[data-pick-focus-v12]');if(el){e.preventDefault();e.stopImmediatePropagation();state.settings.dailyFocusTaskId=el.dataset.pickFocusV12;save();closeOverlay();renderAll();toast('Daily focus changed');return}
 el=e.target.closest('[data-action="new-reminder"]');if(el){e.preventDefault();e.stopImmediatePropagation();reminderForm();return}
 el=e.target.closest('[data-edit-reminder]');if(el){e.preventDefault();e.stopImmediatePropagation();let r=state.reminders.find(x=>x.id===el.dataset.editReminder);if(r)reminderForm(r);return}
 el=e.target.closest('[data-delete-reminder]');if(el){e.preventDefault();e.stopImmediatePropagation();if(confirm('Delete this reminder?')){state.reminders=state.reminders.filter(x=>x.id!==el.dataset.deleteReminder);save();closeOverlay();renderAll();toast('Reminder deleted')}return}
},true);


// ===== v13: Persian-only date UI, robust Daily Focus actions, safe backup migration =====
function enDigits(v){return String(v??'').replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c))}
function jalaliAscii(isoDate){if(!isoDate)return '';let p=pParts(isoDate);return `${p.year}/${String(p.month).padStart(2,'0')}/${String(p.day).padStart(2,'0')}`}
function jalaliToISO(value){
  let v=enDigits(value).trim().replace(/[.\-]/g,'/').replace(/\s+/g,'');
  let m=v.match(/^(\d{3,4})\/(\d{1,2})\/(\d{1,2})$/); if(!m)return '';
  let jy=Number(m[1]),jm=Number(m[2]),jd=Number(m[3]); if(jm<1||jm>12||jd<1||jd>31)return '';
  let start=new Date(jy+621,1,15,12,0,0); // safely before Nowruz for the target Persian year
  for(let i=0;i<430;i++){let d=new Date(start);d.setDate(start.getDate()+i);let is=iso(d),p=pParts(is);if(p.year===jy&&p.month===jm&&p.day===jd)return is}
  return '';
}
const _modalV13=modal;
modal=function(html){
  _modalV13(html);
  $$('#overlayRoot input[type="date"]').forEach(inp=>{
    let isoVal=inp.value||''; inp.type='text'; inp.classList.add('jalali-date-input'); inp.dataset.jalaliDate='1'; inp.placeholder='۱۴۰۵/۰۷/۰۷'; inp.inputMode='numeric'; inp.dir='ltr'; inp.value=isoVal?faNum(jalaliAscii(isoVal)):'';
  });
};
document.addEventListener('submit',e=>{
  let bad=false;
  $$('input[data-jalali-date="1"]',e.target).forEach(inp=>{let raw=inp.value.trim();if(!raw&&!inp.required){inp.value='';return}let isoVal=jalaliToISO(raw);if(!isoVal){bad=true;inp.setCustomValidity('تاریخ شمسی را به صورت ۱۴۰۵/۰۷/۰۷ وارد کنید');inp.reportValidity()}else{inp.setCustomValidity('');inp.value=isoVal}});
  if(bad){e.preventDefault();e.stopImmediatePropagation()}
},true);

function bindDailyFocusActionsV13(){
  const choose=$('#dailyFocusChoose'),open=$('#dailyFocusOpen'),start=$('#dailyFocusStart');
  if(choose)choose.onclick=e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();chooseDailyFocusV12()};
  if(open)open.onclick=e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();let id=state.settings.dailyFocusTaskId;if(id)openTask(id)};
  if(start)start.onclick=e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();let id=state.settings.dailyFocusTaskId;if(id)focusStartDialog(id)};
}
const _renderTodayV13=renderToday;
renderToday=function(){_renderTodayV13();bindDailyFocusActionsV13();renderWeeklyGoal()};

// Restore old GreenFlow backups without replacing user content with demo/default content.
importBackup=function(file){
 let reader=new FileReader(); reader.onload=()=>{try{
   let data=JSON.parse(reader.result),raw=data&&data.state?data.state:data;
   if(!raw||!Array.isArray(raw.tasks))throw new Error('Invalid backup');
   let incoming=JSON.parse(JSON.stringify(raw));
   incoming=normalizeState(incoming); if(!incoming)throw new Error('Invalid backup');
   // Newer fields are defaults only when absent; user data from the backup is preserved verbatim.
   incoming.reminders=Array.isArray(incoming.reminders)?incoming.reminders:[];
   incoming.settings=incoming.settings||{};
   if(incoming.settings.dailyGoalMinutes==null)incoming.settings.dailyGoalMinutes=420;
   state=incoming; weekCursor=today(); logCursor=today(); save(); applyTheme(); renderAll(); openView('today');
   toast(`Backup restored · ${state.tasks.length} issues · ${state.routines.length} routines · ${state.logs.length} logs`);
 }catch(err){console.error(err);toast('Invalid or unsupported backup file')}}; reader.readAsText(file)
};

renderAll();


// ===== v14: unified Persian date dropdown + hour/minute dropdown pickers =====
(function(){
  const monthNames=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  function opt(v,label,sel){return `<option value="${v}" ${String(v)===String(sel)?'selected':''}>${label}</option>`}
  function syncDatePicker(box){
    const y=Number(box.querySelector('[data-jy]').value),m=Number(box.querySelector('[data-jm]').value),dsel=box.querySelector('[data-jd]'),hidden=box.querySelector('input[type="hidden"]');
    let old=Number(dsel.value)||1,valid=[];for(let d=1;d<=31;d++){let is=jalaliToISO(`${y}/${m}/${d}`);if(is)valid.push({d,is})}
    dsel.innerHTML=valid.map(x=>opt(x.d,faNum(x.d),Math.min(old,valid.length))).join('');
    let d=Number(dsel.value)||1;hidden.value=jalaliToISO(`${y}/${m}/${d}`)||'';
    const preview=box.querySelector('.picker-preview');if(preview&&hidden.value)preview.textContent=`${weekdayFa(hidden.value)} · ${jalali(hidden.value)}`;
  }
  function makeDatePicker(inp){
    const name=inp.name,required=inp.required,raw=inp.value||'',isoVal=raw&&/^\d{4}-\d{2}-\d{2}$/.test(raw)?raw:(raw?jalaliToISO(raw):'');
    let base=isoVal||today(),p=pParts(base),cur=pParts(today()),years=[];for(let y=cur.year-5;y<=cur.year+10;y++)years.push(y);if(!years.includes(p.year))years.push(p.year);years.sort((a,b)=>a-b);
    const box=document.createElement('div');box.className='jalali-dropdown-picker';box.dataset.required=required?'1':'0';
    box.innerHTML=`<input type="hidden" name="${esc(name)}" value="${isoVal}"><div class="picker-selects" dir="rtl"><select data-jy aria-label="سال">${years.map(y=>opt(y,faNum(y),p.year)).join('')}</select><select data-jm aria-label="ماه">${monthNames.map((n,i)=>opt(i+1,n,p.month)).join('')}</select><select data-jd aria-label="روز"></select></div><div class="picker-foot"><span class="picker-preview"></span>${required?'':`<button type="button" class="picker-clear">Clear</button>`}</div>`;
    inp.replaceWith(box);syncDatePicker(box);if(!isoVal&&!required){box.querySelector('input[type="hidden"]').value='';box.querySelector('.picker-preview').textContent='No date selected'}
    box.querySelectorAll('select').forEach(s=>s.addEventListener('change',()=>syncDatePicker(box)));
    box.querySelector('.picker-clear')?.addEventListener('click',()=>{box.querySelector('input[type="hidden"]').value='';box.querySelector('.picker-preview').textContent='No date selected'});
  }
  function makeTimePicker(inp){
    const name=inp.name,required=inp.required,val=inp.value||'',parts=val?val.split(':'):['',''];
    const box=document.createElement('div');box.className='time-dropdown-picker';box.dataset.required=required?'1':'0';
    let hours=Array.from({length:24},(_,i)=>String(i).padStart(2,'0')),mins=Array.from({length:60},(_,i)=>String(i).padStart(2,'0'));
    box.innerHTML=`<input type="hidden" name="${esc(name)}" value="${esc(val)}"><div class="time-selects"><select data-hour aria-label="Hour"><option value="">Hour</option>${hours.map(h=>opt(h,faNum(h),parts[0])).join('')}</select><span>:</span><select data-minute aria-label="Minute"><option value="">Min</option>${mins.map(m=>opt(m,faNum(m),parts[1])).join('')}</select>${required?'':`<button type="button" class="time-clear" title="Clear time">×</button>`}</div></div>`;
    inp.replaceWith(box);let h=box.querySelector('[data-hour]'),m=box.querySelector('[data-minute]'),hidden=box.querySelector('input[type="hidden"]');
    const sync=()=>{if(h.value!==''&&m.value!=='')hidden.value=`${h.value}:${m.value}`;else hidden.value=''};h.addEventListener('change',sync);m.addEventListener('change',sync);box.querySelector('.time-clear')?.addEventListener('click',()=>{h.value='';m.value='';sync()});
  }
  function enhancePickers(root=document){
    root.querySelectorAll('input[data-jalali-date="1"]').forEach(makeDatePicker);
    root.querySelectorAll('input[type="date"]').forEach(makeDatePicker);
    root.querySelectorAll('input[type="time"]').forEach(makeTimePicker);
  }
  const previousModal=modal;
  modal=function(html){previousModal(html);enhancePickers($('#overlayRoot'))};
  document.addEventListener('submit',e=>{
    let invalid=false;
    e.target.querySelectorAll('.jalali-dropdown-picker[data-required="1"],.time-dropdown-picker[data-required="1"]').forEach(box=>{if(!box.querySelector('input[type="hidden"]').value){invalid=true;box.classList.add('picker-invalid')}else box.classList.remove('picker-invalid')});
    if(invalid){e.preventDefault();e.stopImmediatePropagation();toast('Please select the required date/time')}
  },true);
})();


// ===== v15 final audit fixes =====
// Today Active Tasks must show only work logged today, not historical totals.
function todayIssueRow(t){
  const d=today(), lm=state.logs.filter(l=>l.taskId===t.id&&l.date===d).reduce((a,l)=>a+Number(l.minutes||0),0);
  return `<div class="issue-row" data-open-task="${t.id}"><span class="typeicon">✓</span><div class="issue-summary"><b>${esc(t.title)}</b><small>${esc(t.key)} · ${esc(t.label||'Personal')}</small></div><span class="status-chip ${t.status}">${t.status==='doing'?'IN PROGRESS':'TO DO'}</span><span class="priority-chip ${t.priority.toLowerCase()}">${esc(t.priority)}</span><span class="estimate today-log">${lm?fmtMin(lm):'0m'} today</span></div>`;
}
const _renderTodayV15=renderToday;
renderToday=function(){
  _renderTodayV15();
  const active=state.tasks.filter(t=>['todo','doing'].includes(t.status));
  $('#todayActive').innerHTML=active.length?active.map(todayIssueRow).join(''):empty('No active issues','Move a backlog issue into Active when you are ready.');
};

// Logged Month/Year navigation and aggregation use Persian calendar boundaries.
function persianYearBounds(isoDate){
  const pp=pParts(isoDate); let probe=isoDate;
  // Move to first day of current Persian month then walk months back to Farvardin.
  let start=findPersianMonthStart(probe);
  for(let i=pp.month;i>1;i--) start=movePersianMonth(start,-1);
  let months=[start]; for(let i=1;i<12;i++) months.push(movePersianMonth(months[i-1],1));
  return {start:months[0],end:findPersianMonthEnd(months[11]),months};
}
function renderLogYearV15(){
  const {start,end,months}=persianYearBounds(logCursor), py=pParts(start).year;
  const ls=state.logs.filter(l=>l.date>=start&&l.date<=end); logStats(ls); $('#logLabel').textContent=faNum(py);
  $('#timesheet').innerHTML=`<div class="log-year-grid">${months.map(ms=>{const me=findPersianMonthEnd(ms),ml=ls.filter(l=>l.date>=ms&&l.date<=me),mins=ml.reduce((a,l)=>a+Number(l.minutes||0),0),days=new Set(ml.map(l=>l.date)).size;return `<article class="log-year-month" data-log-open-month="${ms}"><span>${new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long'}).format(fromISO(ms))}</span><strong>${mins?fmtMin(mins):'0m'}</strong><small>${faNum(days)} active days · ${faNum(ml.length)} logs</small></article>`}).join('')}</div>`;
  renderLogActivity(ls);
}
const _renderLogsV15=renderLogs;
renderLogs=function(){ if((state.settings.logMode||'week')==='year') return renderLogYearV15(); return _renderLogsV15(); };

document.addEventListener('click',e=>{
  let el=e.target.closest('[data-log-open-month]'); if(el){e.preventDefault();e.stopImmediatePropagation();logCursor=el.dataset.logOpenMonth;state.settings.logMode='month';save();$$('[data-logmode]').forEach(b=>b.classList.toggle('selected',b.dataset.logmode==='month'));renderLogs();return}
  el=e.target.closest('[data-logmove]'); if(el&&(state.settings.logMode||'week')==='year'){e.preventDefault();e.stopImmediatePropagation();let n=Number(el.dataset.logmove),b=persianYearBounds(logCursor);logCursor=n>0?addDays(b.end,1):addDays(b.start,-1);renderLogs();return}
},true);

// Re-render once after final overrides are installed.
renderAll();

// ===== v19 final visual Persian date + time picker =====
(function(){
  const pMonths=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  const pWeek=['ش','ی','د','س','چ','پ','ج'];
  let layer=null;
  function closePicker(){ if(layer){ layer.remove(); layer=null; } }
  function fmtJ(iso){ if(!iso)return ''; const p=pParts(iso); return `${faNum(p.day)} ${pMonths[p.month-1]} ${faNum(p.year)}`; }
  function monthDays(y,m){ const out=[]; for(let d=1;d<=31;d++){ const iso=jalaliToISO(`${y}/${m}/${d}`); if(iso) out.push({d,iso}); } return out; }
  function monthOffset(firstIso){ return ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'].indexOf(weekdayFa(firstIso)); }
  function shell(kind){
    closePicker(); layer=document.createElement('div'); layer.className='picker-modal-layer';
    layer.innerHTML=`<div class="picker-dialog ${kind}" role="dialog" aria-modal="true"></div>`;
    document.body.appendChild(layer);
    layer.addEventListener('mousedown',e=>{ if(e.target===layer) closePicker(); });
    return layer.firstElementChild;
  }
  function updateDateBox(box){ const h=box.querySelector('input[type="hidden"]'),v=box.querySelector('.vp-value'); v.textContent=h.value?fmtJ(h.value):'Select date'; v.classList.toggle('vp-placeholder',!h.value); }
  function openCalendar(box){
    const hidden=box.querySelector('input[type="hidden"]');
    let pending=hidden.value||today(), pp=pParts(pending), cy=pp.year, cm=pp.month;
    const dlg=shell('date-picker-dialog');
    function draw(){
      const ds=monthDays(cy,cm), off=monthOffset(ds[0].iso), t=today();
      dlg.innerHTML=`<div class="picker-head"><div><small>Select date</small><strong>${pending?fmtJ(pending):'No date selected'}</strong></div><button type="button" class="picker-x" data-picker-cancel aria-label="Close">×</button></div>
      <div class="cal-nav"><button type="button" data-cal-prev aria-label="Previous month">‹</button><div class="cal-title">${pMonths[cm-1]} ${faNum(cy)}</div><button type="button" data-cal-next aria-label="Next month">›</button></div>
      <div class="cal-week">${pWeek.map(x=>`<span>${x}</span>`).join('')}</div>
      <div class="cal-grid">${Array.from({length:off},()=>'<span class="cal-day blank"></span>').join('')}${ds.map(x=>`<button type="button" class="cal-day ${x.iso===pending?'selected':''} ${x.iso===t?'today':''}" data-cal-day="${x.iso}">${faNum(x.d)}</button>`).join('')}</div>
      <div class="picker-actions"><div class="picker-actions-left"><button type="button" class="picker-link" data-cal-today>Today</button>${box.dataset.required==='1'?'':`<button type="button" class="picker-link danger-lite" data-cal-clear>Clear</button>`}</div><div class="picker-actions-right"><button type="button" class="secondary" data-picker-cancel>Cancel</button><button type="button" class="primary" data-cal-select>Select</button></div></div>`;
      dlg.querySelector('[data-cal-prev]').onclick=()=>{ cm--; if(cm<1){cm=12;cy--;} draw(); };
      dlg.querySelector('[data-cal-next]').onclick=()=>{ cm++; if(cm>12){cm=1;cy++;} draw(); };
      dlg.querySelectorAll('[data-cal-day]').forEach(b=>b.onclick=()=>{ pending=b.dataset.calDay; const q=pParts(pending);cy=q.year;cm=q.month;draw(); });
      dlg.querySelector('[data-cal-today]').onclick=()=>{ pending=today(); const q=pParts(pending);cy=q.year;cm=q.month;draw(); };
      dlg.querySelector('[data-cal-clear]')?.addEventListener('click',()=>{ pending=''; draw(); });
      dlg.querySelectorAll('[data-picker-cancel]').forEach(b=>b.onclick=closePicker);
      dlg.querySelector('[data-cal-select]').onclick=()=>{ if(box.dataset.required==='1'&&!pending){toast('Please select a date');return;} hidden.value=pending;updateDateBox(box);closePicker(); };
    }
    draw();
  }
  function visualDate(old){
    const hidden=old.querySelector('input[type="hidden"]'); if(!hidden)return;
    const box=document.createElement('div'); box.className='visual-picker visual-date-picker'; box.dataset.required=old.dataset.required||'0';
    box.innerHTML=`<input type="hidden" name="${esc(hidden.name)}" value="${esc(hidden.value)}"><button type="button" class="visual-picker-trigger"><span class="vp-value"></span><span class="vp-icon">▣</span></button>`;
    old.replaceWith(box); updateDateBox(box); box.querySelector('.visual-picker-trigger').onclick=()=>openCalendar(box);
  }
  function updateTimeBox(box){ const h=box.querySelector('input[type="hidden"]'),v=box.querySelector('.vp-value'); v.textContent=h.value?faNum(h.value):'Select time'; v.classList.toggle('vp-placeholder',!h.value); }
  function openTime(box){
    const hidden=box.querySelector('input[type="hidden"]'), parts=(hidden.value||'09:00').split(':');
    let hour=Number(parts[0]||9), minute=Number(parts[1]||0), cleared=false;
    const dlg=shell('time-picker-dialog');
    dlg.innerHTML=`<div class="picker-head"><div><small>Select time</small><strong data-time-preview>${faNum(String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0'))}</strong></div><button type="button" class="picker-x" data-picker-cancel>×</button></div>
      <div class="wheel-time"><div class="wheel-col" data-wheel-h>${Array.from({length:24},(_,i)=>`<button type="button" class="wheel-item ${i===hour?'active':''}" data-v="${i}">${faNum(String(i).padStart(2,'0'))}</button>`).join('')}</div><div class="wheel-sep">:</div><div class="wheel-col" data-wheel-m>${Array.from({length:60},(_,i)=>`<button type="button" class="wheel-item ${i===minute?'active':''}" data-v="${i}">${faNum(String(i).padStart(2,'0'))}</button>`).join('')}</div></div>
      <div class="picker-actions"><div>${box.dataset.required==='1'?'':`<button type="button" class="picker-link danger-lite" data-time-clear>Clear</button>`}</div><div class="picker-actions-right"><button type="button" class="secondary" data-picker-cancel>Cancel</button><button type="button" class="primary" data-time-select>Select</button></div></div>`;
    const preview=()=>{dlg.querySelector('[data-time-preview]').textContent=cleared?'No time selected':faNum(`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`)};
    const bind=(col,type)=>{ const items=[...col.querySelectorAll('.wheel-item')]; const set=v=>{cleared=false;if(type==='h')hour=v;else minute=v;items.forEach(x=>x.classList.toggle('active',Number(x.dataset.v)===v));preview();}; items.forEach(x=>x.onclick=()=>{set(Number(x.dataset.v));x.scrollIntoView({block:'center',behavior:'smooth'});}); setTimeout(()=>items.find(x=>x.classList.contains('active'))?.scrollIntoView({block:'center'}),0); };
    bind(dlg.querySelector('[data-wheel-h]'),'h'); bind(dlg.querySelector('[data-wheel-m]'),'m');
    dlg.querySelector('[data-time-clear]')?.addEventListener('click',()=>{cleared=true;preview();});
    dlg.querySelectorAll('[data-picker-cancel]').forEach(b=>b.onclick=closePicker);
    dlg.querySelector('[data-time-select]').onclick=()=>{ if(box.dataset.required==='1'&&cleared){toast('Please select a time');return;} hidden.value=cleared?'':`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;updateTimeBox(box);closePicker(); };
  }
  function visualTime(old){
    const hidden=old.querySelector('input[type="hidden"]'); if(!hidden)return;
    const box=document.createElement('div'); box.className='visual-picker visual-time-picker'; box.dataset.required=old.dataset.required||'0';
    box.innerHTML=`<input type="hidden" name="${esc(hidden.name)}" value="${esc(hidden.value)}"><button type="button" class="visual-picker-trigger"><span class="vp-value"></span><span class="vp-icon">◷</span></button>`;
    old.replaceWith(box);updateTimeBox(box);box.querySelector('.visual-picker-trigger').onclick=()=>openTime(box);
  }
  function upgrade(root){ root.querySelectorAll('.jalali-dropdown-picker').forEach(visualDate); root.querySelectorAll('.time-dropdown-picker').forEach(visualTime); }
  const modalV15=modal; modal=function(html){ modalV15(html); upgrade($('#overlayRoot')); };
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&layer)closePicker();});
})();


// ===== v17 interaction hardening =====
// The decorative hero layer must never intercept pointer events (CSS also enforces this).
document.addEventListener('click', function(e){
  const choose=e.target.closest('#dailyFocusChoose');
  if(choose){ e.preventDefault(); e.stopImmediatePropagation(); chooseDailyFocusV12(); return; }
  const open=e.target.closest('#dailyFocusOpen');
  if(open){ e.preventDefault(); e.stopImmediatePropagation(); const id=state.settings.dailyFocusTaskId; if(id) openTask(id); return; }
  const start=e.target.closest('#dailyFocusStart');
  if(start){ e.preventDefault(); e.stopImmediatePropagation(); const id=state.settings.dailyFocusTaskId; if(id) focusStartDialog(id); return; }
}, true);

})();

// PWA shell registration. App data remains in localStorage for this browser/origin.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}


// ===== v20: editable plans + performance pass =====
// Cache Persian calendar parsing. Calendar conversion is used heavily by the visual picker.
const _persianPartsFormatterV20 = new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric'});
const _pPartsCacheV20 = new Map();
pParts = function(d){
  if(_pPartsCacheV20.has(d)) return _pPartsCacheV20.get(d);
  const o={};
  _persianPartsFormatterV20.formatToParts(fromISO(d)).forEach(p=>{if(p.type==='year'||p.type==='month'||p.type==='day')o[p.type]=Number(p.value)});
  _pPartsCacheV20.set(d,o);
  if(_pPartsCacheV20.size>1800){const k=_pPartsCacheV20.keys().next().value;_pPartsCacheV20.delete(k)}
  return o;
};
const _jyMapsV20 = new Map();
function _buildJYearMapV20(jy){
  if(_jyMapsV20.has(jy)) return _jyMapsV20.get(jy);
  const map=new Map();
  // Persian New Year is always around March 20/21. A small safe window avoids the old 430-day scan per date.
  let d=new Date(jy+621,2,15,12,0,0);
  for(let i=0;i<375;i++){
    const is=iso(d),p=pParts(is);
    if(p.year===jy) map.set(`${p.month}/${p.day}`,is);
    else if(p.year>jy&&map.size) break;
    d.setDate(d.getDate()+1);
  }
  _jyMapsV20.set(jy,map);
  if(_jyMapsV20.size>8){const k=_jyMapsV20.keys().next().value;_jyMapsV20.delete(k)}
  return map;
}
jalaliToISO = function(value){
  const v=enDigits(value).trim().replace(/[.\-]/g,'/').replace(/\s+/g,'');
  const m=v.match(/^(\d{3,4})\/(\d{1,2})\/(\d{1,2})$/); if(!m)return '';
  const jy=Number(m[1]),jm=Number(m[2]),jd=Number(m[3]);
  if(jm<1||jm>12||jd<1||jd>31)return '';
  return _buildJYearMapV20(jy).get(`${jm}/${jd}`)||'';
};

// Avoid reading/parsing the whole localStorage payload again after every small change.
save = function(){
  try{localStorage.setItem(STORAGE,JSON.stringify(state));setSaveStatus(true,'Saved locally')}
  catch(e){setSaveStatus(false,'Storage unavailable — export a backup');console.error('GreenFlow save failed',e)}
  renderNav();
};

function planFormV20(planOrDate=today()){
  const edit=typeof planOrDate==='object'&&planOrDate!==null;
  const p=edit?planOrDate:null, date=edit?(p.date||today()):(planOrDate||today());
  modal(`<h2>${edit?'Edit plan':'Quick plan'}</h2><p class="sub">One-off scheduled activity — reminders are managed separately.</p><form class="form" id="planFormV20"><label>Plan<input name="title" required autofocus value="${esc(p?.title||'')}" placeholder="e.g. Go out"></label><div class="two"><label>Date<input type="date" name="date" value="${date}" required></label><label>Start time <span class="hint">optional</span><input type="time" name="time" value="${esc(p?.time||'')}"></label></div><div class="two"><label>Duration <span class="hint">optional, H:MM</span><input name="duration" value="${p?.duration?`${Math.floor(p.duration/60)}:${String(p.duration%60).padStart(2,'0')}`:''}" placeholder="1:00"></label><label>Note <span class="hint">optional</span><input name="note" value="${esc(p?.note||'')}"></label></div><div class="form-actions">${edit?`<button type="button" class="danger" data-delete-plan-v20="${p.id}">Delete</button>`:''}<button type="button" class="secondary" data-close>Cancel</button><button class="primary">${edit?'Save changes':'Add plan'}</button></div></form>`);
  $('#planFormV20').onsubmit=e=>{e.preventDefault();const x=new FormData(e.currentTarget),dur=parseDurationHM(x.get('duration')),obj={title:x.get('title').trim(),date:x.get('date'),time:x.get('time'),duration:dur,note:x.get('note').trim()};if(edit)Object.assign(p,obj);else state.plans.push({id:uid(),...obj,done:false});save();closeOverlay();renderAll();toast(edit?'Plan updated':'Plan added')};
}
quickPlan = planFormV20;

// Make every visible plan directly editable without changing routine interactions.
function _decoratePlansV20(){
  $$('.plan-row').forEach(row=>{const id=row.querySelector('[data-plancheck]')?.dataset.plancheck;if(id&&!row.dataset.editPlanV20){row.dataset.editPlanV20=id;row.classList.add('editable-plan')}});
  // Week planner cards are rendered in the same order as plans for that date.
  $$('.day').forEach(day=>{
    const add=day.querySelector('[data-adddate]');if(!add)return;const d=add.dataset.adddate,plans=state.plans.filter(p=>p.date===d).sort((a,b)=>(a.time||'99').localeCompare(b.time||'99'));
    day.querySelectorAll('.mini-plan').forEach((el,i)=>{if(plans[i])el.dataset.editPlanV20=plans[i].id});
  });
  // Month view: map rendered plan chips by date/order.
  $$('.month-day[data-caldate]').forEach(day=>{const d=day.dataset.caldate,plans=state.plans.filter(p=>p.date===d).sort((a,b)=>(a.time||'99').localeCompare(b.time||'99'));
    day.querySelectorAll('.cal-item:not(.routine)').forEach((el,i)=>{if(plans[i])el.dataset.editPlanV20=plans[i].id});
  });
}
const _renderAllV20=renderAll;
renderAll=function(){_renderAllV20();_decoratePlansV20()};
const _renderTodayV20=renderToday;renderToday=function(){_renderTodayV20();_decoratePlansV20()};
const _renderPlannerV20=renderPlanner;renderPlanner=function(){_renderPlannerV20();_decoratePlansV20()};

document.addEventListener('click',e=>{
  let el=e.target.closest('[data-delete-plan-v20]');
  if(el){e.preventDefault();e.stopImmediatePropagation();if(confirm('Delete this plan?')){state.plans=state.plans.filter(p=>p.id!==el.dataset.deletePlanV20);save();closeOverlay();renderAll();toast('Plan deleted')}return}
  el=e.target.closest('[data-edit-plan-v20]');
  if(el&&!e.target.closest('[data-plancheck]')){e.preventDefault();e.stopImmediatePropagation();const p=state.plans.find(x=>x.id===el.dataset.editPlanV20);if(p)planFormV20(p);return}
},true);

// Decorate the already-rendered initial screen.
_decoratePlansV20();
