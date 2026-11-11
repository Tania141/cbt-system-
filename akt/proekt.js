// АКТ СИСТЕМ · новото ПВА · proekt.js
// ЕКРАН 4. ПРОЕКТЪТ — записките
//
// „Единственото място, където влиза проектът.“ (ЗАДАНИЕ.md)
//
// Качваш записките по части. За всяка се вижда коя част е, какво е извадено и
// текстовите блокове — описанието, което после влиза ДОСЛОВНО в докладите.
//
// Всеки блок има един ✔. Потвърденото влиза в комплексния доклад, в Акт 15 и
// в окончателния доклад; отваря въпроси и съставки; и не се преписва никога
// повече.
//
// Кръговете по чл. 154 живеят тук: нов кръг = нови записки за изменените
// части. Затова записките и блоковете висят на КРЪГА, не на строежа.

'use strict';

let proektId = null;
let proektIndeks = 0;
let proektPapka = [];        // изброеното, преди да се чете
let proektHod = '';          // какво става в момента

function proektOtvori(id, i) {
    proektId = id;
    proektIndeks = Number(i || 0);
    proektPapka = [];
    proektHod = '';
    const p = aktObekt(id);
    if (!p) {
        document.getElementById('proekt-telo').innerHTML =
            '<div class="pusto"><div class="pusto-ime">Този обект го няма</div></div>';
        return;
    }
    aktZapomniObekt(p, proektIndeks);
    proektRisuvai();
}

function proektZhiv() {
    const p = aktObekt(proektId);
    if (!p) return null;
    const st = aktStroezh(p, proektIndeks);
    return { p, st, k: aktKrug(st) };
}

function proektRisuvai() {
    const z = proektZhiv();
    if (!z) return;
    document.getElementById('proekt-telo').innerHTML =
        proektKrugoveHtml(z.st)
        + proektPloshtHtml(z.st)
        + proektKachvaneHtml()
        + proektChastiHtml(z.k)
        + proektBlokoveHtml(z.k);
}

// ── Площообразуването ────────────────────────────────────────────────────────
// Операторът, 06.11.2026: качва се тук — част е от проекта; Собствеността
// само го ползва. Чете се само списъкът на обектите и видът им, без площи и
// без идеални части; таблица IV (двор) не дава обекти. Без АИ.

function proektPloshtHtml(st) {
    const t = st.ploshtoobrazuvane;
    const broi = t ? Object.entries(t.broi_po_vid || {}).map(([v, n]) => `${n} ${v}`).join(' · ') : '';
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Площообразуване</div>
        ${t ? `<p><strong>${(t.obekti || []).length} обекта</strong> — ${_e(broi)}
              <span class="otkade">· от „${_e(t.fajl || '')}“</span></p>` :
             '<p class="tiho">Още не е качено. Дава списъка на обектите за сверката в Собствеността.</p>'}
        <div class="redica">
            <input type="file" id="proekt-plosht-fajl" accept=".xlsx,.xls" onchange="proektPloshtCheti()">
            <span class="tiho">таблицата .xlsx — само обектите и видът им се четат</span>
        </div>
        <div id="proekt-plosht-hod"></div>
    </div>`;
}

async function proektPloshtCheti() {
    const z = proektZhiv(); if (!z) return;
    const vhod = document.getElementById('proekt-plosht-fajl');
    const hod = document.getElementById('proekt-plosht-hod');
    const f = vhod && vhod.files && vhod.files[0];
    if (!f) return;
    hod.innerHTML = `<p class="tiho">Чета „${_e(f.name)}“…</p>`;
    try {
        const r = await aktApi('/api/ploshtoobrazuvane', 'POST', {
            fajl: { ime: f.name, data: await proektBase64(f) } });
        if (r.greshka) { hod.innerHTML = `<p class="greshka">⚠ ${_e(r.greshka)}</p>`; return; }
        z.st.ploshtoobrazuvane = r.tablica;
        aktZapishi();
        proektRisuvai();
    } catch (e) {
        hod.innerHTML = `<p class="greshka">✗ ${_e(e.message)}</p>`;
    }
}

// ── Кръговете ────────────────────────────────────────────────────────────────
// Кръг 1 е оценката по чл. 142. Всяко изменение по чл. 154 е нов кръг със
// свои записки — старите остават недокоснати, за да личи какво е било.

function proektKrugoveHtml(st) {
    const spisak = aktKrugove(st), tekusht = aktIndeksKrug(st);
    return `
    <div class="prevkl">
        <span class="nadpis">${spisak.length === 1 ? 'Кръг' : 'Кръгове · ' + spisak.length}</span>
        ${spisak.map((k, i) => `
            <button type="button" class="bt ${i === tekusht ? 'bt-glaven' : 'bt-tih'}"
                    onclick="proektSmeniKrug(${i})">${_e(aktImeKrug(st, i))}</button>`).join('')}
        <button type="button" class="bt bt-tih" onclick="proektNovKrug()">+ изменение</button>
    </div>`;
}

function proektSmeniKrug(i) {
    const z = proektZhiv();
    if (!z) return;
    z.st.tekusht_krug = Number(i);
    aktZapishi();
    proektRisuvai();
}

function proektNovKrug() {
    const z = proektZhiv();
    if (!z) return;
    const nomer = prompt('Ново изменение по чл. 154.' + String.fromCharCode(10, 10)
        + 'Номер на изменението (по избор):', '');
    if (nomer === null) return;
    (z.st.krugove_dop = z.st.krugove_dop || []).push({ nomer: nomer.trim() });
    z.st.tekusht_krug = aktKrugove(z.st).length - 1;
    aktZapishi();
    proektRisuvai();
}

// ── Качването ────────────────────────────────────────────────────────────────
// Същото правило като при момента: изброява се, без да се чете, и до всеки
// файл пише какво ще струва. Чете се само отметнатото.

function proektKachvaneHtml() {
    const otmetnati = proektPapka.filter(f => f.otmetnat).length;
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Записките по части</div>
        ${aktChetecHtml('proektRisuvai()')}
        <p class="poyasnenie">Изброяват се, без да се четат. До всяка пише дали минава през АИ
           и кой ще я чете. Чете се само отметнатото — по една записка на част.</p>
        <input type="file" id="proekt-vhod" multiple accept=".pdf,.docx,.jpg,.jpeg,.png"
               onchange="proektIzbroi(this.files)" style="display:none">
        <div class="redica">
            <button class="bt" onclick="document.getElementById('proekt-vhod').click()">избери записки</button>
            ${proektPapka.length ? `<span class="brojach">${proektPapka.length} файла · отметнати ${otmetnati}</span>` : ''}
        </div>
        ${proektPapka.length ? `
            <div class="fajlove">
                ${proektPapka.map((f, i) => `
                    <div class="fajl-red">
                    <label class="fajl ${f.cena === 'не се чете' ? 'fajl-ne' : ''}">
                        <input type="checkbox" ${f.otmetnat ? 'checked' : ''}
                               ${f.cena === 'не се чете' ? 'disabled' : ''}
                               onchange="proektOtmetni(${i}, this.checked)">
                        <span class="fajl-ime">${_e(f.ime)}</span>
                        <span class="fajl-cena fajl-cena-${f.cena === 'безплатно' ? 'free'
                            : f.cena === 'през АИ' ? 'ai' : 'ne'}">${_e(f.cena)} · ${_e(f.kak)}${
                            aktKojShteChete(f.cena) ? ' · ' + _e(aktKojShteChete(f.cena)) : ''}</span>
                    </label>
                    <select onchange="proektChastNaFajl(${i}, this.value)" title="коя част е записката">
                        <option value="">— коя част? —</option>
                        ${PROEKT_CHASTI.map(([kod, ime]) =>
                            `<option value="${kod}" ${f.chast === kod ? 'selected' : ''}>${_e(ime)}</option>`).join('')}
                    </select>
                    ${f.chast && f.chast_ot_imeto ? '<span class="tiho">по името на файла — провери</span>' : ''}
                    </div>`).join('')}
            </div>
            ${proektPapka.some(f => f.otmetnat && !f.chast)
                ? '<p class="zashto-ne">Кажи коя част е всяка отметната записка — частта е твоя, не на четеца.</p>' : ''}
            <button class="bt bt-glaven" ${otmetnati && !proektPapka.some(f => f.otmetnat && !f.chast) ? '' : 'disabled'}
                    onclick="proektProcheti()">прочети отметнатите (${otmetnati})</button>` : ''}
        ${proektHod ? `<div class="chaka">${proektHod}</div>` : ''}
    </div>`;
}

// ЧАСТТА Я КАЗВА ОПЕРАТОРЪТ (11.11.2026). Четецът я гадаеше по съдържанието;
// тя е факт, който операторът знае. Името на файла само подсказва — и казва,
// че подсказва. Кодовете са тези на сървъра (`rules/zapiski.py`, CHASTI).
const PROEKT_CHASTI = [
    ['ARH', 'Архитектура'], ['KONSTR', 'Конструкции'], ['EL', 'Електро'], ['VIK', 'ВиК'],
    ['OVK', 'ОВК'], ['EE', 'Енергийна ефективност'], ['PB', 'Пожарна безопасност'],
    ['GEO', 'Геодезия'], ['OZELEN', 'Паркоустройство / озеленяване'], ['PBZ', 'ПБЗ'],
    ['TRANSP', 'Пътна / транспортен достъп'], ['SITUACIA', 'Ситуация / вертикална планировка'],
    ['VIZA', 'Виза за проектиране'], ['DRUGA', 'друга част'],
];

function proektChastOtImeto(ime) {
    const t = ' ' + String(ime || '').replace(/[-_.\s]+/g, ' ').toLowerCase() + ' ';
    const PO = [[/ a | арх| arh/, 'ARH'], [/ k | конст| konstr/, 'KONSTR'], [/ el | елект/, 'EL'],
                [/ ws | вик | vik | вк /, 'VIK'], [/ hc | овк | ovk | hvac /, 'OVK'], [/ ee | енерг/, 'EE'],
                [/ fs | пб | пожар/, 'PB'], [/ геод| geo /, 'GEO'], [/ паркоустр| озелен| ландш/, 'OZELEN'],
                [/ пбз /, 'PBZ']];
    const h = PO.find(([re]) => re.test(t));
    return h ? h[1] : '';
}

function proektIzbroi(fajlove) {
    proektPapka = [...(fajlove || [])].map(f => {
        const c = aktCenaNaFajl(f.name);
        const chast = proektChastOtImeto(f.name);
        return { ime: f.name, fajl: f, cena: c.cena, kak: c.kak, otmetnat: false,
                 chast, chast_ot_imeto: !!chast };
    });
    proektRisuvai();
}

function proektChastNaFajl(i, kod) {
    if (!proektPapka[i]) return;
    proektPapka[i].chast = kod;
    proektPapka[i].chast_ot_imeto = false;
    proektRisuvai();
}

function proektOtmetni(i, da) {
    if (proektPapka[i]) proektPapka[i].otmetnat = !!da;
    proektRisuvai();
}

async function proektProcheti() {
    const z = proektZhiv();
    if (!z) return;
    const izbrani = proektPapka.filter(f => f.otmetnat);
    if (izbrani.some(f => !f.chast)) {
        proektHod = 'Кажи коя част е всяка отметната записка.';
        proektRisuvai();
        return;
    }
    const zapiski = (z.k.zapiski = z.k.zapiski || { chasti: [] });
    let prochetenite = 0;
    for (const f of izbrani) {
        proektHod = `Чета „${f.ime}“…`;
        proektRisuvai();
        try {
            const r = await aktApi('/api/zapiski/chete', 'POST', {
                pi: z.p.pi, chetec: localStorage.getItem('s2_chetec') || 'auto', chast_kod: f.chast,
                fajl: { ime: f.ime, media_type: f.fajl.type, data: await proektBase64(f.fajl) },
            });
            if (r.greshka) throw new Error(r.greshka);
            // Ново четене на същата част заменя старото ѝ четене.
            zapiski.chasti = zapiski.chasti.filter(x => x.fajl !== f.ime);
            zapiski.chasti.push(r.zapiska);
            proektSleejBlokove(z.k, r);
            prochetenite++;
        } catch (e) {
            proektHod = e.izteklo ? aktGreshkaHtml(e)
                : `❌ „${_e(f.ime)}“: ${_e(e.message)}`;
            proektRisuvai();
            return;
        }
    }
    zapiski.koga = new Date().toISOString();
    aktZapishi();
    proektPapka = proektPapka.filter(f => !f.otmetnat);
    proektHod = `Прочетени ${prochetenite}. Нищо не влиза в документ без твоето ✔.`;
    proektRisuvai();
}

function proektBase64(fajl) {
    return new Promise((da, ne) => {
        const r = new FileReader();
        r.onload = () => da(String(r.result).split(',')[1]);
        r.onerror = ne;
        r.readAsDataURL(fajl);
    });
}

// Прочетеното се СЛИВА със запазеното: потвърденият текст не се подменя от
// ново четене — само се казва, че записката вече дава друго.
function proektSleejBlokove(k, r) {
    const pazeni = (k.blokove = k.blokove || {});
    for (const chast of r.blokove || []) {
        for (const razdel of chast.razdeli || []) {
            // КЛЮЧЪТ НОСИ ФАЙЛА (11.11.2026). Всяка записка вече дава ЕДИН блок
            // „Описание“ — по част + подзаглавие основната записка по
            // Архитектура и тази по чл. 154 сядаха една върху друга.
            const klyuch = (chast.chast || '') + ' · '
                + String(razdel.podzaglavie || '').trim().toLowerCase()
                + (chast.fajl ? ' · ' + chast.fajl : '');
            const b = pazeni[klyuch];
            if (!b) {
                pazeni[klyuch] = {
                    chast: chast.chast, chast_kod: chast.chast_kod || '',
                    podzaglavie: razdel.podzaglavie, tekst: razdel.tekst,
                    prochetan: razdel.tekst, fajl: chast.fajl, stranica: razdel.stranica,
                    rolya: razdel.rolya || 'описание', red: razdel.red || 0,
                    sastoyanie: 'predlozheno',
                };
                continue;
            }
            if (!b.chast_kod && chast.chast_kod) b.chast_kod = chast.chast_kod;
            if (!b.rolya && razdel.rolya) b.rolya = razdel.rolya;
            if (!b.red && razdel.red) b.red = razdel.red;
            if (b.prochetan !== razdel.tekst) {
                b.prochetan = razdel.tekst;
                b.novo_chetene = b.sastoyanie === 'predlozheno' ? '' : razdel.tekst;
                if (b.sastoyanie === 'predlozheno') b.tekst = razdel.tekst;
            }
        }
    }
}

// ── Частите ──────────────────────────────────────────────────────────────────
// Какво е извадено от всяка записка — и откъде се знае.

function proektChastiHtml(k) {
    const chasti = ((k.zapiski || {}).chasti) || [];
    if (!chasti.length) {
        return `<div class="kutiya-razdel">
            <div class="nadpis">Прочетени части</div>
            <p>Още няма. Качи записките по части.</p></div>`;
    }
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Прочетени части · ${chasti.length}</div>
        <div class="redica"><button class="bt bt-tih" onclick="proektMahniVsichko()">махни всичко прочетено</button>
            <span class="tiho">записките и блоковете на този кръг — за ново четене</span></div>
        ${chasti.map(z => `
            <div class="chast-red">
                <div class="chast-ime">${_e(((PROEKT_CHASTI.find(([k]) => k === z.chast_kod) || [])[1])
                    || z.chast_ime || z.chast_kod || '?')}${z.chast_ot ? ' <span class="tiho">· ' + _e(z.chast_ot) + '</span>' : ''}</div>
                ${(z.otpadnali_chasti || []).length ? `<div class="otkade">отпадна преразказът на:
                    ${_e(z.otpadnali_chasti.join(' · '))} — те идват от своите записки</div>` : ''}
                <div class="chast-kakvo">
                    ${(z.priznaci || []).length} признака ·
                    ${(z.materiali || []).length} материала ·
                    ${proektBrojBlokove(k, z)} текстови блока
                </div>
                <div class="otkade">
                    ${_e(z.fajl || '')}
                    ${z.ot_tekst ? ' · от текст (безплатно)' : z.sken ? ' · скан' : ''}
                    ${z.chetec ? ' · ' + _e(z.chetec) : ''}
                </div>
                <button class="bt bt-tih" onclick="proektMahniChast('${encodeURIComponent(z.fajl || '')}')"
                        title="маха само прочетеното от този файл">×</button>
            </div>`).join('')}
    </div>`;
}

// Всичко прочетено в кръга — за ново четене (операторът, 11.11.2026).
// Пита, защото с блоковете падат и потвърденото „изпълнено“ и поправките.
function proektMahniVsichko() {
    const z = proektZhiv();
    if (!z) return;
    const bl = Object.values(z.k.blokove || {});
    const potv = bl.filter(b => b.sastoyanie !== 'predlozheno'
        || (b.izpalnenie && b.izpalnenie.sastoyanie !== 'predlozheno')).length;
    if (!confirm(`Да махна ли всичко прочетено в този кръг — ${((z.k.zapiski || {}).chasti || []).length} записки, `
        + `${bl.length} блока${potv ? `, от които ${potv} потвърдени или поправени от теб` : ''}?\n\n`
        + 'Файловете на диска не се пипат — могат да се прочетат пак.')) return;
    z.k.zapiski = { chasti: [] };
    z.k.blokove = {};
    aktZapishi();
    proektHod = 'Махнато. Избери записките пак и кажи коя част е всяка.';
    proektRisuvai();
}

function proektBrojBlokove(k, z) {
    return Object.values(k.blokove || {})
        .filter(b => b.fajl === z.fajl).length;
}

function proektMahniChast(fajl64) {
    const z = proektZhiv();
    if (!z) return;
    const fajl = decodeURIComponent(fajl64);
    const zapiski = (z.k.zapiski = z.k.zapiski || { chasti: [] });
    zapiski.chasti = zapiski.chasti.filter(x => x.fajl !== fajl);
    // Блоковете от същия файл падат с нея — иначе остават без извор.
    for (const [klyuch, b] of Object.entries(z.k.blokove || {}))
        if (b.fajl === fajl) delete z.k.blokove[klyuch];
    aktZapishi();
    proektRisuvai();
}

// ── Блоковете ────────────────────────────────────────────────────────────────
// Описанието, което влиза ДОСЛОВНО в докладите. Един ✔ на блок.

const PROEKT_SASTOYANIE = { predlozheno: '', potvardeno: '✓ потвърден', popraveno: '✍ поправен' };

function proektBlokoveHtml(k) {
    const blokove = Object.entries(k.blokove || {});
    if (!blokove.length) return '';
    const poChasti = {};
    for (const [klyuch, b] of blokove) (poChasti[b.chast || 'Друга част'] ||= []).push([klyuch, b]);
    const chakat = blokove.filter(([, b]) => b.sastoyanie === 'predlozheno').length;
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Текстовете от записките · ${blokove.length}</div>
        <p class="poyasnenie">Влизат дословно в комплексния доклад, в Акт 15 и в окончателния
           доклад. ${chakat ? `<strong>${chakat} чакат твоето ✔.</strong>` : 'Всичко е потвърдено.'}</p>
        ${Object.entries(poChasti).map(([chast, spisak]) => `
            <div class="bl-chast">
                <div class="bl-chast-ime">Част ${_e(chast)}</div>
                ${proektIzpChastHtml(chast, spisak)}
                ${spisak.sort((a, b) => (a[1].red || 0) - (b[1].red || 0))
                        .map(([klyuch, b]) => proektBlokHtml(klyuch, b)).join('')}
            </div>`).join('')}
    </div>`;
}

function proektBlokHtml(klyuch, b) {
    const k64 = encodeURIComponent(klyuch);
    const vliza = !b.rolya || b.rolya === 'описание';
    return `
    <div class="blok blok-${b.sastoyanie}">
        <div class="blok-glava">
            <span class="blok-ime">${_e(b.podzaglavie || '—')}</span>
            ${PROEKT_SASTOYANIE[b.sastoyanie]
                ? `<span class="blok-sastoyanie">${PROEKT_SASTOYANIE[b.sastoyanie]}</span>` : ''}
            ${vliza ? '' : `<span class="otkade">${_e(b.rolya)} — не влиза в доклада</span>`}
        </div>
        <div class="blok-tekst">${_e(b.tekst || '')}</div>
        <div class="otkade">${_e(b.fajl || '')}${b.stranica ? ' · стр. ' + b.stranica : ''}${
            b.koy ? ' · ' + _e(b.koy) : ''}</div>
        ${vliza ? proektIzpBlokHtml(k64, b) : ''}
        ${b.novo_chetene ? `
            <div class="blok-razminavane">
                Записката вече дава друго:
                <div class="blok-tekst">${_e(b.novo_chetene)}</div>
                <button class="bt bt-tih" onclick="proektVzemiNovoto('${k64}')">вземи новото</button>
                <button class="bt bt-tih" onclick="proektOstaviMoeto('${k64}')">остави моето</button>
            </div>` : ''}
        ${vliza && b.sastoyanie === 'predlozheno' ? `
            <div class="blok-zhestove">
                <button class="bt bt-glaven" onclick="proektPotvardi('${k64}')">✔ потвърди</button>
                <button class="bt" onclick="proektPoprav('${k64}')">✍ поправи</button>
            </div>` : vliza ? `
            <div class="blok-zhestove">
                <button class="bt bt-tih" onclick="proektPoprav('${k64}')">✍ поправи</button>
                <button class="bt bt-tih" onclick="proektOtmeni('${k64}')">отмени</button>
            </div>` : ''}
    </div>`;
}

// ── „Изпълнено“ — описанието за Акт 15, ОД, Акт 16 и ТП ─────────────────────
// Операторът, 11.11.2026: тези документи разказват какво е НАПРАВЕНО, в
// сегашно време, към подписването на Акт 15; източникът е записката по частта;
// описват се всички части. АИ-то предлага (обърнато време, без указанията на
// проектанта), операторът поправя В САМОТО ПОЛЕ и потвърждава.
//
// И разминаванията на частта с проекта: няма · несъществени (екзекутивна
// документация) · съществени (проект по чл. 154). Пазят се на СТРОЕЖА — те
// са за построеното, не за кръга.
const PROEKT_RAZMINAVANE = [
    ['nyama', 'няма'],
    ['ekzekutiv', 'несъществени — отразени в екзекутивна документация'],
    ['154', 'съществени — узаконени с проект по чл. 154 ЗУТ'],
];

function proektIzpChastHtml(chast, spisak) {
    const z = proektZhiv();
    const vlizat = spisak.filter(([, b]) => !b.rolya || b.rolya === 'описание');
    if (!z || !vlizat.length) return '';
    const znaci = vlizat.reduce((s, [, b]) => s + String(b.tekst || '').length, 0);
    const imaIzp = vlizat.filter(([, b]) => b.izpalnenie).length;
    const r = ((z.st.razminavania || {})[chast]) || {};
    const c64 = encodeURIComponent(chast);
    return `
        <div class="izp-chast">
            <div class="redica">
                <button class="bt" onclick="proektIzpPredlozhi('${c64}')">${imaIzp
                    ? 'предложи „изпълнено“ пак' : 'предложи „изпълнено“'} (АИ, ${znaci} знака)</button>
                <span class="tiho" id="izp-hod-${_e(chast)}">${imaIzp ? `${imaIzp} от ${vlizat.length} блока имат „изпълнено“` : ''}</span>
            </div>
            <label class="p2-pole"><span>Разминавания с проекта по част ${_e(chast)}</span>
                <select onchange="proektRazminavane('${c64}', 'vid', this.value)">
                    <option value="">— не е казано —</option>
                    ${PROEKT_RAZMINAVANE.map(([v, ime]) =>
                        `<option value="${v}" ${r.vid === v ? 'selected' : ''}>${_e(ime)}</option>`).join('')}
                </select></label>
            ${r.vid && r.vid !== 'nyama' ? `<label class="p2-pole"><span>${r.vid === '154'
                ? 'Проектът по чл. 154 — кой, кога одобрен' : 'Екзекутивната документация — коя, от кога'}</span>
                <input type="text" value="${_e(r.belezhka || '')}"
                       onchange="proektRazminavane('${c64}', 'belezhka', this.value)"></label>` : ''}
        </div>`;
}

const PROEKT_IZP_SASTOYANIE = { predlozheno: 'предложено — провери', potvardeno: '✓ потвърдено', popraveno: '✍ поправено' };

function proektIzpBlokHtml(k64, b) {
    const iz = b.izpalnenie;
    if (!iz) return '';
    return `
        <div class="blok-izp blok-${iz.sastoyanie}">
            <div class="otkade"><strong>Изпълнено</strong> — за Акт 15, ОД, Акт 16 и ТП ·
                ${_e(PROEKT_IZP_SASTOYANIE[iz.sastoyanie] || '')}${iz.chetec ? ' · ' + _e(iz.chetec) : ''}</div>
            <textarea class="izp-pole" rows="${Math.min(30, Math.max(3, Math.ceil(String(iz.tekst || '').length / 90)))}"
                      placeholder="(празно — блокът не влиза в документите)"
                      onchange="proektIzpPoprav('${k64}', this.value)">${_e(iz.tekst || '')}</textarea>
            ${(iz.mahnato || []).length ? `<div class="otkade">махнато: ${_e(iz.mahnato.join(' · '))}</div>` : ''}
            ${iz.sastoyanie === 'predlozheno' ? `<div class="blok-zhestove">
                <button class="bt bt-glaven" onclick="proektIzpPotvardi('${k64}')">✔ потвърди</button></div>` : ''}
        </div>`;
}

async function proektIzpPredlozhi(c64) {
    const z = proektZhiv();
    if (!z) return;
    const chast = decodeURIComponent(c64);
    const blokove = Object.entries(z.k.blokove || {})
        .filter(([, b]) => (b.chast || 'Друга част') === chast && (!b.rolya || b.rolya === 'описание'));
    // Потвърденото и поправеното от теб не се подменя от ново предложение.
    const zaAI = blokove.filter(([, b]) => !b.izpalnenie || b.izpalnenie.sastoyanie === 'predlozheno');
    const hod = document.getElementById('izp-hod-' + chast);
    if (!zaAI.length) { if (hod) hod.textContent = 'Всичко в частта е потвърдено — няма какво да се предлага.'; return; }
    if (hod) hod.textContent = `Преработвам ${zaAI.length} блока…`;
    try {
        const r = await aktApi('/api/tekst/izpalnenie', 'POST', {
            chast, chetec: localStorage.getItem('s2_chetec') || 'auto',
            blokove: zaAI.map(([klyuch, b]) => ({ klyuch, podzaglavie: b.podzaglavie, tekst: b.tekst })),
        });
        if (r.greshka) { if (hod) hod.textContent = '⚠ ' + r.greshka; return; }
        for (const [klyuch, b] of zaAI) {
            const x = (r.izpalnenie || {})[klyuch];
            if (!x) continue;
            b.izpalnenie = { tekst: x.tekst, predlozheno: x.tekst, mahnato: x.mahnato || [],
                             sastoyanie: 'predlozheno', chetec: r.chetec || '', koga: new Date().toISOString() };
        }
        aktZapishi();
        proektRisuvai();
        const h2 = document.getElementById('izp-hod-' + chast);
        if (h2 && (r.lipsvat || []).length) h2.textContent = `⚠ без отговор за ${r.lipsvat.length} блока — предложи пак`;
    } catch (e) {
        if (hod) hod.textContent = '✗ ' + e.message;
    }
}

// Поправка В САМОТО ПОЛЕ — записва се при излизане от него (операторът,
// 11.11.2026: „да може да се поправя в самото поле, което се вижда“).
function proektIzpPoprav(k64, v) {
    const x = proektBlok(k64);
    if (!x || !x.b.izpalnenie) return;
    const nov = String(v || '').trim();
    if (nov === x.b.izpalnenie.tekst) return;
    Object.assign(x.b.izpalnenie, { tekst: nov, sastoyanie: 'popraveno', koy: proektKoy(),
                                    koga: new Date().toISOString() });
    aktZapishi();
    proektRisuvai();
}

function proektIzpPotvardi(k64) {
    const x = proektBlok(k64);
    if (!x || !x.b.izpalnenie) return;
    Object.assign(x.b.izpalnenie, { sastoyanie: 'potvardeno', koy: proektKoy(), koga: new Date().toISOString() });
    aktZapishi();
    proektRisuvai();
}

function proektRazminavane(c64, pole, v) {
    const z = proektZhiv();
    if (!z) return;
    const chast = decodeURIComponent(c64);
    const r = ((z.st.razminavania = z.st.razminavania || {})[chast] = z.st.razminavania[chast] || {});
    r[pole] = String(v || '').trim();
    aktZapishi();
    if (pole === 'vid') proektRisuvai();
}

function proektBlok(k64) {
    const z = proektZhiv();
    if (!z) return null;
    const klyuch = decodeURIComponent(k64);
    const b = (z.k.blokove || {})[klyuch];
    return b ? { z, klyuch, b } : null;
}

function proektPotvardi(k64) {
    const x = proektBlok(k64);
    if (!x) return;
    x.b.sastoyanie = 'potvardeno';
    x.b.koy = proektKoy();
    x.b.koga = new Date().toISOString();
    aktZapishi();
    proektRisuvai();
}

function proektPoprav(k64) {
    const x = proektBlok(k64);
    if (!x) return;
    const nov = prompt(x.b.podzaglavie + ':', x.b.tekst || '');
    if (nov === null) return;
    x.b.tekst = nov.trim();
    x.b.sastoyanie = 'popraveno';
    x.b.koy = proektKoy();
    x.b.koga = new Date().toISOString();
    aktZapishi();
    proektRisuvai();
}

// Отмяната връща блока в „чака ✔“ — текстът остава, състоянието пада.
function proektOtmeni(k64) {
    const x = proektBlok(k64);
    if (!x) return;
    x.b.sastoyanie = 'predlozheno';
    delete x.b.koy; delete x.b.koga;
    aktZapishi();
    proektRisuvai();
}

function proektVzemiNovoto(k64) {
    const x = proektBlok(k64);
    if (!x) return;
    x.b.tekst = x.b.novo_chetene;
    x.b.sastoyanie = 'predlozheno';
    delete x.b.novo_chetene;
    aktZapishi();
    proektRisuvai();
}

function proektOstaviMoeto(k64) {
    const x = proektBlok(k64);
    if (!x) return;
    delete x.b.novo_chetene;
    aktZapishi();
    proektRisuvai();
}

function proektKoy() {
    try { return JSON.parse(localStorage.getItem('akt_user') || '{}').email || ''; }
    catch (e) { return ''; }
}
