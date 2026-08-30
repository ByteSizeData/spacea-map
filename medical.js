// ═══ ⚕️ Medical badge — "Our health coverage" in one card ═══
// A quiet round badge by the bell. Red dot only when something needs attention.
// Everything here is private: stored locally in this browser, never logged, never shown
// on any shared view. Storage: spacea.medical.v1
//   medical_docs → {doc_type:"cover"|"fmp"|"receipt", name, mime, data, uploaded_at, date, expiry}
(function(){
const $=id=>document.getElementById(id);
const KEY="spacea.medical.v1";
const GREEN="#34D399", AMBER="#FBBF24", RED="#FF6B6B";
const PEOPLE=[{k:"austin",n:"Austin"},{k:"montana",n:"Montana"}];
// the eligibility letter that ships with the app — shown until you replace it with your own
const BUILTIN_COVER={name:"MyEligibilityLetter2026.pdf",mime:"application/pdf",
  url:"uploads/MyEligibilityLetter2026.pdf",builtin:true};
const coverOf=m2=>m2.cover||(m2.coverRemoved?null:BUILTIN_COVER);

const css=document.createElement("style");
css.textContent=`
  #medBadge{position:fixed;right:76px;bottom:20px;z-index:50;width:46px;height:46px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;
    background:color-mix(in srgb,var(--color-surface) 88%,transparent);color:var(--color-text);
    border:1px solid var(--color-divider);box-shadow:var(--shadow-md);
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
  #medBadge:hover{border-color:var(--color-accent);}
  #medBadge:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  #medBadge .mdot{position:absolute;top:-1px;right:-1px;width:12px;height:12px;border-radius:50%;
    background:${RED};border:2px solid var(--color-bg);display:none;}
  #medBadge.attn .mdot{display:block;}
  body.chk-open #medBadge{right:calc(var(--chkw,420px) + 76px);}
  @media (max-width:920px){ body.chk-open #medBadge{display:none;} }

  #medWrap{position:fixed;inset:0;z-index:64;display:none;align-items:center;justify-content:center;
    background:rgba(6,8,16,.72);backdrop-filter:blur(3px);padding:18px;font-family:var(--font-body);}
  #medWrap.show{display:flex;}
  .md-box{width:min(470px,100%);max-height:90vh;overflow-y:auto;display:flex;flex-direction:column;gap:12px;
    padding:16px;border-radius:18px;color:var(--color-text);border:1px solid var(--color-divider);
    background:color-mix(in srgb,var(--color-surface) 98%,transparent);box-shadow:var(--shadow-lg);}
  .md-top{display:flex;align-items:center;gap:12px;padding-bottom:13px;
    border-bottom:1px solid color-mix(in srgb,var(--color-text) 9%,transparent);}
  .md-mark{flex:0 0 auto;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;
    justify-content:center;font-size:21px;
    background:radial-gradient(circle at 32% 28%,color-mix(in srgb,var(--color-accent) 30%,transparent),
      color-mix(in srgb,var(--color-accent) 12%,transparent));
    border:1px solid color-mix(in srgb,var(--color-accent) 45%,transparent);
    box-shadow:0 0 20px color-mix(in srgb,var(--color-accent) 20%,transparent);}
  .md-ttl{flex:1 1 auto;min-width:0;}
  .md-ttl h3{margin:0;font-family:var(--font-heading);font-size:21px;font-weight:500;letter-spacing:-.018em;
    line-height:1.15;}
  .md-ttl small{display:block;font-size:11.5px;margin-top:3px;
    color:color-mix(in srgb,var(--color-text) 58%,transparent);}
  .md-x{width:34px;height:34px;flex:0 0 auto;border-radius:50%;border:1px solid var(--color-divider);
    background:none;color:var(--color-text);font-size:14px;cursor:pointer;}
  .md-x:hover{border-color:var(--color-accent);}
  .md-status{display:flex;align-items:center;gap:10px;padding:13px 14px;border-radius:14px;font-size:15px;font-weight:600;}
  .md-status.ok{border:1px solid color-mix(in srgb,${GREEN} 45%,transparent);
    background:color-mix(in srgb,${GREEN} 11%,transparent);color:color-mix(in srgb,${GREEN} 88%,var(--color-text));}
  .md-status.warn{border:1px solid color-mix(in srgb,${AMBER} 48%,transparent);
    background:color-mix(in srgb,${AMBER} 11%,transparent);color:color-mix(in srgb,${AMBER} 90%,var(--color-text));}
  .md-lines{display:flex;flex-direction:column;gap:2px;}
  .md-line{display:flex;gap:11px;align-items:flex-start;padding:10px 11px;border-radius:12px;font-size:12.5px;
    line-height:1.55;color:color-mix(in srgb,var(--color-text) 86%,transparent);}
  .md-line .li{flex:0 0 auto;font-size:17px;line-height:1.3;}
  .md-line.hot{border:1px solid color-mix(in srgb,${RED} 50%,transparent);
    background:color-mix(in srgb,${RED} 11%,transparent);}
  .md-line.hot b{color:${RED};}
  .md-h{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-top:2px;
    color:color-mix(in srgb,var(--color-text) 50%,transparent);}
  .md-slot{display:flex;align-items:center;gap:11px;padding:10px 11px;border-radius:13px;
    border:1px dashed color-mix(in srgb,var(--color-text) 24%,transparent);}
  .md-slot.has{border-style:solid;border-color:color-mix(in srgb,${GREEN} 45%,transparent);
    background:color-mix(in srgb,${GREEN} 7%,transparent);}
  .md-slot.miss{border-color:color-mix(in srgb,${AMBER} 45%,transparent);
    background:color-mix(in srgb,${AMBER} 8%,transparent);}
  .md-thumb{flex:0 0 auto;width:48px;height:48px;border-radius:10px;overflow:hidden;cursor:pointer;padding:0;
    display:flex;align-items:center;justify-content:center;font-size:18px;border:1px solid var(--color-divider);
    background:color-mix(in srgb,#000 20%,transparent);color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .md-thumb img{width:100%;height:100%;object-fit:cover;}
  .md-thumb:hover{border-color:var(--color-accent);color:var(--color-text);}
  .md-sm{flex:1 1 auto;min-width:0;font-size:12.5px;}
  .md-sm b{display:block;font-size:13px;}
  .md-sm small{display:block;font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;
    text-overflow:ellipsis;color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .md-sm small.warn{color:${AMBER};}
  .md-acts{flex:0 0 auto;display:flex;flex-direction:column;gap:4px;align-items:flex-end;}
  .md-b{font:inherit;font-size:11.5px;min-height:32px;padding:7px 10px;border-radius:9px;cursor:pointer;
    border:1px solid var(--color-divider);background:none;color:var(--color-text);white-space:nowrap;
    text-decoration:none;display:inline-flex;align-items:center;gap:5px;}
  .md-b:hover{border-color:var(--color-accent);background:color-mix(in srgb,var(--color-accent) 13%,transparent);}
  .md-b.wide{width:100%;justify-content:center;min-height:44px;font-size:12.5px;}
  .md-id{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:12px;font-size:12.5px;
    border:1px solid var(--color-divider);}
  .md-id b{flex:1 1 auto;min-width:0;font-size:13px;}
  .md-id input{font:inherit;font-size:11.5px;min-height:34px;padding:6px 8px;border-radius:9px;color-scheme:dark;
    border:1px solid var(--color-divider);background:color-mix(in srgb,#000 20%,transparent);color:var(--color-text);}
  .md-id input:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;}
  .md-id.soon{border-color:color-mix(in srgb,${RED} 50%,transparent);background:color-mix(in srgb,${RED} 9%,transparent);}
  .md-check{display:flex;align-items:center;gap:10px;width:100%;padding:11px;min-height:50px;border-radius:12px;
    font:inherit;font-size:12.5px;text-align:left;cursor:pointer;color:var(--color-text);
    border:1px solid var(--color-divider);background:none;}
  .md-check.on{border-color:color-mix(in srgb,${GREEN} 55%,transparent);background:color-mix(in srgb,${GREEN} 9%,transparent);}
  .md-check .bx{width:23px;height:23px;flex:0 0 auto;border-radius:7px;display:flex;align-items:center;
    justify-content:center;font-size:12px;border:1.5px solid var(--color-divider);}
  .md-check.on .bx{border-color:${GREEN};color:${GREEN};}
  .md-recs{display:flex;flex-wrap:wrap;gap:6px;}
  .md-rec{position:relative;width:62px;}
  .md-rec .rt{width:62px;height:62px;border-radius:10px;overflow:hidden;cursor:pointer;padding:0;
    display:flex;align-items:center;justify-content:center;font-size:17px;border:1px solid var(--color-divider);
    background:color-mix(in srgb,#000 20%,transparent);color:color-mix(in srgb,var(--color-text) 60%,transparent);}
  .md-rec .rt img{width:100%;height:100%;object-fit:cover;}
  .md-rec .rd{font-size:9.5px;text-align:center;margin-top:3px;
    color:color-mix(in srgb,var(--color-text) 55%,transparent);}
  .md-rec .rx{position:absolute;top:-5px;right:-5px;width:20px;height:20px;border-radius:50%;cursor:pointer;
    border:1px solid var(--color-divider);background:var(--color-bg);color:${RED};font-size:10px;line-height:1;}
  .md-note{font-size:10.5px;line-height:1.55;color:color-mix(in srgb,var(--color-text) 50%,transparent);}
  #medView{position:fixed;inset:0;z-index:72;display:none;flex-direction:column;background:rgba(6,8,16,.96);padding:14px;}
  #medView.show{display:flex;}
  #medView .vh{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
  #medView .vh b{flex:1 1 auto;min-width:0;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    color:var(--color-text);}
  #medView .vbody{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;overflow:auto;}
  #medView img{max-width:100%;max-height:100%;border-radius:10px;}
  #medView iframe{width:100%;height:100%;border:0;border-radius:10px;background:#fff;}`;
document.head.appendChild(css);

function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||"{}")||{}; }catch(e){ return {}; } }
function save(m){ try{ localStorage.setItem(KEY,JSON.stringify(m)); }
  catch(e){ toast("This device is out of storage — remove a receipt and try again"); } }
const say=m=>{ if(typeof toast==="function") toast(m); };

function pickFile(cb){
  const i=document.createElement("input"); i.type="file"; i.accept="image/*,application/pdf";
  i.onchange=()=>{ const f=i.files&&i.files[0]; if(!f) return;
    if(f.type==="application/pdf"){
      if(f.size>4.5*1024*1024){ say("That PDF is too big for local storage — save a smaller copy"); return; }
      const fr=new FileReader(); fr.onload=()=>cb({name:f.name,mime:f.type,data:fr.result}); fr.readAsDataURL(f);
    } else {
      const fr=new FileReader();
      fr.onload=()=>{ const im=new Image();
        im.onload=()=>{ const mx=1400, sc=Math.min(1,mx/Math.max(im.width,im.height));
          const c=document.createElement("canvas"); c.width=Math.round(im.width*sc)||1; c.height=Math.round(im.height*sc)||1;
          c.getContext("2d").drawImage(im,0,0,c.width,c.height);
          cb({name:f.name,mime:"image/jpeg",data:c.toDataURL("image/jpeg",0.78)}); };
        im.onerror=()=>say("That file isn't a picture or a PDF");
        im.src=fr.result; };
      fr.readAsDataURL(f);
    }
  };
  i.click();
}
function toBlobUrl(doc){
  if(doc&&doc.url&&!doc.data) return doc.url;
  try{
    const [head,b64]=doc.data.split(",");
    const mime=(head.match(/data:([^;]+)/)||[])[1]||doc.mime||"application/octet-stream";
    const bin=atob(b64), arr=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr],{type:mime}));
  }catch(e){ return doc.data; }
}
function openTab(url){
  const w=window.open(url,"_blank","noopener,noreferrer");
  if(!w) say("Your browser blocked the new tab — allow pop-ups for this page");
  return w;
}
async function showDoc(doc){
  if(!doc) return;
  if(doc.mime==="application/pdf"){
    // Chrome won't render a PDF inside this frame, and a project-relative URL can't be
    // opened raw in a new tab — pull it into a blob and open that.
    if(doc.data){ openTab(toBlobUrl(doc)); return; }
    try{
      const res=await fetch(doc.url);
      if(!res.ok) throw new Error(res.status);
      openTab(URL.createObjectURL(await res.blob()));
    }catch(e){ say("Couldn't open the letter — try ⬇ Save instead"); }
    return;
  }
  viewDoc(doc);
}
function viewDoc(doc){
  let v=$("medView");
  if(!v){ v=document.createElement("div"); v.id="medView";
    v.innerHTML='<div class="vh"><b></b><a class="md-b" data-vt="1" target="_blank" rel="noopener">↗ New tab</a>'+
      '<a class="md-b" download>⬇ Download</a><button class="md-b" data-vx="1">✕ Close</button></div><div class="vbody"></div>';
    document.body.appendChild(v);
    v.querySelector("[data-vx]").onclick=()=>{ v.classList.remove("show"); v.querySelector(".vbody").innerHTML=""; };
  }
  const url=toBlobUrl(doc);
  v.querySelector("b").textContent=doc.name||"Document";
  const dl=v.querySelector("a[download]"); dl.href=url; dl.setAttribute("download",doc.name||"document");
  const nt=v.querySelector("[data-vt]"); nt.href=url; nt.onclick=e=>{ e.preventDefault(); openTab(url); };
  const body=v.querySelector(".vbody");
  v.classList.add("show");
  body.style.display="flex"; body.style.overflow="auto";
  body.innerHTML='<img alt="Document">';
  body.querySelector("img").src=url;
}
const fmtD=s=>{ if(!s) return ""; const d=new Date(s.length>10?s:s+"T12:00:00");
  return isNaN(d)?"":d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}); };
const daysTo=s=>{ if(!s) return null; const d=new Date(s+"T12:00:00");
  return isNaN(d)?null:Math.ceil((d-Date.now())/864e5); };

function state(){
  const m=load();
  const soon=PEOPLE.map(p=>daysTo(((m.ids||{})[p.k]||{}).exp)).filter(d=>d!=null&&d<90);
  return {m,
    hasCover:!!coverOf(m),
    hasFmp:true,
    idOk:true,
    idSoon:soon.length>0,
    get ok(){ return this.hasCover&&this.hasFmp&&this.idOk&&!this.idSoon; }};
}
function refreshBadge(){
  const b=$("medBadge"); if(!b) return;
  const s=state();
  b.classList.toggle("attn",!s.ok);
  b.title=s.ok?"Our health coverage — all good":"Our health coverage — something to check";
}

function slotRow(label,note,doc,onPick,onClear,missTone){
  const has=!!(doc&&(doc.data||doc.url));
  const isPdf=has&&doc.mime==="application/pdf";
  const el=document.createElement("div");
  el.className="md-slot"+(has?" has":(missTone?" miss":""));
  el.innerHTML=
    '<button class="md-thumb">'+(has&&!isPdf?'<img alt="">':(has?"📄":"＋"))+'</button>'+
    '<span class="md-sm"><b></b><small></small></span>'+
    '<span class="md-acts"></span>';
  el.querySelector("b").textContent=label;
  const sm=el.querySelector("small");
  sm.textContent=has?((doc.name||"On file")+(doc.builtin?" · ready to show at a clinic"
    :doc.uploaded_at?" · added "+fmtD(doc.uploaded_at):"")):note;
  if(!has&&missTone) sm.className="warn";
  const th=el.querySelector(".md-thumb");
  if(has&&!isPdf) th.querySelector("img").src=doc.data||doc.url;
  th.onclick=()=>has?showDoc(doc):pickFile(d=>{ onPick(d); render(); say("Saved — stays on this device"); });
  const acts=el.querySelector(".md-acts");
  const add=document.createElement("button"); add.className="md-b"; add.textContent=has?"Replace":"Add";
  add.onclick=()=>pickFile(d=>{ onPick(d); render(); say("Saved — stays on this device"); });
  acts.appendChild(add);
  if(has){
    const open=document.createElement("button"); open.className="md-b";
    open.textContent=isPdf?"Open it ↗":"Show it";
    open.title=isPdf?"Opens in a new tab so you can pinch-zoom and show it at a clinic":"";
    open.onclick=()=>showDoc(doc); acts.appendChild(open);
    if(isPdf){ const dl2=document.createElement("button"); dl2.className="md-b"; dl2.textContent="⬇ Save";
      dl2.onclick=async()=>{
        let href=doc.data?toBlobUrl(doc):null;
        if(!href){ try{ const res=await fetch(doc.url); href=URL.createObjectURL(await res.blob()); }
          catch(e){ say("Couldn't save the letter"); return; } }
        const a2=document.createElement("a"); a2.href=href;
        a2.download=doc.name||"coverage-letter.pdf"; a2.click(); };
      acts.appendChild(dl2); }
    const rm=document.createElement("button"); rm.className="md-b"; rm.textContent="Remove";
    rm.onclick=()=>{ onClear(); render(); say("Removed"); }; acts.appendChild(rm);
  }
  return el;
}

function render(){
  const w=$("medWrap"); if(!w) return;
  const s=state(), m=s.m;
  const box=w.querySelector(".md-box");
  box.innerHTML="";
  const add=el=>box.appendChild(el);
  const div=(cls,html)=>{ const d=document.createElement("div"); d.className=cls; if(html!=null) d.innerHTML=html; return d; };

  const top=div("md-top",
    '<span class="md-mark">⚕️</span>'+
    '<span class="md-ttl"><h3>Our Health Coverage</h3><small>Proof and plain answers, for both of us</small></span>'+
    '<button class="md-x" title="Close">✕</button>');
  top.querySelector(".md-x").onclick=close;
  add(top);

  add(div("md-status "+(s.ok?"ok":"warn"),
    s.ok?"✅ Covered — both of us":"⚠️ Something to check"));

  const lines=div("md-lines");
  const L=(ic,txt,hot)=>{ const d=div("md-line"+(hot?" hot":""));
    d.innerHTML='<span class="li">'+ic+'</span><span>'+txt+'</span>'; return d; };
  lines.appendChild(L("🎒","My wife and I both have health coverage that works here in Thailand."));
  lines.appendChild(L("💵","Doctor visit? We pay first, mail the receipt, get 75% back. After $3,000 in a year (shared between us), everything's covered."));
  lines.appendChild(L("🆓","Anything the Army broke, a second program (FMP) pays 100%."));
  lines.appendChild(L("🚨","None of it works without a current military ID card. Check both."+
    (s.idSoon?" <b>Renew ID before the trip.</b>":""),s.idSoon));
  add(lines);

  add(div("md-h","Proof we can show"));
  add(slotRow("Coverage letter","Add the letter that lists both of us (PDF or picture)",
    coverOf(m),
    d=>{ const mm=load(); mm.cover=Object.assign({uploaded_at:new Date().toISOString()},d);
      mm.coverRemoved=false; save(mm); },
    ()=>{ const mm=load(); mm.cover=null; mm.coverRemoved=true; save(mm); },
    !s.hasCover));

  refreshBadge();
}

function open(){ ensure(); $("medWrap").classList.add("show"); render(); }
function close(){ const w=$("medWrap"); if(w) w.classList.remove("show"); refreshBadge(); }
function ensure(){
  if(!$("medBadge")){
    const b=document.createElement("button"); b.id="medBadge"; b.type="button";
    b.setAttribute("aria-label","Our health coverage");
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style="width:22px;height:22px"><g stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.6v16.8"></path><path d="M12 6.4c-2.6 0-3.4 2.1-1.6 3.4 1.9 1.4 5.1 1.4 3.2 2.9-1.7 1.3-4.5 1.3-4.5 1.3"></path><path d="M9 4.6c1.2 1.4 4.8 1.4 6 0"></path><path d="M9.4 19.4h5.2"></path></g></svg><span class="mdot"></span>';
    b.onclick=open; document.body.appendChild(b);
  }
  if(!$("medWrap")){
    const w=document.createElement("div"); w.id="medWrap";
    w.innerHTML='<div class="md-box"></div>';
    w.addEventListener("click",e=>{ if(e.target.id==="medWrap") close(); });
    document.body.appendChild(w);
  }
}
addEventListener("keydown",e=>{ if(e.key!=="Escape") return;
  const v=$("medView"); if(v&&v.classList.contains("show")){ v.classList.remove("show"); v.querySelector(".vbody").innerHTML=""; return; }
  const w=$("medWrap"); if(w&&w.classList.contains("show")) close(); });
window.openMedicalCard=open;
addEventListener("load",()=>{ ensure(); refreshBadge(); });
})();
