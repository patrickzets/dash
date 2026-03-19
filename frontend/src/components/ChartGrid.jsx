import React from "react";
import ChartCard from "./ChartCard";

export default function ChartGrid({ charts, onRemove, onUpdate, API, colors }) {
  if (charts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400 dark:text-gray-600">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-base font-medium">Nenhum gráfico adicionado</p>
          <p className="text-sm mt-1">Use o painel lateral para criar visualizações</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 grid gap-4 ${
      charts.length === 1 ? "grid-cols-1" :
      charts.length === 2 ? "grid-cols-1 xl:grid-cols-2" :
      "grid-cols-1 md:grid-cols-2"
    }`}>
      {charts.map((chart) => (
        <ChartCard
          key={chart.id}
          chart={chart}
          onRemove={() => onRemove(chart.id)}
          onUpdate={(updates) => onUpdate(chart.id, updates)}
          API={API}
          color={colors[chart.colorIndex % colors.length]}
        />
      ))}
    </div>
  );
}
