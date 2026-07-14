import { initRoom3D, OVERLAY_META } from './engine/js/room3d.js?v=6';

// Plain state object: the single source of truth for the room viewport.
// getRoomData() below reads straight from this on every rebuild.
// Placeholder venue only — the measurement position is the dance floor
// centre, not a listening seat. Club-specific fields (occupied-state
// absorption, power calc) are not wired up yet; see README.md roadmap.
const state = {
  room_type: 'club',
  geometry: {
    length_m: 15,
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
    toe_in_deg: 0,
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
  // DJ booth distance from the front wall (cable-run clearance).
  booth_front_m: 0.75,
  // pa_top wall-bracket mount height + downward tilt (permanent install).
  pa_mount_height_m: 3.0,
  pa_tilt_deg: 15,
  // Dance floor capacity density: 'comfortable' 2/m² | 'packed' 4/m².
  density: 'comfortable',
  floor_material: 'hard',
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
    booth_front_m: state.booth_front_m,
    pa_mount_height_m: state.pa_mount_height_m,
    pa_tilt_deg: state.pa_tilt_deg,
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
    density: state.density,
    bass_bin_count: state.bass_bin_count,
    area_m2: floorAreaM2(),
  },
  onChange({ density, bass_bin_count }) {
    state.density = density;
    state.bass_bin_count = bass_bin_count;
    room?.update?.();
  },
});

SCL?.renderClubSpeakersSection('clubSpeakersMount', {
  state: {
    spk_spacing_m: state.setup.spk_spacing_m,
    spk_front_m: state.setup.spk_front_m,
    booth_front_m: state.booth_front_m,
    pa_mount_height_m: state.pa_mount_height_m,
    pa_tilt_deg: state.pa_tilt_deg,
  },
  onChange({ spk_spacing_m, spk_front_m, booth_front_m, pa_mount_height_m, pa_tilt_deg }) {
    state.setup.spk_spacing_m = spk_spacing_m;
    state.setup.spk_front_m = spk_front_m;
    state.booth_front_m = booth_front_m;
    state.pa_mount_height_m = pa_mount_height_m;
    state.pa_tilt_deg = pa_tilt_deg;
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
    state.geometry.width_m = width_m;
    state.geometry.length_m = length_m;
    state.geometry.height_m = height_m;
    if (width_m !== prevW) room?.setRoomWidth?.(width_m);
    if (length_m !== prevL) room?.setRoomLength?.(length_m);
    if (height_m !== state.geometry.height_m) room?.setRoomHeight?.(height_m);
    _centreListener();
    room?.update?.();
    clubAPI?.setArea?.(floorAreaM2());
  },
});
