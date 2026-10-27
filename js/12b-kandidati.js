// АКТ СИСТЕМ · 12b-kandidati.js
// Прочетеното, което го няма в чеклиста — трупа се, брои се и чака твоето „да“
//
// Операторът, 20.10.2026: „всеки документ, който четецът прочете и не е част
// от листата, да го добавя към характера на обекта. Така с времето ще имаме
// по-пълна картина.“
//
// Правилото, с което го правим безопасно: НЕ влиза в чеклиста сам. Влиза като
// КАНДИДАТ — с брой, с обектите и със съставките, при които се е появил.
// Видян три пъти, системата пита веднъж. Одобреното става ред, който си личи,
// и заключеният източник остава непокътнат.
//
// Кандидатите живеят на сървъра (`/api/danni/kandidati`), защото картината се
// трупа от всички обекти, не от един браузър.

const _KAND_PRAG = 3;        // от колко появявания започва да пита

let _kandidati = null;       // { ключ: {ime, broy, obekti[], sastavki[], fajlove[], sastoyanie} }
let _kandSobstveni = null;   // одобрените редове

const _kandKlyuch = ime => String(ime || '').trim().toLowerCase()
    .replace(/\s+/g, ' ').replace(/[„“"»«]/g, '');

async function kandZaredi() {
    if (_kandidati && _kandSobstveni) return;
    _kandidati = (await _danniVzemi('kandidati')) || {};
    _kandSobstveni = (await _danniVzemi('cheklist_sobstveni')) || [];
}

function kandSobstveni() {
    return _kandSobstveni || [];
}

// Прочетен документ без ред: запомня се КАКВО е и КЪДЕ се е появил.
// Съставките са важни — те казват за какъв строеж важи, когато един ден стане
// изискване. (Без тях „удостоверение за нанасяне в кадастъра“ би се искало и
// за еднофамилна къща.)
// `nepasnali` е списък от {ime, fajl}: ИМЕТО е видът на документа, както го е
// прочел четецът („Удостоверение за нанасяне в кадастъра“), а не името на
// файла. По файлове броенето не работи — един и същи документ идва като
// „…кадастъра.pdf“, „…кадастъра 2.pdf“ и никога не става трети път.
// (Намерено от пробата, 20.10.2026.)
async function kandZabelezhi(p, nepasnali) {
    if (!Array.isArray(nepasnali) || !nepasnali.length) return 0;
    await kandZaredi();
    const sast = (typeof _kesSastavkiNa === 'function' ? _kesSastavkiNa(p) : []).map(s => s.kod);
    const odobreni = new Set(kandSobstveni().map(x => _kandKlyuch(x.dokument)));
    let novi = 0;
    for (const red of nepasnali) {
        const ime = String((red && red.ime) || red || '').split(' — ')[0].trim();
        const fajl = String((red && red.fajl) || ime || '').trim();
        if (!ime) continue;
        const k = _kandKlyuch(ime);
        if (odobreni.has(k)) continue;
        const e = _kandidati[k] || { ime, broy: 0, obekti: [], sastavki: [], fajlove: [],
                                     sastoyanie: 'chaka' };
        if (e.sastoyanie === 'otkazan') continue;
        if (!e.fajlove.includes(fajl)) { e.fajlove.push(fajl); e.broy++; novi++; }
        if (p.pi && !e.obekti.includes(p.pi)) e.obekti.push(p.pi);
        for (const s of sast) if (!e.sastavki.includes(s)) e.sastavki.push(s);
        e.posledno = new Date().toISOString();
        _kandidati[k] = e;
    }
    if (novi) await _danniZapishi('kandidati', _kandidati);
    return novi;
}

// Само тези, които вече са се появявали достатъчно, за да си струва въпросът.
function kandZaPitane() {
    return Object.entries(_kandidati || {})
        .filter(([, e]) => e.sastoyanie === 'chaka' && e.broy >= _KAND_PRAG)
        .map(([k, e]) => ({ klyuch: k, ...e }))
        .sort((a, b) => b.broy - a.broy);
}

function kandVsichki() {
    return Object.entries(_kandidati || {})
        .filter(([, e]) => e.sastoyanie === 'chaka')
        .map(([k, e]) => ({ klyuch: k, ...e }))
        .sort((a, b) => b.broy - a.broy);
}

function _kandHtml() {
    const esc = _s2esc;
    const chakat = kandVsichki();
    if (!chakat.length && !kandSobstveni().length) return '';
    const pitat = kandZaPitane();
    const imeSast = kod => (typeof _SASTAVKI !== 'undefined'
        ? (_SASTAVKI.find(x => x.kod === kod) || {}).ime || kod : kod);

    return `
        <div class="card" style="margin:16px 0">
            <div class="card-title" style="margin-bottom:4px;font-size:13px">
                \u{1F4CB} Видени, но неописани ${chakat.length ? '· ' + chakat.length : ''}</div>
            <p style="font-size:11.5px;color:var(--muted);margin-bottom:10px">
                Документи, които четецът е срещал, а чеклистът не ги знае. Нищо не влиза
                само — питам те чак когато се повтори ${_KAND_PRAG} пъти.
            </p>
            ${pitat.map(e => `
                <div class="alert alert-warning" style="margin:0 0 8px"><div>
                    <strong>${esc(e.ime)}</strong> — срещан <strong>${e.broy}</strong> пъти
                    ${e.sastavki.length ? `<div style="font-size:11.5px;color:var(--muted)">
                        при строежи с: ${esc(e.sastavki.map(imeSast).join(' · '))}</div>` : ''}
                    <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
                        <button class="btn btn-secondary btn-sm"
                            onclick="kandDobavi('${esc(e.klyuch)}','начало')">изисквай — за да започна</button>
                        <button class="btn btn-secondary btn-sm"
                            onclick="kandDobavi('${esc(e.klyuch)}','подпис')">изисквай — за да подпиша</button>
                        <button class="btn btn-ghost btn-sm"
                            onclick="kandOtkazhi('${esc(e.klyuch)}')">не е за чеклиста</button>
                    </div>
                </div></div>`).join('')}
            ${chakat.length > pitat.length ? `
                <details style="margin-top:4px">
                    <summary style="cursor:pointer;font-size:11.5px;color:var(--muted)">
                        още ${chakat.length - pitat.length} — срещани по-малко от ${_KAND_PRAG} пъти</summary>
                    <div style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.8">
                        ${chakat.filter(e => e.broy < _KAND_PRAG)
                            .map(e => `<div>· ${esc(e.ime)} <span style="font-size:11px">(${e.broy})</span>
                                <button class="btn btn-ghost btn-sm" style="padding:0 6px"
                                    onclick="kandDobavi('${esc(e.klyuch)}','подпис')">изисквай</button></div>`).join('')}
                    </div>
                </details>` : ''}
            ${kandSobstveni().length ? `
                <details style="margin-top:8px">
                    <summary style="cursor:pointer;font-size:11.5px;color:var(--muted)">
                        твои редове в чеклиста · ${kandSobstveni().length}</summary>
                    <div style="font-size:12px;margin-top:6px;line-height:1.9">
                        ${kandSobstveni().map(x => `<div>· <strong>${esc(x.dokument)}</strong>
                            <span style="color:var(--muted)">· ${esc(x.etap)} · ${esc(x.uslovie)}</span>
                            <button class="btn btn-ghost btn-sm" style="padding:0 6px"
                                onclick="kandMahni('${esc(_kandKlyuch(x.dokument))}')">×</button></div>`).join('')}
                    </div>
                </details>` : ''}
        </div>`;
}

// Одобрението: кандидатът става ред в чеклиста. Условието идва от съставките,
// при които е срещан — иначе удостоверение за трафопост би се искало и за
// еднофамилна къща.
async function kandDobavi(klyuch, etap) {
    await kandZaredi();
    const e = _kandidati[klyuch];
    if (!e) return;
    const ime = (prompt('Как да се казва редът в чеклиста?', e.ime) || '').trim();
    if (!ime) return;
    // УСЛОВИЕТО СЕ ПРАВИ ОТ СЪСТАВКИТЕ, ПРИ КОИТО СИ ГО ВИДЯЛА.
    // Операторът, 27.10.2026. Дотук се пишеше „вид = линеен“ — едро и
    // неточно: видяно при шахтов ТП, искано при всеки линеен обект. А самото
    // доказателство (`e.sastavki`) вече се пазеше и се изхвърляше.
    //
    // „или“, не „и“: редът е видян при обекти с различни съставки, а не при
    // един обект с всичките. Иска се поне една от тях.
    //
    // „ако_е_приложимо“ остава винаги: редът излиза за ПРЕЦЕНКА, не като
    // липсващ. Научено не значи задължително.
    const uslovie = [
        (e.sastavki || []).length
            ? (e.sastavki || []).map(k => 'sast_' + k).join(' или ')
            : '',
        'ако_е_приложимо',
    ].filter(Boolean).join(' и ');
    _kandSobstveni = [...kandSobstveni(), {
        dokument: ime, etap: etap === 'начало' ? 'начало' : 'подпис',
        uslovie, dokazva_se: 'номер и дата',
        // Основанието казва ОТКЪДЕ е научен редът: без него правило, тръгнало
        // от едно изключение, иска грешен документ, а никой не вижда защо.
        osnovanie: `добавен от оператора на ${new Date().toLocaleDateString('bg-BG')}`
                   + (e.obekti.length ? ` · срещан при ПИ ${e.obekti.join(', ')}` : '')
                   + ` · ${e.broy} ${e.broy === 1 ? 'път' : 'пъти'}`
                   + ((e.sastavki || []).length
                       ? ` · при строежи със: ${e.sastavki.join(', ')}`
                       : ' · без разпознати съставки'),
        sastavki: e.sastavki,
        // Връзката назад: операторът често преименува реда, а тогава по име
        // кандидатът не се намира и махането на реда го оставя скрит завинаги.
        kandidat: klyuch,
    }];
    e.sastoyanie = 'dobaven';
    await _danniZapishi('cheklist_sobstveni', _kandSobstveni);
    await _danniZapishi('kandidati', _kandidati);
    addHistory('edit', (_zhivObekt() || {}).pi || null, `Чеклист: добавен ред „${ime}“ (${etap})`);
    showAlert('success', `„${ime}“ вече се изисква — ${etap === 'начало'
        ? 'за да започнеш' : 'за да подпишеш'}.`);
    _prerisuvai();
}

async function kandOtkazhi(klyuch) {
    await kandZaredi();
    const e = _kandidati[klyuch];
    if (!e) return;
    e.sastoyanie = 'otkazan';
    await _danniZapishi('kandidati', _kandidati);
    _prerisuvai();
}

async function kandMahni(klyuch) {
    await kandZaredi();
    const red = kandSobstveni().find(x => _kandKlyuch(x.dokument) === klyuch
                                       || x.kandidat === klyuch);
    _kandSobstveni = kandSobstveni().filter(x => x !== red);
    const k = (red && red.kandidat) || klyuch;
    if (_kandidati[k]) _kandidati[k].sastoyanie = 'chaka';
    await _danniZapishi('cheklist_sobstveni', _kandSobstveni);
    await _danniZapishi('kandidati', _kandidati);
    _prerisuvai();
}
