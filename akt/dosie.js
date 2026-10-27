// АКТ СИСТЕМ · новото ПВА · dosie.js
// ЕКРАН 6. ДОСИЕТО — килерът
//
// „Всичко, качено по обекта, на едно място.“ (ЗАДАНИЕ.md)
//
// Списък с файловете: какво е, номер, дата, кой ред доказва, сверено ли е.
// Търсене по име. Клик отваря прочетеното с цитатите.
//
// Тук се виждат и „видени, но неописани“ — документите, които чеклистът не
// знае, с брояча. Оттам се одобряват като нови редове.
//
// ТОЗИ ЕКРАН НЕ ВЪВЕЖДА. Само показва и поправя. Четенето е на момента и на
// проекта; тук се гледа какво е влязло.
//
// Сверяването („всички факти потвърдени ли са“) е на кухнята —
// `js/04-vhodni-dokumenti.js`. Тук не се смята.

'use strict';

let dosieId = null;
let dosieIndeks = 0;
let dosieTarseno = '';
let dosieOtvoren = '';     // кой документ е разгънат
let dosieKandidati = null; // прочетени от сървъра веднъж

function dosieOtvori(id, i) {
    dosieId = id;
    dosieIndeks = Number(i || 0);
    dosieTarseno = '';
    dosieOtvoren = '';
    const p = aktObekt(id);
    if (!p) {
        document.getElementById('dosie-telo').innerHTML =
            '<div class="pusto"><div class="pusto-ime">Този обект го няма</div></div>';
        return;
    }
    aktZapomniObekt(p, dosieIndeks);
    dosieRisuvai();
    dosieZarediKandidati();
}

function dosieZhiv() {
    const p = aktObekt(dosieId);
    if (!p) return null;
    const st = aktStroezh(p, dosieIndeks);
    return { p, st, s2: (st.sloy2 || {}).od || {} };
}

function dosieRisuvai() {
    const z = dosieZhiv();
    if (!z) return;
    document.getElementById('dosie-telo').innerHTML =
        dosieTarseneHtml(z)
        + dosieSpisakHtml(z)
        + dosieKandidatiHtml();
}

// ── Търсенето ────────────────────────────────────────────────────────────────

function dosieTarseneHtml(z) {
    const vsichki = z.s2.dokumenti || [];
    return `
    <div class="redica">
        <input type="text" class="tarsene" id="dosie-tarsene" value="${_e(dosieTarseno)}"
               placeholder="Търси по име на файл, вид или номер…"
               oninput="dosieTarsi(this.value)">
        <span class="brojach">${vsichki.length} ${vsichki.length === 1 ? 'документ' : 'документа'}</span>
    </div>`;
}

function dosieTarsi(tekst) {
    dosieTarseno = tekst;
    dosieRisuvai();
    const vhod = document.getElementById('dosie-tarsene');
    if (vhod) { vhod.focus(); vhod.setSelectionRange(vhod.value.length, vhod.value.length); }
}

function dosieNamereni(z) {
    const t = String(dosieTarseno || '').trim().toLowerCase();
    const vsichki = z.s2.dokumenti || [];
    if (!t) return vsichki;
    return vsichki.filter(d => [d.fajl, d.vid, d.cheklist_red,
                                (d.nomer || {}).stoynost, (d.data || {}).stoynost]
        .some(x => String(x || '').toLowerCase().includes(t)));
}

// ── Списъкът ─────────────────────────────────────────────────────────────────

function dosieSpisakHtml(z) {
    const redove = dosieNamereni(z);
    if (!(z.s2.dokumenti || []).length) {
        return `<div class="kutiya-razdel">
            <div class="nadpis">Прочетени документи</div>
            <p>Още няма. Документите влизат тук, когато ги прочетеш на момента
               или на проекта.</p></div>`;
    }
    if (!redove.length) {
        return `<div class="kutiya-razdel">
            <div class="nadpis">Прочетени документи</div>
            <p>Нищо не отговаря на търсенето.</p></div>`;
    }
    const potv = z.s2.potvardeni || {};
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Прочетени документи · ${redove.length}</div>
        <p class="poyasnenie">Файловете не се пазят — пазят се прочетените факти, с цитат
           и страница. Клик отваря какво е разбрал четецът.</p>
        ${redove.map(d => dosieRedHtml(d, potv)).join('')}
    </div>`;
}

function dosieRedHtml(d, potv) {
    const id = _s2Id(d);
    const fakti = _s2Fakti(d);
    const sveren = _s2Sveren(d, potv);
    const broj = fakti.filter(x => potv[`${id}::${x.k}`]).length;
    const otvoren = dosieOtvoren === id;
    return `
    <div class="dok ${sveren ? 'dok-sveren' : ''}">
        <div class="dok-glava" onclick="dosieRazgani('${encodeURIComponent(id)}')"
             tabindex="0" onkeydown="if(event.key==='Enter')dosieRazgani('${encodeURIComponent(id)}')">
            <span class="dok-znak">${sveren ? '✓' : fakti.length ? '…' : '—'}</span>
            <span class="dok-vid">${_e(d.vid || 'документ')}</span>
            <span class="dok-nomer">${_e((d.nomer || {}).stoynost || '')}${
                (d.data || {}).stoynost ? ' · ' + _e(d.data.stoynost) : ''}</span>
            <span class="dok-sverka">${fakti.length
                ? `сверени ${broj} от ${fakti.length}` : 'няма извадени факти'}</span>
        </div>
        <div class="otkade">
            ${_e(d.fajl || '')}${d.sken ? ' · скан' : ''}${d.chetec ? ' · ' + _e(d.chetec) : ''}
            ${d.cheklist_red
                ? ` · доказва: <strong>${_e(d.cheklist_red)}</strong>`
                : ' · <span class="dok-bez-red">няма ред в чеклиста</span>'}
        </div>
        ${otvoren ? dosieFaktiHtml(id, fakti, potv) : ''}
    </div>`;
}

function dosieRazgani(id64) {
    const id = decodeURIComponent(id64);
    dosieOtvoren = dosieOtvoren === id ? '' : id;
    dosieRisuvai();
}

// Прочетеното, с цитатите. Всяка стойност казва откъде е — правило 3.
function dosieFaktiHtml(id, fakti, potv) {
    if (!fakti.length) return '<div class="otkade">Четецът не е извадил нищо от този файл.</div>';
    return `
    <div class="dok-fakti">
        ${fakti.map(x => `
            <div class="fakt">
                <span class="fakt-etiket">${_e(x.etiket)}</span>
                <span class="fakt-stoynost">${_e(x.obj.stoynost)}</span>
                <span class="fakt-znak">${potv[`${id}::${x.k}`] ? '✓ сверено' : 'чака ✔'}</span>
                ${x.obj.citat ? `<div class="fakt-citat">„${_e(x.obj.citat)}“${
                    x.obj.stranica ? ' · стр. ' + _e(x.obj.stranica) : ''}</div>` : ''}
            </div>`).join('')}
        <div class="otkade">Сверява се там, където се чете — тук само се гледа.</div>
    </div>`;
}

// ── Видени, но неописани ─────────────────────────────────────────────────────
// Документи, които четецът е срещал, а чеклистът не ги знае. Нищо не влиза
// само: питат се, чак когато се повторят достатъчно пъти.

async function dosieZarediKandidati() {
    if (dosieKandidati) return;
    try {
        await kandZaredi();
        dosieKandidati = kandVsichki();
    } catch (e) {
        dosieKandidati = [];
    }
    dosieRisuvai();
}

function dosieKandidatiHtml() {
    const spisak = dosieKandidati;
    if (!spisak || !spisak.length) return '';
    const pitat = typeof kandZaPitane === 'function' ? kandZaPitane() : [];
    const imeSast = kod => (typeof _SASTAVKI !== 'undefined'
        ? (_SASTAVKI.find(x => x.kod === kod) || {}).ime || kod : kod);
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Видени, но неописани · ${spisak.length}</div>
        <p class="poyasnenie">Документи, които четецът е срещал, а чеклистът не ги знае.
           Нищо не влиза само — питам те чак когато се повтори достатъчно пъти.</p>
        ${spisak.map(e => {
            const pita = pitat.some(x => x.klyuch === e.klyuch);
            return `
            <div class="kandidat ${pita ? 'kandidat-pita' : ''}">
                <div class="kandidat-ime">${_e(e.ime)}
                    <span class="otkade">срещан ${e.broy} ${e.broy === 1 ? 'път' : 'пъти'}</span></div>
                ${(e.sastavki || []).length ? `<div class="otkade">при строежи с: ${
                    _e((e.sastavki || []).map(imeSast).join(' · '))}</div>` : ''}
                ${pita ? `
                    <div class="kandidat-zhestove">
                        <button class="bt" onclick="dosieIzisquay('${_e(e.klyuch)}','начало')">
                            изисквай — за да започна</button>
                        <button class="bt" onclick="dosieIzisquay('${_e(e.klyuch)}','подпис')">
                            изисквай — за да подпиша</button>
                        <button class="bt bt-tih" onclick="dosieNeEZaCheklista('${_e(e.klyuch)}')">
                            не е за чеклиста</button>
                    </div>` : ''}
            </div>`;
        }).join('')}
    </div>`;
}

async function dosieIzisquay(klyuch, etap) {
    if (typeof kandDobavi !== 'function') return;
    await kandDobavi(klyuch, etap);
    dosieKandidati = kandVsichki();
    dosieRisuvai();
}

async function dosieNeEZaCheklista(klyuch) {
    if (typeof kandOtkazhi !== 'function') return;
    await kandOtkazhi(klyuch);
    dosieKandidati = kandVsichki();
    dosieRisuvai();
}
