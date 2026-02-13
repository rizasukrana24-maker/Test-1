const monthSelect = document.getElementById("monthSelect");
const dateSelect = document.getElementById("dateSelect");

const kpiTotal = document.getElementById("kpiTotal");
const kpiIdr = document.getElementById("kpiIdr");
const kpiUsd = document.getElementById("kpiUsd");
const kpiTotalMeta = document.getElementById("kpiTotalMeta");

const summaryList = document.getElementById("summaryList");
const splitUtara = document.getElementById("splitUtara");
const splitSelatan = document.getElementById("splitSelatan");
const splitUtaraValue = document.getElementById("splitUtaraValue");
const splitSelatanValue = document.getElementById("splitSelatanValue");

const monthData = buildDummyData();

function buildDummyData() {
  const daysInMonth = 28;
  const data = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const utaraTotal = Math.max(
      8,
      Math.round(18 + 6 * Math.sin((day / daysInMonth) * Math.PI * 2) + (day % 5))
    );
    const selatanTotal = Math.max(
      6,
      Math.round(15 + 5 * Math.cos((day / daysInMonth) * Math.PI * 2) + (day % 4))
    );

    const utaraUsd = Math.max(0, Math.round(utaraTotal * 0.22));
    const selatanUsd = Math.max(0, Math.round(selatanTotal * 0.24));

    data.push({
      tanggal: `2026-02-${String(day).padStart(2, "0")}`,
      kantor: "utara",
      idr: utaraTotal - utaraUsd,
      usd: utaraUsd,
      total: utaraTotal,
    });
    data.push({
      tanggal: `2026-02-${String(day).padStart(2, "0")}`,
      kantor: "selatan",
      idr: selatanTotal - selatanUsd,
      usd: selatanUsd,
      total: selatanTotal,
    });
  }
  return data;
}

function getDailyAggregate(dateString) {
  return monthData
    .filter((row) => row.tanggal === dateString)
    .reduce(
      (acc, row) => {
        acc.idr += row.idr;
        acc.usd += row.usd;
        acc.total += row.total;
        return acc;
      },
      { idr: 0, usd: 0, total: 0 }
    );
}

function getMonthlySeries() {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const byDay = days.map((day) => {
    const tanggal = `2026-02-${String(day).padStart(2, "0")}`;
    const rows = monthData.filter((row) => row.tanggal === tanggal);
    const utara = rows.find((row) => row.kantor === "utara");
    const selatan = rows.find((row) => row.kantor === "selatan");
    return { day, utara, selatan };
  });
  return { days, byDay };
}

function calculateMonthlyTotals() {
  return monthData.reduce(
    (acc, row) => {
      acc.idr += row.idr;
      acc.usd += row.usd;
      acc.total += row.total;
      if (row.kantor === "utara") acc.utara += row.total;
      if (row.kantor === "selatan") acc.selatan += row.total;
      return acc;
    },
    { idr: 0, usd: 0, total: 0, utara: 0, selatan: 0 }
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function updateKpi(dateString) {
  const daily = getDailyAggregate(dateString);
  kpiTotal.textContent = formatNumber(daily.total);
  kpiIdr.textContent = formatNumber(daily.idr);
  kpiUsd.textContent = formatNumber(daily.usd);
  kpiTotalMeta.textContent = `Gabungan Utara + Selatan - ${dateString}`;
}

function updateSummary() {
  const totals = calculateMonthlyTotals();

  const avgPerDay = Math.round((totals.total / 28) * 10) / 10;
  const avgIdr = Math.round((totals.idr / 28) * 10) / 10;
  const avgUsd = Math.round((totals.usd / 28) * 10) / 10;

  summaryList.innerHTML = `
    <div><span>Total Gerakan Bulan Ini</span><strong>${formatNumber(totals.total)}</strong></div>
    <div><span>Total Transaksi IDR</span><strong>${formatNumber(totals.idr)}</strong></div>
    <div><span>Total Transaksi USD</span><strong>${formatNumber(totals.usd)}</strong></div>
    <div><span>Rata-rata Gerakan per Hari</span><strong>${formatNumber(avgPerDay)}</strong></div>
    <div><span>Rata-rata IDR per Hari</span><strong>${formatNumber(avgIdr)}</strong></div>
    <div><span>Rata-rata USD per Hari</span><strong>${formatNumber(avgUsd)}</strong></div>
  `;

  const utaraShare = totals.total === 0 ? 0 : (totals.utara / totals.total) * 100;
  const selatanShare = 100 - utaraShare;
  splitUtara.style.width = `${utaraShare.toFixed(1)}%`;
  splitSelatan.style.width = `${selatanShare.toFixed(1)}%`;
  splitUtaraValue.textContent = `${utaraShare.toFixed(1)}%`;
  splitSelatanValue.textContent = `${selatanShare.toFixed(1)}%`;
}

function createGradient(ctx, colorTop) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, colorTop);
  gradient.addColorStop(1, "rgba(9, 29, 40, 0.05)");
  return gradient;
}

const { days, byDay } = getMonthlySeries();
const monthlyTotals = calculateMonthlyTotals();

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#21586f",
        font: { family: "Work Sans", size: 12 },
      },
    },
    tooltip: {
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderColor: "rgba(29, 183, 196, 0.4)",
      borderWidth: 1,
      titleColor: "#073347",
      bodyColor: "#21586f",
      padding: 10,
    },
  },
  scales: {
    x: {
      grid: { color: "rgba(29, 183, 196, 0.18)" },
      ticks: { color: "#4b7387" },
    },
    y: {
      grid: { color: "rgba(29, 183, 196, 0.18)" },
      ticks: { color: "#4b7387" },
    },
  },
};

const chartTotalCtx = document.getElementById("chartTotal").getContext("2d");
const chartIdrCtx = document.getElementById("chartIdr").getContext("2d");
const chartUsdCtx = document.getElementById("chartUsd").getContext("2d");
const chartDailyStackedCtx = document
  .getElementById("chartDailyStacked")
  .getContext("2d");
const chartCurrencyCtx = document.getElementById("chartCurrency").getContext("2d");

const chartTotal = new Chart(chartTotalCtx, {
  type: "line",
  data: {
    labels: days,
    datasets: [
      {
        label: "Utara",
        data: byDay.map((row) => row.utara.total),
        borderColor: "#25c3c8",
        backgroundColor: createGradient(chartTotalCtx, "rgba(37, 195, 200, 0.35)"),
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
      {
        label: "Selatan",
        data: byDay.map((row) => row.selatan.total),
        borderColor: "#ff9d4d",
        backgroundColor: createGradient(chartTotalCtx, "rgba(255, 157, 77, 0.25)"),
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
    ],
  },
  options: baseChartOptions,
});

const chartIdr = new Chart(chartIdrCtx, {
  type: "line",
  data: {
    labels: days,
    datasets: [
      {
        label: "Utara",
        data: byDay.map((row) => row.utara.idr),
        borderColor: "#25c3c8",
        backgroundColor: createGradient(chartIdrCtx, "rgba(37, 195, 200, 0.3)"),
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2,
      },
      {
        label: "Selatan",
        data: byDay.map((row) => row.selatan.idr),
        borderColor: "#ff9d4d",
        backgroundColor: createGradient(chartIdrCtx, "rgba(255, 157, 77, 0.25)"),
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2,
      },
    ],
  },
  options: baseChartOptions,
});

const chartUsd = new Chart(chartUsdCtx, {
  type: "line",
  data: {
    labels: days,
    datasets: [
      {
        label: "Utara",
        data: byDay.map((row) => row.utara.usd),
        borderColor: "#25c3c8",
        backgroundColor: createGradient(chartUsdCtx, "rgba(37, 195, 200, 0.25)"),
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2,
      },
      {
        label: "Selatan",
        data: byDay.map((row) => row.selatan.usd),
        borderColor: "#ff9d4d",
        backgroundColor: createGradient(chartUsdCtx, "rgba(255, 157, 77, 0.2)"),
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 2,
      },
    ],
  },
  options: baseChartOptions,
});

const stackedChartOptions = {
  ...baseChartOptions,
  scales: {
    x: { ...baseChartOptions.scales.x, stacked: true },
    y: { ...baseChartOptions.scales.y, stacked: true },
  },
};

const chartDailyStacked = new Chart(chartDailyStackedCtx, {
  type: "bar",
  data: {
    labels: days,
    datasets: [
      {
        label: "Utara",
        data: byDay.map((row) => row.utara.total),
        backgroundColor: "rgba(37, 195, 200, 0.65)",
        borderRadius: 6,
        stack: "daily",
      },
      {
        label: "Selatan",
        data: byDay.map((row) => row.selatan.total),
        backgroundColor: "rgba(255, 157, 77, 0.6)",
        borderRadius: 6,
        stack: "daily",
      },
    ],
  },
  options: stackedChartOptions,
});

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "55%",
  plugins: {
    legend: {
      labels: {
        color: "#21586f",
        font: { family: "Work Sans", size: 12 },
      },
    },
    tooltip: {
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderColor: "rgba(29, 183, 196, 0.4)",
      borderWidth: 1,
      titleColor: "#073347",
      bodyColor: "#21586f",
      padding: 10,
    },
  },
};

const chartCurrency = new Chart(chartCurrencyCtx, {
  type: "doughnut",
  data: {
    labels: ["IDR", "USD"],
    datasets: [
      {
        data: [monthlyTotals.idr, monthlyTotals.usd],
        backgroundColor: ["rgba(37, 195, 200, 0.75)", "rgba(255, 157, 77, 0.7)"],
        borderColor: "rgba(7, 25, 38, 0.9)",
        borderWidth: 2,
      },
    ],
  },
  options: doughnutOptions,
});

dateSelect.addEventListener("change", (event) => {
  updateKpi(event.target.value);
});

monthSelect.addEventListener("change", () => {
  updateKpi(dateSelect.value);
});

updateKpi(dateSelect.value);
updateSummary();
