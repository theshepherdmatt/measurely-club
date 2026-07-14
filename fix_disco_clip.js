const fs=require('fs'); let src=fs.readFileSync('public/engine/js/room3d.js','utf8');

const target = \        const laserMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false });\;

const rep = \        const clipHalfW = (room.width_m / 2) * baseScale;
        const clipHalfL = (room.length_m / 2) * baseScale;
        const clipHalfH = (room.height_m / 2) * baseScale;
        const _discoClipPlanes = [
          new THREE.Plane(new THREE.Vector3(-1, 0, 0), clipHalfW),
          new THREE.Plane(new THREE.Vector3( 1, 0, 0), clipHalfW),
          new THREE.Plane(new THREE.Vector3(0, 0, -1), clipHalfL),
          new THREE.Plane(new THREE.Vector3(0, 0,  1), clipHalfL),
          new THREE.Plane(new THREE.Vector3(0, -1, 0), clipHalfH),
          new THREE.Plane(new THREE.Vector3(0,  1, 0), clipHalfH)
        ];
        const laserMat = new THREE.LineBasicMaterial({ 
          vertexColors: true, 
          transparent: true, 
          opacity: 0.6, 
          depthWrite: false,
          clippingPlanes: _discoClipPlanes
        });\;

if (src.includes(target)) {
  src = src.replace(target, rep);
  fs.writeFileSync('public/engine/js/room3d.js', src);
  console.log('Added clipping planes to lasers');
} else {
  console.log('Target not found');
}
