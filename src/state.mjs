export const COLORS=['#ff8585','#ffc17b','#f5d97e','#9ed5ad','#87bfe8','#bea2e3','#ef9ec4'];
export const TIER_PRESETS={classic:['S+','S','A','B','C','D'],cn:['夯','顶级','人上人','NPC','拉完了'],numeric:['T0','T1','T2','T3','T4']};
export const uid=()=>globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const makeRows=(preset='classic')=>TIER_PRESETS[preset].map((label,i)=>({id:uid(),label,color:COLORS[i],items:[]}));
export function initialState(models=[]){return {version:1,title:'我的 AI 模型 Tier List',subtitle:'',rows:makeRows(),pool:models.slice(0,13).map(m=>({...m,id:uid(),catalogId:m.id})),theme:'dark'};}
export function allItems(s){return [...s.rows.flatMap(r=>r.items),...s.pool];}
export function containerOf(s,id){if(s.pool.some(i=>i.id===id))return 'pool'; return s.rows.find(r=>r.items.some(i=>i.id===id))?.id;}
export function moveItem(s,id,targetId,overId){
 const source=containerOf(s,id); if(!source || (targetId!=='pool'&&!s.rows.some(r=>r.id===targetId)))return s;
 const next=structuredClone(s), list=c=>c==='pool'?next.pool:next.rows.find(r=>r.id===c).items;
 const from=list(source),index=from.findIndex(x=>x.id===id);
 const targetIndex=overId?list(targetId).findIndex(x=>x.id===overId):-1;
 const [item]=from.splice(index,1),to=list(targetId);
 const pos=source===targetId?targetIndex:(overId?to.findIndex(x=>x.id===overId):-1);
 to.splice(pos<0?to.length:pos,0,item);return next;
}
export function applyTierPreset(s,key){
 const labels=TIER_PRESETS[key]; if(!labels)return s;
 const rows=labels.map((label,i)=>s.rows[i]?{...s.rows[i],label,color:COLORS[i]}:{id:uid(),label,color:COLORS[i],items:[]});
 return {...s,rows,pool:[...s.pool,...s.rows.slice(labels.length).flatMap(r=>r.items)]};
}
export function validateBoard(v){
 if(!v||v.version!==1||typeof v.title!=='string'||v.title.length>160||typeof v.subtitle!=='string'||v.subtitle.length>500||!Array.isArray(v.rows)||v.rows.length<1||v.rows.length>30||!Array.isArray(v.pool))return false;
 const ids=new Set(); const unique=id=>typeof id==='string'&&id.length>0&&id!=='pool'&&!ids.has(id)&&!!ids.add(id);
 const item=x=>x&&unique(x.id)&&typeof x.name==='string'&&x.name.length<=160&&(!x.icon||/^[a-z0-9-]+$/.test(x.icon))&&(!x.image||/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(x.image));
 return v.rows.every(r=>r&&unique(r.id)&&r.id!=='pool'&&typeof r.label==='string'&&r.label.length<=30&&/^#[\da-f]{6}$/i.test(r.color)&&Array.isArray(r.items)&&r.items.every(item))&&v.pool.every(item)&&allItems(v).length<=1000;
}
