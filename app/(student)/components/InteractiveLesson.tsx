"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import MuxPlayer from "@mux/mux-player-react"

interface CuePoint {
  id: string
  timestamp: number
  questionText: string
  correctAnswer: string
  jumpToTime?: number | null
  topicId?: string | null
}

interface InteractiveLessonProps {
  playbackId: string
  cuePoints: CuePoint[]
  studentId: string
}

export default function InteractiveLesson({
  playbackId,
  cuePoints,
  studentId,
}: InteractiveLessonProps) {
  const playerRef = useRef<any>(null)
  const [seenCueIds, setSeenCueIds] = useState<Set<string>>(new Set())
  const [activeCue, setActiveCue] = useState<CuePoint | null>(null)
  const [userAnswer, setUserAnswer] = useState("")
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)

  const unseenCues = cuePoints.filter((c) => !seenCueIds.has(c.id))

  const handleTimeUpdate = useCallback(() => {
    const player = playerRef.current
    if (!player) return

    const currentTime = player.currentTime

    for (const cue of unseenCues) {
      if (Math.abs(currentTime - cue.timestamp) <= 0.3) {
        player.pause()
        setActiveCue(cue)
        break
      }
    }
  }, [unseenCues])

  const sendTelemetry = useCallback(
    async (
      cuePointId: string,
      isCorrect: boolean,
      answer: string
    ) => {
      try {
        await fetch("/api/video-events/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cuePointId,
            isCorrect,
            rawAnswer: { text: answer },
            marksAwarded: isCorrect ? 1 : 0,
            marksAvailable: 1,
          }),
        })
      } catch {
        // fire-and-forget
      }
    },
    []
  )

  const submitAnswer = useCallback(() => {
    if (!activeCue) return

    const isCorrect =
      userAnswer.trim().toLowerCase() === activeCue.correctAnswer.trim().toLowerCase()

    setFeedback(isCorrect ? "correct" : "incorrect")
    setSeenCueIds((prev) => new Set(prev).add(activeCue.id))

    sendTelemetry(activeCue.id, isCorrect, userAnswer)
  }, [activeCue, userAnswer, sendTelemetry])

  const skipCue = useCallback(() => {
    if (!activeCue) return

    setSeenCueIds((prev) => new Set(prev).add(activeCue.id))
    setFeedback(null)
    setUserAnswer("")
    setActiveCue(null)

    sendTelemetry(activeCue.id, false, "skipped")

    const player = playerRef.current
    if (player) player.play()
  }, [activeCue, sendTelemetry])

  const continuePlaying = useCallback(() => {
    if (!activeCue) return

    const player = playerRef.current
    if (!player) return

    if (feedback === "correct") {
      setFeedback(null)
      setUserAnswer("")
      setActiveCue(null)
      player.play()
    } else if (feedback === "incorrect") {
      const jumpTime = activeCue.jumpToTime
      setFeedback(null)
      setUserAnswer("")
      setActiveCue(null)

      if (jumpTime !== null && jumpTime !== undefined) {
        player.currentTime = jumpTime
      }
      player.play()
    }
  }, [activeCue, feedback])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    player.addEventListener("timeupdate", handleTimeUpdate)
    return () => player.removeEventListener("timeupdate", handleTimeUpdate)
  }, [handleTimeUpdate])

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        className="w-full rounded-lg"
        accentColor="#3b82f6"
      />

      {activeCue && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">
              {activeCue.questionText}
            </h3>

            {!feedback ? (
              <>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitAnswer()
                  }}
                  placeholder="Type your answer..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={submitAnswer}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit
                  </button>
                  <button
                    onClick={skipCue}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </>
            ) : (
              <>
                <p
                  className={`text-lg font-medium mb-4 ${
                    feedback === "correct" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {feedback === "correct" ? "Correct!" : "Incorrect"}
                </p>
                <button
                  onClick={continuePlaying}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
