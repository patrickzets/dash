import React, { useState } from "react";

const CHART_TYPES = [
  { value: "bar", label: "Barras", icon: "📊" },
  { value: "line", label: "Linha", icon: "📈" },
  { value: "pie", label: "Pizza", icon: "🥧" },
  { value: "doughnut", label: "Rosca", icon: "🍩" },
  { value: "area", label: "Área", icon: "📉" },
];

const AGG_FUNCS = [
  { value: "sum", label: "Soma" },
  { value: "mean", label: "Média" },
  { value: "min", label: "Mínimo" },
  { value: "max", label: "Máximo" },
];

export default function ControlPanel({ dataset, onAddChart, suggestions, onApplySuggestion, chartCount, onNewUpload }) {
  const [chartType, setChartType] = useState("bar");
  const [groupBy, setGroupBy] = useState("");
  const [valueCol, setValueCol] = useState("");
  const [aggFunc, setAggFunc] = useState("count");
  const [title, setTitle] = useState("");

  const numericCols = dataset.columns.filter((c) => c.type === "numeric");
  const isPieType = chartType === "pie" || chartType === "doughnut";

  const handleAdd = () => {
    if (!groupBy) return;
    onAddChart({
      title: title || `${aggFunc === "count" ? "Contagem" : aggFunc} de ${valueCol || groupBy} por ${groupBy}`,
      chart_type: chartType, group_by: groupBy, value_col: valueCol || null, agg_func: aggFunc,
      colorIndex: chartCount % 10,
    });
    setTitle("");
  };

  const selectCls = "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1";

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dataset</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[160px]" title={dataset.filename}>{dataset.filename}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{dataset.rows.toLocaleString()} linhas · {dataset.columns.length} colunas</p>
        </div>
        <button onClick={onNewUpload} className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
          Trocar
        </button>
      </div>
      <hr className="border-gray-200 dark:border-gray-700" />
      {suggestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Sugestões Automáticas</p>
          <div className="space-y-2">
            {suggestions.map((sug, i) => (
              <button key={i} onClick={() => onApplySuggestion(sug)}
                className="w-full text-left px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 transition-all group">
                <div className="flex items-center gap-2">
                  <span className="text-base">{CHART_TYPES.find(c => c.value === sug.chart_type)?.icon || "📊"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{sug.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{sug.chart_type} · {sug.agg_func}</p>
                  </div>
                  <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">+</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      <hr className="border-gray-200 dark:border-gray-700" />
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Criar Gráfico</p>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Tipo de gráfico</label>
            <div className="grid grid-cols-5 gap-1">
              {CHART_TYPES.map((ct) => (
                <button key={ct.value} onClick={() => setChartType(ct.value)} title={ct.label}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-xs transition-all ${chartType === ct.value ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"}`}>
                  <span className="text-base">{ct.icon}</span>
                  <span className="leading-none">{ct.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Agrupar por *</label>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className={selectCls}>
              <option value="">Selecione uma coluna...</option>
              {dataset.columns.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.type})</option>)}
            </select>
          </div>
          {!isPieType && (
            <>
              <div>
                <label className={labelCls}>Coluna de valor</label>
                <select value={valueCol} onChange={(e) => setValueCol(e.target.value)} className={selectCls}>
                  <option value="">Contagem de linhas</option>
                  {numericCols.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              {valueCol && (
                <div>
                  <label className={labelCls}>Agregação</label>
                  <div className="flex flex-wrap gap-1">
                    {AGG_FUNCS.map((a) => (
                      <button key={a.value} onClick={() => setAggFunc(a.value)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${aggFunc === a.value ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div>
            <label className={labelCls}>Título (opcional)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do gráfico..."
              className={selectCls.replace("text-gray-900", "text-gray-900 placeholder-gray-400")} />
          </div>
          <button onClick={handleAdd} disabled={!groupBy}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Gráfico
          </button>
        </div>
      </div>
    </div>
  );
}
