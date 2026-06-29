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
    eraser: '<path d="m7 21-4-4a2 2 0 0 1 0-2.8L12.2 5a2 2 0 0 1 2.8 0l4 4a2 2 0 0 1 0 2.8L9.8 21H7Z"/><path d="m5 12 7 7"/><path d="M16 21h5"/>',
    alignLeft: '<path d="M4 6h16"/><path d="M4 10h10"/><path d="M4 14h16"/><path d="M4 18h10"/>',
    alignCenter: '<path d="M4 6h16"/><path d="M7 10h10"/><path d="M4 14h16"/><path d="M7 18h10"/>',
    alignRight: '<path d="M4 6h16"/><path d="M10 10h10"/><path d="M4 14h16"/><path d="M10 18h10"/>',
    alignJustify: '<path d="M4 6h16"/><path d="M4 10h16"/><path d="M4 14h16"/><path d="M4 18h16"/>',
  };

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
    return div.textContent || div.innerText || "";
  }

  function noteStats(note) {
    const text = stripHtml(note?.content || "").replace(/\s+/g, " ").trim();
    return {
      words: text ? text.split(" ").length : 0,
      chars: text.length,
    };
  }

  function updateEditorStats(note) {
    const stats = noteStats(note);
    const words = app.querySelector("[data-word-count]");
    const chars = app.querySelector("[data-char-count]");
    if (words) words.textContent = `${stats.words} mots`;
    if (chars) chars.textContent = `${stats.chars} caractères`;
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

  function defaultTreeGuideColor(theme) {
    return theme === "dark" ? "#5a5a5a" : "#c8ceca";
  }

  function normalizeStateShape(value) {
    const previousSettings = value.settings || {};
    const previousHeadings = previousSettings.headingPresets || {};
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
      recentTextColors: normalizeRecentColors(previousSettings.recentTextColors),
      recentHighlightColors: normalizeRecentColors(previousSettings.recentHighlightColors),
      headingPresets: {
        normal: { ...headingDefaults.normal, ...(previousHeadings.normal || {}) },
        h1: { ...headingDefaults.h1, ...(previousHeadings.h1 || {}) },
        h2: { ...headingDefaults.h2, ...(previousHeadings.h2 || {}) },
        h3: { ...headingDefaults.h3, ...(previousHeadings.h3 || {}) },
      },
    };
    value.boxes.forEach((box) => {
      if (!Array.isArray(box.bookmarkedIds)) box.bookmarkedIds = [];
      if (!Array.isArray(box.openTabIds)) box.openTabIds = box.activeItemId ? [box.activeItemId] : [];
      if (typeof box.customSortActive !== "boolean") box.customSortActive = false;
      if (!Array.isArray(box.selectedIds)) box.selectedIds = [];
      normalizeItemShape(box.root, true);
      const iconFolder = findItem(box, box.iconFolderId);
      if (!iconFolder || iconFolder.type !== "folder") box.iconFolderId = box.root.id;
    });
    return value;
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
          return normalizeStateShape(parsed);
        }
      } catch (error) {
        console.warn("MindSet state reset", error);
      }
    }
    return normalizeStateShape(createSeedState());
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
      currentBoxId: boxId,
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
    if (box && !Array.isArray(box.bookmarkedIds)) box.bookmarkedIds = [];
    if (box && !Array.isArray(box.openTabIds)) box.openTabIds = box.activeItemId ? [box.activeItemId] : [];
    return box;
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
    let found = null;
    walk(box.root, (node) => {
      if (node.id === id) found = node;
    });
    return found;
  }

  function findParent(box, id) {
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
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function setToast(message) {
    runtime.toast = message;
    render();
    window.clearTimeout(setToast.timer);
    setToast.timer = window.setTimeout(() => {
      runtime.toast = "";
      render();
    }, 2400);
  }

  function setActiveItem(box, id, event) {
    box.activeItemId = id;
    runtime.focusedItemId = id;
    if (!Array.isArray(box.openTabIds)) box.openTabIds = [];
    if (!box.openTabIds.includes(id)) box.openTabIds.push(id);
    if (id === box.root.id) {
      box.selectedIds = [];
      runtime.selectionAnchorId = null;
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

  function visibleItemIds() {
    return [...app.querySelectorAll(".tree-row[data-item-id], .list-row[data-item-id], .folder-card[data-item-id], .folder-tile[data-item-id]")]
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
    return [...surface.querySelectorAll(".tree-row[data-item-id], .list-row[data-item-id], .folder-card[data-item-id], .folder-tile[data-item-id]")]
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

    const finish = (pointerEvent) => {
      update(pointerEvent);
      overlay.remove();
      document.body.classList.remove("is-marquee-selecting");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      runtime.marquee = null;
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

    const move = (pointerEvent) => {
      pointerEvent.preventDefault();
      update(pointerEvent);
    };

    runtime.marquee = { surface };
    event.preventDefault();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, { once: true });
  }

  function closeTab(box, id) {
    box.openTabIds = (box.openTabIds || []).filter((tabId) => tabId !== id);
    if (!box.openTabIds.length) box.openTabIds = [box.root.id];
    if (box.activeItemId === id) {
      box.activeItemId = box.openTabIds[box.openTabIds.length - 1] || box.root.id;
      box.selectedIds = box.activeItemId === box.root.id ? [] : [box.activeItemId];
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
    if (!box.expandedIds.includes(folder.id)) box.expandedIds.push(folder.id);
    touchBox(box);
    saveState();
    render();
    requestAnimationFrame(() => document.querySelector("[data-note-editor]")?.focus());
  }

  function createFolder(box) {
    const folder = creationFolder(box);
    const createdAt = now();
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
    runtime.boxMenuOpen = false;
    if (target.passwordHash && !runtime.unlockedBoxIds.has(target.id)) {
      runtime.modal = { type: "unlock-box", boxId: target.id };
    } else {
      state.currentBoxId = target.id;
    }
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
    if (!ids.length) return;
    runtime.modal = { type: "confirm-delete", ids };
    render();
  }

  function deleteSelected(box, idsToDelete = box.selectedIds || []) {
    const ids = new Set(idsToDelete.filter((id) => id !== box.root.id));
    if (!ids.size) return;
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
    runtime.modal = null;
    touchBox(box);
    saveState();
    render();
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
    return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
  }

  function reorderItem(box, draggedId, targetId, position) {
    if (!draggedId || !targetId || draggedId === targetId) return;
    if (isDescendant(box, draggedId, targetId)) return;

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
    applyAppearance();
    const box = activeBox();
    app.innerHTML = box ? renderApp(box) : renderLobby();
    bindEvents();
  }

  function renderLobby() {
    return `
      <section class="lobby">
        <div class="lobby-inner">
          <div class="lobby-header">
            <div>
              <h1>MindSet</h1>
              <p>Choisis une boîte ou crée un nouvel espace pour un projet, une idée, un cours ou une zone de vie.</p>
            </div>
            <button class="button" data-action="create-box-modal">${icon("plus")} Nouvelle boîte</button>
          </div>
          <div class="box-grid">
            ${state.boxes.map(renderBoxCard).join("")}
          </div>
        </div>
      </section>
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
            ${runtime.modal?.type === "graph-full" ? renderGraphView(box) : renderMainContent(box)}
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
        <div class="tabs-strip" aria-label="Onglets ouverts">
          ${tabs.map((tab) => `
            <button class="doc-tab ${tab.id === activeId ? "is-active" : ""}" data-tab-id="${tab.id}" aria-label="${escapeHtml(tab.title)}">
              <span>${escapeHtml(tab.title)}</span>
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
    const graphActive = runtime.modal?.type === "graph-full";
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
                <small>${allItems(item).length} éléments</small>
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
    const folder = node.type === "folder";
    const childrenCount = folder ? node.children.length : "";
    const guides = depth
      ? `<span class="tree-guides" aria-hidden="true">${Array.from({ length: depth }, () => '<span class="tree-guide"></span>').join("")}</span>`
      : "";
    return `
      <div class="tree-row ${active ? "is-active" : ""} ${selected ? "is-selected" : ""} ${box.customSortActive ? "is-manual-sort" : ""}" style="--depth:${depth}" data-item-id="${node.id}" draggable="true">
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
    const indent = Math.max(depth - 1, 0);
    return `
      <div class="list-row ${indent ? "is-nested" : ""} ${active ? "is-active" : ""} ${selected ? "is-selected" : ""} ${box.customSortActive ? "is-manual-sort" : ""}" style="--depth:${indent}" data-item-id="${node.id}" draggable="true">
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
    return `
      <div class="folder-card ${active ? "is-active" : ""} ${selected ? "is-selected" : ""} ${box.customSortActive ? "is-manual-sort" : ""}" data-item-id="${node.id}" draggable="true">
        ${itemIconMarkup(node)}
        <span class="item-label">${escapeHtml(node.title)}</span>
        <span class="item-meta">${node.type === "folder" ? `${node.children.length} éléments` : formatShortDate(node.modifiedAt)}</span>
      </div>
    `;
  }

  function renderFolderTile(box, node) {
    const active = box.activeItemId === node.id;
    const selected = (box.selectedIds || []).includes(node.id);
    return `
      <article class="folder-tile ${active ? "is-active" : ""} ${selected ? "is-selected" : ""} ${box.customSortActive ? "is-manual-sort" : ""}" data-item-id="${node.id}" draggable="true">
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
    const recents = (state.settings?.[recentKey] || []).filter((color) => !presetValues.has(color));
    const swatches = [
      ...presets.map((color) => ({ ...color, recent: false })),
      ...recents.slice(0, 3).map((color) => ({ label: `Récent ${color}`, value: color, recent: true })),
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
              class="quick-color ${color.value === current ? "is-active" : ""} ${color.recent ? "is-recent" : ""} ${color.value === "#ffffff" ? "is-light" : ""}"
              style="--quick-color:${color.value}"
              data-color-swatch="${kind}"
              data-color-value="${color.value}"
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
    return `
      <article class="editor-shell">
        <div class="editor-toolbar" aria-label="Barre de mise en forme">
          <div class="toolbar-group">
            <select class="toolbar-select" data-format-block title="Style de titre">
              <option value="p">Normal</option>
              <option value="h1">Titre 1</option>
              <option value="h2">Titre 2</option>
              <option value="h3">Titre 3</option>
            </select>
            <select class="toolbar-select font-select" data-font-family title="Police">
              ${fontOptions.map((font, index) => `<option value="${escapeHtml(font.value)}" ${index === 0 ? "selected" : ""}>${escapeHtml(font.label)}</option>`).join("")}
            </select>
            <select class="toolbar-select" data-font-size title="Taille">
              <option value="14px">14</option>
              <option value="16px">16</option>
              <option value="18px" selected>18</option>
              <option value="22px">22</option>
              <option value="28px">28</option>
            </select>
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
            <button class="format-button" data-list-type="bullet" title="Point">•</button>
            <button class="format-button" data-list-type="dash" title="Tiret">-</button>
            <button class="format-button" data-list-type="circle" title="Rond">○</button>
            <button class="format-button" data-list-type="arrow" title="Flèche">→</button>
            <button class="format-button" data-list-type="check" title="To Do">☐</button>
            <button class="format-button" data-list-type="triangle" title="Triangle">△</button>
            <button class="format-button" data-list-type="square" title="Carré">□</button>
          </div>
          <div class="toolbar-group">
            <button class="format-button" data-editor-action="toggle-heading-collapse" title="Replier / deplier le titre">${icon("collapse")}</button>
            <button class="format-button ${bookmarked ? "is-active" : ""}" data-action="toggle-bookmark" data-tooltip="${bookmarked ? "Retirer des signets" : "Ajouter aux signets"}" aria-label="${bookmarked ? "Retirer des signets" : "Ajouter aux signets"}">${icon(bookmarked ? "bookmarkFilled" : "bookmark")}</button>
          </div>
        </div>
        <section class="editor-page">
          <input class="title-input" data-note-title value="${escapeHtml(note.title)}" aria-label="Titre de la note" />
          <div class="note-editor" data-note-editor contenteditable="true" spellcheck="true">${note.content || ""}</div>
          <div class="editor-status" aria-live="polite">
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
    return `
      <div class="mini-node" style="--depth:${depth}">
        <button class="mini-node-pill" data-item-id="${node.id}">${nodeIcon}<span>${escapeHtml(node.title)}</span></button>
      </div>
      ${children}
    `;
  }

  function renderQuickNotes(box) {
    const quick = box.root.children.find((item) => item.type === "folder" && item.title === "Notes rapides");
    if (!quick || !quick.children.length) return '<div class="empty-state">Aucune note rapide</div>';
    return quick.children.filter((item) => item.type === "note").slice(0, 5).map((note) => `
      <button class="quick-item" data-item-id="${note.id}">${escapeHtml(note.title)}</button>
    `).join("");
  }

  function renderGraphView(box) {
    return `
      <section class="graph-shell">
        <div class="graph-header">
          <div>
            <h1>Vue arbre</h1>
            <p>${escapeHtml(box.name)} · structure réelle des dossiers et notes</p>
          </div>
          <button class="tool-button raised" data-action="close-graph" data-tooltip="Retour à la note" aria-label="Retour à la note">${icon("edit")}</button>
        </div>
        <div class="graph-canvas">
          <div class="graph-map">
            ${renderGraphNode(box, box.root, true)}
          </div>
        </div>
      </section>
    `;
  }

  function renderGraphNode(box, node, root = false) {
    const children = node.type === "folder" ? sortedChildren(box, node) : [];
    const selected = (box.selectedIds || []).includes(node.id);
    const active = node.id === box.activeItemId;
    const words = node.type === "note" ? noteStats(node).words : 0;
    const meta = root
      ? "Boite"
      : node.type === "folder"
        ? `${children.length} element${children.length > 1 ? "s" : ""}`
        : `${words} mot${words > 1 ? "s" : ""}`;
    return `
      <div class="graph-branch ${root ? "is-root" : ""} ${children.length ? "has-children" : "is-leaf"} ${children.length === 1 ? "has-single-child" : ""}">
        <button class="graph-node ${root ? "root" : ""} ${node.type} ${active ? "is-active" : ""} ${selected ? "is-selected" : ""}" data-item-id="${node.id}" type="button">
          <span class="graph-node-icon">${graphNodeIcon(node, root)}</span>
          <span class="graph-node-copy">
            <strong>${escapeHtml(node.title)}</strong>
            <small>${escapeHtml(meta)}</small>
          </span>
        </button>
        ${children.length ? `
          <div class="graph-children ${children.length === 1 ? "is-single-child" : ""}">
            ${children.map((child) => renderGraphNode(box, child)).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }

  function graphNodeIcon(node, root = false) {
    if (root) return icon("box");
    return itemIconMarkup(node) || icon(node.type === "folder" ? "folder" : "note");
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
        <button class="context-row" data-action="rename-item" data-rename-target="${item.id}">
          ${icon("edit")}
          <span>Renommer</span>
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
                <input class="modal-field" name="name" value="Nouvelle boîte" required />
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
              <button class="ghost-button" type="button" data-action="close-modal">Annuler</button>
              <button class="button" type="submit">${icon("unlock")} Ouvrir</button>
            </div>
          </form>
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
                  <button class="palette-result" data-item-id="${node.id}">
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

    if (runtime.modal.type === "settings") {
      const settings = state.settings || {};
      const headings = settings.headingPresets || headingDefaults;
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
      return `
        <div class="modal-backdrop">
          <div class="modal settings-modal">
            <div class="modal-head">
              <h2>Paramètres</h2>
              <button class="icon-button" type="button" data-action="close-modal" data-tooltip="Fermer" aria-label="Fermer">${icon("close")}</button>
            </div>
            <div class="modal-body modal-grid">
              <section class="settings-section">
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
              </section>
              <section class="settings-section">
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
                        ${fontOptions.map((font) => `<option value="${escapeHtml(font.value)}" ${preset.fontFamily === font.value ? "selected" : ""}>${escapeHtml(font.label)}</option>`).join("")}
                      </select>
                      <select class="modal-field compact-field" data-heading-weight="${level}" aria-label="Graisse ${escapeHtml(row.label)}">
                        ${weightOptions.map((weight) => `<option value="${weight}" ${preset.weight === weight ? "selected" : ""}>${weight}</option>`).join("")}
                      </select>
                    </div>
                  `;
                }).join("")}
              </section>
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

  function bindEvents() {
    app.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", handleAction);
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

    app.querySelectorAll("[data-box-option]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        switchBoxById(button.dataset.boxOption);
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
      const sortableTarget = row.matches(".tree-row, .list-row, .folder-card, .folder-tile");
      row.addEventListener("click", (event) => {
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
        runtime.contextMenu = { itemId: item.id, x: event.clientX, y: event.clientY };
        saveState();
        render();
      });
      row.addEventListener("dragstart", (event) => {
        const box = activeBox();
        if (!sortableTarget || !box) {
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
        const canDropInto = target?.type === "folder" && !runtime.dragIds.includes(target.id) && !runtime.dragIds.some((id) => isDescendant(box, id, target.id));
        if (canDropInto) {
          event.preventDefault();
          row.classList.add("drop-into");
          row.classList.remove("drop-before", "drop-after");
          return;
        }
        if (!box.customSortActive) return;
        event.preventDefault();
        const position = dropPosition(event, row);
        row.classList.toggle("drop-before", position === "before");
        row.classList.toggle("drop-after", position === "after");
        row.classList.remove("drop-into");
      });
      row.addEventListener("dragleave", () => row.classList.remove("drop-before", "drop-after", "drop-into"));
      row.addEventListener("drop", (event) => {
        event.preventDefault();
        const box = activeBox();
        if (!sortableTarget || !box || !runtime.dragId) return;
        const target = findItem(box, row.dataset.itemId);
        const canDropInto = target?.type === "folder" && !runtime.dragIds.includes(target.id) && !runtime.dragIds.some((id) => isDescendant(box, id, target.id));
        if (canDropInto) {
          moveItemsToFolder(box, runtime.dragIds.length ? runtime.dragIds : [runtime.dragId], target.id);
          runtime.dragId = null;
          runtime.dragIds = [];
          return;
        }
        if (!box.customSortActive) return;
        reorderItem(box, runtime.dragId, row.dataset.itemId, dropPosition(event, row));
        box.selectedIds = [runtime.dragId];
        runtime.dragId = null;
        runtime.dragIds = [];
      });
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
        box.searchQuery = search.value;
        saveState();
        render();
        requestAnimationFrame(() => {
          const next = app.querySelector("[data-search]");
          if (next) {
            next.focus();
            next.setSelectionRange(next.value.length, next.value.length);
          }
        });
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
      boxTitle.addEventListener("blur", () => window.setTimeout(render, 0));
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

    if (runtime.contextMenu) {
      app.addEventListener("click", (event) => {
        if (!event.target.closest("[data-context-menu]") && !event.target.closest("[data-item-id]")) {
          runtime.contextMenu = null;
          render();
        }
      });
    }

    if (runtime.boxMenuOpen) {
      app.addEventListener("click", (event) => {
        if (!event.target.closest(".box-switcher")) {
          runtime.boxMenuOpen = false;
          render();
        }
      });
    }

    bindEditor();
    bindForms();
  }

  function handleAction(event) {
    event.preventDefault();
    event.stopPropagation();
    const action = event.currentTarget.dataset.action;
    const box = activeBox();

    if (action === "create-box-modal") {
      runtime.modal = { type: "create-box" };
      render();
      return;
    }
    if (action === "close-modal") {
      runtime.modal = null;
      runtime.paletteQuery = "";
      runtime.contextMenu = null;
      render();
      return;
    }
    if (action === "show-lobby") {
      state.currentBoxId = null;
      runtime.modal = null;
      saveState();
      render();
      return;
    }
    if (action === "open-box") {
      switchBoxById(event.currentTarget.dataset.boxId);
      return;
    }
    if (!box) return;

    if (action === "confirm-delete") {
      deleteSelected(box, runtime.modal?.ids || []);
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
      runtime.modal = { type: "settings" };
      render();
    }
    if (action === "rename-item") {
      runtime.contextMenu = null;
      runtime.modal = { type: "rename-item", itemId: event.currentTarget.dataset.renameTarget };
      render();
    }
    if (action === "show-explorer") {
      runtime.sideTab = "explorer";
      render();
    }
    if (action === "show-bookmarks") {
      runtime.sideTab = "bookmarks";
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
      runtime.modal = { type: "selector" };
      render();
    }
    if (action === "quick-note") createNote(box, ensureQuickFolder(box), true);
    if (action === "toggle-graph") {
      runtime.modal = runtime.modal?.type === "graph-full" ? null : { type: "graph-full" };
      render();
    }
    if (action === "close-graph") {
      runtime.modal = null;
      render();
    }
  }

  function bindForms() {
    const createBoxForm = app.querySelector("[data-create-box-form]");
    if (createBoxForm) {
      createBoxForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData(createBoxForm);
        const name = String(form.get("name") || "Nouvelle boîte").trim() || "Nouvelle boîte";
        const password = String(form.get("password") || "");
        const createdAt = now();
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
        state.currentBoxId = box.id;
        if (password) runtime.unlockedBoxIds.add(box.id);
        runtime.modal = null;
        saveState();
        render();
      });
    }

    const unlockForm = app.querySelector("[data-unlock-box-form]");
    if (unlockForm) {
      unlockForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const box = state.boxes.find((item) => item.id === runtime.modal?.boxId);
        const password = String(new FormData(unlockForm).get("password") || "");
        if (box && await sha256(password) === box.passwordHash) {
          runtime.unlockedBoxIds.add(box.id);
          state.currentBoxId = box.id;
          runtime.modal = null;
          saveState();
          render();
        } else {
          setToast("Mot de passe incorrect.");
        }
      });
    }

    const renameForm = app.querySelector("[data-rename-item-form]");
    if (renameForm) {
      renameForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const box = activeBox();
        const item = box ? findItem(box, runtime.modal?.itemId) : null;
        const name = String(new FormData(renameForm).get("name") || "").trim();
        if (!box || !item || !name) return;
        item.title = name;
        item.modifiedAt = now();
        touchBox(box);
        runtime.modal = null;
        saveState();
        render();
      });
    }
  }

  function bindEditor() {
    const box = activeBox();
    const note = box ? findItem(box, box.activeItemId) : null;
    if (!box || !note || note.type !== "note") return;

    const title = app.querySelector("[data-note-title]");
    const editor = app.querySelector("[data-note-editor]");

    if (title) {
      title.addEventListener("input", () => {
        note.title = title.value || "Sans titre";
        note.modifiedAt = now();
        touchBox(box);
        saveState();
      });
      title.addEventListener("blur", () => {
        window.setTimeout(() => {
          const active = document.activeElement;
          if (editor && (active === editor || editor.contains(active))) return;
          render();
        }, 0);
      });
    }

    if (editor) {
      prepareCollapsibleHeadings(editor, note, box);
      ["keyup", "mouseup", "focus", "click"].forEach((eventName) => {
        editor.addEventListener(eventName, () => {
          saveEditorSelection(editor);
          updateFormatBlockSelect(editor);
        });
      });
      editor.addEventListener("keydown", (event) => handleEditorAutomation(event, editor, note, box));
      editor.addEventListener("input", () => {
        note.content = editor.innerHTML;
        note.modifiedAt = now();
        touchBox(box);
        updateEditorStats(note);
        saveEditorSelection(editor);
        updateFormatBlockSelect(editor);
        saveState();
      });
    }

    app.querySelectorAll("[data-editor-cmd]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        saveEditorSelection(editor);
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        restoreEditorSelection(editor);
        document.execCommand(button.dataset.editorCmd, false, null);
        note.content = editor.innerHTML;
        note.modifiedAt = now();
        touchBox(box);
        saveState();
      });
    });

    const formatBlock = app.querySelector("[data-format-block]");
    if (formatBlock) {
      formatBlock.addEventListener("mousedown", () => saveEditorSelection(editor));
      formatBlock.addEventListener("focus", () => saveEditorSelection(editor));
      formatBlock.addEventListener("change", () => {
        applyHeadingFormat(editor, note, box, formatBlock.value);
      });
    }

    const size = app.querySelector("[data-font-size]");
    if (size) {
      size.addEventListener("mousedown", () => saveEditorSelection(editor));
      size.addEventListener("focus", () => saveEditorSelection(editor));
      size.addEventListener("change", () => applySpanStyle(editor, note, box, `font-size:${size.value}`));
    }

    const fontFamily = app.querySelector("[data-font-family]");
    if (fontFamily) {
      fontFamily.addEventListener("mousedown", () => saveEditorSelection(editor));
      fontFamily.addEventListener("focus", () => saveEditorSelection(editor));
      fontFamily.addEventListener("change", () => applySpanStyle(editor, note, box, `font-family:${fontFamily.value}`));
    }

    app.querySelectorAll("[data-color-input]").forEach((input) => {
      input.addEventListener("mousedown", () => saveEditorSelection(editor));
      input.addEventListener("focus", () => saveEditorSelection(editor));
      input.addEventListener("input", () => {
        const clean = registerRecentColor(input.dataset.colorInput, input.value);
        if (clean) input.value = clean;
        saveState();
      });
    });

    app.querySelectorAll("[data-apply-color]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        saveEditorSelection(editor);
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        const kind = button.dataset.applyColor;
        const input = app.querySelector(`[data-color-input="${kind}"]`);
        applyEditorColor(editor, note, box, kind, input?.value || "");
      });
    });

    app.querySelectorAll("[data-clear-highlight]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        saveEditorSelection(editor);
        event.preventDefault();
      });
      button.addEventListener("click", () => clearEditorHighlight(editor, note, box));
    });

    app.querySelectorAll("[data-color-swatch]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        saveEditorSelection(editor);
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        const kind = button.dataset.colorSwatch;
        const input = app.querySelector(`[data-color-input="${kind}"]`);
        if (input) input.value = button.dataset.colorValue;
        applyEditorColor(editor, note, box, kind, button.dataset.colorValue);
      });
    });

    app.querySelectorAll("[data-list-type]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        saveEditorSelection(editor);
        event.preventDefault();
      });
      button.addEventListener("click", () => insertList(editor, note, box, button.dataset.listType));
    });

    app.querySelectorAll("[data-editor-action]").forEach((button) => {
      button.addEventListener("mousedown", (event) => {
        saveEditorSelection(editor);
        event.preventDefault();
      });
      button.addEventListener("click", () => {
        if (button.dataset.editorAction === "toggle-heading-collapse") {
          toggleCurrentHeading(editor, note, box);
        }
      });
    });

    app.querySelectorAll("[data-heading-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const headings = [...editor.querySelectorAll("h1, h2, h3")];
        headings[Number(button.dataset.headingIndex)]?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  function prepareCollapsibleHeadings(editor, note, box) {
    syncCollapsedHeadings(editor);
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

  function toggleHeadingSection(editor, note, box, heading) {
    const collapsed = heading.dataset.collapsed !== "true";
    heading.dataset.collapsed = collapsed ? "true" : "false";
    heading.classList.toggle("is-heading-collapsed", collapsed);
    setHeadingSectionVisibility(heading, collapsed);
    if (!collapsed) syncCollapsedHeadings(editor);
    note.content = editor.innerHTML;
    note.modifiedAt = now();
    touchBox(box);
    updateEditorStats(note);
    saveState();
  }

  function setHeadingSectionVisibility(heading, collapsed) {
    const level = Number(heading.tagName.slice(1));
    let node = heading.nextElementSibling;
    while (node && !(/^H[1-3]$/.test(node.tagName) && Number(node.tagName.slice(1)) <= level)) {
      if (collapsed) {
        node.dataset.collapsedHidden = "true";
        node.style.display = "none";
      } else if (node.dataset.collapsedHidden === "true") {
        delete node.dataset.collapsedHidden;
        node.style.display = "";
      }
      node = node.nextElementSibling;
    }
  }

  function handleEditorAutomation(event, editor, note, box) {
    if (event.key === " " || event.code === "Space") {
      const marker = currentLineMarker(editor);
      if (marker) {
        event.preventDefault();
        convertCurrentBlockToList(editor, note, box, marker);
      }
      return;
    }

    if (event.key === "Enter") {
      const block = currentEditableBlock(editor);
      if (!event.shiftKey && isHeadingBlock(block)) {
        event.preventDefault();
        exitHeadingBlock(editor, note, box, block);
        return;
      }

      const li = currentListItem(editor);
      if (li && (!li.textContent.trim() || isCaretAtStartOfListItem(li))) {
        event.preventDefault();
        exitListItem(editor, note, box, li);
      }
      return;
    }

    if (event.key === "Backspace") {
      const li = currentListItem(editor);
      if (li && !li.textContent.trim()) {
        event.preventDefault();
        exitListItem(editor, note, box, li);
      }
      return;
    }

    if (event.key === "Tab") {
      const li = currentListItem(editor);
      if (!li) return;
      event.preventDefault();
      editor.focus();
      document.execCommand(event.shiftKey ? "outdent" : "indent", false, null);
      syncEditorContent(editor, note, box);
    }
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

  function currentEditableBlock(editor) {
    const selection = window.getSelection();
    let node = selection?.anchorNode;
    if (!node || !editor.contains(node)) return null;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    return node?.closest?.("p, div, h1, h2, h3, li") || editor;
  }

  function isHeadingBlock(block) {
    return !!block && ["H1", "H2", "H3"].includes(block.tagName);
  }

  function exitHeadingBlock(editor, note, box, heading) {
    const paragraph = document.createElement("p");
    paragraph.appendChild(document.createElement("br"));
    heading.after(paragraph);
    placeCaretInside(paragraph);
    updateFormatBlockSelect(editor);
    syncEditorContent(editor, note, box);
  }

  function currentLineMarker(editor) {
    const block = currentEditableBlock(editor);
    if (!block || block.tagName === "LI") return null;
    const text = block.textContent.replace(/\u00a0/g, " ");
    const trimmed = text.trim();
    if (!trimmed || text.trimEnd() !== trimmed) return null;
    const markers = {
      "*": { tag: "ul", className: "" },
      "-": { tag: "ul", className: "dash-list" },
      "+": { tag: "ul", className: "" },
      "1.": { tag: "ol", className: "" },
      "1)": { tag: "ol", className: "" },
      "[]": { tag: "ul", className: "check-list" },
      "[ ]": { tag: "ul", className: "check-list" },
      "->": { tag: "ul", className: "arrow-list" },
    };
    return markers[trimmed] || null;
  }

  function convertCurrentBlockToList(editor, note, box, marker) {
    const block = currentEditableBlock(editor);
    if (!block) return;
    const list = document.createElement(marker.tag);
    if (marker.className) list.className = marker.className;
    const item = document.createElement("li");
    item.appendChild(document.createElement("br"));
    list.appendChild(item);
    if (block === editor) {
      editor.innerHTML = "";
      editor.appendChild(list);
    } else {
      block.replaceWith(list);
    }
    placeCaretInside(item);
    syncEditorContent(editor, note, box);
  }

  function exitListItem(editor, note, box, li) {
    const list = li.parentElement;
    const afterList = list.cloneNode(false);
    let sibling = li.nextSibling;
    while (sibling) {
      const next = sibling.nextSibling;
      afterList.appendChild(sibling);
      sibling = next;
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

  function restoreEditorSelection(editor) {
    if (!editor) return;
    editor.focus({ preventScroll: true });
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

  function syncEditorContent(editor, note, box) {
    note.content = editor.innerHTML;
    note.modifiedAt = now();
    touchBox(box);
    updateEditorStats(note);
    saveState();
  }

  function applyHeadingFormat(editor, note, box, value) {
    restoreEditorSelection(editor);
    const tag = ["h1", "h2", "h3"].includes(value) ? `<${value}>` : "<p>";
    document.execCommand("formatBlock", false, tag);
    prepareCollapsibleHeadings(editor, note, box);
    updateFormatBlockSelect(editor);
    syncEditorContent(editor, note, box);
  }

  function updateFormatBlockSelect(editor) {
    const select = app.querySelector("[data-format-block]");
    if (!select || !editor) return;
    const block = currentEditableBlock(editor);
    const value = isHeadingBlock(block) ? block.tagName.toLowerCase() : "p";
    if (select.value !== value) select.value = value;
  }

  function registerRecentColor(kind, color) {
    const clean = cleanColor(color, "");
    if (!clean) return clean;
    const recentKey = kind === "highlight" ? "recentHighlightColors" : "recentTextColors";
    const lastKey = kind === "highlight" ? "lastHighlightColor" : "lastTextColor";
    const existing = normalizeRecentColors(state.settings[recentKey] || []);
    state.settings[lastKey] = clean;
    state.settings[recentKey] = [clean, ...existing.filter((item) => item !== clean)].slice(0, 8);
    return clean;
  }

  function applyEditorColor(editor, note, box, kind, color) {
    const clean = registerRecentColor(kind, color);
    if (!editor || !note || !box || !clean) return;
    restoreEditorSelection(editor);
    document.execCommand(kind === "highlight" ? "hiliteColor" : "foreColor", false, clean);
    syncEditorContent(editor, note, box);
  }

  function clearEditorHighlight(editor, note, box) {
    if (!editor || !note || !box) return;
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

  function applySpanStyle(editor, note, box, style) {
    restoreEditorSelection(editor);
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) {
      document.execCommand("insertHTML", false, `<span style="${style}">texte</span>`);
    } else {
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.setAttribute("style", style);
      span.appendChild(range.extractContents());
      range.insertNode(span);
      selection.removeAllRanges();
      const nextRange = document.createRange();
      nextRange.selectNodeContents(span);
      selection.addRange(nextRange);
    }
    note.content = editor.innerHTML;
    note.modifiedAt = now();
    touchBox(box);
    saveState();
  }

  function insertList(editor, note, box, type) {
    restoreEditorSelection(editor);
    const listMap = {
      bullet: '<ul><li>Nouvel élément</li></ul>',
      dash: '<ul class="dash-list"><li>Nouvel élément</li></ul>',
      circle: '<ul class="circle-list"><li>Nouvel élément</li></ul>',
      arrow: '<ul class="arrow-list"><li>Nouvel élément</li></ul>',
      check: '<ul class="check-list"><li>Tâche</li></ul>',
      triangle: '<ul class="triangle-list"><li>Nouvel élément</li></ul>',
      square: '<ul class="square-list"><li>Nouvel élément</li></ul>',
    };
    document.execCommand("insertHTML", false, listMap[type] || listMap.bullet);
    note.content = editor.innerHTML;
    note.modifiedAt = now();
    touchBox(box);
    saveState();
  }

  document.addEventListener("keydown", (event) => {
    const editingTarget = event.target.closest?.("input, textarea, select, [contenteditable='true']");
    if (!editingTarget && !runtime.modal && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      const box = activeBox();
      if (box) moveKeyboardSelection(box, event.key === "ArrowDown" ? 1 : -1, event);
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      runtime.paletteQuery = "";
      runtime.modal = { type: "selector" };
      render();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
      const box = activeBox();
      if (box) {
        event.preventDefault();
        createNote(box);
      }
    }
    if (event.key === "Delete" && !editingTarget && !runtime.modal) {
      const box = activeBox();
      const selected = box ? (box.selectedIds || []).filter((id) => id !== box.root.id) : [];
      if (box && selected.length) {
        event.preventDefault();
        requestDeleteSelected(box);
      }
    }
    if (event.key === "Escape" && runtime.modal) {
      runtime.modal = null;
      runtime.paletteQuery = "";
      runtime.contextMenu = null;
      render();
    } else if (event.key === "Escape" && runtime.contextMenu) {
      runtime.contextMenu = null;
      render();
    }
  });

  render();
})();
