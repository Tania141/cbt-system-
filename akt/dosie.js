// АКТ СИСТЕМ · новото ПВА · dosie.js
// ЕКРАН 6. ДОСИЕТО — килерът
//
// „Всичко, качено по обекта, на едно място.“ (ЗАДАНИЕ.md)
//
// Списък с файловете: какво е, номер, дата, кой ред доказва, сверено ли е.
// Търсене по име. Клик отваря прочетеното с цитатите.
//
// Тук се виждат и „видени, но неописани“ — документите, които чеклистът не
// знае, с брояча. Оттам се одобряват като нови редове.
//
// ТОЗИ ЕКРАН НЕ ВЪВЕЖДА. Само показва и поправя. Четенето е на момента и на
// проекта; тук се гледа какво е влязло.
//
// Сверяването („всички факти потвърдени ли са“) е на кухнята —
// `js/04-vhodni-dokumenti.js`. Тук не се смята.

'use strict';

let dosieId = null;
let dosieIndeks = 0;
let dosieTarseno = '';
let dosieOtvoren = '';     // кой документ е разгънат
let dosieKandidati = null; // прочетени от сървъра веднъж

function dosieOtvori(id, i) {
    dosieId = id;
    dosieIndeks = Number(i || 0);
    dosieTarseno = '';
    dosieOtvoren = '';
    const p = aktObekt(id);
    if (!p) {
        document.getElementById('dosie-telo').innerHTML =
            '<div class="pusto"><div class="pusto-ime">Този обект го няма</div></div>';
        return;
    }
    aktZapomniObekt(p, dosieIndeks);
    dosieRisuvai();
    dosieZarediKandidati();
}

function dosieZhiv() {
    const p = aktObekt(dosieId);
    if (!p) return null;
    const st = aktStroezh(p, dosieIndeks);
    return { p, st, s2: (st.sloy2 || {}).od || {} };
}

function dosieRisuvai() {
    const z = dosieZhiv();
    if (!z) return;
    document.getElementById('dosie-telo').innerHTML =
        dosieTarseneHtml(z)
        + dosieSpisakHtml(z)
        + dosieKandidatiHtml();
}

// ── Търсенето ────────────────────────────────────────────────────────────────

function dosieTarseneHtml(z) {
    const vsichki = z.s2.dokumenti || [];
    return `
    <div class="redica">
        <input type="text" class="tarsene" id="dosie-tarsene" value="${_e(dosieTarseno)}"
               placeholder="Търси по име на файл, вид или номер…"
               oninput="dosieTarsi(this.value)">
        <span class="brojach">${vsichki.length} ${vsichki.length === 1 ? 'документ' : 'документа'}</span>
    </div>`;
}

function dosieTarsi(tekst) {
    dosieTarseno = tekst;
    dosieRisuvai();
    const vhod = document.getElementById('dosie-tarsene');
    if (vhod) { vhod.focus(); vhod.setSelectionRange(vhod.value.length, vhod.value.length); }
}

function dosieNamereni(z) {
    const t = String(dosieTarseno || '').trim().toLowerCase();
    const vsichki = z.s2.dokumenti || [];
    if (!t) return vsichki;
    return vsichki.filter(d => [d.fajl, d.vid, d.cheklist_red,
                                (d.nomer || {}).stoynost, (d.data || {}).stoynost]
        .some(x => String(x || '').toLowerCase().includes(t)));
}

// ── Списъкът ─────────────────────────────────────────────────────────────────

function dosieSpisakHtml(z) {
    const redove = dosieNamereni(z);
    if (!(z.s2.dokumenti || []).length) {
        return `<div class="kutiya-razdel">
            <div class="nadpis">Прочетени документи</div>
            <p>Още няма. Документите влизат тук, когато ги прочетеш на момента
               или на проекта.</p></div>`;
    }
    if (!redove.length) {
        return `<div class="kutiya-razdel">
            <div class="nadpis">Прочетени документи</div>
            <p>Нищо не отговаря на търсенето.</p></div>`;
    }
    const potv = z.s2.potvardeni || {};
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Прочетени документи · ${redove.length}</div>
        <p class="poyasnenie">Файловете не се пазят — пазят се прочетените факти, с цитат
           и страница. Клик отваря какво е разбрал четецът.</p>
        ${redove.map(d => dosieRedHtml(d, potv)).join('')}
    </div>`;
}

function dosieRedHtml(d, potv) {
    const id = _s2Id(d);
    const fakti = _s2Fakti(d);
    const sveren = _s2Sveren(d, potv);
    const broj = fakti.filter(x => potv[`${id}::${x.k}`]).length;
    const otvoren = dosieOtvoren === id;
    return `
    <div class="dok ${sveren ? 'dok-sveren' : ''}">
        <div class="dok-glava" onclick="dosieRazgani('${encodeURIComponent(id)}')"
             tabindex="0" onkeydown="if(event.key==='Enter')dosieRazgani('${encodeURIComponent(id)}')">
            <span class="dok-znak">${sveren ? '✓' : fakti.length ? '…' : '—'}</span>
            <span class="dok-vid">${_e(d.vid || 'документ')}</span>
            <span class="dok-nomer">${_e((d.nomer || {}).stoynost || '')}${
                (d.data || {}).stoynost ? ' · ' + _e(d.data.stoynost) : ''}</span>
            <span class="dok-sverka">${fakti.length
                ? `сверени ${broj} от ${fakti.length}` : 'няма извадени факти'}</span>
        </div>
        <div class="otkade">
            ${_e(d.fajl || '')}${d.sken ? ' · скан' : ''}${d.chetec ? ' · ' + _e(d.chetec) : ''}
            ${d.cheklist_red
                ? ` · доказва: <strong>${_e(d.cheklist_red)}</strong>`
                : ' · <span class="dok-bez-red">няма ред в чеклиста</span>'}
        </div>
        ${otvoren ? dosieFaktiHtml(id, fakti, potv) : ''}
    </div>`;
}

function dosieRazgani(id64) {
    const id = decodeURIComponent(id64);
    dosieOtvoren = dosieOtvoren === id ? '' : id;
    dosieRisuvai();
}

// Прочетеното, с цитатите — и ✔-то. Правило 3: всяка стойност казва откъде е.
//
// СВЕРЯВА СЕ ТУК. Заданието казва за този екран: „НЕ въвежда — само показва и
// поправя“. Сверяването е точно поправяне: виждаш какво е разбрал четецът, до
// него цитата, и казваш „да“ или пишеш вярното от хартията. Операторът,
// 28.10.2026: отваря досието, за да чекне — а дотук нямаше с какво.
//
// По ФАКТ, не по документ: два модела прочетоха еднакво грешно една и съща
// ръкописна дата (пробата, 15.09.2026). Един ✔ за целия документ би я пуснал.
//
// И ✔-то върши ДВЕ работи. Операторът, 28.10.2026: „важно е операторът да
// избере коя информация влиза в състава на акт 15 — ако чекне сверено, това
// влиза като изречение; ако го е оставил да чака, значи не е от значение“.
// Тоест нечекнатото не е недовършено, а отхвърлено нарочно. Затова екранът го
// казва с думи: машината може да прочете, че има подписи и печат, но дали това
// да стане изречение в акта, е преценка на надзора.
function dosieFaktiHtml(id, fakti, potv) {
    const nai = dosieNaimenovanieHtml(id, fakti, potv);
    if (!fakti.length && !nai)
        return '<div class="otkade">Четецът не е извадил нищо от този файл.</div>';
    return `
    <div class="dok-fakti">
        ${nai}
        ${dosieGrupi(fakti).map(g => dosieGrupaHtml(id, g, potv)).join('')}
        <div class="otkade">Чекнатото влиза в текста на акта. Нечекнатото не влиза —
           значи си преценила, че не е от значение.</div>
    </div>`;
}

// ── Разделите ────────────────────────────────────────────────────────────────
// Операторът, 28.10.2026: „групово по раздел, само веднъж“.
//
// Разрешението за строеж изрежда всичките възложители, по четири полета на
// човек — само те дават двайсетина факта. Двайсет и осем отделни клика за
// един документ е работа, която никой няма да свърши до края.
//
// Групите не са произволни: фактите влизат в акта НА ГРУПИ. Възложителите са
// една таблица, имотът е едно изречение. Затова и чекването е на групи — то
// следва текста, не екрана.
const DOSIE_RAZDELI = [
    ['dokument',   'Документът',        k => /^(naimenovanie|nomer|data|izdatel|material|proizvoditel|sadarzhanie)$/.test(k)],
    ['imot',       'Имотът',            k => k.startsWith('obekt.')],
    ['uchastnici', 'Участниците',       k => /^u\d+\./.test(k)],
    ['notarialen', 'Нотариалният акт',  k => /^(nt_|vp_|r\d+\.)/.test(k)],
    ['pozovavania','Позоваванията',     k => /^p\d+\./.test(k)],
];

function dosieGrupi(fakti) {
    const out = [];
    const vzeti = new Set();
    for (const [kod, ime, pasva] of DOSIE_RAZDELI) {
        const svoi = fakti.filter(x => !vzeti.has(x.k) && pasva(x.k));
        svoi.forEach(x => vzeti.add(x.k));
        if (svoi.length) out.push({ kod, ime, fakti: svoi });
    }
    // Каквото не е разпознато, не изчезва — излиза в свой раздел.
    const ostanali = fakti.filter(x => !vzeti.has(x.k));
    if (ostanali.length) out.push({ kod: 'drugo', ime: 'Друго', fakti: ostanali });
    return out;
}

function dosieGrupaHtml(id, g, potv) {
    const chakat = g.fakti.filter(x => !potv[`${id}::${x.k}`]);
    const klyuchove = encodeURIComponent(JSON.stringify(chakat.map(x => `${id}::${x.k}`)));
    return `
    <div class="fakt-razdel">
        <div class="nadpis nadpis-razdel">
            ${_e(g.ime)} <span class="otkade">${g.fakti.length - chakat.length} от ${g.fakti.length}</span>
            ${chakat.length ? `<button class="bt bt-glaven" onclick="dosieSveriGrupa('${klyuchove}')">
                ✔ вярно е — всички ${chakat.length}</button>` : ''}
        </div>
        ${g.fakti.map(x => dosieFaktHtml(id, x, potv)).join('')}
    </div>`;
}

// Въпросът „всички ли си проверила на хартия“ се задава САМО ВЕДНЪЖ за сесия.
// Питан на всеки раздел, той престава да е въпрос и става пречка — а пречка,
// която се кликва машинално, не пази нищо.
let dosiePitano = false;

function dosieSveriGrupa(kl64) {
    const kluchove = JSON.parse(decodeURIComponent(kl64));
    if (!kluchove.length) return;
    if (!dosiePitano) {
        if (!confirm('Сверяваш няколко стойности наведнъж.\n\n'
            + 'Чекнатото влиза в текста на акта. Всички ли си проверила на хартия?\n\n'
            + 'Питам само този път.')) return;
        dosiePitano = true;
    }
    for (const kl of kluchove) s2Potvardi(encodeURIComponent(kl));
    dosieSledPotvardzhdenie();
}

function dosieFaktHtml(id, x, potv) {
    const kl = `${id}::${x.k}`, k64 = encodeURIComponent(kl);
    const v = potv[kl];
    // Поправената стойност бие прочетената — показва се тя, а под нея цитатът.
    const pokazvana = v && String(v.stoynost || '').trim() ? v.stoynost : x.obj.stoynost;
    const popravena = v && String(v.stoynost || '') !== String(v.prochetena || '');
    return `
    <div class="fakt ${v ? 'fakt-sveren' : ''}">
        <span class="fakt-etiket">${_e(x.etiket)}</span>
        <span class="fakt-stoynost">${_e(pokazvana)}</span>
        <span class="fakt-znak">${v
            ? (popravena ? '✓ поправено' : '✓ сверено') : 'чака ✔'}</span>
        ${x.obj.citat ? `<div class="fakt-citat">„${_e(x.obj.citat)}“${
            x.obj.stranica ? ' · стр. ' + _e(x.obj.stranica) : ''}</div>` : ''}
        ${popravena ? `<div class="otkade">четецът беше прочел „${_e(v.prochetena)}“</div>` : ''}
        <div class="fakt-zhestove">
            ${v
                ? `<button class="bt bt-tih" onclick="dosieOtmeni('${k64}')">отмени</button>`
                : `<button class="bt bt-glaven" onclick="dosiePotvardi('${k64}')">✔ вярно е</button>`}
            <button class="bt bt-tih" onclick="dosiePopravi('${k64}')">поправи</button>
        </div>
    </div>`;
}

// Наименованието е особено: то казва КОЙ е документът и влиза в описа. Върне
// ли четецът празно — както при скан на писмо без заглавие — редът му не се
// показва никъде и операторът няма как да го напише. Затова стои ВИНАГИ.
function dosieNaimenovanieHtml(id, fakti, potv) {
    if (fakti.some(x => x.k === 'naimenovanie')) return '';
    const kl = `${id}::naimenovanie`, k64 = encodeURIComponent(kl);
    const v = potv[kl];
    return `
    <div class="fakt ${v ? 'fakt-sveren' : ''}">
        <span class="fakt-etiket">наименование</span>
        <span class="fakt-stoynost ${v ? '' : 'znaem-prazno'}">${
            v ? _e(v.stoynost) : 'четецът не го е извадил'}</span>
        <span class="fakt-znak">${v ? '✓ написано' : 'пише се от теб'}</span>
        <div class="otkade">Това име влиза в описа на акта — затова се пише цяло,
           както е в документа.</div>
        <div class="fakt-zhestove">
            <button class="bt ${v ? 'bt-tih' : 'bt-glaven'}"
                    onclick="dosiePopravi('${k64}')">${v ? 'поправи' : 'напиши го'}</button>
            ${v ? `<button class="bt bt-tih" onclick="dosieOtmeni('${k64}')">отмени</button>` : ''}
        </div>
    </div>`;
}

// ── Жестовете ────────────────────────────────────────────────────────────────
// Сметките са на кухнята (`js/04-vhodni-dokumenti.js`): тя знае къде се пази
// потвърждението и кога документът е сверен докрай. Тук само се вика.

function dosiePotvardi(k64) {
    s2Potvardi(k64);
    dosieSledPotvardzhdenie();
}

function dosiePopravi(k64) {
    s2Popravi(k64);
    dosieSledPotvardzhdenie();
}

function dosieOtmeni(k64) {
    s2Otmeni(k64);
    dosieSledPotvardzhdenie();
}

// Сверен докрай документ влиза в описа САМ — без „Впиши“ и без „Запази“, и с
// наименованието си, не с името на реда от чеклиста.
function dosieSledPotvardzhdenie() {
    const z = dosieZhiv();
    if (z && typeof _dokVpishiSverenite === 'function')
        _dokVpishiSverenite(z.p, z.p, z.s2.dokumenti || [], z.s2.potvardeni || {});
    aktZapishi();
    dosieRisuvai();
}

// ── Видени, но неописани ─────────────────────────────────────────────────────
// Документи, които четецът е срещал, а чеклистът не ги знае. Нищо не влиза
// само: питат се, чак когато се повторят достатъчно пъти.

async function dosieZarediKandidati() {
    if (dosieKandidati) return;
    try {
        await kandZaredi();
        dosieKandidati = kandVsichki();
    } catch (e) {
        dosieKandidati = [];
    }
    dosieRisuvai();
}

function dosieKandidatiHtml() {
    const spisak = dosieKandidati;
    if (!spisak || !spisak.length) return '';
    const pitat = typeof kandZaPitane === 'function' ? kandZaPitane() : [];
    const imeSast = kod => (typeof _SASTAVKI !== 'undefined'
        ? (_SASTAVKI.find(x => x.kod === kod) || {}).ime || kod : kod);
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Видени, но неописани · ${spisak.length}</div>
        <p class="poyasnenie">Документи, които четецът е срещал, а чеклистът не ги знае.
           Нищо не влиза само — питам те чак когато се повтори достатъчно пъти.</p>
        ${spisak.map(e => {
            const pita = pitat.some(x => x.klyuch === e.klyuch);
            return `
            <div class="kandidat ${pita ? 'kandidat-pita' : ''}">
                <div class="kandidat-ime">${_e(e.ime)}
                    <span class="otkade">срещан ${e.broy} ${e.broy === 1 ? 'път' : 'пъти'}</span></div>
                ${(e.sastavki || []).length ? `<div class="otkade">при строежи с: ${
                    _e((e.sastavki || []).map(imeSast).join(' · '))}</div>` : ''}
                ${pita ? `
                    <div class="kandidat-zhestove">
                        <button class="bt" onclick="dosieIzisquay('${_e(e.klyuch)}','начало')">
                            изисквай — за да започна</button>
                        <button class="bt" onclick="dosieIzisquay('${_e(e.klyuch)}','подпис')">
                            изисквай — за да подпиша</button>
                        <button class="bt bt-tih" onclick="dosieNeEZaCheklista('${_e(e.klyuch)}')">
                            не е за чеклиста</button>
                    </div>` : ''}
            </div>`;
        }).join('')}
    </div>`;
}

async function dosieIzisquay(klyuch, etap) {
    if (typeof kandDobavi !== 'function') return;
    await kandDobavi(klyuch, etap);
    dosieKandidati = kandVsichki();
    dosieRisuvai();
}

async function dosieNeEZaCheklista(klyuch) {
    if (typeof kandOtkazhi !== 'function') return;
    await kandOtkazhi(klyuch);
    dosieKandidati = kandVsichki();
    dosieRisuvai();
}
