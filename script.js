const startBtn = document.getElementById("start-btn");
const feedback = document.getElementById("feedback");
const grid = document.getElementById("tile-grid");
const audio = document.getElementById("bg-audio");
const forbiddenBtn = document.getElementById("forbidden-btn");
const vizCanvas = document.getElementById("viz");
const vizCtx = vizCanvas ? vizCanvas.getContext("2d") : null;
const victoryOverlay = document.getElementById("victory-overlay");

const pages = document.querySelectorAll(".page");
const introPageId = "page-intro";
const captchaPageId = "page-captcha";
const coordsPageId = "page-coords";

let attempts = 0;
let audioStarted = false;
const baseFeedback = "Lege deine Wahl offen. Das Urteil fällt sofort.";
let audioCtx = null;
let analyser = null;
let dataArray = null;
let bufferLength = 0;

const failMessages = [
  "Der Stein schweigt. Dein Phallus bleibt im Dunkel verborgen.",
  "Die Runen knistern: Noch trägt deine Hand nicht das Gewicht eines wahrhaftigen Phallus.",
  "Ein kalter Hauch: Der Kreis murmelnd, du seist eher Wanderer als Träger des Phallus.",
  "Die Flamme verzieht sich spöttisch. Unwürdig, spricht der Schatten. Dein Phallus scheint zu klein."
];

function updateAttemptDisplay() {
  // intentionally hidden; no display
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
  // Create AudioContext early so resume works on mobile
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

  // average energy for pulse
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

  // faint central glow
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

function toggleTile(e) {
  const tile = e.currentTarget;
  const pressed = tile.getAttribute("aria-pressed") === "true";
  tile.setAttribute("aria-pressed", String(!pressed));
}

function resetTiles() {
  [...grid.children].forEach((tile) => tile.setAttribute("aria-pressed", "false"));
}

function resetTrialState() {
  attempts = 0;
  resetTiles();
  feedback.textContent = baseFeedback;
  feedback.className = "feedback";
}

function handleSubmit() {
  playAudio();
  attempts += 1;

  if (attempts < 5) {
    const message = failMessages[attempts - 1] || failMessages[failMessages.length - 1];
    feedback.textContent = message;
    feedback.className = "feedback error";
    grid.classList.add("shake");
    setTimeout(() => grid.classList.remove("shake"), 260);
  } else {
    feedback.textContent = "Die Altvorderen nicken. Dein Zeichen wurde erkannt.";
    feedback.className = "feedback success";
    triggerVictory();
  }
}

function triggerVictory() {
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

function startTrial() {
  kickstartAudio();
  resetTrialState();
  showPage(captchaPageId);
}

startBtn.addEventListener("click", startTrial);
[...grid.children].forEach((tile) =>
  tile.addEventListener("click", (e) => {
    kickstartAudio();
    toggleTile(e);
    handleSubmit();
    resetTiles();
  })
);

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
