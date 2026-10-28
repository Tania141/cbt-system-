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
    try {
        aktDanni.savedAt = new Date().toISOString();
        localStorage.setItem(AKT_KLYUCH, JSON.stringify(aktDanni));
        return true;
    } catch (e) {
        console.error('aktZapishi:', e);
        return false;
    }
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
    if (!r.ok) throw new Error('сървърът отказа: ' + r.status);
    return r.json();
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
    const vazl = (p.clients && p.clients.length ? p.clients : [p.client].filter(Boolean))
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
    const redove = (grupa && grupa.dokumenti) || [];
    const mahnati = new Set(neotnasya || []);
    const imam = r => r.sastoyanie === AKT_IMAM || mahnati.has(r.dokument);
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
    ],
    // Акт 15 иска най-много: освен изходящия номер, в тялото му стоят датата
    // на съставяне и двата срока — за недостатъците и за временното
    // строителство. Те идват от обиколката и от договора, не от книжата, и
    // затова системата няма откъде да ги знае. (22.10.2026)
    'Акт 15': [
        { klyuch: 'izh_nomer', ime: 'Изх. номер' },
        { klyuch: 'data_akt', ime: 'Дата на акта' },
        { klyuch: 'nedostatuci_otstranyava', ime: 'Недостатъците отстранява' },
        { klyuch: 'nedostatuci_srok', ime: 'Срок за отстраняване' },
        { klyuch: 'vremenno_premahva', ime: 'Временното строителство премахва' },
        { klyuch: 'vremenno_srok', ime: 'Срок за премахване' },
        { klyuch: 'pbzn_reg', ime: 'Рег. № на становището на ПБЗН' },
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

function aktNalichni(st) {
    const otChetene = ((st.sloy2 && st.sloy2.od && st.sloy2.od.dokumenti) || [])
        .map(d => (d.cheklist_red || '').trim()).filter(Boolean);
    return [...new Set([...(st.nadzor_otmetnati || []), ...otChetene])];
}

// Същото стои и в `_nadzorPriznaci` (`js/08-momenti.js`) — онзи модул не се
// зарежда тук. Повторението е опасно: разминат ли се, двете ПВА ще искат
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
    return aktApi('/api/nadzor', 'POST', {
        pi: p.pi, faza: 'nadzor',
        nalichni: aktNalichni(st),
        tekusht: st.tekusht_moment || '',
        priznaci: aktPriznaci(p, st),
        izklyucheni: st.izklyucheni_momenti || [],
    });
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
        aktOstatak, AKT_OSTATAK,
        aktKrugove, aktIndeksKrug, aktKrug, aktImeKrug,
    };
}
