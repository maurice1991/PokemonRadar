"use client";

import { useRef, useState } from "react";
import Tesseract from "tesseract.js";

type CardScannerProps = {
  onScanResult: (query: string, cardNumber?: string | null) => void;
};

export default function CardScanner({ onScanResult }: CardScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [foundNumber, setFoundNumber] = useState<string | null>(null);
  const [cropPreview, setCropPreview] = useState<string | null>(null);

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);
    }
  }

  function extractCardNumber(text: string) {
    const match = text.match(/\d{1,3}\s*\/\s*\d{1,3}/);

    if (!match) return null;

    return match[0].replace(/\s/g, "");
  }

  async function scanCard() {
    if (!videoRef.current || !canvasRef.current) return;

    setScanning(true);
    setOcrText("");
    setFoundNumber(null);
    setCropPreview(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0);

      const cropCanvas = document.createElement("canvas");
      const cropCtx = cropCanvas.getContext("2d");
      if (!cropCtx) return;

      // Onderkant van de kaart scannen
      const cropX = canvas.width * 0.08;
      const cropY = canvas.height * 0.78;
      const cropWidth = canvas.width * 0.84;
      const cropHeight = canvas.height * 0.18;

      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;

      cropCtx.drawImage(
        canvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

const imageData = cropCtx.getImageData(
  0,
  0,
  cropCanvas.width,
  cropCanvas.height
);

const data = imageData.data;

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];

  const gray = (r + g + b) / 3;
  const value = gray > 140 ? 255 : 0;

  data[i] = value;
  data[i + 1] = value;
  data[i + 2] = value;
}

cropCtx.putImageData(imageData, 0, 0);

const scaledCanvas = document.createElement("canvas");
const scaledCtx = scaledCanvas.getContext("2d");

if (!scaledCtx) return;

scaledCanvas.width = cropCanvas.width * 3;
scaledCanvas.height = cropCanvas.height * 3;

scaledCtx.imageSmoothingEnabled = false;
scaledCtx.drawImage(
  cropCanvas,
  0,
  0,
  scaledCanvas.width,
  scaledCanvas.height
);

const image = scaledCanvas.toDataURL("image/png");
setCropPreview(image);

const result = await Tesseract.recognize(image, "eng", {
  logger: (m) => console.log(m),
});

      const text = result.data.text;
      setOcrText(text);

      const number = extractCardNumber(text);
      setFoundNumber(number);

      console.log("OCR tekst:", text);
      console.log("Kaartnummer:", number);
    } catch (error) {
      console.error(error);
      alert("OCR scan mislukt.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">Kaart scannen</h3>
          <p className="text-sm text-slate-400">
            Richt op de onderkant van de kaart voor het setnummer.
          </p>
        </div>

        {!cameraActive && (
          <button
            type="button"
            onClick={startCamera}
            className="bg-yellow-400 text-slate-950 font-bold rounded-xl px-5 py-3"
          >
            Camera openen
          </button>
        )}
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden bg-black border border-slate-700">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {!cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            Camera preview
          </div>
        )}

        <div className="absolute left-[8%] right-[8%] bottom-[4%] h-[18%] border-2 border-yellow-400 rounded-xl pointer-events-none" />
      </div>

      <button
        type="button"
        onClick={scanCard}
        disabled={!cameraActive || scanning}
        className="mt-4 bg-green-500 text-white font-bold rounded-xl px-5 py-3 disabled:opacity-50"
      >
        {scanning ? "Scannen..." : "Scan nummer"}
      </button>

      {foundNumber && (
        <div className="mt-4 bg-green-500/10 border border-green-500 rounded-xl p-3">
          <p className="text-green-400 font-bold">
            Gevonden kaartnummer: {foundNumber}
          </p>
        </div>
      )}

      {!foundNumber && ocrText && (
        <div className="mt-4 bg-red-500/10 border border-red-500 rounded-xl p-3">
          <p className="text-red-400 font-bold">
            Geen kaartnummer gevonden
          </p>
        </div>
      )}

      {cropPreview && (
        <div className="mt-4">
          <p className="text-slate-400 text-sm mb-2">
            OCR crop preview:
          </p>
          <img
            src={cropPreview}
            alt="OCR crop"
            className="w-full max-w-md rounded-xl border border-slate-700"
          />
        </div>
      )}

      {ocrText && (
        <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 whitespace-pre-wrap">
          {ocrText}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}