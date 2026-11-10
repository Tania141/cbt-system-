// АКТ СИСТЕМ · новото ПВА · moment.js
// ЕКРАН 3. МОМЕНТЪТ — тук се готви
//
// „Това е сърцето. 90 % от работата става тук.“ (ЗАДАНИЕ.md)
//
// Отгоре надолу:
//   1. двете везни и ЕДНО ИЗРЕЧЕНИЕ какво сега може;
//   2. папката — изброява се, без да се чете; до всеки файл пише какво струва;
//   3. „Липсва ми“ — по ред, с три възможности; ЕДИН ЖЕСТ ЗАТВАРЯ ЕДИН РЕД;
//   4. „Имам“ — сгънато;
//   5. остатъкът — онова, което системата не може да знае;
//   6. „Съставѝ документа“ — активен според правилото на момента.
//
// Какво НЕ е тук: признаци, съставки, записки, собственост. Те се правят на
// своите места и тук само се ползват.

'use strict';

let momentId = null;
let momentIndeks = 0;
let momentIme = '';
let momentGrupa = null;
let momentPapka = [];        // изброеното от папката — имена, без четене
let momentHod = {};          // какво става с ред, който се чете в момента
// Последното съобщение от четенето — оцелява прерисуването. Дотук „Прочетени
// N“ се изтриваше от momentZaredi веднага след като се напише.
let momentSaobshtenie = '';
// Файловете от последното четене — за „раздели по 1 страница“ без ново качване.
let momentFajlove = {};

function momentOtvori(id, i, ime) {
    momentId = id;
    momentIndeks = Number(i || 0);
    momentIme = ime || '';
    momentGrupa = null;
    momentPapka = [];
    momentSaobshtenie = '';
    momentFajlove = {};
    momentHod = {};
    const p = aktObekt(id);
    if (!p) {
        document.getElementById('moment-telo').innerHTML =
            '<div class="pusto"><div class="pusto-ime">Този обект го няма</div></div>';
        return;
    }
    aktZapomniObekt(p, momentIndeks);
    momentRisuvai();
    momentZaredi();
}

function momentZhiv() {
    const p = aktObekt(momentId);
    return p ? { p, st: aktStroezh(p, momentIndeks) } : null;
}

async function momentZaredi() {
    const z = momentZhiv();
    if (!z) return;
    try {
        const r = await aktNadzor(z.p, z.st);
        if (r.greshka) throw new Error(r.greshka);
        momentGrupa = (r.grupi || []).find(g => g.moment === momentIme)
                   || { moment: momentIme, dokumenti: [] };
    } catch (e) {
        momentGrupa = { greshka: e.message };
    }
    momentRisuvai();
}

function momentRisuvai() {
    const z = momentZhiv();
    if (!z) return;
    const kutiya = document.getElementById('moment-telo');
    if (!momentGrupa) { kutiya.innerHTML = '<div class="chaka">Питам чеклиста…</div>'; return; }
    if (momentGrupa.greshka) {
        kutiya.innerHTML = aktGreshkaHtml(momentGrupa.greshka, 'Чеклистът не отговори');
        return;
    }
    const dve = aktDveChisla(momentGrupa, aktNeotnasya(z.p, z.st));
    kutiya.innerHTML =
        momentVezniHtml(dve)
        + momentPapkaHtml()
        + momentLipsvaHtml(dve)
        + momentImamHtml()
        + momentOstatakHtml(z.st)
        + momentSastaviHtml(dve);
}

// ── 1. Двете везни ───────────────────────────────────────────────────────────

function momentVezniHtml(dve) {
    const vezna = (ime, v, koe) => `
        <button type="button" class="vezna vezna-${v === null ? 'nyama' : v.post === 100 ? 'pylno' : 'chastichno'}"
                onclick="momentKoeLipsva('${koe}')">
            <span class="vezna-ime">${ime}</span>
            <span class="vezna-post">${aktProcent(v)}</span>
            <span class="vezna-ot">${v ? `имам ${v.imam} от ${v.ot}` : 'чеклистът не казва'}</span>
        </button>`;
    return `
    <div class="vezni">
        ${vezna('За да започна', dve.nachalo, 'nachalo')}
        ${vezna('За да подпиша', dve.podpis, 'podpis')}
    </div>
    <p class="kakvo-mozhe">${_e(aktKakvoMozhe(dve))}</p>`;
}

function momentKoeLipsva(koe) {
    const z = momentZhiv();
    if (!z || !momentGrupa) return;
    const dve = aktDveChisla(momentGrupa, aktNeotnasya(z.p, z.st));
    const v = koe === 'nachalo' ? dve.nachalo : dve.podpis;
    const telo = document.getElementById('moment-kutiya-telo');
    document.getElementById('moment-kutiya').classList.add('otvorena');
    telo.innerHTML = v
        ? `<h2>${_e(momentIme)} · ${koe === 'nachalo' ? 'за да започна' : 'за да подпиша'}</h2>
           <p class="kutiya-chislo">${v.post} % — имам ${v.imam} от ${v.ot}</p>
           <div class="nadpis">Кои са</div>
           <ul class="lipsvat">${momentRedoveZa(koe).map(r => `<li>${_e(r.dokument)}
               <span class="${momentImam(r) ? 'ima' : 'nyama'}">${momentImam(r) ? '✔' : '—'}</span></li>`).join('')}</ul>`
        : `<h2>${_e(momentIme)} · за да започна</h2>
           <p class="prazno">Чеклистът не казва кои редове са за началото — затова
           числото е тире, а не измислена стойност.</p>`;
}

function momentZatvoriKutiya() {
    document.getElementById('moment-kutiya').classList.remove('otvorena');
}

function momentRedove() {
    return (momentGrupa && momentGrupa.dokumenti) || [];
}

function momentRedoveZa(koe) {
    return koe === 'nachalo' ? momentRedove().filter(r => r.etap === 'начало') : momentRedove();
}

function momentImam(r) {
    const z = momentZhiv();
    return r.sastoyanie === 'налично'
        || (z && aktNeotnasya(z.p, z.st).includes(r.dokument));
}

// ── 2. Папката: изброява се, не се чете ──────────────────────────────────────
// „Не се хвърля папка.“ Тук влизат само ИМЕНАТА — нула токени — и до всяко
// пише какво ще струва. Чете се само отметнатото.

function momentPapkaHtml() {
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Папката</div>
        ${aktChetecHtml('momentZaredi()')}
        <p class="poyasnenie">Изброява се, без да се чете нищо. До всеки файл пише дали минава
           през АИ и кой ще го чете. Чете се само отметнатото.</p>
        <input type="file" id="moment-papka-vhod" multiple webkitdirectory
               onchange="momentIzbroi(this.files)" style="display:none">
        <input type="file" id="moment-fajlove-vhod" multiple
               onchange="momentIzbroi(this.files)" style="display:none">
        <div class="redica">
            <button class="bt" onclick="document.getElementById('moment-papka-vhod').click()">избери папка</button>
            <button class="bt" onclick="document.getElementById('moment-fajlove-vhod').click()">избери файлове</button>
            ${momentPapka.length ? `<span class="brojach">${momentPapka.length} файла · отметнати ${
                momentPapka.filter(f => f.otmetnat).length}</span>` : ''}
        </div>
        ${momentPapka.length ? `
            <div class="fajlove">
                ${momentPapka.map((f, i) => `
                    <label class="fajl ${f.cena === 'не се чете' ? 'fajl-ne' : ''}">
                        <input type="checkbox" ${f.otmetnat ? 'checked' : ''}
                               ${f.cena === 'не се чете' ? 'disabled' : ''}
                               onchange="momentOtmetni(${i}, this.checked)">
                        <span class="fajl-ime">${_e(f.ime)}</span>
                        <span class="fajl-cena fajl-cena-${f.cena === 'безплатно' ? 'free'
                            : f.cena === 'през АИ' ? 'ai' : 'ne'}">${_e(f.cena)} · ${_e(f.kak)}${
                            aktKojShteChete(f.cena) ? ' · ' + _e(aktKojShteChete(f.cena)) : ''}</span>
                    </label>`).join('')}
            </div>
            <button class="bt bt-glaven" ${momentPapka.some(f => f.otmetnat) ? '' : 'disabled'}
                    onclick="momentProchetiOtmetnatite()">прочети отметнатите (${
                momentPapka.filter(f => f.otmetnat).length})</button>` : ''}
        <div id="moment-chetene" class="chaka">${momentSaobshtenie}</div>
    </div>`;
}

function momentIzbroi(fajlove) {
    momentPapka = [...(fajlove || [])].map(f => {
        const c = aktCenaNaFajl(f.name);
        return { ime: f.name, fajl: f, cena: c.cena, kak: c.kak, otmetnat: false };
    });
    momentRisuvai();
}

function momentOtmetni(i, da) {
    if (momentPapka[i]) momentPapka[i].otmetnat = !!da;
    momentRisuvai();
}

async function momentProchetiOtmetnatite() {
    const z = momentZhiv();
    if (!z) return;
    const izbrani = momentPapka.filter(f => f.otmetnat);
    const hod = () => document.getElementById('moment-chetene');
    const kazhi = t => { const h = hod(); if (h) h.textContent = t; };
    let prochetenite = 0;
    const razdeleni = [];
    momentSaobshtenie = '';
    for (const f of izbrani) {
        kazhi(`Чета „${f.ime}“…`);
        try {
            const novi = await momentChetiFajl(z, f.fajl, f.ime, kazhi);
            momentPriberiProcheteno(z, novi, f.ime);
            razdeleni.push(momentRazdelyaneHtml(novi.razdelyane));
            prochetenite++;
        } catch (e) {
            momentSaobshtenie = e.izteklo ? aktGreshkaHtml(e) : `❌ „${_e(f.ime)}“: ${_e(e.message)}`;
            const h = hod(); if (h) h.innerHTML = momentSaobshtenie;
            return;
        }
    }
    momentSaobshtenie = `<div>Прочетени ${prochetenite}. Нищо не е влязло без твоето ✔.</div>`
        + razdeleni.join('');
    const h = hod(); if (h) h.innerHTML = momentSaobshtenie;
    momentPapka = momentPapka.filter(f => !f.otmetnat);
    momentZaredi();
}

// ЧЕТЕНЕ НА ЕДИН ФАЙЛ — общо за „Папката“ и за „📎 качи“.
//
// PDF С МНОГО ДОКУМЕНТИ — първо се разделя, после всеки се чете поотделно.
// Така е в старото ПВА (16.09.2026); при местенето на четенето разделянето
// беше изпуснато и 24 акта обр. 7 в един файл излизаха като един. Върнато беше
// само в „Папката“ — „📎 качи“ на реда продължаваше да чете целия файл като
// един документ (Радулов, акт7-1_8.pdf: 8 акта → 1, 09.11.2026).
//
// СИСТЕМАТА КАЗВА КАК Е РАЗДЕЛИЛА. Радулов, 09.11.2026: осем акта по една
// страница излизаха като един и нищо на екрана не казваше, че разделянето е
// видяло един документ. Сега прочетеното носи `razdelyane` — колко страници,
// на колко части, кой е делил — и екранът го показва. `po` > 0 — операторът
// казва „по N страници“ и се реже без АИ.
async function momentChetiFajl(z, fajl, ime, kazhi, po) {
    momentFajlove[ime] = fajl;
    const osnova = { agenda: 'od', pi: z.p.pi,
                     chetec: localStorage.getItem('s2_chetec') || 'auto',
                     fajl: { ime, media_type: fajl.type, data: await momentBase64(fajl) } };
    let chasti = null;
    const razdelyane = { ime, n: 1, chasti: 1, koy: '' };
    if (/\.pdf$/i.test(ime)) {
        kazhi(po ? `„${ime}“ — режа по ${po} стр.…` : `„${ime}“ — разделям на документи…`);
        const rz = await aktApi('/api/sloy2/razdeli', 'POST', { ...osnova, po_stranici: po || 0 });
        if (rz.greshka) throw new Error(rz.greshka);
        razdelyane.n = Number(rz.n) || 1;
        razdelyane.chasti = (rz.chasti || []).length || 1;
        razdelyane.koy = rz.chetec || '';
        if ((rz.chasti || []).length > 1) chasti = rz.chasti;
    }
    if (!chasti) {
        kazhi(`Чета „${ime}“…`);
        const r = await aktApi('/api/sloy2/chete', 'POST', { ...osnova, edin: true });
        if (r.greshka) throw new Error(r.greshka);
        const novi = r.dokumenti || [r.dokument].filter(Boolean);
        novi.razdelyane = razdelyane;
        return novi;
    }
    let novi = [];
    for (let k = 0; k < chasti.length; k++) {
        kazhi(`„${ime}“ — чета документ ${k + 1} от ${chasti.length} (стр. ${chasti[k].stranici})…`);
        const r = await aktApi('/api/sloy2/chete', 'POST',
            { ...osnova, stranici: chasti[k].stranici, edin: true });
        if (r.greshka) throw new Error(`документ ${k + 1} (стр. ${chasti[k].stranici}): ${r.greshka}`);
        novi = novi.concat(r.dokumenti || [r.dokument].filter(Boolean));
    }
    novi.razdelyane = razdelyane;
    return novi;
}

// Как е разделен файлът — с думи. Един документ от много страници не е
// грешка сам по себе си (нотариалният акт е 24 стр.), но трябва да личи.
function momentRazdelyaneHtml(r) {
    if (!r || r.n <= 1) return '';
    const ime = _e(r.ime), k = encodeURIComponent(r.ime);
    if (r.chasti > 1) return `<div class="tiho">„${ime}“ — ${r.n} стр., разделен на
        <strong>${r.chasti} документа</strong>${r.koy ? ' (' + _e(r.koy) + ')' : ''}.</div>`;
    return `<div class="predupr">„${ime}“ има <strong>${r.n} страници</strong>, а четецът го видя
        като <strong>един документ</strong>. Ако са отделни документи, раздели го:
        <button class="bt" onclick="momentRazdeliPo('${k}', 1)">по 1 страница</button>
        <button class="bt bt-tih" onclick="momentRazdeliPo('${k}', 2)">по 2 страници</button></div>`;
}

async function momentRazdeliPo(k, po) {
    const z = momentZhiv();
    const ime = decodeURIComponent(k), fajl = momentFajlove[ime];
    if (!z || !fajl) { alert('Файлът не е тук вече — качи го пак.'); return; }
    const kazhi = t => { momentSaobshtenie = _e(t); const h = document.getElementById('moment-chetene'); if (h) h.textContent = t; };
    try {
        const novi = await momentChetiFajl(z, fajl, ime, kazhi, po);
        momentPriberiProcheteno(z, novi, ime);
        momentSaobshtenie = `<div>„${_e(ime)}“ — прочетени ${novi.length} документа. Сверяват се в Досието.</div>`
            + momentRazdelyaneHtml(novi.razdelyane);
    } catch (e) {
        momentSaobshtenie = e.izteklo ? aktGreshkaHtml(e) : `❌ „${_e(ime)}“: ${_e(e.message)}`;
    }
    momentRisuvai();
}

// Прочетеното е ПРЕДЛОЖЕНИЕ (правило 1): пази се при строежа и чака ✔.
function momentPriberiProcheteno(z, novi, imeFajl) {
    aktVDosieto(z.st, novi, imeFajl);
}

function momentBase64(fajl) {
    return new Promise((da, ne) => {
        const r = new FileReader();
        r.onload = () => da(String(r.result).split(',')[1]);
        r.onerror = ne;
        r.readAsDataURL(fajl);
    });
}

// ── 3. „Липсва ми“ ───────────────────────────────────────────────────────────
// Само липсващото, по един ред, и до всеки три възможности.
// ЕДИН ЖЕСТ ЗАТВАРЯ ЕДИН РЕД — няма „Впиши“ + „Запази“ + „Провери“.

function momentLipsvaHtml(dve) {
    const lipsvat = momentRedove().filter(r => !momentImam(r)
        && r.sastoyanie !== 'не му е времето');
    const neEVremeto = momentRedove().filter(r => r.sastoyanie === 'не му е времето').length;
    if (!lipsvat.length) {
        // „Нищо“ значи нищо, на което МУ Е ВРЕМЕТО. Редовете, чийто ред още не
        // е дошъл, се броят в подписа и затова се казват отделно — иначе
        // екранът би обещавал повече, отколкото знае.
        return `<div class="kutiya-razdel">
            <div class="nadpis">Липсва ми</div>
            <p>Нищо, на което му е времето.${neEVremeto
                ? ` ${neEVremeto} чака${neEVremeto === 1 ? '' : 'т'} реда си.` : ''}</p></div>`;
    }
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Липсва ми · ${lipsvat.length}</div>
        ${lipsvat.map(r => momentLipsvashtRed(r)).join('')}
        ${neEVremeto ? `<p class="poyasnenie">${neEVremeto} още — не им е времето.</p>` : ''}
    </div>`;
}

function momentLipsvashtRed(r) {
    const k = encodeURIComponent(r.dokument);
    const hod = momentHod[r.dokument];
    return `
    <div class="lipsva-red" data-dokument="${_e(r.dokument)}">
        <div class="lipsva-ime">${_e(r.dokument)}
            ${r.uslovie && r.uslovie !== 'винаги'
                ? `<span class="otkade">${_e(r.uslovie)}</span>` : ''}</div>
        <div class="lipsva-zhestove">
            <button class="bt" onclick="momentKachi('${k}')">📎 качи</button>
            <button class="bt" onclick="momentVpishi('${k}')">✍ впиши</button>
            <button class="bt bt-tih" onclick="momentNeSeOtnasya('${k}')">— не се отнася</button>
        </div>
        ${hod ? `<div class="lipsva-hod">${hod}</div>` : ''}
    </div>`;
}

// 📎 качи: избираш файл, четецът го чете, виждаш какво е разбрал, един ✔.
function momentKachi(k) {
    const dokument = decodeURIComponent(k);
    const vhod = document.createElement('input');
    vhod.type = 'file';
    vhod.onchange = () => momentKachiFajl(dokument, vhod.files[0]);
    vhod.click();
}

async function momentKachiFajl(dokument, fajl) {
    const z = momentZhiv();
    if (!z || !fajl) return;
    const c = aktCenaNaFajl(fajl.name);
    if (c.cena === 'не се чете') {
        momentHod[dokument] = `Този файл не се чете: ${c.kak}.`;
        momentRisuvai();
        return;
    }
    momentHod[dokument] = `Чета „${_e(fajl.name)}“…`;
    momentRisuvai();
    try {
        const novi = await momentChetiFajl(z, fajl, fajl.name,
            t => { momentHod[dokument] = _e(t); momentRisuvai(); });
        momentPriberiProcheteno(z, novi, fajl.name);
        momentRazbrano(dokument, novi, fajl.name);
    } catch (e) {
        momentHod[dokument] = e.izteklo ? aktGreshkaHtml(e) : `❌ ${_e(e.message)}`;
        momentRisuvai();
    }
}

// Какво е разбрал четецът — и ЕДИН ✔, който затваря реда. Името на файла е
// само сива подсказка, не данна.
function momentRazbrano(dokument, novi, imeFajl) {
    const d = novi[0] || {};
    const nomer = (d.nomer && d.nomer.stoynost) || '';
    const data = (d.data && d.data.stoynost) || '';
    momentHod[dokument] = `
        <div class="razbrano">
            <div>Прочетох: <strong>${_e(d.vid || aktPodskazkaOtIme(imeFajl))}</strong>
                ${nomer ? ` · № ${_e(nomer)}` : ''}${data ? ` · от ${_e(data)}` : ''}</div>
            ${novi.length > 1 ? `<div>Файлът е разделен на <strong>${novi.length} документа</strong> —
                всеки е отделен ред в Досието, там се сверяват.</div>` : ''}
            ${novi.length <= 1 ? momentRazdelyaneHtml(novi.razdelyane) : ''}
            <div class="otkade">подсказка от името: ${_e(aktPodskazkaOtIme(imeFajl))} — не влиза никъде</div>
            <button class="bt bt-glaven" onclick="momentPotvardi('${encodeURIComponent(dokument)}','${
                encodeURIComponent([nomer && '№ ' + nomer, data && 'от ' + data].filter(Boolean).join(' '))}')">✔ това е</button>
            <button class="bt bt-tih" onclick="momentOtkazhi('${encodeURIComponent(dokument)}')">не е това</button>
        </div>`;
    momentRisuvai();
}

function momentPotvardi(k, nomer64) {
    momentZatvoriRed(decodeURIComponent(k), decodeURIComponent(nomer64 || ''));
}

function momentOtkazhi(k) {
    delete momentHod[decodeURIComponent(k)];
    momentRisuvai();
}

// ✍ впиши: нямаш файл, но документът съществува — номер и дата на ръка.
function momentVpishi(k) {
    const dokument = decodeURIComponent(k);
    const nomer = prompt(`${dokument}\n\nНомер и дата:`, '');
    if (nomer === null) return;
    momentZatvoriRed(dokument, nomer.trim(), 'вписан на ръка');
}

// Един жест затваря реда: отмята се в чеклиста И се вписва в документите на
// строежа. Досега това бяха три жеста и при забравяне вписването изчезваше.
function momentZatvoriRed(dokument, nomer, kak) {
    const z = momentZhiv();
    if (!z) return;
    z.st.nadzor_otmetnati = [...new Set([...(z.st.nadzor_otmetnati || []), dokument])];
    const spisak = (z.st.dokumenti = z.st.dokumenti || []);
    const k = x => String(x || '').trim().toLowerCase();
    const red = spisak.find(d => k(d.ime) === k(dokument));
    if (red) { if (!red.nomer && nomer) red.nomer = nomer; }
    else spisak.push({ ime: dokument, nomer: nomer || '',
                       ot: kak || 'прочетен', koga: new Date().toISOString() });
    delete momentHod[dokument];
    aktZapishi();
    momentZaredi();
}

// — не се отнася: казваш веднъж и редът пада, с датата. Вдига процента.
// И става УРОК за профила на строежа (`js/12c-naucheno.js`), за да не те пита
// пак при следващия строеж със същите съставки.
async function momentNeSeOtnasya(k) {
    const z = momentZhiv();
    if (!z) return;
    const dokument = decodeURIComponent(k);
    z.st.neotnasya = [...new Set([...(z.st.neotnasya || []), dokument])];
    (z.st.neotnasya_koga = z.st.neotnasya_koga || {})[dokument] = new Date().toISOString();
    delete momentHod[dokument];
    aktZapishi();
    momentZaredi();
    if (typeof nauchZapomni === 'function') {
        try { await nauchZapomni(z.p, z.st, dokument); } catch (e) { /* урокът не блокира */ }
        momentZaredi();
    }
}

// Забравяне на урока — за типа строеж, не за обекта.
async function momentZabravi(k) {
    const z = momentZhiv();
    if (!z || typeof nauchZabravi !== 'function') return;
    try { await nauchZabravi(z.p, z.st, decodeURIComponent(k)); } catch (e) { return; }
    momentZaredi();
}

function momentVarni(k) {
    const z = momentZhiv();
    if (!z) return;
    const dokument = decodeURIComponent(k);
    z.st.neotnasya = (z.st.neotnasya || []).filter(x => x !== dokument);
    z.st.nadzor_otmetnati = (z.st.nadzor_otmetnati || []).filter(x => x !== dokument);
    aktZapishi();
    momentZaredi();
}

// ── 4. „Имам“ — сгънато ──────────────────────────────────────────────────────

function momentImamHtml() {
    const z = momentZhiv();
    if (!z) return '';
    const vpisani = z.st.dokumenti || [];
    const nalichni = momentRedove().filter(r => momentImam(r));
    if (!nalichni.length) return '';
    const kade = ime => {
        const v = vpisani.find(d => String(d.ime).toLowerCase() === String(ime).toLowerCase());
        if (v) return [v.nomer, v.ot].filter(Boolean).join(' · ');
        if ((z.st.neotnasya || []).includes(ime))
            return 'не се отнася' + (z.st.neotnasya_koga && z.st.neotnasya_koga[ime]
                ? ' · ' + aktData(z.st.neotnasya_koga[ime]) : '');
        // Научено от друг обект със същите съставки — казва се откъде е.
        const urok = typeof nauchZaRed === 'function' ? nauchZaRed(z.p, z.st, ime) : null;
        if (urok) return 'не се отнася · ' + nauchObyasnenie(urok);
        return 'отметнато';
    };
    return `
    <details class="kutiya-razdel minali">
        <summary>Имам · ${nalichni.length}</summary>
        <ul class="lipsvat">
            ${nalichni.map(r => `<li>${_e(r.dokument)}
                <span class="otkade">${_e(kade(r.dokument))}</span>
                <button class="bt bt-tih" onclick="momentVarni('${encodeURIComponent(r.dokument)}')">върни</button>
            </li>`).join('')}
        </ul>
    </details>`;
}

// ── 5. Остатъкът ─────────────────────────────────────────────────────────────

function momentOstatakHtml(st) {
    const polya = aktOstatak(momentIme);
    const sega = st.ostatak || {};
    return `${momentIme === 'Акт 7' ? momentDnevnikHtml(st) : ''}${momentIme === 'Акт 14' || momentIme === 'Акт 15' ? momentDnevnikRedHtml(st) : ''}
    <div class="kutiya-razdel">
        <div class="nadpis">Това, което само ти знаеш</div>
        <p class="poyasnenie">Системата няма откъде да го вземе. Попълненото влиза направо в текста.</p>
        ${momentIme === 'Протокол 2' ? momentNivaHtml() : ''}
        ${polya.map(f => `
            <label class="ostatak-red">
                <span>${_e(f.ime)}</span>
                <input type="text" class="tarsene" value="${_e(sega[f.klyuch] || '')}"
                       placeholder="${f.data ? 'дд.мм.гггг' : '[___]'}" onchange="momentZapishiOstatak('${_e(f.klyuch)}', this.value)">
            </label>`).join('')}
    </div>`;
}

// ── Заверките на нивата — прочетени от сканираните проверки ──────────────────
// Операторът, 09.11.2026: нивата да се четат от раздел III на Протокол 2 и да
// попълват датите (те отиват в 1.2 на Акт 15). Датите са на ръка — затова
// прочетеното е ПРЕДЛОЖЕНИЕ; влиза само след „Приеми“.
let momentNivaProcheteno = null;
const _NIVA_KLYUCH = { 'изкоп': 'niva_izkop', 'цокъл': 'niva_cokul', 'корниз': 'niva_korniz', 'било': 'niva_bilo' };

function momentNivaHtml() {
    const ch = momentNivaProcheteno;
    return `
        <div class="redica" style="margin:6px 0">
            <input type="file" id="moment-niva-fajl" accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff"
                   onchange="momentNivaCheti()">
            <span class="tiho">прочети заверките на нивата от сканирания Протокол 2</span>
        </div>
        <div id="moment-niva-hod"></div>
        ${ch ? `<div class="kutiya-razdel" style="border-color:var(--gold)">
            <p class="tiho">Прочетено от „${_e(ch.fajl || '')}“ — датите са на ръка, свери ги.</p>
            ${ch.proverki.map((p, i) => `
                <label class="ostatak-red"><span>Ниво ${_e(p.nivo)}${p.kota ? ', кота ' + _e(p.kota) : ''}</span>
                    <input type="text" class="tarsene" value="${_e(p.data || '')}" placeholder="дд.мм.гггг"
                           onchange="momentNivaPoprav(${i}, this.value)"></label>
                ${p.razreshava ? `<p class="otkade" style="margin:0 0 6px">разрешено: ${_e(p.razreshava)}</p>` : ''}`).join('')}
            <div class="redica"><button class="bt bt-glaven" onclick="momentNivaPriemi()">Приеми датите</button>
                <button class="bt bt-tih" onclick="momentNivaOtkazhi()">Откажи</button></div>
        </div>` : ''}`;
}

async function momentNivaCheti() {
    const vhod = document.getElementById('moment-niva-fajl');
    const hod = document.getElementById('moment-niva-hod');
    const f = vhod && vhod.files && vhod.files[0];
    if (!f) return;
    hod.innerHTML = `<p class="tiho">Чета „${_e(f.name)}“…</p>`;
    try {
        const r = await aktApi('/api/p2/niva/chete', 'POST', {
            fajl: { ime: f.name, media_type: f.type, data: await fileToBase64(f) } });
        if (r.greshka) { hod.innerHTML = `<p class="greshka">⚠ ${_e(r.greshka)}</p>`; return; }
        momentNivaProcheteno = r.niva;
        momentRisuvai();
    } catch (e) {
        hod.innerHTML = `<p class="greshka">✗ ${_e(e.message)}</p>`;
    }
}

function momentNivaPoprav(i, v) {
    if (momentNivaProcheteno) momentNivaProcheteno.proverki[i].data = String(v || '').trim();
}

function momentNivaOtkazhi() { momentNivaProcheteno = null; momentRisuvai(); }

function momentNivaPriemi() {
    const z = momentZhiv(); const ch = momentNivaProcheteno;
    if (!z || !ch) return;
    const o = (z.st.ostatak = z.st.ostatak || {});
    for (const p of ch.proverki) {
        const k = _NIVA_KLYUCH[p.nivo];
        if (!k || !p.data) continue;
        o[k] = p.data;
        if (p.kota) o[k + '_kota'] = p.kota;
    }
    momentNivaProcheteno = null;
    aktZapishi();
    momentRisuvai();
}

// ── Бетоновият дневник → актовете обр. 7 ─────────────────────────────────────
// Операторът, 09–10.11.2026: актовете обр. 7 се съставят по бетоновия дневник,
// по един на бетониране; актът е ПРЕДИ бетона (кофраж и армировка се приемат,
// бетонирането се разрешава). Дневникът — скан (с АИ) или xlsx (с код).
// Всички актове — в ЕДИН файл.
//
// ТАБЛИЦА, не картички (операторът, 10.11.2026: „ако имаме 50–60 нива, няма ли
// да е по-удобна таблица“). Ред на бетониране; поправя се в клетката.
//
// „ПОДПИСАН“ е твърдение на оператора — като вписаното на ръка. Системата не
// доказва подпис (вж. „Съставен ≠ подписан“); операторът гледа хартията и
// казва. Подписаният ред се заключва и влиза в 1.3 на Акт 15 (`dokTetradka`).
// Сканът бие: прочетен акт обр. 7 със същата дата не се дублира.
//
// НОВО ЧЕТЕНЕ ДОБАВЯ, не заменя: дневникът расте, а подписаното и поправеното
// не бива да изчезнат. Редът се познава по бетонирането (дата + елемент);
// махнатото се помни, за да не се върне.

function _dnKlyuch(a) {
    return String(a.data_beton || '').trim() + '|'
         + String(a.element || '').toLowerCase().replace(/[\s.,]+/g, '');
}

function _dnBetonRed(a) {
    const m = String(a.data_beton || '').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    return m ? m[3] + m[2].padStart(2, '0') + m[1].padStart(2, '0') : '99999999';
}

// Прочетеното → таблицата. Старото остава; новото се добавя по ред на бетона.
function momentDnevnikSlei(staro, novi) {
    if (!staro) return { aktove: novi.map(a => ({ ...a, klyuchove: [_dnKlyuch(a)] })), mahnati: [], dobaveni: novi.length };
    const imame = new Set([...(staro.mahnati || []),
                           ...staro.aktove.flatMap(a => a.klyuchove || [_dnKlyuch(a)])]);
    const dobaveni = novi.filter(a => !imame.has(_dnKlyuch(a)))
                         .map(a => ({ ...a, klyuchove: [_dnKlyuch(a)] }));
    const aktove = [...staro.aktove, ...dobaveni]
        .map((a, i) => [a, i])
        .sort((x, y) => _dnBetonRed(x[0]).localeCompare(_dnBetonRed(y[0])) || x[1] - y[1])
        .map(x => x[0]);
    return { aktove, mahnati: staro.mahnati || [], dobaveni: dobaveni.length };
}

function momentDnevnikHtml(st) {
    const dn = st.akt7_dnevnik;
    const aktove = (dn && dn.aktove) || [];
    const podpisani = aktove.filter(a => a.podpisan).length;
    const kl = (i, pole, a, shir) => `<td><input type="text" value="${_e(a[pole] || '')}" ${a.podpisan ? 'disabled' : ''}
        ${pole === 'data' ? 'placeholder="дд.мм.гггг"' : ''} style="width:100%;min-width:${shir}"
        onchange="momentDnevnikPoprav(${i}, '${pole}', this.value)"></td>`;
    const red = (a, i) => `
        <tr class="${a.podpisan ? 'dn-podpisan' : ''}">
            <td><input type="checkbox" ${a.podpisan ? 'checked' : ''} title="подписан"
                       onchange="momentDnevnikPodpisan(${i}, this.checked)"></td>
            ${kl(i, 'data', a, '88px')}${kl(i, 'ot', a, '56px')}${kl(i, 'do', a, '56px')}
            <td><textarea rows="1" ${a.podpisan ? 'disabled' : ''} style="width:100%;min-width:220px"
                    onchange="momentDnevnikPoprav(${i}, 'smr', this.value)">${_e(a.smr || '')}</textarea></td>
            <td class="tiho">${_e(a.data_beton || '')}</td>
            <td style="white-space:nowrap">${a.podpisan ? '' : `
                ${i < aktove.length - 1 && !aktove[i + 1].podpisan
                    ? `<button class="bt bt-tih" title="слей със следващия" onclick="momentDnevnikSleiRed(${i})">⊕</button>` : ''}
                <button class="bt bt-tih" title="махни" onclick="momentDnevnikMahni(${i})">✕</button>`}</td>
        </tr>
        <tr class="dn-izvor"><td></td><td colspan="6" class="otkade">дневник${a.stranica ? ', стр. ' + _e(a.stranica) : ''}: „${
            _e(a.element || '')}“${a.obem ? ' · ' + _e(a.obem) + ' м³' : ''}${
            a.belezhka ? ` · <strong>${_e(a.belezhka)}</strong>` : ''}</td></tr>`;
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Бетоновият дневник → актове обр. 7</div>
        <p class="poyasnenie">По един акт на бетониране. Датата на акта е предложена ден
           преди бетона — провери я. ✔ „подписан“ значи, че актът е подписан такъв, какъвто
           е в реда — тогава влиза в 1.3 на Акт 15. Прочетен скан със същата дата бие реда.</p>
        <div class="redica" style="margin:6px 0">
            <input type="file" id="moment-dnevnik-fajl" accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.xlsx"
                   onchange="momentDnevnikCheti()">
            <span class="tiho">${dn ? 'прочети дневника пак — добавят се само новите бетонирания'
                                    : 'качи дневника (скан или .xlsx)'}</span>
        </div>
        <div id="moment-dnevnik-hod">${dn && dn.saobshtenie ? dn.saobshtenie : ''}</div>
        ${dn ? `<p class="tiho">„${_e(dn.fajl || '')}“ · чел го е ${_e(dn.chetec || '')}${
            dn.zapochnat ? ' · започнат на ' + _e(dn.zapochnat) : ''} · <strong>${aktove.length} акта,
            ${podpisani} подписани</strong></p>
            <div style="overflow-x:auto">
            <table class="sverka dn-tablica">
                <tr><th><input type="checkbox" title="всички са подписани" ${aktove.length && podpisani === aktove.length ? 'checked' : ''}
                               onchange="momentDnevnikVsichki(this.checked)"></th>
                    <th>Акт от</th><th>от ниво</th><th>до ниво</th><th>Изпълнени СМР</th><th>бетон</th><th></th></tr>
                ${aktove.map(red).join('')}
            </table></div>
            <div class="redica">
                <button class="bt bt-tih" onclick="momentDnevnikDobavi()">+ акт на ръка</button>
                <button class="bt bt-glaven" ${aktove.length ? '' : 'disabled'}
                        onclick="momentDnevnikSastavi()">Състави всички (${aktove.length}) в един файл</button>
            </div>` : ''}
    </div>`;
}

async function momentDnevnikCheti() {
    const z = momentZhiv();
    const vhod = document.getElementById('moment-dnevnik-fajl');
    const hod = document.getElementById('moment-dnevnik-hod');
    const f = vhod && vhod.files && vhod.files[0];
    if (!z || !f) return;
    hod.innerHTML = `<p class="tiho">Чета „${_e(f.name)}“…</p>`;
    try {
        const r = await aktApi('/api/beton/dnevnik/chete', 'POST', {
            chetec: localStorage.getItem('s2_chetec') || 'auto',
            fajl: { ime: f.name, media_type: f.type, data: await fileToBase64(f) } });
        if (r.greshka) { hod.innerHTML = `<p class="greshka">⚠ ${_e(r.greshka)}</p>`; return; }
        const dn = r.dnevnik || {};
        const staro = z.st.akt7_dnevnik;
        const s = momentDnevnikSlei(staro, dn.predlozhenie || []);
        z.st.akt7_dnevnik = {
            fajl: dn.fajl || f.name, chetec: dn.chetec || '',
            zapochnat: dn.zapochnat || (staro && staro.zapochnat) || '',
            koga: new Date().toISOString(), aktove: s.aktove, mahnati: s.mahnati,
            saobshtenie: staro ? `<p class="tiho">Добавени ${s.dobaveni} нови бетонирания;
                останалите вече са в таблицата и не са пипани.</p>` : '',
        };
        // Прочетеното влиза и в досието — като документ, който е там.
        aktVDosieto(z.st, [{ id: f.name, fajl: f.name, vid: 'Дневник на бетоновите работи',
                             vid_kod: 'DRUGO', chetec: dn.chetec || '', sken: !/\.xlsx$/i.test(f.name),
                             data: { stoynost: dn.zapochnat || '' } }], f.name);
        momentRisuvai();
    } catch (e) {
        hod.innerHTML = e.izteklo ? aktGreshkaHtml(e) : `<p class="greshka">✗ ${_e(e.message)}</p>`;
    }
}

function _momentDnevnik() {
    const z = momentZhiv();
    return z && z.st.akt7_dnevnik ? z.st.akt7_dnevnik : null;
}

function _momentDnevnikPromyana(risuvai) {
    const dn = _momentDnevnik();
    if (dn) dn.saobshtenie = '';
    aktZapishi();
    if (risuvai) momentRisuvai();
}

function momentDnevnikPoprav(i, pole, v) {
    const dn = _momentDnevnik();
    if (!dn || !dn.aktove[i] || dn.aktove[i].podpisan) return;
    dn.aktove[i][pole] = String(v || '').trim();
    _momentDnevnikPromyana(false);
}

function momentDnevnikPodpisan(i, da) {
    const dn = _momentDnevnik();
    if (!dn || !dn.aktove[i]) return;
    dn.aktove[i].podpisan = !!da;
    _momentDnevnikPromyana(true);
}

function momentDnevnikVsichki(da) {
    const dn = _momentDnevnik();
    if (!dn) return;
    dn.aktove.forEach(a => { a.podpisan = !!da; });
    _momentDnevnikPromyana(true);
}

// Две бетонирания, приети с един акт: СМР-то се събира, нивата обхващат и
// двете, датата е на по-ранния.
function momentDnevnikSleiRed(i) {
    const dn = _momentDnevnik();
    if (!dn || !dn.aktove[i + 1] || dn.aktove[i].podpisan || dn.aktove[i + 1].podpisan) return;
    const a = dn.aktove[i], b = dn.aktove[i + 1];
    dn.aktove.splice(i, 2, {
        ...a,
        element: [a.element, b.element].filter(Boolean).join('; '),
        data_beton: [a.data_beton, b.data_beton].filter(Boolean).join(', '),
        do: b.do || a.do,
        smr: [a.smr, String(b.smr || '').replace(/^Кофраж и армировка на\s+/i, '')].filter(Boolean).join('; '),
        belezhka: 'слети два реда от дневника',
        klyuchove: [...(a.klyuchove || [_dnKlyuch(a)]), ...(b.klyuchove || [_dnKlyuch(b)])],
    });
    _momentDnevnikPromyana(true);
}

function momentDnevnikMahni(i) {
    const dn = _momentDnevnik();
    if (!dn || !dn.aktove[i] || dn.aktove[i].podpisan) return;
    const [a] = dn.aktove.splice(i, 1);
    dn.mahnati = [...(dn.mahnati || []), ...(a.klyuchove || [_dnKlyuch(a)])];
    _momentDnevnikPromyana(true);
}

function momentDnevnikDobavi() {
    const dn = _momentDnevnik();
    if (!dn) return;
    dn.aktove.push({ element: '', data: '', ot: '', do: '', smr: 'Кофраж и армировка на ',
                     razreshava: 'Бетониране на гореописаните елементи.', belezhka: 'вписан на ръка',
                     klyuchove: ['ръка|' + Date.now()] });
    _momentDnevnikPromyana(true);
}

async function momentDnevnikSastavi() {
    const z = momentZhiv(), dn = _momentDnevnik();
    const hod = document.getElementById('moment-dnevnik-hod');
    if (!z || !dn || !dn.aktove.length) return;
    const konsultant = (aktDanni.consultants || []).find(c => c.id == ((z.st && z.st.consultant) || z.p.consultant || {}).id);
    if (!konsultant) { hod.innerHTML = '<p class="greshka">Няма избран консултант в паспорта.</p>'; return; }
    hod.innerHTML = `<p class="tiho">Съставям ${dn.aktove.length} акта…</p>`;
    try {
        const { sadarzhanie } = await genDokument(aktZaDokument(z.p, z.st), konsultant, 'akt7', {
            akt7_seriya: dn.aktove.map(a => ({ data: a.data, ot: a.ot, do: a.do, smr: a.smr, razreshava: a.razreshava })),
        });
        genSvali(`akt7_vsichki_${z.p.pi}.docx`, sadarzhanie);
        genZapishi(z.st, [{ type: `Акт 7 — ${dn.aktove.length} акта`, date: new Date().toISOString(), url: '', path: '' }]);
        aktZapishi();
        hod.innerHTML = `<p class="gotov">✔ ${dn.aktove.length} акта в един файл — свален.</p>`;
    } catch (e) {
        hod.innerHTML = e.izteklo ? aktGreshkaHtml(e) : `<p class="greshka">✗ ${_e(e.message)}</p>`;
    }
}

// Редът в Акт 14 и Акт 15: колко съставени, колко подписани — и връзка.
function momentDnevnikRedHtml(st) {
    const a = ((st && st.akt7_dnevnik) || {}).aktove || [];
    if (!a.length) return '';
    const p = a.filter(x => x.podpisan).length;
    return `<div class="kutiya-razdel"><p class="${p < a.length ? 'predupr' : 'tiho'}">Актове обр. 7 от дневника:
        ${a.length} съставени, ${p} подписани${p < a.length ? `, <strong>${a.length - p} чакат</strong>` : ''} —
        <a href="#/moment/${encodeURIComponent(momentId)}/${momentIndeks}/${encodeURIComponent('Акт 7')}">към Акт 7</a></p></div>`;
}

function momentZapishiOstatak(klyuch, stoynost) {
    const z = momentZhiv();
    if (!z) return;
    (z.st.ostatak = z.st.ostatak || {})[klyuch] = String(stoynost || '').trim();
    aktZapishi();
}

// ── 6. „Съставѝ документа“ ───────────────────────────────────────────────────
// Бутонът е активен според правилото на момента. Не е ли — пише защо.
// Решението е твое; системата само казва какво знае.

function momentSastaviHtml(dve) {
    const pr = aktPraviloNaMomenta(dve);
    return `
    <div class="kutiya-razdel sastavi">
        <button class="bt bt-glaven bt-golyam" ${pr.mozhe ? '' : 'disabled'}
                onclick="momentSastavi()">Съставѝ документа</button>
        <p class="${pr.mozhe ? 'poyasnenie' : 'zashto-ne'}">${_e(pr.zashto)}</p>
    </div>`;
}

// Съставянето си остава в кухнята — шаблоните, подписите и сглобяването на
// паспорта живеят там и не се преписват тук. Екран 3 решава ДАЛИ може и
// отпраща. (Екранът не се кърпи — само се ползва.)
// Дотук този бутон просто те изхвърляше в старото ПВА: „Съставѝ документа“
// значеше „иди другаде“. От 04.11.2026 документът се съставя тук.
function momentSastavi() {
    const z = momentZhiv();
    if (!z) return;
    // Акт 7 с прочетен дневник — актовете са в таблицата, не един празен акт.
    if (momentIme === 'Акт 7' && z.st.akt7_dnevnik && (z.st.akt7_dnevnik.aktove || []).length)
        return momentDnevnikSastavi();
    z.st.tekusht_moment = momentIme;
    aktZapishi();
    location.hash = `#/dokumenti/${encodeURIComponent(momentId)}/${momentIndeks}/${encodeURIComponent(momentIme)}`;
}
