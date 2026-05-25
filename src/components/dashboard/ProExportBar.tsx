'use client'

import { Download, FileText, Table2 } from 'lucide-react'
import { useState } from 'react'

export function ProExportBar() {
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null)

  function handleExport(type: 'csv' | 'pdf') {
    setExporting(type)
    setTimeout(() => setExporting(null), 1500)
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-eq-card border border-eq-border rounded-xl px-5 py-3.5 mb-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Download className="w-4 h-4 text-eq-green" />
        Exporter les données du jour
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleExport('csv')}
          disabled={!!exporting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-eq-surface border border-eq-border hover:border-eq-green hover:text-eq-green transition-all disabled:opacity-50"
        >
          <Table2 className="w-3.5 h-3.5" />
          {exporting === 'csv' ? 'Export…' : 'CSV'}
        </button>
        <button
          onClick={() => handleExport('pdf')}
          disabled={!!exporting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-eq-surface border border-eq-border hover:border-eq-green hover:text-eq-green transition-all disabled:opacity-50"
        >
          <FileText className="w-3.5 h-3.5" />
          {exporting === 'pdf' ? 'Export…' : 'PDF'}
        </button>
      </div>
    </div>
  )
}
