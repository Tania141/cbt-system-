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

function momentOtvori(id, i, ime) {
    momentId = id;
    momentIndeks = Number(i || 0);
    momentIme = ime || '';
    momentGrupa = null;
    momentPapka = [];
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
        <div id="moment-chetene" class="chaka"></div>
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
    const hod = document.getElementById('moment-chetene');
    let prochetenite = 0;
    for (const f of izbrani) {
        if (hod) hod.textContent = `Чета „${f.ime}“…`;
        try {
            const r = await aktApi('/api/sloy2/chete', 'POST', {
                agenda: 'od', pi: z.p.pi, edin: true,
                chetec: localStorage.getItem('s2_chetec') || 'auto',
                fajl: { ime: f.ime, media_type: f.fajl.type, data: await momentBase64(f.fajl) },
            });
            if (r.greshka) throw new Error(r.greshka);
            momentPriberiProcheteno(z, r.dokumenti || [r.dokument].filter(Boolean), f.ime);
            prochetenite++;
        } catch (e) {
            if (hod) hod.innerHTML = e.izteklo ? aktGreshkaHtml(e)
                : `❌ „${_e(f.ime)}“: ${_e(e.message)}`;
            return;
        }
    }
    if (hod) hod.textContent = `Прочетени ${prochetenite}. Нищо не е влязло без твоето ✔.`;
    momentPapka = momentPapka.filter(f => !f.otmetnat);
    momentZaredi();
}

// Прочетеното е ПРЕДЛОЖЕНИЕ (правило 1): пази се при строежа и чака ✔.
function momentPriberiProcheteno(z, novi, imeFajl) {
    const s2 = ((z.st.sloy2 = z.st.sloy2 || {}).od = z.st.sloy2.od || { dokumenti: [] });
    s2.dokumenti = s2.dokumenti.filter(x => x.fajl !== imeFajl).concat(novi);
    s2.koga = new Date().toISOString();
    aktZapishi();
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
        const r = await aktApi('/api/sloy2/chete', 'POST', {
            agenda: 'od', pi: z.p.pi, edin: true,
            chetec: localStorage.getItem('s2_chetec') || 'auto',
            fajl: { ime: fajl.name, media_type: fajl.type, data: await momentBase64(fajl) },
        });
        if (r.greshka) throw new Error(r.greshka);
        const novi = r.dokumenti || [r.dokument].filter(Boolean);
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
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Това, което само ти знаеш</div>
        <p class="poyasnenie">Системата няма откъде да го вземе. Попълненото влиза направо в текста.</p>
        ${polya.map(f => `
            <label class="ostatak-red">
                <span>${_e(f.ime)}</span>
                <input type="text" class="tarsene" value="${_e(sega[f.klyuch] || '')}"
                       placeholder="[___]" onchange="momentZapishiOstatak('${_e(f.klyuch)}', this.value)">
            </label>`).join('')}
    </div>`;
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
function momentSastavi() {
    const z = momentZhiv();
    if (!z) return;
    z.st.tekusht_moment = momentIme;
    aktZapishi();
    location.href = '../index.html';
}
