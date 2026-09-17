/* ============================================================
   LDC 32101 — shared quiz engine
   Each topic page defines QUIZ_META and QUESTIONS, then loads
   this file. Nothing below needs editing to add a new topic.
   ============================================================ */

(function () {
  const META = window.QUIZ_META || {};
  const BANK = window.QUESTIONS || [];
  const SLUG = META.slug || 'topic';
  const LB_KEY = 'ldc32101_lb_' + SLUG;
  const CM_KEY = 'ldc32101_comments_' + SLUG;
  const USER_KEY = 'ldc32101_user';

  const AVATARS = ['#3498db', '#2980b9', '#2ecc71', '#e74c3c', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
  const SECTIONS = [...new Set(BANK.map(q => q.s))];

  let activeSections = new Set(SECTIONS);
  let quiz = [], cur = 0, score = 0, answered = false, missed = [];
  let currentUser = { name: '', reg: '' };
  let leaderboard = load(LB_KEY, []);
  let comments = load(CM_KEY, {});

  function load(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch (e) { return fallback; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function hashStr(s) { let h = 0; for (const c of s) { h = ((h << 5) - h) + c.charCodeAt(0); h |= 0; } return h; }
  function $(id) { return document.getElementById(id); }

  /* ---------- layout ---------- */
  document.body.innerHTML = `
<div class="wrap">
  <nav>
    <div class="nav-logo"><a href="index.html">LDC32101</a><span>/${esc(META.slugLabel || SLUG)}</span></div>
    <div class="nav-links">
      <a class="nav-btn" href="index.html">All topics</a>
      <button class="nav-btn active" id="nav-quiz">Quiz</button>
      <button class="nav-btn" id="nav-lb">Leaderboard</button>
    </div>
  </nav>

  <div id="screen-home" class="screen active">
    <div class="hero">
      <div class="hero-tag">${esc(META.tag || '')}</div>
      <h1>${META.heading || ''}</h1>
      <p class="hero-sub">${esc(META.blurb || '')}</p>
      <div class="hero-stats">
        <div class="stat"><div class="stat-n">${BANK.length}</div><div class="stat-l">Questions</div></div>
        <div class="stat"><div class="stat-n">${SECTIONS.length}</div><div class="stat-l">Sub-topics</div></div>
        <div class="stat"><div class="stat-n" id="stat-players">0</div><div class="stat-l">Attempts</div></div>
      </div>
    </div>

    <div class="register-card">
      <h2>Start this module</h2>
      <p>Enter your details to record your score on the class leaderboard.</p>
      <div class="form-row">
        <div><label>Full name</label><input type="text" id="inp-name" placeholder="e.g. Ernest Leo"></div>
        <div><label>Reg. number</label><input type="text" id="inp-reg" placeholder="e.g. 2501013**"></div>
      </div>
      <div class="form-row full">
        <div><label>Filter sub-topics</label><div class="topic-grid" id="topic-grid"></div></div>
      </div>
      <button class="btn" id="btn-start" style="width:100%">Begin Assessment →</button>
    </div>
  </div>

  <div id="screen-quiz" class="screen">
    <div style="padding-top:24px">
      <div class="progress-header">
        <span class="progress-label" id="prog-label"></span>
        <span class="progress-score" id="prog-score">0 pts</span>
      </div>
      <div class="progress-track"><div class="progress-fill" id="prog-fill" style="width:0%"></div></div>

      <div class="q-card">
        <div class="q-section-tag" id="q-section"></div>
        <div class="q-text" id="q-text"></div>
        <div class="options" id="options"></div>
      </div>

      <div class="feedback-box" id="feedback"></div>

      <div class="discussion-section" id="discussion-section">
        <h4>💬 Class Notes</h4>
        <div class="comments-list" id="comments-list"></div>
        <div class="comment-input-row">
          <input type="text" id="comment-input" placeholder="Add your note…" maxlength="200">
          <button class="btn btn-ghost btn-sm" id="btn-post">Post</button>
        </div>
      </div>

      <div class="quiz-nav" style="margin-top:20px">
        <button class="btn btn-ghost" id="btn-exit">← Exit</button>
        <button class="btn" id="next-btn" style="display:none">Next Question →</button>
      </div>
    </div>
  </div>

  <div id="screen-result" class="screen">
    <div class="result-hero">
      <div class="result-ring" id="result-ring">
        <div class="result-ring-inner">
          <div class="result-pct" id="result-pct">0%</div>
          <div class="result-label">score</div>
        </div>
      </div>
      <div class="result-title" id="result-title"></div>
      <div class="result-sub" id="result-sub"></div>
      <div class="result-breakdown">
        <div class="breakdown-card"><div class="breakdown-n" style="color:var(--green)" id="bd-correct">0</div><div class="breakdown-l">Correct</div></div>
        <div class="breakdown-card"><div class="breakdown-n" style="color:var(--red)" id="bd-wrong">0</div><div class="breakdown-l">Incorrect</div></div>
        <div class="breakdown-card"><div class="breakdown-n" style="color:var(--amber)" id="bd-total">0</div><div class="breakdown-l">Total</div></div>
      </div>
      <div id="review-block" style="margin-bottom:32px"></div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-ghost" id="btn-retry">Retry</button>
        <a class="btn btn-ghost" href="index.html">Next topic →</a>
        <button class="btn" id="btn-lb2">Leaderboard →</button>
      </div>
    </div>
  </div>

  <div id="screen-leaderboard" class="screen">
    <div style="padding-top:32px">
      <h2 style="font-family:var(--font-display);font-size:26px;font-weight:800;margin-bottom:6px">Leaderboard</h2>
      <p class="text-muted" style="font-size:13px;margin-bottom:28px">${esc(META.title || '')} — attempts saved on this device.</p>
      <div class="lb-card">
        <div class="lb-header"><h3>Top scores</h3><span class="text-muted" style="font-size:12px" id="lb-count">0 attempts</span></div>
        <div id="lb-rows"></div>
      </div>
      <div style="text-align:center;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-ghost" id="btn-home2">Return to module</button>
        <button class="btn btn-ghost" id="btn-clear">Clear leaderboard</button>
      </div>
    </div>
  </div>
</div>`;

  /* ---------- navigation ---------- */
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $('screen-' + id).classList.add('active');
    $('nav-quiz').classList.toggle('active', id !== 'leaderboard');
    $('nav-lb').classList.toggle('active', id === 'leaderboard');
    if (id === 'leaderboard') renderLB();
    window.scrollTo(0, 0);
  }

  /* ---------- sub-topic filter ---------- */
  function buildTopicGrid() {
    const g = $('topic-grid');
    if (SECTIONS.length < 2) { g.parentElement.style.display = 'none'; return; }
    SECTIONS.forEach(t => {
      const b = document.createElement('button');
      b.className = 'topic-toggle on';
      b.textContent = t;
      b.onclick = () => {
        if (activeSections.has(t)) {
          if (activeSections.size === 1) return;
          activeSections.delete(t); b.className = 'topic-toggle';
        } else { activeSections.add(t); b.className = 'topic-toggle on'; }
      };
      g.appendChild(b);
    });
  }

  /* ---------- quiz flow ---------- */
  function startQuiz() {
    const name = $('inp-name').value.trim();
    const reg = $('inp-reg').value.trim();
    if (!name) { alert('Please enter your name first.'); return; }
    currentUser = { name, reg };
    save(USER_KEY, currentUser);
    quiz = BANK.filter(q => activeSections.has(q.s)).sort(() => Math.random() - 0.5);
    if (!quiz.length) { alert('Select at least one sub-topic.'); return; }
    cur = 0; score = 0; answered = false; missed = [];
    showScreen('quiz');
    renderQ();
  }

  function renderQ() {
    if (cur >= quiz.length) { endQuiz(); return; }
    const q = quiz[cur];
    $('prog-fill').style.width = (cur / quiz.length) * 100 + '%';
    $('prog-label').textContent = `Question ${cur + 1} of ${quiz.length}`;
    $('prog-score').textContent = `${score} pts`;
    $('q-section').textContent = q.s;
    $('q-text').innerHTML = q.q;

    const opts = $('options');
    opts.innerHTML = '';
    const shuffled = q.opts.map((opt, i) => ({ opt, isCorrect: i === q.ans })).sort(() => Math.random() - 0.5);
    const correctIdx = shuffled.findIndex(o => o.isCorrect);
    const letters = ['A', 'B', 'C', 'D', 'E'];

    shuffled.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'opt-btn';
      b.innerHTML = `<span class="opt-letter">${letters[i]}</span><span>${o.opt}</span>`;
      b.onclick = () => { if (!answered) select(i, correctIdx, b, q); };
      opts.appendChild(b);
    });

    $('feedback').style.display = 'none';
    $('discussion-section').style.display = 'none';
    $('next-btn').style.display = 'none';
    answered = false;
    window.scrollTo(0, 0);
  }

  function select(selectedIdx, correctIdx, btn, q) {
    answered = true;
    const buttons = document.querySelectorAll('.opt-btn');
    buttons.forEach(b => b.disabled = true);
    const fb = $('feedback');

    if (selectedIdx === correctIdx) {
      btn.classList.add('correct');
      score++;
      fb.className = 'feedback-box correct';
      fb.innerHTML = `<strong>✓ Message received.</strong>${q.exp}`;
    } else {
      btn.classList.add('wrong');
      buttons[correctIdx].classList.add('correct');
      fb.className = 'feedback-box wrong';
      fb.innerHTML = `<strong>✗ Signal lost.</strong>${q.exp}`;
      missed.push(q);
    }

    fb.style.display = 'block';
    $('next-btn').style.display = 'inline-flex';
    $('next-btn').textContent = (cur === quiz.length - 1) ? 'See results →' : 'Next Question →';
    $('prog-score').textContent = `${score} pts`;
    openDiscussion(q);
  }

  /* ---------- class notes ---------- */
  function keyFor(q) { return q.q.slice(0, 40).replace(/[^a-zA-Z0-9]/g, ''); }

  function openDiscussion(q) {
    const key = keyFor(q);
    $('discussion-section').style.display = 'block';
    $('comment-input').dataset.key = key;
    renderComments(key);
  }

  function renderComments(key) {
    const list = $('comments-list');
    const c = comments[key] || [];
    if (!c.length) { list.innerHTML = '<div class="no-comments">No notes on this question yet — add yours.</div>'; return; }
    list.innerHTML = c.map(cm => `
      <div class="comment">
        <div class="comment-author">${esc(cm.name)} ${cm.reg ? '<span style="color:var(--muted);font-weight:400">· ' + esc(cm.reg) + '</span>' : ''}</div>
        <div class="comment-text">${esc(cm.text)}</div>
        <div class="comment-time">${esc(cm.time)}</div>
      </div>`).join('');
    list.scrollTop = list.scrollHeight;
  }

  function postComment() {
    const inp = $('comment-input');
    const key = inp.dataset.key;
    const text = inp.value.trim();
    if (!text || !key) return;
    if (!comments[key]) comments[key] = [];
    const now = new Date();
    comments[key].push({
      name: currentUser.name, reg: currentUser.reg, text,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + now.toLocaleDateString()
    });
    save(CM_KEY, comments);
    inp.value = '';
    renderComments(key);
  }

  /* ---------- results ---------- */
  function endQuiz() {
    const total = quiz.length;
    const pct = Math.round((score / total) * 100);
    $('result-ring').style.setProperty('--pct', pct + '%');
    $('result-pct').textContent = pct + '%';
    $('bd-correct').textContent = score;
    $('bd-wrong').textContent = total - score;
    $('bd-total').textContent = total;

    let title, sub;
    if (pct >= 90) { title = 'Distinction standard.'; sub = `You have this module under control. Move on to the next topic and keep the streak.`; }
    else if (pct >= 75) { title = 'Strong pass.'; sub = `Solid grasp of ${META.title}. Tidy up the few items below and you are exam ready.`; }
    else if (pct >= 60) { title = 'Good effort.'; sub = `The foundation is there. Re-read the slides on the items you missed, then retry.`; }
    else { title = 'Back to the notes.'; sub = `Work through the ${META.title} slides again before retrying — the items below show where to start.`; }
    $('result-title').textContent = title;
    $('result-sub').textContent = sub;

    $('review-block').innerHTML = missed.length
      ? `<h3 class="section-head" style="text-align:left">Review these ${missed.length}</h3>` +
        missed.map(q => `<div class="review-item">
            <div class="review-q">${q.q}</div>
            <div class="review-a">Correct answer: <b>${q.opts[q.ans]}</b></div>
          </div>`).join('')
      : '';

    leaderboard.push({
      name: currentUser.name, reg: currentUser.reg, score, total, pct,
      time: new Date().toLocaleDateString(),
      color: AVATARS[Math.abs(hashStr(currentUser.name)) % AVATARS.length]
    });
    leaderboard.sort((a, b) => b.pct - a.pct || b.score - a.score);
    save(LB_KEY, leaderboard);
    $('stat-players').textContent = leaderboard.length;
    showScreen('result');
  }

  function renderLB() {
    const rows = $('lb-rows');
    $('lb-count').textContent = `${leaderboard.length} attempt${leaderboard.length !== 1 ? 's' : ''}`;
    if (!leaderboard.length) { rows.innerHTML = '<div class="lb-empty">No attempts yet. Be the first on the board.</div>'; return; }
    const rankClass = ['gold', 'silver', 'bronze'];
    const rankLabel = ['1st', '2nd', '3rd'];
    rows.innerHTML = leaderboard.slice(0, 20).map((e, i) => {
      const initials = e.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const isYou = currentUser.name && e.name === currentUser.name;
      return `<div class="lb-row">
        <div class="lb-rank ${rankClass[i] || ''}">${i < 3 ? rankLabel[i] : i + 1}</div>
        <div class="lb-avatar" style="background:${e.color}22;color:${e.color}">${esc(initials)}</div>
        <div class="lb-info">
          <div class="lb-name">${esc(e.name)} ${isYou ? '<span class="badge-you">you</span>' : ''}</div>
          <div class="lb-meta">${e.reg ? esc(e.reg) + ' · ' : ''}${esc(e.time)}</div>
        </div>
        <div class="lb-score-wrap"><div class="lb-score">${e.score}/${e.total}</div><div class="lb-pct">${e.pct}%</div></div>
      </div>`;
    }).join('');
  }

  /* ---------- wiring ---------- */
  $('nav-quiz').onclick = () => showScreen('home');
  $('nav-lb').onclick = () => showScreen('leaderboard');
  $('btn-start').onclick = startQuiz;
  $('btn-exit').onclick = () => showScreen('home');
  $('next-btn').onclick = () => { cur++; renderQ(); };
  $('btn-post').onclick = postComment;
  $('comment-input').onkeydown = e => { if (e.key === 'Enter') postComment(); };
  $('btn-retry').onclick = () => showScreen('home');
  $('btn-lb2').onclick = () => showScreen('leaderboard');
  $('btn-home2').onclick = () => showScreen('home');
  $('btn-clear').onclick = () => {
    if (!confirm('Clear all saved attempts for this topic?')) return;
    leaderboard = []; save(LB_KEY, leaderboard); renderLB(); $('stat-players').textContent = 0;
  };

  const saved = load(USER_KEY, null);
  if (saved) { $('inp-name').value = saved.name || ''; $('inp-reg').value = saved.reg || ''; currentUser = saved; }
  buildTopicGrid();
  $('stat-players').textContent = leaderboard.length;
})();
