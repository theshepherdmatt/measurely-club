const fs=require('fs'); let src=fs.readFileSync('public/engine/js/sidebar-component-library.js','utf8'); 

// 1. Crowd Limit Slider
const clubSecTarget = \    const cur = {
      density: state.density ?? 'comfortable',      // 'comfortable' 2/m² | 'packed' 4/m²
      crowd_bpm: state.crowd_bpm ?? 126,
    };
    let areaM2 = state.area_m2 ?? 0;

    const wrap = _el('div', { style: 'display:flex;flex-direction:column;gap:12px;' });

    const capWrap = _el('div', { class: 'demo-field' });
    const capHdr  = _el('div', { class: 'demo-field-header' });
    const capLbl  = _el('span', { class: 'demo-field-label' }, 'Dance floor capacity');
    const capVal  = _el('span', { class: 'demo-field-value' }, '—');
    capHdr.append(capLbl, capVal);
    capWrap.appendChild(capHdr);
    wrap.appendChild(capWrap);

    function _densityFactor(d) { return d === 'packed' ? 4 : 2; }
    function _updateCapacity() {
      capVal.textContent = areaM2 > 0
        ? Math.round(areaM2 * _densityFactor(cur.density)) + ' people'
        : '—';
    }

    const densityGroup = _btnGroup(
      [
        { key: 'comfortable', label: 'Comfortable', title: '~2 people/m²' },
        { key: 'packed',      label: 'Packed',      title: '~4 people/m²' },
      ],
      cur.density,
      (key) => {
        cur.density = key;
        _updateCapacity();
        onChange?.({ ...cur });
      }
    );
    wrap.appendChild(densityGroup.row);
    _updateCapacity();\;

const clubSecRep = \    const cur = {
      crowd_limit: state.crowd_limit ?? 200,
      crowd_bpm: state.crowd_bpm ?? 126,
    };
    let areaM2 = state.area_m2 ?? 0;

    const wrap = _el('div', { style: 'display:flex;flex-direction:column;gap:12px;' });

    const { wrap: limitWrap, slider: limitSlider, val: limitVal } = _sliderField({
      label: 'Crowd limit', id: 'scl-crowd-limit',
      min: 50, max: 500, step: 50, value: cur.crowd_limit, unit: ' people', decimals: 0,
      ariaLabel: 'Crowd limit',
    });
    limitSlider.addEventListener('input', () => {
      const v = parseInt(limitSlider.value, 10);
      cur.crowd_limit = v;
      limitVal.textContent = String(v) + ' people';
      _updateSliderFill(limitSlider);
      onChange?.({ ...cur });
    });
    wrap.appendChild(limitWrap);\;

src=src.replace(clubSecTarget, clubSecRep);

// Update reset for Club Section
const resetTarget = \        cur.density = state.density ?? 'comfortable';
        cur.crowd_bpm = state.crowd_bpm ?? 126;
        densityGroup.setActive(cur.density);
        bpmSlider.value = String(cur.crowd_bpm);
        bpmVal.textContent = String(cur.crowd_bpm) + ' BPM';
        _updateSliderFill(bpmSlider);
        _updateCapacity();\;
const resetRep = \        cur.crowd_limit = state.crowd_limit ?? 200;
        cur.crowd_bpm = state.crowd_bpm ?? 126;
        limitSlider.value = String(cur.crowd_limit);
        limitVal.textContent = String(cur.crowd_limit) + ' people';
        _updateSliderFill(limitSlider);
        bpmSlider.value = String(cur.crowd_bpm);
        bpmVal.textContent = String(cur.crowd_bpm) + ' BPM';
        _updateSliderFill(bpmSlider);\;
src=src.replace(resetTarget, resetRep);

// 2. Speakers Section (Rear PA)
const spkTarget = \    const cur = {
      bass_bin_count:    state.bass_bin_count    ?? 2,
      spk_spacing_m:     state.spk_spacing_m     ?? 6.0,
      spk_front_m:       state.spk_front_m       ?? 1.0,
      booth_front_m:     state.booth_front_m     ?? 0.75,
      pa_mount_height_m: state.pa_mount_height_m ?? 3.0,
    };\;

const spkRep = \    const cur = {
      bass_bin_count:    state.bass_bin_count    ?? 2,
      spk_spacing_m:     state.spk_spacing_m     ?? 6.0,
      spk_front_m:       state.spk_front_m       ?? 1.0,
      booth_front_m:     state.booth_front_m     ?? 0.75,
      pa_mount_height_m: state.pa_mount_height_m ?? 3.0,
      rear_pa:           state.rear_pa           ?? false,
    };\;

src=src.replace(spkTarget, spkRep);

const defsTarget = \    const defs = [
      { key: 'bass_bin_count',    label: 'Bass bins (mono stack)', min: 2, max: 4, step: 1, unit: '', decimals: 0, hl: 'speakers' },
      { key: 'spk_spacing_m',     label: 'Top spacing',            min: 2.0, max: 10.0, step: 0.1, unit: 'm',   decimals: 1, hl: 'speakers' },
      { key: 'pa_mount_height_m', label: 'Top mount height',       min: 1.5, max: 4.5,  step: 0.1, unit: 'm',   decimals: 1, hl: 'speakers' },
      { key: 'spk_front_m',       label: 'Bass bins from front wall', min: 0.2, max: 3.0, step: 0.1, unit: 'm', decimals: 1, hl: 'speakers' },
      { key: 'booth_front_m',     label: 'Booth from front wall',  min: 0.2, max: 2.5,  step: 0.1, unit: 'm',   decimals: 1, hl: 'speakers' },
    ];\;

const defsRep = defsTarget + \\n
    const rearPaWrap = _el('div', { class: 'demo-field', style: 'margin-top:4px;' });
    const rearPaHdr = _el('div', { class: 'demo-field-header' });
    const rearPaLbl = _el('span', { class: 'demo-field-label' }, 'Rear PA (4-Point)');
    rearPaHdr.appendChild(rearPaLbl);
    rearPaWrap.appendChild(rearPaHdr);

    const rearPaGroup = _btnGroup(
      [
        { key: 'off', label: 'Off', title: 'Front PA only' },
        { key: 'on',  label: 'On',  title: 'Add mirrored PA at rear wall' }
      ],
      cur.rear_pa ? 'on' : 'off',
      (key) => {
        cur.rear_pa = key === 'on';
        onChange?.({ ...cur });
      }
    );
    rearPaWrap.appendChild(rearPaGroup.row);
    wrap.appendChild(rearPaWrap);\;
src=src.replace(defsTarget, defsRep);

// Update reset for Speakers Section
const spkResetTarget = \      reset() {
        for (const def of defs) {
          cur[def.key] = state[def.key] ?? def.min;
          const { slider, val } = sliders[def.key];
          slider.value = String(cur[def.key]);
          val.textContent = cur[def.key].toFixed(def.decimals) + def.unit;
          _updateSliderFill(slider);
        }
      }\;

const spkResetRep = \      reset() {
        for (const def of defs) {
          cur[def.key] = state[def.key] ?? def.min;
          const { slider, val } = sliders[def.key];
          slider.value = String(cur[def.key]);
          val.textContent = cur[def.key].toFixed(def.decimals) + def.unit;
          _updateSliderFill(slider);
        }
        cur.rear_pa = state.rear_pa ?? false;
        rearPaGroup.setActive(cur.rear_pa ? 'on' : 'off');
      }\;

src=src.replace(spkResetTarget, spkResetRep);

fs.writeFileSync('public/engine/js/sidebar-component-library.js', src);
console.log('SCL updated');

