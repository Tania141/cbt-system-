// Протокол 2, прочетен в досието — чете и заверките на нивата (26.11.2026).
//
// Радулов: подписаният Протокол 2 (пр.2.pdf, 5 стр.) беше прочетен от общия
// четец — шапката, участниците, РС — а раздел III със заверките мълчеше.
// Четецът на нивата беше вързан само за полето в Протокол 2. Операторът: „да,
// вържи го“. Пробата пази: Протокол 2 → и нивата; друг документ → не; нивата
// чакат „Приеми“ (не се вписват сами); неуспех → казва се, не се мълчи.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'akt', 'moment.js'), 'utf8');
const grab = ime => { const m = new RegExp('^(async )?function ' + ime + '\\b[\\s\\S]*?\\n}', 'm').exec(src); return m ? m[0] : ''; };
const konst = ime => (new RegExp('^const ' + ime + ' = .+$', 'm').exec(src) || [''])[0];

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

(async () => {
    const zaiavki = [];
    let otgovorNiva = { niva: { proverki: [{ nivo: 'изкоп', kota: '-3,99 м', data: '20.02.2024' },
                                           { nivo: 'цокъл', kota: '±0,00', data: '25.04.2024' }], chetec: 'Claude' } };
    const aktApi = async (url, _m, telo) => {
        zaiavki.push([url, telo]);
        if (url.endsWith('razdeli')) return { chasti: [{ stranici: '1-5' }, { stranici: '6' }], n: 6 };
        if (url.endsWith('niva/chete')) return otgovorNiva;
        return { dokument: telo.stranici === '6'
            ? { vid: 'Акт обр. 3' }
            : { vid: { stoynost: 'Протокол за откриване на строителна площадка и определяне на строителна линия и ниво на строежа' } } };
    };
    let zapisano = 0;
    const F = new Function('aktApi', 'momentBase64', 'localStorage', 'aktZapishi',
        [konst('_M_P2'), grab('momentEP2'), grab('momentNivaOtProcheten'), grab('momentChetiFajl')].join('\n')
        + '\nreturn { momentChetiFajl, momentEP2 };')(
        aktApi, async () => 'AAA', { getItem: () => null }, () => { zapisano++; });
    global.momentFajlove = {};

    // ── Протокол 2 в многодокументен PDF → нивата се четат със страниците му ──
    const z = { p: { pi: '68134.702.9889' }, st: {} };
    await F.momentChetiFajl(z, { type: 'application/pdf' }, 'пр.2.pdf', () => {});
    const niva = zaiavki.filter(x => x[0].endsWith('niva/chete'));
    t('прочетен Протокол 2 → пуска се и четецът на нивата (веднъж)', niva.length === 1, zaiavki.map(x => x[0]));
    t('със същия файл и със страниците на Протокол 2', niva[0] && niva[0][1].fajl.ime === 'пр.2.pdf' && niva[0][1].stranici === '1-5', niva[0] && niva[0][1]);
    const pr = z.st.niva_predlozhenie || {};
    t('нивата чакат като предложение при строежа — с файла и „от досието“',
      pr.proverki && pr.proverki.length === 2 && pr.fajl === 'пр.2.pdf' && pr.ot_dosie === true, pr);
    t('НЕ са вписани сами в полетата', !(z.st.ostatak && z.st.ostatak.niva_izkop), z.st.ostatak);
    t('предложението е записано (не се губи при презареждане)', zapisano >= 1, zapisano);

    // ── друг документ → нищо ─────────────────────────────────────────────────
    zaiavki.length = 0;
    const aktApi2 = async (url, _m, telo) => { zaiavki.push([url, telo]); return url.endsWith('chete') && !url.includes('niva') ? { dokument: { vid: 'Акт обр. 14' } } : {}; };
    const F2 = new Function('aktApi', 'momentBase64', 'localStorage', 'aktZapishi',
        [konst('_M_P2'), grab('momentEP2'), grab('momentNivaOtProcheten'), grab('momentChetiFajl')].join('\n')
        + '\nreturn { momentChetiFajl };')(aktApi2, async () => 'AAA', { getItem: () => null }, () => {});
    const z2 = { p: { pi: '1' }, st: {} };
    await F2.momentChetiFajl(z2, { type: 'image/jpeg' }, 'акт14.jpg', () => {});
    t('друг документ → четецът на нивата НЕ се пуска', !zaiavki.some(x => x[0].endsWith('niva/chete')), zaiavki.map(x => x[0]));
    t('и предложение няма', !z2.st.niva_predlozhenie, z2.st);

    // ── неуспех → казва се ───────────────────────────────────────────────────
    zaiavki.length = 0;
    otgovorNiva = { greshka: 'Нито един четец не прочете проверки' };
    const z3 = { p: { pi: '1' }, st: {} };
    await F.momentChetiFajl(z3, { type: 'image/jpeg' }, 'p2.jpg', () => {});
    t('нивата не се прочетоха → предложението казва защо (не мълчи)',
      z3.st.niva_predlozhenie && z3.st.niva_predlozhenie.greshka && !z3.st.niva_predlozhenie.proverki.length, z3.st.niva_predlozhenie);

    // ── позна ли Протокол 2 по кода и по името ───────────────────────────────
    t('по vid_kod', F.momentEP2({ vid_kod: 'PROTOKOL2' }));
    t('по наименованието', F.momentEP2({ naimenovanie: { stoynost: 'ПРОТОКОЛ за откриване на строителна площадка' } }));
    t('акт обр. 3 не е Протокол 2', !F.momentEP2({ vid: 'Констативен акт обр. 3' }));

    // ── екранът и приемането ─────────────────────────────────────────────────
    t('Протокол 2 показва чакащото от досието', /niva_predlozhenie/.test(grab('momentNivaHtml')), '');
    t('„Приеми датите“ взима и чакащото от досието и го маха след това',
      /momentNivaSega\(\)/.test(grab('momentNivaPriemi')) && /delete z\.st\.niva_predlozhenie/.test(grab('momentNivaPriemi')), '');
    t('„Откажи“ маха чакащото и записва',
      /delete z\.st\.niva_predlozhenie/.test(grab('momentNivaOtkazhi')) && /aktZapishi/.test(grab('momentNivaOtkazhi')), '');

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — Протокол 2 от досието чете и нивата`);
    process.exit(loshi.length ? 1 : 0);
})();
