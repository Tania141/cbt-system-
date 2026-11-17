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

// ── старото поле „Упълномощен представител“ (17.11.2026) ────────────────────
// Живее само в паспорта на старото ПВА и тихо биеше избора. Вече не влиза в
// документа; записано ли е — екранът го казва и предлага да се махне.
w.eval(grab(s, 'mahniStariyaPredstavitel') + '\nwindow.mahniStariyaPredstavitel = mahniStariyaPredstavitel;'
    + '\nvar zapisano = []; window._s2ZapishiTiho = (p, k) => zapisano.push(k);');
const star = { id: 'ob1', clients: [{ name: 'А' }, { name: 'Б' }], upalnomoshten_predstavitel: 'Иван Старов' };
w.appData = { projects: [star] };
w.renderSignersChecklist('sp', star);
const bel = d.querySelector('[data-star-predstavitel]');
t('старият представител се казва', !!bel && /Иван Старов/.test(bel.textContent), bel && bel.textContent);
t('и казва, че вече не влиза', !!bel && /не влиза в документа/.test(bel.textContent), '');
t('изборът кой подписва си работи', w.readSigners('sp').length === 2, w.readSigners('sp'));
// jsdom тук не пуска onclick от HTML-а — проверява се, че бутонът вика
// функцията с правилния обект, и тя се вика пряко.
t('бутонът сочи този обект', /mahniStariyaPredstavitel\('sp', 'ob1'\)/.test(bel.innerHTML), bel.innerHTML);
w.mahniStariyaPredstavitel('sp', 'ob1');
t('„махни го“ трие полето', !('upalnomoshten_predstavitel' in star), star);
t('и записва', w.eval('zapisano.length') === 1, w.eval('zapisano'));
t('бележката изчезва', !d.querySelector('[data-star-predstavitel]'), '');
t('към сървъра полето отива празно',
  /add\('Възложител_Упълномощен_Представител', ''\)/.test(s), '');

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — един избор вместо сто отметки`);
process.exit(loshi.length ? 1 : 0);
