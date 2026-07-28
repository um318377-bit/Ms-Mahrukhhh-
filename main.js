// main.js — floating footballs + left-foot kick with synthesized kick sound
document.addEventListener('DOMContentLoaded', () => {
  const bg = document.getElementById('bg');
  const N = 12; // number of floating football icons in the background

  // create floating footballs with random positions and animation speeds
  function makeFloatingBalls() {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    for (let i = 0; i < N; i++) {
      const el = document.createElement('div');
      el.className = 'bg-ball';
      el.textContent = '⚽';
      // random size, position
      const size = 18 + Math.round(Math.random() * 32);
      el.style.fontSize = size + 'px';
      el.style.left = Math.round(Math.random() * vw) + 'px';
      el.style.top = Math.round(Math.random() * vh) + 'px';
      el.style.opacity = 0.25 + Math.random() * 0.7;
      const dur = 6 + Math.random() * 18;
      (function animateBall(node, duration){
        setInterval(() => {
          const tx = Math.sin(Date.now() / (duration * 200)) * (10 + Math.random() * 40);
          const ty = Math.cos(Date.now() / (duration * 300)) * (6 + Math.random() * 20);
          node.style.transform = `translate(${tx}px, ${ty}px) rotate(${(Date.now()/80) % 360}deg)`;
        }, 80);
      })(el, dur);
      bg.appendChild(el);
    }
  }
  makeFloatingBalls();

  // --- Synthesized kick sound using Web Audio API (no file needed) ---
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  // short percussive "kick" using oscillator + filtered noise
  function playKickSound() {
    try {
      const ctx = ensureAudio();
      const now = ctx.currentTime;

      // oscillator thump
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);

      // gain envelope for thump
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(1.0, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      // short filtered noise for attack
      const bufferSize = ctx.sampleRate * 0.12;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.9));

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 900;

      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.8, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(g);
      noise.connect(noiseFilter);
      noiseFilter.connect(ng);

      // combine
      const merger = ctx.createGain();
      g.connect(merger);
      ng.connect(merger);
      merger.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
      noise.start(now);
      noise.stop(now + 0.12);
    } catch (err) {
      // audio may be blocked; ignore silently
      console.warn('Audio not available', err);
    }
  }

  // Kick handling
  const ball = document.getElementById('ball');
  const kickBtn = document.getElementById('kickBtn');
  const leftFootVisual = document.getElementById('leftFootVisual');

  // small visual reaction on mousedown to mimic "left foot" press
  kickBtn.addEventListener('mousedown', () => {
    leftFootVisual.style.transform = 'translateY(6px) scale(0.98)';
    ball.style.transform = 'translateY(-8px) scale(1.02)';
  });
  kickBtn.addEventListener('mouseup', () => {
    leftFootVisual.style.transform = '';
    ball.style.transform = '';
  });
  kickBtn.addEventListener('mouseleave', () => {
    leftFootVisual.style.transform = '';
    ball.style.transform = '';
  });

  // core: add kicked class to ball, play sound, wait animationend, then navigate
  kickBtn.addEventListener('click', () => {
    if (ball.classList.contains('kicked')) return; // ignore double-kick
    // unlock audio on first user gesture
    try { ensureAudio(); } catch(e){}

    playKickSound();
    ball.classList.add('kicked');

    // optional: briefly disable button to avoid multi-clicks
    kickBtn.disabled = true;
    kickBtn.style.opacity = 0.6;
  });

  // After the animation completes, go to safe.html
  ball.addEventListener('animationend', (e) => {
    // small delay so the fade-out finishes nicely
    setTimeout(() => {
      // navigate to the safe landing page
      window.location.href = 'safe.html';
    }, 220);
  });

  // keyboard support: allow Enter/Space to kick
  kickBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      kickBtn.click();
    }
  });
});
