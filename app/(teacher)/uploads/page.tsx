"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, FileCsv, CheckCircle, WarningCircle, ArrowRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/Button"

type UploadResult = {
  uploadId: string
  status: string
  success: boolean
  manualReview?: boolean
  errors?: string[]
}

export default function TeacherUploads() {
  const [file, setFile] = useState<File | null>(null)
  const [classId, setClassId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = text.split("\n").filter(Boolean).map((r) => r.split(",").map((c) => c.trim()))
      setPreview(rows.slice(0, 5))
    }
    reader.readAsText(f)
  }, [])

  const handleUpload = async () => {
    if (!file || !classId) return
    setLoading(true)
    setResult(null)

    try {
      const text = await file.text()
      const rows = text.split("\n").filter(Boolean).map((r) => {
        const parts = r.split(",").map((c) => c.trim())
        const headers = text.split("\n")[0].split(",").map((c) => c.trim())
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => {
          obj[h] = parts[i] || ""
        })
        return obj
      })

      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawJson: rows, classId }),
      })

      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ uploadId: "", status: "ERROR", success: false, errors: ["Failed to process file"] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900">Upload mock results</h1>
        <p className="text-zinc-500 mt-1">Upload a CSV of student mock exam data to analyse weak topics.</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 mb-2">Class ID</label>
          <input
            type="text"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
            placeholder="e.g. cmqfmdxef0004ihessq9zflal"
          />
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f) handleFile(f)
          }}
          className="border-2 border-dashed border-zinc-200 rounded-2xl p-12 text-center hover:border-zinc-300 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
          {!file ? (
            <>
              <Upload size={32} className="text-zinc-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-700">Drop a CSV file here, or click to browse</p>
              <p className="text-xs text-zinc-400 mt-1">Headers should include Student Name, Score, Topic, etc.</p>
            </>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <FileCsv size={24} className="text-emerald-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-zinc-900">{file.name}</p>
                <p className="text-xs text-zinc-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  setPreview([])
                }}
                className="text-xs text-zinc-400 hover:text-zinc-600 ml-4"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {preview.length > 1 && (
          <div className="mt-6">
            <p className="text-xs text-zinc-400 mb-2">Preview (first {Math.min(preview.length - 1, 4)} rows)</p>
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-zinc-50">
                    {preview[0].map((h, i) => (
                      <th key={i} className="px-4 py-2 text-left font-medium text-zinc-600 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1).map((row, i) => (
                    <tr key={i} className="border-t border-zinc-100">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2 text-zinc-700 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Button
          onClick={handleUpload}
          loading={loading}
          disabled={!file || !classId}
          className="mt-6 w-full"
        >
          {loading ? "Processing..." : "Upload & analyse"}
        </Button>

        {result && (
          <div
            className={`mt-6 rounded-2xl p-5 border ${
              result.success
                ? "bg-emerald-50 border-emerald-200"
                : result.manualReview
                  ? "bg-amber-50 border-amber-200"
                  : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle size={20} className="text-emerald-500 mt-0.5" />
              ) : (
                <WarningCircle size={20} className="text-amber-500 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-sm text-zinc-900">
                  {result.success
                    ? "Upload processed successfully"
                    : result.manualReview
                      ? "Needs manual review"
                      : "Upload failed"}
                </p>
                {result.errors && result.errors.length > 0 && (
                  <ul className="mt-2 text-sm text-zinc-600 list-disc list-inside">
                    {result.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
