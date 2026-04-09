const startBtn = document.getElementById("start-btn");
const feedback = document.getElementById("feedback");
const audio = document.getElementById("bg-audio");
const forbiddenBtn = document.getElementById("forbidden-btn");
const vizCanvas = document.getElementById("viz");
const vizCtx = vizCanvas ? vizCanvas.getContext("2d") : null;
const victoryOverlay = document.getElementById("victory-overlay");
const confirmSfx = document.getElementById("confirm-sfx");
const navSfx = document.getElementById("nav-sfx");
const revealSfx = document.getElementById("reveal-sfx");
const gateForm = document.getElementById("gate-form");
const gateInput = document.getElementById("gate-input");
const gateBtn = document.getElementById("gate-btn");
const gateCard = document.getElementById("gate-card");
const secretGate = document.getElementById("secret-gate");
const secretForm = document.getElementById("secret-form");
const secretAnswerInput = document.getElementById("secret-answer");
const secretError = document.getElementById("secret-error");
const secretCancel = document.getElementById("secret-cancel");
const forbiddenReveal = document.getElementById("forbidden-reveal");
const finalOath = document.getElementById("final-oath");
const oathConfirm = document.getElementById("oath-confirm");
const oathCancel = document.getElementById("oath-cancel");
const hudTimer = document.getElementById("hud-timer");
const puzzleTimeoutPanel = document.getElementById("puzzle-timeout-panel");
const timeoutContinueBtn = document.getElementById("timeout-continue-btn");

const pages = document.querySelectorAll(".page");
const verifyPageId = "page-verify";
const introPageId = "page-intro";
const captchaPageId = "page-captcha";
const coordsPageId = "page-coords";
const forbiddenPageId = "page-forbidden";

let audioStarted = false;
let audioCtx = null;
let analyser = null;
let dataArray = null;
let bufferLength = 0;
let gateUnlocked = false;

const GATE_ACCEPTED = ["alexander luther", "alex luther"];
const SECRET_ANSWER = "donnerdaumen";
const FORBIDDEN_URL = "https://www.meatspin.com/";
const PUZZLE_TIME_LIMIT_SECONDS = 7 * 60;

function updateFeedback(text, variant = "") {
  if (!feedback) return;
  feedback.textContent = text;
  feedback.className = "feedback";
  if (variant) feedback.classList.add(variant);
  feedback.classList.remove("feedback--pulse");
  void feedback.offsetWidth; // restart animation
  feedback.classList.add("feedback--pulse");
}

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

function playSfx(el, volume = 1) {
  if (!el) return;
  try {
    el.pause();
    el.currentTime = 0;
  } catch (_) { /* ignore */ }
  el.volume = volume;
  el.play().catch(() => {});
}

function playNavSound() {
  playSfx(navSfx, 0.92);
}

function playConfirmSound() {
  playSfx(confirmSfx, 0.92);
}

function playRevealSound() {
  playSfx(revealSfx, 0.95);
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
  const pulseStrong = Math.min(1, pulse * 1.6 + 0.12);
  document.documentElement.style.setProperty("--pulse", pulse.toFixed(3));
  document.documentElement.style.setProperty("--pulse-strong", pulseStrong.toFixed(3));

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

function normaliseName(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-zäöüß\s-]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function validateGate() {
  if (!gateInput || !gateBtn) return false;
  const name = normaliseName(gateInput.value);
  const valid = GATE_ACCEPTED.includes(name);
  gateBtn.disabled = !valid;
  return valid;
}

function failGate() {
  if (gateCard) {
    gateCard.classList.add("shake");
    setTimeout(() => gateCard.classList.remove("shake"), 320);
  }
}

function unlockGate() {
  gateUnlocked = true;
  playConfirmSound();
  kickstartAudio();
  setTimeout(() => showPage(introPageId), 200);
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
  puzzleSolved = true;
  puzzleTimedOut = false;
  stopPuzzleTimer();
  playRevealSound();
  const revealLen =
    revealSfx && isFinite(revealSfx.duration) && revealSfx.duration > 0
      ? revealSfx.duration * 1000
      : 4200;

  if (!victoryOverlay) {
    setTimeout(() => showPage(coordsPageId), revealLen);
    return;
  }
  victoryOverlay.classList.remove("hidden");
  requestAnimationFrame(() => victoryOverlay.classList.add("active"));
  setTimeout(() => {
    victoryOverlay.classList.remove("active");
    victoryOverlay.classList.add("hidden");
    showPage(coordsPageId);
  }, revealLen);
}

// Failure messages from previous version, shown on unsuccessful moves
const failMessages = [
  "Die Schwellentafel knistert, doch kein Phalluszeichen lodert. Deine Hand war zu leicht.",
  "Der Ring ruft: Noch hältst du nicht das Gewicht des unbeugsamen Phallus.",
  "Ein kalter Hauch: Die Gilde sieht einen Wanderer, keinen Träger des Zeichens.",
  "Die Flamme verzog sich spöttisch. Unwürdig, flüstert der Schatten.",
  "Das Orakel schweigt – nicht ehrfürchtig, sondern betrübt. Kein Phallus strahlt dir entgegen.",
  "Die Sterne wenden sich ab. Kein Siegel des Phallus brennt in deiner Wahl.",
  "Ein Raunen im Bund: Dieser Schritt war fehl, der Phallus blieb verborgen.",
  "Die Wache senkt den Blick. Deine Klinge traf kein Siegel."
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
let puzzleTimerId = null;
let puzzleTimeLeft = PUZZLE_TIME_LIMIT_SECONDS;
let puzzleTimedOut = false;
let puzzleSolved = false;

function formatPuzzleTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function renderPuzzleTimer() {
  if (!hudTimer) return;
  hudTimer.textContent = formatPuzzleTime(Math.max(0, puzzleTimeLeft));
}

function stopPuzzleTimer() {
  if (!puzzleTimerId) return;
  clearInterval(puzzleTimerId);
  puzzleTimerId = null;
}

function showPuzzleTimeoutPanel() {
  if (!puzzleTimeoutPanel) return;
  puzzleTimeoutPanel.classList.remove("hidden");
}

function hidePuzzleTimeoutPanel() {
  if (!puzzleTimeoutPanel) return;
  puzzleTimeoutPanel.classList.add("hidden");
}

function handlePuzzleTimeout() {
  if (puzzleTimedOut || puzzleSolved) return;
  puzzleTimedOut = true;
  puzzleTimeLeft = 0;
  renderPuzzleTimer();
  updateFeedback("Die sechs Minuten sind verstrichen. Der Kreis bleibt unvollendet.", "error");
  showPuzzleTimeoutPanel();
  puzzleRender();
}

function startPuzzleTimer() {
  stopPuzzleTimer();
  puzzleTimeLeft = PUZZLE_TIME_LIMIT_SECONDS;
  puzzleTimedOut = false;
  renderPuzzleTimer();

  puzzleTimerId = setInterval(() => {
    if (puzzleSolved || puzzleTimedOut) {
      stopPuzzleTimer();
      return;
    }
    puzzleTimeLeft -= 1;
    renderPuzzleTimer();
    if (puzzleTimeLeft <= 0) {
      stopPuzzleTimer();
      handlePuzzleTimeout();
    }
  }, 1000);
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
    btn.setAttribute("aria-label", `Siegelknoten ${v + 1}`);
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
  if (puzzleTimedOut || puzzleSolved) return;
  kickstartAudio();
  if (puzzlePreviewNode === v) {
    // Second tap on same node → execute move
    puzzlePreviewNode = -1;
    puzzleExecuteMove(v);
  } else {
    // First tap or different node → set preview
    puzzlePreviewNode = v;
    puzzleRender();
  }
}

function puzzleExecuteMove(v) {
  if (puzzleTimedOut || puzzleSolved) return;
  playConfirmSound();
  // Save for undo
  puzzleUndoStack.push({ state: puzzleState, moveCount: puzzleMoveCount });
  if (puzzleUndoStack.length > PUZZLE_MAX_UNDO) puzzleUndoStack.shift();

  // Apply XOR flip
  puzzleState ^= PUZZLE_MOVE_MASK[v];
  puzzleMoveCount++;

  puzzleFlashNodes(PUZZLE_MOVE_MASK[v]);
  puzzleRender();

  if (puzzleState === PUZZLE_GOAL) {
    puzzleSolved = true;
    stopPuzzleTimer();
    setTimeout(() => {
      updateFeedback("Der Kreis ist geweiht. Weihe vollendet.", "success");
      triggerVictory();
    }, 320);
  } else {
    const message = failMessages[failMessageIndex % failMessages.length];
    failMessageIndex++;
    updateFeedback(message, "error");
    const board = document.getElementById("graph-board");
    if (board) {
      board.classList.add("shake");
      setTimeout(() => board.classList.remove("shake"), 260);
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
    el.disabled = puzzleTimedOut || puzzleSolved;
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
  if (undoBtn) undoBtn.disabled = puzzleTimedOut || puzzleSolved || puzzleUndoStack.length === 0;

  const resetBtn = document.getElementById("btn-reset");
  if (resetBtn) resetBtn.disabled = puzzleTimedOut || puzzleSolved;
}

function puzzleUndo() {
  if (puzzleTimedOut || puzzleSolved) return;
  if (puzzleUndoStack.length === 0) return;
  const { state, moveCount } = puzzleUndoStack.pop();
  puzzleState = state;
  puzzleMoveCount = moveCount;
  puzzlePreviewNode = -1;
  updateFeedback("Das Siegel verblasst… Rückschritt vollzogen.");
  puzzleRender();
}

function puzzleReset() {
  if (puzzleTimedOut || puzzleSolved) return;
  puzzleState = PUZZLE_START;
  puzzleMoveCount = 0;
  puzzleUndoStack = [];
  puzzlePreviewNode = -1;
  failMessageIndex = 0;
  updateFeedback("Die Schwellentafel erlischt. Entzünde den Kreis von Neuem.");
  puzzleRender();
}

function puzzleDevSolve() {
  puzzleSolved = true;
  stopPuzzleTimer();
  puzzleState = PUZZLE_GOAL;
  puzzleMoveCount = 0;
  puzzleUndoStack = [];
  puzzlePreviewNode = -1;
  puzzleFlashNodes(PUZZLE_GOAL);
  puzzleRender();
  updateFeedback("Dev: Kreis sofort geweiht.", "success");
  setTimeout(triggerVictory, 180);
}

function puzzleInit() {
  puzzleBuildBoard();
  puzzleState = PUZZLE_START;
  puzzleMoveCount = 0;
  puzzleUndoStack = [];
  puzzlePreviewNode = -1;
  puzzleSolved = false;
  puzzleTimedOut = false;
  failMessageIndex = 0;
  hidePuzzleTimeoutPanel();
  startPuzzleTimer();
  const hudMoves = document.getElementById("hud-moves");
  if (hudMoves) hudMoves.textContent = 0;

  updateFeedback("Der Kreis harrt auf dein Feuer, Alexander Luther.");

  puzzleRender();
}

function startTrial() {
  if (!gateUnlocked) {
    showPage(verifyPageId);
    return;
  }
  kickstartAudio();
  puzzleInit();
  showPage(captchaPageId);
}

function continueAfterPuzzleTimeout() {
  if (!puzzleTimedOut) return;
  playConfirmSound();
  puzzleSolved = true;
  stopPuzzleTimer();
  showPage(coordsPageId);
}

// Wire up start button
startBtn.addEventListener("click", startTrial);

// Wire up gate form
if (gateInput) {
  gateInput.addEventListener("input", validateGate);
}

if (gateForm) {
  gateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = validateGate();
    if (!ok) {
      failGate();
      return;
    }
    unlockGate();
  });
}

// Wire up undo/reset buttons
document.addEventListener("DOMContentLoaded", () => {
  const undoBtn = document.getElementById("btn-undo");
  const resetBtn = document.getElementById("btn-reset");
  if (undoBtn) undoBtn.addEventListener("click", () => { kickstartAudio(); puzzleUndo(); });
  if (resetBtn) resetBtn.addEventListener("click", () => { kickstartAudio(); puzzleReset(); });
  if (timeoutContinueBtn) {
    timeoutContinueBtn.addEventListener("click", () => {
      kickstartAudio();
      continueAfterPuzzleTimeout();
    });
  }
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
  // Pre-build board before user navigates to puzzle
  puzzleBuildBoard();
  renderPuzzleTimer();
  puzzleRender();
  if (gateInput) gateInput.focus();
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

document.addEventListener("click", (e) => {
  const navBtn = e.target.closest("button[data-nav-sound]");
  if (navBtn) playNavSound();
});

if (forbiddenBtn) {
  forbiddenBtn.addEventListener("click", (e) => {
    e.preventDefault();
    kickstartAudio();
    playConfirmSound();
    openSecretGate();
  });
}

function openSecretGate() {
  if (!secretGate) return;
  secretGate.classList.remove("hidden");
  secretGate.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => secretGate.classList.add("veil--visible"));
  if (secretAnswerInput) {
    secretAnswerInput.value = "";
    secretAnswerInput.focus();
  }
  if (secretError) {
    secretError.textContent = "";
    secretError.classList.remove("veil__error--show");
  }
}

function closeSecretGate() {
  if (!secretGate) return;
  secretGate.classList.remove("veil--visible");
  secretGate.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    secretGate.classList.add("hidden");
  }, 220);
}

function isSecretAnswerCorrect(value = "") {
  return value.trim().toLowerCase() === SECRET_ANSWER;
}

function handleSecretSuccess() {
  playVictorySound();
  if (forbiddenReveal) {
    forbiddenReveal.classList.remove("hidden");
  }
  if (forbiddenBtn) {
    forbiddenBtn.disabled = true;
    forbiddenBtn.classList.add("btn--sealed");
    forbiddenBtn.textContent = "Tor geöffnet";
  }
  closeSecretGate();
  openFinalOath();
}

if (secretForm) {
  secretForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = secretAnswerInput ? secretAnswerInput.value : "";
    if (isSecretAnswerCorrect(value)) {
      handleSecretSuccess();
    } else if (secretError) {
      secretError.textContent = "Die Wache schweigt. Falscher Name.";
      secretError.classList.add("veil__error--show");
      if (secretAnswerInput) secretAnswerInput.focus();
    }
  });
}

if (secretCancel) {
  secretCancel.addEventListener("click", () => {
    closeSecretGate();
  });
}

function openFinalOath() {
  if (!finalOath) return;
  finalOath.classList.remove("hidden");
  finalOath.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => finalOath.classList.add("veil--visible"));
}

function closeFinalOath() {
  if (!finalOath) return;
  finalOath.classList.remove("veil--visible");
  finalOath.setAttribute("aria-hidden", "true");
  setTimeout(() => finalOath.classList.add("hidden"), 220);
}

if (oathConfirm) {
  oathConfirm.addEventListener("click", () => {
    window.location.href = FORBIDDEN_URL;
  });
}

if (oathCancel) {
  oathCancel.addEventListener("click", () => {
    closeFinalOath();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSecretGate();
    closeFinalOath();
  }
});
