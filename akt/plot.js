// АКТ СИСТЕМ · новото ПВА · plot.js
// ЕКРАН 1. ПЛОТЪТ — всички обекти
//
// „Списък на обектите. Един ред = един обект… Горе: търсене и „+ нов обект“.
// Нищо друго. Без таблици с колони, без филтри, които не ползваш.“
// (ЗАДАНИЕ.md, 20.10.2026)
//
// Един ред е един СТРОЕЖ, защото работата е по строеж. Показват се само
// работещите; архивът е отделен изглед и се връща с клик.

'use strict';

let aktIzgled = 'raboti';      // 'raboti' | 'arhiv'
let aktTarseno = '';
let plotPosochen = null;       // кой ред показва дясната колона: `id/строеж`

function plotRisuvai() {
    const kutiya = document.getElementById('plot-spisak');
    if (!kutiya) return;
    const vsichki = aktRedove(aktDanni, aktIzgled);
    const redove = aktTarsi(vsichki, aktTarseno);

    const brojach = document.getElementById('plot-brojach');
    if (brojach) {
        brojach.textContent = aktIzgled === 'arhiv'
            ? `${vsichki.length} в архива`
            : `${vsichki.length} в работа`;
    }

    plotLyava();

    if (!redove.length) {
        plotDyasno(null);
        kutiya.innerHTML = `
            <div class="pusto">
                <div class="pusto-ime">${aktTarseno
                    ? 'Нищо не отговаря на търсенето'
                    : aktIzgled === 'arhiv' ? 'Архивът е празен' : 'Няма обекти в работа'}</div>
                ${aktTarseno ? '' : aktIzgled === 'arhiv' ? '' : `
                    <button class="bt bt-glaven" onclick="plotNovObekt()">+ нов обект</button>`}
            </div>`;
        return;
    }

    kutiya.innerHTML = redove.map(r => plotRedHtml(r)).join('');
    // Дясната колона показва посочения ред; докато не е посочен — първия.
    const izbran = redove.find(r => `${r.id}/${r.i}` === plotPosochen) || redove[0];
    plotPosochi(izbran.id, izbran.i);
}

function plotRedHtml(r) {
    const ch = r.chisla;
    // Числото се отваря и показва кое липсва — затова е бутон, не текст.
    const vezna = (ime, post, koe) => `
        <button type="button" class="chislo chislo-${post === null ? 'nyama' : post === 100 ? 'pylno' : 'chastichno'}"
                onclick="event.stopPropagation();plotOtvoriChislo('${_e(r.id)}',${r.i},'${koe}')"
                title="Клик — кои са и кои ги няма">
            <span class="chislo-ime">${ime}</span>
            <span class="chislo-post">${post === null ? '—' : post + ' %'}</span>
        </button>`;

    return `
    <div class="red" data-red="${_e(r.id)}/${r.i}" onclick="plotOtvoriObekt('${_e(r.id)}',${r.i})" tabindex="0"
         onmouseenter="plotPosochi('${_e(r.id)}',${r.i})" onfocus="plotPosochi('${_e(r.id)}',${r.i})"
         onkeydown="if(event.key==='Enter')plotOtvoriObekt('${_e(r.id)}',${r.i})">
        <div class="red-ime">
            <div class="red-stroezh">${_e(r.ime)}</div>
            <div class="red-pi">${_e(r.pi || '—')}${r.nik ? ' · ' + _e(r.nik) : ''}${
                r.otKolko > 1 ? ` · строеж ${r.i + 1} от ${r.otKolko}` : ''}</div>
        </div>
        <div class="red-moment">
            ${r.moment
                ? `<span class="na-ognya">${_e(r.moment)}</span>`
                : '<span class="ne-e-pochnalo">още не е почнало</span>'}
        </div>
        <div class="red-chisla">
            ${vezna('да започна', ch ? ch.nachalo : null, 'nachalo')}
            ${vezna('да подпиша', ch ? ch.podpis : null, 'podpis')}
        </div>
        <div class="red-koga" title="${_e(r.posledno || '')}">${_e(aktData(r.posledno)) || '—'}</div>
    </div>`;
}

// ── Трите колони ─────────────────────────────────────────────────────────────
// Лявата е фирмата и стои на всеки екран; дясната е обектът. Рамката само
// казва кой екран е отворен — видът (свита, скрита) е в stil.css.

const RAMKA_PLOCHKA = { zk: 'knigi', konsultanti: 'konsult', normativna: 'normi', istoria: 'istoria', danni: 'kopie' };

function aktRamka(ekran) {
    const ramka = document.getElementById('ramka');
    if (!ramka) return;
    ramka.dataset.ekran = ekran;
    const aktivna = RAMKA_PLOCHKA[ekran] || 'obekti';
    for (const a of document.querySelectorAll('#lyava [data-plochka]'))
        a.classList.toggle('aktivna', a.dataset.plochka === aktivna);
}

// Плочките казват нещо за себе си — само онова, което системата наистина
// знае. Числото на свитата плочка е същото като текста на разгънатата.
function plotLyava() {
    const pishi = (id, tekst, znachka) => {
        const el = document.getElementById(id);
        if (el) el.textContent = tekst;
        const z = document.getElementById(id + '-z');
        if (z) { z.textContent = znachka; z.hidden = !znachka; }
    };
    const raboti = aktRedove(aktDanni, 'raboti').length;
    const arhiv = aktRedove(aktDanni, 'arhiv').length;
    pishi('lyava-obekti', `${raboti} в работа${arhiv ? ` · ${arhiv} в архива` : ''}`, String(raboti));
    // Регистърът на книгите живее на сървъра; плочката не го пита само за да
    // покаже число — казва какво има вътре.
    pishi('lyava-knigi', 'номерата по ред, с анулиране', '');
    const ko = (aktDanni.consultants || []).length;
    pishi('lyava-konsult', ko ? `${ko} ${ko === 1 ? 'фирма' : 'фирми'}` : 'няма добавени', ko ? String(ko) : '');
}

// Дясната колона: основните данни на обекта, с „откъде е“. Не се поправя тук.
function plotPosochi(id, i) {
    plotPosochen = `${id}/${i}`;
    for (const el of document.querySelectorAll('#plot-spisak .red'))
        el.classList.toggle('posochen', el.dataset.red === plotPosochen);
    const p = aktObekt(id);
    plotDyasno(p ? { p, st: aktStroezh(p, i), i } : null);
}

function plotDyasno(o) {
    const kutiya = document.getElementById('dyasna');
    if (!kutiya) return;
    if (!o) { kutiya.innerHTML = ''; return; }
    kutiya.innerHTML = aktDyasnoHtml(o.p, o.st, o.i) + `
        <div class="d-dolu"><a class="d-vrazka" href="#/obekt/${encodeURIComponent(o.p.id)}/${o.i}">Отвори обекта →</a></div>`;
}

function aktDyasnoHtml(p, st, i) {
    st = st || {};
    const rs = st.permit || p.permit || {};
    // През ВРАТАТА (18.11.2026) — възложителите от регистъра, строителят и
    // консултантът с верните ключове; „откъде“ е това, което вратата казва.
    const d = k => (typeof aktStoynost === 'function' ? aktStoynost(p, st, k) : { stoynost: '', otkade: '' });
    const reg = d('sobstvenik');
    const rachni = (p.clients && p.clients.length ? p.clients : [p.client].filter(Boolean))
        .map(c => c && c.name).filter(Boolean);
    const vazl = reg.stoynost ? [reg.stoynost] : rachni;
    const stroitel = d('stroitel').stoynost;
    const red = (e, s, ot) => s ? `
        <div class="dan"><div class="dan-e">${e}</div><div class="dan-s">${_e(s)}</div><div class="dan-o">${ot}</div></div>` : `
        <div class="dan"><div class="dan-e">${e}</div><div class="dan-s dan-nyama">не е вписано</div></div>`;
    return `
        <div class="d-glava">
            <div class="d-etiket">Обектът</div>
            <div class="d-ime">${_e(aktImeStroezh(st, i))}</div>
            <div class="d-pi">${p.pi ? 'ПИ ' + _e(p.pi) : 'ПИ —'}</div>
        </div>
        <div class="d-danni">
            ${red('Категория', st.kategoria ? st.kategoria + ' категория' : '', 'паспорт')}
            ${red('Възложители', vazl.join(', '), String(reg.otkade || 'паспорт').toLowerCase())}
            ${red('Разрешение за строеж', rs.number && rs.date ? `№ ${rs.number} от ${aktData(rs.date)}` : d('rs').stoynost,
                  rs.number && rs.date ? 'паспорт' : String(d('rs').otkade || '').toLowerCase())}
            ${red('Строител', stroitel, String(d('stroitel').otkade || 'паспорт').toLowerCase())}
            ${red('Консултант', d('konsultant').stoynost, 'паспорт')}
        </div>`;
}

// ── Жестовете ────────────────────────────────────────────────────────────────

function plotTarsi(tekst) {
    aktTarseno = tekst;
    plotRisuvai();
}

function plotSmeniIzgled(izgled) {
    aktIzgled = izgled;
    for (const b of document.querySelectorAll('[data-izgled]'))
        b.classList.toggle('izbran', b.dataset.izgled === izgled);
    plotRisuvai();
}

function plotOtvoriObekt(id, i) {
    const p = aktObekt(id);
    if (!p) return;
    aktZapomniObekt(p, i);
    location.hash = `#/obekt/${encodeURIComponent(id)}/${i}`;
}

// Клик върху число → огледалото, точно в онази част, която обяснява числото.
// Дотогава показва кое липсва там, където стои. (Правило 2)
function plotOtvoriChislo(id, i, koe) {
    const p = aktObekt(id);
    if (!p) return;
    aktZapomniObekt(p, i);
    location.hash = `#/obekt/${encodeURIComponent(id)}/${i}?chislo=${koe}`;
}

// Новият обект се завежда на старото място: формулярът на паспорта, признаците
// и проверките му са кухня и не се кърпят. Повърхността само отпраща там.
// Дотук новият обект се завеждаше само в старото ПВА — бутонът просто те
// изпращаше там. От 04.11.2026 паспортът е тук. (`nov` вместо номер на обект.)
function plotNovObekt() {
    location.hash = '#/pasport/nov/0';
}
