// Номерът на консултанта е ту число, ту текст — търсенето трябва да е с `==`.
//
// Ражда се като число (`Date.now()`). Мине ли паспортът през сървъра като
// JSON, се връща като текст. Пет места в кода търсеха със `===` и се чупеха
// мълчаливо: секцията „Съставяне на актове и протоколи“ изчезваше зад
// „⚠️ Консултантът не е намерен“, при положение че консултантът си беше там.
//
// Излезе наяве на 23.10.2026, когато новото ПВА почна да записва
// `currentProject` направо в браузъра, без изглаждането на `loadData`.
const fs = require('fs');
const path = require('path');
const { JS, redNaModulite } = require('./kod');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

// ── правилото, написано като проба ───────────────────────────────────────────
// Всяко търсене на консултант ПО НОМЕР НА ОБЕКТА трябва да е с `==`.
// (Сравненията между два вътрешни номера — например `editingConsultantId` —
// не са в обхвата: там и двете страни се раждат на едно място.)

const STROGI = [];
for (const f of redNaModulite()) {
    const telo = fs.readFileSync(path.join(JS, f), 'utf8');
    for (const [i, red] of telo.split('\n').entries()) {
        if (!/consultants\??\.find/.test(red)) continue;
        // САМО по номер. Сравнението по ИМЕ (`c.name === …`) си е строго с
        // право — там двете страни са един и същ текст, не число срещу текст.
        if (!/\.id\s*===/.test(red)) continue;
        // и само когато номерът идва от обекта, а не от вътрешна променлива
        if (/project|currentProject|\bp\?\.consultant|\bp\.consultant/.test(red))
            STROGI.push(`${f}:${i + 1}  ${red.trim().slice(0, 80)}`);
    }
}
t('никое търсене на консултант по номер на обекта не е строго (`===`)',
  STROGI.length === 0, STROGI);

// ── и че наистина намира, каквито и да са типовете ───────────────────────────

const nameri = (spisak, nomer) => spisak.find(c => c.id == nomer);

const SPISAK = [{ id: 1761234567890, name: 'СиБиТи Консулт ЕООД' }];
t('число срещу число', !!nameri(SPISAK, 1761234567890));
t('число срещу текст — тук се чупеше', !!nameri(SPISAK, '1761234567890'));

const KATO_TEKST = [{ id: '1761234567890', name: 'СиБиТи Консулт ЕООД' }];
t('текст срещу число', !!nameri(KATO_TEKST, 1761234567890));
t('текст срещу текст', !!nameri(KATO_TEKST, '1761234567890'));

t('чужд номер не се намира', !nameri(SPISAK, 999));
t('липсващ номер не намира нищо', !nameri(SPISAK, undefined));
t('празен списък не гърми', !nameri([], 1761234567890));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — консултантът се намира`);
process.exit(loshi.length ? 1 : 0);
