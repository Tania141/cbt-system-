// Пуска всички проби с една команда:  node probi/vsichko.js
//
// Всяка проба е отделен файл, който излиза с 0 (наред) или 1 (има проблем).
// Тук само се събират резултатите, за да не се помни кой файл какво покрива.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tuk = __dirname;
const probi = fs.readdirSync(tuk)
    .filter(f => /^proba_.*\.js$/.test(f))
    .sort();

if (!probi.length) {
    console.log('Няма проби в probi/ — това само по себе си е проблем.');
    process.exit(1);
}

let padnali = 0;
const red = [];

for (const f of probi) {
    const zapochna = Date.now();
    let izhod = '', dobre = true;
    try {
        izhod = execFileSync(process.execPath, [path.join(tuk, f)],
                             { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
        dobre = false;
        izhod = (e.stdout || '') + (e.stderr || '');
    }
    const broj = (izhod.match(/^ {2}ok {2}/gm) || []).length;
    const lo = izhod.split('\n').filter(l => /^ {2}ЛО {2}/.test(l));
    if (!dobre) padnali++;
    red.push({ f, dobre, broj, lo, ms: Date.now() - zapochna, izhod });
}

for (const r of red) {
    console.log(`${r.dobre ? '  ✓' : '  ✗'}  ${r.f.padEnd(28)} ${String(r.broj).padStart(3)} проверки  ${r.ms} ms`);
    for (const l of r.lo) console.log('      ' + l.trim());
    if (!r.dobre && !r.lo.length) {
        const posledni = r.izhod.trim().split('\n').slice(-6);
        for (const l of posledni) console.log('      ' + l);
    }
}

const vsichki = red.reduce((n, r) => n + r.broj, 0);
console.log(padnali
    ? `\n${padnali} от ${probi.length} проби падат`
    : `\n${probi.length} проби · ${vsichki} проверки · всичко е наред`);
process.exit(padnali ? 1 : 0);
