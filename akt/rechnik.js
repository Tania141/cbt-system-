// АКТ СИСТЕМ · новото ПВА · rechnik.js
// РЕЧНИКЪТ — един документ, всичките му имена (`ДА ПРОЧЕТА/ЗАДАНИЕ-ЕДИН-ЗАПИС.md`)
//
// БЕЗ СТАЯ (25.11.2026). Операторът: „сега си създадохме още една стая… по-лесно
// е системата да се обучи от прочетените документи и сама да създаде речник“.
// Механизмът е отдолу; наученото личи там, където се работи — в момента.
//
// Как се учи:
//   · СИСТЕМАТА брои (сървърът, `rules/rechnik_uchene.py`): вид документ → ред,
//     когато е видян при поне 3 обекта и 90 % сочат един ред (прагът на
//     оператора). Учи само от сверени документи.
//   · ТИ казваш на място: на ред в „Липсва ми“ — „в досието има „…“ — ✔ това е ·
//     не е“. Твоето е научено веднага, за всички обекти, и бие броенето.
//   · Наученото личи: в „Имам“ пише „затворено от досието · научено от N обекта“
//     или „· казано от теб“, с „не е това“.
//
// Забрани: различни образци никога не са едно; само сходство никога не затваря
// ред тихо — предлага; научено никога не се прилага скрито.
//
// Речникът е на сървъра (`/api/danni/rechnik`) и важи за всички обекти. Двата
// заключени файла (чеклист, моменти) не се пипат.

'use strict';

// { grupi: [{imena}], chetec: {вид: {red, ot, koga}} — казаното от теб,
//   nauchen: {вид: {red, obekti, dyal}} — наученото по броене, ne: ['вид|ред'] }
let _rechnik = null;
let _rechnikZarezhda = null;
const _rkZatvoreni = new WeakMap();   // строеж → {ред: {vid, kak}} — затвореното през речника

// Сходство за „в досието има … — ✔ това е“ (25.11.2026, пробвано на истинските
// данни — първата версия предлагаше „Договор за строителство“ ⇐ „Акт № 3 за …
// СМР“). Правилата:
//   · ВИДЪТ на документа е един и същ — първото родово име в двете (договор с
//     договор, становище със становище, протокол с протокол); иначе — нищо;
//   · от ОСТАНАЛИТЕ думи (по корен — първите 6 букви) съвпадат поне две (една —
//     само ако и двете имена имат по една); и поне 60 % от по-краткото.
const RK_PRAG_PREDLOZHENIE = 0.6;
const RK_UCHI_NAI_CHESTO = 24 * 3600 * 1000;   // ученето по броене — най-много веднъж на ден
const _rk = s => String(s || '').toLowerCase().replace(/[„“”"«»()\.,;:—–-]/g, ' ').replace(/\s+/g, ' ').trim();
const _RK_STOP = new Set(['на', 'за', 'и', 'в', 'от', 'с', 'по', 'към', 'или', 'при', 'се', 'до', 'със', 'не', 'е']);
const _RK_ROD = ['догово', 'станов', 'акт', 'проток', 'скица', 'нотари', 'удосто', 'разреш', 'запове', 'деклар', 'сертиф',
                 'писмо', 'проект', 'план', 'виза', 'книга', 'диплом', 'застра', 'полица', 'списък', 'оценка', 'доклад', 'инстру',
                 'паспор', 'заснем', 'решени', 'гаранц', 'ревизи', 'дневни', 'съглас'];
const _rkDumi = s => _rk(s).split(' ').filter(w => w.length > 2 && !_RK_STOP.has(w)).map(w => w.slice(0, 6));
function _rkRazlozhi(s) {
    const d = _rkDumi(s);
    const rod = d.find(w => _RK_ROD.some(r => w.startsWith(r.slice(0, Math.min(r.length, w.length)))) && w.length >= 3);
    return { rod: rod ? rod.slice(0, 5) : '', drugi: new Set(d.filter(w => w !== rod && w !== 'обр')) };
}
function _rkShodstvo(a, b) {
    const A = _rkRazlozhi(a), B = _rkRazlozhi(b);
    if (!A.rod || A.rod !== B.rod) return 0;
    const krat = Math.min(A.drugi.size, B.drugi.size);
    if (!krat) return 0;
    const obshto = [...A.drugi].filter(x => B.drugi.has(x)).length;
    // Поне две общи думи; една стига само ако и двете имена имат по една —
    // иначе „строителен надзор“ ~ „строителство“ (общ корен „строит“).
    const tryabva = A.drugi.size === 1 && B.drugi.size === 1 ? 1 : 2;
    return obshto < tryabva ? 0 : obshto / krat;
}
const _rkObrazec = s => { const m = _rk(s).replace(/образец/g, 'обр').match(/обр\s*(\d+)/); return m ? m[1] : null; };
const _rkRazlichniObrazci = (a, b) => { const x = _rkObrazec(a), y = _rkObrazec(b); return !!(x && y && x !== y); };

function _rechnikPrazen() { return { grupi: [], chetec: {}, nauchen: {}, ne: [] }; }

async function rechnikZaredi(nanovo) {
    if (_rechnik && !nanovo) return _rechnik;
    if (_rechnikZarezhda && !nanovo) return _rechnikZarezhda;
    _rechnikZarezhda = (async () => {
        try {
            const r = await aktApi('/api/danni/rechnik');
            _rechnik = Object.assign(_rechnikPrazen(), (r && r.stoynost) || {});
        } catch (e) {
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

// ── Ученето по броене (сървърът смята, тук се записва) ───────────────────────

function _rkObobshtenie() {
    const izhod = [];
    for (const p of (aktDanni.projects || [])) {
        const stroezhi = typeof aktStroezhi === 'function' ? aktStroezhi(p) : [p];
        stroezhi.forEach((st, i) => {
            const s2 = (st.sloy2 && st.sloy2.od) || {};
            for (const d of (s2.dokumenti || [])) {
                let sveren = false;
                try { sveren = typeof _s2Sveren === 'function' && !!_s2Sveren(d, s2.potvardeni || {}); } catch (e) { sveren = false; }
                // Само вид, ред, сверен ли и кой обект — без лични данни, без файлове.
                izhod.push({ pi: `${p.pi || p.id}/${i}`, vid: d.vid || '', red: d.cheklist_red || '', sveren });
            }
        });
    }
    return izhod;
}

async function rechnikUchi(nasila) {
    const posledno = Number(localStorage.getItem('rechnik_uchi_koga') || 0);
    if (!nasila && Date.now() - posledno < RK_UCHI_NAI_CHESTO) return false;
    try {
        await rechnikZaredi();
        const r = await aktApi('/api/rechnik/uchi', 'POST', { obobshtenie: _rkObobshtenie(),
            rechnik: { chetec: _rechnik.chetec, ne: _rechnik.ne } });
        localStorage.setItem('rechnik_uchi_koga', String(Date.now()));
        const novo = (r && r.nauchen) || {};
        if (JSON.stringify(novo) === JSON.stringify(_rechnik.nauchen || {})) return false;
        _rechnik.nauchen = novo;
        await _rechnikZapishi();
        return true;
    } catch (e) {
        console.warn('речникът не се научи:', e.message);
        return false;
    }
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

// Към кой ред сочи този вид документ — казаното от теб бие наученото.
function rechnikRedZaVid(vid) {
    if (!_rechnik) return null;
    const k = _rk(vid);
    const kazano = (_rechnik.chetec || {})[k];
    if (kazano && kazano.red) return { red: kazano.red, kak: 'казано от теб' };
    const n = (_rechnik.nauchen || {})[k];
    if (n && n.red && !(_rechnik.ne || []).includes(k + '|' + _rk(n.red)))
        return { red: n.red, kak: `научено от ${n.obekti} обекта` };
    return null;
}

// Наличното, видяно през речника. Само ДОБАВЯ към преброеното от кухнята —
// правилото кое се брои (сверено и пр.) остава нейно: вид се прилага само за
// документ, който тя вече е броила. Записва какво е затворено — за „Имам“.
function rechnikRazshiri(nalichni, st) {
    if (!_rechnik) return nalichni;
    const zatv = {};
    if (st && typeof st === 'object') _rkZatvoreni.set(st, zatv);
    const izhod = new Set(nalichni || []);
    for (const ime of nalichni || []) for (const x of rechnikSashti(ime)) izhod.add(x);
    const dok = ((st && st.sloy2 && st.sloy2.od && st.sloy2.od.dokumenti) || []);
    for (const d of dok) {
        if (!d.cheklist_red || !izhod.has(d.cheklist_red)) continue;
        const kam = rechnikRedZaVid(d.vid);
        if (!kam || _rkRazlichniObrazci(d.vid, kam.red)) continue;
        for (const x of rechnikSashti(kam.red)) {
            if (izhod.has(x)) continue;
            izhod.add(x);
            zatv[x] = { vid: d.vid, kak: kam.kak };
        }
    }
    return [...izhod];
}

function rechnikZatvorenoOt(red, st) {
    if (!st && typeof momentZhiv === 'function') { const z = momentZhiv(); st = z && z.st; }
    const m = st && _rkZatvoreni.get(st);
    return (m && m[red]) || null;
}

// „В досието има „…“ — ✔ това е · не е“: документ от досието на ТОЗИ строеж,
// чието име прилича на реда. Само предлага — не затваря.
function rechnikPredlozhenie(st, red) {
    if (!_rechnik) return null;
    const ne = new Set(_rechnik.ne || []);
    const imena = rechnikSashti(red);
    let nai = null;
    for (const d of ((st && st.sloy2 && st.sloy2.od && st.sloy2.od.dokumenti) || [])) {
        if (!d.vid || _rkRazlichniObrazci(d.vid, red)) continue;
        if (ne.has(_rk(d.vid) + '|' + _rk(red))) continue;
        if (imena.some(i => _rk(i) === _rk(d.cheklist_red))) continue;
        const s = Math.max(...imena.map(i => _rkShodstvo(d.vid, i)));
        if (s >= RK_PRAG_PREDLOZHENIE && (!nai || s > nai.shodstvo)) nai = { dok: d, shodstvo: s };
    }
    return nai;
}

// ── Жестовете — на място ─────────────────────────────────────────────────────

async function _rkSled(fn) {
    await rechnikZaredi();
    fn(_rechnik);
    await _rechnikZapishi();
    if (typeof momentZaredi === 'function') momentZaredi();
}

// „✔ това е“ — този вид документ доказва този ред, за всички обекти.
function rechnikTovaE(vid, red) {
    vid = decodeURIComponent(vid); red = decodeURIComponent(red);
    return _rkSled(r => {
        r.chetec = { ...(r.chetec || {}), [_rk(vid)]: { red, ot: 'оператор', ime: vid, koga: new Date().toISOString() } };
        r.ne = (r.ne || []).filter(x => x !== _rk(vid) + '|' + _rk(red));
    });
}

// „не е“ / „не е това“ — двойката се забранява; казаното за нея пада.
function rechnikNeE(vid, red) {
    vid = decodeURIComponent(vid); red = decodeURIComponent(red);
    return _rkSled(r => {
        r.ne = [...new Set([...(r.ne || []), _rk(vid) + '|' + _rk(red)])];
        const k = _rk(vid);
        if (r.chetec && r.chetec[k] && _rk(r.chetec[k].red) === _rk(red)) delete r.chetec[k];
    });
}

// ── Стъпка 3 (26.11.2026): подобният обект през записите ─────────────────────
// Ред от подобния акт е „име“ като всяко друго: ако речникът го знае — сочи
// към реда си; ако не — най-близкият ред от момента се ПРЕДЛАГА („същото като
// …? ✔ това е · не е“). Същите правила като за досието: същ вид документ, поне
// две общи думи, без различни образци, без забранени двойки.
// Общ ред на чеклиста („Документи за асансьора“, „Протоколи за мълниезащитната
// уредба“) събира няколко конкретни документа — „Сертификат за качество на
// асансьора“, „Гаранционна карта“… Затова срещу общ ред видът не се иска еднакъв:
// стига една обща съдържателна дума (26.11.2026, мярката на Радулов: 37 реда от
// Денка, само 3 със „същото като…“, защото редовете на чеклиста са общи).
const _RK_OBSHT = /^(документ|документи|документация|сертификати|протоколи)(?=\s|$)/;   // \b не знае кирилица
const _RK_PRAZNI = new Set(['докуме', 'сертиф', 'проток', 'изпитв', 'измерв', 'контро', 'влаган', 'строит', 'обекта']);
// Кой вид конкретен документ влиза в какъв общ ред (26.11.2026, след мярката:
// „Акт обр. 12 по част Електро“ ⇒ „Протоколи за … ел. инсталациите“ и
// „Договор с ВиК“ ⇒ „Документи за противопожарното водоснабдяване“ — грешни).
// Акт по образец, договор, писмо, становище — никога в общ ред.
const _RK_PRIEMA = {
    'проток': ['проток'],
    'сертиф': ['сертиф'],
    'докуме': ['сертиф', 'гаранц', 'ревизи', 'проток', 'удосто', 'книга', 'нотари', 'инстру', 'паспор'],
};
function _rkShodstvoSObsht(ime, red) {
    const m = _rk(red).match(_RK_OBSHT);
    if (!m || _rkObrazec(ime)) return 0;
    const priema = _RK_PRIEMA[m[1].slice(0, 6)] || [];
    const rodIme = _rkRazlozhi(ime).rod;
    if (!rodIme || !priema.some(x => x.startsWith(rodIme) || rodIme.startsWith(x.slice(0, 5)))) return 0;
    const sad = s => new Set(_rkDumi(s).filter(w => !_RK_PRAZNI.has(w)));
    const A = sad(ime), B = sad(red);
    if (!B.size) return 0;
    const obshto = [...B].filter(x => A.has(x)).length;
    return obshto ? Math.max(RK_PRAG_PREDLOZHENIE, obshto / B.size) : 0;
}

function rechnikNaiBlizakRed(ime, redove) {
    if (!_rechnik) return null;
    const ne = new Set(_rechnik.ne || []);
    let nai = null;
    for (const red of redove || []) {
        if (!red || _rk(red) === _rk(ime) || _rkRazlichniObrazci(ime, red)) continue;
        if (ne.has(_rk(ime) + '|' + _rk(red))) continue;
        const s = Math.max(_rkShodstvo(ime, red), _rkShodstvoSObsht(ime, red));
        if (s >= RK_PRAG_PREDLOZHENIE && (!nai || s > nai.shodstvo)) nai = { red, shodstvo: s };
    }
    return nai;
}
