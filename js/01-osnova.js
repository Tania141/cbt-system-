// АКТ СИСТЕМ · 01-osnova.js
// данните, API-то, записът, общите данни, навигацията
//
// Отделен от app.js на 13.10.2026 (стъпка 2 от ПОДРЕЖДАНЕ.md).
// Файловете се включват по РЕД и споделят едно и също глобално
// пространство — точно както беше в единия скрипт.

// АКТ СИСТЕМ — целият код на PWA.
//
// Изваден от index.html на 13.10.2026 (стъпка 1 от ПОДРЕЖДАНЕ.md), без да се
// пипа и ред от него. Следващата стъпка го разделя по области.
//
// Включва се в края на <body>, без defer — така работеше и като вграден
// скрипт: целият маркъп вече съществува, когато той се изпълнява.

// ═══════════════════════════════════════════════════════════
//  DATA MODEL
// ═══════════════════════════════════════════════════════════
let appData = {
    consultants: [],
    projects: [],
    currentProject: null,
    apiUrl: 'https://web-production-220c7.up.railway.app',
    history: []
};

// ═══════════════════════════════════════════════════════════
//  API INTEGRATION (Flask/FastAPI on Railway)
// ═══════════════════════════════════════════════════════════
// ── Auth ─────────────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('akt_token'); }

function showLoginScreen() {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('user-menu').style.display = 'none';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    setLoginError('');
}

function hideLoginScreen() {
    document.getElementById('login-screen').classList.remove('active');
}

function setLoginError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.classList.toggle('visible', !!msg);
}

function applyUserSession() {
    const token = getToken();
    const userJson = localStorage.getItem('akt_user');
    if (!token || !userJson) { showLoginScreen(); return false; }
    try {
        const user = JSON.parse(userJson);
        const emailEl = document.getElementById('user-email-display');
        if (emailEl) emailEl.textContent = user.email || '';
        document.getElementById('user-menu').style.display = 'flex';
        hideLoginScreen();
        return true;
    } catch(e) { showLoginScreen(); return false; }
}

async function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const url = (appData.apiUrl || '').replace(/\/$/, '');

    if (!url) { setLoginError('Няма конфигуриран API URL. Добавете го в Настройки след вход.'); return; }
    if (!email || !password) { setLoginError('Въведете email и парола.'); return; }

    const btn = document.getElementById('login-btn');
    btn.textContent = 'Влизане...';
    btn.disabled = true;
    setLoginError('');

    try {
        const r = await fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);

        localStorage.setItem('akt_token', data.token);
        localStorage.setItem('akt_user', JSON.stringify({ email: data.email, role: data.role }));
        applyUserSession();
    } catch(e) {
        setLoginError(e.message || 'Грешка при вход.');
    } finally {
        btn.textContent = 'Влез в системата';
        btn.disabled = false;
    }
}

function doLogout() {
    localStorage.removeItem('akt_token');
    localStorage.removeItem('akt_user');
    showLoginScreen();
}

// Support Enter key on login form
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.getElementById('login-screen').classList.contains('active')) {
        doLogin();
    }
});

async function apiCall(endpoint, method = 'GET', body = null) {
    const url = (appData.apiUrl || '').replace(/\/$/, '');
    if (!url) throw new Error('API URL не е конфигуриран');
    const token = getToken();
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(`${url}${endpoint}`, opts);
    if (r.status === 401) {
        localStorage.removeItem('akt_token');
        localStorage.removeItem('akt_user');
        showLoginScreen();
        throw new Error('Сесията е изтекла. Моля, влезте отново.');
    }
    if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: r.statusText }));
        throw new Error(err.detail || err.error || `HTTP ${r.status}`);
    }
    return r.json();
}

async function testApiConnection() {
    const badge = document.getElementById('api-status-badge');
    try {
        if (badge) badge.innerHTML = '<span class="badge badge-gray">● Тестване...</span>';
        const data = await apiCall('/health');
        if (badge) badge.innerHTML = '<span class="badge badge-green">● Свързан</span>';
        showAlert('success', `✅ API е свързан! Версия: ${data.version || '1.0'}`);
    } catch(e) {
        if (badge) badge.innerHTML = '<span class="badge" style="background:var(--red-light);color:var(--red)">● Грешка</span>';
        showAlert('error', `❌ API грешка: ${e.message}`);
    }
}

function saveApiUrl() {
    const url = document.getElementById('api-url-input').value.trim();
    appData.apiUrl = url;
    saveData();
    updateApiIndicator();
    showAlert('success', '🔌 API URL запазен!');
}

function updateApiIndicator() {
    const el = document.getElementById('api-indicator');
    if (!el) return;
    const txt = document.getElementById('api-indicator-text');
    el.className = appData.apiUrl ? 'connected' : 'disconnected';
    if (txt) txt.textContent = appData.apiUrl ? 'API: свързан' : 'API: не е конфигуриран';
}

// ═══════════════════════════════════════════════════════════
//  ОФИЦИАЛНИТЕ РЕГИСТРИ (14.10.2026)
// ═══════════════════════════════════════════════════════════
// Изведени от сайтовете на ДНСК и КИИП с registri/napravi.py и сервирани до
// приложението. Данните остаряват — затова всеки файл носи датата, на която е
// изведен, и тя се показва.
//
// Операторът: проверява се при вписване и при Акт 15; ако нещо не се намери —
// БЕЛЕЖКА, не спиране. Регистърът може да изостава, документът не чака.

const _registri = {};

async function registar(ime) {
    if (_registri[ime] !== undefined) return _registri[ime];
    try {
        const r = await fetch(`registri/${ime}.json`);
        _registri[ime] = r.ok ? await r.json() : null;
    } catch (e) {
        _registri[ime] = null;
    }
    return _registri[ime];
}

// Имената в регистрите са с главни букви, с различни интервали и съкращения.
const _regZn = s => String(s || '').toUpperCase()
    .replace(/[„“"'`.,]/g, '')
    .replace(/\bЕООД\b|\bООД\b|\bАД\b|\bЕАД\b|\bСД\b|\bКД\b/g, '')
    .replace(/\s+/g, ' ').trim();

// „27.07.2028“ → дата, с която може да се сравнява.
function _regData(t) {
    const m = String(t || '').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}

// ═══════════════════════════════════════════════════════════
//  ЕГН — разпознаване (15.10.2026)
// ═══════════════════════════════════════════════════════════
// „Десет цифри“ не е достатъчно: телефонът е също десет цифри и всеки
// единайсети би минал за ЕГН по контролна сума. Затова се проверяват И
// датата в първите шест цифри, И контролната сума — както е по закон.
//
// Месецът е +20 за родените преди 1900 г. и +40 за родените след 1999 г.
const _EGN_TEGLA = [2, 4, 8, 5, 10, 9, 7, 3, 6];

function eEGN(v) {
    const t = String(v == null ? '' : v).replace(/\s|-/g, '');
    if (!/^\d{10}$/.test(t)) return false;
    let mesec = +t.slice(2, 4);
    if (mesec > 40) mesec -= 40;
    else if (mesec > 20) mesec -= 20;
    if (mesec < 1 || mesec > 12) return false;
    const den = +t.slice(4, 6);
    if (den < 1 || den > 31) return false;
    let sbor = 0;
    for (let i = 0; i < 9; i++) sbor += (+t[i]) * _EGN_TEGLA[i];
    return (sbor % 11) % 10 === +t[9];
}

// Какво да се покаже вместо ЕГН. Всичко друго — ЕИК, телефон — минава.
const skriiEGN = v => eEGN(v) ? '••••••••••' : String(v == null ? '' : v);

const specializations = [
    'Архитектура','Конструктивна','ВиК','Електро','ОВК и ЕЕ',
    'Геодезия','Инженерна геология и хидрогеология',
    'Паркоустройство и Благоустройство','Газоснабдяване','ПБ','СХИ','Пътна'
];

// ═══════════════════════════════════════════════════════════
//  PERSISTENCE
// ═══════════════════════════════════════════════════════════
function loadData() {
    // Migrate from old cbt_v5 key if present
    const legacyCbt = localStorage.getItem('cbt_v5');
    if (legacyCbt && !localStorage.getItem('akt_v5')) {
        localStorage.setItem('akt_v5', legacyCbt);
        localStorage.removeItem('cbt_v5');
    }
    const saved = localStorage.getItem('akt_v5');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            appData = { ...appData, ...parsed };
            if (!appData.history) appData.history = [];
            // И записаното в браузъра се пречиства от повтарящи се номера —
            // инак вече счупеният избор остава счупен след поправката.
            nomeraNaObekti(appData.projects);
            // Keep hardcoded default if nothing was ever saved
            if (!appData.apiUrl) appData.apiUrl = 'https://web-production-220c7.up.railway.app';
        } catch(e) {
            console.warn('Failed to parse saved data');
        }
    }

    // Check for old v4 data to migrate
    const oldData = localStorage.getItem('cbtFullSystemData');
    if (oldData && appData.projects.length === 0) {
        try {
            const old = JSON.parse(oldData);
            if (old.projects) appData.projects = old.projects;
            if (old.consultants) appData.consultants = old.consultants;
            addHistory('migrate', null, 'Мигрирани данни от v4');
            saveData();
            showAlert('info', '✅ Данните от предишната версия са мигрирани успешно!');
        } catch(e) {}
    }

    // Auto-create default consultant if empty
    if (appData.consultants.length === 0) {
        appData.consultants.push({
            id: Date.now(),
            name: 'СиБиТи Консулт ООД',
            eik: '',
            manager: '',
            address: '',
            cert: '',
            employees: [
                { id: Date.now()+1, name: 'Надя Йорданова Спасова', specialization: 'Конструктивна' },
                { id: Date.now()+2, name: 'Златан Златанов', specialization: 'Геодезия' }
            ]
        });
        saveData();
    }

    const apiInput = document.getElementById('api-url-input');
    if (apiInput) apiInput.value = appData.apiUrl || '';
    updateApiIndicator();
    applyUserSession();
    renderConsultants();
    filterPassports();
    updateNavBadge();

    // Консултантите и историята — ПРЕДИ обектите, защото обектите се връзват
    // към консултант по id. (01.10.2026)
    // Load projects from API (authoritative source); localStorage is the cache/fallback
    if (appData.apiUrl && getToken()) {
        zarediObshtiDanni()
            .catch(e => console.warn('общи данни:', e))
            .then(() => apiCall('/api/passports'))
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    // Normalise consultant: match by id first, then by name, so the
                    // local consultant object (with employees etc.) is used if available
                    appData.projects = nomeraNaObekti(data).map(p => {
                        // Normalise consultant to local object (id + employees)
                        if (p.consultant && appData.consultants.length > 0) {
                            const byId   = appData.consultants.find(c => c.id == p.consultant.id);
                            const byName = appData.consultants.find(c => c.name === p.consultant.name);
                            const local  = byId || byName;
                            if (local) p.consultant = { id: local.id, name: local.name };
                        }
                        return p;
                    });
                    saveData();
                    filterPassports();
                    updateNavBadge();
                }
            })
            .catch(() => {}); // silently fall back to localStorage cache
    }

}

// Записът в браузъра може да откаже — мястото не е безкрайно (около 5 MB за
// целия браузър), а в `akt_v5` влиза всичко: обекти, консултанти, история и
// прочетеното от слой 2. Досега грешката се гълташе тихо и въпреки това се
// показваше „✅ запазено“ — тоест работата изчезваше, без да се разбере.
// Затова: връща true/false и при отказ казва високо, че записът НЕ е станал.
// (29.09.2026)
// Сървърът връща паспортите БЕЗ `id` — досега всеки получаваше `id = pi`.
// Два паспорта в един и същ имот (преустройство на магазин и преустройство в
// аптека, или два строежа, заведени като два обекта) тогава получаваха ЕДИН И
// СЪЩИ номер, а всяка справка намира ПЪРВИЯ: `_zhivObekt`, „Редактирай“,
// „Изтрий“. Оттам и „на другия обект е собствеността на предишния“ — и акт,
// вписан на втория, отиваше на първия. (Операторът, 16.10.2026)
//
// Номерът е ПИ, а при повторение — ПИ с поредност. Пази се еднакъв при всяко
// зареждане, за да не се къса изборът на обект.
function nomeraNaObekti(spisak) {
    const vzeti = new Set();
    return (spisak || []).map((p, i) => {
        let id = String(p.id || '').trim() || String(p.pi || '').trim();
        if (!id || vzeti.has(id)) {
            const osnova = id || 'obekt';
            let n = 2;
            while (vzeti.has(osnova + '#' + n)) n++;
            id = osnova + '#' + n;
        }
        vzeti.add(id);
        p.id = id;
        return p;
    });
}

function saveData() {
    const predi = appData.savedAt;
    appData.savedAt = new Date().toISOString();
    try {
        const tekst = JSON.stringify(appData);
        localStorage.setItem('akt_v5', tekst);
        // Предупреждение ПРЕДИ да свърши мястото — след като е свършило е късно.
        if (tekst.length > 4 * 1024 * 1024) _predupredizaMyasto(tekst.length);
        return true;
    } catch (e) {
        appData.savedAt = predi;   // не се прави на записано
        console.error('saveData:', e);
        _kazhiCheNeEZapisano(e);
        return false;
    }
}

// Показва се веднъж и стои, докато не се оправи — това не е бележка, която
// да мине покрай окото.
let _neZapisanoKazano = false;
function _kazhiCheNeEZapisano(e) {
    const mnogo = /quota|exceed|full|QUOTA/i.test(String(e && (e.name || e.message)));
    if (_neZapisanoKazano) return;
    _neZapisanoKazano = true;
    setTimeout(() => { _neZapisanoKazano = false; }, 60000);
    // Дълго: това не бива да се изпусне, докато си вдигнала очи от екрана.
    showAlert('error', mnogo
        ? '⛔ НЕ Е ЗАПИСАНО в браузъра — мястото свърши. Обектите отиват в базата '
          + 'данни, но консултантите и историята се пазят само тук. Изчисти прочетеното '
          + 'от слой 2 на стари обекти („Изчисти прочетеното“) и запази пак.'
        : `⛔ НЕ Е ЗАПИСАНО в браузъра: ${e && e.message ? e.message : e}. Не затваряй раздела, преди да е записано.`,
        120000);
}

// ═══════════════════════════════════════════════════════════
//  ОБЩИ ДАННИ НА ФИРМАТА — консултанти и история (01.10.2026)
// ═══════════════════════════════════════════════════════════
// Паспортите отдавна отиват в базата, но тези двете стояха САМО в браузъра:
// затова Edge и Chrome показваха различни консултанти, а единственото им копие
// беше в localStorage. Сега вървят към `/api/danni/<ключ>`.
//
// Правилото при разминаване е различно за двете, защото са различни по природа:
//   · консултантите са ЕДИН списък, който се редактира — при зареждане печели
//     сървърът (общата истина), при редакция се качва;
//   · историята е дневник, който всеки браузър трупа поотделно — тя се СЛИВА,
//     иначе единият би изтрил записите на другия.

function _danniMozhe() {
    return !!(appData.apiUrl && getToken());
}

async function _danniVzemi(klyuch) {
    if (!_danniMozhe()) return null;
    try {
        const r = await apiCall(`/api/danni/${klyuch}`, 'GET');
        return r && r.stoynost ? r.stoynost : null;
    } catch (e) {
        console.warn(`не можах да прочета „${klyuch}“ от сървъра:`, e.message);
        return null;
    }
}

// Тихо: вика се при всяка редакция, а едно сиво съобщение на всяко записване
// е по-лошо от никакво. Казва се само когато НЕ е станало.
async function _danniZapishi(klyuch, stoynost) {
    if (!_danniMozhe()) return false;
    try {
        await apiCall(`/api/danni/${klyuch}`, 'POST', { stoynost });
        return true;
    } catch (e) {
        showAlert('error', `⚠️ „${klyuch}“ не е качено на сървъра: ${e.message}. `
            + 'Остава само в този браузър.');
        return false;
    }
}

function kachiKonsultanti() {
    return _danniZapishi('konsultanti', appData.consultants || []);
}

// Историята се трупа по много на минута — качва се веднъж, след като шумът
// утихне, а не на всеки ред.
let _istoriaTaymer = null;
function kachiIstoriaSledMalko() {
    if (!_danniMozhe()) return;
    clearTimeout(_istoriaTaymer);
    _istoriaTaymer = setTimeout(() => {
        _danniZapishi('istoria', (appData.history || []).slice(0, 500));
    }, 5000);
}

// Зарежда двете от сървъра при влизане. Връща обещание, за да могат обектите
// да изчакат консултантите — те се връзват към консултант по id.
async function zarediObshtiDanni() {
    if (!_danniMozhe()) return;

    const [otSarvara, istoria] = await Promise.all([
        _danniVzemi('konsultanti'),
        _danniVzemi('istoria'),
    ]);

    // Консултанти: сървърът е общата истина. Ако там още няма нищо, качваме
    // нашите — това е първото пренасяне и се случва веднъж.
    if (Array.isArray(otSarvara) && otSarvara.length) {
        appData.consultants = otSarvara;
        renderConsultants();
    } else if ((appData.consultants || []).length) {
        await kachiKonsultanti();
    }

    // История: сливане, за да не изтрие единият браузър записите на другия.
    if (Array.isArray(istoria) && istoria.length) {
        const predi = (appData.history || []).length;
        appData.history = _slejIstoria(appData.history, istoria);
        if (appData.history.length !== predi) renderHistory();
    }

    saveData();
}

// Изчистването трябва да стигне и до сървъра ВЕДНАГА — иначе при следващото
// влизане сливането би възкресило всичко изтрито. Затова не през таймера.
async function izchistiIstoria() {
    if (!confirm('Изчисти цялата история? Изтрива се и от сървъра, за всички браузъри.')) return;
    clearTimeout(_istoriaTaymer);
    appData.history = [];
    saveData();
    renderHistory();
    if (_danniMozhe() && await _danniZapishi('istoria', [])) {
        showAlert('success', 'Историята е изчистена — и тук, и на сървъра.');
    }
}

// Два браузъра, два различни дневника — взема се обединението, без повторенията.
function _slejIstoria(mestna, ot_sarvara) {
    const vsichki = [...(mestna || []), ...(ot_sarvara || [])];
    const vidyani = new Set();
    const slyata = [];
    for (const z of vsichki) {
        if (!z || !z.date) continue;
        const klyuch = `${z.date}|${z.type || ''}|${z.pi || ''}|${z.detail || z.description || ''}`;
        if (vidyani.has(klyuch)) continue;
        vidyani.add(klyuch);
        slyata.push(z);
    }
    slyata.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return slyata.slice(0, 500);
}

// Мястото в браузъра е около 5 MB. Като се прехвърли 4, казваме веднъж на час —
// докато има какво да се направи, а не след като записът вече е отказал.
let _myastoKazano = 0;
function _predupredizaMyasto(dalzhina) {
    if (Date.now() - _myastoKazano < 3600000) return;
    _myastoKazano = Date.now();
    showAlert('warning', `⚠️ Записът в браузъра стигна ${(dalzhina / 1048576).toFixed(1)} MB от около 5 MB. `
        + 'Най-тежко е прочетеното от слой 2. На приключен обект натисни „Изчисти прочетеното“ — '
        + 'обектът и документите му остават в базата данни.');
}




function addHistory(type, pi, detail) {
    appData.history.unshift({
        type,
        pi: pi || null,
        detail: detail || '',
        date: new Date().toISOString()
    });
    if (appData.history.length > 500) appData.history.pop();
    kachiIstoriaSledMalko();
}

// ═══════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(`page-${page}`).classList.add('active');
    // Формата за нов обект няма свой ред в менюто — влиза се от „Обекти“,
    // затова там свети „Обекти“.
    const navBtn = document.getElementById(`nav-${page}`)
        || (page === 'new-passport' ? document.getElementById('nav-passports') : null);
    if (navBtn) navBtn.classList.add('active');

    // Render on navigate
    if (page === 'passports') { filterPassports(); populateFilterDropdowns(); }
    else if (page === 'new-passport') renderPassportForm(null);
    else if (page === 'osip') renderOsipPage();
    else if (page === 'imot') renderImotPage();
    else if (page === 'sobstvenost') renderSobstvenostPage();
    else if (page === 'proekt') renderProektPage();
    else if (page === 'dokumentite') renderDokumentitePage();
    else if (page === 'nadzor') renderNadzorPage();
    else if (page === 'kakav') renderKakavPage();
    else if (page === 'history') renderHistory();
    else if (page === 'zk') renderZK();
    else if (page === 'consultants') renderConsultants();
}

// ═══════════════════════════════════════════════════════════