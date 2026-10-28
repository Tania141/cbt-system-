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
        + proektKachvaneHtml()
        + proektChastiHtml(z.k)
        + proektBlokoveHtml(z.k);
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
        <p class="poyasnenie">Изброяват се, без да се четат. Чете се само отметнатото —
           по една записка на част.</p>
        <input type="file" id="proekt-vhod" multiple accept=".pdf,.docx,.jpg,.jpeg,.png"
               onchange="proektIzbroi(this.files)" style="display:none">
        <div class="redica">
            <button class="bt" onclick="document.getElementById('proekt-vhod').click()">избери записки</button>
            ${proektPapka.length ? `<span class="brojach">${proektPapka.length} файла · отметнати ${otmetnati}</span>` : ''}
        </div>
        ${proektPapka.length ? `
            <div class="fajlove">
                ${proektPapka.map((f, i) => `
                    <label class="fajl ${f.cena === 'не се чете' ? 'fajl-ne' : ''}">
                        <input type="checkbox" ${f.otmetnat ? 'checked' : ''}
                               ${f.cena === 'не се чете' ? 'disabled' : ''}
                               onchange="proektOtmetni(${i}, this.checked)">
                        <span class="fajl-ime">${_e(f.ime)}</span>
                        <span class="fajl-cena fajl-cena-${f.cena === 'безплатно' ? 'free'
                            : f.cena === 'през АИ' ? 'ai' : 'ne'}">${_e(f.cena)} · ${_e(f.kak)}</span>
                    </label>`).join('')}
            </div>
            <button class="bt bt-glaven" ${otmetnati ? '' : 'disabled'}
                    onclick="proektProcheti()">прочети отметнатите (${otmetnati})</button>` : ''}
        ${proektHod ? `<div class="chaka">${proektHod}</div>` : ''}
    </div>`;
}

function proektIzbroi(fajlove) {
    proektPapka = [...(fajlove || [])].map(f => {
        const c = aktCenaNaFajl(f.name);
        return { ime: f.name, fajl: f, cena: c.cena, kak: c.kak, otmetnat: false };
    });
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
    const zapiski = (z.k.zapiski = z.k.zapiski || { chasti: [] });
    let prochetenite = 0;
    for (const f of izbrani) {
        proektHod = `Чета „${f.ime}“…`;
        proektRisuvai();
        try {
            const r = await aktApi('/api/zapiski/chete', 'POST', {
                pi: z.p.pi, chetec: localStorage.getItem('s2_chetec') || 'auto',
                fajl: { ime: f.ime, media_type: f.fajl.type, data: await proektBase64(f.fajl) },
            });
            if (r.greshka) throw new Error(r.greshka);
            // Ново четене на същата част заменя старото ѝ четене.
            zapiski.chasti = zapiski.chasti.filter(x => x.fajl !== f.ime);
            zapiski.chasti.push(r.zapiska);
            proektSleejBlokove(z.k, r);
            prochetenite++;
        } catch (e) {
            proektHod = `❌ „${f.ime}“: ${e.message}`;
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
            const klyuch = (chast.chast || '') + ' · '
                + String(razdel.podzaglavie || '').trim().toLowerCase();
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
        ${chasti.map(z => `
            <div class="chast-red">
                <div class="chast-ime">${_e(z.chast_ime || z.chast_kod || '?')}</div>
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
