import { initRoom3D, OVERLAY_META } from './engine/js/room3d.js?v=1';

// Plain state object: the single source of truth for the room viewport.
// getRoomData() below reads straight from this on every rebuild.
// Placeholder venue only — the measurement position is the dance floor
// centre, not a listening seat. Club-specific fields (capacity,
// occupied-state absorption, power calc) are not wired up yet; see
// README.md roadmap.
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
    // Bass bins (mono, stacked centre under the booth) aren't wired up
    // yet: the engine's existing room.subwoofer path renders a single
    // small home-rack-style sub, not a 2-4-high club stack. That's the
    // next piece of placement work, not done here — see README.md roadmap.
    speaker_type: 'pa_top',
    spk_spacing_m: 6,
    spk_front_m: 1.0,
    tweeter_height_m: 2.2,
    toe_in_deg: 0,
    listener_front_m: 7.5,
    listener_offset_m: 0,
    subwoofer: false,
  },
  floor_material: 'hard',
};

function getRoomData() {
  return {
    room_type: state.room_type,
    geometry: state.geometry,
    setup: state.setup,
    environment: {
      floor_material: state.floor_material,
      furniture: { opt_area_rug: false, opt_sofa: false, opt_coffee_table: false, seating_type: 'none' },
      treatment: { wall_panel_mode: 'none', side_panel_mode: 'none', bass_trap_mode: 'none', ceiling_panel_mode: 'none' },
    },
  };
}

const room = initRoom3D({ mountId: 'roomMount', getRoomData, mode: 'setup', showLabels: true });
room?.frameRoom?.();
room?.resize?.();
window.addEventListener('resize', () => room?.resize?.());
