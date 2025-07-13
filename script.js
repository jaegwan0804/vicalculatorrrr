/* ───────── 헬퍼 ───────── */
const q = sel => document.querySelector(sel);            // DOM 셀렉터

/* ───────── 공통 상수 ───────── */
const H_PV = 3, H_WIND = 4;          // H_vir
const A = 0.9;                       // 가용률
const kFactor = 1.066;               // 시간 가중치 Σk_hour
const unit = 18_000;                 // 단가 (원/VIC)
const HOUR_720 = 720;                // 1개월 720h

/* ───────── 네비게이션 (섹션 전환) ───────── */
let currentOpt = "home";

function show(opt) {
  currentOpt = opt;
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));

  if (opt === "pv" || opt === "pvess")      q("#pvForm").classList.remove("hidden");
  else if (opt === "wind" || opt === "windess") q("#windForm").classList.remove("hidden");
  else if (opt === "ess")                   q("#essForm").classList.remove("hidden");
  else                                      q("#selector").classList.remove("hidden");
}

/* 첫 화면 */
show("selector");

/* 큰 버튼 5개 & 돌아가기 */
document.querySelectorAll(".big-btn").forEach(btn => btn.onclick = () => show(btn.dataset.opt));
document.querySelectorAll("[data-back]").forEach(b => b.onclick = () => show("selector"));

/* ─────── 태양광 & ESS 연계 태양광 ─────── */
q("#pvKinds").onclick = e => {
  if (e.target.classList.contains("mini-btn")) {
    q("#pvKinds .mini-btn.active")?.classList.remove("active");
    e.target.classList.add("active");
  }
};

q("#pvCalc").onclick = () => {
  const role = q("#pvKinds .mini-btn.active")?.dataset.role || "ground";
  const P = +q("#pvCap").value, E = +q("#pvEner").value;
  if (!P || !E) return alert("용량과 발전량을 모두 입력하세요");

  /* 가중치 W */
  let W = role === "building" ? 1.6 : 1.4;
  if (currentOpt === "pvess") W = 1.7;

  /* 계산 */
  const CF = E / (P * HOUR_720);
  const VIC = H_PV * P * A * CF * W * kFactor * HOUR_720;
  const obl = CF * E;
  const rev = (VIC - obl) * unit;

  print("#pvResult",
    `발급 대상&nbsp;: <b>${currentOpt === "pvess" ? "ESS 연계 태양광" : "태양광"}</b><br>` +
    `부지 유형&nbsp;: <b>${role === "building" ? "건축물" : "일반부지"}</b><br><br>` +
    lines(VIC, obl, rev)
  );
};

/* ─────── 풍력 & ESS 연계 풍력 ─────── */
q("#windKinds").onclick = e => {
  if (e.target.classList.contains("mini-btn")) {
    q("#windKinds .mini-btn.active")?.classList.remove("active");
    e.target.classList.add("active");
    q("#distWrap").classList.toggle("hidden", e.target.dataset.role !== "offshore");
  }
};

q("#wCalc").onclick = () => {
  const role = q("#windKinds .mini-btn.active")?.dataset.role || "onshore";
  const P = +q("#wCap").value, E = +q("#wEner").value;
  if (!P || !E) return alert("용량과 발전량을 모두 입력하세요");

  /* 가중치 W */
  let W;
  if (role === "onshore") {
    W = 1.3;
  } else {
    const d = +q("#wDist").value;
    if (isNaN(d)) return alert("해상 풍력은 연안 거리(km)를 입력해야 합니다");
    W = d <= 5 ? 1.3 : d <= 10 ? 1.4 : 1.5;
  }
  if (currentOpt === "windess") W = 1.5;

  /* 계산 */
  const CF = E / (P * HOUR_720);
  const VIC = H_WIND * P * A * CF * W * kFactor * HOUR_720;
  const obl = CF * E;
  const rev = (VIC - obl) * unit;

  print("#wResult",
    `발급 대상&nbsp;: <b>${currentOpt === "windess" ? "ESS 연계 풍력" : "풍력"}</b><br>` +
    `세부 종류&nbsp;: <b>${role === "onshore" ? "육상" : "해상"}</b>` +
    (role === "offshore" ? ` (${q("#wDist").value} km)` : "") + "<br><br>" +
    lines(VIC, obl, rev)
  );
};

/* ─────── ESS 단독 스케줄러 ─────── */
/* k테이블 & 셀 상태 */
const kTable = [0.6,0.6,0.6,0.6,0.6,0.6,1.2,1.2,1.2,1.2,1.0,1.0,1.0,1.0,1.0,1.4,1.4,1.4,1.5,1.5,1.5,0.7,0.7,0.7];
const states = Array(24).fill(0);       // 0빈 1대기 2방출 3충전

/* 그리드 생성 */
for (let h = 0; h < 24; h++) {
  const wrap = document.createElement("div"); wrap.className = "wrap";
  const cell = document.createElement("div"); cell.className = "cell";
  cell.onclick = () => {
    states[h] = (states[h] + 1) % 4;
    cell.className = "cell " + ["", "standby", "discharge", "charge"][states[h]];
    updateSum();
  };
  const lbl = document.createElement("div"); lbl.className = "time-label";
  lbl.textContent = `${String(h).padStart(2, "0")}:00\n~${String((h + 1) % 24).padStart(2, "0")}:00`;
  wrap.append(cell, lbl); q("#grid").appendChild(wrap);
}

/* 요약 업데이트 */
function updateSum() {
  let st = 0, ds = 0, ch = 0, ks = 0;
  states.forEach((s, i) => {
    if (s === 1) { st++; ks += kTable[i]; }
    if (s === 2) ds++;
    if (s === 3) ch++;
  });
  q("#summary").innerHTML = `대기 ${st}h | 방출 ${ds}h | 충전 ${ch}h&nbsp;&nbsp;Σk = ${ks.toFixed(1)}`;
  return { st, ds, ch, ks };
}

q("#eCalc").onclick = () => {
  const P = +q("#eCap").value;
  if (!P) return alert("ESS 정격출력을 입력하세요");
  const { st, ds, ks } = updateSum();
  const CF = ds / 24, A_ess = st / 24;
  const VIC = 4 * P * A_ess * CF * 1 * ks;   // W=1
  const obl = P * ds * CF;
  const rev = (VIC - obl) * unit;
  print("#eResult", lines(VIC, obl, rev));
};

/* ─────── 출력 함수 ─────── */
function lines(VIC, obl, rev) {
  return `월간 VIC 발급량&nbsp;: <b>${VIC.toFixed(3)}</b> VIC<br>` +
         `월간 VIC 의무량&nbsp;: <b>${obl.toFixed(3)}</b> VIC<br>` +
         `월간 총 수익&nbsp;&nbsp;&nbsp;: <b>${rev.toLocaleString()} 원</b>`;
}

function print(sel, html) {
  const box = q(sel);
  box.innerHTML = html;
  box.classList.remove("hidden");
}


