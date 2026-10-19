// АКТ СИСТЕМ · 06-stranici.js
// страниците от новия скелет: имот, проект, документи
//
// Отделен от app.js на 13.10.2026 (стъпка 2 от ПОДРЕЖДАНЕ.md).
// Файловете се включват по РЕД и споделят едно и също глобално
// пространство — точно както беше в единия скрипт.

//  НОВИЯТ СКЕЛЕТ — страниците (02.10.2026)
// ═══════════════════════════════════════════════════════════
// Празните казват честно какво чакат и откъде ще дойде. По-добре от „скоро“.

// Имотът е ВХОДЪТ: тук са всичките строежи, а под всеки — основните му
// документи. Клик върху строеж влиза в неговите проверки. (Операторът, 02.10.2026)
function renderImotPage() {
    const p = _obektIliIzbor('imot-content', 'imot', 'Изберете имота');
    if (!p) return;
    const esc = _s2esc;
    const spisak = _stroezhi(p), tekusht = _indeksStroezh(p);

    const red = (etiket, stoynost, lipsva) => `
        <div style="display:flex;gap:8px;padding:3px 0;font-size:12.5px">
            <span style="color:var(--muted);min-width:132px">${esc(etiket)}</span>
            <span style="${lipsva ? 'color:var(--muted)' : 'font-weight:600'}">${esc(stoynost)}</span>
        </div>`;

    const kartaStroezh = (st, i) => {
        const rs = st.permit || {};
        const zapiski = (st.zapiski?.chasti || []).length;
        const dokumenti = (st.sloy2?.od?.dokumenti || []).length;
        const sveri = Object.values(st.fakti || {}).filter(f => f && (f.sastoyanie === 'potvardeno' || f.sastoyanie === 'popraveno')).length;
        return `
        <div class="card" style="margin:0 0 12px;${i === tekusht ? 'border-color:var(--gold)' : ''}">
            <div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap">
                <div style="flex:1;min-width:260px">
                    <div style="font-size:17px;font-weight:700">${esc(_imeStroezh(st, i))}</div>
                    <div style="margin-top:8px">
                        ${red('Разрешение за строеж', rs.number ? `№ ${rs.number}${rs.date ? ' от ' + rs.date : ''}` : 'няма', !rs.number)}
                        ${red('Категория', st.kategoria ? `${st.kategoria} категория` : 'няма', !st.kategoria)}
                        ${red('Заповедна книга', (st.zk || {}).number || 'няма', !(st.zk || {}).number)}
                        ${red('Надзор', (st.consultant || {}).name || 'няма', !(st.consultant || {}).name)}
                    </div>
                </div>
                <div style="min-width:200px">
                    <div style="font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);margin-bottom:5px">Събрано</div>
                    ${red('Записки по части', zapiski ? `${zapiski}` : 'няма', !zapiski)}
                    ${red('Прочетени документи', dokumenti ? `${dokumenti}` : 'няма', !dokumenti)}
                    ${red('Сверени стойности', sveri ? `${sveri}` : 'няма', !sveri)}
                </div>
            </div>
            <div style="margin-top:12px;display:flex;gap:7px;flex-wrap:wrap">
                <button class="btn btn-primary btn-sm" onclick="vlezVStroezh(${i}, 'kakav')">✔️ Проверки</button>
                <button class="btn btn-secondary btn-sm" onclick="vlezVStroezh(${i}, 'proekt')">📐 Проектът</button>
                <button class="btn btn-secondary btn-sm" onclick="vlezVStroezh(${i}, 'dokumentite')">🗂️ Документите</button>
                <button class="btn btn-ghost btn-sm" onclick="preimenuvajStroezh(${i})">преименувай</button>
            </div>
        </div>`;
    };

    document.getElementById('imot-content').innerHTML = _lentaObekt(p, 'imot') + `
        <div class="card" style="margin-bottom:16px">
            <div class="card-title" style="margin-bottom:10px">🗺️ Имотът</div>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 18px">
                ${red('Идентификатор', p.pi || 'няма', !p.pi)}
                ${red('Ник', p.nik || 'няма', !p.nik)}
                ${red('Адрес', p.address || 'няма', !p.address)}
                ${red('УПИ', (p.gradoustroystvo || {}).upi || '—', true)}
            </div>
            <div style="margin-top:10px">
                <label class="form-label" style="font-size:11.5px">Предишни идентификатори на имота</label>
                <input type="text" id="fp-stari-ident" class="form-input" style="font-size:13px"
                       placeholder="68134.4354.264; 68134.4354.277; 68134.4354.288 — през точка и запетая"
                       value="${esc((p.stari_identifikatori || []).join('; '))}">
                <p style="font-size:11.5px;color:var(--muted);margin-top:4px">
                    Когато няколко имота станат един УПИ, старите документи носят СТАРИТЕ номера.
                    Визата особено. Без тях системата ги мисли за чужд имот.
                </p>
                <button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="zapishiImot()">Запази</button>
            </div>
            <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border-light)">
                <div style="font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);margin-bottom:8px">
                    Режими на имота
                </div>
                <p style="font-size:11.5px;color:var(--muted);margin-bottom:10px">
                    Те са на ЗЕМЯТА, затова важат за всички строежи в нея. От тях зависят
                    оценката по чл. 31 ЗБР, съгласуването с НИНКН и разрешителните за води.
                </p>
                ${[['fp-zashtitena', 'zashtitena', 'Попада в защитена територия или НАТУРА 2000'],
                   ['fp-pametnik', 'pametnik', 'Културна ценност — имотът или в близост'],
                   ['fp-opasni', 'opasni', 'Опасни вещества по глава седма, раздел I от ЗООС'],
                   ['fp-vodi', 'vodi', 'Засяга води, заустване или санитарно-охранителна зона']]
                  .map(([id, klyuch, tekst]) => `
                    <label class="form-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:6px">
                        <input type="checkbox" id="${id}" style="width:16px;height:16px" ${p[klyuch] ? 'checked' : ''}>
                        ${esc(tekst)}
                    </label>`).join('')}
            </div>
            <p style="font-size:11.5px;color:var(--muted);margin:12px 0 0;padding-top:10px;border-top:1px solid var(--border-light)">
                📊 Градоустройствените показатели вече не се пишат тук — четат се от
                <strong>визата</strong> (допустимите) и от <strong>записките</strong> (постигнатите),
                и се сверяват в „Проверки“.
            </p>
            <p style="font-size:11.5px;color:var(--muted);margin:10px 0 0">
                Общо за всички строежи в имота: имотът, собствеността и Акт 16.
            </p>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px">
            <div style="font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--muted)">
                Строежи в имота · ${spisak.length}
            </div>
            <button class="btn btn-secondary btn-sm" onclick="dobaviStroezh()">+ строеж</button>
        </div>
        ${spisak.map(kartaStroezh).join('')}`;
}

// Сверените показатели се връщат в `gradoustroystvo`: оттам ги четат правилото
// G1 на сървъра и шаблонът на ОСИП. Формата отпадна, източникът не бива.
// (02.10.2026)
const _POKAZATEL_KAM_GRAD = {
    zona: 'zona', plosht_upi: 'plosht', pup: 'pup', kadastr: 'kadastr',
    plytnost_dop: 'viza.plytnost', kint_dop: 'viza.kint',
    ozelen_dop: 'viza.ozel', korniz_dop: 'viza.kk',
    zp: 'proekt.zp', rzp: 'proekt.rzp',
    ozelen_post: 'proekt.ozel', korniz_post: 'proekt.kk',
};

// Сверените признаци се връщат в полетата, които ЧЕКЛИСТЪТ чете (`required.py`,
// `cheklist_dokumenti.py`). Формата отпадна, входът на чеклиста не бива.
// (02.10/09.10.2026)
const _VID_KOD = { 'сграда': 'sgrada', 'линеен обект': 'lineen',
                   'линеен обект с ктп': 'lineen_ktp', 'съоръжение': 'saorajenie' };
const _KATEGORIA_KOD = { 'първа': '1', 'втора': '2', 'трета': '3', 'четвърта': '4', 'пета': '5' };

// ПОТВЪРДЕНОТО ТЕЧЕ НАДОЛУ, НО НЕ ТИХО.
// Операторът, 19.10.2026: „защо след като потвърдя кой е възложителят в
// «Проверки», това не се записва в «Обекти» и където другаде се изисква“.
//
// Три случая, същите като при текстовите блокове:
//   · полето е празно → попълва се;
//   · съвпада → нищо;
//   · различава се → НЕ се подменя. Записва се разминаване и операторът
//     избира — иначе въведеното на ръка изчезва, без да се види.
// Разминаването е и най-полезното: разминат ли се, документите си
// противоречат и никой не забелязва.
function _razminavania(st) {
    return (st.razminavania = st.razminavania || {});
}

// Връща true, ако е записал. Пази разминаването, вместо да подменя.
function _techeNadolu(st, pole, nova, kade) {
    if (nova === null || nova === undefined || nova === '') return false;
    const nosach = kade || st;
    const sega = nosach[pole];
    const edno = (a, b) => String(a ?? '').trim().toLowerCase()
                        === String(b ?? '').trim().toLowerCase();
    if (sega === undefined || sega === null || sega === '' || (Array.isArray(sega) && !sega.length)) {
        nosach[pole] = nova;
        delete _razminavania(st)[pole];
        return true;
    }
    if (edno(Array.isArray(sega) ? sega.join('; ') : sega,
             Array.isArray(nova) ? nova.join('; ') : nova)) {
        delete _razminavania(st)[pole];
        return false;
    }
    _razminavania(st)[pole] = { pole, ot_proekt: nova, v_pasporta: sega, koga: new Date().toISOString() };
    return false;
}

function _priznaciKamPoleta(st) {
    const vzemi = k => {
        const f = (st.fakti || {})[k];
        return f && (f.sastoyanie === 'potvardeno' || f.sastoyanie === 'popraveno') ? f.stoynost : null;
    };
    const n = x => String(x || '').trim().toLowerCase();
    let broj = 0;
    const slozhi = (pole, st2) => { if (_techeNadolu(st, pole, st2)) broj++; };

    const vid = vzemi('vid');
    if (vid) slozhi('vid', _VID_KOD[n(vid)] || st.vid);
    const kat = vzemi('kategoria');
    if (kat) slozhi('kategoria', _KATEGORIA_KOD[n(kat)] || (String(kat).match(/[1-5]/) || [])[0] || st.kategoria);
    const pred = vzemi('prednaznachenie');
    if (pred) slozhi('prednaznachenie', pred);
    const povod = vzemi('povod');
    if (povod) slozhi('povod', n(povod).startsWith('ново') ? 'ново' : 'преработка_154');
    for (const [k, pole] of [['imaMashini', 'imaMashini'], ['metalnaKonstrukcia', 'metalnaKonstrukcia']]) {
        const v = vzemi(k);
        if (v !== null) slozhi(pole, n(v) === 'да');
    }
    const spo = vzemi('spo');
    if (spo !== null) slozhi('spo', spo.split(/[;,]/).map(x => x.trim()).filter(Boolean));
    const rspbzn = vzemi('rspbzn');
    if (rspbzn !== null) slozhi('rspbzn', rspbzn);
    return broj;
}

function _pokazateliKamGrad(obekt, st) {
    const g = { ...(obekt.gradoustroystvo || {}) };
    g.viza = { ...(g.viza || {}) };
    g.proekt = { ...(g.proekt || {}) };
    let n = 0;
    for (const [klyuch, pat] of Object.entries(_POKAZATEL_KAM_GRAD)) {
        const f = (st.fakti || {})[klyuch];
        if (!f || (f.sastoyanie !== 'potvardeno' && f.sastoyanie !== 'popraveno')) continue;
        const [a, b] = pat.split('.');
        if (b) g[a][b] = f.stoynost; else g[a] = f.stoynost;
        n++;
    }
    if (n) obekt.gradoustroystvo = g;
    return n;
}

// Останалите полета на паспорта, които признак може да попълни. Таблицата е и
// одитът: признак, който го няма тук, НЯМА къде да отиде — стои само в
// „Проверки“ и се ползва от чеклиста. (19.10.2026)
//
// `kade` казва върху какво се пише: строежът или обектът (имотът).
const _PRIZNAK_KAM_PASPORT = [
    { klyuch: 'obekt',     kade: 'stroezh', pole: 'stroej', ime: 'Наименование на строежа' },
    // Категорията се ДОКАЗВА от разрешението за строеж, не от записката —
    // затова само попълва празно и никога не спори с въведеното.
    { klyuch: 'kategoria', kade: 'osip', pole: 'kategoria', ime: 'Категория (текст за раздел А)',
      samo_prazno: true },
    { klyuch: 'faza',      kade: 'osip', pole: 'faza', ime: 'Фаза на проекта' },
    // Идентификаторът НЕ се подменя: по него се намира обектът и смяната му
    // би разместила всичко. Само се сверява.
    { klyuch: 'identifikator', kade: 'obekt', pole: 'pi', ime: 'Идентификатор по КККР',
      samo_sverka: true },
];

function _priznaciKamPasport(obekt, st) {
    const vzemi = k => {
        const f = (st.fakti || {})[k];
        return f && (f.sastoyanie === 'potvardeno' || f.sastoyanie === 'popraveno')
            ? String(f.stoynost || '').trim() : null;
    };
    let n = 0;
    for (const r of _PRIZNAK_KAM_PASPORT) {
        const v = vzemi(r.klyuch);
        if (!v) continue;
        const nosach = r.kade === 'stroezh' ? st
            : r.kade === 'osip' ? (obekt.osip = obekt.osip || {}) : obekt;
        const sega = String(nosach[r.pole] ?? '').trim();
        if (r.samo_sverka || (r.samo_prazno && sega)) {
            if (sega && sega.toLowerCase() !== v.toLowerCase()) {
                _razminavania(st)[r.pole] = { pole: r.pole, ime: r.ime, kade: r.kade,
                                              ot_proekt: v, v_pasporta: sega, samo_sverka: true };
            } else delete _razminavania(st)[r.pole];
            continue;
        }
        if (_techeNadolu(st, r.pole, v, nosach)) n++;
        const raz = _razminavania(st)[r.pole];
        if (raz) { raz.ime = r.ime; raz.kade = r.kade; }
    }
    return n;
}

// Възложителят е особен: регистърът на собствеността бие всичко. Име от
// проект или от договор е ПОДАТКА — собствеността се доказва с нотариален
// акт. Затова потвърденият „собственик“ влиза в паспорта само когато
// регистърът е празен и в паспорта няма никого. (Операторът, 02.10.2026)
function _vazlozhitelKamPasport(obekt, st) {
    const f = (st.fakti || {}).sobstvenik;
    if (!f || (f.sastoyanie !== 'potvardeno' && f.sastoyanie !== 'popraveno')) return 0;
    const ime = String(f.stoynost || '').trim();
    if (!ime) return 0;
    const otRegistar = (typeof _sbKlienti === 'function' && obekt.sobstvenost)
        ? _sbKlienti(obekt, '') : [];
    if (otRegistar.length) return 0;            // регистърът знае по-добре
    const sega = (obekt.clients || []).filter(c => c && c.name);
    if (!sega.length) {
        obekt.clients = [{ type: /(ООД|ЕООД|АД|ЕАД|СД|КД|ЕТ)(?![А-Яа-я])/.test(ime) ? 'ЮЛ' : 'ФЛ',
                           name: ime, ot_proekt: true }];
        delete _razminavania(st).clients;
        return 1;
    }
    if (!sega.some(c => c.name.trim().toLowerCase() === ime.toLowerCase())) {
        _razminavania(st).clients = { pole: 'clients', ime: 'Възложител', kade: 'obekt',
                                      ot_proekt: ime, v_pasporta: sega.map(c => c.name).join(', '),
                                      samo_sverka: true };
    } else delete _razminavania(st).clients;
    return 0;
}

// Данните на ИМОТА: градоустройството и каквото е общо за всички строежи в него.
// Преместено от „Изходни данни и РС“ на 02.10.2026 — там вече го няма.
function zapishiImot() {
    const p = _zhivObekt();
    if (!p) return;
    const v = id => (document.getElementById(id)?.value || '').trim();
    p.stari_identifikatori = v('fp-stari-ident').split(/[;,]/).map(x => x.trim()).filter(Boolean);
    // Режимите са на ЗЕМЯТА — важат за всички строежи в имота.
    for (const [id, klyuch] of [['fp-zashtitena', 'zashtitena'], ['fp-pametnik', 'pametnik'],
                                ['fp-opasni', 'opasni'], ['fp-vodi', 'vodi']]) {
        const el = document.getElementById(id);
        if (el) p[klyuch] = !!el.checked;
    }
    _zapishiObekt(p, 'Данните за имота са запазени');
}

// Избира строежа и влиза в неговия екран.
// Клик върху обект влиза в ИМОТА — там са строежите му. (Операторът, 02.10.2026)
function otvoriImot(id) {
    const p = appData.projects.find(x => String(x.id) === String(id));
    if (!p) return;
    appData.currentProject = p;
    saveData();
    navigateTo('imot');
}

function vlezVStroezh(i, stranica) {
    const p = _zhivObekt();
    if (!p) return;
    p.tekusht_stroezh = Number(i);
    appData.currentProject = p;
    saveData();
    navigateTo(stranica);
}

function preimenuvajStroezh(i) {
    const p = _zhivObekt();
    if (!p) return;
    const st = _stroezhi(p)[i];
    if (!st) return;
    const novo = prompt('Наименование на строежа:', st.stroej || '');
    if (novo === null) return;
    st.stroej = novo.trim();
    _zapishiObekt(p, `Строежът е преименуван: ${st.stroej || 'без име'}`);
    renderImotPage();
}

// ═══════════════════════════════════════════════════════════