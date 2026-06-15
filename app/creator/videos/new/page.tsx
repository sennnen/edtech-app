"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Plus, Trash } from "@phosphor-icons/react"

type CuePointInput = {
  timestamp: string
  questionText: string
  correctAnswer: string
  jumpToTime: string
  topicId: string
}

export default function NewVideo() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [muxAssetId, setMuxAssetId] = useState("")
  const [muxPlaybackId, setMuxPlaybackId] = useState("")
  const [primaryTopicId, setPrimaryTopicId] = useState("")
  const [loading, setLoading] = useState(false)
  const [cuePoints, setCuePoints] = useState<CuePointInput[]>([
    { timestamp: "", questionText: "", correctAnswer: "", jumpToTime: "", topicId: "" },
  ])

  const addCuePoint = () => {
    setCuePoints([...cuePoints, { timestamp: "", questionText: "", correctAnswer: "", jumpToTime: "", topicId: "" }])
  }

  const removeCuePoint = (i: number) => {
    setCuePoints(cuePoints.filter((_, idx) => idx !== i))
  }

  const updateCuePoint = (i: number, field: keyof CuePointInput, value: string) => {
    const updated = [...cuePoints]
    updated[i][field] = value
    setCuePoints(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/creator/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          muxAssetId,
          muxPlaybackId,
          primaryTopicId: primaryTopicId || undefined,
          cuePoints: cuePoints
            .filter((cp) => cp.timestamp && cp.questionText)
            .map((cp) => ({
              timestamp: parseFloat(cp.timestamp),
              questionText: cp.questionText,
              correctAnswer: cp.correctAnswer,
              jumpToTime: cp.jumpToTime ? parseFloat(cp.jumpToTime) : null,
              topicId: cp.topicId || null,
            })),
        }),
      })

      if (res.ok) {
        router.push("/creator")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-zinc-900 mb-8">New video</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-700">Video details</h2>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Mux Asset ID" value={muxAssetId} onChange={(e) => setMuxAssetId(e.target.value)} required />
          <Input label="Mux Playback ID" value={muxPlaybackId} onChange={(e) => setMuxPlaybackId(e.target.value)} />
          <Input
            label="Primary topic ID (optional)"
            value={primaryTopicId}
            onChange={(e) => setPrimaryTopicId(e.target.value)}
          />
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-700">Cue points</h2>
            <button type="button" onClick={addCuePoint} className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1">
              <Plus size={14} />
              Add cue point
            </button>
          </div>

          <div className="space-y-4">
            {cuePoints.map((cp, i) => (
              <div key={i} className="border border-zinc-200 rounded-xl p-4 relative">
                <button
                  type="button"
                  onClick={() => removeCuePoint(i)}
                  className="absolute top-3 right-3 text-zinc-400 hover:text-red-500"
                >
                  <Trash size={16} />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Timestamp (seconds)"
                    type="number"
                    step="0.1"
                    value={cp.timestamp}
                    onChange={(e) => updateCuePoint(i, "timestamp", e.target.value)}
                  />
                  <Input
                    label="Jump to time (optional)"
                    type="number"
                    step="0.1"
                    value={cp.jumpToTime}
                    onChange={(e) => updateCuePoint(i, "jumpToTime", e.target.value)}
                  />
                </div>
                <Input
                  label="Question"
                  value={cp.questionText}
                  onChange={(e) => updateCuePoint(i, "questionText", e.target.value)}
                />
                <Input
                  label="Correct answer"
                  value={cp.correctAnswer}
                  onChange={(e) => updateCuePoint(i, "correctAnswer", e.target.value)}
                />
                <Input
                  label="Topic ID (optional)"
                  value={cp.topicId}
                  onChange={(e) => updateCuePoint(i, "topicId", e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Save video
        </Button>
      </form>
    </main>
  )
}
