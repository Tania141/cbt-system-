// АКТ СИСТЕМ · 03-obshti.js
// Общи помощни: избор на обект, екипът, категорията, датите на документите
//
// Екранът „АИ протоколи“ отпадна на 14.10.2026 (операторът: „писано преди
// много време, въобще трябва да отпадне“). Протокол 2 се съставя през
// сървъра, ОД с АИ живее в „Надзор“. Останалото тук го ползват другите
// екрани и затова не е изтрито, а само осиротяло от своя екран.
//
// Отделен от app.js на 13.10.2026 (стъпка 2 от ПОДРЕЖДАНЕ.md).
// Файловете се включват по РЕД и споделят едно и също глобално
// пространство — точно както беше в единия скрипт.

//  AI ПРОТОКОЛИ — Протокол 2 и 2а с верификация
// ═══════════════════════════════════════════════════════════

// ── Избор на обект за генериране ─────────────────────────────────────────────
// Изборът живее там, където е генерирането. Досега текущият обект се задаваше
// от бутон в паспорта; той отпадна (генериране само от „Актове и протоколи“ и
// „AI протоколи“), а „← Смени“ пращаше в Обекти, откъдето нямаше как да се
// избере — оставаше завинаги първият обект.
// Предназначенията — един списък за паспорта и за резюмето на признаците.
// Ключът е този, по който матрицата търси група (PREDNAZNACHENIE_KAM_GRUPA в
// rules/normativna_matrica.py) — нов ред тук иска и ред там.
const PREDNAZNACHENIA = [['жилищна','Жилищна сграда'],['смесена','Смесена — жилища и обслужване'],
    ['административна','Административна, офисна'],['търговска','Търговски обект'],
    ['хотел','Хотел, места за настаняване'],['хранене','Обществено хранене'],
    ['спорт','Спортен, зрелищен обект'],['здравеопазване','Лечебно заведение'],
    ['образование','Детска градина, училище'],['наука','Научен, университетски'],
    ['производствена','Производствена сграда'],['складова','Склад, логистика'],
    ['път','Път, улица'],['мост','Мост, виадукт, тунел'],
    ['енергийна','Електроцентрала, подстанция, мрежа'],['вей','Фотоволтаичен, вятърен парк'],
    ['газ','Газ, топлофикация'],['вик','ВиК мрежи'],
    ['телекомуникации','Телекомуникации'],['подземни','Подземни мрежи'],
    ['култура','Културна ценност'],['оръжия','Оръжия, боеприпаси'],['друго','Друго']];

function izborObektHtml(stranica) {
    const esc = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const tekusht = appData.currentProject?.id;
    if (!appData.projects.length)
        return `<button class="btn btn-primary" onclick="navigateTo('new-passport')">➕ Нов обект</button>`;
    return `<select class="form-select" style="width:auto;max-width:420px"
                onchange="smeniObekt(this.value, '${stranica}')">
        ${tekusht ? '' : '<option value="">— избери обект —</option>'}
        ${appData.projects.map(p => `<option value="${esc(p.id)}" ${p.id === tekusht ? 'selected' : ''}>
            ${p.nik ? esc(p.nik) + ' · ' : ''}ПИ ${esc(p.pi)}</option>`).join('')}
    </select>`;
}

function smeniObekt(id, stranica) {
    appData.currentProject = appData.projects.find(p => String(p.id) === String(id)) || null;
    // Първо екранът, после записът: изборът трябва да се види, дори ако
    // запомнянето му в браузъра не мине.
    ({ ai: renderAiProtocols, osip: renderOsipPage, dokumenti: renderDokumentiPage,
       kakav: renderKakavPage, zk: renderZkGen,
       imot: renderImotPage, sobstvenost: renderSobstvenostPage, proekt: renderProektPage,
       dokumentite: renderDokumentitePage, nadzor: renderNadzorPage }[stranica]
        || renderGenerateSection)();
    saveData();
}

// ── Protokol2Combined: AI-extract → editable fields → generate .docx ──────────

// ── Кой подписва долу: общ чеклист за трите входа към генериране ──────────────
function clientsOf(project) {
    return project?.clients || (project?.client ? [project.client] : []);
}

// ── Смислова проверка на категорията ─────────────────────────────────────────
// Кодът намира дословния текст на цитираната разпоредба, AI-ят преценява дали
// описанието на строежа попада в нея. ДВАТА ТЕКСТА се показват заедно с
// отговора — преценката трябва да може да се провери с поглед, не да ѝ се вярва.
let _aiKategoria = null;

function renderKatRezultat(r) {
    const box = document.getElementById('kat-rezultat');
    if (!box) return;
    if (!r || !r.otgovor) { box.innerHTML = ''; return; }
    const vid = {
        da:      ['var(--green)', '✅', 'Описанието попада в цитираната разпоредба'],
        ne:      ['var(--red)',   '⚠️', 'Описанието НЕ попада в цитираната разпоредба'],
        ne_moga: ['var(--muted)', '⏳', 'Не може да се прецени'],
    }[r.otgovor] || ['var(--muted)', '⏳', ''];
    // Записаната присъда важи за текста, върху който е дадена. Ако цитатът или
    // наименованието са пипани след нея, тя вече не казва нищо за това, което
    // стои на екрана — и трябва да го признае, вместо да мълчи в зелено.
    const segashen = document.getElementById('fp-osip-kategoria')?.value.trim() || '';
    const ostaryala = r.citat && segashen && r.citat !== segashen;
    const kogato = r.proveren_na
        ? new Date(r.proveren_na + 'Z').toLocaleString('bg-BG',
            { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : null;

    box.innerHTML = `
        <div style="border-left:3px solid ${ostaryala ? 'var(--muted)' : vid[0]};padding:10px 12px;background:var(--surface);border-radius:var(--r-sm)">
            <div style="font-weight:700;font-size:13px;margin-bottom:6px">${vid[1]} ${vid[2]}</div>
            <div style="font-size:12px;margin-bottom:8px">${r.obosnovka || ''}</div>
            ${ostaryala ? `<div class="alert alert-warning" style="margin:0 0 8px;font-size:12px">
                ⚠️ Цитатът е променен след тази проверка — присъдата е за предишния текст. Провери пак.
            </div>` : ''}
            ${kogato ? `<div style="font-size:11px;color:var(--muted);margin-bottom:8px">проверено на ${kogato}</div>` : ''}
            ${r.razporedba ? `
            <details style="font-size:12px">
                <summary style="cursor:pointer;color:var(--muted)">Двата текста — провери сама</summary>
                <div style="margin-top:8px">
                    <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">строежът</div>
                    <div style="margin-bottom:8px">${r.opisanie || ''}</div>
                    <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">${r.kade || 'разпоредбата'}</div>
                    <div style="white-space:pre-wrap">${r.razporedba}</div>
                </div>
            </details>` : ''}
        </div>`;
}

async function proveriKategoria() {
    const opisanie = (document.getElementById('fp-stroej')?.value || _zhivObekt()?.stroej || '').trim();
    const citat = document.getElementById('fp-osip-kategoria')?.value.trim() || '';
    if (!opisanie) { showAlert('error', 'Първо въведи наименованието на строежа.'); return; }
    if (!citat)    { showAlert('error', 'Първо въведи цитата за категорията.'); return; }
    if (!appData.apiUrl) { showAlert('error', 'Конфигурирай API URL в Настройки.'); return; }

    const btn = document.getElementById('btn-proveri-kat');
    const staro = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Проверява…';
    try {
        const token = getToken();
        const r = await fetch(`${(appData.apiUrl || '').replace(/\/$/, '')}/api/ai/kategoria-smisyl`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ opisanie, citat })
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
        // „ne_moga“ преди модела идва без otgovor — привежда се към същия вид
        const rez = d.otgovor ? d
            : { otgovor: 'ne_moga', obosnovka: d.obosnovka || '', vid: d.vid };
        renderKatRezultat(rez);
        // Повреда в самия инструмент (липсва наредба, не съвпада отпечатък) не е
        // находка за строежа. Показва се, но НЕ се записва в паспорта — иначе
        // после се отваря месеци по-късно и изглежда като присъда за обекта.
        _aiKategoria = rez.vid === 'sistemna' ? _aiKategoria : rez;
        if (rez.vid === 'sistemna')
            showAlert('error', 'Проверката не можа да се направи — виж Нормативна уредба.');
        if (_aiKategoria.otgovor === 'ne')
            showAlert('error', 'Описанието не съвпада с цитираната разпоредба — провери категорията.');
    } catch (e) {
        showAlert('error', `Проверката не мина: ${e.message}`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = staro;
    }
}

// ── Фаза на обекта: проектна (ОСИП) или строителство ─────────────────────────
// ЕДИН запис, ДВА изгледа. Нарочно не са два паспорта: два записа за един обект
// значат проектантите, възложителите и екипът да живеят на две места — точно
// дефектът, който гоним (Гурмазово: четирима в хедъра, петима в раздел Б).
//
// Общите данни се виждат винаги. Преходът е разрешението за строеж: ОСИП го
// предхожда и е основанието, върху което се издава (чл. 142 ЗУТ).
function setFaza(f) {
    const el = document.getElementById('fp-faza');
    if (el) el.value = f;
    document.querySelectorAll('[data-faza]').forEach(c => {
        c.style.display = (c.dataset.faza === f) ? '' : 'none';
    });
    document.querySelectorAll('.faza-btn').forEach(b => {
        const on = b.dataset.f === f;
        b.className = 'btn btn-sm faza-btn ' + (on ? 'btn-primary' : 'btn-secondary');
    });
    const hint = document.getElementById('faza-hint');
    if (hint) {
        hint.innerHTML = f === 'osip'
            ? 'Преди разрешението за строеж. Показани са данните за оценката на съответствието.'
            : 'След разрешението за строеж. Показани са актовете, заповедната книга и строителят.';
    }
}

function kamStroitelstvo() {
    setFaza('stroitelstvo');
    // РС вече е в „Изходни данни, съгласувания и РС“, не в паспорта.
    showAlert('success', 'Обектът е в строителство. Запази паспорта и въведи разрешението '
        + 'за строеж в „Изходни данни, съгласувания и РС“ — от него тръгват сроковете.');
}

// ── Екип на надзора за конкретния обект ──────────────────────────────────────
// На всеки обект участват различни хора, а не целият заверен списък на фирмата.
// Дотук project.employees се четеше на три места, но нищо не го пълнеше — затова
// всеки документ изброяваше целия екип, включително хора, които не са стъпвали
// на строежа.
//
// Когато няма избор (стар проект), отмятат се ВСИЧКИ: така изходът не се променя
// мълчаливо, но операторът вижда отметките и може да махне ненужните.
function renderTeam(project, consultantId) {
    const box = document.getElementById('fp-team');
    if (!box) return;
    const c = appData.consultants.find(x => x.id == consultantId);
    const all = (c && c.employees) || [];
    if (!all.length) {
        box.innerHTML = '<p style="font-size:12px;color:var(--muted)">Изберете консултант с въведени специалисти.</p>';
        return;
    }
    const chosen = project && Array.isArray(project.employees) ? project.employees : null;
    const isOn = e => !chosen || chosen.some(x => x.name === e.name && x.specialization === e.specialization);
    box.innerHTML = all.map((e, i) => `
        <label style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:13px;cursor:pointer">
            <input type="checkbox" class="team-cb" data-idx="${i}" ${isOn(e) ? 'checked' : ''}
                   style="width:16px;height:16px;flex-shrink:0">
            <span><strong>${[e.title, e.name].filter(Boolean).join(' ')}</strong>
                <span style="color:var(--muted)"> — ${e.specialization || 'без част'}</span></span>
        </label>`).join('') +
        `<p style="font-size:11px;color:var(--muted);margin-top:8px">
            ${all.length} в заверения списък. Неотметнатите няма да се появят в нито един документ.
         </p>`;
}

function readTeam(consultantId) {
    const c = appData.consultants.find(x => x.id == consultantId);
    const all = (c && c.employees) || [];
    const boxes = document.querySelectorAll('#fp-team .team-cb');
    if (!boxes.length) return undefined;          // няма избор — не пипаме нищо
    return [...boxes].filter(b => b.checked).map(b => all[Number(b.dataset.idx)]).filter(Boolean);
}

// ── Регистър на съставените документи ────────────────────────────────────────
// Датата на СЪСТАВЯНЕ — написаната в документа, не датата на генериране.
// Три вида редове:
//   единичен  — документ + дата
//   период    — документ + брой + от/до (идват накуп от строителя)
//   по части  — Акт 12: за всяка част отделен ред с брой и период
const DOC_DATE_ITEMS = [
    { id: 'protokol1',  label: 'Протокол 1 — предаване на проект и РС' },
    { id: 'protokol2',  label: 'Протокол 2 / 2а — заверен от общината', hint: 'котвата: начало на строежа (чл. 157, ал. 1)' },
    { id: 'zk_zaverka', label: 'Заповедна книга — заверка',            hint: '≤ 3 дни след Протокол 2 (чл. 158, ал. 2)' },
    { id: 'obrazec3',   label: 'Констативен акт обр. 3' },
    { id: 'akt5',       label: 'Акт 5 — строителен терен и основен репер' },
    { id: 'akt6',       label: 'Акт 6 — земна основа и коти на изкопа' },
    { id: 'akt7',       label: 'Акт 7 — СМР по нива и елементи', period: true, hint: 'сверява се срещу бетоновия дневник' },
    { id: 'akt8',       label: 'Акт 8 — фундаменти за монтаж' },
    { id: 'akt9',       label: 'Акт 9 — машини и съоръжения' },
    { id: 'akt10',      label: 'Акт 10 — спиране на строителството' },
    { id: 'akt11',      label: 'Акт 11 — продължаване' },
    { id: 'akt12',      label: 'Акт 12 — скрити работи', period: true, byPart: true, hint: 'по части — за всяка отделен ред' },
    { id: 'akt14',      label: 'Акт 14 — приемане на конструкцията',   hint: 'доказва грубия строеж: ≤ 5 г., 10 г. при линеен' },
    { id: 'akt15',      label: 'Акт 15' },
    { id: 'dpk_zapoved', label: 'Заповед за назначаване на ДПК', hint: 'преди нея Акт 16 не се изисква' },
    { id: 'akt16',      label: 'Акт 16 — ДПК', hint: 'един акт може да обхване няколко строежа' },
    { id: 'protokol17', label: 'Протокол 17 — 72-часова проба' },
    { id: 'doklad',     label: 'Окончателен доклад' },
    { id: 'osip',       label: 'ОСИП — комплексен доклад' },
];

function ddItem(id) {
    return DOC_DATE_ITEMS.find(x => x.id === id) || DOC_DATE_ITEMS[0];
}

function docDateRowHtml(docId, chast, data) {
    const it = ddItem(docId);
    data = data || {};
    const opts = DOC_DATE_ITEMS.map(x =>
        `<option value="${x.id}" ${x.id === it.id ? 'selected' : ''}>${x.label}</option>`).join('');
    const partSel = it.byPart
        ? `<select class="form-input dd-chast" style="width:190px">
             ${specializations.map(s => `<option ${s === chast ? 'selected' : ''}>${s}</option>`).join('')}
           </select>` : '';
    const fields = it.period
        ? `<input type="text" class="form-input dd-br" style="width:80px" placeholder="брой" value="${data.br || ''}">
           <span style="font-size:13px;color:var(--muted)">от</span>
           <input type="text" class="form-input dd-ot" style="width:125px" placeholder="дд.мм.гггг" value="${data.ot || ''}" oninput="formatDateInput(this)">
           <span style="font-size:13px;color:var(--muted)">до</span>
           <input type="text" class="form-input dd-do" style="width:125px" placeholder="дд.мм.гггг" value="${data.do || ''}" oninput="formatDateInput(this)">`
        : `<input type="text" class="form-input dd-date" style="width:135px" placeholder="дд.мм.гггг" value="${typeof data === 'string' ? data : ''}" oninput="formatDateInput(this)">`;

    return `<div class="dd-row" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:7px 0;border-bottom:1px solid var(--border-light)">
        <select class="form-input dd-doc" style="flex:1;min-width:250px" onchange="ddDocChanged(this)">${opts}</select>
        ${partSel}${fields}
        <button type="button" class="btn btn-secondary btn-sm" onclick="this.closest('.dd-row').remove()" title="Махни реда">✕</button>
        ${it.hint ? `<div style="flex-basis:100%;font-size:11px;color:var(--muted);padding-left:2px">${it.hint}</div>` : ''}
    </div>`;
}

function ddDocChanged(sel) {
    const row = sel.closest('.dd-row');
    row.outerHTML = docDateRowHtml(sel.value, null, {});
}

function addDocDateRow(docId, chast, data) {
    const box = document.getElementById('fp-dd-rows');
    if (box) box.insertAdjacentHTML('beforeend', docDateRowHtml(docId || 'protokol2', chast, data));
}

// ═══════════════════════════════════════════════════════════