// АКТ СИСТЕМ · новото ПВА · moment.js
// ЕКРАН 3. МОМЕНТЪТ — тук се готви
//
// „Това е сърцето. 90 % от работата става тук.“ (ЗАДАНИЕ.md)
//
// В три колони (кройката от 17–18.11.2026). Лявата е свита винаги — работният
// екран е еднакво голям за всеки момент. Горе — изворите, само като връзки
// (състоянието им тук е в „Липсва ми“). Лента с моментите НЯМА.
// Средата, отгоре надолу:
//   „Липсва ми“ — по ред, с три възможности; ЕДИН ЖЕСТ ЗАТВАРЯ ЕДИН РЕД;
//   „Имам“ — сгънато;
//   остатъкът — онова, което системата не може да знае;
//   „Съставѝ документа“ — активен според правилото на момента; моментът,
//   който се ПОЛУЧАВА (РС, Акт 16), няма „Съставѝ“;
//   папката — изброява се, без да се чете (най-долу).
// Дясната: обектът, документът и долу ДВАТА КРЪГА — „Какво знаем“ е зад тях,
// клик на кръга казва кои са редовете.
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
// Имената на моментите, които чеклистът казва за този строеж — за „към … →“.
let momentImena = [];
// Кой от трите е отворен: „Липсва ми“ · „Имам“ · „Чака проверка“ (24.11.2026).
let momentRazdel = 'lipsva';

function momentOtvori(id, i, ime) {
    momentId = id;
    momentIndeks = Number(i || 0);
    momentIme = ime || '';
    momentGrupa = null;
    momentPapka = [];
    momentSaobshtenie = '';
    momentFajlove = {};
    momentHod = {};
    momentRazdel = 'lipsva';
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
        // Речникът се учи сам най-много веднъж на ден (`akt/rechnik.js`).
        if (typeof rechnikUchi === 'function') rechnikUchi().then(n => { if (n) momentZaredi(); });
        const r = await aktNadzor(z.p, z.st);
        if (r.greshka) throw new Error(r.greshka);
        momentGrupa = (r.grupi || []).find(g => g.moment === momentIme)
                   || { moment: momentIme, dokumenti: [] };
        momentImena = (r.red && r.red.length ? r.red : (r.grupi || []).map(g => g.moment)).filter(Boolean);
    } catch (e) {
        momentGrupa = { greshka: e.message };
    }
    momentRisuvai();
}

function momentRisuvai() {
    const z = momentZhiv();
    if (!z) return;
    const kutiya = document.getElementById('moment-telo');
    if (!momentGrupa || momentGrupa.greshka) {
        // Изворите и обектът вдясно са верни и без чеклиста; кръговете — не.
        momentDyasno(z, null);
        kutiya.innerHTML = !momentGrupa ? '<div class="chaka">Питам чеклиста…</div>'
            : aktGreshkaHtml(momentGrupa.greshka, 'Чеклистът не отговори');
        return;
    }
    const dve = aktDveChisla(momentGrupa, aktNeotnasya(z.p, z.st));
    momentSverkaPresmetni(z);
    // Повтарящият се момент (Акт 7) — таблицата по бетоновия дневник е горе;
    // тя носи и своя „Съставѝ избраните“, затова общият бутон не се дублира.
    const tabl7 = momentIme === 'Акт 7';
    const imaDn = tabl7 && ((z.st.akt7_dnevnik || {}).aktove || []).length;
    kutiya.innerHTML =
        (tabl7 ? momentDnevnikHtml(z.st) : '')
        + (typeof podobniVrazkaHtml === 'function' ? podobniVrazkaHtml(z) : '')
        + momentRazdeliHtml(z, dve)
        + momentOstatakHtml(z.st)
        + (imaDn ? '' : momentSastaviHtml(dve))
        + momentPapkaHtml();
    momentDyasno(z, dve);
}

// ── Превключвателят: Липсва ми · Имам · Чака проверка (24.11.2026) ────────────
// Операторът: двата бутона, отворен е единият, и там се работи. Важи за всеки
// момент. „Чака проверка“ излиза само когато има прочетено, което чака.
// Разминаването от сверката личи и върху затворения бутон.
function momentRazdeliHtml(z, dve) {
    const lipsvatVsichki = momentRedove().filter(r => !momentImam(r) && r.sastoyanie !== 'не му е времето');
    const lipsvat = lipsvatVsichki.filter(r => !r.izvan_podobniya);
    const zaSv = lipsvatVsichki.length - lipsvat.length;
    const imam = momentRedove().filter(r => momentImam(r));
    const chakat = aktChakat(z.st);
    if (momentRazdel === 'chakat' && !chakat.length) momentRazdel = 'lipsva';
    const sv = momentSverka || { pisheNeBroi: [], broiNePishe: [] };
    const cherveno = n => n ? ` <span class="razdel-cherveno-broy">· ${n} ${n === 1 ? 'не влиза' : 'не влизат'} в акта</span>` : '';
    const lipsvaSv = sv.pisheNeBroi.filter(x => lipsvat.some(r => r.dokument === x.red)).length;
    const buton = (kod, tekst, klas) => `<button class="razdel-bt ${klas || ''} ${momentRazdel === kod ? 'razdel-bt-otvoren' : ''}"
        onclick="momentOtvoriRazdel('${kod}')">${tekst}</button>`;
    const sadarzhanie = momentRazdel === 'imam' ? momentImamHtml()
        : momentRazdel === 'chakat' ? momentChakatHtml(z)
        : momentLipsvaHtml(dve);
    return `
    <div class="razdeli-prevkl">
        ${buton('lipsva', `Липсва ми · ${lipsvat.length}${zaSv ? ` <span class="razdel-sivo-broy">· ${zaSv} по стария списък</span>` : ''}${lipsvaSv
            ? ` <span class="razdel-cherveno-broy">· ${lipsvaSv} актът вече ${lipsvaSv === 1 ? 'го изрежда' : 'ги изрежда'}</span>` : ''}`)}
        ${buton('imam', `Имам · ${imam.length}${cherveno(sv.broiNePishe.length)}`)}
        ${chakat.length ? buton('chakat', `Чака проверка · ${chakat.length}`, 'razdel-bt-zlato') : ''}
    </div>
    ${sadarzhanie}`;
}

function momentOtvoriRazdel(kod) {
    momentRazdel = kod;
    momentRisuvai();
}

// ── Трите вида моменти ───────────────────────────────────────────────────────
// Съставя се (Липсва ми → Съставѝ) · повтаря се (Акт 7–12 — таблицата) ·
// получава се (РС, Акт 16 — качи/впиши, без Съставѝ). (Решено 18.11.2026.)
const MOMENT_POLUCHAVA = ['РС', 'Разрешение за строеж', 'Акт 16'];
function aktVidMoment(ime) {
    if (MOMENT_POLUCHAVA.includes(ime)) return 'poluchava';
    if (/^Акт (7|8|9|10|11|12)\b/.test(ime || '')) return 'povtarya';
    return 'sastavya';
}
const MOMENT_VID_IME = { sastavya: 'съставя се', povtarya: 'повтаря се', poluchava: 'получава се' };

// Горе, над заглавието: изворите като връзки и видът на момента.
function momentGoreHtml(z) {
    const vid = aktVidMoment(momentIme);
    return (typeof aktIzvoriHtml === 'function' ? aktIzvoriHtml(z.p, z.st, momentIndeks, 'vrazki') : '')
        + `<div class="moment-vid moment-vid-${vid}">${MOMENT_VID_IME[vid]}</div>`;
}

// Дясната колона: обектът (само показва), документът, двата кръга.
function momentDyasno(z, dve) {
    const d = document.getElementById('dyasna');
    const gore = document.getElementById('moment-gore');
    if (gore) gore.innerHTML = momentGoreHtml(z);
    if (!d) return;
    const dn7 = momentIme === 'Акт 7' ? momentDnSastoyaniya(z) : null;
    d.innerHTML = aktDyasnoHtml(z.p, z.st, momentIndeks)
        + momentDokumentHtml(z)
        + (dn7 && dn7.length ? `<div class="d-dolu">${momentKrugove7(dn7)}</div>`
           : dve ? `<div class="d-dolu">${momentVezniHtml(dve)}</div>` : '');
}

// Документът: само онова, което историята казва. Не намери ли генериране —
// казва точно това, не „не е съставян“.
function momentDokumentHtml(z) {
    const vid = aktVidMoment(momentIme);
    const nomer = (String(momentIme).match(/\d+/) || [''])[0];
    const gen = (aktDanni.history || []).find(h => h.type === 'generate' && h.pi === z.p.pi
        && (String(h.detail || '').includes(momentIme)
            || (nomer && new RegExp('обр\\.?\\s*' + nomer + '\\b').test(String(h.detail || '')))));
    return `
        <div class="d-blok">
            <div class="d-etiket">Документът</div>
            <div class="dan-s">${vid === 'poluchava' ? 'получава се от органа — не се съставя тук'
                : gen ? `генериран на ${_e(aktData(gen.date))}` : 'в историята няма генериран'}</div>
            ${gen ? `<div class="dan-o">история · ${_e(gen.detail)}</div>` : ''}
        </div>`;
}

// ── 1. Двете везни ───────────────────────────────────────────────────────────

// Двата кръга — долу вдясно. Клик на кръга отваря „Какво знаем“ за това число:
// кои са редовете и кой го има. Кръгът е бутон, процентът е от чеклиста.
function momentVezniHtml(dve) {
    const C = 2 * Math.PI * 30;
    const vezna = (ime, v, koe) => {
        const post = v ? v.post : 0;
        const cvyat = v === null ? 'var(--sivo)' : post === 100 ? 'var(--green)' : 'var(--gold)';
        return `
        <button type="button" class="vezna krug vezna-${v === null ? 'nyama' : post === 100 ? 'pylno' : 'chastichno'}"
                onclick="momentKoeLipsva('${koe}')" title="Какво знаем — кои са редовете">
            <svg viewBox="0 0 76 76" aria-hidden="true">
                <circle cx="38" cy="38" r="30" fill="none" stroke="#a7b5b6" stroke-width="7"/>
                ${v ? `<circle cx="38" cy="38" r="30" fill="none" stroke="${cvyat}" stroke-width="7" stroke-linecap="round"
                        stroke-dasharray="${(C * post / 100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 38 38)"/>` : ''}
            </svg>
            <span class="vezna-post">${aktProcent(v)}</span>
            <span class="vezna-ime">${ime}</span>
            <span class="vezna-ot">${v ? `имам ${v.imam} от ${v.ot}` : 'чеклистът не казва'}</span>
        </button>`;
    };
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
            momentRazdel = 'chakat';
            razdeleni.push(momentRazdelyaneHtml(novi.razdelyane));
            prochetenite++;
        } catch (e) {
            momentSaobshtenie = e.izteklo ? aktGreshkaHtml(e) : `❌ „${_e(f.ime)}“: ${_e(e.message)}`;
            const h = hod(); if (h) h.innerHTML = momentSaobshtenie;
            return;
        }
    }
    momentSaobshtenie = `<div>Прочетени ${prochetenite}. Чакат проверка тук — в досието нищо не е влязло без твоето ✔.</div>`
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
        await momentNivaOtProcheten(z, osnova, novi.map(d => [d, null]), kazhi);
        return novi;
    }
    let novi = [];
    const sStranici = [];
    for (let k = 0; k < chasti.length; k++) {
        kazhi(`„${ime}“ — чета документ ${k + 1} от ${chasti.length} (стр. ${chasti[k].stranici})…`);
        const r = await aktApi('/api/sloy2/chete', 'POST',
            { ...osnova, stranici: chasti[k].stranici, edin: true });
        if (r.greshka) throw new Error(`документ ${k + 1} (стр. ${chasti[k].stranici}): ${r.greshka}`);
        const tezi = r.dokumenti || [r.dokument].filter(Boolean);
        tezi.forEach(d => sStranici.push([d, chasti[k].stranici]));
        novi = novi.concat(tezi);
    }
    novi.razdelyane = razdelyane;
    await momentNivaOtProcheten(z, osnova, sStranici, kazhi);
    return novi;
}

// ПРОТОКОЛ 2 ОТ ДОСИЕТО — И НИВАТА (26.11.2026).
// Операторът качи подписания Протокол 2 на Радулов; общият четец взе шапката
// (дата, участници, РС) и мълчеше за раздел III. Четецът на нивата беше вързан
// само за полето в Протокол 2. Сега: прочетен ли е Протокол 2, със същия файл
// (и същите страници) се пуска и четецът на нивата; прочетеното чака в
// Протокол 2 — „Приеми датите“ — и казва от кой файл е. Не се вписва само.
const _M_P2 = /откриване\s+на\s+строителна\s+площадка/i;
function momentEP2(d) {
    const t = v => String((v && typeof v === 'object' ? v.stoynost : v) || '');
    return d && (d.vid_kod === 'PROTOKOL2' || _M_P2.test(t(d.vid)) || _M_P2.test(t(d.naimenovanie)));
}
async function momentNivaOtProcheten(z, osnova, dvoiki, kazhi) {
    const p2 = (dvoiki || []).find(([d]) => momentEP2(d));
    if (!p2) return;
    if (kazhi) kazhi(`„${osnova.fajl.ime}“ е Протокол 2 — чета и заверките на нивата…`);
    try {
        const r = await aktApi('/api/p2/niva/chete', 'POST',
            { fajl: osnova.fajl, chetec: osnova.chetec, ...(p2[1] ? { stranici: p2[1] } : {}) });
        z.st.niva_predlozhenie = r.greshka
            ? { fajl: osnova.fajl.ime, proverki: [], greshka: r.greshka }
            : { ...r.niva, fajl: osnova.fajl.ime, ot_dosie: true };
    } catch (e) {
        z.st.niva_predlozhenie = { fajl: osnova.fajl.ime, proverki: [], greshka: e.message };
    }
    aktZapishi();
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
        momentRazdel = 'chakat';
        momentSaobshtenie = `<div>„${_e(ime)}“ — прочетени ${novi.length} документа. Чакат проверка тук.</div>`
            + momentRazdelyaneHtml(novi.razdelyane);
    } catch (e) {
        momentSaobshtenie = e.izteklo ? aktGreshkaHtml(e) : `❌ „${_e(ime)}“: ${_e(e.message)}`;
    }
    momentRisuvai();
}

// Прочетеното е ПРЕДЛОЖЕНИЕ (правило 1): пази се при строежа и чака ✔ —
// ТУК, в момента. В досието влиза едва с „✔ запиши“ (18.11.2026).
function momentPriberiProcheteno(z, novi, imeFajl, zaRed) {
    aktKamChakashti(z.st, novi, imeFajl, zaRed);
}

// ── Прочетеното — чака проверка ──────────────────────────────────────────────
// Под реда, за който е качено; прочетеното от папката — в свой блок горе.
// Фактите са същите като в досието (`_s2Fakti`), с ✔ и поправка в полето.

const _mId = d => d.id || d.fajl;

function momentChakatHtml(z) {
    const chakat = aktChakat(z.st);
    if (!chakat.length) return '';
    return `
    <div class="kutiya-razdel razdel-telo chakat-proverka">
        <p class="poyasnenie">Нищо от тук не е в досието. Свери с хартията и „✔ запиши“.</p>
        ${chakat.map(d => momentChakashtHtml(z, d)).join('')}
    </div>`;
}

// КАРТАТА — ЕДИН РЕД (26.11.2026). Заданието (ЗАДАНИЕ-ЕДИН-ЗАПИС, обсъдено 25.11):
// документът става един ред, както ще влезе в акта — едно поле за поправка и
// един „✔ вярно е“. Номерът и датата се взимат от реда и се показват дребно;
// не се намерят ли — казва се. УПИ, адрес, възложител — един ред за проверка.
// Слепени два документа — „да ги разделя?“. Отделните полета — свити в
// „подробно“, за редките случаи. Операторът, 26.11: „това също не е поправено“.
const _M_REDNI = ['naimenovanie', 'nomer', 'data', 'material', 'proizvoditel', 'izdatel',
                  'nt_tom', 'nt_reg', 'nt_delo'];
const _M_OBEKTNI = k => /^obekt\./.test(k) || /^u\d+\.ime$/.test(k);

function _mStoynost(d, k) {
    const v = (d._potv || {})[k];
    if (v) return String(v.stoynost || '');
    const f = (typeof _s2Fakti === 'function' ? _s2Fakti(d) : []).find(x => x.k === k);
    return f ? String(f.obj.stoynost || '') : '';
}

// Редът, както ще влезе в акта: наименование № номер от дата — материал — производител/издател.
function momentChRed(d) {
    if (d._red) return d._red;
    const v = k => _mStoynost(d, k).trim();
    let ime = v('naimenovanie') || d.vid || '';
    const nomer = v('nomer'), data = v('data');
    const nt = [v('nt_tom') && `том ${v('nt_tom')}`, v('nt_reg') && `рег. № ${v('nt_reg')}`, v('nt_delo') && `дело № ${v('nt_delo')}`].filter(Boolean);
    let red = ime;
    if (nomer && !ime.includes(nomer)) red += ` № ${nomer}`;
    if (nt.length) red += `, ${nt.join(', ')}`;
    if (data && !ime.includes(data)) red += ` от ${data}`;
    const mat = v('material'), izd = v('proizvoditel') || v('izdatel');
    if (mat && !red.includes(mat)) red += ` — ${mat}`;
    if (izd && !red.includes(izd)) red += ` — ${izd}`;
    return red.trim();
}

// От реда — обратно номер, дата, наименование, материал, производител.
function _mRazberiRed(red) {
    const chasti = String(red || '').split(/\s+—\s+/);
    const glava = chasti[0];
    const data = (glava.match(/\d{1,2}\.\d{1,2}\.\d{4}/) || [''])[0];
    const nm = glava.match(/№\s*([^,]+?)(?=\s+от\s+\d|\s*,|$)/);
    const nomer = nm ? nm[1].trim() : '';
    const ime = glava.split(/\s+№|\s+от\s+\d{1,2}\./)[0].replace(/[\s,.;]+$/, '').trim();
    return { ime, nomer, data, material: chasti[1] || '', proizvoditel: chasti[2] || '' };
}

// Слепени ли са два документа: „… СЕРТИФИКАТ … . Декларация за …“ / „… и Протокол …“.
const _M_ROD = '(?:сертификат|декларация|протокол|удостоверение|договор|становище|писмо|заповед)';
function _mSlepeni(d) {
    const t = _mStoynost(d, 'naimenovanie') || d.vid || '';
    const m = t.match(new RegExp(`^(.{8,}?)(?:[.;]\\s+|\\s+и\\s+)(${_M_ROD}.{5,})$`, 'i'));
    if (!m || !new RegExp(`^${_M_ROD}`, 'i').test(m[1].trim())) return null;
    return [m[1].trim().replace(/[.;]+$/, ''), m[2].trim()];
}

function momentChakashtHtml(z, d) {
    const id64 = encodeURIComponent(_mId(d));
    const potv = d._potv || {};
    const fakti = typeof _s2Fakti === 'function' ? _s2Fakti(d) : [];
    if (!fakti.some(x => x.k === 'naimenovanie'))
        fakti.unshift({ k: 'naimenovanie', etiket: 'наименование', obj: { stoynost: '' } });
    const pi = aktPiNaDokumenta(d, z.p.pi);
    const piHtml = pi.status === 'razlichen'
        ? `<div class="predupr chakasht-pi"><strong>Не е за този обект?</strong> ПИ в документа е
              <span class="mono">${_e(pi.dok)}</span>, а на обекта — <span class="mono">${_e(pi.obekt)}</span>.
              <button class="bt" onclick="momentChMahni('${id64}')">не е за този обект — махни</button></div>`
        : pi.status === 'savpada'
        ? `<div class="otkade">ПИ съвпада с обекта · <span class="mono">${_e(pi.dok)}</span></div>`
        : `<div class="otkade">документът не назовава ПИ${pi.dok ? ` („${_e(pi.dok)}“)` : ''} — провери на хартията</div>`;
    const red = momentChRed(d);
    const r = _mRazberiRed(red);
    const nomer = _mStoynost(d, 'nomer') || r.nomer, data = _mStoynost(d, 'data') || r.data;
    const otReda = d._red ? r : { nomer, data };
    const vzeti = [otReda.nomer ? `номер: ${otReda.nomer}` : 'в реда няма номер',
                   otReda.data ? `дата: ${otReda.data}` : 'няма дата'].join(' · ');
    // За обекта — един ред: УПИ · адрес · възложител (каквото документът казва).
    const ob = fakti.filter(x => _M_OBEKTNI(x.k)).map(x => {
        const et = x.k === 'obekt.upi' ? 'УПИ' : x.k === 'obekt.adres' ? 'адрес' : x.k === 'obekt.identifikator' ? 'идентификатор' : x.etiket;
        return `${et} ${x.obj.stoynost}`;
    });
    const slepeni = _mSlepeni(d);
    const ostanali = fakti.filter(x => !_M_REDNI.includes(x.k) && !_M_OBEKTNI(x.k));
    return `
    <div class="chakasht" data-id="${_e(_mId(d))}">
        ${d._za_red ? `<div class="otkade">качено за реда „${_e(d._za_red)}“</div>` : ''}
        <div class="otkade">файл „${_e(d.fajl)}“ · името на файла не влиза никъде</div>
        ${slepeni ? `<div class="predupr">Тук изглежда има два документа: „${_e(slepeni[0].slice(0, 60))}“ и „${_e(slepeni[1].slice(0, 60))}“ —
            <button class="bt" onclick="momentChRazdeli('${id64}')">да ги разделя?</button></div>` : ''}
        <textarea class="fakt-pole karta-red" rows="${Math.min(5, Math.ceil(red.length / 80) + 1)}"
            onchange="momentChRedPromeni('${id64}', this.value)">${_e(red)}</textarea>
        <div class="otkade">${_e(vzeti)} — взети от реда</div>
        ${ob.length ? `<div class="otkade karta-obekt">За обекта: ${_e(ob.join(' · '))} — свери с хартията</div>` : ''}
        ${piHtml}
        <div class="chakasht-zhestove">
            <button class="bt bt-glaven" onclick="momentChVyarnoE('${id64}')">✔ вярно е — запиши в досието</button>
            <button class="bt bt-tih" onclick="momentChMahni('${id64}')">махни</button>
        </div>
        <details class="karta-podrobno"><summary>подробно — всички прочетени полета · ${fakti.length}${ostanali.length ? ` (още ${ostanali.length} извън реда)` : ''}</summary>
            <div class="chakasht-fakti">${fakti.map(x => momentChFaktHtml(id64, x, potv[x.k])).join('')}</div>
        </details>
    </div>`;
}

// Поправка в реда: написаното бие прочетеното; номерът, датата и
// наименованието се взимат от реда.
function momentChRedPromeni(id64, nov) {
    const { d } = _momentCh(id64);
    if (!d) return;
    const red = String(nov || '').trim();
    if (!red) { delete d._red; aktZapishi(); momentRisuvai(); return; }
    d._red = red;
    const r = _mRazberiRed(red);
    const prochetena = k => { const f = _momentChFakt(d, k); return f ? String(f.obj.stoynost || '') : ''; };
    for (const [k, v] of [['naimenovanie', r.ime], ['nomer', r.nomer], ['data', r.data], ['material', r.material], ['proizvoditel', r.proizvoditel]]) {
        if (v) _momentChSlozhi(d, k, v, prochetena(k));
        else if (k === 'nomer' || k === 'data') delete (d._potv || {})[k];
    }
    aktZapishi();
    momentRisuvai();
}

// „✔ вярно е“ — един жест: редът и каквото е в него са потвърдени, документът
// влиза в досието. Полетата извън реда (участници, позовавания) остават
// несверени — личи в досието („сверени N от M“), не се потвърждават наум.
function momentChVyarnoE(id64) {
    const { d } = _momentCh(id64);
    if (!d) return;
    const red = momentChRed(d);
    for (const f of (typeof _s2Fakti === 'function' ? _s2Fakti(d) : [])) {
        if ((d._potv || {})[f.k]) continue;
        const st = String(f.obj.stoynost || '');
        if (st.trim() && (_M_REDNI.includes(f.k) || _M_OBEKTNI(f.k)) && (red.includes(st) || _M_OBEKTNI(f.k) || f.k === 'naimenovanie'))
            _momentChSlozhi(d, f.k, st, st);
    }
    aktZapishi();
    momentChZapishi(id64);
}

// „Да ги разделя?“ — слепените стават два чакащи документа, всеки със своя ред.
function momentChRazdeli(id64) {
    const { z, d } = _momentCh(id64);
    if (!d) return;
    const dve = _mSlepeni(d);
    if (!dve) return;
    const chast = (t, star) => {
        const nm = t.match(/№\s*([^,]+?)(?=\s+от\s+\d|\s*,|$)/), dt = t.match(/\d{1,2}\.\d{1,2}\.\d{4}/);
        return { stoynost: t, citat: t, stranica: star && star.stranica, _nomer: nm ? nm[1].trim() : '', _data: dt ? dt[0] : '' };
    };
    const a = chast(dve[0], d.naimenovanie), b = chast(dve[1], d.naimenovanie);
    const vtori = JSON.parse(JSON.stringify(d));
    vtori.id = _mId(d) + '~2';
    vtori.naimenovanie = { stoynost: b.stoynost, citat: b.citat, stranica: b.stranica };
    vtori.vid = b.stoynost.split(/\s+№/)[0].slice(0, 120);
    if (b._nomer) vtori.nomer = { stoynost: b._nomer };
    if (b._data) vtori.data = { stoynost: b._data };
    delete vtori._potv; delete vtori._red;
    d.naimenovanie = { stoynost: a.stoynost, citat: a.citat, stranica: a.stranica };
    d.vid = a.stoynost.split(/\s+№|\s+\w*\d/)[0].slice(0, 120);
    d.nomer = a._nomer ? { stoynost: a._nomer } : { stoynost: '' };
    d.data = a._data ? { stoynost: a._data } : { stoynost: '' };
    delete d._potv; delete d._red;
    // Материалът е на декларацията (втората част), не на сертификата.
    if (/деклараци/i.test(b.stoynost) && !/деклараци/i.test(a.stoynost)) delete d.material;
    const s2 = z.st.sloy2.od;
    s2.chakat.splice(s2.chakat.indexOf(d) + 1, 0, vtori);
    aktZapishi();
    momentRisuvai();
}

function momentChFaktHtml(id64, x, v) {
    const p64 = encodeURIComponent(x.k);
    const pokazvana = v ? v.stoynost : (x.obj.stoynost || '');
    const popravena = v && String(v.stoynost) !== String(v.prochetena || '');
    const t = String(pokazvana);
    const pole = t.length > 60 || t.includes('\n')
        ? `<textarea class="fakt-pole" rows="${Math.min(8, Math.ceil(t.length / 70) + 1)}"
               onchange="momentChPole('${id64}','${p64}', this.value)">${_e(t)}</textarea>`
        : `<input type="text" class="fakt-pole" value="${_e(t)}"
               ${x.k === 'naimenovanie' && !t ? 'placeholder="напиши го, както е в документа"' : ''}
               onchange="momentChPole('${id64}','${p64}', this.value)">`;
    return `
    <div class="fakt ${v ? 'fakt-sveren' : ''}">
        <span class="fakt-etiket">${_e(x.etiket)}</span>
        ${pole}
        <span class="fakt-znak">${v ? (popravena ? '✓ поправено' : '✓ сверено') : 'чака ✔'}</span>
        ${x.obj.citat ? `<div class="fakt-citat">„${_e(x.obj.citat)}“${
            x.obj.stranica ? ' · стр. ' + _e(x.obj.stranica) : ''}</div>` : ''}
        ${popravena ? `<div class="otkade">четецът беше прочел „${_e(v.prochetena)}“</div>` : ''}
        <div class="fakt-zhestove">${v
            ? `<button class="bt bt-tih" onclick="momentChOtmeni('${id64}','${p64}')">отмени</button>`
            : String(x.obj.stoynost || '').trim()
              ? `<button class="bt bt-glaven" onclick="momentChFakt('${id64}','${p64}')">✔ вярно е</button>` : ''}
        </div>
    </div>`;
}

function _momentCh(id64) {
    const z = momentZhiv();
    if (!z) return {};
    const id = decodeURIComponent(id64);
    return { z, id, d: aktChakat(z.st).find(x => _mId(x) === id) };
}

function _momentChFakt(d, pole) {
    const f = (typeof _s2Fakti === 'function' ? _s2Fakti(d) : []).find(x => x.k === pole);
    return f || (pole === 'naimenovanie' ? { k: pole, obj: d.naimenovanie || { stoynost: '' } } : null);
}

function _momentChSlozhi(d, pole, stoynost, prochetena) {
    (d._potv = d._potv || {})[pole] = { stoynost, prochetena,
        koy: typeof _s2Koy === 'function' ? _s2Koy() : 'оператор', koga: new Date().toISOString() };
}

function momentChFakt(id64, p64) {
    const { d } = _momentCh(id64);
    const pole = decodeURIComponent(p64), f = d && _momentChFakt(d, pole);
    if (!f) return;
    const st = String(f.obj.stoynost || '');
    _momentChSlozhi(d, pole, st, st);
    aktZapishi();
    momentRisuvai();
}

function momentChVsichki(id64) {
    const { d } = _momentCh(id64);
    if (!d) return;
    for (const f of _s2Fakti(d)) {
        const st = String(f.obj.stoynost || '');
        if (!(d._potv || {})[f.k] && st.trim()) _momentChSlozhi(d, f.k, st, st);
    }
    aktZapishi();
    momentRisuvai();
}

// Поправка в самото поле: написаното от хартията бие прочетеното.
function momentChPole(id64, p64, nova) {
    const { d } = _momentCh(id64);
    const pole = decodeURIComponent(p64), f = d && _momentChFakt(d, pole);
    if (!f) return;
    const n = String(nova || '').trim();
    if (!n) delete (d._potv || {})[pole];
    else _momentChSlozhi(d, pole, n, String(f.obj.stoynost || ''));
    aktZapishi();
    momentRisuvai();
}

function momentChOtmeni(id64, p64) {
    const { d } = _momentCh(id64);
    if (!d || !d._potv) return;
    delete d._potv[decodeURIComponent(p64)];
    aktZapishi();
    momentRisuvai();
}

function momentChMahni(id64) {
    const { z, id } = _momentCh(id64);
    if (!z) return;
    aktMahniChakasht(z.st, id);
    momentRisuvai();
}

// „✔ запиши“: в досието с проверените факти; ако е качено за ред от
// „Липсва ми“ — редът се затваря със същия номер и дата.
function momentChZapishi(id64) {
    const { z, id, d } = _momentCh(id64);
    if (!d) return;
    const r = aktZapishiProveren(z.st, id);
    // Сверен документ — доказателство за речника; учи се веднага, не след ден.
    if (r && typeof rechnikUchi === 'function') rechnikUchi(true);
    if (!r) return;
    const s2 = z.st.sloy2.od;
    if (typeof _dokVpishiSverenite === 'function')
        _dokVpishiSverenite(z.p, z.p, s2.dokumenti || [], s2.potvardeni || {});
    if (typeof addHistory === 'function')
        addHistory('edit', z.p.pi, `Момент ${momentIme}: записано в досието — ${r.dokument.vid || r.dokument.fajl} (сверени ${r.svereni})`);
    momentSaobshtenie = `<div>„${_e(r.dokument.vid || r.dokument.fajl)}“ е в досието · сверени ${r.svereni}.</div>`;
    if (!aktChakat(z.st).length) momentRazdel = 'lipsva';
    if (r.zaRed) {
        const v = k => (s2.potvardeni[`${id}::${k}`] || {}).stoynost || (r.dokument[k] || {}).stoynost || '';
        momentZatvoriRed(r.zaRed, [v('nomer') && '№ ' + v('nomer'), v('data') && 'от ' + v('data')]
            .filter(Boolean).join(' '));
        return;
    }
    aktZapishi();
    momentRisuvai();
}

function momentBase64(fajl) {
    return new Promise((da, ne) => {
        const r = new FileReader();
        r.onload = () => da(String(r.result).split(',')[1]);
        r.onerror = ne;
        r.readAsDataURL(fajl);
    });
}

// ── Сверката: актът ↔ чеклистът (24.11.2026) ─────────────────────────────────
// Каквото Акт 15 изрежда, а чеклистът иска; каквото чеклистът брои, а актът не
// изрежда. Системата го знае — значи го казва (`dokSverkaSCheklista`), и то на
// самия ред: в „Липсва ми“ и в „Имам“, не в отделен блок.
let momentSverka = null;
function momentSverkaPresmetni(z) {
    momentSverka = null;
    if (momentIme !== 'Акт 15' || typeof dokSverkaSCheklista !== 'function') return;
    const redove = ((momentGrupa && momentGrupa.dokumenti) || []).map(r => r.dokument);
    momentSverka = dokSverkaSCheklista(z.p, z.st, redove);
}
const momentSverkaZa = (spisak, red) => momentSverka
    ? (momentSverka[spisak] || []).find(x => x.red === red) : null;

// Отметката е твоя (решено 18.11.2026: актовете обр. 7 от дневника не се
// броят сами) — бутонът само спестява търсенето на реда.
function momentSverkaOtmetni(k) {
    const z = momentZhiv();
    if (!z) return;
    const red = decodeURIComponent(k);
    z.st.nadzor_otmetnati = [...new Set([...(z.st.nadzor_otmetnati || []), red])];
    aktZapishi();
    momentZaredi();
}

// ── 3. „Липсва ми“ ───────────────────────────────────────────────────────────
// Само липсващото, по един ред, и до всеки три възможности.
// ЕДИН ЖЕСТ ЗАТВАРЯ ЕДИН РЕД — няма „Впиши“ + „Запази“ + „Провери“.

function momentLipsvaHtml(dve) {
    const vsichkiLipsvat = momentRedove().filter(r => !momentImam(r)
        && r.sastoyanie !== 'не му е времето');
    // „По стария списък“ — каквото подобният няма (26.11.2026): отделно, свито.
    const stari = vsichkiLipsvat.filter(r => r.izvan_podobniya);
    let lipsvat = vsichkiLipsvat.filter(r => !r.izvan_podobniya);
    const neEVremeto = momentRedove().filter(r => r.sastoyanie === 'не му е времето' && !r.izvan_podobniya).length;
    const grupa = momentStariyatSpisakHtml(stari);
    if (!lipsvat.length) {
        // „Нищо“ значи нищо, на което МУ Е ВРЕМЕТО. Редовете, чийто ред още не
        // е дошъл, се броят в подписа и затова се казват отделно — иначе
        // екранът би обещавал повече, отколкото знае.
        return `<div class="kutiya-razdel razdel-telo">
            <p>Нищо, на което му е времето.${neEVremeto
                ? ` ${neEVremeto} чака${neEVremeto === 1 ? '' : 'т'} реда си.` : ''}</p>${grupa}</div>`;
    }
    // При свързан подобен — по разделите на неговия акт; законовият под — отгоре.
    const poPodoben = lipsvat.some(r => r.p_red !== undefined);
    let redove = '';
    if (poPodoben) {
        lipsvat = lipsvat.slice().sort((a, b) => (a.p_red ?? 1e6) - (b.p_red ?? 1e6));
        let razdel = null;
        for (const r of lipsvat) {
            const ra = r.zakon && r.p_red === -1 ? 'Нормата го иска, подобният го няма'
                : (r.p_razdel || (r.p_red === undefined ? 'Твоите редове' : ''));
            if (ra !== razdel) { redove += `<div class="lipsva-razdel">${_e(ra || '—')}</div>`; razdel = ra; }
            redove += momentLipsvashtRed(r);
        }
    } else redove = lipsvat.map(r => momentLipsvashtRed(r)).join('');
    return `
    <div class="kutiya-razdel razdel-telo">
        ${redove}
        ${neEVremeto ? `<p class="poyasnenie">${neEVremeto} още — не им е времето.</p>` : ''}
        ${grupa}
    </div>`;
}

// ПО СТАРИЯ СПИСЪК (26.11.2026). При свързан подобен основата е неговият акт;
// редовете на чеклиста, които той няма, стоят тук — свити, не се броят. Ако
// нещо от тях ти трябва — „искам го“ го връща в списъка.
function momentStariyatSpisakHtml(redove) {
    if (!redove.length) return '';
    return `<details class="stariyat-spisak"><summary>по стария списък, не са в подобния · ${redove.length}</summary>
        <p class="poyasnenie">Редове от днешния чеклист, които подобният обект не е имал. Не се броят, докато не кажеш „искам го“.</p>
        ${redove.map(r => {
            const k = encodeURIComponent(r.dokument);
            return `<div class="lipsva-red lipsva-red-star" data-dokument="${_e(r.dokument)}">
                <div class="lipsva-ime">${_e(r.dokument)}</div>
                <div class="lipsva-zhestove">
                    <button class="bt" onclick="podobniIskamGo('${k}')">искам го</button>
                    <button class="bt bt-tih" onclick="momentNeSeOtnasya('${k}')">— не се отнася</button>
                </div>
            </div>`;
        }).join('')}
    </details>`;
}

// „ЛИПСВА МИ“ ПРАЩА, НЕ ЧЕТЕ (кройката от 17.11.2026). Фактът се ражда на едно
// място; редът, чийто документ има свое място, праща там — „към Собственост →“,
// „към Акт 14 →“ — вместо да го иска пак тук. (Операторът, 17.11: „чете НА в
// Собственост, после пак си търси НА в Протокол 2“.) „Качи · впиши · не се
// отнася“ остава само за документ без свой момент и без свой извор.
//
// Складовете — редовете са дословно от чеклиста, същите, които
// `nalichniOtSkladove` (js/08) брои, когато ги ИМА; тук е обратната посока:
// къде се ражда, докато го НЯМА. Само сигурните.
const MOMENT_IZVOR_NA_RED = {
    'Документ за собственост на имота': 'sobstvenost',
    'Документ за собственост или документ за учредено право на строеж': 'sobstvenost',
    'Нотариален акт за учредено право на строеж': 'sobstvenost',
    'Съгласие на съсобствениците': 'sobstvenost',
    'Пълномощно на представителя на възложителя': 'sobstvenost',
    'Нотариално заверено пълномощно на представителя на възложителите': 'sobstvenost',
    'Разрешение за строеж': 'pasport',
    'Документи за участниците в строителството': 'pasport',
    'Инвестиционен проект по всички части': 'proekt',
    'Одобрени инвестиционни проекти': 'proekt',
    'Заповедна книга на строежа': 'zk',
};
const MOMENT_IZVOR_IME = { sobstvenost: 'Собственост', pasport: 'Паспорта', proekt: 'Проекта', zk: 'Заповедната книга' };

// Къде се ражда редът: { ime, href } или null (тогава — качи · впиши · не се отнася).
// Към МОМЕНТ се праща само ако чеклистът наистина има такъв момент за строежа.
function momentKadeSeRazhda(dokument) {
    const id = encodeURIComponent(momentId), i = momentIndeks;
    const ime = String(dokument || '').trim();
    const ima = m => m && m !== momentIme && momentImena.includes(m);
    // Документ, който се съставя или получава в свой момент: „Акт обр. 14“,
    // „Акт 7 и обр. 12…“, „Технически паспорт на строежа“.
    const kandidati = [];
    const n = ime.match(/^(Акт|Протокол)\s+(?:обр\.?\s*)?(\d+)/i);
    if (n) kandidati.push(`${n[1][0].toUpperCase()}${n[1].slice(1).toLowerCase()} ${n[2]}`);
    if (ime === 'Разрешение за строеж') kandidati.push('РС', 'Разрешение за строеж');
    if (/^Технически паспорт/.test(ime)) kandidati.push('Технически паспорт');
    const m = kandidati.find(ima);
    if (m) return { ime: m, href: `#/moment/${id}/${i}/${encodeURIComponent(m)}` };
    const izv = MOMENT_IZVOR_NA_RED[ime];
    if (izv === 'zk') return { ime: MOMENT_IZVOR_IME.zk, href: `#/zk/${id}/${i}` };
    if (izv) return { ime: MOMENT_IZVOR_IME[izv], href: `#/${izv}/${id}/${i}` };
    return null;
}

function momentSverkaZaLipsva(red) {
    const x = momentSverkaZa('pisheNeBroi', red);
    return x ? `<div class="sverka-red">Актът вече го изрежда: ${x.dokumenti.map(_e).join('; ')}
        <span class="otkade">${_e(x.otkade.join(', '))}</span>
        <button class="bt" onclick="momentSverkaOtmetni('${encodeURIComponent(red)}')">✔ имам го — отметни</button></div>` : '';
}

// От подобния обект (25.11.2026): редът казва при кого го е имало и колко.
function momentPodobenHtml(r) {
    if (r.zakon) return `<span class="otkade lipsva-zakon">${r.p_red === -1 ? 'нормата го иска, подобният го няма · ' : 'по закон · '}${_e(r.osnovanie || '')}</span>`;
    if (typeof podobniOpisPri !== 'function') return '';
    if (r.ot_podoben && r.prikaz && r.prikaz !== r.dokument)
        return `<span class="otkade lipsva-podoben">${_e(podobniOpisPri(r.ot_podoben))} · в чеклиста: „${_e(r.dokument)}“</span>`;
    if (r.ot_podoben) return `<span class="otkade lipsva-podoben">от подобния · ${_e(podobniOpisPri(r.ot_podoben))}</span>`;
    if (r.pri_podoben) return `<span class="otkade lipsva-podoben">и ${_e(podobniOpisPri(r.pri_podoben))}</span>`;
    return '';
}

// „В досието има „…“ — ✔ това е · не е“ (речникът, 25.11.2026). Само предлага.
function momentRechnikHtml(r) {
    const z = momentZhiv();
    // Ред от подобния, който прилича на ред от чеклиста — „същото като …?“ (стъпка 3).
    if (r.ot_podoben && r.predlozhenie_red && typeof rechnikTovaE === 'function') {
        const v = encodeURIComponent(r.dokument), red = encodeURIComponent(r.predlozhenie_red);
        return `<div class="rk-predlozhenie">същото като „${_e(r.predlozhenie_red)}“?
            <button class="bt bt-glaven" onclick="rechnikTovaE('${v}','${red}')">✔ това е</button>
            <button class="bt bt-tih" onclick="rechnikNeE('${v}','${red}')">не е</button></div>`;
    }
    if (!z || typeof rechnikPredlozhenie !== 'function') return '';
    const p = rechnikPredlozhenie(z.st, r.dokument);
    if (!p) return '';
    const v = encodeURIComponent(p.dok.vid), red = encodeURIComponent(r.dokument);
    const nd = [p.dok.nomer, p.dok.data].map(x => (x && typeof x === 'object') ? x.stoynost : x).filter(Boolean).join(' · ');
    return `<div class="rk-predlozhenie">в досието има „${_e(p.dok.vid)}“${nd ? ` <span class="otkade">${_e(nd)}</span>` : ''}
        <button class="bt bt-glaven" onclick="rechnikTovaE('${v}','${red}')">✔ това е</button>
        <button class="bt bt-tih" onclick="rechnikNeE('${v}','${red}')">не е</button></div>`;
}

function momentLipsvashtRed(r) {
    const k = encodeURIComponent(r.dokument);
    const hod = momentHod[r.dokument];
    const kade = momentKadeSeRazhda(r.dokument);
    if (kade) return `
    <div class="lipsva-red lipsva-prashta${r.ot_podoben ? ' lipsva-red-podoben' : ''}" data-dokument="${_e(r.dokument)}">
        <div class="lipsva-ime">${_e(r.prikaz || r.dokument)}${momentPodobenHtml(r)}</div>
        <a class="kam" href="${kade.href}">към ${_e(kade.ime)} →</a>
        ${momentRechnikHtml(r)}
        ${momentSverkaZaLipsva(r.dokument)}
    </div>`;
    // Твой ред (от „Подобни обекти“ или „Видени, но неописани“, 25.11.2026) —
    // казва, че е твой и откъде; „за преценка“ не се брои за липсващ.
    const svoy = r.sobstven ? `<span class="otkade lipsva-svoy">твой ред${r.za_precenka
        ? ' · за преценка — „не се отнася“, ако не важи' : ''} · ${_e(r.osnovanie || 'добавен от теб')}</span>` : '';
    return `
    <div class="lipsva-red${r.sobstven ? ' lipsva-red-svoy' : ''}${r.ot_podoben ? ' lipsva-red-podoben' : ''}${r.zakon ? ' lipsva-red-zakon' : ''}" data-dokument="${_e(r.dokument)}">
        <div class="lipsva-ime">${_e(r.prikaz || r.dokument)}
            ${r.uslovie && r.uslovie !== 'винаги' && !r.ot_podoben
                ? `<span class="otkade">${_e(r.uslovie)}</span>` : ''}${svoy}${momentPodobenHtml(r)}</div>
        <div class="lipsva-zhestove">
            <button class="bt" onclick="momentKachi('${k}')">📎 качи</button>
            <button class="bt" onclick="momentVpishi('${k}')">✍ впиши</button>
            <button class="bt bt-tih" onclick="momentNeSeOtnasya('${k}')">— не се отнася</button>
        </div>
        ${momentRechnikHtml(r)}
        ${momentSverkaZaLipsva(r.dokument)}
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
        momentPriberiProcheteno(z, novi, fajl.name, dokument);
        momentRazdel = 'chakat';
        momentHod[dokument] = novi.length <= 1 ? momentRazdelyaneHtml(novi.razdelyane) : '';
        if (!momentHod[dokument]) delete momentHod[dokument];
        momentRisuvai();
    } catch (e) {
        momentHod[dokument] = e.izteklo ? aktGreshkaHtml(e) : `❌ ${_e(e.message)}`;
        momentRisuvai();
    }
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
    if (!nalichni.length) return `<div class="kutiya-razdel razdel-telo"><p>Още нищо.</p></div>`;
    const kade = ime => {
        // Затворено през речника — казва откъде е научено (25.11.2026).
        const rk = typeof rechnikZatvorenoOt === 'function' ? rechnikZatvorenoOt(ime) : null;
        if (rk) return `затворено от досието: „${rk.vid}“ · ${rk.kak}`;
        const v = vpisani.find(d => String(d.ime).toLowerCase() === String(ime).toLowerCase());
        if (v) return [v.nomer, v.ot].filter(Boolean).join(' · ');
        if ((z.st.neotnasya || []).includes(ime))
            return 'не се отнася' + (z.st.neotnasya_koga && z.st.neotnasya_koga[ime]
                ? ' · ' + aktData(z.st.neotnasya_koga[ime]) : '');
        // Научено от друг обект със същите съставки — казва се откъде е.
        const urok = typeof nauchZaRed === 'function' ? nauchZaRed(z.p, z.st, ime) : null;
        if (urok) return 'не се отнася · ' + nauchObyasnenie(urok);
        // От склад на системата — регистъра, паспорта, регистъра на ЗК (18.11.2026).
        const sklad = typeof nalichniOtSkladove === 'function'
            ? nalichniOtSkladove(z.p, z.st).find(x => x.red === ime) : null;
        if (sklad) return sklad.otkade;
        // Прочетено в досието.
        const prochet = ((z.st.sloy2 && z.st.sloy2.od && z.st.sloy2.od.dokumenti) || [])
            .find(d => String(d.cheklist_red || '').trim() === ime);
        if (prochet) return 'Досието · ' + [prochet.vid ? `„${String(prochet.vid).slice(0, 60)}“` : '', prochet.nomer, prochet.data]
            .map(v => (v && typeof v === 'object') ? v.stoynost : v).filter(Boolean).join(' · ');
        return 'отметнато';
    };
    return `
    <div class="kutiya-razdel razdel-telo">
        <ul class="lipsvat">
            ${nalichni.map(r => `<li>${_e(r.dokument)}
                <span class="otkade">${_e(kade(r.dokument))}</span>
                ${momentSverkaZa('broiNePishe', r.dokument) ? `<div class="sverka-red">Актът не го изрежда — ${
                    _e(momentSverkaZa('broiNePishe', r.dokument).zashto)}. <a class="kam" href="#/dosie/${
                    encodeURIComponent(momentId)}/${momentIndeks}">свери в досието →</a></div>` : ''}
                ${typeof rechnikZatvorenoOt === 'function' && rechnikZatvorenoOt(r.dokument)
                    ? `<button class="bt bt-tih" onclick="rechnikNeE('${encodeURIComponent(rechnikZatvorenoOt(r.dokument).vid)}','${encodeURIComponent(r.dokument)}')">не е това</button>`
                    : momentDokZaRed(z, r.dokument)
                    ? `<button class="bt bt-tih" onclick="momentNeEToziDokument('${encodeURIComponent(r.dokument)}')">не е това</button>`
                    : `<button class="bt bt-tih" onclick="momentVarni('${encodeURIComponent(r.dokument)}')">върни</button>`}
            </li>`).join('')}
        </ul>
    </div>`;
}

// „НЕ Е ТОВА“ НА РЕД, ЗАТВОРЕН ОТ ДОКУМЕНТ В ДОСИЕТО (26.11.2026). Операторът:
// „Договори за строителство и строителен надзор — Досието · 1156/07.12.2023 — е
// всъщност заповедна книга“. Четецът беше вързал книгата към чужд ред.
//   · връзката на документа се маха (старата се пази в `cheklist_red_chetec`) —
//     редът се връща в „Липсва ми“;
//   · в речника — „този вид НЕ е този ред“, за да не се повтори при друг обект;
//   · правилният ред ще получи „в досието има „…“ — ✔ това е“.
function momentDokZaRed(z, red) {
    return ((z && z.st.sloy2 && z.st.sloy2.od && z.st.sloy2.od.dokumenti) || [])
        .find(d => String(d.cheklist_red || '').trim() === red) || null;
}

async function momentNeEToziDokument(k) {
    const z = momentZhiv();
    if (!z) return;
    const red = decodeURIComponent(k);
    const d = momentDokZaRed(z, red);
    if (!d) return;
    d.cheklist_red_chetec = d.cheklist_red;
    d.cheklist_red = '';
    d.red_ot = `операторът: не е „${red}“`;
    // Отметнатото на ръка за този ред (ако го е имало заради документа) остава твое.
    aktZapishi();
    if (typeof addHistory === 'function')
        addHistory('edit', z.p.pi || null, `Досие: „${d.vid || d.fajl}“ не е „${red}“`);
    if (typeof rechnikNeE === 'function' && d.vid) await rechnikNeE(encodeURIComponent(d.vid), encodeURIComponent(red));
    else momentZaredi();
}

// ── 5. Остатъкът ─────────────────────────────────────────────────────────────

function momentOstatakHtml(st) {
    const polya = aktOstatak(momentIme);
    const sega = st.ostatak || {};
    return `${momentIme === 'Акт 14' || momentIme === 'Акт 15' ? momentDnevnikRedHtml(st) : ''}
    <div class="kutiya-razdel">
        <div class="nadpis">Това, което само ти знаеш</div>
        <p class="poyasnenie">Системата няма откъде да го вземе. Попълненото влиза направо в текста.</p>
        ${momentIme === 'Протокол 2' ? momentNivaHtml() + momentNivaOtDnevnikHtml(st) : ''}
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

// ── Датите на нивата — от бетоновия дневник ─────────────────────────────────
// Операторът, 21.10.2026: раздел III се пише ОТПОСЛЕ и датите се синхронизират
// с бетоновия дневник. 10.11.2026: „Да“ — системата ги предлага, тя приема.
//
// Как се търси (всяко предложение казва от кой ред е):
//   изкоп  — първото бетониране в дневника (подложният бетон идва след
//            приемането на изкопа; при Радулов — 27.02.2024 и двете);
//   цокъл  — бетонирането на плочата на ±0,00;
//   корниз, било — бетонирането на плочата на котата им (котите — от
//            „Протокол 2 — коти“ при съставянето или от прочетените проверки).
// Без кота корнизът и билото не се гадаят.
function _nvKota(s) {
    const m = String(s || '').replace(/±/g, '+').match(/([+\-–−])?\s*(\d+)\s*[.,]\s*(\d+)/);
    if (!m) return null;
    const v = parseFloat(m[2] + '.' + m[3]);
    return m[1] && /[\-–−]/.test(m[1]) ? -v : v;
}

function _nvKotiNaRed(element) {
    const out = [];
    const re = /([±+\-–−])?\s*(\d+)\s*[.,]\s*(\d+)/g;
    let m;
    while ((m = re.exec(String(element || '')))) {
        const v = parseFloat(m[2] + '.' + m[3]);
        out.push(m[1] && /[\-–−]/.test(m[1]) ? -v : v);
    }
    return out;
}

function aktNivaOtDnevnik(aktove, koti) {
    const s = (aktove || []).filter(a => /\d{1,2}\.\d{1,2}\.\d{4}/.test(String(a.data_beton || '')));
    const red = a => { const m = String(a.data_beton).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        return m[3] + m[2].padStart(2, '0') + m[1].padStart(2, '0'); };
    const po = s.slice().sort((a, b) => red(a).localeCompare(red(b)));
    const purva = d => String(d || '').match(/\d{1,2}\.\d{1,2}\.\d{4}/)[0];
    const naKota = k => {
        if (k === null || k === undefined || isNaN(k)) return null;
        const sKota = po.filter(a => _nvKotiNaRed(a.element).some(x => Math.abs(x - k) < 0.02));
        return sKota.find(a => /плоч/i.test(a.element) && _nvKotiNaRed(a.element).length === 1)
            || sKota.find(a => /плоч/i.test(a.element)) || sKota[0] || null;
    };
    const izhod = {};
    if (po[0]) izhod.izkop = { data: purva(po[0].data_beton), red: po[0].element, kak: 'първото бетониране' };
    const c = naKota(0);
    if (c) izhod.cokul = { data: purva(c.data_beton), red: c.element, kak: 'плочата на ±0,00' };
    for (const [kl, ime] of [['korniz', 'корниза'], ['bilo', 'билото']]) {
        const a = naKota(_nvKota((koti || {})[kl]));
        if (a) izhod[kl] = { data: purva(a.data_beton), red: a.element, kak: `плочата на котата на ${ime}` };
    }
    return izhod;
}

function momentNivaOtDnevnikHtml(st) {
    const aktove = ((st && st.akt7_dnevnik) || {}).aktove || [];
    if (!aktove.length) return '';
    const o = st.ostatak || {};
    const koti = { ...(st.p2_koti || {}) };
    for (const kl of ['korniz', 'bilo']) if (!koti[kl] && o['niva_' + kl + '_kota']) koti[kl] = o['niva_' + kl + '_kota'];
    const pr = aktNivaOtDnevnik(aktove, koti);
    const IME = { izkop: 'изкоп', cokul: 'цокъл', korniz: 'корниз', bilo: 'било' };
    const redove = Object.keys(IME).map(kl => {
        const p = pr[kl], sega = o['niva_' + kl];
        if (!p) return `<li class="tiho">${IME[kl]} — ${['korniz', 'bilo'].includes(kl) && !koti[kl]
            ? 'няма кота (впиши я в „Протокол 2 — коти“ при съставянето)' : 'няма такъв ред в дневника'}</li>`;
        return `<li><strong>${IME[kl]} ${_e(p.data)}</strong> — ${_e(p.kak)}: „${_e(p.red)}“${
            sega && sega !== p.data ? ` <span class="predupr">сега пише ${_e(sega)}</span>` : ''}</li>`;
    }).join('');
    const ima = Object.keys(pr).length;
    return `
        <div class="kutiya-razdel" style="border-color:var(--gold)">
            <p class="tiho"><strong>Датите на нивата по бетоновия дневник</strong> — предложение, провери ги.</p>
            <ul style="margin:4px 0 8px 18px">${redove}</ul>
            ${ima ? `<button class="bt" onclick="momentNivaOtDnevnikPriemi()">Приеми датите от дневника</button>` : ''}
        </div>`;
}

function momentNivaOtDnevnikPriemi() {
    const z = momentZhiv();
    if (!z) return;
    const st = z.st, o = (st.ostatak = st.ostatak || {});
    const koti = { ...(st.p2_koti || {}) };
    for (const kl of ['korniz', 'bilo']) if (!koti[kl] && o['niva_' + kl + '_kota']) koti[kl] = o['niva_' + kl + '_kota'];
    const pr = aktNivaOtDnevnik(((st.akt7_dnevnik || {}).aktove) || [], koti);
    for (const [kl, p] of Object.entries(pr)) o['niva_' + kl] = p.data;
    aktZapishi();
    momentRisuvai();
}

function momentNivaHtml() {
    const z = momentZhiv();
    const ch = momentNivaProcheteno || (z && z.st.niva_predlozhenie) || null;
    if (ch && !(ch.proverki || []).length) return `
        <div class="redica" style="margin:6px 0">
            <input type="file" id="moment-niva-fajl" accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff"
                   onchange="momentNivaCheti()">
            <span class="tiho">прочети заверките на нивата от сканирания Протокол 2</span>
        </div>
        <div id="moment-niva-hod"></div>
        <p class="predupr">„${_e(ch.fajl || '')}“ е Протокол 2, но заверките на нивата не се прочетоха${ch.greshka ? ': ' + _e(ch.greshka) : ''}.
           Впиши датите на ръка или качи сканираните проверки отделно.
           <button class="bt bt-tih" onclick="momentNivaOtkazhi()">разбрах</button></p>`;
    return `
        <div class="redica" style="margin:6px 0">
            <input type="file" id="moment-niva-fajl" accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff"
                   onchange="momentNivaCheti()">
            <span class="tiho">прочети заверките на нивата от сканирания Протокол 2</span>
        </div>
        <div id="moment-niva-hod"></div>
        ${ch ? `<div class="kutiya-razdel" style="border-color:var(--gold)">
            <p class="tiho">Прочетено от „${_e(ch.fajl || '')}“${ch.ot_dosie ? ' (качен в досието)' : ''} — датите са на ръка, свери ги.</p>
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

function momentNivaSega() {
    const z = momentZhiv();
    return momentNivaProcheteno || (z && z.st.niva_predlozhenie) || null;
}

function momentNivaPoprav(i, v) {
    const ch = momentNivaSega();
    if (ch && ch.proverki[i]) ch.proverki[i].data = String(v || '').trim();
    if (ch && ch === (momentZhiv() || {}).st?.niva_predlozhenie) aktZapishi();
}

function momentNivaOtkazhi() {
    momentNivaProcheteno = null;
    const z = momentZhiv();
    if (z && z.st.niva_predlozhenie) { delete z.st.niva_predlozhenie; aktZapishi(); }
    momentRisuvai();
}

function momentNivaPriemi() {
    const z = momentZhiv(); const ch = momentNivaSega();
    if (!z || !ch) return;
    const o = (z.st.ostatak = z.st.ostatak || {});
    for (const p of ch.proverki) {
        const k = _NIVA_KLYUCH[p.nivo];
        if (!k || !p.data) continue;
        o[k] = p.data;
        if (p.kota) o[k + '_kota'] = p.kota;
    }
    momentNivaProcheteno = null;
    delete z.st.niva_predlozhenie;
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

// СЪСТОЯНИЕТО НА РЕДА (облеклото, 18.11.2026): подписан · сканиран, провери ·
// само в дневника. „Подписан“ е твоето ✔ или сверен скан; „сканиран“ — в
// досието има прочетен акт обр. 7 със същата дата или със същите коти.
// Съвпадението е СЪЩОТО като в `dokTetradka` (js/04b-spisak.js): дата или коти,
// всеки скан поглъща най-много един ред. Повторено е, защото кухнята не го
// изнася; `proba_pva_akt7_tablica.js` сверява двете и пада, ако се разминат.
function _dn7DataKl(v) {
    const m = String(v || '').match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
    return m ? [+m[1], +m[2], m[3].length === 2 ? 2000 + +m[3] : +m[3]].join('.') : '';
}
function _dn7KotiKl(v) {
    const k = [], re = /([±+\-–−])?\s*(\d+)\s*[.,]\s*(\d+)/g;
    let m;
    while ((m = re.exec(String(v || '')))) {
        const x = parseFloat(m[2] + '.' + m[3]) * (m[1] && /[\-–−]/.test(m[1]) ? -1 : 1);
        k.push(x.toFixed(2));
    }
    return [...new Set(k)].sort().join('|');
}

function momentDnSastoyaniya(z) {
    const aktove = ((z.st.akt7_dnevnik || {}).aktove) || [];
    if (!aktove.length) return [];
    const AKT7 = /акт\s*(обр\.?|образец)?\s*№?\s*7(?![\dа-я])/i;
    const skanove = (typeof dokTetradka === 'function' ? dokTetradka(z.p, z.st) : [])
        .filter(r => r.otkade === (typeof _DOK_PROCHETEN !== 'undefined' ? _DOK_PROCHETEN : 'прочетен')
            && (r.kod === 'AKT7' || AKT7.test([r.ime, r.vid].join(' '))))
        .map(r => ({ data: _dn7DataKl(r.data), koti: _dn7KotiKl(r.sadarzhanie || ((r.izvor || {}).sadarzhanie || {}).stoynost),
                     sveren: !!r.sveren, vzet: false }));
    return aktove.map(a => {
        let sk = skanove.find(x => !x.vzet && x.data && x.data === _dn7DataKl(a.data));
        if (!sk) { const k = _dn7KotiKl(a.smr); sk = k ? skanove.find(x => !x.vzet && x.koti === k) : null; }
        if (sk) sk.vzet = true;
        const vid = (sk && sk.sveren) ? 'skan' : a.podpisan ? 'podpisan' : sk ? 'proveri' : 'dnevnik';
        return { a, vid, skan: !!sk };
    });
}
const DN7_SASTOYANIE = {
    skan: ['gotovo', 'подписан скан'], podpisan: ['gotovo', 'подписан · твоето ✔'],
    proveri: ['chaka', 'сканиран, провери'], dnevnik: ['lipsva', 'само в дневника'],
};

// Кои несъставени са избрани за „Съставѝ избраните“. По подразбиране — всички
// „само в дневника“; пази се кои си махнала (по бетонирането, не по номер на ред).
let momentDnMahnatiOtIzbora = new Set();
let momentDnPodpisaniOtvoreni = false;
function _dn7Kl(a) { return (a.klyuchove || [_dnKlyuch(a)])[0]; }
function momentDnIzbrani(z) {
    return momentDnSastoyaniya(z).filter(r => r.vid === 'dnevnik' && !momentDnMahnatiOtIzbora.has(_dn7Kl(r.a)));
}
function momentDnIzberi(i, da) {
    const dn = _momentDnevnik();
    if (!dn || !dn.aktove[i]) return;
    const k = _dn7Kl(dn.aktove[i]);
    if (da) momentDnMahnatiOtIzbora.delete(k); else momentDnMahnatiOtIzbora.add(k);
    momentRisuvai();
}
function momentDnPodpisaniSgavane() {
    momentDnPodpisaniOtvoreni = !momentDnPodpisaniOtvoreni;
    momentRisuvai();
}

function momentKrugove7(redove) {
    const C = 2 * Math.PI * 30, M = redove.length;
    const podp = redove.filter(r => DN7_SASTOYANIE[r.vid][0] === 'gotovo').length;
    const prov = redove.filter(r => r.vid === 'proveri').length;
    const krug = (n, ime, cvyat) => `
        <div class="vezna krug krug-7">
            <svg viewBox="0 0 76 76" aria-hidden="true">
                <circle cx="38" cy="38" r="30" fill="none" stroke="#a7b5b6" stroke-width="7"/>
                ${n ? `<circle cx="38" cy="38" r="30" fill="none" stroke="${cvyat}" stroke-width="7" stroke-linecap="round"
                    stroke-dasharray="${(C * n / M).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 38 38)"/>` : ''}
            </svg>
            <span class="vezna-post">${n}</span>
            <span class="vezna-ime">${ime}</span>
            <span class="vezna-ot">${n} от ${M}</span>
        </div>`;
    return `<div class="vezni">${krug(podp, 'подписани', podp === M ? 'var(--green)' : 'var(--gold)')}${
        krug(prov, 'чакат проверка', 'var(--gold)')}</div>`;
}

function momentDnevnikHtml(st) {
    const z = momentZhiv();
    const dn = st.akt7_dnevnik;
    const aktove = (dn && dn.aktove) || [];
    const sast = z ? momentDnSastoyaniya(z) : [];
    const podpisani = aktove.filter(a => a.podpisan).length;
    const gotovi = sast.filter(r => DN7_SASTOYANIE[r.vid][0] === 'gotovo');
    const proveri = sast.filter(r => r.vid === 'proveri').length;
    const izbrani = z ? momentDnIzbrani(z) : [];
    const kl = (i, pole, a, shir) => `<td class="${pole === 'data' ? 'dt' : 'kota'}"><input type="text" value="${_e(a[pole] || '')}" ${a.podpisan ? 'disabled' : ''}
        ${pole === 'data' ? 'placeholder="дд.мм.гггг"' : ''} style="width:100%;min-width:${shir}"
        onchange="momentDnevnikPoprav(${i}, '${pole}', this.value)"></td>`;
    const red = (r, i) => {
        const a = r.a, [cvyat, ime] = DN7_SASTOYANIE[r.vid];
        const sgaanat = cvyat === 'gotovo' && !momentDnPodpisaniOtvoreni;
        return `
        <tr class="dn-red dn-${r.vid} ${a.podpisan ? 'dn-podpisan' : ''}"${sgaanat ? ' hidden' : ''}>
            <td>${r.vid === 'dnevnik' ? `<input type="checkbox" class="dn-izbor" title="избери за съставяне"
                    ${momentDnMahnatiOtIzbora.has(_dn7Kl(a)) ? '' : 'checked'} onchange="momentDnIzberi(${i}, this.checked)">` : ''}</td>
            ${kl(i, 'data', a, '88px')}
            <td><textarea rows="1" ${a.podpisan ? 'disabled' : ''} style="width:100%;min-width:200px"
                    onchange="momentDnevnikPoprav(${i}, 'smr', this.value)">${_e(a.smr || '')}</textarea></td>
            ${kl(i, 'ot', a, '56px')}${kl(i, 'do', a, '56px')}
            <td><span class="chip chip-${cvyat}">${ime}</span></td>
            <td style="white-space:nowrap">${a.podpisan
                ? `<button class="bt bt-tih" title="махни твоето ✔" onclick="momentDnevnikPodpisan(${i}, false)">върни</button>`
                : `<button class="bt bt-tih" title="подписан е — казваш го ти" onclick="momentDnevnikPodpisan(${i}, true)">✔ подписан</button>
                ${i < aktove.length - 1 && !aktove[i + 1].podpisan
                    ? `<button class="bt bt-tih" title="слей със следващия" onclick="momentDnevnikSleiRed(${i})">⊕</button>` : ''}
                <button class="bt bt-tih" title="махни" onclick="momentDnevnikMahni(${i})">✕</button>`}</td>
        </tr>
        <tr class="dn-izvor"${sgaanat ? ' hidden' : ''}><td></td><td colspan="6" class="otkade">дневник${a.stranica ? ', стр. ' + _e(a.stranica) : ''}: „${
            _e(a.element || '')}“${a.data_beton ? ' · бетон ' + _e(a.data_beton) : ''}${a.obem ? ' · ' + _e(a.obem) + ' м³' : ''}${
            a.belezhka ? ` · <strong>${_e(a.belezhka)}</strong>` : ''}</td></tr>`;
    };
    const id = encodeURIComponent(momentId);
    return `
    <div class="kutiya-razdel dn-karta">
        <div class="nadpis">Бетоновият дневник → актове обр. 7</div>
        <p class="poyasnenie">По един акт на бетониране, по датата на бетона. Датата на акта е
           предложена ден преди бетона — провери я. Подписаните влизат в 1.3 на Акт 15.</p>
        <div class="redica dn-chetene">
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
                <tr><th></th><th>Дата</th><th>Елемент · СМР</th><th>От ниво</th><th>До ниво</th><th>Състояние</th><th></th></tr>
                ${gotovi.length ? `<tr class="dn-grupa" onclick="momentDnPodpisaniSgavane()" tabindex="0"
                        onkeydown="if(event.key==='Enter')momentDnPodpisaniSgavane()">
                    <td>✔</td><td colspan="6">Подписани · ${gotovi.length} ${momentDnPodpisaniOtvoreni ? '▾' : '· сгънато ▸'}</td></tr>` : ''}
                ${sast.map(red).join('')}
            </table></div>
            <div class="sastavi dn-sastavi">
                ${proveri ? `<a class="kam" href="#/dosie/${id}/${momentIndeks}">провери ${proveri} в досието →</a>` : ''}
                <button class="bt bt-glaven bt-golyam" ${izbrani.length ? '' : 'disabled'}
                        onclick="momentDnevnikSastavi()">Съставѝ избраните · един файл (${izbrani.length})</button>
                <button class="bt bt-tih" onclick="momentDnevnikDobavi()">+ акт на ръка</button>
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
    // Само избраните несъставени — подписаните и сканираните вече ги има.
    const izbor = momentDnIzbrani(z).map(r => r.a);
    if (!izbor.length) { hod.innerHTML = '<p class="tiho">Няма избрани актове за съставяне.</p>'; return; }
    const konsultant = (aktDanni.consultants || []).find(c => c.id == ((z.st && z.st.consultant) || z.p.consultant || {}).id);
    if (!konsultant) { hod.innerHTML = '<p class="greshka">Няма избран консултант в паспорта.</p>'; return; }
    if (typeof stoynostPitaiPrediDokument === 'function' && !stoynostPitaiPrediDokument(z.p, z.st)) return;
    hod.innerHTML = `<p class="tiho">Съставям ${izbor.length} акта…</p>`;
    try {
        const { sadarzhanie } = await genDokument(aktZaDokument(z.p, z.st), konsultant, 'akt7', {
            akt7_seriya: izbor.map(a => ({ data: a.data, ot: a.ot, do: a.do, smr: a.smr, razreshava: a.razreshava })),
        });
        genSvali(`akt7_${z.p.pi}.docx`, sadarzhanie);
        genZapishi(z.st, [{ type: `Акт 7 — ${izbor.length} акта`, date: new Date().toISOString(), url: '', path: '' }]);
        aktZapishi();
        hod.innerHTML = `<p class="gotov">✔ ${izbor.length} акта в един файл — свален.</p>`;
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
    // Моментът, който се получава, не се съставя — качва се или се вписва
    // от „Липсва ми“. (Решено 18.11.2026.)
    if (aktVidMoment(momentIme) === 'poluchava') return `
    <div class="kutiya-razdel sastavi sastavi-poluchava">
        <p class="poyasnenie">${_e(momentIme)} се получава от органа — не се съставя.
           Качи го или го впиши от „Липсва ми“; информацията от него тече напред.</p>
    </div>`;
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
