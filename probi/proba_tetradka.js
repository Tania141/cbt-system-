// ЕДНА ТЕТРАДКА ЗА ДОКУМЕНТИТЕ.
//
// Операторът, 29.10.2026: „трием описаното и пазим кухнята“. Трите тетрадки —
// прочетено, вписано, отметнато — станаха една. Тази проба пази точно онова,
// което при три тетрадки се губеше и се поправяше четири пъти за един ден:
//
//   · всеки прочетен документ е СВОЙ ред (24 акта обр. 7 не се сливат — иначе
//     броят и диапазонът в Акт 15 изчезват);
//   · но един и същи документ, описан веднъж от четеца и веднъж на ръка, е
//     ЕДИН ред — познава се по номера;
//   · на всеки ред пише ОТКЪДЕ е дошъл и сверен ли е.
const { kod, grab } = require('./kod');
const s = kod();

const F = new Function(
    (new RegExp('^const _S2_TABLICI = [\\s\\S]*?\\n\\];$', 'm').exec(s) || [''])[0] + '\n'
    + [grab(s, '_s2Fakti'), grab(s, '_s2KlPoKoloni'), grab(s, '_s2SverimiKl'),
       grab(s, '_s2Sveren'), grab(s, '_dokIme'),
       grab(s, '_dokKlyuchIme'), grab(s, '_dokKlyuchNomer'), grab(s, '_dokNomerOtTekst'),
       grab(s, '_dokRed'), grab(s, 'dokTetradka'), grab(s, 'dokVliza'),
       grab(s, 'dokIzrechenie')].join('\n')
    + '\nconst _s2Id = d => d.id || d.fajl;'
    + '\nconst _DOK_PROCHETEN = "прочетен", _DOK_VPISAN = "вписан", _DOK_OTMETNAT = "отметнат";'
    + '\nreturn {dokTetradka, dokVliza, dokIzrechenie, _dokKlyuchIme, _dokKlyuchNomer, _dokNomerOtTekst};')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const fakt = v => ({ stoynost: v, citat: v, stranica: 1 });
const prochetn = (id, vid, data, extra) =>
    ({ id, fajl: id + '.pdf', vid, data: fakt(data), ...(extra || {}) });
// Сверен значи потвърдено е всичко, което екранът предлага. Тук потвърждаваме
// всичко, което записът носи.
const potvardi = dokumenti => {
    const p = {};
    for (const d of dokumenti)
        for (const k of ['data', 'nomer', 'naimenovanie', 'sadarzhanie'])
            if (d[k]) p[`${d.id}::${k}`] = { stoynost: d[k].stoynost };
    return p;
};
const stroezh = (dokumenti, potv, ostalo) => ({
    sloy2: { od: { dokumenti, potvardeni: potv || potvardi(dokumenti) } }, ...(ostalo || {}),
});

// ── всеки прочетен е свой ред ───────────────────────────────────────────────
const sedem = Array.from({ length: 24 }, (_, i) =>
    prochetn('a7-' + i, 'акт обр. 7', `${String((i % 28) + 1).padStart(2, '0')}.06.2022`));
const st1 = stroezh(sedem);
t('двайсет и четири акта обр. 7 са двайсет и четири реда',
  F.dokTetradka({}, st1).length === 24, F.dokTetradka({}, st1).length);
t('и всичките влизат, защото са сверени',
  F.dokVliza({}, st1).length === 24, F.dokVliza({}, st1).length);

// ── прочетено и вписано за един документ е един ред ─────────────────────────
const dvoen = stroezh([
    prochetn('dog', 'договор за присъединяване', '19.12.2023',
        { nomer: fakt('967'), naimenovanie: fakt('Договор за присъединяване към ВиК') }),
]);
const obekt = { dokumenti: [{ ime: 'Договор за присъединяване', nomer: '№ 967 от 19.12.2023 г.' }] };
const td = F.dokTetradka(obekt, dvoen);
t('един договор — един ред, не два', td.length === 1, td.map(r => r.ime));
t('прочетеното остава отгоре', td[0].otkade === 'прочетен', td[0]);
t('с наименованието, не с името на реда',
  td[0].ime === 'Договор за присъединяване към ВиК', td[0].ime);

// От истински Акт 15, 29.10.2026: договорът за присъединяване излезе ДВА пъти в
// раздел 1.5 — веднъж както го е прочел четецът („№ 967 /2023 г.“), веднъж
// както е вписан на ръка („№ 967“). Номерът носи и годината след чертата.
const sGodina = stroezh([
    prochetn('d1', 'договор за присъединяване', '19.12.2023',
        { nomer: fakt('967 /2023 г.'),
          naimenovanie: fakt('Договор за присъединяване към ВиК системи') }),
]);
const sRaka = { dokumenti: [{ ime: 'Договор за присъединяване', nomer: '№ 967 от 19.12.2023 г.' }] };
t('номер с година и без година са един номер',
  F.dokTetradka(sRaka, sGodina).length === 1,
  F.dokTetradka(sRaka, sGodina).map(r => [r.ime, r.nomer]));
t('„М-2955/19.10.26г“ се познава по частта преди чертата',
  F._dokKlyuchNomer('М-2955/19.10.26г') === F._dokKlyuchNomer('№ М-2955'),
  [F._dokKlyuchNomer('М-2955/19.10.26г'), F._dokKlyuchNomer('№ М-2955')]);

// ── на реда пише откъде е ───────────────────────────────────────────────────
const smesen = F.dokTetradka(
    { dokumenti: [{ ime: 'Одобрени инвестиционни проекти', nomer: 'от 12.03.2026 г.' }] },
    stroezh([prochetn('rs', 'разрешение за строеж', '02.11.2023', { nomer: fakt('277') })],
            null, { nadzor_otmetnati: ['Заповедна книга'] }));
t('трите извора са на един списък', smesen.length === 3, smesen.map(r => r.ime));
t('и всеки си казва откъде е',
  smesen.map(r => r.otkade).join(',') === 'прочетен,вписан,отметнат',
  smesen.map(r => [r.ime, r.otkade]));
t('вписаното на ръка не чака сверяване',
  smesen.filter(r => r.otkade !== 'прочетен').every(r => r.sveren), smesen);
t('датата се вади и от свободния текст на вписаното',
  smesen[1].data === '12.03.2026', smesen[1]);

// „№ ДПЕРМ 1205463907 от 13.06.2024“ излезе в акта като „№ ДПЕРМ“ — номерът се
// режеше на първия интервал.
const dperm = F.dokTetradka(
    { dokumenti: [{ ime: 'Становище за присъединяване',
                    nomer: '№ ДПЕРМ 1205463907 от 13.06.2024' }] }, {});
t('номерът е до „от“, не до първия интервал',
  dperm[0].nomer === 'ДПЕРМ 1205463907', dperm[0].nomer);
t('и датата му пак се вади', dperm[0].data === '13.06.2024', dperm[0].data);

// ── несвереното не влиза ────────────────────────────────────────────────────
const chaka = stroezh([prochetn('x', 'акт обр. 5', '15.03.2022')], {});
t('прочетеното без ✔ е в тетрадката', F.dokTetradka({}, chaka).length === 1);
t('но НЕ влиза в акта', F.dokVliza({}, chaka).length === 0);

// ── изречението ─────────────────────────────────────────────────────────────
t('изречението е наименование, номер, дата',
  F.dokIzrechenie({ ime: 'Нотариален акт', nomer: '23', data: '29.11.2022' })
  === 'Нотариален акт, № 23, от 29.11.2022 г.');
t('без номер и дата остава само името',
  F.dokIzrechenie({ ime: 'Заповедна книга' }) === 'Заповедна книга');

// ── празно ──────────────────────────────────────────────────────────────────
t('празен строеж дава празна тетрадка', F.dokTetradka({}, {}).length === 0);
t('и не гърми без строеж', F.dokTetradka(null, null).length === 0);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — тетрадката е една`);
process.exit(loshi.length ? 1 : 0);
