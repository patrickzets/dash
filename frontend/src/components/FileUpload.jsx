import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function FileUpload({ onUpload, loading }) {
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
    <div className="space-y-5 pt-2">
      <div>
        <h2 className="text-base font-black text-gray-800 dark:text-gray-100 tracking-tight">
          Upload de Arquivo
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Excel (.xlsx, .xls) ou CSV
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 overflow-hidden ${
          isDragActive
            ? "border-[#796DD6] bg-[#796DD6]/5 scale-[1.02]"
            : "border-gray-200 dark:border-gray-700 hover:border-[#67D6C2] bg-white dark:bg-gray-800/50"
        }`}
      >
        <input {...getInputProps()} />

        {/* Orb decoration */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #796DD6, transparent)" }}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-12 h-12 rounded-full animate-spin"
              style={{ border: "3px solid #67D6C233", borderTopColor: "#67D6C2" }}
            />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Processando arquivo…
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isDragActive ? "scale-110" : ""
              }`}
              style={{
                background: isDragActive
                  ? "linear-gradient(135deg, #796DD6, #67D6C2)"
                  : "linear-gradient(135deg, #796DD622, #67D6C222)",
              }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: isDragActive ? "white" : "#796DD6" }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {isDragActive ? "Solte o arquivo aqui!" : "Arraste ou clique para selecionar"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                .xlsx · .xls · .csv
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        className="rounded-xl p-3.5"
        style={{ background: "linear-gradient(135deg, #796DD610, #67D6C210)", border: "1px solid #796DD625" }}
      >
        <p className="text-xs font-bold mb-1" style={{ color: "#796DD6" }}>Dica</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Certifique-se que a primeira linha do arquivo contém os cabeçalhos das colunas.
        </p>
      </div>
    </div>
  );
}
