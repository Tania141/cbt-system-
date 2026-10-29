// ДЕМОНСТРАЦИОННИЯТ ОБЕКТ — показва се на хора, значи трябва да е верен.
//
// Направен на 29.10.2026, за да може системата да се покаже, без да излизат
// данни на истински възложители. Пробата го пази от тихо изгниване: смени ли се
// нещо в кухнята, демото или ще спре да се пълни, или ще се пълни грешно, и в
// двата случая това се вижда ТУК, а не пред гост.
//
// Пази и границата, заради която демото изобщо съществува: нито един истински
// идентификатор, нито едно истинско име.
const fs = require('fs');
const path = require('path');
const { kod, grab } = require('./kod');
const s = kod();

const F = new Function(
    (new RegExp('^const _S2_TABLICI = [\\s\\S]*?\\n\\];$', 'm').exec(s) || [''])[0] + '\n'
    + (new RegExp('^const _A15_VIDOVE = [\\s\\S]*?\\n\\];$', 'm').exec(s) || [''])[0] + '\n'
    + (new RegExp('^const _A15_CHASTI = [\\s\\S]*?\\n\\];$', 'm').exec(s) || [''])[0] + '\n'
    + (new RegExp('^const _A15_RAZDELI = \\{[\\s\\S]*?\\n\\};$', 'm').exec(s) || [''])[0] + '\n'
    + [grab(s, '_s2Fakti'), grab(s, '_s2KlPoKoloni'), grab(s, '_s2SverimiKl'),
       grab(s, '_s2Sveren'), grab(s, '_dokIme'),
       grab(s, '_dokKlyuchIme'), grab(s, '_dokKlyuchNomer'), grab(s, '_dokNomerOtTekst'),
       grab(s, '_dokRed'), grab(s, 'dokTetradka'), grab(s, 'dokVliza'), grab(s, 'dokIzrechenie'),
       grab(s, '_a15Chast'), grab(s, '_a15Svereni'), grab(s, '_a15TekstNa'),
       grab(s, '_a15Sortirai'), grab(s, '_a15Red'), grab(s, '_a15BezPovtor'),
       grab(s, '_a15Negov'), grab(s, '_a15PoIzraz'), grab(s, '_a15AktoveProtokoli'),
       grab(s, '_a15Sobstvenost'), grab(s, '_a15Skici'), grab(s, '_a15DogovoriMrezhi')].join('\n')
    + '\nconst _s2Id = d => d.id || d.fajl;'
    + '\nconst _DOK_PROCHETEN = "прочетен", _DOK_VPISAN = "вписан", _DOK_OTMETNAT = "отметнат";'
    + '\nconst _a15DataNa = r => String(r.data || "").trim();'
    + '\nreturn {dokTetradka, dokVliza, _a15AktoveProtokoli, _a15Sobstvenost,'
    + ' _a15Skici, _a15DogovoriMrezhi};')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const PAPKA = path.join(__dirname, '..', 'demo');
const demo = JSON.parse(fs.readFileSync(path.join(PAPKA, 'demo-obekt.json'), 'utf8'));
const O = demo.obekt;

// ── демото се пълни ─────────────────────────────────────────────────────────
const tet = F.dokTetradka(O, O);
const vliza = F.dokVliza(O, O);
t('тетрадката е пълна', tet.length === 11, tet.length);
t('и точно един документ чака сверяване',
  tet.length - vliza.length === 1, [tet.length, vliza.length]);

const r13 = F._a15AktoveProtokoli(O, O);
t('1.3 показва диапазон при трите акта обр. 7',
  /от 14\.03\.2025 до 11\.09\.2025 г\./.test(r13.join('')), r13);
t('и брой', /— 3 броя/.test(r13.join('')), r13);
t('1.1 изрежда нотариалния акт', F._a15Sobstvenost(O, O).length === 1, F._a15Sobstvenost(O, O));
t('1.4 изрежда скицата', F._a15Skici(O, O).length === 1, F._a15Skici(O, O));
t('1.5 изрежда договора с мрежата',
  F._a15DogovoriMrezhi(O, O).length === 1, F._a15DogovoriMrezhi(O, O));

// ── нищо истинско вътре ─────────────────────────────────────────────────────
// Идентификатор с една сбъркана цифра сочи ЧУЖД имот и не личи. В демо, което
// се показва на хора, не бива да има нито един годен за истина.
const tekst = JSON.stringify(demo);
t('идентификаторите са явно измислени',
  (tekst.match(/\d{5}\.\d{1,5}\.\d{1,5}/g) || []).every(x => /^0{5}\./.test(x)),
  [...new Set(tekst.match(/\d{5}\.\d{1,5}\.\d{1,5}/g) || [])]);
t('няма ЕГН', !/\b\d{10}\b/.test(tekst), (tekst.match(/\b\d{10}\b/g) || []).slice(0, 3));
for (const ime of ['Денка', 'Петракиев', 'Миков', 'Джихат', 'Връбница', 'Овча купел',
                   'СиБиТи', 'Си Би Ти', 'Спасова'])
    t(`няма „${ime}“ в демото`, !tekst.includes(ime));

// ── страницата, която го слага ──────────────────────────────────────────────
const stranica = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
t('страницата ДОПИСВА, а не презаписва склада',
  /\.push\(demo\.obekt\)/.test(stranica) && !/setItem\(KLYUCH,\s*JSON\.stringify\(\{/.test(stranica));
t('и маха демото само по неговия id',
  /p\.id !== idObekt/.test(stranica), '');
t('демото се познава по id, което не прилича на обект',
  O.id === 'demo-obekt', O.id);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — демото е вярно и чисто`);
process.exit(loshi.length ? 1 : 0);
