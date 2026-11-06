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
       grab(s, '_sbDveImena'), parche(s, 'const _MALKI_DUMI', 'async function registar'), grab(s, '_sbPravnoOsnovanie'), grab(s, '_sbKlienti'), grab(s, '_sbPodpisi'), grab(s, '_sbPredstavitel'),
       grab(s, '_sbVpisvane'), 'const _SB_SAMO_PI = /^\\d+\\.\\d+\\.\\d+$/;', grab(s, '_sbPravoNaStroezh'), grab(s, '_sbPosocheni'),
       grab(s, '_sbVpisvaneTekst'), grab(s, '_sbPalnomoshtnoTekst'),
       grab(s, '_sbOsnovaniaBlok'), grab(s, '_sbNomerDelo'), grab(s, '_sbAkt11Tekst'), grab(s, '_sbAktove11'), grab(s, '_sbSleiLica'), grab(s, 'sbMahniAkt'), grab(s, 'sbOtdeliPravo'),
       grab(s, 'sbPriemi'), grab(s, 'sbPriemiPal'), grab(s, '_sbPalnomoshtniOpis')].join('\n')
    + '\nconst _sbImeImeBezopasno=(s,id)=>_sbImeLice(s,id);'
    + 'const _skritoEgn=v=>skriiEGN(v);\n'
    + 'let _t=null;const _zhivObekt=()=>_t;const _sbZapishi=(p,k)=>_zapisi.push(k);'
    + 'const _prerisuvai=()=>{};const showAlert=()=>{};const confirm=()=>true;\n'
    + 'return {eEGN,_skritoEgn,_dr,_drTekst,_drSabi,_sbDanni,_sbSmetka,_sbSabrano,'
    + '_sbVazlozhiteli,_sbKoren,_sbNahodki,_sbSastoyanie,_sbPodmeniCheklist,_SB_REDOVE,'
    + 'sbOtdeliPravo,sbMahniAkt,_sbAktove11,_sbOsnovaniaBlok,_sbDveImena,_sbKlienti,_sbPodpisi,_sbLice,_sbStrani,_sbStrana,_sbKojPodpisva,_sbPravnoOsnovanie,_sbPredstavitel,sbPriemi,sbPopravi,sbMahni,'
    + 'sbPriemiPal,_sbPalnomoshtniOpis,set:p=>{_t=p},zapisi:()=>_zapisi};')();

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
// БИЛДИНГ ЕКСПРЕС-90 Р, НА от 27.07.2023: шест продавачи, един купувач.
{
    const f = F._dr('24,618%, 24,618%, 24,618%, 9,805%, 9,805%, 6,536%');
    t('списък от дялове на един приобретател се събира', !!f && Math.abs(f.n / f.d - 1) < 0.001,
      f && F._drTekst(f));
}
t('„1/2; 1/4“ дава 3/4', F._drTekst(F._dr('1/2; 1/4')) === '3/4');
t('списък с нечетимо парче не се гадае', F._dr('1/2, боза') === null);
t('десетичната запетая не се дели', F._drTekst(F._dr('8,38%')) === '419/5000');

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
// Истинският акт на ЖИТЕН носи И РАЗКАЗА: четецът дава два реда — как
// четиримата са станали собственици, и самата продажба. (15.10.2026)
AKT.prehvarliania.unshift({ vid: 'първоначално', ot: '', na: CHETVARMATA,
                            dyal: '1/1', obekt: '29430.4713.49' });
AKT.vid = 'договор за покупко-продажба';   // четецът бърка вида на документа

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
// Видът на ДОКУМЕНТА не е видът на СДЕЛКАТА: щом има том и нотариус, това е
// нотариален акт, каквато и да е сделката вътре.
t('документът е НОТАРИАЛЕН АКТ, не договор',
  /^нотариален акт/.test(s3.sabitia[0].dokument), s3.sabitia[0].dokument);
t('думата „нотариус“ не се удвоява',
  !/нотариус\s+[^,]*нотариус/i.test(s3.sabitia[0].dokument), s3.sabitia[0].dokument);
t('разказът не е записан като втори акт', s3.sabitia.length === 1, s3.sabitia.length);
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

// Повече от цялото: продавачът продава, но не е свързан с акта — дялът му остава.
const p9 = nov();
const s9 = p9.sobstvenost;
s9.lica.push({ id: 'a', ime: 'Продавач' }, { id: 'b', ime: 'Купувач' });
s9.obekti.push({ id: 'upi', vid: 'земя', identifikator: 'III-12' });
s9.sabitia.push(akt('upi', { vid: 'първоначално', data: '01.01.2009', pridobivashti: [{ lice: 'a', dyal: '1' }] }));
s9.sabitia.push(akt('upi', { vid: 'покупко-продажба', data: '01.01.2020', ot_opisanie: 'Продавач',
    pridobivashti: [{ lice: 'b', dyal: '1' }] }));
const n9 = F._sbNahodki(p9).find(x => x.vid === 'nadvishava');

// ── право на строеж върху земята (БИЛДИНГ ЕКСПРЕС, 05.11.2026) ──────────────
{
    const p = nov(), s = p.sobstvenost;
    s.lica.push({ id: 'pl', ime: 'Пламен Георгиев Василев' }, { id: 'sn', ime: 'Снежана Теодорова Ангелова' },
                { id: 'bx', ime: '«БИЛДИНГ ЕКСПРЕС-90 Р» ООД', vid: 'юридическо' });
    s.obekti.push({ id: 'z', vid: 'земя', identifikator: '68134.702.9889' });
    s.koren = 'z';
    s.sabitia.push(akt('z', { vid: 'покупко-продажба', data: '01.01.2010',
        pridobivashti: [{ lice: 'pl', dyal: '1/2' }, { lice: 'sn', dyal: '1/2' }] }));
    s.sabitia.push(akt('z', { vid: 'учредяване право на строеж', data: '27.07.2023',
        pridobivashti: [{ lice: 'bx', dyal: '24,618%, 24,618%, 24,618%, 9,805%, 9,805%, 6,536%' }] }));
    const n = F._sbNahodki(p);
    const pn = n.find(x => x.vid === 'pravo_varhu_zemya');
    t('правото върху земята се назовава', !!pn && /учредява право на строеж/.test(pn.tekst), n);
    t('и общото „повече от цялото“ не се повтаря', !n.some(x => x.vid === 'nadvishava'), n);
    F.set(p); F.sbOtdeliPravo(pn.sabitie);
    t('след „Отдели“ земята е 1/1', F._drTekst(F._sbSabrano(p, 'z')) === '1', F._drTekst(F._sbSabrano(p, 'z')));
    t('и няма находки', F._sbNahodki(p).length === 0, F._sbNahodki(p));
    const vaz = F._sbVazlozhiteli(p).map(v => v.lice).sort().join(',');
    t('възложители са тримата — двамата собственици и суперфициарът', vaz === 'bx,pl,sn', vaz);
    t('правото е отделен обект с име', s.obekti.some(o => o.vid === 'право на строеж'
        && /68134\.702\.9889/.test(o.opisanie)), s.obekti);
}
{
    // Истинските данни: учредяването за целия имот е закачено върху правото
    // за АП603, защото и двете носят номера на земята.
    const p = nov(), s = p.sobstvenost;
    s.lica.push({ id: 'pl', ime: 'Пламен Георгиев Василев' }, { id: 'sn', ime: 'Снежана Теодорова Ангелова' },
                { id: 'bx', ime: '«БИЛДИНГ ЕКСПРЕС-90 Р» ООД', vid: 'юридическо' });
    s.obekti.push({ id: 'a603', vid: 'право на строеж', identifikator: '68134.702.9889',
                    opisanie: 'право на строеж върху поземлен имот, апартамент №603 и склад №17' });
    s.koren = 'a603';
    s.sabitia.push(akt('a603', { vid: 'учредяване право на строеж', data: '27.07.2023',
        pridobivashti: [{ lice: 'bx', dyal: '24,618%, 24,618%, 24,618%, 9,805%, 9,805%, 6,536%' }] }));
    s.sabitia.push(akt('a603', { vid: 'покупко-продажба', data: '01.03.2024',
        pridobivashti: [{ lice: 'pl', dyal: '1/2' }, { lice: 'sn', dyal: '1/2' }] }));
    const pn = F._sbNahodki(p).find(x => x.vid === 'pravo_varhu_zemya');
    t('учредяване върху правото за АП603 се назовава', !!pn, F._sbNahodki(p));
    F.set(p); F.sbOtdeliPravo(pn.sabitie);
    t('след „Отдели“ АП603 е 1/1', F._drTekst(F._sbSabrano(p, 'a603')) === '1', F._drTekst(F._sbSabrano(p, 'a603')));
    t('фирмата държи правото върху целия имот', s.obekti.some(o => o.cyalo && o.id === s.sabitia[0].obekt));
    t('АП603 не вдига находка', F._sbNahodki(p).length === 0, F._sbNahodki(p));
    // Ново четене на същия акт отива направо в целия имот.
    const q = nov(), sq = q.sobstvenost;
    sq.obekti.push({ id: 'a603', vid: 'право на строеж', identifikator: '68134.702.9889', opisanie: 'АП603' });
    q._sb_procheteno = { fajl: 'na.pdf', data: '27.07.2023', obekti: [],
        prehvarliania: [{ vid: 'учредяване право на строеж', ot: 'Валентина Иванова Алипиева',
                          na: '«БИЛДИНГ ЕКСПРЕС-90 Р» ООД', dyal: '1/1', obekt: '68134.702.9889' }] };
    F.sbPriemi();
    t('прочетеното учредяване за целия имот не сяда на АП603', sq.sabitia[0].obekt !== 'a603', sq.sabitia[0]);
}
{
    // АРКОН ИНВЕСТ: земята без акт, учредителите само в текста. (05.11.2026)
    const p = nov(), s = p.sobstvenost;
    s.lica.push({ id: 'ar', ime: '„АРКОН ИНВЕСТ“ ООД', vid: 'юридическо' });
    s.obekti.push({ id: 'z', vid: 'земя', identifikator: '68134.4337.718' },
                  { id: 'ps', vid: 'право на строеж', cyalo: true, identifikator: '68134.4337.718',
                    opisanie: 'право на строеж върху целия имот 68134.4337.718' });
    s.koren = 'z';
    s.sabitia.push(akt('ps', { vid: 'учредяване право на строеж', data: '28.05.2024',
        ot_opisanie: 'Мария Арсова Пенева, Славчо Арсов Славков', pridobivashti: [{ lice: 'ar', dyal: '1/1' }] }));
    const vaz = F._sbVazlozhiteli(p, '05.11.2026');
    t('учредителите излизат като посочени собственици на земята',
      vaz.some(v => v.posochen && v.ime === 'Мария Арсова Пенева') && vaz.some(v => v.ime === 'Славчо Арсов Славков'),
      vaz.map(v => v.ime));
    t('и фирмата си остава', vaz.some(v => v.lice === 'ar'));
    t('посочените НЕ стават лица', s.lica.length === 1, s.lica.map(l => l.ime));
    const n = F._sbNahodki(p);
    // Актът не сочи квоти → равни по чл. 30, ал. 2 ЗС, с „!“, без находка.
    // (Обърнато на 05.11.2026: дотук се искаше акт за земята.)
    t('без квоти в акта — няма находка', n.length === 0, n);
    const mp = F._sbVazlozhiteli(p, '05.11.2026').find(v => /Мария/.test(v.ime));
    t('Мария държи 1/2 — равни по предположение',
      mp && F._drTekst(mp.prava[0].dyal) === '1/2' && mp.prava[0].ravni === true, mp && mp.prava);
    const kl = F._sbKlienti(p, '05.11.2026');
    t('в документите влизат с имената си', kl.some(k => k.dveImena === 'Мария Пенева'), kl.map(k => k.dveImena));
}
{
    // АРКОН, прочетен по новите правила: учредяване с квоти + обезщетение.
    // (05.11.2026: границата е актът за учредяване; обезщетението не е разказ.)
    const p = nov(), s = p.sobstvenost;
    s.obekti.push({ id: 'z', vid: 'земя', identifikator: '68134.4337.718' });
    s.koren = 'z';
    const AKT_AR = { fajl: 'arkon.pdf', vid: 'нотариален акт', nomer: '178', tom: 'I', registar: '2135',
        delo: '163/2024', data: '28.05.2024', notarius: 'Слава Пилякова',
        lica: [{ ime: 'Мария Арсова Пенева', kvota_zemya: '1/2' },
               { ime: 'Славчо Арсов Славков', kvota_zemya: '1/2' },
               { ime: '„АРКОН ИНВЕСТ“ ООД', vid: 'юридическо' }],
        obekti: [{ identifikator: '68134.4337.718', vid: 'земя' },
                 { opisanie: 'апартамент № 9', vid: 'самостоятелен обект' },
                 { opisanie: 'гараж № 1', vid: 'самостоятелен обект' }],
        prehvarliania: [
            { vid: 'учредяване право на строеж', ot: 'Мария Арсова Пенева, Славчо Арсов Славков',
              na: '„АРКОН ИНВЕСТ“ ООД', dyal: '1/1', obekt: '68134.4337.718' },
            { vid: 'обезщетение', ot: '„АРКОН ИНВЕСТ“ ООД', na: 'Мария Арсова Пенева',
              dyal: '1/1', obekt: 'апартамент № 9' },
            { vid: 'обезщетение', ot: '„АРКОН ИНВЕСТ“ ООД', na: 'Славчо Арсов Славков',
              dyal: '1/1', obekt: 'гараж № 1' }] };
    p._sb_procheteno = JSON.parse(JSON.stringify(AKT_AR));
    F.set(p); F.sbPriemi();
    t('обезщетението НЕ се изхвърля като разказ', s.sabitia.length === 3, s.sabitia.map(e => e.vid));
    const ap9 = s.obekti.find(o => o.opisanie === 'апартамент № 9');
    t('АП 9 е 1/1 у Мария', ap9 && F._drTekst(F._sbSabrano(p, ap9.id)) === '1');
    t('квотите са при учредяването', (s.sabitia.find(e => /учредяв/.test(e.vid)) || {}).kvoti?.length === 2);
    const vaz = F._sbVazlozhiteli(p, '05.11.2026');
    const maria = vaz.find(v => /Мария/.test(v.ime));
    t('тримата са възложители', vaz.length === 3, vaz.map(v => v.ime));
    t('Мария — 1/2 от земята и АП 9, в един ред',
      maria && maria.prava.length === 2 && maria.prava.some(x => x.posochen && F._drTekst(x.dyal) === '1/2'),
      maria && maria.prava);
    t('земята е доказана с акта — няма находка', F._sbNahodki(p).length === 0, F._sbNahodki(p));
    t('и веригата връзва', F._sbSastoyanie(p).gotovo, F._sbSastoyanie(p));
    t('преди учредяването земята пак иска своя акт',
      !F._sbVazlozhiteli(p, '01.01.2024').some(v => /Мария/.test(v.ime)));
    const blok = F._sbOsnovaniaBlok(p, '05.11.2026');
    t('в Акт 15 основанието на Мария е актът за учредяване',
      /МАРИЯ АРСОВА ПЕНЕВА\n• Нотариален акт за учредено право на строеж №178, том I/.test(blok), blok);
    t('в Акт 15 един акт е един ред при Мария', (blok.split('\n\n')[0].match(/№178/g) || []).length === 1, blok);
    t('земята е „поземлен имот …“, не голият номер', /поземлен имот 68134[.]4337[.]718/.test(blok), blok);
    // Прочетен наново — заменя, не удвоява.
    p._sb_procheteno = JSON.parse(JSON.stringify(AKT_AR));
    F.sbPriemi();
    t('прочетеният наново акт заменя стария', s.sabitia.length === 3, s.sabitia.length);
    // 1.1 на Акт 15: един ред на акт, като в образеца. (05.11.2026)
    s.sabitia.forEach(e => { e.notarius_nomer = '344'; e.sv = { vhoden: '39956', akt: '150', tom: 'XCI', delo: '30442' }; });
    const r11 = F._sbAktove11(p, '05.11.2026');
    t('1.1: учредяването с обезщетението е ЕДИН ред', r11.length === 1, r11);
    t('1.1: записът е като в образеца', r11[0] === 'Нотариален акт за учредено право на строеж №178, том I, '
      + 'рег.№2135, дело №163 от 2024 г. на Нотариус №344 в НК, вписан в СВ с вх. рег. №39956, акт 150, '
      + 'том XCI, дело №30442 г.', r11[0]);
    // Мария продава АП 9 на Иван — вторият ред е неговият акт, след учредяването.
    const ap9c = s.obekti.find(o => o.opisanie === 'апартамент № 9');
    s.lica.push({ id: 'iv', ime: 'Иван Иванов' });
    s.sabitia.push(akt(ap9c.id, { vid: 'покупко-продажба', data: '01.03.2025',
        dokument: 'нотариален акт, № 12, том III, рег. № 900, дело 50/2025', ot: s.lica.find(l => /Мария/.test(l.ime)).id,
        pridobivashti: [{ lice: 'iv', dyal: '1/1' }] }));
    const r11b = F._sbAktove11(p, '05.11.2026');
    t('1.1: учредяването първо, после продажбата', r11b.length === 2 && /учредено/.test(r11b[0])
      && /^Нотариален акт №12, том III, рег.№900, дело №50 от 2025 г\./.test(r11b[1]), r11b);
    t('1.1: преди продажбата е само учредяването', F._sbAktove11(p, '01.01.2025').length === 1);
    // „№ № 28“ — знакът два пъти от четеца не става „№№ 28“. (05.11.2026)
    s.sabitia.find(e => /№ 12,/.test(e.dokument || '')).dokument = 'нотариален акт, № № 28 , том IV, рег. № 5500, дело 582/2025';
    s.sabitia.find(e => /рег. № 5500/.test(e.dokument || '')).dokument = 'нотариален акт, № 085, том I, рег. № 2127, дело 76 от 2026г.';
    t('1.1: „дело 76 от 2026г.“ не става „от 2026г. от 2026 г.“',
      F._sbAktove11(p, '05.11.2026').some(r => /дело №76 от 2026 г\.$/.test(r) || /дело №76 от 2026 г\. /.test(r)),
      F._sbAktove11(p, '05.11.2026'));
    s.sabitia.find(e => /рег. № 2127/.test(e.dokument || '')).dokument = 'нотариален акт, № № 28 , том IV, рег. № 5500, дело 582/2025';
    t('1.1: „№ № 28“ излиза „№28“', F._sbAktove11(p, '05.11.2026').some(r => /^Нотариален акт №28, том IV/.test(r)),
      F._sbAktove11(p, '05.11.2026'));
    s.sabitia = s.sabitia.filter(e => !/рег. № (900|5500)/.test(e.dokument || ''));
    // Обезщетение с процент: процентът са идеалните части, не дял.
    const AKT3 = JSON.parse(JSON.stringify(AKT_AR));
    AKT3.prehvarliania[1].dyal = '6,302 %';
    p._sb_procheteno = AKT3; F.sbPriemi();
    const ap9b = s.obekti.find(o => o.opisanie === 'апартамент № 9');
    t('обезщетение „6,302 %“ дава целия АП 9', F._drTekst(F._sbSabrano(p, ap9b.id)) === '1',
      F._drTekst(F._sbSabrano(p, ap9b.id)));
    // Второ четене с « » и иначе изписан нотариус — пак заменя, пак една фирма.
    const AKT2 = JSON.parse(JSON.stringify(AKT_AR).replace(/„АРКОН ИНВЕСТ“/g, '«АРКОН ИНВЕСТ»'));
    AKT2.notarius = 'Слава Пилякова – Нотариус';
    p._sb_procheteno = AKT2;
    F.sbPriemi();
    t('иначе изписаният акт пак заменя', s.sabitia.length === 3, s.sabitia.map(e => e.dokument));
    t('„ “ и « » са една фирма', s.lica.filter(l => /АРКОН/.test(l.ime)).length === 1, s.lica.map(l => l.ime));
}
{
    // Двойно прочетен акт (№ 148 и № 178) и два Аркона. (05.11.2026)
    const p = nov(), s = p.sobstvenost;
    s.lica.push({ id: 'a1', ime: '„АРКОН ИНВЕСТ“ ООД' }, { id: 'a2', ime: '«АРКОН ИНВЕСТ» ООД' },
                { id: 'm', ime: 'Мария' });
    s.obekti.push({ id: 'ap', vid: 'самостоятелен обект', opisanie: 'АП 9' });
    s.koren = 'ap';
    const d148 = 'нотариален акт, № 148, том I, рег. № 2135, дело 163/2024';
    const d178 = 'нотариален акт, № 178, том I, рег. № 2135, дело 163/2024';
    s.sabitia.push(akt('ap', { vid: 'обезщетение', dokument: d148, ot: 'a1', pridobivashti: [{ lice: 'm', dyal: '1/1' }] }),
                   akt('ap', { vid: 'обезщетение', dokument: d178, ot: 'a2', pridobivashti: [{ lice: 'm', dyal: '1/1' }] }),
                   akt('ap', { vid: 'друго', dokument: d178, pridobivashti: [{ lice: 'a2', dyal: '1/1' }] }));
    F._sbDanni(p);
    t('двата Аркона се сливат в един', s.lica.filter(l => /АРКОН/.test(l.ime)).length === 1, s.lica.map(l => l.ime));
    t('и актовете на втория минават към първия', s.sabitia.every(e => !e.ot || e.ot === 'a1')
      && s.sabitia[2].pridobivashti[0].lice === 'a1', s.sabitia);
    F.set(p); F.sbMahniAkt(s.sabitia[1].id);
    t('„махни целия акт“ маха всички записи с № 178', s.sabitia.length === 1 && s.sabitia[0].dokument === d148,
      s.sabitia.map(e => e.dokument));
    t('и АП 9 става 1/1', F._drTekst(F._sbSabrano(p, 'ap')) === '1');
    s.obekti.push({ id: 'g', vid: 'самостоятелен обект', opisanie: 'Г52' });
    s.sabitia.push(akt('g', { vid: 'обезщетение', dokument: d178, pridobivashti: [{ lice: 'm', dyal: '1/1' }] }),
                   akt('ap', { vid: 'обезщетение', dokument: d178, pridobivashti: [{ lice: 'm', dyal: '1/1' }] }));
    F.sbMahniAkt(s.sabitia[1].id);
    t('празният обект си отива с акта', !s.obekti.some(o => o.id === 'g'), s.obekti.map(o => o.opisanie));
    t('обектът „тук се строи“ остава', s.obekti.some(o => o.id === 'ap'));
}
{
    // Люлин: „Борис Серафимов, като пълномощник на ВАСИЛКА СТОИМЕНОВА“.
    const st = F._sbStrani('Калина Кирилова Петрова, Борис Александров Серафимов, като пълномощник на '
        + 'ВАСИЛКА АЛЕКСАНДРОВА СТОИМЕНОВА, Ваня Тошкова Александрова');
    t('пълномощникът преди страната не е страна', !st.some(x => /Серафимов/.test(x)), st);
    t('страните са три, Василка е сред тях', st.length === 3 && st.some(x => /Стоименова/i.test(x)), st);
}
{
    // Люлин, второ четене: измислени квоти, паркомясто с дял от гаража,
    // предварителният договор наобратно и две тирета. (05.11.2026)
    const p = nov(), s = p.sobstvenost;
    s.obekti.push({ id: 'z', vid: 'земя', identifikator: '68134.4354.781' });
    s.koren = 'z';
    const L = '«ЛЮЛИН ИНВЕСТ ГРУП 22» ЕООД, представлявано от управителя Р. Начев';
    p._sb_procheteno = { fajl: 'l.pdf', nomer: '81', delo: '242/2022', data: '22.12.2022',
        lica: [{ ime: 'Димитър Киров', kvota_zemya: '1/9' }, { ime: 'Анелия Янкова – Христова', kvota_zemya: '1/9' },
               { ime: 'Илия Илиев', kvota_zemya: '1/9' }],
        obekti: [{ identifikator: '68134.4354.781', vid: 'земя' }],
        prehvarliania: [
            { vid: 'учредяване право на строеж', ot: 'Димитър Киров, Анелия Янкова – Христова, Илия Илиев',
              na: L, dyal: '1/1', obekt: '68134.4354.781' },
            { vid: 'обезщетение', ot: L, na: 'Димитър Киров', dyal: '23,72/151,40', obekt: 'паркомясто А6' },
            { vid: 'обезщетение', ot: L, na: 'Анелия Янкова - Христова', dyal: '1/1', obekt: 'апартамент А32' },
            { vid: 'обезщетение', ot: 'Димитър Киров, Анелия Янкова – Христова, Илия Илиев', na: L,
              dyal: '12,50/7146', obekt: 'външно паркомясто Г52' },
            { vid: 'обезщетение', ot: L, na: L, dyal: '1/1', obekt: 'всички останали обекти' }] };
    F.set(p); F.sbPriemi();
    const u = s.sabitia.find(e => /учредяв/.test(e.vid));
    t('квоти, които не дават 1/1, не се пазят', !u.kvoti, u.kvoti);
    t('редовете към суперфициара отпадат', !s.obekti.some(o => /Г52|всички останали/.test(o.opisanie || ''))
      && s.sabitia.length === 3, s.sabitia.map(e => e.vid + ' ' + e.obekt));
    const a6 = s.obekti.find(o => o.opisanie === 'паркомясто А6');
    t('паркомясто с дял от гаража е цяло', a6 && F._drTekst(F._sbSabrano(p, a6.id)) === '1');
    t('двете тирета са едно лице', s.lica.filter(l => /Христова/.test(l.ime)).length === 1, s.lica.map(l => l.ime));
    const vaz = F._sbVazlozhiteli(p, '05.11.2026');
    t('учредителите са по 1/3, с „!“', vaz.filter(v => v.prava.some(x => x.posochen && x.ravni
      && F._drTekst(x.dyal) === '1/3')).length === 3, vaz.map(v => v.ime));
}
{
    // При четене правото отива направо в отделния обект.
    const p = nov(), s = p.sobstvenost;
    s.obekti.push({ id: 'z', vid: 'земя', identifikator: '68134.702.9889' });
    p._sb_procheteno = { fajl: 'na.pdf', data: '27.07.2023', obekti: [{ identifikator: '68134.702.9889' }],
        prehvarliania: [{ vid: 'учредяване право на строеж', ot: 'Пламен Георгиев Василев',
                          na: '«БИЛДИНГ ЕКСПРЕС-90 Р» ООД', dyal: '1/1', obekt: '68134.702.9889' }] };
    F.sbPriemi();
    const o = s.obekti.find(x => x.id === s.sabitia[0].obekt);
    t('прочетеното право на строеж не сяда върху земята', o && o.vid === 'право на строеж', o);
}
t('над цялото казва кой какво държи, не „липсва -1“',
  !!n9 && /събрани 2, с 1 повече/.test(n9.tekst) && /Продавач 1/.test(n9.tekst) && /Купувач 1/.test(n9.tekst), n9);

// ── край ───────────────────────────────────────────────────────────────────
// ── правното основание ────────────────────────────────────────────────────
// В ОСИП, раздел Б: „Правно основание: ......“. Актът е в регистъра — пише се
// оттам. (Операторът, 16.10.2026: „никъде не записва НА“.)
const po = nov();
const spo = F._sbDanni(po);
spo.lica.push({ id: 'l1', ime: 'Даниела Валентинова Занева' });
spo.obekti.push({ id: 'o1', vid: 'земя', identifikator: '29430.4713.49' });
spo.koren = 'o1';
spo.sabitia.push(akt('o1', { vid: 'покупко-продажба', data: '09.07.2019',
    dokument: 'нотариален акт № 186, том II, рег. № 3421, дело 311, нотариус Росица Рашева',
    ot: null, ot_opisanie: 'Иван Петров', pridobivashti: [{ lice: 'l1', dyal: '1/1' }] }));
const osn = F._sbPravnoOsnovanie(po, '');
t('правното основание сочи акта', /№ 186/.test(osn) && /нотариус Росица Рашева/.test(osn), osn);
t('правното основание носи датата', /09\.07\.2019/.test(osn), osn);
t('започва с главна буква', /^Нотариален/.test(osn), osn);

// Два носителя — два акта, и двата са основание.
spo.lica.push({ id: 'l2', ime: 'Павел Валериев Христов' });
spo.sabitia.push(akt('o1', { vid: 'дарение', data: '12.05.2021',
    dokument: 'нотариален акт № 9, том I', ot: 'l1',
    pridobivashti: [{ lice: 'l2', dyal: '1/2' }] }));
const osn2 = F._sbPravnoOsnovanie(po, '');
t('и двата акта са основание', /№ 186/.test(osn2) && /№ 9/.test(osn2), osn2);
t('актовете са подредени по дата', osn2.indexOf('186') < osn2.indexOf('№ 9'), osn2);
t('основанието е до дата', !/№ 9/.test(F._sbPravnoOsnovanie(po, '01.01.2020')),
  F._sbPravnoOsnovanie(po, '01.01.2020'));
t('празен регистър дава празно основание', F._sbPravnoOsnovanie(nov(), '') === '');

// ── представителството не е страна ────────────────────────────────────────
// Операторът, 19.10.2026 (НА на ЕРМ): „Йоана е пълномощник на Иван, който е
// управител на ХЪС = ХЪС участва като ЮЛ с управител Иван“.
const HUS = '„ХЪС ИНВЕСТ СОФИЯ“ ЕООД, представлявано от ИВАН ХРИСТОВ АСЕНОВ,'
    + ' действащ чрез пълномощника си ЙОАНА КАМЕНОВА ИВАНОВА';
t('фирмата е ЕДНА страна, не три лица', F._sbStrani(HUS).length === 1, F._sbStrani(HUS));
t('името на фирмата остава както е', /ХЪС ИНВЕСТ СОФИЯ/.test(F._sbStrani(HUS)[0])
  && !/АСЕНОВ/.test(F._sbStrani(HUS)[0]), F._sbStrani(HUS));
t('подписалите се пазят', /ИВАН ХРИСТОВ АСЕНОВ/.test(F._sbKojPodpisva(HUS))
  && /ЙОАНА/.test(F._sbKojPodpisva(HUS)), F._sbKojPodpisva(HUS));

const ERM = '„ЕЛЕКТРОРАЗПРЕДЕЛИТЕЛНИ МРЕЖИ ЗАПАД“ ЕАД, представлявано от Лилия Росенова'
    + ' Йорданова, Виктор Любомиров Станчев и Радослав Георгиев Цветков';
t('тримата представляващи не стават страни', F._sbStrani(ERM).length === 1, F._sbStrani(ERM));

t('истинските съсобственици пак се разделят',
  F._sbStrani('Иван Петров, Мария Петрова и Георги Иванов').length === 3,
  F._sbStrani('Иван Петров, Мария Петрова и Георги Иванов'));
t('име само с главни букви се изглажда',
  F._sbStrana('ЙОАНА КАМЕНОВА ИВАНОВА') === 'Йоана Каменова Иванова',
  F._sbStrana('ЙОАНА КАМЕНОВА ИВАНОВА'));
t('фирма с главни букви НЕ се изглажда',
  F._sbStrana('„ХЪС ИНВЕСТ СОФИЯ“ ЕООД') === '„ХЪС ИНВЕСТ СОФИЯ“ ЕООД',
  F._sbStrana('„ХЪС ИНВЕСТ СОФИЯ“ ЕООД'));
t('нормално писано име не се пипа',
  F._sbStrana('Лилия Росенова Йорданова') === 'Лилия Росенова Йорданова');

// Целият акт на ЕРМ през приемането.
const pr2 = nov();
pr2._sb_procheteno = {
    fajl: 'НА_ЕРМ.pdf', vid: 'договор за учредяване право на строеж',
    nomer: '67', tom: 'XIV', registar: '30824', delo: '2257/2026',
    data: '02.10.2026', notarius: 'Георги Нейков',
    lica: [], obekti: [{ identifikator: '68134.1006.2440.трафопост', vid: 'друго' }],
    prehvarliania: [{ vid: 'учредяване право на строеж', dyal: '1/1',
        ot: HUS, na: ERM, obekt: '68134.1006.2440.трафопост' }],
};
F.sbPriemi();
const sErm = F._sbDanni(pr2);
t('в регистъра влиза ЕДНО лице — приобретателят', sErm.lica.length === 1, sErm.lica.map(l => l.ime));
t('и то е ЕРМ', /ЕЛЕКТРОРАЗПРЕДЕЛИТЕЛНИ/.test(sErm.lica[0].ime), sErm.lica[0].ime);
t('едно събитие', sErm.sabitia.length === 1);
t('прехвърлителят е ХЪС, без управителя',
  /ХЪС/.test(sErm.sabitia[0].ot_opisanie) && !/АСЕНОВ/.test(sErm.sabitia[0].ot_opisanie),
  sErm.sabitia[0].ot_opisanie);
t('подписалите стоят върху акта', /АСЕНОВ/.test(sErm.sabitia[0].podpisali || ''),
  sErm.sabitia[0].podpisali);
t('документът е нотариален акт', /нотариален акт/.test(sErm.sabitia[0].dokument),
  sErm.sabitia[0].dokument);
t('видът на сделката се пази', sErm.sabitia[0].vid === 'учредяване право на строеж',
  sErm.sabitia[0].vid);

// ── пълномощното е свойство на лицето ─────────────────────────────────────
// Операторът, 21.10.2026: представителят живее в собствеността, до възложителя;
// Акт 15 се подписва от всички или от нотариално упълномощен.
const pp = nov();
const sp = F._sbDanni(pp);
sp.lica.push({ id: 'v1', ime: 'Иван Петров' }, { id: 'v2', ime: 'Мария Петрова' });
sp.obekti.push({ id: 'o1', vid: 'земя', identifikator: '1' });
sp.koren = 'o1';
sp.sabitia.push(akt('o1', { vid: 'покупко-продажба', data: '01.01.2020', dokument: 'НА № 1',
    ot: null, ot_opisanie: 'стар', pridobivashti: [{ lice: 'v1', dyal: '1/2' },
                                                   { lice: 'v2', dyal: '1/2' }] }));

let pod = F._sbPodpisi(pp, '');
t('без представители подписват всички', pod.broj === 2 && pod.redove.every(r => r.sam)
  && !pod.lipsvat.length, pod);

sp.lica.find(x => x.id === 'v2').predstavitel = { ime: 'Георги Димитров', nomer: '1234',
                                     data: '10.02.2026', obhvat: 'общо' };
pod = F._sbPodpisi(pp, '');
t('представителят заменя подписа',
  pod.redove.find(r => r.ime === 'Мария Петрова').podpisva === 'Георги Димитров', pod.redove);
t('и носи основанието си',
  /1234/.test(pod.redove.find(r => !r.sam).osnovanie || ''), pod.redove);
t('пълномощно „общо“ не вдига тревога', !pod.lipsvat.length, pod.lipsvat);

sp.lica.find(x => x.id === 'v2').predstavitel = { ime: 'Георги Димитров', obhvat: 'общо' };
t('представител без документ се казва',
  F._sbPodpisi(pp, '').lipsvat.some(x => /няма пълномощно/.test(x)),
  F._sbPodpisi(pp, '').lipsvat);

sp.lica.find(x => x.id === 'v2').predstavitel = { ime: 'Георги Димитров', nomer: '9', data: '01.01.2026',
                                     obhvat: 'представителство пред общината' };
t('тесният обхват се казва',
  F._sbPodpisi(pp, '').lipsvat.some(x => /не покрива подписване/.test(x)),
  F._sbPodpisi(pp, '').lipsvat);

const klP = F._sbKlienti(pp, '');
t('клиентът носи кой подписва',
  klP.find(c => c.name === 'Мария Петрова').podpisva === 'Георги Димитров', klP);
t('и основанието влиза в документа',
  /№ 9/.test(klP.find(c => c.name === 'Мария Петрова').podpisva_osnovanie || ''), klP);
t('лице без представител подписва само',
  !klP.find(c => c.name === 'Иван Петров').podpisva);

// ── прочетено пълномощно (06.11.2026) ───────────────────────────────────────
{
    const p = nov(), s = p.sobstvenost;
    s.lica.push({ id: 'i', ime: 'ИВАН СТАНЧЕВ СТАНЧЕВ' }, { id: 'm', ime: 'Мария Станчева' });
    s.obekti.push({ id: 'a', vid: 'самостоятелен обект', opisanie: 'апартамент № 10' });
    s.koren = 'a';
    s.sabitia.push(akt('a', { vid: 'покупко-продажба', data: '12.11.2021',
        pridobivashti: [{ lice: 'i', dyal: '1/2' }, { lice: 'm', dyal: '1/2' }] }));
    p._sb_pal_procheteno = { fajl: 'pal.pdf', palnomoshtnik: 'Димитри Петракиев',
        upalnomoshtiteli: [{ ime: 'Иван Станчев Станчев' }, { ime: 'Петър Чужд' }],
        reg_nomer: '4676', data: '19.11.2021', notarius: 'Иван Иванов', notarius_nomer: '263' };
    F.set(p); F.sbPriemiPal();
    const iv = s.lica.find(l => l.id === 'i');
    t('пълномощното се записва на упълномощителя (по име, без значение от главните)',
      iv.predstavitel && iv.predstavitel.ime === 'Димитри Петракиев' && iv.predstavitel.nomer === '4676'
      && iv.predstavitel.notarius === '263', iv.predstavitel);
    t('лице извън регистъра не се създава', s.lica.length === 2, s.lica.map(l => l.ime));
    t('прочетеното се изчиства', !p._sb_pal_procheteno);
    const op = F._sbPalnomoshtniOpis(p, '');
    t('в описа — един ред на пълномощно',
      op.length === 1 && op[0] === 'Нотариално заверено пълномощно рег. № 4676 от 19.11.2021 г. на нотариус № 263 в НК — Димитри Петракиев', op);
    t('в 1.1 не влиза', !F._sbAktove11(p, '').some(r => /пълномощно/i.test(r)));
}

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема от ${dobri.length + loshi.length}`
                         : `\n${dobri.length} проверки — един акт, едно събитие`);
process.exit(loshi.length ? 1 : 0);
