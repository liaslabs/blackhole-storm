// Copies the built game (../index.html, built by src/build.py) and the files it loads into app/www for Capacitor.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..', '..');
const www = path.resolve(import.meta.dirname, '..', 'www');
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
const copy = (rel) => { const s = path.join(root, rel); if (fs.existsSync(s)) fs.cpSync(s, path.join(www, rel), { recursive: true }); else throw new Error('missing ' + rel); };
['index.html', 'privacy.html', 'manifest.webmanifest', 'intro.mp4', 'icons', 'music'].forEach(copy);
const kb = (p) => fs.statSync(p).isDirectory() ? fs.readdirSync(p).reduce((a, f) => a + kb(path.join(p, f)), 0) : fs.statSync(p).size / 1024;
console.log('www ready:', Math.round(kb(www) / 1024 * 10) / 10, 'MB');
