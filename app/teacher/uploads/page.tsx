"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Upload, FileCsv, CheckCircle, WarningCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/Button"

type ColumnMapping = Record<string, string>
type UploadStep = "upload" | "mapping" | "processing" | "done"

export default function TeacherUploadPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [step, setStep] = useState<UploadStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [classId, setClassId] = useState("")
  const [subject, setSubject] = useState("")
  const [examBoard, setExamBoard] = useState("")
  const [specCode, setSpecCode] = useState("")
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    manualReview?: boolean
    errors?: string[]
    uploadId?: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/teacher/classes")
      .then((r) => r.json())
      .then(setClasses)
      .catch(() => {})
  }, [])

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setResult(null)
    setStep("upload")

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n").filter(Boolean)
      const hdrs = lines[0].split(",").map((c) => c.trim())
      setHeaders(hdrs)
      setPreviewRows(lines.slice(1, 6).map((r) => r.split(",").map((c) => c.trim())))

      const autoMap: ColumnMapping = {}
      for (const h of hdrs) {
        const lower = h.toLowerCase()
        if (lower.includes("name") || lower.includes("student")) autoMap[h] = "student_name"
        else if (lower.includes("mark") || lower.includes("score") || lower.includes("grade") || lower.includes("result"))
          autoMap[h] = "mock_score"
        else if (lower.includes("topic") || lower.includes("subject") || lower.includes("syllabus"))
          autoMap[h] = "syllabus_topic"
        else autoMap[h] = "ignore"
      }
      setMapping(autoMap)
      setStep("mapping")
    }
    reader.readAsText(f)
  }, [])

  const targetOptions = [
    { value: "student_name", label: "Student name" },
    { value: "mock_score", label: "Score / mark" },
    { value: "syllabus_topic", label: "Topic / syllabus area" },
    { value: "ignore", label: "Ignore column" },
  ]

  const handleUpload = async () => {
    if (!file || !classId) return
    setLoading(true)
    setStep("processing")

    try {
      const text = await file.text()
      const lines = text.split("\n").filter(Boolean)
      const hdrs = lines[0].split(",").map((c) => c.trim())
      const rows = lines.slice(1).map((r) => {
        const parts = r.split(",").map((c) => c.trim())
        const obj: Record<string, string> = {}
        hdrs.forEach((h, i) => {
          obj[h] = parts[i] || ""
        })
        return obj
      })

      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawJson: rows,
          classId,
          subject: subject || "General",
          examBoard: examBoard || "AQA",
          specCode: specCode || undefined,
          mapping,
        }),
      })

      const data = await res.json()
      setResult(data)
      setStep("done")
    } catch {
      setResult({ success: false, errors: ["Failed to process file"] })
      setStep("done")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setHeaders([])
    setPreviewRows([])
    setMapping({})
    setResult(null)
    setStep("upload")
    setSubject("")
    setExamBoard("")
    setSpecCode("")
  }

  if (step === "mapping" && file) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Mapping wizard</h1>
          <p className="text-zinc-500 mt-1">Review and confirm how each column maps to student data.</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-700 mb-3">Preview (first {previewRows.length} rows)</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-50">
                  {headers.map((h, i) => (
                    <th key={i} className="px-4 py-2 text-left font-medium text-zinc-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
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

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-700 mb-4">Column mapping</h2>
          <div className="space-y-3">
            {headers.map((h) => (
              <div key={h} className="flex items-center gap-4">
                <span className="text-sm font-mono text-zinc-600 w-48 truncate">{h}</span>
                <select
                  value={mapping[h] || "ignore"}
                  onChange={(e) => setMapping({ ...mapping, [h]: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {targetOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm"
                placeholder="e.g. Mathematics"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Exam board</label>
              <select
                value={examBoard}
                onChange={(e) => setExamBoard(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm bg-white"
              >
                <option value="AQA">AQA</option>
                <option value="EDEXCEL">Edexcel</option>
                <option value="OCR">OCR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Spec code (optional)</label>
              <input
                type="text"
                value={specCode}
                onChange={(e) => setSpecCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm"
                placeholder="e.g. 8300"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-xs font-medium text-zinc-600 mb-1">Class</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm bg-white"
            >
              <option value="">Select a class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleUpload} loading={loading} disabled={!classId}>
              Process upload
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Start over
            </Button>
          </div>
        </div>
      </main>
    )
  }

  if (step === "done" && result) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div
          className={`rounded-2xl p-8 border text-center ${
            result.success
              ? "bg-emerald-50 border-emerald-200"
              : result.manualReview
                ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
          }`}
        >
          {result.success ? (
            <CheckCircle size={40} className="text-emerald-500 mx-auto mb-4" />
          ) : (
            <WarningCircle size={40} className="text-amber-500 mx-auto mb-4" />
          )}
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            {result.success
              ? "Upload processed successfully"
              : result.manualReview
                ? "Needs manual review"
                : "Upload failed"}
          </h2>
          {result.errors && result.errors.length > 0 && (
            <ul className="mt-3 text-sm text-zinc-600 list-disc list-inside text-left max-w-sm mx-auto">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-3 justify-center mt-8">
            <Button onClick={handleReset}>Upload another</Button>
            <Button variant="secondary" onClick={() => router.push("/teacher")}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900">Upload mock results</h1>
        <p className="text-zinc-500 mt-1">
          Upload a CSV of student mock exam data to analyse weak topics per student.
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 mb-2">Class</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
          >
            <option value="">Select a class...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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
          <Upload size={32} className="text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-700">Drop a CSV file here, or click to browse</p>
          <p className="text-xs text-zinc-400 mt-1">Headers: Student Name, Score, Topic, etc.</p>
        </div>

        {file && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
            <FileCsv size={20} className="text-emerald-500" />
            <span className="text-sm text-zinc-700">{file.name}</span>
            <button onClick={() => { setFile(null); setHeaders([]) }} className="ml-auto text-xs text-zinc-400 hover:text-zinc-600">
              Remove
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
