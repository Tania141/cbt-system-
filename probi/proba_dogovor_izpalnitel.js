// Договор за СМР без думата „строител“ (18.11.2026, Митко Ситекс,
// „Дстроител.PDF“): страните са ВЪЗЛОЖИТЕЛ и ИЗПЪЛНИТЕЛ, и паспортът казваше
// „няма посочен строител — това не изглежда като договор за строителство“.
const { JSDOM } = require('jsdom');
const { kod, grab } = require('./kod');
const s = kod();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak).slice(0, 300)));

const dom = new JSDOM(`<body>
    <input id="fp-builder-company"><input id="fp-builder-eik"><input id="fp-builder-address">
    <input id="fp-builder-manager"><input id="fp-builder-tech"></body>`, { runScripts: 'outside-only' });
const w = dom.window;
const konst = ime => { const m = s.match(new RegExp('const ' + ime + ' = [\\s\\S]*?;\\n')); if (!m) throw new Error('няма ' + ime); return m[0]; };
w.eval([konst('_DOGOVOR_POLETA'), konst('_dogovorTekst'), grab(s, '_dogovorIzpalnitel'), grab(s, '_dogovorNapalni')].join('\n')
    + '\nwindow._dogovorNapalni = _dogovorNapalni; window._dogovorIzpalnitel = _dogovorIzpalnitel;'
    + '\nwindow._s2esc = x => String(x);'
    + '\nfunction _s2esc(x) { return String(x); }');
const v = id => w.document.getElementById(id).value;

// четецът върнал ИЗПЪЛНИТЕЛЯ като „друг“
const dok = { vid_kod: 'DOGOVOR_STROITEL', nomer: { stoynost: '' }, data: { stoynost: '27.11.2023' },
    uchastnici: [
        { rolya: 'възложител', ime: { stoynost: 'Възложител Пробов' }, eik: { stoynost: '' } },
        { rolya: 'друг', ime: { stoynost: '„ПРОБА“ ЕООД' }, eik: { stoynost: '123456789' },
          predstavlyavan_ot: { stoynost: 'Управител Пробова' }, adres: { stoynost: 'гр. София' } },
    ] };
const html = w._dogovorNapalni(dok, 'Дстроител.PDF');
t('не казва „няма посочен строител“', !/няма посочен строител/.test(html), html);
t('попълва фирмата на изпълнителя', v('fp-builder-company') === '„ПРОБА“ ЕООД', v('fp-builder-company'));
t('и ЕИК-а', v('fp-builder-eik') === '123456789', v('fp-builder-eik'));
t('казва, че изпълнителят е взет за строител', /ИЗПЪЛНИТЕЛ в договора — взета за строител/.test(html), html);

// чужд документ — не се гадае
for (const id of ['fp-builder-company', 'fp-builder-eik', 'fp-builder-address', 'fp-builder-manager', 'fp-builder-tech'])
    w.document.getElementById(id).value = '';
const skica = { vid_kod: 'SKICA', uchastnici: [{ rolya: 'друг', ime: { stoynost: 'АГКК' }, eik: { stoynost: '111' } }] };
t('скица не става договор', /няма посочен строител/.test(w._dogovorNapalni(skica, 'скица.pdf')) && !v('fp-builder-company'));
// две други страни с ЕИК — не се избира
const dve = { vid_kod: 'DOGOVOR_STROITEL', uchastnici: [
    { rolya: 'друг', ime: { stoynost: 'А ЕООД' }, eik: { stoynost: '1' } },
    { rolya: 'друг', ime: { stoynost: 'Б ЕООД' }, eik: { stoynost: '2' } }] };
t('при две възможни страни — не гадае', w._dogovorIzpalnitel(dve).vzet === null);
// четецът вече казва „строител“ — нищо не се пипа
const veche = { vid_kod: 'DOGOVOR_STROITEL', uchastnici: [{ rolya: 'строител', ime: { stoynost: 'В ЕООД' }, eik: { stoynost: '3' } }] };
t('когато строителят е посочен — без бележка', w._dogovorIzpalnitel(veche).vzet === null);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — изпълнителят в договор за СМР е строителят`);
process.exit(loshi.length ? 1 : 0);
