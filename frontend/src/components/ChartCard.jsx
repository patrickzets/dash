import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Filler, Tooltip, Legend, Title,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import axios from "axios";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Filler, Tooltip, Legend, Title);

const PALETTE = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16","#ec4899","#6366f1"];
const CHART_TYPES = [
  { value: "bar", label: "Barras" },
  { value: "line", label: "Linha" },
  { value: "pie", label: "Pizza" },
  { value: "doughnut", label: "Rosca" },
  { value: "area", label: "Área" },
];
const genColors = (n) => Array.from({ length: n }, (_, i) => PALETTE[i % PALETTE.length]);

export default function ChartCard({ chart, onRemove, onUpdate, API, color }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { group_by: chart.group_by, agg_func: chart.agg_func || "count", limit: 30 };
      if (chart.value_col) params.value_col = chart.value_col;
      const res = await axios.get(`${API}/aggregate`, { params });
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Erro ao carregar dados.");
    } finally { setLoading(false); }
  }, [chart.group_by, chart.value_col, chart.agg_func, API]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = () => {
    const canvas = chartRef.current?.canvas;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${chart.title || "grafico"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const chartType = chart.chart_type === "area" ? "line" : chart.chart_type;
  const isMultiColor = chartType === "pie" || chartType === "doughnut";

  const buildChartData = () => {
    if (!data) return null;
    const colors = genColors(data.labels.length);
    return {
      labels: data.labels,
      datasets: [{
        label: chart.value_col || "Contagem",
        data: data.values,
        backgroundColor: isMultiColor ? colors.map(c => c + "cc") : color + "33",
        borderColor: isMultiColor ? colors : color,
        borderWidth: 2,
        fill: chart.chart_type === "area",
        tension: 0.4,
        pointRadius: chartType === "line" ? 4 : 0,
        pointHoverRadius: 6,
      }],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: isMultiColor,
        position: "bottom",
        labels: { padding: 12, font: { size: 11 }, color: "#6b7280" },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y ?? ctx.parsed;
            return ` ${typeof val === "number" ? val.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : val}`;
          },
        },
      },
    },
    scales: !isMultiColor ? {
      x: { grid: { color: "rgba(107,114,128,0.1)" }, ticks: { color: "#9ca3af", maxRotation: 45, font: { size: 10 } } },
      y: { grid: { color: "rgba(107,114,128,0.1)" }, ticks: { color: "#9ca3af", font: { size: 10 }, callback: (v) => typeof v === "number" ? v.toLocaleString("pt-BR") : v }, beginAtZero: true },
    } : undefined,
  };

  const ChartComponent = { bar: Bar, line: Line, pie: Pie, doughnut: Doughnut }[chartType] || Bar;
  const chartData = buildChartData();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1 pr-2">{chart.title}</h3>
        <div className="flex items-center gap-1">
          <select value={chart.chart_type} onChange={(e) => onUpdate({ chart_type: e.target.value })}
            className="text-xs border border-gray-200 dark:border-gray-600 rounded-md px-1.5 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none">
            {CHART_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button onClick={handleExport} title="Exportar PNG"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button onClick={onRemove} title="Remover"
            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-4" style={{ height: "280px" }}>
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <p className="text-sm text-red-500 mb-2">{error}</p>
              <button onClick={fetchData} className="text-xs text-blue-500 hover:underline">Tentar novamente</button>
            </div>
          </div>
        ) : chartData ? (
          <ChartComponent ref={chartRef} data={chartData} options={chartOptions} />
        ) : null}
      </div>
      {data && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{data.total_groups} categorias únicas</span>
          <span>·</span>
          <span>Mostrando {data.labels.length} itens</span>
        </div>
      )}
    </div>
  );
}
