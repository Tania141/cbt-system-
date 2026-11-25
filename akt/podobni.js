// АКТ СИСТЕМ · новото ПВА · podobni.js
// ПОДОБНИ ОБЕКТИ — `ДА ПРОЧЕТА/ЗАДАНИЕ-ПОДОБЕН-ОБЕКТ.md`
//
// БИБЛИОТЕКАТА (стаята „Подобни обекти“). Подаваш завършен Акт 15 и ОД от
// обект, който прилича на твоя: сървърът ги чете с кода, без АИ (`/api/podoben/
// chete`), и ги пази тук с вид, категория и законовия под (4в).
//
// ВРЪЗКАТА (25.11.2026). Операторът: „това е в подобни обекти, не в този, в
// който работя… пак затрупахме с инфо системата“. Затова списъкът с бутоните
// (4б) отпадна оттук. Подобният обект се ВРЪЗВА към строежа, по който работиш
// („сравнявам с: Петракиев“ — в момента), и неговите редове пълнят „Липсва ми“
// на ВСЕКИ момент: виждаш само каквото онзи е имал, а ти го нямаш. Отговаря се
// с познатите жестове — качи · впиши · не се отнася. Връзката е изискването.
//
// От подобния се взима ФОРМАТА (какво трябва), никога стойност.

'use strict';

// Годни за източник — от 2017 г. нататък; „от последните две години“
// (отговорите на оператора от 28.10.2026, в заданието).
const PODOBNI_OT_GODINA = 2017;
const PODOBNI_SKOROSHNI = 2;
const PODOBNI_VIDOVE = ['сграда', 'линеен', 'съоръжение'];

let podobniHod = '';
let podobniPod = {};            // id на обекта → { klyuch, rez | greshka | zarezhda }


// ── 4в: законовият под (25.11.2026) ──────────────────────────────────────────
// Подобният акт казва какво Е СЪБРАНО там, не какво е трябвало. Под него стои
// нормата за категорията му (`cbt-api/rules/zakonov_pod.py`, с цитатите).
// Разминаването е ПРЕДУПРЕЖДЕНИЕ, не въпрос: „в този акт липсва нещо, което
// нормата изисква — пропуск там, не правило“. Не се учи и не се маха.
//
// Категорията е поле на ръка (сбъркана — сменя пода и не личи). От текста на
// акта идва само ПРЕДЛОЖЕНИЕ с изречението, което се приема с един клик.

function podobniKategoriaHtml(ob, i) {
    const vTeksta = (ob.fajlove || []).map(f => f.kategoria_v_teksta).find(Boolean);
    const dumi = ['', 'първа', 'втора', 'трета', 'четвърта', 'пета'];
    return `<div class="podoben-fajl"><span class="podoben-vid">категория</span>
        <select class="podoben-vid-izbor${ob.kategoria ? '' : ' podoben-vid-prazen'}" onchange="podobniSmeniKategoria(${i}, this.value)">
            <option value="">— каква категория? —</option>
            ${[1, 2, 3, 4, 5].map(k => `<option value="${k}"${String(ob.kategoria) === String(k) ? ' selected' : ''}>${dumi[k]}</option>`).join('')}
        </select>
        ${ob.kategoria ? '<span class="tiho">казано от теб</span>'
            : vTeksta ? `<span class="tiho">в акта пише: „${_e(vTeksta.izrechenie)}“</span>
                <button class="bt bt-tih" onclick="podobniSmeniKategoria(${i}, '${vTeksta.cifra}')">✔ ${dumi[vTeksta.cifra]}, както пише</button>`
            : '<span class="greshka">без категория не се сверява с нормата</span>'}
    </div>`;
}

function _podobniPodKlyuch(ob) {
    return `${ob.kategoria}|${(ob.fajlove || []).map(f => f.fajl + '@' + (f.procheten_koga || '')).join(',')}`;
}

async function podobniPodZaredi(ob) {
    const klyuch = _podobniPodKlyuch(ob);
    podobniPod[ob.id] = { klyuch, zarezhda: true };
    try {
        const redove = podobniRedoveNaObekta(ob).map(r => ({ ime: r.ime, dosloven: r.dosloven }));
        const rez = await aktApi('/api/podoben/pod', 'POST', { kategoria: ob.kategoria, redove,
            ima_akt15: (ob.fajlove || []).some(f => f.vid === 'Акт 15') });
        podobniPod[ob.id] = rez.greshka ? { klyuch, greshka: rez.greshka } : { klyuch, rez };
    } catch (e) {
        podobniPod[ob.id] = { klyuch, greshka: e.message };
    }
    podobniRisuvai();
}

function podobniPodHtml(ob) {
    if (!ob.kategoria) return '';
    const s = podobniPod[ob.id];
    if (!s || s.klyuch !== _podobniPodKlyuch(ob)) {
        setTimeout(() => podobniPodZaredi(ob), 0);
        return '<div class="podoben-pod tiho">Законовият под — сверявам с нормата…</div>';
    }
    if (s.zarezhda) return '<div class="podoben-pod tiho">Законовият под — сверявам с нормата…</div>';
    if (s.greshka) return `<div class="podoben-pod greshka">Законовият под не се сравни: ${_e(s.greshka)}</div>`;
    const { namereni, lipsvat } = s.rez;
    const tvardi = lipsvat.filter(x => x.tvardo), mozhe = lipsvat.filter(x => !x.tvardo);
    const vsichki = namereni.length + lipsvat.length;
    return `<div class="podoben-pod">
        <div class="podoben-pod-glava">Законовият под · ${s.rez.kategoria} категория · ${namereni.length} от ${vsichki} са в акта${
            tvardi.length ? ` · <span class="greshka">${tvardi.length} ${tvardi.length === 1 ? 'липсва' : 'липсват'}</span>` : ''}</div>
        ${tvardi.map(x => `<div class="podoben-pod-red podoben-pod-lipsva">⚠ <b>${_e(x.ime)}</b> — нормата го иска, в този акт го няма.
            Пропуск там, не правило.<span class="otkade">${_e(x.osnovanie)}${x.belezhka ? ' · ' + _e(x.belezhka) : ''}</span></div>`).join('')}
        ${mozhe.map(x => `<div class="podoben-pod-red podoben-pod-mozhe"><b>${_e(x.ime)}</b> — го няма${x.belezhka ? ` (${_e(x.belezhka)})` : '; иска се, когато е приложимо'}.
            <span class="otkade">${_e(x.osnovanie)}</span></div>`).join('')}
        ${namereni.length ? `<details class="podoben-dosl"><summary>в акта са · ${namereni.length}</summary><ul>${
            namereni.map(x => `<li>${_e(x.ime)} ← „${_e(x.namereno_kato)}“ <span class="otkade">${_e(x.osnovanie)}</span></li>`).join('')}</ul></details>` : ''}
    </div>`;
}

function podobniSmeniKategoria(i, k) {
    const ob = podobniSpisak()[i];
    if (!ob) return;
    ob.kategoria = /^[1-5]$/.test(String(k)) ? String(k) : '';
    aktZapishi();
    podobniRisuvai();
}


function podobniSpisak() {
    return (aktDanni.podobni = Array.isArray(aktDanni.podobni) ? aktDanni.podobni : []);
}

function podobniOtvori() {
    podobniHod = '';
    podobniRisuvai();
}

function podobniRedoveNaObekta(ob) {
    const po = new Map();
    const fajlove = (ob.fajlove || []).slice()
        .sort((a, b) => (a.vid === 'Акт 15' ? 0 : 1) - (b.vid === 'Акт 15' ? 0 : 1));
    for (const f of fajlove) {
        for (const r of f.redove || []) {
            const s = po.get(r.klyuch);
            if (!s) {
                po.set(r.klyuch, { ...r, dosloven: [...(r.dosloven || [])], ot_fajl: [f.vid || f.fajl] });
                continue;
            }
            if (!s.ot_fajl.includes(f.vid || f.fajl)) s.ot_fajl.push(f.vid || f.fajl);
            if ((r.broy || 0) > (s.broy || 0)) { s.broy = r.broy; s.ot = r.ot; s.do = r.do; }
            if (!s.cheklist_red && r.cheklist_red) { s.cheklist_red = r.cheklist_red; s.cheklist_kak = r.cheklist_kak; }
            for (const d of r.dosloven || []) if (!s.dosloven.includes(d)) s.dosloven.push(d);
        }
    }
    return [...po.values()];
}

// Списъкът от подадените обекти: редът и в колко от тях го има.
function podobniObshtSpisak(obekti) {
    const po = new Map();
    obekti.forEach(ob => {
        const i = podobniSpisak().indexOf(ob);
        for (const r of podobniRedoveNaObekta(ob)) {
            let s = po.get(r.klyuch);
            if (!s) po.set(r.klyuch, (s = { klyuch: r.klyuch, ime: r.ime, cheklist_red: '', cheklist_kak: '', pri: [] }));
            if (!s.cheklist_red && r.cheklist_red) { s.cheklist_red = r.cheklist_red; s.cheklist_kak = r.cheklist_kak; }
            s.pri.push({ obekt: i, ...r });
        }
    });
    // Каквото го има във всички — първо; после „само при някои“.
    return [...po.values()].sort((a, b) => b.pri.length - a.pri.length);
}

function podobniGodinaBelezhka(g) {
    if (!g) return 'годината не се вижда в акта';
    if (g < PODOBNI_OT_GODINA) return `от ${g} — по-стар от ${PODOBNI_OT_GODINA}, не е годен за източник`;
    if (new Date().getFullYear() - g > PODOBNI_SKOROSHNI)
        return `от ${g} — по-стар от две години, може да носи отминали изисквания`;
    return '';
}

function podobniBroyHtml(r) {
    const tablica = /\(таблица\)$/.test(r.ime);
    const broy = r.broy ? (tablica ? `${r.broy} реда в таблицата` : `${r.broy} бр.`) : '';
    const period = r.ot && r.do ? `от ${r.ot} до ${r.do}` : (r.ot || '');
    return [broy, period].filter(Boolean).join(' · ');
}

// Етапът се ИЗВАЖДА от раздела и се показва като предложение (заданието,

function podobniRisuvai() {
    const tyalo = document.getElementById('podobni-telo');
    if (!tyalo) return;
    const obekti = podobniSpisak();

    const obektiHtml = obekti.map((ob, i) => {
        const fajlove = (ob.fajlove || []).map(f => {
            const bel = podobniGodinaBelezhka(f.godina);
            return `<div class="podoben-fajl">
                <span class="podoben-vid">${_e(f.vid || 'не е ясно Акт 15 ли е или ОД')}</span>
                <span>${_e(f.fajl)}</span>
                <span class="tiho">${f.godina ? _e(f.godina) + ' г.' : ''} · ${(f.redove || []).length} документа · чете: ${_e(f.chetec || 'кодът')}</span>
                ${bel ? `<span class="greshka podoben-bel">${_e(bel)}</span>` : ''}
            </div>`;
        }).join('');
        return `<div class="kutiya-razdel podoben-obekt">
            <div class="redica" style="margin-bottom:4px">
                <span class="podoben-nomer">${i + 1}</span>
                <b class="podoben-ime">${_e(ob.ime || 'без име')}</b>
                <span style="margin-left:auto"></span>
                <label class="bt bt-tih">+ файл към този обект
                    <input type="file" accept=".docx,.doc,.pdf" multiple hidden onchange="podobniKachi(this.files, ${i}); this.value=''"></label>
                <button class="bt bt-tih" onclick="podobniMahni(${i})">махни</button>
            </div>
            <div class="podoben-fajl"><span class="podoben-vid">вид</span>
                <select class="podoben-vid-izbor${ob.vid ? '' : ' podoben-vid-prazen'}" onchange="podobniSmeniVid(${i}, this.value)">
                    <option value="">— какъв вид е? —</option>
                    ${PODOBNI_VIDOVE.map(v => `<option value="${v}"${ob.vid === v ? ' selected' : ''}>${v}</option>`).join('')}
                </select>
                ${ob.vid ? '<span class="tiho">казано от теб</span>' : ''}
            </div>
            ${podobniKategoriaHtml(ob, i)}
            ${fajlove}
            ${podobniPodHtml(ob)}
        </div>`;
    }).join('');

    tyalo.innerHTML = `
        <p class="poyasnenie">Завършен Акт 15 и ОД от обект, който прилича на твоя. Чете се .docx, с кода, без АИ — безплатно.
            .doc и PDF засега не се четат.<br>
            <b>Свързва се в обекта, по който работиш</b> — в момента, „сравнявам с“. Тогава „Липсва ми“ на всеки момент
            показва каквото подобният е имал, а ти го нямаш.</p>
        <div class="redica">
            <label class="bt bt-glaven">+ подобен обект
                <input type="file" accept=".docx,.doc,.pdf" multiple hidden onchange="podobniKachi(this.files, -1); this.value=''"></label>
            <span class="tiho">Акт 15 и ОД на ЕДИН обект — заедно.</span>
        </div>
        ${podobniHod ? `<div class="podsetka" id="podobni-hod">${podobniHod}</div>` : ''}
        ${obektiHtml}`;
}

function podobniSmeniVid(i, vid) {
    const ob = podobniSpisak()[i];
    if (!ob) return;
    ob.vid = PODOBNI_VIDOVE.includes(vid) ? vid : '';
    aktZapishi();
    podobniRisuvai();
}

// ── Качването ────────────────────────────────────────────────────────────────

// Подаваш файловете на един обект. Нищо не се чете без твоето „да“ — както при
// всяко друго четене, и тук се казва колко файла и кой ги чете.
async function podobniKachi(fajlove, kamObekt) {
    const vsichki = [...(fajlove || [])];
    if (!vsichki.length) return;
    const chetimi = vsichki.filter(f => /\.docx$/i.test(f.name));
    const otkazani = vsichki.filter(f => !/\.docx$/i.test(f.name))
        .map(f => `„${f.name}“ — ${/\.doc$/i.test(f.name) ? 'стар .doc, запиши го като .docx' : 'засега се четат само .docx'}`);
    if (!chetimi.length) {
        podobniHod = '❌ ' + otkazani.map(_e).join('<br>');
        podobniRisuvai();
        return;
    }
    const NR = String.fromCharCode(10);
    if (!confirm(`${chetimi.length} ${chetimi.length === 1 ? 'файл' : 'файла'}: ${chetimi.map(f => f.name).join(', ')}`
                 + NR + NR + 'Чете ги кодът на сървъра — .docx има текст, без АИ, безплатно.'
                 + (otkazani.length ? NR + NR + 'Не се четат: ' + otkazani.join('; ') : '') + NR + NR + 'Чета ли?')) return;

    const procheteni = [], greshki = [...otkazani];
    for (const f of chetimi) {
        podobniHod = `Чета „${_e(f.name)}“…`;
        podobniRisuvai();
        try {
            const data = await fileToBase64(f);
            const r = await aktApi('/api/podoben/chete', 'POST', { fajl: { ime: f.name, data } });
            if (r.greshka) greshki.push(`„${f.name}“ — ${r.greshka}`);
            else procheteni.push({ ...r.podoben, procheten_koga: new Date().toISOString() });
        } catch (e) {
            greshki.push(`„${f.name}“ — ${e.message}`);
        }
    }
    if (procheteni.length) {
        const spisak = podobniSpisak();
        const ob = kamObekt >= 0 && spisak[kamObekt] ? spisak[kamObekt]
            : (spisak[spisak.length] = { id: 'pod' + Date.now(), ime: '', vid: '', fajlove: [], dobaven: new Date().toISOString() });
        // Същият файл, качен пак, сменя стария — не се трупа два пъти.
        ob.fajlove = (ob.fajlove || []).filter(x => !procheteni.some(p => p.fajl === x.fajl)).concat(procheteni);
        if (!ob.ime) ob.ime = (procheteni.find(p => p.stroezh) || {}).stroezh || procheteni[0].fajl;
        aktZapishi();
    }
    podobniHod = greshki.length ? '❌ ' + greshki.map(_e).join('<br>') : '';
    podobniRisuvai();
    plotLyava();
}

function podobniMahni(i) {
    const spisak = podobniSpisak();
    const ob = spisak[i];
    if (!ob || !confirm(`Махам „${ob.ime}“ от подобните обекти? Файловете ти не се пипат — само прочетеното тук.`)) return;
    spisak.splice(i, 1);
    aktZapishi();
    podobniRisuvai();
    plotLyava();
}

// ── ВРЪЗКАТА С ОБЕКТА (25.11.2026) ───────────────────────────────────────────
// „Сравнявам с: Петракиев“ — казва се веднъж на строежа (`st.podobni`, списък
// с id от библиотеката) и важи за всички моменти.

function podobniNaStroezha(st) {
    const ids = (st && st.podobni) || [];
    return podobniSpisak().filter(o => ids.includes(o.id));
}

// Кой момент събира реда на подобния. Правилото е същото като за чеклиста —
// в първия момент, в който е нужен:
//   · акт или протокол по образец (обр. 2, 3, 5, 6, 7, 12, 14…) се изрежда в
//     Акт 15 — съставянето му при собствения момент е следващата стъпка;
//   · друг документ — по раздела, в който е стоял при подобния: „законосъобразно
//     започване“ → Протокол 2; всичко друго → Акт 15.
function podobniMomentZaRed(r) {
    if (/^(акт|протокол)\s+обр\./i.test(r.ime)) return 'Акт 15';
    const razdeli = [r.razdel, ...(r.razdeli || [])].join(' ');
    return /започване|законосъобразн/i.test(razdeli) ? 'Протокол 2' : 'Акт 15';
}

function podobniOpisPri(pri) {
    return pri.map(x => {
        const broy = podobniBroyHtml(x);
        return `при ${String(x.obekt_ime || '').slice(0, 40)}${String(x.obekt_ime || '').length > 40 ? '…' : ''}${broy ? ': ' + broy : ''}`;
    }).join(' · ');
}

// Редовете на свързаните подобни — в групите на моментите (на място).
//   · ред, който отговаря на ред от чеклиста (вързан от кода или същото име),
//     НЕ се добавя — до онзи ред пише „и при Петракиев: 28 бр.“;
//   · останалите стават редове в момента си, с „при Петракиев: …“.
// Наличието се смята като за всеки ред: вписано/отметнато/досие → „налично“.
function podobniVMomentite(p, st, grupi) {
    const svarzani = podobniNaStroezha(st);
    if (!svarzani.length || !Array.isArray(grupi)) return { dobaveni: 0, bez_myasto: 0 };
    const po = new Map();
    for (const ob of svarzani) {
        for (const r of podobniRedoveNaObekta(ob)) {
            let s = po.get(r.klyuch);
            if (!s) po.set(r.klyuch, (s = { ...r, pri: [] }));
            if (!s.cheklist_red && r.cheklist_red) s.cheklist_red = r.cheklist_red;
            s.pri.push({ obekt_ime: ob.ime, broy: r.broy, ot: r.ot, do: r.do, razdel: r.razdel, ime: r.ime });
        }
    }
    const kl = x => String(x || '').trim().toLowerCase();
    const vsichkiRedove = grupi.flatMap(g => g.dokumenti || []);
    let nalichni = [];
    try { nalichni = aktNalichni(st, p) || []; } catch (e) { nalichni = []; }
    const edno = (a, b) => typeof rechnikEdnoLi === 'function' ? rechnikEdnoLi(a, b) : kl(a) === kl(b);
    let dobaveni = 0, bez_myasto = 0;
    for (const r of po.values()) {
        const sashtiyat = vsichkiRedove.find(d => (r.cheklist_red && edno(d.dokument, r.cheklist_red)) || edno(d.dokument, r.ime));
        if (sashtiyat) {
            sashtiyat.pri_podoben = (sashtiyat.pri_podoben || []).concat(r.pri);
            continue;
        }
        const g = grupi.find(x => x.moment === podobniMomentZaRed(r));
        if (!g) { bez_myasto++; continue; }
        const red = { dokument: r.ime, uslovie: '', etap: g.moment === 'Протокол 2' ? 'начало' : 'подпис',
                      iskan_na: g.moment, ot_podoben: r.pri };
        red.sastoyanie = nalichni.includes(r.ime) ? 'налично' : (g.minal === false ? 'не му е времето' : 'очаква се');
        (g.dokumenti = g.dokumenti || []).push(red);
        vsichkiRedove.push(red);
        dobaveni++;
    }
    return { dobaveni, bez_myasto };
}

// В момента, над „Липсва ми“: с кого се сравнява и как се сменя.
function podobniVrazkaHtml(z) {
    const svarzani = podobniNaStroezha(z.st);
    const ostanali = podobniSpisak().filter(o => !svarzani.includes(o));
    return `<div class="podoben-vrazka">
        <span class="podoben-vrazka-etiket">сравнявам с:</span>
        ${svarzani.map(o => `<span class="podoben-chip">${_e(String(o.ime || '').slice(0, 50))}${o.kategoria ? ' · ' + _e(o.kategoria) + ' кат.' : ''}
            <button class="bt bt-tih" title="махни връзката" onclick="podobniOtvrazhi('${encodeURIComponent(o.id)}')">✕</button></span>`).join('')}
        ${ostanali.length ? `<select class="podoben-vid-izbor" onchange="podobniVrazhi(this.value)">
            <option value="">${svarzani.length ? '+ още един' : '— подобен обект —'}</option>
            ${ostanali.map(o => `<option value="${_e(o.id)}">${_e(String(o.ime || '').slice(0, 70))}${o.kategoria ? ' · ' + _e(o.kategoria) + ' кат.' : ''}</option>`).join('')}
        </select>` : ''}
        ${!podobniSpisak().length ? '<a class="kam" href="#/podobni">няма подобни — качи от „Подобни обекти“ →</a>' : ''}
        ${!svarzani.length && podobniSpisak().length ? '<span class="tiho">без подобен — „Липсва ми“ е само от чеклиста</span>' : ''}
    </div>`;
}

function podobniVrazhi(id) {
    const z = typeof momentZhiv === 'function' ? momentZhiv() : null;
    if (!z || !id) return;
    z.st.podobni = [...new Set([...(z.st.podobni || []), id])];
    aktZapishi();
    momentZaredi();
}

function podobniOtvrazhi(k) {
    const z = typeof momentZhiv === 'function' ? momentZhiv() : null;
    if (!z) return;
    const id = decodeURIComponent(k);
    z.st.podobni = (z.st.podobni || []).filter(x => x !== id);
    aktZapishi();
    momentZaredi();
}
