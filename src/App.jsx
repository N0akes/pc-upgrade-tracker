import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";

// --- Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyA100cA01CXp4FdgzamnxguMtYPTYclGnI",
  authDomain: "pc-upgrade-tracker.firebaseapp.com",
  projectId: "pc-upgrade-tracker",
  storageBucket: "pc-upgrade-tracker.firebasestorage.app",
  messagingSenderId: "91487190920",
  appId: "1:91487190920:web:28b853375dab98881e443d"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const USERS = { Nick: "Password!", Jeremy: "NickIsAwesome" };
const COMPANIES = ["Blackstone", "Ulrich"];
const DEPARTMENTS = ["Shop Floor", "Office PC"];

const CHECKLISTS = {
  "Shop Floor": [
    "Windows 11 Installed","Joined Domain","Account Added",
    "Adobe Reader Installed","Open Office - M365 Installed",
    "ScreenConnect Installed","Trend Micro Installed",
    "Solid Edge 2025 Installed","Epicor Installed",
    "Printer Mapped","Desktop Icons Pasted","Windows Updates",
    "Power Plan Changed","Screen Saver Changed",
    "Uninstalled Xbox & Solitaire","Connected Wi-Fi","Swap Completed",
  ],
  "Office PC": [
    "Windows 11 Installed","Joined Domain","Account Added",
    "Adobe Reader Installed","Open Office - M365 Installed",
    "ScreenConnect Installed","Trend Micro Installed",
    "Solid Edge 2025 Installed","Epicor Installed",
    "Printer Mapped","Desktop Icons Pasted","Bookmarks Imported",
    "Windows Updates","Power Plan Changed","Screen Saver Changed",
    "Uninstalled Xbox & Solitaire","Connected Wi-Fi","Swap Completed",
  ],
};

const STATUS_COLORS = {
  "Not Started": { accent: "#45475a", text: "#6c7086" },
  "In Progress": { accent: "#f38ba8", text: "#f38ba8" },
  "Complete":    { accent: "#a6e3a1", text: "#a6e3a1" },
};

const COMPANY_COLORS = { "Blackstone": "#89b4fa", "Ulrich": "#cba6f7" };

function getChecklist(department) { return CHECKLISTS[department] || CHECKLISTS["Shop Floor"]; }

function getStatus(checks, department) {
  const tasks = getChecklist(department);
  const done = tasks.filter(t => checks[t] === 1 || checks[t] === 2).length;
  if (done === 0) return "Not Started";
  if (done === tasks.length) return "Complete";
  return "In Progress";
}

function formatDate(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function todayValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function dateToTs(str) {
  if (!str) return null;
  const [y,m,d] = str.split("-").map(Number);
  return new Date(y, m-1, d).getTime();
}

// --- Export CSV ---
function exportCSV(pcs) {
  const rows = [["Hostname","Company","Department","Status","Swap Date","Notes"]];
  pcs.forEach(pc => {
    const status = getStatus(pc.checks, pc.department);
    const swapDate = pc.swapDate ? formatDate(pc.swapDate) : "";
    rows.push([pc.hostname, pc.company, pc.department, status, swapDate, (pc.notes || "").replace(/,/g,";")] );
  });
  const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "pc-upgrade-tracker.csv"; a.click();
  URL.revokeObjectURL(url);
}

// --- Login ---
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const attempt = () => {
    if (USERS[username] && USERS[username] === password) { onLogin(username); }
    else { setError("Invalid credentials"); setShaking(true); setTimeout(() => setShaking(false), 500); }
  };

  const inp = { width:"100%", background:"#181825", border:"1px solid #313244", borderRadius:"6px", color:"#cdd6f4", fontFamily:"'Space Mono',monospace", fontSize:"0.82rem", padding:"11px 14px", outline:"none", boxSizing:"border-box", marginBottom:"12px" };

  return (
    <div style={{ minHeight:"100vh", background:"#11111b", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Space Mono',monospace" }}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}} @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} input::placeholder{color:#45475a} input:focus{border-color:#89b4fa!important}`}</style>
      <div style={{ width:"360px", animation: shaking ? "shake 0.5s ease" : "fadeIn 0.4s ease" }}>
        <div style={{ textAlign:"center", marginBottom:"36px" }}>
          <div style={{ width:"48px", height:"48px", borderRadius:"12px", background:"linear-gradient(135deg,#89b4fa22,#cba6f722)", border:"1px solid #89b4fa44", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:"1.4rem" }}>⬡</div>
          <div style={{ fontSize:"0.6rem", color:"#45475a", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"6px" }}>BAT PC Project</div>
          <div style={{ fontSize:"1.1rem", color:"#cdd6f4", letterSpacing:"0.06em" }}>Win11 Upgrade Tracker</div>
        </div>
        <div style={{ background:"#1e1e2e", border:"1px solid #313244", borderRadius:"12px", padding:"28px" }}>
          <div style={{ fontSize:"0.65rem", color:"#585b70", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Username</div>
          <input autoFocus value={username} onChange={e=>{setUsername(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="Enter username" style={inp} />
          <div style={{ fontSize:"0.65rem", color:"#585b70", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Password</div>
          <input type="password" value={password} onChange={e=>{setPassword(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} placeholder="Enter password" style={{...inp, marginBottom: error?"8px":"20px"}} />
          {error && <div style={{ fontSize:"0.68rem", color:"#f38ba8", marginBottom:"14px" }}>✕ {error}</div>}
          <button onClick={attempt} style={{ width:"100%", background:"#89b4fa", border:"none", borderRadius:"6px", color:"#1e1e2e", fontFamily:"'Space Mono',monospace", fontSize:"0.78rem", padding:"12px", cursor:"pointer", letterSpacing:"0.08em" }}>Sign In</button>
        </div>
      </div>
    </div>
  );
}

// --- Shared UI ---
function StatusBadge({ status }) {
  const { accent, text } = STATUS_COLORS[status];
  return <span style={{ fontSize:"0.6rem", fontFamily:"'Space Mono',monospace", letterSpacing:"0.12em", textTransform:"uppercase", color:text, border:`1px solid ${accent}`, borderRadius:"3px", padding:"2px 8px" }}>{status}</span>;
}

function ProgressBar({ checks, department }) {
  const tasks = getChecklist(department);
  const done = tasks.filter(t => checks[t]===1||checks[t]===2).length;
  const pct = Math.round((done/tasks.length)*100);
  return (
    <div style={{ marginTop:"6px" }}>
      <div style={{ height:"3px", background:"#313244", borderRadius:"2px", overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background: pct===100?"#a6e3a1":"#89b4fa", transition:"width 0.4s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ fontSize:"0.6rem", color:"#585b70", marginTop:"4px", fontFamily:"'Space Mono',monospace" }}>{done}/{tasks.length} tasks</div>
    </div>
  );
}

function CheckBox({ state, accent }) {
  const bg = state===1?accent:state===2?"#f9e2af":"transparent";
  const border = state===0?"#45475a":state===1?accent:"#f9e2af";
  return (
    <div style={{ width:"18px", height:"18px", borderRadius:"4px", border:`2px solid ${border}`, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s ease" }}>
      {state===1&&<svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#1e1e2e" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {state===2&&<svg width="10" height="10" viewBox="0 0 10 10"><line x1="2" y1="5" x2="8" y2="5" stroke="#1e1e2e" strokeWidth="1.8" strokeLinecap="round"/></svg>}
    </div>
  );
}

// --- Delete Confirmation ---
function DeleteConfirm({ hostname, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div style={{ background:"#1e1e2e", border:"1px solid #f38ba844", borderRadius:"12px", padding:"28px", width:"320px", textAlign:"center" }}>
        <div style={{ fontSize:"1.5rem", marginBottom:"12px" }}>⚠</div>
        <div style={{ fontFamily:"'Space Mono',monospace", color:"#cdd6f4", fontSize:"0.85rem", marginBottom:"8px" }}>Delete PC?</div>
        <div style={{ fontFamily:"'Space Mono',monospace", color:"#6c7086", fontSize:"0.72rem", marginBottom:"24px" }}>{hostname}</div>
        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={onConfirm} style={{ flex:1, background:"#f38ba8", border:"none", borderRadius:"6px", color:"#1e1e2e", fontFamily:"'Space Mono',monospace", fontSize:"0.75rem", padding:"10px", cursor:"pointer" }}>Delete</button>
          <button onClick={onCancel} style={{ flex:1, background:"transparent", border:"1px solid #313244", borderRadius:"6px", color:"#6c7086", fontFamily:"'Space Mono',monospace", fontSize:"0.75rem", padding:"10px", cursor:"pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// --- PC Card ---
function PCCard({ pc, onDelete, onSelect, selected }) {
  const status = getStatus(pc.checks, pc.department);
  const accent = STATUS_COLORS[status].accent;
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <>
      <div onClick={() => onSelect(pc.id)} style={{ background: selected?"#181825":"#1e1e2e", border:`1px solid ${selected?accent:"#313244"}`, borderLeft:`3px solid ${accent}`, borderRadius:"8px", padding:"12px 14px", cursor:"pointer", transition:"all 0.2s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.82rem", color:"#cdd6f4", marginBottom:"3px", letterSpacing:"0.05em", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pc.hostname||"Unnamed PC"}</div>
            <div style={{ fontSize:"0.7rem", color:"#6c7086", marginBottom:"3px" }}>{pc.company} · {pc.department}</div>
            {pc.swapDate && <div style={{ fontSize:"0.6rem", color:"#45475a", marginBottom:"5px", fontFamily:"'Space Mono',monospace" }}>Swapped {formatDate(pc.swapDate)}</div>}
            <StatusBadge status={status} />
          </div>
          <button onClick={e=>{e.stopPropagation();setConfirmDelete(true);}} style={{ background:"none", border:"none", color:"#45475a", cursor:"pointer", fontSize:"0.9rem", padding:"0 4px", lineHeight:1 }}>✕</button>
        </div>
        <ProgressBar checks={pc.checks} department={pc.department} />
      </div>
      {confirmDelete && <DeleteConfirm hostname={pc.hostname} onConfirm={()=>{onDelete(pc.id);setConfirmDelete(false);}} onCancel={()=>setConfirmDelete(false)} />}
    </>
  );
}

// --- Sidebar Groups ---
function DeptGroup({ label, pcs, selectedId, onSelect, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);
  if (pcs.length===0) return null;
  return (
    <div style={{ marginBottom:"8px", marginLeft:"10px" }}>
      <div onClick={()=>setCollapsed(c=>!c)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"3px 4px 5px 4px", cursor:"pointer", borderBottom:"1px solid #27273a", marginBottom:"6px" }}>
        <span style={{ fontSize:"0.58rem", fontFamily:"'Space Mono',monospace", color:"#4a4a6a", letterSpacing:"0.12em", textTransform:"uppercase" }}>{label} ({pcs.length})</span>
        <span style={{ color:"#3a3a5a", fontSize:"0.65rem" }}>{collapsed?"▶":"▼"}</span>
      </div>
      {!collapsed && <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>{pcs.map(pc=><PCCard key={pc.id} pc={pc} onDelete={onDelete} onSelect={onSelect} selected={selectedId===pc.id}/>)}</div>}
    </div>
  );
}

function CompanyGroup({ company, pcs, selectedId, onSelect, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);
  const color = COMPANY_COLORS[company];
  const activePCs = pcs.filter(p=>getStatus(p.checks,p.department)!=="Complete");
  const complete = pcs.filter(p=>getStatus(p.checks,p.department)==="Complete").length;
  if (activePCs.length===0) return null;
  return (
    <div style={{ marginBottom:"16px" }}>
      <div onClick={()=>setCollapsed(c=>!c)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", cursor:"pointer", background:"#1a1a2e", borderRadius:"6px", border:`1px solid ${color}22`, borderLeft:`3px solid ${color}`, marginBottom: collapsed?"0":"10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"0.75rem", fontFamily:"'Space Mono',monospace", color, letterSpacing:"0.08em", fontWeight:"700" }}>{company}</span>
          <span style={{ fontSize:"0.55rem", color:"#45475a", fontFamily:"'Space Mono',monospace" }}>{complete}/{pcs.length} done</span>
        </div>
        <span style={{ color, fontSize:"0.7rem" }}>{collapsed?"▶":"▼"}</span>
      </div>
      {!collapsed&&<>
        <DeptGroup label="Shop Floor" pcs={activePCs.filter(p=>p.department==="Shop Floor")} selectedId={selectedId} onSelect={onSelect} onDelete={onDelete}/>
        <DeptGroup label="Office PC" pcs={activePCs.filter(p=>p.department==="Office PC")} selectedId={selectedId} onSelect={onSelect} onDelete={onDelete}/>
      </>}
    </div>
  );
}

function CompletedCompanyGroup({ company, pcs, selectedId, onSelect, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);
  const color = COMPANY_COLORS[company];
  if (pcs.length===0) return null;
  return (
    <div style={{ marginBottom:"8px", marginLeft:"10px" }}>
      <div onClick={()=>setCollapsed(c=>!c)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", cursor:"pointer", background:"#1a1a2e", borderRadius:"6px", border:`1px solid ${color}22`, borderLeft:`3px solid ${color}`, marginBottom: collapsed?"0":"8px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"0.68rem", fontFamily:"'Space Mono',monospace", color, letterSpacing:"0.08em", fontWeight:"700" }}>{company}</span>
          <span style={{ fontSize:"0.55rem", color:"#45475a", fontFamily:"'Space Mono',monospace" }}>{pcs.length} PC{pcs.length!==1?"s":""}</span>
        </div>
        <span style={{ color, fontSize:"0.65rem" }}>{collapsed?"▶":"▼"}</span>
      </div>
      {!collapsed&&<div style={{ display:"flex", flexDirection:"column", gap:"5px", marginLeft:"8px" }}>{pcs.map(pc=><PCCard key={pc.id} pc={pc} onDelete={onDelete} onSelect={onSelect} selected={selectedId===pc.id}/>)}</div>}
    </div>
  );
}

function CompletedGroup({ pcs, selectedId, onSelect, onDelete }) {
  const [collapsed, setCollapsed] = useState(true);
  if (pcs.length===0) return null;
  return (
    <div style={{ marginBottom:"16px" }}>
      <div style={{ borderTop:"1px solid #313244", marginBottom:"12px" }}/>
      <div onClick={()=>setCollapsed(c=>!c)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", cursor:"pointer", background:"#1a2e1a", borderRadius:"6px", border:"1px solid #a6e3a122", borderLeft:"3px solid #a6e3a1", marginBottom: collapsed?"0":"10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"0.75rem", fontFamily:"'Space Mono',monospace", color:"#a6e3a1", letterSpacing:"0.08em", fontWeight:"700" }}>✓ Completed</span>
          <span style={{ fontSize:"0.55rem", color:"#45475a", fontFamily:"'Space Mono',monospace" }}>{pcs.length} PC{pcs.length!==1?"s":""}</span>
        </div>
        <span style={{ color:"#a6e3a1", fontSize:"0.7rem" }}>{collapsed?"▶":"▼"}</span>
      </div>
      {!collapsed&&<>
        <CompletedCompanyGroup company="Blackstone" pcs={pcs.filter(p=>p.company==="Blackstone")} selectedId={selectedId} onSelect={onSelect} onDelete={onDelete}/>
        <CompletedCompanyGroup company="Ulrich" pcs={pcs.filter(p=>p.company==="Ulrich")} selectedId={selectedId} onSelect={onSelect} onDelete={onDelete}/>
      </>}
    </div>
  );
}

// --- Checklist Panel ---
function ChecklistPanel({ pc, onCycle, onNotesChange, onSwapDateChange }) {
  if (!pc) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"#45475a", fontFamily:"'Space Mono',monospace", fontSize:"0.8rem", gap:"12px" }}>
      <div style={{ fontSize:"2rem" }}>⬡</div>
      <div>Select a PC to view checklist</div>
    </div>
  );
  const status = getStatus(pc.checks, pc.department);
  const accent = STATUS_COLORS[status].accent;
  const companyColor = COMPANY_COLORS[pc.company]||"#89b4fa";
  const tasks = getChecklist(pc.department);
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ marginBottom:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
          <span style={{ fontSize:"0.6rem", fontFamily:"'Space Mono',monospace", color:companyColor, letterSpacing:"0.15em", textTransform:"uppercase", border:`1px solid ${companyColor}44`, borderRadius:"3px", padding:"1px 6px" }}>{pc.company}</span>
          <span style={{ fontSize:"0.6rem", color:"#45475a", fontFamily:"'Space Mono',monospace" }}>{pc.department}</span>
        </div>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"1rem", color:"#cdd6f4", letterSpacing:"0.08em", marginBottom:"6px" }}>{pc.hostname}</div>
        {/* Editable swap date */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
          <span style={{ fontSize:"0.6rem", color:"#585b70", fontFamily:"'Space Mono',monospace", textTransform:"uppercase", letterSpacing:"0.1em", whiteSpace:"nowrap" }}>Swap Date</span>
          <input
            type="date"
            value={pc.swapDate ? new Date(pc.swapDate).toISOString().split("T")[0] : ""}
            onChange={e => onSwapDateChange(pc.id, e.target.value)}
            style={{ background:"#181825", border:"1px solid #313244", borderRadius:"5px", color: pc.swapDate ? "#cdd6f4" : "#45475a", fontFamily:"'Space Mono',monospace", fontSize:"0.65rem", padding:"4px 8px", outline:"none", colorScheme:"dark", cursor:"pointer" }}
          />
        </div>
        {pc.lastUpdatedBy && <div style={{ fontSize:"0.62rem", color:"#45475a", fontFamily:"'Space Mono',monospace", marginBottom:"8px" }}>Last updated by {pc.lastUpdatedBy}</div>}
        <StatusBadge status={status}/>
        <ProgressBar checks={pc.checks} department={pc.department}/>
      </div>
      <div style={{ display:"flex", gap:"16px", marginBottom:"14px", padding:"8px 12px", background:"#181825", borderRadius:"6px", border:"1px solid #313244", alignItems:"center" }}>
        {[{state:0,label:"Unselected",color:"#45475a"},{state:1,label:"Complete",color:accent},{state:2,label:"N/A",color:"#f9e2af"}].map(({state,label,color})=>(
          <div key={state} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <CheckBox state={state} accent={accent}/>
            <span style={{ fontSize:"0.6rem", color, fontFamily:"'Space Mono',monospace" }}>{label}</span>
          </div>
        ))}
        <span style={{ fontSize:"0.6rem", color:"#45475a", fontFamily:"'Space Mono',monospace", marginLeft:"auto" }}>click to cycle →</span>
      </div>
      <div style={{ flex:1, overflowY:"auto", marginBottom:"16px" }}>
        {tasks.map((task,i)=>{
          const state = pc.checks[task]??0;
          const textColor = state===0?"#bac2de":state===1?"#585b70":"#f9e2af";
          return (
            <div key={i} onClick={()=>onCycle(pc.id,task,pc.checks)} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 12px", marginBottom:"3px", borderRadius:"6px", cursor:"pointer", background:state!==0?"#1e1e2e":"transparent", border:`1px solid ${state!==0?"#313244":"transparent"}`, transition:"all 0.15s ease" }}>
              <CheckBox state={state} accent={accent}/>
              <span style={{ fontSize:"0.78rem", color:textColor, flex:1, textDecoration:state===1?"line-through":"none", fontFamily:"'Space Mono',monospace", transition:"all 0.15s ease" }}>{task}</span>
              {state===2&&<span style={{ fontSize:"0.55rem", color:"#f9e2af", border:"1px solid #f9e2af", borderRadius:"3px", padding:"1px 5px", fontFamily:"'Space Mono',monospace", letterSpacing:"0.1em" }}>N/A</span>}
            </div>
          );
        })}
      </div>
      <div>
        <div style={{ fontSize:"0.6rem", fontFamily:"'Space Mono',monospace", color:"#585b70", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>Notes</div>
        <textarea value={pc.notes||""} onChange={e=>onNotesChange(pc.id,e.target.value)} placeholder="Add notes about this machine..." style={{ width:"100%", minHeight:"80px", background:"#181825", border:"1px solid #313244", borderRadius:"6px", color:"#cdd6f4", fontFamily:"'Space Mono',monospace", fontSize:"0.75rem", padding:"10px", resize:"vertical", outline:"none", boxSizing:"border-box" }}/>
      </div>
    </div>
  );
}

// --- Add PC Modal ---
function AddPCModal({ onAdd, onClose }) {
  const [company, setCompany] = useState("Blackstone");
  const [department, setDepartment] = useState("Shop Floor");
  const [hostnames, setHostnames] = useState([""]);
  const lastRef = useRef(null);

  const updateHostname = (i, val) => setHostnames(h => h.map((v,idx) => idx===i ? val : v));
  const addRow = () => { setHostnames(h => [...h, ""]); setTimeout(()=>lastRef.current?.focus(),50); };
  const removeRow = (i) => { if (hostnames.length===1) return; setHostnames(h=>h.filter((_,idx)=>idx!==i)); };

  const handleAdd = () => {
    const valid = hostnames.map(h=>h.trim()).filter(Boolean);
    if (valid.length===0) return;
    onAdd(valid, company, department);
  };

  const inp = { width:"100%", background:"#181825", border:"1px solid #313244", borderRadius:"6px", color:"#cdd6f4", fontFamily:"'Space Mono',monospace", fontSize:"0.78rem", padding:"9px 12px", outline:"none", boxSizing:"border-box" };
  const lbl = { fontSize:"0.6rem", color:"#585b70", fontFamily:"'Space Mono',monospace", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"5px", display:"block" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:"16px" }}>
      <div style={{ background:"#1e1e2e", border:"1px solid #313244", borderRadius:"12px", padding:"24px", width:"100%", maxWidth:"400px", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ fontFamily:"'Space Mono',monospace", color:"#cdd6f4", fontSize:"0.9rem", letterSpacing:"0.08em", marginBottom:"18px" }}>Add PC{hostnames.length>1?"s":""}</div>

        {/* Shared settings */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"16px" }}>
          <div>
            <span style={lbl}>Company</span>
            <select value={company} onChange={e=>setCompany(e.target.value)} style={{...inp,cursor:"pointer"}}>
              {COMPANIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <span style={lbl}>Department</span>
            <select value={department} onChange={e=>setDepartment(e.target.value)} style={{...inp,cursor:"pointer"}}>
              {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Hostname rows */}
        <span style={lbl}>Hostname{hostnames.length>1?"s":""}</span>
        <div style={{ display:"flex", flexDirection:"column", gap:"6px", marginBottom:"10px" }}>
          {hostnames.map((h,i)=>(
            <div key={i} style={{ display:"flex", gap:"6px", alignItems:"center" }}>
              <input
                ref={i===hostnames.length-1 ? lastRef : null}
                value={h}
                onChange={e=>updateHostname(i,e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"){e.preventDefault();addRow();} }}
                placeholder={`e.g. SHOP-PC-0${i+1}`}
                style={{...inp,flex:1}}
              />
              {hostnames.length>1&&(
                <button onClick={()=>removeRow(i)} style={{ background:"none", border:"1px solid #313244", borderRadius:"5px", color:"#45475a", cursor:"pointer", padding:"6px 8px", fontSize:"0.8rem", lineHeight:1 }}>✕</button>
              )}
            </div>
          ))}
        </div>

        <button onClick={addRow} style={{ width:"100%", background:"transparent", border:"1px dashed #45475a", borderRadius:"6px", color:"#585b70", fontFamily:"'Space Mono',monospace", fontSize:"0.7rem", padding:"8px", cursor:"pointer", marginBottom:"16px", letterSpacing:"0.05em" }}>+ Add Another PC</button>

        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={handleAdd} style={{ flex:1, background:"#89b4fa", border:"none", borderRadius:"6px", color:"#1e1e2e", fontFamily:"'Space Mono',monospace", fontSize:"0.75rem", padding:"10px", cursor:"pointer", letterSpacing:"0.05em" }}>
            Add {hostnames.filter(h=>h.trim()).length>1 ? `${hostnames.filter(h=>h.trim()).length} PCs` : "PC"}
          </button>
          <button onClick={onClose} style={{ flex:1, background:"transparent", border:"1px solid #313244", borderRadius:"6px", color:"#6c7086", fontFamily:"'Space Mono',monospace", fontSize:"0.75rem", padding:"10px", cursor:"pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [pcs, setPCs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const unsub = onSnapshot(collection(db,"pcs"), snapshot => {
      const data = snapshot.docs.map(d=>({id:d.id,...d.data()}));
      setPCs(data);
      setLoading(false);
    });
    return ()=>unsub();
  }, [currentUser]);

  const addPCs = async (hostnames, company, department) => {
    const tasks = getChecklist(department);
    for (const hostname of hostnames) {
      await addDoc(collection(db,"pcs"), {
        hostname, company, department,
        checks: Object.fromEntries(tasks.map(t=>[t,0])),
        notes: "",
        createdBy: currentUser,
        createdAt: Date.now(),
        swapDate: null,
        lastUpdatedBy: currentUser,
        lastUpdatedAt: Date.now(),
      });
    }
    setShowModal(false);
  };

  const updateSwapDate = async (id, dateStr) => {
    await updateDoc(doc(db,"pcs",id), {
      swapDate: dateStr ? dateToTs(dateStr) : null,
      lastUpdatedBy: currentUser,
      lastUpdatedAt: Date.now(),
    });
  };

  const deletePC = async (id) => {
    await deleteDoc(doc(db,"pcs",id));
    if (selectedId===id) setSelectedId(null);
  };

  const cycleCheck = async (id, task, currentChecks) => {
    const next = ((currentChecks[task]??0)+1)%3;
    await updateDoc(doc(db,"pcs",id), {
      [`checks.${task}`]: next,
      lastUpdatedBy: currentUser,
      lastUpdatedAt: Date.now(),
    });
  };

  const updateNotes = async (id, notes) => {
    await updateDoc(doc(db,"pcs",id), { notes, lastUpdatedBy: currentUser, lastUpdatedAt: Date.now() });
  };

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser}/>;

  const query = search.toLowerCase().trim();
  const filteredPCs = query ? pcs.filter(p => p.hostname?.toLowerCase().includes(query) || p.company?.toLowerCase().includes(query) || p.department?.toLowerCase().includes(query)) : pcs;

  const selectedPC = pcs.find(p=>p.id===selectedId)||null;
  const total = pcs.length;
  const complete = pcs.filter(p=>getStatus(p.checks,p.department)==="Complete").length;
  const inProgress = pcs.filter(p=>getStatus(p.checks,p.department)==="In Progress").length;
  const completedPCs = filteredPCs.filter(p=>getStatus(p.checks,p.department)==="Complete");
  const blackstonePCs = filteredPCs.filter(p=>p.company==="Blackstone");
  const ulrichPCs = filteredPCs.filter(p=>p.company==="Ulrich");

  return (
    <div style={{ minHeight:"100vh", background:"#11111b", fontFamily:"'Space Mono',monospace", color:"#cdd6f4", display:"flex", flexDirection:"column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <style>{`@media(max-width:600px){.hstats{display:none!important}.hsub{display:none!important}} input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5)}`}</style>

      {/* Header */}
      <div style={{ borderBottom:"1px solid #1e1e2e", padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <button onClick={()=>setSidebarOpen(o=>!o)} style={{ background:"transparent", border:"1px solid #313244", borderRadius:"6px", color:"#6c7086", fontFamily:"'Space Mono',monospace", fontSize:"0.75rem", padding:"6px 10px", cursor:"pointer", lineHeight:1, flexShrink:0 }}>
            {sidebarOpen?"◀":"▶"}
          </button>
          <div>
            <div className="hsub" style={{ fontSize:"0.6rem", color:"#45475a", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"1px" }}>BAT PC Project</div>
            <div style={{ fontSize:"0.95rem", color:"#cdd6f4", letterSpacing:"0.08em" }}>Win11 Upgrade Tracker</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
          <div className="hstats" style={{ display:"flex", gap:"16px" }}>
            {[{label:"Total",value:total,color:"#89b4fa"},{label:"Active",value:inProgress,color:"#f38ba8"},{label:"Done",value:complete,color:"#a6e3a1"}].map(({label,value,color})=>(
              <div key={label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"1.1rem", color }}>{value}</div>
                <div style={{ fontSize:"0.5rem", color:"#45475a", textTransform:"uppercase", letterSpacing:"0.1em" }}>{label}</div>
              </div>
            ))}
          </div>
          <button onClick={()=>exportCSV(pcs)} style={{ background:"transparent", border:"1px solid #313244", borderRadius:"6px", color:"#6c7086", fontFamily:"'Space Mono',monospace", fontSize:"0.65rem", padding:"7px 10px", cursor:"pointer", whiteSpace:"nowrap" }}>↓ CSV</button>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", paddingLeft:"12px", borderLeft:"1px solid #313244" }}>
            <span style={{ fontSize:"0.7rem", color:"#6c7086" }}>{currentUser}</span>
            <button onClick={()=>{setCurrentUser(null);setPCs([]);setLoading(true);}} style={{ background:"transparent", border:"1px solid #313244", borderRadius:"5px", color:"#45475a", fontFamily:"'Space Mono',monospace", fontSize:"0.65rem", padding:"5px 10px", cursor:"pointer" }}>Sign Out</button>
          </div>
          <button onClick={()=>setShowModal(true)} style={{ background:"#89b4fa", border:"none", borderRadius:"6px", color:"#1e1e2e", fontFamily:"'Space Mono',monospace", fontSize:"0.7rem", padding:"8px 12px", cursor:"pointer", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>+ Add PC</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        <div style={{ width:sidebarOpen?"300px":"0px", flexShrink:0, borderRight:sidebarOpen?"1px solid #1e1e2e":"none", overflowY:sidebarOpen?"auto":"hidden", overflowX:"hidden", padding:sidebarOpen?"16px":"0", transition:"width 0.25s cubic-bezier(.4,0,.2,1),padding 0.25s", display:"flex", flexDirection:"column" }}>
          {sidebarOpen&&(
            <>
              {/* Search */}
              <div style={{ marginBottom:"12px", position:"relative" }}>
                <span style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", color:"#45475a", fontSize:"0.75rem" }}>⌕</span>
                <input
                  value={search}
                  onChange={e=>setSearch(e.target.value)}
                  placeholder="Search PCs..."
                  style={{ width:"100%", background:"#181825", border:"1px solid #313244", borderRadius:"6px", color:"#cdd6f4", fontFamily:"'Space Mono',monospace", fontSize:"0.75rem", padding:"8px 10px 8px 28px", outline:"none", boxSizing:"border-box" }}
                />
                {search&&<button onClick={()=>setSearch("")} style={{ position:"absolute", right:"8px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#45475a", cursor:"pointer", fontSize:"0.75rem", padding:0 }}>✕</button>}
              </div>
              {loading ? (
                <div style={{ textAlign:"center", color:"#45475a", fontSize:"0.75rem", marginTop:"40px" }}>Loading...</div>
              ) : pcs.length===0 ? (
                <div style={{ textAlign:"center", color:"#45475a", fontSize:"0.75rem", marginTop:"40px", lineHeight:2 }}>No PCs added yet.<br/>Click + Add PC to start.</div>
              ) : (
                <>
                  {blackstonePCs.length>0&&<CompanyGroup company="Blackstone" pcs={blackstonePCs} selectedId={selectedId} onSelect={setSelectedId} onDelete={deletePC}/>}
                  {ulrichPCs.length>0&&<CompanyGroup company="Ulrich" pcs={ulrichPCs} selectedId={selectedId} onSelect={setSelectedId} onDelete={deletePC}/>}
                  <CompletedGroup pcs={completedPCs} selectedId={selectedId} onSelect={setSelectedId} onDelete={deletePC}/>
                </>
              )}
            </>
          )}
        </div>
        <div style={{ flex:1, padding:"24px", overflowY:"auto", minWidth:0 }}>
          <ChecklistPanel pc={selectedPC} onCycle={cycleCheck} onNotesChange={updateNotes} onSwapDateChange={updateSwapDate}/>
        </div>
      </div>

      {showModal&&<AddPCModal onAdd={addPCs} onClose={()=>setShowModal(false)}/>}
    </div>
  );
}