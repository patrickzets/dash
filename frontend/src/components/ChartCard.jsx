import React, { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Filler, Tooltip, Legend, Title,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import axios from "axios";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Filler, Tooltip, Legend, Title,
);

const PALETTE = [
  "#796DD6", "#67D6C2", "#D9143E", "#F59E0B", "#06B6D4",
  "#F97316", "#10B981", "#EC4899", "#3B82F6", "#84CC16",
];

const CHART_TYPES = [
  { value: "bar",      label: "Barras" },
  { value: "line",     label: "Linha"  },
  { value: "pie",      label: "Pizza"  },
  { value: "doughnut", label: "Rosca"  },
  { value: "area",     label: "Área"   },
];

const genColors = (n) => Array.from({ length: n }, (_, i) => PALETTE[i % PALETTE.length]);

// ── Plugin de percentual para pizza / rosca ────────────────────────────────
const percentageLabelPlugin = {
  id: "percentageLabels",
  afterDraw(chart) {
    const type = chart.config.type;
    if (type !== "pie" && type !== "doughnut") return;
    const { ctx, data } = chart;
    const dataset = data.datasets[0];
    const total = dataset.data.reduce((s, v) => s + (Number(v) || 0), 0);
    if (!total) return;
    chart.getDatasetMeta(0).data.forEach((arc, i) => {
      const pct = (dataset.data[i] / total) * 100;
      if (pct < 4) return;
      const center = arc.getCenterPoint();
      ctx.save();
      ctx.font         = "bold 12px 'Inter', sans-serif";
      ctx.fillStyle    = "rgba(255,255,255,0.97)";
      ctx.shadowColor  = "rgba(0,0,0,0.4)";
      ctx.shadowBlur   = 4;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${pct.toFixed(1)}%`, center.x, center.y);
      ctx.restore();
    });
  },
};
ChartJS.register(percentageLabelPlugin);

// ── Helpers ────────────────────────────────────────────────────────────────
function slugify(str) {
  return (str || "grafico")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const ChartCard = forwardRef(function ChartCard({ chart, onRemove, onUpdate, API, color }, ref) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const chartRef              = useRef(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => chartRef.current?.canvas || null,
    getTitle:  () => chart.title,
    getType:   () => chart.chart_type,
    getColor:  () => color,
  }));

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (chart.compare_by) {
        // 1) buscar valores únicos da coluna de comparação
        const uniqRes = await axios.get(`${API}/aggregate`, {
          params: { group_by: chart.compare_by, agg_func: "count", limit: 20 },
        });
        const compareValues = uniqRes.data.labels.slice(0, 8); // max 8 séries

        // 2) uma requisição por valor — paralelas
        const requests = compareValues.map((val) =>
          axios.get(`${API}/aggregate`, {
            params: {
              group_by:   chart.group_by,
              agg_func:   chart.agg_func || "count",
              limit:      30,
              filter_col: chart.compare_by,
              filter_val: val,
              ...(chart.value_col ? { value_col: chart.value_col } : {}),
            },
          }).catch(() => ({ data: { labels: [], values: [] } })),
        );
        const results = await Promise.all(requests);

        // 3) unificar labels (eixo X)
        const allLabels = [
          ...new Set(results.flatMap((r) => r.data.labels)),
        ].sort();

        setData({
          isMulti: true,
          labels:  allLabels,
          series:  results.map((r, i) => ({
            name:   compareValues[i],
            values: allLabels.map((lbl) => {
              const idx = r.data.labels.indexOf(lbl);
              return idx >= 0 ? r.data.values[idx] : 0;
            }),
          })),
          total_groups: allLabels.length,
        });
      } else {
        // Série única — comportamento original
        const params = {
          group_by: chart.group_by,
          agg_func: chart.agg_func || "count",
          limit:    30,
        };
        if (chart.value_col) params.value_col = chart.value_col;
        const res = await axios.get(`${API}/aggregate`, { params });
        setData({ ...res.data, isMulti: false });
      }
    } catch (e) {
      setError(e.response?.data?.detail || "Erro ao carregar dados.");
    } finally { setLoading(false); }
  }, [chart.group_by, chart.value_col, chart.agg_func, chart.compare_by, API]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Construir dados do Chart.js ──────────────────────────────────────────
  const effectiveType = (() => {
    const t = chart.chart_type === "area" ? "line" : chart.chart_type;
    // Pie/doughnut não suportam multi-series → usa bar
    if (data?.isMulti && (t === "pie" || t === "doughnut")) return "bar";
    return t;
  })();
  const isMultiColor = effectiveType === "pie" || effectiveType === "doughnut";

  const buildChartData = () => {
    if (!data) return null;

    if (data.isMulti) {
      return {
        labels: data.labels,
        datasets: data.series.map((series, i) => {
          const c = PALETTE[i % PALETTE.length];
          return {
            label:           series.name,
            data:            series.values,
            backgroundColor: c + (effectiveType === "bar" ? "bb" : "33"),
            borderColor:     c,
            borderWidth:     2,
            fill:            chart.chart_type === "area",
            tension:         0.4,
            pointRadius:     effectiveType === "line" ? 4 : 0,
            pointHoverRadius: 6,
          };
        }),
      };
    }

    // Série única
    const colors = genColors(data.labels.length);
    return {
      labels: data.labels,
      datasets: [{
        label:           chart.value_col || "Contagem",
        data:            data.values,
        backgroundColor: isMultiColor ? colors.map(c => c + "cc") : color + "33",
        borderColor:     isMultiColor ? colors : color,
        borderWidth:     2,
        fill:            chart.chart_type === "area",
        tension:         0.4,
        pointRadius:     effectiveType === "line" ? 4 : 0,
        pointHoverRadius: 6,
        hoverOffset:     isMultiColor ? 8 : 0,
      }],
    };
  };

  const showLegend = data?.isMulti || isMultiColor;

  const chartOptions = {
    responsive:           true,
    maintainAspectRatio:  false,
    animation:            { duration: 600, easing: "easeInOutQuart" },
    plugins: {
      legend: {
        display:  showLegend,
        position: "bottom",
        labels: {
          padding:         12,
          font:            { size: 11, family: "'Inter', sans-serif" },
          color:           "#6b7280",
          usePointStyle:   true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,14,23,0.92)",
        titleColor:      "#e5e7eb",
        bodyColor:       "#d1d5db",
        borderColor:     color,
        borderWidth:     1,
        padding:         10,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y ?? ctx.parsed;
            const num = typeof val === "number"
              ? val.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
              : val;
            // Percentual no tooltip de pizza
            if (isMultiColor && data && !data.isMulti) {
              const total = data.values.reduce((s, v) => s + v, 0);
              const pct   = total ? ((ctx.parsed / total) * 100).toFixed(1) : "0.0";
              return ` ${ctx.dataset.label}: ${num}  (${pct}%)`;
            }
            return ` ${ctx.dataset.label}: ${num}`;
          },
        },
      },
    },
    scales: !isMultiColor ? {
      x: {
        grid:  { color: "rgba(107,114,128,0.08)" },
        ticks: { color: "#9ca3af", maxRotation: 45, font: { size: 10 } },
        stacked: false,
      },
      y: {
        grid:  { color: "rgba(107,114,128,0.08)" },
        ticks: {
          color: "#9ca3af", font: { size: 10 },
          callback: (v) => typeof v === "number" ? v.toLocaleString("pt-BR") : v,
        },
        beginAtZero: true,
        stacked: false,
      },
    } : undefined,
  };

  // ── Exportar PNG individual ──────────────────────────────────────────────
  const handleExport = () => {
    const src = chartRef.current?.canvas;
    if (!src) return;

    const TITLE_H = 52;
    const PAD     = 16;
    const out     = document.createElement("canvas");
    out.width  = src.width + PAD * 2;
    out.height = src.height + TITLE_H + PAD;
    const ctx  = out.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);

    const grad = ctx.createLinearGradient(0, 0, out.width, 0);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + "88");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, out.width, TITLE_H);

    const typeLabel = CHART_TYPES.find(t => t.value === chart.chart_type)?.label || chart.chart_type;
    const subtitle  = chart.compare_by ? `  ×  ${chart.compare_by}` : "";
    const name      = `${chart.title}  ·  ${typeLabel}${subtitle}`;

    ctx.font         = "bold 15px 'Inter', -apple-system, sans-serif";
    ctx.fillStyle    = "#ffffff";
    ctx.textAlign    = "left";
    ctx.textBaseline = "middle";
    ctx.shadowColor  = "rgba(0,0,0,0.2)";
    ctx.shadowBlur   = 4;
    ctx.fillText(name, PAD, TITLE_H / 2);
    ctx.shadowBlur   = 0;

    ctx.drawImage(src, PAD, TITLE_H, src.width, src.height);

    const link = document.createElement("a");
    link.download = `${slugify(chart.title)}-${chart.chart_type}.png`;
    link.href     = out.toDataURL("image/png");
    link.click();
  };

  const ChartComponent = { bar: Bar, line: Line, pie: Pie, doughnut: Doughnut }[effectiveType] || Bar;
  const chartData      = buildChartData();
  const typeLabel      = CHART_TYPES.find(t => t.value === chart.chart_type)?.label || chart.chart_type;

  // ── Aviso de tipo incompatível com comparação ────────────────────────────
  const showTypeWarning =
    data?.isMulti && (chart.chart_type === "pie" || chart.chart_type === "doughnut");

  return (
    <div
      className="chart-card bg-white dark:bg-gray-850 rounded-2xl overflow-hidden flex flex-col"
      style={{
        boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        border:    "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* Faixa colorida */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
            style={{ background: color + "22", color }}
          >
            {typeLabel}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
              {chart.title}
            </h3>
            {chart.compare_by && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">
                comparando por <span className="font-semibold" style={{ color }}>{chart.compare_by}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <select
            value={chart.chart_type}
            onChange={(e) => onUpdate({ chart_type: e.target.value })}
            className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1
                       bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
          >
            {CHART_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <button
            onClick={handleExport}
            title="Exportar PNG"
            className="p-1.5 rounded-lg transition-all hover:scale-110"
            style={{ color, background: color + "15" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          <button
            onClick={onRemove}
            title="Remover"
            className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600
                       hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Aviso de tipo incompatível */}
      {showTypeWarning && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2"
          style={{ background: "#F59E0B18", border: "1px solid #F59E0B44", color: "#B45309" }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          Pizza/Rosca não suportam múltiplas séries. Exibindo como barras.
        </div>
      )}

      {/* Área do gráfico */}
      <div className="p-4 flex-1" style={{ height: showTypeWarning ? 248 : 280 }}>
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div
              className="w-8 h-8 rounded-full animate-spin"
              style={{ border: `3px solid ${color}33`, borderTopColor: color }}
            />
            {chart.compare_by && (
              <p className="text-xs text-gray-400">Carregando séries de comparação…</p>
            )}
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <p className="text-sm text-red-400 mb-2">{error}</p>
              <button onClick={fetchData} className="text-xs font-medium hover:underline" style={{ color }}>
                Tentar novamente
              </button>
            </div>
          </div>
        ) : chartData ? (
          <ChartComponent ref={chartRef} data={chartData} options={chartOptions} />
        ) : null}
      </div>

      {/* Footer */}
      {data && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {data.total_groups} categorias
          </span>
          <span>·</span>
          {data.isMulti ? (
            <span>{data.series?.length} séries comparadas</span>
          ) : (
            <span>Mostrando {data.labels?.length} itens</span>
          )}
        </div>
      )}
    </div>
  );
});

export default ChartCard;
