// Регистърът на собствеността.
//
// Моделът, уговорен с оператора на 15.10.2026:
//   · ЕДИН АКТ — ЕДНО СЪБИТИЕ. Дяловете са вътре в него, не са отделни редове.
//   · ЛИЦЕ СЕ СЪЗДАВА, КОГАТО ПРИДОБИВА. Прехвърлителят е описание към акта,
//     докато не докажем и неговото придобиване.
//   · Копае се назад, докато обектът, в който се строи, събере 1/1.
const { kod, grab, parche } = require('./kod');
const s = kod();

const F = new Function(
    "const _s2esc=x=>String(x??'');let _zapisi=[];\n"
    + parche(s, 'const _nod =', '// ── данните')
    + parche(s, 'const _SB_VID =', 'function _sbDanni')
    + parche(s, 'const _EGN_TEGLA =', 'const specializations')
    + parche(s, 'const _sbLice =', '// ── сметката')
    + parche(s, 'const _SB_REDOVE =', 'function _sbKoren')
    + parche(s, 'const _DOP_REDOVE =', 'function _dopalniCheklist')
    + [grab(s, '_sbIzchistiEgn'), grab(s, '_sbStaraForma'), grab(s, '_sbDanni'),
       grab(s, '_dopalniCheklist'), grab(s, '_drDeli'), grab(s, 'sbPopravi'),
       grab(s, '_sbEdnakvi'), grab(s, 'sbMahni'), grab(s, '_sbSmetka'),
       grab(s, '_sbSabrano'), grab(s, '_sbVazlozhiteli'), grab(s, '_sbKoren'),
       grab(s, '_sbNahodki'), grab(s, '_sbSastoyanie'), grab(s, '_sbPodmeniCheklist'),
       grab(s, '_sbDveImena'), grab(s, '_sbKlienti'), grab(s, '_sbPredstavitel'),
       grab(s, 'sbPriemi')].join('\n')
    + '\nconst _sbImeImeBezopasno=(s,id)=>_sbImeLice(s,id);'
    + 'const _skritoEgn=v=>skriiEGN(v);\n'
    + 'let _t=null;const _zhivObekt=()=>_t;const _sbZapishi=(p,k)=>_zapisi.push(k);'
    + 'const _prerisuvai=()=>{};const showAlert=()=>{};const confirm=()=>true;\n'
    + 'return {eEGN,_skritoEgn,_dr,_drTekst,_drSabi,_sbDanni,_sbSmetka,_sbSabrano,'
    + '_sbVazlozhiteli,_sbKoren,_sbNahodki,_sbSastoyanie,_sbPodmeniCheklist,_SB_REDOVE,'
    + '_sbDveImena,_sbKlienti,_sbPredstavitel,sbPriemi,sbPopravi,sbMahni,'
    + 'set:p=>{_t=p},zapisi:()=>_zapisi};')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));
const nov = () => { const p = { pi: '1' }; F._sbDanni(p); F.set(p); return p; };
// Един акт, съставен наготово — пише се по-кратко, отколкото се чете.
const akt = (obekt, o) => ({ id: 'e' + Math.random().toString(36).slice(2), obekt, ...o });

// ── 0. ЕГН не влиза, не стои и не излиза ──────────────────────────────────
t('истинско ЕГН се разпознава', F.eEGN('7212096441') && F.eEGN('6411016956'));
t('телефонът НЕ е ЕГН', !F.eEGN('0898681928'));
t('ЕИК НЕ е ЕГН', !F.eEGN('204024246'));
t('ЕГН се скрива', F._skritoEgn('7212096441') === '••••••••••');
t('ЕИК на фирма се показва', F._skritoEgn('204024246') === '204024246');

const pe = { sobstvenost: { lica: [
    { id: 'a', ime: 'Иван Петров', egn: '7212096441' },
    { id: 'b', ime: 'Фирма ООД', egn: '204024246', vid: 'юридическо' }], obekti: [], sabitia: [] } };
F._sbDanni(pe);
t('запазено ЕГН се изтрива при отваряне', !pe.sobstvenost.lica[0].egn);
t('ЕИК на фирмата остава', pe.sobstvenost.lica[1].egn === '204024246');

// ── 1. дроби ───────────────────────────────────────────────────────────────
t('2/4 се свива до 1/2', F._drTekst(F._dr('2/4')) === '1/2');
t('1/3 + 1/6 + 1/2 = 1', F._drTekst(F._drSabi(F._drSabi(F._dr('1/3'), F._dr('1/6')), F._dr('1/2'))) === '1');
t('8,38 % става точна дроб', F._drTekst(F._dr('8,38%')) === '419/5000');
t('„боза“ не е дял', F._dr('боза') === null);

// ── 2. един акт, няколко придобиващи ──────────────────────────────────────
const p1 = nov();
const s1 = p1.sobstvenost;
s1.lica.push({ id: 'd', ime: 'Даниела Валентинова Занева' },
             { id: 'pv', ime: 'Павел Валериев Христов' });
s1.obekti.push({ id: 'zemya', vid: 'земя', identifikator: '29430.4713.49' });
s1.sabitia.push(akt('zemya', {
    vid: 'покупко-продажба', data: '09.07.2019', dokument: 'нотариален акт, № 186',
    ot: null, ot_opisanie: 'Трендафил Трайков, Теодора Трайкова, Катя Бъчварова, Асен Бъчваров',
    pridobivashti: [{ lice: 'd', dyal: '1/2' }, { lice: 'pv', dyal: '1/2' }],
}));
t('един акт дава 1/1', F._drTekst(F._sbSabrano(p1, 'zemya')) === '1', F._drTekst(F._sbSabrano(p1, 'zemya')));
t('всеки държи своята 1/2',
  F._drTekst(F._sbSmetka(p1, 'zemya').get('d')) === '1/2'
  && F._drTekst(F._sbSmetka(p1, 'zemya').get('pv')) === '1/2');
t('прехвърлителят не е лице и не вдига шум', F._sbNahodki(p1).length === 0, F._sbNahodki(p1));
t('двамата са възложители',
  F._sbVazlozhiteli(p1, '').map(x => x.ime).sort().join(' / ')
    === 'Даниела Валентинова Занева / Павел Валериев Христов');

// Следваща сделка: Даниела продава своята половина на Павел.
s1.sabitia.push(akt('zemya', {
    vid: 'покупко-продажба', data: '01.03.2024', dokument: 'нотариален акт, № 44',
    ot: 'd', ot_opisanie: 'Даниела Валентинова Занева',
    pridobivashti: [{ lice: 'pv', dyal: '1/2' }],
}));
t('продавачът губи дела си', F._drTekst(F._sbSmetka(p1, 'zemya').get('d')) === '0');
t('купувачът събира цялото', F._drTekst(F._sbSmetka(p1, 'zemya').get('pv')) === '1');
t('сборът пак е 1/1', F._drTekst(F._sbSabrano(p1, 'zemya')) === '1');
t('веригата връзва', F._sbNahodki(p1).length === 0, F._sbNahodki(p1));
t('сега възложител е само Павел',
  F._sbVazlozhiteli(p1, '').map(x => x.ime).join('') === 'Павел Валериев Христов');

// ── 3. наследство: трима по 1/3 от половината ─────────────────────────────
const p2 = nov();
const s2 = p2.sobstvenost;
s2.lica.push({ id: 'ivan', ime: 'Иван Петров' }, { id: 'maria', ime: 'Мария Петрова' },
             { id: 'a', ime: 'Анна' }, { id: 'b', ime: 'Борис' }, { id: 'c', ime: 'Цветан' });
s2.obekti.push({ id: 'z', vid: 'земя', identifikator: '1' });
s2.sabitia.push(akt('z', { vid: 'първоначално', data: '05.05.2001', ot: null,
    pridobivashti: [{ lice: 'ivan', dyal: '1/2' }, { lice: 'maria', dyal: '1/2' }] }));
t('двама по 1/2 → 1/1', F._drTekst(F._sbSabrano(p2, 'z')) === '1');

s2.lica.find(l => l.id === 'ivan').pochinal = '12.03.2019';
s2.sabitia.push(akt('z', { vid: 'наследяване', data: '12.03.2019', ot: 'ivan',
    dokument: 'удостоверение за наследници',
    pridobivashti: ['a', 'b', 'c'].map(l => ({ lice: l, dyal: '1/6' })) }));
t('наследодателят остава с 0', F._drTekst(F._sbSmetka(p2, 'z').get('ivan')) === '0');
t('всеки наследник има 1/6', ['a', 'b', 'c'].every(h => F._drTekst(F._sbSmetka(p2, 'z').get(h)) === '1/6'));
t('след наследството пак е 1/1', F._drTekst(F._sbSabrano(p2, 'z')) === '1');
t('наследството не прави находка', F._sbNahodki(p2).length === 0, F._sbNahodki(p2));

// Вписан е само един от тримата — сборът пада и покойникът още държи дял.
s2.sabitia[1].pridobivashti = [{ lice: 'a', dyal: '1/6' }];
const n2 = F._sbNahodki(p2);
// Сборът СИ ОСТАВА 1/1 — аритметиката не вижда нищо. Но покойникът още държи
// 1/3 и това е липсващото звено. (Находката е от 13.10.2026.)
t('сборът остава 1/1 и не вдига тревога', !n2.some(x => x.vid === 'nepalno'), n2);
t('покойникът, който още държи дял, се вижда', n2.some(x => x.vid === 'pochinal'), n2);

// ── 4. приемане на прочетен акт ───────────────────────────────────────────
const CHETVARMATA = 'Трендафил Ангелов Трайков, Теодора Цветкова Трайкова, Катя Иванова Бъчварова, Асен Иванов Бъчваров';
const AKT = {
    fajl: 'НА.PDF', vid: 'покупко-продажба', nomer: '186', tom: 'III', registar: '10350',
    delo: '480/2019', data: '09.07.2019', notarius: 'Росица Рашева',
    lica: CHETVARMATA.split(', ').map(ime => ({ ime }))
        .concat([{ ime: 'Даниела Валентинова Занева' }, { ime: 'Павел Валериев Христов' }]),
    obekti: [{ identifikator: '29430.4713.49', opisanie: 'поземлен имот', vid: 'земя' }],
    prehvarliania: [{ vid: 'покупко-продажба', ot: CHETVARMATA,
                      na: 'Даниела Валентинова Занева, Павел Валериев Христов',
                      dyal: '1/1', obekt: '29430.4713.49' }],
};
const p3 = nov();
p3._sb_procheteno = JSON.parse(JSON.stringify(AKT));
F.sbPriemi();
const s3 = p3.sobstvenost;
t('ЕДИН акт, не осем', s3.sabitia.length === 1, s3.sabitia.length);
t('ДВЕ лица, не шест', s3.lica.length === 2, s3.lica.map(l => l.ime));
t('продавачите НЕ стават лица', !s3.lica.some(l => /Трендафил/.test(l.ime)), s3.lica.map(l => l.ime));
t('но остават изписани върху акта', /Трендафил/.test(s3.sabitia[0].ot_opisanie || ''), s3.sabitia[0].ot_opisanie);
t('двамата придобиват по 1/2',
  s3.sabitia[0].pridobivashti.every(pr => pr.dyal === '1/2'), s3.sabitia[0].pridobivashti);
t('един обект', s3.obekti.length === 1);
t('документът е сглобен', /№ 186.*том III.*рег\. № 10350/.test(s3.sabitia[0].dokument), s3.sabitia[0].dokument);
s3.koren = s3.obekti[0].id;
t('веригата връзва от първия акт', F._sbNahodki(p3).length === 0, F._sbNahodki(p3));

p3._sb_procheteno = JSON.parse(JSON.stringify(AKT));
F.sbPriemi();
t('повторното приемане не удвоява', p3.sobstvenost.sabitia.length === 1, p3.sobstvenost.sabitia.length);

// Поправка на прочетеното, преди приемане.
const p4 = nov();
p4._sb_procheteno = JSON.parse(JSON.stringify(AKT));
F.sbPopravi('nomer', '999');
F.sbPriemi();
t('поправеният номер влиза в акта', /№ 999/.test(p4.sobstvenost.sabitia[0].dokument),
  p4.sobstvenost.sabitia[0].dokument);

// ── 5. изтриване на лице отнася и актовете му ─────────────────────────────
const lice = p3.sobstvenost.lica[0];
F.set(p3);
F.sbMahni('lica', lice.id);
t('изтритото лице отнася акта си', p3.sobstvenost.sabitia.length === 0, p3.sobstvenost.sabitia.length);
t('няма сирачета', !F._sbNahodki(p3).some(n => n.vid === 'sirache'), F._sbNahodki(p3));

// ── 6. старите данни се превръщат ─────────────────────────────────────────
const star = { sobstvenost: { lica: [{ id: 'x', ime: 'Иван' }], obekti: [{ id: 'o', vid: 'земя' }],
    sabitia: [{ id: '1', obekt: 'o', vid: 'покупко-продажба', na: 'x', dyal: '1/1', data: '01.01.2020' }] } };
F._sbDanni(star);
const prevarnat = star.sobstvenost.sabitia[0];
t('старото движение става акт с един придобиващ',
  prevarnat.pridobivashti && prevarnat.pridobivashti[0].lice === 'x'
  && prevarnat.pridobivashti[0].dyal === '1/1', prevarnat);
t('старите полета са махнати', !('na' in prevarnat) && !('dyal' in prevarnat), prevarnat);
t('сметката чете превърнатото', F._drTekst(F._sbSabrano(star, 'o')) === '1');

// ── 7. коренът: преустройство ─────────────────────────────────────────────
const p5 = nov();
const s5 = p5.sobstvenost;
s5.lica.push({ id: 'm', ime: 'Магазинер' });
s5.obekti.push({ id: 'zem', vid: 'земя', identifikator: '1' },
               { id: 'mag', vid: 'самостоятелен обект', opisanie: 'магазин 2' });
s5.sabitia.push(akt('mag', { vid: 'покупко-продажба', data: '01.01.2009', ot: null,
    pridobivashti: [{ lice: 'm', dyal: '1/1' }] }));
t('без избор коренът е земята', F._sbKoren(p5).id === 'zem');
s5.koren = 'mag';
t('избраният корен се ползва', F._sbKoren(p5).id === 'mag');
t('магазинът е събран 1/1', F._sbSastoyanie(p5).gotovo, F._sbSastoyanie(p5).tekst);
t('земята не вдига шум, щом не е коренът', F._sbNahodki(p5).length === 0, F._sbNahodki(p5));

// ── 8. чеклистът ──────────────────────────────────────────────────────────
const r = { grupi: [
    { moment: 'ОСИП', dokumenti: [
        { dokument: 'Документ за собственост на имота', sastoyanie: 'очаква се' },
        { dokument: 'Нотариален акт за учредено право на строеж', sastoyanie: 'очаква се' },
        { dokument: 'Виза за проектиране', sastoyanie: 'очаква се' }] },
    { moment: 'Протокол 2', dokumenti: [
        { dokument: 'Документ за собственост или документ за учредено право на строеж', sastoyanie: 'очаква се' },
        { dokument: 'Протокол за строителна линия', sastoyanie: 'очаква се' }] }] };
F._sbPodmeniCheklist(p5, r);
const redove = r.grupi.flatMap(g => g.dokumenti.map(d => d.dokument));
t('трите реда за собственост ги няма', !F._SB_REDOVE.some(x => redove.includes(x)), redove);
t('добавен е един ред „Собственост“', redove.filter(x => /^Собственост/.test(x)).length === 1);
t('добавен е редът за списъка на консултанта',
  redove.some(x => /Актуален списък на правоспособните лица/.test(x)));
t('щом веригата връзва, редът е „налично“', r.grupi[0].dokumenti[0].sastoyanie === 'налично');
t('останалите редове не са пипнати',
  redove.includes('Виза за проектиране') && redove.includes('Протокол за строителна линия'));

// ── 9. към документите ────────────────────────────────────────────────────
const p6 = nov();
const s6 = p6.sobstvenost;
s6.lica.push({ id: 'z', ime: 'Иван Георгиев Петров' },
             { id: 'sup', ime: 'Строй ЕООД', vid: 'юридическо', egn: '204024246' });
s6.obekti.push({ id: 'zem', vid: 'земя', identifikator: '1' },
               { id: 'ps', vid: 'право на строеж', opisanie: 'право на строеж' });
s6.sabitia.push(
    akt('zem', { vid: 'първоначално', data: '01.01.2020', pridobivashti: [{ lice: 'z', dyal: '1/1' }] }),
    akt('ps', { vid: 'учредяване право на строеж', data: '01.06.2022',
                pridobivashti: [{ lice: 'sup', dyal: '1/1' }] }));
t('към 2021 възложител е само земевладелецът',
  F._sbVazlozhiteli(p6, '01.01.2021').map(x => x.ime).join('') === 'Иван Георгиев Петров');
t('към 2026 са двамата', F._sbVazlozhiteli(p6, '01.01.2026').length === 2);
t('суперфициарът е възложител',
  F._sbVazlozhiteli(p6, '01.01.2026').some(x => x.ime === 'Строй ЕООД'));
t('три имена → две', F._sbDveImena('Иван Георгиев Петров') === 'Иван Петров');
t('фирмата се изписва цяла', F._sbDveImena('Строй Инвест ЕООД') === 'Строй Инвест ЕООД');
const kl = F._sbKlienti(p6, '01.01.2026');
t('хедърът дава двамата', kl.length === 2, kl.length);
t('фирмата е ЮЛ с ЕИК', kl.some(x => x.type === 'ЮЛ' && x.eik === '204024246'));
s6.predstavitel = 'sup';
t('изборът на представител се пази', F._sbPredstavitel(p6, '01.01.2026') === 'Строй ЕООД');

// ── 10. „Сан Стефано“: проценти и изброени чужди обекти ───────────────────
const p7 = nov();
p7._sb_procheteno = {
    fajl: 'НА 14.07.2015.pdf', vid: 'покупко-продажба', nomer: '95', data: '14.07.2015',
    lica: [{ ime: 'САН СТЕФАНО ПРОПЪРТИ ДИВЕЛОПМЪНТ АД', vid: 'юридическо' },
           { ime: 'СУБРА ЕООД', vid: 'юридическо' }],
    obekti: [{ opisanie: 'Търговски обект /магазин/ № 8', vid: 'самостоятелен обект' },
             { opisanie: 'Гаражна клетка № 30' }, { opisanie: 'Снек бар' },
             { opisanie: 'всички останали обекти в Многофункционален комплекс Сан Стефано Плаза' }],
    prehvarliania: [{ vid: 'покупко-продажба', ot: 'САН СТЕФАНО ПРОПЪРТИ ДИВЕЛОПМЪНТ АД',
                      na: 'СУБРА ЕООД', dyal: '1/1', obekt: 'Търговски обект /магазин/ № 8' }],
};
F.sbPriemi();
const s7 = p7.sobstvenost;
t('създаден е само прехвърленият обект', s7.obekti.length === 1, s7.obekti.map(o => o.opisanie));
t('„всички останали обекти…“ не е станало обект', !s7.obekti.some(o => /останали обекти/.test(o.opisanie || '')));
t('продавачът не е станал лице', s7.lica.length === 1 && /СУБРА/.test(s7.lica[0].ime), s7.lica.map(l => l.ime));
t('нито една находка — магазинът връзва', F._sbNahodki(p7).length === 0, F._sbNahodki(p7));

const p8 = nov();
const s8 = p8.sobstvenost;
s8.lica.push({ id: 'a', ime: 'Продавач' }, { id: 'b', ime: 'Купувач' });
s8.obekti.push({ id: 'upi', vid: 'земя', identifikator: 'III-12' });
s8.sabitia.push(akt('upi', { vid: 'първоначално', data: '16.06.2009',
    pridobivashti: [{ lice: 'a', dyal: '8,38%' }, { lice: 'b', dyal: '91,62%' }] }));
t('8,38 % + 91,62 % дават цяло', F._sbNahodki(p8).length === 0, F._sbNahodki(p8));

// ── край ───────────────────────────────────────────────────────────────────
dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема от ${dobri.length + loshi.length}`
                         : `\n${dobri.length} проверки — един акт, едно събитие`);
process.exit(loshi.length ? 1 : 0);
