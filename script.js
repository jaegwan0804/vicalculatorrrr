function show(opt) {
  // 모두 숨김
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  // 오직 opt에 해당하는 섹션만 보임
  if (opt === "pv") document.getElementById("pvForm").classList.remove("hidden");
  else if (opt === "wind") document.getElementById("windForm").classList.remove("hidden");
  else if (opt === "ess") document.getElementById("essForm").classList.remove("hidden");
  else document.getElementById("selector").classList.remove("hidden");
}
// 처음엔 selector만 보이게
show("selector");

// 대상 선택 버튼 클릭 시
document.querySelectorAll(".big-btn").forEach(btn => {
  btn.onclick = () => show(btn.dataset.opt);
});
// "처음으로" 버튼
document.querySelectorAll("[data-back]").forEach(b => {
  b.onclick = () => show("selector");
});

// 아래는 각 섹션 계산 버튼 예시(실제로는 본인 계산식 대입)
document.getElementById("pvCalc").onclick = function() {
  var P = +document.getElementById("pvCap").value;
  var E = +document.getElementById("pvEner").value;
  if (!P || !E) return alert("값을 모두 입력하세요");
  document.getElementById("pvResult").innerHTML = `<b>입력값:</b><br>용량=${P}MW<br>발전량=${E}MWh`;
  document.getElementById("pvResult").classList.remove("hidden");
};
document.getElementById("wCalc").onclick = function() {
  var P = +document.getElementById("wCap").value;
  var E = +document.getElementById("wEner").value;
  if (!P || !E) return alert("값을 모두 입력하세요");
  document.getElementById("wResult").innerHTML = `<b>입력값:</b><br>용량=${P}MW<br>발전량=${E}MWh`;
  document.getElementById("wResult").classList.remove("hidden");
};
document.getElementById("eCalc").onclick = function() {
  var P = +document.getElementById("eCap").value;
  if (!P) return alert("값을 입력하세요");
  document.getElementById("eResult").innerHTML = `<b>ESS 출력:</b> ${P}MW`;
  document.getElementById("eResult").classList.remove("hidden");
};

