// Два раздела — последният не трие тихо; кандидатите — едно твърдение (26.11.2026).
//
// Радулов: архивът в 16:19 имаше Петракиев в библиотеката; след това екранът
// казваше „няма подобни“, а „Липсва ми“ пак беше чеклистът. Всеки раздел
// пише цялото в `akt_v5` — отворен ли е друг (старото ПВА, второ копие),
// записът му връща по-старото. Сега раздел, който не е видял последния печат,
// не пише и казва „презареди“.
//
// И: „Видени, но неописани“ казваше „чеклистът не ги знае“ за документи, които
// досието показва с „доказва: …“. Операторът: „2 различни твърдения“.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'akt', 'yadro.js'), 'utf8');
const dosie = fs.readFileSync(path.join(__dirname, '..', 'akt', 'dosie.js'), 'utf8');
const grab = (s, ime) => { const m = new RegExp('^function ' + ime + '\\b[\\s\\S]*?\\n}', 'm').exec(s); return m ? m[0] : ''; };

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

// общ localStorage за двата „раздела“; всеки раздел — свой globalThis._aktKoga
const sklad = {};
global.localStorage = { getItem: k => (k in sklad ? sklad[k] : null), setItem: (k, v) => { sklad[k] = String(v); } };
const kazano = [];
const razdel = () => {
    const g = { _aktKoga: '' };
    const kod = [grab(src, '_aktChuzhdZapis').replace(/globalThis/g, 'g'), grab(src, '_aktPechat').replace(/globalThis/g, 'g'),
                 (/^const _AKT_CHUZHD = [\s\S]*?;$/m.exec(src) || [''])[0],
                 grab(src, 'aktZapishi').replace(/globalThis/g, 'g')].join('\n');
    const danni = { projects: [], podobni: [] };
    const F = new Function('g', 'aktDanni', 'aktKazhiZapis', 'AKT_KLYUCH',
        'let aktProcheteno = true;\n' + kod + '\nreturn aktZapishi;')(g, danni, (x) => kazano.push(x), 'akt_v5');
    g._aktKoga = localStorage.getItem('akt_v5_koga') || '';
    return { g, danni, zapishi: F };
};

const A = razdel();                    // новото ПВА
const B = razdel();                    // втори раздел, отворен по същото време
A.danni.podobni.push({ id: 'pod1' });
t('раздел A пише', A.zapishi() === true && JSON.parse(sklad.akt_v5).podobni.length === 1, sklad.akt_v5);
t('раздел B (не е видял записа на A) НЕ пише', B.zapishi() === false, sklad.akt_v5);
t('библиотеката, записана от A, остава', JSON.parse(sklad.akt_v5).podobni.length === 1, sklad.akt_v5);
t('B казва „презареди“', kazano.some(x => /Презареди/.test(x)), kazano);
t('A продължава да пише след своя запис', A.zapishi() === true);
const C = razdel();                    // презареден раздел вижда печата
t('презареденият раздел пише', C.zapishi() === true);

// кухнята (старото ПВА) пази същото
const osnova = fs.readFileSync(path.join(__dirname, '..', 'js', '01-osnova.js'), 'utf8');
t('saveData на старото ПВА проверява печата преди запис', /_osChuzhdZapis\(\)[\s\S]{0,200}return false/.test(grab(osnova, 'saveData')), '');
t('saveData оставя печат', /akt_v5_koga/.test(grab(osnova, 'saveData')), '');
t('loadData помни печата при зареждане', /_aktKoga = localStorage\.getItem\('akt_v5_koga'\)/.test(grab(osnova, 'loadData')), '');

// ── „Видени, но неописани“: вече описаното не стои ──────────────────────────
const opisani = new Function(grab(dosie, 'dosieKandOpisani') + '\nreturn dosieKandOpisani;')();
const o = opisani({ dokumenti: [
    { vid: 'Протокол от контрол на импеданса Zs на контура "фаза – защитен проводник"', cheklist_red: 'Протоколи за измерване на електрическите инсталации' },
    { vid: 'Сертификат за акредитация', cheklist_red: '' }] });
t('документ, който доказва ред — описан (и при различни кавички)', o.has('протокол от контрол на импеданса zs на контура фаза – защитен проводник'), [...o]);
t('документ без ред — остава кандидат', !o.has('сертификат за акредитация'), [...o]);
t('списъкът се филтрира по досието', /opisani\.has\(c\.klyuch\)/.test(grab(dosie, 'dosieKandidatiHtml')), '');

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — два раздела не се трият; едно твърдение`);
process.exit(loshi.length ? 1 : 0);
