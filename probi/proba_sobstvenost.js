// Регистърът на собствеността: дроби, сметка, находки, възложители.
const fs = require('fs'); const s = fs.readFileSync(__dirname + '/../index.html', 'utf8');
function grab(n) {
    const i = s.indexOf('function ' + n + '(');
    if (i < 0) throw new Error('няма ' + n);
    let k = s.indexOf('{', i), b = 0;
    for (; k < s.length; k++) { if (s[k] === '{') b++; else if (s[k] === '}') { b--; if (!b) return s.slice(i, k + 1); } }
}
const parche = (ot, do_) => s.slice(s.indexOf(ot), s.indexOf(do_));

const f = new Function(
    "const _s2esc=x=>String(x??'');\n"
    + parche('const _nod =', '// ── данните')
    + parche('const _SB_VID =', 'function _sbDanni')
    + [grab('_sbDanni')].join('\n') + '\n'
    + parche('const _sbLice =', '// ── сметката')
    + [grab('_sbSmetka'), grab('_sbSabrano'), grab('_sbVazlozhiteli'), grab('_sbNahodki')].join('\n')
    + '\nconst _sbImeImeBezopasno=(s,id)=>_sbImeLice(s,id);\n'
    + 'return {_dr,_drTekst,_drSabi,_sbSmetka,_sbSabrano,_sbVazlozhiteli,_sbNahodki,_sbDanni};');
const F = f();

const ok = [], lo = [];
const t = (u, c, kak) => (c ? ok : lo).push(u + (c ? '' : '  → ' + kak));

// ── дроби ──────────────────────────────────────────────────────────────────
t('1/2 се чете', F._drTekst(F._dr('1/2')) === '1/2', F._drTekst(F._dr('1/2')));
t('2/4 се свива до 1/2', F._drTekst(F._dr('2/4')) === '1/2', F._drTekst(F._dr('2/4')));
t('„50%“ не е дроб', F._dr('50%') === null, F._dr('50%'));
t('„0.5“ не е дроб', F._dr('0.5') === null, F._dr('0.5'));
t('1/3 + 1/6 + 1/2 = 1', F._drTekst(F._drSabi(F._drSabi(F._dr('1/3'), F._dr('1/6')), F._dr('1/2'))) === '1');

// ── имот: земя, продадена наполовина, после наследство ─────────────────────
const p = { pi: '68134.4354.781' };
const s1 = F._sbDanni(p);
const L = (id, ime, extra) => { s1.lica.push({ id, ime, ...extra }); return id; };
L('ivan', 'Иван Петров');          // датата на смъртта се вписва по-долу
L('maria', 'Мария Петрова');
L('a', 'Анна'); L('b', 'Борис'); L('c', 'Цветан');
L('stroy', 'Строй ЕООД', { vid: 'юридическо' });
s1.obekti.push({ id: 'zemya', vid: 'земя', identifikator: '68134.4354.781' });
const E = (o) => s1.sabitia.push({ id: 'e' + s1.sabitia.length, obekt: 'zemya', ...o });

E({ data: '05.05.2001', vid: 'първоначално', ot: null, na: 'ivan', dyal: '1/2' });
E({ data: '05.05.2001', vid: 'първоначално', ot: null, na: 'maria', dyal: '1/2' });
t('двама по 1/2 → събрани 1', F._drTekst(F._sbSabrano(p, 'zemya')) === '1', F._drTekst(F._sbSabrano(p, 'zemya')));
t('пълна верига → няма находки', F._sbNahodki(p).length === 0, JSON.stringify(F._sbNahodki(p)));

// Иван умира, трима наследници по 1/3 от неговата 1/2 → по 1/6
s1.lica.find(l => l.id === 'ivan').pochinal = '12.03.2019';
for (const h of ['a', 'b', 'c'])
    E({ data: '12.03.2019', vid: 'наследяване', ot: 'ivan', na: h, dyal: '1/6' });
const salda = F._sbSmetka(p, 'zemya');
t('Иван остава с 0', F._drTekst(salda.get('ivan')) === '0', F._drTekst(salda.get('ivan')));
t('всеки наследник има 1/6', ['a', 'b', 'c'].every(h => F._drTekst(salda.get(h)) === '1/6'));
t('след наследството пак е 1/1', F._drTekst(F._sbSabrano(p, 'zemya')) === '1', F._drTekst(F._sbSabrano(p, 'zemya')));
t('наследството не прави находка', F._sbNahodki(p).length === 0, JSON.stringify(F._sbNahodki(p)));

// ── дупка във веригата ─────────────────────────────────────────────────────
// Вписани са само двама наследници. Сборът СИ ОСТАВА 1/1 — аритметиката не
// вижда нищо. Но покойникът още държи 1/6; това е липсващото звено.
s1.sabitia = s1.sabitia.filter(e => e.na !== 'c');
const n1 = F._sbNahodki(p);
t('сборът продължава да е 1/1', F._drTekst(F._sbSabrano(p, 'zemya')) === '1');
t('покойникът, който още държи дял, се вижда',
   n1.some(x => x.vid === 'pochinal' && /1\/6/.test(x.tekst) && /Иван/.test(x.tekst)),
   JSON.stringify(n1));

// ── продал повече, отколкото има ───────────────────────────────────────────
E({ data: '01.02.2024', vid: 'покупко-продажба', ot: 'a', na: 'stroy', dyal: '1/2' });
t('свръхпродажбата се хваща', F._sbNahodki(p).some(x => x.vid === 'minus'),
   JSON.stringify(F._sbNahodki(p)));

// ── възложителите се извеждат към дата ─────────────────────────────────────
const p2 = { pi: '1' };
const s2 = F._sbDanni(p2);
s2.lica.push({ id: 'z', ime: 'Земевладелец' }, { id: 'sup', ime: 'Суперфициар ООД' }, { id: 'kup', ime: 'Купувач' });
s2.obekti.push({ id: 'zem', vid: 'земя', identifikator: '1' },
                { id: 'ps', vid: 'право на строеж', opisanie: 'право на строеж' },
                { id: 'ap7', vid: 'самостоятелен обект', opisanie: 'апартамент 7' });
s2.sabitia.push(
    { id: '1', obekt: 'zem', data: '01.01.2020', vid: 'първоначално', ot: null, na: 'z', dyal: '1/1' },
    { id: '2', obekt: 'ps', data: '01.06.2022', vid: 'учредяване право на строеж', ot: null, na: 'sup', dyal: '1/1' },
    { id: '3', obekt: 'ap7', data: '15.04.2025', vid: 'покупко-продажба', ot: null, na: 'kup', dyal: '1/1' });

const v2022 = F._sbVazlozhiteli(p2, '01.01.2022').map(x => x.ime).sort();
const v2026 = F._sbVazlozhiteli(p2, '01.01.2026').map(x => x.ime).sort();
t('към 2022 възложител е само земевладелецът', JSON.stringify(v2022) === JSON.stringify(['Земевладелец']), v2022);
t('към 2026 са тримата (вкл. суперфициарът)',
   JSON.stringify(v2026) === JSON.stringify(['Земевладелец', 'Купувач', 'Суперфициар ООД']), v2026);
t('суперфициарът е възложител', v2026.includes('Суперфициар ООД'));

ok.forEach(x => console.log('  ok  ' + x));
lo.forEach(x => console.log('  ЛО  ' + x));
console.log(lo.length ? '\n' + lo.length + ' проблема' : '\n' + ok.length + ' проверки — всичко е наред');

// ── към документите ────────────────────────────────────────────────────────
const G = new Function(
    "const _s2esc=x=>String(x??'');\n"
    + parche('const _nod =', '// ── данните')
    + parche('const _SB_VID =', 'function _sbDanni')
    + grab('_sbDanni') + '\n'
    + parche('const _sbLice =', '// ── сметката')
    + [grab('_sbSmetka'), grab('_sbSabrano'), grab('_sbVazlozhiteli'),
       grab('_sbDveImena'), grab('_sbKlienti'), grab('_sbPredstavitel')].join('\n')
    + '\nreturn {_sbDveImena,_sbKlienti,_sbPredstavitel,_sbDanni};')();

const o2 = [], l2 = [];
const u = (x, c, kak) => (c ? o2 : l2).push(x + (c ? '' : '  → ' + kak));

u('три имена → две', G._sbDveImena('Иван Георгиев Петров') === 'Иван Петров', G._sbDveImena('Иван Георгиев Петров'));
u('две имена си остават две', G._sbDveImena('Мария Петрова') === 'Мария Петрова');
u('фирмата се изписва цяла', G._sbDveImena('Строй Инвест ЕООД') === 'Строй Инвест ЕООД', G._sbDveImena('Строй Инвест ЕООД'));

const p3 = { pi: '1' };
const s3 = G._sbDanni(p3);
s3.lica.push({ id: 'z', ime: 'Иван Георгиев Петров' },
             { id: 'sup', ime: 'Строй ЕООД', vid: 'юридическо', egn: '123456789' });
s3.obekti.push({ id: 'zem', vid: 'земя', identifikator: '1' },
               { id: 'ps', vid: 'право на строеж', opisanie: 'право на строеж' });
s3.sabitia.push({ id: '1', obekt: 'zem', data: '01.01.2020', vid: 'първоначално', ot: null, na: 'z', dyal: '1/1' },
                { id: '2', obekt: 'ps', data: '01.06.2022', vid: 'учредяване право на строеж', ot: null, na: 'sup', dyal: '1/1' });

const kl = G._sbKlienti(p3, '01.01.2026');
u('хедърът дава двама', kl.length === 2, kl.length);
u('физическото лице е с две имена', kl[0].dveImena === 'Иван Петров', kl[0].dveImena);
u('фирмата е ЮЛ с ЕИК', kl[1].type === 'ЮЛ' && kl[1].eik === '123456789', JSON.stringify(kl[1]));
u('представителят по подразбиране е първият', G._sbPredstavitel(p3, '01.01.2026') === 'Иван Петров', G._sbPredstavitel(p3, '01.01.2026'));
s3.predstavitel = 'sup';
u('изборът на представител се пази', G._sbPredstavitel(p3, '01.01.2026') === 'Строй ЕООД', G._sbPredstavitel(p3, '01.01.2026'));
u('преди учредяването представителят е само земевладелецът',
  G._sbKlienti(p3, '01.01.2021').length === 1, G._sbKlienti(p3, '01.01.2021').length);

o2.forEach(x => console.log('  ok  ' + x));
l2.forEach(x => console.log('  ЛО  ' + x));


// ── коренът и чеклистът ────────────────────────────────────────────────────
const H = new Function(
    "const _s2esc=x=>String(x??'');\n"
    + parche('const _nod =', '// ── данните')
    + parche('const _SB_VID =', 'function _sbDanni')
    + grab('_sbDanni') + '\n'
    + parche('const _sbLice =', '// ── сметката')
    + [grab('_sbSmetka'), grab('_sbSabrano'), grab('_sbVazlozhiteli'), grab('_sbNahodki')].join('\n')
    + '\nconst _sbImeImeBezopasno=(s,id)=>_sbImeLice(s,id);\n'
    + parche('const _SB_REDOVE =', 'function _sbKoren')
    + [grab('_sbKoren'), grab('_sbSastoyanie'), grab('_sbPodmeniCheklist')].join('\n')
    + '\nreturn {_sbDanni,_sbKoren,_sbSastoyanie,_sbPodmeniCheklist,_SB_REDOVE};')();

const o3 = [], l3 = [];
const w = (x, c, kak) => (c ? o3 : l3).push(x + (c ? '' : '  → ' + kak));

// преустройство: земя + магазин, строи се В МАГАЗИНА
const p4 = { pi: '1' };
const s4 = H._sbDanni(p4);
s4.lica.push({ id: 'm', ime: 'Магазинер' });
s4.obekti.push({ id: 'zem', vid: 'земя', identifikator: '1' },
               { id: 'mag', vid: 'самостоятелен обект', opisanie: 'магазин 2' });
s4.sabitia.push({ id: '1', obekt: 'mag', data: '01.01.2009', vid: 'покупко-продажба', ot: null, na: 'm', dyal: '1/1', vid_: '' });
s4.sabitia[0].vid = 'първоначално';

w('без избор коренът е земята', H._sbKoren(p4).id === 'zem', H._sbKoren(p4).id);
w('без избор състоянието не е готово', !H._sbSastoyanie(p4).gotovo);
s4.koren = 'mag';
w('избраният корен се ползва', H._sbKoren(p4).id === 'mag', H._sbKoren(p4).id);
w('магазинът е събран 1/1 → готово', H._sbSastoyanie(p4).gotovo, H._sbSastoyanie(p4).tekst);

// чеклистът
const r4 = { grupi: [
    { moment: 'ОСИП', dokumenti: [
        { dokument: 'Документ за собственост на имота', sastoyanie: 'очаква се' },
        { dokument: 'Нотариален акт за учредено право на строеж', sastoyanie: 'очаква се' },
        { dokument: 'Виза за проектиране', sastoyanie: 'очаква се' }] },
    { moment: 'Протокол 2', dokumenti: [
        { dokument: 'Документ за собственост или документ за учредено право на строеж', sastoyanie: 'очаква се' },
        { dokument: 'Протокол за строителна линия', sastoyanie: 'очаква се' }] }] };
H._sbPodmeniCheklist(p4, r4);
const imena = r4.grupi.flatMap(g => g.dokumenti.map(d => d.dokument));
w('трите реда ги няма', !H._SB_REDOVE.some(x => imena.includes(x)), imena);
w('добавен е един ред „Собственост“', imena.filter(x => /^Собственост/.test(x)).length === 1, imena);
w('той е на първия момент, в който е имало такъв ред',
  /^Собственост/.test(r4.grupi[0].dokumenti[0].dokument), r4.grupi[0].dokumenti[0].dokument);
w('щом веригата връзва, редът е „налично“',
  r4.grupi[0].dokumenti[0].sastoyanie === 'налично', r4.grupi[0].dokumenti[0].sastoyanie);
w('останалите редове не са пипнати', imena.includes('Виза за проектиране') && imena.includes('Протокол за строителна линия'));

o3.forEach(x => console.log('  ok  ' + x));
l3.forEach(x => console.log('  ЛО  ' + x));




// ── приемането на прочетен акт ─────────────────────────────────────────────
const K = new Function(
    "const _s2esc=x=>String(x??'');let _zapisi=[];\n"
    + parche('const _nod =', '// ── данните')
    + parche('const _SB_VID =', 'function _sbDanni')
    + grab('_sbDanni') + '\n'
    + parche('const _sbLice =', '// ── сметката')
    + [grab('_sbSmetka'), grab('_sbSabrano'), grab('_sbVazlozhiteli'), grab('_sbNahodki')].join('\n')
    + '\nconst _sbImeImeBezopasno=(s,id)=>_sbImeLice(s,id);\n'
    + 'let _tekusht=null;const _zhivObekt=()=>_tekusht;'
    + 'const _sbZapishi=(p,k)=>_zapisi.push(k);const _prerisuvai=()=>{};\n'
    + grab('sbPriemi')
    + '\nreturn {_sbDanni,sbPriemi,set:(p)=>{_tekusht=p},_sbSabrano,_sbNahodki,zapisi:()=>_zapisi};')();

const o4 = [], l4 = [];
const y = (x, c, kak) => (c ? o4 : l4).push(x + (c ? '' : '  → ' + kak));

const p5 = { pi: '68134.4354.781' };
K._sbDanni(p5);
K.set(p5);
p5._sb_procheteno = {
    fajl: 'na-112.pdf', vid: 'нотариален акт', nomer: '112', tom: 'III',
    registar: '4512', delo: '98/2009', data: '12.05.2009', notarius: 'Петров',
    lica: [{ ime: 'Иван Георгиев Петров', vid: 'физическо', egn_eik: '7001011234' },
           { ime: 'Мария Иванова Петрова', vid: 'физическо' }],
    obekti: [{ identifikator: '68134.4354.781', opisanie: 'поземлен имот', vid: 'земя' }],
    prehvarliania: [
        { vid: 'покупко-продажба', ot: 'Иван Георгиев Петров', na: 'Мария Иванова Петрова',
          dyal: '1/2', obekt: '68134.4354.781', citat: '…продава…' }],
};
K.sbPriemi();
const s5 = p5.sobstvenost;
y('лицата са добавени', s5.lica.length === 2, s5.lica.length);
y('обектът е добавен веднъж', s5.obekti.length === 1, s5.obekti.length);
y('събитието е добавено', s5.sabitia.length === 1, s5.sabitia.length);
y('дялът е запазен като дроб', s5.sabitia[0].dyal === '1/2', s5.sabitia[0].dyal);
y('документът е сглобен', /№ 112.*том III.*рег\. № 4512/.test(s5.sabitia[0].dokument), s5.sabitia[0].dokument);
y('цитатът се пази', s5.sabitia[0].citat === '…продава…');
y('прочетеното е изчистено след приемане', !p5._sb_procheteno);

// втори акт със СЪЩОТО лице — не се дублира
p5._sb_procheteno = {
    fajl: 'na-200.pdf', vid: 'нотариален акт', nomer: '200', data: '01.03.2015',
    lica: [{ ime: '  иван георгиев петров ' }, { ime: 'Строй ЕООД', vid: 'юридическо' }],
    obekti: [{ identifikator: '68134.4354.781' }],
    prehvarliania: [{ vid: 'покупко-продажба', ot: 'иван георгиев петров',
                      na: 'Строй ЕООД', dyal: '1/2', obekt: '68134.4354.781' }],
};
K.sbPriemi();
y('същото лице не се създава втори път (пада регистърът на буквите)',
  p5.sobstvenost.lica.length === 3, p5.sobstvenost.lica.map(l => l.ime));
y('същият обект не се създава втори път', p5.sobstvenost.obekti.length === 1, p5.sobstvenost.obekti.length);
y('двете събития са там', p5.sobstvenost.sabitia.length === 2);

o4.forEach(x => console.log('  ok  ' + x));
l4.forEach(x => console.log('  ЛО  ' + x));


const vsichki = [lo, l2, l3, l4].reduce((n, x) => n + (x ? x.length : 0), 0);
console.log(vsichki ? '\n' + vsichki + ' проблема общо' : '\nи към документите — наред');
process.exit(vsichki ? 1 : 0);
