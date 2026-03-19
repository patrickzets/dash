import React, { useEffect, useState } from "react";
import axios from "axios";

export default function DataTable({ API, columns }) {
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/preview`, { params: { limit } });
        setRows(res.data.rows);
        setTotalRows(res.data.total_rows);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API, limit]);

  const colNames = columns.map((c) => c.name);
  const filtered = search
    ? rows.filter((row) =>
        Object.values(row).some((v) =>
          String(v ?? "").toLowerCase().includes(search.toLowerCase())
        )
      )
    : rows;

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Preview dos Dados</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Mostrando {filtered.length} de {totalRows.toLocaleString()} linhas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
            className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none">
            <option value={50}>50 linhas</option>
            <option value={100}>100 linhas</option>
            <option value={500}>500 linhas</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm border-collapse min-w-max">
            <thead className="sticky top-0">
              <tr className="bg-gray-50 dark:bg-gray-700">
                {colNames.map((col) => (
                  <th key={col} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/50"}`}>
                  {colNames.map((col) => (
                    <td key={col} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-xs truncate" title={String(row[col] ?? "")}>
                      {row[col] === null || row[col] === undefined ? (
                        <span className="text-gray-300 dark:text-gray-600 italic">null</span>
                      ) : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
