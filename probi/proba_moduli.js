// Пробата, която пази разделянето да не се разпадне.
//
// След като кодът е на 13 файла, новите начини да се счупи са други: модул,
// който никой не включва; включен файл, който го няма; една и съща функция,
// определена на две места след местене. (Стъпка 2 от ПОДРЕЖДАНЕ.md)
const fs = require('fs');
const path = require('path');
const { JS, HTML, redNaModulite, kod } = require('./kod');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const vklyucheni = redNaModulite();
const nalichni = fs.readdirSync(JS).filter(f => f.endsWith('.js')).sort();

t(`${vklyucheni.length} модула се включват от index.html`, vklyucheni.length > 0);

const lipsvat = vklyucheni.filter(f => !fs.existsSync(path.join(JS, f)));
t('всеки включен файл съществува', lipsvat.length === 0, lipsvat);

const zabraveni = nalichni.filter(f => !vklyucheni.includes(f));
t('няма модул, който никой не включва', zabraveni.length === 0, zabraveni);

const dvazh = vklyucheni.filter((f, i) => vklyucheni.indexOf(f) !== i);
t('никой модул не се включва два пъти', dvazh.length === 0, dvazh);

t('редът е този, в който са номерирани',
  String(vklyucheni) === String([...vklyucheni].sort()), vklyucheni);

// Целият код трябва да се чете като една програма — както го чете браузърът.
const vsichko = kod();
let greshka = null;
try { new Function(vsichko); } catch (e) { greshka = e.message; }
t('слепеният код се чете без синтактична грешка', !greshka, greshka);

// Една функция, определена в два модула: вторият тихо бие първия.
const kade = new Map();
for (const f of vklyucheni) {
    const telo = fs.readFileSync(path.join(JS, f), 'utf8');
    for (const m of telo.matchAll(/^(?:async )?function ([A-Za-z_$][\w$]*)/gm)) {
        const spisak = kade.get(m[1]) || [];
        if (!spisak.includes(f)) spisak.push(f);
        kade.set(m[1], spisak);
    }
}
const povtoreni = [...kade].filter(([, f]) => f.length > 1).map(([ime, f]) => ime + ': ' + f.join(' + '));
t('никоя функция не е определена в два модула', povtoreni.length === 0, povtoreni);

// Същото в рамките на един модул — две еднакви имена в един файл също е тихо.
const vatre = [];
for (const f of vklyucheni) {
    const telo = fs.readFileSync(path.join(JS, f), 'utf8');
    const imena = [...telo.matchAll(/^(?:async )?function ([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
    for (const ime of new Set(imena))
        if (imena.filter(x => x === ime).length > 1) vatre.push(f + ': ' + ime);
}
t('никоя функция не е определена два пъти в един модул', vatre.length === 0, vatre);

t('app.js вече го няма', !fs.existsSync(path.join(JS, '..', 'app.js')));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — разделянето е здраво`);
process.exit(loshi.length ? 1 : 0);
