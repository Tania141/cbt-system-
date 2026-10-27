// АКТ СИСТЕМ · новото ПВА · znaem.js
// ЕКРАН 7. КАКВО ЗНАЕМ ЗА СТРОЕЖА — огледалото
//
// „Нищо не се въвежда. Всичко, което системата знае, с откъде: етажи,
//  височина, коти, показатели, категория, възложители. До всяка стойност —
//  източникът и кой я е потвърдил. Разминаванията излизат тук, червени.
//  Днес това е «Проверки» и в него се чекваше. Чекването се мести при самия
//  документ и при записката. Тук остава гледането.“ (ЗАДАНИЕ.md)
//
// Затова в този файл НЯМА нито един бутон, който пише в данните. Всичко е
// четене. Поправя се там, където признакът се чете — на Екран 4.
//
// Отваря се от две места: четвърта връзка на Екран 2 и при клик върху число —
// тогава адресът носи и групата (`#/znaem/<id>/<строеж>/<група>`) и тя се
// отваря подчертана.
//
// Признаците, имената им и кои от тях ВЪОБЩЕ се питат за този строеж идват от
// кухнята (`js/05-proverki.js`). Тук не се решава нищо от това.

'use strict';

let znaemId = null;
let znaemIndeks = 0;
let znaemGrupa = '';       // кое е довело тук — отваря се разгъната
let znaemOtvoreni = {};    // кои групи са разгънати на ръка

// Подредбата е по СМИСЪЛ, не по реда в кухнята: операторът търси „котите“ или
// „показателите“, не „поле №37“. Ключовете, които не са изредени тук, падат в
// „Друго“ — затова нищо не може да изчезне, ако кухнята добави признак.
// `proba_pva_znaem.js` го проверява.
const ZNAEM_GRUPI = [
    ['kakvo',      'Какво е строежът',
     ['obekt', 'vid', 'kategoria', 'prednaznachenie', 'povod', 'faza', 'zahranvan_obekt']],
    ['koi',        'Кои са',
     ['sobstvenik', 'investitor']],
    ['kade',       'Къде е',
     ['identifikator', 'upi', 'plosht_upi', 'zona', 'pup', 'kadastr',
      'opisanie_ploshtadka']],
    ['obem',       'Обемът',
     ['etaji', 'podzemen_etaj', 'garaj', 'visochina', 'zp', 'rzp']],
    ['pokazateli', 'Градоустройствени показатели',
     ['plytnost_dop', 'plytnost_post', 'kint_dop', 'ozelen_dop', 'ozelen_post',
      'korniz_dop', 'korniz_post', 'otstoyania']],
    ['koti',       'Котите и реперът',
     ['kota_izkop', 'kota_cokul', 'kota_bilo', 'reper_nomer', 'reper_kota']],
    ['instalacii', 'Инсталациите',
     ['otoplenie', 'toplosnabdyavane', 'gaz', 'ovk', 'ventilaciya', 'asansior',
      'drenaj', 'pozharogasene', 'pozharoizvestyavane', 'el_saobshteniya',
      'vik', 'elektro', 'metalnaKonstrukcia']],
    ['opasno',     'Опасното и становищата',
     ['spo', 'rspbzn', 'imaMashini']],
];

// Постигнатото срещу допустимото. Това е проверката, която архитектът прави
// сам на себе си в записката — затова тук се смята наново от ДВЕ стойности.
//   · плътност, кинт, корниз: постигнатото НЕ бива да е над допустимото;
//   · озеленяване: обратно — постигнатото не бива да е ПОД допустимото.
const ZNAEM_VEZNI = [
    ['plytnost_dop', 'plytnost_post', 'nad'],
    ['ozelen_dop',   'ozelen_post',   'pod'],
    ['korniz_dop',   'korniz_post',   'nad'],
];

function znaemOtvori(id, i, grupa) {
    znaemId = id;
    znaemIndeks = Number(i || 0);
    znaemGrupa = grupa || '';
    znaemOtvoreni = {};
    if (znaemGrupa) znaemOtvoreni[znaemGrupa] = true;
    const p = aktObekt(id);
    if (!p) {
        document.getElementById('znaem-telo').innerHTML =
            '<div class="pusto"><div class="pusto-ime">Този обект го няма</div></div>';
        return;
    }
    aktZapomniObekt(p, znaemIndeks);
    znaemRisuvai();
}

function znaemZhiv() {
    const p = aktObekt(znaemId);
    if (!p) return null;
    const st = aktStroezh(p, znaemIndeks);
    // Признаците висят на СТРОЕЖА. За първия строеж `st` е самият обект, тоест
    // `p.fakti` и `st.fakti` са едно и също; за допълнителен строеж — не са, и
    // смесването им би показало чужди стойности.
    return { p, st, fakti: st.fakti || {}, razminavania: st.razminavania || {} };
}

function znaemRisuvai() {
    const z = znaemZhiv();
    if (!z) return;
    document.getElementById('znaem-telo').innerHTML =
        znaemGlavaHtml(z)
        + znaemRazminavaniaHtml(z)
        + znaemRedoveHtml(z)
        + ZNAEM_GRUPI.map(g => znaemGrupaHtml(z, g[0], g[1], g[2])).join('')
        + znaemGrupaHtml(z, 'drugo', 'Друго', znaemOstanali());
}

// Ключове, които подредбата по смисъл не е прибрала. Празно е добре.
function znaemOstanali() {
    const vzeti = new Set(ZNAEM_GRUPI.flatMap(g => g[2]));
    return (typeof _KES_POLETA !== 'undefined' ? _KES_POLETA : [])
        .map(x => x[0]).filter(k => !vzeti.has(k));
}

function znaemIme(k) {
    return (typeof _KES_IME !== 'undefined' && _KES_IME[k]) || k;
}

// ── Главата ──────────────────────────────────────────────────────────────────

function znaemGlavaHtml(z) {
    const vsichki = znaemVsichkiPriloshimi(z);
    const broj = s => vsichki.filter(k => znaemSastoyanie(z, k) === s).length;
    const potv = broj('potvardeno') + broj('popraveno');
    return `
    <div class="kutiya-razdel">
        <p class="poyasnenie">Огледало. Тук нищо не се въвежда — всичко се поправя там,
           където се чете: на <a href="#/proekt/${encodeURIComponent(znaemId)}/${znaemIndeks}">Проектът</a>.
           До всяка стойност стои откъде е дошла и кой я е потвърдил.</p>
        <div class="znaem-broevi">
            <span class="znaem-broj">${potv} сверени</span>
            <span class="znaem-broj">${broj('predlozheno')} чакат ✔</span>
            <span class="znaem-broj">${broj('sporno')} спорни</span>
            <span class="znaem-broj">${broj('')} празни</span>
            <span class="otkade">от ${vsichki.length} признака за този строеж</span>
        </div>
    </div>`;
}

// Кои признаци ВЪОБЩЕ се питат за този строеж. Решава кухнята — съставките
// бият вида. Непитаните не са празни, те са неприложими, и не се броят.
function znaemPriloshimi(z, klyuchove) {
    const sast = typeof aktSastavki === 'function' ? aktSastavki(z.p, z.st) : [];
    const vid = znaemStoynost(z, 'vid') || z.st.vid || '';
    return klyuchove.filter(k => typeof _kesPriloshim !== 'function'
        || _kesPriloshim(k, vid, sast));
}

function znaemVsichkiPriloshimi(z) {
    return znaemPriloshimi(z,
        [...ZNAEM_GRUPI.flatMap(g => g[2]), ...znaemOstanali()]);
}

function znaemSastoyanie(z, k) {
    const f = z.fakti[k];
    return (f && f.sastoyanie) || '';
}

// Стойността, която системата наистина знае: само сверената. Предложената от
// четеца не е знание — тя чака ✔.
function znaemStoynost(z, k) {
    const f = z.fakti[k];
    return f && (f.sastoyanie === 'potvardeno' || f.sastoyanie === 'popraveno')
        ? String(f.stoynost ?? '').trim() : '';
}

// ── Разминаванията — червените ───────────────────────────────────────────────
// Три различни разминавания, и трите мълчаха досега:
//   · паспортът казва едно, проектът — друго (`st.razminavania`);
//   · частите на проекта не се връзват помежду си (`sporno`);
//   · постигнатото и допустимото не се връзват (сметка тук).

function znaemRazminavania(z) {
    const out = [];
    for (const r of Object.values(z.razminavania || {}))
        if (r && r.pole) out.push({
            vid: 'pasport', ime: znaemIme(r.pole),
            edno: ['по проект', r.ot_proekt], dve: ['в паспорта', r.v_pasporta],
            kazva: 'Потвърденото НЕ подменя въведеното на ръка — избираш ти.' });

    for (const k of znaemVsichkiPriloshimi(z)) {
        const f = z.fakti[k];
        if (!f) continue;
        if (f.sastoyanie === 'sporno') {
            const v = (f.varianti || []).filter(x => x && x.stoynost);
            out.push({
                vid: 'chasti', ime: znaemIme(k),
                redove: v.map(x => [(x.chasti || []).join(' · ') || 'част', x.stoynost]),
                kazva: v.length ? 'Частите на проекта казват различно за едно и също.'
                                : 'Частите не се връзват и няма с какво да се избере.' });
        }
        // Ново четене дава друго, отколкото вече е било сверено.
        if (f.sastoyanie === 'predlozheno' && f.predishna
            && String(f.predishna).trim() !== String(f.stoynost ?? '').trim())
            out.push({
                vid: 'novo', ime: znaemIme(k),
                edno: ['беше сверено', f.predishna], dve: ['новото четене дава', f.stoynost],
                kazva: 'Сверено беше едното; ново четене дава друго и чака ✔.' });
    }

    for (const [dop, post, kak] of ZNAEM_VEZNI) {
        const a = znaemChislo(znaemStoynost(z, dop));
        const b = znaemChislo(znaemStoynost(z, post));
        if (a === null || b === null) continue;
        const losho = kak === 'nad' ? b > a : b < a;
        if (!losho) continue;
        out.push({
            vid: 'vezni', ime: znaemIme(post),
            edno: ['допустимо', znaemStoynost(z, dop)],
            dve: ['постигнато', znaemStoynost(z, post)],
            kazva: kak === 'nad'
                ? 'Постигнатото е над допустимото.'
                : 'Постигнатото е под допустимото.' });
    }
    return out;
}

// Число от текст на записка: „38,5 %“, „15.00 м“, „60 %“. Запетаята е
// десетична, а не разделител на хиляди — така ги пишат в записките.
function znaemChislo(tekst) {
    const m = String(tekst ?? '').replace(/\s+/g, '').match(/-?\d+(?:[.,]\d+)?/);
    if (!m) return null;
    const n = Number(m[0].replace(',', '.'));
    return Number.isFinite(n) ? n : null;
}

function znaemRazminavaniaHtml(z) {
    const r = znaemRazminavania(z);
    if (!r.length) return `
    <div class="kutiya-razdel">
        <div class="nadpis">Разминавания</div>
        <p>Няма. Нито паспортът спори с проекта, нито частите помежду си.</p>
    </div>`;
    const dvojka = (etiket, v) => `
        <div class="razminavane-red">
            <span class="razminavane-etiket">${_e(etiket)}</span>
            <span class="razminavane-stoynost">${_e(v)}</span>
        </div>`;
    return `
    <div class="kutiya-razdel razdel-cherveno" id="znaem-razminavania">
        <div class="nadpis">Разминавания · ${r.length}</div>
        <p class="poyasnenie">Най-опасното не е празното поле, а двете различни стойности,
           които никой не вижда. Тук се виждат — поправят се на Проектът.</p>
        ${r.map(x => `
            <div class="razminavane razminavane-${x.vid}">
                <div class="razminavane-ime">${_e(x.ime)}</div>
                ${x.redove
                    ? x.redove.map(y => dvojka(y[0], y[1])).join('')
                    : dvojka(x.edno[0], x.edno[1]) + dvojka(x.dve[0], x.dve[1])}
                <div class="otkade">${_e(x.kazva)}</div>
            </div>`).join('')}
    </div>`;
}

// ── Защо точно тези редове се искат ──────────────────────────────────────────
// Тук се стига от число. Процентът не е признак — той е броеното на чеклиста,
// а чеклистът пита по СЪСТАВКИТЕ на строежа и по вида, категорията и повода.
// Затова числото обяснява себе си оттук.

function znaemRedoveHtml(z) {
    const sast = typeof aktSastavki === 'function' ? aktSastavki(z.p, z.st) : [];
    const chetiri = [['vid', 'Вид'], ['kategoria', 'Категория'],
                     ['povod', 'Повод'], ['prednaznachenie', 'Предназначение']];
    const otvoren = znaemGrupa === 'redove' || znaemOtvoreni.redove;
    return `
    <div class="kutiya-razdel ${znaemGrupa === 'redove' ? 'razdel-podchertan' : ''}"
         id="znaem-redove">
        <div class="nadpis nadpis-klik" onclick="znaemRazgani('redove')" tabindex="0"
             onkeydown="if(event.key==='Enter')znaemRazgani('redove')">
            Защо точно тези редове се искат ${otvoren ? '▾' : '▸'}
        </div>
        ${otvoren ? `
            <p class="poyasnenie">Процентите не броят признаци — броят редове от чеклиста.
               А кои редове се искат, се решава от съставките на строежа и от тези четири.</p>
            <div class="krugcheta">
                ${sast.length ? sast.map(s => `
                    <span class="krugche">${_e(s.ime)}
                        <span class="krugche-ot">${_e(s.ot || '')}</span></span>`).join('')
                  : '<p class="prazno">Нито една съставка не е разпозната — затова чеклистът пита всичко.</p>'}
            </div>
            <div class="znaem-redove">
                ${chetiri.map(([k, ime]) => {
                    const v = znaemStoynost(z, k);
                    return `
                    <div class="znaem-red">
                        <span class="znaem-etiket">${_e(ime)}</span>
                        <span class="znaem-stoynost ${v ? '' : 'znaem-prazno'}">${
                            _e(v || 'празно — затова чеклистът не стеснява')}</span>
                        ${znaemOtkadeHtml(z, k)}
                    </div>`;
                }).join('')}
            </div>` : ''}
    </div>`;
}

// ── Групите с признаците ─────────────────────────────────────────────────────

function znaemGrupaHtml(z, kod, ime, klyuchove) {
    const pitani = znaemPriloshimi(z, klyuchove);
    if (!pitani.length) return '';
    const nepitani = klyuchove.filter(k => !pitani.includes(k));
    const potv = pitani.filter(k => znaemStoynost(z, k)).length;
    const otvoren = znaemGrupa === kod || znaemOtvoreni[kod];
    return `
    <div class="kutiya-razdel ${znaemGrupa === kod ? 'razdel-podchertan' : ''}"
         id="znaem-${_e(kod)}">
        <div class="nadpis nadpis-klik" onclick="znaemRazgani('${_e(kod)}')" tabindex="0"
             onkeydown="if(event.key==='Enter')znaemRazgani('${_e(kod)}')">
            ${_e(ime)} <span class="otkade">${potv} от ${pitani.length}</span>
            ${otvoren ? '▾' : '▸'}
        </div>
        ${otvoren ? `
            <div class="znaem-redove">
                ${pitani.map(k => znaemRedHtml(z, k)).join('')}
            </div>
            ${nepitani.length ? `
                <details class="minali">
                    <summary>${nepitani.length} не се питат за този строеж</summary>
                    <div class="otkade">Не са празни — неприложими са. Съставките на
                       строежа не ги носят: ${_e(nepitani.map(znaemIme).join(' · '))}</div>
                </details>` : ''}` : ''}
    </div>`;
}

function znaemRedHtml(z, k) {
    const f = z.fakti[k] || {};
    const s = znaemSastoyanie(z, k);
    const sveren = s === 'potvardeno' || s === 'popraveno';
    const znak = sveren ? '✓' : s === 'sporno' ? '≠' : s === 'predlozheno' ? '…' : '—';
    const v = sveren ? String(f.stoynost ?? '').trim() : '';
    return `
    <div class="znaem-red znaem-red-${s || 'prazno'}">
        <span class="znaem-znak">${znak}</span>
        <span class="znaem-etiket">${_e(znaemIme(k))}</span>
        <span class="znaem-stoynost ${v ? '' : 'znaem-prazno'}">${
            _e(v || znaemPrazno(s))}</span>
        ${znaemOtkadeHtml(z, k)}
    </div>`;
}

function znaemPrazno(sastoyanie) {
    if (sastoyanie === 'predlozheno') return 'четено, но още не е сверено';
    if (sastoyanie === 'sporno') return 'частите казват различно';
    return 'нищо не знаем';
}

// Правило 3: всяка стойност казва откъде е. И кой я е потвърдил — правилото на
// огледалото. Сверил ли я е човек, стои името му; не е ли — стои какво чака.
function znaemOtkadeHtml(z, k) {
    const f = z.fakti[k] || {};
    const iz = f.iztochnik || {};
    const parcheta = [];
    if (iz.chast) parcheta.push(_e(iz.chast)
        + (iz.stranica ? ', стр. ' + _e(iz.stranica) : ''));
    const naraka = typeof _KES_NARAKA !== 'undefined' && _KES_NARAKA[k];
    const dokaz = typeof _KES_DOKAZ !== 'undefined' && _KES_DOKAZ[k];
    // Полетата на ръка го казват ВИНАГИ, дори да има прочетен източник:
    // прочетеното е само податка, стойността я пише операторът.
    if (naraka) parcheta.push('пише се на ръка');
    if (f.sastoyanie === 'potvardeno' || f.sastoyanie === 'popraveno')
        parcheta.push((f.sastoyanie === 'popraveno' ? 'поправено от ' : 'сверено от ')
            + _e(f.koy || 'оператора')
            + (f.koga ? ' · ' + _e(znaemData(f.koga)) : ''));
    else if (f.sastoyanie) parcheta.push('никой не го е сверил още');
    return `
    <div class="otkade">
        ${parcheta.join(' · ') || 'няма източник'}
        ${dokaz ? `<div class="znaem-dokaz">Доказва се с ${_e(dokaz[0])}. ${_e(dokaz[1])}</div>` : ''}
        ${naraka ? `<div class="znaem-dokaz">${_e(naraka)}</div>` : ''}
        ${f.citat || iz.citat ? `<div class="fakt-citat">„${_e(f.citat || iz.citat)}“</div>` : ''}
    </div>`;
}

function znaemData(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    const dve = n => String(n).padStart(2, '0');
    return `${dve(d.getDate())}.${dve(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function znaemRazgani(kod) {
    znaemOtvoreni[kod] = !(znaemGrupa === kod || znaemOtvoreni[kod]);
    if (znaemGrupa === kod) znaemGrupa = '';
    znaemRisuvai();
}

// Двете са само за пробата: `const` на горно ниво в класически скрипт не става
// свойство на `window`, тоест пробата не може да го достигне отвън. Функциите
// стават — и така подредбата се проверява, вместо да се вярва на окото.
function znaemGrupi() { return ZNAEM_GRUPI; }
function znaemPoleta() { return typeof _KES_POLETA !== 'undefined' ? _KES_POLETA : []; }
