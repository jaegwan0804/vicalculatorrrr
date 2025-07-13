/* ───────── 공통 상수 ───────── */
const hour720 = 720, kFactor = 1.066, unit = 18000;

/* ───────── 네비게이션 ───────── */
let currentOpt="home";
show("selector");
document.querySelectorAll(".big-btn").forEach(b=>b.onclick=(()=>show(b.dataset.opt)));
document.querySelectorAll("[data-back]").forEach(b=>b.onclick=(()=>show("selector")));

function show(opt){
  currentOpt=opt;
  document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
  if(opt==="pv"||opt==="pvess")      q("#pvForm").classList.remove("hidden");
  else if(opt==="wind"||opt==="windess") q("#windForm").classList.remove("hidden");
  else if(opt==="ess")               q("#essForm").classList.remove("hidden");
  else                               q("#selector").classList.remove("hidden");
}
/* helper */
const q=(sel)=>document.querySelector(sel);

/* ─────── 태양광 & ESS-연계 태양광 ─────── */
q("#pvKinds").onclick=e=>{
  if(e.target.classList.contains("mini-btn")){
    q("#pvKinds .mini-btn.active")?.classList.remove("active");
    e.target.classList.add("active");
  }
};
q("#pvCalc").onclick=()=>{
  const role=q("#pvKinds .mini-btn.active")?.dataset.role||"ground";
  const P=+q("#pvCap").value, E=+q("#pvEner").value;
  if(!P||!E) return alert("값을 입력하세요");

  let W=(role==="building")?1.6:1.4;
  if(currentOpt==="pvess") W=1.7;

  const CF=E/(P*hour720);
  const VIC=3*P*0.9*CF*W*kFactor*hour720;
  const obl=CF*E, rev=(VIC-obl)*unit;

  print("#pvResult",
    `발급 대상&nbsp;: <b>${currentOpt==="pvess"?"ESS 연계 태양광":"태양광"}</b><br>`+
    `부지 유형&nbsp;: <b>${role==="building"?"건축물":"일반부지"}</b><br>`+
    output(VIC,obl,rev)
  );
};

/* ─────── 풍력 & ESS-연계 풍력 ─────── */
q("#windKinds").onclick=e=>{
  if(e.target.classList.contains("mini-btn")){
    q("#windKinds .mini-btn.active")?.classList.remove("active");
    e.target.classList.add("active");
    q("#distWrap").classList.toggle("hidden",e.target.dataset.role!=="offshore");
  }
};
q("#wCalc").onclick=()=>{
  const role=q("#windKinds .mini-btn.active")?.dataset.role||"onshore";
  const P=+q("#wCap").value, E=+q("#wEner").value;
  if(!P||!E) return alert("값을 입력하세요");

  let W;
  if(role==="onshore"){ W=1.3; }
  else{
    const d=+q("#wDist").value;
    if(!d&&d!==0) return alert("해상 거리 입력");
    W= d<=5?1.3 : d<=10?1.4 :1.5;
  }
  if(currentOpt==="windess") W=1.5;

  const CF=E/(P*hour720);
  const VIC=4*P*0.9*CF*W*kFactor*hour720;
  const obl=CF*E, rev=(VIC-obl)*unit;

  print("#wResult",
    `발급 대상&nbsp;: <b>${currentOpt==="windess"?"ESS 연계 풍력":"풍력"}</b><br>`+
    `세부 종류&nbsp;: <b>${role==="onshore"?"육상":"해상"}</b>`+
    (role==="offshore"?" ("+q("#wDist").value+" km)": "")+"<br>"+
    output(VIC,obl,rev)
  );
};

/* ─────── ESS 단독 (24칸 스케줄러) ─────── */
const kTable=[0.6,0.6,0.6,0.6,0.6,0.6,1.2,1.2,1.2,1.2,1.0,1.0,1.0,1.0,1.0,1.4,1.4,1.4,1.5,1.5,1.5,0.7,0.7,0.7];
const states=Array(24).fill(0); // 0빈 1대기 2방출 3충전
for(let h=0;h<24;h++){
  const wrap=document.createElement("div"); wrap.className="wrap";
  const cell=document.createElement("div"); cell.className="cell";
  cell.onclick=()=>{states[h]=(states[h]+1)%4; cell.className="cell "+["","standby","discharge","charge"][states[h]]; updateSum();};
  const lbl=document.createElement("div"); lbl.className="time-label";
  lbl.textContent=`${String(h).padStart(2,"0")}:00\n~${String((h+1)%24).padStart(2,"0")}:00`;
  wrap.append(cell,lbl); q("#grid").appendChild(wrap);
}
function updateSum(){
  let st=0,ds=0,ch=0,ks=0;
  states.forEach((s,i)=>{if(s===1){st++;ks+=kTable[i];} if(s===2)ds++; if(s===3)ch++;});
  q("#summary").innerHTML=`대기 ${st}h | 방출 ${ds}h | 충전 ${ch}h&nbsp;&nbsp;Σk = ${ks.toFixed(1)}`;
  return {st,ds,ks};
}
q("#eCalc").onclick=()=>{
  const P=+q("#eCap").value; if(!P) return alert("정격출력 입력");
  const {st,ds,ks}=updateSum();
  const VIC=4*P*(st/24)*(ds/24)*1*ks;
  const obl=P*ds*(ds/24);  // 예시식
  print("#eResult",output(VIC,obl,(VIC-obl)*unit));
};

/* ─────── 출력 헬퍼 ─────── */
function output(VIC,obl,rev){
  return `가중치 W&nbsp;: <b>${(rev/(VIC-obl)/unit||"-").toFixed?((rev/(VIC-obl))/unit).toFixed(2):"-"}</b><br><br>`+
         `월간 VIC 발급량&nbsp;: <b>${VIC.toFixed(3)}</b> VIC<br>`+
         `월간 VIC 의무량&nbsp;: <b>${obl.toFixed(3)}</b> VIC<br>`+
         `월간 총 수익&nbsp;&nbsp;&nbsp;: <b>${rev.toLocaleString()} 원</b>`;
}
function print(sel,html){const box=q(sel); box.innerHTML=html; box.classList.remove("hidden");}
