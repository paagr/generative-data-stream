import './style.css'

let audioCtx,
  reverbNode,
  cells = [],
  nextStepTime = 0,
  currentChord = 0,
  globalStep = 0,
  currentDensity = 0.4,
  bpm = 120,
  mouseX = 0,
  mouseY = 0,
  currentFilterFreq = 2000,
  currentReverbAmount = 0;

const chords = [
  [65.41, 98.0],
  [73.42, 110.0],
  [87.31, 130.81]
];

async function updateBPM() {
  if (navigator.getBattery) {
    const battery = await navigator.getBattery();
    bpm = 60 + battery.level * 60;
    battery.addEventListener("levelchange", () => {
      bpm = 60 + battery.level * 60;
    });
  }
}

async function setupAudio() {
  audioCtx = new AudioContext();
  const seconds = new Date().getSeconds();
  const duration = 1.0 + (seconds / 60) * 4.0;
  const length = audioCtx.sampleRate * duration;
  const impulse = audioCtx.createBuffer(2, length, audioCtx.sampleRate);
  for (let i = 0; i < 2; i++) {
    const ch = impulse.getChannelData(i);
    for (let j = 0; j < length; j++)
      ch[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 5);
  }
  reverbNode = audioCtx.createConvolver();
  reverbNode.buffer = impulse;
  reverbNode.connect(audioCtx.destination);
}

function playNote(time, cell) {
  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();

  const isTick = cell.depth > 1;
  const ram = navigator.deviceMemory || 8;
  osc.type = ram < 4 ? "sawtooth" : isTick ? "square" : "sine";
  
  const freq = chords[currentChord][cells.indexOf(cell) % 2] * (isTick ? Math.pow(2, cell.depth) : 0.5);

  osc.frequency.setValueAtTime(freq, time);

  env.gain.setValueAtTime(0, time);

  env.gain.linearRampToValueAtTime(0.1, time + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

  osc.connect(env).connect(reverbNode);
  osc.start(time);
  
  osc.stop(time + 0.4);

  const delay = Math.max(0, (time - audioCtx.currentTime) * 1000);
  setTimeout(() => {
    cell.el.classList.add("active");
  
  setTimeout(() => cell.el.classList.remove("active"), 150);
  }, delay);
}

function playKick(time) {
  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  const screenFactor = window.innerWidth / 1920;
  osc.frequency.setValueAtTime(130 * screenFactor, time);
  osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
  env.gain.setValueAtTime(0.7, time);
  env.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
  osc.connect(env).connect(audioCtx.destination);
  osc.start(time);
  osc.stop(time + 0.5);
}

function playClick(time) {
  const noiseBuffer = audioCtx.createBuffer(
    1,
    audioCtx.sampleRate * 0.02,
    audioCtx.sampleRate
  );
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseBuffer.length; i++)
    output[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "highpass";
  const avgDepth =
    cells.reduce((acc, c) => acc + c.depth, 0) / (cells.length || 1);

  const safeFreq = Math.min(22000, 2000 + (cells.length / 16) * 4000 + Math.random() * 500);

  filter.frequency.setValueAtTime(safeFreq, time);
  currentFilterFreq = safeFreq;


  const rev = Math.min(0.5, avgDepth * 0.1);
  currentReverbAmount = rev;

  const env = audioCtx.createGain();
  env.gain.setValueAtTime(0.1, time);
  env.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

  const reverbSend = audioCtx.createGain();
  reverbSend.gain.setValueAtTime(rev, time);

  noise.connect(filter).connect(env);
  env.connect(audioCtx.destination);
  env.connect(reverbSend).connect(reverbNode);
  noise.start(time);
  noise.stop(time + 0.03);
}

function updateGridStructure() {
  const grid = document.getElementById("app");
  grid.innerHTML = "";
  cells = [];
  const change = (Math.random() - 0.5) * 0.4;
  currentDensity = Math.max(0.1, Math.min(0.8, currentDensity + change));
  for (let i = 0; i < 16; i++) createCell(grid, 0);
}

function scheduler() {
  const stepLen = 60 / bpm / 4;
  while (nextStepTime < audioCtx.currentTime + 0.1) {
    const jitter = Math.random() < 0.3;
    if (globalStep % 2 !== 0 && jitter) {
      playClick(nextStepTime + Math.random() * 0.05);
    }
    if (globalStep % 4 === 0) playKick(nextStepTime);
    if (globalStep % 32 === 0) {
      currentChord = (currentChord + 1) % chords.length;
      const delay = (nextStepTime - audioCtx.currentTime) * 1000;
      setTimeout(updateGridStructure, Math.max(0, delay));
    }

    const currentStepIndex = globalStep % cells.length;
    const cellToPlay = cells[currentStepIndex];

    if (cellToPlay) {
      playNote(nextStepTime, cellToPlay);
    }

    nextStepTime += stepLen;
    globalStep++;
  }
  setTimeout(scheduler, 25);
}

function getDynamicTexts() {
  const now = new Date();
  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER"
  ];
  return [
    `YEAR: ${now.getFullYear()}`,
    `MONTH: ${months[now.getMonth()]}`,
    `SECOND: ${now.getSeconds()}`,
    `DAY: ${now.getDate()}`,
    `CPU CORES: ${navigator.hardwareConcurrency || "U/N"}`,
    `MEMORY: ${navigator.deviceMemory || "U/N"}GB`,
    `WINDOW WIDTH: ${window.innerWidth}PX`,
    `PLATFORM: ${navigator.platform.toUpperCase()}`,
    `BROWSER: ${navigator.userAgent.split(" ")[0]}`,
    `LANGUAGE: ${navigator.language.toUpperCase()}`
  ];
}

function createCell(container, depth) {
  const div = document.createElement("div");
  div.className = "cell";

  if (depth < 5 && Math.random() > currentDensity) {
    div.style.display = "grid";
    const isVertical = Math.random() > 0.5;
    const ratio = `${Math.floor(Math.random() * 3) + 1}fr ${Math.floor(Math.random() * 3) + 1
      }fr`;
    div.style.gridTemplateColumns = isVertical ? ratio : "1fr";
    div.style.gridTemplateRows = isVertical ? "1fr" : ratio;
    for (let i = 0; i < 2; i++) createCell(div, depth + 1);
  } else {
    const content = document.createElement("div");
    content.className = "content";
    const texts = getDynamicTexts();
    const txt = texts[Math.floor(Math.random() * texts.length)];
    const isHorizontal = Math.random() > 0.5;

    content.innerText = isHorizontal
      ? (txt + " — ").repeat(20)
      : (txt + "\n").repeat(60);
    if (isHorizontal) content.style.whiteSpace = "nowrap";

    const sizes = ["40px", "18px", "9px", "5px", "3px"];
    content.style.fontSize = sizes[depth] || "2.5px";
    div.appendChild(content);
    cells.push({
      el: div,
      depth,
      scrollPos: 0,
      speed: 0.2 + Math.random() * 1.2,
      isHorizontal
    });
  }
  container.appendChild(div);
}

function animate() {
  cells.forEach((c) => {
    c.scrollPos -= c.speed;
    const content = c.el.querySelector(".content");
    if (content) {
      if (Math.abs(c.scrollPos) > 150) c.scrollPos = 0;
      content.style.transform = c.isHorizontal
        ? `translateX(${c.scrollPos}px)`
        : `translateY(${c.scrollPos}px)`;
    }
  });
  requestAnimationFrame(animate);
}

window.onclick = async () => {
  if (!audioCtx) {
    await updateBPM();
    await setupAudio();
    nextStepTime = audioCtx.currentTime;
    scheduler();
    animate();
  }
};

updateGridStructure();
