fetch("evidence/foundational-language-v1.json").then((response) => response.json()).then((report) => {
  document.querySelector("#claim").textContent = report.claim;
  document.querySelector("#seal strong").textContent = report.passed ? "PASS" : "FAIL";
  const metrics = [
    ["HOLDOUT ACCURACY", `${(report.metrics.accuracy * 100).toFixed(0)}%`],
    ["AMBIGUOUS ABSTENTION", `${(report.metrics.ambiguousAbstention * 100).toFixed(0)}%`],
    ["PRETEST", report.metrics.pretestAbstention ? "PASS" : "FAIL"],
    ["SOUL ISOLATION", report.metrics.isolation ? "PASS" : "FAIL"],
    ["SHUFFLED CONTROL", `${(report.metrics.shuffledControlMean * 100).toFixed(0)}%`],
  ];
  document.querySelector("#metrics").innerHTML = metrics.map(([label,value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join("");
  document.querySelector("#limitations").innerHTML = report.limitations.map((item) => `<li>${item}</li>`).join("");
  document.querySelector("#hash").textContent = `SHA-256 · ${report.datasetHash}`;
}).catch(() => { document.querySelector("#seal strong").textContent = "ERROR"; });
