// АКТ СИСТЕМ · новото ПВА · podobni.js
// ПОДОБНИ ОБЕКТИ — `ДА ПРОЧЕТА/ЗАДАНИЕ-ПОДОБЕН-ОБЕКТ.md`
//
// 4а (24.11.2026): подаваш завършен Акт 15 и ОД от обект, който прилича на
// твоя. Виждаш СПИСЪК, не чеклист: какво е изреждал онзи акт, дословно, в кой
// раздел, с брой и период, в колко от подадените обекти го има и на кой ред от
// днешния чеклист отговаря.
//
// 4б (24.11.2026): три отговора на ред, твои — по ВИДА строеж (операторът,
// 28.10: „Профилът е ВИДЪТ“):
//   · изисквай      → собствен ред в чеклиста (`cheklist_sobstveni`, както
//                     редовете от „Видени, но неописани“), с условие „вид ∈ …“
//                     и с основание откъде е научен;
//   · не и за мен   → запомня се, за да не пита пак;
//   · същото като…  → слива се с ред от чеклиста; пази и двете имена.
// Отговорите живеят на сървъра (`podobni_otgovori`) — трупат се от всички
// обекти, не от един браузър. Заключеният чеклист не се пипа.
//
// Чете сървърът (`/api/podoben/chete`), с кода, без АИ — затова е безплатно.

'use strict';

// Годни за източник — от 2017 г. нататък; „от последните две години“
// (отговорите на оператора от 28.10.2026, в заданието).
const PODOBNI_OT_GODINA = 2017;
const PODOBNI_SKOROSHNI = 2;
const PODOBNI_VIDOVE = ['сграда', 'линеен', 'съоръжение'];   // същите думи като признака „вид“ на сървъра
const PODOBNI_RAZDEL = 'Въвеждане в експлоатация — от подобен обект';

let podobniHod = '';
let podobniVid = '';            // за кой вид е списъкът
let podobniOtg = null;          // { 'вид|ключ': {...} } — от сървъра
let podobniRedoveChek = null;   // [{dokument, otkade}] — за „същото като…“
let podobniBira = '';           // ключът, за който е отворен изборът „същото като…“
let podobniOtgGreshka = '';

function podobniSpisak() {
    return (aktDanni.podobni = Array.isArray(aktDanni.podobni) ? aktDanni.podobni : []);
}

async function podobniOtvori() {
    podobniHod = '';
    podobniBira = '';
    podobniRisuvai();
    await podobniZarediOtgovori();
    podobniRisuvai();
}

async function podobniZarediOtgovori() {
    try {
        const r = await aktApi('/api/danni/podobni_otgovori');
        podobniOtg = (r && r.stoynost && typeof r.stoynost === 'object') ? r.stoynost : {};
        podobniOtgGreshka = '';
    } catch (e) {
        podobniOtg = null;
        // Без отговорите не се пита — иначе „не и за мен“ би питало пак.
        podobniOtgGreshka = e.izteklo ? 'изтече ти достъпът — влез, за да отговаряш'
            : `отговорите не се прочетоха от сървъра (${e.message}) — затова не питам`;
    }
}

async function podobniZapishiOtgovori() {
    await aktApi('/api/danni/podobni_otgovori', 'POST', { stoynost: podobniOtg });
}

function podobniOtgovor(vid, klyuch) {
    if (!podobniOtg) return null;
    return podobniOtg[vid + '|' + klyuch] || podobniOtg['*|' + klyuch] || null;
}

// Един обект може да има и Акт 15, и ОД — един и същ документ стои и в двата.
// Затова в обекта редът е ЕДИН: бройката е по-голямата, разделът — от акта.
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
// 28.10: „законосъобразно започване“ → начало; останалото → подпис).
function podobniEtapPredlozhenie(r) {
    const razdeli = r.pri.map(x => x.razdel || '').join(' ');
    return /започване|законосъобразн/i.test(razdeli) ? 'начало' : 'подпис';
}

function podobniOtgovorHtml(r, vid, k) {
    const otg = podobniOtgovor(vid, r.klyuch);
    if (otg && otg.otgovor === 'izisquay')
        return `<div class="podoben-otg podoben-otg-da">✔ изисква се за „${_e(otg.vid)}“ — ${otg.etap === 'начало'
            ? 'за да започнеш' : 'за да подпишеш'} · твой ред „${_e(otg.red)}“
            <button class="bt bt-tih" onclick="podobniVarni('${k}')">върни</button></div>`;
    if (otg && otg.otgovor === 'sashtoto')
        return `<div class="podoben-otg">= същото като „${_e(otg.red)}“ · казано от теб
            <button class="bt bt-tih" onclick="podobniVarni('${k}')">върни</button></div>`;
    if (otg && otg.otgovor === 'ne')
        return `<div class="podoben-otg podoben-otg-ne">не и за мен (${_e(otg.vid)})
            <button class="bt bt-tih" onclick="podobniVarni('${k}')">върни</button></div>`;
    if (!podobniOtg) return '';
    if (podobniBira === r.klyuch) {
        const opcii = (podobniRedoveChek || []).map(x =>
            `<option value="${_e(x.dokument)}">${_e(x.dokument)}${x.otkade === 'твой ред' ? ' (твой ред)' : ''}</option>`).join('');
        return `<div class="podoben-zhestove">
            ${podobniRedoveChek ? `<select class="podoben-izbor" onchange="podobniSashtoto('${k}', this.value)">
                <option value="">— кой ред от чеклиста? —</option>${opcii}</select>`
                : '<span class="tiho">чета редовете на чеклиста…</span>'}
            <button class="bt bt-tih" onclick="podobniBira='';podobniRisuvai()">отказ</button></div>`;
    }
    // Предлага се (тъмен бутон) само каквото го има във ВСИЧКИ от поне два
    // обекта — един обект показва събраното там, не правило.
    const nVid = podobniObektiZaVid(vid).length;
    const vsichki = nVid > 1 && r.pri.length === nVid;
    const pred = podobniEtapPredlozhenie(r);
    const izisquay = etap => `<button class="bt${vsichki && etap === pred ? ' bt-glaven' : ''}"
        onclick="podobniIzisquay('${k}','${etap}')">изисквай — ${etap === 'начало' ? 'за да започна' : 'за да подпиша'}${
        etap === pred ? ' <span class="podoben-pred">(предложено от раздела)</span>' : ''}</button>`;
    return `<div class="podoben-zhestove">
        ${r.cheklist_red
            ? `<button class="bt${vsichki ? ' bt-glaven' : ''}" onclick="podobniSashtoto('${k}', decodeURIComponent('${encodeURIComponent(r.cheklist_red)}'))">✔ същото е като „${_e(r.cheklist_red)}“</button>
               <button class="bt" onclick="podobniOtvoriIzbor('${k}')">друг ред…</button>`
            : `${izisquay('подпис')}${izisquay('начало')}
               <button class="bt" onclick="podobniOtvoriIzbor('${k}')">същото като…</button>`}
        <button class="bt bt-tih" onclick="podobniNe('${k}')">не и за мен</button>
    </div>`;
}

function podobniObektiZaVid(vid) {
    return podobniSpisak().filter(o => (o.vid || '') === vid);
}

function podobniRisuvai() {
    const tyalo = document.getElementById('podobni-telo');
    if (!tyalo) return;
    const obekti = podobniSpisak();
    const vidove = [...new Set(obekti.map(o => o.vid).filter(Boolean))];
    if (!vidove.includes(podobniVid)) podobniVid = vidove[0] || '';
    const zaVid = podobniVid ? podobniObektiZaVid(podobniVid) : obekti;
    const n = zaVid.length;
    const obshti = podobniObshtSpisak(zaVid);
    const bezVid = obekti.filter(o => !o.vid).length;

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
                ${ob.vid ? '<span class="tiho">казано от теб</span>' : '<span class="greshka">без вид отговорите не се пазят — профилът е по вид</span>'}
            </div>
            ${fajlove}
        </div>`;
    }).join('');

    const redHtml = r => {
        const vsichki = r.pri.length === n;
        const k = encodeURIComponent(r.klyuch);
        const otg = podobniVid ? podobniOtgovor(podobniVid, r.klyuch) : null;
        const pri = r.pri.map(x => {
            const dosl = (x.dosloven || []).map(d => `<li>${_e(d)}</li>`).join('');
            return `<div class="podoben-pri">
                ${obekti.length > 1 ? `<span class="podoben-nomer podoben-nomer-malak">${x.obekt + 1}</span>` : ''}
                <span class="podoben-razdel">в „${_e(x.razdel || 'без раздел')}“</span>
                ${podobniBroyHtml(x) ? `<span class="podoben-broy">${_e(podobniBroyHtml(x))}</span>` : ''}
                <details class="podoben-dosl"><summary>дословно</summary><ul>${dosl}</ul></details>
            </div>`;
        }).join('');
        const chek = otg && otg.otgovor === 'sashtoto' ? ''
            : `<div class="otkade">${r.cheklist_red
                ? `в днешния чеклист: „${_e(r.cheklist_red)}“ · вързал го е ${_e(String(r.cheklist_kak || '').replace(/^системата — /, 'кодът, '))}`
                : 'в днешния чеклист: няма ред с това име'}</div>`;
        return `<div class="podoben-red${vsichki ? '' : ' podoben-red-chast'}${otg ? ' podoben-red-otg' : ''}" data-klyuch="${_e(r.klyuch)}">
            <div class="podoben-red-glava">
                <span class="podoben-dok">${_e(r.ime)}</span>
                ${n > 1 ? `<span class="podoben-kolko ${vsichki ? 'podoben-vsichki' : ''}">${r.pri.length} от ${n}${vsichki ? '' : ' — само при ' + (r.pri.length === 1 ? 'единия' : 'някои')}</span>` : ''}
            </div>
            ${pri}
            ${chek}
            ${podobniVid ? podobniOtgovorHtml(r, podobniVid, k) : ''}
        </div>`;
    };

    // Казаното „не и за мен“ отива долу, свито — не пита пак, но се вижда.
    const ne = obshti.filter(r => { const o = podobniVid && podobniOtgovor(podobniVid, r.klyuch); return o && o.otgovor === 'ne'; });
    const ostanali = obshti.filter(r => !ne.includes(r));

    tyalo.innerHTML = `
        <p class="poyasnenie">Завършен Акт 15 и ОД от обект, който прилича на твоя. Виждаш какво е изреждал онзи акт —
            дословно, в кой раздел, с брой и период. Чете се .docx, с кода, без АИ — безплатно. .doc и PDF засега не се четат.<br>
            <b>Нищо не влиза в чеклиста само.</b> „Изисквай“ го прави твой ред — като редовете от „Видени, но неописани“:
            влиза в чеклиста на документите за този вид строеж. В „Липсва ми“ на Акт 15 още не излиза — това е следващата стъпка.</p>
        <div class="redica">
            <label class="bt bt-glaven">+ подобен обект
                <input type="file" accept=".docx,.doc,.pdf" multiple hidden onchange="podobniKachi(this.files, -1); this.value=''"></label>
            <span class="tiho">Акт 15 и ОД на ЕДИН обект — заедно. Два обекта от последните две години са достатъчно.</span>
        </div>
        ${podobniHod ? `<div class="podsetka" id="podobni-hod">${podobniHod}</div>` : ''}
        ${obektiHtml}
        ${obshti.length ? `<div class="kutiya-razdel">
            <div class="nadpis">Списъкът${podobniVid ? ` за вид „${_e(podobniVid)}“` : ''} · ${obshti.length} документа${n > 1 ? ` от ${n} обекта` : ''}</div>
            ${vidove.length > 1 ? `<div class="redica">${vidove.map(v => `<button class="bt${v === podobniVid ? ' izbran' : ''}"
                onclick="podobniVid='${v}';podobniBira='';podobniRisuvai()">${v} · ${podobniObektiZaVid(v).length}</button>`).join('')}</div>` : ''}
            <div class="poyasnenie">${!podobniVid
                ? '<span class="greshka">Кажи какъв вид е обектът (горе) — отговорите се пазят по вид строеж.</span> ' : ''}${n > 1
                ? 'Първо — каквото го има във всички (предложено е „изисквай“); после — каквото го има само при някои. То е въпрос, не правило.'
                : 'Един обект показва какво е СЪБРАНО там, не какво е трябвало. Добави втори — каквото го има и в двата, е правило.'}
                ${bezVid && podobniVid ? ` <span class="greshka">${bezVid} ${bezVid === 1 ? 'обект е' : 'обекта са'} без вид и не са в списъка.</span>` : ''}
                ${podobniOtgGreshka ? `<br><span class="greshka">${_e(podobniOtgGreshka)}</span>` : ''}</div>
            ${ostanali.map(redHtml).join('')}
            ${ne.length ? `<details class="podoben-ne"><summary>не и за мен · ${ne.length}</summary>${ne.map(redHtml).join('')}</details>` : ''}
        </div>` : ''}`;
}

// ── Трите отговора ───────────────────────────────────────────────────────────

function _podobniRed(klyuch) {
    return podobniObshtSpisak(podobniObektiZaVid(podobniVid)).find(r => r.klyuch === klyuch);
}

function _podobniOsnovanie(r) {
    const obekti = podobniObektiZaVid(podobniVid);
    const imena = r.pri.map(x => {
        const ob = podobniSpisak()[x.obekt] || {};
        const g = Math.max(0, ...(ob.fajlove || []).map(f => f.godina || 0));
        return `„${String(ob.ime || '').slice(0, 50)}${String(ob.ime || '').length > 50 ? '…' : ''}“${g ? ' (' + g + ')' : ''}`;
    });
    const razdel = (r.pri[0] || {}).razdel;
    return `от подобен обект: ${imena.join(', ')}${razdel ? ` · раздел „${razdel}“` : ''}`
        + ` · ${r.pri.length} от ${obekti.length} · добавен от оператора на ${new Date().toLocaleDateString('bg-BG')}`;
}

function _podobniZapis(klyuch, otg, vid) {
    podobniOtg[(vid || podobniVid) + '|' + klyuch] = {
        ...otg, klyuch, vid: vid || podobniVid, koga: new Date().toISOString(),
        koy: typeof _s2Koy === 'function' ? _s2Koy() : '',
    };
}

// Кешът на кандидатите (`js/12b-kandidati.js`) пази собствените редове в
// паметта и при следващо одобрение ги записва обратно. Пишем ли тук покрай
// него, кешът се изпразва — иначе би върнал стария списък и изтрил новия ред.
function _podobniIzchistiKesha() {
    if (typeof _kandSobstveni !== 'undefined') _kandSobstveni = null;   // eslint-disable-line no-global-assign
    if (typeof _kandidati !== 'undefined') _kandidati = null;          // eslint-disable-line no-global-assign
}

async function podobniIzisquay(k, etap) {
    const klyuch = decodeURIComponent(k);
    const r = _podobniRed(klyuch);
    if (!r || !podobniVid || !podobniOtg) return;
    const ime = (prompt(`Как да се казва редът в чеклиста?\n(за вид „${podobniVid}“, ${etap === 'начало' ? 'за да започнеш' : 'за да подпишеш'})`, r.ime) || '').trim();
    if (!ime) return;
    try {
        if (!podobniRedoveChek) await podobniZarediRedove();
        // Ред със същото име в заключения чеклист сървърът би прескочил мълчаливо.
        const sashto = (podobniRedoveChek || []).find(x => x.dokument.trim().toLowerCase() === ime.toLowerCase());
        if (sashto) {
            podobniHod = `❌ „${_e(ime)}“ вече е ${sashto.otkade === 'твой ред' ? 'твой ред' : 'ред в чеклиста'} — отговори „същото като…“.`;
            podobniRisuvai();
            return;
        }
        const sega = await aktApi('/api/danni/cheklist_sobstveni');
        const sobstveni = Array.isArray(sega && sega.stoynost) ? sega.stoynost : [];
        sobstveni.push({
            dokument: ime, etap: etap === 'начало' ? 'начало' : 'подпис',
            // „∈“, не „=“: старите „вид = …“ сървърът пренаписва в съставки.
            uslovie: `вид ∈ ${podobniVid}`, razdel: PODOBNI_RAZDEL, dokazva_se: 'номер и дата',
            osnovanie: _podobniOsnovanie(r), podoben: klyuch, vid: podobniVid,
        });
        await aktApi('/api/danni/cheklist_sobstveni', 'POST', { stoynost: sobstveni });
        _podobniIzchistiKesha();
        _podobniZapis(klyuch, { otgovor: 'izisquay', red: ime, etap, imena: [r.ime] });
        await podobniZapishiOtgovori();
        if (typeof addHistory === 'function')
            addHistory('edit', null, `Чеклист: ред „${ime}“ за вид „${podobniVid}“ — от подобен обект (${etap})`);
        podobniHod = '';
    } catch (e) {
        podobniHod = `❌ Не се записа: ${_e(e.message)}`;
    }
    podobniRisuvai();
}

async function podobniNe(k) {
    const klyuch = decodeURIComponent(k);
    if (!podobniVid || !podobniOtg) return;
    try {
        _podobniZapis(klyuch, { otgovor: 'ne', imena: [(_podobniRed(klyuch) || {}).ime || klyuch] });
        await podobniZapishiOtgovori();
        podobniHod = '';
    } catch (e) { podobniHod = `❌ Не се записа: ${_e(e.message)}`; }
    podobniRisuvai();
}

async function podobniZarediRedove() {
    const r = await aktApi('/api/podoben/redove');
    podobniRedoveChek = (r && r.redove) || [];
}

async function podobniOtvoriIzbor(k) {
    podobniBira = decodeURIComponent(k);
    podobniRisuvai();
    if (!podobniRedoveChek) {
        try { await podobniZarediRedove(); } catch (e) { podobniHod = `❌ Редовете не се прочетоха: ${_e(e.message)}`; }
        podobniRisuvai();
    }
}

// „Това е същото като…“ не зависи от вида: един документ с две имена е един
// документ навсякъде. Пазят се и двете имена (заданието: „за да се разпознава
// следващия път и по двете“).
async function podobniSashtoto(k, red) {
    const klyuch = decodeURIComponent(k);
    if (!red || !podobniOtg) return;
    try {
        _podobniZapis(klyuch, { otgovor: 'sashtoto', red, imena: [(_podobniRed(klyuch) || {}).ime || klyuch, red] }, '*');
        await podobniZapishiOtgovori();
        podobniBira = '';
        podobniHod = '';
    } catch (e) { podobniHod = `❌ Не се записа: ${_e(e.message)}`; }
    podobniRisuvai();
}

// Един жест връща всичко: отговора и — при „изисквай“ — собствения ред.
async function podobniVarni(k) {
    const klyuch = decodeURIComponent(k);
    const otg = podobniOtgovor(podobniVid, klyuch);
    if (!otg) return;
    try {
        if (otg.otgovor === 'izisquay') {
            const sega = await aktApi('/api/danni/cheklist_sobstveni');
            const sobstveni = (Array.isArray(sega && sega.stoynost) ? sega.stoynost : [])
                .filter(x => !(x.podoben === klyuch && x.vid === otg.vid));
            await aktApi('/api/danni/cheklist_sobstveni', 'POST', { stoynost: sobstveni });
            _podobniIzchistiKesha();
        }
        delete podobniOtg[otg.vid + '|' + klyuch];
        await podobniZapishiOtgovori();
        podobniHod = '';
    } catch (e) { podobniHod = `❌ Не се върна: ${_e(e.message)}`; }
    podobniRisuvai();
}

function podobniSmeniVid(i, vid) {
    const ob = podobniSpisak()[i];
    if (!ob) return;
    ob.vid = PODOBNI_VIDOVE.includes(vid) ? vid : '';
    if (ob.vid) podobniVid = ob.vid;
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
    if (!ob || !confirm(`Махам „${ob.ime}“ от подобните обекти? Файловете ти не се пипат — само прочетеното тук. Отговорите ти остават.`)) return;
    spisak.splice(i, 1);
    aktZapishi();
    podobniRisuvai();
    plotLyava();
}
