const fs=require('fs'); 
let src=fs.readFileSync('public/engine/js/room3d.js','utf8'); 
src=src.replace('let _crowdEnabled = true;', 'let _discoEnabled = false;\n  let _crowdEnabled = true;'); 
src=src.replace('setCrowd(enabled) {', 'setDisco(enabled) {\n      _discoEnabled = !!enabled;\n      rebuild();\n    },\n\n    setCrowd(enabled) {'); 
src=src.replace('function rebuild() {', 'function rebuild() {\n    if (typeof ambientLight !== \'undefined\') ambientLight.intensity = _discoEnabled ? 0.15 : 1.35;'); 

const mballTarget = `      _mirrorBall.add(mstring);
      roomGroup.add(_mirrorBall);`;

const mballRep = `      _mirrorBall.add(mstring);
      
      // LASERS
      if (_discoEnabled) {
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
        const laserMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false });
        const laserLines = new THREE.LineSegments(laserGeo, laserMat);
        _mirrorBall.add(laserLines);
      }

      roomGroup.add(_mirrorBall);`;

src=src.replace(mballTarget, mballRep);
fs.writeFileSync('public/engine/js/room3d.js',src); 
console.log('Replaced disco logic!');
