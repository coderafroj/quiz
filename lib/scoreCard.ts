import QRCode from "qrcode";

interface ScoreCardOptions {
  quizTitle: string;
  playerName: string;
  score: number;
  total: number;
  quizId: string;
  siteUrl?: string;
}

/**
 * Draws a shareable "score card" entirely on an offscreen <canvas> — no
 * server round-trip, no AI, no cost. Returns a PNG data URL ready to
 * download or hand to the Web Share API.
 */
export async function generateScoreCard(opts: ScoreCardOptions): Promise<string> {
  const { quizTitle, playerName, score, total, quizId, siteUrl = "https://play.coderafroj.me" } = opts;

  const width = 1080;
  const height = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, width, height);

  // Subtle noise-like border frame
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Brand
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CODARAFROJ PLAY", width / 2, 140);

  // Quiz title
  ctx.font = "500 40px sans-serif";
  ctx.fillStyle = "#b4b4b0";
  wrapText(ctx, quizTitle, width / 2, 220, 820, 48);

  // Big score
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  ctx.font = "800 220px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${score}/${total}`, width / 2, 560);

  ctx.font = "600 42px sans-serif";
  ctx.fillStyle = "#b4b4b0";
  ctx.fillText(`${pct}% correct`, width / 2, 630);

  // Player name
  ctx.font = "500 34px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(playerName, width / 2, 740);

  // QR code linking back to the quiz
  try {
    const qrDataUrl = await QRCode.toDataURL(`${siteUrl}/play/${quizId}`, {
      width: 220,
      margin: 1,
      color: { dark: "#ffffff", light: "#00000000" },
    });
    const qrImg = await loadImage(qrDataUrl);
    ctx.drawImage(qrImg, width / 2 - 110, 800, 220, 220);
  } catch {
    // If QR generation fails for any reason, the card still works without it.
  }

  ctx.font = "400 26px sans-serif";
  ctx.fillStyle = "#6e6e6a";
  ctx.fillText("Scan to try this quiz yourself", width / 2, 1050);

  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let lineY = y;
  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth && line !== "") {
      ctx.fillText(line, x, lineY);
      line = word + " ";
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, lineY);
}

/** Downloads the generated card, or uses the native share sheet on mobile when available. */
export async function shareScoreCard(dataUrl: string, quizTitle: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], "score-card.png", { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: quizTitle,
      text: `I just played "${quizTitle}" on Codarafroj Play!`,
    });
    return;
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "score-card.png";
  link.click();
}
