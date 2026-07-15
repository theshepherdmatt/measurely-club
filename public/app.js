import { initRoom3D, OVERLAY_META } from './engine/js/room3d.js?v=57';

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
  bass_bin_placement: 'centre',
  // DJ booth distance from the front wall (cable-run clearance).
  booth_front_m: 2.0,
  // Booth left/right offset from room centre — moves the booth and (in
  // 'centre' bass_bin_placement) the bins underneath it. The wall-mounted
  // pa_top rig stays fixed regardless.
  booth_offset_m: 0,
  // pa_top wall-bracket mount height (permanent install). Tilt is derived
  // automatically in the engine — aimed at ear height on the dance floor.
  pa_mount_height_m: 3.0,
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

// ── Sidebar (SCL) ─────────────────────────────────────────────────────────
const SCL = window.MeasurelySCL;

function floorAreaM2() {
  return state.geometry.width_m * state.geometry.length_m;
}

const clubAPI = SCL?.renderClubSection('clubMount', {
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

const speakersAPI = SCL?.renderClubSpeakersSection('clubSpeakersMount', {
  state: {
    spk_spacing_m: state.setup.spk_spacing_m,
    pa_mount_height_m: state.pa_mount_height_m,
    toe_in_deg: state.setup.toe_in_deg,
    rear_pa: state.rear_pa,
    bass_bin_placement: state.bass_bin_placement,
    bass_bin_count: state.bass_bin_count,
    spk_front_m: state.setup.spk_front_m,
    width_m: state.geometry.width_m,
    length_m: state.geometry.length_m,
    crowd_limit: state.crowd_limit,
  },
  onChange({ spk_spacing_m, pa_mount_height_m, toe_in_deg, rear_pa, bass_bin_placement, bass_bin_count, spk_front_m }) {
    state.setup.spk_spacing_m = spk_spacing_m;
    state.pa_mount_height_m = pa_mount_height_m;
    state.setup.toe_in_deg = toe_in_deg;
    state.rear_pa = rear_pa;
    state.bass_bin_placement = bass_bin_placement;
    state.bass_bin_count = bass_bin_count;
    state.setup.spk_front_m = spk_front_m;
    room?.update?.();
  },
});

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

const boothAPI = SCL?.renderClubBoothSection('clubBoothMount', {
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

// Floating quick acoustics bar bindings
const qaBtns = document.querySelectorAll('#quickAcousticsSegmented .seg-btn');
qaBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    qaBtns.forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    const overlay = e.currentTarget.dataset.overlay;
    if (overlay === 'none') {
      room?.focusIssue?.(null);
    } else {
      room?.focusIssue?.(overlay);
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
    if (key === 'overview') { room?.frameRoom?.(); return; }
    const v = clubCameraView(key);
    if (v) room?.flyToRoomPos?.(v);
  });
});

// Tops/Bass wave-ring toggles removed from the sidebar (too much clutter
// alongside crowd + speaker/bass-bin counts) — waves stay off permanently.
const waveKey = document.getElementById('waveKey');
room?.setTopWaves?.(false);
room?.setSubWaves?.(false);
if (waveKey) waveKey.style.display = 'none';

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

// ── Mobile + tablet bottom tab bar (Floor / PA / Booth) ──────────────────
// Ported from measurely-ecommerce's mobile pattern, simplified: club has
// one #sidebar (not ecommerce's #configBar+#sidebar split), so this opens
// the single sheet and scrolls it to the tapped section instead of
// switching between two panels. Tapping the already-open tab collapses it.
const mobileTabBar = document.getElementById('mobileTabBar');
if (mobileTabBar) {
  const mobileSidebar = document.getElementById('sidebar');

  // Shrinks #roomViewport's real height to match the open sheet (CSS var,
  // see the mobile media query) instead of the sheet floating over a
  // static-size canvas — the engine's own ResizeObserver reacts to that
  // and lifts the room's portrait framing to match. resize() is called
  // explicitly too, belt-and-braces in case the observer misses the last
  // tick of the transition (same pattern measurely-retail/ecommerce use).
  function setRoomShift(open) {
    document.documentElement.style.setProperty('--room-shift-h', open ? '55vh' : '0px');
    room?.resize?.();
  }

  const mobileQuickBar = document.getElementById('quickAcousticsBar');
  function setQuickBarVisible(visible) {
    mobileQuickBar?.classList.toggle('qa-hidden', !visible);
  }

  function closeMobileSheet() {
    mobileSidebar.classList.remove('mobile-sheet-open');
    mobileTabBar.querySelectorAll('.mobile-tab-btn').forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    setRoomShift(false);
    setQuickBarVisible(true);
  }

  mobileTabBar.querySelectorAll('.mobile-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-mobile-tab');
      const wasOpen = btn.classList.contains('active');
      closeMobileSheet();
      if (wasOpen) return; // second tap on the open tab just collapses it

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      setRoomShift(true);
      setQuickBarVisible(false);
      mobileSidebar.classList.add('mobile-sheet-open');
      document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
    });
  });
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
