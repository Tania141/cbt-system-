// „Подписва само …“ — един избор вместо сто отметки (17.11.2026).
//
// Операторът: „нека да има избери един, защото ако са 100 апартамента, а
// представителят е 1 или 2, голямо кликане става“.
const { JSDOM } = require('jsdom');
const { kod, grab } = require('./kod');
const s = kod();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const dom = new JSDOM('<body><div id="sp"></div></body>', { runScripts: 'outside-only' });
const w = dom.window;
w.eval([grab(s, 'renderSignersChecklist'), grab(s, 'podpisvaSamo'), grab(s, 'readSigners')].join('\n')
    + '\nwindow.renderSignersChecklist = renderSignersChecklist; window.podpisvaSamo = podpisvaSamo; window.readSigners = readSigners;'
    + '\nwindow.vazlozhiteli = p => ({ spisak: p.clients, otkade: "registar" });');

const clients = Array.from({ length: 100 }, (_, i) => ({ name: `Собственик ${i + 1}${i === 41 ? ' <О\'Нийл>' : ''}` }));
w.renderSignersChecklist('sp', { clients });
const d = w.document;
t('има избор „подписва само…“', !!d.querySelector('#sp select'), '');
t('името с кавички и < > не чупи страницата', d.querySelectorAll('#sp option').length === 101, d.querySelectorAll('#sp option').length);
t('по подразбиране подписват всички', w.readSigners('sp').length === 100, w.readSigners('sp').length);
w.podpisvaSamo('sp', '42');
t('„подписва само“ → един', JSON.stringify(w.readSigners('sp')) === '[42]', w.readSigners('sp'));
t('и казва колко подписват', /подписват 1 от 100/.test(d.querySelector('[data-signer-broj]').textContent), '');
d.querySelector('input[data-signer="7"]').checked = true;
t('после се добавя втори на ръка', JSON.stringify(w.readSigners('sp')) === '[7,42]', w.readSigners('sp'));
w.podpisvaSamo('sp', 'nikoy');
t('„никой“', w.readSigners('sp').length === 0, '');
w.podpisvaSamo('sp', 'vsichki');
t('„всички“', w.readSigners('sp').length === 100, '');
w.renderSignersChecklist('sp', { clients: [{ name: 'Само един' }] });
t('при един възложител — без избор', !d.querySelector('#sp select'), '');

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — един избор вместо сто отметки`);
process.exit(loshi.length ? 1 : 0);
