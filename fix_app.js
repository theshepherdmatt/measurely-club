const fs=require('fs'); let src=fs.readFileSync('public/app.js','utf8'); 

// 1. Initial state
src = src.replace(  density: 'comfortable',,   crowd_limit: 200,\n  rear_pa: false,);

// 2. Club API
const clubApiTarget = \const clubAPI = SCL?.renderClubSection('clubMount', {
  state: {
    density: state.density,
    area_m2: floorAreaM2(),
  },
  onChange({ density }) {
    state.density = density;
    room?.update?.();
  },
});\;

const clubApiRep = \const clubAPI = SCL?.renderClubSection('clubMount', {
  state: {
    crowd_limit: state.crowd_limit,
    area_m2: floorAreaM2(),
  },
  onChange({ crowd_limit }) {
    state.crowd_limit = crowd_limit;
    room?.update?.();
  },
});\;

src = src.replace(clubApiTarget, clubApiRep);

// 3. Speakers API
const spkApiTarget = \SCL?.renderClubSpeakersSection('clubSpeakersMount', {
  state: {
    bass_bin_count: state.bass_bin_count,
    spk_spacing_m: state.setup.spk_spacing_m,
    spk_front_m: state.setup.spk_front_m,
    booth_front_m: state.booth_front_m,
    pa_mount_height_m: state.pa_mount_height_m,
  },
  onChange({ bass_bin_count, spk_spacing_m, spk_front_m, booth_front_m, pa_mount_height_m }) {
    state.bass_bin_count = bass_bin_count;
    state.setup.spk_spacing_m = spk_spacing_m;
    state.setup.spk_front_m = spk_front_m;
    state.booth_front_m = booth_front_m;
    state.pa_mount_height_m = pa_mount_height_m;
    room?.update?.();
  },
});\;

const spkApiRep = \SCL?.renderClubSpeakersSection('clubSpeakersMount', {
  state: {
    bass_bin_count: state.bass_bin_count,
    spk_spacing_m: state.setup.spk_spacing_m,
    spk_front_m: state.setup.spk_front_m,
    booth_front_m: state.booth_front_m,
    pa_mount_height_m: state.pa_mount_height_m,
    rear_pa: state.rear_pa,
  },
  onChange({ bass_bin_count, spk_spacing_m, spk_front_m, booth_front_m, pa_mount_height_m, rear_pa }) {
    state.bass_bin_count = bass_bin_count;
    state.setup.spk_spacing_m = spk_spacing_m;
    state.setup.spk_front_m = spk_front_m;
    state.booth_front_m = booth_front_m;
    state.pa_mount_height_m = pa_mount_height_m;
    state.rear_pa = rear_pa;
    room?.update?.();
  },
});\;

src = src.replace(spkApiTarget, spkApiRep);

// 4. getRoomData
const getRoomTarget = \    bass_bin_count: state.bass_bin_count,
    booth_front_m: state.booth_front_m,
    pa_mount_height_m: state.pa_mount_height_m,\;

const getRoomRep = \    bass_bin_count: state.bass_bin_count,
    booth_front_m: state.booth_front_m,
    pa_mount_height_m: state.pa_mount_height_m,
    crowd_limit: state.crowd_limit,
    rear_pa: state.rear_pa,\;

src = src.replace(getRoomTarget, getRoomRep);

fs.writeFileSync('public/app.js', src);
console.log('app.js updated');

