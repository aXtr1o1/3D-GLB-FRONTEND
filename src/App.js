import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Camera, CameraOff, Upload, Sparkles, RotateCcw, User, ArrowRight,
  Info, ShieldCheck, Cpu, Timer, Smartphone, Wifi, CheckCircle2, Sun, Moon
} from "lucide-react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { QRCodeSVG } from "qrcode.react";
import Peer from "peerjs";
import { DotLottiePlayer } from "@dotlottie/react-player";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import wave from "./assets/wave.lottie";
/* ===========================
   Axtr-inspired palette/tokens
   =========================== */
const TOKENS = {
  dark: {
    canvas: "#050606",
    surface: "#0b0d11",
    surface2: "#11151b",
    border: "rgba(255,255,255,0.08)",
    text: "#f5f8fb",
    muted: "#8b8b8b",
    accent: "#3bffff",
    accent2: "#71c2ef",
    accentWarm: "#e1cd86",
    glow: "rgba(59,255,255,0.18)",
  },
  light: {
    canvas: "#f4f6fb",
    surface: "#ffffff",
    surface2: "#edf2fb",
    border: "rgba(15,23,42,0.12)",
    text: "#0f172a",
    muted: "#64748b",
    accent: "#2563eb",
    accent2: "#1d4ed8",
    accentWarm: "#dd7ddf",
    glow: "rgba(37,99,235,0.12)",
  },
};

const pairingCopy = {
  idle: "Ready to connect",
  waiting: "Waiting for mobile device",
  connected: "Mobile linked",
  sending: "Receiving photo",
  received: "Photo received",
  sent: "Photo sent",
  error: "Connection issue",
};

/* ===========================
   Small helpers
   =========================== */
const createSessionId = () =>
  (window.crypto?.randomUUID?.() ?? Math.random().toString(36))
    .replace(/-/g, "")
    .slice(0, 10)
    .toUpperCase();

const dataUrlToFile = async (dataUrl, filename) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
};

/* ===========================
   Header
   =========================== */
function AxtrHeader({ isDark, palette, onToggleTheme }) {
  const bg = isDark
    ? "linear-gradient(180deg, rgba(5,6,8,0.92) 0%, rgba(5,6,8,0.65) 100%)"
    : "linear-gradient(180deg, rgba(244,246,251,0.92) 0%, rgba(244,246,251,0.65) 100%)";

  const navItems = [
    { label: "Overview", href: "#hero" },
    { label: "Workflow", href: "#gallery" },
    { label: "Output", href: "#ready" }
  ];

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur border-b transition-all duration-500"
      style={{ background: bg, borderColor: palette.border }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <a href="#hero" className="group flex items-center gap-3 select-none">
          <img
            src="/axtr-assets/axtr-lockup.png"
            alt="aXtrLabs"
            className="h-12 w-auto transition-all duration-300 group-hover:scale-105"
          />
        </a>


        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`group relative overflow-hidden rounded-full px-4 py-2 font-medium transition-all duration-500 ${
                isDark
                  ? "text-white/70 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="relative z-10">{item.label}</span>
              <span
                className="absolute inset-0 -z-0 translate-y-full rounded-full bg-white/10 transition-transform duration-500 group-hover:translate-y-0"
              />
            </a>
          ))}
        </nav>

        <button
          onClick={onToggleTheme}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-black shadow-[0_8px_20px_-12px_rgba(59,255,255,0.6)] transition-all duration-500 hover:-translate-y-0.5"
          style={{
            background: `linear-gradient(120deg, ${palette.accent} 0%, ${palette.accent2} 45%, ${palette.accentWarm} 100%)`,
          }}
          type="button"
        >
          {isDark ? <Sun className="h-4 w-4 text-slate-900" /> : <Moon className="h-4 w-4 text-white" />}
          {isDark ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}

/* ===========================
   Background Orbs
   =========================== */
const SubtleOrbs = ({ palette, isDark }) => (
  <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div
      className="absolute -top-32 -left-48 h-80 w-80 rounded-full blur-[120px]"
      style={{ background: palette.glow }}
    />
    <div
      className="absolute -bottom-40 -right-44 h-96 w-96 rounded-full blur-[140px]"
      style={{
        background: isDark ? "rgba(225,205,134,0.24)" : "rgba(37,99,235,0.16)",
      }}
    />
    <div
      className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full blur-[110px]"
      style={{
        background: `radial-gradient(circle, ${palette.accent} 0%, transparent 70%)`,
        opacity: 0.6,
      }}
    />
  </div>
);

/* ===========================
   Face overlay
   =========================== */
const FaceOutline = ({ palette }) => {
  const accent = palette.accent;
  const baseStroke = palette.muted;
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 400">
      <defs>
        <radialGradient id="faceGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.24" />
          <stop offset="70%" stopColor={accent} stopOpacity="0.08" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="faceStroke" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.4" />
        </linearGradient>
      </defs>

      <rect x="40" y="40" width="240" height="320" rx="24" fill="none" stroke={baseStroke} strokeOpacity="0.35" strokeWidth="2" />
      <circle cx="160" cy="150" r="120" fill="url(#faceGlow)" />
      <g stroke={baseStroke} strokeOpacity="0.3">
        <line x1="160" y1="40" x2="160" y2="360" strokeWidth="2" strokeDasharray="6 10" />
        <line x1="40" y1="200" x2="280" y2="200" strokeWidth="1.5" strokeDasharray="4 8" />
      </g>
      <path d="M160 105c-32 0-60 27-60 68 0 39 26 68 60 68s60-29 60-68c0-41-28-68-60-68zm0 0"
            fill="none" stroke="url(#faceStroke)" strokeWidth="4" />
      <path d="M96 234c21 40 64 68 64 68s43-28 64-68c20 4 36 14 36 30v28c0 17-14 31-31 31H91c-17 0-31-14-31-31v-28c0-16 16-26 36-30z"
            fill="rgba(56,189,248,0.12)" stroke="url(#faceStroke)" strokeWidth="2" />
      <circle cx="134" cy="170" r="10" fill={accent} opacity="0.25" />
      <circle cx="186" cy="170" r="10" fill={accent} opacity="0.25" />
      <path d="M135 210c12 10 38 10 50 0" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeOpacity="0.4" />
    </svg>
  );
};

/* ===========================
   Loader Cube (processing)
   =========================== */
const CubeLoader = ({ palette, progress, isDark }) => {
  const size = 96;
  const depth = size / 2;
  const faces = [
    { transform: `rotateY(0deg) translateZ(${depth}px)` },
    { transform: `rotateY(90deg) translateZ(${depth}px)` },
    { transform: `rotateY(180deg) translateZ(${depth}px)` },
    { transform: `rotateY(-90deg) translateZ(${depth}px)` },
    { transform: `rotateX(90deg) translateZ(${depth}px)` },
    { transform: `rotateX(-90deg) translateZ(${depth}px)` },
  ];
  return (
    <div className="relative mx-auto" style={{ width: size, height: size, perspective: "640px" }}>
      <div
        className="axtr-cube"
        style={{
          "--cube-bg": `linear-gradient(130deg, ${palette.accent} 0%, ${palette.accent2} 45%, ${palette.accentWarm ?? palette.accent2} 100%)`,
          "--cube-face-bg": isDark
            ? "linear-gradient(135deg, rgba(255,255,255,0.28), rgba(225,205,134,0.14))"
            : "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(37,99,235,0.35))",
          "--cube-border": isDark ? "rgba(244,244,255,0.25)" : "rgba(37,99,235,0.25)",
          "--cube-shadow": isDark
            ? "0 32px 70px -24px rgba(59,255,255,0.35)"
            : "0 32px 60px -28px rgba(37,99,235,0.25)",
        }}
      >
        {faces.map((s, i) => <span key={i} className="axtr-cube-face" style={s} />)}
      </div>
      <div
        className="pointer-events-none absolute inset-0 grid place-items-center text-xl font-semibold tracking-tight"
        style={{ color: palette.text }}
      >
        {Math.min(99, Math.round(progress))}
        <span className="ml-1 text-sm opacity-75">%</span>
      </div>
    </div>
  );
};

/* ===========================
   Main app
   =========================== */
export default function App() {
  // step: 0 hero, 1 connect, 2 processing, 3 ready
  const [step, setStep] = useState(0);
  const [isDark, setIsDark] = useState(true);

  const [capturedImage, setCapturedImage] = useState(null);
  const [gender, setGender] = useState("male");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedModel, setGeneratedModel] = useState(null);

  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState(null);

  // pairing
  const [clientType, setClientType] = useState("desktop");
  const [sessionId, setSessionId] = useState("");
  const [pairingStatus, setPairingStatus] = useState("idle");
  const [peerError, setPeerError] = useState("");
  const [mobileSending, setMobileSending] = useState(false);
  const [lastReceivedAt, setLastReceivedAt] = useState(null);

  // refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const connectionRef = useRef(null);
  const peerRef = useRef(null);

  const palette = useMemo(() => (isDark ? TOKENS.dark : TOKENS.light), [isDark]);
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-300" : "text-slate-600";
  const textSubtle = isDark ? "text-slate-400" : "text-slate-500";

  /* session + role by query */
  const shareLink = useMemo(() => {
    if (!sessionId || typeof window === "undefined") return "";
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("mobile", "1");
    url.searchParams.set("session", sessionId);
    return url.toString();
  }, [sessionId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mobile = params.get("mobile") === "1";
    const s = params.get("session");

    if (mobile) {
      setClientType("mobile");
      if (s) {
        setSessionId(s.toUpperCase());
      } else {
        setPeerError("Missing session id.");
        setPairingStatus("error");
      }
    } else {
      setClientType("desktop");
      setSessionId((s ? s : createSessionId()).toUpperCase());
    }
  }, []);

  useEffect(() => {
    if (clientType !== "desktop" || !sessionId) return;
    const u = new URL(window.location.href);
    u.searchParams.set("session", sessionId);
    u.searchParams.delete("mobile");
    window.history.replaceState({}, "", u.toString());
  }, [clientType, sessionId]);

  /* camera lifecycle */
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error(err);
      let message = "Unable to access the camera. Please allow camera permissions.";
      if (err?.name === "NotAllowedError") {
        message = "Camera permission was denied. Please enable it in your browser settings.";
      } else if (err?.name === "NotFoundError") {
        message = "No camera was detected. Connect a camera and try again.";
      } else if (typeof err?.message === "string" && err.message.toLowerCase().includes("https")) {
        message = "Camera access requires a secure context (https). Open this link using HTTPS or localhost.";
      }
      setError(message);
      setIsCameraActive(false);
    }
  }, []);
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);
  useEffect(() => { isCameraActive ? startCamera() : stopCamera(); return () => stopCamera(); }, [isCameraActive, startCamera, stopCamera]);

  /* responsive three.js canvas */
  useEffect(() => {
    const onResize = () => {
      if (!rendererRef.current || !cameraRef.current || !mountRef.current) return;
      const w = mountRef.current.clientWidth, h = mountRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* pairing: desktop accept */
  useEffect(() => {
    if (clientType !== "desktop" || !sessionId) return;
    let cancelled = false;

    const peer = new Peer(sessionId, { host: "0.peerjs.com", port: 443, secure: true });
    peerRef.current = peer;
    setPairingStatus("waiting");
    setPeerError("");

    peer.on("connection", (conn) => {
      if (cancelled) return;
      if (connectionRef.current) connectionRef.current.close?.();
      connectionRef.current = conn;
      setPairingStatus("connected");

      conn.on("data", async (payload) => {
        if (payload?.type === "image" && payload.data) {
          try {
            const file = await dataUrlToFile(payload.data, `axtr-mobile-${Date.now()}.jpg`);
            setCapturedImage(file);
            setIsCameraActive(false);
            setError(null);
            setStep(1);
            setPairingStatus("received");
            setLastReceivedAt(new Date());
            conn.send({ type: "ack" });
          } catch {
            setPeerError("Could not read the incoming photo.");
            setPairingStatus("error");
          }
        }
      });

      conn.on("error", () => { setPeerError("Connection interrupted."); setPairingStatus("error"); });
      conn.on("close", () => { if (!cancelled) { connectionRef.current = null; setPairingStatus("waiting"); } });
    });

    peer.on("error", (e) => { if (!cancelled) { setPeerError(e?.message || "Peer error"); setPairingStatus("error"); } });

    return () => { cancelled = true; connectionRef.current?.close?.(); peer.destroy(); peerRef.current = null; };
  }, [clientType, sessionId]);

  /* pairing: mobile connect */
  useEffect(() => {
    if (clientType !== "mobile" || !sessionId) return;
    let cancelled = false;
    const peer = new Peer(undefined, { host: "0.peerjs.com", port: 443, secure: true });
    peerRef.current = peer;

    const connect = () => {
      if (cancelled || connectionRef.current) return;
      const conn = peer.connect(sessionId, { reliable: true });
      connectionRef.current = conn;

      conn.on("open", () => { setPairingStatus("connected"); setPeerError(""); });
      conn.on("data", (p) => { if (p?.type === "ack") setPairingStatus("received"); });
      conn.on("error", () => { setPeerError("Connection lost. Reconnecting…"); setPairingStatus("error"); connectionRef.current = null; setTimeout(connect, 1200); });
      conn.on("close", () => { setPairingStatus("waiting"); connectionRef.current = null; setTimeout(connect, 1200); });
    };

    peer.on("open", connect);
    peer.on("error", (e) => { setPeerError(e?.message || "Peer error"); setPairingStatus("error"); });

    return () => { cancelled = true; connectionRef.current?.close?.(); peer.destroy(); peerRef.current = null; };
  }, [clientType, sessionId]);

  /* progress sim */
  const stopProgress = useCallback(() => { if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null; } }, []);
  const simulateProgress = useCallback(() => {
    stopProgress();
    setProgress(10);
    progressTimerRef.current = window.setInterval(() => {
      setProgress((p) => Math.min(96, p + 2 + Math.random() * 8));
    }, 520);
  }, [stopProgress]);
  useEffect(() => stopProgress, [stopProgress]);

  /* capture & upload */
  const capturePhoto = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((blob) => {
      if (!blob) return setError("Unable to capture photo.");
      setCapturedImage(blob); setIsCameraActive(false); setError(null);
    }, "image/jpeg", 0.93);
  }, []);
  const handleFileUpload = useCallback((e) => {
    const f = e.target.files?.[0]; if (!f) return;
    stopCamera(); setIsCameraActive(false); setCapturedImage(f); setError(null); e.target.value = "";
  }, [stopCamera]);

  /* send from mobile */
  const sendBlobToDesktop = useCallback((blob) => {
    if (!blob) return;
    const conn = connectionRef.current;
    if (!conn?.open) { setPairingStatus("waiting"); setPeerError("Desktop not connected yet."); return; }
    setPairingStatus("sending"); setMobileSending(true);
    const reader = new FileReader();
    reader.onloadend = () => { conn.send({ type: "image", data: reader.result }); setMobileSending(false); setPairingStatus("sent"); };
    reader.onerror = () => { setMobileSending(false); setPairingStatus("error"); setPeerError("Failed to encode image."); };
    reader.readAsDataURL(blob instanceof Blob ? blob : new Blob([blob], { type: "image/jpeg" }));
  }, []);

  /* generation -> your existing endpoint */
  const generateAvatar = useCallback(async () => {
    if (!capturedImage) return setError("Please capture or upload an image first.");
    setIsGenerating(true); setError(null); setStep(2); simulateProgress();

    const formData = new FormData();
    const imageFile = capturedImage instanceof File
      ? capturedImage
      : new File([capturedImage], "selfie.jpg", { type: capturedImage.type || "image/jpeg" });

    formData.append("gender", gender);
    formData.append("image", imageFile);

    try {
      const resp = await fetch("http://52.66.97.86:8000/generate", { method: "POST", body: formData });
      const data = await resp.json();
      if (data.status === "completed" && data.outputs?.[0]) {
        const url = data.outputs[0];
        setGeneratedModel(url);
        load3DModel(url);
        setProgress(100); stopProgress(); setStep(3);
      } else {
        throw new Error("Generation failed");
      }
    } catch {
      stopProgress(); setError("Failed to generate avatar. Please try again."); setStep(1);
    } finally { setIsGenerating(false); }
  }, [capturedImage, gender, simulateProgress, stopProgress]);

  /* three.js viewer */
  const load3DModel = useCallback((url) => {
    if (!mountRef.current) return;

    if (rendererRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }
    rendererRef.current?.dispose?.();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x0b0f1a : 0xf8fafc);
    sceneRef.current = scene;

    const w = mountRef.current.clientWidth || 640;
    const h = mountRef.current.clientHeight || 360;

    const cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    cam.position.set(0, 0, 3);
    cameraRef.current = cam;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(w, h);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6); dir.position.set(4, 6, 6); scene.add(dir);

    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.1 / maxDim;
        model.scale.multiplyScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        scene.add(model);

        let t = 0;
        const animate = () => {
          if (!rendererRef.current) return;
          t += 0.01;
          model.rotation.y += 0.005;
          model.position.y = Math.sin(t) * 0.02;
          rendererRef.current.render(scene, cam);
          requestAnimationFrame(animate);
        };
        animate();
      },
      undefined,
      () => setError("Unable to render the 3D model.")
    );
  }, [isDark]);

  /* UI atoms */
  const StepBadge = () => (
    <div className="mx-auto h-1.5 w-52 overflow-hidden rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.1)" }}>
      <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500"
           style={{ width: `${Math.min(100, (step / 3) * 100)}%`, transition: "width .4s" }} />
    </div>
  );

  /* Screens */
  const Hero = () => {
    const stats = [
      { value: "50+", label: "Agentic SaaS rollouts" },
      { value: "12 ms", label: "Realtime inference loop" },
      { value: "98%", label: "Retention uplift" },
    ];

    return (
      <section id="hero" className="relative overflow-hidden py-20 sm:py-24">
        <div className="axtr-water absolute inset-0 -z-20" />
        <div className="absolute inset-0 -z-10">
          <SubtleOrbs palette={palette} isDark={isDark} />
          <div className="axtr-aurora absolute -top-56 right-[-20%] h-[420px] w-[420px]" />
          <div className="axtr-aurora absolute bottom-[-40%] left-[-10%] h-[420px] w-[420px]" />
        </div>

        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-10 text-center">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.45em] ${isDark ? "border-white/20 text-white/70" : "border-slate-300 text-slate-700"}`}
            style={{ backdropFilter: "blur(12px)" }}
          >
            <Sparkles className="h-4 w-4" />
            Agentic SaaS Foundry
          </span>

          <h1
            className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-transparent md:text-[3.5rem]"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.88) 35%, ${palette.accentWarm} 100%)`,
              WebkitBackgroundClip: "text",
            }}
          >
            Orchestrate lifelike avatars and AI agents that feel as fluid as water.
          </h1>

          {/* <div
            className="axtr-float relative mt-10 grid h-56 w-56 place-items-center rounded-full border"
            style={{
              borderColor: "rgba(255,255,255,0.12)",
              background: "radial-gradient(100% 100% at 50% 50%, rgba(59,255,255,0.12) 0%, transparent 65%)",
              boxShadow: "0 40px 80px -60px rgba(59,255,255,0.45)",
            }}
          >
            <div className="absolute inset-8 rounded-full border border-white/15" />
            <User className="h-14 w-14 text-white/80" />
            <div className="absolute -inset-4 rounded-full border border-white/10 opacity-50" />
          </div> */}

          <div
  className="axtr-float relative grid h-56 w-56 place-items-center rounded-full overflow-hidden border"
  style={{
    borderColor: "rgba(255,255,255,0.12)",
    background:
      "radial-gradient(100% 100% at 50% 50%, rgba(59,255,255,0.12) 0%, transparent 65%)",
    boxShadow: "0 40px 80px -60px rgba(59,255,255,0.45)",
  }}
>
  {/* Lottie ripple backdrop (dotLottie player) */}
  <DotLottiePlayer
    src={wave}
    autoplay
    loop
    className="absolute inset-0 pointer-events-none"
  />

  {/* User icon on top */}
  <User className="relative z-10 h-14 w-14 text-white/80" />
</div>


          <p className={`max-w-3xl text-lg md:text-xl ${textMuted}`}>
            Feed your pipeline with cinematic 3D avatars, live camera capture and Peer-to-Peer handoff. aXtrLabs stitches vision,
            rendering and agent cognition into a single, beautifully smooth workflow.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <button
              onClick={() => setStep(1)}
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3 text-base font-semibold text-black transition-all duration-500 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(120deg, ${palette.accent} 0%, ${palette.accent2} 45%, ${palette.accentWarm} 100%)`,
                boxShadow: "0 20px 60px -28px rgba(59,255,255,0.45)",
              }}
              type="button"
            >
              Start capture
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => setStep(1)}
              className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 text-base font-semibold transition-all duration-500 ${isDark ? "border-white/20 text-white/80 hover:border-white/40 hover:text-white" : "border-slate-400 text-slate-700 hover:border-slate-600 hover:text-slate-900"}`}
              type="button"
            >
              Explore workflow
            </button>
          </div>

          {/* <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="axtr-glass px-6 py-5 text-left"
                style={{
                  background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)",
                  borderColor: palette.border,
                  color: palette.text,
                  "--axtr-glow": isDark ? "rgba(59,255,255,0.35)" : "rgba(37,99,235,0.25)",
                }}
              >
                <div className="text-3xl font-semibold tracking-tight">{item.value}</div>
                <div className={`mt-1 text-sm ${textSubtle}`}>{item.label}</div>
              </div>
            ))}
          </div> */}

        </div>
      </section>
    );
  };

  const Connect = () => {
    const statusTokens = {
      waiting: {
        background: "rgba(225,205,134,0.16)",
        color: isDark ? "#e1cd86" : "#b45309",
        borderColor: "rgba(225,205,134,0.35)",
      },
      connected: {
        background: "rgba(59,255,255,0.18)",
        color: isDark ? "#a5f3ff" : "#036672",
        borderColor: "rgba(59,255,255,0.35)",
      },
      sending: {
        background: "rgba(59,255,255,0.12)",
        color: isDark ? "#6be6ff" : "#075985",
        borderColor: "rgba(59,255,255,0.28)",
      },
      received: {
        background: "rgba(34,197,94,0.16)",
        color: isDark ? "#bbf7d0" : "#166534",
        borderColor: "rgba(34,197,94,0.35)",
      },
      error: {
        background: "rgba(248,113,113,0.16)",
        color: isDark ? "#fecaca" : "#b91c1c",
        borderColor: "rgba(248,113,113,0.35)",
      },
    };
    const status = statusTokens[pairingStatus] ?? {
      background: "rgba(148,163,184,0.14)",
      color: isDark ? "#d1d5db" : "#334155",
      borderColor: "rgba(148,163,184,0.35)",
    };

    return (
      <section id="gallery" className="relative overflow-hidden py-16">
      <div className="axtr-water pointer-events-none absolute inset-0 -z-20 opacity-35" />
      <div className="absolute inset-0 -z-10 opacity-60">
        <SubtleOrbs palette={palette} isDark={isDark} />
      </div>
      <div className="text-center space-y-4">
        <StepBadge />
        <h2 className={`text-4xl font-extrabold ${textPrimary}`}>Connect Your Mobile Device</h2>
        <p className={`max-w-2xl mx-auto ${textMuted}`}>
          Your desktop orchestrates the workflow; your phone acts as the lens. Pair them instantly via Peer-to-Peer QR handoff and keep capture streams perfectly in sync.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-8 md:grid-cols-2">
        {/* QR + status */}
        <div
          className="axtr-glass h-full p-8"
          style={{
            background: isDark ? "rgba(9,12,18,0.82)" : "rgba(255,255,255,0.9)",
            borderColor: palette.border,
            "--axtr-glow": isDark ? "rgba(225,205,134,0.28)" : "rgba(37,99,235,0.2)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] ${isDark ? "bg-white/5 text-white/70" : "bg-slate-100 text-slate-600"}`}>
              <Smartphone className="h-4 w-4" /> Mobile Link
            </span>
            <span className={`font-mono text-sm ${textSubtle}`}>{sessionId}</span>
          </div>

          <div className="mt-8 flex justify-center">
            <div
              className="rounded-3xl p-5 shadow-[0_30px_60px_-40px_rgba(59,255,255,0.4)]"
              style={{ background: palette.surface2, border: `1px solid ${palette.border}` }}
            >
              {shareLink ? (
                <QRCodeSVG value={shareLink} size={200} bgColor="transparent" fgColor={isDark ? "#f5f5f5" : "#1f2937"} level="H" includeMargin />
              ) : (
                <div className="grid h-48 w-48 place-items-center text-sm text-slate-400">Preparing link...</div>
              )}
            </div>
          </div>

          <div
            className="mt-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-500"
            style={status}
          >
            <Wifi className="h-4 w-4" /> {pairingCopy[pairingStatus] || pairingCopy.idle}
          </div>

          <ol className={`mt-8 space-y-3 text-sm ${textMuted}`}>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60" />
              Launch the camera app on your phone.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60" />
              Scan the QR code to open the secure capture link.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60" />
              Follow the framing guide and submit your selfie.
            </li>
          </ol>

          {lastReceivedAt && (
            <p className={`mt-6 text-xs ${textSubtle}`}>
              Last capture received at {lastReceivedAt.toLocaleTimeString()}
            </p>
          )}

          {peerError && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              <Info className="h-4 w-4" /> {peerError}
            </div>
          )}
        </div>
        {/* Desktop capture */}
        <div
          className="axtr-glass h-full p-8"
          style={{
            background: isDark ? "rgba(9,12,18,0.82)" : "rgba(255,255,255,0.9)",
            borderColor: palette.border,
            "--axtr-glow": isDark ? "rgba(59,255,255,0.35)" : "rgba(37,99,235,0.25)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${textPrimary} flex items-center gap-2`}><Camera className="h-5 w-5" /> Capture on desktop</h3>
            <span className={`text-xs uppercase tracking-[0.4em] ${textSubtle}`}>Studio view</span>
          </div>

          {!capturedImage ? (
            <>
              {isCameraActive ? (
                <div
                  className="relative mt-6 aspect-[4/3] overflow-hidden rounded-2xl border"
                  style={{ background: palette.surface2, border: `1px solid ${palette.border}` }}
                >
                  <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                  <FaceOutline palette={palette} />
                </div>
              ) : (
                <div
                  className="mt-6 flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed"
                  style={{ background: palette.surface2, borderColor: palette.border }}
                >
                  <div className="text-center">
                    <User className="mx-auto mb-3 h-12 w-12 text-white/40" />
                    <p className={textMuted}>Start camera or upload an image</p>
                  </div>
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isCameraActive) {
                      capturePhoto();
                    } else {
                      setError(null);
                      setIsCameraActive(true);
                    }
                  }}
                  className={`w-full rounded-xl px-4 py-3 font-semibold transition-all duration-500 ${isDark ? "bg-white text-slate-900 hover:shadow-[0_20px_40px_-30px_rgba(59,255,255,0.65)]" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                >
                  {isCameraActive ? "Capture photo" : "Start camera"}
                </button>

                <label className="block">
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  <div
                    className="w-full cursor-pointer rounded-xl px-4 py-3 text-center text-sm font-medium transition-all duration-500"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)",
                      color: palette.text,
                    }}
                  >
                    <Upload className="mr-2 inline h-4 w-4" />
                    Upload photo
                  </div>
                </label>
              </div>
            </>
          ) : (
            <>
              <div
                className="mt-6 aspect-[4/3] overflow-hidden rounded-2xl border"
                style={{ background: palette.surface2, borderColor: palette.border }}
              >
                <img src={URL.createObjectURL(capturedImage)} alt="Captured" className="h-full w-full object-cover" />
              </div>

              <label className={`mt-5 block text-sm font-semibold ${textSubtle}`}>Select gender</label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {["male", "female"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`rounded-xl px-4 py-2.5 font-semibold capitalize transition-all duration-500 ${
                      gender === g
                        ? "bg-white text-slate-900 shadow-[0_18px_40px_-28px_rgba(59,255,255,0.5)]"
                        : "bg-white/10 text-white hover:bg-white/15"
                    }`}
                    type="button"
                  >
                    {g}
                  </button>
                ))}
              </div>

              <button
                onClick={generateAvatar}
                disabled={isGenerating}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold text-black transition-all duration-500 disabled:opacity-60"
                style={{
                  background: `linear-gradient(120deg, ${palette.accent} 0%, ${palette.accent2} 45%, ${palette.accentWarm} 100%)`,
                  boxShadow: "0 22px 60px -28px rgba(59,255,255,0.45)",
                }}
                type="button"
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/40 border-t-transparent" />
                    Generating
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate 3D avatar
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setCapturedImage(null);
                  setIsCameraActive(false);
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-500"
                style={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.05)",
                  color: palette.text,
                }}
                type="button"
              >
                <RotateCcw className="h-4 w-4" />
                Start over
              </button>
            </>
          )}

          {error && (
            <div
              className="mt-4 rounded-xl border px-4 py-3 text-sm"
              style={{ background: "rgba(248,113,113,0.12)", borderColor: "rgba(248,113,113,0.35)", color: "#fecaca" }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
  };

  const Processing = () => (
    <section className="relative overflow-hidden py-14 text-center">
      <div className="axtr-water pointer-events-none absolute inset-0 -z-20 opacity-40" />
      <SubtleOrbs palette={palette} isDark={isDark} />
      <div className="relative space-y-4">
        <StepBadge />
        <h2 className={`text-4xl font-extrabold ${textPrimary}`}>Synthesising your 3D avatar</h2>
        <p className={`mx-auto max-w-2xl ${textMuted}`}>
          Our renderer blends photogrammetry, rigging clean-up and material tuning. Keep this tab open; progress glides smoothly toward 100%.
        </p>
        <div className="mt-10">
          <DotLottieReact
  src="https://lottie.host/f570eef6-9037-47ce-92f2-024456cec1b0/0B8w9hWZly.lottie"
  loop
  autoplay/>

        </div>
        <div className={`mt-6 flex items-center justify-center gap-2 text-sm ${textSubtle}`}>
          <Info className="h-4 w-4" />
          Processing capture stream and harmonising topology
        </div>
      </div>
    </section>
  );
  const Ready = () => (
    <section id="ready" className="relative overflow-hidden py-14">
      <div className="axtr-water pointer-events-none absolute inset-0 -z-20 opacity-35" />
      <SubtleOrbs palette={palette} isDark={isDark} />
      <div className="relative space-y-4 text-center">
        <StepBadge />
        <h2 className={`text-4xl font-extrabold ${textPrimary}`}>Your avatar is live</h2>
        <p className={`mx-auto max-w-2xl ${textMuted}`}>
          Spin, zoom and export the GLB. Re-run the pipeline with alternate personas whenever inspiration strikes.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div
          className="axtr-glass p-4"
          style={{
            background: isDark ? "rgba(9,12,18,0.82)" : "rgba(255,255,255,0.95)",
            borderColor: palette.border,
            "--axtr-glow": isDark ? "rgba(59,255,255,0.35)" : "rgba(37,99,235,0.25)",
          }}
        >
          <div ref={mountRef} className="aspect-video rounded-2xl" style={{ background: palette.canvas }} />
        </div>

        <div className="space-y-4">
          <div
            className="axtr-glass p-6"
            style={{
              background: isDark ? "rgba(9,12,18,0.82)" : "rgba(255,255,255,0.95)",
              borderColor: palette.border,
              "--axtr-glow": isDark ? "rgba(225,205,134,0.25)" : "rgba(37,99,235,0.2)",
            }}
          >
            <h3 className={`text-lg font-semibold ${textPrimary}`}>Next steps</h3>
            <ul className={`mt-3 space-y-3 text-sm ${textMuted}`}>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" /> Share the GLB with design or bring it into Blender.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" /> Generate additional looks with persona presets.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" /> Capture cinematic stills directly from the viewer.</li>
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => generatedModel && load3DModel(generatedModel)}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-500 ${isDark ? "bg-white/10 hover:bg-white/15 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
              type="button"
            >
              <RotateCcw className="h-4 w-4" /> Reset view
            </button>
            <a
              href={generatedModel || undefined}
              download={generatedModel ? "avatar.glb" : undefined}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-500 ${generatedModel ? "text-black" : "pointer-events-none opacity-60"}`}
              style={{
                background: generatedModel ? `linear-gradient(120deg, ${palette.accent} 0%, ${palette.accent2} 45%, ${palette.accentWarm} 100%)` : "rgba(255,255,255,0.06)",
                boxShadow: generatedModel ? "0 20px 60px -28px rgba(59,255,255,0.45)" : "none",
              }}
            >
              Download GLB
              <ArrowRight className="h-4 w-4" />
            </a>
            <button
              onClick={() => setStep(1)}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-500 ${isDark ? "bg-white/10 hover:bg-white/15 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
              type="button"
            >
              Create another
            </button>
            <button
              onClick={() => {
                setCapturedImage(null);
                setGeneratedModel(null);
                setStep(0);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-500 ${isDark ? "bg-white/10 hover:bg-white/15 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
              type="button"
            >
              Back to start
            </button>
          </div>
        </div>
      </div>
    </section>
  );
  const MobileCapture = () => (
    <div className="min-h-screen relative" style={{ background: palette.canvas, color: palette.text }}>
      <div className="axtr-water pointer-events-none absolute inset-0 -z-20 opacity-35" />
      <SubtleOrbs palette={palette} isDark={isDark} />
      <div className="max-w-md mx-auto px-5 py-10 space-y-6">
        <div className="text-center space-y-2">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isDark ? "bg-white/10 text-sky-200" : "bg-indigo-100 text-indigo-700"}`}>
            <Sparkles className="w-4 h-4" /> aXtr link
          </span>
          <h1 className={`text-3xl font-bold ${textPrimary}`}>Share your camera instantly</h1>
          <p className={`text-sm ${textMuted}`}>Session <span className="font-mono">{sessionId}</span></p>
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm`}
               style={{ background: palette.surface2, borderColor: palette.border }}>
            <Wifi className="w-4 h-4" /> {pairingCopy[pairingStatus] || pairingCopy.idle}
          </div>
          {peerError && <p className="text-rose-300 text-xs">{peerError}</p>}
        </div>

        <div className="rounded-2xl overflow-hidden border" style={{ background: palette.surface, borderColor: palette.border }}>
          {isCameraActive ? (
            <div className="relative aspect-[3/4]">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <FaceOutline palette={palette} />

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/60 via-black/10 to-transparent px-4 pb-6 pt-8">
                <button
                  onClick={() => capturePhoto()}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2 font-semibold text-slate-900 shadow-lg shadow-black/30 active:scale-95"
                  type="button"
                >
                  <Camera className="h-4 w-4" />
                  Capture
                </button>
                <button
                  onClick={() => { stopCamera(); setIsCameraActive(false); }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 text-sm font-medium text-white/90 active:scale-95"
                  type="button"
                >
                  <CameraOff className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : capturedImage ? (
            <div className="relative aspect-[3/4]">
              <img src={URL.createObjectURL(capturedImage)} alt="Captured" className="w-full h-full object-cover" />
              <button
                onClick={() => { setCapturedImage(null); setIsCameraActive(true); }}
                className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white"
                type="button"
              >
                Retake
              </button>
            </div>
          ) : (
            <div className="grid h-72 place-items-center text-slate-400">Start camera or upload a photo</div>
          )}
        </div>

        {!isCameraActive && (
          <button
            onClick={() => { setError(null); setCapturedImage(null); setIsCameraActive(true); }}
            className={`w-full px-4 py-3 rounded-xl font-semibold ${isDark ? "bg-white text-black" : "bg-slate-900 text-white"}`}
          >
            <Camera className="w-4 h-4 inline mr-2" /> Start Camera
          </button>
        )}

        <label className={`w-full grid place-items-center px-4 py-3 rounded-xl cursor-pointer border-2 border-dashed ${isDark ? "border-white/20 text-white/90 hover:bg-white/10" : "border-slate-300 text-slate-700 hover:bg-slate-100"}`}>
          <Upload className="w-4 h-4 mr-2 inline" /> Upload from gallery
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>

        {error && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              background: "rgba(248,113,113,0.14)",
              borderColor: "rgba(248,113,113,0.45)",
              color: "#fecaca"
            }}
          >
            {error}
          </div>
        )}

        <button
          disabled={!capturedImage || mobileSending}
          onClick={() => sendBlobToDesktop(capturedImage)}
          className={`w-full px-4 py-3 rounded-xl font-semibold ${isDark ? "bg-sky-500 text-white hover:bg-sky-400" : "bg-indigo-600 text-white hover:bg-indigo-500"} disabled:opacity-60`}
        >
          {mobileSending ? "Sending…" : <>Send to desktop <ArrowRight className="w-4 h-4 inline ml-1" /></>}
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

  if (clientType === "mobile") return <MobileCapture />;

  return (
    <div className="min-h-screen" style={{ background: palette.canvas, color: palette.text }}>
      <AxtrHeader isDark={isDark} palette={palette} onToggleTheme={() => setIsDark((v) => !v)} />
      <main className="max-w-7xl mx-auto px-5 pb-20">
        {step === 0 && <Hero />}
        {step === 1 && <Connect />}
        {step === 2 && <Processing />}
        {step === 3 && <Ready />}
      </main>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

















