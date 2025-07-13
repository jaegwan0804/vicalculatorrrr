/* 공통 상수 */
const hour720   = 720;
const kFactor   = 1.066;        // 시간 가중치
const unitPrice = 18_000;       // 원/VIC

/* 페이지 전환 */
document.querySelectorAll(".big-btn").forEach(btn=>{
  btn.onclick = ()=>showForm(btn.dataset.opt);
});
document.querySelectorAll("[data-back]").forEach(b=>{
  b.onclick = ()=>showForm("home");
});
function showForm(opt){
  document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
  if(opt==="pv"||opt==="pvess")      document.getElementById("pvForm").classList.remove("hidden");
  else if(opt==="wind"||opt==="windess") document.getElementById("windForm").classList.remove("hidden");
  else if(opt==="ess")               document.getElementById("essForm").classList.remove("hidden");
  else                               document.getElementById("selector").classList.remove("hidden");
  currentOpt = opt;
}
let currentOpt="home";      // 선택 상태 저장

/* ─────── 태양광 & ESS-연계 태양광 ─────── */
document.getElementById("pvCalc").onclick = ()=>{
  const role = document.querySelector("#pvKinds .mini-btn.active")?.dataset.role||"ground";
  const P = +document.getElementById("pvCap").value;
  const E = +document.getElementById("pvEner").value;
  if(!P||!E) return alert("입력값을 확인하세요");

  /* 가중치 W */
  let W = (role==="building")?1.6:1.4;          // 기본
  if(currentOpt==="pvess") W = 1.7;             // ESS 연계 태양광

  const CF  = E/(P*hour720);
  const VIC = 3*P*0.9*CF*W*kFactor*hour720;     // H=3
  const obl = CF*E;
  const rev = (VIC-obl)*unitPrice;

  print("#pvResult",
    `설비 유형&nbsp;: <b>${currentOpt==="pvess"?"ESS 연계":"태양광"}</b><br>`+
    `부지 유형&nbsp;: <b>${role==="building"?"건축물":"일반부지"}</b><br>`+
    `가중치 W&nbsp;&nbsp;: <b>${W}</b><br><br>`+
    resultLines(VIC,obl,rev)
  );
};

/* 역할 버튼 active 토글 */
document.querySelectorAll("#pvKinds .mini-btn, #windKinds .mini-btn").forEach(btn=>{
  btn.onclick = ()=>{
    btn.parentElement.querySelectorAll(".mini-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    if(btn.dataset.role==="offshore") document.getElementById("distWrap").classList.remove("hidden");
    else if(btn.parentElement.id==="windKinds") document.getElementById("distWrap").classList.add("hidden");
  };
});

/* ─────── 풍력 & ESS-연계 풍력 ─────── */
document.getElementById("wCalc").onclick = ()=>{
  const role=document.querySelector("#windKinds .mini-btn.active")?.dataset.role||"onshore";
  const P=+document.getElementById("wCap").value;
  const E=+document.getElementById("wEner").value;
  if(!P||!E) return alert("입력값을 확인하세요");

  /* W 결정 */
  let W;
  if(role==="onshore"){ W=1.3; }
  else{  // 해상
    const d=+document.getElementById("wDist").value;
    if(!d&&d!==0) return alert("해상은 거리(km)를 입력해야 합니다");
    W = d<=5  ?1.3 : d<=10 ?1.4 :1.5;
  }
  if(currentOpt==="windess") W = 1.5;   // ESS 연계 풍력

  const CF  = E/(P*hour720);
  const VIC = 4*P*0.9*CF*W*kFactor*hour720;     // H=4
  const obl = CF*E;
  const rev = (VIC-obl)*unitPrice;

  print("#wResult",
    `설비 유형&nbsp;: <b>${currentOpt==="windess"?"ESS 연계":"풍력"}</b><br>`+
    `세부 종류&nbsp;: <b>${role==="onshore"?"육상":"해상"}</b>${role==="offshore"?" ("+document.getElementById("wDist").value+" km)":""}<br>`+
    `가중치 W&nbsp;&nbsp;: <b>${W}</b><br><br>`+
    resultLines(VIC,obl,rev)
  );
};

/* ─────── ESS 단독 (간단식) ─────── */
document.getElementById("eCalc").onclick = ()=>{
  const P = +document.getElementById("eCap").value;
  const stand = +document.getElementById("eStand").value;
  const dis   = +document.getElementById("eDis").value;
  const ksum  = +document.getElementById("eKsum").value;
  if(!P||!stand||!dis||!ksum) return alert("모든 값을 입력하세요");

  const CF  = dis/24;
  const VIC = 4*P*(stand/24)*CF*1*ksum;   // ESS 식 (H=4, W=1)
  const obl = P*dis*CF;                   // 의무량 예시식
  const rev = (VIC-obl)*unitPrice;

  print("#eResult",
    `ESS 정격&nbsp;: <b>${P} MW</b><br>`+
    `대기·방출&nbsp;: <b>${stand}h / ${dis}h</b><br>`+
    `Σk_hour&nbsp;&nbsp;&nbsp;: <b>${ksum}</b><br><br>`+
    resultLines(VIC,obl,rev)
  );
};

/* ─────── 출력 헬퍼 ─────── */
function resultLines(VIC,obl,rev){
  return `월간 VIC 발급량&nbsp;: <b>${VIC.toFixed(3)}</b> VIC<br>`+
         `월간 VIC 의무량&nbsp;: <b>${obl.toFixed(3)}</b> VIC<br>`+
         `월간 총 수익&nbsp;&nbsp;&nbsp;: <b>${rev.toLocaleString()} 원</b>`;
}
function print(id,html){
  const box=document.querySelector(id);
  box.innerHTML=html;
  box.classList.remove("hidden");
}
