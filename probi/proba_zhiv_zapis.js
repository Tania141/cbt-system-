// Съставянето чете ЖИВИЯ запис, не снимката.
//
// `appData.currentProject` е копие от момента, в който обектът е отворен —
// самият стар код си го пише в бележка. А чекването в чеклиста, датите на
// документите и потвърдените блокове се пишат в `appData.projects`.
//
// Четеше ли се снимката, Акт 15 излизаше с празно тяло, колкото и да е
// чеквано. (Операторът, 23.10.2026: „няма тяло, защото си излиза същото и не
// пълни чекнатите документи“.)
const fs = require('fs');
const path = require('path');
const { JS, redNaModulite } = require('./kod');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

// Модулите, които СЪСТАВЯТ документи. Там снимката не върши работа.
const SASTAVYAT = ['09-akt15.js', '11-dokumenti.js'];

const snimki = [];
for (const f of redNaModulite()) {
    if (!SASTAVYAT.includes(f)) continue;
    const telo = fs.readFileSync(path.join(JS, f), 'utf8');
    for (const [i, red] of telo.split('\n').entries()) {
        if (!/appData\.currentProject/.test(red)) continue;
        if (/^\s*(\/\/|\*)/.test(red)) continue;          // коментарите не са код
        // присвояването е друго: там снимката се СЪЗДАВА
        if (/appData\.currentProject\s*=/.test(red)) continue;
        // проверката „има ли изобщо избран обект“ е наред върху снимката
        if (/if\s*\(!appData\.currentProject\)/.test(red)) continue;
        // четене през живия запис — точно каквото искаме
        if (/_zhivObekt\(\)\s*\|\|/.test(red)) continue;
        snimki.push(`${f}:${i + 1}  ${red.trim().slice(0, 80)}`);
    }
}

t('съставянето никъде не чете снимката вместо живия запис',
  snimki.length === 0, snimki);

// И че живият запис наистина се ползва на четирите места.
for (const f of SASTAVYAT) {
    const telo = fs.readFileSync(path.join(JS, f), 'utf8');
    const broy = (telo.match(/_zhivObekt\(\) \|\| appData\.currentProject/g) || []).length;
    t(`${f} чете живия запис (${broy} места)`, broy >= 2, broy);
}

// ── и защо изобщо има значение ───────────────────────────────────────────────
// Показва се разликата: чекнатото влиза в живия запис, снимката си остава
// каквато е била.

const zhiv = { id: 'x', stroej: 'Проба', nadzor_otmetnati: [] };
const danni = { projects: [zhiv], currentProject: JSON.parse(JSON.stringify(zhiv)) };
zhiv.nadzor_otmetnati.push('Бетонов дневник');     // операторът чеква

const _zhivObekt = () => danni.projects.find(x => x.id === danni.currentProject.id);
t('живият запис вижда чекнатото',
  _zhivObekt().nadzor_otmetnati.length === 1);
t('снимката НЕ го вижда — това беше дефектът',
  danni.currentProject.nadzor_otmetnati.length === 0);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — съставянето чете живото`);
process.exit(loshi.length ? 1 : 0);
