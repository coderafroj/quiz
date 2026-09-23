import { ImageResponse } from "next/og";
import { getQuizServerSide } from "@/lib/firestoreRest";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const quiz = await getQuizServerSide(quizId);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0a0a0a",
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#b4b4b0", letterSpacing: 4, marginBottom: 24 }}>
          CODARAFROJ PLAY
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 24,
            maxWidth: 960,
          }}
        >
          {quiz?.title || "Play this quiz"}
        </div>
        {quiz && (
          <div style={{ display: "flex", fontSize: 30, color: "#b4b4b0" }}>
            {quiz.category} · {quiz.difficulty} · {quiz.questions?.length || 0} Questions
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
