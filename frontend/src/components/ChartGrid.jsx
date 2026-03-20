import React, { useRef, useCallback } from "react";
import ChartCard from "./ChartCard";

const CHART_TYPE_LABELS = {
  bar: "Barras", line: "Linha", pie: "Pizza", doughnut: "Rosca", area: "Área",
};

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function ChartGrid({ charts, onRemove, onUpdate, API, colors }) {
  const cardRefs = useRef({});

  const setCardRef = useCallback((id, el) => {
    if (el) cardRefs.current[id] = el;
    else    delete cardRefs.current[id];
  }, []);

  const handleDownloadAll = () => {
    const activeCharts = charts.filter(c => cardRefs.current[c.id]?.getCanvas());
    if (activeCharts.length === 0) return;

    const SCALE    = 2;          // resolução 2x
    const COLS     = Math.min(activeCharts.length, 2);
    const ROWS     = Math.ceil(activeCharts.length / COLS);
    const CARD_W   = 560;
    const CARD_H   = 360;
    const TITLE_H  = 48;        // altura da faixa de título de cada card
    const PAD      = 20;
    const HEADER_H = 72;        // cabeçalho geral do PNG
    const FOOTER_H = 32;

    const W = COLS * CARD_W + (COLS + 1) * PAD;
    const H = HEADER_H + ROWS * (CARD_H + TITLE_H) + (ROWS + 1) * PAD + FOOTER_H;

    const canvas = document.createElement("canvas");
    canvas.width  = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext("2d");
    ctx.scale(SCALE, SCALE);

    // --- fundo geral ---
    ctx.fillStyle = "#f4f5fa";
    ctx.fillRect(0, 0, W, H);

    // --- cabeçalho ---
    const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
    headerGrad.addColorStop(0,   "#796DD6");
    headerGrad.addColorStop(0.5, "#67D6C2");
    headerGrad.addColorStop(1,   "#796DD6");
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, W, HEADER_H);

    ctx.font         = "bold 22px 'Inter', -apple-system, sans-serif";
    ctx.fillStyle    = "#ffffff";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor  = "rgba(0,0,0,0.25)";
    ctx.shadowBlur   = 6;
    ctx.fillText("Dashboard — Exportação de Gráficos", W / 2, HEADER_H / 2);
    ctx.shadowBlur   = 0;

    // --- data no header ---
    const now = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    ctx.font      = "12px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(now, W / 2, HEADER_H - 10);

    // --- cards ---
    activeCharts.forEach((chart, idx) => {
      const ref    = cardRefs.current[chart.id];
      const src    = ref?.getCanvas();
      const col    = idx % COLS;
      const row    = Math.floor(idx / COLS);
      const cardColor = colors[chart.colorIndex % colors.length];

      const x = PAD + col * (CARD_W + PAD);
      const y = HEADER_H + PAD + row * (CARD_H + TITLE_H + PAD);

      // sombra do card
      ctx.shadowColor  = "rgba(0,0,0,0.10)";
      ctx.shadowBlur   = 18;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle    = "#ffffff";
      drawRoundRect(ctx, x, y, CARD_W, CARD_H + TITLE_H, 14);
      ctx.fill();
      ctx.shadowBlur   = 0;
      ctx.shadowOffsetY = 0;

      // faixa colorida no topo do card
      const stripGrad = ctx.createLinearGradient(x, 0, x + CARD_W, 0);
      stripGrad.addColorStop(0, cardColor);
      stripGrad.addColorStop(1, cardColor + "55");
      ctx.fillStyle = stripGrad;
      ctx.beginPath();
      ctx.moveTo(x + 14, y);
      ctx.lineTo(x + CARD_W - 14, y);
      ctx.quadraticCurveTo(x + CARD_W, y, x + CARD_W, y + 14);
      ctx.lineTo(x + CARD_W, y + 4);
      ctx.lineTo(x, y + 4);
      ctx.lineTo(x, y + 14);
      ctx.quadraticCurveTo(x, y, x + 14, y);
      ctx.closePath();
      ctx.fillRect(x, y, CARD_W, 4);

      // badge tipo
      const typeLabel = CHART_TYPE_LABELS[chart.chart_type] || chart.chart_type;
      ctx.fillStyle = cardColor + "22";
      const badgeW = ctx.measureText(typeLabel).width + 16;
      const badgeX = x + 12;
      const badgeY = y + 10;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(badgeX, badgeY, badgeW, 18, 9)
                    : drawRoundRect(ctx, badgeX, badgeY, badgeW, 18, 9);
      ctx.fill();
      ctx.font         = "bold 10px 'Inter', sans-serif";
      ctx.fillStyle    = cardColor;
      ctx.textAlign    = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(typeLabel.toUpperCase(), badgeX + 8, badgeY + 9);

      // título
      ctx.font         = "bold 14px 'Inter', -apple-system, sans-serif";
      ctx.fillStyle    = "#1f2937";
      ctx.textAlign    = "left";
      ctx.textBaseline = "middle";
      const titleX = badgeX + badgeW + 10;
      const maxW   = CARD_W - (titleX - x) - 12;
      let titleText = chart.title;
      while (ctx.measureText(titleText).width > maxW && titleText.length > 0)
        titleText = titleText.slice(0, -1);
      if (titleText !== chart.title) titleText += "…";
      ctx.fillText(titleText, titleX, badgeY + 9);

      // imagem do gráfico
      if (src) {
        ctx.drawImage(
          src,
          x + 4,
          y + TITLE_H,
          CARD_W - 8,
          CARD_H - 4,
        );
      }
    });

    // --- rodapé ---
    ctx.font         = "11px 'Inter', sans-serif";
    ctx.fillStyle    = "#9ca3af";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${activeCharts.length} gráfico${activeCharts.length > 1 ? "s" : ""} exportado${activeCharts.length > 1 ? "s" : ""}`,
      W / 2,
      H - FOOTER_H / 2,
    );

    const link = document.createElement("a");
    link.download = `dashboard-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (charts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-2xl opacity-10"
              style={{ background: "linear-gradient(135deg, #796DD6, #67D6C2)" }} />
            <svg className="w-12 h-12 absolute inset-0 m-auto text-gray-300 dark:text-gray-600"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-500 dark:text-gray-400">
            Nenhum gráfico adicionado
          </p>
          <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">
            Use o painel lateral para criar visualizações
          </p>
        </div>
      </div>
    );
  }

  const gridCols =
    charts.length === 1 ? "grid-cols-1"
    : charts.length === 2 ? "grid-cols-1 xl:grid-cols-2"
    : "grid-cols-1 md:grid-cols-2";

  return (
    <div className="flex flex-col h-full">
      {/* Barra de ação — download all */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700/60
                      bg-white dark:bg-gray-800/80 backdrop-blur-sm">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          {charts.length} gráfico{charts.length > 1 ? "s" : ""} ativo{charts.length > 1 ? "s" : ""}
        </p>
        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                     text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
          style={{ background: "linear-gradient(135deg, #796DD6, #67D6C2)" }}
          title="Baixar todos os gráficos como imagem"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Baixar Todos
        </button>
      </div>

      {/* Grid de gráficos */}
      <div className={`p-5 grid gap-5 ${gridCols} overflow-auto flex-1`}>
        {charts.map((chart) => (
          <ChartCard
            key={chart.id}
            ref={(el) => setCardRef(chart.id, el)}
            chart={chart}
            API={API}
            onRemove={() => onRemove(chart.id)}
            onUpdate={(upd) => onUpdate(chart.id, upd)}
            color={colors[chart.colorIndex % colors.length]}
          />
        ))}
      </div>
    </div>
  );
}
