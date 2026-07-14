const fs = require('fs');
let code = fs.readFileSync('public/engine/js/room3d.js', 'utf-8');

const startMarker = '// --- MIRROR BALL ---';
const endMarker = 'roomGroup.add(_mirrorBall);';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker, startIndex) + endMarker.length;

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = \// --- MIRROR BALL ---
      if (_discoEnabled) {
        const mballRadius = 0.3;
        const mballGeo = new THREE.SphereGeometry(mballRadius, 16, 12);
        const mballMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.1,
          metalness: 0.9,
          flatShading: true
        });
        _mirrorBall = new THREE.Mesh(mballGeo, mballMat);
        const ceilY = room.height_m / 2;
        _mirrorBall.position.set(0, ceilY - mballRadius - 0.2, 0);
        const mstringGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.2);
        const mstringMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const mstring = new THREE.Mesh(mstringGeo, mstringMat);
        mstring.position.set(0, mballRadius + 0.1, 0);
        _mirrorBall.add(mstring);
        
        // LASERS
        const laserCount = 60;
        const pts = [];
        const colors = [];
        const c1 = new THREE.Color(0x00ffff);
        const c2 = new THREE.Color(0xff00ff);
        const c3 = new THREE.Color(0x00ff00);
        for(let i=0; i<laserCount; i++) {
          pts.push(new THREE.Vector3(0,0,0));
          const u = Math.random(); const v = Math.random();
          const theta = u * 2.0 * Math.PI; const phi = Math.acos(2.0 * v - 1.0);
          const r = 8.0;
          pts.push(new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)));
          const col = Math.random() < 0.33 ? c1 : (Math.random() < 0.5 ? c2 : c3);
          colors.push(col.r, col.g, col.b, col.r, col.g, col.b);
        }
        const laserGeo = new THREE.BufferGeometry().setFromPoints(pts);
        laserGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const clipHalfW = (room.width_m / 2) * baseScale;
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
        });
        const laserLines = new THREE.LineSegments(laserGeo, laserMat);
        _mirrorBall.add(laserLines);
        roomGroup.add(_mirrorBall);
      } else {
        _mirrorBall = null;
      }\;

    code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
    fs.writeFileSync('public/engine/js/room3d.js', code);
    console.log('Fixed mirror ball duplication');
} else {
    console.log('Markers not found');
}

