// АКТ СИСТЕМ · новото ПВА · obekt.js
// ЕКРАН 2. ОБЕКТЪТ — кухненската маса
//
// „Една страница за целия обект. Оттук се тръгва навсякъде.“ (ЗАДАНИЕ.md)
//
// В три колони (кройката от 17–18.11.2026):
//   горе — лентата с изворите: Паспортът · Проектът · Собственост · Досието,
//          всеки казва състоянието си;
//   среда — съставките и моментите (на СТРОЕЖА, с превключвател);
//   дясно — данните на обекта, само показани, и „Какво знаем · всичко“.
// Главата с поправка на място отпадна: дясното само показва, поправя се на
// едно място — в паспорта или досието (операторът, 17.11.2026).
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
        aktIzvoriHtml(z.p, z.st, obektIndeks, 'sastoyanie')
        + '<div class="obekt-rabota">'
        + obektArhivHtml(z.st)
        + obektSastavkiHtml(z.p, z.st)
        + obektStroezhiHtml(z.p)
        + '<div class="nadpis">Моментите</div>'
        + '<div id="obekt-lenta">' + obektLentaHtml() + '</div>'
        + obektOshteHtml()
        + '</div>';
    const d = document.getElementById('dyasna');
    if (d) d.innerHTML = aktDyasnoHtml(z.p, z.st, obektIndeks) + `
        <div class="d-dolu"><a class="d-vrazka" href="#/znaem/${encodeURIComponent(obektId)}/${obektIndeks}">Какво знаем · всичко →</a></div>`;
}

// ── Изворите: лента горе ─────────────────────────────────────────────────────
// В Обекта всеки извор казва състоянието си — само онова, което системата
// наистина е преброила; в Момента същата лента е само връзки (състоянието там
// е в „Липсва ми“). Числото идва от мястото, където фактът живее.

function aktIzvoriHtml(p, st, i, rezhim) {
    const id = encodeURIComponent(p.id);
    const izv = [
        { kl: 'pasport', ime: 'Паспортът', href: `#/pasport/${id}/${i}`, ...aktIzvorPasport(p, st) },
        { kl: 'proekt', ime: 'Проектът', href: `#/proekt/${id}/${i}`, ...aktIzvorProekt(st) },
        // Собствеността е на ИМОТА; строежът в адреса е само за обратния път.
        { kl: 'sobst', ime: 'Собственост', href: `#/sobstvenost/${id}/${i}`, ...aktIzvorSobstvenost(p) },
        { kl: 'dosie', ime: 'Досието', href: `#/dosie/${id}/${i}`, ...aktIzvorDosie(st) },
    ];
    return `
    <nav class="izvori izvori-${rezhim}">
        ${rezhim === 'vrazki' ? '<span class="izvori-etiket">Извори</span>' : ''}
        ${izv.map(x => `
            <a class="izvor izvor-${x.cvyat}" data-izvor="${x.kl}" href="${x.href}"${x.zashto ? ` title="${_e(x.zashto)}"` : ''}>
                <span class="izvor-t">${x.ime}</span>
                ${rezhim === 'vrazki' ? '' : `<span class="izvor-s">${_e(x.sastoyanie)}</span>`}
            </a>`).join('')}
    </nav>`;
}

// Паспортът: седемте основни полета — същите, които показва дясната колона.
function aktIzvorPasport(p, st) {
    st = st || {};
    // През ВРАТАТА (`aktStoynost`, 18.11.2026): възложителите от регистъра,
    // строителят като `builder.company`, консултантът по номера си. Дотук
    // трите се търсеха с грешни ключове и паспортът „светеше“ 3 непопълнени
    // полета, а всичко беше вписано (операторът, Митко Ситекс).
    const s = k => (typeof aktStoynost === 'function' ? aktStoynost(p, st, k).stoynost : '');
    const vazl = s('sobstvenik') || (p.clients && p.clients.length) || (p.client && p.client.name);
    const polya = [p.pi, st.stroej, st.kategoria, vazl, s('rs'), s('stroitel'), s('konsultant')];
    const nyama = polya.filter(x => !x).length;
    return nyama
        ? { cvyat: 'lipsva', sastoyanie: `${nyama} ${nyama === 1 ? 'поле не е вписано' : 'полета не са вписани'}` }
        : { cvyat: 'gotovo', sastoyanie: 'попълнен' };
}

// Проектът: блоковете на текущия кръг, които влизат в доклада и чакат ✔.
function aktIzvorProekt(st) {
    const bl = Object.values((aktKrug(st) || {}).blokove || {})
        .filter(b => !b.rolya || b.rolya === 'описание');
    if (!bl.length) return { cvyat: 'sivo', sastoyanie: 'няма прочетени записки' };
    const chakat = bl.filter(b => (b.sastoyanie || 'predlozheno') === 'predlozheno').length;
    return chakat
        ? { cvyat: 'chaka', sastoyanie: `${chakat} ${chakat === 1 ? 'блок чака' : 'блока чакат'} ✔` }
        : { cvyat: 'gotovo', sastoyanie: 'текстовете са потвърдени' };
}

// Собствеността: кухнята казва дали веригата връзва (`_sbSastoyanie`).
function aktIzvorSobstvenost(p) {
    if (typeof _sbSastoyanie !== 'function') return { cvyat: 'sivo', sastoyanie: '' };
    const s = _sbSastoyanie(p);
    return s.gotovo
        ? { cvyat: 'gotovo', sastoyanie: 'веригата връзва', zashto: s.tekst }
        : { cvyat: 'lipsva', sastoyanie: 'веригата не връзва', zashto: s.tekst };
}

// Досието: прочетените документи и колко от тях не са сверени.
function aktIzvorDosie(st) {
    const s2 = ((st || {}).sloy2 || {}).od || {};
    const dok = s2.dokumenti || [];
    if (!dok.length) return { cvyat: 'sivo', sastoyanie: 'още нищо прочетено' };
    const potv = s2.potvardeni || {};
    const nesvereni = typeof _s2Sveren === 'function' ? dok.filter(d => !_s2Sveren(d, potv)).length : 0;
    return nesvereni
        ? { cvyat: 'chaka', sastoyanie: `${dok.length} прочетени · ${nesvereni} несверени` }
        : { cvyat: 'gotovo', sastoyanie: `${dok.length} прочетени, сверени` };
}

// ── Подсещането за архив ─────────────────────────────────────────────────────
// Стоеше в главата; главата отиде вдясно, а там нищо не се натиска.

function obektArhivHtml(st) {
    return aktVremeZaArhiv(st) ? `
        <div class="podsetka">
            Моментът е „${_e(st.tekusht_moment)}“ — обектът може да слезе в архива.
            Връща се с клик.
            <button class="bt bt-tih" onclick="obektArhiviraj()">в архива</button>
        </div>` : '';
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
        return aktGreshkaHtml(obektGrupi.greshka, 'Чеклистът не отговори')
             + '<div class="otkade">Числата по-горе са от последното броене.</div>';

    const tekusht = z.st.tekusht_moment || '';
    const i = obektGrupi.findIndex(g => g.moment === tekusht);
    const minali = i > 0 ? obektGrupi.slice(0, i) : [];
    const napred = i >= 0 ? obektGrupi.slice(i) : obektGrupi;

    return `
    <div class="lenta">
        ${minali.length ? `
            <details class="minali">
                <summary>${minali.length} минали моменти</summary>
                <div class="plochki">${minali.map(g => obektPlochkaHtml(g, z, false)).join('')}</div>
            </details>` : ''}
        <div class="plochki">
            ${napred.map(g => obektPlochkaHtml(g, z, g.moment === tekusht)).join('')}
        </div>
    </div>`;
}

function obektPlochkaHtml(g, z, tekusht) {
    const st = z.st;
    const dve = aktDveChisla(g, aktNeotnasya(z.p, st));
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
    const dve = aktDveChisla(g, aktNeotnasya(z.p, z.st));
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
        <p class="poyasnenie">
            <a href="#/znaem/${encodeURIComponent(obektId)}/${obektIndeks}/redove"
               onclick="obektZatvoriKutiya()">защо точно тези редове се искат →</a></p>
        ${obektNeotnasyatHtml(z)}`;
}

// Какво не се отнася — и дали е казано ТУК, или е научено от други обекти със
// същите съставки. Наученото се маха поотделно: иначе едно сбъркано „не се
// отнася“ важи завинаги, без да се вижда откъде е дошло.
function obektNeotnasyatHtml(z) {
    const vsichki = aktNeotnasya(z.p, z.st);
    if (!vsichki.length) return '';
    return `
    <details class="minali"><summary>не се отнасят · ${vsichki.length}</summary>
    <ul class="lipsvat">${vsichki.map(d => {
        const tuk = aktKazanoTuk(z.st, d);
        const urok = typeof nauchZaRed === 'function' ? nauchZaRed(z.p, z.st, d) : null;
        return `<li>${_e(d)}
            ${tuk ? `<button class="bt bt-tih"
                onclick="obektPakSeOtnasya('${_e(d)}')">върни</button>` : ''}
            ${urok ? `<button class="bt bt-tih"
                onclick="obektZabravi('${_e(d)}')"
                title="Махаш урока само за този тип строеж">забрави урока</button>
                <span class="otkade">${_e(nauchObyasnenie(urok))}</span>` : ''}
        </li>`;
    }).join('')}</ul>
    </details>`;
}

function obektZatvoriKutiya() {
    document.getElementById('obekt-kutiya').classList.remove('otvorena');
}

// Правило 4: „не се отнася“ е равноправен отговор и ВДИГА процента.
// И е УРОК: пази се и за профила на строежа, не само за този обект.
async function obektNeSeOtnasya(dokument) {
    const z = obektZhiv();
    if (!z) return;
    z.st.neotnasya = [...new Set([...(z.st.neotnasya || []), dokument])];
    aktZapishi();
    obektZatvoriKutiya();
    obektZaredilenta();
    if (typeof nauchZapomni === 'function') {
        try { await nauchZapomni(z.p, z.st, dokument); } catch (e) { /* урокът не блокира */ }
        obektZaredilenta();
    }
}

// „Върни“ е за ТОЗИ обект. Урокът остава — може да е верен другаде.
function obektPakSeOtnasya(dokument) {
    const z = obektZhiv();
    if (!z) return;
    z.st.neotnasya = (z.st.neotnasya || []).filter(x => x !== dokument);
    aktZapishi();
    obektZatvoriKutiya();
    obektZaredilenta();
}

// „Забрави урока“ е за ТИПА строеж. Обектът си остава както е.
async function obektZabravi(dokument) {
    const z = obektZhiv();
    if (!z || typeof nauchZabravi !== 'function') return;
    try { await nauchZabravi(z.p, z.st, dokument); } catch (e) { return; }
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

// ── Още: стаите, които още не са станали моменти ────────────────────────────
// Паспортът, Проектът, Собствеността и Досието отидоха в лентата горе; „Какво
// знаем“ — вдясно долу. ОСИП и Заповедната книга ще станат моменти;
// Проверките отиват при записката. Дотогава стоят тук, тихо.
function obektOshteHtml() {
    const id = encodeURIComponent(obektId), i = obektIndeks;
    return `
    <div class="obekt-oshte">
        <span class="nadpis">Още</span>
        <a class="vrazka-tiha" href="#/osip/${id}/${i}">ОСИП</a>
        <a class="vrazka-tiha" href="#/zk/${id}/${i}">Заповедна книга</a>
        <a class="vrazka-tiha" href="#/proverki/${id}/${i}">Проверки</a>
    </div>`;
}
