// АКТ СИСТЕМ · новото ПВА · rechnik.js
// РЕЧНИКЪТ — един документ, всичките му имена (25.11.2026)
//
// Операторът: „защо има моменти.md и чеклист документи.md… системата не е
// предполагаема, тя е реална — редно е да създаде речник след прочитането на
// безброй примери“. Мярката от същия ден (13 досиета, 242 прочетени документа):
//   · двата файла се разминават само в четири реда — и точно те не стигат
//     „Липсва ми“ (договорът с ЕРМ, договорът с ВиК, становищата за СВО/СКО);
//   · четецът не е последователен: един вид документ — към различни редове
//     (договорът с ЕРМ — към три различни реда при различни обекти);
//   · редове само в чеклиста, към които четецът връзва — моментите не ги виждат.
//
// Тук операторът решава ВЕДНЪЖ; речникът е на сървъра (`/api/danni/rechnik`),
// важи за всички обекти. Двата заключени файла не се пипат — речникът стои до
// тях. Нищо не се слива само: системата показва броевете, операторът казва.
//
// Как се прилага: „Липсва ми“ пита за ДОКУМЕНТА, не за името —
//   · ред от досието, вързан към едно име, затваря и другите имена от групата;
//   · вид документ, решен „това е редът“, затваря решения ред;
//   · подобният обект не дублира ред, чието име е в една група с негов.

'use strict';

let _rechnik = null;          // { grupi: [{imena, koga, koy}], chetec: {нормализирано: {red, zavisi}}, razlichni: [], nyama: [] }
let _rechnikIzvori = null;    // { cheklist: [...], momenti: [...] }
let _rechnikZarezhda = null;
let rechnikHod = '';

const _rk = s => String(s || '').toLowerCase().replace(/[„“”"«»()\.,;:—–-]/g, ' ').replace(/\s+/g, ' ').trim();
const _RK_STOP = new Set(['на', 'за', 'и', 'в', 'от', 'с', 'по', 'към', 'или', 'при', 'се', 'до', 'със', 'не', 'е']);
const _rkDumi = s => new Set(_rk(s).split(' ').filter(w => w.length > 2 && !_RK_STOP.has(w)));
function _rkShodstvo(a, b) {
    const A = _rkDumi(a), B = _rkDumi(b);
    const obshto = [...A].filter(x => B.has(x)).length;
    return obshto / Math.max(1, new Set([...A, ...B]).size);
}

// Под този праг на сходство системата НЕ предлага ред — по-добре празно и
// избор, отколкото „Оценка от техническия контрол“ → „Решение по екологична
// оценка“ (видяно на истинските данни, 25.11.2026).
const RK_PRAG = 0.28;
function _rkNaiBlizko(ime, spisak) {
    const b = spisak.slice().sort((x, y) => _rkShodstvo(ime, y) - _rkShodstvo(ime, x))[0] || '';
    return b && _rkShodstvo(ime, b) >= RK_PRAG ? b : '';
}

function _rechnikPrazen() { return { grupi: [], chetec: {}, razlichni: [], nyama: [] }; }

async function rechnikZaredi(nanovo) {
    if (_rechnik && !nanovo) return _rechnik;
    if (_rechnikZarezhda && !nanovo) return _rechnikZarezhda;
    _rechnikZarezhda = (async () => {
        try {
            const r = await aktApi('/api/danni/rechnik');
            _rechnik = Object.assign(_rechnikPrazen(), (r && r.stoynost) || {});
        } catch (e) {
            // Без речника всичко работи както преди — но се казва.
            _rechnik = Object.assign(_rechnikPrazen(), { _greshka: e.message });
        }
        return _rechnik;
    })();
    const r = await _rechnikZarezhda;
    _rechnikZarezhda = null;
    return r;
}

async function _rechnikZapishi() {
    const { _greshka, ...chist } = _rechnik;
    await aktApi('/api/danni/rechnik', 'POST', { stoynost: chist });
}

// ── Прилагането (синхронно — речникът е зареден преди моментите) ─────────────

function rechnikSashti(ime) {
    const k = _rk(ime);
    if (!k || !_rechnik) return [ime];
    const g = (_rechnik.grupi || []).find(x => (x.imena || []).some(i => _rk(i) === k));
    return g ? g.imena.slice() : [ime];
}

function rechnikEdnoLi(a, b) {
    if (_rk(a) === _rk(b)) return true;
    return rechnikSashti(a).some(x => _rk(x) === _rk(b));
}

// Наличното, видяно през речника: каквото е налично под едно име, е налично и
// под другите му имена; прочетен документ от решен вид затваря решения ред.
// Само ДОБАВЯ към преброеното от кухнята — правилото кое се брои (сверено и
// пр.) остава нейно: вид се прилага само за документ, който тя вече е броила.
function rechnikRazshiri(nalichni, st) {
    if (!_rechnik) return nalichni;
    const izhod = new Set(nalichni || []);
    for (const ime of nalichni || []) for (const x of rechnikSashti(ime)) izhod.add(x);
    const dok = ((st && st.sloy2 && st.sloy2.od && st.sloy2.od.dokumenti) || []);
    for (const d of dok) {
        if (!d.cheklist_red || !izhod.has(d.cheklist_red)) continue;
        const resh = (_rechnik.chetec || {})[_rk(d.vid)];
        if (resh && resh.red && !resh.zavisi) for (const x of rechnikSashti(resh.red)) izhod.add(x);
    }
    return [...izhod];
}

// ── Какво чака решение (смята се от живите данни) ────────────────────────────

function _rkVsichkiDosieta() {
    const docs = [];
    for (const p of (aktDanni.projects || []))
        for (const st of (typeof aktStroezhi === 'function' ? aktStroezhi(p) : [p]))
            for (const d of ((st.sloy2 && st.sloy2.od && st.sloy2.od.dokumenti) || [])) docs.push(d);
    return docs;
}

function rechnikResheniya() {
    const iz = _rechnikIzvori || { cheklist: [], momenti: [] };
    const ch = new Map(iz.cheklist.map(x => [_rk(x), x])), mo = new Map(iz.momenti.map(x => [_rk(x), x]));
    const r = _rechnik || _rechnikPrazen();
    const razlichni = new Set(r.razlichni || []);
    const izhod = [];

    // 1. Двата файла: ред в моментите, чието име го няма в чеклиста.
    const samoCh = iz.cheklist.filter(x => !mo.has(_rk(x)));
    for (const m of iz.momenti.filter(x => !ch.has(_rk(x)))) {
        const pred = _rkNaiBlizko(m, samoCh);
        izhod.push({ tip: 'faylove', klyuch: 'f|' + _rk(m), momenti: m, predlozhenie: pred,
            reshen: rechnikSashti(m).some(x => ch.has(_rk(x))) || razlichni.has(_rk(m) + '|' + _rk(pred)) || (r.nyama || []).includes(_rk(m)) });
    }

    // 2. Четецът: един вид документ — към различни редове.
    const dok = _rkVsichkiDosieta();
    const poVid = new Map();
    for (const d of dok) {
        if (!d.cheklist_red || !d.vid) continue;
        const k = _rk(d.vid);
        if (!poVid.has(k)) poVid.set(k, { ime: d.vid, redove: new Map() });
        const e = poVid.get(k);
        e.redove.set(d.cheklist_red, (e.redove.get(d.cheklist_red) || 0) + 1);
    }
    for (const [k, e] of poVid) {
        if (e.redove.size < 2) continue;
        const redove = [...e.redove].map(([red, broy]) => ({ red, broy, vMomentite: mo.has(_rk(red)) }))
            .sort((a, b) => b.broy - a.broy);
        izhod.push({ tip: 'chetec', klyuch: 'c|' + k, ime: e.ime, redove, reshen: !!(r.chetec || {})[k] });
    }

    // 3. Редове само в чеклиста, към които четецът връзва — моментите не ги виждат.
    const broi = new Map();
    for (const d of dok) if (d.cheklist_red && !mo.has(_rk(d.cheklist_red)))
        broi.set(d.cheklist_red, (broi.get(d.cheklist_red) || 0) + 1);
    for (const [red, broy] of broi) {
        const vecheVA = izhod.some(x => x.tip === 'faylove' && _rk(x.predlozhenie) === _rk(red));
        if (vecheVA) continue;     // решава се в т. 1 — не се пита два пъти
        const pred = _rkNaiBlizko(red, iz.momenti);
        izhod.push({ tip: 'samo_cheklist', klyuch: 's|' + _rk(red), red, broy, predlozhenie: pred,
            reshen: rechnikSashti(red).some(x => mo.has(_rk(x))) || (r.nyama || []).includes(_rk(red)) });
    }
    return izhod;
}

// ── Стаята ───────────────────────────────────────────────────────────────────

async function rechnikOtvori() {
    rechnikHod = '';
    const t = document.getElementById('rechnik-telo');
    if (t) t.innerHTML = '<div class="chaka">Чета речника…</div>';
    try {
        await rechnikZaredi(true);
        if (!_rechnikIzvori) _rechnikIzvori = await aktApi('/api/rechnik/izvori');
    } catch (e) {
        rechnikHod = `❌ ${_e(e.message)}`;
    }
    rechnikRisuvai();
}

function _rkOpcii(spisak, izbran) {
    return spisak.map(x => `<option value="${_e(x)}"${x === izbran ? ' selected' : ''}>${_e(x)}</option>`).join('');
}

function rechnikRisuvai() {
    const t = document.getElementById('rechnik-telo');
    if (!t) return;
    const vsichki = rechnikResheniya();
    const chakat = vsichki.filter(x => !x.reshen);
    const k = x => encodeURIComponent(x);
    const red = x => {
        if (x.tip === 'faylove') return `<div class="rk-red${x.reshen ? ' rk-reshen' : ''}">
            <div class="rk-ime">„${_e(x.momenti)}“ <span class="otkade">в моментите</span></div>
            ${x.predlozhenie ? `<div class="rk-ime">„${_e(x.predlozhenie)}“ <span class="otkade">в чеклиста — най-близкото</span></div>` : ''}
            ${x.reshen ? `<div class="rk-otg">${rechnikEdnoLi(x.momenti, x.predlozhenie) ? '✔ един документ' : '✕ различни'}
                <button class="bt bt-tih" onclick="rechnikVarni('${k(x.momenti)}','${k(x.predlozhenie)}')">върни</button></div>`
            : `<div class="rk-zhestove">
                ${x.predlozhenie ? `<button class="bt bt-glaven" onclick="rechnikSashto('${k(x.momenti)}','${k(x.predlozhenie)}')">✔ един документ</button>
                <button class="bt" onclick="rechnikRazlichni('${k(x.momenti)}','${k(x.predlozhenie)}')">✕ различни</button>` : ''}
                <select class="podoben-vid-izbor" onchange="this.value && rechnikSashto('${k(x.momenti)}', encodeURIComponent(this.value))">
                    <option value="">друг ред от чеклиста…</option>${_rkOpcii((_rechnikIzvori || {}).cheklist || [])}</select></div>`}
        </div>`;
        if (x.tip === 'chetec') {
            const resh = ((_rechnik || {}).chetec || {})[x.klyuch.slice(2)];
            return `<div class="rk-red${x.reshen ? ' rk-reshen' : ''}">
            <div class="rk-ime">четецът чете „${_e(x.ime)}“ и го връзва към:</div>
            ${x.redove.map(r => `<div class="rk-izbor">${r.broy} × „${_e(r.red)}“${r.vMomentite ? '' : ' <span class="greshka">— няма го в моментите</span>'}
                ${x.reshen ? (resh && resh.red === r.red ? ' <b class="rk-otg">✔ това е редът</b>' : '')
                : ` <button class="bt" onclick="rechnikChetec('${k(x.klyuch.slice(2))}','${k(r.red)}')">✔ това е редът</button>`}</div>`).join('')}
            ${x.reshen ? `<div class="rk-otg">${resh && resh.zavisi ? 'и двата са верни — зависи от документа' : ''}
                <button class="bt bt-tih" onclick="rechnikChetecVarni('${k(x.klyuch.slice(2))}')">върни</button></div>`
            : `<div class="rk-zhestove"><button class="bt bt-tih" onclick="rechnikChetec('${k(x.klyuch.slice(2))}','', true)">и двата са верни — зависи от документа</button></div>`}
        </div>`;
        }
        return `<div class="rk-red${x.reshen ? ' rk-reshen' : ''}">
            <div class="rk-ime">„${_e(x.red)}“ <span class="otkade">само в чеклиста · четецът е вързал ${x.broy} ${x.broy === 1 ? 'документ' : 'документа'} към него</span></div>
            ${x.reshen ? `<div class="rk-otg">${((_rechnik || {}).nyama || []).includes(_rk(x.red)) ? 'няма го в моментите — не е за тях'
                : '✔ ' + _e(rechnikSashti(x.red).filter(i => _rk(i) !== _rk(x.red)).join(' · '))}
                <button class="bt bt-tih" onclick="rechnikVarni('${k(x.red)}','')">върни</button></div>`
            : `<div class="rk-zhestove">
                ${x.predlozhenie ? `<button class="bt" onclick="rechnikSashto('${k(x.red)}','${k(x.predlozhenie)}')">✔ същото като „${_e(x.predlozhenie)}“</button>` : ''}
                <select class="podoben-vid-izbor" onchange="this.value && rechnikSashto('${k(x.red)}', encodeURIComponent(this.value))">
                    <option value="">друг ред от моментите…</option>${_rkOpcii((_rechnikIzvori || {}).momenti || [])}</select>
                <button class="bt bt-tih" onclick="rechnikNyama('${k(x.red)}')">няма го в моментите</button></div>`}
        </div>`;
    };
    const razdel = (tip, nadpis, poyasnenie) => {
        const s = vsichki.filter(x => x.tip === tip);
        if (!s.length) return '';
        const ch = s.filter(x => !x.reshen), re = s.filter(x => x.reshen);
        return `<div class="kutiya-razdel">
            <div class="nadpis">${nadpis} · ${ch.length ? `${ch.length} чакат` : 'решени'}</div>
            <p class="poyasnenie">${poyasnenie}</p>
            ${ch.map(red).join('')}
            ${re.length ? `<details class="podoben-ne"><summary>решени · ${re.length}</summary>${re.map(red).join('')}</details>` : ''}
        </div>`;
    };
    t.innerHTML = `
        <p class="poyasnenie">Един документ — всичките му имена. Решаваш веднъж, важи за всички обекти. Двата ти файла не се пипат.
            <b>${chakat.length ? `Чакат ${chakat.length} от ${vsichki.length}.` : `Всичките ${vsichki.length} са решени.`}</b></p>
        ${rechnikHod ? `<div class="podsetka">${rechnikHod}</div>` : ''}
        ${(_rechnik || {})._greshka ? `<div class="greshka">Речникът не се прочете от сървъра: ${_e(_rechnik._greshka)}</div>` : ''}
        ${razdel('faylove', 'Двата файла казват различно', 'Ред в моментите, чието име го няма в чеклиста. Затова прочетеното в досието не го затваря.')}
        ${razdel('chetec', 'Четецът връзва един документ към различни редове', 'Броевете са от досиетата на всичките ти обекти.')}
        ${razdel('samo_cheklist', 'Редове само в чеклиста', 'Четецът връзва към тях, а „Липсва ми“ не ги вижда — моментите ги нямат.')}`;
}

// ── Жестовете ────────────────────────────────────────────────────────────────

async function _rkSled(fn) {
    try {
        await rechnikZaredi();
        fn(_rechnik);
        await _rechnikZapishi();
        rechnikHod = '';
    } catch (e) {
        rechnikHod = `❌ Не се записа: ${_e(e.message)}`;
    }
    rechnikRisuvai();
}

const _rkMeta = () => ({ koga: new Date().toISOString(), koy: typeof _s2Koy === 'function' ? _s2Koy() : '' });

function rechnikSashto(a, b) {
    a = decodeURIComponent(a); b = decodeURIComponent(b);
    return _rkSled(r => {
        const ga = r.grupi.find(g => g.imena.some(i => _rk(i) === _rk(a)));
        const gb = r.grupi.find(g => g.imena.some(i => _rk(i) === _rk(b)));
        if (ga && gb && ga !== gb) { ga.imena = [...new Set([...ga.imena, ...gb.imena])]; r.grupi = r.grupi.filter(g => g !== gb); }
        else if (ga) { if (!ga.imena.some(i => _rk(i) === _rk(b))) ga.imena.push(b); }
        else if (gb) { if (!gb.imena.some(i => _rk(i) === _rk(a))) gb.imena.push(a); }
        else r.grupi.push({ imena: [a, b], ..._rkMeta() });
        r.razlichni = (r.razlichni || []).filter(x => x !== _rk(a) + '|' + _rk(b));
    });
}

function rechnikRazlichni(a, b) {
    a = decodeURIComponent(a); b = decodeURIComponent(b);
    return _rkSled(r => { r.razlichni = [...new Set([...(r.razlichni || []), _rk(a) + '|' + _rk(b)])]; });
}

function rechnikNyama(red) {
    red = decodeURIComponent(red);
    return _rkSled(r => { r.nyama = [...new Set([...(r.nyama || []), _rk(red)])]; });
}

// Връща: маха името от групата му (групата от две изчезва), „различни“ и „няма“.
function rechnikVarni(a, b) {
    a = decodeURIComponent(a); b = decodeURIComponent(b || '');
    return _rkSled(r => {
        for (const g of r.grupi) g.imena = g.imena.filter(i => _rk(i) !== _rk(a));
        r.grupi = r.grupi.filter(g => g.imena.length > 1);
        r.razlichni = (r.razlichni || []).filter(x => x !== _rk(a) + '|' + _rk(b));
        r.nyama = (r.nyama || []).filter(x => x !== _rk(a));
    });
}

function rechnikChetec(vid, red, zavisi) {
    vid = decodeURIComponent(vid); red = decodeURIComponent(red || '');
    return _rkSled(r => { r.chetec = { ...(r.chetec || {}), [vid]: { red, zavisi: !!zavisi, ..._rkMeta() } }; });
}

function rechnikChetecVarni(vid) {
    vid = decodeURIComponent(vid);
    return _rkSled(r => { delete r.chetec[vid]; });
}
