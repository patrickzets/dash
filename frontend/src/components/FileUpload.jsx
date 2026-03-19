import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

export default function FileUpload({ onUpload, loading }) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) onUpload(acceptedFiles[0]);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Upload de Arquivo</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Suporta Excel (.xlsx, .xls) e CSV</p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-700/50"
        }`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" style={{borderWidth:"3px"}} />
            <p className="text-sm text-gray-600 dark:text-gray-300">Processando arquivo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isDragActive ? "bg-blue-100 dark:bg-blue-800" : "bg-gray-100 dark:bg-gray-700"}`}>
              <svg className={`w-7 h-7 ${isDragActive ? "text-blue-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDragActive ? "Solte o arquivo aqui" : "Arraste e solte ou clique para selecionar"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">.xlsx, .xls, .csv</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Dica</p>
        <p className="text-xs text-blue-600 dark:text-blue-400">Certifique-se que a primeira linha do arquivo contém os cabeçalhos das colunas.</p>
      </div>
    </div>
  );
}
