// App.jsx
import React, { useState, useRef, useEffect, useMemo, useCallback, Suspense } from "react";
import {
  Camera, CameraOff, Upload, Sparkles, RotateCcw, User, ArrowRight,
  Info, Smartphone, Wifi, CheckCircle2, Sun, Moon
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Peer from "peerjs";
import { DotLottiePlayer } from "@dotlottie/react-player";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import wave from "./assets/wave.lottie";

/* === Three.js / R3F === */
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Stage, Environment, ContactShadows, Html, Bounds, useProgress } from "@react-three/drei";

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
// ✅ Only allow [a-z0-9_-], force lowercase, and cap length
const normalizePeerId = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24);

// ✅ Strong random id with safe characters (no dots)
const createSessionId = () => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(12);
  (window.crypto?.getRandomValues?.(bytes) ?? bytes.fill(Math.random() * 256));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
};


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
   R3F Helpers
   =========================== */
function Loader() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <Html center>
      <div className="rounded-xl px-4 py-2 text-sm font-medium"
           style={{ background: "rgba(0,0,0,0.6)", color: "white" }}>
        Loading {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

function GLBModel({ url }) {
  const { scene } = useGLTF(url, true); // draco support auto (if GLB embedded)
  // Ensure reasonable materials (avoid overbright)
  scene.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      if (o.material && 'envMapIntensity' in o.material) {
        o.material.envMapIntensity = 0.7;
      }
    }
  });
  return <primitive object={scene} />;
}

function AutoFitGLB({ url, padding = 1.8 }) {
  const controls = React.useRef();
  const { camera, size } = useThree();
  const { scene } = useGLTF(url);

  // make materials sane & enable shadows
  React.useMemo(() => {
    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material && "envMapIntensity" in o.material) o.material.envMapIntensity = 0.7;
        if (o.material && "roughness" in o.material && typeof o.material.roughness === "number") {
          o.material.roughness = Math.min(1, Math.max(0.2, o.material.roughness));
        }
      }
    });
    return scene;
  }, [scene]);

  React.useLayoutEffect(() => {
    // get bounds
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const sizeV = box.getSize(new THREE.Vector3()); // width=x, height=y, depth=z

    // recentre model at origin so controls target = [0, ty, 0]
    scene.position.sub(center);

    // camera fit using VERTICAL FOV math
    const vFov = THREE.MathUtils.degToRad(camera.fov); // vertical fov in radians
    const aspect = size.width / size.height;

    const halfHeight = sizeV.y / 2;
    const halfWidth  = sizeV.x / 2;

    // distance required so the full HEIGHT fits
    const distHeight = halfHeight / Math.tan(vFov / 2);
    // distance required so the full WIDTH fits (vertical fov -> divide by aspect)
    const distWidth  = (halfWidth / Math.tan(vFov / 2)) / aspect;

    const distance = padding * Math.max(distHeight, distWidth);

    camera.near = 0.01;
    camera.far = Math.max(100, distance * 10);
    camera.position.set(distance * 0.6, distance * 0.35, distance); // nice 3/4 angle
    camera.updateProjectionMatrix();

    // aim a little above exact center so you see torso+head nicely
    const targetY = sizeV.y * 0.05;
    controls.current?.target.set(0, targetY, 0);
    controls.current?.update();
  }, [scene, camera, size.width, size.height]);

  return (
    <>
      <primitive object={scene} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={0.4}
        maxDistance={10}
        maxPolarAngle={Math.PI * 0.98}
      />
    </>
  );
}



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

  // PeerJS connection ref for mobile → desktop send
  const mobileConnRef = useRef(null);

  const palette = useMemo(() => (isDark ? TOKENS.dark : TOKENS.light), [isDark]);
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-300" : "text-slate-600";
  const textSubtle = isDark ? "text-slate-400" : "text-slate-500";

  /* session + role by query */
  const shareLink = useMemo(() => {
  if (!sessionId || typeof window === "undefined") return "";
  const id = normalizePeerId(sessionId);
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("mobile", "1");
  url.searchParams.set("session", id);
  return url.toString();
}, [sessionId]);


  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const mobile = params.get("mobile") === "1";
  const s = normalizePeerId(params.get("session"));

  if (mobile) {
    setClientType("mobile");
    if (s) {
    setSessionId(s);
    } else {
      setPeerError("Missing session id.");
      setPairingStatus("error");
    }
  } else {
    setClientType("desktop");
  setSessionId(normalizePeerId(s) || createSessionId());
  }
}, []);

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

  /* responsive (layout placeholder) */
  useEffect(() => {
    const onResize = () => {};
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* pairing: desktop accept */
  useEffect(() => {
  if (clientType !== "desktop" || !sessionId) return;

  const id = normalizePeerId(sessionId);
  if (!id) {
    setPeerError("Invalid session id.");
    setPairingStatus("error");
    return;
  }

  let cancelled = false;
  const peer = new Peer(id, { host: "0.peerjs.com", port: 443, secure: true });
  setPairingStatus("waiting");
  setPeerError("");

  // Keep the URL in sync (and safe)
  const u = new URL(window.location.href);
  u.searchParams.set("session", id);
  u.searchParams.delete("mobile");
  window.history.replaceState({}, "", u.toString());

  peer.on("connection", (conn) => {
    if (cancelled) return;
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
    conn.on("close", () => { if (!cancelled) setPairingStatus("waiting"); });
  });

  peer.on("error", (e) => {
    if (!cancelled) {
      setPeerError(e?.message || "Peer error");
      setPairingStatus("error");
    }
  });

  return () => { cancelled = true; try { peer.destroy(); } catch {} };
}, [clientType, sessionId]);


  /* pairing: mobile connect (FIX: store conn and actually send) */
  useEffect(() => {
  if (clientType !== "mobile" || !sessionId) return;

  const remoteId = normalizePeerId(sessionId);
  if (!remoteId) {
    setPeerError("Invalid session id.");
    setPairingStatus("error");
    return;
  }

  let cancelled = false;
  const peer = new Peer(undefined, { host: "0.peerjs.com", port: 443, secure: true });

  const connect = () => {
    if (cancelled) return;
    const conn = peer.connect(remoteId, { reliable: true });
    mobileConnRef.current = conn;

    conn.on("open", () => { setPairingStatus("connected"); setPeerError(""); });
    conn.on("data", (p) => { if (p?.type === "ack") setPairingStatus("received"); });
    conn.on("error", () => { setPeerError("Connection lost. Reconnecting…"); setPairingStatus("error"); setTimeout(connect, 1200); });
    conn.on("close", () => { setPairingStatus("waiting"); setTimeout(connect, 1200); });
  };

  peer.on("open", connect);
  peer.on("error", (e) => { setPeerError(e?.message || "Peer error"); setPairingStatus("error"); });

  return () => { cancelled = true; try { peer.destroy(); } catch {} };
}, [clientType, sessionId]);


  /* progress sim (optional placeholder) */
  const stopProgress = useCallback(() => { if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null; } }, []);
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

  /* send from mobile (FIX: actually sends via conn) */
  const sendBlobToDesktop = useCallback((blob) => {
    if (!blob) return;
    const conn = mobileConnRef.current;
    if (!conn || conn.open !== true) {
      setPeerError("Not connected to desktop.");
      setPairingStatus("error");
      return;
    }
    setPairingStatus("sending"); setMobileSending(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        conn.send({ type: "image", data: reader.result });
        setMobileSending(false); setPairingStatus("sent");
      } catch (e) {
        setMobileSending(false); setPairingStatus("error"); setPeerError("Failed to send image.");
      }
    };
    reader.onerror = () => { setMobileSending(false); setPairingStatus("error"); setPeerError("Failed to encode image."); };
    reader.readAsDataURL(blob instanceof Blob ? blob : new Blob([blob], { type: "image/jpeg" }));
  }, []);

  /* generation -> your existing endpoint */
  const generateAvatar = useCallback(async () => {
    if (!capturedImage) return setError("Please capture or upload an image first.");
    setIsGenerating(true); setError(null); setStep(2);

    const formData = new FormData();
    const imageFile = capturedImage instanceof File
      ? capturedImage
      : new File([capturedImage], "selfie.jpg", { type: capturedImage?.type || "image/jpeg" });

    formData.append("gender", gender);
    formData.append("image", imageFile);

    try {
      const resp = await fetch("http://52.66.97.86:8000/generate", { method: "POST", body: formData });
      const data = await resp.json();
      if (data.status === "completed" && data.outputs?.[0]) {
        const url = data.outputs[0];
        setGeneratedModel(url);
        setProgress(100);
        setStep(3);
        // Preload GLB (optional)
        try { useGLTF.preload(url); } catch {}
      } else {
        throw new Error("Generation failed");
      }
    } catch {
      setError("Failed to generate avatar. Please try again.");
      setStep(1);
    } finally { setIsGenerating(false); }
  }, [capturedImage, gender]);

  /* UI atoms */
  const StepBadge = () => (
    <div className="mx-auto h-1.5 w-52 overflow-hidden rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.1)" }}>
      <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500"
           style={{ width: `${Math.min(100, (step / 3) * 100)}%`, transition: "width .4s" }} />
    </div>
  );

  /* Screens */
  const Hero = () => {
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

          <div
            className="axtr-float relative grid h-56 w-56 place-items-center rounded-full overflow-hidden border"
            style={{
              borderColor: "rgba(255,255,255,0.12)",
              background:
                "radial-gradient(100% 100% at 50% 50%, rgba(59,255,255,0.12) 0%, transparent 65%)",
              boxShadow: "0 40px 80px -60px rgba(59,255,255,0.45)",
            }}
          >
            <DotLottiePlayer
              src={wave}
              autoplay
              loop
              className="absolute inset-0 pointer-events-none"
            />
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
               <span className="font-mono text-sm">{normalizePeerId(sessionId)}</span>
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
        <div className="mt-10 grid place-items-center">
          <DotLottieReact
            src="https://lottie.host/f570eef6-9037-47ce-92f2-024456cec1b0/0B8w9hWZly.lottie"
            loop
            autoplay
            style={{ width: 360, height: 360 }}
          />
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
        {/* R3F Canvas */}
        <div
          className="axtr-glass p-4"
          style={{
            background: isDark ? "rgba(9,12,18,0.82)" : "rgba(255,255,255,0.95)",
            borderColor: palette.border,
            "--axtr-glow": isDark ? "rgba(59,255,255,0.35)" : "rgba(37,99,235,0.25)",
          }}
        >
          <div className="rounded-2xl overflow-hidden" style={{ background: palette.canvas }}>
            {generatedModel ? (
              <div style={{ width: "100%", height: "min(72vh, 70vw)" }}>
                <Canvas
                  shadows
                  dpr={[1, 2]}
                  camera={{ position: [0, 1.2, 2], fov: 60, near: 0.01, far: 100 }}
                  gl={{ antialias: true }}
                >
                  <Suspense fallback={<Loader />}>
                    <Environment preset="city" />
                    <hemisphereLight intensity={0.35} />
                    <directionalLight
                      castShadow
                      intensity={1.0}
                      position={[3, 5, 2]}
                      shadow-mapSize-width={2048}
                      shadow-mapSize-height={2048}
                    />
                    <AutoFitGLB url={generatedModel} />
                    <ContactShadows
                      position={[0, -0.001, 0]}
                      opacity={0.3}
                      blur={2.5}
                      far={5}
                      resolution={1024}
                      scale={8}
                    />
                  </Suspense>
                </Canvas>


              </div>
            ) : (
              <div className="aspect-video grid place-items-center text-sm" style={{ color: palette.muted }}>
                Model not ready yet.
              </div>
            )}
          </div>
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
              onClick={() => {
                // simple orbit reset: reload same URL to force Bounds recompute (cheap trick)
                setGeneratedModel((u) => (u ? `${u}${u.includes("#r") ? "" : "#r"}` : u));
              }}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-500 ${isDark ? "bg-white/10 hover:bg_white/15 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`.replace("_","/")}
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
          <p className={`text-sm ${textMuted}`}>Session <span className="font-mono">{normalizePeerId(sessionId)}</span></p>
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

/* drei GLTF loader cache cleanup on HMR (optional) */
useGLTF.clear = useGLTF.clear || (() => {});
