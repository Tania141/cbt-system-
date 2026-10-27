// Видът на строежа като код — на ДВЕ места.
//
// `js/06-stranici.js` го носи за старото ПВА; `akt/most.js` го повтаря, защото
// онзи модул не се зарежда в новото. Повторението е опасно: разминат ли се,
// `_kesPriloshim` ще обяви етажите и котите на сграда за НЕПРИЛОЖИМИ и Екран 7
// ще скрие точно каквото трябва да покаже — мълчаливо.
//
// Затова тази проба чете и двата файла и пада, ако не са едно и също.
const fs = require('fs');
const path = require('path');

const KOREN = path.join(__dirname, '..');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

function vzemi(fajl) {
    const src = fs.readFileSync(path.join(KOREN, fajl), 'utf8');
    const m = /const _VID_KOD = (\{[\s\S]*?\});/.exec(src);
    if (!m) return null;
    return eval('(' + m[1] + ')');   // eslint-disable-line no-eval
}

const kuhnya = vzemi('js/06-stranici.js');
const most = vzemi('akt/most.js');

t('кухнята има _VID_KOD', !!kuhnya);
t('мостът има _VID_KOD', !!most);

if (kuhnya && most) {
    t('двете таблици имат еднакви ключове',
      JSON.stringify(Object.keys(kuhnya).sort()) === JSON.stringify(Object.keys(most).sort()),
      { kuhnya: Object.keys(kuhnya), most: Object.keys(most) });
    for (const k of Object.keys(kuhnya))
        t(`„${k}“ дава едно и също`, kuhnya[k] === most[k], { kuhnya: kuhnya[k], most: most[k] });
    // Четирите кода са тези, с които `_KES_ZA_VID` сравнява.
    for (const kod of ['sgrada', 'lineen', 'lineen_ktp', 'saorajenie'])
        t(`кодът „${kod}“ го има`, Object.values(most).includes(kod));
}

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — видът е един`);
process.exit(loshi.length ? 1 : 0);
