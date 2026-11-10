// ЕДНА ТЕТРАДКА ЗА ДОКУМЕНТИТЕ НА СТРОЕЖА
//
// Решение на оператора, 29.10.2026: „трием описаното и пазим кухнята“.
//
// Дотук папката се водеше в ТРИ тетрадки: прочетеното от четеца
// (`st.sloy2.od`), вписаното на ръка (`p.dokumenti`) и отметнатото по чеклист
// (`st.nadzor_otmetnati`). Всеки изглед — разделите 1.1–1.5, описът в т. 4,
// ОД — преписваше от трите и гадаеше кое е същото. Един и същи договор е
// „Договор за присъединяване“ в едната и „№ 967/2023“ в другата. Това гадаене
// се поправяше четири пъти за един ден.
//
// Тук тетрадката е ЕДНА. Един ред = един документ, и на реда пише откъде е
// дошъл и сверен ли е. Изгледите вече не преписват — четат същия ред през
// различни очила.
//
// Какво НЕ прави: не чете, не съди, не решава какво влиза в акта. Събира.

const _DOK_PROCHETEN = 'прочетен';
const _DOK_VPISAN = 'вписан';
const _DOK_OTMETNAT = 'отметнат';
// Съставен тук от бетоновия дневник и потвърден от оператора „подписан“ (10.11.2026).
const _DOK_SASTAVEN = 'съставен тук, потвърден от оператора';

// Познава се по НОМЕРА, когато има номер — иначе по името без номера и датата
// след него („Протокол обр. 2“ и „Протокол обр. 2 — № 1 от 29.03.2026 г.“ са
// един документ).
function _dokKlyuchIme(x) {
    return String(x || '').trim().toLowerCase().split(/\s+—\s+|,\s*№/)[0].trim();
}

// Номерът често носи и годината или датата след наклонена черта: „967 /2023 г.“
// и „967“ са ЕДИН номер. Без това в Акт 15 от 29.10.2026 договорът за
// присъединяване излезе ДВА пъти — веднъж както го е прочел четецът, веднъж
// както е вписан на ръка.
function _dokKlyuchNomer(x) {
    return String(x || '').toLowerCase().replace(/^№\s*/, '').split('/')[0]
        .replace(/[^0-9a-zа-я]/g, '');
}

// Номерът е до „от“ или до запетая — не до първия интервал. „№ ДПЕРМ
// 1205463907 от 13.06.2024“ е номер „ДПЕРМ 1205463907“, а не „ДПЕРМ“.
function _dokNomerOtTekst(tekst) {
    const m = String(tekst || '').match(/№\s*(.+?)(?:\s+от\s|[,;]|$)/);
    return m ? m[1].trim() : '';
}

// ПОПРАВЕНОТО БИЕ ПРОЧЕТЕНОТО.
//
// Правилото е отпреди („поправи значи влиза поправеното, не прочетеното“), но
// тетрадката го нарушаваше: вземаше суровата стойност на четеца и гледаше
// потвържденията само за да реши СВЕРЕН ЛИ Е документът.
//
// Цената се видя на 03.11.2026 върху истински обект: ръкописните години бяха
// прочетени като 2017, 2018 и 2024, операторът ги поправи на 2022 — и
// историята на строежа пак показа „01.07.2017 – 25.05.2024“. Поправка, която
// не стига до документа, е по-лоша от липсваща: изглежда направена.
function _dokStoynost(d, potv, pole) {
    const p = (potv || {})[`${_s2Id(d)}::${pole}`];
    if (p && String(p.stoynost ?? '').trim()) return String(p.stoynost).trim();
    return String((d[pole] || {}).stoynost || '').trim();
}

// Един ред на тетрадката.
function _dokRed(kak) {
    return {
        ime: String(kak.ime || '').trim(),
        nomer: String(kak.nomer || '').trim().replace(/^№\s*/, ''),
        data: String(kak.data || '').trim(),
        vid: String(kak.vid || '').trim(),
        // Какво е прието — за частите при обр. 12 и протокол 17.
        sadarzhanie: String(kak.sadarzhanie || '').trim(),
        kod: String(kak.kod || '').trim(),
        otkade: kak.otkade,
        sveren: !!kak.sveren,
        // Суровият прочетен запис — разделите искат съдържанието и частта.
        izvor: kak.izvor || null,
    };
}

// ЦЯЛАТА ТЕТРАДКА. Прочетеното върви първо, защото носи най-много: наименование,
// номер, дата, съдържание, страница и цитат. Вписаното и отметнатото ДОПИСВАТ
// онова, което четецът не е видял.
function dokTetradka(p, st) {
    const redove = [], poNomer = new Map(), poIme = new Map();
    const dobavi = red => {
        const kn = _dokKlyuchNomer(red.nomer), ki = _dokKlyuchIme(red.ime);
        if (!ki && !kn) return null;
        // ВСЕКИ прочетен документ е свой ред. Двайсет и четири акта обр. 7 са
        // двайсет и четири хартии с различни дати — слеят ли се в един ред,
        // броят и диапазонът в Акт 15 се губят.
        //
        // Сливат се само вписаното и отметнатото ВЪРХУ вече прочетеното: там
        // става дума за един и същи документ, описан два пъти с различни думи.
        const star = red.otkade === _DOK_PROCHETEN ? null
                   : ((kn.length > 1 && poNomer.get(kn)) || poIme.get(ki));
        if (star) {
            for (const pole of ['nomer', 'data', 'vid']) if (!star[pole] && red[pole]) star[pole] = red[pole];
            return star;
        }
        redove.push(red);
        if (kn.length > 1) poNomer.set(kn, red);
        if (ki) poIme.set(ki, red);
        return red;
    };

    const s2 = (st && st.sloy2 && st.sloy2.od) || {};
    const potv = s2.potvardeni || {};
    for (const d of s2.dokumenti || []) {
        dobavi(_dokRed({
            ime: typeof _dokIme === 'function' ? _dokIme(d, potv) : (d.vid || ''),
            nomer: _dokStoynost(d, potv, 'nomer'),
            data: _dokStoynost(d, potv, 'data'),
            vid: d.vid, kod: d.vid_kod,
            sadarzhanie: _dokStoynost(d, potv, 'sadarzhanie'),
            otkade: _DOK_PROCHETEN,
            // Сверен значи потвърдено е онова, което екранът предлага.
            sveren: typeof _s2Sveren === 'function' && _s2Sveren(d, potv),
            izvor: d,
        }));
    }

    // Вписаното на ръка е ТВЪРДЕНИЕ НА ОПЕРАТОРА — то не чака сверяване, защото
    // той го е написал, гледайки хартията.
    for (const d of (p && p.dokumenti) || []) {
        if (!String(d.ime || '').trim()) continue;
        dobavi(_dokRed({
            ime: d.ime, nomer: _dokNomerOtTekst(d.nomer),
            data: (String(d.nomer || '').match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/) || [])[1],
            otkade: _DOK_VPISAN, sveren: true,
        }));
    }

    for (const ime of (st && st.nadzor_otmetnati) || []) {
        if (!String(ime || '').trim()) continue;
        dobavi(_dokRed({ ime, otkade: _DOK_OTMETNAT, sveren: true }));
    }

    // АКТОВЕТЕ ОБР. 7, СЪСТАВЕНИ ОТ ДНЕВНИКА И ПОТВЪРДЕНИ „ПОДПИСАН“.
    // Твърдение на оператора, като вписаното на ръка (10.11.2026). Всеки е свой
    // ред — не минават през `dobavi`, който би слял еднаквите имена в един.
    // Сканът бие: прочетен акт обр. 7 със същата дата вече е тук.
    const dataKl = s => { const m = String(s || '').match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
        return m ? [+m[1], +m[2], m[3].length === 2 ? 2000 + +m[3] : +m[3]].join('.') : ''; };
    const AKT7 = /акт\s*(обр\.?|образец)?\s*№?\s*7(?![\dа-я])/i;
    const skanirani = new Set(redove
        .filter(r => r.otkade === _DOK_PROCHETEN && (r.kod === 'AKT7' || AKT7.test([r.ime, r.vid].join(' '))))
        .map(r => dataKl(r.data)).filter(Boolean));
    for (const a of ((st && st.akt7_dnevnik) || {}).aktove || []) {
        if (!a.podpisan || skanirani.has(dataKl(a.data))) continue;
        redove.push(_dokRed({ ime: 'Акт обр. 7', data: a.data, kod: 'AKT7', vid: 'акт обр. 7',
                              sadarzhanie: a.smr, otkade: _DOK_SASTAVEN, sveren: true }));
    }

    return redove;
}

// Онова, което ВЛИЗА в акта: сверените. Нечекнатото не е недовършено — то е
// отхвърлено нарочно (операторът, 28.10.2026).
function dokVliza(p, st) {
    return dokTetradka(p, st).filter(r => r.sveren);
}

// Изречението за един ред: наименование, номер, дата — както са прочетени.
// Номерът често носи своето „№“; второ не се слага.
function dokIzrechenie(r) {
    // Името често вече носи номера и датата: „Разрешение за строеж № 277/
    // 02.11.2023г.“ излизаше „…, № 277/02.11.2023г., от 02.11.2023 г.“ в
    // Акт 15. Каквото вече е казано, не се казва втори път. (06.11.2026)
    const ime = String(r.ime || '');
    const zn = x => String(x || '').toLowerCase().replace(/[\s№.г]/g, '');
    const imaNomer = r.nomer && zn(ime).includes(zn(r.nomer));
    const imaData = r.data && (zn(ime).includes(zn(r.data)) || (imaNomer && zn(r.nomer).includes(zn(r.data))));
    return [ime, !imaNomer && r.nomer && '№ ' + r.nomer, !imaData && r.data && 'от ' + r.data + ' г.']
        .filter(Boolean).join(', ');
}
