// АКТ СИСТЕМ · новото ПВА · yadro.js
// Онова, което и двата екрана ползват: данните, сървърът, двете числа.
//
// Правилото на тази папка (ЗАДАНИЕ.md, 20.10.2026): сменя се ПОВЪРХНОСТТА.
// Кухнята отдолу не се пипа — тук не се дописва нито чеклист, нито признак,
// нито шаблон. Четат се същите данни (`akt_v5`), вика се същият сървър
// (`/api/nadzor`) и се показва същото, което кухнята вече знае.
//
// Старите екрани (index.html + js/) стоят непокътнати и работят както досега.

'use strict';

// ── Дребното ─────────────────────────────────────────────────────────────────

const _e = s => String(s ?? '').replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── Данните ──────────────────────────────────────────────────────────────────
// Същият ключ, който старото ПВА пише. Тук се ЧЕТЕ; пише се само през
// `aktZapishi`, и то едно поле наведнъж.

const AKT_KLYUCH = 'akt_v5';

let aktDanni = { projects: [], consultants: [], history: [] };

// Прочетено ли е успешно. Без това всеки запис след провалено четене би
// изсипал празни данни върху пълните: `aktDanni` си стои с празните списъци
// от определението, а записът пише ЦЕЛИЯ обект. Старото ПВА държи тук и
// консултантите, и историята — те не идват от сървъра при всяко зареждане.
// (23.10.2026)
let aktProcheteno = false;

function aktZaredi() {
    try {
        const t = localStorage.getItem(AKT_KLYUCH);
        // ПЪЛНИ СЕ СЪЩИЯТ ОБЕКТ, не се прави нов. Кухнята държи своя показалец
        // към него (`appData = aktDanni` в `most.js`) и го взима ПРЕДИ
        // зареждането. Направи ли се нов обект, старият код остава да сочи
        // празния и мълчаливо не вижда нищо: при Екран 6 кандидатите не се
        // четяха, защото `appData.apiUrl` беше празно. (27.10.2026)
        if (t) Object.assign(aktDanni, JSON.parse(t));
        aktProcheteno = true;
    } catch (e) {
        console.warn('akt_v5 не се чете:', e);
        aktProcheteno = false;
    }
    if (!Array.isArray(aktDanni.projects)) aktDanni.projects = [];
    return aktDanni;
}

function aktZapishi() {
    if (!aktProcheteno) {
        console.error('aktZapishi: данните не са прочетени — НЕ пиша, за да не изтрия.');
        return false;
    }
    const predi = aktDanni.savedAt;
    try {
        aktDanni.savedAt = new Date().toISOString();
        const tekst = JSON.stringify(aktDanni);
        localStorage.setItem(AKT_KLYUCH, tekst);
        // Предупреждение ПРЕДИ мястото да свърши (около 5 MB за браузъра).
        if (tekst.length > 4 * 1024 * 1024)
            aktKazhiZapis(`Мястото в браузъра свършва: ${(tekst.length / 1048576).toFixed(1)} MB от около 5. `
                + 'Изчисти прочетеното на завършени обекти, преди да спре да записва.', false);
        return true;
    } catch (e) {
        // ГРЕШКАТА СЕ КАЗВА ВИСОКО (11.11.2026). Дотук само в конзолата —
        // работата изглеждаше записана, а при следващо отваряне я нямаше.
        aktDanni.savedAt = predi;
        console.error('aktZapishi:', e);
        aktKazhiZapis(/quota|exceed|full/i.test(String(e && (e.name || e.message)))
            ? 'НЕ Е ЗАПИСАНО — мястото в браузъра свърши. Не затваряй страницата; изчисти прочетеното на завършени обекти и запиши пак.'
            : `НЕ Е ЗАПИСАНО в браузъра: ${e && e.message ? e.message : e}. Не затваряй страницата.`, true);
        return false;
    }
}

// Лента най-горе на страницата — стои, докато не се затвори. Не е бележка,
// която да мине покрай окото.
function aktKazhiZapis(tekst, greshka) {
    if (typeof document === 'undefined' || !document.body) return;
    let l = document.getElementById('akt-zapis-lenta');
    if (!l) {
        l = document.createElement('div');
        l.id = 'akt-zapis-lenta';
        l.style.cssText = 'position:sticky;top:0;z-index:999;padding:10px 14px;font-weight:600;'
            + 'display:flex;gap:12px;align-items:center;justify-content:space-between';
        document.body.prepend(l);
    }
    l.style.background = greshka ? '#b42318' : '#b7791f';
    l.style.color = '#fff';
    l.innerHTML = '';
    const s = document.createElement('span'); s.textContent = '⛔ ' + tekst;
    const b = document.createElement('button'); b.textContent = '×'; b.onclick = () => l.remove();
    b.style.cssText = 'background:none;border:0;color:#fff;font-size:20px;cursor:pointer';
    l.append(s, b);
}

function aktObekt(id) {
    return (aktDanni.projects || []).find(p => String(p.id) === String(id)) || null;
}

// Кой обект е „на масата“. Старото ПВА чете точно това поле, за да знае по кой
// обект се работи — а новото не го пишеше. Затова връзките надолу (Проектът,
// Собствеността, Досието) те изсипваха в старото приложение БЕЗ обект и трябваше
// да го избираш отново. (Операторът, 23.10.2026.)
//
// Пише се тук, защото е едно поле на общите данни, а не поправка в стар екран.
function aktZapomniObekt(p, i) {
    if (!p) return;
    p.tekusht_stroezh = Number(i === undefined ? aktIndeksStroezh(p) : i);
    aktDanni.currentProject = p;
    aktZapishi();
}

// ── Сървърът ─────────────────────────────────────────────────────────────────

function aktApiAdres() {
    return aktDanni.apiUrl || 'https://web-production-220c7.up.railway.app';
}

async function aktApi(pat, metod = 'GET', telo = null) {
    const glava = { 'Content-Type': 'application/json' };
    const tok = localStorage.getItem('akt_token');
    if (tok) glava.Authorization = 'Bearer ' + tok;
    const r = await fetch(aktApiAdres() + pat, {
        method: metod, headers: glava, body: telo ? JSON.stringify(telo) : undefined,
    });
    if (!r.ok) {
        // Сървърът често казва защо (напр. изчерпан таван на демото) — казва се.
        const tyalo = r.status === 401 ? {} : await r.json().catch(() => ({}));
        const e = new Error(r.status === 401
            ? 'изтече ти достъпът' : (tyalo.greshka || tyalo.error || 'сървърът отказа: ' + r.status));
        e.status = r.status;
        e.izteklo = r.status === 401;
        // Изтекъл достъп — входът се отваря тук, не в старото ПВА (11.11.2026).
        if (e.izteklo) aktVhod('Изтече ти достъпът — влез пак. Нищо не е изгубено.');
        throw e;
    }
    return r.json();
}

// ── ВХОДЪТ ───────────────────────────────────────────────────────────────────
// Операторът, 11.11.2026: „паролата е 24 часа, тя отваря старото ПВА винаги,
// за да се презареди“. Всяко отваряне на старото подменяше обектите със
// сървърните копия и изтри работата от новото. Новото ПВА вече има свой вход —
// същият сървър, същият токен (`akt_token`), който старото също чете.

function aktTokenValiden() {
    const tok = localStorage.getItem('akt_token');
    if (!tok) return false;
    try {
        const chast = tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const danni = JSON.parse(atob(chast + '==='.slice((chast.length + 3) % 4)));
        // Минута резерва — да не изтече насред заявка.
        return !danni.exp || danni.exp * 1000 > Date.now() + 60000;
    } catch (e) {
        return true;   // непознат вид — сървърът ще каже
    }
}

function aktVhod(prichina) {
    if (typeof document === 'undefined' || document.getElementById('akt-vhod')) return;
    const potr = (() => { try { return JSON.parse(localStorage.getItem('akt_user') || '{}'); } catch (e) { return {}; } })();
    const d = document.createElement('div');
    d.id = 'akt-vhod';
    d.innerHTML = `
        <form class="vhod-karta" onsubmit="aktVlez(event)">
            <div class="nadpis">АКТ СИСТЕМ — вход</div>
            ${prichina ? `<p class="tiho">${_e(prichina)}</p>` : ''}
            <label class="p2-pole"><span>Имейл</span>
                <input type="email" id="vhod-email" autocomplete="username" value="${_e(potr.email || '')}" required></label>
            <label class="p2-pole"><span>Парола</span>
                <input type="password" id="vhod-parola" autocomplete="current-password" required></label>
            <div id="vhod-greshka" class="greshka" hidden></div>
            <button class="bt bt-glaven" id="vhod-bt" type="submit">Влез</button>
            <p class="tiho">Достъпът трае 24 часа. Данните са в този браузър — входът не ги пипа.</p>
        </form>`;
    document.body.append(d);
    const pole = document.getElementById(potr.email ? 'vhod-parola' : 'vhod-email');
    if (pole) pole.focus();
}

async function aktVlez(ev) {
    if (ev) ev.preventDefault();
    const email = (document.getElementById('vhod-email') || {}).value || '';
    const parola = (document.getElementById('vhod-parola') || {}).value || '';
    const bt = document.getElementById('vhod-bt'), gr = document.getElementById('vhod-greshka');
    if (bt) { bt.disabled = true; bt.textContent = 'Влизам…'; }
    try {
        const r = await fetch(aktApiAdres() + '/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password: parola }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.token) throw new Error(d.error || (r.status === 401 ? 'грешен имейл или парола' : 'сървърът отказа: ' + r.status));
        localStorage.setItem('akt_token', d.token);
        localStorage.setItem('akt_user', JSON.stringify({ email: d.email || email.trim(), role: d.role }));
        const v = document.getElementById('akt-vhod');
        if (v) v.remove();
        aktShapkaVhod();
        if (typeof aktPokazhi === 'function') aktPokazhi();
    } catch (e) {
        if (gr) { gr.hidden = false; gr.textContent = e.message; }
    } finally {
        if (bt) { bt.disabled = false; bt.textContent = 'Влез'; }
    }
}

function aktIzlez() {
    localStorage.removeItem('akt_token');
    aktShapkaVhod();
    aktVhod('Излезе от системата.');
}

// В шапката — кой е влязъл и „изход“; за администратора — „покани за демо“.
function aktShapkaVhod() {
    const m = typeof document !== 'undefined' && document.getElementById('shapka-vhod');
    if (!m) return;
    const potr = (() => { try { return JSON.parse(localStorage.getItem('akt_user') || '{}'); } catch (e) { return {}; } })();
    m.innerHTML = aktTokenValiden()
        ? `${potr.role === 'admin' ? '<button class="bt bt-tih" onclick="aktDemoPokana()">покани за демо</button>' : ''}
           <span class="tiho">${_e(potr.email || '')}</span> <button class="bt bt-tih" onclick="aktIzlez()">изход</button>`
        : `<button class="bt" onclick="aktVhod()">вход</button>`;
}

// При отваряне: покана във връзката → регистрация; без валиден токен → вход.
function aktProveriVhod() {
    aktShapkaVhod();
    const pokana = (typeof location !== 'undefined')
        && new URLSearchParams(location.search).get('pokana');
    if (pokana) return aktRegistraciya(pokana);
    if (!aktTokenValiden()) aktVhod('Влез, за да може системата да чете и съставя.');
}

// ── ДЕМО ПО ИМЕЙЛ (17.11.2026) ───────────────────────────────────────────────
// Операторът: „демото трябва да мога да го изпратя по имейл с отделен акаунт“.
// Администраторът натиска „покани за демо“ → сървърът прави отделна фирма с
// таван на четенията с АИ и покана → връзка за имейла. Колегата отваря
// връзката, слага СВОЙ имейл и парола и влиза; демо обектът се зарежда сам.
// В отделната фирма и в неговия браузър няма нищо от данните на поканилия.

async function aktDemoPokana() {
    const ime = prompt('Покана за демо.\n\nНа кого е (по избор, само за твоя справка):', '');
    if (ime === null) return;
    let r;
    try {
        r = await aktApi('/api/admin/demo-pokana', 'POST', { ime: ime.trim(), tavan: 20, dni: 7 });
    } catch (e) {
        alert('Поканата не стана: ' + e.message);
        return;
    }
    const vrazka = `${location.origin}${location.pathname}?pokana=${encodeURIComponent(r.kod)}`;
    const pismo = `Здравей,\n\nИзпращам ти демо на АКТ СИСТЕМ — системата, с която съставям документите по строителния надзор.\n\n`
        + `Отвори връзката, въведи своя имейл и измисли парола:\n${vrazka}\n\n`
        + `Вътре има демонстрационен обект с измислени данни. Може да разглеждаш и да съставяш документи; `
        + `четенето на документи с изкуствен интелект е до ${r.tavan} пъти.\nВръзката важи 7 дни и е за една регистрация.\n`;
    const d = document.createElement('div');
    d.id = 'akt-vhod';
    d.innerHTML = `
        <div class="vhod-karta">
            <div class="nadpis">Поканата е готова</div>
            <p class="tiho">Отделна демо фирма — колегата не вижда нищо твое. Таван: ${r.tavan} четения с АИ.
               Връзката важи 7 дни, за една регистрация.</p>
            <label class="p2-pole"><span>Текст за имейла</span>
                <textarea id="pokana-pismo" rows="10" style="width:100%;font:inherit">${_e(pismo)}</textarea></label>
            <div class="redica">
                <button class="bt bt-glaven" onclick="aktKopiraj('pokana-pismo')">копирай текста</button>
                <button class="bt bt-tih" onclick="document.getElementById('akt-vhod').remove()">затвори</button>
            </div>
            <p class="tiho" id="pokana-kopirano"></p>
        </div>`;
    document.body.append(d);
}

function aktKopiraj(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.select();
    const kaza = t => { const k = document.getElementById('pokana-kopirano'); if (k) k.textContent = t; };
    (navigator.clipboard ? navigator.clipboard.writeText(el.value) : Promise.reject())
        .then(() => kaza('Копирано — постави го в имейла.'))
        .catch(() => { try { document.execCommand('copy'); kaza('Копирано.'); } catch (e) { kaza('Маркирано — копирай с Ctrl+C.'); } });
}

function aktRegistraciya(kod) {
    if (typeof document === 'undefined' || document.getElementById('akt-vhod')) return;
    const d = document.createElement('div');
    d.id = 'akt-vhod';
    d.innerHTML = `
        <form class="vhod-karta" onsubmit="aktRegistriraj(event)">
            <div class="nadpis">АКТ СИСТЕМ — демо</div>
            <p class="tiho">Поканен си да разгледаш системата с демонстрационен обект. Въведи своя имейл
               и измисли парола — с тях ще влизаш.</p>
            <input type="hidden" id="reg-kod" value="${_e(kod)}">
            <label class="p2-pole"><span>Имейл</span>
                <input type="email" id="reg-email" autocomplete="username" required></label>
            <label class="p2-pole"><span>Парола (поне 8 знака)</span>
                <input type="password" id="reg-parola" autocomplete="new-password" minlength="8" required></label>
            <label class="p2-pole"><span>Паролата още веднъж</span>
                <input type="password" id="reg-parola2" autocomplete="new-password" minlength="8" required></label>
            <div id="vhod-greshka" class="greshka" hidden></div>
            <button class="bt bt-glaven" id="vhod-bt" type="submit">Влез в демото</button>
            <p class="tiho">Имаш вече акаунт? <a href="#" onclick="document.getElementById('akt-vhod').remove();aktVhod();return false">Вход</a></p>
        </form>`;
    document.body.append(d);
}

async function aktRegistriraj(ev) {
    if (ev) ev.preventDefault();
    const v = id => ((document.getElementById(id) || {}).value || '');
    const gr = document.getElementById('vhod-greshka'), bt = document.getElementById('vhod-bt');
    const kazhi = t => { if (gr) { gr.hidden = false; gr.textContent = t; } };
    if (v('reg-parola') !== v('reg-parola2')) return kazhi('Двете пароли се различават.');
    if (bt) { bt.disabled = true; bt.textContent = 'Регистрирам…'; }
    try {
        const r = await fetch(aktApiAdres() + '/api/auth/register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: v('reg-email').trim(), password: v('reg-parola'), invite_code: v('reg-kod') }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || 'сървърът отказа: ' + r.status);
        // Веднага и вход — със същите имейл и парола.
        const r2 = await fetch(aktApiAdres() + '/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: v('reg-email').trim(), password: v('reg-parola') }),
        });
        const d2 = await r2.json().catch(() => ({}));
        if (!r2.ok || !d2.token) throw new Error(d2.error || 'регистриран си, но входът не стана — влез ръчно');
        localStorage.setItem('akt_token', d2.token);
        localStorage.setItem('akt_user', JSON.stringify({ email: d2.email || v('reg-email').trim(), role: d2.role }));
        await aktZarediDemo();
        history.replaceState(null, '', location.pathname + '#/plot');
        const o = document.getElementById('akt-vhod');
        if (o) o.remove();
        aktShapkaVhod();
        if (typeof aktPokazhi === 'function') aktPokazhi();
    } catch (e) {
        kazhi(e.message);
    } finally {
        if (bt) { bt.disabled = false; bt.textContent = 'Влез в демото'; }
    }
}

// Демо обектът — от `demo/demo-obekt.json`, ДОБАВЯ се, нищо не презаписва.
async function aktZarediDemo() {
    try {
        const r = await fetch('../demo/demo-obekt.json', { cache: 'no-store' });
        if (!r.ok) return false;
        const demo = await r.json();
        aktDanni.projects = (aktDanni.projects || []).filter(p => p.id !== demo.obekt.id);
        aktDanni.consultants = (aktDanni.consultants || []).filter(c => c.id !== demo.konsultant.id);
        aktDanni.projects.push(demo.obekt);
        aktDanni.consultants.push(demo.konsultant);
        aktZapishi();
        return true;
    } catch (e) {
        return false;
    }
}

// ИЗТЕКЪЛ ДОСТЪП НЕ Е ГРЕШКА НА ЧЕКЛИСТА.
// Операторът, 28.10.2026, видя „Чеклистът не отговори: сървърът отказа: 401“
// и тръгна да търси какво му е на чеклиста. Той беше невинен: токенът живее
// 24 часа, а новото ПВА няма свой вход — ползва този, който старото е
// оставило. Значи това се случва всяка сутрин.
//
// Съобщението казва какво е станало и къде се оправя, вместо да сочи
// грешния виновник. Съобщение, което обвинява невинен, е по-скъпо от
// мълчание: по него се работи в грешна посока.
function aktGreshkaHtml(e, kakvoNeStana) {
    const izteklo = e && (e.izteklo || /\b401\b|изтече/.test(String(e.message || e)));
    if (!izteklo)
        return `<div class="greshka">${_e(kakvoNeStana || 'Не се получи')}: ${
            _e(String((e && e.message) || e))}</div>`;
    return `
    <div class="greshka">
        <strong>Изтече ти достъпът.</strong> Влез пак — тук, без старото ПВА.
        Достъпът трае 24 часа.
        <button class="bt bt-glaven" onclick="aktVhod()">влез отново</button>
    </div>`;
}

// ── Строежите в имота ────────────────────────────────────────────────────────
// Моментите са на СТРОЕЖА. Собствеността и Акт 16 са на ИМОТА — затова тук
// строежът и имотът не се смесват. (ЗАДАНИЕ.md, отговорите от 20.10.2026)

function aktStroezhi(p) {
    return p ? [p, ...(p.stroezhi_dop || [])] : [];
}

function aktIndeksStroezh(p) {
    const i = Number(p?.tekusht_stroezh || 0);
    return i >= 0 && i < aktStroezhi(p).length ? i : 0;
}

function aktStroezh(p, i) {
    const s = aktStroezhi(p);
    return s[i === undefined ? aktIndeksStroezh(p) : i] || p;
}

// ОБЕКТЪТ, ВИДЯН ПРЕЗ СТРОЕЖА — за съставянето на документи.
//
// Строеж №1 живее в самия обект; вторият и следващите — в `stroezhi_dop` и
// носят своите РС, категория, заповедна книга, консултант, досие (вж.
// `_STROEZH_POLETA`). Документите се съставяха от ОБЕКТА — и при втория
// строеж излизаха с разрешението на първия, без да личи. (10.11.2026)
//
// Имотът (ПИ, адрес, собственост, възложители) идва от обекта; каквото
// строежът има свое — от строежа.
function aktZaDokument(p, st) {
    if (!p || !st || st === p) return p;
    const svoe = Object.fromEntries(Object.entries(st).filter(([, v]) =>
        v !== undefined && v !== null && v !== ''));
    return { ...p, ...svoe, id: p.id, pi: p.pi, stroezhi_dop: p.stroezhi_dop,
             tekusht_stroezh: p.tekusht_stroezh };
}

function aktImeStroezh(st, i) {
    return (st && st.stroej) || (i === 0 ? 'Строеж 1' : `Строеж ${i + 1}`);
}

// ── Кръговете по чл. 154 ─────────────────────────────────────────────────────
// Записките и текстовите блокове не висят на строежа, а на КРЪГА: първият е
// оценката по чл. 142, следващите са изменения по чл. 154, всяко със свои
// записки за изменените части.
//
// Същото стои и в `js/13-krugove.js` — това тук е повторение, защото онзи
// модул вика пет неща от стария екран. Повторението е опасно и затова
// `proba_krugove_dvete.js` сравнява двете и пада, ако се разминат.

function aktKrugove(st) {
    return st ? [st, ...(st.krugove_dop || [])] : [];
}

function aktIndeksKrug(st) {
    const i = Number((st && st.tekusht_krug) || 0);
    return i >= 0 && i < aktKrugove(st).length ? i : 0;
}

// Кръгът, по който се работи. Върху него се пишат записките и блоковете.
function aktKrug(st) {
    return aktKrugove(st)[aktIndeksKrug(st)] || st;
}

function aktImeKrug(st, i) {
    if (i === 0) return 'Оценка по чл. 142';
    const k = aktKrugove(st)[i] || {};
    return 'Изменение по чл. 154' + (k.nomer ? ' · № ' + k.nomer : ' № ' + (i + 1));
}

// ── Главата на обекта: три реда, не формуляр ─────────────────────────────────
// Всеки ред знае КОИ полета показва и къде живеят — на имота или на строежа.
// Клик го отваря за поправка; затова редът носи `polya`, а не готов текст.

function aktGlavaRedove(p, st) {
    const rs = (st && st.permit) || {};
    // Възложителите — от регистъра на собствеността (вратата), иначе писаните
    // на ръка в стария паспорт (18.11.2026).
    const reg = typeof aktStoynost === 'function' ? aktStoynost(p, st || p, 'sobstvenik').stoynost : '';
    const vazl = reg ? [reg] : (p.clients && p.clients.length ? p.clients : [p.client].filter(Boolean))
        .map(c => c && c.name).filter(Boolean);
    return [
        {
            klyuch: 'stroezh',
            tekst: [p.pi, st && st.stroej].filter(Boolean).join(' · '),
            polya: [{ kade: 'imot', pole: 'pi', ime: 'ПИ' },
                    { kade: 'stroezh', pole: 'stroej', ime: 'Строеж' }],
        },
        {
            klyuch: 'vazlozhitel',
            tekst: [vazl.length ? 'Възложител: ' + vazl.join(', ') : '',
                    rs.number ? `РС № ${rs.number}${rs.date ? ' от ' + aktData(rs.date) : ''}` : '']
                .filter(Boolean).join(' · '),
            polya: [{ kade: 'stroezh', pole: 'permit.number', ime: 'РС №' },
                    { kade: 'stroezh', pole: 'permit.date', ime: 'РС от' }],
            otkade: vazl.length ? 'от регистъра на собствеността' : '',
        },
        {
            klyuch: 'konsultant',
            tekst: (st && st.consultant && st.consultant.name)
                ? 'Консултант: ' + st.consultant.name : '',
            polya: [{ kade: 'stroezh', pole: 'consultant.name', ime: 'Консултант' }],
        },
    ].filter(r => r.tekst || r.klyuch === 'stroezh');
}

function aktData(v) {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    return String(d.getDate()).padStart(2, '0') + '.'
         + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
}

// Поправката: едно поле, един жест. Пише се ТАМ, където полето живее —
// на имота или на строежа — и нищо друго не се пипа.
function aktPopravi(id, kade, pole, stoynost) {
    const p = aktObekt(id);
    if (!p) return false;
    const cel = kade === 'imot' ? p : aktStroezh(p);
    const chasti = String(pole).split('.');
    let v = cel;
    for (const c of chasti.slice(0, -1)) v = (v[c] = v[c] || {});
    v[chasti[chasti.length - 1]] = stoynost;
    p.updatedAt = new Date().toISOString();
    return aktZapishi();
}

// ── Съставките ───────────────────────────────────────────────────────────────
// Знанието кои съставки съществуват, как се разпознават и какво носят е КУХНЯ:
// живее в `js/05-proverki.js` и тук не се преписва. Тази страница включва същия
// модул и само подрежда: прочетените от заглавието, от записките и от
// потвърдените признаци, минус махнатите, плюс вписаните на ръка.
//
// Всяка съставка носи `ot` — откъде я знаем (правило 3).

function aktSastavki(p, st) {
    const cel = { ...p, ...st };
    const r = (st && st.sastavki) || {};
    const prochetenite = typeof _sastavki === 'function' ? [
        ..._sastavki([cel.stroej, cel.name].filter(Boolean).join(' · '), 'заглавието'),
        ..._sastavki(typeof _tekstZapiski === 'function' ? _tekstZapiski(cel) : '', 'записките'),
        ...(typeof _sastavkiOtPriznaci === 'function' ? _sastavkiOtPriznaci(cel) : []),
    ] : [];
    const naraka = (r.dobaveni || []).map(x => {
        const kod = x && x.kod ? x.kod : x;
        const ot = typeof _SASTAVKI !== 'undefined'
            ? _SASTAVKI.find(s => s.kod === kod) : null;
        return { kod, ime: (ot && ot.ime) || (x && x.ime) || kod, ot: 'вписана на ръка' };
    });
    const vsichki = [...prochetenite, ...naraka];
    const mahnati = new Set(r.mahnati || []);
    const vidyani = new Set();
    return vsichki
        .filter(s => s && s.kod && !mahnati.has(s.kod))
        .filter(s => !vidyani.has(s.kod) && vidyani.add(s.kod))
        // Каже ли някой извор какъв е трафопостът, неясният отпада.
        .filter(s => s.kod !== 'tp_neyasen'
            || !vsichki.some(x => ['shtp', 'bktp', 'zru'].includes(x.kod)));
}

// ── Двете числа ──────────────────────────────────────────────────────────────
// „да започна 80 % · да подпиша 40 %“ (ЗАДАНИЕ.md, Екран 1 и 3).
//
// Броят се редовете на чеклиста, както сървърът ги дава за този момент:
//   · за да започна — само редовете с етап „начало“;
//   · за да подпиша — ВСИЧКИ редове, защото подписът иска и началните.
// „Не се отнася“ влиза в наличното и вдига процента (правило 4).
//
// Ако нито един ред не носи етап, числото „да започна“ е `null` — показва се
// тире, а не измислена стойност. По-добре да се види, че сървърът не го казва.

// Какво този строеж няма да пита: казаното на обекта ПЛЮС наученото за
// неговия профил (`js/12c-naucheno.js`). Едно място го събира, за да не го
// събира всеки екран по своему.
function aktNeotnasya(p, st) {
    const svoi = (st && st.neotnasya) || [];
    const nauch = typeof nauchNeotnasya === 'function' ? nauchNeotnasya(p, st) : [];
    return [...new Set([...svoi, ...nauch])];
}

// Научено ли е, или е казано тук. Екранът го различава, защото наученото
// трябва да си личи и да се маха.
function aktKazanoTuk(st, dokument) {
    return ((st && st.neotnasya) || []).includes(dokument);
}

const AKT_IMAM = 'налично';
const AKT_NE_MU_E_VREMETO = 'не му е времето';

function aktDveChisla(grupa, neotnasya) {
    const mahnati = new Set(neotnasya || []);
    const imam = r => r.sastoyanie === AKT_IMAM || mahnati.has(r.dokument);
    // Твой ред „за преценка“ (приет от „Видени, но неописани“) не сваля процента,
    // докато не решиш: имаш го → брои се; „не се отнася“ → брои се като имаш.
    const redove = ((grupa && grupa.dokumenti) || []).filter(r => !r.za_precenka || imam(r));
    const vezna = spisak => ({
        imam: spisak.filter(imam).length,
        ot: spisak.length,
        post: spisak.length ? Math.round(100 * spisak.filter(imam).length / spisak.length) : 100,
        lipsvat: spisak.filter(r => !imam(r)).map(r => r.dokument),
    });
    const nachalni = redove.filter(r => r.etap === 'начало');
    const kazvaEtap = redove.some(r => r.etap);
    return {
        moment: (grupa && grupa.moment) || '',
        nachalo: kazvaEtap ? vezna(nachalni) : null,
        podpis: vezna(redove),
    };
}

// Цветът на плочката: сиво — не му е времето, жълто — в работа, зелено — готово.
function aktCvyat(dve, tekusht) {
    if (!dve || !dve.podpis.ot) return 'sivo';
    if (dve.podpis.post === 100) return 'zeleno';
    if (tekusht || dve.podpis.imam > 0) return 'zhalto';
    return 'sivo';
}

function aktProcent(vezna) {
    return vezna ? vezna.post + ' %' : '—';
}

// ── Едно изречение: какво СЕГА може ──────────────────────────────────────────
// Под везните стои изречение, не процент. Операторът не чете две числа — чете
// „можеш да започнеш“. (ЗАДАНИЕ.md, Екран 3)

function aktKakvoMozhe(dve) {
    if (!dve) return 'Още не е броено.';
    const p = dve.podpis;
    if (p.ot === 0) return 'Този момент няма чеклист — остава шаблон.';
    if (p.post === 100) return 'Всичко е налице — може и да се подпише.';
    const n = dve.nachalo;
    const zaPodpisa = `За подписа липсва${p.lipsvat.length === 1 ? '' : 'т'} ${p.lipsvat.length} ${
        p.lipsvat.length === 1 ? 'нещо' : 'неща'}.`;
    if (!n) return zaPodpisa;
    if (n.post === 100) return 'Можеш да започнеш. ' + zaPodpisa;
    return `За да започнеш, липсва${n.lipsvat.length === 1 ? '' : 'т'} ${n.lipsvat.length} ${
        n.lipsvat.length === 1 ? 'нещо' : 'неща'}. ` + zaPodpisa;
}

// Правилото на момента: кога бутонът „Съставѝ документа“ е активен и — ако не
// е — какво точно пише. Решението си остава на оператора: системата само казва
// какво знае. (ЗАДАНИЕ.md, „Най-долу“)
function aktPraviloNaMomenta(dve) {
    if (!dve || dve.podpis.ot === 0)
        return { mozhe: true, zashto: 'Този момент е шаблон — няма какво да се чака.' };
    const n = dve.nachalo;
    if (n && n.post < 100)
        return { mozhe: false, zashto: `${_aktNeshta(n.lipsvat.length)}, за да се започне.` };
    const p = dve.podpis;
    if (p.post < 100)
        return { mozhe: true, zashto: `${_aktNeshta(p.lipsvat.length)} за подписа. `
                       + 'Може да се състави и така — ще излязат на точки.' };
    return { mozhe: true, zashto: 'Всичко е налице.' };
}

// „Липсват 1 неща“ е дребно, но се чете всеки ден.
function _aktNeshta(n) {
    return n === 1 ? 'Липсва 1 нещо' : `Липсват ${n} неща`;
}

// ── Цената на файла ──────────────────────────────────────────────────────────
// „Системата ИЗБРОЯВА папката, без да чете нищо (нула токени)… До всеки файл
// пише какво ще струва.“ (Операторът, 20.10.2026)
//
// Съди се по РАЗШИРЕНИЕТО — това е всичко, което се знае, без да се отваря
// файлът. Точно затова надписът казва „скан“, а не „е скан“: .pdf може да е и
// текстов, но докато не се прочете, не се знае, и предположението е скъпото.

function aktCenaNaFajl(ime) {
    const t = String(ime || '').toLowerCase();
    if (/\.docx$/.test(t)) return { cena: 'безплатно', kak: 'има текст' };
    if (/\.(txt|md|csv)$/.test(t)) return { cena: 'безплатно', kak: 'има текст' };
    if (/\.doc$/.test(t)) return { cena: 'не се чете', kak: 'стар .doc — запиши го като .docx' };
    if (/\.pdf$/.test(t)) return { cena: 'през АИ', kak: 'може да е скан' };
    if (/\.(jpg|jpeg|png|heic|tif|tiff)$/.test(t)) return { cena: 'през АИ', kak: 'снимка' };
    return { cena: 'не се чете', kak: 'непознат вид' };
}

// ── Кой чете ─────────────────────────────────────────────────────────────────
// Операторът, 28.10.2026: при една проба Claude/Mistral изборът е останал в
// браузъра — и месеци наред ВСИЧКО се е чело с резервния. Четирите грешки в
// едно разрешение за строеж (измислен цитат, пропуснат ред от чеклиста,
// „няма подписи“ при два подписа) са оттам.
//
// Решение, взето веднъж при проба, не бива да важи мълчаливо завинаги.
// Затова изборът се ВИЖДА на екрана, където се чете, и се връща с един клик.

function aktChetec() {
    return localStorage.getItem('s2_chetec') || 'auto';
}

function aktImeNaChetec(kod) {
    return { auto: 'автоматично — основният, с резервен при отказ',
             claude: 'Claude', mistral: 'Mistral' }[kod] || kod;
}

// Кой ще чете ТОЗИ файл — късо, за до името му. Безплатните не минават през
// АИ въобще, затова при тях четец не се назовава.
// Операторът, 28.10.2026: „не пише колко ще струва, нито кой го чете“.
function aktKojShteChete(cena) {
    if (cena === 'не се чете') return '';
    if (cena === 'безплатно') return 'без АИ';
    const kod = aktChetec();
    return kod === 'auto' ? 'през основния четец' : 'през ' + aktImeNaChetec(kod);
}

function aktVarniAvtomatichen() {
    localStorage.removeItem('s2_chetec');
}

// Редът „Чете с: …“. При автоматично мълчи — там няма какво да се казва.
function aktChetecHtml(sledKlik) {
    const kod = aktChetec();
    if (kod === 'auto') return '';
    return `
    <div class="predupr">
        Чете се само с <strong>${_e(aktImeNaChetec(kod))}</strong> — избран от теб, не резервен.
        Основният четец не се опитва.
        <button class="bt" onclick="aktVarniAvtomatichen();${sledKlik || ''}">
            върни автоматичния</button>
    </div>`;
}

// Името на файла НЕ Е ДАННА. Най-многото е сива подсказка до въпроса, която
// операторът потвърждава или пренаписва. (ЗАДАНИЕ.md)
function aktPodskazkaOtIme(ime) {
    return String(ime || '').replace(/\.[a-z0-9]+$/i, '')
        .replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Остатъкът ────────────────────────────────────────────────────────────────
// „Това, което системата НЕ може да знае“ — изх. номер, рег. № на ПБЗН, номер
// на визата. Попълненото влиза направо в текста.
//
// Полетата висят на МОМЕНТА. Списъкът е нарочно къс: при истинския доклад за
// ХЪС останалите бяха точно 13. Расте само когато операторът каже.

const AKT_OSTATAK = {
    'Оценка на съответствието': [
        { klyuch: 'izh_nomer', ime: 'Изх. номер на доклада' },
        { klyuch: 'viza_nomer', ime: 'Номер на визата' },
    ],
    'Протокол 2': [
        { klyuch: 'izh_nomer', ime: 'Изх. номер' },
        { klyuch: 'viza_nomer', ime: 'Номер на визата' },
        // Заверките на контролните нива — пишат се тук, когато се случат, и
        // отиват в 1.2 на Акт 15. Дотук не се пазеха никъде. (Операторът,
        // 06.11.2026: „В момента Протокол 2“.)
        { klyuch: 'niva_izkop', ime: 'Ниво изкоп — заверено на', data: true },
        { klyuch: 'niva_cokul', ime: 'Ниво цокъл — заверено на', data: true },
        { klyuch: 'niva_korniz', ime: 'Ниво корниз — заверено на', data: true },
        { klyuch: 'niva_bilo', ime: 'Ниво било — заверено на', data: true },
    ],
    // Акт 15 иска най-много: освен изходящия номер, в тялото му стоят датата
    // на съставяне и двата срока — за недостатъците и за временното
    // строителство. Те идват от обиколката и от договора, не от книжата, и
    // затова системата няма откъде да ги знае. (22.10.2026)
    'Акт 15': [
        { klyuch: 'izh_nomer', ime: 'Изх. номер' },
        { klyuch: 'data_akt', ime: 'Дата на акта', data: true },
        { klyuch: 'nedostatuci_otstranyava', ime: 'Недостатъците отстранява' },
        { klyuch: 'nedostatuci_srok', ime: 'Срок за отстраняване' },
        { klyuch: 'vremenno_premahva', ime: 'Временното строителство премахва' },
        { klyuch: 'vremenno_srok', ime: 'Срок за премахване' },
        { klyuch: 'pbzn_reg', ime: 'Рег. № на становището на ПБЗН' },
        // Т. 5: „Упълномощаваме … да ни представлява … по издаване на
        // разрешение за ползване“. Живее в момента Акт 15, не в паспорта.
        // (Операторът, 06.11.2026)
        { klyuch: 't5_upalnomoshten', ime: 'Т. 5 — упълномощен за разрешението за ползване' },
    ],
    'Окончателен доклад': [
        { klyuch: 'izh_nomer', ime: 'Изх. номер на доклада' },
        { klyuch: 'vh_nomer', ime: 'Вх. номер в общината' },
        { klyuch: 'pbzn_reg', ime: 'Рег. № на становището на ПБЗН' },
    ],
};

function aktOstatak(moment) {
    return AKT_OSTATAK[moment] || [{ klyuch: 'izh_nomer', ime: 'Изх. номер' }];
}

// ── Какво сървърът иска, за да каже чеклиста ─────────────────────────────────
// Същите четири неща, които старият екран „Надзор“ подава. Полетата са на
// строежа и се четат; нищо не се изчислява наново тук.

// НАЛИЧНОТО — ЕДНА ФУНКЦИЯ (24.11.2026). Тук стоеше `aktNalichni`, дословно
// копие на `_nadzorNalichni` от кухнята (`js/08-momenti.js`). Анализът от
// 18.11.2026 (т. 5.1): две функции, които правят едно и също, един ден се
// разминават — и двете ПВА искат различни документи за един строеж. Модул 08
// се зарежда и в новото ПВА, затова тук само се вика. Липсва ли — казва се,
// не се брои наум.
function aktNalichni(st, p) {
    if (typeof _nadzorNalichni !== 'function')
        throw new Error('Кухнята (js/08-momenti.js) не е заредена — наличното не може да се преброи.');
    return _nadzorNalichni(st, p);
}

// Същото стои и в `_nadzorPriznaci` (`js/08-momenti.js`). Модулът вече се
// зарежда и тук (24.11.2026), но съставките се смятат различно — там по
// обекта (`_kesSastavkiNa`), тук по строежа (`aktSastavki`) — затова не се
// сливат наум. Повторението е опасно: разминат ли се, двете ПВА ще искат
// различни документи за един и същ строеж. `proba_priznaci_dvete.js` ги
// сравнява и пада.
function aktPriznaci(p, st) {
    const pr = {
        kategoria: st.kategoria || '',
        imaMashini: !!st.imaMashini,
        metalnaKonstrukcia: !!st.metalnaKonstrukcia,
        dpk: !!st.dpk_naznachena,
        po_poiskvane: !!st.protokol17_poiskan,
        vid: st.vid || '',
        'вид': st.vid || '',
    };
    // Съставките като признаци — така научен ред казва при какъв строеж важи.
    for (const s of (typeof aktSastavki === 'function' ? aktSastavki(p, st) : []))
        if (s && s.kod) pr['sast_' + s.kod] = true;
    return pr;
}

async function aktNadzor(p, st) {
    // Речникът (`akt/rechnik.js`, 25.11.2026): наличното под едно име е налично
    // и под другите му имена. Чете се веднъж; без него — както преди.
    if (typeof rechnikZaredi === 'function') await rechnikZaredi();
    const nalichni = typeof rechnikRazshiri === 'function' ? rechnikRazshiri(aktNalichni(st, p), st) : aktNalichni(st, p);
    const r = await aktApi('/api/nadzor', 'POST', {
        pi: p.pi, faza: 'nadzor',
        nalichni,
        tekusht: st.tekusht_moment || '',
        priznaci: aktPriznaci(p, st),
        izklyucheni: st.izklyucheni_momenti || [],
    });
    // Свързаният подобен обект пълни моментите (`akt/podobni.js`, 25.11.2026) —
    // тук, за да броят еднакво и моментът, и обектът, и плотът.
    if (r && Array.isArray(r.grupi) && typeof podobniVMomentite === 'function')
        r.podobni = podobniVMomentite(p, st, r.grupi);
    return r;
}

// Броеното се оставя при строежа, за да може Екран 1 да покаже числата, без да
// пита сървъра за всеки ред. Снимка е, не истина — затова носи дата.
function aktZapomniChisla(p, st, grupi) {
    const tekusht = st.tekusht_moment || '';
    const g = grupi.find(x => x.moment === tekusht) || grupi[0];
    if (!g) return null;
    const dve = aktDveChisla(g, st.neotnasya);
    st.dve_chisla = {
        moment: g.moment,
        nachalo: dve.nachalo ? dve.nachalo.post : null,
        podpis: dve.podpis.post,
        koga: new Date().toISOString(),
    };
    aktZapishi();
    return st.dve_chisla;
}

// ── Редовете на плота ────────────────────────────────────────────────────────
// Един ред = един СТРОЕЖ, защото работата е по строеж, не по имот.
// Показват се само работещите; архивът е отделен изглед (ЗАДАНИЕ.md).

function aktArhiviran(st) {
    return !!(st && st.arhiviran);
}

function aktPosledno(p, st) {
    return (st && st.updatedAt) || p.updatedAt || p.createdAt || p.date || '';
}

function aktRedove(danni, izgled) {
    const r = [];
    for (const p of danni.projects || []) {
        aktStroezhi(p).forEach((st, i) => {
            if (aktArhiviran(st) !== (izgled === 'arhiv')) return;
            r.push({
                id: p.id, i, imot: p, stroezh: st,
                ime: aktImeStroezh(st, i),
                pi: p.pi || '',
                nik: p.nik || '',
                moment: st.tekusht_moment || '',
                chisla: st.dve_chisla || null,
                posledno: aktPosledno(p, st),
                otKolko: aktStroezhi(p).length,
            });
        });
    }
    return r.sort((a, b) => new Date(b.posledno || 0) - new Date(a.posledno || 0));
}

// Търсенето: по ПИ, ник и адрес излиза целият имот; по име на строеж — само той.
// (Правило на оператора от 02.10.2026, пренесено както е.)
function aktTarsi(redove, tekst) {
    const t = String(tekst || '').trim().toLowerCase();
    if (!t) return redove;
    const vImota = r => [r.pi, r.nik, r.imot.address, r.imot.client && r.imot.client.name]
        .some(x => (x || '').toLowerCase().includes(t));
    return redove.filter(r => vImota(r) || r.ime.toLowerCase().includes(t));
}

// Подсещането за архивиране: системата само казва, решението е на оператора.
const AKT_SLED = ['Акт 16', 'Окончателен доклад'];

function aktVremeZaArhiv(st) {
    return !aktArhiviran(st) && AKT_SLED.includes(st && st.tekusht_moment || '');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        aktDveChisla, aktCvyat, aktProcent, aktRedove, aktTarsi, aktGlavaRedove,
        aktStroezhi, aktImeStroezh, aktArhiviran, aktVremeZaArhiv, aktData, AKT_SLED,
        aktSastavki, aktNalichni, aktPriznaci,
        aktKakvoMozhe, aktPraviloNaMomenta, aktCenaNaFajl, aktPodskazkaOtIme,
        aktOstatak, AKT_OSTATAK, aktDataTochki, aktVDosieto, aktZaDokument,
        aktChakat, aktKamChakashti, aktPiNaDokumenta, aktZapishiProveren, aktMahniChakasht,
        aktKrugove, aktIndeksKrug, aktKrug, aktImeKrug,
    };
}

// ВСЯКО ПРОЧЕТЕНО ВЛИЗА В ДОСИЕТО.
//
// Операторът, 09.11.2026: „когато прочете документ, в което и поле да бъде,
// в който и да е момент — не трябва ли да го слага и в досието?“. Дотук само
// моментът го правеше; разрешението и договорът, прочетени в паспорта,
// пълнеха полетата и изчезваха. Един запис за всички четци.
//
// Прочетеното е ПРЕДЛОЖЕНИЕ (правило 1): пази се при строежа и чака ✔ в
// досието. Същият файл, прочетен пак, заменя предишното си четене.
function aktVDosieto(st, novi, imeFajl) {
    if (!st || !(novi || []).length) return false;
    const s2 = ((st.sloy2 = st.sloy2 || {}).od = st.sloy2.od || { dokumenti: [] });
    s2.dokumenti = (s2.dokumenti || []).filter(x => x.fajl !== imeFajl).concat(novi);
    s2.koga = new Date().toISOString();
    aktZapishi();
    return true;
}

// ПРОЧЕТЕНОТО В МОМЕНТА ЧАКА ПРОВЕРКА ТАМ, НЕ ВЛИЗА ВЕДНАГА В ДОСИЕТО.
//
// Операторът, 18.11.2026: заповедна книга от СТАР обект, прочетена в момента,
// отиде направо в досието. Прочетеното се проверява там, където е прочетено;
// в досието само се записва. Чакащите стоят в `sloy2.od.chakat` — извън
// `dokumenti`, затова нито чеклистът, нито досието, нито генерирането ги
// виждат, докато операторът не каже „✔ запиши“.
const _aktDokId = d => (d && (d.id || d.fajl)) || '';

function aktChakat(st) {
    return (st && st.sloy2 && st.sloy2.od && st.sloy2.od.chakat) || [];
}

// Същият файл, прочетен пак, заменя предишното си чакащо четене.
function aktKamChakashti(st, novi, imeFajl, zaRed) {
    if (!st || !(novi || []).length) return false;
    const s2 = ((st.sloy2 = st.sloy2 || {}).od = st.sloy2.od || { dokumenti: [] });
    const koga = new Date().toISOString();
    // „раздели по 1 страница“ чете същия файл пак — редът, за който е качен, остава.
    if (zaRed === undefined)
        zaRed = ((s2.chakat || []).find(x => x.fajl === imeFajl) || {})._za_red || '';
    const svoi = novi.map(d => ({ ...d, fajl: d.fajl || imeFajl, procheten_koga: koga,
                                  _za_red: zaRed || '', _potv: {} }));
    s2.chakat = (s2.chakat || []).filter(x => x.fajl !== imeFajl).concat(svoi);
    aktZapishi();
    return true;
}

// ПИ на документа срещу ПИ на обекта. Идентификаторът се ПРЕПИСВА, не се
// поправя — затова сравнението е по цифрите и точките, без гадаене.
// Самостоятелният обект (68134.4083.1234.1.5) е в имота 68134.4083.1234.
function aktPiNaDokumenta(d, pi) {
    const chisto = s => String(s || '').replace(/[^\d.]/g, '').replace(/^\.+|\.+$/g, '');
    const o = (d && d.obekt) || {};
    const surovo = String((o.identifikator && o.identifikator.stoynost) || '').trim();
    const dok = (surovo.match(/\d{3,5}\.\d+\.\d+(?:\.\d+)*/) || [''])[0];
    const obekt = chisto(pi);
    if (!dok) return { status: 'nyama', dok: surovo, obekt };
    if (!obekt) return { status: 'nyama-obekt', dok, obekt };
    const s = dok === obekt || dok.startsWith(obekt + '.') ? 'savpada' : 'razlichen';
    return { status: s, dok, obekt };
}

// „✔ запиши“: документът минава в досието с проверените в момента факти.
// Четене на същия файл от друг път (друго разделяне) отпада — както в
// `aktVDosieto`, същият файл, прочетен пак, заменя предишното си четене.
function aktZapishiProveren(st, id) {
    const s2 = st && st.sloy2 && st.sloy2.od;
    const d = s2 && (s2.chakat || []).find(x => _aktDokId(x) === id);
    if (!d) return null;
    const { _za_red, _potv, ...chist } = d;
    s2.chakat = s2.chakat.filter(x => x !== d);
    s2.dokumenti = (s2.dokumenti || []).filter(x => _aktDokId(x) !== id
        && !(x.fajl === d.fajl && x.procheten_koga !== d.procheten_koga));
    s2.dokumenti.push(chist);
    const potv = (s2.potvardeni = s2.potvardeni || {});
    for (const [pole, v] of Object.entries(_potv || {})) potv[`${id}::${pole}`] = v;
    s2.koga = new Date().toISOString();
    aktZapishi();
    return { dokument: chist, zaRed: _za_red || '', svereni: Object.keys(_potv || {}).length };
}

function aktMahniChakasht(st, id) {
    const s2 = st && st.sloy2 && st.sloy2.od;
    if (!s2 || !(s2.chakat || []).some(x => _aktDokId(x) === id)) return false;
    s2.chakat = s2.chakat.filter(x => _aktDokId(x) !== id);
    aktZapishi();
    return true;
}

// ТОЧКИТЕ В ДАТАТА СЕ СЛАГАТ САМИ.
//
// Операторът, 09.11.2026: „всички дати … преди не изискваха точки, сега
// изискват“. Старите полета имаха `formatDateInput` (26042024 → 26.04.2024);
// новите екрани го нямаха. Едно правило за всяко поле „дд.мм.гггг“. Пипа се
// САМО когато са написани голи цифри — написаното с точки не се пренарежда.
function aktDataTochki(v) {
    const s = String(v || '');
    // Само цифри и точки, а точките — там, където ги слага самото правило
    // (след деня и след месеца). „1.3.2025“ не се пипа.
    if (!/^[\d.]+$/.test(s) || [...s].some((c, i) => c === '.' && i !== 2 && i !== 5)) return s;
    const c = s.replace(/\./g, '').slice(0, 8);
    return [c.slice(0, 2), c.slice(2, 4), c.slice(4, 8)].filter(Boolean).join('.');
}
if (typeof document !== 'undefined') document.addEventListener('input', e => {
    const el = e.target;
    if (!el || el.tagName !== 'INPUT' || el.placeholder !== 'дд.мм.гггг') return;
    const nov = aktDataTochki(el.value);
    if (nov !== el.value) el.value = nov;
});
