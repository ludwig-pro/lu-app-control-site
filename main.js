// A presentation-only illustration. It never connects to a hub, device, or model.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionEnabled = !reducedMotion.matches;
const motionToggle = document.querySelector('[data-motion-toggle]');
const heroStage = document.querySelector('.hero-stage');
const progressBar = document.querySelector('.page-progress > span');
const demo = document.querySelector('[data-demo]');
const tabs = [...document.querySelectorAll('[data-phase-button]')];
const panel = document.querySelector('#memory-panel');
const steps = [...document.querySelectorAll('[data-step]')];
const sceneTimers = new Set();
let demoVisible = false;
let activePhase = 'learn';

const phases = {
  learn: {
    caption: 'FIRST TIME AROUND',
    title: ['Find the way.', 'Keep the good moves.'],
    description: 'The agent observes the screen and works through the task. The hub captures a route that can be checked and reused.',
    steps: ['Observe the screen', 'Navigate to About', 'Capture a reusable route'],
    note: 'Model guided. Captured routes are checked before automatic replay.',
    counterLabel: 'MODEL GUIDED',
    counterValue: '↗',
    counterCaption: 'Discovering the route',
    output: ['screen: observed', 'target: About', 'route: captured'],
    messages: ['Fresh screen observation', 'Target found in the tree', 'End anchor captured'],
  },
  replay: {
    caption: 'NEXT TIME AROUND',
    title: ['Same destination.', 'No model detour.'],
    description: 'A matching, verified route runs through the hub. The arrival check uses a fresh screen; an eligible task finishes without starting a model.',
    steps: ['Check the app and route', 'Replay the known steps', 'Verify the arrival'],
    note: 'Navigation and direct reads. Zero model calls on a verified replay.',
    counterLabel: 'MODEL CALLS',
    counterValue: '0',
    counterCaption: 'On this verified replay',
    output: ['app: confirmed', 'route: replaying', 'arrival_verified: true'],
    messages: ['App identity confirmed', 'Known steps, fresh refs', 'Arrival verified'],
  },
  adapt: {
    caption: 'WHEN THE SCREEN CHANGES',
    title: ['A different screen.', 'A smarter next move.'],
    description: 'A changed target stops the replay. The agent gets the actual outcome and continues from the current screen, with the hub’s usual controls.',
    steps: ['Detect the changed screen', 'Stop the replay', 'Resume the agent'],
    note: 'Verification first. The agent continues with the real outcome.',
    counterLabel: 'MODEL RESUMES',
    counterValue: '↗',
    counterCaption: 'From the current screen',
    output: ['target: changed', 'route: diverged', 'agent: resumed'],
    messages: ['The expected target changed', 'Replay stopped here', 'New screen, fresh context'],
  },
};

function clearSceneTimers() {
  for (const timer of sceneTimers) window.clearTimeout(timer);
  sceneTimers.clear();
}

function later(callback, delay) {
  const timer = window.setTimeout(() => {
    sceneTimers.delete(timer);
    callback();
  }, delay);
  sceneTimers.add(timer);
}

function phoneRows(items, selectedIndex) {
  const container = document.querySelector('[data-phone-rows]');
  container.replaceChildren(...items.map(([label, value], index) => {
    const row = document.createElement('div');
    row.className = `memory-row${index === selectedIndex ? ' selected' : ''}`;
    const name = document.createElement('span');
    const detail = document.createElement('span');
    name.textContent = label;
    detail.textContent = value;
    row.append(name, detail);
    return row;
  }));
}

function renderFrame(frame) {
  demo.dataset.frame = String(frame);
  const phase = phases[activePhase];
  steps.forEach((step, index) => step.classList.toggle('is-complete', index <= frame));
  document.querySelector('[data-output]').textContent = phase.output[frame];
  document.querySelector('[data-phone-message]').textContent = phase.messages[frame];
  const title = document.querySelector('[data-phone-title]');
  const subtitle = document.querySelector('[data-phone-subtitle]');

  if (activePhase === 'adapt') {
    title.textContent = frame === 2 ? 'Settings' : 'A new screen';
    subtitle.textContent = frame === 2 ? 'The agent takes it from here.' : 'The expected route has changed.';
    phoneRows([['Accessibility', '›'], ['General', '›'], ['Privacy & Security', '›']], frame === 2 ? 1 : -1);
  } else if (frame === 0) {
    title.textContent = 'Settings';
    subtitle.textContent = 'Ready for the next move.';
    phoneRows([['General', '›'], ['Accessibility', '›'], ['Privacy & Security', '›']], 0);
  } else if (frame === 1) {
    title.textContent = 'General';
    subtitle.textContent = 'One step closer.';
    phoneRows([['About', '›'], ['Software Update', '›'], ['iPhone Storage', '›']], 0);
  } else {
    title.textContent = 'About';
    subtitle.textContent = activePhase === 'replay' ? 'A fresh, verified arrival.' : 'A route worth remembering.';
    phoneRows([['Name', 'iPhone Simulator'], ['iOS Version', 'Read fresh'], ['Model Name', 'Simulator']], -1);
  }
}

function startScene() {
  clearSceneTimers();
  if (!motionEnabled || !demoVisible || document.hidden) return;
  renderFrame(0);
  later(() => renderFrame(1), 1250);
  later(() => renderFrame(2), 2600);
  later(startScene, 6500);
}

function selectPhase(phaseName, focus = false) {
  if (!phases[phaseName]) return;
  activePhase = phaseName;
  const phase = phases[phaseName];
  demo.dataset.phase = phaseName;
  panel.setAttribute('aria-labelledby', `tab-${phaseName}`);
  tabs.forEach((tab) => {
    const selected = tab.dataset.phaseButton === phaseName;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  document.querySelector('[data-phase-caption]').textContent = phase.caption;
  const heading = document.querySelector('[data-phase-title]');
  heading.replaceChildren(document.createTextNode(phase.title[0]), document.createElement('br'), document.createTextNode(phase.title[1]));
  document.querySelector('[data-phase-description]').textContent = phase.description;
  document.querySelector('[data-phase-note]').textContent = phase.note;
  document.querySelector('[data-counter-label]').textContent = phase.counterLabel;
  document.querySelector('[data-counter-value]').textContent = phase.counterValue;
  document.querySelector('[data-counter-caption]').textContent = phase.counterCaption;
  steps.forEach((step, index) => {
    step.querySelector('[data-step-label]').textContent = phase.steps[index];
  });
  renderFrame(motionEnabled ? 0 : 2);
  startScene();
}

function updateMotion() {
  document.body.dataset.motion = motionEnabled ? 'on' : 'paused';
  document.documentElement.dataset.motion = document.body.dataset.motion;
  motionToggle.setAttribute('aria-pressed', String(!motionEnabled));
  motionToggle.setAttribute('aria-label', motionEnabled ? 'Pause animations' : 'Play animations');
  motionToggle.querySelector('span').textContent = motionEnabled ? 'Pause motion' : 'Play motion';
  motionToggle.querySelector('use').setAttribute('href', motionEnabled ? '#icon-pause' : '#icon-play');
  if (motionEnabled) startScene();
  else {
    clearSceneTimers();
    heroStage.style.setProperty('--stage-x', '0deg');
    heroStage.style.setProperty('--stage-y', '0deg');
  }
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectPhase(tab.dataset.phaseButton));
  tab.addEventListener('keydown', (event) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectPhase(tabs[next].dataset.phaseButton, true);
  });
});

document.querySelector('.hero-actions a[href="#memory"]').addEventListener('click', () => selectPhase('replay'));
motionToggle.addEventListener('click', () => {
  motionEnabled = !motionEnabled;
  updateMotion();
});
reducedMotion.addEventListener('change', () => {
  motionEnabled = !reducedMotion.matches;
  updateMotion();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearSceneTimers();
  else startScene();
});

const reveals = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) if (entry.isIntersecting) {
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  }
}, { threshold: 0.06 });
document.querySelectorAll('.reveal').forEach((element) => reveals.observe(element));

const sceneObserver = new IntersectionObserver((entries) => {
  demoVisible = entries[0].isIntersecting;
  if (demoVisible) startScene();
  else clearSceneTimers();
}, { threshold: 0.15 });
sceneObserver.observe(demo);

let progressPending = false;
function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  progressBar.style.transform = `scaleX(${ratio})`;
  progressPending = false;
}
window.addEventListener('scroll', () => {
  if (!progressPending) {
    progressPending = true;
    window.requestAnimationFrame(updateProgress);
  }
}, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });

let pointerFrame = 0;
heroStage.addEventListener('pointermove', (event) => {
  if (!motionEnabled || event.pointerType === 'touch') return;
  const bounds = heroStage.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;
  window.cancelAnimationFrame(pointerFrame);
  pointerFrame = window.requestAnimationFrame(() => {
    if (!motionEnabled) return;
    heroStage.style.setProperty('--stage-x', `${x * 6}deg`);
    heroStage.style.setProperty('--stage-y', `${-y * 4}deg`);
  });
}, { passive: true });
heroStage.addEventListener('pointerleave', () => {
  window.cancelAnimationFrame(pointerFrame);
  heroStage.style.setProperty('--stage-x', '0deg');
  heroStage.style.setProperty('--stage-y', '0deg');
});

const copyButton = document.querySelector('[data-copy]');
copyButton.addEventListener('click', async () => {
  const feedback = document.querySelector('[data-copy-feedback]');
  try {
    await navigator.clipboard.writeText(document.querySelector('#setup-code').textContent.trim());
    copyButton.querySelector('span').textContent = 'Copied';
    feedback.textContent = 'Setup copied. Paste it into your terminal when you’re ready.';
    window.setTimeout(() => { copyButton.querySelector('span').textContent = 'Copy setup'; }, 2500);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector('#setup-code'));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    feedback.textContent = 'Copy is unavailable here. The setup is selected so you can copy it manually.';
  }
});

selectPhase(window.location.hash === '#memory' ? 'replay' : 'learn');
updateMotion();
updateProgress();
document.documentElement.classList.add('js-enabled');
