(() => {
  'use strict';

  const SAVE_KEY = 'football-player-career-save-v1';
  const TEAMS = [
    { name: 'Jakarta United U21', short: 'JKT', strength: 62 },
    { name: 'Bandung City', short: 'BDG', strength: 60 },
    { name: 'Makassar FC', short: 'MKS', strength: 61 },
    { name: 'Bali Athletic', short: 'BAL', strength: 63 },
    { name: 'Semarang Rovers', short: 'SMG', strength: 58 },
    { name: 'Medan Sportif', short: 'MDN', strength: 59 }
  ];
  const POSITIONS = {
    ST: { label: 'Striker', stats: { pace: 64, finishing: 68, passing: 43, dribbling: 57, defending: 25, stamina: 60 } },
    LW: { label: 'Left Winger', stats: { pace: 70, finishing: 55, passing: 55, dribbling: 68, defending: 29, stamina: 61 } },
    RW: { label: 'Right Winger', stats: { pace: 71, finishing: 56, passing: 54, dribbling: 68, defending: 29, stamina: 61 } },
    CAM: { label: 'Attacking Midfielder', stats: { pace: 58, finishing: 55, passing: 68, dribbling: 66, defending: 34, stamina: 62 } },
    CM: { label: 'Central Midfielder', stats: { pace: 57, finishing: 44, passing: 64, dribbling: 57, defending: 57, stamina: 68 } },
    CDM: { label: 'Defensive Midfielder', stats: { pace: 55, finishing: 36, passing: 57, dribbling: 48, defending: 68, stamina: 69 } },
    CB: { label: 'Centre Back', stats: { pace: 54, finishing: 25, passing: 44, dribbling: 35, defending: 71, stamina: 66 } },
    LB: { label: 'Left Back', stats: { pace: 65, finishing: 36, passing: 51, dribbling: 52, defending: 64, stamina: 69 } },
    RB: { label: 'Right Back', stats: { pace: 65, finishing: 36, passing: 51, dribbling: 52, defending: 64, stamina: 69 } },
    GK: { label: 'Goalkeeper', stats: { pace: 42, finishing: 15, passing: 48, dribbling: 24, defending: 68, stamina: 61 } }
  };
  const SKINS = ['#f1c6a5', '#d99f79', '#b97855', '#8e573f'];
  const HAIRS = [
    { name: 'Hitam', color: '#1c201f' },
    { name: 'Cokelat', color: '#573726' },
    { name: 'Pirang', color: '#b88b45' },
    { name: 'Abu gelap', color: '#60676a' }
  ];
  const HAIR_PATHS = [
    'M27 64 Q18 23 58 16 Q94 12 95 52 L87 43 Q78 27 61 32 Q43 26 31 48 Z',
    'M26 61 Q20 20 59 15 Q94 17 91 56 Q82 38 69 39 Q49 48 31 69 Z',
    'M28 57 Q24 21 58 17 Q91 15 94 53 L82 35 Q62 24 45 38 L32 62 Z',
    'M25 62 Q19 25 54 15 Q89 10 96 48 L87 64 L80 43 Q64 50 48 40 Q38 48 31 68 Z'
  ];

  let state = loadState();
  let toastTimer = null;
  const view = document.getElementById('view');
  const toast = document.getElementById('toast');

  function newState() {
    return {
      player: null,
      day: 1,
      energy: 100,
      season: '2026 / 27',
      nextFixture: 0,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      teamGoals: 0,
      teamConceded: 0,
      history: [],
      match: null,
      lastScreen: 'home'
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return newState();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return newState();
      return { ...newState(), ...parsed };
    } catch (error) {
      console.warn('Save game tidak dapat dibaca:', error);
      return newState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      updateTopbar();
    } catch (error) {
      console.warn('Save game gagal:', error);
      showToast('Penyimpanan perangkat gagal. Periksa ruang penyimpanan browser.');
    }
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function random(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function overall(stats) {
    const weights = { pace: .17, finishing: .18, passing: .17, dribbling: .17, defending: .15, stamina: .16 };
    return Math.round(Object.keys(weights).reduce((sum, key) => sum + stats[key] * weights[key], 0));
  }
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || '?';
  }
  function positionLabel(code) { return POSITIONS[code]?.label || code; }

  function portrait(player, extraClass = '') {
    const skin = SKINS[player?.skin ?? 0] || SKINS[0];
    const hair = HAIRS[player?.hair ?? 0] || HAIRS[0];
    const hairPath = HAIR_PATHS[player?.hair ?? 0] || HAIR_PATHS[0];
    const shirt = player?.shirt || '#b4f36a';
    const eyeColor = '#202522';
    return `<div class="player-art ${extraClass}"><svg viewBox="0 0 120 150" role="img" aria-label="Ilustrasi pemain sepak bola bergaya anime pada wajah">
      <defs><linearGradient id="shirt-grad" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${shirt}"/><stop offset="1" stop-color="#6da943"/></linearGradient></defs>
      <ellipse cx="60" cy="143" rx="39" ry="5" fill="#030a06" opacity=".35"/>
      <path d="M31 109 Q35 92 48 89 L72 89 Q86 92 90 109 L102 145 H18 Z" fill="url(#shirt-grad)"/>
      <path d="M48 89 L60 104 L72 89 L68 83 H52 Z" fill="#d6a889"/>
      <path d="M39 113 L48 99 L60 112 L72 99 L82 113 L77 145 H43 Z" fill="rgba(255,255,255,.08)"/>
      <path d="M53 112 L60 120 L67 112" fill="none" stroke="rgba(20,45,25,.55)" stroke-width="2"/>
      <rect x="56" y="107" width="8" height="15" rx="3" fill="rgba(17,40,23,.42)"/>
      <path d="M37 58 Q36 32 60 29 Q84 31 83 59 L79 82 Q74 96 60 96 Q46 96 41 82 Z" fill="${skin}"/>
      <path d="M37 59 Q28 56 31 70 Q34 79 42 77 L40 63 Z M83 59 Q92 56 89 70 Q86 79 78 77 L80 63 Z" fill="${skin}"/>
      <path d="${hairPath}" fill="${hair.color}"/>
      <path d="M42 63 Q49 57 56 62" fill="none" stroke="${eyeColor}" stroke-width="2" stroke-linecap="round"/>
      <path d="M64 62 Q72 57 79 63" fill="none" stroke="${eyeColor}" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="49" cy="69" rx="5.3" ry="7" fill="#fff"/><ellipse cx="71" cy="69" rx="5.3" ry="7" fill="#fff"/>
      <ellipse cx="50" cy="70" rx="3.1" ry="5" fill="#3a5c4c"/><ellipse cx="70" cy="70" rx="3.1" ry="5" fill="#3a5c4c"/>
      <circle cx="51" cy="68" r="1.4" fill="#fff"/><circle cx="71" cy="68" r="1.4" fill="#fff"/>
      <path d="M59 70 L57 79 Q60 82 63 79" fill="none" stroke="#9e6d59" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M53 86 Q60 91 68 86" fill="none" stroke="#8f5149" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M38 80 Q42 87 48 88 M82 80 Q78 87 72 88" fill="none" stroke="rgba(157,94,70,.25)" stroke-width="2"/>
      <path d="M45 44 Q59 37 75 43" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="2"/>
      <path d="M24 145 L96 145" stroke="rgba(255,255,255,.12)" stroke-width="1"/>
    </svg></div>`;
  }

  function updateTopbar() {
    const player = state.player;
    const energy = document.getElementById('topEnergy');
    const date = document.getElementById('topDate');
    const avatar = document.getElementById('topAvatar');
    const club = document.getElementById('sideClub');
    const season = document.getElementById('sideSeason');
    if (energy) energy.textContent = `${Math.round(state.energy)}%`;
    if (date) date.textContent = `Hari ${state.day} · ${state.day < 8 ? 'Pra-musim' : 'Musim berjalan'}`;
    if (avatar) avatar.textContent = player ? initials(player.name) : '?';
    if (club) club.textContent = player?.club || 'Akademi Surabaya';
    if (season) season.textContent = state.season;
    const competition = document.getElementById('topCompetition');
    if (competition) competition.textContent = player ? `${player.club.toUpperCase()} · U21 DEVELOPMENT LEAGUE` : 'PLAYER DEVELOPMENT MODE';
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function go(screen) {
    if (!state.player && screen !== 'home') screen = 'home';
    if (state.match?.status === 'playing' && screen !== 'matches') {
      showToast('Selesaikan pertandingan dulu sebelum pindah menu.');
      return;
    }
    state.lastScreen = screen;
    document.querySelectorAll('[data-screen]').forEach(button => button.classList.toggle('active', button.dataset.screen === screen));
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('.content')?.focus({ preventScroll: true });
  }

  function render() {
    updateTopbar();
    if (!state.player) {
      renderCreator();
      document.querySelectorAll('[data-screen]').forEach(button => button.classList.toggle('active', button.dataset.screen === 'home'));
      return;
    }
    const screen = state.match?.status === 'playing' ? 'matches' : (state.lastScreen || 'home');
    document.querySelectorAll('[data-screen]').forEach(button => button.classList.toggle('active', button.dataset.screen === screen));
    if (screen === 'training') renderTraining();
    else if (screen === 'matches') renderMatches();
    else if (screen === 'profile') renderProfile();
    else renderHome();
  }

  function renderCreator() {
    view.innerHTML = `
      <section class="empty-state">
        <span class="pill">● MULAI PERJALANANMU</span>
        <h1>Setiap pemain punya <span style="color:var(--green)">cerita.</span></h1>
        <p>Buat pemainmu, pilih posisi, dan mulai dari akademi. Kembangkan kemampuan lewat latihan, dapatkan menit bermain, lalu kejar tempat di tim utama.</p>
        <div class="creator-layout">
          <form class="form-card" id="creatorForm">
            <div class="section-row" style="margin-top:0"><h2>Profil pemain</h2><span>LANGKAH 01 / 01</span></div>
            <div class="form-grid">
              <div class="field full"><label for="playerName">Nama pemain</label><input id="playerName" name="name" maxlength="22" placeholder="Contoh: Arka Pratama" required autocomplete="off"></div>
              <div class="field"><label for="position">Posisi utama</label><select id="position" name="position">${Object.entries(POSITIONS).map(([code, pos]) => `<option value="${code}">${code} · ${pos.label}</option>`).join('')}</select></div>
              <div class="field"><label for="age">Usia</label><input id="age" name="age" type="number" min="16" max="24" value="18" required></div>
              <div class="field"><label for="height">Tinggi badan (cm)</label><input id="height" name="height" type="number" min="150" max="205" value="175" required></div>
              <div class="field"><label for="foot">Kaki dominan</label><select id="foot" name="foot"><option value="Kanan">Kanan</option><option value="Kiri">Kiri</option></select></div>
              <div class="field"><label>Warna kulit</label><div class="segmented" id="skinChoices">${SKINS.map((skin, i) => `<button type="button" data-skin="${i}" class="${i === 1 ? 'selected' : ''}" aria-label="Warna kulit ${i+1}" style="width:32px;height:31px;padding:0"><span style="display:block;width:15px;height:15px;border-radius:50%;background:${skin};margin:auto"></span></button>`).join('')}</div></div>
              <div class="field"><label>Warna rambut</label><select id="hair" name="hair">${HAIRS.map((hair, i) => `<option value="${i}">${hair.name}</option>`).join('')}</select></div>
              <div class="field full"><div class="notice">Gaya visual: wajah bergaya anime, sementara proporsi tubuh, seragam, lapangan, dan gameplay tetap bergaya sepak bola 3D yang natural.</div></div>
              <div class="field full"><button class="btn btn-primary" type="submit">BUAT PEMAIN & MULAI KARIER ↗</button><span class="hint">Progres awal disimpan otomatis di browser/perangkat ini. Sinkronisasi cloud belum diaktifkan.</span></div>
            </div>
          </form>
          <aside class="preview-card">
            <span class="eyebrow">PREVIEW KARAKTER</span>
            <div id="creatorPortrait">${portrait({ skin: 1, hair: 0, shirt: '#b4f36a' })}</div>
            <h3 id="creatorPreviewName">Pemain Baru</h3>
            <p id="creatorPreviewPosition">ST · Striker</p>
            <div class="preview-note">Ilustrasi karakter sementara. Bentuk wajah anime hanya diterapkan pada area wajah.</div>
          </aside>
        </div>
      </section>`;
    let skinIndex = 1;
    const updatePreview = () => {
      const fake = {
        name: document.getElementById('playerName').value.trim() || 'Pemain Baru',
        position: document.getElementById('position').value,
        skin: skinIndex,
        hair: Number(document.getElementById('hair').value),
        shirt: '#b4f36a'
      };
      document.getElementById('creatorPortrait').innerHTML = portrait(fake);
      document.getElementById('creatorPreviewName').textContent = fake.name;
      document.getElementById('creatorPreviewPosition').textContent = `${fake.position} · ${positionLabel(fake.position)}`;
    };
    document.getElementById('skinChoices').addEventListener('click', event => {
      const button = event.target.closest('[data-skin]');
      if (!button) return;
      skinIndex = Number(button.dataset.skin);
      document.querySelectorAll('[data-skin]').forEach(el => el.classList.toggle('selected', el === button));
      updatePreview();
    });
    ['playerName', 'position', 'hair'].forEach(id => document.getElementById(id).addEventListener('input', updatePreview));
    document.getElementById('creatorForm').addEventListener('submit', event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const name = String(form.get('name') || '').trim();
      const position = String(form.get('position'));
      const age = Number(form.get('age'));
      const height = Number(form.get('height'));
      if (!name || !POSITIONS[position] || age < 16 || age > 24 || height < 150 || height > 205) {
        showToast('Periksa kembali data pemainmu.');
        return;
      }
      state.player = {
        name, position, age, height,
        foot: String(form.get('foot')),
        skin: skinIndex,
        hair: Number(form.get('hair')),
        shirt: '#b4f36a',
        club: 'Akademi Surabaya',
        level: 1,
        xp: 0,
        xpNext: 100,
        rating: 0,
        appearances: 0,
        goals: 0,
        assists: 0,
        motm: 0,
        stats: { ...POSITIONS[position].stats }
      };
      state.lastScreen = 'home';
      saveState();
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Karier dimulai. Selamat datang di Akademi Surabaya!');
    });
  }

  function renderHome() {
    const p = state.player;
    const next = TEAMS[state.nextFixture % TEAMS.length];
    const rating = p.rating ? p.rating.toFixed(1) : '—';
    const formLabel = state.matchesPlayed ? `${state.wins}M ${state.draws}S ${state.losses}K` : 'Belum ada laga';
    view.innerHTML = `
      <div class="page-head"><div><span class="eyebrow">DASHBOARD PEMAIN</span><h1>Selamat datang, ${esc(p.name.split(' ')[0])}.</h1><p>Jalani latihan, ambil kesempatan bermain, dan terus berkembang.</p></div><span class="pill">● KARIER AKTIF</span></div>
      <section class="grid dashboard-grid">
        <div class="hero-card"><div class="hero-copy"><span class="eyebrow">LANGKAH BERIKUTNYA</span><h2>Perjalanan menuju tim utama dimulai di sini.</h2><p>Jaga kondisi, tingkatkan atribut, dan tunjukkan kualitasmu saat pertandingan berikutnya.</p><div class="hero-actions"><button class="btn btn-primary" data-action="play-match">LIHAT PERTANDINGAN ↗</button><button class="btn btn-secondary" data-action="go-training">LATIHAN HARI INI</button></div></div></div>
        <div class="quick-profile">${portrait(p)}<h3>${esc(p.name)}</h3><span class="sub">${p.position} · ${positionLabel(p.position)}</span><div class="rating-big">${overall(p.stats)} <small>OVR</small></div><span class="sub">Level ${p.level} · ${esc(p.club)}</span></div>
      </section>
      <section class="grid stats-row">
        <div class="stat-card"><span>PERTANDINGAN</span><strong>${p.appearances}</strong><em>Penampilan</em></div>
        <div class="stat-card"><span>GOL</span><strong>${p.goals}</strong><em>Karier</em></div>
        <div class="stat-card"><span>ASSIST</span><strong>${p.assists}</strong><em>Karier</em></div>
        <div class="stat-card"><span>RATING RATA-RATA</span><strong>${rating}</strong><em>${p.motm} × pemain terbaik</em></div>
      </section>
      <section class="grid dashboard-grid">
        <div>
          <div class="section-row"><h2>Pertandingan berikutnya</h2><span>U21 DEVELOPMENT LEAGUE</span></div>
          <div class="fixture-card"><div class="team"><div class="team-badge">AS</div><strong>Akademi Surabaya</strong><small>Kandang</small></div><div class="vs">VS</div><div class="team"><div class="team-badge">${next.short}</div><strong>${next.name}</strong><small>Tandang</small></div><div class="fixture-info">${state.matchesPlayed + 1} / 18<strong>JADWAL LIGA</strong>90 menit</div><div class="fixture-action"><button class="btn btn-primary" data-action="play-match">MASUK LAPANGAN ↗</button></div></div>
          <div class="section-row"><h2>Perkembangan pemain</h2><span>LEVEL ${p.level}</span></div>
          <div class="mini-panel"><div class="xp-wrap"><div class="xp-label"><span>Experience points</span><b>${p.xp} / ${p.xpNext} XP</b></div><div class="progress"><i style="width:${clamp(p.xp / p.xpNext * 100,0,100)}%"></i></div></div><div class="row-between"><span class="muted">Overall rating saat ini</span><strong style="color:var(--green);font:700 18px 'Space Grotesk'">${overall(p.stats)}</strong></div></div>
        </div>
        <div class="side-stack">
          <div class="mini-panel"><h3>KONDISI FISIK</h3><div class="progress-label"><span>Energi</span><b>${Math.round(state.energy)}%</b></div><div class="progress"><i style="width:${state.energy}%"></i></div><div class="progress-label"><span>Stamina</span><b>${p.stats.stamina}</b></div><div class="progress"><i style="width:${p.stats.stamina}%"></i></div><button class="btn btn-secondary" style="width:100%;margin-top:15px" data-action="rest">ISTIRAHAT & PULIHKAN</button></div>
          <div class="mini-panel"><h3>HASIL TERAKHIR</h3><ul class="list-clean">${state.history.length ? state.history.slice(0,3).map(item => `<li><i class="dot"></i><span><b>${esc(item.score)}</b> vs ${esc(item.opponent)}<br><span class="muted">${esc(item.result)} · Rating ${item.rating.toFixed(1)}</span></span></li>`).join('') : '<li><i class="dot"></i><span>Belum ada pertandingan. Laga pertamamu menunggu.</span></li>'}</ul></div>
        </div>
      </section>`;
  }

  const TRAINING = [
    { id: 'finishing', icon: '◎', title: 'Finishing', desc: 'Latih akurasi dan ketenangan saat berada di depan gawang.', primary: 'finishing', secondary: 'dribbling', cost: 18 },
    { id: 'pace', icon: '↗', title: 'Speed & Agility', desc: 'Tingkatkan kecepatan, akselerasi, dan pergerakan tanpa bola.', primary: 'pace', secondary: 'stamina', cost: 18 },
    { id: 'playmaking', icon: '⌁', title: 'Playmaking', desc: 'Asah visi, umpan, dan kemampuan membaca ruang.', primary: 'passing', secondary: 'dribbling', cost: 18 },
    { id: 'dribbling', icon: '◉', title: 'Ball Control', desc: 'Kontrol bola, sentuhan pertama, dan kemampuan melewati lawan.', primary: 'dribbling', secondary: 'pace', cost: 18 },
    { id: 'defending', icon: '⬡', title: 'Defending', desc: 'Perbaiki positioning, duel, dan intersep bola.', primary: 'defending', secondary: 'stamina', cost: 18 },
    { id: 'stamina', icon: 'ϟ', title: 'Endurance', desc: 'Bangun daya tahan agar tetap konsisten sepanjang laga.', primary: 'stamina', secondary: 'pace', cost: 18 }
  ];

  function renderTraining() {
    const p = state.player;
    view.innerHTML = `
      <div class="page-head"><div><span class="eyebrow">PLAYER DEVELOPMENT</span><h1>Waktunya berkembang.</h1><p>Latihan meningkatkan atribut, tetapi menguras energi. Atur intensitasmu.</p></div><span class="pill">⚡ ${Math.round(state.energy)}% ENERGI</span></div>
      <section class="grid two-col">
        <div><div class="section-row" style="margin-top:0"><h2>Pilih sesi latihan</h2><span>BIAYA 18 ENERGI / SESI</span></div><div class="grid training-grid">${TRAINING.map(item => `<article class="training-card"><div class="training-icon">${item.icon}</div><h3>${item.title}</h3><p>${item.desc}</p><div class="bottom"><small>+1–2 ${item.primary.toUpperCase()}</small><button class="btn btn-secondary" data-action="train" data-training="${item.id}" ${state.energy < item.cost ? 'disabled' : ''}>MULAI ↗</button></div></article>`).join('')}</div></div>
        <div class="side-stack"><div class="mini-panel"><h3>STATUS LATIHAN</h3><div class="progress-label"><span>Energi saat ini</span><b>${Math.round(state.energy)}%</b></div><div class="progress"><i style="width:${state.energy}%"></i></div><div class="row-between" style="margin-top:18px"><span class="muted">Overall</span><strong class="badge-stat">${overall(p.stats)}</strong></div><div class="row-between" style="margin-top:12px"><span class="muted">Level</span><strong>${p.level}</strong></div><div class="row-between" style="margin-top:12px"><span class="muted">XP</span><strong>${p.xp} / ${p.xpNext}</strong></div><button class="btn btn-primary" style="width:100%;margin-top:18px" data-action="rest">ISTIRAHAT +32 ENERGI</button></div><div class="notice">Tips: sesuaikan latihan dengan posisi. Striker akan lebih terbantu oleh finishing, sedangkan bek tengah perlu memprioritaskan defending dan stamina.</div><div class="mini-panel"><h3>ATRIBUT UTAMA</h3>${['pace','finishing','passing','dribbling','defending','stamina'].map(key => `<div class="progress-label"><span>${key.toUpperCase()}</span><b>${p.stats[key]}</b></div><div class="progress"><i style="width:${p.stats[key]}%"></i></div>`).join('')}</div></div>
      </section>`;
  }

  function addXp(amount) {
    const p = state.player;
    p.xp += amount;
    let levelUps = 0;
    while (p.xp >= p.xpNext) {
      p.xp -= p.xpNext;
      p.level += 1;
      p.xpNext = Math.round(p.xpNext * 1.24);
      levelUps += 1;
    }
    if (levelUps) showToast(`Naik level! Sekarang level ${p.level}.`);
  }

  function train(id) {
    const item = TRAINING.find(entry => entry.id === id);
    if (!item) return;
    if (state.energy < item.cost) { showToast('Energi belum cukup. Istirahat dulu.'); return; }
    const p = state.player;
    const increase = random(1, 2);
    p.stats[item.primary] = clamp(p.stats[item.primary] + increase, 1, 99);
    if (Math.random() < .35) p.stats[item.secondary] = clamp(p.stats[item.secondary] + 1, 1, 99);
    state.energy -= item.cost;
    addXp(18);
    saveState();
    renderTraining();
    showToast(`${item.title}: ${item.primary} +${increase}.`);
  }

  function rest() {
    if (state.energy >= 100) { showToast('Energi sudah penuh.'); return; }
    const before = state.energy;
    state.energy = clamp(state.energy + 32, 0, 100);
    state.day += 1;
    saveState();
    render();
    showToast(`Istirahat selesai. Energi +${Math.round(state.energy - before)}%.`);
  }

  function startMatch() {
    if (state.energy < 12) { showToast('Energi terlalu rendah untuk bertanding. Istirahat dulu.'); return; }
    const opponent = TEAMS[state.nextFixture % TEAMS.length];
    state.match = {
      opponent: opponent.name,
      opponentShort: opponent.short,
      opponentStrength: opponent.strength,
      minute: 0,
      userScore: 0,
      opponentScore: 0,
      possession: 'player',
      zone: 'middle',
      createdChance: false,
      goals: 0,
      assists: 0,
      shots: 0,
      keyActions: 0,
      events: ['Kick-off! Akademi Surabaya memulai pertandingan.'],
      status: 'playing',
      startedDay: state.day
    };
    state.energy = clamp(state.energy - 8, 0, 100);
    state.lastScreen = 'matches';
    saveState();
    renderMatches();
  }

  function addEvent(message) {
    const m = state.match;
    m.events.unshift(message);
    m.events = m.events.slice(0, 5);
  }

  function moveClock() {
    const m = state.match;
    m.minute = Math.min(90, m.minute + random(8, 13));
  }

  function handOverBall() {
    const m = state.match;
    m.possession = 'opponent';
    m.zone = 'middle';
    m.createdChance = false;
    if (m.minute >= 90) finishMatch();
    saveState();
    renderMatches();
  }

  function finishMatch() {
    const m = state.match;
    if (!m || m.status !== 'playing') return;
    m.minute = 90;
    m.status = 'finished';
    const result = m.userScore > m.opponentScore ? 'MENANG' : m.userScore < m.opponentScore ? 'KALAH' : 'IMBANG';
    const p = state.player;
    const base = 6.1 + m.keyActions * .18 + m.goals * .65 + m.assists * .42 + (result === 'MENANG' ? .35 : result === 'KALAH' ? -.15 : .05);
    const matchRating = clamp(base + (Math.random() * .35 - .17), 5.2, 10).toFixed(1) * 1;
    p.appearances += 1;
    p.goals += m.goals;
    p.assists += m.assists;
    if (matchRating >= 8.5) p.motm += 1;
    p.rating = p.rating ? Number((((p.rating * (p.appearances - 1)) + matchRating) / p.appearances).toFixed(1)) : matchRating;
    state.matchesPlayed += 1;
    state.teamGoals += m.userScore;
    state.teamConceded += m.opponentScore;
    if (result === 'MENANG') state.wins += 1;
    else if (result === 'KALAH') state.losses += 1;
    else state.draws += 1;
    addXp(35 + m.goals * 20 + m.assists * 12 + (result === 'MENANG' ? 12 : 0));
    state.energy = clamp(state.energy - 18, 0, 100);
    state.history.unshift({ opponent: m.opponent, score: `${m.userScore}–${m.opponentScore}`, result, rating: matchRating, day: state.day });
    state.history = state.history.slice(0, 12);
    state.nextFixture += 1;
    saveState();
  }

  function opponentMove() {
    const m = state.match;
    const p = state.player;
    moveClock();
    const defensivePower = (p.stats.defending * .55 + p.stats.stamina * .25 + p.stats.pace * .20) / 100;
    const chance = clamp(.22 - defensivePower * .12 + (m.opponentStrength - overall(p.stats)) * .003, .045, .22);
    if (Math.random() < chance) {
      m.opponentScore += 1;
      addEvent(`${m.minute}' Gol untuk ${m.opponent}. Lawan berhasil memanfaatkan ruang.`);
    } else {
      addEvent(`${m.minute}' Pertahanan bertahan. Bola berhasil direbut kembali.`);
    }
    m.possession = 'player';
    m.zone = Math.random() < .35 ? 'attacking' : 'middle';
    m.createdChance = false;
    if (m.minute >= 90) finishMatch();
    saveState();
    renderMatches();
  }

  function playerAction(action) {
    const m = state.match;
    const p = state.player;
    if (!m || m.status !== 'playing') return;
    if (m.possession === 'player') {
      const fatigue = (100 - state.energy) / 500;
      if (action === 'pass') {
        const success = Math.random() < clamp(.53 + p.stats.passing * .004 - fatigue, .45, .88);
        moveClock();
        if (success) {
          m.zone = m.zone === 'middle' ? 'attacking' : 'box';
          m.createdChance = true;
          m.keyActions += 1;
          addEvent(`${m.minute}' Umpan progresif berhasil. Serangan bergerak ke depan.`);
        } else {
          addEvent(`${m.minute}' Umpan dipotong lawan. Mereka mulai melakukan serangan balik.`);
          handOverBall();
          return;
        }
      } else if (action === 'dribble') {
        const difficulty = m.zone === 'box' ? .13 : .04;
        const success = Math.random() < clamp(.36 + p.stats.dribbling * .004 + p.stats.pace * .0015 - difficulty - fatigue, .35, .88);
        moveClock();
        if (success) {
          m.zone = m.zone === 'middle' ? 'attacking' : 'box';
          m.keyActions += 1;
          addEvent(`${m.minute}' Dribel sukses! ${esc(p.name)} berhasil melewati penjagaan.`);
        } else {
          addEvent(`${m.minute}' Dribel dihentikan bek lawan. Penguasaan bola berpindah.`);
          handOverBall();
          return;
        }
      } else if (action === 'through') {
        const success = Math.random() < clamp(.30 + p.stats.passing * .0045 + p.stats.dribbling * .001 - fatigue, .3, .83);
        moveClock();
        if (success) {
          m.zone = 'box';
          m.createdChance = true;
          m.keyActions += 2;
          addEvent(`${m.minute}' Through ball membelah pertahanan! Peluang emas tercipta.`);
        } else {
          addEvent(`${m.minute}' Through ball terlalu kuat dan keluar dari jangkauan rekan.`);
          handOverBall();
          return;
        }
      } else if (action === 'shoot') {
        if (m.zone === 'middle') { showToast('Bangun serangan lebih dekat ke kotak penalti.'); return; }
        const zoneBonus = m.zone === 'box' ? .21 : .08;
        const chance = clamp(.015 + p.stats.finishing * .005 + zoneBonus - fatigue, .08, .78);
        moveClock();
        m.shots += 1;
        if (Math.random() < chance) {
          m.userScore += 1;
          m.goals += 1;
          if (m.createdChance) m.assists += 1;
          addEvent(`${m.minute}' GOOOL! ${esc(p.name)} menyelesaikan peluang dengan baik.`);
          m.zone = 'middle';
          m.createdChance = false;
          m.keyActions += 2;
        } else {
          addEvent(`${m.minute}' Tembakan belum menemui sasaran. Kiper lawan mengamankan bola.`);
          handOverBall();
          return;
        }
      }
      if (m.minute >= 90) finishMatch();
      else if (m.zone === 'box' && action !== 'shoot') addEvent('Peluang terbuka: kamu bisa mengirim umpan terobosan atau langsung menembak.');
    } else {
      const defense = p.stats.defending;
      const stamina = p.stats.stamina;
      const fatigue = (100 - state.energy) / 650;
      let recoveryChance = .38 + defense * .004 + stamina * .001 - fatigue;
      if (action === 'press') recoveryChance = .29 + p.stats.pace * .003 + stamina * .002 - fatigue;
      if (action === 'tackle') recoveryChance = .34 + defense * .005 - fatigue;
      if (action === 'cover') recoveryChance = .40 + defense * .003 + stamina * .0015 - fatigue;
      const success = Math.random() < clamp(recoveryChance, .32, .88);
      moveClock();
      if (success) {
        const successLine = action === 'press' ? 'Pressing terkoordinasi berhasil. Bola direbut.' : action === 'tackle' ? 'Duel berhasil dimenangkan. Bola kembali dikuasai.' : 'Jalur umpan ditutup. Kamu membaca permainan dengan baik.';
        addEvent(`${m.minute}' ${successLine}`);
        m.possession = 'player';
        m.zone = action === 'press' ? 'attacking' : 'middle';
        m.keyActions += 1;
      } else {
        const foul = action === 'tackle' && Math.random() < .12;
        addEvent(`${m.minute}' ${foul ? 'Pelanggaran terjadi saat duel. Lawan mendapat bola mati.' : 'Lawan lolos dari tekanan dan mempertahankan bola.'}`);
        const dangerChance = action === 'cover' ? .12 : action === 'press' ? .30 : .24;
        const danger = Math.random() < dangerChance;
        if (danger) {
          const concededChance = clamp(.12 + (m.opponentStrength - defense) * .005 + (foul ? .08 : 0), .06, .32);
          const conceded = Math.random() < concededChance;
          if (conceded) {
            m.opponentScore += 1;
            addEvent(`${m.minute}' Gol lawan setelah situasi berbahaya.`);
          } else addEvent(`${m.minute}' Ancaman berhasil digagalkan barisan pertahanan.`);
        }
        m.possession = 'player';
        m.zone = 'middle';
      }
    }
    if (m.minute >= 90) finishMatch();
    saveState();
    renderMatches();
  }

  function renderMatches() {
    const m = state.match;
    if (!m) {
      const next = TEAMS[state.nextFixture % TEAMS.length];
      view.innerHTML = `<div class="page-head"><div><span class="eyebrow">MATCH CENTRE</span><h1>Hari pertandingan.</h1><p>Ambil keputusan di lapangan dan bantu tim meraih hasil terbaik.</p></div><span class="pill">90 MENIT</span></div><div class="match-shell"><div class="match-scoreboard"><div class="score-team"><strong>AKADEMI SURABAYA</strong><small>KANDANG</small></div><div class="match-minute">JADWAL ${state.matchesPlayed + 1}<div class="score">VS</div></div><div class="score-team"><strong>${next.name.toUpperCase()}</strong><small>TANDANG</small></div></div><div class="match-finish"><h2>Siap masuk lapangan?</h2><p>Energi saat ini ${Math.round(state.energy)}%. Pertandingan menggunakan simulasi keputusan interaktif.</p><button class="btn btn-primary" data-action="start-match" ${state.energy < 12 ? 'disabled' : ''}>MULAI PERTANDINGAN ↗</button></div></div>`;
      return;
    }
    const finished = m.status === 'finished';
    const possessionText = m.possession === 'player' ? 'TIM KAMU MENGUASAI BOLA' : 'LAWAN MENGUASAI BOLA';
    const zoneLabel = { middle: 'AREA TENGAH', attacking: 'SEPERTIGA AKHIR', box: 'KOTAK PENALTI' }[m.zone];
    const actions = m.possession === 'player'
      ? `<button class="action-btn" data-action="match-action" data-choice="pass"><strong>⇢ Umpan</strong><small>Amankan penguasaan bola</small></button><button class="action-btn" data-action="match-action" data-choice="dribble"><strong>◉ Dribel</strong><small>Bawa bola melewati lawan</small></button><button class="action-btn" data-action="match-action" data-choice="through"><strong>⌁ Through ball</strong><small>Ciptakan peluang berbahaya</small></button><button class="action-btn" data-action="match-action" data-choice="shoot" ${m.zone === 'middle' ? 'disabled' : ''}><strong>◎ Tembak</strong><small>${m.zone === 'middle' ? 'Dekati kotak penalti dahulu' : 'Coba cetak gol'}</small></button>`
      : `<button class="action-btn" data-action="match-action" data-choice="press"><strong>↗ Pressing</strong><small>Tekan pemain yang membawa bola</small></button><button class="action-btn" data-action="match-action" data-choice="tackle"><strong>⬡ Rebut bola</strong><small>Coba hentikan serangan lawan</small></button><button class="action-btn" data-action="match-action" data-choice="cover"><strong>▱ Jaga ruang</strong><small>Tutup jalur serangan</small></button>`;
    view.innerHTML = `
      <div class="page-head"><div><span class="eyebrow">MATCH CENTRE · U21 DEVELOPMENT LEAGUE</span><h1>${finished ? 'Pertandingan selesai.' : 'Tunjukkan kualitasmu.'}</h1><p>${finished ? 'Evaluasi hasil pertandingan dan lanjutkan perkembangan pemain.' : possessionText}</p></div><span class="pill">${finished ? 'FULL TIME' : '● LIVE MATCH'}</span></div>
      <section class="match-shell">
        <div class="match-scoreboard"><div class="score-team"><strong>AKADEMI SURABAYA</strong><small>KANDANG</small></div><div class="match-minute">${finished ? 'FT' : `${m.minute}'`}<div class="score">${m.userScore} : ${m.opponentScore}</div></div><div class="score-team"><strong>${esc(m.opponent.toUpperCase())}</strong><small>TANDANG</small></div></div>
        ${finished ? renderMatchResult(m) : `<div class="match-body"><div class="pitch"><div class="center-circle"></div><div class="player-marker p1">${initials(state.player.name)}</div><div class="player-marker p2">9</div><div class="player-marker opp">DF</div><span class="pitch-zone">${zoneLabel}</span></div><div class="match-side"><div class="mini-panel"><div class="row-between"><span class="small-caps">SITUASI LAPANGAN</span><span class="pill" style="padding:5px 7px">${m.minute}' / 90'</span></div><h3 style="margin-top:12px">${possessionText}</h3><p class="muted">${m.possession === 'player' ? 'Pilih aksi berikutnya untuk membangun serangan.' : 'Pilih respons defensif untuk merebut kembali bola.'}</p><div class="progress" style="margin-top:12px"><i style="width:${m.minute / 90 * 100}%"></i></div></div><div class="match-log"><h3>LIVE COMMENTARY</h3><ul>${m.events.map(event => `<li>• ${event}</li>`).join('')}</ul></div></div></div><div class="match-actions"><h3>${m.possession === 'player' ? 'PILIH AKSI MENYERANG' : 'PILIH AKSI BERTAHAN'}</h3><div class="action-grid">${actions}</div></div>`}
      </section>`;
  }

  function renderMatchResult(m) {
    const result = m.userScore > m.opponentScore ? 'Kemenangan!' : m.userScore < m.opponentScore ? 'Kekalahan.' : 'Hasil imbang.';
    const last = state.history[0];
    return `<div class="match-finish"><span class="pill">${last?.result || 'SELESAI'}</span><h2>${result}</h2><p>${m.goals} gol · ${m.assists} assist · ${m.shots} tembakan · Rating ${last ? last.rating.toFixed(1) : '—'}</p><button class="btn btn-primary" data-action="finish-match">KEMBALI KE KARIER ↗</button></div>`;
  }

  function renderProfile() {
    const p = state.player;
    const attributes = [
      ['Pace', p.stats.pace], ['Finishing', p.stats.finishing], ['Passing', p.stats.passing],
      ['Dribbling', p.stats.dribbling], ['Defending', p.stats.defending], ['Stamina', p.stats.stamina]
    ];
    view.innerHTML = `
      <div class="page-head"><div><span class="eyebrow">PLAYER PROFILE</span><h1>Profil pemain.</h1><p>Identitas, performa, dan perkembangan kemampuanmu.</p></div><span class="pill">LEVEL ${p.level}</span></div>
      <section class="grid profile-layout">
        <div class="profile-hero">${portrait(p)}<span class="eyebrow">${esc(p.club.toUpperCase())}</span><h2>${esc(p.name)}</h2><p>${p.position} · ${positionLabel(p.position)}</p><div class="profile-rating">${overall(p.stats)} <small>OVR</small></div><div class="xp-wrap"><div class="xp-label"><span>Level progression</span><b>${p.xp} / ${p.xpNext} XP</b></div><div class="progress"><i style="width:${clamp(p.xp / p.xpNext * 100,0,100)}%"></i></div></div><div class="info-grid"><div class="info-cell"><span>USIA</span><strong>${p.age} tahun</strong></div><div class="info-cell"><span>TINGGI</span><strong>${p.height} cm</strong></div><div class="info-cell"><span>KAKI DOMINAN</span><strong>${p.foot}</strong></div><div class="info-cell"><span>RATING KARIER</span><strong>${p.rating ? p.rating.toFixed(1) : '—'}</strong></div></div></div>
        <div class="side-stack"><div class="attributes"><div class="section-row" style="margin-top:0"><h2>Atribut kemampuan</h2><span>0–99</span></div>${attributes.map(([name, value]) => `<div class="attribute"><span>${name}</span><div class="progress"><i style="width:${value}%"></i></div><strong>${value}</strong></div>`).join('')}</div><div class="mini-panel"><h3>STATISTIK KARIER</h3><div class="grid stats-row" style="grid-template-columns:repeat(3,1fr);margin:0"><div><span class="small-caps">MAIN</span><strong style="display:block;font:700 21px 'Space Grotesk';margin-top:5px">${p.appearances}</strong></div><div><span class="small-caps">GOL</span><strong style="display:block;font:700 21px 'Space Grotesk';margin-top:5px">${p.goals}</strong></div><div><span class="small-caps">ASSIST</span><strong style="display:block;font:700 21px 'Space Grotesk';margin-top:5px">${p.assists}</strong></div></div><div class="progress-label" style="margin-top:19px"><span>Hasil tim</span><b>${state.wins}M · ${state.draws}S · ${state.losses}K</b></div><div class="notice">Wajah karakter dibuat bergaya anime. Detail tubuh dan perlengkapan tetap menggunakan gaya olahraga natural.</div></div><div class="mini-panel"><div class="row-between"><h3 style="margin:0">DATA KARIER</h3><button class="btn btn-ghost" data-action="export-save">EKSPOR SAVE</button></div><p class="muted" style="line-height:1.6">Simpan salinan progres karier sebagai file JSON untuk cadangan atau dipindahkan ke perangkat lain.</p><button class="btn btn-danger" data-action="reset-save">HAPUS KARIER</button></div></div>
      </section>`;
  }

  function renderHistory() {
    if (!state.history.length) return '<div class="notice">Belum ada catatan pertandingan. Mainkan laga pertamamu untuk mengisi riwayat.</div>';
    return `<div class="history-wrap"><table class="history-table"><thead><tr><th>HARI</th><th>LAWAN</th><th>SKOR</th><th>HASIL</th><th>RATING</th></tr></thead><tbody>${state.history.map(item => `<tr><td>${item.day}</td><td>${esc(item.opponent)}</td><td>${esc(item.score)}</td><td class="${item.result === 'MENANG' ? 'result-win' : item.result === 'KALAH' ? 'result-loss' : ''}">${item.result}</td><td>${item.rating.toFixed(1)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  view.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'play-match') go('matches');
    else if (action === 'go-training') go('training');
    else if (action === 'rest') rest();
    else if (action === 'train') train(button.dataset.training);
    else if (action === 'start-match') startMatch();
    else if (action === 'match-action') playerAction(button.dataset.choice);
    else if (action === 'finish-match') { state.match = null; state.day += 1; state.lastScreen = 'home'; saveState(); render(); showToast('Progres pertandingan berhasil disimpan.'); }
    else if (action === 'export-save') exportSave();
    else if (action === 'reset-save') resetSave();
  });

  document.querySelectorAll('[data-screen]').forEach(button => button.addEventListener('click', () => go(button.dataset.screen)));

  function exportSave() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `football-player-career-${(state.player?.name || 'save').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast('File save berhasil diekspor.');
  }

  function resetSave() {
    const confirmed = window.confirm('Hapus seluruh progres karier dari perangkat ini? Tindakan ini tidak bisa dibatalkan.');
    if (!confirmed) return;
    localStorage.removeItem(SAVE_KEY);
    state = newState();
    render();
    showToast('Save karier dihapus.');
  }

  // A short history section is kept below the profile card on the profile page.
  // This function is intentionally separate so match records stay easy to extend.
  const originalRenderProfile = renderProfile;
  renderProfile = function renderProfileWithHistory() {
    originalRenderProfile();
    const wrap = document.createElement('section');
    wrap.className = 'mini-panel';
    wrap.style.marginTop = '16px';
    wrap.innerHTML = `<div class="section-row" style="margin-top:0"><h2>Riwayat pertandingan</h2><span>${state.history.length} laga terakhir</span></div>${renderHistory()}`;
    view.querySelector('.profile-layout')?.after(wrap);
  };

  render();
})();