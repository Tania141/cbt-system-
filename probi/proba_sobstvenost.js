// Регистърът на собствеността: дроби, сметка, находки, възложители, четене.
// Една кухня за всички проби — функциите се вадят от index.html както са.
const { kod } = require('./kod');
const s = kod();

function grab(n) {
    const i = s.indexOf('function ' + n + '(');
    if (i < 0) throw new Error('няма ' + n);
    let k = s.indexOf('{', i), b = 0;
    for (; k < s.length; k++) { if (s[k] === '{') b++; else if (s[k] === '}') { b--; if (!b) return s.slice(i, k + 1); } }
}
const parche = (ot, do_) => s.slice(s.indexOf(ot), s.indexOf(do_));

const F = new Function(
    "const _s2esc=x=>String(x??'');\n"
    + parche('const _nod =', '// ── данните')
    + parche('const _SB_VID =', 'function _sbDanni')
    + grab('_sbDanni') + '\n'
    + parche('const _sbLice =', '// ── сметката')
    + parche('const _EGN =', 'function _skritoEgn')
    + parche('const _SB_REDOVE =', 'function _sbKoren')
    + parche('const _DOP_REDOVE =', 'function _dopalniCheklist')
    + [grab('_skritoEgn'), grab('_dopalniCheklist'), grab('_drDeli'), grab('sbPopravi'), grab('_sbEdnakvi'), grab('_sbSmetka'), grab('_sbSabrano'), grab('_sbVazlozhiteli'), grab('_sbKoren'),
       grab('_sbNahodki'), grab('_sbSastoyanie'), grab('_sbPodmeniCheklist'),
       grab('_sbDveImena'), grab('_sbKlienti'), grab('_sbPredstavitel')].join('\n')
    + '\nconst _sbImeImeBezopasno=(s,id)=>_sbImeLice(s,id);\n'
    + 'let _t=null;const _zhivObekt=()=>_t;const _sbZapishi=()=>{};const _prerisuvai=()=>{};'
    + 'const showAlert=()=>{};\n'
    + grab('sbPriemi')
    + '\nreturn {_skritoEgn,_dr,_drTekst,_drSabi,_sbDanni,_sbSmetka,_sbSabrano,_sbVazlozhiteli,'
    + '_sbKoren,_sbNahodki,_sbSastoyanie,_sbPodmeniCheklist,_SB_REDOVE,'
    + '_sbDveImena,_sbKlienti,_sbPredstavitel,sbPriemi,sbPopravi,set:p=>{_t=p}};')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));
const nov = () => { const p = { pi: '1' }; F._sbDanni(p); F.set(p); return p; };

// ── 0. ЕГН не се показва ──────────────────────────────────────────────────
// Операторът, 14.10.2026: „четецът НЕ ТРЯБВА да показва ЕГН“.
t('ЕГН се скрива', F._skritoEgn('7212096441') === '••••••••••', F._skritoEgn('7212096441'));
t('ЕИК на фирма се показва', F._skritoEgn('204024246') === '204024246');
t('празното си остава празно', F._skritoEgn('') === '');
t('друг текст не се пипа', F._skritoEgn('гр. София') === 'гр. София');

// ── 1. дроби ───────────────────────────────────────────────────────────────
t('1/2 се чете', F._drTekst(F._dr('1/2')) === '1/2');
t('2/4 се свива до 1/2', F._drTekst(F._dr('2/4')) === '1/2');
t('1/3 + 1/6 + 1/2 = 1', F._drTekst(F._drSabi(F._drSabi(F._dr('1/3'), F._dr('1/6')), F._dr('1/2'))) === '1');
t('8,38 % става точна дроб', F._drTekst(F._dr('8,38%')) === '419/5000', F._drTekst(F._dr('8,38%')));
t('2,169 % става точна дроб', F._drTekst(F._dr('2,169%')) === '2169/100000', F._drTekst(F._dr('2,169%')));
t('„боза“ не е дял', F._dr('боза') === null);

// ── 2. наследство: три по 1/3 от 1/2 → точно 1/6 ──────────────────────────
const p1 = nov();
const s1 = p1.sobstvenost;
s1.lica.push({ id: 'ivan', ime: 'Иван Петров' }, { id: 'maria', ime: 'Мария Петрова' },
             { id: 'a', ime: 'Анна' }, { id: 'b', ime: 'Борис' }, { id: 'c', ime: 'Цветан' });
s1.obekti.push({ id: 'zemya', vid: 'земя', identifikator: '68134.4354.781' });
const E = o => s1.sabitia.push({ id: 'e' + s1.sabitia.length, obekt: 'zemya', ...o });
E({ data: '05.05.2001', vid: 'първоначално', ot: null, na: 'ivan', dyal: '1/2' });
E({ data: '05.05.2001', vid: 'първоначално', ot: null, na: 'maria', dyal: '1/2' });
t('двама по 1/2 → събрани 1', F._drTekst(F._sbSabrano(p1, 'zemya')) === '1');
t('пълна верига → няма находки', F._sbNahodki(p1).length === 0, F._sbNahodki(p1));

s1.lica.find(l => l.id === 'ivan').pochinal = '12.03.2019';
for (const h of ['a', 'b', 'c']) E({ data: '12.03.2019', vid: 'наследяване', ot: 'ivan', na: h, dyal: '1/6' });
t('Иван остава с 0', F._drTekst(F._sbSmetka(p1, 'zemya').get('ivan')) === '0');
t('всеки наследник има 1/6', ['a', 'b', 'c'].every(h => F._drTekst(F._sbSmetka(p1, 'zemya').get(h)) === '1/6'));
t('след наследството пак е 1/1', F._drTekst(F._sbSabrano(p1, 'zemya')) === '1');
t('наследството не прави находка', F._sbNahodki(p1).length === 0, F._sbNahodki(p1));

// Вписани са само двама наследници. Сборът СИ ОСТАВА 1/1 — аритметиката не
// вижда нищо, но покойникът още държи 1/6. Това е липсващото звено.
s1.sabitia = s1.sabitia.filter(e => e.na !== 'c');
t('сборът продължава да е 1/1', F._drTekst(F._sbSabrano(p1, 'zemya')) === '1');
t('покойникът, който още държи дял, се вижда',
  F._sbNahodki(p1).some(x => x.vid === 'pochinal' && /1\/6/.test(x.tekst)), F._sbNahodki(p1));

E({ data: '01.02.2024', vid: 'покупко-продажба', ot: 'a', na: 'maria', dyal: '1/2' });
t('свръхпрехвърлянето се хваща', F._sbNahodki(p1).some(x => x.vid === 'minus'), F._sbNahodki(p1));

// ── 3. възложителите се извеждат към дата ─────────────────────────────────
const p2 = nov();
const s2 = p2.sobstvenost;
s2.lica.push({ id: 'z', ime: 'Иван Георгиев Петров' },
             { id: 'sup', ime: 'Строй ЕООД', vid: 'юридическо', egn: '123456789' },
             { id: 'kup', ime: 'Мария Петрова Иванова' });
s2.obekti.push({ id: 'zem', vid: 'земя', identifikator: '1' },
               { id: 'ps', vid: 'право на строеж', opisanie: 'право на строеж' },
               { id: 'ap7', vid: 'самостоятелен обект', opisanie: 'апартамент 7' });
s2.sabitia.push(
    { id: '1', obekt: 'zem', data: '01.01.2020', vid: 'първоначално', ot: null, na: 'z', dyal: '1/1' },
    { id: '2', obekt: 'ps', data: '01.06.2022', vid: 'учредяване право на строеж', ot: null, na: 'sup', dyal: '1/1' },
    { id: '3', obekt: 'ap7', data: '15.04.2025', vid: 'покупко-продажба', ot: null, na: 'kup', dyal: '1/1' });
const imena = d => F._sbVazlozhiteli(p2, d).map(x => x.ime).sort();
t('към 2021 възложител е само земевладелецът', String(imena('01.01.2021')) === 'Иван Георгиев Петров', imena('01.01.2021'));
t('към 2026 са тримата', imena('01.01.2026').length === 3, imena('01.01.2026'));
t('суперфициарът е възложител', imena('01.01.2026').includes('Строй ЕООД'));

t('три имена → две', F._sbDveImena('Иван Георгиев Петров') === 'Иван Петров');
t('фирмата се изписва цяла', F._sbDveImena('Строй Инвест ЕООД') === 'Строй Инвест ЕООД');
const kl = F._sbKlienti(p2, '01.01.2026');
t('хедърът дава тримата', kl.length === 3, kl.length);
t('физическото лице е с две имена', kl.some(x => x.dveImena === 'Иван Петров'), kl.map(x => x.dveImena));
t('фирмата е ЮЛ с ЕИК', kl.some(x => x.type === 'ЮЛ' && x.eik === '123456789'));
s2.predstavitel = 'sup';
t('изборът на представител се пази', F._sbPredstavitel(p2, '01.01.2026') === 'Строй ЕООД', F._sbPredstavitel(p2, '01.01.2026'));

// ── 4. коренът: преустройство на магазин, не цялата сграда ────────────────
const p3 = nov();
const s3 = p3.sobstvenost;
s3.lica.push({ id: 'm', ime: 'Магазинер' });
s3.obekti.push({ id: 'zem', vid: 'земя', identifikator: '1' },
               { id: 'mag', vid: 'самостоятелен обект', opisanie: 'магазин 2' });
s3.sabitia.push({ id: '1', obekt: 'mag', data: '01.01.2009', vid: 'първоначално', ot: null, na: 'm', dyal: '1/1' });
t('без избор коренът е земята', F._sbKoren(p3).id === 'zem');
t('без избор състоянието не е готово', !F._sbSastoyanie(p3).gotovo);
s3.koren = 'mag';
t('избраният корен се ползва', F._sbKoren(p3).id === 'mag');
t('магазинът е събран 1/1 → готово', F._sbSastoyanie(p3).gotovo, F._sbSastoyanie(p3).tekst);
t('земята не вдига шум, щом не е коренът', F._sbNahodki(p3).length === 0, F._sbNahodki(p3));

// ── 5. чеклистът олеква с три реда ────────────────────────────────────────
const r = { grupi: [
    { moment: 'ОСИП', dokumenti: [
        { dokument: 'Документ за собственост на имота', sastoyanie: 'очаква се' },
        { dokument: 'Нотариален акт за учредено право на строеж', sastoyanie: 'очаква се' },
        { dokument: 'Виза за проектиране', sastoyanie: 'очаква се' }] },
    { moment: 'Протокол 2', dokumenti: [
        { dokument: 'Документ за собственост или документ за учредено право на строеж', sastoyanie: 'очаква се' },
        { dokument: 'Протокол за строителна линия', sastoyanie: 'очаква се' }] }] };
F._sbPodmeniCheklist(p3, r);
const redove = r.grupi.flatMap(g => g.dokumenti.map(d => d.dokument));
t('трите реда ги няма', !F._SB_REDOVE.some(x => redove.includes(x)), redove);
t('добавен е един ред „Собственост“', redove.filter(x => /^Собственост/.test(x)).length === 1, redove);
t('щом веригата връзва, редът е „налично“', r.grupi[0].dokumenti[0].sastoyanie === 'налично');
t('останалите редове не са пипнати',
  redove.includes('Виза за проектиране') && redove.includes('Протокол за строителна линия'));
// Регистърът на ДНСК казва, че фирмата е вписана, но не кои лица са в нея.
t('добавен е редът за актуалния списък на консултанта',
  redove.some(x => /Актуален списък на правоспособните лица/.test(x)), redove);
t('добавя се само веднъж', (() => { F._sbPodmeniCheklist(p3, r);
  return r.grupi.flatMap(g => g.dokumenti).filter(d => /Актуален списък/.test(d.dokument)).length === 1; })());

// ── 6. приемане на прочетен акт ───────────────────────────────────────────
const p4 = nov();
p4._sb_procheteno = {
    fajl: 'na-112.pdf', vid: 'нотариален акт', nomer: '112', tom: 'III', registar: '4512',
    delo: '98/2009', data: '12.05.2009', notarius: 'Петров',
    lica: [{ ime: 'Иван Георгиев Петров', egn_eik: '7001011234' }, { ime: 'Мария Иванова Петрова' }],
    obekti: [{ identifikator: '68134.4354.781', opisanie: 'поземлен имот', vid: 'земя' }],
    prehvarliania: [{ vid: 'покупко-продажба', ot: 'Иван Георгиев Петров', na: 'Мария Иванова Петрова',
                      dyal: '1/2', obekt: '68134.4354.781', citat: '…продава…' }],
};
F.sbPriemi();
const s4 = p4.sobstvenost;
t('лицата са добавени', s4.lica.length === 2, s4.lica.length);
t('обектът е добавен', s4.obekti.length === 1, s4.obekti.length);
t('дялът е запазен както е прочетен', s4.sabitia[0].dyal === '1/2');
t('документът е сглобен', /№ 112.*том III.*рег\. № 4512/.test(s4.sabitia[0].dokument), s4.sabitia[0].dokument);
t('цитатът се пази', s4.sabitia[0].citat === '…продава…');
t('прочетеното е изчистено след приемане', !p4._sb_procheteno);

// Четецът сбърка номера (166 вместо 186) — поправката трябва да стигне до акта.
const p4b = nov();
p4b._sb_procheteno = {
    fajl: 'НА.PDF', vid: 'нотариален акт', nomer: '166', tom: 'III', registar: '10350',
    delo: '480/2019', data: '09.07.2019', notarius: 'Росица Рашева',
    lica: [{ ime: 'Иван Петров' }, { ime: 'Мария Иванова' }],
    obekti: [{ identifikator: '29430.4713.49', vid: 'земя' }],
    prehvarliania: [{ vid: 'покупко-продажба', ot: 'Иван Петров', na: 'Мария Иванова',
                      dyal: '1/1', obekt: '29430.4713.49' }],
};
F.sbPopravi('nomer', '186');
t('поправката се пази в прочетеното', p4b._sb_procheteno.nomer === '186', p4b._sb_procheteno.nomer);
F.sbPriemi();
t('актът носи ПОПРАВЕНИЯ номер',
  /№ 186/.test(p4b.sobstvenost.sabitia[0].dokument), p4b.sobstvenost.sabitia[0].dokument);
t('старият номер го няма', !/166/.test(p4b.sobstvenost.sabitia[0].dokument));
// Второ натискане на „Приеми“ не бива да удвоява веригата.
// (Операторът, 14.10.2026: „когато натисна приеми, ги трупа всички“.)
const predi = p4b.sobstvenost.sabitia.length;
p4b._sb_procheteno = JSON.parse(JSON.stringify({
    fajl: 'НА.PDF', vid: 'нотариален акт', nomer: '186', tom: 'III', registar: '10350',
    delo: '480/2019', data: '09.07.2019', notarius: 'Росица Рашева',
    lica: [{ ime: 'Иван Петров' }, { ime: 'Мария Иванова' }],
    obekti: [{ identifikator: '29430.4713.49', vid: 'земя' }],
    prehvarliania: [{ vid: 'покупко-продажба', ot: 'Иван Петров', na: 'Мария Иванова',
                      dyal: '1/1', obekt: '29430.4713.49' }],
}));
F.set(p4b);
F.sbPriemi();
t('второто приемане не удвоява', p4b.sobstvenost.sabitia.length === predi,
  [predi, p4b.sobstvenost.sabitia.length]);
t('и лицата не се удвояват', p4b.sobstvenost.lica.length === 2, p4b.sobstvenost.lica.length);

F.set(p4);          // следващата проба продължава със своя обект

p4._sb_procheteno = {
    fajl: 'na-200.pdf', vid: 'нотариален акт', nomer: '200', data: '01.03.2015',
    lica: [{ ime: '  иван георгиев петров ' }, { ime: 'Строй ЕООД', vid: 'юридическо' }],
    obekti: [{ identifikator: '68134.4354.781' }],
    prehvarliania: [{ vid: 'покупко-продажба', ot: 'иван георгиев петров', na: 'Строй ЕООД',
                      dyal: '1/2', obekt: '68134.4354.781' }],
};
F.sbPriemi();
t('същото лице не се създава втори път', p4.sobstvenost.lica.length === 3, p4.sobstvenost.lica.map(l => l.ime));
t('същият обект не се създава втори път', p4.sobstvenost.obekti.length === 1);
t('двете събития са там', p4.sobstvenost.sabitia.length === 2);

// ── 6б. случаят ЖИТЕН: няколко имена в едно поле ──────────────────────────
// Четецът сложи „Даниела…, Павел…“ в едно „na“. Едно лице от две имена чупи
// цялата верига. (14.10.2026)
const pj = nov();
const CHETVARMATA = 'Трендафил Ангелов Трайков, Теодора Цветкова Трайкова, Катя Иванова Бъчварова, Асен Иванов Бъчваров';
pj._sb_procheteno = {
    fajl: 'НА.PDF', vid: 'договор за покупко-продажба', nomer: '166', tom: 'III',
    registar: '10350', delo: '480/2019', data: '09.07.2019', notarius: 'Росица Рашева',
    lica: CHETVARMATA.split(', ').map(ime => ({ ime }))
        .concat([{ ime: 'Даниела Валентинова Занева' }, { ime: 'Павел Валериев Христов' }]),
    obekti: [{ identifikator: '29430.4713.49', opisanie: 'поземлен имот в с. Житен', vid: 'земя' }],
    prehvarliania: [
        { vid: 'първоначално', ot: '', na: CHETVARMATA, dyal: '1/1', obekt: '29430.4713.49' },
        { vid: 'покупко-продажба', ot: CHETVARMATA,
          na: 'Даниела Валентинова Занева, Павел Валериев Христов', dyal: '1/1', obekt: '29430.4713.49' }],
};
F.sbPriemi();
const sj = pj.sobstvenost;
t('шест лица, не две слепени', sj.lica.length === 6, sj.lica.map(l => l.ime));
t('четиримата придобиват по 1/4', sj.sabitia.filter(e => e.dyal === '1/4').length === 4,
  sj.sabitia.map(e => e.dyal));
// Четирима продават на двама = осем движения по 1/8, за да връзва салдото.
t('продажбата е осем движения по 1/8', sj.sabitia.filter(e => e.dyal === '1/8').length === 8,
  sj.sabitia.map(e => e.dyal));
t('дванайсет събития общо', sj.sabitia.length === 12, sj.sabitia.length);
sj.koren = sj.obekti[0].id;
t('веригата връзва — няма находки', F._sbNahodki(pj).length === 0, F._sbNahodki(pj));
t('днешните собственици са двамата купувачи',
  F._sbVazlozhiteli(pj, '').map(x => x.ime).sort().join(' / ')
    === 'Даниела Валентинова Занева / Павел Валериев Христов',
  F._sbVazlozhiteli(pj, '').map(x => x.ime));

// ── 7. случаят „Сан Стефано“: проценти и изброени чужди обекти ────────────
// Операторът, 13.10.2026: 28 забележки, от които значение имат две.
const p5 = nov();
p5._sb_procheteno = {
    fajl: 'НА 14.07.2015.pdf', vid: 'нотариален акт', nomer: '95', data: '14.07.2015',
    lica: [{ ime: 'САН СТЕФАНО ПРОПЪРТИ ДИВЕЛОПМЪНТ АД', vid: 'юридическо' },
           { ime: 'СУБРА ЕООД', vid: 'юридическо' }],
    obekti: [{ opisanie: 'Търговски обект /магазин/ № 8', vid: 'самостоятелен обект' },
             { opisanie: 'Гаражна клетка № 30' }, { opisanie: 'Снек бар' },
             { opisanie: 'всички останали обекти в Многофункционален комплекс Сан Стефано Плаза' }],
    prehvarliania: [{ vid: 'покупко-продажба', ot: 'САН СТЕФАНО ПРОПЪРТИ ДИВЕЛОПМЪНТ АД',
                      na: 'СУБРА ЕООД', dyal: '1/1', obekt: 'Търговски обект /магазин/ № 8' }],
};
F.sbPriemi();
const s5 = p5.sobstvenost;
t('създаден е само прехвърленият обект', s5.obekti.length === 1, s5.obekti.map(o => o.opisanie));
t('„всички останали обекти…“ не е станало обект', !s5.obekti.some(o => /останали обекти/.test(o.opisanie || '')));
t('гаражните клетки не са станали обекти', !s5.obekti.some(o => /Гаражна/.test(o.opisanie || '')));
t('нито една находка — магазинът връзва', F._sbNahodki(p5).length === 0, F._sbNahodki(p5));

const p6 = nov();
const s6 = p6.sobstvenost;
s6.lica.push({ id: 'a', ime: 'Продавач' }, { id: 'b', ime: 'Купувач' });
s6.obekti.push({ id: 'upi', vid: 'земя', identifikator: 'III-12' });
s6.sabitia.push({ id: '1', obekt: 'upi', data: '16.06.2009', vid: 'първоначално', ot: null, na: 'a', dyal: '8,38%' },
                { id: '2', obekt: 'upi', data: '16.06.2009', vid: 'първоначално', ot: null, na: 'b', dyal: '91,62%' });
t('8,38 % + 91,62 % дават цяло', F._sbNahodki(p6).length === 0, F._sbNahodki(p6));
s6.sabitia.push({ id: '3', obekt: 'upi', data: '01.01.2010', vid: 'покупко-продажба', ot: 'b', na: 'a', dyal: '2,169%' });
t('след вътрешна продажба пак е цяло', F._sbNahodki(p6).length === 0, F._sbNahodki(p6));

// ── край ───────────────────────────────────────────────────────────────────
dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? '\n' + loshi.length + ' проблема от ' + (dobri.length + loshi.length)
                         : '\n' + dobri.length + ' проверки — всичко е наред');
process.exit(loshi.length ? 1 : 0);
