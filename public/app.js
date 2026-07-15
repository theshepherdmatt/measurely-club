import { initRoom3D, OVERLAY_META } from './engine/js/room3d.js?v=67';

// Plain state object: the single source of truth for the room viewport.
// getRoomData() below reads straight from this on every rebuild.
// Placeholder venue only — the measurement position is the dance floor
// centre, not a listening seat. Club-specific fields (occupied-state
// absorption, power calc) are not wired up yet; see README.md roadmap.
const state = {
  room_type: 'club',
  geometry: {
    length_m: 10,
    width_m: 10,
    height_m: 4.5,
    ceiling_type: 'flat',
    ceiling_height_secondary_m: 4.5,
    ceiling_slant_direction: 'left_to_right',
  },
  setup: {
    // Two tops flanking the booth — coverage-driven, not imaging-driven.
    speaker_type: 'pa_top',
    spk_spacing_m: 6,
    spk_front_m: 0.5,
    tweeter_height_m: 2.2,
    // Modest toe-in for coverage evenness across a wide floor — not a
    // hi-fi stereo triangle angle.
    toe_in_deg: 10,
    // Measurement position is the dance floor centre, not a listening seat —
    // set below from geometry.length_m so it re-centres whenever the room
    // is resized, rather than a fixed distance from the front wall.
    listener_front_m: 0,
    listener_offset_m: 0,
    subwoofer: false,
  },
  // Bass bins: mono centre-stack under the booth, not spaced L/R pairs —
  // avoids power-alley cancellation across the floor.
  bass_bin_count: 2,
  // 'centre' (under the booth) or 'corners' (split to both front corners).
  // Multi-select array — placements combine ('centre' + 'rear_corners' etc.)
  bass_bin_placement: ['centre'],
  // DJ booth distance from the front wall (cable-run clearance).
  booth_front_m: 2.0,
  // Booth left/right offset from room centre — moves the booth and (in
  // 'centre' bass_bin_placement) the bins underneath it. The wall-mounted
  // pa_top rig stays fixed regardless.
  booth_offset_m: 0,
  // pa_top wall-bracket mount height (permanent install). Tilt is derived
  // automatically in the engine — aimed at ear height on the dance floor.
  pa_mount_height_m: 3.0,
  // 'wall' (bracket install) or 'tripod' (portable poles-on-stands rig).
  pa_mount: 'wall',
  // Dance floor capacity limit
  crowd_limit: 200,
  floor_material: 'hard',
  rear_pa: false,
  // 'turntables' (2), 'cdj' (2), or 'both' (4, standard mixed layout).
  deck_config: 'both',
  // Platform under the desk that also elevates the DJ figure/monitors.
  dj_riser_enabled: true,
};

function _centreListener() {
  state.setup.listener_front_m = state.geometry.length_m / 2;
}
_centreListener();

function getRoomData() {
  return {
    room_type: state.room_type,
    geometry: state.geometry,
    setup: state.setup,
    bass_bin_count: state.bass_bin_count,
    bass_bin_placement: state.bass_bin_placement,
    booth_front_m: state.booth_front_m,
    booth_offset_m: state.booth_offset_m,
    pa_mount_height_m: state.pa_mount_height_m,
    pa_mount: state.pa_mount,
    crowd_limit: state.crowd_limit,
    rear_pa: state.rear_pa,
    deck_config: state.deck_config,
    dj_riser_enabled: state.dj_riser_enabled,
    environment: {
      floor_material: state.floor_material,
      furniture: { opt_area_rug: false, opt_sofa: false, opt_coffee_table: false, seating_type: 'none' },
      treatment: { wall_panel_mode: 'none', side_panel_mode: 'none', bass_trap_mode: 'none', ceiling_panel_mode: 'none' },
    },
  };
}

const room = initRoom3D({ mountId: 'roomViewport', getRoomData, mode: 'setup', showLabels: true });
room?.frameRoom?.();
room?.resize?.();
window.addEventListener('resize', () => room?.resize?.());

// ── Live dance-floor coverage badge ─────────────────────────────────────
// getCrowdCoverage() reflects whatever the last rebuild() computed, so
// wrapping room.update() once here (rather than adding a refresh call to
// every onChange handler that calls it) keeps the badge in sync with
// every sidebar/PA change automatically.
const coverageBadge = document.getElementById('coverageBadge');
const coveragePct = document.getElementById('coveragePct');
function refreshCoverageBadge() {
  const coverage = room?.getCrowdCoverage?.();
  if (!coverage || !coverage.count) return;
  const pct = Math.round(coverage.pct * 100);
  coveragePct.textContent = pct + '%';
  // Same teal -> gold -> pink ramp as the crowd heatmap itself.
  const colTeal = [0x22, 0xd3, 0xc5], colGold = [0xff, 0xd1, 0x66], colPink = [0xff, 0x2d, 0x78];
  const lerp = (a, b, t) => Math.round(a + (b - a) * t);
  const mix = (t) => {
    const [from, to, localT] = t < 0.5 ? [colTeal, colGold, t * 2] : [colGold, colPink, (t - 0.5) * 2];
    return `rgb(${lerp(from[0], to[0], localT)}, ${lerp(from[1], to[1], localT)}, ${lerp(from[2], to[2], localT)})`;
  };
  coveragePct.style.color = mix(coverage.pct);
  coverageBadge.classList.add('ready');
}
if (room?.update) {
  const _rawRoomUpdate = room.update.bind(room);
  room.update = (...args) => {
    const result = _rawRoomUpdate(...args);
    refreshCoverageBadge();
    return result;
  };
}
refreshCoverageBadge();

// ── Sidebar (SCL) ─────────────────────────────────────────────────────────
const SCL = window.MeasurelySCL;

function floorAreaM2() {
  return state.geometry.width_m * state.geometry.length_m;
}

// Sections are rendered through one function so venue presets can
// re-render the whole sidebar from mutated state (SCL renderers append
// into their mounts — the mounts are cleared first on re-render).
let clubAPI, speakersAPI, boothAPI;

function renderSidebarSections() {
  for (const id of ['clubMount', 'roomMount', 'clubSpeakersMount', 'clubBoothMount']) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  }

  clubAPI = SCL?.renderClubSection('clubMount', {
  state: {
    crowd_limit: state.crowd_limit,
    area_m2: floorAreaM2(),
  },
  onChange({ crowd_limit }) {
    state.crowd_limit = crowd_limit;
    room?.update?.();
    speakersAPI?.setRoomContext?.(state.geometry.width_m, state.geometry.length_m, state.crowd_limit);
  },
});

  speakersAPI = SCL?.renderClubSpeakersSection('clubSpeakersMount', {
  state: {
    spk_spacing_m: state.setup.spk_spacing_m,
    pa_mount_height_m: state.pa_mount_height_m,
    pa_mount: state.pa_mount,
    toe_in_deg: state.setup.toe_in_deg,
    rear_pa: state.rear_pa,
    bass_bin_placement: state.bass_bin_placement,
    bass_bin_count: state.bass_bin_count,
    spk_front_m: state.setup.spk_front_m,
    width_m: state.geometry.width_m,
    length_m: state.geometry.length_m,
    crowd_limit: state.crowd_limit,
  },
  onChange({ spk_spacing_m, pa_mount_height_m, pa_mount, toe_in_deg, rear_pa, bass_bin_placement, bass_bin_count, spk_front_m }) {
    state.setup.spk_spacing_m = spk_spacing_m;
    state.pa_mount_height_m = pa_mount_height_m;
    state.pa_mount = pa_mount;
    state.setup.toe_in_deg = toe_in_deg;
    state.rear_pa = rear_pa;
    state.bass_bin_placement = bass_bin_placement;
    state.bass_bin_count = bass_bin_count;
    state.setup.spk_front_m = spk_front_m;
    room?.update?.();
  },
});

  boothAPI = SCL?.renderClubBoothSection('clubBoothMount', {
    state: {
      deck_config: state.deck_config,
      dj_riser_enabled: state.dj_riser_enabled,
      booth_front_m: state.booth_front_m,
      booth_offset_m: state.booth_offset_m,
    },
    maxBoothFront: maxBoothFrontFor(state.geometry.length_m),
    onChange({ deck_config, dj_riser_enabled, booth_front_m, booth_offset_m }) {
      state.deck_config = deck_config;
      state.dj_riser_enabled = dj_riser_enabled;
      state.booth_front_m = booth_front_m;
      state.booth_offset_m = booth_offset_m;
      room?.update?.();
    },
  });

  SCL?.renderRoomSection('roomMount', {
    state: {
      width_m: state.geometry.width_m,
      length_m: state.geometry.length_m,
      height_m: state.geometry.height_m,
    },
    // Hi-fi-room defaults (length max 10m) don't fit a club floor.
    ranges: {
      width_m:  { min: 4, max: 25, step: 0.5 },
      length_m: { min: 5, max: 30, step: 0.5 },
      height_m: { min: 2.5, max: 8, step: 0.1 },
    },
    onChange({ width_m, length_m, height_m }) {
      const prevW = state.geometry.width_m;
      const prevL = state.geometry.length_m;
      const prevH = state.geometry.height_m;
      state.geometry.width_m = width_m;
      state.geometry.length_m = length_m;
      state.geometry.height_m = height_m;
      if (width_m !== prevW) room?.setRoomWidth?.(width_m);
      if (length_m !== prevL) room?.setRoomLength?.(length_m);
      if (height_m !== prevH) room?.setRoomHeight?.(height_m);
      _centreListener();
      room?.update?.();
      clubAPI?.setArea?.(floorAreaM2());
      boothAPI?.setMaxBoothFront?.(maxBoothFrontFor(length_m));
      speakersAPI?.setRoomContext?.(width_m, length_m, state.crowd_limit);
    },
  });
}

// booth_front_m is multiplied by the booth's own internal footprint
// scale (BOOTH_FOOTPRINT_SCALE = 0.42 in room3d.js -- not exposed, so
// duplicated here) before it becomes a real-world Z offset, so the
// slider's raw number reaches roughly 2.4x further in real metres than
// it looks. The limit isn't room centre -- it's however far back the
// booth can slide before the RISER PLATFORM's own back edge (it's
// wider/deeper than the desk itself, see _buildDJBooth()'s riser
// depth of 3.6 authored units) reaches the back wall, minus a small
// clearance margin.
const BOOTH_FOOTPRINT_SCALE = 0.42;
const RISER_DEPTH_AUTHORED = 3.6; // must match _buildDJBooth()'s riser depth
const BOOTH_BACK_WALL_MARGIN_M = 0.3;
function maxBoothFrontFor(lengthM) {
  const riserHalfDepthM = (RISER_DEPTH_AUTHORED / 2) * BOOTH_FOOTPRINT_SCALE;
  return Math.max(2.5, (lengthM - riserHalfDepthM - BOOTH_BACK_WALL_MARGIN_M) / BOOTH_FOOTPRINT_SCALE);
}

renderSidebarSections();

// ── Venue size presets ─────────────────────────────────────────────────────
// One-tap starting points sized by capacity. Small venues get the
// portable tripod rig; bigger rooms get the permanent wall install with
// more bass bins (and rear fill tops at the top end). Values are
// starting points for the installer to tune, not prescriptions.
const VENUE_PRESETS = {
  small: {  // intimate bar, 50–100 people
    geometry: { width_m: 6, length_m: 8, height_m: 3.0 },
    crowd_limit: 80,
    // 2 decks (CDJ pair), not the 4-deck (2 turntables + 2 CDJ) desk —
    // a 4-deck booth is oversized furniture for a small bar floor.
    // Installer can still switch it up manually if the client wants more.
    deck_config: 'cdj',
    pa: { spk_spacing_m: 4.0, pa_mount_height_m: 2.2, pa_mount: 'tripod', toe_in_deg: 10,
          rear_pa: false, bass_bin_placement: ['centre'], bass_bin_count: 2, spk_front_m: 0.5 },
  },
  medium: { // club floor, 100–250 people
    geometry: { width_m: 10, length_m: 12, height_m: 3.5 },
    crowd_limit: 180,
    deck_config: 'both',
    pa: { spk_spacing_m: 6.0, pa_mount_height_m: 3.0, pa_mount: 'wall', toe_in_deg: 10,
          rear_pa: false, bass_bin_placement: ['centre'], bass_bin_count: 3, spk_front_m: 1.0 },
  },
  large: {  // large venue, 250–500 people
    geometry: { width_m: 14, length_m: 18, height_m: 4.5 },
    crowd_limit: 400,
    deck_config: 'both',
    pa: { spk_spacing_m: 8.0, pa_mount_height_m: 3.5, pa_mount: 'wall', toe_in_deg: 12,
          rear_pa: true, bass_bin_placement: ['centre', 'corners'], bass_bin_count: 4, spk_front_m: 1.0 },
  },
};

function applyVenuePreset(key) {
  const preset = VENUE_PRESETS[key];
  if (!preset) return;
  Object.assign(state.geometry, preset.geometry);
  state.crowd_limit = preset.crowd_limit;
  state.setup.spk_spacing_m = preset.pa.spk_spacing_m;
  state.setup.toe_in_deg = preset.pa.toe_in_deg;
  state.setup.spk_front_m = preset.pa.spk_front_m;
  state.pa_mount_height_m = preset.pa.pa_mount_height_m;
  state.pa_mount = preset.pa.pa_mount;
  state.rear_pa = preset.pa.rear_pa;
  state.bass_bin_placement = [...preset.pa.bass_bin_placement];
  state.bass_bin_count = preset.pa.bass_bin_count;
  state.deck_config = preset.deck_config;
  _centreListener();
  room?.setRoomWidth?.(state.geometry.width_m);
  room?.setRoomLength?.(state.geometry.length_m);
  room?.setRoomHeight?.(state.geometry.height_m);
  renderSidebarSections();
  room?.update?.();
  room?.frameRoom?.({ animate: true, duration: 1400 });
}

const presetBtns = document.querySelectorAll('#venuePresets .sbox-btn');
presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyVenuePreset(btn.dataset.preset);
  });
});

// Floating quick acoustics bar bindings — each button is a toggle (no
// separate "None" button): clicking the already-active one switches the
// overlay off; clicking a different one swaps to it, same as before.
const qaBtns = document.querySelectorAll('#quickAcousticsSegmented .seg-btn');
const peaksFreqRow = document.getElementById('peaksFreqRow');
const peaksFreqLegend = document.getElementById('peaksFreqLegend');

// Legend chips sourced from the engine's own OVERLAY_META.peaks_dips.legend
// (teal "Dip" / purple "Peak") — the "what does this colour mean"
// indicator, with no new engine sampling needed.
if (peaksFreqLegend && OVERLAY_META?.peaks_dips?.legend) {
  for (const { color, label } of OVERLAY_META.peaks_dips.legend) {
    const chip = document.createElement('span');
    chip.className = 'peaks-freq-chip';
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color;
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(label));
    peaksFreqLegend.appendChild(chip);
  }
}

let peaksFreqAPI = null;
qaBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const overlay = e.currentTarget.dataset.overlay;
    const wasActive = e.currentTarget.classList.contains('active');
    qaBtns.forEach(b => b.classList.remove('active'));
    peaksFreqRow?.classList.remove('visible');

    if (wasActive) {
      room?.focusIssue?.(null);
      return; // second click on the active button just switches it off
    }

    e.currentTarget.classList.add('active');
    room?.focusIssue?.(overlay);

    if (overlay === 'peaks_dips') {
      peaksFreqRow?.classList.add('visible');
      if (!peaksFreqAPI) {
        peaksFreqAPI = SCL?.renderPeaksFreqSlider('peaksFreqMount', {
          value: room?.getPeaksFreq?.() ?? 50,
          onChange(hz) { room?.setPeaksFreq?.(hz); },
        });
      }
    }
  });
});

// ── Camera view presets ───────────────────────────────────────────────────
// Positions in room metres (engine's centred space: y=0 mid-height, floor
// at -height/2), computed live from state so views track venue resizes
// and booth moves. Overview uses frameRoom() (the fitted default).
const camBtns = document.querySelectorAll('#cameraViews .seg-btn');
function clubCameraView(key) {
  const { width_m: W, length_m: L, height_m: H } = state.geometry;
  const floorY = -H / 2;
  // Same 0.42 booth footprint scale as maxBoothFrontFor() above.
  const boothZ = -L / 2 + state.booth_front_m * BOOTH_FOOTPRINT_SCALE;
  const boothX = state.booth_offset_m;
  switch (key) {
    case 'dj': // standing at the decks, looking out over the floor
      return {
        pos:  { x: boothX, y: floorY + 2.05, z: boothZ - 0.5 },
        look: { x: 0, y: floorY + 1.3, z: L * 0.3 },
      };
    case 'floor': // head-height in the crowd, facing the booth
      return {
        pos:  { x: 0.4, y: floorY + 1.65, z: L * 0.18 },
        look: { x: boothX, y: floorY + 1.4, z: boothZ },
      };
    case 'top': // plan view straight down
      return {
        pos:  { x: 0, y: H / 2 + Math.max(W, L) * 0.85, z: 0.01 },
        look: { x: 0, y: 0, z: 0 },
      };
  }
  return null;
}
camBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    camBtns.forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    const key = e.currentTarget.dataset.view;
    // Slow, calm glide — the engine default (700ms instant-ish) reads
    // snappy and aggressive when the camera dives into the crowd.
    const CAMERA_GLIDE_MS = 2200;
    if (key === 'overview') { room?.frameRoom?.({ animate: true, duration: CAMERA_GLIDE_MS }); return; }
    const v = clubCameraView(key);
    if (v) room?.flyToRoomPos?.({ ...v, duration: CAMERA_GLIDE_MS });
  });
});

// Tops/Bass wave-ring toggles removed from the sidebar (too much clutter
// alongside crowd + speaker/bass-bin counts) — waves stay off permanently.
// The #waveKey colour legend that went with them is gone from the HTML
// too (it used to flash on load before this hide ran).
room?.setTopWaves?.(false);
room?.setSubWaves?.(false);

let _crowdOn = true; // start active
const btnToggleCrowd = document.getElementById('btnToggleCrowd');
if (btnToggleCrowd) {
  // Trigger initial state
  room?.setCrowd?.(true);
  btnToggleCrowd.addEventListener('click', (e) => {
    _crowdOn = !_crowdOn;
    if (_crowdOn) {
      e.currentTarget.classList.add('active');
    } else {
      e.currentTarget.classList.remove('active');
    }
    room?.setCrowd?.(_crowdOn);
  });
}

let _discoOn = false; // start inactive
const btnToggleDisco = document.getElementById('btnToggleDisco');
if (btnToggleDisco) {
  // Trigger initial state
  room?.setDisco?.(false);
  btnToggleDisco.addEventListener('click', (e) => {
    _discoOn = !_discoOn;
    if (_discoOn) {
      e.currentTarget.classList.add('active');
    } else {
      e.currentTarget.classList.remove('active');
    }
    room?.setDisco?.(_discoOn);
  });
}

// ── Mobile portrait: top-right hamburger + camera views in the Sound bar ──
// Replaces the earlier Floor/PA/Booth bottom tab bar: one hamburger
// toggles #sidebar as a right-edge drawer scrolling all three sections.
// The drawer slides OVER the room via CSS transform — no layout resize,
// so no --room-shift / room.resize() dance is needed here (the canvas
// dimensions never change; see the landscape drawer notes below).
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
if (mobileMenuBtn) {
  const mobileSidebar = document.getElementById('sidebar');
  const mobileQuickBar = document.getElementById('quickAcousticsBar');
  const mobileOverlaysBtn = document.getElementById('mobileOverlaysBtn');

  // Menu (right drawer) and Overlays (bottom sheet) are mutually
  // exclusive — opening one closes the other. The Overlays button also
  // hides while the Menu drawer is open (the drawer covers it).
  mobileMenuBtn.addEventListener('click', () => {
    const open = !mobileSidebar.classList.contains('mobile-sheet-open');
    mobileSidebar.classList.toggle('mobile-sheet-open', open);
    mobileMenuBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      mobileQuickBar?.classList.remove('mobile-sheet-open');
      mobileOverlaysBtn?.setAttribute('aria-expanded', 'false');
    }
    mobileOverlaysBtn?.classList.toggle('qa-hidden', open);
  });

  mobileOverlaysBtn?.addEventListener('click', () => {
    const open = !mobileQuickBar?.classList.contains('mobile-sheet-open');
    mobileQuickBar?.classList.toggle('mobile-sheet-open', open);
    mobileOverlaysBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      mobileSidebar.classList.remove('mobile-sheet-open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Camera views (Overview/DJ/Dancefloor/Top) live inside the Sound bar
  // on mobile — as their own floating pill they collide with the logo at
  // phone widths. DOM move (not CSS clone) so one set of buttons keeps
  // its listeners; restored to #mainColumn on desktop widths.
  const cameraViews = document.getElementById('cameraViews');
  const mainColumn = document.getElementById('mainColumn');
  const mobileMq = window.matchMedia(
    '(max-width: 1024px) and (orientation: portrait), (max-width: 1180px) and (orientation: landscape)'
  );
  function placeCameraViews() {
    if (!cameraViews || !mobileQuickBar || !mainColumn) return;
    if (mobileMq.matches) mobileQuickBar.appendChild(cameraViews);
    else mainColumn.appendChild(cameraViews);
  }
  mobileMq.addEventListener('change', placeCameraViews);
  placeCameraViews();
}

// ── Mobile + tablet landscape edge drawers ────────────────────────────────
// Dual handles matching ecommerce's Wall(left)+Room(right) pattern:
// Overlays (#quickAcousticsBar) from the left, Menu (#sidebar) from the
// right. Same .mobile-sheet-open toggle pattern as the portrait bottom
// tab bar — only the CSS differs per orientation. No backdrop -- the 3D
// room (OrbitControls) stays interactive while a drawer is open;
// closing is via the handles (tap the open one again, or the other one).
const landscapeSidebarHandle = document.getElementById('landscapeSidebarHandle');
const landscapeOverlaysHandle = document.getElementById('landscapeOverlaysHandle');
if (landscapeSidebarHandle || landscapeOverlaysHandle) {
  const landscapeSidebar = document.getElementById('sidebar');
  const landscapeOverlaysBar = document.getElementById('quickAcousticsBar');

  // Room slides via CSS transform (translateX), not a width/left/right
  // resize -- resizing the element changes container clientWidth, which
  // room3d.js's ResizeObserver feeds into camera.aspect and its
  // landscape zoom framing, so the room visibly "grew" as it slid.
  // transform doesn't touch layout size, so no resize() call is needed
  // (or wanted) here -- the canvas dimensions never change, only its
  // on-screen position. Left drawer covers the room's left edge, so the
  // room shifts right (+X) to clear it; right drawer shifts it left (-X).
  //
  // Shift amount is read from the drawer's own offsetWidth rather than
  // a duplicated min(60vw, Npx) formula in JS -- on real devices mobile
  // Safari's vw can disagree with the drawer's actual laid-out width
  // (dynamic toolbar), so a hardcoded copy of the CSS formula drifted
  // out of sync and overshot the drawer by a couple hundred px, leaving
  // a dead grey gap between the room and the drawer.
  // Shifting the full drawer width pushed the room too far (it was
  // sliding an equal-width canvas rather than truly revealing more of
  // it -- see the note above). A partial shift keeps most of the room
  // visible under the translucent drawer edge instead of running it
  // off the opposite side.
  const LANDSCAPE_ROOM_SHIFT_FACTOR_LEFT = 0.2;
  const LANDSCAPE_ROOM_SHIFT_FACTOR_RIGHT = 0.3;
  function setLandscapeRoomShift(side) { // 'left' | 'right' | null
    let x = '0px';
    if (side === 'left') x = `${Math.round(landscapeOverlaysBar.offsetWidth * LANDSCAPE_ROOM_SHIFT_FACTOR_LEFT)}px`;
    else if (side === 'right') x = `-${Math.round(landscapeSidebar.offsetWidth * LANDSCAPE_ROOM_SHIFT_FACTOR_RIGHT)}px`;
    document.documentElement.style.setProperty('--room-shift-x', x);
  }

  function closeLandscapeDrawers() {
    landscapeSidebar.classList.remove('mobile-sheet-open');
    landscapeOverlaysBar?.classList.remove('mobile-sheet-open');
    setLandscapeRoomShift(null);
  }

  function toggleLandscapeDrawer(el, side) {
    const wasOpen = el.classList.contains('mobile-sheet-open');
    closeLandscapeDrawers();
    if (!wasOpen) {
      el.classList.add('mobile-sheet-open');
      setLandscapeRoomShift(side);
    }
  }

  landscapeSidebarHandle?.addEventListener('click', () => toggleLandscapeDrawer(landscapeSidebar, 'right'));
  landscapeOverlaysHandle?.addEventListener('click', () => toggleLandscapeDrawer(landscapeOverlaysBar, 'left'));
}
