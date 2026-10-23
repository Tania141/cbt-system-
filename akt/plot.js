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

    if (!redove.length) {
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
    <div class="red" onclick="plotOtvoriObekt('${_e(r.id)}',${r.i})" tabindex="0"
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
function plotNovObekt() {
    location.href = '../index.html';
}
