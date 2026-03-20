import React, { useState, useEffect, useCallback } from "react";
import FileUpload from "./components/FileUpload";
import ControlPanel from "./components/ControlPanel";
import ChartGrid from "./components/ChartGrid";
import DataTable from "./components/DataTable";
import DarkModeToggle from "./components/DarkModeToggle";
import axios from "axios";

const API = "https://dash-production-4220.up.railway.app";

// Paleta inspirada em Turquesa Vibrante + Periwinkle + Crimson
const CHART_COLORS = [
  "#67D6C2", // Turquesa Vibrante
  "#796DD6", // Periwinkle
  "#D9143E", // Crimson Vívido
  "#F59E0B", // Âmbar
  "#06B6D4", // Ciano
  "#F97316", // Laranja
  "#10B981", // Esmeralda
  "#EC4899", // Rosa
  "#3B82F6", // Azul
  "#84CC16", // Lima
];

export default function App() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true",
  );
  const [dataset, setDataset]       = useState(null);
  const [charts, setCharts]         = useState(() => {
    try { return JSON.parse(localStorage.getItem("dashboardCharts") || "[]"); }
    catch { return []; }
  });
  const [activeTab, setActiveTab]   = useState("charts");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("dashboardCharts", JSON.stringify(charts));
  }, [charts]);

  const handleUpload = useCallback(async (file) => {
    setLoading(true); setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API}/upload`, formData);
      setDataset(res.data);
      setCharts([]);
      const sugRes = await axios.get(`${API}/suggestions`);
      setSuggestions(sugRes.data.suggestions || []);
    } catch (e) {
      setError(e.response?.data?.detail || "Falha no upload.");
    } finally { setLoading(false); }
  }, []);

  const addChart = useCallback(
    (config) => setCharts((prev) => [...prev, { id: Date.now().toString(), ...config }]),
    [],
  );
  const removeChart = useCallback(
    (id) => setCharts((prev) => prev.filter((c) => c.id !== id)),
    [],
  );
  const updateChart = useCallback(
    (id, upd) => setCharts((prev) => prev.map((c) => (c.id === id ? { ...c, ...upd } : c))),
    [],
  );
  const applySuggestion = (sug) =>
    addChart({ ...sug, colorIndex: charts.length % CHART_COLORS.length });

  return (
    <div className="min-h-screen bg-surface dark:bg-gray-950 transition-colors duration-200">

      {/* ── HEADER ── */}
      <header className="relative overflow-hidden h-14 flex items-center px-5 justify-between shadow-md">
        {/* Fundo gradiente animado */}
        <div className="absolute inset-0 header-gradient" />
        {/* Decoração abstrata */}
        <div className="absolute right-0 top-0 h-full w-64 header-orb" />

        <div className="relative flex items-center gap-3 z-10">
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm ring-1 ring-white/30 shadow">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-tight">
              DataViz Studio
            </h1>
            {dataset ? (
              <p className="text-[11px] text-white/70 leading-tight">
                {dataset.filename} — {dataset.rows.toLocaleString()} linhas
              </p>
            ) : (
              <p className="text-[11px] text-white/60 leading-tight">
                Visualize seus dados com estilo
              </p>
            )}
          </div>
        </div>

        <div className="relative flex items-center gap-3 z-10">
          {dataset && (
            <div className="flex bg-white/15 backdrop-blur-sm rounded-xl p-1 ring-1 ring-white/20">
              {["charts", "table"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? "bg-white text-[#796DD6] shadow-sm"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {tab === "charts" ? "Gráficos" : "Tabela"}
                </button>
              ))}
            </div>
          )}
          <DarkModeToggle darkMode={darkMode} toggle={() => setDarkMode(!darkMode)} />
        </div>
      </header>

      {/* ── ERRO ── */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-5 py-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="flex flex-col lg:flex-row" style={{ height: "calc(100vh - 56px)" }}>

        {/* Sidebar */}
        <aside className="w-full lg:w-72 xl:w-80 bg-white dark:bg-gray-900 border-b lg:border-b-0 lg:border-r
                          border-gray-100 dark:border-gray-800 overflow-y-auto scrollbar-thin flex-shrink-0">
          {!dataset ? (
            <div className="p-5">
              <FileUpload onUpload={handleUpload} loading={loading} />
            </div>
          ) : (
            <ControlPanel
              dataset={dataset}
              onAddChart={addChart}
              suggestions={suggestions}
              onApplySuggestion={applySuggestion}
              chartCount={charts.length}
              onNewUpload={() => { setDataset(null); setCharts([]); setSuggestions([]); }}
              API={API}
            />
          )}
        </aside>

        {/* Conteúdo */}
        <div className="flex-1 overflow-hidden bg-surface dark:bg-gray-950">
          {!dataset ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-6">
                <div className="w-28 h-28 mx-auto mb-6 relative">
                  <div className="absolute inset-0 rounded-3xl opacity-10"
                    style={{ background: "linear-gradient(135deg, #796DD6, #67D6C2)" }} />
                  <div className="absolute inset-0 rounded-3xl opacity-5 animate-pulse"
                    style={{ background: "linear-gradient(135deg, #67D6C2, #796DD6)", animationDelay: "0.5s" }} />
                  <svg className="w-14 h-14 absolute inset-0 m-auto text-gray-300 dark:text-gray-600"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-gray-500 dark:text-gray-400">
                  Faça upload para começar
                </p>
                <p className="text-sm mt-1 text-gray-400 dark:text-gray-600">
                  Suporta .xlsx, .xls e .csv
                </p>
              </div>
            </div>
          ) : activeTab === "charts" ? (
            <ChartGrid
              charts={charts}
              onRemove={removeChart}
              onUpdate={updateChart}
              API={API}
              colors={CHART_COLORS}
            />
          ) : (
            <DataTable API={API} columns={dataset.columns} />
          )}
        </div>
      </main>
    </div>
  );
}
