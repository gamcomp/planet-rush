// Copies the single-file game into www/ for the native shell and points it at the bundled fonts,
// so the app opens without a network connection.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const game = join(app, '..');
const www = join(app, 'www');
rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

let html = readFileSync(join(game, 'index.html'), 'utf8');
html = html
  .replace(/<link rel="preconnect"[^>]*>\n?/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="fonts/fonts.css">')
  .replace(/<link rel="manifest"[^>]*>\n?/, '')
  // Capacitor's runtime gives the game window.Capacitor.registerPlugin for the native plugins
  .replace('<title>', '<script src="capacitor.js"></script>\n<title>');
if (html.includes('fonts.googleapis.com/css2')) throw new Error('Google Fonts link was not replaced');
writeFileSync(join(www, 'index.html'), html);
cpSync(join(app, 'node_modules/@capacitor/core/dist/capacitor.js'), join(www, 'capacitor.js'));
cpSync(join(app, 'fonts'), join(www, 'fonts'), { recursive: true });
cpSync(join(game, 'icons'), join(www, 'icons'), { recursive: true });
console.log('www ready:', (html.length / 1048576).toFixed(1), 'MB');
