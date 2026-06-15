"use client"

import { useState } from "react"

export default function TeacherUploads() {
  const [jsonInput, setJsonInput] = useState("")
  const [classId, setClassId] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    setLoading(true)
    try {
      const parsed = JSON.parse(jsonInput)
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawJson: parsed, classId }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ error: "Invalid JSON or request failed" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Upload Mock Results</h1>

      <div className="max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Class ID</label>
          <input
            type="text"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Enter class ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Raw JSON (array of rows)</label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            placeholder={`[{"Student Name":"Alice","Score":"85","Topic":"Algebra"}, ...]`}
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading || !classId || !jsonInput}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Processing..." : "Upload & Process"}
        </button>

        {result && (
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Result</h3>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  )
}
