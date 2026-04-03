const startBtn = document.getElementById("start-btn");
const feedback = document.getElementById("feedback");
const audio = document.getElementById("bg-audio");
const forbiddenBtn = document.getElementById("forbidden-btn");
const vizCanvas = document.getElementById("viz");
const vizCtx = vizCanvas ? vizCanvas.getContext("2d") : null;
const victoryOverlay = document.getElementById("victory-overlay");

const pages = document.querySelectorAll(".page");
const introPageId = "page-intro";
const captchaPageId = "page-captcha";
const coordsPageId = "page-coords";

let audioStarted = false;
let audioCtx = null;
let analyser = null;
let dataArray = null;
let bufferLength = 0;

function playAudio() {
  if (audio && !audioStarted) {
    audio.loop = true;
    audio.play()
      .then(() => {
        audioStarted = true;
        initVisualizer();
      })
      .catch(() => {
        // Autoplay block: will try again on next interaction
      });
  } else if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function kickstartAudio() {
  if (!audio) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } else if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  playAudio();
}

function initVisualizer() {
  if (!audio) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
  resizeViz();
  drawVisualizer();
}

function resizeViz() {
  if (!vizCanvas) return;
  vizCanvas.width = window.innerWidth;
  vizCanvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeViz);

function drawVisualizer() {
  if (!vizCtx || !analyser || !dataArray) return;
  requestAnimationFrame(drawVisualizer);
  analyser.getByteFrequencyData(dataArray);

  const { width, height } = vizCanvas;
  vizCtx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.18;
  const bars = 90;
  const step = Math.floor(bufferLength / bars);

  const avg =
    dataArray.reduce((sum, v) => sum + v, 0) / Math.max(1, dataArray.length) / 255;
  const pulse = Math.min(1, Math.max(0, (avg - 0.08) * 2.2));
  document.documentElement.style.setProperty("--pulse", pulse.toFixed(3));

  for (let i = 0; i < bars; i++) {
    const val = dataArray[i * step] / 255;
    const barLen = radius * 0.6 + val * radius * 0.9;
    const angle = (i / bars) * Math.PI * 2;
    const x1 = centerX + Math.cos(angle) * radius;
    const y1 = centerY + Math.sin(angle) * radius;
    const x2 = centerX + Math.cos(angle) * (radius + barLen);
    const y2 = centerY + Math.sin(angle) * (radius + barLen);

    const grad = vizCtx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, "rgba(198,166,103,0.08)");
    grad.addColorStop(1, "rgba(232,210,159,0.55)");

    vizCtx.strokeStyle = grad;
    vizCtx.lineWidth = 2.2;
    vizCtx.beginPath();
    vizCtx.moveTo(x1, y1);
    vizCtx.lineTo(x2, y2);
    vizCtx.stroke();
  }

  vizCtx.beginPath();
  vizCtx.arc(centerX, centerY, radius * 0.65, 0, Math.PI * 2);
  vizCtx.strokeStyle = "rgba(198,166,103,0.25)";
  vizCtx.lineWidth = 1.4;
  vizCtx.stroke();
}

function showPage(pageId) {
  pages.forEach((page) => {
    const isActive = page.id === pageId;
    page.classList.toggle("page--active", isActive);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// LoL-style metallic selection sound synthesised via Web Audio API
function playSelectSound() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) { return; }
  }
  if (audioCtx.state === "suspended") audioCtx.resume();

  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(820, now);
  osc.frequency.exponentialRampToValueAtTime(380, now + 0.2);
  oscGain.gain.setValueAtTime(0, now);
  oscGain.gain.linearRampToValueAtTime(0.38, now + 0.008);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
  osc.connect(oscGain);
  oscGain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.24);

  const osc2 = audioCtx.createOscillator();
  const osc2Gain = audioCtx.createGain();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(1640, now);
  osc2.frequency.exponentialRampToValueAtTime(980, now + 0.1);
  osc2Gain.gain.setValueAtTime(0, now);
  osc2Gain.gain.linearRampToValueAtTime(0.14, now + 0.006);
  osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
  osc2.connect(osc2Gain);
  osc2Gain.connect(audioCtx.destination);
  osc2.start(now);
  osc2.stop(now + 0.13);

  const impactLen = Math.ceil(audioCtx.sampleRate * 0.04);
  const impactBuf = audioCtx.createBuffer(1, impactLen, audioCtx.sampleRate);
  const impactData = impactBuf.getChannelData(0);
  for (let i = 0; i < impactLen; i++) {
    impactData[i] = (Math.random() * 2 - 1) * (1 - i / impactLen);
  }
  const impactSrc = audioCtx.createBufferSource();
  impactSrc.buffer = impactBuf;
  const impactFilter = audioCtx.createBiquadFilter();
  impactFilter.type = "highpass";
  impactFilter.frequency.value = 2200;
  const impactGain = audioCtx.createGain();
  impactGain.gain.setValueAtTime(0.22, now);
  impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  impactSrc.connect(impactFilter);
  impactFilter.connect(impactGain);
  impactGain.connect(audioCtx.destination);
  impactSrc.start(now);
}

// Soft synthesised chime for victory/success
function playVictorySound() {
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") audioCtx.resume();

  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    const t = now + i * 0.14;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.28, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + 0.7);
  });
}

function triggerVictory() {
  playVictorySound();
  if (!victoryOverlay) {
    showPage(coordsPageId);
    return;
  }
  victoryOverlay.classList.remove("hidden");
  requestAnimationFrame(() => victoryOverlay.classList.add("active"));
  setTimeout(() => {
    victoryOverlay.classList.remove("active");
    victoryOverlay.classList.add("hidden");
    showPage(coordsPageId);
  }, 4000);
}

// Failure messages from previous version, shown on unsuccessful moves
const failMessages = [
  "Der Stein schweigt. Dein Phallus bleibt im Dunkel verborgen.",
  "Die Runen knistern: Noch trägt deine Hand nicht das Gewicht eines wahrhaftigen Phallus.",
  "Ein kalter Hauch: Der Kreis murmelnd, du seist eher Wanderer als Träger des Phallus.",
  "Die Flamme verzieht sich spöttisch. Unwürdig, spricht der Schatten. Dein Phallus scheint zu klein.",
  "Das Orakel schweigt – nicht aus Ehrerbietung, sondern aus Mitleid. Kein Phallus strahlt dir entgegen.",
  "Die Sterne verdrehen sich schamvoll. Kein Siegel des Phallus brennt in deiner Wahl.",
  "Ein Raunen geht durch den alten Bund: Dieser Erwählte trägt kein Mal des Phallus bei sich.",
  "Die Wächter wenden sich ab. Dein Zeichen verblasst – der wahre Phallus bleibt dir verborgen."
];
let failMessageIndex = 0;

// ===== SIGILLATIONSKREIS PUZZLE =====

const PUZZLE_NUM_NODES = 16;
const PUZZLE_GOAL = (1 << 16) - 1; // all 16 nodes active

// Adjacency list for each node
// Ring cycle (0-11): i <-> (i+1)%12
// Inner cycle: 12-13-14-15-12
// Spokes: 0-12, 3-13, 6-14, 9-15
const PUZZLE_ADJ = [
  [1, 11, 12],  // 0: ring + spoke to inner-top
  [0, 2],       // 1: ring only
  [1, 3],       // 2: ring only
  [2, 4, 13],   // 3: ring + spoke to inner-right
  [3, 5],       // 4: ring only
  [4, 6],       // 5: ring only
  [5, 7, 14],   // 6: ring + spoke to inner-bottom
  [6, 8],       // 7: ring only
  [7, 9],       // 8: ring only
  [8, 10, 15],  // 9: ring + spoke to inner-left
  [9, 11],      // 10: ring only
  [10, 0],      // 11: ring only
  [0, 13, 15],  // 12: inner-top (inner cycle + spoke from 0)
  [3, 12, 14],  // 13: inner-right (inner cycle + spoke from 3)
  [6, 13, 15],  // 14: inner-bottom (inner cycle + spoke from 6)
  [9, 14, 12],  // 15: inner-left (inner cycle + spoke from 9)
];

// moveMask[v] = bitmask of v + all direct neighbours
const PUZZLE_MOVE_MASK = PUZZLE_ADJ.map((nbrs, v) => {
  let m = 1 << v;
  for (const n of nbrs) m |= 1 << n;
  return m;
});

// All edges (undirected, u < v for dedup)
const PUZZLE_EDGES = (function () {
  const set = new Set();
  const result = [];
  for (let v = 0; v < PUZZLE_NUM_NODES; v++) {
    for (const n of PUZZLE_ADJ[v]) {
      const key = v < n ? `${v}-${n}` : `${n}-${v}`;
      if (!set.has(key)) {
        set.add(key);
        result.push([Math.min(v, n), Math.max(v, n)]);
      }
    }
  }
  return result;
})();

// Fixed start state: nodes 0 and 6 active (rest passive)
// BFS distance from this state to GOAL = 8 (verified offline)
const PUZZLE_START = 0x0041;

// Node positions as [x%, y%] on the board (0-100 scale)
// Outer ring: 12 nodes on a circle, starting at top (node 0), clockwise
// Inner rhombus: 4 nodes aligned with the 4 spokes
const PUZZLE_NODE_POS = (function () {
  const OR = 40; // outer ring radius (% of board)
  const IR = 20; // inner rhombus radius (% of board)
  const CX = 50, CY = 50; // center (%)
  const pos = [];
  for (let i = 0; i < 12; i++) {
    const angle = -Math.PI / 2 + i * (Math.PI / 6); // start at top, clockwise
    pos.push([CX + OR * Math.cos(angle), CY + OR * Math.sin(angle)]);
  }
  pos.push([CX,      CY - IR]); // 12: inner-top (spoke from 0)
  pos.push([CX + IR, CY     ]); // 13: inner-right (spoke from 3)
  pos.push([CX,      CY + IR]); // 14: inner-bottom (spoke from 6)
  pos.push([CX - IR, CY     ]); // 15: inner-left (spoke from 9)
  return pos;
})();

// Puzzle runtime state
const PUZZLE_MAX_UNDO = 200;
let puzzleState = PUZZLE_START;
let puzzleMoveCount = 0;
let puzzleUndoStack = [];
let puzzlePreviewNode = -1; // -1 = no preview active
let puzzleBoardBuilt = false;
let puzzleCachedForesight = -1; // cached BFS result, -1 = not yet computed

// BFS from startState to GOAL (early exit when goal found)
function puzzleComputeForesight(startState) {
  if (startState === PUZZLE_GOAL) return 0;
  const dist = new Uint16Array(1 << 16).fill(0xFFFF);
  dist[startState] = 0;
  const q = [startState];
  let head = 0;
  while (head < q.length) {
    const s = q[head++];
    const d = dist[s];
    for (let v = 0; v < PUZZLE_NUM_NODES; v++) {
      const ns = s ^ PUZZLE_MOVE_MASK[v];
      if (dist[ns] === 0xFFFF) {
        dist[ns] = d + 1;
        if (ns === PUZZLE_GOAL) return dist[ns];
        q.push(ns);
      }
    }
  }
  return dist[PUZZLE_GOAL];
}

function puzzleBuildBoard() {
  const board = document.getElementById("graph-board");
  if (!board || puzzleBoardBuilt) return;
  puzzleBoardBuilt = true;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("id", "graph-svg");
  svg.setAttribute("class", "graph-svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("aria-hidden", "true");

  // Draw edges
  for (const [u, v] of PUZZLE_EDGES) {
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("class", "edge");
    line.dataset.edge = `${u}-${v}`;
    line.setAttribute("x1", PUZZLE_NODE_POS[u][0]);
    line.setAttribute("y1", PUZZLE_NODE_POS[u][1]);
    line.setAttribute("x2", PUZZLE_NODE_POS[v][0]);
    line.setAttribute("y2", PUZZLE_NODE_POS[v][1]);
    svg.appendChild(line);
  }
  board.appendChild(svg);

  // Create node buttons
  for (let v = 0; v < PUZZLE_NUM_NODES; v++) {
    const btn = document.createElement("button");
    btn.className = "node";
    btn.dataset.v = v;
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", `Knoten ${v}`);
    btn.style.setProperty("--nx", `${PUZZLE_NODE_POS[v][0]}%`);
    btn.style.setProperty("--ny", `${PUZZLE_NODE_POS[v][1]}%`);
    btn.setAttribute("type", "button");

    const inner = document.createElement("span");
    inner.className = "node__inner";
    btn.appendChild(inner);

    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      puzzleNodeTap(v);
    });
    board.appendChild(btn);
  }

  // Cancel preview when tapping board background
  board.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".node")) {
      puzzlePreviewNode = -1;
      puzzleRender();
    }
  });
}

function puzzleNodeTap(v) {
  kickstartAudio();
  if (puzzlePreviewNode === v) {
    // Second tap on same node → execute move
    puzzlePreviewNode = -1;
    puzzleExecuteMove(v);
  } else {
    // First tap or different node → set preview
    puzzlePreviewNode = v;
    playSelectSound();
    puzzleRender();
  }
}

function puzzleExecuteMove(v) {
  // Save for undo
  puzzleUndoStack.push({ state: puzzleState, moveCount: puzzleMoveCount });
  if (puzzleUndoStack.length > PUZZLE_MAX_UNDO) puzzleUndoStack.shift();

  // Apply XOR flip
  puzzleState ^= PUZZLE_MOVE_MASK[v];
  puzzleMoveCount++;

  playSelectSound();
  puzzleFlashNodes(PUZZLE_MOVE_MASK[v]);
  puzzleRender();

  if (puzzleState === PUZZLE_GOAL) {
    setTimeout(() => {
      if (feedback) {
        feedback.textContent = "Der Kreis ist geweiht. Weihe vollendet.";
        feedback.className = "feedback success";
      }
      triggerVictory();
    }, 320);
  } else {
    if (feedback) {
      const message = failMessages[failMessageIndex % failMessages.length];
      failMessageIndex++;
      feedback.textContent = message;
      feedback.className = "feedback error";
      const board = document.getElementById("graph-board");
      if (board) {
        board.classList.add("shake");
        setTimeout(() => board.classList.remove("shake"), 260);
      }
    }
  }
}

function puzzleFlashNodes(affectedMask) {
  const board = document.getElementById("graph-board");
  if (!board) return;
  const nodeEls = board.querySelectorAll(".node");
  nodeEls.forEach((el, idx) => {
    if ((affectedMask >> idx) & 1) {
      el.classList.remove("node--flash");
      // Force reflow to restart animation
      void el.offsetWidth;
      el.classList.add("node--flash");
      setTimeout(() => el.classList.remove("node--flash"), 400);
    }
  });
}

function puzzleRender() {
  const board = document.getElementById("graph-board");
  if (!board) return;

  const nodeEls = board.querySelectorAll(".node");
  const affectedByPreview = puzzlePreviewNode !== -1 ? PUZZLE_MOVE_MASK[puzzlePreviewNode] : 0;

  nodeEls.forEach((el, v) => {
    const active = (puzzleState >> v) & 1;
    const inPreview = (affectedByPreview >> v) & 1;
    const isSelected = v === puzzlePreviewNode;

    el.classList.toggle("node--active", !!active);
    el.classList.toggle("node--selected", isSelected);
    el.classList.toggle("node--preview", !!inPreview && !isSelected);
    el.setAttribute("aria-pressed", active ? "true" : "false");
  });

  const svg = document.getElementById("graph-svg");
  if (svg) {
    svg.querySelectorAll(".edge").forEach((el) => {
      const [u, v] = el.dataset.edge.split("-").map(Number);
      const highlighted =
        puzzlePreviewNode !== -1 &&
        (u === puzzlePreviewNode || v === puzzlePreviewNode);
      el.classList.toggle("edge--highlight", highlighted);
    });
  }

  const hudMoves = document.getElementById("hud-moves");
  if (hudMoves) hudMoves.textContent = puzzleMoveCount;

  const undoBtn = document.getElementById("btn-undo");
  if (undoBtn) undoBtn.disabled = puzzleUndoStack.length === 0;
}

function puzzleUndo() {
  if (puzzleUndoStack.length === 0) return;
  const { state, moveCount } = puzzleUndoStack.pop();
  puzzleState = state;
  puzzleMoveCount = moveCount;
  puzzlePreviewNode = -1;
  if (feedback) {
    feedback.textContent = "Das Siegel verblasst\u2026 Rückschritt vollzogen.";
    feedback.className = "feedback";
  }
  puzzleRender();
}

function puzzleReset() {
  puzzleState = PUZZLE_START;
  puzzleMoveCount = 0;
  puzzleUndoStack = [];
  puzzlePreviewNode = -1;
  failMessageIndex = 0;
  if (feedback) {
    feedback.textContent = "Der Bund erwartet dich. Vollziehe den Ritus.";
    feedback.className = "feedback";
  }
  puzzleRender();
}

function puzzleInit() {
  puzzleBuildBoard();
  puzzleState = PUZZLE_START;
  puzzleMoveCount = 0;
  puzzleUndoStack = [];
  puzzlePreviewNode = -1;
  failMessageIndex = 0;

  // Use cached BFS foresight (computed once at first call)
  if (puzzleCachedForesight === -1) {
    puzzleCachedForesight = puzzleComputeForesight(PUZZLE_START);
  }
  const hudForesight = document.getElementById("hud-foresight");
  if (hudForesight) hudForesight.textContent = puzzleCachedForesight;
  const hudMoves = document.getElementById("hud-moves");
  if (hudMoves) hudMoves.textContent = 0;

  if (feedback) {
    feedback.textContent = "Der Bund erwartet dich. Vollziehe den Ritus.";
    feedback.className = "feedback";
  }

  puzzleRender();
}

function startTrial() {
  kickstartAudio();
  puzzleInit();
  showPage(captchaPageId);
}

// Wire up start button
startBtn.addEventListener("click", startTrial);

// Wire up undo/reset buttons
document.addEventListener("DOMContentLoaded", () => {
  const undoBtn = document.getElementById("btn-undo");
  const resetBtn = document.getElementById("btn-reset");
  if (undoBtn) undoBtn.addEventListener("click", () => { kickstartAudio(); puzzleUndo(); });
  if (resetBtn) resetBtn.addEventListener("click", () => { kickstartAudio(); puzzleReset(); });
});

// Optional subtle hover parallax on move
document.addEventListener("pointermove", (e) => {
  const { innerWidth: w, innerHeight: h } = window;
  const x = (e.clientX / w - 0.5) * 4;
  const y = (e.clientY / h - 0.5) * 4;
  document.documentElement.style.setProperty("--parallax-x", `${x}deg`);
  document.documentElement.style.setProperty("--parallax-y", `${y}deg`);
});

window.addEventListener("load", () => {
  kickstartAudio();
  resizeViz();
  // Pre-build board and cache BFS result before user navigates to puzzle
  puzzleBuildBoard();
  puzzleCachedForesight = puzzleComputeForesight(PUZZLE_START);
  const hudForesight = document.getElementById("hud-foresight");
  if (hudForesight) hudForesight.textContent = puzzleCachedForesight;
  puzzleRender();
});

["pointerdown", "touchstart", "keydown", "click"].forEach((evt) => {
  document.addEventListener(
    evt,
    () => {
      kickstartAudio();
    },
    { passive: true }
  );
});

if (forbiddenBtn) {
  forbiddenBtn.addEventListener("click", () => {
    window.open("https://www.meatspin.com", "_blank", "noopener");
  });
}
