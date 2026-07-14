import { initRoom3D, OVERLAY_META } from './engine/js/room3d.js?v=44';

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
    spk_front_m: 1.0,
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
  },
});

SCL?.renderClubSpeakersSection('clubSpeakersMount', {
  state: {
    spk_spacing_m: state.setup.spk_spacing_m,
    pa_mount_height_m: state.pa_mount_height_m,
    toe_in_deg: state.setup.toe_in_deg,
    rear_pa: state.rear_pa,
    bass_bin_placement: state.bass_bin_placement,
    bass_bin_count: state.bass_bin_count,
    spk_front_m: state.setup.spk_front_m,
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

SCL?.renderClubBoothSection('clubBoothMount', {
  state: {
    deck_config: state.deck_config,
    dj_riser_enabled: state.dj_riser_enabled,
    booth_front_m: state.booth_front_m,
    booth_offset_m: state.booth_offset_m,
  },
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

// Split Tops (blue, L/R rings) vs Bass (pink, SUB rings) — was a single
// combined Waves toggle in the floating central control bar; moved into
// the sidebar as two independent buttons per setTopWaves/setSubWaves.
let _topWavesOn = false;
let _subWavesOn = false;
const btnToggleTopWaves = document.getElementById('btnToggleTopWaves');
const btnToggleSubWaves = document.getElementById('btnToggleSubWaves');
const waveKey = document.getElementById('waveKey');
room?.setTopWaves?.(false);
room?.setSubWaves?.(false);
if (waveKey) waveKey.style.display = 'none';

function _syncWaveKey() {
  if (waveKey) waveKey.style.display = (_topWavesOn || _subWavesOn) ? 'flex' : 'none';
}

if (btnToggleTopWaves) {
  btnToggleTopWaves.addEventListener('click', (e) => {
    _topWavesOn = !_topWavesOn;
    e.currentTarget.classList.toggle('active', _topWavesOn);
    room?.setTopWaves?.(_topWavesOn);
    _syncWaveKey();
  });
}
if (btnToggleSubWaves) {
  btnToggleSubWaves.addEventListener('click', (e) => {
    _subWavesOn = !_subWavesOn;
    e.currentTarget.classList.toggle('active', _subWavesOn);
    room?.setSubWaves?.(_subWavesOn);
    _syncWaveKey();
  });
}

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
