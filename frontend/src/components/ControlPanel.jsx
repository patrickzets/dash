import React, { useState } from "react";

const CHART_TYPES = [
  { value: "bar",      label: "Barras", icon: "▊" },
  { value: "line",     label: "Linha",  icon: "↗" },
  { value: "pie",      label: "Pizza",  icon: "◔" },
  { value: "doughnut", label: "Rosca",  icon: "◎" },
  { value: "area",     label: "Área",   icon: "▲" },
];

const AGG_FUNCS = [
  { value: "sum",  label: "Soma"  },
  { value: "mean", label: "Média" },
  { value: "min",  label: "Mín."  },
  { value: "max",  label: "Máx."  },
];

// ── ícone de comparação ───────────────────────────────────────────────────
function CompareIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h12m0 0l-4-4m4 4l-4 4" />
    </svg>
  );
}

export default function ControlPanel({
  dataset, onAddChart, suggestions, onApplySuggestion, chartCount, onNewUpload,
}) {
  const [chartType,      setChartType]      = useState("bar");
  const [groupBy,        setGroupBy]        = useState("");
  const [valueCol,       setValueCol]       = useState("");
  const [aggFunc,        setAggFunc]        = useState("count");
  const [title,          setTitle]          = useState("");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareBy,      setCompareBy]      = useState("");

  const numericCols = dataset.columns.filter((c) => c.type === "numeric");
  const isPieType   = chartType === "pie" || chartType === "doughnut";

  // Colunas disponíveis para "Comparar por" (excluindo a coluna principal)
  const compareCols = dataset.columns.filter((c) => c.name !== groupBy && c.unique_count <= 20);

  const handleAdd = () => {
    if (!groupBy) return;
    const defaultTitle = `${aggFunc === "count" ? "Contagem" : aggFunc} de ${valueCol || groupBy} por ${groupBy}`;
    const compTitle    = compareEnabled && compareBy ? `${defaultTitle} × ${compareBy}` : defaultTitle;

    onAddChart({
      title:      title || compTitle,
      chart_type: chartType,
      group_by:   groupBy,
      value_col:  valueCol || null,
      agg_func:   aggFunc,
      colorIndex: chartCount % 10,
      compare_by: compareEnabled && compareBy ? compareBy : null,
    });
    setTitle("");
  };

  const inputCls = `w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700
    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
    focus:outline-none focus:ring-2 focus:ring-[#796DD6] transition-shadow`;
  const labelCls = "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5";
  const fieldLbl = "text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1.5";

  return (
    <div className="p-5 space-y-5">

      {/* Dataset info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={labelCls}>Dataset ativo</p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate max-w-[160px]"
            title={dataset.filename}>
            {dataset.filename}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {dataset.rows.toLocaleString()} linhas · {dataset.columns.length} colunas
          </p>
        </div>
        <button
          onClick={onNewUpload}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 flex-shrink-0"
          style={{ background: "#796DD622", color: "#796DD6" }}
        >
          Trocar
        </button>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />

      {/* Sugestões */}
      {suggestions.length > 0 && (
        <div>
          <p className={labelCls}>Sugestões Automáticas</p>
          <div className="space-y-2">
            {suggestions.map((sug, i) => (
              <button key={i} onClick={() => onApplySuggestion(sug)}
                className="w-full text-left px-3 py-2.5 rounded-xl border transition-all group
                           bg-gradient-to-r from-[#796DD6]/5 to-[#67D6C2]/5
                           border-[#796DD6]/15 hover:border-[#796DD6]/40
                           hover:from-[#796DD6]/10 hover:to-[#67D6C2]/10">
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">
                    {CHART_TYPES.find(c => c.value === sug.chart_type)?.icon || "▊"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{sug.title}</p>
                    <p className="text-[10px] text-gray-400">{sug.chart_type} · {sug.agg_func}</p>
                  </div>
                  <span className="text-[#796DD6] opacity-0 group-hover:opacity-100 font-bold">+</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
      )}

      {/* ── Criar Gráfico ─────────────────────────────────────────────── */}
      <div>
        <p className={labelCls}>Criar Gráfico</p>
        <div className="space-y-3.5">

          {/* Tipo */}
          <div>
            <label className={fieldLbl}>Tipo de gráfico</label>
            <div className="grid grid-cols-5 gap-1">
              {CHART_TYPES.map((ct) => (
                <button key={ct.value} onClick={() => setChartType(ct.value)} title={ct.label}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-xs font-medium
                    border transition-all hover:scale-105 ${
                    chartType === ct.value
                      ? "border-[#796DD6] bg-[#796DD6]/10 text-[#796DD6] shadow-sm"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                  <span className="text-base leading-none">{ct.icon}</span>
                  <span className="leading-none text-[10px]">{ct.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Agrupar por */}
          <div>
            <label className={fieldLbl}>
              Agrupar por <span className="text-[#D9143E]">*</span>
            </label>
            <select
              value={groupBy}
              onChange={(e) => { setGroupBy(e.target.value); setCompareBy(""); }}
              className={inputCls}
            >
              <option value="">Selecione uma coluna…</option>
              {dataset.columns.map((c) => (
                <option key={c.name} value={c.name}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>

          {/* Coluna de valor + agregação */}
          {!isPieType && (
            <>
              <div>
                <label className={fieldLbl}>Coluna de valor</label>
                <select value={valueCol} onChange={(e) => setValueCol(e.target.value)} className={inputCls}>
                  <option value="">Contagem de linhas</option>
                  {numericCols.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              {valueCol && (
                <div>
                  <label className={fieldLbl}>Agregação</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AGG_FUNCS.map((a) => (
                      <button key={a.value} onClick={() => setAggFunc(a.value)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          aggFunc === a.value
                            ? "text-white shadow-sm"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                        }`}
                        style={aggFunc === a.value
                          ? { background: "linear-gradient(135deg, #796DD6, #67D6C2)" }
                          : {}}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Comparação ──────────────────────────────────────────── */}
          {groupBy && (
            <div
              className="rounded-2xl overflow-hidden transition-all duration-200"
              style={{
                border:     compareEnabled ? "1.5px solid #796DD6" : "1.5px dashed #e5e7eb",
                background: compareEnabled
                  ? "linear-gradient(135deg, #796DD608, #67D6C208)"
                  : "transparent",
              }}
            >
              {/* Toggle header */}
              <button
                onClick={() => { setCompareEnabled(!compareEnabled); setCompareBy(""); }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: compareEnabled
                        ? "linear-gradient(135deg, #796DD6, #67D6C2)"
                        : "#f3f4f6",
                    }}
                  >
                    <CompareIcon
                      className="w-3.5 h-3.5"
                      style={{ color: compareEnabled ? "white" : "#9ca3af" }}
                    />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${
                      compareEnabled ? "text-[#796DD6]" : "text-gray-600 dark:text-gray-400"
                    }`}>
                      Comparar séries
                    </p>
                    <p className="text-[10px] text-gray-400">
                      ex: idade mulheres × homens
                    </p>
                  </div>
                </div>
                {/* Toggle pill */}
                <div
                  className="w-9 h-5 rounded-full relative transition-colors duration-200 flex-shrink-0"
                  style={{ background: compareEnabled ? "#796DD6" : "#e5e7eb" }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                    style={{ left: compareEnabled ? "calc(100% - 18px)" : "2px" }}
                  />
                </div>
              </button>

              {/* Seletor de coluna de comparação */}
              {compareEnabled && (
                <div className="px-3 pb-3">
                  <label className={fieldLbl}>
                    Separar por coluna <span className="text-[#D9143E]">*</span>
                  </label>

                  {compareCols.length === 0 ? (
                    <p className="text-xs text-gray-400 italic mt-1">
                      Nenhuma coluna com ≤ 20 valores únicos disponível para comparação.
                    </p>
                  ) : (
                    <>
                      <select
                        value={compareBy}
                        onChange={(e) => setCompareBy(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Selecione a coluna…</option>
                        {compareCols.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}  ({c.unique_count} valores únicos)
                          </option>
                        ))}
                      </select>

                      {compareBy && (
                        <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#67D6C2]" />
                          Cada valor de <b className="text-[#796DD6]">{compareBy}</b> vira uma série no gráfico.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Título */}
          <div>
            <label className={fieldLbl}>
              Título <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do gráfico…"
              className={inputCls}
            />
          </div>

          {/* Botão adicionar */}
          <button
            onClick={handleAdd}
            disabled={!groupBy || (compareEnabled && !compareBy && compareCols.length > 0)}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white
                       transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
                       active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
                       disabled:hover:scale-100 flex items-center justify-center gap-2"
            style={{
              background:
                !groupBy || (compareEnabled && !compareBy && compareCols.length > 0)
                  ? "#d1d5db"
                  : compareEnabled && compareBy
                  ? "linear-gradient(135deg, #796DD6 0%, #D9143E 100%)"
                  : "linear-gradient(135deg, #796DD6 0%, #67D6C2 100%)",
            }}
          >
            {compareEnabled && compareBy ? (
              <>
                <CompareIcon className="w-4 h-4" />
                Adicionar Comparação
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Adicionar Gráfico
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
