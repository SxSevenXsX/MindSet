(function () {
  const STORAGE_KEY = "mindset.state.v1";
  const app = document.getElementById("app");

  const runtime = {
    unlockedBoxIds: new Set(),
    modal: null,
    toast: "",
    dragId: null,
    paletteQuery: "",
    sideTab: "explorer",
    explorerToolsOpen: true,
    contextMenu: null,
    marquee: null,
    ignoreSurfaceClick: false,
    selectionAnchorId: null,
    focusedItemId: null,
    dragIds: [],
    editorRange: null,
    boxMenuOpen: false,
    loadedFontIds: new Set(),
    pagePaginationTimer: 0,
    activePageIndex: 0,
    independentPageSnapshot: null,
    pageFullNoticeTimer: 0,
    idleRenderTimer: 0,
    suppressIdleRenderUntil: 0,
    lastEditorPointerAt: 0,
    undoStack: [],
    redoStack: [],
    noteHistories: new Map(),
    restoringEditorHistory: false,
    itemClipboard: null,
    updateStatus: { status: "idle", message: "" },
    fontFolderOpenedAt: 0,
    fontFolderScanTimer: 0,
    applyingNavigationHistory: false,
    navigationReady: false,
    autofocusKey: "",
    pointerIsDown: false,
    dragBoxId: null,
    boxCrypto: new Map(),
    encryptTimer: 0,
    encryptRunning: false,
    lastListAutoFormat: null,
  };

  const icons = {
    box: '<path d="M3 7.5 12 3l9 4.5-9 4.5L3 7.5Z"/><path d="M3 7.5v9L12 21l9-4.5v-9"/><path d="M12 12v9"/>',
    folder: '<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-10Z"/>',
    note: '<path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5"/><path d="M8 13h8"/><path d="M8 17h6"/>',
    notePlus: '<path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5"/><path d="M12 12v6"/><path d="M9 15h6"/>',
    folderPlus: '<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-10Z"/><path d="M12 10v6"/><path d="M9 13h6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',
    map: '<circle cx="6" cy="7" r="2.5"/><circle cx="18" cy="7" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.5 8.3 11 16"/><path d="M15.5 8.3 13 16"/><path d="M8.4 7h7.2"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    bookmark: '<path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z"/>',
    bookmarkFilled: '<path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z" fill="currentColor"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    panel: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M9 5v14"/>',
    sidebar: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M15 4v16"/>',
    sort: '<path d="M7 4v16"/><path d="m4 7 3-3 3 3"/><path d="M17 20V4"/><path d="m14 17 3 3 3-3"/>',
    grip: '<circle cx="8" cy="6" r="1"/><circle cx="16" cy="6" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="8" cy="18" r="1"/><circle cx="16" cy="18" r="1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"/>',
    settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z"/>',
    collapse: '<path d="m8 9 4-4 4 4"/><path d="m16 15-4 4-4-4"/>',
    collapseIn: '<path d="m8 5 4 4 4-4"/><path d="m16 19-4-4-4 4"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    filePdf: '<path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5"/><path d="M8 13h2.5a1.5 1.5 0 0 1 0 3H8v-3Z"/><path d="M13 13h1.5a2 2 0 0 1 0 4H13v-4Z"/><path d="M17 13h3"/><path d="M17 15h2"/>',
    fileWord: '<path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5"/><path d="M7.8 13h1.2l.8 4 1.2-3 1.2 3 .8-4h1.2"/>',
    fileText: '<path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5"/><path d="M8 13h8"/><path d="M8 16h8"/><path d="M8 19h5"/>',
    printer: '<path d="M6 9V4h12v5"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/><path d="M18 12h.01"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.4-2.1"/>',
    bolt: '<path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    tree: '<path d="M12 3v5"/><path d="M6 13V8h12v5"/><rect x="4" y="13" width="4" height="4" rx="1"/><rect x="10" y="13" width="4" height="4" rx="1"/><rect x="16" y="13" width="4" height="4" rx="1"/>',
    move: '<path d="M5 9V5h4"/><path d="M19 15v4h-4"/><path d="M5 5l14 14"/><path d="M19 9V5h-4"/><path d="M5 15v4h4"/><path d="M19 5 5 19"/>',
    palette: '<path d="M12 22a10 10 0 1 1 10-10c0 2-1.4 3-3 3h-1.7c-.9 0-1.3.7-.9 1.5.7 1.5-.4 3.5-2.2 4.5-.6.3-1.4 1-2.2 1Z"/><circle cx="7.5" cy="10" r=".8"/><circle cx="10" cy="6.8" r=".8"/><circle cx="14.3" cy="6.8" r=".8"/><circle cx="16.7" cy="10" r=".8"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>',
    external: '<path d="M14 3h7v7"/><path d="M21 3 10 14"/><path d="M11 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/>',
    eraser: '<path d="m7 21-4-4a2 2 0 0 1 0-2.8L12.2 5a2 2 0 0 1 2.8 0l4 4a2 2 0 0 1 0 2.8L9.8 21H7Z"/><path d="m5 12 7 7"/><path d="M16 21h5"/>',
    alignLeft: '<path d="M4 6h16"/><path d="M4 10h10"/><path d="M4 14h16"/><path d="M4 18h10"/>',
    alignCenter: '<path d="M4 6h16"/><path d="M7 10h10"/><path d="M4 14h16"/><path d="M7 18h10"/>',
    alignRight: '<path d="M4 6h16"/><path d="M10 10h10"/><path d="M4 14h16"/><path d="M10 18h10"/>',
    alignJustify: '<path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h16"/><path d="M4 18h16"/>',
    arrowUp: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="m12 5-7 7 7 7"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    zoomIn: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/><path d="M11 8v6"/><path d="M8 11h6"/>',
    zoomOut: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/><path d="M8 11h6"/>',
    bookOpen: '<path d="M12 7v14"/><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5A2.5 2.5 0 0 0 20 18.5v-13Z"/>',
    splitColumns: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M12 5v14"/><path d="M8 9h1"/><path d="M8 13h1"/><path d="M15 9h1"/><path d="M15 13h1"/>',
    ruler: '<path d="M4 18 18 4l2 2L6 20H4v-2Z"/><path d="m14 8 2 2"/><path d="m11 11 2 2"/><path d="m8 14 2 2"/>',
    linkedPages: '<path d="M7 7h4v10H7a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3Z"/><path d="M13 7h4a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-4V7Z"/><path d="M10 12h4"/>',
    lineSpacing: '<path d="M4 6h9"/><path d="M4 12h9"/><path d="M4 18h9"/><path d="M19 5v14"/><path d="m16.5 7.5 2.5-2.5 2.5 2.5"/><path d="m16.5 16.5 2.5 2.5 2.5-2.5"/>',
    splitPages: '<path d="M7 7h4v10H7a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3Z"/><path d="M13 7h4a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-4V7Z"/><path d="M12 5v14"/>',
  };

  const graphDirections = [
    { id: "up", label: "Branches vers le haut", icon: "arrowUp" },
    { id: "right", label: "Branches vers la droite", icon: "arrowRight" },
    { id: "down", label: "Branches vers le bas", icon: "arrowDown" },
    { id: "left", label: "Branches vers la gauche", icon: "arrowLeft" },
  ];

  const headingDefaults = {
    normal: { size: "17px", color: "#17201c", weight: "400", fontFamily: "Georgia, Times New Roman, serif" },
    h1: { size: "30px", color: "#17201c", weight: "820", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" },
    h2: { size: "24px", color: "#17201c", weight: "780", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" },
    h3: { size: "19px", color: "#17201c", weight: "740", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" },
  };

  const fontOptions = [
    { label: "Serif", value: "Georgia, Times New Roman, serif" },
    { label: "Inter", value: "Inter, ui-sans-serif, system-ui, sans-serif" },
    { label: "Arial", value: "Arial, Helvetica, sans-serif" },
    { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
    { label: "Courier", value: "Courier New, Courier, monospace" },
  ];

  const supportedFontExtensions = [".ttf", ".otf", ".woff", ".woff2"];
  const localFontLimit = 12;
  const cmToPx = 96 / 2.54;
  const minPageMarginCm = 0.1;
  const minPageContentCm = 4;

  const pageSizePresets = [
    { id: "a4", label: "A4", widthCm: 21, heightCm: 29.7 },
    { id: "a5", label: "A5", widthCm: 14.8, heightCm: 21 },
    { id: "a3", label: "A3", widthCm: 29.7, heightCm: 42 },
    { id: "letter", label: "Letter US", widthCm: 21.59, heightCm: 27.94 },
    { id: "legal", label: "Legal US", widthCm: 21.59, heightCm: 35.56 },
    { id: "executive", label: "Executive", widthCm: 18.41, heightCm: 26.67 },
  ];

  const pageMarginPresets = {
    compact: { label: "Marges compactes", margins: { top: 1.2, right: 1.2, bottom: 1.2, left: 1.2 } },
    normal: { label: "Marges normales", margins: { top: 2, right: 2, bottom: 2, left: 2 } },
    wide: { label: "Marges larges", margins: { top: 2.7, right: 2.7, bottom: 2.7, left: 2.7 } },
  };

  const pageCustomMarginDefaults = {
    custom1: { label: "Personnalise 1", margins: { top: 1.8, right: 1.8, bottom: 1.8, left: 1.8 } },
    custom2: { label: "Personnalise 2", margins: { top: 2.4, right: 2.4, bottom: 2.4, left: 2.4 } },
  };

  const pageCustomMarginIds = ["custom1", "custom2"];
  const pageMarginOrder = ["compact", "normal", "wide", ...pageCustomMarginIds];

  const baseColorPresets = [
    { label: "Rouge", value: "#d94b4b" },
    { label: "Orange", value: "#f08a24" },
    { label: "Rose", value: "#d9578a" },
    { label: "Bleu clair", value: "#55a7e5" },
    { label: "Vert", value: "#4ca66a" },
  ];

  const textColorPresets = [
    { label: "Blanc", value: "#ffffff" },
    { label: "Noir", value: "#000000" },
    ...baseColorPresets,
  ];

  const emojiChoices = ["⭐", "📌", "💡", "✅", "🔥", "🧠", "📘", "🗂️"];

  const state = loadState();

  function normalizeEditorViewMode(value) {
    return ["pages", "split"].includes(value) ? value : "flow";
  }

  function normalizePageFlowMode(value) {
    return value === "independent" ? "independent" : "continuous";
  }

  function isContinuousPageFlow() {
    return normalizePageFlowMode(state.settings?.pageFlowMode) === "continuous";
  }

  function isIndependentPageFlow() {
    return normalizePageFlowMode(state.settings?.pageFlowMode) === "independent";
  }

  function isIndependentPageMode() {
    return normalizeEditorViewMode(state.settings?.editorViewMode) === "pages" && isIndependentPageFlow();
  }

  function clampPageZoom(value) {
    const number = Number(value);
    return Math.min(Math.max(Number.isFinite(number) ? number : 1, 0.55), 1.25);
  }

  function normalizePageMarginPreset(value) {
    return pageMarginOrder.includes(value) ? value : "custom";
  }

  function nextPageMarginPreset(value) {
    const current = normalizePageMarginPreset(value);
    const index = pageMarginOrder.indexOf(current);
    return pageMarginOrder[((index < 0 ? -1 : index) + 1) % pageMarginOrder.length];
  }

  function roundCm(value) {
    return Math.round((Number(value) || 0) * 10) / 10;
  }

  function cm(value) {
    return `${roundCm(value).toFixed(1)} cm`;
  }

  function cleanMarginSet(margins = {}, fallback = pageMarginPresets.normal.margins) {
    return {
      top: Math.max(roundCm(margins.top ?? fallback.top), minPageMarginCm),
      right: Math.max(roundCm(margins.right ?? fallback.right), minPageMarginCm),
      bottom: Math.max(roundCm(margins.bottom ?? fallback.bottom), minPageMarginCm),
      left: Math.max(roundCm(margins.left ?? fallback.left), minPageMarginCm),
    };
  }

  function normalizePageCustomMarginPresets(value = {}) {
    return pageCustomMarginIds.reduce((acc, id) => {
      const preset = value?.[id] || {};
      const fallback = pageCustomMarginDefaults[id];
      acc[id] = {
        label: fallback.label,
        margins: cleanMarginSet(preset.margins, fallback.margins),
      };
      return acc;
    }, {});
  }

  function pageMarginPreset(id, settings = null) {
    if (pageMarginPresets[id]) return pageMarginPresets[id];
    if (!pageCustomMarginIds.includes(id)) return null;
    return normalizePageCustomMarginPresets(settings?.customPageMarginPresets)[id];
  }

  function pageMarginPresetMargins(id, settings = null) {
    return pageMarginPreset(id, settings)?.margins || null;
  }

  function pageMarginPresetLabel(id, settings = null) {
    return pageMarginPreset(id, settings)?.label || "Marges personnalisees";
  }

  function pageSizePreset(id) {
    return pageSizePresets.find((size) => size.id === id) || pageSizePresets[0];
  }

  function pageSizeDimensions(setup) {
    const preset = pageSizePreset(setup?.sizeId);
    const landscape = setup?.orientation === "landscape";
    return {
      widthCm: landscape ? preset.heightCm : preset.widthCm,
      heightCm: landscape ? preset.widthCm : preset.heightCm,
    };
  }

  function normalizeMarginPair(first, second, dimensionCm) {
    const maxCombined = Math.max(minPageMarginCm * 2, dimensionCm - minPageContentCm);
    let a = Math.min(Math.max(roundCm(first), minPageMarginCm), maxCombined - minPageMarginCm);
    let b = Math.min(Math.max(roundCm(second), minPageMarginCm), maxCombined - minPageMarginCm);
    if (a + b > maxCombined) {
      const overflow = a + b - maxCombined;
      if (a >= b) {
        a = Math.max(minPageMarginCm, roundCm(a - overflow));
      } else {
        b = Math.max(minPageMarginCm, roundCm(b - overflow));
      }
    }
    if (a + b > maxCombined) {
      a = roundCm(maxCombined / 2);
      b = roundCm(maxCombined - a);
    }
    return [a, b];
  }

  function normalizePageSetup(value = {}, fallbackPreset = "normal", settings = null) {
    value = value || {};
    const fallbackMargins = pageMarginPresetMargins(fallbackPreset, settings) || pageMarginPresets.normal.margins;
    const presetId = pageSizePreset(value.sizeId)?.id || "a4";
    const setup = {
      sizeId: presetId,
      orientation: value.orientation === "landscape" ? "landscape" : "portrait",
      margins: {
        ...pageMarginPresets.normal.margins,
        ...fallbackMargins,
        ...(value.margins || {}),
      },
    };
    const dimensions = pageSizeDimensions(setup);
    const [left, right] = normalizeMarginPair(setup.margins.left, setup.margins.right, dimensions.widthCm);
    const [top, bottom] = normalizeMarginPair(setup.margins.top, setup.margins.bottom, dimensions.heightCm);
    setup.margins = { top, right, bottom, left };
    return setup;
  }

  function marginPresetForSetup(setup, settings = null) {
    const normalized = normalizePageSetup(setup, "normal", settings);
    const match = pageMarginOrder.find((id) => {
      const preset = pageMarginPresetMargins(id, settings);
      if (!preset) return false;
      return ["top", "right", "bottom", "left"].every((side) => Math.abs(preset[side] - normalized.margins[side]) < 0.05);
    });
    return match || "custom";
  }

  function pageSetupStyle(settings = state.settings) {
    const setup = normalizePageSetup(settings?.pageSetup, settings?.pageMarginPreset, settings);
    const dimensions = pageSizeDimensions(setup);
    return [
      `--page-width:${dimensions.widthCm * cmToPx}px`,
      `--page-height:${dimensions.heightCm * cmToPx}px`,
      `--page-margin-top:${setup.margins.top * cmToPx}px`,
      `--page-margin-right:${setup.margins.right * cmToPx}px`,
      `--page-margin-bottom:${setup.margins.bottom * cmToPx}px`,
      `--page-margin-left:${setup.margins.left * cmToPx}px`,
    ].join(";");
  }

  function pageMarginLimits(setup) {
    const normalized = normalizePageSetup(setup);
    const dimensions = pageSizeDimensions(normalized);
    return {
      left: Math.max(minPageMarginCm, roundCm(dimensions.widthCm - normalized.margins.right - minPageContentCm)),
      right: Math.max(minPageMarginCm, roundCm(dimensions.widthCm - normalized.margins.left - minPageContentCm)),
      top: Math.max(minPageMarginCm, roundCm(dimensions.heightCm - normalized.margins.bottom - minPageContentCm)),
      bottom: Math.max(minPageMarginCm, roundCm(dimensions.heightCm - normalized.margins.top - minPageContentCm)),
    };
  }

  function pageSizeSummary(setup) {
    const dimensions = pageSizeDimensions(setup);
    return `${cm(dimensions.widthCm)} x ${cm(dimensions.heightCm)}`;
  }

  function pageMarginLabel(settings = state.settings) {
    const preset = normalizePageMarginPreset(settings?.pageMarginPreset);
    if (pageMarginPreset(preset, settings)) return pageMarginPresetLabel(preset, settings);
    const margins = normalizePageSetup(settings?.pageSetup, settings?.pageMarginPreset, settings).margins;
    return `Marges ${cm(margins.top)} / ${cm(margins.right)} / ${cm(margins.bottom)} / ${cm(margins.left)}`;
  }

  function updatePageSetup(nextSetup, preset = "custom", options = {}) {
    state.settings.customPageMarginPresets = normalizePageCustomMarginPresets(state.settings.customPageMarginPresets);
    state.settings.pageSetup = normalizePageSetup(nextSetup, preset, state.settings);
    if (pageCustomMarginIds.includes(preset) && options.rememberCustom !== false) {
      state.settings.customPageMarginPresets[preset].margins = { ...state.settings.pageSetup.margins };
    }
    state.settings.pageMarginPreset = preset === "custom" ? marginPresetForSetup(state.settings.pageSetup, state.settings) : preset;
    saveState();
  }

  function applyPageSetupToCurrentView() {
    const page = app.querySelector(".editor-page.is-page-mode");
    if (!page) return;
    const setupStyle = pageSetupStyle();
    setupStyle.split(";").forEach((entry) => {
      const [name, value] = entry.split(":");
      if (name && value) page.style.setProperty(name, value);
    });
    const editor = page.querySelector("[data-note-editor]");
    syncPagedEditorMetrics(editor);
  }

  function normalizeLocalFontName(name) {
    return String(name || "Police locale").replace(/\.[^.]+$/, "").trim().slice(0, 60) || "Police locale";
  }

  function normalizeFontFamily(value, fallbackId) {
    const raw = String(value || fallbackId || uid("font")).replace(/^["']|["']$/g, "");
    const safe = raw.replace(/[^a-zA-Z0-9_-]/g, "_") || String(fallbackId || uid("font"));
    return safe.startsWith("MindSetLocal_") ? safe : `MindSetLocal_${safe}`;
  }

  function normalizeLocalFonts(fonts) {
    if (!Array.isArray(fonts)) return [];
    const seen = new Set();
    return fonts.map((font) => {
      const id = String(font?.id || uid("font"));
      const dataUrl = String(font?.dataUrl || "");
      if (!dataUrl.startsWith("data:")) return null;
      const normalized = {
        id,
        name: normalizeLocalFontName(font?.name),
        family: normalizeFontFamily(font?.family, id),
        format: String(font?.format || "").toLowerCase(),
        dataUrl,
        source: String(font?.source || "").slice(0, 40),
        path: String(font?.path || "").slice(0, 260),
      };
      const key = `${normalized.family}:${normalized.dataUrl.slice(0, 120)}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return normalized;
    }).filter(Boolean).slice(0, localFontLimit);
  }

  function availableFontOptions() {
    return [
      ...fontOptions,
      ...(state.settings?.localFonts || []).map((font) => ({
        label: font.name,
        value: font.family,
      })),
    ];
  }

  function icon(name, extraClass = "") {
    return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || ""}</svg>`;
  }

  function itemIconMarkup(node) {
    if (!node || node.iconKind === "none" || !node.iconKind) return "";
    if (node.iconKind === "emoji") {
      return `<span class="item-icon emoji" aria-hidden="true">${escapeHtml(node.emoji || emojiChoices[0])}</span>`;
    }
    return `<span class="item-icon ${node.type}">${icon(node.type === "folder" ? "folder" : "note")}</span>`;
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function now() {
    return new Date().toISOString();
  }

  function formatShortDate(value) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(value));
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[char]);
  }

  function stripHtml(html) {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    div.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
    div.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, div, tr").forEach((block) => block.append(" "));
    return div.textContent || "";
  }

  function normalizeStatsPrefs(value = {}) {
    return {
      charsCountSpaces: value?.charsCountSpaces !== false,
      charsCountPunctuation: value?.charsCountPunctuation !== false,
      wordsCountNumbers: value?.wordsCountNumbers !== false,
      wordsCountPunctuation: value?.wordsCountPunctuation === true,
    };
  }

  const statsPunctuationPattern = /[.,;:!?…'’"«»„“”()\[\]{}\-–—_\/\\|@#*+=~^<>%&§]/g;

  function noteStats(note) {
    const text = stripHtml(note?.content || "").replace(/\s+/g, " ").trim();
    const prefs = normalizeStatsPrefs(state.settings?.statsPrefs);

    let charSource = text;
    if (!prefs.charsCountPunctuation) charSource = charSource.replace(statsPunctuationPattern, "");
    if (!prefs.charsCountSpaces) charSource = charSource.replace(/ /g, "");

    const words = (text ? text.split(" ") : []).filter((token) => {
      if (!/[\p{L}\p{N}]/u.test(token)) return prefs.wordsCountPunctuation;
      if (!prefs.wordsCountNumbers && !/\p{L}/u.test(token)) return false;
      return true;
    }).length;

    return {
      words,
      chars: charSource.length,
      pages: 1,
    };
  }

  function visibleEditorPageCount() {
    const page = app.querySelector(".editor-page.is-page-mode");
    if (!page) return 1;
    return Math.max(page.querySelectorAll(".page-sheet").length, 1);
  }

  function updateEditorStats(note) {
    const stats = noteStats(note);
    const pageCount = visibleEditorPageCount();
    app.querySelectorAll("[data-word-count]").forEach((element) => {
      element.textContent = `${stats.words} mots`;
    });
    app.querySelectorAll("[data-char-count]").forEach((element) => {
      element.textContent = `${stats.chars} caracteres`;
    });
    app.querySelectorAll("[data-page-count]").forEach((element) => {
      element.textContent = `${pageCount} page${pageCount > 1 ? "s" : ""}`;
    });
  }

  function defaultPrintOptions() {
    return {
      showTitle: false,
      showDate: false,
      showTime: false,
      showPageNumbers: true,
    };
  }

  function normalizePrintOptions(options = {}) {
    const defaults = defaultPrintOptions();
    return {
      showTitle: options.showTitle === true,
      showDate: options.showDate === true,
      showTime: options.showTime === true,
      showPageNumbers: options.showPageNumbers !== false && defaults.showPageNumbers,
    };
  }

  function printOptionsFromForm(form) {
    return normalizePrintOptions({
      showTitle: form.has("showTitle"),
      showDate: form.has("showDate"),
      showTime: form.has("showTime"),
      showPageNumbers: form.has("showPageNumbers"),
    });
  }

  function formatPrintDate(value = new Date()) {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(value);
  }

  function formatPrintTime(value = new Date()) {
    return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(value);
  }

  function safePrintCssValue(value, fallback) {
    const cleaned = String(value || fallback || "").replace(/[<>{};]/g, "").trim();
    return cleaned || fallback || "";
  }

  function printableFontFaces() {
    const formatMap = {
      ".ttf": "truetype",
      ".otf": "opentype",
      ".woff": "woff",
      ".woff2": "woff2",
    };
    return (state.settings?.localFonts || [])
      .filter((font) => font?.family && font?.dataUrl?.startsWith?.("data:"))
      .map((font) => {
        const family = safePrintCssValue(font.family, "");
        const format = formatMap[String(font.format || "").toLowerCase()] || "";
        return `@font-face{font-family:"${family}";src:url("${font.dataUrl}")${format ? ` format("${format}")` : ""};font-display:swap;}`;
      })
      .join("\n");
  }

  function printableHeadingCssVariables() {
    const headings = state.settings?.headingPresets || headingDefaults;
    return ["normal", "h1", "h2", "h3"].map((key) => {
      const preset = { ...headingDefaults[key], ...(headings[key] || {}) };
      const color = cleanColor(preset.color, headingDefaults[key].color);
      return [
        `--${key}-size:${safePrintCssValue(preset.size, headingDefaults[key].size)}`,
        `--${key}-color:${color}`,
        `--${key}-weight:${safePrintCssValue(preset.weight, headingDefaults[key].weight)}`,
        `--${key}-font:${safePrintCssValue(preset.fontFamily, headingDefaults[key].fontFamily)}`,
      ].join(";");
    }).join(";");
  }

  function sanitizePrintableHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html || "<p><br></p>";
    template.content.querySelectorAll("script, style, iframe, object, embed, link, meta, base, [data-editor-selection-marker], [data-pagination-probe]").forEach((node) => node.remove());
    template.content.querySelectorAll("*").forEach((element) => {
      [...element.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = String(attribute.value || "").trim().toLowerCase();
        if (name.startsWith("on") || name === "contenteditable" || name === "spellcheck" || name === "tabindex") {
          element.removeAttribute(attribute.name);
          return;
        }
        if ((name === "src" || name === "href") && value.startsWith("javascript:")) {
          element.removeAttribute(attribute.name);
        }
      });
    });
    return template.innerHTML || "<p><br></p>";
  }

  function printableNoteHeader(note, options) {
    const rows = [];
    const printedAt = new Date();
    if (options.showDate) rows.push(`<span>${escapeHtml(formatPrintDate(printedAt))}</span>`);
    if (options.showTime) rows.push(`<span>${escapeHtml(formatPrintTime(printedAt))}</span>`);
    if (!options.showTitle && !rows.length) return "";
    return `
      <header class="print-note-header">
        ${options.showTitle ? `<h1>${escapeHtml(note?.title || "Note MindSet")}</h1>` : ""}
        ${rows.length ? `<div class="print-note-meta">${rows.join("")}</div>` : ""}
      </header>
    `;
  }

  function printableNoteBody(note, sourceHtml, options) {
    const source = document.createElement("div");
    source.innerHTML = sanitizePrintableHtml(sourceHtml);
    const sheets = [...source.querySelectorAll(".page-sheet")];
    const header = printableNoteHeader(note, options);
    if (sheets.length) {
      return sheets.map((sheet, index) => `<section class="print-sheet note-editor">${index === 0 ? header : ""}${sheet.innerHTML || "<p><br></p>"}</section>`).join("");
    }
    return `<section class="print-sheet note-editor">${header}${source.innerHTML || "<p><br></p>"}</section>`;
  }

  function printableNoteDocument(note, sourceHtml, options = defaultPrintOptions(), mode = "print") {
    options = normalizePrintOptions(options);
    const setup = normalizePageSetup(state.settings?.pageSetup, state.settings?.pageMarginPreset, state.settings);
    const dimensions = pageSizeDimensions(setup);
    const margins = setup.margins;
    const title = escapeHtml(note?.title || "Note MindSet");
    const documentTitle = options.showTitle ? `${title} - MindSet` : "";
    const todoColor = cleanColor(state.settings?.todoColor, state.settings?.selectionColor || "#0f6b58");
    const pageNumberMarginBox = options.showPageNumbers
      ? '@bottom-center{content:"Page " counter(page);font:700 10px Inter,ui-sans-serif,system-ui,sans-serif;color:#657169;}'
      : "";
    const actionLabel = mode === "pdf" || mode === "system-pdf" ? "Enregistrer PDF" : "Imprimer";
    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${documentTitle}</title>
  <style>
    ${printableFontFaces()}
    :root{${printableHeadingCssVariables()};--todo-color:${todoColor};--accent:${cleanColor(state.settings?.selectionColor, "#0f6b58")};}
    @page{size:${dimensions.widthCm}cm ${dimensions.heightCm}cm;margin:${margins.top}cm ${margins.right}cm ${margins.bottom}cm ${margins.left}cm;${pageNumberMarginBox}}
    *{box-sizing:border-box;}
    body{margin:0;background:#f0f1f0;color:#17201c;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
    .print-toolbar{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 16px;border-bottom:1px solid #d8ddda;background:rgba(247,247,247,.94);backdrop-filter:blur(12px);}
    .print-toolbar strong{font-size:13px;}
    .print-toolbar span{color:#657169;font-size:12px;}
    .print-button{height:30px;border:1px solid #cbd2ce;border-radius:6px;background:#fff;color:#17201c;padding:0 12px;font-weight:750;cursor:pointer;}
    .print-button:hover{background:#f1f3f2;}
    .print-preview{padding:28px 18px;}
    .print-sheet{width:${dimensions.widthCm}cm;min-height:${dimensions.heightCm}cm;margin:0 auto 22px;padding:${margins.top}cm ${margins.right}cm ${margins.bottom}cm ${margins.left}cm;background:#fff;border:1px solid #dfe3e1;border-radius:6px;box-shadow:0 18px 42px rgba(35,48,43,.12);overflow:hidden;}
    .print-note-header{display:grid;gap:6px;margin:0 0 18px;padding:0 0 12px;border-bottom:1px solid #dfe3e1;}
    .print-note-header h1{margin:0;color:#17201c;font:820 22px Inter,ui-sans-serif,system-ui,sans-serif;line-height:1.2;}
    .print-note-meta{display:flex;flex-wrap:wrap;gap:8px 14px;color:#657169;font-size:11px;font-weight:760;}
    .note-editor{font-family:var(--normal-font);font-size:var(--normal-size);font-weight:var(--normal-weight);color:var(--normal-color);line-height:1.65;}
    .note-editor h1,.note-editor h2,.note-editor h3{margin:1.2em 0 .45em;line-height:1.18;}
    .note-editor h1{font-family:var(--h1-font);font-size:var(--h1-size);font-weight:var(--h1-weight);color:var(--h1-color);}
    .note-editor h2{font-family:var(--h2-font);font-size:var(--h2-size);font-weight:var(--h2-weight);color:var(--h2-color);}
    .note-editor h3{font-family:var(--h3-font);font-size:var(--h3-size);font-weight:var(--h3-weight);color:var(--h3-color);}
    .note-editor p{margin:.55em 0;}
    .note-editor ul,.note-editor ol{margin:.65em 0;padding-left:1.6em;}
    .note-editor .dash-list,.note-editor .arrow-list,.note-editor .circle-list,.note-editor .check-list,.note-editor .triangle-list,.note-editor .square-list{list-style:none;padding-left:0;}
    .note-editor .dash-list li::before{content:"- ";font-weight:700;}
    .note-editor .arrow-list li::before{content:"-> ";font-weight:700;}
    .note-editor .circle-list li::before{content:"○ ";font-weight:700;}
    .note-editor .triangle-list li::before{content:"△ ";font-weight:700;color:#d58f27;}
    .note-editor .square-list li::before{content:"□ ";font-weight:700;}
    .note-editor .check-list li{position:relative;min-height:1.7em;padding-left:26px;}
    .note-editor .check-list li::before{content:"";position:absolute;top:.45em;left:0;width:12px;height:12px;border:1.5px solid var(--accent);border-radius:3px;}
    .note-editor .check-list li[data-checked="true"]{color:#657169;text-decoration:line-through;}
    .note-editor .check-list li[data-checked="true"]::before{background:var(--todo-color);border-color:var(--todo-color);}
    .note-editor .check-list li[data-checked="true"]::after{content:"";position:absolute;top:calc(.45em + 2px);left:4px;width:4px;height:8px;border-right:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(42deg);}
    .note-editor li.is-split-continuation{list-style:none;}
    .note-editor li.is-split-continuation::before{content:none !important;}
    .note-editor li.is-split-continuation::marker{content:"";}
    .note-editor img{max-width:100%;height:auto;}
    @media print{
      body{background:#fff;}
      .print-toolbar{display:none;}
      .print-preview{padding:0;}
      .print-sheet{width:auto;min-height:auto;margin:0;padding:0;border:0;border-radius:0;box-shadow:none;overflow:visible;break-after:page;}
      .print-sheet:last-child{break-after:auto;}
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <div><strong>${title}</strong><span> - impression MindSet</span></div>
    <button class="print-button" onclick="window.print()">${actionLabel}</button>
  </div>
  <main class="print-preview">
    ${printableNoteBody(note, sourceHtml, options)}
  </main>
</body>
</html>`;
  }

  function cmToPoints(value) {
    return (Number(value) || 0) * 72 / 2.54;
  }

  const pdfWinAnsiCodes = new Map([
    [0x20AC, 0x80], [0x201A, 0x82], [0x0192, 0x83], [0x201E, 0x84], [0x2026, 0x85],
    [0x2020, 0x86], [0x2021, 0x87], [0x02C6, 0x88], [0x2030, 0x89], [0x0160, 0x8A],
    [0x2039, 0x8B], [0x0152, 0x8C], [0x017D, 0x8E], [0x2018, 0x91], [0x2019, 0x92],
    [0x201C, 0x93], [0x201D, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
    [0x02DC, 0x98], [0x2122, 0x99], [0x0161, 0x9A], [0x203A, 0x9B], [0x0153, 0x9C],
    [0x017E, 0x9E], [0x0178, 0x9F],
  ]);

  const pdfSymbolMap = {
    "\u2192": "->", "\u21d2": "=>", "\u2190": "<-", "\u21d0": "<=", "\u2194": "<->",
    "\u2713": "v", "\u2714": "v", "\u2717": "x", "\u2718": "x",
    "\u2605": "*", "\u2606": "*", "\u25aa": "-", "\u25a0": "-", "\u25a1": "[]",
    "\u25b8": ">", "\u25b6": ">", "\u25cb": "o", "\u25cf": "*",
    "\u25b3": "^", "\u25b2": "^", "\u2212": "-", "\u00A0": " ",
  };

  const pdfCyrillicMap = {
    "\u0430": "a", "\u0431": "b", "\u0432": "v", "\u0433": "g", "\u0434": "d", "\u0435": "e", "\u0451": "e",
    "\u0436": "zh", "\u0437": "z", "\u0438": "i", "\u0439": "i", "\u043a": "k", "\u043b": "l", "\u043c": "m",
    "\u043d": "n", "\u043e": "o", "\u043f": "p", "\u0440": "r", "\u0441": "s", "\u0442": "t", "\u0443": "u",
    "\u0444": "f", "\u0445": "kh", "\u0446": "ts", "\u0447": "ch", "\u0448": "sh", "\u0449": "shch",
    "\u044a": "", "\u044b": "y", "\u044c": "", "\u044d": "e", "\u044e": "yu", "\u044f": "ya",
  };

  const pdfGreekMap = {
    "\u03b1": "a", "\u03b2": "b", "\u03b3": "g", "\u03b4": "d", "\u03b5": "e", "\u03b6": "z", "\u03b7": "e",
    "\u03b8": "th", "\u03b9": "i", "\u03ba": "k", "\u03bb": "l", "\u03bc": "m", "\u03bd": "n", "\u03be": "x",
    "\u03bf": "o", "\u03c0": "p", "\u03c1": "r", "\u03c3": "s", "\u03c2": "s", "\u03c4": "t", "\u03c5": "y",
    "\u03c6": "ph", "\u03c7": "ch", "\u03c8": "ps", "\u03c9": "o",
  };

  function pdfTransliterateChar(char) {
    const code = char.codePointAt(0);
    if ((code >= 0x20 && code <= 0x7E) || (code >= 0xA0 && code <= 0xFF)) return char;
    if (pdfWinAnsiCodes.has(code)) return char;
    if (pdfSymbolMap[char] !== undefined) return pdfSymbolMap[char];
    const lower = char.toLowerCase();
    const romanized = pdfCyrillicMap[lower] ?? pdfGreekMap[lower];
    if (romanized !== undefined) {
      return char === lower ? romanized : romanized.charAt(0).toUpperCase() + romanized.slice(1);
    }
    const decomposed = char.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    if (decomposed !== char && [...decomposed].every((part) => {
      const partCode = part.codePointAt(0);
      return (partCode >= 0x20 && partCode <= 0x7E) || (partCode >= 0xA0 && partCode <= 0xFF);
    })) {
      return decomposed;
    }
    if (/\p{Extended_Pictographic}/u.test(char)) return "";
    return "?";
  }

  function pdfPlainText(value) {
    return [...String(value || "")
      .replace(/\t/g, "    ")
      .replace(/[\r\n]/g, " ")]
      .map(pdfTransliterateChar)
      .join("");
  }

  function pdfTextHex(value) {
    return `<${[...pdfPlainText(value)]
      .map((char) => {
        const code = char.charCodeAt(0);
        if (code <= 0x7E || (code >= 0xA0 && code <= 0xFF)) return code;
        return pdfWinAnsiCodes.get(code) ?? 0x3F;
      })
      .filter((code) => code === 0x09 || code === 0x0a || code === 0x0d || code >= 0x20)
      .map((code) => code.toString(16).padStart(2, "0").toUpperCase())
      .join("")}>`;
  }

  function noteExportBaseName(note) {
    return String(note?.title || "Note MindSet")
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 90) || "Note MindSet";
  }

  function noteExportFileName(note, extension) {
    return `${noteExportBaseName(note)}.${extension}`;
  }

  function pdfFileName(note) {
    return noteExportFileName(note, "pdf");
  }

  function nodeTextWithBreaks(node) {
    const clone = node.cloneNode(true);
    clone.querySelectorAll?.("br").forEach((br) => br.replaceWith("\n"));
    return clone.textContent || "";
  }

  const printableBlockSelector = "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, ul, ol, table, div";

  function printableListItemPrefix(li) {
    if (li.classList?.contains("is-split-continuation")) return "";
    if (li.closest(".check-list")) return li.dataset.checked === "true" ? "[x] " : "[ ] ";
    if (li.closest(".arrow-list")) return "-> ";
    if (li.closest(".circle-list")) return "o ";
    if (li.closest(".triangle-list")) return "^ ";
    if (li.closest(".square-list")) return "[] ";
    return "- ";
  }

  function pushPrintableBlockLines(block, lines, prefix = "") {
    const text = nodeTextWithBreaks(block).replace(/\r/g, "");
    const blockLines = text.split("\n");
    if (!blockLines.some((line) => line.trim())) {
      lines.push("");
      return;
    }
    blockLines.forEach((line, index) => {
      const cleaned = line.replace(/\s+/g, " ").trim();
      if (!cleaned && index > 0) {
        lines.push("");
        return;
      }
      if (cleaned) lines.push(`${index === 0 ? prefix : ""}${cleaned}`);
    });
  }

  function collectPrintableLines(node, lines) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.replace(/\s+/g, " ").trim();
      if (text) lines.push(text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName;

    if (tag === "TABLE") {
      node.querySelectorAll("tr").forEach((row) => {
        const cells = [...row.querySelectorAll("td, th")]
          .map((cell) => cell.textContent.replace(/\s+/g, " ").trim())
          .filter(Boolean);
        if (cells.length) lines.push(cells.join(" | "));
      });
      return;
    }

    if (tag === "UL" || tag === "OL") {
      [...node.children].forEach((child) => collectPrintableLines(child, lines));
      return;
    }

    if (tag === "LI") {
      const clone = node.cloneNode(true);
      clone.querySelectorAll("ul, ol, table").forEach((nested) => nested.remove());
      pushPrintableBlockLines(clone, lines, printableListItemPrefix(node));
      [...node.children]
        .filter((child) => ["UL", "OL", "TABLE"].includes(child.tagName))
        .forEach((child) => collectPrintableLines(child, lines));
      return;
    }

    const containsBlocks = !!node.querySelector(printableBlockSelector);
    if (!containsBlocks) {
      pushPrintableBlockLines(node, lines);
      if (/^H[1-3]$/.test(tag)) lines.push("");
      return;
    }
    [...node.childNodes].forEach((child) => collectPrintableLines(child, lines));
  }

  function printableTextLinesFromRoot(root) {
    const lines = [];
    [...root.childNodes].forEach((child) => collectPrintableLines(child, lines));
    return lines.length ? lines : [""];
  }

  function printableTextPages(sourceHtml) {
    const source = document.createElement("div");
    source.innerHTML = sanitizePrintableHtml(sourceHtml);
    const sheets = [...source.querySelectorAll(".page-sheet")];
    const roots = sheets.length ? sheets : [source];
    return roots.map((root) => printableTextLinesFromRoot(root));
  }

  function wrapPdfLine(line, maxChars) {
    const text = pdfPlainText(line).replace(/\s+/g, " ").trim();
    if (!text) return [""];
    const words = text.split(" ");
    const wrapped = [];
    let current = "";
    words.forEach((word) => {
      if (word.length > maxChars) {
        if (current) {
          wrapped.push(current);
          current = "";
        }
        for (let index = 0; index < word.length; index += maxChars) {
          wrapped.push(word.slice(index, index + maxChars));
        }
        return;
      }
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxChars && current) {
        wrapped.push(current);
        current = word;
      } else {
        current = next;
      }
    });
    if (current) wrapped.push(current);
    return wrapped.length ? wrapped : [""];
  }

  function paginatePdfLines(note, sourceHtml, options, setup) {
    const dimensions = pageSizeDimensions(setup);
    const margins = setup.margins;
    const widthPt = cmToPoints(dimensions.widthCm);
    const heightPt = cmToPoints(dimensions.heightCm);
    const marginLeftPt = cmToPoints(margins.left);
    const marginRightPt = cmToPoints(margins.right);
    const marginTopPt = cmToPoints(margins.top);
    const marginBottomPt = cmToPoints(margins.bottom);
    const bodyFontSize = 11;
    const lineHeight = 15;
    const contentWidth = Math.max(widthPt - marginLeftPt - marginRightPt, 120);
    const contentHeight = Math.max(heightPt - marginTopPt - marginBottomPt - (options.showPageNumbers ? 18 : 0), 120);
    const maxChars = Math.max(Math.floor(contentWidth / (bodyFontSize * 0.52)), 22);
    const maxLines = Math.max(Math.floor(contentHeight / lineHeight), 1);
    const rawPages = printableTextPages(sourceHtml);
    const headerLines = [];
    const now = new Date();
    if (options.showTitle) headerLines.push(note?.title || "Note MindSet");
    if (options.showDate) headerLines.push(formatPrintDate(now));
    if (options.showTime) headerLines.push(formatPrintTime(now));
    if (headerLines.length) headerLines.push("");

    const pages = [];
    let current = [];
    const pushPage = () => {
      pages.push(current);
      current = [];
    };
    const addLine = (line) => {
      wrapPdfLine(line, maxChars).forEach((wrappedLine) => {
        if (current.length >= maxLines) pushPage();
        current.push(wrappedLine);
      });
    };

    rawPages.forEach((rawPage, pageIndex) => {
      if (pageIndex > 0) pushPage();
      if (pageIndex === 0) headerLines.forEach(addLine);
      (rawPage.length ? rawPage : [""]).forEach(addLine);
    });
    if (current.length || !pages.length) pushPage();

    return {
      pages,
      metrics: {
        widthPt,
        heightPt,
        marginLeftPt,
        marginTopPt,
        marginBottomPt,
        bodyFontSize,
        lineHeight,
      },
    };
  }

  function pdfObject(content) {
    return String(content || "");
  }

  function pdfContentStreamLength(content) {
    return content.length;
  }

  function renderPdfPageContent(lines, pageIndex, pageCount, metrics, options) {
    const yStart = metrics.heightPt - metrics.marginTopPt;
    const commands = ["BT", `/F1 ${metrics.bodyFontSize} Tf`];
    lines.forEach((line, index) => {
      const y = yStart - index * metrics.lineHeight;
      commands.push(`1 0 0 1 ${metrics.marginLeftPt.toFixed(2)} ${y.toFixed(2)} Tm ${pdfTextHex(line)} Tj`);
    });
    if (options.showPageNumbers) {
      const label = `Page ${pageIndex + 1} / ${pageCount}`;
      const fontSize = 9;
      const estimatedWidth = pdfPlainText(label).length * fontSize * 0.5;
      const x = Math.max((metrics.widthPt - estimatedWidth) / 2, 8);
      const y = Math.max(metrics.marginBottomPt * 0.45, 12);
      commands.push(`/F1 ${fontSize} Tf`);
      commands.push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm ${pdfTextHex(label)} Tj`);
    }
    commands.push("ET");
    return commands.join("\n");
  }

  function buildPdfDocument(pages, metrics, options) {
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    ];
    const pageIds = [];
    pages.forEach((lines, index) => {
      const content = renderPdfPageContent(lines, index, pages.length, metrics, options);
      const contentId = objects.push(pdfObject(`<< /Length ${pdfContentStreamLength(content)} >>\nstream\n${content}\nendstream`));
      const pageId = objects.push(pdfObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${metrics.widthPt.toFixed(2)} ${metrics.heightPt.toFixed(2)}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`));
      pageIds.push(pageId);
    });
    objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

    let pdf = "%PDF-1.4\n% MindSet\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let index = 1; index <= objects.length; index += 1) {
      pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return pdf;
  }

  function createPrintableNotePdf(note, sourceHtml, options = defaultPrintOptions()) {
    options = normalizePrintOptions(options);
    const setup = normalizePageSetup(state.settings?.pageSetup, state.settings?.pageMarginPreset, state.settings);
    const { pages, metrics } = paginatePdfLines(note, sourceHtml, options, setup);
    const pdf = buildPdfDocument(pages, metrics, options);
    return {
      blob: new Blob([pdf], { type: "application/pdf" }),
      fileName: pdfFileName(note),
      pageCount: pages.length,
    };
  }

  function triggerFileDownload(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "Note MindSet";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function triggerPdfDownload(url, fileName) {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "Note MindSet.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function downloadPrintableNotePdf(note, sourceHtml, options = defaultPrintOptions()) {
    const printable = createPrintableNotePdf(note, sourceHtml, options);
    const url = URL.createObjectURL(printable.blob);
    triggerPdfDownload(url, printable.fileName);
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    setToast("PDF MindSet enregistre sans en-tetes du navigateur.");
  }

  function clearPdfPreviewUrl(modal = runtime.modal) {
    if (modal?.type === "pdf-preview" && modal.pdfUrl) {
      URL.revokeObjectURL(modal.pdfUrl);
    }
  }

  function setModal(nextModal) {
    if (runtime.modal?.pdfUrl && runtime.modal.pdfUrl !== nextModal?.pdfUrl) {
      clearPdfPreviewUrl(runtime.modal);
    }
    const currentKey = runtime.modal ? `${runtime.modal.type}:${runtime.modal.boxId || ""}:${runtime.modal.itemId || ""}:${runtime.modal.mode || ""}` : "";
    const nextKey = nextModal ? `${nextModal.type}:${nextModal.boxId || ""}:${nextModal.itemId || ""}:${nextModal.mode || ""}` : "";
    if (currentKey !== nextKey) runtime.autofocusKey = "";
    runtime.modal = nextModal;
  }

  function openPrintableNotePdfPreview(box, note, options = defaultPrintOptions(), sourceOverride = "") {
    if (!box || note?.type !== "note") return;
    const sourceHtml = sourceOverride || activePrintableSource(box, note);
    flushActiveEditorContent();
    const freshNote = findItem(box, note.id) || note;
    const printable = createPrintableNotePdf(freshNote, sourceHtml, options);
    const pdfUrl = URL.createObjectURL(printable.blob);
    setModal({
      type: "pdf-preview",
      noteId: freshNote.id,
      options: normalizePrintOptions(options),
      pdfUrl,
      fileName: printable.fileName,
      pageCount: printable.pageCount,
    });
    render();
  }

  function activePrintableSource(box, note) {
    const pageEditor = app.querySelector(".editor-page.is-page-mode [data-note-editor]");
    if (pageEditor && findItem(box, note?.id)?.id === note?.id) return pageEditor.innerHTML;
    const editor = app.querySelector("[data-note-editor]");
    if (editor && findItem(box, note?.id)?.id === note?.id) return editor.innerHTML;
    return note?.content || "<p><br></p>";
  }

  function wordNoteDocument(note, sourceHtml) {
    const setup = normalizePageSetup(state.settings?.pageSetup, state.settings?.pageMarginPreset, state.settings);
    const dimensions = pageSizeDimensions(setup);
    const margins = setup.margins;
    const headings = state.settings?.headingPresets || headingDefaults;
    const preset = (key) => ({ ...headingDefaults[key], ...(headings[key] || {}) });
    const normal = preset("normal");
    const h1 = preset("h1");
    const h2 = preset("h2");
    const h3 = preset("h3");
    const todoColor = cleanColor(state.settings?.todoColor, state.settings?.selectionColor || "#0f6b58");
    const accentColor = cleanColor(state.settings?.selectionColor, "#0f6b58");
    return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="fr">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(note?.title || "Note MindSet")}</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
  <style>
    ${printableFontFaces()}
    @page Section1{size:${dimensions.widthCm}cm ${dimensions.heightCm}cm;margin:${margins.top}cm ${margins.right}cm ${margins.bottom}cm ${margins.left}cm;}
    body{margin:0;color:${cleanColor(normal.color, headingDefaults.normal.color)};font-family:${safePrintCssValue(normal.fontFamily, headingDefaults.normal.fontFamily)};}
    .Section1{page:Section1;}
    .print-sheet{page-break-after:always;}
    .print-sheet:last-child{page-break-after:auto;}
    .note-editor{font-family:${safePrintCssValue(normal.fontFamily, headingDefaults.normal.fontFamily)};font-size:${safePrintCssValue(normal.size, headingDefaults.normal.size)};font-weight:${safePrintCssValue(normal.weight, headingDefaults.normal.weight)};color:${cleanColor(normal.color, headingDefaults.normal.color)};line-height:1.55;}
    .note-editor h1,.note-editor h2,.note-editor h3{margin:1.2em 0 .45em;line-height:1.18;}
    .note-editor h1{font-family:${safePrintCssValue(h1.fontFamily, headingDefaults.h1.fontFamily)};font-size:${safePrintCssValue(h1.size, headingDefaults.h1.size)};font-weight:${safePrintCssValue(h1.weight, headingDefaults.h1.weight)};color:${cleanColor(h1.color, headingDefaults.h1.color)};}
    .note-editor h2{font-family:${safePrintCssValue(h2.fontFamily, headingDefaults.h2.fontFamily)};font-size:${safePrintCssValue(h2.size, headingDefaults.h2.size)};font-weight:${safePrintCssValue(h2.weight, headingDefaults.h2.weight)};color:${cleanColor(h2.color, headingDefaults.h2.color)};}
    .note-editor h3{font-family:${safePrintCssValue(h3.fontFamily, headingDefaults.h3.fontFamily)};font-size:${safePrintCssValue(h3.size, headingDefaults.h3.size)};font-weight:${safePrintCssValue(h3.weight, headingDefaults.h3.weight)};color:${cleanColor(h3.color, headingDefaults.h3.color)};}
    .note-editor p{margin:.55em 0;}
    .note-editor ul,.note-editor ol{margin:.65em 0;padding-left:1.6em;}
    .note-editor .dash-list,.note-editor .arrow-list,.note-editor .circle-list,.note-editor .check-list,.note-editor .triangle-list,.note-editor .square-list{list-style:none;padding-left:0;}
    .note-editor .dash-list li::before{content:"- ";font-weight:700;}
    .note-editor .arrow-list li::before{content:"-> ";font-weight:700;}
    .note-editor .circle-list li::before{content:"o ";font-weight:700;}
    .note-editor .triangle-list li::before{content:"^ ";font-weight:700;color:#d58f27;}
    .note-editor .square-list li::before{content:"[] ";font-weight:700;}
    .note-editor .check-list li::before{content:"[ ] ";font-weight:700;color:${accentColor};}
    .note-editor .check-list li[data-checked="true"]{color:#657169;text-decoration:line-through;}
    .note-editor .check-list li[data-checked="true"]::before{content:"[x] ";color:${todoColor};}
    .note-editor li.is-split-continuation{list-style:none;}
    .note-editor li.is-split-continuation::before{content:"" !important;}
    .note-editor img{max-width:100%;height:auto;}
  </style>
</head>
<body>
  <div class="Section1">
    ${printableNoteBody(note, sourceHtml, defaultPrintOptions())}
  </div>
</body>
</html>`;
  }

  function plainTextFromNoteHtml(sourceHtml) {
    return printableTextPages(sourceHtml)
      .map((lines) => lines.join("\r\n").replace(/[ \t]+\r\n/g, "\r\n").trimEnd())
      .join("\r\n\r\n")
      .trim();
  }

  function exportNoteAsWord(box, note) {
    if (!box || note?.type !== "note") return;
    flushActiveEditorContent();
    const freshNote = findItem(box, note.id) || note;
    const sourceHtml = activePrintableSource(box, freshNote);
    const documentHtml = wordNoteDocument(freshNote, sourceHtml);
    triggerFileDownload(new Blob(["\ufeff", documentHtml], { type: "application/msword;charset=utf-8" }), noteExportFileName(freshNote, "doc"));
    setToast("Note exportee en format Word.");
  }

  function exportNoteAsTxt(box, note) {
    if (!box || note?.type !== "note") return;
    flushActiveEditorContent();
    const freshNote = findItem(box, note.id) || note;
    const sourceHtml = activePrintableSource(box, freshNote);
    const text = plainTextFromNoteHtml(sourceHtml);
    triggerFileDownload(new Blob(["\ufeff", text], { type: "text/plain;charset=utf-8" }), noteExportFileName(freshNote, "txt"));
    setToast("Note exportee en TXT.");
  }

  function openPrintableNoteWindow(box, note, mode = "print", options = defaultPrintOptions(), sourceOverride = "") {
    if (!box || note?.type !== "note") return;
    const sourceHtml = sourceOverride || activePrintableSource(box, note);
    flushActiveEditorContent();
    const freshNote = findItem(box, note.id) || note;
    if (mode === "mindset-pdf") {
      openPrintableNotePdfPreview(box, freshNote, options, sourceHtml);
      return;
    }
    const printWindow = window.open("", "_blank", "width=980,height=740");
    if (!printWindow) {
      setToast("Autorise les fenetres pour imprimer ou exporter la note.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(printableNoteDocument(freshNote, sourceHtml, options, mode));
    printWindow.document.close();
    let started = false;
    const startPrint = () => {
      if (started) return;
      started = true;
      printWindow.focus();
      printWindow.print();
    };
    printWindow.addEventListener?.("load", () => window.setTimeout(startPrint, 120));
    window.setTimeout(startPrint, 320);
    setToast(mode === "system-pdf" ? "Apercu systeme ouvert." : "Fenetre d'impression ouverte.");
  }

  function isHexColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || "").trim());
  }

  function cleanColor(value, fallback) {
    const color = String(value || "").trim().toLowerCase();
    return isHexColor(color) ? color : fallback;
  }

  function normalizeRecentColors(colors) {
    if (!Array.isArray(colors)) return [];
    return [...new Set(colors.map((color) => cleanColor(color, "")).filter(Boolean))].slice(0, 8);
  }

  function normalizeRecentColorSlots(colors) {
    const unique = normalizeRecentColors(colors);
    return [0, 1, 2].map((index) => unique[index] || "");
  }

  function defaultTreeGuideColor(theme) {
    return theme === "dark" ? "#5a5a5a" : "#c8ceca";
  }

  function normalizeGraphDirection(value) {
    return graphDirections.some((direction) => direction.id === value) ? value : "up";
  }

  function clampGraphZoom(value) {
    const number = Number(value);
    return Math.min(Math.max(Number.isFinite(number) ? number : 1, 0.35), 1.8);
  }

  function clampGraphPan(value) {
    const number = Number(value);
    return Math.min(Math.max(Number.isFinite(number) ? number : 0, -5000), 5000);
  }

  function graphZoomLabel(value) {
    return `${Math.round(clampGraphZoom(value) * 100)}%`;
  }

  function normalizeStateShape(value) {
    const previousSettings = value.settings || {};
    const previousHeadings = previousSettings.headingPresets || {};
    const previousCustomMargins = normalizePageCustomMarginPresets(previousSettings.customPageMarginPresets);
    const previousMarginPreset = normalizePageMarginPreset(previousSettings.pageMarginPreset || "normal");
    const theme = previousSettings.theme === "dark" ? "dark" : "light";
    value.settings = {
      theme,
      selectionColor: previousSettings.selectionColor || "#0f6b58",
      treeGuideColor: cleanColor(previousSettings.treeGuideColor, ""),
      todoColor: cleanColor(previousSettings.todoColor, previousSettings.selectionColor || "#0f6b58"),
      rightPanelOpen: previousSettings.rightPanelOpen !== false,
      leftPanelOpen: previousSettings.leftPanelOpen !== false,
      navWidth: Math.min(Math.max(Number(previousSettings.navWidth) || 282, 218), 430),
      lastTextColor: cleanColor(previousSettings.lastTextColor, "#000000"),
      lastHighlightColor: cleanColor(previousSettings.lastHighlightColor, "#fff0a8"),
      recentTextColors: normalizeRecentColorSlots(previousSettings.recentTextColors),
      recentHighlightColors: normalizeRecentColorSlots(previousSettings.recentHighlightColors),
      recentTextColorSlot: Math.min(Math.max(Number(previousSettings.recentTextColorSlot) || 0, 0), 2),
      recentHighlightColorSlot: Math.min(Math.max(Number(previousSettings.recentHighlightColorSlot) || 0, 0), 2),
      graphDirection: normalizeGraphDirection(previousSettings.graphDirection),
      graphZoom: clampGraphZoom(previousSettings.graphZoom || 1),
      graphPanX: clampGraphPan(previousSettings.graphPanX),
      graphPanY: clampGraphPan(previousSettings.graphPanY),
      editorViewMode: normalizeEditorViewMode(previousSettings.editorViewMode),
      pageFlowMode: normalizePageFlowMode(previousSettings.pageFlowMode),
      pageZoom: clampPageZoom(previousSettings.pageZoom || 1),
      pageMarginPreset: previousMarginPreset,
      customPageMarginPresets: previousCustomMargins,
      pageSetup: normalizePageSetup(previousSettings.pageSetup, previousMarginPreset, { customPageMarginPresets: previousCustomMargins }),
      statsPrefs: normalizeStatsPrefs(previousSettings.statsPrefs),
      localFonts: normalizeLocalFonts(previousSettings.localFonts),
      headingPresets: {
        normal: { ...headingDefaults.normal, ...(previousHeadings.normal || {}) },
        h1: { ...headingDefaults.h1, ...(previousHeadings.h1 || {}) },
        h2: { ...headingDefaults.h2, ...(previousHeadings.h2 || {}) },
        h3: { ...headingDefaults.h3, ...(previousHeadings.h3 || {}) },
      },
    };
    value.settings.pageMarginPreset = marginPresetForSetup(value.settings.pageSetup, value.settings);
    value.boxes.forEach((box) => {
      if (!box.root) return;
      normalizeUnlockedBoxShape(box);
    });
    return value;
  }

  function normalizeUnlockedBoxShape(box) {
    if (!box?.root) return;
    if (!Array.isArray(box.bookmarkedIds)) box.bookmarkedIds = [];
    if (!Array.isArray(box.openTabIds)) box.openTabIds = box.activeItemId ? [box.activeItemId] : [];
    if (typeof box.customSortActive !== "boolean") box.customSortActive = false;
    if (!Array.isArray(box.selectedIds)) box.selectedIds = [];
    if (!Array.isArray(box.expandedIds)) box.expandedIds = [box.root.id];
    normalizeItemShape(box.root, true);
    const iconFolder = findItem(box, box.iconFolderId);
    if (!iconFolder || iconFolder.type !== "folder") box.iconFolderId = box.root.id;
  }

  function applyAppearance() {
    const settings = state.settings || {};
    const selection = settings.selectionColor || "#0f6b58";
    const treeGuide = cleanColor(settings.treeGuideColor, defaultTreeGuideColor(settings.theme));
    const todoColor = cleanColor(settings.todoColor, selection);
    const headings = settings.headingPresets || headingDefaults;
    document.documentElement.dataset.theme = settings.theme === "dark" ? "dark" : "light";
    document.documentElement.style.setProperty("--selection-color", selection);
    document.documentElement.style.setProperty("--selection-soft", hexToRgba(selection, 0.16));
    document.documentElement.style.setProperty("--selection-border", hexToRgba(selection, 0.42));
    document.documentElement.style.setProperty("--tree-guide-color", treeGuide);
    document.documentElement.style.setProperty("--todo-color", todoColor);
    document.documentElement.style.setProperty("--nav", `${Math.min(Math.max(Number(settings.navWidth) || 282, 218), 430)}px`);
    ["normal", "h1", "h2", "h3"].forEach((key) => {
      const preset = { ...headingDefaults[key], ...(headings[key] || {}) };
      document.documentElement.style.setProperty(`--${key}-size`, preset.size);
      const color = settings.theme === "dark" && preset.color === headingDefaults[key].color ? "#d8d8d8" : preset.color;
      document.documentElement.style.setProperty(`--${key}-color`, color);
      document.documentElement.style.setProperty(`--${key}-weight`, preset.weight);
      document.documentElement.style.setProperty(`--${key}-font`, preset.fontFamily || headingDefaults[key].fontFamily);
    });
    applyLocalFonts();
  }

  function applyLocalFonts() {
    if (!("FontFace" in window) || !document.fonts) return;
    (state.settings?.localFonts || []).forEach((font) => {
      if (!font?.id || !font.dataUrl || runtime.loadedFontIds.has(font.id)) return;
      try {
        runtime.loadedFontIds.add(font.id);
        const face = new FontFace(font.family, `url(${font.dataUrl})`);
        face.load()
          .then((loaded) => {
            document.fonts.add(loaded);
          })
          .catch((error) => {
            runtime.loadedFontIds.delete(font.id);
            console.warn("MindSet font ignored", error);
          });
      } catch (error) {
        runtime.loadedFontIds.delete(font.id);
        console.warn("MindSet font ignored", error);
      }
    });
  }

  function normalizeItemShape(node, root = false) {
    if (!node) return;
    if (!root) {
      if (!["none", "default", "emoji"].includes(node.iconKind)) node.iconKind = "none";
      if (node.iconKind === "emoji" && !node.emoji) node.emoji = emojiChoices[0];
    }
    if (node.type === "folder") {
      if (!Array.isArray(node.children)) node.children = [];
      node.children.forEach((child) => normalizeItemShape(child));
    }
  }

  function hexToRgba(hex, alpha) {
    const normalized = String(hex || "").replace("#", "");
    const value = normalized.length === 3
      ? normalized.split("").map((char) => char + char).join("")
      : normalized.padEnd(6, "0").slice(0, 6);
    const number = Number.parseInt(value, 16);
    const red = (number >> 16) & 255;
    const green = (number >> 8) & 255;
    const blue = number & 255;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  function loadState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.boxes)) {
          if (parsed.currentBoxId) {
            const active = parsed.boxes.find((box) => box.id === parsed.currentBoxId);
            if (active && active.passwordHash) {
              parsed.currentBoxId = null;
            }
          }
          const normalized = normalizeStateShape(parsed);
          normalized.currentBoxId = null;
          return normalized;
        }
      } catch (error) {
        console.warn("MindSet state reset", error);
      }
    }
    const seeded = normalizeStateShape(createSeedState());
    seeded.currentBoxId = null;
    return seeded;
  }

  function saveState() {
    persistState();
    scheduleProtectedBoxEncryption();
  }

  function stateSnapshot() {
    return JSON.stringify(state);
  }

  function rememberState(label = "Action") {
    runtime.undoStack.push({ label, snapshot: stateSnapshot() });
    if (runtime.undoStack.length > 80) runtime.undoStack.shift();
    runtime.redoStack = [];
  }

  function restoreStateSnapshot(snapshot) {
    if (!snapshot) return false;
    try {
      const restored = normalizeStateShape(JSON.parse(snapshot));
      Object.keys(state).forEach((key) => delete state[key]);
      Object.assign(state, restored);
      setModal(null);
      runtime.contextMenu = null;
      runtime.paletteQuery = "";
      runtime.boxMenuOpen = false;
      runtime.editorRange = null;
      saveState();
      render();
      return true;
    } catch (error) {
      console.warn("MindSet history restore failed", error);
      return false;
    }
  }

  function undoStateChange() {
    const previous = runtime.undoStack.pop();
    if (!previous) return false;
    runtime.redoStack.push({ label: previous.label, snapshot: stateSnapshot() });
    if (runtime.redoStack.length > 80) runtime.redoStack.shift();
    const restored = restoreStateSnapshot(previous.snapshot);
    if (restored) setToast("Action annulee.");
    return restored;
  }

  function redoStateChange() {
    const next = runtime.redoStack.pop();
    if (!next) return false;
    runtime.undoStack.push({ label: next.label, snapshot: stateSnapshot() });
    if (runtime.undoStack.length > 80) runtime.undoStack.shift();
    const restored = restoreStateSnapshot(next.snapshot);
    if (restored) setToast("Action retablie.");
    return restored;
  }

  function editableTarget(element) {
    return element?.closest?.("input, textarea, select, [contenteditable='true']") || null;
  }

  function activeEditableTarget() {
    const active = document.activeElement;
    return active && active !== document.body && document.body.contains(active) ? editableTarget(active) : null;
  }

  function cancelDeferredEditorWork(options = {}) {
    window.clearTimeout(runtime.idleRenderTimer);
    runtime.idleRenderTimer = 0;
    window.clearTimeout(runtime.pagePaginationTimer);
    runtime.pagePaginationTimer = 0;
    if (options.suppressIdleMs) {
      runtime.suppressIdleRenderUntil = Date.now() + options.suppressIdleMs;
    }
  }

  function markEditorPointerIntent() {
    runtime.lastEditorPointerAt = Date.now();
    window.clearTimeout(runtime.idleRenderTimer);
    runtime.idleRenderTimer = 0;
  }

  function scheduleRenderWhenIdle() {
    window.clearTimeout(runtime.idleRenderTimer);
    runtime.idleRenderTimer = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        const nowTime = Date.now();
        if (nowTime < runtime.suppressIdleRenderUntil) return;
        if (runtime.pointerIsDown) {
          scheduleRenderWhenIdle();
          return;
        }
        if (nowTime - runtime.lastEditorPointerAt < 650) return;
        if (activeEditableTarget()) return;
        render();
      });
    }, 120);
  }

  function focusAutofocusTarget() {
    const target = app.querySelector("[autofocus]");
    const active = activeEditableTarget();
    if (!target || (active && active !== target)) return;
    const modalKey = runtime.modal ? `${runtime.modal.type}:${runtime.modal.boxId || ""}:${runtime.modal.itemId || ""}:${runtime.modal.mode || ""}` : "";
    const focusKey = `${modalKey}:${target.name || target.dataset.paletteSearch || target.dataset.selectAutofocus || target.tagName}`;
    if (runtime.autofocusKey === focusKey) return;
    runtime.autofocusKey = focusKey;
    window.requestAnimationFrame(() => {
      const nextActive = activeEditableTarget();
      if (!document.body.contains(target) || (nextActive && nextActive !== target)) return;
      target.focus({ preventScroll: true });
      placeAutofocusCaret(target);
      window.setTimeout(() => placeAutofocusCaret(target), 0);
    });
  }

  function captureNoteEditorFocus() {
    const active = document.activeElement;
    if (!active || !app.contains(active)) return null;
    const field = active.closest?.("[data-note-title], [data-search], [data-box-title]");
    if (field) {
      return {
        kind: "field",
        selector: field.matches("[data-note-title]") ? "[data-note-title]" : field.matches("[data-search]") ? "[data-search]" : "[data-box-title]",
        start: typeof field.selectionStart === "number" ? field.selectionStart : null,
        end: typeof field.selectionEnd === "number" ? field.selectionEnd : null,
      };
    }
    const editor = active.closest?.("[data-note-editor]");
    if (!editor) return null;
    const offsets = getEditorSelectionOffsets(editor);
    flushActiveEditorContent();
    return {
      kind: "editor",
      offsets,
      noteId: editor.dataset.editorNoteId || activeBox()?.activeItemId || "",
    };
  }

  function restoreNoteEditorFocus(snapshot) {
    if (!snapshot || modalBlocksGlobalShortcuts()) return false;
    if (snapshot.kind === "field") {
      const field = app.querySelector(snapshot.selector);
      if (!field) return false;
      field.focus({ preventScroll: true });
      if (typeof field.setSelectionRange === "function" && snapshot.start !== null && typeof field.value === "string") {
        const start = Math.min(snapshot.start, field.value.length);
        const end = Math.min(snapshot.end ?? snapshot.start, field.value.length);
        field.setSelectionRange(start, end);
      }
      return true;
    }
    if (snapshot.noteId && activeBox()?.activeItemId !== snapshot.noteId) return false;
    const editor = app.querySelector("[data-note-editor]");
    if (!editor) return false;
    const focusTarget = isIndependentPageMode() ? (currentPageSheet(editor) || editor) : editor;
    focusTarget.focus({ preventScroll: true });
    if (snapshot.offsets) restoreEditorSelectionOffsets(editor, snapshot.offsets);
    saveEditorSelection(editor);
    return true;
  }

  function captureModalFieldFocus() {
    const active = document.activeElement;
    const field = active?.closest?.(".modal input, .modal textarea, .modal select");
    if (!field || !field.name) return null;
    return {
      modalKey: runtime.modal ? `${runtime.modal.type}:${runtime.modal.boxId || ""}:${runtime.modal.itemId || ""}:${runtime.modal.mode || ""}` : "",
      name: field.name,
      value: typeof field.value === "string" ? field.value : "",
      selectionStart: typeof field.selectionStart === "number" ? field.selectionStart : null,
      selectionEnd: typeof field.selectionEnd === "number" ? field.selectionEnd : null,
    };
  }

  function restoreModalFieldFocus(snapshot) {
    if (!snapshot) return false;
    const modalKey = runtime.modal ? `${runtime.modal.type}:${runtime.modal.boxId || ""}:${runtime.modal.itemId || ""}:${runtime.modal.mode || ""}` : "";
    if (snapshot.modalKey !== modalKey) return false;
    const field = [...app.querySelectorAll(".modal input, .modal textarea, .modal select")]
      .find((item) => item.name === snapshot.name);
    if (!field) return false;
    if (typeof field.value === "string" && field.value !== snapshot.value) field.value = snapshot.value;
    field.focus({ preventScroll: true });
    if (typeof field.setSelectionRange === "function" && snapshot.selectionStart !== null) {
      field.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd ?? snapshot.selectionStart);
    }
    return true;
  }

  function placeAutofocusCaret(target) {
    if (!document.body.contains(target) || document.activeElement !== target || typeof target.value !== "string") return;
    if (typeof target.setSelectionRange !== "function") return;
    if (target.dataset.selectAutofocus === "true") {
      target.setSelectionRange(0, target.value.length);
      if (typeof target.select === "function") target.select();
    } else {
      const end = target.value.length;
      target.setSelectionRange(end, end);
    }
  }

  function createSeedState() {
    const createdAt = now();
    const boxId = uid("box");
    const rootId = uid("folder");
    const quickId = uid("folder");
    const ideasId = uid("folder");
    const projectId = uid("folder");
    const welcomeId = uid("note");
    const visionId = uid("note");
    const functionsId = uid("note");
    const quickNoteId = uid("note");

    return {
      currentBoxId: null,
      settings: {
        theme: "light",
        selectionColor: "#0f6b58",
        todoColor: "#0f6b58",
        rightPanelOpen: true,
        leftPanelOpen: true,
        lastTextColor: "#000000",
        lastHighlightColor: "#fff0a8",
        recentTextColors: [],
        recentHighlightColors: [],
        graphDirection: "up",
        graphZoom: 1,
        graphPanX: 0,
        graphPanY: 0,
        editorViewMode: "flow",
        pageFlowMode: "continuous",
        pageZoom: 1,
        pageMarginPreset: "normal",
        customPageMarginPresets: normalizePageCustomMarginPresets(),
        pageSetup: normalizePageSetup({ sizeId: "a4", orientation: "portrait", margins: pageMarginPresets.normal.margins }, "normal"),
        localFonts: [],
      },
      boxes: [
        {
          id: boxId,
          name: "Projet MindSet",
          passwordHash: "",
          createdAt,
          modifiedAt: createdAt,
          activeItemId: welcomeId,
          selectedIds: [welcomeId],
          expandedIds: [rootId, quickId, ideasId, projectId],
          viewMode: "tree",
          sortMode: "custom",
          customSortActive: false,
          iconFolderId: rootId,
          searchQuery: "",
          bookmarkedIds: [welcomeId],
          openTabIds: [welcomeId],
          root: {
            id: rootId,
            type: "folder",
            title: "Projet MindSet",
            createdAt,
            modifiedAt: createdAt,
            children: [
              {
                id: quickId,
                type: "folder",
                title: "Notes rapides",
                createdAt,
                modifiedAt: createdAt,
                children: [
                  {
                    id: quickNoteId,
                    type: "note",
                    title: "Capture du jour",
                    createdAt,
                    modifiedAt: createdAt,
                    content: "<h2>Note rapide</h2><p>Une idée temporaire arrive ici avant d'être rangée dans la bonne branche.</p>",
                  },
                ],
              },
              {
                id: ideasId,
                type: "folder",
                title: "Idées",
                createdAt,
                modifiedAt: createdAt,
                children: [
                  {
                    id: projectId,
                    type: "folder",
                    title: "MindSet App",
                    createdAt,
                    modifiedAt: createdAt,
                    children: [
                      {
                        id: visionId,
                        type: "note",
                        title: "Vision",
                        createdAt,
                        modifiedAt: createdAt,
                        content: "<h1>MindSet</h1><p>Un espace local pour écrire vite, classer librement, et retrouver ses notes comme dans une sculpture mentale.</p><ul class=\"check-list\"><li>Boîtes par projet</li><li>Dossiers imbriqués</li><li>Vue arbre claire</li></ul>",
                      },
                      {
                        id: functionsId,
                        type: "note",
                        title: "Fonctions à garder",
                        createdAt,
                        modifiedAt: createdAt,
                        content: "<h2>Mini Word</h2><p>Garder les outils utiles : titres, couleurs, gras, italique, souligné, barré, surlignage et listes spéciales.</p><ul class=\"arrow-list\"><li>Rester rapide</li><li>Rester personnel</li></ul>",
                      },
                    ],
                  },
                ],
              },
              {
                id: welcomeId,
                type: "note",
                title: "Accueil MindSet",
                createdAt,
                modifiedAt: createdAt,
                content: "<h1>Bienvenue dans MindSet</h1><p>Cette première version sert à tester la sensation : une boîte, des dossiers, des notes, un éditeur et une vue arbre.</p><h2>Exemple de listes</h2><ul><li>Point classique</li></ul><ul class=\"dash-list\"><li>Tiret</li></ul><ul class=\"circle-list\"><li>Rond vide</li></ul><ul class=\"arrow-list\"><li>Flèche</li></ul><ul class=\"check-list\"><li>Case à remplir</li></ul><ul class=\"triangle-list\"><li>Triangle</li></ul><ul class=\"square-list\"><li>Carré simple</li></ul>",
              },
            ],
          },
        },
      ],
    };
  }

  function activeBox() {
    const box = state.boxes.find((item) => item.id === state.currentBoxId) || null;
    if (box && !box.root) return null;
    if (box && !Array.isArray(box.bookmarkedIds)) box.bookmarkedIds = [];
    if (box && !Array.isArray(box.openTabIds)) box.openTabIds = box.activeItemId ? [box.activeItemId] : [];
    return box;
  }

  function navigationSnapshot() {
    const box = activeBox();
    return {
      boxId: state.currentBoxId || "",
      itemId: box?.activeItemId || "",
      viewMode: box?.viewMode || "",
      sideTab: runtime.sideTab || "explorer",
      iconFolderId: box?.iconFolderId || "",
    };
  }

  function normalizeNavigationSnapshot(snapshot = {}) {
    return {
      boxId: String(snapshot.boxId || ""),
      itemId: String(snapshot.itemId || ""),
      viewMode: String(snapshot.viewMode || ""),
      sideTab: String(snapshot.sideTab || "explorer"),
      iconFolderId: String(snapshot.iconFolderId || ""),
    };
  }

  function sameNavigationSnapshot(a, b) {
    return !!a && !!b
      && a.boxId === b.boxId
      && a.itemId === b.itemId
      && a.viewMode === b.viewMode
      && a.sideTab === b.sideTab
      && a.iconFolderId === b.iconFolderId;
  }

  function pushNavigationPoint() {
    if (runtime.applyingNavigationHistory || !runtime.navigationReady || !window.history?.pushState) return;
    const snapshot = navigationSnapshot();
    const current = normalizeNavigationSnapshot(window.history.state?.mindsetNav || {});
    if (sameNavigationSnapshot(snapshot, current)) return;
    try {
      window.history.pushState({ mindsetNav: snapshot }, "", window.location.href);
    } catch (error) {
      console.warn("MindSet navigation history push failed", error);
    }
  }

  function replaceNavigationPoint() {
    if (!window.history?.replaceState) return;
    try {
      window.history.replaceState({ mindsetNav: navigationSnapshot() }, "", window.location.href);
      runtime.navigationReady = true;
    } catch (error) {
      console.warn("MindSet navigation history replace failed", error);
      runtime.navigationReady = false;
    }
  }

  function applyNavigationSnapshot(rawSnapshot) {
    const snapshot = normalizeNavigationSnapshot(rawSnapshot);
    runtime.applyingNavigationHistory = true;
    flushActiveEditorContent();
    cancelDeferredEditorWork({ suppressIdleMs: 650 });
    runtime.editorRange = null;
    runtime.contextMenu = null;
    runtime.boxMenuOpen = false;
    setModal(null);

    const box = snapshot.boxId ? state.boxes.find((item) => item.id === snapshot.boxId) : null;
    if (!box) {
      state.currentBoxId = null;
      runtime.sideTab = snapshot.sideTab || "explorer";
      saveState();
      render();
      runtime.applyingNavigationHistory = false;
      return;
    }
    if (box.passwordHash && (!runtime.unlockedBoxIds.has(box.id) || !box.root)) {
      state.currentBoxId = null;
      runtime.sideTab = snapshot.sideTab || "explorer";
      setModal({ type: "unlock-box", boxId: box.id });
      saveState();
      render();
      runtime.applyingNavigationHistory = false;
      return;
    }

    state.currentBoxId = box.id;
    runtime.sideTab = snapshot.sideTab || "explorer";
    if (["tree", "list", "icons"].includes(snapshot.viewMode)) box.viewMode = snapshot.viewMode;
    const target = snapshot.itemId ? findItem(box, snapshot.itemId) : null;
    box.activeItemId = target ? target.id : box.root.id;
    box.selectedIds = target && target.id !== box.root.id ? [target.id] : [];
    runtime.selectionAnchorId = target && target.id !== box.root.id ? target.id : null;
    runtime.focusedItemId = target?.id || null;
    if (!Array.isArray(box.openTabIds)) box.openTabIds = [];
    if (target && !box.openTabIds.includes(target.id)) box.openTabIds.push(target.id);
    if (snapshot.iconFolderId && findItem(box, snapshot.iconFolderId)?.type === "folder") {
      box.iconFolderId = snapshot.iconFolderId;
    }
    saveState();
    render();
    runtime.applyingNavigationHistory = false;
  }

  function touchBox(box) {
    box.modifiedAt = now();
  }

  function walk(node, callback, depth = 0, parent = null) {
    callback(node, depth, parent);
    if (node.type === "folder") {
      node.children.forEach((child) => walk(child, callback, depth + 1, node));
    }
  }

  function allItems(box, includeRoot = false) {
    if (!box?.root) return [];
    const items = [];
    const visit = (node, depth, parent) => {
      if (includeRoot || node.id !== box.root.id) {
        items.push({ node, depth, parent });
      }
      if (node.type === "folder") {
        sortedChildren(box, node).forEach((child) => visit(child, depth + 1, node));
      }
    };
    visit(box.root, 0, null);
    return items;
  }

  function findItem(box, id) {
    if (!box?.root) return null;
    let found = null;
    walk(box.root, (node) => {
      if (node.id === id) found = node;
    });
    return found;
  }

  function findParent(box, id) {
    if (!box?.root) return null;
    let found = null;
    walk(box.root, (node, depth, parent) => {
      if (node.id === id) found = parent;
    });
    return found;
  }

  function creationFolder(box) {
    const selected = (box.selectedIds || [])
      .filter((id) => id && id !== box.root.id)
      .map((id) => findItem(box, id))
      .filter(Boolean);

    if (!selected.length) return box.root;
    if (selected.length === 1) {
      const item = selected[0];
      return item.type === "folder" ? item : findParent(box, item.id) || box.root;
    }

    const parentIds = new Set(selected.map((item) => item.type === "folder" ? item.id : findParent(box, item.id)?.id || box.root.id));
    return parentIds.size === 1 ? findItem(box, [...parentIds][0]) || box.root : box.root;
  }

  function iconViewFolder(box) {
    const folder = findItem(box, box.iconFolderId);
    if (folder?.type === "folder") return folder;
    box.iconFolderId = box.root.id;
    return box.root;
  }

  function setIconViewFolder(box, id) {
    const folder = findItem(box, id);
    box.iconFolderId = folder?.type === "folder" ? folder.id : box.root.id;
    return iconViewFolder(box);
  }

  function isExpanded(box, id) {
    return box.expandedIds.includes(id);
  }

  function sortedChildren(box, folder) {
    const children = [...(folder.children || [])];
    if (box.sortMode === "custom") return children;

    const compareText = (a, b) => a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
    const compareDate = (field) => (a, b) => new Date(a[field]) - new Date(b[field]);

    if (box.sortMode === "typeFoldersFirst" || box.sortMode === "typeNotesFirst") {
      const dir = box.sortMode === "typeFoldersFirst" ? 1 : -1;
      return children.sort((a, b) => {
        const typeBias = Number(a.type === "note") - Number(b.type === "note");
        return typeBias ? typeBias * dir : compareText(a, b);
      });
    }

    const dir = box.sortMode.endsWith("Desc") ? -1 : 1;

    return children.sort((a, b) => {
      const typeBias = Number(a.type === "note") - Number(b.type === "note");
      if (typeBias) return typeBias;
      if (box.sortMode.startsWith("alpha")) return compareText(a, b) * dir;
      if (box.sortMode.startsWith("created")) return compareDate("createdAt")(a, b) * dir;
      if (box.sortMode.startsWith("modified")) return compareDate("modifiedAt")(a, b) * dir;
      return 0;
    });
  }

  function folderOptions(box) {
    return allItems(box, true)
      .filter(({ node }) => node.type === "folder")
      .map(({ node, depth }) => ({ id: node.id, label: `${"— ".repeat(Math.max(depth - 1, 0))}${node.title}` }));
  }

  async function sha256(text) {
    const subtle = window.crypto?.subtle || globalThis.crypto?.subtle;
    const data = new TextEncoder().encode(String(text || ""));
    if (subtle?.digest) {
      try {
        const hash = await subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch (error) {
        console.warn("MindSet WebCrypto hash failed, using fallback", error);
      }
    }
    return sha256Fallback(String(text || ""));
  }

  function sha256Fallback(text) {
    const bytes = [...new TextEncoder().encode(text)];
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);
    for (let shift = 56; shift >= 0; shift -= 8) bytes.push((bitLength / 2 ** shift) & 255);

    const constants = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const rotr = (value, bits) => (value >>> bits) | (value << (32 - bits));

    for (let offset = 0; offset < bytes.length; offset += 64) {
      const words = new Array(64).fill(0);
      for (let index = 0; index < 16; index += 1) {
        const start = offset + index * 4;
        words[index] = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | bytes[start + 3]) >>> 0;
      }
      for (let index = 16; index < 64; index += 1) {
        const s0 = (rotr(words[index - 15], 7) ^ rotr(words[index - 15], 18) ^ (words[index - 15] >>> 3)) >>> 0;
        const s1 = (rotr(words[index - 2], 17) ^ rotr(words[index - 2], 19) ^ (words[index - 2] >>> 10)) >>> 0;
        words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = hash;
      for (let index = 0; index < 64; index += 1) {
        const s1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
        const ch = ((e & f) ^ (~e & g)) >>> 0;
        const temp1 = (h + s1 + ch + constants[index] + words[index]) >>> 0;
        const s0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
        const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        const temp2 = (s0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      [a, b, c, d, e, f, g, h].forEach((value, index) => {
        hash[index] = (hash[index] + value) >>> 0;
      });
    }
    return hash.map((value) => value.toString(16).padStart(8, "0")).join("");
  }

  function normalizeBoxCode(value) {
    return String(value || "").trim();
  }

  async function matchingBoxCode(value, hash) {
    if (!hash) return null;
    const raw = String(value || "");
    const normalized = normalizeBoxCode(raw);
    if (await sha256(normalized) === hash) return normalized;
    if (raw !== normalized && await sha256(raw) === hash) return raw;
    return null;
  }

  async function boxCodeMatches(value, hash) {
    return (await matchingBoxCode(value, hash)) !== null;
  }

  function cryptoSubtle() {
    return window.crypto?.subtle || null;
  }

  function bytesToBase64(bytes) {
    let binary = "";
    const chunk = 0x8000;
    for (let index = 0; index < bytes.length; index += chunk) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
    }
    return btoa(binary);
  }

  function base64ToBytes(value) {
    const binary = atob(String(value || ""));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }

  async function deriveBoxKey(code, saltBase64) {
    const subtle = cryptoSubtle();
    if (!subtle) return null;
    const material = await subtle.importKey("raw", new TextEncoder().encode(String(code || "")), "PBKDF2", false, ["deriveKey"]);
    return subtle.deriveKey(
      { name: "PBKDF2", salt: base64ToBytes(saltBase64), iterations: 310000, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  async function encryptBoxPayload(cryptoEntry, payloadJson) {
    const subtle = cryptoSubtle();
    if (!subtle || !cryptoEntry?.key) return null;
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const data = await subtle.encrypt({ name: "AES-GCM", iv }, cryptoEntry.key, new TextEncoder().encode(payloadJson));
    return {
      v: 1,
      salt: cryptoEntry.salt,
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(data)),
    };
  }

  async function decryptBoxBlob(code, blob) {
    const subtle = cryptoSubtle();
    if (!subtle || !blob?.data || !blob?.iv || !blob?.salt) return null;
    const key = await deriveBoxKey(code, blob.salt);
    if (!key) return null;
    const data = await subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(blob.iv) }, key, base64ToBytes(blob.data));
    return { key, payloadJson: new TextDecoder().decode(data) };
  }

  function protectedBoxPayload(box) {
    return {
      root: box.root,
      activeItemId: box.activeItemId || "",
      selectedIds: box.selectedIds || [],
      expandedIds: box.expandedIds || [],
      viewMode: box.viewMode || "tree",
      sortMode: box.sortMode || "custom",
      customSortActive: !!box.customSortActive,
      iconFolderId: box.iconFolderId || "",
      searchQuery: box.searchQuery || "",
      bookmarkedIds: box.bookmarkedIds || [],
      openTabIds: box.openTabIds || [],
    };
  }

  function setupBoxEncryption(boxId, code) {
    const subtle = cryptoSubtle();
    if (!subtle) return false;
    const salt = bytesToBase64(window.crypto.getRandomValues(new Uint8Array(16)));
    runtime.boxCrypto.set(boxId, { key: null, salt, blob: null, lastPayload: null, pendingCode: String(code || "") });
    return true;
  }

  async function ensureBoxCryptoKey(cryptoEntry) {
    if (!cryptoEntry) return null;
    if (!cryptoEntry.key && cryptoEntry.pendingCode !== undefined) {
      cryptoEntry.key = await deriveBoxKey(cryptoEntry.pendingCode, cryptoEntry.salt);
      delete cryptoEntry.pendingCode;
    }
    return cryptoEntry.key;
  }

  async function unlockProtectedBox(box, code) {
    try {
      if (box.encrypted?.data) {
        const opened = await decryptBoxBlob(code, box.encrypted);
        if (!opened) return false;
        const payload = JSON.parse(opened.payloadJson);
        Object.assign(box, payload);
        normalizeUnlockedBoxShape(box);
        runtime.boxCrypto.set(box.id, { key: opened.key, salt: box.encrypted.salt, blob: box.encrypted, lastPayload: null });
        return true;
      }
      if (!box.root) return false;
      return setupBoxEncryption(box.id, code);
    } catch (error) {
      console.warn("MindSet box decryption failed", error);
      return false;
    }
  }

  function stripProtectedBoxPlaintext(box, blob) {
    const keep = {
      id: box.id,
      name: box.name,
      passwordHash: box.passwordHash,
      createdAt: box.createdAt,
      modifiedAt: box.modifiedAt,
      encrypted: blob,
    };
    Object.keys(box).forEach((key) => delete box[key]);
    Object.assign(box, keep);
  }

  function boxForDisk(box) {
    if (!box.passwordHash) {
      if (!("encrypted" in box)) return box;
      const { encrypted, ...rest } = box;
      return rest;
    }
    const cryptoEntry = runtime.boxCrypto.get(box.id);
    const blob = cryptoEntry?.blob || box.encrypted || null;
    if (!blob) return box;
    return {
      id: box.id,
      name: box.name,
      passwordHash: box.passwordHash,
      createdAt: box.createdAt,
      modifiedAt: box.modifiedAt,
      encrypted: blob,
    };
  }

  function persistState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, boxes: state.boxes.map(boxForDisk) }));
  }

  function needsEncryptionPass() {
    return state.boxes.some((box) => box.passwordHash && box.root && runtime.boxCrypto.has(box.id));
  }

  function scheduleProtectedBoxEncryption() {
    if (!needsEncryptionPass()) return;
    window.clearTimeout(runtime.encryptTimer);
    runtime.encryptTimer = window.setTimeout(() => {
      runProtectedBoxEncryption();
    }, 150);
  }

  async function encryptUnlockedBoxNow(box) {
    const cryptoEntry = runtime.boxCrypto.get(box.id);
    if (!box.passwordHash || !box.root || !cryptoEntry) return null;
    if (!(await ensureBoxCryptoKey(cryptoEntry))) return null;
    const payloadJson = JSON.stringify(protectedBoxPayload(box));
    if (cryptoEntry.blob && cryptoEntry.lastPayload === payloadJson) return cryptoEntry.blob;
    const blob = await encryptBoxPayload(cryptoEntry, payloadJson);
    if (!blob) return null;
    cryptoEntry.blob = blob;
    cryptoEntry.lastPayload = payloadJson;
    box.encrypted = blob;
    return blob;
  }

  async function runProtectedBoxEncryption() {
    if (runtime.encryptRunning) {
      scheduleProtectedBoxEncryption();
      return;
    }
    runtime.encryptRunning = true;
    try {
      let changed = false;
      for (const box of state.boxes) {
        if (!box.passwordHash || !box.root || !runtime.boxCrypto.has(box.id)) continue;
        const before = runtime.boxCrypto.get(box.id)?.blob;
        const blob = await encryptUnlockedBoxNow(box);
        if (blob && blob !== before) changed = true;
      }
      if (changed) persistState();
    } catch (error) {
      console.warn("MindSet box encryption failed", error);
    } finally {
      runtime.encryptRunning = false;
    }
  }

  function modalError(message) {
    runtime.modal = runtime.modal ? { ...runtime.modal, error: message } : runtime.modal;
    render();
  }

  function paintToast() {
    const existing = app.querySelector(".toast");
    if (!runtime.toast) {
      existing?.remove();
      return;
    }
    if (existing) {
      existing.textContent = runtime.toast;
      return;
    }
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = runtime.toast;
    app.appendChild(toast);
  }

  function setToast(message) {
    runtime.toast = message;
    paintToast();
    window.clearTimeout(setToast.timer);
    setToast.timer = window.setTimeout(() => {
      runtime.toast = "";
      paintToast();
    }, 2400);
  }

  function closeBoxMenuLightly() {
    if (!runtime.boxMenuOpen) return;
    runtime.boxMenuOpen = false;
    app.querySelector("[data-box-menu]")?.remove();
    const switcherButton = app.querySelector(".box-switcher-main");
    switcherButton?.setAttribute("aria-expanded", "false");
    app.querySelector(".box-chevron.is-open")?.classList.remove("is-open");
  }

  function desktopBridge() {
    return window.mindsetDesktop || null;
  }

  function normalizeDesktopUpdateStatus(payload = {}) {
    const status = String(payload.status || "idle");
    const percent = Number.isFinite(Number(payload.percent)) ? Number(payload.percent) : null;
    const messages = {
      idle: "Aucune recherche lancee.",
      checking: "Recherche d'une mise a jour...",
      available: "Mise a jour trouvee. Tu peux la telecharger.",
      downloading: percent === null ? "Telechargement en cours..." : `Telechargement : ${Math.round(percent)}%`,
      downloaded: "Mise a jour prete a installer.",
      "not-available": "MindSet est deja a jour.",
      development: "Les mises a jour se testent dans l'application installee.",
      installing: "Installation de la mise a jour...",
      error: "Impossible de verifier les mises a jour.",
    };
    return {
      status,
      percent,
      version: payload.version || "",
      message: payload.message || messages[status] || messages.idle,
    };
  }

  function updateBusy(status) {
    return ["checking", "downloading", "installing"].includes(status);
  }

  function updateCanCheck(status, desktopReady) {
    return desktopReady && !updateBusy(status);
  }

  function updateCanDownload(status, desktopReady) {
    return desktopReady && ["available", "download-error"].includes(status);
  }

  function updateCanInstall(status, desktopReady) {
    return desktopReady && status === "downloaded";
  }

  function updateProgressValue(updateStatus) {
    if (updateStatus.status === "downloaded") return 100;
    if (updateStatus.status !== "downloading") return 0;
    return Math.min(Math.max(Math.round(updateStatus.percent ?? 0), 0), 100);
  }

  function paintUpdateStatus() {
    const panel = app.querySelector("[data-update-panel]");
    if (!panel) return false;
    const desktopReady = !!desktopBridge()?.isDesktop;
    const updateStatus = normalizeDesktopUpdateStatus(runtime.updateStatus);
    const progress = updateProgressValue(updateStatus);

    panel.dataset.updateStatus = updateStatus.status;
    const message = panel.querySelector("[data-update-message]");
    if (message) message.textContent = updateStatus.message;

    const version = panel.querySelector("[data-update-version]");
    if (version) {
      version.textContent = updateStatus.version ? `Version ${updateStatus.version}` : "";
      version.hidden = !updateStatus.version;
    }

    const progressBar = panel.querySelector("[data-update-progress-bar]");
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute("aria-valuenow", String(progress));
    }

    const progressText = panel.querySelector("[data-update-progress-text]");
    if (progressText) {
      progressText.textContent = updateStatus.status === "downloading" || updateStatus.status === "downloaded"
        ? `${progress}%`
        : "En attente";
    }

    const check = panel.querySelector('[data-action="check-updates"]');
    const download = panel.querySelector('[data-action="download-update"]');
    const install = panel.querySelector('[data-action="install-update"]');
    if (check) check.disabled = !updateCanCheck(updateStatus.status, desktopReady);
    if (download) download.disabled = !updateCanDownload(updateStatus.status, desktopReady);
    if (install) install.disabled = !updateCanInstall(updateStatus.status, desktopReady);
    return true;
  }

  function setUpdateStatus(payload) {
    runtime.updateStatus = normalizeDesktopUpdateStatus(payload);
    paintUpdateStatus();
  }

  async function runDesktopUpdateAction(kind) {
    const bridge = desktopBridge();
    if (!bridge?.isDesktop) {
      setUpdateStatus({ status: "development", message: "Les mises a jour seront disponibles dans l'app Windows installee." });
      return;
    }

    const methodByKind = {
      check: "checkForUpdates",
      download: "downloadUpdate",
      install: "installUpdate",
    };
    const method = methodByKind[kind];
    if (!method || typeof bridge[method] !== "function") return;

    if (kind === "check") setUpdateStatus({ status: "checking" });
    if (kind === "download") setUpdateStatus({ status: "downloading" });
    if (kind === "install") setUpdateStatus({ status: "installing" });

    try {
      const result = await bridge[method]();
      if (result) setUpdateStatus(result);
    } catch (error) {
      setUpdateStatus({ status: "error", message: error?.message || "Erreur de mise a jour." });
    }
  }

  function bindDesktopUpdates() {
    const bridge = desktopBridge();
    if (!bridge?.onUpdateStatus) return;
    bridge.onUpdateStatus((payload) => {
      setUpdateStatus(payload);
    });
  }

  function setActiveItem(box, id, event) {
    cancelDeferredEditorWork({ suppressIdleMs: 350 });
    box.activeItemId = id;
    runtime.focusedItemId = id;
    if (!Array.isArray(box.openTabIds)) box.openTabIds = [];
    if (!box.openTabIds.includes(id)) box.openTabIds.push(id);
    if (id === box.root.id) {
      box.selectedIds = [];
      runtime.selectionAnchorId = null;
      pushNavigationPoint();
      saveState();
      render();
      return;
    }
    if (event?.shiftKey) {
      const range = selectionRangeIds(box, runtime.selectionAnchorId || box.selectedIds?.[0] || id, id);
      if (event.ctrlKey || event.metaKey) {
        box.selectedIds = [...new Set([...(box.selectedIds || []), ...range])];
      } else {
        box.selectedIds = range;
      }
    } else if (event && (event.ctrlKey || event.metaKey)) {
      const set = new Set(box.selectedIds || []);
      set.has(id) ? set.delete(id) : set.add(id);
      box.selectedIds = [...set];
      runtime.selectionAnchorId = id;
    } else {
      box.selectedIds = [id];
      runtime.selectionAnchorId = id;
    }
    pushNavigationPoint();
    saveState();
    render();
  }

  function clearSelection(box) {
    box.selectedIds = [];
    runtime.selectionAnchorId = null;
    runtime.focusedItemId = null;
    runtime.contextMenu = null;
    saveState();
    render();
  }

  function openItemFromGraph(box, id) {
    const item = findItem(box, id);
    if (!box || !item || item.id === box.root.id) return;
    runtime.contextMenu = null;
    setModal(null);
    box.activeItemId = item.id;
    box.selectedIds = [item.id];
    runtime.selectionAnchorId = item.id;
    runtime.focusedItemId = item.id;
    if (item.type === "folder") {
      const set = new Set(box.expandedIds || []);
      set.add(item.id);
      box.expandedIds = [...set];
    }
    if (!Array.isArray(box.openTabIds)) box.openTabIds = [];
    if (!box.openTabIds.includes(item.id)) box.openTabIds.push(item.id);
    pushNavigationPoint();
    saveState();
    render();
  }

  function visibleItemIds() {
    const scope = graphViewVisible() ? app.querySelector("[data-graph-canvas]") || app : app;
    return [...scope.querySelectorAll(".tree-row[data-item-id], .list-row[data-item-id], .folder-card[data-item-id], .folder-tile[data-item-id], .graph-node[data-item-id]")]
      .map((element) => element.dataset.itemId)
      .filter(Boolean);
  }

  function selectionRangeIds(box, fromId, toId) {
    const visible = visibleItemIds().filter((id) => findItem(box, id));
    const fallback = allItems(box).map(({ node }) => node.id);
    const ids = visible.length ? visible : fallback;
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return [toId].filter(Boolean);
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    return ids.slice(start, end + 1).filter((id) => id !== box.root.id);
  }

  function moveKeyboardSelection(box, direction, event) {
    const ids = visibleItemIds().filter((id) => id !== box.root.id && findItem(box, id));
    if (!ids.length) return;
    const currentId = runtime.focusedItemId || box.selectedIds?.[box.selectedIds.length - 1] || box.activeItemId;
    const currentIndex = Math.max(ids.indexOf(currentId), 0);
    const nextIndex = Math.min(Math.max(currentIndex + direction, 0), ids.length - 1);
    const nextId = ids[nextIndex];
    if (!nextId) return;

    event.preventDefault();
    box.activeItemId = nextId;
    runtime.focusedItemId = nextId;
    if (!Array.isArray(box.openTabIds)) box.openTabIds = [];
    if (!box.openTabIds.includes(nextId)) box.openTabIds.push(nextId);

    if (event.shiftKey) {
      const anchor = runtime.selectionAnchorId || box.selectedIds?.[0] || currentId || nextId;
      const range = selectionRangeIds(box, anchor, nextId);
      box.selectedIds = event.ctrlKey || event.metaKey
        ? [...new Set([...(box.selectedIds || []), ...range])]
        : range;
    } else {
      box.selectedIds = [nextId];
      runtime.selectionAnchorId = nextId;
    }

    saveState();
    render();
    requestAnimationFrame(() => {
      document.querySelector(`[data-item-id="${CSS.escape(nextId)}"]`)?.scrollIntoView({ block: "nearest" });
    });
  }

  function selectableElements(surface) {
    return [...surface.querySelectorAll(".tree-row[data-item-id], .list-row[data-item-id], .folder-card[data-item-id], .folder-tile[data-item-id], .graph-node[data-item-id]")]
      .filter((element) => findItem(activeBox(), element.dataset.itemId));
  }

  function intersectsRect(a, b) {
    return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
  }

  function normalizedRect(startX, startY, currentX, currentY) {
    return {
      left: Math.min(startX, currentX),
      top: Math.min(startY, currentY),
      right: Math.max(startX, currentX),
      bottom: Math.max(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY),
    };
  }

  function startMarqueeSelection(event, surface) {
    const box = activeBox();
    if (!box || event.button !== 0) return;
    if (event.target.closest("[data-item-id], button, input, select, textarea, [contenteditable='true']")) return;

    const overlay = document.createElement("div");
    overlay.className = "selection-marquee";
    overlay.hidden = true;
    document.body.appendChild(overlay);
    document.body.classList.add("is-marquee-selecting");

    const startX = event.clientX;
    const startY = event.clientY;
    const baseSelection = (event.ctrlKey || event.metaKey) ? new Set(box.selectedIds || []) : new Set();
    const items = selectableElements(surface);
    let moved = false;
    let nextSelection = [...baseSelection].filter((id) => id !== box.root.id);

    const paintSelection = (ids) => {
      const selected = new Set(ids);
      items.forEach((item) => {
        const selectedNow = selected.has(item.dataset.itemId);
        item.classList.toggle("is-selected", selectedNow);
        item.classList.toggle("is-marquee-selected", selectedNow);
      });
    };

    const update = (pointerEvent) => {
      const rect = normalizedRect(startX, startY, pointerEvent.clientX, pointerEvent.clientY);
      moved = moved || rect.width > 4 || rect.height > 4;
      overlay.hidden = !moved;
      overlay.style.left = `${rect.left}px`;
      overlay.style.top = `${rect.top}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;

      if (!moved) return;
      const selected = new Set(baseSelection);
      items.forEach((item) => {
        const id = item.dataset.itemId;
        if (id !== box.root.id && intersectsRect(rect, item.getBoundingClientRect())) selected.add(id);
      });
      nextSelection = [...selected].filter((id) => id !== box.root.id);
      box.selectedIds = nextSelection;
      paintSelection(nextSelection);
    };

    const cleanup = () => {
      overlay.remove();
      document.body.classList.remove("is-marquee-selecting");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
      runtime.marquee = null;
    };

    const finish = (pointerEvent) => {
      update(pointerEvent);
      cleanup();
      runtime.ignoreSurfaceClick = true;
      window.setTimeout(() => {
        runtime.ignoreSurfaceClick = false;
      }, 0);

      if (!moved) nextSelection = [];
      box.selectedIds = nextSelection;
      runtime.contextMenu = null;
      saveState();
      render();
    };

    const cancel = () => {
      cleanup();
      paintSelection([...baseSelection]);
      box.selectedIds = [...baseSelection].filter((id) => id !== box.root.id);
    };

    const move = (pointerEvent) => {
      pointerEvent.preventDefault();
      update(pointerEvent);
    };

    runtime.marquee = { surface };
    event.preventDefault();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, { once: true });
    window.addEventListener("pointercancel", cancel, { once: true });
  }

  function closeTab(box, id) {
    box.openTabIds = (box.openTabIds || []).filter((tabId) => tabId !== id);
    if (!box.openTabIds.length) box.openTabIds = [box.root.id];
    if (box.activeItemId === id) {
      box.activeItemId = box.openTabIds[box.openTabIds.length - 1] || box.root.id;
      box.selectedIds = box.activeItemId === box.root.id ? [] : [box.activeItemId];
      pushNavigationPoint();
    }
    saveState();
    render();
  }

  function ensureQuickFolder(box) {
    let folder = box.root.children.find((item) => item.type === "folder" && item.title === "Notes rapides");
    if (!folder) {
      folder = {
        id: uid("folder"),
      type: "folder",
      title: "Notes rapides",
      iconKind: "none",
      createdAt: now(),
        modifiedAt: now(),
        children: [],
      };
      box.root.children.unshift(folder);
      box.expandedIds.push(folder.id);
    }
    return folder;
  }

  function createNote(box, folder = creationFolder(box), quick = false) {
    const createdAt = now();
    rememberState("Creation de note");
    const note = {
      id: uid("note"),
      type: "note",
      title: quick ? `Note rapide ${new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date())}` : "Nouvelle note",
      iconKind: "none",
      createdAt,
      modifiedAt: createdAt,
      content: quick
        ? "<h2>Note rapide</h2><p></p>"
        : "<h1>Nouveau titre</h1><p>Commence à écrire ici.</p>",
    };
    folder.children.push(note);
    folder.modifiedAt = createdAt;
    box.activeItemId = note.id;
    box.selectedIds = [note.id];
    if (!Array.isArray(box.openTabIds)) box.openTabIds = [];
    if (!box.openTabIds.includes(note.id)) box.openTabIds.push(note.id);
    if (!box.expandedIds.includes(folder.id)) box.expandedIds.push(folder.id);
    touchBox(box);
    pushNavigationPoint();
    saveState();
    render();
    requestAnimationFrame(() => document.querySelector("[data-note-editor]")?.focus());
  }

  function createFolder(box) {
    const folder = creationFolder(box);
    const createdAt = now();
    rememberState("Creation de dossier");
    const previousActiveId = box.activeItemId || box.root.id;
    const previousSelectedIds = [...(box.selectedIds || [])];
    const child = {
      id: uid("folder"),
      type: "folder",
      title: "Nouveau dossier",
      iconKind: "none",
      createdAt,
      modifiedAt: createdAt,
      children: [],
    };
    folder.children.push(child);
    folder.modifiedAt = createdAt;
    box.activeItemId = previousActiveId;
    box.selectedIds = previousSelectedIds.filter((id) => findItem(box, id));
    if (!box.expandedIds.includes(folder.id)) box.expandedIds.push(folder.id);
    touchBox(box);
    saveState();
    render();
  }

  function setItemIcon(box, id, kind, emoji = "") {
    const item = findItem(box, id);
    if (!item || item.id === box.root.id) return;
    rememberState("Icone");
    item.iconKind = kind;
    item.emoji = kind === "emoji" ? emoji || emojiChoices[0] : "";
    item.modifiedAt = now();
    touchBox(box);
    runtime.contextMenu = null;
    saveState();
    render();
  }

  function switchBoxById(id) {
    const target = state.boxes.find((item) => item.id === id);
    if (!target) return;
    cancelDeferredEditorWork({ suppressIdleMs: 650 });
    runtime.editorRange = null;
    runtime.contextMenu = null;
    runtime.boxMenuOpen = false;
    if (target.passwordHash && (!runtime.unlockedBoxIds.has(target.id) || !target.root)) {
      setModal({ type: "unlock-box", boxId: target.id });
    } else {
      openUnlockedBox(target);
      return;
    }
    saveState();
    render();
  }

  function openUnlockedBox(box, options = {}) {
    if (!box?.root) return;
    cancelDeferredEditorWork({ suppressIdleMs: 650 });
    runtime.editorRange = null;
    runtime.contextMenu = null;
    runtime.boxMenuOpen = false;
    state.currentBoxId = box.id;
    runtime.unlockedBoxIds.add(box.id);
    if (!findItem(box, box.activeItemId)) box.activeItemId = box.root.id;
    if (!Array.isArray(box.openTabIds)) box.openTabIds = [];
    if (box.activeItemId && !box.openTabIds.includes(box.activeItemId)) box.openTabIds.push(box.activeItemId);
    if (!box.openTabIds.length) box.openTabIds = [box.root.id];
    if (!Array.isArray(box.expandedIds)) box.expandedIds = [box.root.id];
    if (!box.expandedIds.includes(box.root.id)) box.expandedIds.unshift(box.root.id);
    setModal(null);
    saveState();
    pushNavigationPoint();
    render();
    if (options.focusEditor) {
      requestAnimationFrame(() => document.querySelector("[data-note-editor]")?.focus({ preventScroll: true }));
    }
  }

  function openBoxProtectedAction(boxId, intent) {
    const target = state.boxes.find((item) => item.id === boxId);
    if (!target) return;
    runtime.contextMenu = null;
    if (target.passwordHash && ["rename", "delete"].includes(intent)) {
      setModal({ type: "box-auth", boxId, intent });
      render();
      return;
    }
    openBoxActionAfterAuth(boxId, intent);
  }

  function openBoxActionAfterAuth(boxId, intent) {
    const target = state.boxes.find((item) => item.id === boxId);
    if (!target) return;
    runtime.contextMenu = null;
    if (intent === "rename") {
      setModal({ type: "rename-box", boxId });
    } else if (intent === "delete") {
      setModal({ type: "confirm-delete-box-first", boxId });
    } else if (intent === "add-password") {
      setModal({ type: "box-password", boxId, mode: "add" });
    } else if (intent === "change-password") {
      setModal({ type: "box-password", boxId, mode: "change" });
    }
    render();
  }

  async function lockBox(boxId) {
    const target = state.boxes.find((item) => item.id === boxId);
    if (!target?.passwordHash) return;
    if (target.root && runtime.boxCrypto.has(boxId)) {
      try {
        await encryptUnlockedBoxNow(target);
      } catch (error) {
        console.warn("MindSet lock encryption failed", error);
      }
    }
    const blob = runtime.boxCrypto.get(boxId)?.blob || target.encrypted || null;
    if (blob) {
      stripProtectedBoxPlaintext(target, blob);
      runtime.noteHistories.clear();
      runtime.undoStack = [];
      runtime.redoStack = [];
    }
    runtime.boxCrypto.delete(boxId);
    runtime.unlockedBoxIds.delete(boxId);
    if (state.currentBoxId === boxId) state.currentBoxId = null;
    pushNavigationPoint();
    saveState();
    render();
  }

  function reorderBoxes(draggedId, targetId, position) {
    if (!draggedId || !targetId || draggedId === targetId) return;
    const fromIndex = state.boxes.findIndex((box) => box.id === draggedId);
    const initialTargetIndex = state.boxes.findIndex((box) => box.id === targetId);
    if (fromIndex < 0 || initialTargetIndex < 0) return;
    rememberState("Deplacement de boite");
    const [dragged] = state.boxes.splice(fromIndex, 1);
    let targetIndex = state.boxes.findIndex((box) => box.id === targetId);
    if (position === "after") targetIndex += 1;
    state.boxes.splice(targetIndex, 0, dragged);
    saveState();
    render();
  }

  function boxCardDropPosition(event, card) {
    const rect = card.getBoundingClientRect();
    return event.clientX < rect.left + rect.width / 2 ? "before" : "after";
  }

  function deleteBoxById(boxId) {
    const target = state.boxes.find((item) => item.id === boxId);
    if (!target) return;
    rememberState("Suppression de boite");
    state.boxes = state.boxes.filter((box) => box.id !== boxId);
    runtime.unlockedBoxIds.delete(boxId);
    if (state.currentBoxId === boxId) state.currentBoxId = null;
    runtime.contextMenu = null;
    setModal(null);
    pushNavigationPoint();
    saveState();
    render();
  }

  function updateHeadingPreset(level, field, value) {
    if (!["normal", "h1", "h2", "h3"].includes(level)) return;
    state.settings.headingPresets = state.settings.headingPresets || {};
    state.settings.headingPresets[level] = {
      ...headingDefaults[level],
      ...(state.settings.headingPresets[level] || {}),
      [field]: value,
    };
    saveState();
    applyAppearance();
  }

  function requestDeleteSelected(box) {
    const ids = (box.selectedIds || []).filter((id) => id !== box.root.id && findItem(box, id));
    requestDeleteItems(box, ids);
  }

  function requestDeleteItems(box, idsToDelete = [], options = {}) {
    const ids = [...new Set(idsToDelete)]
      .filter((id) => id !== box.root.id && findItem(box, id));
    if (!ids.length) return;
    setModal({
      type: "confirm-delete",
      ids,
      returnToGraph: options.returnToGraph || graphViewVisible(),
    });
    render();
  }

  function deleteSelected(box, idsToDelete = box.selectedIds || []) {
    const ids = new Set(idsToDelete.filter((id) => id !== box.root.id));
    if (!ids.size) return;
    rememberState("Suppression");
    const affectedIds = new Set(ids);
    ids.forEach((id) => {
      const item = findItem(box, id);
      if (item) walk(item, (node) => affectedIds.add(node.id));
    });
    const deletesItem = (id) => affectedIds.has(id);

    function removeFrom(folder) {
      folder.children = folder.children.filter((child) => !ids.has(child.id));
      folder.children.forEach((child) => {
        if (child.type === "folder") removeFrom(child);
      });
    }

    removeFrom(box.root);
    box.openTabIds = (box.openTabIds || []).filter((id) => !deletesItem(id));
    if (!box.openTabIds.length) box.openTabIds = [box.root.id];
    if (deletesItem(box.activeItemId)) {
      box.activeItemId = box.root.id;
    }
    if (deletesItem(box.iconFolderId)) {
      box.iconFolderId = box.root.id;
    }
    box.selectedIds = [];
    runtime.modal = runtime.modal?.returnToGraph ? { type: "graph-full" } : null;
    touchBox(box);
    saveState();
    render();
  }

  function topLevelItemIds(box, ids = []) {
    const uniqueIds = [...new Set(ids)]
      .filter((id) => id && id !== box.root.id && findItem(box, id));
    const selected = new Set(uniqueIds);
    return uniqueIds.filter((id) => {
      let parent = findParent(box, id);
      while (parent && parent.id !== box.root.id) {
        if (selected.has(parent.id)) return false;
        parent = findParent(box, parent.id);
      }
      return true;
    });
  }

  function cloneItemTree(item, options = {}) {
    const timestamp = options.timestamp || now();
    const clone = {
      id: uid(item.type),
      type: item.type,
      title: options.prefixTitle ? `Copie - ${item.title}` : item.title,
      iconKind: item.iconKind || "none",
      emoji: item.emoji || "",
      createdAt: timestamp,
      modifiedAt: timestamp,
    };
    if (item.type === "folder") {
      clone.children = (item.children || []).map((child) => cloneItemTree(child, { timestamp }));
    } else {
      clone.content = item.content || "<p><br></p>";
    }
    return clone;
  }

  function selectItemsAfterInsert(box, items, parent) {
    const ids = items.map((item) => item.id);
    box.selectedIds = ids;
    box.activeItemId = ids[0] || box.root.id;
    runtime.selectionAnchorId = ids[0] || null;
    runtime.focusedItemId = ids[0] || null;
    if (!Array.isArray(box.openTabIds)) box.openTabIds = [];
    if (ids[0] && !box.openTabIds.includes(ids[0])) box.openTabIds.push(ids[0]);
    if (parent?.id && !box.expandedIds.includes(parent.id)) box.expandedIds.push(parent.id);
  }

  function duplicateItems(box, idsToDuplicate = box.selectedIds || []) {
    const ids = topLevelItemIds(box, idsToDuplicate);
    if (!ids.length) return false;
    rememberState("Duplication");
    const timestamp = now();
    const clones = [];
    ids.forEach((id) => {
      const item = findItem(box, id);
      const parent = findParent(box, id);
      if (!item || !parent?.children) return;
      const clone = cloneItemTree(item, { prefixTitle: true, timestamp });
      const index = parent.children.findIndex((child) => child.id === id);
      parent.children.splice(index >= 0 ? index + 1 : parent.children.length, 0, clone);
      parent.modifiedAt = timestamp;
      clones.push(clone);
    });
    if (!clones.length) return false;
    selectItemsAfterInsert(box, clones, findParent(box, clones[0].id));
    runtime.contextMenu = null;
    touchBox(box);
    saveState();
    render();
    return true;
  }

  function copySelectedItems(box, mode = "copy") {
    const ids = topLevelItemIds(box, box.selectedIds || []);
    if (!ids.length) {
      setToast("Selectionne un dossier ou une note.");
      return false;
    }
    const hadCutClipboard = runtime.itemClipboard?.mode === "cut";
    runtime.itemClipboard = {
      mode: mode === "cut" ? "cut" : "copy",
      boxId: box.id,
      ids,
    };
    setToast(mode === "cut" ? "Selection coupee." : "Selection copiee.");
    if (mode === "cut" || hadCutClipboard) render();
    return true;
  }

  function isItemCut(box, id) {
    const clipboard = runtime.itemClipboard;
    return clipboard?.mode === "cut" && clipboard.boxId === box?.id && (clipboard.ids || []).includes(id);
  }

  function pasteItemClipboard(box) {
    const clipboard = runtime.itemClipboard;
    if (!clipboard?.ids?.length) {
      setToast("Rien a coller.");
      return false;
    }
    const sourceBox = state.boxes.find((item) => item.id === clipboard.boxId);
    const target = creationFolder(box);
    if (!sourceBox || !target?.children) {
      setToast("Impossible de coller ici.");
      return false;
    }

    if (clipboard.mode === "cut") {
      if (sourceBox.id !== box.id) {
        setToast("Le deplacement entre boites n'est pas encore disponible.");
        return false;
      }
      const moved = moveItemsToFolder(box, clipboard.ids, target.id);
      if (moved) {
        runtime.itemClipboard = null;
        render();
      } else {
        setToast("Impossible de deplacer ici.");
      }
      return moved;
    }

    const ids = topLevelItemIds(sourceBox, clipboard.ids);
    const timestamp = now();
    const clones = ids
      .map((id) => findItem(sourceBox, id))
      .filter(Boolean)
      .map((item) => cloneItemTree(item, { prefixTitle: true, timestamp }));
    if (!clones.length) {
      setToast("Rien a coller.");
      return false;
    }

    rememberState("Collage");
    target.children.push(...clones);
    target.modifiedAt = timestamp;
    selectItemsAfterInsert(box, clones, target);
    touchBox(box);
    saveState();
    render();
    return true;
  }

  function isDescendant(box, parentId, childId) {
    const parent = findItem(box, parentId);
    let found = false;
    if (parent && parent.type === "folder") {
      walk(parent, (node) => {
        if (node.id === childId) found = true;
      });
    }
    return found;
  }

  function extractItem(box, id) {
    let extracted = null;
    function scan(folder) {
      const index = folder.children.findIndex((child) => child.id === id);
      if (index >= 0) {
        extracted = folder.children.splice(index, 1)[0];
        folder.modifiedAt = now();
        return;
      }
      folder.children.forEach((child) => {
        if (!extracted && child.type === "folder") scan(child);
      });
    }
    scan(box.root);
    return extracted;
  }

  function moveSelected(box, targetId) {
    const target = findItem(box, targetId);
    if (!target || target.type !== "folder") return;
    const ids = (box.selectedIds || []).filter((id) => id !== box.root.id && id !== targetId);
    const movableIds = ids.filter((id) => !isDescendant(box, id, targetId));
    if (!movableIds.length) return;
    rememberState("Deplacement");
    movableIds.forEach((id) => {
      const item = extractItem(box, id);
      if (item) target.children.push(item);
    });
    target.modifiedAt = now();
    if (!box.expandedIds.includes(target.id)) box.expandedIds.push(target.id);
    touchBox(box);
    saveState();
    render();
  }

  function moveItemsToFolder(box, ids, targetId) {
    const target = findItem(box, targetId);
    if (!target || target.type !== "folder") return false;
    const uniqueIds = [...new Set(ids)]
      .filter((id) => id && id !== box.root.id && id !== targetId)
      .filter((id) => findItem(box, id) && !isDescendant(box, id, targetId));
    if (!uniqueIds.length) return false;

    rememberState("Deplacement");
    const moved = [];
    uniqueIds.forEach((id) => {
      const item = extractItem(box, id);
      if (item) moved.push(item);
    });
    if (!moved.length) return false;

    target.children.push(...moved);
    target.modifiedAt = now();
    box.selectedIds = moved.map((item) => item.id);
    box.activeItemId = moved[0].id;
    runtime.selectionAnchorId = moved[0].id;
    runtime.focusedItemId = moved[0].id;
    if (!Array.isArray(box.openTabIds)) box.openTabIds = [];
    if (!box.openTabIds.includes(target.id)) box.openTabIds.push(target.id);
    if (!box.expandedIds.includes(target.id)) box.expandedIds.push(target.id);
    touchBox(box);
    saveState();
    render();
    return true;
  }

  function dropPosition(event, element) {
    const rect = element.getBoundingClientRect();
    const graphMap = element.closest?.(".graph-map");
    if (graphMap?.classList.contains("graph-up") || graphMap?.classList.contains("graph-down")) {
      return event.clientX < rect.left + rect.width / 2 ? "before" : "after";
    }
    return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
  }

  function treeDropZone(event, element) {
    const rect = element.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const edge = Math.min(Math.max(rect.height * 0.34, 8), 16);
    if (y <= edge) return "before";
    if (y >= rect.height - edge) return "after";
    return "into";
  }

  function itemDropIntent(event, element, box, target) {
    const draggedIds = runtime.dragIds?.length ? runtime.dragIds : [runtime.dragId];
    const canDropInto = target?.type === "folder"
      && !draggedIds.includes(target.id)
      && !draggedIds.some((id) => isDescendant(box, id, target.id));

    if (box.customSortActive && element.matches(".tree-row")) {
      const zone = canDropInto ? treeDropZone(event, element) : dropPosition(event, element);
      return zone === "into" ? { type: "into" } : { type: "reorder", position: zone };
    }

    if (canDropInto) return { type: "into" };
    if (box.customSortActive) return { type: "reorder", position: dropPosition(event, element) };
    return null;
  }

  function reorderItem(box, draggedId, targetId, position) {
    if (!draggedId || !targetId || draggedId === targetId) return;
    if (isDescendant(box, draggedId, targetId)) return;

    if (!findItem(box, draggedId) || !findParent(box, targetId)) return;
    rememberState("Reorganisation");
    const dragged = extractItem(box, draggedId);
    const targetParent = findParent(box, targetId);
    if (!dragged || !targetParent?.children) return;

    let targetIndex = targetParent.children.findIndex((child) => child.id === targetId);
    if (targetIndex < 0) {
      targetParent.children.push(dragged);
    } else {
      if (position === "after") targetIndex += 1;
      targetParent.children.splice(targetIndex, 0, dragged);
    }

    box.sortMode = "custom";
    box.customSortActive = true;
    targetParent.modifiedAt = now();
    touchBox(box);
    saveState();
    render();
  }

  function toggleExpand(box, id) {
    const set = new Set(box.expandedIds);
    set.has(id) ? set.delete(id) : set.add(id);
    box.expandedIds = [...set];
    saveState();
    render();
  }

  function expandAll(box, expand) {
    if (expand) {
      box.expandedIds = allItems(box, true)
        .filter(({ node }) => node.type === "folder")
        .map(({ node }) => node.id);
    } else {
      box.expandedIds = [box.root.id];
    }
    saveState();
    render();
  }

  function render() {
    removeImageToolbar();
    const previousModalType = runtime.modal?.type;
    const previousEditorFocus = captureNoteEditorFocus();
    const previousModalFocus = captureModalFieldFocus();
    const previousSettingsScroll = previousModalType === "settings"
      ? app.querySelector(".settings-modal .settings-content")?.scrollTop || 0
      : 0;
    applyAppearance();
    const box = activeBox();
    app.innerHTML = box ? renderApp(box) : renderLobby();
    bindEvents();
    bindGraphCanvas();
    bindTabMarquees();
    if (!restoreNoteEditorFocus(previousEditorFocus) && !restoreModalFieldFocus(previousModalFocus)) focusAutofocusTarget();
    if (previousModalType === "settings" && runtime.modal?.type === "settings") {
      requestAnimationFrame(() => {
        const body = app.querySelector(".settings-modal .settings-content");
        if (body) body.scrollTop = previousSettingsScroll;
      });
    }
  }

  function renderLobby() {
    return `
      <section class="lobby">
        <div class="lobby-inner">
          <div class="lobby-header">
            <div>
              <h1>MindSet</h1>
              <span class="lobby-count">${state.boxes.length} boite${state.boxes.length > 1 ? "s" : ""}</span>
              <p>Choisis une boîte ou crée un nouvel espace pour un projet, une idée, un cours ou une zone de vie.</p>
            </div>
            <button class="button" data-action="create-box-modal">${icon("plus")} Nouvelle boîte</button>
          </div>
          <div class="box-grid">
            ${state.boxes.map(renderBoxCardV2).join("")}
          </div>
        </div>
      </section>
      ${renderBoxContextMenu()}
      ${renderModal()}
      ${renderToast()}
    `;
  }

  function renderBoxCard(box) {
    const count = allItems(box).length;
    return `
      <article class="box-card">
        <div>
          <h2>${escapeHtml(box.name)}</h2>
          <p>${count} élément${count > 1 ? "s" : ""} · Modifiée le ${formatShortDate(box.modifiedAt)}</p>
        </div>
        <div class="box-card-footer">
          <span class="selection-count">${box.passwordHash ? `${icon("lock")} Protégée` : `${icon("unlock")} Libre`}</span>
          <button class="button" data-action="open-box" data-box-id="${box.id}">Ouvrir</button>
        </div>
      </article>
    `;
  }

  function renderBoxCardV2(box) {
    const count = allItems(box).length;
    const sealed = !box.root;
    const protectedBox = !!box.passwordHash;
    const unlocked = !protectedBox || (runtime.unlockedBoxIds.has(box.id) && !sealed);
    return `
      <article class="box-card" data-box-card-id="${box.id}" draggable="true">
        <button
          class="box-lock-button ${protectedBox ? "is-protected" : "is-open"} ${unlocked ? "is-unlocked" : "is-locked"}"
          type="button"
          data-action="box-lock-click"
          data-box-id="${box.id}"
          aria-label="${protectedBox ? (unlocked ? "Verrouiller la boite" : "Boite protegee") : "Ajouter un code"}"
          data-tooltip="${protectedBox ? (unlocked ? "Verrouiller" : "Protegee") : "Ajouter un code"}"
        >${icon(protectedBox && !unlocked ? "lock" : "unlock")}</button>
        <div>
          <h2>${escapeHtml(box.name)}</h2>
          <p>${sealed ? "Contenu chiffré" : `${count} element${count > 1 ? "s" : ""}`} - modifiee le ${formatShortDate(box.modifiedAt)}</p>
        </div>
        <div class="box-card-footer">
          <span class="box-protection-status ${protectedBox ? "is-protected" : "is-unprotected"}">${protectedBox ? (box.encrypted || sealed ? "Chiffré" : "Protégé") : "Non protégé"}</span>
          <button class="button" data-action="open-box" data-box-id="${box.id}">Ouvrir</button>
        </div>
      </article>
    `;
  }

  function renderApp(box) {
    const rightOpen = state.settings?.rightPanelOpen !== false;
    const leftOpen = state.settings?.leftPanelOpen !== false;
    return `
      <main class="app-shell ${rightOpen ? "" : "right-collapsed"} ${leftOpen ? "" : "left-collapsed"}">
        ${renderRail()}
        ${renderAppTabs(box, leftOpen)}
        ${leftOpen ? `<aside class="navigator">
          ${renderNavigator(box)}
        </aside>
        <div class="nav-resizer" data-nav-resizer title="Redimensionner"></div>` : ""}
        <section class="workspace">
          ${renderPathBar(box)}
          <div class="content-area">
            ${graphViewVisible() ? renderGraphView(box) : renderMainContent(box)}
          </div>
        </section>
        ${rightOpen ? `<aside class="inspector">${renderInspector(box)}</aside>` : ""}
      </main>
      ${renderContextMenu(box)}
      ${renderModal()}
      ${renderToast()}
    `;
  }

  function renderAppTabs(box, leftOpen = true) {
    const tabs = (box.openTabIds || [])
      .map((id) => findItem(box, id))
      .filter(Boolean);
    const activeId = box.activeItemId;
    return `
      <div class="app-tabs-bar">
        ${leftOpen ? `<div class="top-tabs" aria-label="Navigation principale">
          <button class="top-tab" data-action="show-lobby" data-tooltip="Accueil" aria-label="Accueil">${icon("home")}</button>
          <button class="top-tab ${runtime.sideTab === "explorer" ? "is-active" : ""}" data-action="show-explorer" data-tooltip="Explorateur de fichier" aria-label="Explorateur de fichier">${icon("folder")}</button>
          <button class="top-tab ${runtime.sideTab === "bookmarks" ? "is-active" : ""}" data-action="show-bookmarks" data-tooltip="Signets" aria-label="Signets">${icon("bookmark")}</button>
        </div>` : ""}
        <div class="history-tabs" aria-label="Historique">
          <button class="top-tab" data-action="history-back" data-tooltip="Revenir en arriere" aria-label="Revenir en arriere">${icon("arrowLeft")}</button>
          <button class="top-tab" data-action="history-forward" data-tooltip="Repartir en avant" aria-label="Repartir en avant">${icon("arrowRight")}</button>
        </div>
        <div class="tabs-strip" aria-label="Onglets ouverts">
          ${tabs.map((tab) => `
            <button class="doc-tab ${tab.id === activeId ? "is-active" : ""}" data-tab-id="${tab.id}" aria-label="${escapeHtml(tab.title)}">
              <span class="doc-tab-title"><span class="doc-tab-title-text">${escapeHtml(tab.title)}</span></span>
              <span class="tab-close" data-close-tab-id="${tab.id}" aria-label="Fermer">${icon("close")}</span>
            </button>
          `).join("")}
          <button class="new-tab-button" data-action="new-note" data-tooltip="Nouvelle note" aria-label="Nouvelle note">${icon("plus")}</button>
        </div>
        <div class="tabs-actions">
          <button class="tool-button" data-action="toggle-right-panel" data-tooltip="${state.settings?.rightPanelOpen === false ? "Ouvrir le panneau droit" : "Replier le panneau droit"}" aria-label="${state.settings?.rightPanelOpen === false ? "Ouvrir le panneau droit" : "Replier le panneau droit"}">${icon("sidebar")}</button>
        </div>
      </div>
    `;
  }

  function bindTabMarquees() {
    app.querySelectorAll(".doc-tab").forEach((tab) => {
      const title = tab.querySelector(".doc-tab-title");
      const text = tab.querySelector(".doc-tab-title-text");
      if (!title || !text) return;
      const overflow = Math.max(text.scrollWidth - title.clientWidth, 0);
      tab.classList.toggle("is-title-overflowing", overflow > 4);
      tab.style.setProperty("--tab-marquee-distance", `${overflow + 14}px`);
      tab.style.setProperty("--tab-marquee-duration", `${Math.min(Math.max(overflow / 18, 4), 10)}s`);
    });
  }

  function updateTabTitle(id, title) {
    app.querySelectorAll("[data-tab-id]").forEach((tab) => {
      if (tab.dataset.tabId !== id) return;
      tab.setAttribute("aria-label", title);
      const text = tab.querySelector(".doc-tab-title-text");
      if (text) text.textContent = title;
    });
    bindTabMarquees();
  }

  function renderPathBar(box) {
    const path = activePath(box);
    return `
      <div class="path-bar">
        ${path.map((item, index) => `
          <button class="path-part" data-item-id="${item.id}">
            <span>${escapeHtml(item.title)}</span>
          </button>
          ${index < path.length - 1 ? '<span class="path-separator">/</span>' : ""}
        `).join("")}
      </div>
    `;
  }

  function activePath(box) {
    const targetId = box.activeItemId || box.root.id;
    const path = [];
    function scan(node) {
      path.push(node);
      if (node.id === targetId) return true;
      if (node.type === "folder") {
        for (const child of node.children) {
          if (scan(child)) return true;
        }
      }
      path.pop();
      return false;
    }
    scan(box.root);
    return path.length ? path : [box.root];
  }

  function renderRail() {
    const graphActive = graphViewVisible();
    return `
      <nav class="rail" aria-label="Navigation MindSet">
        <button class="rail-button" data-action="toggle-left-panel" data-tooltip="${state.settings?.leftPanelOpen === false ? "Afficher le panneau gauche" : "Masquer le panneau gauche"}" aria-label="${state.settings?.leftPanelOpen === false ? "Afficher le panneau gauche" : "Masquer le panneau gauche"}">${icon("panel")}</button>
        <button class="rail-button" data-action="open-selector" data-tooltip="Sélecteur rapide" aria-label="Sélecteur rapide">${icon("search")}</button>
        <button class="rail-button ${graphActive ? "is-active" : ""}" data-action="toggle-graph" data-tooltip="Vue graphique" aria-label="Vue graphique">${icon("map")}</button>
        <button class="rail-button" data-action="quick-note" data-tooltip="Note rapide" aria-label="Note rapide">${icon("bolt")}</button>
        <button class="rail-button" data-action="toggle-theme" data-tooltip="${state.settings?.theme === "dark" ? "Mode clair" : "Mode sombre"}" aria-label="${state.settings?.theme === "dark" ? "Mode clair" : "Mode sombre"}">${icon(state.settings?.theme === "dark" ? "sun" : "moon")}</button>
      </nav>
    `;
  }

  function renderNavigator(box) {
    return `
      ${renderExplorerTools(box)}
      <div class="search-wrap">
        <div class="search-box">
          ${icon("search")}
          <input class="search-field" value="${escapeHtml(box.searchQuery || "")}" data-search placeholder="Recherche" />
        </div>
      </div>
      <div class="nav-scroll" data-marquee-surface>
        ${runtime.sideTab === "bookmarks" ? renderBookmarks(box) : renderNavigatorItems(box)}
      </div>
      ${renderBoxSwitcher(box)}
    `;
  }

  function renderExplorerTools(box) {
    const selected = (box.selectedIds || []).filter((id) => id !== box.root.id);
    return `
      <div class="explorer-tools ${runtime.explorerToolsOpen ? "" : "is-collapsed"}">
        <button class="tool-button" data-action="toggle-explorer-tools" data-tooltip="${runtime.explorerToolsOpen ? "Masquer les options" : "Afficher les options"}" aria-label="${runtime.explorerToolsOpen ? "Masquer les options" : "Afficher les options"}">${icon("panel")}</button>
        ${runtime.explorerToolsOpen ? `
          <button class="tool-button" data-action="new-note" data-tooltip="Nouvelle note" aria-label="Nouvelle note">${icon("notePlus")}</button>
          <button class="tool-button" data-action="new-folder" data-tooltip="Nouveau dossier" aria-label="Nouveau dossier">${icon("folderPlus")}</button>
          <label class="tool-button icon-select" data-tooltip="Trier" aria-label="Trier">
            ${icon("sort")}
            <select data-sort-mode aria-label="Trier">
              ${sortOptions().map((option) => `<option value="${option.value}" ${box.sortMode === option.value ? "selected" : ""}>${option.label}</option>`).join("")}
            </select>
          </label>
          <button class="tool-button ${box.customSortActive ? "is-active" : ""}" data-action="toggle-custom-sort" data-tooltip="${box.customSortActive ? "Désactiver le placement personnalisé" : "Activer le placement personnalisé"}" aria-label="${box.customSortActive ? "Désactiver le placement personnalisé" : "Activer le placement personnalisé"}">${icon("grip")}</button>
          <button class="tool-button" data-action="collapse-all" data-tooltip="Tout réduire" aria-label="Tout réduire">${icon("collapseIn")}</button>
          <button class="tool-button" data-action="expand-all" data-tooltip="Tout développer" aria-label="Tout développer">${icon("collapse")}</button>
          <span class="tool-separator"></span>
          <button class="tool-button ${box.viewMode === "tree" ? "is-active" : ""}" data-view-mode="tree" data-tooltip="Vue arbre" aria-label="Vue arbre">${icon("tree")}</button>
          <button class="tool-button ${box.viewMode === "list" ? "is-active" : ""}" data-view-mode="list" data-tooltip="Vue liste" aria-label="Vue liste">${icon("list")}</button>
          <button class="tool-button ${box.viewMode === "icons" ? "is-active" : ""}" data-view-mode="icons" data-tooltip="Vue icônes" aria-label="Vue icônes">${icon("grid")}</button>
        ` : ""}
        ${selected.length ? `
          <div class="selection-strip">
            <span>${selected.length}</span>
            <select class="move-select compact-move" data-move-target aria-label="Déplacer vers">
              ${folderOptions(box).map((folder) => `<option value="${folder.id}">${escapeHtml(folder.label)}</option>`).join("")}
            </select>
            <button class="tool-button" data-action="move-selected" data-tooltip="Déplacer" aria-label="Déplacer">${icon("move")}</button>
            <button class="tool-button danger" data-action="delete-selected" data-tooltip="Supprimer" aria-label="Supprimer">${icon("trash")}</button>
          </div>
        ` : ""}
      </div>
    `;
  }

  function renderBoxSwitcher(box) {
    return `
      <div class="box-switcher">
        <button class="box-switcher-main" type="button" data-action="toggle-box-menu" aria-expanded="${runtime.boxMenuOpen ? "true" : "false"}">
          <span class="item-icon">${icon("box")}</span>
          <div class="box-switcher-text">
            <strong>${escapeHtml(box.name)}</strong>
            <span>${allItems(box).length} éléments</span>
          </div>
          ${icon("chevron", runtime.boxMenuOpen ? "box-chevron is-open" : "box-chevron")}
        </button>
        ${runtime.boxMenuOpen ? `
          <div class="box-switcher-menu" data-box-menu>
            ${state.boxes.map((item) => `
              <button class="box-option ${item.id === box.id ? "is-active" : ""}" type="button" data-box-option="${item.id}">
                <span>${escapeHtml(item.name)}</span>
                <small>${item.root ? `${allItems(item).length} éléments` : "verrouillée"}</small>
              </button>
            `).join("")}
          </div>
        ` : ""}
        <button class="tool-button" data-action="create-box-modal" data-tooltip="Nouvelle boîte" aria-label="Nouvelle boîte">${icon("plus")}</button>
        <button class="tool-button" data-action="open-settings" data-tooltip="Paramètres" aria-label="Paramètres">${icon("settings")}</button>
      </div>
    `;
  }

  function renderNavigatorItems(box) {
    const query = (box.searchQuery || "").trim().toLowerCase();
    if (query) {
      const results = allItems(box).filter(({ node }) => node.title.toLowerCase().includes(query) || (node.content && stripHtml(node.content).toLowerCase().includes(query)));
      return results.length
        ? results.map(({ node, parent, depth }) => renderListRow(box, node, parent, depth)).join("")
        : '<div class="empty-state">Aucun résultat</div>';
    }

    if (box.viewMode === "list") {
      return allItems(box).map(({ node, parent, depth }) => renderListRow(box, node, parent, depth)).join("");
    }

    if (box.viewMode === "icons") {
      const folder = iconViewFolder(box);
      const parent = folder.id === box.root.id ? null : findParent(box, folder.id) || box.root;
      const children = sortedChildren(box, folder);
      return `
        <div class="icon-browser">
          ${parent ? `
            <button class="icon-back" data-icon-back="${parent.id}" type="button" title="Revenir au dossier parent">
              ${icon("chevron", "back-icon")}
              <span>${escapeHtml(parent.id === box.root.id ? box.name : parent.title)}</span>
            </button>
          ` : ""}
          ${children.length
            ? `<div class="icon-grid">${children.map((node) => renderIconCard(box, node)).join("")}</div>`
            : '<div class="empty-state">Dossier vide</div>'}
        </div>
      `;
    }

    return renderTreeChildren(box, box.root, 0);
  }

  function renderBookmarks(box) {
    const itemMap = new Map(allItems(box).map((item) => [item.node.id, item]));
    const items = (box.bookmarkedIds || [])
      .map((id) => {
        const item = itemMap.get(id);
        return item ? { node: item.node, parent: item.parent, depth: item.depth } : null;
      })
      .filter(Boolean);

    if (!items.length) return '<div class="empty-state">Aucun signet</div>';
    return items.map(({ node, parent, depth }) => renderListRow(box, node, parent, depth)).join("");
  }

  function renderTreeChildren(box, folder, depth) {
    return sortedChildren(box, folder).map((node) => {
      const row = renderTreeRow(box, node, depth);
      if (node.type === "folder" && isExpanded(box, node.id)) {
        return row + renderTreeChildren(box, node, depth + 1);
      }
      return row;
    }).join("");
  }

  function renderTreeRow(box, node, depth) {
    const active = box.activeItemId === node.id;
    const selected = (box.selectedIds || []).includes(node.id);
    const cut = isItemCut(box, node.id);
    const folder = node.type === "folder";
    const childrenCount = folder ? node.children.length : "";
    const guides = depth
      ? `<span class="tree-guides" aria-hidden="true">${Array.from({ length: depth }, () => '<span class="tree-guide"></span>').join("")}</span>`
      : "";
    return `
      <div class="tree-row ${active ? "is-active" : ""} ${selected ? "is-selected" : ""} ${cut ? "is-cut" : ""} ${box.customSortActive ? "is-manual-sort" : ""}" style="--depth:${depth}" data-item-id="${node.id}" draggable="true">
        ${guides}
        ${folder ? `<button class="disclosure ${isExpanded(box, node.id) ? "is-open" : ""}" data-expand-id="${node.id}" title="Ouvrir / réduire">${icon("chevron")}</button>` : '<span class="disclosure"></span>'}
        ${itemIconMarkup(node)}
        <span class="item-label">${escapeHtml(node.title)}</span>
        ${folder ? `<span class="item-meta">${childrenCount}</span>` : ""}
      </div>
    `;
  }

  function renderListRow(box, node, parent, depth = 1) {
    const active = box.activeItemId === node.id;
    const selected = (box.selectedIds || []).includes(node.id);
    const cut = isItemCut(box, node.id);
    const indent = Math.max(depth - 1, 0);
    return `
      <div class="list-row ${indent ? "is-nested" : ""} ${active ? "is-active" : ""} ${selected ? "is-selected" : ""} ${cut ? "is-cut" : ""} ${box.customSortActive ? "is-manual-sort" : ""}" style="--depth:${indent}" data-item-id="${node.id}" draggable="true">
        ${itemIconMarkup(node)}
        <span class="list-text">
          <span class="item-label">${escapeHtml(node.title)}</span>
          <small>${escapeHtml(parent?.title || box.name)} · ${formatShortDate(node.modifiedAt)}</small>
        </span>
      </div>
    `;
  }

  function renderIconCard(box, node) {
    const active = box.activeItemId === node.id;
    const selected = (box.selectedIds || []).includes(node.id);
    const cut = isItemCut(box, node.id);
    return `
      <div class="folder-card ${active ? "is-active" : ""} ${selected ? "is-selected" : ""} ${cut ? "is-cut" : ""} ${box.customSortActive ? "is-manual-sort" : ""}" data-item-id="${node.id}" draggable="true">
        ${itemIconMarkup(node)}
        <span class="item-label">${escapeHtml(node.title)}</span>
        <span class="item-meta">${node.type === "folder" ? `${node.children.length} éléments` : formatShortDate(node.modifiedAt)}</span>
      </div>
    `;
  }

  function renderFolderTile(box, node) {
    const active = box.activeItemId === node.id;
    const selected = (box.selectedIds || []).includes(node.id);
    const cut = isItemCut(box, node.id);
    return `
      <article class="folder-tile ${active ? "is-active" : ""} ${selected ? "is-selected" : ""} ${cut ? "is-cut" : ""} ${box.customSortActive ? "is-manual-sort" : ""}" data-item-id="${node.id}" draggable="true">
        ${itemIconMarkup(node)}
        <strong>${escapeHtml(node.title)}</strong>
        <small>${node.type === "folder" ? `${node.children.length} elements` : formatShortDate(node.modifiedAt)}</small>
      </article>
    `;
  }

  function sortOptions() {
    return [
      { value: "custom", label: "Trier : personnalisé" },
      { value: "createdDesc", label: "Création : récent" },
      { value: "createdAsc", label: "Création : ancien" },
      { value: "modifiedDesc", label: "Modification : récent" },
      { value: "modifiedAsc", label: "Modification : ancien" },
      { value: "alphaAsc", label: "A à Z" },
      { value: "alphaDesc", label: "Z à A" },
      { value: "typeFoldersFirst", label: "Type : dossiers puis notes" },
      { value: "typeNotesFirst", label: "Type : notes puis dossiers" },
    ];
  }

  function renderColorTool(kind, label, value) {
    const recentKey = kind === "highlight" ? "recentHighlightColors" : "recentTextColors";
    const presets = kind === "highlight" ? baseColorPresets : textColorPresets;
    const current = cleanColor(value, kind === "highlight" ? "#fff0a8" : "#000000");
    const presetValues = new Set(presets.map((color) => color.value));
    const recents = normalizeRecentColorSlots(state.settings?.[recentKey]).map((color) => presetValues.has(color) ? "" : color);
    const swatches = [
      ...presets.map((color) => ({ ...color, recent: false })),
      ...recents.map((color, index) => ({
        label: color ? `Memoire ${index + 1} ${color}` : `Memoire ${index + 1} vide`,
        value: color,
        recent: true,
        empty: !color,
      })),
    ];

    return `
      <div class="color-tool" data-color-tool="${kind}">
        <div class="color-tool-main">
          <input class="toolbar-color" type="color" value="${escapeHtml(current)}" data-color-input="${kind}" title="${escapeHtml(label)}" />
          <button class="format-button color-apply" data-apply-color="${kind}" title="Appliquer ${escapeHtml(label)}" aria-label="Appliquer ${escapeHtml(label)}">${icon("check")}</button>
          ${kind === "highlight" ? `<button class="format-button color-clear" data-clear-highlight title="Enlever le surlignage" aria-label="Enlever le surlignage">${icon("eraser")}</button>` : ""}
        </div>
        <div class="quick-colors" aria-label="${escapeHtml(label)}">
          ${swatches.map((color) => `
            <button
              class="quick-color ${color.value === current ? "is-active" : ""} ${color.recent ? "is-recent" : ""} ${color.empty ? "is-empty" : ""} ${color.value === "#ffffff" ? "is-light" : ""}"
              style="--quick-color:${color.value}"
              data-color-swatch="${kind}"
              data-color-value="${color.value}"
              ${color.empty ? "disabled" : ""}
              title="${escapeHtml(color.label)}"
              aria-label="${escapeHtml(color.label)}"
            ></button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderMainContent(box) {
    const active = findItem(box, box.activeItemId) || box.root;
    if (active.type === "note") return renderEditor(box, active);
    return renderFolderView(box, active);
  }

  function renderEditor(box, note) {
    const stats = noteStats(note);
    const bookmarked = (box.bookmarkedIds || []).includes(note.id);
    const viewMode = normalizeEditorViewMode(state.settings?.editorViewMode);
    const pageMode = viewMode === "pages";
    const splitMode = viewMode === "split";
    const pageZoom = clampPageZoom(state.settings?.pageZoom || 1);
    const marginLabel = pageMarginLabel(state.settings);
    const pageFlowMode = normalizePageFlowMode(state.settings?.pageFlowMode);
    const pageFlowLabel = pageFlowMode === "continuous" ? "Pages continues" : "Pages independantes";
    const pageStyle = pageMode
      ? `--page-zoom:${pageZoom};${pageSetupStyle(state.settings)}`
      : "";
    const fonts = availableFontOptions();
    const flowContent = note.content && note.content.includes("data-split-continuation")
      ? normalizedEditorHtml(note.content)
      : note.content || "";
    return `
      <article class="editor-shell">
        <div class="editor-toolbar" aria-label="Barre de mise en forme">
          <div class="toolbar-row toolbar-main-row">
          <div class="toolbar-group">
            <select class="toolbar-select" data-format-block title="Style de titre">
              <option value="p">Normal</option>
              <option value="h1">Titre 1</option>
              <option value="h2">Titre 2</option>
              <option value="h3">Titre 3</option>
            </select>
            <select class="toolbar-select font-select" data-font-family title="Police">
              ${fonts.map((font, index) => `<option value="${escapeHtml(font.value)}" ${index === 0 ? "selected" : ""}>${escapeHtml(font.label)}</option>`).join("")}
            </select>
            <input class="toolbar-select size-input" data-font-size type="number" min="8" max="120" step="1" value="17" list="font-size-suggestions" title="Taille de police (8 a 120)" aria-label="Taille de police" />
            <datalist id="font-size-suggestions">
              ${[8, 9, 10, 11, 12, 14, 16, 17, 18, 20, 22, 24, 28, 32, 36, 48, 72].map((size) => `<option value="${size}"></option>`).join("")}
            </datalist>
          </div>
          <div class="toolbar-group color-toolbar-group">
            ${renderColorTool("text", "Couleur du texte", state.settings?.lastTextColor || "#000000")}
            ${renderColorTool("highlight", "Surlignage", state.settings?.lastHighlightColor || "#fff0a8")}
          </div>
          <div class="toolbar-group">
            <button class="format-button" data-editor-cmd="bold" title="Gras"><strong>B</strong></button>
            <button class="format-button" data-editor-cmd="italic" title="Italique"><em>I</em></button>
            <button class="format-button" data-editor-cmd="underline" title="Souligné"><u>U</u></button>
            <button class="format-button" data-editor-cmd="strikeThrough" title="Barré"><s>S</s></button>
          </div>
          <div class="toolbar-group">
            <button class="format-button" data-editor-cmd="justifyLeft" title="Aligner à gauche">${icon("alignLeft")}</button>
            <button class="format-button" data-editor-cmd="justifyCenter" title="Centrer">${icon("alignCenter")}</button>
            <button class="format-button" data-editor-cmd="justifyRight" title="Aligner à droite">${icon("alignRight")}</button>
            <button class="format-button" data-editor-cmd="justifyFull" title="Justifier en bloc">${icon("alignJustify")}</button>
          </div>
          <div class="toolbar-group">
            <div class="toolbar-menu" data-toolbar-menu>
              <button class="format-button" type="button" data-menu-trigger data-tooltip="Types de listes (raccourcis : * - -- -> ^ [] au debut d'une ligne)" aria-label="Types de listes">${icon("list")}</button>
              <div class="toolbar-menu-panel list-panel">
                <button class="format-button" data-list-type="bullet" title="Point (* + espace)">•</button>
                <button class="format-button" data-list-type="dash" title="Tiret (- + espace)">-</button>
                <button class="format-button" data-list-type="circle" title="Rond">○</button>
                <button class="format-button" data-list-type="arrow" title="Flèche (-> + espace)">→</button>
                <button class="format-button" data-list-type="check" title="To Do ([] + espace)">☐</button>
                <button class="format-button" data-list-type="triangle" title="Triangle">△</button>
                <button class="format-button" data-list-type="square" title="Carré (-- + espace)">■</button>
              </div>
            </div>
            <div class="toolbar-menu" data-toolbar-menu>
              <button class="format-button" type="button" data-menu-trigger data-tooltip="Interligne et espacement" aria-label="Interligne et espacement">${icon("lineSpacing")}</button>
              <div class="toolbar-menu-panel spacing-panel">
                <span class="menu-panel-label">Interligne</span>
                <div class="spacing-values">
                  ${["1", "1.15", "1.5", "2", "3"].map((value) => `<button class="format-button" data-line-spacing="${value}" title="Interligne ${value.replace(".", ",")}">${value.replace(".", ",")}</button>`).join("")}
                </div>
                <span class="menu-panel-sep"></span>
                <button class="menu-panel-item" type="button" data-paragraph-space="before">Espace avant le paragraphe</button>
                <button class="menu-panel-item" type="button" data-paragraph-space="after">Espace apres le paragraphe</button>
              </div>
            </div>
          </div>
          </div>
          <div class="toolbar-row toolbar-secondary-row">
          <div class="toolbar-group">
            <button class="format-button ${pageMode ? "is-active" : ""}" data-action="toggle-editor-view" data-tooltip="${pageMode ? "Mode ecriture simple" : "Mode feuilles"}" aria-label="${pageMode ? "Mode ecriture simple" : "Mode feuilles"}">${icon("bookOpen")}</button>
            ${pageMode ? `<button class="format-button" data-action="cycle-page-margins" data-page-layout-button data-tooltip="${escapeHtml(marginLabel)} - clic droit : personnaliser" aria-label="${escapeHtml(marginLabel)}">${icon("ruler")}</button>` : ""}
            ${pageMode ? `<button class="format-button ${pageFlowMode === "continuous" ? "is-active" : ""}" data-action="toggle-page-flow-mode" data-tooltip="${escapeHtml(pageFlowLabel)}" aria-label="${escapeHtml(pageFlowLabel)}">${icon(pageFlowMode === "continuous" ? "linkedPages" : "splitPages")}</button>` : ""}
            ${pageMode && pageFlowMode === "independent" ? `<button class="format-button" data-action="add-independent-page" data-tooltip="Ajouter une page" aria-label="Ajouter une page">${icon("plus")}</button>` : ""}
            <button class="format-button ${splitMode ? "is-active" : ""}" data-action="toggle-editor-split-view" data-tooltip="${splitMode ? "Mode ecriture simple" : "Tableau coupe en 2"}" aria-label="${splitMode ? "Mode ecriture simple" : "Tableau coupe en 2"}">${icon("splitColumns")}</button>
            ${pageMode ? `
              <button class="format-button" data-action="page-zoom-out" data-tooltip="Dezoomer les feuilles" aria-label="Dezoomer les feuilles">${icon("zoomOut")}</button>
              <button class="format-button" data-action="page-zoom-in" data-tooltip="Zoomer les feuilles" aria-label="Zoomer les feuilles">${icon("zoomIn")}</button>
            ` : ""}
            <button class="format-button" data-editor-action="toggle-heading-collapse" data-tooltip="Replier / deplier le titre" aria-label="Replier / deplier le titre">${icon("collapse")}</button>
            <button class="format-button" data-editor-action="toggle-all-headings" data-tooltip="Replier / deplier tous les titres" aria-label="Replier / deplier tous les titres">${icon("collapseIn")}</button>
            <button class="format-button ${bookmarked ? "is-active" : ""}" data-action="toggle-bookmark" data-tooltip="${bookmarked ? "Retirer des signets" : "Ajouter aux signets"}" aria-label="${bookmarked ? "Retirer des signets" : "Ajouter aux signets"}">${icon(bookmarked ? "bookmarkFilled" : "bookmark")}</button>
          </div>
          <div class="toolbar-stats" aria-live="polite">
            <span data-char-count>${stats.chars} caracteres</span>
            <span data-word-count>${stats.words} mots</span>
            <span data-page-count>1 page</span>
            <div class="toolbar-export-actions">
              <button class="stats-action-button" data-action="export-note-pdf" data-tooltip="Exporter en PDF" aria-label="Exporter en PDF">${icon("filePdf")}</button>
              <button class="stats-action-button" data-action="export-note-word" data-tooltip="Exporter en Word" aria-label="Exporter en Word">${icon("fileWord")}</button>
              <button class="stats-action-button" data-action="export-note-txt" data-tooltip="Exporter en TXT" aria-label="Exporter en TXT">${icon("fileText")}</button>
              <button class="stats-action-button" data-action="print-note" data-tooltip="Imprimer" aria-label="Imprimer">${icon("printer")}</button>
            </div>
          </div>
        </div>
        </div>
        <section class="editor-page ${pageMode ? "is-page-mode" : ""} ${splitMode ? "is-split-mode" : ""}" style="${pageStyle}">
          <input class="title-input" data-note-title value="${escapeHtml(note.title)}" aria-label="Titre de la note" />
          ${pageMode
            ? `<div class="page-editor-viewport" data-page-viewport><div class="page-editor-scale" data-page-scale><div class="note-editor page-document" data-note-editor data-editor-note-id="${note.id}" data-page-flow="${pageFlowMode}" contenteditable="${pageFlowMode === "independent" ? "false" : "true"}" spellcheck="true"></div></div></div>`
            : `<div class="note-editor" data-note-editor data-editor-note-id="${note.id}" contenteditable="true" spellcheck="true">${flowContent}</div>`}
          <div class="editor-status" aria-live="polite">
            ${pageMode && pageFlowMode === "independent" ? `<span class="page-full-notice" data-page-full-notice></span>` : ""}
            <span data-word-count>${stats.words} mots</span>
            <span data-char-count>${stats.chars} caractères</span>
          </div>
        </section>
      </article>
    `;
  }

  function renderFolderView(box, folder) {
    const children = sortedChildren(box, folder);
    return `
      <section class="folder-shell" data-marquee-surface>
        <div class="folder-header">
          <div>
            <h1>${escapeHtml(folder.title)}</h1>
            <p>${children.length} élément${children.length > 1 ? "s" : ""} · ${folder.id === box.root.id ? "Boîte" : "Dossier"}</p>
          </div>
          <button class="tool-button raised" data-action="new-note" data-tooltip="Nouvelle note" aria-label="Nouvelle note">${icon("notePlus")}</button>
        </div>
        ${children.length ? `
          <div class="folder-content">
            ${children.map((child) => renderFolderTile(box, child)).join("")}
          </div>
        ` : '<div class="empty-state">Aucun élément</div>'}
      </section>
    `;
  }

  function renderInspector(box) {
    const active = findItem(box, box.activeItemId) || box.root;
    return `
      <div class="panel-head">
        <div class="panel-title">
          <strong>Plan de la note</strong>
          <span>${active.type === "note" ? escapeHtml(active.title) : "Vue de la boîte"}</span>
        </div>
      </div>
      <div class="inspector-scroll">
        <section class="inspector-section">
          <div class="inspector-label">Plan</div>
          ${active.type === "note" ? renderOutline(active) : '<div class="empty-state">Aucune note ouverte</div>'}
        </section>
        <section class="inspector-section">
          <div class="inspector-label">Vue arbre</div>
          <div class="mini-tree">
            ${renderMiniTree(box, box.root, 0)}
          </div>
        </section>
        <section class="inspector-section">
          <div class="inspector-label">Notes rapides</div>
          <div class="quick-list">
            ${renderQuickNotes(box)}
          </div>
        </section>
      </div>
    `;
  }

  function renderOutline(note) {
    const headings = extractHeadings(note.content);
    if (!headings.length) return '<div class="empty-state">Aucun titre</div>';
    return `<div class="outline-list">${headings.map((heading, index) => `
      <button class="outline-item" data-heading-index="${index}" data-level="${heading.level}">${escapeHtml(heading.text)}</button>
    `).join("")}</div>`;
  }

  function extractHeadings(html) {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    return [...div.querySelectorAll("h1, h2, h3")].map((heading) => ({
      text: heading.textContent.trim() || "Titre",
      level: Number(heading.tagName.slice(1)),
    }));
  }

  function renderMiniTree(box, node, depth) {
    const children = node.type === "folder" ? sortedChildren(box, node).map((child) => renderMiniTree(box, child, depth + 1)).join("") : "";
    const nodeIcon = node.id === box.root.id ? icon("box") : itemIconMarkup(node);
    const cut = isItemCut(box, node.id);
    return `
      <div class="mini-node" style="--depth:${depth}">
        <button class="mini-node-pill ${cut ? "is-cut" : ""}" data-item-id="${node.id}">${nodeIcon}<span>${escapeHtml(node.title)}</span></button>
      </div>
      ${children}
    `;
  }

  function renderQuickNotes(box) {
    const quick = box.root.children.find((item) => item.type === "folder" && item.title === "Notes rapides");
    if (!quick || !quick.children.length) return '<div class="empty-state">Aucune note rapide</div>';
    return quick.children.filter((item) => item.type === "note").slice(0, 5).map((note) => `
      <button class="quick-item ${isItemCut(box, note.id) ? "is-cut" : ""}" data-item-id="${note.id}">${escapeHtml(note.title)}</button>
    `).join("");
  }

  function renderGraphView(box) {
    const direction = normalizeGraphDirection(state.settings?.graphDirection);
    const zoom = clampGraphZoom(state.settings?.graphZoom || 1);
    const panX = clampGraphPan(state.settings?.graphPanX);
    const panY = clampGraphPan(state.settings?.graphPanY);
    return `
      <section class="graph-shell">
        <div class="graph-header">
          <div>
            <h1>Vue arbre</h1>
            <p>${escapeHtml(box.name)} · structure réelle des dossiers et notes</p>
          </div>
          <button class="tool-button raised" data-action="close-graph" data-tooltip="Retour à la note" aria-label="Retour à la note">${icon("edit")}</button>
        </div>
        <div class="graph-controls graph-controls-row" aria-label="Controles de la vue graphique">
          <div class="graph-control-cluster">
            <div class="graph-control-group" aria-label="Sens du graphe">
              ${graphDirections.map((item) => `
                <button class="tool-button ${direction === item.id ? "is-active" : ""}" data-action="set-graph-direction" data-graph-direction="${item.id}" data-tooltip="${escapeHtml(item.label)}" aria-label="${escapeHtml(item.label)}">${icon(item.icon)}</button>
              `).join("")}
            </div>
            <div class="graph-control-group" aria-label="Deplier le graphe">
              <button class="tool-button" data-action="collapse-all" data-tooltip="Tout refermer" aria-label="Tout refermer">${icon("collapseIn")}</button>
              <button class="tool-button" data-action="expand-all" data-tooltip="Tout derouler" aria-label="Tout derouler">${icon("collapse")}</button>
            </div>
          </div>
          <div class="graph-control-group" aria-label="Zoom du graphe">
            <button class="tool-button" data-action="graph-zoom-out" data-tooltip="Dezoomer" aria-label="Dezoomer">${icon("zoomOut")}</button>
            <button class="graph-zoom-value" data-action="graph-zoom-reset" data-graph-zoom-label data-tooltip="Reinitialiser le zoom" aria-label="Reinitialiser le zoom">${graphZoomLabel(zoom)}</button>
            <button class="tool-button" data-action="graph-zoom-in" data-tooltip="Zoomer" aria-label="Zoomer">${icon("zoomIn")}</button>
          </div>
        </div>
        <div class="graph-canvas" data-graph-canvas data-marquee-surface>
          <div class="graph-viewport" data-graph-viewport style="--graph-zoom:${zoom};--graph-pan-x:${panX}px;--graph-pan-y:${panY}px">
            <div class="graph-map graph-${direction}">
              ${renderGraphNode(box, box.root, true)}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderGraphNode(box, node, root = false) {
    const children = node.type === "folder" ? sortedChildren(box, node) : [];
    const expanded = root || node.type !== "folder" || isExpanded(box, node.id);
    const visibleChildren = expanded ? children : [];
    const selected = (box.selectedIds || []).includes(node.id);
    const active = node.id === box.activeItemId;
    const cut = isItemCut(box, node.id);
    const words = node.type === "note" ? noteStats(node).words : 0;
    const meta = root
      ? "Boite"
      : node.type === "folder"
        ? `${children.length} element${children.length > 1 ? "s" : ""}`
        : `${words} mot${words > 1 ? "s" : ""}`;
    return `
      <div class="graph-branch ${root ? "is-root" : ""} ${visibleChildren.length ? "has-children" : "is-leaf"} ${visibleChildren.length === 1 ? "has-single-child" : ""} ${children.length && !expanded ? "is-collapsed" : ""}">
        <button class="graph-node ${root ? "root" : ""} ${node.type} ${active ? "is-active" : ""} ${selected ? "is-selected" : ""} ${cut ? "is-cut" : ""} ${children.length && !expanded ? "is-collapsed" : ""}" data-item-id="${node.id}" draggable="false" type="button">
          <span class="graph-node-icon">${graphNodeIcon(node, root)}</span>
          <span class="graph-node-copy">
            <strong>${escapeHtml(node.title)}</strong>
            <small>${escapeHtml(meta)}</small>
          </span>
          ${node.type === "folder" && children.length && !root ? `<span class="graph-node-caret">${icon(expanded ? "chevronDown" : "chevronRight")}</span>` : ""}
        </button>
        ${visibleChildren.length ? `
          <div class="graph-children ${visibleChildren.length === 1 ? "is-single-child" : ""}">
            ${visibleChildren.map((child) => renderGraphNode(box, child)).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }

  function graphNodeIcon(node, root = false) {
    if (root) return icon("box");
    return itemIconMarkup(node) || icon(node.type === "folder" ? "folder" : "note");
  }

  function renderStatsPrefToggle(key, label, detail, checked) {
    return `
      <label class="print-option-toggle">
        <input type="checkbox" data-stats-pref="${key}" ${checked ? "checked" : ""} />
        <span class="print-option-control" aria-hidden="true"></span>
        <span class="print-option-copy">
          <strong>${escapeHtml(label)}</strong>
          <small>${escapeHtml(detail)}</small>
        </span>
      </label>
    `;
  }

  function renderPrintOptionToggle(name, label, detail, checked) {
    return `
      <label class="print-option-toggle">
        <input type="checkbox" name="${name}" ${checked ? "checked" : ""} />
        <span class="print-option-control" aria-hidden="true"></span>
        <span class="print-option-copy">
          <strong>${escapeHtml(label)}</strong>
          <small>${escapeHtml(detail)}</small>
        </span>
      </label>
    `;
  }

  function renderContextMenu(box) {
    if (!runtime.contextMenu) return "";
    const item = findItem(box, runtime.contextMenu.itemId);
    if (!item || item.id === box.root.id) return "";
    const x = Math.min(runtime.contextMenu.x || 0, Math.max(window.innerWidth - 238, 8));
    const y = Math.min(runtime.contextMenu.y || 0, Math.max(window.innerHeight - 260, 8));
    const defaultLabel = item.type === "folder" ? "Icone de dossier" : "Icone de note";
    return `
      <div class="context-menu" style="left:${x}px; top:${y}px" data-context-menu>
        ${runtime.contextMenu.source === "graph" ? `
          <button class="context-row" data-action="open-context-item" data-open-target="${item.id}">
            ${icon("external")}
            <span>Ouvrir</span>
          </button>
        ` : ""}
        <button class="context-row" data-action="rename-item" data-rename-target="${item.id}">
          ${icon("edit")}
          <span>Renommer</span>
        </button>
        <button class="context-row" data-action="duplicate-context-item" data-duplicate-target="${item.id}">
          ${icon("copy")}
          <span>Dupliquer</span>
        </button>
        <button class="context-row danger" data-action="delete-context-item" data-delete-target="${item.id}">
          ${icon("trash")}
          <span>Supprimer</span>
        </button>
        <div class="context-label">Icone</div>
        <button class="context-row" data-icon-choice="none" data-icon-target="${item.id}">
          <span class="context-glyph"></span>
          <span>Sans icone</span>
        </button>
        <button class="context-row" data-icon-choice="default" data-icon-target="${item.id}">
          ${itemIconMarkup({ ...item, iconKind: "default" })}
          <span>${defaultLabel}</span>
        </button>
        <div class="context-label">Emoji</div>
        <div class="emoji-picker">
          ${emojiChoices.map((emoji) => `
            <button class="emoji-choice ${item.iconKind === "emoji" && item.emoji === emoji ? "is-active" : ""}" data-icon-choice="emoji" data-icon-emoji="${escapeHtml(emoji)}" data-icon-target="${item.id}" aria-label="Emoji ${escapeHtml(emoji)}">${escapeHtml(emoji)}</button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderBoxContextMenu() {
    if (runtime.contextMenu?.source !== "box") return "";
    const box = state.boxes.find((item) => item.id === runtime.contextMenu.boxId);
    if (!box) return "";
    const x = Math.min(runtime.contextMenu.x || 0, Math.max(window.innerWidth - 238, 8));
    const y = Math.min(runtime.contextMenu.y || 0, Math.max(window.innerHeight - 220, 8));
    return `
      <div class="context-menu" style="left:${x}px; top:${y}px" data-context-menu>
        ${box.passwordHash ? `
          <button class="context-row" data-action="change-box-password" data-box-id="${box.id}">
            ${icon("lock")}
            <span>Modifier le code</span>
          </button>
        ` : ""}
        <button class="context-row" data-action="rename-box" data-box-id="${box.id}">
          ${icon("edit")}
          <span>Renommer</span>
        </button>
        <button class="context-row danger" data-action="delete-box" data-box-id="${box.id}">
          ${icon("trash")}
          <span>Supprimer</span>
        </button>
      </div>
    `;
  }

  function renderModal() {
    if (!runtime.modal) return "";
    if (runtime.modal.type === "create-box") {
      return `
        <div class="modal-backdrop">
          <form class="modal" data-create-box-form>
            <div class="modal-head">
              <h2>Nouvelle boîte</h2>
              <button class="icon-button" type="button" data-action="close-modal" title="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body modal-grid">
              <label class="modal-label">Nom
                <input class="modal-field" name="name" value="Nouvelle boîte" required autofocus data-select-autofocus="true" />
              </label>
              <label class="modal-label">Mot de passe optionnel
                <input class="modal-field" name="password" type="password" placeholder="Laisser vide pour une boîte libre" />
              </label>
            </div>
            <div class="modal-actions">
              <button class="ghost-button" type="button" data-action="close-modal">Annuler</button>
              <button class="button" type="submit">${icon("plus")} Créer</button>
            </div>
          </form>
        </div>
      `;
    }

    if (runtime.modal.type === "unlock-box") {
      const box = state.boxes.find((item) => item.id === runtime.modal.boxId);
      const error = runtime.modal.error || "";
      return `
        <div class="modal-backdrop">
          <form class="modal" data-unlock-box-form>
            <div class="modal-head">
              <h2>${escapeHtml(box?.name || "Boîte protégée")}</h2>
              <button class="icon-button" type="button" data-action="close-modal" title="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body">
              <label class="modal-label">Mot de passe
                <input class="modal-field" name="password" type="password" required autofocus />
              </label>
            </div>
            <div class="modal-actions">
              <span class="modal-error" ${error ? "" : "hidden"}>${escapeHtml(error)}</span>
              <button class="ghost-button" type="button" data-action="close-modal">Annuler</button>
              <button class="button" type="submit">${icon("unlock")} Ouvrir</button>
            </div>
          </form>
        </div>
      `;
    }

    if (runtime.modal.type === "box-auth") {
      const box = state.boxes.find((item) => item.id === runtime.modal.boxId);
      const error = runtime.modal.error || "";
      return `
        <div class="modal-backdrop">
          <form class="modal" data-box-auth-form>
            <div class="modal-head">
              <h2>Code requis</h2>
              <button class="icon-button" type="button" data-action="close-modal" title="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body">
              <p class="modal-copy">${escapeHtml(box?.name || "Cette boite")} est protegee.</p>
              <label class="modal-label">Code actuel
                <input class="modal-field" name="password" type="password" required autofocus />
              </label>
            </div>
            <div class="modal-actions">
              <span class="modal-error" ${error ? "" : "hidden"}>${escapeHtml(error)}</span>
              <button class="ghost-button" type="button" data-action="close-modal">Annuler</button>
              <button class="button" type="submit">${icon("unlock")} Continuer</button>
            </div>
          </form>
        </div>
      `;
    }

    if (runtime.modal.type === "rename-box") {
      const box = state.boxes.find((item) => item.id === runtime.modal.boxId);
      return `
        <div class="modal-backdrop">
          <form class="modal" data-rename-box-form>
            <div class="modal-head">
              <h2>Renommer la boite</h2>
              <button class="icon-button" type="button" data-action="close-modal" title="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body">
              <label class="modal-label">Nom
                <input class="modal-field" name="name" value="${escapeHtml(box?.name || "")}" required autofocus data-select-autofocus="true" />
              </label>
            </div>
            <div class="modal-actions">
              <button class="ghost-button" type="button" data-action="close-modal">Annuler</button>
              <button class="button" type="submit">${icon("check")} Renommer</button>
            </div>
          </form>
        </div>
      `;
    }

    if (runtime.modal.type === "box-password") {
      const box = state.boxes.find((item) => item.id === runtime.modal.boxId);
      const change = runtime.modal.mode === "change";
      const error = runtime.modal.error || "";
      const draft = runtime.modal.draft || {};
      return `
        <div class="modal-backdrop">
          <form class="modal" data-box-password-form>
            <div class="modal-head">
              <h2>${change ? "Modifier le code" : "Ajouter un code"}</h2>
              <button class="icon-button" type="button" data-action="close-modal" title="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body modal-grid">
              <p class="modal-copy">${escapeHtml(box?.name || "Boite")}</p>
              ${change ? `
                <label class="modal-label">Ancien code
                  <input class="modal-field" name="oldPassword" type="password" value="${escapeHtml(draft.oldPassword || "")}" required />
                </label>
              ` : ""}
              <label class="modal-label">Nouveau code
                <input class="modal-field" name="newPassword" type="password" value="${escapeHtml(draft.newPassword || "")}" required />
              </label>
              <label class="modal-label">Confirmer le nouveau code
                <input class="modal-field" name="confirmPassword" type="password" value="${escapeHtml(draft.confirmPassword || "")}" required />
              </label>
            </div>
            <div class="modal-actions">
              <span class="modal-error" ${error ? "" : "hidden"}>${escapeHtml(error)}</span>
              <button class="ghost-button" type="button" data-action="close-modal">Annuler</button>
              <button class="button" type="submit" data-box-password-submit>${icon("check")} Valider</button>
            </div>
          </form>
        </div>
      `;
    }

    if (runtime.modal.type === "box-add-password-prompt") {
      const box = state.boxes.find((item) => item.id === runtime.modal.boxId);
      return `
        <div class="modal-backdrop">
          <div class="modal confirm-modal">
            <div class="modal-head">
              <h2>Ajouter un code ?</h2>
              <button class="icon-button" type="button" data-action="close-modal" title="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body">
              <p class="modal-copy">Voulez-vous ajouter un code a ${escapeHtml(box?.name || "cette boite")} ?</p>
            </div>
            <div class="modal-actions">
              <button class="ghost-button" type="button" data-action="close-modal">Non</button>
              <button class="button" type="button" data-action="confirm-add-box-password" data-box-id="${box?.id || ""}">Oui</button>
            </div>
          </div>
        </div>
      `;
    }

    if (runtime.modal.type === "confirm-delete-box-first" || runtime.modal.type === "confirm-delete-box-final") {
      const box = state.boxes.find((item) => item.id === runtime.modal.boxId);
      const final = runtime.modal.type === "confirm-delete-box-final";
      return `
        <div class="modal-backdrop">
          <div class="modal confirm-modal">
            <div class="modal-head">
              <h2>${final ? "Suppression definitive" : "Supprimer cette boite ?"}</h2>
              <button class="icon-button" type="button" data-action="close-modal" title="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body">
              <p class="modal-copy">${final
                ? `Cette action sera definitive et vous perdrez toutes les informations contenues dans ${escapeHtml(box?.name || "cette boite")}. Etes-vous sur de vouloir continuer ?`
                : `Etes-vous sur de vouloir supprimer ${escapeHtml(box?.name || "cette boite")} ?`}</p>
            </div>
            <div class="modal-actions">
              <button class="ghost-button" type="button" data-action="close-modal">Non</button>
              <button class="button ${final ? "danger-button" : ""}" type="button" data-action="${final ? "confirm-delete-box-final" : "confirm-delete-box-first"}" data-box-id="${box?.id || ""}">Oui</button>
            </div>
          </div>
        </div>
      `;
    }

    if (runtime.modal.type === "selector") {
      const box = activeBox();
      const query = runtime.paletteQuery.toLowerCase();
      const results = box ? allItems(box)
        .filter(({ node }) => !query || node.title.toLowerCase().includes(query) || (node.content && stripHtml(node.content).toLowerCase().includes(query)))
        .slice(0, 18) : [];
      return `
        <div class="modal-backdrop">
          <div class="modal wide">
            <div class="modal-head">
              <h2>Sélecteur rapide</h2>
              <button class="icon-button" type="button" data-action="close-modal" title="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body">
              <div class="search-box">
                ${icon("search")}
                <input class="search-field" data-palette-search value="${escapeHtml(runtime.paletteQuery)}" placeholder="Recherche" autofocus />
              </div>
              <div class="palette-results">
                ${results.map(({ node, parent }) => `
                  <button class="palette-result ${isItemCut(box, node.id) ? "is-cut" : ""}" data-item-id="${node.id}">
                    ${itemIconMarkup(node)}
                    <span><strong>${escapeHtml(node.title)}</strong><small>${escapeHtml(parent?.title || box.name)}</small></span>
                  </button>
                `).join("") || '<div class="empty-state">Aucun résultat</div>'}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (runtime.modal.type === "confirm-delete") {
      const count = (runtime.modal.ids || []).length;
      return `
        <div class="modal-backdrop">
          <div class="modal confirm-modal">
            <div class="modal-head">
              <h2>Supprimer la selection ?</h2>
              <button class="icon-button" type="button" data-action="close-modal" data-tooltip="Fermer" aria-label="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body">
              <p class="modal-copy">Etes-vous sur de vouloir supprimer les objets selectionnes ?</p>
              <p class="modal-hint">${count > 1 ? `${count} objets seront retires de la boite.` : "1 objet sera retire de la boite."}</p>
            </div>
            <div class="modal-actions">
              <button class="ghost-button" type="button" data-action="close-modal">Annuler</button>
              <button class="button danger-button" type="button" data-action="confirm-delete">${icon("trash")} Supprimer</button>
            </div>
          </div>
        </div>
      `;
    }

    if (runtime.modal.type === "rename-item") {
      const box = activeBox();
      const item = box ? findItem(box, runtime.modal.itemId) : null;
      return `
        <div class="modal-backdrop">
          <form class="modal" data-rename-item-form>
            <div class="modal-head">
              <h2>Renommer</h2>
              <button class="icon-button" type="button" data-action="close-modal" data-tooltip="Fermer" aria-label="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body">
              <label class="modal-label">Nom
                <input class="modal-field" name="name" value="${escapeHtml(item?.title || "")}" required autofocus />
              </label>
            </div>
            <div class="modal-actions">
              <button class="ghost-button" type="button" data-action="close-modal">Annuler</button>
              <button class="button" type="submit">${icon("check")} Renommer</button>
            </div>
          </form>
        </div>
      `;
    }

    if (runtime.modal.type === "print-options") {
      const box = activeBox();
      const note = box ? findItem(box, runtime.modal.noteId) : null;
      const mode = runtime.modal.mode === "pdf" ? "pdf" : "print";
      const options = normalizePrintOptions(runtime.modal.options);
      const title = mode === "pdf" ? "Exporter en PDF" : "Imprimer";
      const action = mode === "pdf" ? "Apercu systeme" : "Imprimer";
      const hint = mode === "pdf"
        ? "L'apercu systeme est celui d'avant. Si date, heure ou adresse apparaissent, decoche les en-tetes et pieds de page dans cette fenetre."
        : "Pour l'impression, le navigateur peut encore proposer ses propres en-tetes dans sa fenetre d'impression.";
      return `
        <div class="modal-backdrop">
          <form class="modal print-options-modal" data-print-options-form>
            <div class="modal-head">
              <h2>${title}</h2>
              <button class="icon-button" type="button" data-action="close-modal" data-tooltip="Fermer" aria-label="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body">
              <p class="modal-copy">${escapeHtml(note?.title || "Note MindSet")}</p>
              <div class="print-options-list">
                ${renderPrintOptionToggle("showTitle", "Titre de la note", "Afficher le titre dans le document", options.showTitle)}
                ${renderPrintOptionToggle("showDate", "Date", "Afficher la date d'export ou d'impression", options.showDate)}
                ${renderPrintOptionToggle("showTime", "Heure", "Afficher l'heure d'export ou d'impression", options.showTime)}
                ${renderPrintOptionToggle("showPageNumbers", "Numerotation des pages", "Afficher le numero de page", options.showPageNumbers)}
              </div>
              <p class="modal-hint">${hint}</p>
            </div>
            <div class="modal-actions">
              <button class="ghost-button" type="button" data-action="close-modal">Annuler</button>
              ${mode === "pdf" ? `<button class="ghost-button" type="button" data-action="open-mindset-pdf-preview">Apercu MindSet</button>` : ""}
              <button class="button" type="submit">${icon(mode === "pdf" ? "filePdf" : "printer")} ${action}</button>
            </div>
          </form>
        </div>
      `;
    }

    if (runtime.modal.type === "pdf-preview") {
      const box = activeBox();
      const note = box ? findItem(box, runtime.modal.noteId) : null;
      const pageCount = Math.max(Number(runtime.modal.pageCount) || 1, 1);
      return `
        <div class="modal-backdrop">
          <div class="modal pdf-preview-modal">
            <div class="modal-head">
              <div>
                <h2>Apercu PDF</h2>
                <p class="modal-subtitle">${escapeHtml(note?.title || runtime.modal.fileName || "Note MindSet")} - ${pageCount} page${pageCount > 1 ? "s" : ""}</p>
              </div>
              <button class="icon-button" type="button" data-action="close-modal" data-tooltip="Fermer" aria-label="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body pdf-preview-body">
              <iframe class="pdf-preview-frame" src="${escapeHtml(runtime.modal.pdfUrl || "")}#toolbar=0&navpanes=0" title="Apercu PDF MindSet"></iframe>
              <p class="modal-hint">Cet apercu est le PDF qui sera enregistre, sans les en-tetes automatiques du navigateur.</p>
            </div>
            <div class="modal-actions">
              <button class="ghost-button" type="button" data-action="pdf-preview-back">Retour options</button>
              <button class="button" type="button" data-action="download-preview-pdf">${icon("filePdf")} Enregistrer PDF</button>
            </div>
          </div>
        </div>
      `;
    }

    if (runtime.modal.type === "settings") {
      const settings = state.settings || {};
      const headings = settings.headingPresets || headingDefaults;
      const localFonts = normalizeLocalFonts(settings.localFonts);
      const fontChoices = availableFontOptions();
      const presetRows = [
        { level: "normal", label: "Normal", min: 12, max: 32 },
        { level: "h1", label: "Titre 1", min: 14, max: 48 },
        { level: "h2", label: "Titre 2", min: 14, max: 48 },
        { level: "h3", label: "Titre 3", min: 14, max: 48 },
      ];
      const weightOptions = ["400", "500", "600", "650", "700", "740", "780", "820", "860"];
      const selectionColors = ["#0f6b58", "#7c5cff", "#d58f27", "#bf5b7a", "#3f7fbf", "#6f8f3a"];
      const guideColors = ["#c8ceca", "#5a5a5a", "#ffffff", "#0f6b58", "#7c5cff", "#3f7fbf", "#d58f27"];
      const todoColors = ["#0f6b58", "#4ca66a", "#55a7e5", "#7c5cff", "#d94b4b", "#f08a24", "#ffffff"];
      const treeGuideColor = cleanColor(settings.treeGuideColor, defaultTreeGuideColor(settings.theme));
      const todoColor = cleanColor(settings.todoColor, settings.selectionColor || "#0f6b58");
      const pageSetup = normalizePageSetup(settings.pageSetup, settings.pageMarginPreset, settings);
      const pageLimits = pageMarginLimits(pageSetup);
      const activeMarginPreset = marginPresetForSetup(pageSetup, settings);
      const updateStatus = normalizeDesktopUpdateStatus(runtime.updateStatus);
      const desktopReady = !!desktopBridge()?.isDesktop;
      const progressValue = updateProgressValue(updateStatus);
      const statsPrefs = normalizeStatsPrefs(settings.statsPrefs);
      const settingsNav = [
        ["settings-appearance", "Apparence"],
        ["settings-page", "Mise en page"],
        ["settings-text", "Texte"],
        ["settings-stats", "Statistiques"],
        ["settings-fonts", "Polices"],
        ["settings-updates", "Mises a jour"],
      ];
      const activeSection = settingsNav.some(([id]) => id === runtime.modal.section) ? runtime.modal.section : settingsNav[0][0];
      const sectionsHtml = {};
      sectionsHtml["settings-appearance"] = `
              <section class="settings-section" id="settings-appearance" data-settings-section>
                <h3>Apparence</h3>
                <label class="modal-label">Thème
                  <select class="modal-field" data-theme-select>
                    <option value="light" ${settings.theme !== "dark" ? "selected" : ""}>Clair</option>
                    <option value="dark" ${settings.theme === "dark" ? "selected" : ""}>Sombre</option>
                  </select>
                </label>
                <label class="modal-label">Couleur de sélection
                  <input class="modal-field color-field" type="color" value="${escapeHtml(settings.selectionColor || "#0f6b58")}" data-selection-color />
                </label>
                <div class="color-swatches">
                  ${selectionColors.map((color) => `<button class="color-swatch ${color === settings.selectionColor ? "is-active" : ""} ${color === "#ffffff" ? "is-light" : ""}" style="--swatch:${color}" data-selection-swatch="${color}" aria-label="Couleur ${color}"></button>`).join("")}
                </div>
                <label class="modal-label">Couleur des lignes d'indentation
                  <input class="modal-field color-field" type="color" value="${escapeHtml(treeGuideColor)}" data-tree-guide-color />
                </label>
                <div class="color-swatches">
                  ${guideColors.map((color) => `<button class="color-swatch ${color === treeGuideColor ? "is-active" : ""} ${color === "#ffffff" ? "is-light" : ""}" style="--swatch:${color}" data-tree-guide-swatch="${color}" aria-label="Couleur ${color}"></button>`).join("")}
                </div>
                <label class="modal-label">Couleur des tâches cochées
                  <input class="modal-field color-field" type="color" value="${escapeHtml(todoColor)}" data-todo-color />
                </label>
                <div class="color-swatches">
                  ${todoColors.map((color) => `<button class="color-swatch ${color === todoColor ? "is-active" : ""} ${color === "#ffffff" ? "is-light" : ""}" style="--swatch:${color}" data-todo-swatch="${color}" aria-label="Couleur ${color}"></button>`).join("")}
                </div>
              </section>`;
      sectionsHtml["settings-page"] = `
              <section class="settings-section" id="settings-page" data-settings-section data-page-setup-section>
                <h3>Mise en page</h3>
                <p class="settings-hint">Dimensions en cm, converties en taille CSS absolue pour garder des feuilles fideles a l'impression. A4 portrait est le format initial.</p>
                <div class="page-layout-grid">
                  <label class="modal-label">Format
                    <select class="modal-field" data-page-size>
                      ${pageSizePresets.map((size) => `<option value="${size.id}" ${pageSetup.sizeId === size.id ? "selected" : ""}>${escapeHtml(size.label)} - ${cm(size.widthCm)} x ${cm(size.heightCm)}</option>`).join("")}
                    </select>
                  </label>
                  <label class="modal-label">Orientation
                    <select class="modal-field" data-page-orientation>
                      <option value="portrait" ${pageSetup.orientation !== "landscape" ? "selected" : ""}>Portrait</option>
                      <option value="landscape" ${pageSetup.orientation === "landscape" ? "selected" : ""}>Paysage</option>
                    </select>
                  </label>
                </div>
                <div class="page-size-summary">Feuille active : ${escapeHtml(pageSizePreset(pageSetup.sizeId).label)} ${pageSetup.orientation === "landscape" ? "paysage" : "portrait"} - ${pageSizeSummary(pageSetup)}</div>
                <div class="margin-preset-row">
                  ${pageMarginOrder.map((id) => `<button class="ghost-button tiny-button ${activeMarginPreset === id ? "is-active" : ""}" type="button" data-page-margin-preset="${id}">${escapeHtml(pageMarginPresetLabel(id, settings))}</button>`).join("")}
                </div>
                <div class="margin-input-grid">
                  ${[
                    ["top", "Haut"],
                    ["right", "Droite"],
                    ["bottom", "Bas"],
                    ["left", "Gauche"],
                  ].map(([side, label]) => `
                    <label class="modal-label">${label}
                      <span class="cm-input-wrap">
                        <input class="modal-field compact-field" type="number" min="${minPageMarginCm}" max="${pageLimits[side]}" step="0.1" value="${pageSetup.margins[side].toFixed(1)}" data-page-margin="${side}" aria-label="Marge ${label}" />
                        <span>cm</span>
                      </span>
                    </label>
                  `).join("")}
                </div>
                <p class="settings-hint">Limite basse : ${cm(minPageMarginCm)}. MindSet garde toujours au moins ${cm(minPageContentCm)} de zone utile sur chaque axe.</p>
              </section>`;
      sectionsHtml["settings-text"] = `
              <section class="settings-section" id="settings-text" data-settings-section>
                <h3>Presets de texte</h3>
                ${presetRows.map((row) => {
                  const level = row.level;
                  const preset = { ...headingDefaults[level], ...(headings[level] || {}) };
                  return `
                    <div class="heading-preset-row">
                      <span>${escapeHtml(row.label)}</span>
                      <input class="modal-field compact-field" type="number" min="${row.min}" max="${row.max}" value="${Number.parseInt(preset.size, 10)}" data-heading-size="${level}" aria-label="Taille ${escapeHtml(row.label)}" />
                      <input class="modal-field color-field compact-color" type="color" value="${escapeHtml(preset.color)}" data-heading-color="${level}" aria-label="Couleur ${escapeHtml(row.label)}" />
                      <select class="modal-field compact-field heading-font-select" data-heading-font="${level}" aria-label="Police ${escapeHtml(row.label)}">
                        ${fontChoices.map((font) => `<option value="${escapeHtml(font.value)}" ${preset.fontFamily === font.value ? "selected" : ""}>${escapeHtml(font.label)}</option>`).join("")}
                      </select>
                      <select class="modal-field compact-field" data-heading-weight="${level}" aria-label="Graisse ${escapeHtml(row.label)}">
                        ${weightOptions.map((weight) => `<option value="${weight}" ${preset.weight === weight ? "selected" : ""}>${weight}</option>`).join("")}
                      </select>
                    </div>
                  `;
                }).join("")}
              </section>`;
      sectionsHtml["settings-stats"] = `
              <section class="settings-section" id="settings-stats" data-settings-section>
                <h3>Statistiques</h3>
                <p class="settings-hint">Choisis ce que comptent les compteurs de caracteres et de mots du mini Word. Les compteurs se mettent a jour immediatement.</p>
                <div class="print-options-list">
                  ${renderStatsPrefToggle("charsCountSpaces", "Espaces dans les caracteres", "Compter les espaces dans le total de caracteres", statsPrefs.charsCountSpaces)}
                  ${renderStatsPrefToggle("charsCountPunctuation", "Ponctuation dans les caracteres", "Compter les virgules, points et autres signes dans le total de caracteres", statsPrefs.charsCountPunctuation)}
                  ${renderStatsPrefToggle("wordsCountNumbers", "Nombres comme mots", "Compter un nombre seul (ex : 2026) comme un mot", statsPrefs.wordsCountNumbers)}
                  ${renderStatsPrefToggle("wordsCountPunctuation", "Ponctuation isolee comme mot", "Compter une virgule ou un tiret seul comme un mot", statsPrefs.wordsCountPunctuation)}
                </div>
              </section>`;
      sectionsHtml["settings-fonts"] = `
              <section class="settings-section" id="settings-fonts" data-settings-section>
                <h3>Polices locales</h3>
                <p class="settings-hint">Formats acceptes : .ttf, .otf, .woff, .woff2. Dans l'app Windows, MindSet ouvre directement son dossier de polices : glisse le fichier dedans, puis reviens dans MindSet.</p>
                <div class="font-actions">
                  ${desktopReady ? `
                    <button class="button font-import-button" type="button" data-open-font-folder>${icon("plus")} Ajouter une police</button>
                    <button class="ghost-button" type="button" data-scan-font-folder>Actualiser</button>
                  ` : `
                    <label class="button font-import-button">
                      ${icon("plus")} Ajouter une police
                      <input type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" data-font-import multiple />
                    </label>
                  `}
                </div>
                <div class="local-font-list">
                  ${localFonts.length ? localFonts.map((font) => `
                    <div class="local-font-row">
                      <span style="font-family:${escapeHtml(font.family)}">${escapeHtml(font.name)}</span>
                      <small>${escapeHtml(font.format || "font")}</small>
                      <button class="tool-button" type="button" data-remove-local-font="${escapeHtml(font.id)}" data-tooltip="Retirer" aria-label="Retirer ${escapeHtml(font.name)}">${icon("close")}</button>
                    </div>
                  `).join("") : '<p class="settings-hint">Aucune police importee pour le moment.</p>'}
                </div>
              </section>`;
      sectionsHtml["settings-updates"] = `
              <section class="settings-section" id="settings-updates" data-settings-section data-update-panel data-update-status="${escapeHtml(updateStatus.status)}">
                <h3>Mises a jour</h3>
                <p class="settings-hint">${desktopReady ? "Les mises a jour seront recuperees depuis les releases GitHub de MindSet." : "Cette option apparait vraiment dans l'application Windows installee."}</p>
                <div class="update-status-line">
                  <strong data-update-message>${escapeHtml(updateStatus.message)}</strong>
                  <small data-update-version ${updateStatus.version ? "" : "hidden"}>${updateStatus.version ? `Version ${escapeHtml(updateStatus.version)}` : ""}</small>
                </div>
                <div class="update-progress-wrap">
                  <div class="update-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressValue}" aria-label="Progression du telechargement">
                    <span class="update-progress-bar" data-update-progress-bar style="width:${progressValue}%"></span>
                  </div>
                  <span data-update-progress-text>${updateStatus.status === "downloading" || updateStatus.status === "downloaded" ? `${progressValue}%` : "En attente"}</span>
                </div>
                <div class="update-actions">
                  <button class="ghost-button" type="button" data-action="check-updates" ${updateCanCheck(updateStatus.status, desktopReady) ? "" : "disabled"}>Rechercher</button>
                  <button class="ghost-button" type="button" data-action="download-update" ${updateCanDownload(updateStatus.status, desktopReady) ? "" : "disabled"}>Telecharger</button>
                  <button class="button" type="button" data-action="install-update" ${updateCanInstall(updateStatus.status, desktopReady) ? "" : "disabled"}>Redemarrer</button>
                </div>
              </section>`;
      return `
        <div class="modal-backdrop">
          <div class="modal settings-modal">
            <div class="modal-head">
              <h2>Paramètres</h2>
              <button class="icon-button" type="button" data-action="close-modal" data-tooltip="Fermer" aria-label="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body settings-body">
              <nav class="settings-nav" aria-label="Navigation des parametres">
                ${settingsNav.map(([target, label]) => `
                  <button class="settings-nav-button ${target === activeSection ? "is-active" : ""}" type="button" data-settings-page="${target}">${escapeHtml(label)}</button>
                `).join("")}
              </nav>
              <div class="settings-content">
              ${sectionsHtml[activeSection] || sectionsHtml[settingsNav[0][0]]}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return "";
  }

  function renderToast() {
    return runtime.toast ? `<div class="toast">${escapeHtml(runtime.toast)}</div>` : "";
  }

  function graphViewVisible() {
    return runtime.modal?.type === "graph-full" || !!runtime.modal?.returnToGraph;
  }

  function modalBlocksGlobalShortcuts() {
    return !!runtime.modal && runtime.modal.type !== "graph-full";
  }

  function closeModalOrRestoreGraph() {
    const returnToGraph = !!runtime.modal?.returnToGraph;
    setModal(returnToGraph ? { type: "graph-full" } : null);
    runtime.paletteQuery = "";
    runtime.contextMenu = null;
    render();
  }

  function bindEvents() {
    app.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", handleAction);
    });

    app.querySelectorAll("[data-page-layout-button]").forEach((button) => {
      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        flushActiveEditorContent();
        setModal({ type: "settings", section: "settings-page" });
        render();
      });
    });

    app.querySelectorAll("[data-tab-id]").forEach((tab) => {
      tab.addEventListener("click", () => {
        const box = activeBox();
        if (box) setActiveItem(box, tab.dataset.tabId);
      });
    });

    app.querySelectorAll("[data-close-tab-id]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const box = activeBox();
        if (box) closeTab(box, button.dataset.closeTabId);
      });
    });

    app.querySelectorAll("[data-icon-choice]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const box = activeBox();
        if (!box) return;
        setItemIcon(box, button.dataset.iconTarget, button.dataset.iconChoice, button.dataset.iconEmoji || "");
      });
    });

    app.querySelectorAll("[data-settings-page]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (runtime.modal?.type !== "settings") return;
        if (runtime.modal.section === button.dataset.settingsPage) return;
        runtime.modal = { ...runtime.modal, section: button.dataset.settingsPage };
        render();
        const content = app.querySelector(".settings-modal .settings-content");
        if (content) content.scrollTop = 0;
      });
    });

    app.querySelectorAll("[data-stats-pref]").forEach((input) => {
      input.addEventListener("change", () => {
        state.settings.statsPrefs = {
          ...normalizeStatsPrefs(state.settings.statsPrefs),
          [input.dataset.statsPref]: input.checked,
        };
        saveState();
        const box = activeBox();
        const note = box ? findItem(box, box.activeItemId) : null;
        if (note?.type === "note") updateEditorStats(note);
      });
    });

    app.querySelectorAll("[data-box-option]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        switchBoxById(button.dataset.boxOption);
      });
    });

    app.querySelectorAll("[data-box-card-id]").forEach((card) => {
      card.addEventListener("click", () => {
        if (runtime.contextMenu?.source === "box") {
          runtime.contextMenu = null;
          render();
        }
      });
      card.addEventListener("dragstart", (event) => {
        runtime.dragBoxId = card.dataset.boxCardId;
        card.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", runtime.dragBoxId);
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("is-dragging");
        app.querySelectorAll(".box-card.drop-before, .box-card.drop-after").forEach((item) => item.classList.remove("drop-before", "drop-after"));
        runtime.dragBoxId = null;
      });
      card.addEventListener("dragover", (event) => {
        if (!runtime.dragBoxId || runtime.dragBoxId === card.dataset.boxCardId) return;
        event.preventDefault();
        const position = boxCardDropPosition(event, card);
        card.classList.toggle("drop-before", position === "before");
        card.classList.toggle("drop-after", position === "after");
      });
      card.addEventListener("dragleave", () => card.classList.remove("drop-before", "drop-after"));
      card.addEventListener("drop", (event) => {
        event.preventDefault();
        card.classList.remove("drop-before", "drop-after");
        const draggedId = runtime.dragBoxId;
        runtime.dragBoxId = null;
        reorderBoxes(draggedId, card.dataset.boxCardId, boxCardDropPosition(event, card));
      });
      card.addEventListener("contextmenu", (event) => {
        const box = state.boxes.find((item) => item.id === card.dataset.boxCardId);
        if (!box) return;
        event.preventDefault();
        event.stopPropagation();
        runtime.contextMenu = {
          source: "box",
          boxId: box.id,
          x: event.clientX,
          y: event.clientY,
        };
        render();
      });
    });

    app.querySelector(".lobby")?.addEventListener("click", (event) => {
      if (event.target.closest("[data-box-card-id], [data-context-menu], button, input, select, textarea")) return;
      if (runtime.contextMenu?.source !== "box") return;
      runtime.contextMenu = null;
      render();
    });

    app.querySelectorAll("[data-action='box-lock-click']").forEach((button) => {
      button.addEventListener("contextmenu", (event) => {
        const box = state.boxes.find((item) => item.id === button.dataset.boxId);
        if (!box?.passwordHash) return;
        event.preventDefault();
        event.stopPropagation();
        openBoxProtectedAction(box.id, "change-password");
      });
    });

    app.querySelectorAll("[data-icon-back]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const box = activeBox();
        if (!box) return;
        const folder = setIconViewFolder(box, button.dataset.iconBack);
        box.activeItemId = folder.id;
        box.selectedIds = folder.id === box.root.id ? [] : [folder.id];
        runtime.selectionAnchorId = folder.id === box.root.id ? null : folder.id;
        pushNavigationPoint();
        saveState();
        render();
      });
    });

    app.querySelectorAll("[data-marquee-surface]").forEach((surface) => {
      surface.addEventListener("pointerdown", (event) => startMarqueeSelection(event, surface));
      surface.addEventListener("click", (event) => {
        if (runtime.ignoreSurfaceClick) return;
        if (event.target.closest("[data-item-id], button, input, select, textarea, [contenteditable='true']")) return;
        const box = activeBox();
        if (box) clearSelection(box);
      });
    });

    app.querySelectorAll("[data-item-id]").forEach((row) => {
      const sortableTarget = row.matches(".tree-row, .list-row, .folder-card, .folder-tile, .graph-node");
      row.addEventListener("click", (event) => {
        if (runtime.ignoreSurfaceClick) return;
        const box = activeBox();
        if (!box) return;
        if (event.target.closest("[data-expand-id]")) return;
        runtime.contextMenu = null;
        runtime.modal = runtime.modal?.type === "selector" ? null : runtime.modal;
        const item = findItem(box, row.dataset.itemId);
        if (row.matches(".folder-card") && box.viewMode === "icons" && item?.type === "folder" && !(event.ctrlKey || event.metaKey || event.shiftKey)) {
          setIconViewFolder(box, item.id);
          box.activeItemId = item.id;
          box.selectedIds = [item.id];
          runtime.selectionAnchorId = item.id;
          if (!Array.isArray(box.openTabIds)) box.openTabIds = [];
          if (!box.openTabIds.includes(item.id)) box.openTabIds.push(item.id);
          pushNavigationPoint();
          saveState();
          render();
          return;
        }
        if (row.matches(".tree-row") && item?.type === "folder" && !(event.ctrlKey || event.metaKey)) {
          const set = new Set(box.expandedIds);
          set.has(item.id) ? set.delete(item.id) : set.add(item.id);
          box.expandedIds = [...set];
        }
        setActiveItem(box, row.dataset.itemId, event);
      });
      row.addEventListener("contextmenu", (event) => {
        const box = activeBox();
        const item = box ? findItem(box, row.dataset.itemId) : null;
        if (!box || !item || item.id === box.root.id) return;
        event.preventDefault();
        event.stopPropagation();
        box.selectedIds = [item.id];
        runtime.contextMenu = {
          itemId: item.id,
          x: event.clientX,
          y: event.clientY,
          source: row.matches(".graph-node") ? "graph" : "explorer",
        };
        saveState();
        render();
      });
      if (row.matches(".graph-node")) {
        row.addEventListener("dblclick", (event) => {
          const box = activeBox();
          const item = box ? findItem(box, row.dataset.itemId) : null;
          if (!box || item?.type !== "folder" || item.id === box.root.id) return;
          event.preventDefault();
          event.stopPropagation();
          const set = new Set(box.expandedIds || []);
          set.has(item.id) ? set.delete(item.id) : set.add(item.id);
          box.expandedIds = [...set];
          box.activeItemId = item.id;
          box.selectedIds = [item.id];
          runtime.selectionAnchorId = item.id;
          runtime.focusedItemId = item.id;
          saveState();
          render();
        });
      }
      row.addEventListener("dragstart", (event) => {
        const box = activeBox();
        if (!sortableTarget || !box || row.dataset.itemId === box.root.id) {
          event.preventDefault();
          return;
        }
        runtime.dragId = row.dataset.itemId;
        runtime.dragIds = (box.selectedIds || []).includes(runtime.dragId)
          ? (box.selectedIds || []).filter((id) => id !== box.root.id)
          : [runtime.dragId];
        if (!(box.selectedIds || []).includes(runtime.dragId)) {
          box.selectedIds = [runtime.dragId];
          runtime.selectionAnchorId = runtime.dragId;
          saveState();
        }
        row.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", runtime.dragId);
      });
      row.addEventListener("dragend", () => {
        row.classList.remove("is-dragging", "drop-before", "drop-after", "drop-into");
        app.querySelectorAll(".drop-before, .drop-after, .drop-into").forEach((item) => item.classList.remove("drop-before", "drop-after", "drop-into"));
        runtime.dragId = null;
        runtime.dragIds = [];
      });
      row.addEventListener("dragover", (event) => {
        const box = activeBox();
        if (!sortableTarget || !box || !runtime.dragId || runtime.dragId === row.dataset.itemId) return;
        const target = findItem(box, row.dataset.itemId);
        const intent = itemDropIntent(event, row, box, target);
        if (!intent) return;
        event.preventDefault();
        row.classList.toggle("drop-into", intent.type === "into");
        row.classList.toggle("drop-before", intent.type === "reorder" && intent.position === "before");
        row.classList.toggle("drop-after", intent.type === "reorder" && intent.position === "after");
      });
      row.addEventListener("dragleave", () => row.classList.remove("drop-before", "drop-after", "drop-into"));
      row.addEventListener("drop", (event) => {
        event.preventDefault();
        const box = activeBox();
        if (!sortableTarget || !box || !runtime.dragId) return;
        const target = findItem(box, row.dataset.itemId);
        const intent = itemDropIntent(event, row, box, target);
        if (!intent) return;
        if (intent.type === "into") {
          moveItemsToFolder(box, runtime.dragIds.length ? runtime.dragIds : [runtime.dragId], target.id);
          runtime.dragId = null;
          runtime.dragIds = [];
          return;
        }
        reorderItem(box, runtime.dragId, row.dataset.itemId, intent.position);
        box.selectedIds = [runtime.dragId];
        runtime.dragId = null;
        runtime.dragIds = [];
      });
      if (row.matches(".graph-node")) {
        row.addEventListener("mousedown", (event) => startGraphNodeDrag(event, row));
      }
    });

    app.querySelectorAll("[data-expand-id]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const box = activeBox();
        if (!box) return;
        const id = button.dataset.expandId;
        const set = new Set(box.expandedIds);
        set.has(id) ? set.delete(id) : set.add(id);
        box.expandedIds = [...set];
        box.activeItemId = id;
        if (!Array.isArray(box.openTabIds)) box.openTabIds = [];
        if (!box.openTabIds.includes(id)) box.openTabIds.push(id);
        box.selectedIds = [id];
        saveState();
        render();
      });
    });

    const search = app.querySelector("[data-search]");
    if (search) {
      search.addEventListener("input", () => {
        const box = activeBox();
        if (!box) return;
        box.searchQuery = search.value;
        saveState();
        render();
      });
    }

    const paletteSearch = app.querySelector("[data-palette-search]");
    if (paletteSearch) {
      paletteSearch.addEventListener("input", () => {
        runtime.paletteQuery = paletteSearch.value;
        render();
        requestAnimationFrame(() => {
          const next = app.querySelector("[data-palette-search]");
          if (next) {
            next.focus();
            next.setSelectionRange(next.value.length, next.value.length);
          }
        });
      });
    }

    const boxTitle = app.querySelector("[data-box-title]");
    if (boxTitle) {
      boxTitle.addEventListener("input", () => {
        const box = activeBox();
        box.name = boxTitle.value || "Sans titre";
        box.root.title = box.name;
        touchBox(box);
        saveState();
      });
      boxTitle.addEventListener("blur", scheduleRenderWhenIdle);
    }

    const sortMode = app.querySelector("[data-sort-mode]");
    if (sortMode) {
      sortMode.addEventListener("change", () => {
        const box = activeBox();
        box.sortMode = sortMode.value;
        if (box.sortMode !== "custom") box.customSortActive = false;
        saveState();
        render();
      });
    }

    const themeSelect = app.querySelector("[data-theme-select]");
    if (themeSelect) {
      themeSelect.addEventListener("change", () => {
        state.settings.theme = themeSelect.value === "dark" ? "dark" : "light";
        saveState();
        render();
      });
    }

    const selectionColor = app.querySelector("[data-selection-color]");
    if (selectionColor) {
      selectionColor.addEventListener("input", () => {
        state.settings.selectionColor = selectionColor.value;
        saveState();
        applyAppearance();
      });
    }

    app.querySelectorAll("[data-selection-swatch]").forEach((button) => {
      button.addEventListener("click", () => {
        state.settings.selectionColor = button.dataset.selectionSwatch;
        saveState();
        render();
      });
    });

    const treeGuideColor = app.querySelector("[data-tree-guide-color]");
    if (treeGuideColor) {
      treeGuideColor.addEventListener("input", () => {
        state.settings.treeGuideColor = treeGuideColor.value;
        saveState();
        applyAppearance();
      });
    }

    app.querySelectorAll("[data-tree-guide-swatch]").forEach((button) => {
      button.addEventListener("click", () => {
        state.settings.treeGuideColor = button.dataset.treeGuideSwatch;
        saveState();
        render();
      });
    });

    const todoColor = app.querySelector("[data-todo-color]");
    if (todoColor) {
      todoColor.addEventListener("input", () => {
        state.settings.todoColor = todoColor.value;
        saveState();
        applyAppearance();
      });
    }

    app.querySelectorAll("[data-todo-swatch]").forEach((button) => {
      button.addEventListener("click", () => {
        state.settings.todoColor = button.dataset.todoSwatch;
        saveState();
        render();
      });
    });

    const pageSize = app.querySelector("[data-page-size]");
    if (pageSize) {
      pageSize.addEventListener("change", () => {
        flushActiveEditorContent();
        const preset = normalizePageMarginPreset(state.settings.pageMarginPreset);
        const setup = normalizePageSetup(state.settings.pageSetup, preset, state.settings);
        updatePageSetup({ ...setup, sizeId: pageSize.value }, preset);
        render();
      });
    }

    const pageOrientation = app.querySelector("[data-page-orientation]");
    if (pageOrientation) {
      pageOrientation.addEventListener("change", () => {
        flushActiveEditorContent();
        const preset = normalizePageMarginPreset(state.settings.pageMarginPreset);
        const setup = normalizePageSetup(state.settings.pageSetup, preset, state.settings);
        updatePageSetup({ ...setup, orientation: pageOrientation.value }, preset);
        render();
      });
    }

    app.querySelectorAll("[data-page-margin-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        flushActiveEditorContent();
        const preset = button.dataset.pageMarginPreset;
        const presetMargins = pageMarginPresetMargins(preset, state.settings);
        const setup = normalizePageSetup(state.settings.pageSetup, preset, state.settings);
        updatePageSetup({ ...setup, margins: presetMargins || setup.margins }, preset, { rememberCustom: false });
        render();
      });
    });

    app.querySelectorAll("[data-page-margin]").forEach((input) => {
      const update = (rerender = false) => {
        flushActiveEditorContent();
        const currentPreset = normalizePageMarginPreset(state.settings.pageMarginPreset);
        const targetPreset = pageCustomMarginIds.includes(currentPreset) ? currentPreset : "custom";
        const setup = normalizePageSetup(state.settings.pageSetup, currentPreset, state.settings);
        setup.margins = {
          ...setup.margins,
          [input.dataset.pageMargin]: Number(input.value),
        };
        updatePageSetup(setup, targetPreset);
        if (rerender) {
          render();
        } else {
          applyPageSetupToCurrentView();
        }
      };
      input.addEventListener("input", () => update(false));
      input.addEventListener("change", () => update(true));
    });

    app.querySelectorAll("[data-heading-size]").forEach((input) => {
      input.addEventListener("input", () => updateHeadingPreset(input.dataset.headingSize, "size", `${input.value || 18}px`));
    });

    app.querySelectorAll("[data-heading-color]").forEach((input) => {
      input.addEventListener("input", () => updateHeadingPreset(input.dataset.headingColor, "color", input.value));
    });

    app.querySelectorAll("[data-heading-font]").forEach((select) => {
      select.addEventListener("change", () => updateHeadingPreset(select.dataset.headingFont, "fontFamily", select.value));
    });

    app.querySelectorAll("[data-heading-weight]").forEach((select) => {
      select.addEventListener("change", () => updateHeadingPreset(select.dataset.headingWeight, "weight", select.value));
    });

    const fontImport = app.querySelector("[data-font-import]");
    if (fontImport) {
      fontImport.addEventListener("change", () => importLocalFonts(fontImport.files));
    }

    const openFontFolder = app.querySelector("[data-open-font-folder]");
    if (openFontFolder) {
      openFontFolder.addEventListener("click", () => openDesktopFontFolder());
    }

    const scanFontFolder = app.querySelector("[data-scan-font-folder]");
    if (scanFontFolder) {
      scanFontFolder.addEventListener("click", () => syncDesktopFontFolder({ silent: false, rerender: true }));
    }

    app.querySelectorAll("[data-remove-local-font]").forEach((button) => {
      button.addEventListener("click", () => {
        state.settings.localFonts = (state.settings.localFonts || []).filter((font) => font.id !== button.dataset.removeLocalFont);
        saveState();
        render();
      });
    });

    app.querySelectorAll("[data-view-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        const box = activeBox();
        const nextMode = button.dataset.viewMode;
        box.viewMode = nextMode;
        if (nextMode === "icons") {
          const selectedFolder = (box.selectedIds || []).map((id) => findItem(box, id)).find((item) => item?.type === "folder");
          const active = findItem(box, box.activeItemId);
          const target = selectedFolder || (active?.type === "folder" ? active : findParent(box, active?.id) || iconViewFolder(box));
          setIconViewFolder(box, target?.id || box.root.id);
        }
        pushNavigationPoint();
        saveState();
        render();
      });
    });

    const navResizer = app.querySelector("[data-nav-resizer]");
    if (navResizer) {
      navResizer.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        const startX = event.clientX;
        const startWidth = Number(state.settings.navWidth) || 282;
        document.body.classList.add("is-resizing-nav");
        const move = (moveEvent) => {
          const width = Math.min(Math.max(startWidth + moveEvent.clientX - startX, 218), 430);
          state.settings.navWidth = width;
          document.documentElement.style.setProperty("--nav", `${width}px`);
        };
        const stop = () => {
          document.body.classList.remove("is-resizing-nav");
          window.removeEventListener("pointermove", move);
          saveState();
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", stop, { once: true });
      });
    }

    if (runtime.boxMenuOpen) {
      window.addEventListener("pointerdown", (event) => {
        if (!event.target.closest(".box-switcher")) closeBoxMenuLightly();
      }, { capture: true, once: true });
    }

    bindEditor();
    bindForms();
  }

  function updateGraphZoom(value, canvas = app.querySelector("[data-graph-canvas]"), anchor = null) {
    const previous = clampGraphZoom(state.settings.graphZoom || 1);
    const next = clampGraphZoom(value);
    state.settings.graphZoom = next;
    saveState();

    const viewport = canvas?.querySelector("[data-graph-viewport]");
    const label = app.querySelector("[data-graph-zoom-label]");
    if (label) label.textContent = graphZoomLabel(next);

    if (canvas && anchor && previous !== next) {
      const panX = clampGraphPan(state.settings?.graphPanX);
      const panY = clampGraphPan(state.settings?.graphPanY);
      canvas.scrollLeft = (anchor.worldX * next) + panX - anchor.pointerX;
      canvas.scrollTop = (anchor.worldY * next) + panY - anchor.pointerY;
    }
    if (viewport) viewport.style.setProperty("--graph-zoom", next);
  }

  function graphCanvasCenterAnchor(canvas = app.querySelector("[data-graph-canvas]")) {
    if (!canvas) return null;
    const previous = clampGraphZoom(state.settings.graphZoom || 1);
    const panX = clampGraphPan(state.settings?.graphPanX);
    const panY = clampGraphPan(state.settings?.graphPanY);
    const pointerX = canvas.clientWidth / 2;
    const pointerY = canvas.clientHeight / 2;
    return {
      pointerX,
      pointerY,
      worldX: (canvas.scrollLeft + pointerX - panX) / previous,
      worldY: (canvas.scrollTop + pointerY - panY) / previous,
    };
  }

  function bindGraphCanvas() {
    const canvas = app.querySelector("[data-graph-canvas]");
    if (!canvas) return;
    canvas.addEventListener("wheel", (event) => {
      if (!event.deltaY) return;
      event.preventDefault();
      const previous = clampGraphZoom(state.settings.graphZoom || 1);
      const factor = event.deltaY > 0 ? 0.92 : 1.08;
      const rect = canvas.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const panX = clampGraphPan(state.settings?.graphPanX);
      const panY = clampGraphPan(state.settings?.graphPanY);
      updateGraphZoom(previous * factor, canvas, {
        pointerX,
        pointerY,
        worldX: (canvas.scrollLeft + pointerX - panX) / previous,
        worldY: (canvas.scrollTop + pointerY - panY) / previous,
      });
    }, { passive: false });
  }

  function startGraphTreePan(event, nodeElement) {
    const canvas = nodeElement?.closest?.("[data-graph-canvas]");
    const viewport = canvas?.querySelector?.("[data-graph-viewport]");
    if (!canvas || event.button !== 0) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const startPanX = clampGraphPan(state.settings?.graphPanX);
    const startPanY = clampGraphPan(state.settings?.graphPanY);
    let panning = false;

    const move = (pointerEvent) => {
      const dx = pointerEvent.clientX - startX;
      const dy = pointerEvent.clientY - startY;
      if (!panning && Math.hypot(dx, dy) < 5) return;
      panning = true;
      pointerEvent.preventDefault();
      const nextPanX = clampGraphPan(startPanX + dx);
      const nextPanY = clampGraphPan(startPanY + dy);
      state.settings.graphPanX = nextPanX;
      state.settings.graphPanY = nextPanY;
      if (viewport) {
        viewport.style.setProperty("--graph-pan-x", `${nextPanX}px`);
        viewport.style.setProperty("--graph-pan-y", `${nextPanY}px`);
      }
      document.body.classList.add("is-graph-panning");
      nodeElement.classList.add("is-panning-root");
    };

    const finish = (pointerEvent) => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", finish);
      document.body.classList.remove("is-graph-panning");
      nodeElement.classList.remove("is-panning-root");
      if (!panning) return;
      runtime.ignoreSurfaceClick = true;
      window.setTimeout(() => {
        runtime.ignoreSurfaceClick = false;
      }, 0);
      saveState();
      pointerEvent.preventDefault();
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", finish, { once: true });
  }

  function startGraphNodeDrag(event, nodeElement) {
    const box = activeBox();
    const sourceId = nodeElement?.dataset?.itemId;
    const source = box ? findItem(box, sourceId) : null;
    if (!box || !source || event.button !== 0) return;
    if (source.id === box.root.id) {
      startGraphTreePan(event, nodeElement);
      return;
    }
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const draggedIds = (box.selectedIds || []).includes(sourceId)
      ? (box.selectedIds || []).filter((id) => id !== box.root.id)
      : [sourceId];
    let dragging = false;
    let currentTarget = null;
    let currentPosition = "after";

    const clearDropTarget = () => {
      app.querySelectorAll(".graph-node.drop-before, .graph-node.drop-after, .graph-node.drop-into")
        .forEach((item) => item.classList.remove("drop-before", "drop-after", "drop-into"));
      currentTarget = null;
    };

    const targetFromPointer = (pointerEvent) => {
      const targetElement = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY)?.closest?.(".graph-node[data-item-id]");
      if (!targetElement || targetElement === nodeElement) return null;
      const target = findItem(box, targetElement.dataset.itemId);
      if (!target || draggedIds.includes(target.id)) return null;
      if (draggedIds.some((id) => isDescendant(box, id, target.id))) return null;
      return { element: targetElement, item: target };
    };

    const paintTarget = (pointerEvent) => {
      clearDropTarget();
      const target = targetFromPointer(pointerEvent);
      if (!target) return;
      currentTarget = target;
      const canDropInto = target.item.type === "folder";
      if (canDropInto) {
        target.element.classList.add("drop-into");
        return;
      }
      if (!box.customSortActive) return;
      currentPosition = dropPosition(pointerEvent, target.element);
      target.element.classList.add(currentPosition === "before" ? "drop-before" : "drop-after");
    };

    const startDragIfNeeded = (pointerEvent) => {
      if (dragging) return true;
      const distance = Math.hypot(pointerEvent.clientX - startX, pointerEvent.clientY - startY);
      if (distance < 5) return false;
      dragging = true;
      runtime.dragId = sourceId;
      runtime.dragIds = draggedIds;
      box.selectedIds = draggedIds;
      runtime.selectionAnchorId = sourceId;
      nodeElement.classList.add("is-dragging");
      document.body.classList.add("is-graph-dragging");
      return true;
    };

    const move = (pointerEvent) => {
      if (!startDragIfNeeded(pointerEvent)) return;
      pointerEvent.preventDefault();
      paintTarget(pointerEvent);
    };

    const finish = (pointerEvent) => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", finish);
      document.body.classList.remove("is-graph-dragging");
      nodeElement.classList.remove("is-dragging");
      const target = currentTarget;
      clearDropTarget();
      runtime.dragId = null;
      runtime.dragIds = [];
      if (!dragging) return;
      runtime.ignoreSurfaceClick = true;
      window.setTimeout(() => {
        runtime.ignoreSurfaceClick = false;
      }, 0);
      pointerEvent.preventDefault();
      if (!target) {
        saveState();
        render();
        return;
      }
      if (target.item.type === "folder") {
        moveItemsToFolder(box, draggedIds, target.item.id);
        return;
      }
      if (box.customSortActive) {
        reorderItem(box, sourceId, target.item.id, currentPosition);
      } else {
        saveState();
        render();
      }
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", finish, { once: true });
  }

  function handleAction(event) {
    event.preventDefault();
    event.stopPropagation();
    const action = event.currentTarget.dataset.action;
    const box = activeBox();

    if (action === "create-box-modal") {
      setModal({ type: "create-box", returnToLobby: !box });
      render();
      return;
    }
    if (action === "close-modal") {
      closeModalOrRestoreGraph();
      return;
    }
    if (action === "download-preview-pdf") {
      if (runtime.modal?.type === "pdf-preview" && runtime.modal.pdfUrl) {
        triggerPdfDownload(runtime.modal.pdfUrl, runtime.modal.fileName);
        setToast("PDF MindSet enregistre sans en-tetes du navigateur.");
      }
      return;
    }
    if (action === "pdf-preview-back") {
      const previousModal = runtime.modal;
      if (previousModal?.type === "pdf-preview") {
        setModal({
          type: "print-options",
          mode: "pdf",
          noteId: previousModal.noteId,
          options: normalizePrintOptions(previousModal.options),
        });
        render();
      }
      return;
    }
    if (action === "show-lobby") {
      if (box) flushActiveEditorContent();
      cancelDeferredEditorWork({ suppressIdleMs: 650 });
      runtime.editorRange = null;
      state.currentBoxId = null;
      setModal(null);
      pushNavigationPoint();
      saveState();
      render();
      return;
    }
    if (action === "open-box") {
      switchBoxById(event.currentTarget.dataset.boxId);
      return;
    }
    if (action === "box-lock-click") {
      const target = state.boxes.find((item) => item.id === event.currentTarget.dataset.boxId);
      if (!target) return;
      if (target.passwordHash) {
        if (runtime.unlockedBoxIds.has(target.id)) {
          lockBox(target.id);
        }
      } else {
        runtime.contextMenu = null;
        setModal({ type: "box-add-password-prompt", boxId: target.id });
        render();
      }
      return;
    }
    if (action === "rename-box") {
      openBoxProtectedAction(event.currentTarget.dataset.boxId, "rename");
      return;
    }
    if (action === "delete-box") {
      openBoxProtectedAction(event.currentTarget.dataset.boxId, "delete");
      return;
    }
    if (action === "change-box-password") {
      openBoxProtectedAction(event.currentTarget.dataset.boxId, "change-password");
      return;
    }
    if (action === "confirm-add-box-password") {
      openBoxActionAfterAuth(event.currentTarget.dataset.boxId, "add-password");
      return;
    }
    if (action === "confirm-delete-box-first") {
      setModal({ type: "confirm-delete-box-final", boxId: event.currentTarget.dataset.boxId });
      render();
      return;
    }
    if (action === "confirm-delete-box-final") {
      deleteBoxById(event.currentTarget.dataset.boxId);
      return;
    }
    if (action === "check-updates") {
      runDesktopUpdateAction("check");
      return;
    }
    if (action === "download-update") {
      runDesktopUpdateAction("download");
      return;
    }
    if (action === "install-update") {
      runDesktopUpdateAction("install");
      return;
    }
    if (action === "history-back" || action === "history-forward") {
      window.history.go(action === "history-back" ? -1 : 1);
      return;
    }
    if (!box) return;

    if (action === "open-mindset-pdf-preview") {
      const note = findItem(box, runtime.modal?.noteId);
      if (note?.type === "note") {
        const form = event.currentTarget.closest("[data-print-options-form]");
        const options = printOptionsFromForm(new FormData(form));
        const sourceHtml = activePrintableSource(box, note);
        openPrintableNotePdfPreview(box, note, options, sourceHtml);
      }
      return;
    }

    if (action === "confirm-delete") {
      deleteSelected(box, runtime.modal?.ids || []);
      return;
    }

    if (action === "export-note-word" || action === "export-note-txt") {
      const note = findItem(box, box.activeItemId);
      if (note?.type === "note") {
        if (action === "export-note-word") {
          exportNoteAsWord(box, note);
        } else {
          exportNoteAsTxt(box, note);
        }
      }
      return;
    }

    if (action === "export-note-pdf" || action === "print-note") {
      const note = findItem(box, box.activeItemId);
      if (note?.type === "note") {
        flushActiveEditorContent();
        setModal({
          type: "print-options",
          mode: action === "export-note-pdf" ? "pdf" : "print",
          noteId: note.id,
          options: defaultPrintOptions(),
        });
        render();
      }
      return;
    }

    if (action === "toggle-theme") {
      state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
      saveState();
      render();
    }
    if (action === "toggle-box-menu") {
      runtime.boxMenuOpen = !runtime.boxMenuOpen;
      render();
    }
    if (action === "toggle-right-panel") {
      state.settings.rightPanelOpen = state.settings.rightPanelOpen === false;
      saveState();
      render();
    }
    if (action === "toggle-left-panel") {
      state.settings.leftPanelOpen = state.settings.leftPanelOpen === false;
      saveState();
      render();
    }
    if (action === "open-settings") {
      setModal({ type: "settings" });
      render();
    }
    if (action === "rename-item") {
      const returnToGraph = runtime.contextMenu?.source === "graph" || graphViewVisible();
      runtime.contextMenu = null;
      setModal({ type: "rename-item", itemId: event.currentTarget.dataset.renameTarget, returnToGraph });
      render();
    }
    if (action === "duplicate-context-item") {
      const id = event.currentTarget.dataset.duplicateTarget;
      runtime.contextMenu = null;
      duplicateItems(box, [id]);
      return;
    }
    if (action === "delete-context-item") {
      const id = event.currentTarget.dataset.deleteTarget;
      const returnToGraph = runtime.contextMenu?.source === "graph" || graphViewVisible();
      runtime.contextMenu = null;
      requestDeleteItems(box, [id], { returnToGraph });
    }
    if (action === "open-context-item") {
      openItemFromGraph(box, event.currentTarget.dataset.openTarget);
      return;
    }
    if (action === "show-explorer") {
      runtime.sideTab = "explorer";
      pushNavigationPoint();
      render();
    }
    if (action === "show-bookmarks") {
      runtime.sideTab = "bookmarks";
      pushNavigationPoint();
      render();
    }
    if (action === "toggle-explorer-tools") {
      runtime.explorerToolsOpen = !runtime.explorerToolsOpen;
      render();
    }
    if (action === "toggle-custom-sort") {
      box.customSortActive = !box.customSortActive;
      if (box.customSortActive) box.sortMode = "custom";
      saveState();
      render();
    }
    if (action === "toggle-bookmark") {
      const active = findItem(box, box.activeItemId);
      if (active && active.type === "note") {
        const set = new Set(box.bookmarkedIds || []);
        set.has(active.id) ? set.delete(active.id) : set.add(active.id);
        box.bookmarkedIds = [...set];
        saveState();
        render();
      }
    }
    if (action === "toggle-editor-view") {
      if (normalizeEditorViewMode(state.settings.editorViewMode) === "pages") {
        const editor = app.querySelector(".editor-page.is-page-mode [data-note-editor]");
        const note = findItem(box, box.activeItemId);
        if (editor && note?.type === "note") {
          note.content = mergePageEditorHtml({ keepActiveBlankSheet: isIndependentPageFlow() });
          note.modifiedAt = now();
          touchBox(box);
          saveState();
        }
      } else {
        flushActiveEditorContent();
      }
      state.settings.editorViewMode = state.settings.editorViewMode === "pages" ? "flow" : "pages";
      saveState();
      render();
    }
    if (action === "toggle-page-flow-mode") {
      const editor = app.querySelector(".editor-page.is-page-mode [data-note-editor]");
      const note = findItem(box, box.activeItemId);
      const nextMode = isContinuousPageFlow() ? "independent" : "continuous";
      if (editor && note?.type === "note") {
        note.content = mergePageEditorHtml({
          keepActiveBlankSheet: true,
          keepSheets: nextMode === "independent",
        });
        note.modifiedAt = now();
        touchBox(box);
      }
      state.settings.pageFlowMode = nextMode;
      saveState();
      render();
    }
    if (action === "toggle-editor-split-view") {
      if (normalizeEditorViewMode(state.settings.editorViewMode) === "pages") {
        const editor = app.querySelector(".editor-page.is-page-mode [data-note-editor]");
        const note = findItem(box, box.activeItemId);
        if (editor && note?.type === "note") {
          note.content = mergePageEditorHtml({ keepActiveBlankSheet: isIndependentPageFlow() });
          note.modifiedAt = now();
          touchBox(box);
          saveState();
        }
      } else {
        flushActiveEditorContent();
      }
      state.settings.editorViewMode = state.settings.editorViewMode === "split" ? "flow" : "split";
      saveState();
      render();
    }
    if (action === "page-zoom-out") {
      flushActiveEditorContent();
      state.settings.pageZoom = clampPageZoom((state.settings.pageZoom || 1) * 0.82);
      saveState();
      render();
    }
    if (action === "page-zoom-in") {
      flushActiveEditorContent();
      state.settings.pageZoom = clampPageZoom((state.settings.pageZoom || 1) * 1.12);
      saveState();
      render();
    }
    if (action === "cycle-page-margins") {
      flushActiveEditorContent();
      const nextPreset = nextPageMarginPreset(state.settings.pageMarginPreset);
      const setup = normalizePageSetup(state.settings.pageSetup, nextPreset, state.settings);
      updatePageSetup({ ...setup, margins: pageMarginPresetMargins(nextPreset, state.settings) || setup.margins }, nextPreset, { rememberCustom: false });
      render();
    }
    if (action === "add-independent-page") {
      addIndependentPage(box);
      return;
    }
    if (action === "new-note") createNote(box);
    if (action === "new-folder") createFolder(box);
    if (action === "collapse-all") expandAll(box, false);
    if (action === "expand-all") expandAll(box, true);
    if (action === "delete-selected") requestDeleteSelected(box);
    if (action === "move-selected") {
      const target = app.querySelector("[data-move-target]")?.value;
      if (target) moveSelected(box, target);
    }
    if (action === "open-selector") {
      runtime.paletteQuery = "";
      setModal({ type: "selector" });
      render();
    }
    if (action === "quick-note") createNote(box, ensureQuickFolder(box), true);
    if (action === "toggle-graph") {
      setModal(runtime.modal?.type === "graph-full" ? null : { type: "graph-full" });
      render();
    }
    if (action === "set-graph-direction") {
      state.settings.graphDirection = normalizeGraphDirection(event.currentTarget.dataset.graphDirection);
      saveState();
      render();
    }
    if (action === "graph-zoom-in") updateGraphZoom((state.settings.graphZoom || 1) * 1.12, undefined, graphCanvasCenterAnchor());
    if (action === "graph-zoom-out") updateGraphZoom((state.settings.graphZoom || 1) / 1.12, undefined, graphCanvasCenterAnchor());
    if (action === "graph-zoom-reset") updateGraphZoom(1, undefined, graphCanvasCenterAnchor());
    if (action === "close-graph") {
      setModal(null);
      render();
    }
  }

  function fontFormatFromFileName(name) {
    const lower = String(name || "").toLowerCase();
    return supportedFontExtensions.find((extension) => lower.endsWith(extension)) || "";
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Font read failed"));
      reader.readAsDataURL(file);
    });
  }

  async function importLocalFonts(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const nextFonts = [...(state.settings.localFonts || [])];
    let added = 0;

    for (const file of files) {
      const format = fontFormatFromFileName(file.name);
      if (!format || nextFonts.length >= localFontLimit) continue;
      try {
        const id = uid("font");
        nextFonts.push({
          id,
          name: normalizeLocalFontName(file.name),
          family: normalizeFontFamily("", id),
          format,
          dataUrl: await readFileAsDataUrl(file),
        });
        added += 1;
      } catch (error) {
        console.warn("MindSet font import failed", error);
      }
    }

    state.settings.localFonts = normalizeLocalFonts(nextFonts);
    saveState();
    render();
    setToast(added ? `${added} police${added > 1 ? "s" : ""} ajoutee${added > 1 ? "s" : ""}.` : "Format de police non reconnu.");
  }

  function mergeDesktopFonts(fonts) {
    const previous = JSON.stringify(state.settings.localFonts || []);
    const manualFonts = (state.settings.localFonts || []).filter((font) => font.source !== "desktop-folder");
    const desktopFonts = normalizeLocalFonts((fonts || []).map((font) => ({ ...font, source: "desktop-folder" })));
    state.settings.localFonts = normalizeLocalFonts([...manualFonts, ...desktopFonts]);
    return previous !== JSON.stringify(state.settings.localFonts || []);
  }

  async function syncDesktopFontFolder(options = {}) {
    const bridge = desktopBridge();
    if (!bridge?.scanFontsFolder) return false;
    try {
      const result = await bridge.scanFontsFolder();
      if (result?.status === "error") {
        if (!options.silent) setToast(result.message || "Impossible de lire le dossier des polices.");
        return false;
      }
      const changed = mergeDesktopFonts(result?.fonts || []);
      if (changed) {
        saveState();
        applyAppearance();
        if (options.rerender || runtime.modal?.type === "settings") render();
      }
      if (!options.silent) {
        const count = (result?.fonts || []).length;
        setToast(count ? `${count} police${count > 1 ? "s" : ""} detectee${count > 1 ? "s" : ""}.` : "Dossier de polices ouvert. Glisse tes fichiers dedans.");
      }
      return changed;
    } catch (error) {
      if (!options.silent) setToast(error?.message || "Impossible de lire le dossier des polices.");
      return false;
    }
  }

  async function openDesktopFontFolder() {
    const bridge = desktopBridge();
    if (!bridge?.openFontsFolder) {
      setToast("Cette option est disponible dans l'app Windows installee.");
      return;
    }
    try {
      const result = await bridge.openFontsFolder();
      if (result?.status === "error") {
        setToast(result.message || "Impossible d'ouvrir le dossier des polices.");
        return;
      }
      runtime.fontFolderOpenedAt = Date.now();
      mergeDesktopFonts(result?.fonts || []);
      saveState();
      applyAppearance();
      if (runtime.modal?.type === "settings") render();
      setToast("Dossier de polices ouvert. Glisse ta police dedans puis reviens ici.");
    } catch (error) {
      setToast(error?.message || "Impossible d'ouvrir le dossier des polices.");
    }
  }

  function bindForms() {
    const createBoxForm = app.querySelector("[data-create-box-form]");
    if (createBoxForm) {
      createBoxForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData(createBoxForm);
        const name = String(form.get("name") || "Nouvelle boîte").trim() || "Nouvelle boîte";
        const password = normalizeBoxCode(form.get("password"));
        const createdAt = now();
        rememberState("Creation de boite");
        const box = {
          id: uid("box"),
          name,
          passwordHash: password ? await sha256(password) : "",
          createdAt,
          modifiedAt: createdAt,
          activeItemId: "",
          selectedIds: [],
          expandedIds: [],
          viewMode: "tree",
          sortMode: "custom",
          customSortActive: false,
          iconFolderId: "",
          searchQuery: "",
          bookmarkedIds: [],
          openTabIds: [],
          root: {
            id: uid("folder"),
            type: "folder",
            title: name,
            createdAt,
            modifiedAt: createdAt,
            children: [],
          },
        };
        box.activeItemId = box.root.id;
        box.selectedIds = [];
        box.expandedIds = [box.root.id];
        box.openTabIds = [box.root.id];
        box.iconFolderId = box.root.id;
        state.boxes.push(box);
        state.currentBoxId = runtime.modal?.returnToLobby ? null : box.id;
        if (password) {
          runtime.unlockedBoxIds.add(box.id);
          setupBoxEncryption(box.id, password);
        }
        setModal(null);
        saveState();
        render();
      });
    }

    const unlockForm = app.querySelector("[data-unlock-box-form]");
    if (unlockForm) {
      unlockForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          const box = state.boxes.find((item) => item.id === runtime.modal?.boxId);
          const password = new FormData(unlockForm).get("password");
          const code = box ? await matchingBoxCode(password, box.passwordHash) : null;
          if (box && code !== null) {
            if (!(await unlockProtectedBox(box, code))) {
              modalError("impossible de dechiffrer cette boite");
              return;
            }
            openUnlockedBox(box);
          } else {
            modalError("mot de passe incorrect");
          }
        } catch (error) {
          console.error("MindSet unlock failed", error);
          modalError("impossible d'ouvrir cette boite");
        }
      });
    }

    const boxAuthForm = app.querySelector("[data-box-auth-form]");
    if (boxAuthForm) {
      boxAuthForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const boxId = runtime.modal?.boxId;
        const intent = runtime.modal?.intent;
        const box = state.boxes.find((item) => item.id === boxId);
        const password = new FormData(boxAuthForm).get("password");
        try {
          if (!box || !box.passwordHash || !(await boxCodeMatches(password, box.passwordHash))) {
            modalError("mot de passe incorrect");
            return;
          }
        } catch (error) {
          console.error("MindSet box auth failed", error);
          modalError("impossible de verifier le code");
          return;
        }
        openBoxActionAfterAuth(box.id, intent);
      });
    }

    const renameBoxForm = app.querySelector("[data-rename-box-form]");
    if (renameBoxForm) {
      renameBoxForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const box = state.boxes.find((item) => item.id === runtime.modal?.boxId);
        const name = String(new FormData(renameBoxForm).get("name") || "").trim();
        if (!box || !name) return;
        rememberState("Renommage de boite");
        box.name = name;
        box.root.title = name;
        box.modifiedAt = now();
        setModal(null);
        saveState();
        render();
      });
    }

    const boxPasswordForm = app.querySelector("[data-box-password-form]");
    if (boxPasswordForm) {
      let submittingBoxPassword = false;
      const rememberBoxPasswordDraft = () => {
        if (runtime.modal?.type !== "box-password") return;
        const form = new FormData(boxPasswordForm);
        runtime.modal = {
          ...runtime.modal,
          draft: {
            oldPassword: String(form.get("oldPassword") || ""),
            newPassword: String(form.get("newPassword") || ""),
            confirmPassword: String(form.get("confirmPassword") || ""),
          },
        };
      };
      ["input", "change", "focusin", "focusout", "pointerdown", "keyup"].forEach((eventName) => {
        boxPasswordForm.addEventListener(eventName, rememberBoxPasswordDraft);
      });

      const boxPasswordValues = () => {
        rememberBoxPasswordDraft();
        const draft = runtime.modal?.draft || {};
        const fieldValue = (name) => {
          const field = boxPasswordForm.elements?.[name];
          return typeof field?.value === "string" ? field.value : draft[name] || "";
        };
        return {
          oldPassword: fieldValue("oldPassword"),
          newPassword: normalizeBoxCode(fieldValue("newPassword")),
          confirmPassword: normalizeBoxCode(fieldValue("confirmPassword")),
        };
      };

      const commitBoxPassword = async () => {
        if (submittingBoxPassword) return;
        submittingBoxPassword = true;
        const modal = runtime.modal;
        const box = state.boxes.find((item) => item.id === modal?.boxId);
        const mode = modal?.mode === "change" ? "change" : "add";
        const { oldPassword, newPassword, confirmPassword } = boxPasswordValues();
        if (!box) {
          submittingBoxPassword = false;
          return;
        }
        try {
          let matchedOldCode = null;
          if (mode === "change") {
            matchedOldCode = box.passwordHash ? await matchingBoxCode(oldPassword, box.passwordHash) : null;
            if (matchedOldCode === null) {
              modalError("mot de passe incorrect");
              return;
            }
          }
          if (!newPassword || newPassword !== confirmPassword) {
            modalError("les deux nouveaux codes ne correspondent pas");
            return;
          }
          if (mode === "change" && !box.root && box.encrypted) {
            const opened = await decryptBoxBlob(matchedOldCode, box.encrypted);
            if (!opened) {
              modalError("impossible de rechiffrer la boite");
              return;
            }
            rememberState("Modification de code");
            const salt = bytesToBase64(window.crypto.getRandomValues(new Uint8Array(16)));
            const key = await deriveBoxKey(newPassword, salt);
            const blob = await encryptBoxPayload({ key, salt }, opened.payloadJson);
            if (!blob) {
              modalError("impossible de rechiffrer la boite");
              return;
            }
            box.encrypted = blob;
            box.passwordHash = await sha256(newPassword);
            box.modifiedAt = now();
            setModal(null);
            saveState();
            render();
            setToast("Code de la boite modifie.");
            return;
          }
          rememberState(mode === "change" ? "Modification de code" : "Ajout de code");
          box.passwordHash = await sha256(newPassword);
          box.modifiedAt = now();
          if (box.root) {
            runtime.unlockedBoxIds.add(box.id);
            setupBoxEncryption(box.id, newPassword);
          }
          setModal(null);
          saveState();
          render();
          setToast(mode === "change" ? "Code de la boite modifie." : "Code ajoute a la boite.");
        } catch (error) {
          console.error("MindSet box password update failed", error);
          modalError("impossible d'enregistrer le code");
        } finally {
          submittingBoxPassword = false;
        }
      };

      boxPasswordForm.addEventListener("submit", (event) => {
        event.preventDefault();
        commitBoxPassword();
      });
      boxPasswordForm.querySelector("[data-box-password-submit]")?.addEventListener("click", (event) => {
        event.preventDefault();
        commitBoxPassword();
      });
    }

    const renameForm = app.querySelector("[data-rename-item-form]");
    if (renameForm) {
      const renameField = renameForm.querySelector("input[name='name']");
      const commitRename = () => {
        const box = activeBox();
        const item = box ? findItem(box, runtime.modal?.itemId) : null;
        const field = renameForm.elements?.name;
        const name = String(field?.value || "").trim();
        if (!box || !item || !name) {
          field?.focus?.();
          return;
        }
        rememberState("Renommage");
        const returnToGraph = !!runtime.modal?.returnToGraph;
        item.title = name;
        item.modifiedAt = now();
        if (box.activeItemId === item.id) updateTabTitle(item.id, item.title);
        touchBox(box);
        runtime.modal = returnToGraph ? { type: "graph-full" } : null;
        saveState();
        render();
      };
      renameForm.addEventListener("submit", (event) => {
        event.preventDefault();
        event.stopPropagation();
        commitRename();
      });
      ["pointerdown", "mousedown", "click", "selectstart"].forEach((eventName) => {
        renameField?.addEventListener(eventName, (event) => {
          event.stopPropagation();
        });
      });
      renameField?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" || event.isComposing) return;
        event.preventDefault();
        event.stopPropagation();
        commitRename();
      });
      renameForm.querySelector("button[type='submit']")?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        commitRename();
      });
    }

    const printOptionsForm = app.querySelector("[data-print-options-form]");
    if (printOptionsForm) {
      printOptionsForm.addEventListener("submit", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const box = activeBox();
        const note = box ? findItem(box, runtime.modal?.noteId) : null;
        if (!box || note?.type !== "note") {
          setModal(null);
          render();
          return;
        }
        const mode = runtime.modal?.mode === "pdf" ? "pdf" : "print";
        const options = printOptionsFromForm(new FormData(printOptionsForm));
        const sourceHtml = activePrintableSource(box, note);
        if (mode === "pdf") {
          setModal(null);
          render();
          openPrintableNoteWindow(box, note, "system-pdf", options, sourceHtml);
          return;
        }
        setModal(null);
        render();
        openPrintableNoteWindow(box, note, mode, options, sourceHtml);
      });
    }
  }

  function cssNumber(element, name, fallback) {
    const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  }

  function configurePageSheet(sheet, index, options = {}) {
    if (!sheet) return sheet;
    sheet.classList.add("page-sheet");
    sheet.dataset.pageSheet = String(index);
    if (options.editable) {
      sheet.setAttribute("contenteditable", "true");
      sheet.setAttribute("spellcheck", "true");
      sheet.setAttribute("tabindex", "0");
    } else {
      sheet.removeAttribute("contenteditable");
      sheet.removeAttribute("spellcheck");
      sheet.removeAttribute("tabindex");
    }
    return sheet;
  }

  function createPageSheet(editor, index) {
    const sheet = document.createElement("div");
    sheet.className = "page-sheet";
    configurePageSheet(sheet, index, { editable: isIndependentPageMode() });
    editor.appendChild(sheet);
    return sheet;
  }

  function renumberPageSheets(editor) {
    const sheets = [...(editor?.querySelectorAll?.(".page-sheet") || [])];
    sheets.forEach((sheet, index) => configurePageSheet(sheet, index, { editable: isIndependentPageMode() }));
    return sheets;
  }

  function createPageSheetAfter(editor, sheet) {
    const nextSheet = document.createElement("div");
    nextSheet.className = "page-sheet";
    if (sheet?.parentElement === editor) {
      sheet.after(nextSheet);
    } else {
      editor.appendChild(nextSheet);
    }
    renumberPageSheets(editor);
    return nextSheet;
  }

  const paginationBlockSelector = "p, div, blockquote, h1, h2, h3, ul, ol";

  function appendEditableNodeAsBlocks(node, blocks) {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const paragraph = document.createElement("p");
      paragraph.textContent = node.textContent;
      blocks.push(paragraph);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.classList.contains("page-sheet")) {
      [...node.childNodes].forEach((child) => appendEditableNodeAsBlocks(child, blocks));
      return;
    }
    const directText = [...node.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
    const nestedBlocks = [...node.children].filter((child) => child.matches?.(paginationBlockSelector));
    if ((node.tagName === "DIV" || node.tagName === "SPAN") && nestedBlocks.length && !directText) {
      const inheritedStyle = node.getAttribute?.("style") || "";
      [...node.childNodes].forEach((child) => {
        if (inheritedStyle && child.nodeType === Node.ELEMENT_NODE) {
          child.setAttribute("style", `${inheritedStyle};${child.getAttribute("style") || ""}`);
        }
        appendEditableNodeAsBlocks(child, blocks);
      });
      return;
    }
    blocks.push(node);
  }

  function stripContinuationMarkers(block) {
    if (block.nodeType !== Node.ELEMENT_NODE) return;
    delete block.dataset.splitContinuation;
    block.classList?.remove("is-split-continuation");
    if (block.getAttribute?.("class") === "") block.removeAttribute("class");
  }

  function mergeSplitContinuations(blocks) {
    const merged = [];
    blocks.forEach((block) => {
      const isContinuation = block.nodeType === Node.ELEMENT_NODE && block.dataset?.splitContinuation === "true";
      const previous = merged[merged.length - 1];
      if (isContinuation && previous && previous.nodeType === Node.ELEMENT_NODE && previous.tagName === block.tagName) {
        if (["UL", "OL"].includes(block.tagName)) {
          const sameKind = previous.getAttribute("class") === block.getAttribute("class");
          if (sameKind) {
            const firstItem = block.firstElementChild;
            if (firstItem?.dataset?.splitContinuation === "true" && previous.lastElementChild) {
              while (firstItem.firstChild) previous.lastElementChild.appendChild(firstItem.firstChild);
              firstItem.remove();
              previous.lastElementChild.normalize();
            }
            while (block.firstChild) {
              stripContinuationMarkers(block.firstChild);
              previous.appendChild(block.firstChild);
            }
            return;
          }
        } else {
          while (block.firstChild) previous.appendChild(block.firstChild);
          previous.normalize();
          return;
        }
      }
      stripContinuationMarkers(block);
      if (block.nodeType === Node.ELEMENT_NODE) {
        block.querySelectorAll?.("[data-split-continuation]").forEach(stripContinuationMarkers);
      }
      merged.push(block);
    });
    return merged;
  }

  function editableBlocksFromHtml(html) {
    const source = document.createElement("div");
    source.innerHTML = html || "<p><br></p>";
    const pageSheets = [...source.querySelectorAll(".page-sheet")];
    const sourceNodes = pageSheets.length
      ? pageSheets.flatMap((sheet) => [...sheet.childNodes])
      : [...source.childNodes];
    const collected = [];
    sourceNodes.forEach((node) => appendEditableNodeAsBlocks(node, collected));
    const blocks = mergeSplitContinuations(collected);
    if (!blocks.length) {
      const paragraph = document.createElement("p");
      paragraph.appendChild(document.createElement("br"));
      blocks.push(paragraph);
    }
    return blocks;
  }

  function normalizedEditorHtml(html) {
    const container = document.createElement("div");
    editableBlocksFromHtml(html).forEach((block) => container.appendChild(block));
    return container.innerHTML || "<p><br></p>";
  }

  function isMeaningfulEditorHtml(html) {
    const source = document.createElement("div");
    source.innerHTML = html || "";
    if (source.textContent.replace(/\u00a0/g, " ").trim()) return true;
    return !!source.querySelector("h1, h2, h3, li, img, video, audio, iframe, table, hr");
  }

  function hasIntentionalBlankStructure(html) {
    const source = document.createElement("div");
    source.innerHTML = html || "";
    const blocks = source.querySelectorAll("p, div, blockquote, li, h1, h2, h3").length;
    const breaks = source.querySelectorAll("br").length;
    return blocks > 0 || breaks > 1;
  }

  function sheetHasUserStructure(sheet) {
    if (!sheet) return false;
    const clone = sheet.cloneNode(true);
    removeEditorSelectionMarkers(clone);
    clone.querySelectorAll("[data-pagination-probe]").forEach((probe) => probe.remove());
    const html = clone.classList?.contains("page-sheet") ? clone.innerHTML : clone.outerHTML;
    return isMeaningfulEditorHtml(html) || hasIntentionalBlankStructure(html);
  }

  function isEditorPageBlank(editor) {
    return !isMeaningfulEditorHtml(editor?.innerHTML || "");
  }

  function isPageSheetBlank(sheet) {
    return !isMeaningfulEditorHtml(sheet?.innerHTML || "");
  }

  function currentPageSheet(editor) {
    const selection = window.getSelection();
    let node = selection?.anchorNode || null;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const selectedSheet = node?.closest?.(".page-sheet");
    if (selectedSheet && editor?.contains(selectedSheet)) return selectedSheet;
    return editor?.querySelector?.(".page-sheet") || null;
  }

  function sheetContentGap(sheet) {
    const style = getComputedStyle(sheet);
    const rect = sheet.getBoundingClientRect();
    const innerBottom = rect.bottom - (Number.parseFloat(style.paddingBottom) || 0);
    const children = [...sheet.children].filter((child) => child.dataset?.paginationProbe !== "true");
    const last = children[children.length - 1];
    if (!last) return Number.POSITIVE_INFINITY;
    return innerBottom - last.getBoundingClientRect().bottom;
  }

  function needsPagedLayoutRefresh(editor) {
    const sheets = [...(editor?.querySelectorAll?.(".page-sheet") || [])];
    if (!sheets.length) return true;
    return sheets.some((sheet, index) => {
      if (sheet.classList.contains("is-overflow-accepted")) return sheet.children.length > 1;
      if (sheet.scrollHeight > sheet.clientHeight + 2) return true;
      const next = sheets[index + 1];
      if (!next || !sheetHasUserStructure(next)) return false;
      const gap = sheetContentGap(sheet);
      if (gap < 34) return false;
      const nextFirst = [...next.children].find((child) => child.dataset?.paginationProbe !== "true");
      if (!nextFirst) return false;
      const nextHeight = nextFirst.getBoundingClientRect().height;
      const splittable = splittableTextBlock(nextFirst) || ["UL", "OL"].includes(nextFirst.tagName);
      return nextHeight <= gap + 1 || splittable;
    }) || sheets.slice(1).some((sheet) => !sheetHasUserStructure(sheet));
  }

  function sheetOverflows(sheet) {
    return !!sheet && sheet.scrollHeight > sheet.clientHeight + 2;
  }

  function inputCanGrowPage(event) {
    const type = event?.inputType || "";
    if (!type) return true;
    return type.startsWith("insert");
  }

  function showPageFullNotice(message = "Page pleine") {
    const notice = app.querySelector("[data-page-full-notice]");
    if (!notice) return;
    notice.textContent = message;
    notice.classList.add("is-visible");
    window.clearTimeout(runtime.pageFullNoticeTimer);
    runtime.pageFullNoticeTimer = window.setTimeout(() => {
      notice.classList.remove("is-visible");
    }, 1800);
  }

  function rememberIndependentPageSnapshot(editor) {
    if (!isIndependentPageMode() || !editor) return;
    const sheet = currentPageSheet(editor) || editor.querySelector(".page-sheet");
    if (!sheet) return;
    runtime.independentPageSnapshot = {
      index: Number(sheet.dataset.pageSheet || 0),
      html: sheet.innerHTML,
      selectionOffsets: getEditorSelectionOffsets(sheet),
    };
  }

  function restoreIndependentPageSnapshot(editor) {
    const snapshot = runtime.independentPageSnapshot;
    if (!editor || !snapshot) return false;
    const sheet = editor.querySelector(`[data-page-sheet="${snapshot.index}"]`) || currentPageSheet(editor);
    if (!sheet) return false;
    sheet.innerHTML = snapshot.html || "<p><br></p>";
    configurePageSheet(sheet, Number(sheet.dataset.pageSheet || snapshot.index || 0), { editable: true });
    if (!restoreEditorSelectionOffsets(sheet, snapshot.selectionOffsets)) placeCaretAtEnd(sheet);
    sheet.focus({ preventScroll: true });
    saveEditorSelection(editor);
    return true;
  }

  function enforceIndependentPageLimit(editor, note, box) {
    if (!isIndependentPageMode() || !editor) return false;
    const sheet = currentPageSheet(editor) || editor.querySelector(".page-sheet");
    if (!sheet || !sheetOverflows(sheet)) return false;
    restoreIndependentPageSnapshot(editor);
    showPageFullNotice();
    if (note && box) {
      note.content = editorSnapshotContent(editor);
      note.modifiedAt = now();
      touchBox(box);
      updateEditorStats(note);
      saveState();
    }
    syncPagedEditorMetrics(editor);
    return true;
  }

  function selectIndependentPageContents(editor) {
    if (!isIndependentPageMode()) return false;
    const sheet = currentPageSheet(editor) || editor?.querySelector?.(".page-sheet");
    if (!sheet) return false;
    const range = document.createRange();
    range.selectNodeContents(sheet);
    const selection = window.getSelection();
    if (!selection) return false;
    selection.removeAllRanges();
    selection.addRange(range);
    sheet.focus({ preventScroll: true });
    saveEditorSelection(editor);
    return true;
  }

  function selectEditorContents(editor) {
    if (!editor) return false;
    if (isIndependentPageMode()) return selectIndependentPageContents(editor);
    const range = document.createRange();
    range.selectNodeContents(editor);
    const selection = window.getSelection();
    if (!selection) return false;
    selection.removeAllRanges();
    selection.addRange(range);
    editor.focus({ preventScroll: true });
    saveEditorSelection(editor);
    return true;
  }

  function removeEditorSelectionMarkers(root) {
    root?.querySelectorAll?.("[data-editor-selection-marker]").forEach((marker) => marker.remove());
  }

  function cleanNodeForMerge(node, keepMarkers) {
    if (keepMarkers || node.nodeType !== Node.ELEMENT_NODE) return node;
    if (node.matches?.("[data-editor-selection-marker]")) return document.createTextNode("");
    const clone = node.cloneNode(true);
    if (clone.classList?.contains("page-sheet")) {
      clone.removeAttribute("contenteditable");
      clone.removeAttribute("spellcheck");
      clone.removeAttribute("tabindex");
      clone.classList.remove("is-overflow-accepted");
    }
    removeEditorSelectionMarkers(clone);
    return clone;
  }

  function mergePageEditorHtml(options = {}) {
    const keepMarkers = !!options.keepMarkers;
    const keepSheets = !!options.keepSheets;
    const editor = app.querySelector(".editor-page.is-page-mode [data-note-editor]");
    if (!editor) return "<p><br></p>";
    const parts = [...editor.childNodes].map((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("page-sheet")) {
        const source = cleanNodeForMerge(node, keepMarkers);
        const structureSource = cleanNodeForMerge(node, false);
        const structureHtml = structureSource.innerHTML;
        const hasStructure = isMeaningfulEditorHtml(structureHtml) || hasIntentionalBlankStructure(structureHtml);
        return {
          html: keepSheets ? source.outerHTML : source.innerHTML,
          meaningful: hasStructure,
        };
      }
      if (node.nodeType === Node.TEXT_NODE) {
        return { html: escapeHtml(node.textContent), meaningful: !!node.textContent.replace(/\u00a0/g, " ").trim() };
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const source = cleanNodeForMerge(node, keepMarkers);
        return { html: source.outerHTML, meaningful: isMeaningfulEditorHtml(source.outerHTML) };
      }
      return { html: "", meaningful: false };
    });
    if (!parts.length) return "<p><br></p>";
    const keptParts = parts.filter((part) => part.meaningful);
    return (keptParts.length ? keptParts : parts.slice(0, 1))
      .map((part) => part.html)
      .join("")
      .trim() || "<p><br></p>";
  }

  function getEditorSelectionOffsets(editor) {
    const selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    if (!selectionInsideEditor(editor, range)) return null;
    const beforeStart = range.cloneRange();
    beforeStart.selectNodeContents(editor);
    beforeStart.setEnd(range.startContainer, range.startOffset);
    const beforeEnd = range.cloneRange();
    beforeEnd.selectNodeContents(editor);
    beforeEnd.setEnd(range.endContainer, range.endOffset);
    return {
      start: beforeStart.toString().length,
      end: beforeEnd.toString().length,
    };
  }

  function textPointFromOffset(root, offset) {
    const targetOffset = Math.max(Number(offset) || 0, 0);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    let consumed = 0;
    let lastText = null;
    while (node) {
      lastText = node;
      const nextConsumed = consumed + node.textContent.length;
      if (targetOffset < nextConsumed) {
        return { node, offset: Math.max(targetOffset - consumed, 0) };
      }
      consumed = nextConsumed;
      node = walker.nextNode();
    }
    if (lastText) return { node: lastText, offset: lastText.textContent.length };
    return { node: root, offset: root.childNodes.length };
  }

  function restoreEditorSelectionOffsets(editor, offsets) {
    if (!editor || !offsets) return false;
    const start = textPointFromOffset(editor, offsets.start);
    const end = textPointFromOffset(editor, offsets.end);
    const range = document.createRange();
    try {
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
    } catch (error) {
      placeCaretAtEnd(editor);
      return false;
    }
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  function createSelectionMarker(id) {
    const marker = document.createElement("span");
    marker.dataset.editorSelectionMarker = id;
    marker.textContent = "\ufeff";
    marker.setAttribute("aria-hidden", "true");
    marker.style.cssText = "display:inline-block;width:0;overflow:hidden;line-height:0;";
    return marker;
  }

  function captureEditorSelectionMarkers(editor) {
    const selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    if (!selectionInsideEditor(editor, range)) return null;

    const id = uid("selection");
    if (range.collapsed) {
      const caret = createSelectionMarker(`${id}-caret`);
      const caretRange = range.cloneRange();
      caretRange.insertNode(caret);
      return { id, collapsed: true, caret: caret.dataset.editorSelectionMarker };
    }

    const start = createSelectionMarker(`${id}-start`);
    const end = createSelectionMarker(`${id}-end`);
    const endRange = range.cloneRange();
    endRange.collapse(false);
    endRange.insertNode(end);
    const startRange = range.cloneRange();
    startRange.collapse(true);
    startRange.insertNode(start);
    return {
      id,
      collapsed: false,
      start: start.dataset.editorSelectionMarker,
      end: end.dataset.editorSelectionMarker,
    };
  }

  function markerBoundary(marker) {
    if (!marker?.parentNode) return null;
    return {
      node: marker.parentNode,
      offset: [...marker.parentNode.childNodes].indexOf(marker),
    };
  }

  function pageSheetForMarker(editor, markers) {
    if (!editor || !markers) return null;
    if (markers.collapsed) {
      return editor.querySelector(`[data-editor-selection-marker="${markers.caret}"]`)?.closest?.(".page-sheet") || null;
    }
    return editor.querySelector(`[data-editor-selection-marker="${markers.end}"]`)?.closest?.(".page-sheet")
      || editor.querySelector(`[data-editor-selection-marker="${markers.start}"]`)?.closest?.(".page-sheet")
      || null;
  }

  function restoreEditorSelectionMarkers(editor, markers) {
    if (!editor || !markers) return false;
    const selection = window.getSelection();
    const range = document.createRange();
    const caret = markers.collapsed ? editor.querySelector(`[data-editor-selection-marker="${markers.caret}"]`) : null;
    const start = markers.collapsed ? caret : editor.querySelector(`[data-editor-selection-marker="${markers.start}"]`);
    const end = markers.collapsed ? caret : editor.querySelector(`[data-editor-selection-marker="${markers.end}"]`);
    if (!selection || !start || !end) {
      removeEditorSelectionMarkers(editor);
      return false;
    }

    const startPoint = markerBoundary(start);
    const endPoint = markerBoundary(end);
    if (!startPoint || !endPoint) {
      removeEditorSelectionMarkers(editor);
      return false;
    }

    try {
      range.setStart(startPoint.node, startPoint.offset);
      if (markers.collapsed) {
        range.collapse(true);
      } else {
        range.setEnd(endPoint.node, endPoint.offset);
      }
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (error) {
      removeEditorSelectionMarkers(editor);
      return false;
    }

    removeEditorSelectionMarkers(editor);
    return true;
  }

  function nodeTextLength(node) {
    if (!node) return 0;
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.toString().length;
  }

  function pageSheetForTextOffset(editor, offset) {
    const sheets = [...(editor?.querySelectorAll?.(".page-sheet") || [])];
    if (!sheets.length) return null;
    const target = Math.max(Number(offset) || 0, 0);
    let consumed = 0;
    for (const sheet of sheets) {
      const length = nodeTextLength(sheet);
      if (target < consumed + length) return sheet;
      consumed += length;
    }
    return sheets[sheets.length - 1];
  }

  function currentSelectionScrollTarget(editor) {
    const selection = window.getSelection();
    let node = selection?.focusNode || selection?.anchorNode || null;
    if (!node || !editor?.contains?.(node)) return currentPageSheet(editor);
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    return node?.closest?.("p, h1, h2, h3, li, blockquote, div, .page-sheet") || currentPageSheet(editor);
  }

  function splittableTextBlock(block) {
    if (!block || block.nodeType !== Node.ELEMENT_NODE) return false;
    if (!["P", "DIV", "BLOCKQUOTE", "LI"].includes(block.tagName)) return false;
    if (block.querySelector("img, video, audio, iframe, table, ul, ol, hr")) return false;
    return (block.textContent || "").length > 1;
  }

  function fragmentForTextRange(source, startOffset, endOffset) {
    const start = textPointFromOffset(source, startOffset);
    const end = textPointFromOffset(source, endOffset);
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    return range.cloneContents();
  }

  function setBlockFragment(block, source, startOffset, endOffset) {
    const fragment = fragmentForTextRange(source, startOffset, endOffset);
    block.replaceChildren(fragment);
    if (!block.childNodes.length) block.appendChild(document.createElement("br"));
  }

  function splitTextBlockToFit(block, sheet) {
    if (!splittableTextBlock(block) || !sheetOverflows(sheet)) return null;
    const source = block.cloneNode(true);
    removeEditorSelectionMarkers(source);
    removeEditorSelectionMarkers(block);
    const textLength = (source.textContent || "").length;
    if (textLength <= 1) return null;

    let low = 1;
    let high = textLength - 1;
    let best = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      setBlockFragment(block, source, 0, mid);
      if (sheetOverflows(sheet)) {
        high = mid - 1;
      } else {
        best = mid;
        low = mid + 1;
      }
    }

    if (best <= 0) {
      setBlockFragment(block, source, 0, textLength);
      return null;
    }

    const remainder = block.cloneNode(false);
    setBlockFragment(block, source, 0, best);
    setBlockFragment(remainder, source, best, textLength);
    if (!(remainder.textContent || "").length) return null;
    remainder.dataset.splitContinuation = "true";
    if (remainder.tagName === "LI") remainder.classList.add("is-split-continuation");
    return remainder;
  }

  function splitListBlockToFit(list, sheet) {
    if (!list || list.nodeType !== Node.ELEMENT_NODE || !["UL", "OL"].includes(list.tagName) || !sheetOverflows(sheet)) return null;
    const remainder = list.cloneNode(false);
    delete remainder.dataset.splitContinuation;
    while (sheetOverflows(sheet) && list.children.length > 1) {
      remainder.insertBefore(list.lastElementChild, remainder.firstElementChild);
    }
    if (remainder.children.length) {
      if (sheetOverflows(sheet) && list.children.length === 1) {
        const tailSplit = splitTextBlockToFit(list.firstElementChild, sheet);
        if (tailSplit) remainder.insertBefore(tailSplit, remainder.firstElementChild);
      }
      remainder.dataset.splitContinuation = "true";
      return remainder;
    }

    const onlyItem = list.firstElementChild;
    const splitItem = splitTextBlockToFit(onlyItem, sheet);
    if (!splitItem) return null;
    remainder.appendChild(splitItem);
    remainder.dataset.splitContinuation = "true";
    return remainder;
  }

  function splitBlockToFit(block, sheet) {
    if (!block || block.nodeType !== Node.ELEMENT_NODE) return null;
    if (["UL", "OL"].includes(block.tagName)) return splitListBlockToFit(block, sheet);
    return splitTextBlockToFit(block, sheet);
  }

  function keepOverflowOnNextSheets(sheet, sheets, editor) {
    let currentSheet = sheet;
    const maxPages = 2000;
    let guard = 0;
    while (sheetOverflows(currentSheet) && guard < maxPages) {
      guard += 1;
      const block = currentSheet.lastElementChild;
      const remainder = splitBlockToFit(block, currentSheet);
      if (!remainder) break;
      currentSheet = createPageSheet(editor, sheets.length);
      sheets.push(currentSheet);
      currentSheet.appendChild(remainder);
    }
    return currentSheet;
  }

  function capturePagedViewport(editor) {
    const viewport = editor?.closest?.("[data-page-viewport]") || app.querySelector("[data-page-viewport]");
    const contentArea = editor?.closest?.(".content-area") || app.querySelector(".content-area");
    const documentScroller = document.scrollingElement || document.documentElement;
    return {
      viewportTop: viewport?.scrollTop || 0,
      viewportLeft: viewport?.scrollLeft || 0,
      contentTop: contentArea?.scrollTop || 0,
      contentLeft: contentArea?.scrollLeft || 0,
      documentTop: documentScroller?.scrollTop || 0,
      documentLeft: documentScroller?.scrollLeft || 0,
    };
  }

  function scrollContainerToTarget(container, target) {
    const targetElement = target?.nodeType === Node.ELEMENT_NODE ? target : target?.parentElement;
    const sheet = targetElement?.closest?.(".page-sheet");
    const element = targetElement && sheet && targetElement !== sheet ? targetElement : sheet;
    if (!container || !element) return false;
    const canScrollY = container.scrollHeight > container.clientHeight + 1;
    const canScrollX = container.scrollWidth > container.clientWidth + 1;
    if (!canScrollY && !canScrollX) return false;

    const containerRect = container.getBoundingClientRect();
    const targetRect = element.getBoundingClientRect();
    let moved = false;
    if (canScrollY) {
      const topGap = targetRect.top - containerRect.top;
      const bottomGap = targetRect.bottom - containerRect.bottom;
      if (topGap < 72) {
        container.scrollTop = Math.max(container.scrollTop + topGap - 92, 0);
        moved = true;
      } else if (bottomGap > -96) {
        container.scrollTop = Math.max(container.scrollTop + bottomGap + 120, 0);
        moved = true;
      }
    }
    if (canScrollX) {
      const leftGap = targetRect.left - containerRect.left;
      const rightGap = targetRect.right - containerRect.right;
      if (leftGap < 28) {
        container.scrollLeft = Math.max(container.scrollLeft + leftGap - 36, 0);
        moved = true;
      } else if (rightGap > -28) {
        container.scrollLeft = Math.max(container.scrollLeft + rightGap + 36, 0);
        moved = true;
      }
    }
    return moved;
  }

  function restorePagedViewport(snapshot, target, mode = "preserve") {
    const viewport = app.querySelector("[data-page-viewport]");
    const contentArea = app.querySelector(".content-area");
    const documentScroller = document.scrollingElement || document.documentElement;
    if (mode === "target" && target) {
      const movedContent = scrollContainerToTarget(contentArea, target);
      const movedViewport = scrollContainerToTarget(viewport, target);
      if (!movedContent && !movedViewport) {
        target.closest(".page-sheet")?.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
      return;
    }
    if (viewport) {
      viewport.scrollTop = snapshot?.viewportTop || 0;
      viewport.scrollLeft = snapshot?.viewportLeft || 0;
    }
    if (contentArea) {
      contentArea.scrollTop = snapshot?.contentTop || 0;
      contentArea.scrollLeft = snapshot?.contentLeft || 0;
    }
    if (documentScroller) {
      documentScroller.scrollTop = snapshot?.documentTop || 0;
      documentScroller.scrollLeft = snapshot?.documentLeft || 0;
    }
  }

  function updatePagedLayout(page) {
    const viewport = page?.querySelector?.("[data-page-viewport]");
    const pageCount = page?.querySelectorAll?.(".page-sheet").length || 1;
    if (!page || !viewport) return;
    const pageWidth = cssNumber(page, "--page-width", 560);
    const pageGap = cssNumber(page, "--page-gap", 28);
    const zoom = clampPageZoom(state.settings?.pageZoom || 1);
    const twoPagesWidth = ((pageWidth * 2) + pageGap) * zoom;
    const pagesPerRow = twoPagesWidth <= Math.max(viewport.clientWidth - 32, pageWidth * zoom) ? 2 : 1;
    page.style.setProperty("--page-count", String(pageCount));
    page.style.setProperty("--page-rows", String(Math.ceil(pageCount / pagesPerRow)));
    page.style.setProperty("--pages-per-row", String(Math.min(2, pagesPerRow)));
    page.style.setProperty("--page-zoom", String(zoom));
  }

  function addIndependentPage(box = activeBox()) {
    if (!isIndependentPageMode()) return false;
    const editor = app.querySelector(".editor-page.is-page-mode [data-note-editor]");
    const note = box ? findItem(box, box.activeItemId) : null;
    if (!box || note?.type !== "note" || !editor) return false;
    rememberEditorSnapshot(note, editor);
    const index = editor.querySelectorAll(".page-sheet").length;
    const sheet = createPageSheet(editor, index);
    configurePageSheet(sheet, index, { editable: true });
    const paragraph = document.createElement("p");
    paragraph.appendChild(document.createElement("br"));
    sheet.appendChild(paragraph);
    runtime.activePageIndex = index;
    updatePagedLayout(editor.closest(".editor-page.is-page-mode"));
    placeCaretInside(paragraph);
    sheet.focus({ preventScroll: true });
    saveEditorSelection(editor);
    note.content = mergePageEditorHtml({ keepActiveBlankSheet: true, keepSheets: true });
    note.modifiedAt = now();
    touchBox(box);
    updateEditorStats(note);
    commitEditorHistoryChange(note, note.content);
    saveState();
    requestAnimationFrame(() => restorePagedViewport(capturePagedViewport(editor), sheet, "target"));
    return true;
  }

  function renderIndependentPages(note, editor, page, selectionOffsets = null, restoreSelection = true) {
    const source = document.createElement("div");
    source.innerHTML = note.content || "<p><br></p>";
    const existingSheets = [...source.children].filter((node) => node.classList?.contains("page-sheet"));
    editor.setAttribute("contenteditable", "false");
    editor.setAttribute("spellcheck", "false");
    editor.dataset.pageFlow = "independent";
    editor.innerHTML = "";
    const sheets = existingSheets.length ? existingSheets : [];
    if (!sheets.length) {
      const sheet = createPageSheet(editor, 0);
      configurePageSheet(sheet, 0, { editable: true });
      editableBlocksFromHtml(note.content).forEach((block) => sheet.appendChild(block));
    } else {
      sheets.forEach((sourceSheet, index) => {
        const sheet = sourceSheet.cloneNode(true);
        configurePageSheet(sheet, index, { editable: true });
        editor.appendChild(sheet);
      });
    }
    if (!editor.querySelector(".page-sheet")) {
      const sheet = createPageSheet(editor, 0);
      configurePageSheet(sheet, 0, { editable: true });
      const paragraph = document.createElement("p");
      paragraph.appendChild(document.createElement("br"));
      sheet.appendChild(paragraph);
    }
    updatePagedLayout(page);
    if (restoreSelection !== false) restoreEditorSelectionOffsets(editor, selectionOffsets);
    return [editor];
  }

  function paginateNoteIntoPages(note, options = {}) {
    const page = app.querySelector(".editor-page.is-page-mode");
    const editor = page?.querySelector?.("[data-note-editor]");
    if (!page || !editor) return [];

    const selectionOffsets = options.selectionOffsets || getEditorSelectionOffsets(editor);
    if (normalizePageFlowMode(state.settings?.pageFlowMode) === "independent") {
      return renderIndependentPages(note, editor, page, selectionOffsets, options.restoreSelection);
    }
    const blocks = editableBlocksFromHtml(note.content);
    editor.setAttribute("contenteditable", "true");
    editor.setAttribute("spellcheck", "true");
    editor.dataset.pageFlow = "continuous";
    runtime.independentPageSnapshot = null;
    editor.innerHTML = "";
    const sheets = [];
    let sheet = createPageSheet(editor, 0);
    sheets.push(sheet);

    blocks.forEach((block) => {
      sheet.appendChild(block);
      if (!sheetOverflows(sheet)) return;

      const remainder = splitBlockToFit(block, sheet);
      if (remainder) {
        sheet = createPageSheet(editor, sheets.length);
        sheets.push(sheet);
        sheet.appendChild(remainder);
        sheet = keepOverflowOnNextSheets(sheet, sheets, editor);
        return;
      }

      if (sheet.childNodes.length <= 1) {
        sheet = keepOverflowOnNextSheets(sheet, sheets, editor);
        return;
      }

      sheet.removeChild(block);
      sheet = createPageSheet(editor, sheets.length);
      sheets.push(sheet);
      sheet.appendChild(block);
      sheet = keepOverflowOnNextSheets(sheet, sheets, editor);
    });

    if (!sheets.some((item) => item.childNodes.length)) {
      const paragraph = document.createElement("p");
      paragraph.appendChild(document.createElement("br"));
      sheets[0].appendChild(paragraph);
    }

    sheets.forEach((sheet) => {
      sheet.classList.toggle("is-overflow-accepted", sheet.children.length === 1 && sheetOverflows(sheet));
    });

    updatePagedLayout(page);
    if (options.restoreSelection !== false) restoreEditorSelectionOffsets(editor, selectionOffsets);
    return [editor];
  }

  function syncPagedEditorMetrics(editor) {
    const page = editor?.closest?.(".editor-page.is-page-mode");
    if (page) updatePagedLayout(page);
  }

  function refreshPagedEditorIfNeeded(editor, note, scrollMode = "preserve", options = {}) {
    if (normalizeEditorViewMode(state.settings?.editorViewMode) !== "pages" || !editor || !note) {
      syncPagedEditorMetrics(editor);
      return;
    }
    if (normalizePageFlowMode(state.settings?.pageFlowMode) === "independent") {
      note.content = mergePageEditorHtml({ keepActiveBlankSheet: true, keepSheets: true });
      syncPagedEditorMetrics(editor);
      return;
    }
    const snapshot = capturePagedViewport(editor);
    const selectionOffsets = getEditorSelectionOffsets(editor);
    const markers = captureEditorSelectionMarkers(editor);
    if (options.force || needsPagedLayoutRefresh(editor)) {
      note.content = mergePageEditorHtml({ keepMarkers: !!markers });
      paginateNoteIntoPages(note, { selectionOffsets, restoreSelection: !markers });
    } else {
      updatePagedLayout(editor.closest(".editor-page.is-page-mode"));
    }
    const markerTarget = pageSheetForMarker(editor, markers);
    const restored = markers ? restoreEditorSelectionMarkers(editor, markers) : false;
    if (!restored) restoreEditorSelectionOffsets(editor, selectionOffsets);
    removeEditorSelectionMarkers(editor);
    note.content = mergePageEditorHtml({ keepActiveBlankSheet: true });
    const target = currentSelectionScrollTarget(editor)
      || markerTarget
      || pageSheetForTextOffset(editor, selectionOffsets?.end ?? selectionOffsets?.start)
      || currentPageSheet(editor)
      || editor.querySelector(".page-sheet")
      || editor;
    requestAnimationFrame(() => restorePagedViewport(snapshot, target, scrollMode));
  }

  function bindPagedEditor(editor) {
    const viewport = editor?.closest?.("[data-page-viewport]");
    if (!viewport || viewport.dataset.pageWheelBound === "true") return;
    viewport.dataset.pageWheelBound = "true";
    requestAnimationFrame(() => syncPagedEditorMetrics(editor));
    viewport.addEventListener("wheel", (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const factor = event.deltaY > 0 ? 0.92 : 1.08;
      state.settings.pageZoom = clampPageZoom((state.settings.pageZoom || 1) * factor);
      saveState();
      syncPagedEditorMetrics(editor);
    }, { passive: false });
  }

  const pasteAllowedTags = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "BR", "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "SPAN", "A", "IMG", "BLOCKQUOTE", "DIV", "PRE", "CODE", "SUB", "SUP"]);
  const pasteAllowedStyles = ["font-family", "font-size", "color", "background-color", "font-weight", "font-style", "text-decoration", "text-align", "width", "line-height", "margin-top", "margin-bottom"];
  const imageLayoutClasses = ["img-float-left", "img-float-right", "img-block-center"];

  function sanitizePastedHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    template.content.querySelectorAll("script, style, meta, link, title, iframe, object, embed, form, input, button, select, textarea, video, audio").forEach((node) => node.remove());

    const commentWalker = document.createTreeWalker(template.content, NodeFilter.SHOW_COMMENT);
    const comments = [];
    while (commentWalker.nextNode()) comments.push(commentWalker.currentNode);
    comments.forEach((comment) => comment.remove());

    [...template.content.querySelectorAll("*")].forEach((element) => {
      if (!element.isConnected && !template.content.contains(element)) return;
      const tag = element.tagName;

      if (tag === "FONT") {
        const span = document.createElement("span");
        if (element.getAttribute("face")) span.style.fontFamily = element.getAttribute("face");
        if (element.getAttribute("color")) span.style.color = element.getAttribute("color");
        while (element.firstChild) span.appendChild(element.firstChild);
        element.replaceWith(span);
        return;
      }

      if (!pasteAllowedTags.has(tag)) {
        element.replaceWith(...element.childNodes);
        return;
      }

      if (/^H[4-6]$/.test(tag)) {
        const h3 = document.createElement("h3");
        while (element.firstChild) h3.appendChild(element.firstChild);
        element.replaceWith(h3);
        return;
      }

      [...element.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = String(attribute.value || "");
        if (name === "style") return;
        if (name === "class" && (tag === "UL" || tag === "OL")) {
          const kept = customListClasses.filter((cls) => element.classList.contains(cls));
          if (kept.length) {
            element.setAttribute("class", kept.join(" "));
            return;
          }
        }
        if (name === "class" && tag === "IMG") {
          const kept = imageLayoutClasses.filter((cls) => element.classList.contains(cls));
          if (kept.length) {
            element.setAttribute("class", kept.join(" "));
            return;
          }
        }
        if (name === "data-checked" && tag === "LI") return;
        if (tag === "A" && name === "href" && /^(https?:|mailto:)/i.test(value.trim())) return;
        if (tag === "IMG" && name === "src" && /^(https?:|data:image\/)/i.test(value.trim())) return;
        element.removeAttribute(attribute.name);
      });

      if (element.hasAttribute("style")) {
        const kept = [];
        pasteAllowedStyles.forEach((property) => {
          const value = element.style.getPropertyValue(property);
          if (value) kept.push(`${property}:${value}`);
        });
        if (kept.length) {
          element.setAttribute("style", kept.join(";"));
        } else {
          element.removeAttribute("style");
        }
      }
    });

    return template.innerHTML.trim();
  }

  function selectedEditorBlocks(editor) {
    const selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount) return [];
    const range = selection.getRangeAt(0);
    if (!selectionInsideEditor(editor, range)) return [];
    const targets = [];
    logicalEditorBlocks(editor).forEach((block) => {
      if (!range.intersectsNode(block)) return;
      if (["UL", "OL"].includes(block.tagName)) {
        [...block.querySelectorAll("li")].forEach((li) => {
          if (range.intersectsNode(li)) targets.push(li);
        });
        return;
      }
      targets.push(block);
    });
    if (!targets.length) {
      const block = currentEditableBlock(editor);
      if (block && block !== editor) targets.push(block);
    }
    return targets;
  }

  function applyLineSpacing(editor, note, box, value) {
    rememberEditorSnapshot(note, editor);
    restoreEditorSelection(editor);
    const targets = selectedEditorBlocks(editor);
    if (!targets.length) return;
    targets.forEach((block) => block.style.setProperty("line-height", value));
    syncEditorContent(editor, note, box);
  }

  function toggleParagraphSpacing(editor, note, box, side) {
    rememberEditorSnapshot(note, editor);
    restoreEditorSelection(editor);
    const targets = selectedEditorBlocks(editor);
    if (!targets.length) return;
    const property = side === "before" ? "margin-top" : "margin-bottom";
    const computed = Number.parseFloat(getComputedStyle(targets[0]).getPropertyValue(property)) || 0;
    const nextValue = computed > 2 ? "0px" : "14px";
    targets.forEach((block) => block.style.setProperty(property, nextValue));
    syncEditorContent(editor, note, box);
  }

  function updateSpacingMenuLabels(menu, editor) {
    const before = menu.querySelector('[data-paragraph-space="before"]');
    const after = menu.querySelector('[data-paragraph-space="after"]');
    if (!before && !after) return;
    const block = editor ? currentEditableBlock(editor) : null;
    const reference = block && block !== editor ? block : null;
    const spacedBefore = reference ? (Number.parseFloat(getComputedStyle(reference).marginTop) || 0) > 2 : false;
    const spacedAfter = reference ? (Number.parseFloat(getComputedStyle(reference).marginBottom) || 0) > 2 : true;
    if (before) before.textContent = spacedBefore ? "Supprimer l'espace avant le paragraphe" : "Ajouter un espace avant le paragraphe";
    if (after) after.textContent = spacedAfter ? "Supprimer l'espace apres le paragraphe" : "Ajouter un espace apres le paragraphe";
  }

  function removeImageToolbar() {
    document.querySelector("[data-image-toolbar]")?.remove();
    app.querySelectorAll("img.is-image-selected").forEach((img) => img.classList.remove("is-image-selected"));
  }

  function imageWidthPercent(img) {
    const styleWidth = Number.parseFloat(img.style.width);
    if (Number.isFinite(styleWidth) && String(img.style.width).includes("%")) return Math.round(styleWidth);
    const parentWidth = img.parentElement?.getBoundingClientRect().width || 0;
    const rectWidth = img.getBoundingClientRect().width;
    if (parentWidth > 0 && rectWidth > 0) return Math.min(Math.round((rectWidth / parentWidth) * 100), 100);
    return 100;
  }

  function positionImageToolbar(img) {
    const toolbar = document.querySelector("[data-image-toolbar]");
    if (!toolbar || !document.body.contains(img)) return;
    const rect = img.getBoundingClientRect();
    toolbar.style.top = `${Math.max(rect.top - 44, 8)}px`;
    toolbar.style.left = `${Math.max(Math.min(rect.left, window.innerWidth - 320), 8)}px`;
  }

  function paintImageToolbarState(img) {
    const toolbar = document.querySelector("[data-image-toolbar]");
    if (!toolbar) return;
    const size = toolbar.querySelector("[data-image-size]");
    if (size) size.textContent = `${imageWidthPercent(img)}%`;
    const mode = img.classList.contains("img-float-left")
      ? "left"
      : img.classList.contains("img-float-right")
        ? "right"
        : img.classList.contains("img-block-center") ? "center" : "inline";
    toolbar.querySelectorAll("[data-image-action]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.imageAction === mode);
    });
  }

  function applyImageLayout(editor, note, box, img, mode) {
    rememberEditorSnapshot(note, editor);
    img.classList.remove("img-float-left", "img-float-right", "img-block-center");
    if (mode === "left") img.classList.add("img-float-left");
    if (mode === "right") img.classList.add("img-float-right");
    if (mode === "center") img.classList.add("img-block-center");
    syncEditorContent(editor, note, box);
    positionImageToolbar(img);
    paintImageToolbarState(img);
  }

  function resizeEditorImage(editor, note, box, img, delta) {
    rememberEditorSnapshot(note, editor);
    const next = Math.min(Math.max(imageWidthPercent(img) + delta, 10), 100);
    img.style.width = `${next}%`;
    img.style.height = "auto";
    syncEditorContent(editor, note, box);
    positionImageToolbar(img);
    paintImageToolbarState(img);
  }

  function selectEditorImage(editor, note, box, img) {
    removeImageToolbar();
    img.classList.add("is-image-selected");
    const toolbar = document.createElement("div");
    toolbar.className = "image-toolbar";
    toolbar.dataset.imageToolbar = "true";
    toolbar.innerHTML = `
      <button type="button" data-image-action="left" data-tooltip="Image a gauche, texte autour" aria-label="Image a gauche, texte autour">${icon("alignLeft")}</button>
      <button type="button" data-image-action="center" data-tooltip="Image centree" aria-label="Image centree">${icon("alignCenter")}</button>
      <button type="button" data-image-action="right" data-tooltip="Image a droite, texte autour" aria-label="Image a droite, texte autour">${icon("alignRight")}</button>
      <button type="button" data-image-action="inline" data-tooltip="Dans le texte" aria-label="Dans le texte">${icon("alignJustify")}</button>
      <span class="image-toolbar-sep"></span>
      <button type="button" data-image-action="smaller" data-tooltip="Reduire" aria-label="Reduire">−</button>
      <span data-image-size></span>
      <button type="button" data-image-action="bigger" data-tooltip="Agrandir" aria-label="Agrandir">+</button>
      <span class="image-toolbar-sep"></span>
      <button type="button" class="danger" data-image-action="delete" data-tooltip="Supprimer l'image" aria-label="Supprimer l'image">${icon("trash")}</button>
    `;
    document.body.appendChild(toolbar);
    toolbar.addEventListener("mousedown", (event) => event.preventDefault());
    toolbar.addEventListener("click", (event) => {
      const action = event.target.closest("[data-image-action]")?.dataset.imageAction;
      if (!action || !document.body.contains(img)) return;
      if (action === "delete") {
        rememberEditorSnapshot(note, editor);
        const holder = img.parentElement;
        img.remove();
        if (holder && holder !== editor && !holder.textContent.trim() && !holder.querySelector("img, br")) {
          holder.appendChild(document.createElement("br"));
        }
        removeImageToolbar();
        syncEditorContent(editor, note, box);
        return;
      }
      if (action === "smaller") {
        resizeEditorImage(editor, note, box, img, -10);
        return;
      }
      if (action === "bigger") {
        resizeEditorImage(editor, note, box, img, 10);
        return;
      }
      applyImageLayout(editor, note, box, img, action === "inline" ? "" : action);
    });
    positionImageToolbar(img);
    paintImageToolbarState(img);
  }

  function bindEditor() {
    const box = activeBox();
    const note = box ? findItem(box, box.activeItemId) : null;
    if (!box || !note || note.type !== "note") return;

    const title = app.querySelector("[data-note-title]");
    let editor = app.querySelector("[data-note-editor]");

    if (title) {
      title.addEventListener("input", () => {
        note.title = title.value || "Sans titre";
        note.modifiedAt = now();
        touchBox(box);
        updateTabTitle(note.id, note.title);
        saveState();
      });
      title.addEventListener("blur", scheduleRenderWhenIdle);
    }

    if (normalizeEditorViewMode(state.settings?.editorViewMode) === "pages") {
      paginateNoteIntoPages(note);
      updateEditorStats(note);
    }

    const editors = [...app.querySelectorAll("[data-note-editor]")];
    const activeEditor = () => {
      const active = document.activeElement?.closest?.("[data-note-editor]");
      if (active && app.contains(active)) return active;
      const liveEditors = [...app.querySelectorAll("[data-note-editor]")];
      return liveEditors.find((item) => Number(item.dataset.pageIndex || 0) === runtime.activePageIndex) || liveEditors[0] || null;
    };
    editor = activeEditor();

    function repaginatePagesInPlace(sourceEditor, options = {}) {
      if (normalizeEditorViewMode(state.settings?.editorViewMode) !== "pages") return;
      const snapshot = capturePagedViewport(sourceEditor);
      const selectionOffsets = getEditorSelectionOffsets(sourceEditor);
      const markers = captureEditorSelectionMarkers(sourceEditor);
      note.content = mergePageEditorHtml({ keepMarkers: !!markers });
      const nextEditors = paginateNoteIntoPages(note, { selectionOffsets, restoreSelection: false });
      nextEditors.forEach(bindSingleEditor);
      const targetEditor = nextEditors[0] || sourceEditor;
      const markerTarget = pageSheetForMarker(targetEditor, markers);
      const restored = markers ? restoreEditorSelectionMarkers(targetEditor, markers) : false;
      if (!restored) restoreEditorSelectionOffsets(targetEditor, selectionOffsets);
      removeEditorSelectionMarkers(targetEditor);
      note.content = mergePageEditorHtml({ keepActiveBlankSheet: true });
      const targetSheet = currentSelectionScrollTarget(targetEditor)
        || markerTarget
        || pageSheetForTextOffset(targetEditor, selectionOffsets?.end ?? selectionOffsets?.start)
        || currentPageSheet(targetEditor)
        || targetEditor?.querySelector?.(".page-sheet")
        || targetEditor;
      if (targetEditor && options.focus !== false) {
        targetEditor.focus({ preventScroll: true });
        saveEditorSelection(targetEditor);
        updateEditorToolbarState(targetEditor);
      }
      updateEditorStats(note);
      saveState();
      requestAnimationFrame(() => restorePagedViewport(snapshot, targetSheet, options.scroll || "preserve"));
    }

    function schedulePageRepagination(sourceEditor, options = {}) {
      window.clearTimeout(runtime.pagePaginationTimer);
      runtime.pagePaginationTimer = window.setTimeout(() => {
        repaginatePagesInPlace(sourceEditor, options);
      }, options.delay ?? 180);
    }

    function bindSingleEditor(boundEditor) {
      if (!boundEditor || boundEditor.dataset.editorBound === "true") return;
      boundEditor.dataset.editorBound = "true";
      prepareCollapsibleHeadings(boundEditor, note, box);
      bindPagedEditor(boundEditor);
      boundEditor.addEventListener("pointerdown", (event) => {
        markEditorPointerIntent();
        const sheet = event?.target?.closest?.(".page-sheet");
        runtime.activePageIndex = Number(sheet?.dataset.pageSheet || 0);
      });
      boundEditor.addEventListener("pointerup", (event) => {
        markEditorPointerIntent();
        const fallbackTarget = event.target?.closest?.("p, h1, h2, h3, li, blockquote, div:not(.page-sheet)") || currentPageSheet(boundEditor) || boundEditor;
        window.requestAnimationFrame(() => {
          if (!document.body.contains(boundEditor)) return;
          const active = activeEditableTarget();
          if (active?.closest?.("[data-note-editor]")) return;
          const selection = window.getSelection();
          const selectionInside = selection && selection.rangeCount && selectionInsideEditor(boundEditor, selection.getRangeAt(0));
          if (selectionInside) return;
          const focusTarget = isIndependentPageMode()
            ? (fallbackTarget?.closest?.(".page-sheet") || currentPageSheet(boundEditor) || boundEditor)
            : boundEditor;
          focusTarget.focus({ preventScroll: true });
          if (fallbackTarget && fallbackTarget !== boundEditor) placeCaretAtEnd(fallbackTarget);
          saveEditorSelection(boundEditor);
        });
      });
      ["keyup", "mouseup", "focus", "focusin", "click"].forEach((eventName) => {
        boundEditor.addEventListener(eventName, (event) => {
          if (eventName === "click") markEditorPointerIntent();
          runtime.activePageIndex = Number(event?.target?.closest?.(".page-sheet")?.dataset.pageSheet || runtime.activePageIndex || 0);
          saveEditorSelection(boundEditor);
          updateEditorToolbarState(boundEditor);
        });
      });
      boundEditor.addEventListener("beforeinput", (event) => {
        if (event.inputType === "historyUndo" || event.inputType === "historyRedo") {
          event.preventDefault();
          restoreEditorHistory(boundEditor, note, box, event.inputType === "historyRedo" ? "redo" : "undo");
          return;
        }
        if (isIndependentPageMode() && inputCanGrowPage(event)) {
          const sheet = event.target?.closest?.(".page-sheet") || currentPageSheet(boundEditor);
          if (sheet && sheetOverflows(sheet)) {
            event.preventDefault();
            showPageFullNotice();
            return;
          }
        }
        rememberEditorSnapshot(note, boundEditor);
      });
      boundEditor.addEventListener("keydown", (event) => handleEditorAutomation(event, boundEditor, note, box, repaginatePagesInPlace));
      boundEditor.addEventListener("click", (event) => {
        const img = event.target.closest?.("img");
        if (img && boundEditor.contains(img)) {
          event.preventDefault();
          selectEditorImage(boundEditor, note, box, img);
        } else if (document.querySelector("[data-image-toolbar]")) {
          removeImageToolbar();
        }
      });
      boundEditor.addEventListener("paste", (event) => {
        const html = event.clipboardData?.getData("text/html");
        const text = event.clipboardData?.getData("text/plain");
        if (!html && !text) return;
        event.preventDefault();
        rememberEditorSnapshot(note, boundEditor);
        const cleaned = html ? sanitizePastedHtml(html) : "";
        if (cleaned) {
          document.execCommand("insertHTML", false, cleaned);
        } else if (text) {
          document.execCommand("insertText", false, text);
        }
        fixNestedListClasses(boundEditor);
      });
      boundEditor.addEventListener("input", () => {
        if (enforceIndependentPageLimit(boundEditor, note, box)) return;
        if (ensureFirstContinuousPage(boundEditor, note, box)) return;
        if (removeCurrentEmptyContinuousPageIfNeeded(boundEditor, note, box)) return;
        syncListMarkerColors(boundEditor);
        note.content = editorSnapshotContent(boundEditor);
        note.modifiedAt = now();
        touchBox(box);
        updateEditorStats(note);
        saveEditorSelection(boundEditor);
        updateEditorToolbarState(boundEditor);
        commitEditorHistoryChange(note, note.content);
        saveState();
        if (normalizeEditorViewMode(state.settings?.editorViewMode) === "pages") {
          if (isContinuousPageFlow()) {
            if (needsPagedLayoutRefresh(boundEditor)) {
              schedulePageRepagination(boundEditor, { scroll: "target", delay: 140 });
            } else {
              syncPagedEditorMetrics(boundEditor);
            }
          } else if (needsPagedLayoutRefresh(boundEditor)) {
            syncPagedEditorMetrics(boundEditor);
          } else {
            syncPagedEditorMetrics(boundEditor);
          }
        } else {
          syncPagedEditorMetrics(boundEditor);
        }
      });
      boundEditor.addEventListener("blur", () => {
        if (normalizeEditorViewMode(state.settings?.editorViewMode) !== "pages") return;
        note.content = mergePageEditorHtml({ keepActiveBlankSheet: true, keepSheets: !isContinuousPageFlow() });
        saveState();
      });
    }

    editors.forEach(bindSingleEditor);

    app.querySelectorAll("[data-editor-cmd]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        const current = activeEditor();
        if (current) saveEditorSelection(current);
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        const current = activeEditor();
        if (!current) return;
        rememberEditorSnapshot(note, current);
        restoreEditorSelection(current);
        document.execCommand(button.dataset.editorCmd, false, null);
        note.content = editorSnapshotContent(current);
        note.modifiedAt = now();
        touchBox(box);
        commitEditorHistoryChange(note, note.content);
        saveState();
        refreshPagedEditorIfNeeded(current, note);
      });
    });

    const formatBlock = app.querySelector("[data-format-block]");
    if (formatBlock) {
      formatBlock.addEventListener("mousedown", () => {
        const current = activeEditor();
        if (current) saveEditorSelection(current);
      });
      formatBlock.addEventListener("focus", () => {
        const current = activeEditor();
        const selection = window.getSelection();
        if (current && selection && selection.rangeCount && !selection.isCollapsed) saveEditorSelection(current);
      });
      formatBlock.addEventListener("change", () => {
        const current = activeEditor();
        if (current) applyHeadingFormat(current, note, box, formatBlock.value);
      });
    }

    const size = app.querySelector("[data-font-size]");
    if (size) {
      size.addEventListener("mousedown", () => {
        const current = activeEditor();
        if (current) saveEditorSelection(current);
      });
      size.addEventListener("focus", () => {
        const current = activeEditor();
        const selection = window.getSelection();
        if (current && selection && selection.rangeCount && !selection.isCollapsed) saveEditorSelection(current);
        holdEditorSelectionHighlight();
      });
      size.addEventListener("blur", releaseEditorSelectionHighlight);
      const applyFontSize = () => {
        const current = activeEditor();
        if (!current) return;
        const parsed = Number.parseFloat(size.value);
        if (!Number.isFinite(parsed)) return;
        const clamped = Math.min(Math.max(Math.round(parsed), 8), 120);
        size.value = String(clamped);
        applyInlineStyleToSelection(current, note, box, "font-size", `${clamped}px`);
      };
      size.addEventListener("change", applyFontSize);
      size.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        applyFontSize();
      });
    }

    const fontFamily = app.querySelector("[data-font-family]");
    if (fontFamily) {
      fontFamily.addEventListener("mousedown", () => {
        const current = activeEditor();
        if (current) saveEditorSelection(current);
      });
      fontFamily.addEventListener("focus", () => {
        const current = activeEditor();
        const selection = window.getSelection();
        if (current && selection && selection.rangeCount && !selection.isCollapsed) saveEditorSelection(current);
        holdEditorSelectionHighlight();
      });
      fontFamily.addEventListener("blur", releaseEditorSelectionHighlight);
      fontFamily.addEventListener("change", () => {
        const current = activeEditor();
        if (current) applyInlineStyleToSelection(current, note, box, "font-family", fontFamily.value);
      });
    }

    app.querySelectorAll("[data-color-input]").forEach((input) => {
      input.addEventListener("mousedown", () => {
        const current = activeEditor();
        if (current) saveEditorSelection(current);
      });
      input.addEventListener("focus", () => {
        const current = activeEditor();
        const selection = window.getSelection();
        if (current && selection && selection.rangeCount && !selection.isCollapsed) saveEditorSelection(current);
        holdEditorSelectionHighlight();
      });
      input.addEventListener("blur", releaseEditorSelectionHighlight);
      input.addEventListener("input", () => {
        const clean = setLastEditorColor(input.dataset.colorInput, input.value);
        if (clean) input.value = clean;
        paintColorTool(input.dataset.colorInput, clean);
        saveState();
      });
    });

    app.querySelectorAll("[data-apply-color]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        const current = activeEditor();
        if (current) saveEditorSelection(current);
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        const current = activeEditor();
        if (!current) return;
        const kind = button.dataset.applyColor;
        const input = app.querySelector(`[data-color-input="${kind}"]`);
        applyEditorColor(current, note, box, kind, input?.value || "");
      });
    });

    app.querySelectorAll("[data-clear-highlight]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        const current = activeEditor();
        if (current) saveEditorSelection(current);
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        const current = activeEditor();
        if (current) clearEditorHighlight(current, note, box);
      });
    });

    app.querySelectorAll("[data-color-swatch]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        const current = activeEditor();
        if (current) saveEditorSelection(current);
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        const current = activeEditor();
        if (!current) return;
        const kind = button.dataset.colorSwatch;
        const input = app.querySelector(`[data-color-input="${kind}"]`);
        if (input) input.value = button.dataset.colorValue;
        applyEditorColor(current, note, box, kind, button.dataset.colorValue);
      });
    });

    app.querySelectorAll("[data-toolbar-menu]").forEach((menu) => {
      const trigger = menu.querySelector("[data-menu-trigger]");
      trigger?.addEventListener("mousedown", (event) => {
        const current = activeEditor();
        if (current) saveEditorSelection(current);
        event.preventDefault();
      });
      trigger?.addEventListener("click", () => {
        const wasOpen = menu.classList.contains("is-open");
        app.querySelectorAll(".toolbar-menu.is-open").forEach((item) => item.classList.remove("is-open"));
        menu.classList.toggle("is-open", !wasOpen);
        updateSpacingMenuLabels(menu, activeEditor());
      });
      menu.addEventListener("mouseenter", () => updateSpacingMenuLabels(menu, activeEditor()));
    });

    app.querySelectorAll("[data-line-spacing]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        const current = activeEditor();
        if (current) saveEditorSelection(current);
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        const current = activeEditor();
        if (current) applyLineSpacing(current, note, box, button.dataset.lineSpacing);
      });
    });

    app.querySelectorAll("[data-paragraph-space]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        const current = activeEditor();
        if (current) saveEditorSelection(current);
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        const current = activeEditor();
        if (!current) return;
        toggleParagraphSpacing(current, note, box, button.dataset.paragraphSpace);
        const menu = button.closest("[data-toolbar-menu]");
        if (menu) updateSpacingMenuLabels(menu, current);
      });
    });

    app.querySelectorAll("[data-list-type]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        const current = activeEditor();
        if (current) saveEditorSelection(current);
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        const current = activeEditor();
        if (current) insertList(current, note, box, button.dataset.listType);
      });
    });

    app.querySelectorAll("[data-editor-action]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        const current = activeEditor();
        if (current) saveEditorSelection(current);
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        const current = activeEditor();
        if (!current) return;
        if (button.dataset.editorAction === "toggle-heading-collapse") {
          toggleCurrentHeading(current, note, box);
        } else if (button.dataset.editorAction === "toggle-all-headings") {
          toggleAllHeadingSections(current, note, box);
        }
      });
    });

    app.querySelectorAll("[data-heading-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const current = activeEditor();
        if (!current) return;
        const headings = [...current.querySelectorAll("h1, h2, h3")];
        headings[Number(button.dataset.headingIndex)]?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  function prepareCollapsibleHeadings(editor, note, box) {
    syncCollapsedHeadings(editor);
    syncListMarkerColors(editor);
    editor.querySelectorAll("h1, h2, h3").forEach((heading) => {
      heading.classList.add("collapsible-heading");
      heading.title = "Cliquer la flèche ou double-cliquer pour replier / deplier";
    });
    if (editor.dataset.headingHandlers === "true") return;
    editor.dataset.headingHandlers = "true";
    editor.addEventListener("click", (event) => {
      const checkItem = event.target.closest("li");
      if (checkItem && editor.contains(checkItem) && checkItem.parentElement?.classList.contains("check-list") && isChecklistToggleHit(event, checkItem)) {
        event.preventDefault();
        event.stopPropagation();
        toggleCheckListItem(editor, note, box, checkItem);
        return;
      }

      const heading = event.target.closest("h1, h2, h3");
      if (!heading || !editor.contains(heading) || !isHeadingToggleHit(event, heading)) return;
      event.preventDefault();
      event.stopPropagation();
      toggleHeadingSection(editor, note, box, heading);
    });
    editor.addEventListener("dblclick", (event) => {
      const heading = event.target.closest("h1, h2, h3");
      if (!heading || !editor.contains(heading)) return;
      event.preventDefault();
      toggleHeadingSection(editor, note, box, heading);
    });
  }

  function isHeadingToggleHit(event, heading) {
    const rect = heading.getBoundingClientRect();
    return event.clientX - rect.left <= 42;
  }

  function isChecklistToggleHit(event, li) {
    const rect = li.getBoundingClientRect();
    return event.clientX - rect.left <= 34;
  }

  function toggleCheckListItem(editor, note, box, li) {
    rememberEditorSnapshot(note, editor);
    const checked = !li.matches(".is-checked, [data-checked='true']");
    li.classList.toggle("is-checked", checked);
    checked ? li.setAttribute("data-checked", "true") : li.removeAttribute("data-checked");
    syncEditorContent(editor, note, box);
  }

  function syncCollapsedHeadings(editor) {
    editor.querySelectorAll("h1[data-collapsed='true'], h2[data-collapsed='true'], h3[data-collapsed='true']").forEach((heading) => {
      setHeadingSectionVisibility(heading, true);
    });
  }

  function toggleCurrentHeading(editor, note, box) {
    restoreEditorSelection(editor);
    const selection = window.getSelection();
    let element = selection?.anchorNode || null;
    if (element?.nodeType === Node.TEXT_NODE) element = element.parentElement;
    const heading = element?.closest?.("h1, h2, h3");
    if (!heading || !editor.contains(heading)) {
      setToast("Place le curseur dans un titre.");
      return;
    }
    toggleHeadingSection(editor, note, box, heading);
  }

  function toggleAllHeadingSections(editor, note, box) {
    const headings = [...editor.querySelectorAll("h1, h2, h3")];
    if (!headings.length) {
      setToast("Aucun titre dans cette note.");
      return;
    }
    rememberEditorSnapshot(note, editor);
    const collapse = headings.some((heading) => heading.dataset.collapsed !== "true");
    if (collapse) {
      headings.forEach((heading) => {
        heading.dataset.collapsed = "true";
        heading.classList.add("is-heading-collapsed");
        setHeadingSectionVisibility(heading, true);
      });
    } else {
      headings.forEach((heading) => {
        heading.dataset.collapsed = "false";
        heading.classList.remove("is-heading-collapsed");
      });
      editor.querySelectorAll("[data-collapsed-hidden]").forEach((node) => {
        delete node.dataset.collapsedHidden;
        node.style.display = "";
      });
    }
    note.content = editorSnapshotContent(editor);
    note.modifiedAt = now();
    touchBox(box);
    updateEditorStats(note);
    commitEditorHistoryChange(note, note.content);
    refreshPagedEditorIfNeeded(editor, note, "preserve", { force: true });
    prepareCollapsibleHeadings(editor, note, box);
    saveState();
    setToast(collapse ? "Tous les titres replies." : "Tous les titres deplies.");
  }

  function toggleHeadingSection(editor, note, box, heading) {
    rememberEditorSnapshot(note, editor);
    const collapsed = heading.dataset.collapsed !== "true";
    heading.dataset.collapsed = collapsed ? "true" : "false";
    heading.classList.toggle("is-heading-collapsed", collapsed);
    setHeadingSectionVisibility(heading, collapsed);
    if (!collapsed) syncCollapsedHeadings(editor);
    note.content = editorSnapshotContent(editor);
    note.modifiedAt = now();
    touchBox(box);
    updateEditorStats(note);
    commitEditorHistoryChange(note, note.content);
    refreshPagedEditorIfNeeded(editor, note, "preserve", { force: true });
    prepareCollapsibleHeadings(editor, note, box);
    saveState();
  }

  function logicalEditorBlocks(editor) {
    if (!editor) return [];
    const sheets = [...editor.children].filter((child) => child.classList?.contains("page-sheet"));
    return sheets.length
      ? sheets.flatMap((sheet) => [...sheet.children])
      : [...editor.children];
  }

  function headingSectionBlocks(heading) {
    const editor = heading?.closest?.("[data-note-editor]");
    const blocks = logicalEditorBlocks(editor);
    const start = blocks.indexOf(heading);
    if (start < 0) return [];
    const level = Number(heading.tagName.slice(1));
    const section = [];
    for (let index = start + 1; index < blocks.length; index += 1) {
      const block = blocks[index];
      if (/^H[1-3]$/.test(block.tagName) && Number(block.tagName.slice(1)) <= level) break;
      section.push(block);
    }
    return section;
  }

  function setHeadingSectionVisibility(heading, collapsed) {
    headingSectionBlocks(heading).forEach((node) => {
      if (collapsed) {
        node.dataset.collapsedHidden = "true";
        node.style.display = "none";
      } else if (node.dataset.collapsedHidden === "true") {
        delete node.dataset.collapsedHidden;
        node.style.display = "";
      }
    });
  }

  function handleEditorAutomation(event, editor, note, box, repaginateNow = null) {
    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      const key = event.key.toLowerCase();
      if (key === "a") {
        event.preventDefault();
        selectEditorContents(editor);
        return;
      }
      if (key === "z" || key === "y") {
        event.preventDefault();
        const direction = key === "y" || event.shiftKey ? "redo" : "undo";
        restoreEditorHistory(editor, note, box, direction);
        return;
      }
    }

    if (event.key === " " || event.code === "Space") {
      const marker = currentLineMarker(editor);
      if (marker) {
        event.preventDefault();
        convertCurrentBlockToList(editor, note, box, marker);
      }
      return;
    }

    if (event.key === "Enter") {
      const collapsed = !!window.getSelection()?.isCollapsed;
      const block = currentEditableBlock(editor);
      if (block === editor && normalizeEditorViewMode(state.settings?.editorViewMode) === "pages" && isContinuousPageFlow()) {
        event.preventDefault();
        insertBlankParagraphInCurrentSheet(editor, note, box);
        return;
      }
      if (!event.shiftKey && collapsed && isHeadingBlock(block)) {
        event.preventDefault();
        exitHeadingBlock(editor, note, box, block);
        return;
      }

      const li = currentListItem(editor);
      if (li && collapsed && (listItemIsEmpty(li) || isCaretAtStartOfListItem(li))) {
        event.preventDefault();
        exitListItem(editor, note, box, li);
      }
      if (!event.defaultPrevented && li && collapsed && li.closest(".check-list") && li.matches("[data-checked='true'], .is-checked")) {
        window.requestAnimationFrame(() => {
          const fresh = currentListItem(editor);
          if (fresh && fresh !== li && !fresh.textContent.trim()) {
            fresh.removeAttribute("data-checked");
            fresh.classList.remove("is-checked");
            syncEditorContent(editor, note, box);
          }
        });
      }
      if (!event.defaultPrevented && !event.shiftKey && !li && shouldPrepaginateEnter(editor, block)) {
        event.preventDefault();
        insertPredictivePageBreak(editor, note, box, repaginateNow);
      }
      return;
    }

    if (event.key === "Backspace") {
      const li = currentListItem(editor);
      if (
        li
        && window.getSelection()?.isCollapsed
        && runtime.lastListAutoFormat?.li === li
        && li.textContent === runtime.lastListAutoFormat.text
        && isCaretAtStartOfListItem(li)
      ) {
        event.preventDefault();
        if (revertListAutoFormat(editor, note, box)) return;
      }
      if (li && window.getSelection()?.isCollapsed && listItemIsEmpty(li)) {
        event.preventDefault();
        exitListItem(editor, note, box, li);
        return;
      }
      if (window.getSelection()?.isCollapsed) {
        const block = currentEditableBlock(editor);
        if (block && block !== editor && isCaretAtStartOfBlock(block)) {
          const previous = block.previousElementSibling;
          const collapsedHeading = previous
            ? (isHeadingBlock(previous) && previous.dataset.collapsed === "true" ? previous : collapsedHeadingForHiddenBlock(previous))
            : null;
          if (collapsedHeading) {
            event.preventDefault();
            toggleHeadingSection(editor, note, box, collapsedHeading);
            setToast("Section depliee pour proteger son contenu.");
            return;
          }
        }
      }
      return;
    }

    if (event.key === "Delete") {
      if (window.getSelection()?.isCollapsed) {
        const block = currentEditableBlock(editor);
        if (isHeadingBlock(block) && block.dataset.collapsed === "true" && isCaretAtEndOfBlock(block)) {
          event.preventDefault();
          toggleHeadingSection(editor, note, box, block);
          setToast("Section depliee pour proteger son contenu.");
          return;
        }
      }
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const li = currentListItem(editor);
      if (li) {
        editor.focus();
        document.execCommand(event.shiftKey ? "outdent" : "indent", false, null);
        fixNestedListClasses(editor);
        syncEditorContent(editor, note, box);
        return;
      }
      if (event.shiftKey) {
        document.execCommand("outdent", false, null);
        syncEditorContent(editor, note, box);
        return;
      }
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
      syncEditorContent(editor, note, box);
    }
  }

  const customListClasses = ["dash-list", "arrow-list", "circle-list", "check-list", "triangle-list", "square-list"];

  function firstOwnTextColor(li) {
    const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.textContent.trim() && node.parentElement?.closest("li") === li) {
        let element = node.parentElement;
        while (element && element !== li) {
          if (element.style?.color || (element.tagName === "FONT" && element.getAttribute("color"))) {
            return getComputedStyle(element).color;
          }
          element = element.parentElement;
        }
        return null;
      }
      node = walker.nextNode();
    }
    return null;
  }

  function syncListMarkerColors(editor) {
    if (!editor) return;
    editor.querySelectorAll("li").forEach((li) => {
      if (li.closest(".check-list")) return;
      const color = firstOwnTextColor(li);
      if (color) {
        if (li.style.getPropertyValue("--li-marker-color") !== color) {
          li.style.setProperty("--li-marker-color", color);
        }
      } else if (li.style.getPropertyValue("--li-marker-color")) {
        li.style.removeProperty("--li-marker-color");
        if (!li.getAttribute("style")) li.removeAttribute("style");
      }
    });
  }

  function fixNestedListClasses(editor) {
    editor.querySelectorAll("ul ul, ul ol, ol ul, ol ol").forEach((nested) => {
      if (customListClasses.some((cls) => nested.classList.contains(cls))) return;
      const parentList = nested.parentElement?.closest?.("ul, ol");
      const parentClass = parentList ? customListClasses.find((cls) => parentList.classList.contains(cls)) : null;
      if (parentClass) nested.classList.add(parentClass);
    });
  }

  function currentListItem(editor) {
    const selection = window.getSelection();
    let node = selection?.anchorNode;
    if (!node || !editor.contains(node)) return null;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    return node?.closest?.("li") || null;
  }

  function isCaretAtStartOfListItem(li) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !selection.isCollapsed) return false;
    const range = selection.getRangeAt(0);
    if (!li.contains(range.startContainer)) return false;
    const before = range.cloneRange();
    before.selectNodeContents(li);
    before.setEnd(range.startContainer, range.startOffset);
    return !before.toString().replace(/\u00a0/g, " ").trim();
  }

  function isCaretAtStartOfBlock(block) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !selection.isCollapsed || !block) return false;
    const range = selection.getRangeAt(0);
    if (!block.contains(range.startContainer)) return false;
    const before = range.cloneRange();
    before.selectNodeContents(block);
    before.setEnd(range.startContainer, range.startOffset);
    return !before.toString().replace(/ /g, " ").trim();
  }

  function collapsedHeadingForHiddenBlock(block) {
    let cursor = block;
    while (cursor && cursor.dataset?.collapsedHidden === "true") {
      cursor = cursor.previousElementSibling;
    }
    return cursor && isHeadingBlock(cursor) && cursor.dataset.collapsed === "true" ? cursor : null;
  }

  function isCaretAtStartOfEditor(editor) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !selection.isCollapsed) return false;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.startContainer)) return false;
    const before = range.cloneRange();
    before.selectNodeContents(editor);
    before.setEnd(range.startContainer, range.startOffset);
    return !before.toString().replace(/\u00a0/g, " ").trim();
  }

  function currentEditableBlock(editor) {
    const selection = window.getSelection();
    let node = selection?.anchorNode;
    if (!node || !editor.contains(node)) return null;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    return node?.closest?.("p, div:not(.page-sheet), h1, h2, h3, li") || editor;
  }

  function blankParagraph() {
    const paragraph = document.createElement("p");
    paragraph.appendChild(document.createElement("br"));
    return paragraph;
  }

  function directSheetChildForBlock(block, sheet) {
    let node = block;
    while (node?.parentElement && node.parentElement !== sheet) {
      node = node.parentElement;
    }
    return node?.parentElement === sheet ? node : null;
  }

  function isCaretAtEndOfBlock(block) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !selection.isCollapsed || !block) return false;
    const range = selection.getRangeAt(0);
    if (!block.contains(range.endContainer)) return false;
    const after = range.cloneRange();
    after.selectNodeContents(block);
    after.setStart(range.endContainer, range.endOffset);
    const fragment = after.cloneContents();
    if (fragment.querySelector?.("img, video, audio, iframe, table, hr")) return false;
    return !after.toString().replace(/\u00a0/g, " ").trim();
  }

  function isLastEditableBlockInSheet(block, sheet) {
    const directChild = directSheetChildForBlock(block, sheet);
    if (!directChild) return false;
    const children = [...sheet.children].filter((child) => {
      if (child.dataset.paginationProbe === "true") return false;
      return sheetHasUserStructure(child);
    });
    return children[children.length - 1] === directChild;
  }

  function canInsertImmediatePageBreak(editor, block) {
    if (normalizeEditorViewMode(state.settings?.editorViewMode) !== "pages" || !isContinuousPageFlow()) return false;
    const sheet = currentPageSheet(editor);
    return !!sheet
      && !!block
      && block !== editor
      && sheet.contains(block)
      && isCaretAtEndOfBlock(block)
      && isLastEditableBlockInSheet(block, sheet);
  }

  function insertBlankParagraphInCurrentSheet(editor, note, box) {
    const sheet = currentPageSheet(editor) || editor.querySelector?.(".page-sheet");
    if (!sheet) return false;
    rememberEditorSnapshot(note, editor);
    const paragraph = blankParagraph();
    sheet.appendChild(paragraph);
    placeCaretInside(paragraph);
    note.content = editorSnapshotContent(editor);
    note.modifiedAt = now();
    touchBox(box);
    updateEditorStats(note);
    saveEditorSelection(editor);
    commitEditorHistoryChange(note, note.content);
    saveState();
    syncPagedEditorMetrics(editor);
    return true;
  }

  function insertImmediatePageBreak(editor, note, box, block) {
    if (!canInsertImmediatePageBreak(editor, block)) return false;
    const currentSheet = currentPageSheet(editor);
    if (!currentSheet) return false;
    rememberEditorSnapshot(note, editor);
    const snapshot = capturePagedViewport(editor);
    const nextSheet = createPageSheetAfter(editor, currentSheet);
    configurePageSheet(nextSheet, Number(nextSheet.dataset.pageSheet || 0), { editable: false });
    const paragraph = blankParagraph();
    nextSheet.appendChild(paragraph);
    runtime.activePageIndex = Number(nextSheet.dataset.pageSheet || 0);
    editor.focus({ preventScroll: true });
    placeCaretInside(paragraph);
    note.content = editorSnapshotContent(editor);
    note.modifiedAt = now();
    touchBox(box);
    updateEditorStats(note);
    saveEditorSelection(editor);
    updateEditorToolbarState(editor);
    commitEditorHistoryChange(note, note.content);
    saveState();
    syncPagedEditorMetrics(editor);
    requestAnimationFrame(() => restorePagedViewport(snapshot, paragraph, "target"));
    return true;
  }

  function ensureFirstContinuousPage(editor, note, box) {
    if (normalizeEditorViewMode(state.settings?.editorViewMode) !== "pages" || !isContinuousPageFlow() || !editor) return false;
    const sheets = [...(editor.querySelectorAll?.(".page-sheet") || [])];
    if (sheets.length > 1) return false;

    let firstSheet = sheets[0] || null;
    if (firstSheet && sheetHasUserStructure(firstSheet)) return false;

    if (!firstSheet) {
      editor.innerHTML = "";
      firstSheet = createPageSheet(editor, 0);
    } else {
      firstSheet.innerHTML = "";
      configurePageSheet(firstSheet, 0, { editable: false });
    }

    const paragraph = blankParagraph();
    firstSheet.appendChild(paragraph);
    runtime.activePageIndex = 0;
    editor.focus({ preventScroll: true });
    placeCaretInside(paragraph);
    note.content = editorSnapshotContent(editor);
    note.modifiedAt = now();
    touchBox(box);
    updateEditorStats(note);
    saveEditorSelection(editor);
    updateEditorToolbarState(editor);
    commitEditorHistoryChange(note, note.content);
    saveState();
    syncPagedEditorMetrics(editor);
    return true;
  }

  function removeCurrentEmptyContinuousPageIfNeeded(editor, note, box) {
    if (normalizeEditorViewMode(state.settings?.editorViewMode) !== "pages" || !isContinuousPageFlow()) return false;
    const sheet = currentPageSheet(editor);
    const sheets = [...(editor?.querySelectorAll?.(".page-sheet") || [])];
    const index = sheets.indexOf(sheet);
    if (!sheet || index <= 0 || sheetHasUserStructure(sheet)) return false;
    const snapshot = capturePagedViewport(editor);
    const previousSheet = sheets[index - 1];
    sheet.remove();
    renumberPageSheets(editor);
    const target = previousSheet.lastElementChild || previousSheet.appendChild(blankParagraph());
    runtime.activePageIndex = Number(previousSheet.dataset.pageSheet || 0);
    editor.focus({ preventScroll: true });
    placeCaretAtEnd(target);
    note.content = editorSnapshotContent(editor);
    note.modifiedAt = now();
    touchBox(box);
    updateEditorStats(note);
    saveEditorSelection(editor);
    updateEditorToolbarState(editor);
    commitEditorHistoryChange(note, note.content);
    saveState();
    syncPagedEditorMetrics(editor);
    requestAnimationFrame(() => restorePagedViewport(snapshot, target, "target"));
    return true;
  }

  function shouldPrepaginateEnter(editor, block) {
    if (normalizeEditorViewMode(state.settings?.editorViewMode) !== "pages") return false;
    if (!isContinuousPageFlow()) return false;
    const selection = window.getSelection();
    if (!selection || !selection.isCollapsed) return false;
    const sheet = currentPageSheet(editor);
    if (!sheet || !block || block === editor || !sheet.contains(block)) return false;
    if (sheetOverflows(sheet)) return true;

    const probe = document.createElement("p");
    probe.dataset.paginationProbe = "true";
    probe.appendChild(document.createElement("br"));
    block.after(probe);
    const overflows = sheetOverflows(sheet);
    probe.remove();
    return overflows;
  }

  function insertPredictivePageBreak(editor, note, box, repaginateNow) {
    const block = currentEditableBlock(editor);
    if (insertImmediatePageBreak(editor, note, box, block)) return;
    rememberEditorSnapshot(note, editor);
    editor.focus({ preventScroll: true });
    document.execCommand("insertParagraph", false, null);
    note.content = editorSnapshotContent(editor);
    note.modifiedAt = now();
    touchBox(box);
    updateEditorStats(note);
    saveEditorSelection(editor);
    updateEditorToolbarState(editor);
    commitEditorHistoryChange(note, note.content);
    saveState();
    if (typeof repaginateNow === "function") {
      repaginateNow(editor, { scroll: "target", delay: 0 });
    } else {
      refreshPagedEditorIfNeeded(editor, note, "target", { force: true });
    }
  }

  function isHeadingBlock(block) {
    return !!block && ["H1", "H2", "H3"].includes(block.tagName);
  }

  function exitHeadingBlock(editor, note, box, heading) {
    rememberEditorSnapshot(note, editor);
    const selection = window.getSelection();
    if (selection && selection.rangeCount && selection.isCollapsed && heading.contains(selection.getRangeAt(0).startContainer)) {
      const caret = selection.getRangeAt(0);
      const beforeRange = caret.cloneRange();
      beforeRange.selectNodeContents(heading);
      beforeRange.setEnd(caret.startContainer, caret.startOffset);
      const afterRange = caret.cloneRange();
      afterRange.selectNodeContents(heading);
      afterRange.setStart(caret.startContainer, caret.startOffset);
      const hasTextBefore = !!beforeRange.toString().replace(/ /g, " ").trim();
      const hasTextAfter = !!afterRange.toString().replace(/ /g, " ").trim();
      if (hasTextAfter && hasTextBefore) {
        const tail = document.createElement(heading.tagName.toLowerCase());
        tail.appendChild(afterRange.extractContents());
        heading.after(tail);
        prepareCollapsibleHeadings(editor, note, box);
        placeCaretInside(tail);
        updateEditorToolbarState(editor);
        syncEditorContent(editor, note, box);
        return;
      }
      if (hasTextAfter && !hasTextBefore) {
        const spacer = document.createElement("p");
        spacer.appendChild(document.createElement("br"));
        heading.before(spacer);
        placeCaretInside(heading);
        updateEditorToolbarState(editor);
        syncEditorContent(editor, note, box);
        return;
      }
    }
    const paragraph = document.createElement("p");
    paragraph.appendChild(document.createElement("br"));
    heading.after(paragraph);
    placeCaretInside(paragraph);
    updateEditorToolbarState(editor);
    syncEditorContent(editor, note, box);
  }

  function currentLineMarker(editor) {
    const block = currentEditableBlock(editor);
    if (!block || block.tagName === "LI") return null;
    if (block.querySelector?.("img, video, audio, iframe")) return null;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    if (!block.contains(range.startContainer)) return null;
    const before = range.cloneRange();
    before.selectNodeContents(block);
    before.setEnd(range.startContainer, range.startOffset);
    const typed = before.toString().replace(/\u00a0/g, " ");
    if (!typed || typed !== typed.trim()) return null;
    const markers = {
      "*": { tag: "ul", className: "" },
      "-": { tag: "ul", className: "dash-list" },
      "--": { tag: "ul", className: "square-list" },
      "+": { tag: "ul", className: "" },
      "1.": { tag: "ol", className: "" },
      "1)": { tag: "ol", className: "" },
      "[]": { tag: "ul", className: "check-list" },
      "[ ]": { tag: "ul", className: "check-list" },
      "->": { tag: "ul", className: "arrow-list" },
      "^": { tag: "ul", className: "arrow-list" },
    };
    const config = markers[typed];
    return config ? { ...config, markerText: typed } : null;
  }

  function convertCurrentBlockToList(editor, note, box, marker) {
    const block = currentEditableBlock(editor);
    if (!block) return;
    rememberEditorSnapshot(note, editor);
    const list = document.createElement(marker.tag);
    if (marker.className) list.className = marker.className;
    const item = document.createElement("li");
    list.appendChild(item);
    if (block === editor) {
      editor.innerHTML = "";
      item.appendChild(document.createElement("br"));
      editor.appendChild(list);
    } else {
      const selection = window.getSelection();
      if (selection && selection.rangeCount) {
        const caret = selection.getRangeAt(0);
        if (block.contains(caret.startContainer)) {
          const markerRange = caret.cloneRange();
          markerRange.selectNodeContents(block);
          markerRange.setEnd(caret.startContainer, caret.startOffset);
          markerRange.deleteContents();
        }
      }
      while (block.firstChild) item.appendChild(block.firstChild);
      if (!item.textContent.trim() && !item.querySelector("br, img")) {
        item.appendChild(document.createElement("br"));
      }
      block.replaceWith(list);
    }
    placeCaretInside(item);
    runtime.lastListAutoFormat = {
      li: item,
      marker: marker.markerText || "*",
      text: item.textContent,
    };
    syncListMarkerColors(editor);
    syncEditorContent(editor, note, box);
  }

  function revertListAutoFormat(editor, note, box) {
    const memo = runtime.lastListAutoFormat;
    runtime.lastListAutoFormat = null;
    const li = memo?.li;
    if (!li || !li.isConnected || !editor.contains(li)) return false;
    if (li.textContent !== memo.text) return false;
    const list = li.parentElement;
    if (!list || list.children.length !== 1) return false;
    rememberEditorSnapshot(note, editor);
    const paragraph = document.createElement("p");
    const restored = memo.text ? `${memo.marker} ${memo.text}` : `${memo.marker} `;
    paragraph.textContent = restored;
    list.replaceWith(paragraph);
    const textNode = paragraph.firstChild;
    const selection = window.getSelection();
    const range = document.createRange();
    const caretOffset = Math.min(memo.marker.length + 1, textNode.textContent.length);
    range.setStart(textNode, caretOffset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    saveEditorSelection(editor);
    syncEditorContent(editor, note, box);
    return true;
  }

  function listItemIsEmpty(li) {
    return !li.textContent.trim() && !li.querySelector("img, video, audio, iframe");
  }

  function exitListItem(editor, note, box, li) {
    rememberEditorSnapshot(note, editor);
    const list = li.parentElement;
    const afterList = list.cloneNode(false);
    let sibling = li.nextSibling;
    while (sibling) {
      const next = sibling.nextSibling;
      afterList.appendChild(sibling);
      sibling = next;
    }

    const parentItem = list.parentElement?.closest?.("li");
    const outerList = list.parentElement?.closest?.("ul, ol");
    if (outerList && editor.contains(outerList)) {
      const properNesting = !!parentItem && list.parentElement === parentItem;
      if (!li.textContent.trim() && !li.querySelector("br, img")) {
        li.appendChild(document.createElement("br"));
      }
      if (properNesting) {
        parentItem.after(li);
      } else {
        list.after(li);
      }
      placeCaretAtEnd(li);
      if (afterList.children.length) {
        if (properNesting) {
          li.appendChild(afterList);
        } else {
          li.after(afterList);
        }
      }
      if (!list.children.length) list.remove();
      saveEditorSelection(editor);
      syncEditorContent(editor, note, box);
      return;
    }

    const paragraph = document.createElement("p");
    while (li.firstChild) paragraph.appendChild(li.firstChild);
    if (!paragraph.textContent.trim() && !paragraph.querySelector("br")) {
      paragraph.textContent = "";
      paragraph.appendChild(document.createElement("br"));
    }

    li.remove();
    if (list.children.length) {
      list.after(paragraph);
    } else {
      list.replaceWith(paragraph);
    }
    if (afterList.children.length) paragraph.after(afterList);
    placeCaretInside(paragraph);
    syncEditorContent(editor, note, box);
  }

  function placeCaretInside(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function placeCaretAtEnd(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function selectionInsideEditor(editor, range) {
    return !!editor && !!range && editor.contains(range.startContainer) && editor.contains(range.endContainer);
  }

  function saveEditorSelection(editor) {
    const selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (selectionInsideEditor(editor, range)) {
      runtime.editorRange = range.cloneRange();
    }
  }

  function holdEditorSelectionHighlight() {
    if (typeof Highlight === "undefined" || !CSS.highlights || !runtime.editorRange || runtime.editorRange.collapsed) return;
    try {
      CSS.highlights.set("mindset-held-selection", new Highlight(runtime.editorRange.cloneRange()));
    } catch (error) {
      /* surlignage indisponible : sans consequence */
    }
  }

  function releaseEditorSelectionHighlight() {
    CSS.highlights?.delete?.("mindset-held-selection");
  }

  function restoreEditorSelection(editor) {
    if (!editor) return;
    releaseEditorSelectionHighlight();
    const focusTarget = isIndependentPageMode() ? (currentPageSheet(editor) || editor) : editor;
    focusTarget.focus({ preventScroll: true });
    const selection = window.getSelection();
    if (!selection || !runtime.editorRange) return;
    try {
      if (!selectionInsideEditor(editor, runtime.editorRange)) {
        runtime.editorRange = null;
        return;
      }
      selection.removeAllRanges();
      selection.addRange(runtime.editorRange.cloneRange());
    } catch (error) {
      runtime.editorRange = null;
    }
  }

  function editorSnapshotContent(editor) {
    if (!editor) return "<p><br></p>";
    const pagedDom = !!(editor.closest?.(".editor-page.is-page-mode") && editor.querySelector?.(".page-sheet"));
    if (!pagedDom) {
      return editor.innerHTML || "<p><br></p>";
    }
    return mergePageEditorHtml({
      keepActiveBlankSheet: true,
      keepSheets: editor.dataset.pageFlow === "independent",
    });
  }

  function flushActiveEditorContent() {
    const editor = app.querySelector("[data-note-editor]");
    if (!editor) return false;
    const box = activeBox();
    if (!box) return false;
    const note = findItem(box, editor.dataset.editorNoteId || box.activeItemId);
    if (note?.type !== "note") return false;
    note.content = editorSnapshotContent(editor);
    note.modifiedAt = now();
    touchBox(box);
    markEditorHistoryCurrent(note, note.content);
    saveState();
    return true;
  }

  function editorHistory(note) {
    const id = note?.id || "active";
    if (!runtime.noteHistories.has(id)) {
      runtime.noteHistories.set(id, {
        undo: [],
        redo: [],
        current: note?.content || "<p><br></p>",
      });
    }
    return runtime.noteHistories.get(id);
  }

  function rememberEditorSnapshot(note, editor) {
    if (!note || !editor || runtime.restoringEditorHistory) return;
    rememberIndependentPageSnapshot(editor);
    const history = editorHistory(note);
    const snapshot = editorSnapshotContent(editor);
    if (history.undo[history.undo.length - 1] !== snapshot) {
      history.undo.push(snapshot);
      if (history.undo.length > 120) history.undo.shift();
    }
    history.redo = [];
    history.current = snapshot;
  }

  function markEditorHistoryCurrent(note, content) {
    if (!note) return;
    const history = editorHistory(note);
    history.current = content || "<p><br></p>";
  }

  function commitEditorHistoryChange(note, content) {
    if (!note || runtime.restoringEditorHistory) return;
    const history = editorHistory(note);
    const next = content || "<p><br></p>";
    if (history.current !== next) {
      if (history.undo[history.undo.length - 1] !== history.current) {
        history.undo.push(history.current);
        if (history.undo.length > 120) history.undo.shift();
      }
      history.redo = [];
    }
    history.current = next;
  }

  function restoreEditorHistory(editor, note, box, direction) {
    if (!editor || !note || !box) return false;
    const history = editorHistory(note);
    const from = direction === "redo" ? history.redo : history.undo;
    const to = direction === "redo" ? history.undo : history.redo;
    if (!from.length) return false;

    const current = editorSnapshotContent(editor);
    const target = from.pop();
    to.push(current);
    if (to.length > 120) to.shift();

    runtime.restoringEditorHistory = true;
    note.content = target || "<p><br></p>";
    note.modifiedAt = now();
    touchBox(box);
    if (normalizeEditorViewMode(state.settings?.editorViewMode) === "pages") {
      paginateNoteIntoPages(note);
    } else {
      editor.innerHTML = note.content;
    }
    prepareCollapsibleHeadings(editor, note, box);
    updateEditorStats(note);
    markEditorHistoryCurrent(note, note.content);
    saveState();
    const focusTarget = isIndependentPageMode() ? (currentPageSheet(editor) || editor) : editor;
    focusTarget.focus({ preventScroll: true });
    placeCaretAtEnd(focusTarget);
    saveEditorSelection(editor);
    runtime.restoringEditorHistory = false;
    return true;
  }

  function syncEditorContent(editor, note, box) {
    if (enforceIndependentPageLimit(editor, note, box)) return;
    syncListMarkerColors(editor);
    note.content = editorSnapshotContent(editor);
    note.modifiedAt = now();
    touchBox(box);
    updateEditorStats(note);
    commitEditorHistoryChange(note, note.content);
    saveState();
    refreshPagedEditorIfNeeded(editor, note);
  }

  function applyHeadingFormat(editor, note, box, value) {
    rememberEditorSnapshot(note, editor);
    restoreEditorSelection(editor);
    const tag = ["h1", "h2", "h3"].includes(value) ? `<${value}>` : "<p>";
    document.execCommand("formatBlock", false, tag);
    prepareCollapsibleHeadings(editor, note, box);
    updateEditorToolbarState(editor);
    syncEditorContent(editor, note, box);
  }

  function selectionComputedValues(editor) {
    const selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    if (!selectionInsideEditor(editor, range)) return null;
    const families = new Set();
    const sizes = new Set();

    const collectFrom = (element) => {
      if (!element || !editor.contains(element)) return;
      const style = getComputedStyle(element);
      families.add(style.fontFamily);
      sizes.add(style.fontSize);
    };

    if (range.collapsed) {
      let node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      collectFrom(node);
    } else {
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.textContent.trim() || !range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
          if (node === range.endContainer && range.endOffset === 0) return NodeFilter.FILTER_REJECT;
          if (node === range.startContainer && range.startOffset >= node.textContent.length) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let node = walker.nextNode();
      let visited = 0;
      while (node && visited < 400 && (families.size < 2 || sizes.size < 2)) {
        collectFrom(node.parentElement);
        visited += 1;
        node = walker.nextNode();
      }
      if (!families.size) {
        let fallback = range.startContainer;
        if (fallback.nodeType === Node.TEXT_NODE) fallback = fallback.parentElement;
        collectFrom(fallback);
      }
    }

    if (!families.size) return null;
    return {
      fontFamily: families.size === 1 ? [...families][0] : null,
      fontSize: sizes.size === 1 ? [...sizes][0] : null,
    };
  }

  function primaryFontName(stack) {
    return String(stack || "").split(",")[0].replace(/["']/g, "").trim().toLowerCase();
  }

  function removeDynamicSelectOption(select) {
    select.querySelector("option[data-dynamic-option]")?.remove();
  }

  function setDynamicSelectValue(select, value, label) {
    const dynamic = document.createElement("option");
    dynamic.dataset.dynamicOption = "true";
    dynamic.value = value;
    dynamic.textContent = label;
    select.appendChild(dynamic);
    select.value = value;
  }

  function syncFontFamilySelect(select, computedFamily) {
    removeDynamicSelectOption(select);
    if (!computedFamily) {
      select.selectedIndex = -1;
      return;
    }
    const target = primaryFontName(computedFamily);
    const option = [...select.options].find((item) => primaryFontName(item.value) === target);
    if (option) {
      select.value = option.value;
      return;
    }
    setDynamicSelectValue(select, computedFamily, String(computedFamily).split(",")[0].replace(/["']/g, "").trim() || "Police");
  }

  function syncFontSizeSelect(input, computedSize) {
    if (!input || document.activeElement === input) return;
    const parsed = Number.parseFloat(computedSize);
    input.value = computedSize && Number.isFinite(parsed) ? String(Math.round(parsed)) : "";
  }

  function updateEditorToolbarState(editorElement) {
    updateFormatBlockSelect(editorElement);
    const fontSelect = app.querySelector("[data-font-family]");
    const sizeSelect = app.querySelector("[data-font-size]");
    if (!fontSelect && !sizeSelect) return;
    const computed = selectionComputedValues(editorElement);
    if (!computed) return;
    if (fontSelect) syncFontFamilySelect(fontSelect, computed.fontFamily);
    if (sizeSelect) syncFontSizeSelect(sizeSelect, computed.fontSize);
  }

  function updateFormatBlockSelect(editor) {
    const select = app.querySelector("[data-format-block]");
    if (!select || !editor) return;
    const block = currentEditableBlock(editor);
    const value = isHeadingBlock(block) ? block.tagName.toLowerCase() : "p";
    if (select.value !== value) select.value = value;
  }

  function setLastEditorColor(kind, color) {
    const clean = cleanColor(color, "");
    if (!clean) return clean;
    const lastKey = kind === "highlight" ? "lastHighlightColor" : "lastTextColor";
    state.settings[lastKey] = clean;
    return clean;
  }

  function registerRecentColor(kind, color) {
    const clean = setLastEditorColor(kind, color);
    if (!clean) return clean;
    const recentKey = kind === "highlight" ? "recentHighlightColors" : "recentTextColors";
    const slotKey = kind === "highlight" ? "recentHighlightColorSlot" : "recentTextColorSlot";
    const existing = normalizeRecentColorSlots(state.settings[recentKey] || []);
    if (!existing.includes(clean)) {
      const emptyIndex = existing.findIndex((item) => !item);
      const targetIndex = emptyIndex >= 0 ? emptyIndex : Math.min(Math.max(Number(state.settings[slotKey]) || 0, 0), 2);
      existing[targetIndex] = clean;
      state.settings[slotKey] = (targetIndex + 1) % 3;
    }
    state.settings[recentKey] = existing;
    return clean;
  }

  function paintColorTool(kind, currentColor) {
    const tool = app.querySelector(`[data-color-tool="${kind}"]`);
    if (!tool) return;
    const recentKey = kind === "highlight" ? "recentHighlightColors" : "recentTextColors";
    const presets = kind === "highlight" ? baseColorPresets : textColorPresets;
    const presetValues = new Set(presets.map((color) => color.value));
    const current = cleanColor(currentColor, "");
    const recents = normalizeRecentColorSlots(state.settings?.[recentKey]).map((color) => presetValues.has(color) ? "" : color);

    tool.querySelectorAll("[data-color-swatch]").forEach((button) => {
      button.classList.toggle("is-active", !!current && button.dataset.colorValue === current);
    });

    tool.querySelectorAll(".quick-color.is-recent").forEach((button, index) => {
      const color = recents[index] || "";
      button.dataset.colorValue = color;
      button.disabled = !color;
      button.style.setProperty("--quick-color", color);
      button.classList.toggle("is-empty", !color);
      button.classList.toggle("is-light", color === "#ffffff");
      button.classList.toggle("is-active", !!current && color === current);
      button.title = color ? `Memoire ${index + 1} ${color}` : `Memoire ${index + 1} vide`;
      button.setAttribute("aria-label", button.title);
    });
  }

  function applyEditorColor(editor, note, box, kind, color) {
    const clean = registerRecentColor(kind, color);
    if (!editor || !note || !box || !clean) return;
    rememberEditorSnapshot(note, editor);
    restoreEditorSelection(editor);
    document.execCommand(kind === "highlight" ? "hiliteColor" : "foreColor", false, clean);
    syncEditorContent(editor, note, box);
    paintColorTool(kind, clean);
  }

  function clearEditorHighlight(editor, note, box) {
    if (!editor || !note || !box) return;
    rememberEditorSnapshot(note, editor);
    restoreEditorSelection(editor);
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) {
      setToast("Sélectionne le texte à désurligner.");
      return;
    }
    const range = selection.getRangeAt(0);
    if (!selectionInsideEditor(editor, range)) return;
    document.execCommand("hiliteColor", false, "transparent");
    cleanHighlightArtifacts(editor);
    syncEditorContent(editor, note, box);
  }

  function cleanHighlightArtifacts(root) {
    const elements = root.querySelectorAll ? [...root.querySelectorAll("*")] : [];
    elements.forEach((element) => {
      if (element.style?.backgroundColor && ["transparent", "rgba(0, 0, 0, 0)"].includes(element.style.backgroundColor)) {
        element.style.removeProperty("background-color");
      }
      if (element.getAttribute("bgcolor")?.toLowerCase() === "transparent") element.removeAttribute("bgcolor");
      if (element.hasAttribute("style") && !element.getAttribute("style").trim()) element.removeAttribute("style");
    });
  }

  function fullyContainedInRange(range, target) {
    const targetRange = document.createRange();
    if (target.nodeType === Node.TEXT_NODE) {
      targetRange.selectNodeContents(target);
    } else {
      targetRange.selectNode(target);
    }
    return range.compareBoundaryPoints(Range.START_TO_START, targetRange) <= 0
      && range.compareBoundaryPoints(Range.END_TO_END, targetRange) >= 0;
  }

  function textNodesFullyInRange(editor, range) {
    const nodes = [];
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.textContent.length && range.intersectsNode(node) && fullyContainedInRange(range, node)) {
        nodes.push(node);
      }
      node = walker.nextNode();
    }
    return nodes;
  }

  function clearInlinePropertyInRange(editor, range, property) {
    const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;
    if (!container) return;
    container.querySelectorAll("[style], font").forEach((element) => {
      if (!editor.contains(element) || element === editor || !fullyContainedInRange(range, element)) return;
      element.style?.removeProperty?.(property);
      if (element.tagName === "FONT") {
        if (property === "font-family") element.removeAttribute("face");
        if (property === "font-size") element.removeAttribute("size");
        if (property === "color") element.removeAttribute("color");
      }
      if (element.getAttribute("style") === "") element.removeAttribute("style");
    });
  }

  function applyInlineStyleToSelection(editor, note, box, property, value) {
    rememberEditorSnapshot(note, editor);
    restoreEditorSelection(editor);
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const initialRange = selection.getRangeAt(0);
    if (!selectionInsideEditor(editor, initialRange)) return;

    if (initialRange.collapsed) {
      document.execCommand("insertHTML", false, `<span style="${property}:${value}">​</span>`);
      syncEditorContent(editor, note, box);
      return;
    }

    let startNode = initialRange.startContainer;
    let startOffset = initialRange.startOffset;
    let endNode = initialRange.endContainer;
    let endOffset = initialRange.endOffset;
    if (endNode.nodeType === Node.TEXT_NODE && endOffset > 0 && endOffset < endNode.textContent.length) {
      endNode.splitText(endOffset);
      endOffset = endNode.textContent.length;
    }
    if (startNode.nodeType === Node.TEXT_NODE && startOffset > 0 && startOffset < startNode.textContent.length) {
      const tail = startNode.splitText(startOffset);
      if (endNode === startNode) {
        endNode = tail;
        endOffset = tail.textContent.length;
      }
      startNode = tail;
      startOffset = 0;
    }

    const workRange = document.createRange();
    try {
      workRange.setStart(startNode, startNode.nodeType === Node.TEXT_NODE ? 0 : startOffset);
      workRange.setEnd(endNode, endNode.nodeType === Node.TEXT_NODE ? endNode.textContent.length : endOffset);
    } catch (error) {
      return;
    }

    clearInlinePropertyInRange(editor, workRange, property);

    const targets = textNodesFullyInRange(editor, workRange);
    targets.forEach((node) => {
      const parent = node.parentElement;
      if (parent && parent !== editor && parent.tagName === "SPAN" && parent.childNodes.length === 1 && !parent.classList.contains("page-sheet")) {
        parent.style.setProperty(property, value);
        return;
      }
      const span = document.createElement("span");
      span.style.setProperty(property, value);
      node.before(span);
      span.appendChild(node);
    });

    // Les blocs et items vides de la selection recoivent aussi le style
    // (comme la marque de paragraphe de Word) pour que la frappe a venir l'utilise.
    selectedEditorBlocks(editor).forEach((block) => {
      if (!block.textContent.trim() && fullyContainedInRange(workRange, block)) {
        block.style.setProperty(property, value);
      }
    });

    if (targets.length) {
      const restore = document.createRange();
      restore.setStart(targets[0], 0);
      restore.setEnd(targets[targets.length - 1], targets[targets.length - 1].textContent.length);
      selection.removeAllRanges();
      selection.addRange(restore);
      saveEditorSelection(editor);
    }
    syncEditorContent(editor, note, box);
    updateEditorToolbarState(editor);
  }

  function insertList(editor, note, box, type) {
    rememberEditorSnapshot(note, editor);
    restoreEditorSelection(editor);
    const listClasses = {
      bullet: "",
      dash: "dash-list",
      circle: "circle-list",
      arrow: "arrow-list",
      check: "check-list",
      triangle: "triangle-list",
      square: "square-list",
    };
    const className = listClasses[type] ?? "";
    const selection = window.getSelection();
    const range = selection && selection.rangeCount ? selection.getRangeAt(0) : null;

    const convertible = (candidate) => !!candidate
      && candidate !== editor
      && ["P", "DIV", "BLOCKQUOTE", "H1", "H2", "H3"].includes(candidate.tagName)
      && !candidate.classList.contains("page-sheet");

    let targetBlocks = [];
    if (range && selectionInsideEditor(editor, range)) {
      if (range.collapsed) {
        const block = currentEditableBlock(editor);
        if (convertible(block)) targetBlocks = [block];
      } else {
        targetBlocks = logicalEditorBlocks(editor).filter((block) => convertible(block) && range.intersectsNode(block));
      }
    }

    if (targetBlocks.length) {
      const list = document.createElement("ul");
      if (className) list.className = className;
      targetBlocks[0].before(list);
      targetBlocks.forEach((block) => {
        const item = document.createElement("li");
        while (block.firstChild) item.appendChild(block.firstChild);
        if (!item.textContent.trim() && !item.querySelector("br, img")) item.appendChild(document.createElement("br"));
        list.appendChild(item);
        block.remove();
      });
      placeCaretAtEnd(list.lastElementChild || list);
      saveEditorSelection(editor);
      syncEditorContent(editor, note, box);
      return;
    }

    const placeholders = {
      bullet: '<ul><li>Nouvel élément</li></ul>',
      dash: '<ul class="dash-list"><li>Nouvel élément</li></ul>',
      circle: '<ul class="circle-list"><li>Nouvel élément</li></ul>',
      arrow: '<ul class="arrow-list"><li>Nouvel élément</li></ul>',
      check: '<ul class="check-list"><li>Tâche</li></ul>',
      triangle: '<ul class="triangle-list"><li>Nouvel élément</li></ul>',
      square: '<ul class="square-list"><li>Nouvel élément</li></ul>',
    };
    document.execCommand("insertHTML", false, placeholders[type] || placeholders.bullet);
    syncEditorContent(editor, note, box);
  }

  document.addEventListener("click", (event) => {
    if (!runtime.contextMenu) return;
    if (event.target.closest?.("[data-context-menu]") || event.target.closest?.("[data-item-id]")) return;
    runtime.contextMenu = null;
    render();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest?.("[data-toolbar-menu]")) {
      app.querySelectorAll(".toolbar-menu.is-open").forEach((menu) => menu.classList.remove("is-open"));
    }
    if (!document.querySelector("[data-image-toolbar]")) return;
    if (event.target.closest?.("[data-image-toolbar]")) return;
    if (event.target.closest?.("img") && event.target.closest?.("[data-note-editor]")) return;
    removeImageToolbar();
  });

  document.addEventListener("scroll", () => {
    const img = app.querySelector("img.is-image-selected");
    if (img) positionImageToolbar(img);
  }, true);

  document.addEventListener("pointerdown", () => {
    runtime.pointerIsDown = true;
  }, true);
  ["pointerup", "pointercancel"].forEach((eventName) => {
    document.addEventListener(eventName, () => {
      runtime.pointerIsDown = false;
    }, true);
  });

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    const editingTarget = editableTarget(event.target);
    const editingEditor = editingTarget?.closest?.("[data-note-editor]");
    if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && !editingTarget) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        window.history.go(event.key === "ArrowLeft" ? -1 : 1);
        return;
      }
    }
    if ((event.ctrlKey || event.metaKey) && !event.altKey && editingEditor) {
      const key = event.key.toLowerCase();
      if (key === "z" || key === "y") {
        const box = activeBox();
        const note = box ? findItem(box, box.activeItemId) : null;
        if (box && note?.type === "note") {
          event.preventDefault();
          const direction = key === "y" || event.shiftKey ? "redo" : "undo";
          restoreEditorHistory(editingEditor, note, box, direction);
          return;
        }
      }
    }
    if ((event.ctrlKey || event.metaKey) && !editingTarget && !modalBlocksGlobalShortcuts()) {
      const key = event.key.toLowerCase();
      if (key === "c" || key === "x" || key === "v") {
        const box = activeBox();
        if (box) {
          event.preventDefault();
          if (key === "v") {
            pasteItemClipboard(box);
          } else {
            copySelectedItems(box, key === "x" ? "cut" : "copy");
          }
        }
        return;
      }
      if (key === "z" || key === "y") {
        event.preventDefault();
        const restored = key === "y" || event.shiftKey ? redoStateChange() : undoStateChange();
        if (!restored) setToast(key === "y" || event.shiftKey ? "Rien a retablir." : "Rien a annuler.");
        return;
      }
    }
    if (!editingTarget && !modalBlocksGlobalShortcuts() && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      const box = activeBox();
      if (box) moveKeyboardSelection(box, event.key === "ArrowDown" ? 1 : -1, event);
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      runtime.paletteQuery = "";
      setModal({ type: "selector" });
      render();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
      const box = activeBox();
      if (box) {
        event.preventDefault();
        createNote(box);
      }
    }
    if (event.key === "Delete" && !editingTarget && !modalBlocksGlobalShortcuts()) {
      const box = activeBox();
      const selected = box ? (box.selectedIds || []).filter((id) => id !== box.root.id) : [];
      if (box && selected.length) {
        event.preventDefault();
        requestDeleteSelected(box);
      }
    }
    if (event.key === "Escape" && runtime.contextMenu) {
      runtime.contextMenu = null;
      render();
    } else if (event.key === "Escape" && runtime.modal) {
      closeModalOrRestoreGraph();
    }
  });

  window.addEventListener("mousedown", (event) => {
    if (event.defaultPrevented || event.button < 3 || event.button > 4) return;
    event.preventDefault();
    window.history.go(event.button === 3 ? -1 : 1);
  });

  window.addEventListener("popstate", (event) => {
    if (event.state?.mindsetNav) {
      applyNavigationSnapshot(event.state.mindsetNav);
    } else {
      replaceNavigationPoint();
    }
  });

  window.addEventListener("focus", () => {
    const recentlyOpened = runtime.fontFolderOpenedAt && Date.now() - runtime.fontFolderOpenedAt < 10 * 60 * 1000;
    if (!recentlyOpened) return;
    window.clearTimeout(runtime.fontFolderScanTimer);
    runtime.fontFolderScanTimer = window.setTimeout(() => {
      syncDesktopFontFolder({ silent: true, rerender: runtime.modal?.type === "settings" });
    }, 250);
  });

  bindDesktopUpdates();
  render();
  replaceNavigationPoint();
  syncDesktopFontFolder({ silent: true, rerender: false });
})();
