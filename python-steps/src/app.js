/* Python Steps app: home path, lesson flow, progress, hints and the Ask Claude helper. */
(function () {
  'use strict';
  const LESSONS = window.LESSONS;
  const MiniPy = window.MiniPy;
  const checkStep = window.PSCheck;
  const KEY = 'python-steps-progress-v1';
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');

  // ------------------------------------------------------------ DOM helpers
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid === null || kid === undefined || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const ICONS = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10-6.5z" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    reset: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    flame: '<svg viewBox="0 0 24 24"><path d="M12 2.5c1.2 3.6 5.5 5.6 5.5 10.6a5.5 5.5 0 0 1-11 0c0-2.4 1.2-4 2.5-5.3.3 1.8 1.3 2.9 2.4 3.1-.7-2.9-.2-5.9.6-8.4z" fill="currentColor"/></svg>',
    medal: '<svg viewBox="0 0 24 24"><circle cx="12" cy="14.5" r="6" fill="currentColor"/><path d="M8 3h3l1.5 5M16 3h-3L11.5 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
  };
  function icon(name) { const s = document.createElement('span'); s.className = 'ico'; s.setAttribute('aria-hidden', 'true'); s.innerHTML = ICONS[name]; return s; }

  // Inline formatting for lesson text: **bold**, `code`, line breaks.
  function fmt(text) {
    const frag = document.createDocumentFragment();
    String(text || '').split('\n').forEach((line, i) => {
      if (i) frag.append(document.createElement('br'));
      const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
      let last = 0, m;
      while ((m = re.exec(line))) {
        if (m.index > last) frag.append(line.slice(last, m.index));
        const tok = m[0];
        frag.append(tok.startsWith('**') ? h('strong', null, tok.slice(2, -2)) : h('code', { class: 'ic' }, tok.slice(1, -1)));
        last = m.index + tok.length;
      }
      if (last < line.length) frag.append(line.slice(last));
    });
    return frag;
  }
  function fmtAnswer(text) {
    const frag = document.createDocumentFragment();
    const parts = String(text).split(/```(?:python|py)?\n?([\s\S]*?)(?:```|$)/);
    parts.forEach((p, i) => {
      if (i % 2) frag.append(h('pre', null, p.replace(/\n$/, '')));
      else frag.append(fmt(p.replace(/^\n+|\n+$/g, '')));
    });
    return frag;
  }

  // Small read-only syntax highlighter.
  const KW = new Set('False None True and as assert break class continue def del elif else except finally for from global if import in is lambda not or pass raise return try while with yield'.split(' '));
  const BI = new Set('print len str int float round range list dict sum min max abs sorted type bool enumerate zip input'.split(' '));
  function highlight(code) {
    const frag = document.createDocumentFragment();
    const re = /(#[^\n]*)|([rRfFbBuU]{0,2}"(?:[^"\\\n]|\\.)*"?|[rRfFbBuU]{0,2}'(?:[^'\\\n]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|([\s\S])/g;
    let m;
    while ((m = re.exec(code))) {
      if (m[1]) frag.append(h('span', { class: 't-com' }, m[1]));
      else if (m[2]) frag.append(h('span', { class: 't-str' }, m[2]));
      else if (m[3]) frag.append(h('span', { class: 't-num' }, m[3]));
      else if (m[4]) frag.append(KW.has(m[4]) ? h('span', { class: 't-kw' }, m[4]) : BI.has(m[4]) ? h('span', { class: 't-fn' }, m[4]) : m[4]);
      else frag.append(m[5]);
    }
    return frag;
  }

  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3200);
  }

  // ------------------------------------------------------------ progress
  const pad = (n) => String(n).padStart(2, '0');
  const dayStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => dayStr(new Date());
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); };
  const fresh = () => ({ v: 1, xp: 0, stepMax: {}, done: {}, streak: { count: 0, last: '' }, badges: {}, updatedAt: 0 });
  function clean(p) {
    const f = fresh();
    if (!p || typeof p !== 'object') return f;
    return {
      v: 1,
      xp: Number(p.xp) || 0,
      stepMax: p.stepMax && typeof p.stepMax === 'object' ? { ...p.stepMax } : {},
      done: p.done && typeof p.done === 'object' ? { ...p.done } : {},
      streak: p.streak && typeof p.streak === 'object' ? { count: Number(p.streak.count) || 0, last: String(p.streak.last || '') } : f.streak,
      badges: p.badges && typeof p.badges === 'object' ? { ...p.badges } : {},
      updatedAt: Number(p.updatedAt) || 0,
    };
  }
  function loadLocal() { try { return clean(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { return fresh(); } }
  let P = loadLocal();

  function merge(a, b) {
    a = clean(a); b = clean(b);
    const out = fresh();
    out.xp = Math.max(a.xp, b.xp);
    for (const k of new Set([...Object.keys(a.stepMax), ...Object.keys(b.stepMax)])) out.stepMax[k] = Math.max(a.stepMax[k] || 0, b.stepMax[k] || 0);
    for (const k of new Set([...Object.keys(a.done), ...Object.keys(b.done)])) out.done[k] = [a.done[k], b.done[k]].filter(Boolean).sort()[0];
    for (const k of new Set([...Object.keys(a.badges), ...Object.keys(b.badges)])) out.badges[k] = [a.badges[k], b.badges[k]].filter(Boolean).sort()[0];
    const sa = a.streak, sb = b.streak;
    out.streak = sa.last > sb.last ? sa : sb.last > sa.last ? sb : { count: Math.max(sa.count, sb.count), last: sa.last };
    out.updatedAt = Math.max(a.updatedAt, b.updatedAt);
    return out;
  }
  const same = (a, b) => JSON.stringify({ ...a, updatedAt: 0 }) === JSON.stringify({ ...b, updatedAt: 0 });

  const cloud = { ref: null, status: 'local', writing: false, again: false, timer: null };
  function setSync(s) {
    cloud.status = s;
    const el = document.getElementById('sync');
    if (el) { el.className = 'sync ' + s; el.textContent = SYNC_TEXT[s]; }
  }
  const SYNC_TEXT = {
    local: 'Progress is saved on this device.',
    cloud: 'Progress is saved to your Claude account.',
    saving: 'Saving…',
    error: "Couldn't save to your Claude account. Progress is kept on this device.",
  };
  function save() {
    P.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* storage may be blocked */ }
    if (cloud.ref) { clearTimeout(cloud.timer); cloud.timer = setTimeout(flushCloud, 700); }
  }
  async function flushCloud() {
    if (!cloud.ref) return;
    if (cloud.writing) { cloud.again = true; return; }
    cloud.writing = true;
    setSync('saving');
    try {
      await cloud.ref.set(JSON.parse(JSON.stringify(P)));
      setSync('cloud');
    } catch (e) {
      setSync('error');
    } finally {
      cloud.writing = false;
      if (cloud.again) { cloud.again = false; flushCloud(); }
    }
  }
  async function initCloud() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const uid = await user.id();
      if (!uid) return;
      const ref = db.doc('data/users/' + uid + '/progress');
      const snap = await Promise.race([ref.get(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))]);
      const remote = snap.exists ? snap.data() : null;
      const merged = remote ? merge(P, remote) : P;
      const changedLocal = !same(merged, P);
      P = merged;
      try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* ignore */ }
      cloud.ref = ref;
      setSync('cloud');
      if (!remote || !same(clean(remote), P)) flushCloud();
      if (changedLocal) render();
    } catch (e) {
      setSync('local');
    }
  }

  let sample = null, aiOff = false;
  async function initSample() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    try { sample = await window.claude.use('sample'); } catch (e) { sample = null; }
    if (sample && ui.view === 'lesson') renderLesson();
  }

  const BADGES = [
    { id: 'first-run', name: 'First run', desc: 'Ran Python for the first time' },
    { id: 'bug-hunter', name: 'Bug hunter', desc: 'Fixed your first bug' },
    { id: 'streak-3', name: '3-day streak', desc: 'Practised 3 days in a row' },
    { id: 'streak-7', name: '7-day streak', desc: 'Practised 7 days in a row' },
    { id: 'week-1', name: 'Week 1 done', desc: 'Finished Talking to Python' },
  ];
  function award(id) {
    if (P.badges[id]) return;
    P.badges[id] = today();
    const b = BADGES.find((x) => x.id === id);
    if (b) { ui.newBadges.push(b); toast(`Badge earned: ${b.name}`); }
  }
  function streakNow() { return P.streak.last === today() || P.streak.last === yesterday() ? P.streak.count : 0; }
  function bumpStreak() {
    const t = today();
    if (P.streak.last === t) return;
    P.streak = { count: P.streak.last === yesterday() ? P.streak.count + 1 : 1, last: t };
    if (P.streak.count >= 3) award('streak-3');
    if (P.streak.count >= 7) award('streak-7');
  }
  const level = () => Math.floor(P.xp / 100) + 1;
  const unlocked = (li) => li === 0 || !!P.done[LESSONS[li - 1].id];

  // ------------------------------------------------------------ app state
  const ui = { view: 'home', li: 0, si: 0, steps: {}, sessionXp: 0, newBadges: [] };
  const draftKey = (li, si) => `python-steps-draft:${LESSONS[li].id}:${si}`;
  function loadDraft(li, si) { try { return localStorage.getItem(draftKey(li, si)); } catch (e) { return null; } }
  let draftTimer = null;
  function saveDraft(li, si, code) {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => { try { localStorage.setItem(draftKey(li, si), code); } catch (e) { /* ignore */ } }, 400);
  }
  function clearDraft(li, si) { try { localStorage.removeItem(draftKey(li, si)); } catch (e) { /* ignore */ } }
  function stepState(li, si) {
    const k = li + ':' + si;
    if (!ui.steps[k]) {
      const step = LESSONS[li].steps[si];
      const draft = step.type === 'quiz' ? null : loadDraft(li, si);
      ui.steps[k] = { code: draft !== null ? draft : (step.code || ''), result: null, verdict: null, passed: false, gained: 0, hint: 0, choice: null, wrong: [], ai: null };
    }
    return ui.steps[k];
  }
  const stepDone = (li, si) => si < (P.stepMax[LESSONS[li].id] || 0) || (ui.steps[li + ':' + si] || {}).passed;

  function completeStep(li, si) {
    const lesson = LESSONS[li];
    const step = lesson.steps[si];
    let gained = 0;
    if (si >= (P.stepMax[lesson.id] || 0)) {
      P.stepMax[lesson.id] = si + 1;
      gained = step.type === 'quiz' ? 5 : 10;
      P.xp += gained;
    }
    bumpStreak();
    if (step.type === 'fix') award('bug-hunter');
    ui.sessionXp += gained;
    save();
    return gained;
  }
  function completeLesson(li) {
    const lesson = LESSONS[li];
    if (!P.done[lesson.id]) {
      P.done[lesson.id] = today();
      P.xp += 20;
      ui.sessionXp += 20;
      if (LESSONS.every((l) => P.done[l.id])) award('week-1');
    }
    save();
  }

  // ------------------------------------------------------------ friendly error help
  const ERROR_TITLES = { AppLimit: 'Not in this app yet', ProgramTooLong: 'Stopped: it ran too long', OutputLimit: 'Stopped: too much output', InternalError: 'The practice app had a problem' };
  function friendly(err) {
    const m = err.message || '';
    switch (err.type) {
      case 'SyntaxError':
        if (/unterminated (triple-quoted )?string/.test(m)) return 'A piece of text is missing its closing quote. Text needs a quote at the start and at the end, "like this".';
        if (/was never closed/.test(m)) return 'A bracket was opened but never closed. Every ( needs a ), every [ needs a ] and every { needs a }.';
        if (/unmatched|does not match/.test(m)) return 'There is a closing bracket without a matching opening one. Count your brackets.';
        if (/forgot a comma/.test(m)) return 'Two values sit side by side with nothing between them. Add a comma, or a + to join them.';
        if (/Missing parentheses in call to 'print'/.test(m)) return 'print needs brackets: print("like this").';
        if (/expected ':'/.test(m)) return 'Lines that start with if, for, while or def must end with a colon (:).';
        if (/'=='/.test(m)) return 'One = stores a value. Two == compare values.';
        if (/invalid character/.test(m)) return 'There is a character Python can\'t read, often a curly quote or a long dash copied from a document. Delete it and type it again.';
        if (/invalid decimal literal/.test(m)) return 'A number runs straight into letters. Variable names can\'t start with a number.';
        if (/leading zeros/.test(m)) return 'Whole numbers can\'t start with 0 in Python. Write 7, not 07.';
        if (/cannot assign to/.test(m)) return 'The variable name goes on the left of = and the value on the right, like stock = 120.';
        return `Python couldn't read line ${err.line}. Look for a typo, a missing symbol or an extra one. Names can't contain spaces: use an underscore, like monthly_use. To multiply, use *.`;
      case 'IndentationError':
        if (/unexpected indent/.test(m)) return 'This line starts with spaces it shouldn\'t have. In Python, spaces at the start of a line mean "this belongs inside the block above".';
        if (/expected an indented block/.test(m)) return 'After a line that ends with a colon, the next line must start with 4 spaces. Use the Tab key above.';
        return 'The spaces at the start of this line don\'t line up with the lines around it.';
      case 'NameError': return 'Python doesn\'t know this name yet. Check the spelling and capital letters (stock and Stock are different names), check you created it on an earlier line, and put text in quotes.';
      case 'TypeError':
        if (/can only concatenate str/.test(m)) return 'You are joining text and a number with +. Turn the number into text with str(), or use an f-string.';
        if (/unsupported operand/.test(m)) return 'These two kinds of value can\'t be combined with this symbol. Check both are numbers, or both are text.';
        if (/not callable/.test(m)) return 'There are brackets ( ) after something that isn\'t a command. Maybe a variable has the same name as a command.';
        if (/argument/.test(m)) return 'The command got the wrong number of values inside its brackets.';
        return 'A value is the wrong kind for what you asked Python to do.';
      case 'AttributeError': return 'This kind of value has no method with that name. Check the spelling and capital letters. Method names are lowercase.';
      case 'ZeroDivisionError': return 'You divided by zero, which has no answer. Check the number after the /.';
      case 'ValueError': return /int\(\)|float/.test(m) ? 'That text can\'t be turned into a number. Look for letters, spaces or a decimal point.' : 'The value is the right kind, but Python can\'t use it here.';
      case 'IndexError': return 'You asked for a position that doesn\'t exist. Positions start at 0, so the last item in a list of 3 is at position 2.';
      case 'KeyError': return 'That key isn\'t in the dictionary. Check the spelling, or use .get().';
      case 'UnboundLocalError': return 'Inside a function, a variable was used before it was given a value.';
      case 'RecursionError': return 'A function kept calling itself and never stopped.';
      case 'ProgramTooLong': case 'OutputLimit': return 'Look for a loop whose condition never becomes False.';
      case 'AppLimit': return 'This works in full Python, but this practice app only covers what the lessons use.';
    }
    return 'Read the error type and the line number, then look closely at that line.';
  }

  // ------------------------------------------------------------ routing
  function route() {
    const m = /^#day-(\d+)$/.exec(location.hash);
    if (m) {
      const li = Number(m[1]) - 1;
      if (LESSONS[li] && unlocked(li)) { openLesson(li); return; }
    }
    ui.view = 'home';
    render();
  }
  function go(hash) {
    if (location.hash === hash || (hash === '' && !location.hash)) route();
    else location.hash = hash;
  }
  function openLesson(li) {
    ui.view = 'lesson';
    ui.li = li;
    const lesson = LESSONS[li];
    const max = P.stepMax[lesson.id] || 0;
    ui.si = P.done[lesson.id] ? 0 : Math.min(max, lesson.steps.length - 1);
    ui.sessionXp = 0;
    ui.newBadges = [];
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    if (ui.view === 'lesson') renderLesson();
    else if (ui.view === 'finish') renderFinish();
    else renderHome();
  }

  // ------------------------------------------------------------ home
  function progressVars() {
    const lv = level();
    const done = LESSONS.filter((l) => P.done[l.id]).length;
    const rows = [
      ['streak', String(streakNow()), streakNow() === 1 ? 'day in a row' : 'days in a row'],
      ['xp', String(P.xp), `level ${lv}`],
      ['lessons_done', String(done), `of ${LESSONS.length}`],
    ];
    const w = Math.max(...rows.map((r) => r[0].length + 3 + r[1].length)) + 2;
    const pre = h('pre', { class: 'vars', 'aria-label': `Streak ${rows[0][1]} days. ${P.xp} XP, level ${lv}. ${done} of ${LESSONS.length} lessons done.` });
    rows.forEach((r, i) => {
      if (i) pre.append('\n');
      const used = r[0].length + 3 + r[1].length;
      pre.append(h('span', { class: 'n' }, r[0]), h('span', { class: 'o' }, ' = '), h('span', { class: 'v' }, r[1]), ' '.repeat(w - used), h('span', { class: 'c' }, '# ' + r[2]));
    });
    return pre;
  }
  function renderHome() {
    const nextIdx = LESSONS.findIndex((l) => !P.done[l.id]);
    const doneToday = Object.values(P.done).includes(today());
    const lvXp = P.xp % 100;

    let todayCard;
    if (nextIdx === -1) {
      todayCard = h('section', { class: 'today', 'aria-label': 'Week complete' },
        h('p', { class: 'eyebrow' }, 'Week 1 complete'),
        h('h2', null, 'You finished Talking to Python'),
        h('p', null, 'Ask Claude in chat to add Week 2: decisions with if and else, and loops. You can review any day below.'));
    } else {
      const l = LESSONS[nextIdx];
      const max = P.stepMax[l.id] || 0;
      todayCard = h('section', { class: 'today', 'aria-label': "Today's lesson" },
        h('p', { class: 'eyebrow' }, max ? `Day ${l.day} · step ${Math.min(max + 1, l.steps.length)} of ${l.steps.length}` : `Today · Day ${l.day} · about ${l.minutes} min`),
        h('h2', null, l.title),
        h('p', null, l.idea),
        doneToday ? h('p', { class: 'note' }, 'You did a lesson today, so your streak is safe. Keep going now, or come back tomorrow.') : null,
        h('button', { class: 'btn', type: 'button', onclick: () => go('#day-' + l.day) }, icon('play'), max ? `Continue Day ${l.day}` : `Start Day ${l.day}`));
    }

    const path = h('ol', { class: 'path' }, LESSONS.map((l, i) => {
      const done = !!P.done[l.id];
      const open = unlocked(i);
      const current = !done && open && i === nextIdx;
      const cls = 'day' + (done ? ' done' : '') + (current ? ' current' : '') + (!open ? ' locked' : '');
      const tag = done ? h('span', { class: 'tag tag-done' }, 'Done') : current ? h('span', { class: 'tag tag-today' }, 'Next') : !open ? h('span', { class: 'tag tag-locked' }, 'Locked') : null;
      return h('li', { class: cls },
        h('button', { class: 'day-btn', type: 'button', disabled: !open, 'aria-label': `Day ${l.day}: ${l.title}${done ? ', done' : !open ? ', locked until you finish the day before' : ''}`, onclick: () => go('#day-' + l.day) },
          h('span', { class: 'dot' }, done ? icon('check') : !open ? icon('lock') : String(l.day)),
          h('span', { class: 'day-text' }, h('strong', null, l.title), h('span', null, `Day ${l.day} · ${l.steps.length} steps · ${l.minutes} min`)),
          tag));
    }));

    const badges = h('div', { class: 'badges' }, BADGES.map((b) => {
      const got = !!P.badges[b.id];
      return h('div', { class: 'badge' + (got ? '' : ' off'), 'aria-label': `${b.name}: ${got ? 'earned' : 'not earned yet'}. ${b.desc}` },
        icon(got ? 'medal' : 'lock'), h('div', { style: 'min-width:0' }, h('strong', null, b.name), h('span', { class: 'd' }, b.desc)));
    }));

    app.replaceChildren(
      h('header', null,
        h('div', { class: 'brand' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'py'), h('h1', null, 'Python Steps')),
        h('p', { class: 'home-sub' }, 'Week 1 · Talking to Python · one short step a day')),
      h('section', { class: 'progress-card', 'aria-label': 'Your progress' },
        progressVars(),
        h('div', { class: 'level' },
          h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(lvXp), 'aria-label': `Level ${level()} progress` }, h('span', { style: `width:${lvXp}%` })),
          h('span', null, `${100 - lvXp} XP to level ${level() + 1}`))),
      todayCard,
      h('section', { 'aria-label': 'Your path' },
        h('div', { class: 'section-title' }, h('h3', null, 'Your path'), h('span', { class: 'muted', style: 'font-size:14px' }, 'Week 1')),
        h('div', { style: 'height:12px' }), path),
      h('section', { 'aria-label': 'Badges' }, h('h3', null, 'Badges'), h('div', { style: 'height:10px' }), badges),
      h('details', { class: 'how' },
        h('summary', null, 'How Python Steps works'),
        h('ul', null,
          h('li', null, 'One short lesson a day, 10 to 15 minutes. Each lesson is a few small steps.'),
          h('li', null, 'Python runs right here on your phone. Nothing to install.'),
          h('li', null, 'Stuck? Tap Hint. Hints never cost points, and Show answer is there when you need it.'),
          h('li', null, 'Ask Claude explains errors in plain words. It uses your own Claude account and sends only that step and your code.'),
          h('li', null, 'Every lesson links Python back to Power Automate, so you build on what you already know.'),
          h('li', null, 'This app runs a teaching version of Python made for these lessons. Its output and error messages were tested to match real Python 3.13.'))),
      h('footer', { class: 'foot' },
        h('span', { id: 'sync', class: 'sync ' + cloud.status }, SYNC_TEXT[cloud.status]),
        h('span', null, 'Week 2 (decisions and loops) comes next. When you finish Week 1, ask Claude in chat to add it.')));
  }

  // ------------------------------------------------------------ lesson
  const TYPE_LABEL = { run: 'Watch it run', change: 'Change it', quiz: 'Quick check', blank: 'Fill the blank', fix: 'Fix the bug', write: 'Write it', error: 'Meet an error' };
  const KEYS = [
    { label: 'Tab', text: '    ', aria: 'Indent with 4 spaces' },
    { label: '( )', open: '(', close: ')', aria: 'Brackets' },
    { label: '" "', open: '"', close: '"', aria: 'Double quotes' },
    { label: 'f" "', open: 'f"', close: '"', aria: 'f-string' },
    { label: '{ }', open: '{', close: '}', aria: 'Curly braces' },
    { label: '=', text: '=' }, { label: ':', text: ':' }, { label: '+', text: '+' }, { label: '-', text: '-' },
    { label: '*', text: '*' }, { label: '/', text: '/' }, { label: '_', text: '_' }, { label: ',', text: ',' },
    { label: '.', text: '.' }, { label: "'", text: "'" }, { label: '[ ]', open: '[', close: ']', aria: 'Square brackets' },
    { label: '#', text: '# ', aria: 'Comment' }, { label: '<', text: '<' }, { label: '>', text: '>' },
  ];

  function insertAtCursor(ta, key) {
    ta.focus();
    const s = ta.selectionStart, e = ta.selectionEnd;
    if (key.open) {
      const sel = ta.value.slice(s, e);
      ta.setRangeText(key.open + sel + key.close, s, e, 'end');
      if (!sel) { const p = s + key.open.length; ta.setSelectionRange(p, p); }
    } else {
      ta.setRangeText(key.text, s, e, 'end');
    }
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function buildEditor(st, li, si, onRun) {
    const gutter = h('div', { class: 'gutter', 'aria-hidden': 'true' });
    const ta = h('textarea', {
      class: 'code', id: 'code-input', spellcheck: 'false', autocapitalize: 'none', autocomplete: 'off', autocorrect: 'off',
      wrap: 'off', 'aria-label': 'Your Python code', enterkeyhint: 'enter',
    });
    ta.value = st.code;
    const sync = () => {
      const n = ta.value.split('\n').length;
      gutter.textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n');
      ta.rows = Math.max(3, n + 1);
    };
    ta.addEventListener('input', () => { st.code = ta.value; sync(); saveDraft(li, si, ta.value); });
    ta.addEventListener('beforeinput', (e) => {
      if (e.inputType !== 'insertLineBreak' && e.inputType !== 'insertParagraph') return;
      e.preventDefault();
      const s = ta.selectionStart, v = ta.value;
      const lineStart = v.lastIndexOf('\n', s - 1) + 1;
      const line = v.slice(lineStart, s);
      let indent = (line.match(/^ */) || [''])[0];
      if (/:\s*$/.test(line)) indent += '    ';
      insertAtCursor(ta, { text: '\n' + indent });
    });
    sync();
    const keys = h('div', { class: 'keys', role: 'toolbar', 'aria-label': 'Symbols' },
      h('button', { class: 'key run', type: 'button', onpointerdown: (e) => e.preventDefault(), onclick: onRun }, icon('play'), 'Run'),
      KEYS.map((k) => h('button', {
        class: 'key', type: 'button', 'aria-label': k.aria || k.label,
        onpointerdown: (e) => e.preventDefault(),
        onclick: () => insertAtCursor(ta, k),
      }, k.label)));
    return [h('div', { class: 'editor' }, gutter, ta), keys];
  }

  function errorPanel(err) {
    const title = ERROR_TITLES[err.type] || err.type;
    return h('div', { class: 'panel err', role: 'alert' },
      h('span', { class: 'label' }, 'Error'),
      h('div', { class: 'err-head' }, h('strong', null, title), err.line ? h('span', null, `on line ${err.line}`) : null),
      err.message ? h('div', { class: 'err-msg' }, err.message) : null,
      err.lineText && err.lineText.trim() ? h('pre', { class: 'err-line' }, `${err.line} | ${err.lineText}`) : null,
      h('p', { class: 'tip' }, h('b', null, 'What it means: '), friendly(err)));
  }

  function aiPrompt(kind, lesson, step, st) {
    const res = st.result;
    let ran = 'They have not run it yet.';
    if (res && res.error) ran = `When they ran it, Python stopped with an error on line ${res.error.line}: ${res.error.type}: ${res.error.message}`;
    else if (res) ran = `When they ran it, the output was:\n${res.output || '(nothing)'}`;
    const want = step.check && step.check.out ? `The step expects this exact output:\n${step.check.out}` : '';
    return [
      'You are a patient Python tutor inside a phone app called Python Steps.',
      'The learner is an adult IT professional who builds automations in Microsoft Power Automate and Copilot Studio and finds code hard. Be warm, plain and brief.',
      `Lesson: Day ${lesson.day}, "${lesson.title}". Step: "${step.title}". Task: ${String(step.text).replace(/\*\*/g, '')}`,
      want,
      'Their code:',
      '```python',
      st.code,
      '```',
      ran,
      kind === 'hint'
        ? 'Give ONE small hint that moves them one step closer. Point to the line to look at. Do not write the full corrected code.'
        : 'Explain in plain words what is happening and why, pointing to the exact line. Then say what to change, without writing the full corrected program.',
      'Use a Power Automate comparison only if it truly helps. Keep it under 90 words. No headings. Put code in backticks.',
    ].filter(Boolean).join('\n');
  }
  const AI_ERRORS = {
    rate_limited: 'Claude is busy or you have reached a usage limit. Try again in a little while.',
    session_expired: 'Sign in to Claude again to use Ask Claude.',
    refused: "Claude couldn't answer that one. Try the Hint button instead.",
    empty_completion: "Claude couldn't answer that one. Try the Hint button instead.",
    upstream_error: "Couldn't reach Claude. Check your connection and try again.",
  };
  async function askClaude(kind) {
    const lesson = LESSONS[ui.li], step = lesson.steps[ui.si], st = stepState(ui.li, ui.si);
    if (!sample || aiOff) return;
    if (st.ai && st.ai.ctl) st.ai.ctl.abort();
    const ctl = new AbortController();
    st.ai = { text: '', busy: true, ctl, note: '' };
    paintAI();
    try {
      await sample(aiPrompt(kind, lesson, step, st), {
        modelTier: 'quick',
        signal: ctl.signal,
        onText: ({ text }) => { if (st.ai && st.ai.ctl === ctl) { st.ai.text = text; paintAI(); } },
      });
      if (st.ai && st.ai.ctl === ctl) { st.ai.busy = false; paintAI(); }
    } catch (e) {
      if (!st.ai || st.ai.ctl !== ctl) return;
      st.ai.busy = false;
      const code = e && e.code;
      if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(code)) {
        aiOff = true; st.ai = null; renderLesson(); toast('Ask Claude is turned off for this page.'); return;
      }
      if (code === 'refused') st.ai.text = '';
      else st.ai.text = (e && e.text) || st.ai.text;
      if (code !== 'cancelled') st.ai.note = AI_ERRORS[code] || AI_ERRORS.upstream_error;
      paintAI();
    }
  }
  function paintAI() {
    const box = document.getElementById('ai-out');
    if (!box) return;
    const st = stepState(ui.li, ui.si);
    const ai = st.ai;
    box.replaceChildren();
    if (!ai) return;
    if (ai.text) box.append(fmtAnswer(ai.text));
    else if (ai.busy) box.append(h('span', { class: 'muted' }, 'Thinking…'));
    if (ai.note) box.append(h('p', { class: 'note' }, ai.note));
    const stop = document.getElementById('ai-stop');
    if (stop) stop.hidden = !ai.busy;
  }

  function runCurrent() {
    const lesson = LESSONS[ui.li], step = lesson.steps[ui.si], st = stepState(ui.li, ui.si);
    const res = MiniPy.run(st.code);
    st.result = res;
    st.verdict = checkStep(step, st.code, res);
    if (!res.error) award('first-run');
    if (st.verdict.ok && !st.passed) { st.passed = true; st.gained = completeStep(ui.li, ui.si); }
    renderLesson();
    const target = document.getElementById(st.verdict.ok ? 'feedback' : 'output') || document.getElementById('feedback');
    if (target) target.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function choose(i) {
    const lesson = LESSONS[ui.li], step = lesson.steps[ui.si], st = stepState(ui.li, ui.si);
    if (st.passed) return;
    st.choice = i;
    if (i === step.answer) { st.passed = true; st.gained = completeStep(ui.li, ui.si); }
    else if (!st.wrong.includes(i)) st.wrong.push(i);
    renderLesson();
    const fb = document.getElementById('feedback');
    if (fb) fb.scrollIntoView({ block: 'nearest' });
  }
  function nextStep() {
    const lesson = LESSONS[ui.li];
    if (ui.si < lesson.steps.length - 1) { ui.si++; renderLesson(); window.scrollTo(0, 0); return; }
    completeLesson(ui.li);
    ui.view = 'finish';
    render();
    window.scrollTo(0, 0);
  }

  function renderLesson() {
    const lesson = LESSONS[ui.li];
    const si = ui.si;
    const step = lesson.steps[si];
    const st = stepState(ui.li, si);
    const done = stepDone(ui.li, si);
    const isQuiz = step.type === 'quiz';
    const isLast = si === lesson.steps.length - 1;

    const header = h('header', { class: 'lbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back to your path', onclick: () => go('') }, icon('back')),
      h('div', { class: 'lbar-title' },
        h('strong', null, `Day ${lesson.day} · ${lesson.title}`),
        h('div', { class: 'dots', 'aria-label': `Step ${si + 1} of ${lesson.steps.length}` },
          lesson.steps.map((_, i) => h('i', { class: i === si ? 'now' : stepDone(ui.li, i) ? 'on' : '' })))),
      h('span', { class: 'xp-pill', 'aria-label': `${P.xp} XP` }, `${P.xp} XP`));

    const intro = si === 0 ? h('section', { class: 'intro', 'aria-label': "Today's idea" },
      h('span', { class: 'eyebrow' }, "Today's idea"),
      h('p', { style: 'font-size:18px' }, fmt(lesson.idea)),
      h('div', { class: 'bridge' }, h('b', null, 'If you know Power Automate'), fmt(lesson.bridge))) : null;

    const body = [];
    const feedback = [];
    if (isQuiz) {
      if (step.code) body.push(h('pre', { class: 'code-read', 'aria-label': 'Code' }, highlight(step.code)));
      body.push(h('div', { class: 'options', role: 'group', 'aria-label': 'Answers' }, step.options.map((o, i) => {
        const right = (st.passed || (done && st.choice === null)) && i === step.answer;
        const wrong = st.wrong.includes(i) && !right;
        return h('button', { class: 'opt' + (right ? ' right' : wrong ? ' wrong' : ''), type: 'button', 'aria-pressed': right || wrong ? 'true' : 'false', onclick: () => choose(i) },
          h('span', { class: 'opt-key' }, 'ABC'[i]), h('span', { class: step.code ? 'opt-text' : '' }, o));
      })));
      if (st.passed || (done && st.choice === null)) {
        feedback.push(h('div', { class: 'panel good', id: 'feedback', role: 'status' },
          h('div', { class: 'good-head' }, icon('check'), 'Right', st.gained ? h('span', { class: 'xp-gain' }, `+${st.gained} XP`) : null),
          h('p', null, fmt(step.explain))));
      } else if (st.wrong.length) {
        feedback.push(h('div', { class: 'panel nope', id: 'feedback', role: 'status' }, h('p', null, 'Not quite. Have another look and try a different answer.')));
      }
    } else {
      body.push(...buildEditor(st, ui.li, si, runCurrent));
      const res = st.result;
      if (res) {
        if (res.notes && res.notes.includes('quotes')) body.push(h('p', { class: 'note' }, 'Your phone typed curly quotes, so they were changed to straight quotes. Python only reads straight quotes.'));
        if (res.output || !res.error) {
          body.push(h('div', { class: 'panel out', id: 'output', 'aria-live': 'polite' },
            h('span', { class: 'label' }, 'Output'),
            res.output ? h('pre', null, res.output.replace(/\n$/, '')) : h('span', { class: 'empty' }, 'Nothing was printed.')));
        }
        if (res.error) {
          const ep = errorPanel(res.error);
          if (!res.output) ep.id = 'output';
          body.push(ep);
        }
        const v = st.verdict;
        if (v && v.ok) {
          feedback.push(h('div', { class: 'panel good', id: 'feedback', role: 'status' },
            h('div', { class: 'good-head' }, icon('check'), step.type === 'error' ? 'That is the error' : 'That works', st.gained ? h('span', { class: 'xp-gain' }, `+${st.gained} XP`) : null),
            h('p', null, fmt(step.explain))));
        } else if (v && v.reason !== 'error') {
          const box = h('div', { class: 'panel nope', id: 'feedback', role: 'status' }, h('p', null, v.message || 'Not yet.'));
          if (v.reason === 'output') box.append(h('div', { class: 'compare' },
            h('div', null, h('span', { class: 'label' }, 'Your output'), h('pre', null, v.got || ' ')),
            h('div', null, h('span', { class: 'label' }, 'Expected'), h('pre', null, v.expected))));
          feedback.push(box);
        }
      } else if (done) {
        feedback.push(h('p', { class: 'chip-row' }, h('span', { class: 'chip soft' }, 'Done before'), h('span', { class: 'muted', style: 'font-size:15px' }, 'Run it again any time, or go to the next step.')));
      }
    }

    const hints = [];
    if (!isQuiz && step.hints) {
      for (let i = 0; i < Math.min(st.hint, step.hints.length); i++) hints.push(h('div', { class: 'hint' }, icon('bulb'), h('span', null, fmt(step.hints[i]))));
    }
    const tools = [];
    if (!isQuiz) {
      if (step.solution && st.hint >= (step.hints || []).length && !st.passed) {
        tools.push(h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => { st.code = step.solution; clearDraft(ui.li, si); saveDraft(ui.li, si, st.code); renderLesson(); toast('Answer filled in. Read it, then tap Run.'); } }, icon('eye'), 'Show answer'));
      }
      if (st.code !== (step.code || '')) {
        tools.push(h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => { st.code = step.code || ''; st.result = null; st.verdict = null; clearDraft(ui.li, si); renderLesson(); } }, icon('reset'), 'Start over'));
      }
    }

    let ai = null;
    if (!isQuiz && sample && !aiOff) {
      ai = h('div', { class: 'panel ai', 'aria-label': 'Ask Claude' },
        h('div', { class: 'row' },
          h('span', { class: 'label grow' }, 'Ask Claude'),
          h('button', { class: 'btn-link', id: 'ai-stop', type: 'button', hidden: true, onclick: () => { if (st.ai && st.ai.ctl) st.ai.ctl.abort(); } }, 'Stop')),
        h('div', { class: 'tools' },
          st.result && st.result.error ? h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => askClaude('explain') }, icon('chat'), 'Explain this error') : null,
          h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: () => askClaude('hint') }, icon('chat'), st.result && !st.result.error && !st.passed ? 'Why is it not right?' : 'Give me a hint')),
        h('div', { class: 'ai-out', id: 'ai-out', 'aria-live': 'polite' }),
        h('span', { class: 'ai-small' }, 'Uses your Claude account. Sends only this step and your code.'));
    }

    const actions = [];
    if (isQuiz) {
      actions.push(h('button', { class: 'btn btn-primary', type: 'button', disabled: !(st.passed || done), onclick: nextStep }, isLast ? `Finish Day ${lesson.day}` : 'Next step', icon('next')));
    } else if (st.passed || done) {
      actions.push(h('button', { class: 'btn btn-ghost', type: 'button', onclick: runCurrent }, icon('play'), 'Run'));
      actions.push(h('button', { class: 'btn btn-primary', type: 'button', onclick: nextStep }, isLast ? `Finish Day ${lesson.day}` : 'Next step', icon('next')));
    } else {
      if (step.hints && st.hint < step.hints.length) {
        actions.push(h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { st.hint++; renderLesson(); const hs = document.querySelectorAll('.hint'); if (hs.length) hs[hs.length - 1].scrollIntoView({ block: 'nearest' }); } }, icon('bulb'), 'Hint'));
      }
      actions.push(h('button', { class: 'btn btn-primary', type: 'button', onclick: runCurrent }, icon('play'), 'Run'));
    }

    app.replaceChildren(...[
      header,
      intro,
      h('section', { class: 'step', 'aria-label': `Step ${si + 1}` },
        h('div', { class: 'chip-row' }, h('span', { class: 'chip' }, TYPE_LABEL[step.type] || 'Step'), h('span', { class: 'muted', style: 'font-size:15px' }, `Step ${si + 1} of ${lesson.steps.length}`)),
        h('h2', null, step.title),
        h('p', { class: 'step-text' }, fmt(step.text)),
        body,
        hints.length ? h('div', { class: 'hints' }, hints) : null,
        feedback,
        tools.length ? h('div', { class: 'tools' }, tools) : null,
        ai),
      h('div', { class: 'actionbar' }, actions),
    ].filter(Boolean));
    paintAI();
  }

  // ------------------------------------------------------------ finish
  function renderFinish() {
    const lesson = LESSONS[ui.li];
    const next = LESSONS[ui.li + 1];
    const svg = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const mark = h('div', { class: 'finish-mark', 'aria-hidden': 'true' });
    mark.innerHTML = svg;
    app.replaceChildren(h('section', { class: 'finish', 'aria-label': 'Day complete' },
      mark,
      h('p', { class: 'eyebrow' }, `Day ${lesson.day} complete`),
      h('h1', null, lesson.title),
      h('div', { class: 'finish-stats' },
        h('div', null, h('strong', null, `+${ui.sessionXp}`), h('span', null, 'XP this lesson')),
        h('div', null, h('strong', null, String(streakNow())), h('span', null, streakNow() === 1 ? 'day streak' : 'day streak')),
        h('div', null, h('strong', null, String(level())), h('span', null, 'level'))),
      ui.newBadges.length ? h('p', null, 'New badge: ', h('strong', null, ui.newBadges.map((b) => b.name).join(', '))) : null,
      next ? h('p', { class: 'muted' }, `Next up: Day ${next.day}, ${next.title}. Coming back tomorrow keeps your streak going.`) : h('p', { class: 'muted' }, 'That was the last lesson of Week 1. Ask Claude in chat to add Week 2.'),
      next ? h('button', { class: 'btn btn-primary', type: 'button', onclick: () => go('#day-' + next.day) }, `Start Day ${next.day} now`, icon('next')) : null,
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => go('') }, 'Back to your path')));
  }

  // ------------------------------------------------------------ start
  window.addEventListener('hashchange', route);
  route();
  initCloud();
  initSample();
})();
