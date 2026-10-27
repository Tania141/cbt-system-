// АКТ СИСТЕМ · новото ПВА · obekt.js
// ЕКРАН 2. ОБЕКТЪТ — кухненската маса
//
// „Една страница за целия обект. Оттук се тръгва навсякъде.“ (ЗАДАНИЕ.md)
//
// Четири неща, отгоре надолу:
//   1. главата — три реда текст, не формуляр; клик отваря за поправка;
//   2. съставките — кръгчета с „откъде е“, × и +;
//   3. лентата на моментите — на СТРОЕЖА, с превключвател при няколко строежа;
//   4. долу три връзки: Проектът · Собствеността · Досието.
//
// Собственост и Акт 16 висят на ИМОТА, не на строежа — затова връзката за
// собственост не носи номер на строеж.

'use strict';

let obektId = null;
let obektIndeks = 0;
let obektGrupi = null;          // последното, което сървърът каза
let obektPodchertano = '';      // кое число е довело тук: '' | 'nachalo' | 'podpis'

function obektOtvori(id, i, podchertano) {
    obektId = id;
    obektIndeks = Number(i || 0);
    obektPodchertano = podchertano || '';
    obektGrupi = null;
    const p = aktObekt(id);
    if (!p) {
        document.getElementById('obekt-telo').innerHTML =
            '<div class="pusto"><div class="pusto-ime">Този обект го няма</div></div>';
        return;
    }
    // Пази и кой е „на масата“ — трите връзки долу водят към старото ПВА и то
    // чете точно това, за да знае по кой обект се работи.
    aktZapomniObekt(p, obektIndeks);
    obektRisuvai();
    obektZaredilenta();
}

function obektZhiv() {
    const p = aktObekt(obektId);
    return p ? { p, st: aktStroezh(p, obektIndeks) } : null;
}

function obektRisuvai() {
    const z = obektZhiv();
    if (!z) return;
    document.getElementById('obekt-telo').innerHTML =
        obektGlavaHtml(z.p, z.st)
        + obektSastavkiHtml(z.p, z.st)
        + obektStroezhiHtml(z.p)
        + '<div id="obekt-lenta">' + obektLentaHtml() + '</div>'
        + obektVrazkiHtml(z.p);
}

// ── 1. Главата: три реда текст ───────────────────────────────────────────────

function obektGlavaHtml(p, st) {
    const redove = aktGlavaRedove(p, st);
    return `
    <div class="glava">
        ${redove.map((r, i) => `
            <div class="glava-red" onclick="obektPopravi(${i})" tabindex="0"
                 onkeydown="if(event.key==='Enter')obektPopravi(${i})"
                 title="Клик — поправи">
                <span class="glava-tekst">${_e(r.tekst) || '<span class="prazno">[___]</span>'}</span>
                ${r.otkade ? `<span class="otkade">${_e(r.otkade)}</span>` : ''}
            </div>`).join('')}
        ${aktVremeZaArhiv(st) ? `
            <div class="podsetka">
                Моментът е „${_e(st.tekusht_moment)}“ — обектът може да слезе в архива.
                Връща се с клик.
                <button class="bt bt-tih" onclick="obektArhiviraj()">в архива</button>
            </div>` : ''}
    </div>`;
}

// Поправката е на място: едно поле, едно ✔. Без отделен екран „паспорт“.
function obektPopravi(i) {
    const z = obektZhiv();
    if (!z) return;
    const red = aktGlavaRedove(z.p, z.st)[i];
    if (!red) return;
    for (const pole of red.polya) {
        const sega = obektStoynost(z, pole);
        const nov = prompt(pole.ime + ':', sega == null ? '' : String(sega));
        if (nov === null) continue;
        aktPopravi(obektId, pole.kade, pole.pole, nov.trim());
    }
    obektRisuvai();
}

function obektStoynost(z, pole) {
    let v = pole.kade === 'imot' ? z.p : z.st;
    for (const c of String(pole.pole).split('.')) v = v && v[c];
    return v;
}

// ── 2. Съставките ────────────────────────────────────────────────────────────
// „От тях зависи всичко останало.“ Четат се от кухнята — заглавието, записките
// и потвърдените признаци — и всяка помни ОТКЪДЕ е. Тук само се показват, маха
// се с × и се добавя с +.

function obektSastavkiHtml(p, st) {
    const sast = aktSastavki(p, st);
    return `
    <div class="sastavki">
        <div class="nadpis">От какво е строежът</div>
        <div class="krugcheta">
            ${sast.map(s => `
                <span class="krugche" title="откъде: ${_e(s.ot)}">
                    ${_e(s.ime)}
                    <span class="krugche-ot">${_e(s.ot)}</span>
                    <button type="button" class="krugche-h" title="не е част от този строеж"
                            onclick="obektMahniSastavka('${_e(s.kod)}')">×</button>
                </span>`).join('')
            || '<span class="prazno">нищо прочетено — съставките се добавят с +</span>'}
            <button type="button" class="krugche krugche-plyus" onclick="obektDobaviSastavka()">+</button>
        </div>
    </div>`;
}

function obektMahniSastavka(kod) {
    const z = obektZhiv();
    if (!z) return;
    const r = (z.st.sastavki = z.st.sastavki || {});
    r.mahnati = [...new Set([...(r.mahnati || []), kod])];
    r.dobaveni = (r.dobaveni || []).filter(x => (x.kod || x) !== kod);
    aktZapishi();
    obektRisuvai();
    obektZaredilenta();
}

function obektDobaviSastavka() {
    const z = obektZhiv();
    if (!z) return;
    const ime = prompt('Коя съставка да се добави?\n\nнапр. „шахтов трафопост“, „асансьорна уредба“');
    if (!ime || !ime.trim()) return;
    const kod = ime.trim().toLowerCase().replace(/\s+/g, '_');
    const r = (z.st.sastavki = z.st.sastavki || {});
    r.mahnati = (r.mahnati || []).filter(x => x !== kod);
    r.dobaveni = [...(r.dobaveni || []), { kod, ime: ime.trim(), ot: 'вписана на ръка' }];
    aktZapishi();
    obektRisuvai();
    obektZaredilenta();
}

// ── 3. Строежите в имота ─────────────────────────────────────────────────────

function obektStroezhiHtml(p) {
    const spisak = aktStroezhi(p);
    if (spisak.length === 1) return '';
    return `
    <div class="prevkl">
        <span class="nadpis">Строежи в имота · ${spisak.length}</span>
        ${spisak.map((s, i) => `
            <button type="button" class="bt ${i === obektIndeks ? 'bt-glaven' : 'bt-tih'}"
                    onclick="obektSmeniStroezh(${i})">${_e(aktImeStroezh(s, i))}</button>`).join('')}
    </div>`;
}

function obektSmeniStroezh(i) {
    location.hash = `#/obekt/${encodeURIComponent(obektId)}/${i}`;
}

// ── 4. Лентата на моментите ──────────────────────────────────────────────────
// Всеки момент е плочка с двете числа и цвят. Минали моменти се сгъват.

async function obektZaredilenta() {
    const z = obektZhiv();
    if (!z) return;
    const kutiya = document.getElementById('obekt-lenta');
    if (kutiya) kutiya.innerHTML = '<div class="chaka">Питам чеклиста…</div>';
    try {
        const r = await aktNadzor(z.p, z.st);
        if (r.greshka) throw new Error(r.greshka);
        obektGrupi = r.grupi || [];
        aktZapomniChisla(z.p, z.st, obektGrupi);
    } catch (e) {
        obektGrupi = { greshka: e.message };
    }
    const k = document.getElementById('obekt-lenta');
    if (k) k.innerHTML = obektLentaHtml();
}

function obektLentaHtml() {
    const z = obektZhiv();
    if (!z) return '';
    if (!obektGrupi) return '<div class="chaka">Питам чеклиста…</div>';
    if (obektGrupi.greshka)
        return `<div class="greshka">Чеклистът не отговори: ${_e(obektGrupi.greshka)}.
                Числата по-горе са от последното броене.</div>`;

    const tekusht = z.st.tekusht_moment || '';
    const i = obektGrupi.findIndex(g => g.moment === tekusht);
    const minali = i > 0 ? obektGrupi.slice(0, i) : [];
    const napred = i >= 0 ? obektGrupi.slice(i) : obektGrupi;

    return `
    <div class="lenta">
        ${minali.length ? `
            <details class="minali">
                <summary>${minali.length} минали моменти</summary>
                <div class="plochki">${minali.map(g => obektPlochkaHtml(g, z.st, false)).join('')}</div>
            </details>` : ''}
        <div class="plochki">
            ${napred.map(g => obektPlochkaHtml(g, z.st, g.moment === tekusht)).join('')}
        </div>
    </div>`;
}

function obektPlochkaHtml(g, st, tekusht) {
    const dve = aktDveChisla(g, st.neotnasya);
    const cvyat = aktCvyat(dve, tekusht);
    const vezna = (ime, v, koe) => `
        <button type="button" class="chislo chislo-${v === null ? 'nyama' : v.post === 100 ? 'pylno' : 'chastichno'}
                     ${obektPodchertano === koe && tekusht ? 'chislo-podchertano' : ''}"
                onclick="event.stopPropagation();obektKoeLipsva('${_e(g.moment)}','${koe}')">
            <span class="chislo-ime">${ime}</span>
            <span class="chislo-post">${aktProcent(v)}</span>
        </button>`;
    return `
    <div class="plochka plochka-${cvyat} ${tekusht ? 'plochka-tekushta' : ''}"
         onclick="obektKamMoment('${_e(g.moment)}')" tabindex="0"
         onkeydown="if(event.key==='Enter')obektKamMoment('${_e(g.moment)}')">
        <div class="plochka-ime">${_e(g.moment)}</div>
        <div class="plochka-chisla">
            ${vezna('да започна', dve.nachalo, 'nachalo')}
            ${vezna('да подпиша', dve.podpis, 'podpis')}
        </div>
    </div>`;
}

// Правило 2: всяко число се отваря и показва кои са и кои ги няма.
function obektKoeLipsva(moment, koe) {
    const z = obektZhiv();
    if (!z || !Array.isArray(obektGrupi)) return;
    const g = obektGrupi.find(x => x.moment === moment);
    if (!g) return;
    const dve = aktDveChisla(g, z.st.neotnasya);
    const v = koe === 'nachalo' ? dve.nachalo : dve.podpis;
    const telo = document.getElementById('obekt-kutiya-telo');
    document.getElementById('obekt-kutiya').classList.add('otvorena');
    if (!v) {
        telo.innerHTML = `<h2>${_e(moment)} · за да започна</h2>
            <p class="prazno">Чеклистът не казва кои редове са за началото —
            затова числото е тире, а не измислена стойност.</p>`;
        return;
    }
    telo.innerHTML = `
        <h2>${_e(moment)} · ${koe === 'nachalo' ? 'за да започна' : 'за да подпиша'}</h2>
        <p class="kutiya-chislo">${v.post} % — имам ${v.imam} от ${v.ot}</p>
        ${v.lipsvat.length ? `
            <div class="nadpis">Липсват</div>
            <ul class="lipsvat">${v.lipsvat.map(d => `<li>${_e(d)}
                <button class="bt bt-tih" onclick="obektNeSeOtnasya('${_e(d)}')"
                        title="Казваш веднъж и редът пада — процентът се вдига">не се отнася</button>
            </li>`).join('')}</ul>` : '<p>Всичко е налице.</p>'}
        ${(z.st.neotnasya || []).length ? `
            <details class="minali"><summary>не се отнасят · ${(z.st.neotnasya || []).length}</summary>
            <ul class="lipsvat">${(z.st.neotnasya || []).map(d =>
                `<li>${_e(d)} <button class="bt bt-tih"
                    onclick="obektPakSeOtnasya('${_e(d)}')">върни</button></li>`).join('')}</ul>
            </details>` : ''}`;
}

function obektZatvoriKutiya() {
    document.getElementById('obekt-kutiya').classList.remove('otvorena');
}

// Правило 4: „не се отнася“ е равноправен отговор и ВДИГА процента.
function obektNeSeOtnasya(dokument) {
    const z = obektZhiv();
    if (!z) return;
    z.st.neotnasya = [...new Set([...(z.st.neotnasya || []), dokument])];
    aktZapishi();
    obektZatvoriKutiya();
    obektZaredilenta();
}

function obektPakSeOtnasya(dokument) {
    const z = obektZhiv();
    if (!z) return;
    z.st.neotnasya = (z.st.neotnasya || []).filter(x => x !== dokument);
    aktZapishi();
    obektZatvoriKutiya();
    obektZaredilenta();
}

// Клик на момент → Екран 3. Самият клик НЕ мести „докъде си стигнала“:
// може да се надникне в бъдещ момент, без да се обявява, че е почнал.
function obektKamMoment(moment) {
    location.hash = `#/moment/${encodeURIComponent(obektId)}/${obektIndeks}/${encodeURIComponent(moment)}`;
}

function obektArhiviraj() {
    const z = obektZhiv();
    if (!z) return;
    z.st.arhiviran = true;
    aktZapishi();
    location.hash = '#/plot';
}

// ── 5. Трите връзки ──────────────────────────────────────────────────────────

// Екрани 4, 5 и 6 още не са писани, затова трите връзки водят към старото ПВА.
// Две неща ги правят поносими, докато ги няма:
//   · обектът се носи — `aktZapomniObekt` вече е записал кой е на масата;
//   · отварят се в НОВ подпрозорец, за да не губиш този екран; връщаш се със
//     затваряне, вместо да търсиш пътя назад.
// И го пише честно, вместо да се прави, че са част от новото.
function obektVrazkiHtml(p) {
    // Собственост и Акт 16 са на ИМОТА — затова „Собствеността“ не носи строеж.
    const vrazka = (ime, pod) => `
        <a class="vrazka" href="../index.html" target="_blank" rel="noopener">
            ${_e(ime)}<span>${_e(pod)} · в старото ПВА ↗</span></a>`;
    // Проектът вече е тук, в новото — затова не отпраща навън.
    const proekt = `
        <a class="vrazka" href="#/proekt/${encodeURIComponent(obektId)}/${obektIndeks}">
            Проектът<span>записките и текстовете</span></a>`;
    // Собствеността е на ИМОТА — затова връзката ѝ не носи номер на строеж.
    const sobstvenost = `
        <a class="vrazka" href="#/sobstvenost/${encodeURIComponent(obektId)}/${obektIndeks}">
            Собственост<span>на имота ${_e(p.pi || '')}</span></a>`;
    return `
    <div class="vrazki">
        ${proekt}
        ${sobstvenost}
        ${vrazka('Досието', 'всичко качено')}
    </div>`;
}
