import { useState, useRef } from "react";

const TYPE_COLORS = {
  document_title:  { fill: "rgba(239,68,68,0.18)",    stroke: "#ef4444", label: "Document Title" },
  paragraph_title: { fill: "rgba(234,179,8,0.18)",    stroke: "#eab308", label: "Paragraph Title" },
  section_title:   { fill: "rgba(245,158,11,0.18)",   stroke: "#f59e0b", label: "Section Title" },
  text:            { fill: "rgba(59,130,246,0.13)",   stroke: "#3b82f6", label: "Text" },
  caption:         { fill: "rgba(14,165,233,0.15)",   stroke: "#0ea5e9", label: "Caption" },
  footnote:        { fill: "rgba(100,116,139,0.15)",  stroke: "#64748b", label: "Footnote" },
  header:          { fill: "rgba(239,68,68,0.12)",    stroke: "#f87171", label: "Header" },
  footer:          { fill: "rgba(239,68,68,0.12)",    stroke: "#fca5a5", label: "Footer" },
  table:           { fill: "rgba(16,185,129,0.18)",   stroke: "#10b981", label: "Table" },
  table_cell:      { fill: "rgba(52,211,153,0.13)",   stroke: "#34d399", label: "Table Cell" },
  figure:          { fill: "rgba(168,85,247,0.18)",   stroke: "#a855f7", label: "Figure" },
  image:           { fill: "rgba(192,132,252,0.15)",  stroke: "#c084fc", label: "Image" },
  list_item:       { fill: "rgba(249,115,22,0.13)",   stroke: "#f97316", label: "List Item" },
  formula:         { fill: "rgba(236,72,153,0.15)",   stroke: "#ec4899", label: "Formula" },
  code:            { fill: "rgba(20,184,166,0.15)",   stroke: "#14b8a6", label: "Code" },
  page_number:     { fill: "rgba(148,163,184,0.15)",  stroke: "#94a3b8", label: "Page Number" },
  default:         { fill: "rgba(99,102,241,0.13)",   stroke: "#6366f1", label: "Other" },
};

// ─── Upload screen ────────────────────────────────────────────────────────────
function UploadScreen({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  return (
    <div style={S.uploadScreen}>
      <div style={S.uploadCard}>
        <div style={S.logoRow}>
          <div style={S.logoIcon}>
            <FileIcon size={22} color="#2563eb" />
          </div>
          <span style={S.appName}>DocExtract</span>
        </div>
        <h1 style={S.uploadTitle}>Extract &amp; Visualize Document Elements</h1>
        <p style={S.uploadSub}>
          Upload a PDF to detect and annotate bounding boxes for titles, text, tables, and more.
        </p>
        <div
          style={{ ...S.dropzone, ...(dragging ? S.dropzoneDrag : {}) }}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            style={{ display: "none" }}
            accept=".pdf"
            onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
          />
          <UploadIcon color={dragging ? "#2563eb" : "#94a3b8"} />
          <p style={S.dropText}>{dragging ? "Drop to upload" : "Drag & drop your file here"}</p>
          <p style={S.dropHint}>or <span style={S.dropLink}>browse files</span></p>
          <p style={S.dropFormats}>PDF</p>
        </div>
      </div>
    </div>
  );
}

// ─── File confirm screen ───────────────────────────────────────────────────────
function ConfirmScreen({ file, onExtract, onReset, loading, error }) {
  return (
    <div style={S.uploadScreen}>
      <div style={{ ...S.uploadCard, maxWidth: 440 }}>
        <div style={S.logoRow}>
          <div style={S.logoIcon}><FileIcon size={18} color="#2563eb" /></div>
          <span style={S.appName}>DocExtract</span>
        </div>
        <div style={S.fileRow}>
          <div style={S.fileIconBox}><FileIcon size={18} color="#2563eb" /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.fileNameText}>{file.name}</div>
            <div style={S.fileSizeText}>{(file.size / 1024).toFixed(1)} KB</div>
          </div>
          <button style={S.removeBtn} onClick={onReset}>
            <CloseIcon />
          </button>
        </div>
        {error && <div style={S.errorBox}>{error}</div>}
        <button style={S.extractBtn} onClick={onExtract} disabled={loading}>
          {loading ? "Extracting…" : "Extract & Annotate"}
        </button>
        <button style={S.secondaryBtn} onClick={onReset}>Choose different file</button>
      </div>
    </div>
  );
}

// ─── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={S.uploadScreen}>
      <div style={{ ...S.uploadCard, maxWidth: 320, alignItems: "center" }}>
        <div style={S.spinnerLg} />
        <p style={{ margin: "16px 0 4px", fontWeight: 600, color: "#1e293b" }}>Extracting document…</p>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>This may take a few seconds</p>
      </div>
    </div>
  );
}

// ─── Main viewer ───────────────────────────────────────────────────────────────
export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed
  const [hoveredBox, setHoveredBox] = useState(null);
  const [activeTypes, setActiveTypes] = useState(new Set(Object.keys(TYPE_COLORS)));
  const [showConfidence, setShowConfidence] = useState(false);
  const [zoom, setZoom] = useState(1);

  function reset() {
    setFile(null); setResult(null); setError(null);
    setCurrentPage(0); setHoveredBox(null); setLoading(false);
  }

  async function handleExtract() {
    if (!file) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("http://localhost:5000/extract-with-boxes", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      setResult(data);
      setCurrentPage(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleType(type) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }

  if (!file) return <UploadScreen onFile={setFile} />;
  if (!result && !loading) return <ConfirmScreen file={file} onExtract={handleExtract} onReset={reset} loading={loading} error={error} />;
  if (loading) return <LoadingScreen />;

  const pages = result.pages || [];
  const totalPages = pages.length;
  const page = pages[currentPage];
  const allBoxes = result.bounding_boxes || [];

  const rawType = (el) => el.type || "default";

  // Boxes for current page (API uses 1-indexed pages)
  const pageBoxes = allBoxes.filter((el) => (el.page ?? 1) === currentPage + 1);

  // Known type order; unknown API types sort alphabetically at the end before "default"
  const TYPE_ORDER = Object.keys(TYPE_COLORS);
  const allTypes = [...new Set(allBoxes.map(rawType))].sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a);
    const bi = TYPE_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  // Count per type across all boxes
  const typeCounts = allBoxes.reduce((acc, el) => {
    const t = rawType(el);
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});


  return (
    <div style={S.viewerRoot}>
      {/* ── Floating left panel ── */}
      <aside style={S.panel}>
        {/* Header */}
        <div style={S.panelHeader}>
          <div style={S.logoRow}>
            <div style={{ ...S.logoIcon, width: 28, height: 28 }}>
              <FileIcon size={14} color="#2563eb" />
            </div>
            <span style={{ ...S.appName, fontSize: 14 }}>DocExtract</span>
          </div>
          <button style={S.newFileBtn} onClick={reset}>
            <UploadIcon size={12} color="currentColor" />
            New File
          </button>
        </div>
        <div style={S.panelFileName} title={file?.name}>{file?.name}</div>

        <Divider />

        {/* Navigation */}
        {totalPages > 0 && (
          <Section label="Navigation">
            <div style={S.pageNavRow}>
              <button
                style={{ ...S.iconBtn, opacity: currentPage <= 0 ? 0.35 : 1 }}
                disabled={currentPage <= 0}
                onClick={() => { setCurrentPage((p) => p - 1); setHoveredBox(null); }}
              >
                <ChevronLeft />
              </button>
              <span style={S.pageLabel}><strong>{currentPage + 1}</strong> / {totalPages}</span>
              <button
                style={{ ...S.iconBtn, opacity: currentPage >= totalPages - 1 ? 0.35 : 1 }}
                disabled={currentPage >= totalPages - 1}
                onClick={() => { setCurrentPage((p) => p + 1); setHoveredBox(null); }}
              >
                <ChevronRight />
              </button>
            </div>
            <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={S.scaleSelect}>
              <option value={0.75}>75%</option>
              <option value={1}>100%</option>
              <option value={1.25}>125%</option>
              <option value={1.5}>150%</option>
              <option value={2}>200%</option>
            </select>
          </Section>
        )}

        <Divider />

        {/* Display toggles */}
        <Section label="Display">
          <ToggleRow label="Show Confidence" on={showConfidence} onToggle={() => setShowConfidence((v) => !v)} color="#2563eb" />
        </Section>

        <Divider />

        {/* Element filters */}
        {allTypes.length > 0 && (
          <Section label="Elements" badge={`${allBoxes.length} total`}>
            {allTypes.map((type) => {
              const color = TYPE_COLORS[type] || TYPE_COLORS.default;
              const toTitleCase = (s) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              const label = TYPE_COLORS[type] ? color.label : toTitleCase(type);
              const on = activeTypes.has(type);
              const count = typeCounts[type] || 0;
              return (
                <label key={type} style={S.typeRow} onClick={() => toggleType(type)}>
                  <div style={{
                    ...S.typeDot,
                    background: on ? color.fill : "transparent",
                    border: `2px solid ${on ? color.stroke : "#d1d5db"}`,
                  }} />
                  <span style={{ ...S.typeLabel, opacity: on ? 1 : 0.4 }}>{label}</span>
                  <span style={{ ...S.typeCount, opacity: on ? 1 : 0.4 }}>{count}</span>
                  <Toggle on={on} color={color.stroke} size="sm" onToggle={() => toggleType(type)} />
                </label>
              );
            })}
          </Section>
        )}

        {/* Hovered element detail */}
        {hoveredBox !== null && (() => {
          const el = allBoxes[hoveredBox];
          if (!el) return null;
          const color = TYPE_COLORS[el.type] || TYPE_COLORS.default;
          const toTitleCase = (s) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          const typeLabel = TYPE_COLORS[el.type] ? color.label : toTitleCase(el.type || "default");
          return (
            <>
              <Divider />
              <Section label="Selected Element">
                <div style={S.hoveredCard}>
                  <div style={{ ...S.hoveredType, color: color.stroke }}>
                    {typeLabel}
                    {el.bounding_box?.confidence !== undefined && (
                      <span style={S.confBadge}>{Math.round(el.bounding_box.confidence * 100)}%</span>
                    )}
                  </div>
                  <div style={S.hoveredContent}>{el.content}</div>
                </div>
              </Section>
            </>
          );
        })()}
      </aside>

      {/* ── Main viewer ── */}
      <main style={S.viewerMain}>
        {page ? (
          <PageView
            page={page}
            boxes={pageBoxes}
            activeTypes={activeTypes}
            showConfidence={showConfidence}
            hoveredBox={hoveredBox}
            onHover={setHoveredBox}
            zoom={zoom}
            allBoxes={allBoxes}
          />
        ) : (
          <div style={S.centerMsg}>
            <p style={{ color: "#94a3b8" }}>No page data available.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Page renderer with CSS-overlay boxes ─────────────────────────────────────
function PageView({ page, boxes, activeTypes, showConfidence, hoveredBox, onHover, zoom, allBoxes }) {
  const displayW = Math.round(page.width * zoom);
  const displayH = Math.round(page.height * zoom);

  return (
    <div style={S.pageOuter}>
      <div
        style={{
          ...S.pageWrapper,
          width: displayW,
          height: displayH,
        }}
        onMouseLeave={() => onHover(null)}
      >
        {/* The actual page image */}
        <img
          src={`data:image/png;base64,${page.image}`}
          width={displayW}
          height={displayH}
          style={S.pageImg}
          draggable={false}
        />

        {/* Overlay: one div per box, positioned with % coords */}
        {boxes.map((el, idx) => {
          const type = el.type || "default";
          if (!activeTypes.has(type)) return null;
          const color = TYPE_COLORS[type] || TYPE_COLORS.default;
          const bb = el.bounding_box;
          const isHovered = hoveredBox === allBoxes.indexOf(el);
          const conf = bb.confidence !== undefined ? Math.round(bb.confidence * 100) : null;

          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: `${bb.x * 100}%`,
                top: `${bb.y * 100}%`,
                width: `${bb.width * 100}%`,
                height: `${bb.height * 100}%`,
                background: isHovered ? color.fill : "transparent",
                border: `${isHovered ? 2 : 1.5}px solid ${color.stroke}`,
                borderRadius: 2,
                boxSizing: "border-box",
                cursor: "pointer",
                transition: "background 0.12s",
                pointerEvents: "all",
              }}
              onMouseEnter={() => onHover(allBoxes.indexOf(el))}
            >
              {/* Confidence badge top-right */}
              {showConfidence && conf !== null && (
                <span style={{
                  position: "absolute",
                  top: -1,
                  right: -1,
                  background: color.stroke,
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  lineHeight: 1,
                  padding: "2px 4px",
                  borderRadius: "0 3px 0 3px",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.2px",
                }}>
                  {conf}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Small reusable UI bits ───────────────────────────────────────────────────
function Section({ label, badge, children }) {
  return (
    <div style={S.section}>
      <div style={S.sectionLabel}>
        {label}
        {badge && <span style={S.badge}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function Divider() { return <div style={S.divider} />; }

function ToggleRow({ label, on, onToggle, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={S.typeLabel}>{label}</span>
      <Toggle on={on} color={color} onToggle={onToggle} />
    </div>
  );
}

function Toggle({ on, color, onToggle, size = "md" }) {
  const w = size === "sm" ? 28 : 36;
  const h = size === "sm" ? 16 : 20;
  const thumbSize = size === "sm" ? 12 : 16;
  const travel = w - thumbSize - 4;
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      style={{ width: w, height: h, borderRadius: h, background: on ? color : "#cbd5e1", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
    >
      <div style={{ position: "absolute", top: 2, left: 2, width: thumbSize, height: thumbSize, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 0.2s", transform: on ? `translateX(${travel}px)` : "translateX(0)" }} />
    </div>
  );
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────
function FileIcon({ size = 20, color = "#2563eb" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}
function UploadIcon({ size = 20, color = "#94a3b8" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function ChevronLeft() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>;
}
function ChevronRight() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  uploadScreen: {
    minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg,#f0f4ff 0%,#f8fafc 60%,#f0fdf4 100%)", padding: 24,
  },
  uploadCard: {
    background: "#fff", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 520,
    boxShadow: "0 8px 40px rgba(0,0,0,0.10)", display: "flex", flexDirection: "column", gap: 20,
  },
  logoRow: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { width: 38, height: 38, background: "#eff6ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" },
  appName: { fontSize: 17, fontWeight: 700, color: "#1e293b", letterSpacing: "-0.3px" },
  uploadTitle: { margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1.25, letterSpacing: "-0.5px" },
  uploadSub: { margin: 0, fontSize: 14, color: "#64748b", lineHeight: 1.6 },
  dropzone: {
    border: "2px dashed #cbd5e1", borderRadius: 14, padding: "36px 24px", textAlign: "center", cursor: "pointer",
    transition: "all 0.2s", background: "#fafcff", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
  },
  dropzoneDrag: { border: "2px dashed #2563eb", background: "#eff6ff" },
  dropText: { margin: "8px 0 0", fontWeight: 600, fontSize: 15, color: "#334155" },
  dropHint: { margin: "2px 0 0", fontSize: 13, color: "#94a3b8" },
  dropLink: { color: "#2563eb", textDecoration: "underline", cursor: "pointer" },
  dropFormats: { margin: "6px 0 0", fontSize: 11, color: "#b0bec5", letterSpacing: "0.5px", textTransform: "uppercase" },
  fileRow: { display: "flex", alignItems: "center", gap: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" },
  fileIconBox: { flexShrink: 0, width: 36, height: 36, background: "#eff6ff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" },
  fileNameText: { fontWeight: 600, fontSize: 13, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  fileSizeText: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  removeBtn: { background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, display: "flex", alignItems: "center", borderRadius: 6, flexShrink: 0 },
  extractBtn: { padding: "13px 0", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" },
  secondaryBtn: { padding: "10px 0", background: "none", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" },
  errorBox: { padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, color: "#b91c1c", fontSize: 13 },
  spinnerLg: { width: 44, height: 44, border: "4px solid #e2e8f0", borderTop: "4px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  // Viewer
  viewerRoot: { display: "flex", height: "100vh", background: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" },
  panel: {
    width: 256, minWidth: 240, height: "100vh", background: "#fff", borderRight: "1px solid #e2e8f0",
    display: "flex", flexDirection: "column", overflowY: "auto", boxShadow: "2px 0 12px rgba(0,0,0,0.05)", zIndex: 10, flexShrink: 0,
  },
  panelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 14px 10px", borderBottom: "1px solid #f1f5f9" },
  panelFileName: { padding: "6px 14px 0", fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  newFileBtn: { display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#f1f5f9", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer", whiteSpace: "nowrap" },
  divider: { height: 1, background: "#f1f5f9", margin: "2px 0" },
  section: { padding: "10px 14px", display: "flex", flexDirection: "column", gap: 7 },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  badge: { background: "#f1f5f9", color: "#475569", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "none", letterSpacing: 0 },
  pageNavRow: { display: "flex", alignItems: "center", gap: 8 },
  iconBtn: { width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", color: "#475569" },
  pageLabel: { flex: 1, textAlign: "center", fontSize: 13, color: "#475569" },
  scaleSelect: { width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#334155", background: "#f8fafc", outline: "none" },
  typeRow: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "3px 0" },
  typeDot: { width: 13, height: 13, borderRadius: 3, flexShrink: 0, transition: "all 0.15s" },
  typeLabel: { flex: 1, fontSize: 12, color: "#334155", fontWeight: 500 },
  typeCount: { fontSize: 11, color: "#94a3b8", fontWeight: 600, minWidth: 18, textAlign: "right", marginRight: 4 },
  hoveredCard: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" },
  hoveredType: { fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  confBadge: { fontSize: 11, background: "#f1f5f9", color: "#475569", borderRadius: 20, padding: "2px 7px", fontWeight: 600 },
  hoveredContent: { fontSize: 11, color: "#64748b", lineHeight: 1.6, wordBreak: "break-word", maxHeight: 120, overflowY: "auto" },

  // Page viewer
  viewerMain: { flex: 1, overflowY: "auto", overflowX: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px" },
  pageOuter: { display: "flex", flexDirection: "column", alignItems: "center" },
  pageWrapper: { position: "relative", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", borderRadius: 4, overflow: "hidden", background: "#fff", flexShrink: 0 },
  pageImg: { display: "block", userSelect: "none" },
  centerMsg: { margin: "auto", textAlign: "center", padding: 40 },
};
