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

// Познава се по НОМЕРА, когато има номер — иначе по името без номера и датата
// след него („Протокол обр. 2“ и „Протокол обр. 2 — № 1 от 29.03.2026 г.“ са
// един документ).
function _dokKlyuchIme(x) {
    return String(x || '').trim().toLowerCase().split(/\s+—\s+|,\s*№/)[0].trim();
}

function _dokKlyuchNomer(x) {
    return String(x || '').toLowerCase().replace(/^№\s*/, '').replace(/[^0-9a-zа-я]/g, '');
}

function _dokNomerOtTekst(tekst) {
    return String((String(tekst || '').match(/№\s*([^\s,;]+)/) || [])[1] || '');
}

// Един ред на тетрадката.
function _dokRed(kak) {
    return {
        ime: String(kak.ime || '').trim(),
        nomer: String(kak.nomer || '').trim().replace(/^№\s*/, ''),
        data: String(kak.data || '').trim(),
        vid: String(kak.vid || '').trim(),
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
            nomer: (d.nomer || {}).stoynost,
            data: (d.data || {}).stoynost,
            vid: d.vid, kod: d.vid_kod,
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
    return [r.ime, r.nomer && '№ ' + r.nomer, r.data && 'от ' + r.data + ' г.']
        .filter(Boolean).join(', ');
}
