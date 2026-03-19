import React, { useState, useEffect, useCallback } from "react";
import FileUpload from "./components/FileUpload";
import ControlPanel from "./components/ControlPanel";
import ChartGrid from "./components/ChartGrid";
import DataTable from "./components/DataTable";
import DarkModeToggle from "./components/DarkModeToggle";
import axios from "axios";

const API = "http://localhost:8000";

const CHART_COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#84cc16","#ec4899","#6366f1",
];

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [dataset, setDataset] = useState(null); // { filename, rows, columns }
  const [charts, setCharts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dashboardCharts") || "[]"); }
    catch { return []; }
  });
  const [activeTab, setActiveTab] = useState("charts"); // charts | table
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("dashboardCharts", JSON.stringify(charts));
  }, [charts]);

  const handleUpload = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API}/upload`, formData);
      setDataset(res.data);
      setCharts([]);
      // Get suggestions
      const sugRes = await axios.get(`${API}/suggestions`);
      setSuggestions(sugRes.data.suggestions || []);
    } catch (e) {
      setError(e.response?.data?.detail || "Upload failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  const addChart = useCallback((config) => {
    const id = Date.now().toString();
    setCharts((prev) => [...prev, { id, ...config }]);
  }, []);

  const removeChart = useCallback((id) => {
    setCharts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateChart = useCallback((id, updates) => {
    setCharts((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const applySuggestion = (sug) => {
    addChart({ ...sug, colorIndex: charts.length % CHART_COLORS.length });
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Data Dashboard</h1>
            {dataset && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {dataset.filename} — {dataset.rows.toLocaleString()} linhas
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dataset && (
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {["charts","table"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-300"
                  }`}>
                  {tab === "charts" ? "Gráficos" : "Tabela"}
                </button>
              ))}
            </div>
          )}
          <DarkModeToggle darkMode={darkMode} toggle={() => setDarkMode(!darkMode)} />
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-700 px-4 py-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      <main className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 xl:w-80 bg-white dark:bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 overflow-y-auto scrollbar-thin flex-shrink-0">
          {!dataset ? (
            <div className="p-4">
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

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {!dataset ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400 dark:text-gray-600">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">Faça upload de um arquivo para começar</p>
                <p className="text-sm mt-1">Suporta .xlsx, .xls e .csv</p>
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
