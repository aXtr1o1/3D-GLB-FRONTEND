import React from "react";
import "./loader-axtr-cube.scss";

/**
 * AxtrCubeLoader
 * Props:
 *  - fullscreen: boolean  -> wrap in a centered full-screen backdrop (default: true)
 *  - label: string|null   -> caption under loader, set null/"" to hide (default: "Generating 3D GLB…")
 *  - scale: number        -> additional scale multiplier (on top of SCSS), e.g., 1 = normal (default: 1)
 *  - className: string    -> optional extra class on root
 */
export default function AxtrCubeLoader({
  fullscreen = true,
  label = "Generating 3D GLB…",
  scale = 1,
  className = "",
}) {
  const rows = [1, 2, 3];
  const cols = [1, 2, 3];
  const layers = [1, 2, 3];

  // Build cubes for each row (h1/h2/h3)
  const renderRow = (h) => (
    <div key={`h${h}`} className={`h${h}Container`}>
      {cols.flatMap((w) =>
        layers.map((l) => (
          <div key={`h${h}w${w}l${l}`} className={`cube h${h} w${w} l${l}`}>
            <div className="face top" />
            <div className="face left" />
            <div className="face right" />
          </div>
        ))
      )}
    </div>
  );

  const content = (
    <div
      className={`container ${className}`}
      style={{ transform: `scale(${0.58 * scale})` }}
    >
      {/* Your exact 3×3 rows */}
      {rows.map(renderRow)}
    </div>
  );

  if (!fullscreen) {
    // Center INSIDE whatever box you render this in (e.g., your 220×220 div)
    return (
      <div className="axtr-cube-loader-embed" aria-live="polite" role="status">
        {content}
        {label ? (
          <div className="axtr-cube-label">{label}</div>
        ) : null}
      </div>
    );
  }

  // Fullscreen overlay (already centered)
  return (
    <div
      className="axtr-cube-loader-body"
      aria-live="polite"
      role="status"
      style={{
        position: "fixed",
        inset: 0,
        background: "#0b0d11", // matches axtr palette
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
      }}
    >
      {content}
      {label ? (
        <div className="axtr-cube-label">{label}</div>
      ) : null}
    </div>
  );
}
