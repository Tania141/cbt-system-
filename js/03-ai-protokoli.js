// АКТ СИСТЕМ · 03-ai-protokoli.js
// Протокол 2 и 2а с верификация от АИ
//
// Отделен от app.js на 13.10.2026 (стъпка 2 от ПОДРЕЖДАНЕ.md).
// Файловете се включват по РЕД и споделят едно и също глобално
// пространство — точно както беше в единия скрипт.

//  AI ПРОТОКОЛИ — Протокол 2 и 2а с верификация
// ═══════════════════════════════════════════════════════════

const AI_PROTOCOL_PROMPTS = {
    'protokol2combined': {
        label: 'Протокол 2 — от PDF (AI)',
        icon: '🤖',
        description: 'AI извлича котите и описанието от PDF → редактираш → генерираш пълен .docx',
        requiredDocs: ['Разрешение за строеж', 'Архитектурна част на проекта (с коти)'],
        optionalDocs: ['ПБЗ', 'Геоложки доклад', 'Стройгенплан'],
        extraFields: [
            { id: 'teh_rukovoditel', label: 'Технически ръководител (три имена)', placeholder: 'инж. Николай Антонов Риманчан' },
            { id: 'geodezist', label: 'Геодезист към СН (три имена)', placeholder: 'инж. Златан Георгиев Златанов' },
            { id: 'slujitel_223', label: 'Служител по чл.223 ал.2 ЗУТ (район/община)', placeholder: 'Столична община – район „Банкя"' },
            { id: 'voda', label: 'Временно водоснабдяване', placeholder: 'водоноска / бутилирана вода' },
            { id: 'kanalizacia', label: 'Временна канализация', placeholder: 'химическа тоалетна' },
            { id: 'el', label: 'Временно ел. захранване', placeholder: 'преносим дизелов агрегат' },
            { id: 'dostap', label: 'Достъп до площадката', placeholder: 'от прилежащата улична мрежа' },
        ],
        buildPrompt: (project, consultant, extra) => buildProtokol2Prompt(project, consultant, extra, 'sgrаda')
    },
    'protokol2a': {
        label: 'Протокол 2а — Линеен обект',
        icon: '⚡',
        description: 'Открив. на площадка + линия и ниво за кабели, ВиК тръби, пътища',
        requiredDocs: ['Разрешение за строеж', 'Ситуационен план (чертеж)', 'Надлъжен профил / трасе'],
        optionalDocs: ['Заповеди за изменение на РС', 'ПБЗ', 'Трасировъчен карнет'],
        extraFields: [
            { id: 'teh_rukovoditel', label: 'Технически ръководител (три имена)', placeholder: 'инж. Иван Цветанов Стоицев' },
            { id: 'geodezist', label: 'Геодезист към СН (три имена)', placeholder: 'инж. Златан Георгиев Златанов' },
            { id: 'proektant_provod', label: 'Проектант на провода/съоръжението', placeholder: 'инж. Надка Кирилова' },
            { id: 'vozlagatel_pred', label: 'Представител на Възложителя на акта', placeholder: 'остава празно ако не е известен', type: 'vozlagatel_select' },
            { id: 'slujitel_223', label: 'Служител по чл.223 ал.2 ЗУТ (район/община)', placeholder: 'остава празно' },
            { id: 'kota_provod', label: 'Кота на провода под настилката', placeholder: 'напр. -1.00 м' },
            { id: 'sledvashti_smr', label: 'Следващи СМР след проверката', placeholder: 'Обратна засипка, сигнална лента, възстановяване на настилка' },
            { id: 'voda', label: 'Временно водоснабдяване', placeholder: 'доставка с водоноски / бутилирана вода' },
            { id: 'kanalizacia', label: 'Временна канализация', placeholder: 'химическа тоалетна' },
            { id: 'el', label: 'Временно ел. захранване', placeholder: 'преносим дизелов агрегат' },
        ],
        buildPrompt: (project, consultant, extra) => buildProtokol2Prompt(project, consultant, extra, 'lineен')
    }
};

function buildProtokol2Prompt(project, consultant, extra, type) {
    const managerShort = shortName(consultant?.manager || '');
    const techShort = shortName(extra.teh_rukovoditel || '');

    const consultantFull = appData && appData.consultants ? appData.consultants.find(c => c.id === project.consultant?.id) : consultant;
    const employees = project.employees || [];
    const projectants = project.projectants || [];
    const employeesList = employees.map(e => `Част ${e.specialization}: ${e.title} ${e.name}`).join('\n') || '—';
    const projectantsList = projectants.map(p => `Част ${p.specialization}: ${p.title} ${p.name}, рег. № ${p.ppp}`).join('\n') || '—';

    return `# РОЛЯ
Ти си опитен строителен надзорник с 20 години практика в България.
Съставяш Протокол образец 2${type === 'lineен' ? 'а' : ''} за ${type === 'lineен' ? 'линеен обект' : 'сграда'} съгласно Наредба №3/31.07.2003 г., чл. 7, ал. 3, т. 2.

# ДАННИ ОТ ПАСПОРТА (вече верифицирани)
Строеж: ${project.stroej || '—'}
Местонахождение: ${project.address || '—'}
Възложител: ${formatVozlagatel(project)}
РС Номер: ${project.permit?.number || '—'}
РС Дата: ${project.permit?.date || '—'}
РС Издател: ${project.permit?.issuer || '—'}
РС В сила от: ${project.permit?.effective || '—'}
Консултант (СН): ${consultantFull?.name || consultant?.name || '—'}, ЕИК ${consultantFull?.eik || '—'}, ${consultantFull?.address || '—'}, Удостоверение ${consultantFull?.cert || '—'}, управител ${consultantFull?.manager || '—'}
Строител: ${project.builder?.company || '—'}, ЕИК ${project.builder?.eik || '—'}, представлявано от ${project.builder?.manager || '—'}
Технически ръководител: ${project.builder?.tech || extra.teh_rukovoditel || '—'}
Геодезист към СН: ${extra.geodezist || '—'}
Служители надзор:\n${employeesList}
Проектанти:\n${projectantsList}
${type === 'lineен' ? 'Проектант на провода: ' + (extra.proektant_provod || '—') : ''}

# ВРЕМЕННО ЗАХРАНВАНЕ
Вода: ${extra.voda || 'водоноска'}
Канализация: ${extra.kanalizacia || 'химическа тоалетна'}
Ел. захранване: ${extra.el || 'преносим дизелов агрегат'}
Достъп: ${extra.dostap || 'от прилежащата улична мрежа'}
${type === 'lineен' ? `Кота на провода: ${extra.kota_provod || '[трябва от проекта]'}
Следващи СМР: ${extra.sledvashti_smr || 'Обратна засипка, сигнална лента, възстановяване на настилка'}` : ''}

# ПРИКАЧЕНИ ДОКУМЕНТИ
Прегледай прикачените документи и:

## СТЪПКА 1 — ВЕРИФИКАЦИЯ
Извлечи от Разрешението за строеж:
- Точно наименование на строежа
- Местонахождение
- Номер и дата на РС
- Орган издател
- Дата на влизане в сила
- Категория на строежа

Извлечи от одобрения проект:
${type === 'lineен' ? `- Кота на провода под настилката
- Нивелетен репер и кота
- Описание на трасето и оборудването (шахти, шкафове, ТП и др.)` : `- Кота изкоп
- Кота цокъл ±0.00 = абсолютна кота в метри
- Кота корниз (стреха)
- Кота било
- Нивелетен репер и кота`}

Покажи ВЕРИФИКАЦИОННА ТАБЛИЦА — сравни данните от паспорта с прочетеното от РС.
При несъответствие — маркирай с ⚠️ и СПРИ. Изчакай потвърждение преди да продължиш.

## СТЪПКА 2 — ГЕНЕРИРАЙ ПРОТОКОЛА
След успешна верификация генерирай пълния протокол по следната структура:

ЗАГЛАВНА ТАБЛИЦА с всички участници

РАЗДЕЛ I — ОТКРИВАНЕ НА СТРОИТЕЛНА ПЛОЩАДКА:
- Участници: А1 (СН управител), А2 (Техн. рък.), Б (Възложител), В (Строител), Г (чл.223)
- т.1 Разрешения и документи — РС № [номер] / [дата], влязло в сила [дата]
- т.2 Изходни точки — вода, канализация, ел. захранване
- т.3 Описание на площадката — ${type === 'lineен' ? 'трасе, оборудване, специфики' : 'архитектурна характеристика, форма, конструкция'}
- Подписи: А1, А2, Б, В, Г

РАЗДЕЛ II — СТРОИТЕЛНА ЛИНИЯ И НИВО:
- Участници: А1, А2, Б, В, Г (геодезист), Д (чл.223)
- Основни репери: нивелетен репер с кота
- Нива по одобрен проект: ${type === 'lineен' ? 'кота провод под настилката' : 'изкоп, ±0.00, корниз, било'}
- Подписи: А1, А2, Б, В, Г, Д

${type === 'lineен' ? `РАЗДЕЛ 1.2 — ПРОВЕРКА ПРИ ДОСТИГНАТО НИВО НА ПРОВОДА:
- Участници: А (СН), Б (проектант провода), В (Строител), Г (геодезист)
- Проектна кота: ${extra.kota_provod || '[от проекта]'} м под настилката
- Заключение: а) ОТГОВАРЯ / б) не отговаря
- Разрешавам: ${extra.sledvashti_smr || 'обратна засипка, сигнална лента, възстановяване на настилка'}` : `РАЗДЕЛ III — ПРОВЕРКИ ПРИ ДОСТИГНАТИ НИВА:
Генерирай отделна подточка за ВСЯКО ниво:
1.1 Проверка при изкоп — А (СН), Б (геолог), В (проектант констр.), Г (строител), Д (геодезист)
1.2 Проверка при цокъл ±0.00 — А (СН), Б (проектанти арх.+констр.), В (геодезист)
1.3 Проверка при корниз — А (СН), Б (проектанти), В (геодезист)
1.4 Проверка при било — А (СН), Б (проектанти), В (геодезист)`}

## ПРАВИЛА ЗА ФОРМАТИРАНЕ:
- Датите остават празни: .............. г.
- Подписите: ..............   *(${managerShort})*
- При ЮЛ Възложител — с ЕИК и представляващи
- При ФЛ Възложител — само три имена
- Управител на СН в подписи: само първо и трето име (${managerShort})
- Техн. ръководител в подписи: само първо и трето име (${techShort})

## ИЗХОД:
1. Верификационна таблица (първа)
2. Пълен текст на протокола готов за Word
3. Бележки за оператора — какво да провери/допълни на ръка`;
}

function formatVozlagatel(project) {
    if (!project) return '—';
    const c = project.client;
    if (!c) return '—';
    if (c.type === 'Физическо лице' || c.type === 'ФЛ') return c.name || '—';
    let parts = [c.name || '—'];
    if (c.eik) parts.push('ЕИК ' + c.eik);
    if (c.address) parts.push(c.address);
    if (c.rep) parts.push('представлявано от ' + c.rep);
    return parts.join(', ');
}

function shortName(fullName) {
    if (!fullName) return '—';
    const parts = fullName.replace(/^(инж\.|арх\.|д-р)\s*/i, '').trim().split(/\s+/);
    if (parts.length >= 3) return parts[0] + ' ' + parts[2];
    return parts[0] || fullName;
}

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

function renderAiProtocols() {
    // Записките се преместиха в „Проектът“ (02.10.2026) — тук вече ги няма.
    renderOdAiKarta();
    const content = document.getElementById('ai-protocols-content');
    const project = appData.currentProject;
    const consultant = project ? appData.consultants.find(c => c.id === project.consultant?.id) : null;

    if (!project) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🤖</div>
                <div class="empty-title">Изберете проект</div>
                <div class="empty-text">Изберете обекта, за който ще се генерира AI протокол</div>
                ${izborObektHtml('ai')}
            </div>`;
        return;
    }

    // Вземаме възложителите от паспорта за dropdown
    const clients = project.clients || (project.client ? [project.client] : []);
    const clientOptions = clients.map((c, i) =>
        `<option value="${i}">${c.name || '—'} (${c.type === 'ЮЛ' ? 'ЮЛ' : 'ФЛ'})</option>`
    ).join('');
    const vozlagatelSelectHTML = clients.length > 0 ? `
        <div class="form-group">
            <label class="form-label">Представител на Възложителя (за подпис)</label>
            <select id="extra-vozlagatel_idx" class="form-select">
                <option value="-1">— не подписва —</option>
                ${clientOptions}
                <option value="custom">Друго лице...</option>
            </select>
            <input type="text" id="extra-vozlagatel_pred" class="form-input" 
                   placeholder="Три имена на представителя" style="margin-top:6px;display:none">
        </div>` : `
        <div class="form-group">
            <label class="form-label">Представител на Възложителя (за подпис)</label>
            <input type="text" id="extra-vozlagatel_pred" class="form-input" 
                   placeholder="Две имена">
        </div>`;

    window._vozlagatelSelectHTML = vozlagatelSelectHTML;
    window._clients = clients;

    const apiKey = appData.anthropicKey || '';

    content.innerHTML = `
        <!-- Проект -->
        <div class="card" style="margin-bottom:16px">
            <div class="card-header">
                <div>
                    <div class="card-title">📋 Активен проект</div>
                    <div class="card-subtitle">ПИ: ${project.pi}${project.stroej ? ' — ' + project.stroej : ''}</div>
                </div>
                ${izborObektHtml('ai')}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
                <div><strong>Консултант:</strong> ${consultant?.name || '—'}</div>
                <div><strong>Строеж:</strong> ${project.stroej || '—'}</div>
                <div><strong>Адрес:</strong> ${project.address || '—'}</div>
                <div><strong>Строител:</strong> ${project.builder?.company || '—'}</div>
            </div>
        </div>

        <!-- API Key -->
        <div class="card" style="margin-bottom:16px">
            <div class="card-header">
                <div class="card-title">🔑 Anthropic API Key</div>
                <div class="card-subtitle">Необходим за AI генерирането — не се записва в облака</div>
            </div>
            <div style="display:flex;gap:10px;align-items:center">
                <input type="password" id="anthropic-key-input" class="form-input" 
                    placeholder="sk-ant-..." value="${apiKey}"
                    oninput="appData.anthropicKey=this.value"
                    style="flex:1;font-family:monospace;font-size:13px">
                <div id="api-key-status" style="font-size:12px;color:var(--muted);white-space:nowrap">
                    ${apiKey ? '✅ Въведен' : '⚠️ Не е въведен'}
                </div>
            </div>
            <p style="font-size:11px;color:var(--muted);margin-top:8px">
                💡 Ключът се пази само в паметта на браузъра — не се изпраща към Railway
            </p>
        </div>

        <!-- Избор на протокол -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:16px">
            ${Object.entries(AI_PROTOCOL_PROMPTS).map(([key, proto]) => `
            <div class="card" style="cursor:pointer;transition:var(--transition)"
                 id="proto-card-${key}"
                 onclick="selectProtocol('${key}')"
                 onmouseenter="this.style.borderColor='var(--gold)'"
                 onmouseleave="this.style.borderColor=selectedProtocol==='${key}'?'var(--gold)':'var(--border)'">
                <div style="font-size:28px;margin-bottom:8px">${proto.icon}</div>
                <div style="font-weight:700;font-size:15px;margin-bottom:4px">${proto.label}</div>
                <div style="font-size:12px;color:var(--muted);margin-bottom:12px">${proto.description}</div>
                <div style="font-size:11px;color:var(--slate)">
                    <strong>Задължителни документи:</strong><br>
                    ${proto.requiredDocs.map(d => `• ${d}`).join('<br>')}
                </div>
            </div>`).join('')}
            <!-- Акт 15 (сграда) — отделен поток -->
            <div class="card" style="cursor:pointer;transition:var(--transition)"
                 id="proto-card-akt15sgrada"
                 onclick="selectAkt15()"
                 onmouseenter="this.style.borderColor='var(--gold)'"
                 onmouseleave="this.style.borderColor=window._akt15Selected?'var(--gold)':'var(--border)'">
                <div style="font-size:28px;margin-bottom:8px">🏢</div>
                <div style="font-weight:700;font-size:15px;margin-bottom:4px">Акт 15 (сграда)</div>
                <div style="font-size:12px;color:var(--muted);margin-bottom:12px">AI генерира пълен Акт 15 от паспорта, таблицата с възложители и PDF документацията</div>
                <div style="font-size:11px;color:var(--slate)">
                    <strong>Препоръчителни документи:</strong><br>
                    • Разрешение за строеж<br>
                    • Одобрен архитектурен проект<br>
                    • Актове и протоколи от строителството
                </div>
            </div>
        </div>

        <!-- Форма за избрания протокол -->
        <div id="protocol-form-section" style="display:none">
            <div class="card" style="margin-bottom:16px">
                <div class="card-title" style="margin-bottom:16px" id="proto-form-title">Допълнителни данни</div>
                <div id="proto-extra-fields"></div>
            </div>

            <!-- Избор на представител на Възложителя -->
        <div class="card" style="margin-bottom:16px">
            <div class="card-header">
                <div class="card-title">👤 Представител на Възложителя за подписване</div>
                <div class="card-subtitle">Кой ще присъства и подписва протокола</div>
            </div>
            <div id="vozlagatel-rep-section"></div>
        </div>

        <!-- Прикачване на документи -->
            <div class="card" style="margin-bottom:16px">
                <div class="card-header">
                    <div class="card-title">📎 Прикачи документи за верификация</div>
                    <div class="card-subtitle">PDF или Word файлове — РС, проект, чертежи</div>
                </div>
                <div id="required-docs-list" style="margin-bottom:12px"></div>
                <div style="border:2px dashed var(--border);border-radius:var(--r-sm);padding:20px;text-align:center;cursor:pointer;transition:var(--transition)"
                     onclick="document.getElementById('doc-file-input').click()"
                     ondragover="event.preventDefault();this.style.borderColor='var(--gold)'"
                     ondragleave="this.style.borderColor='var(--border)'"
                     ondrop="handleDocDrop(event)">
                    <div style="font-size:24px;margin-bottom:8px">📁</div>
                    <div style="font-weight:600;font-size:14px">Кликни или плъзни файлове тук</div>
                    <div style="font-size:12px;color:var(--muted);margin-top:4px">PDF, DOCX, DOC — максимум 10MB на файл</div>
                </div>
                <input type="file" id="doc-file-input" multiple accept=".pdf,.docx,.doc" style="display:none" onchange="handleDocFiles(this.files)">
                <div id="attached-files-list" style="margin-top:12px"></div>
            </div>

            <!-- Бутон за генериране -->
            <div style="display:flex;gap:12px;align-items:center">
                <button class="btn btn-primary" onclick="runAiProtocol()" id="run-ai-btn" style="font-size:15px;padding:12px 28px">
                    🤖 Генерирай с AI верификация
                </button>
                <div id="ai-run-status" style="font-size:13px;color:var(--muted)"></div>
            </div>
        </div>

        <!-- Акт 15 форма -->
        <div id="akt15-form-section" style="display:none">
            <div class="card" style="margin-bottom:16px">
                <div class="card-title" style="margin-bottom:16px">🏢 Акт 15 (сграда) — Данни</div>
                <div class="form-group">
                    <label class="form-label">Таблица с възложители</label>
                    <textarea id="akt15-vozlozhiteli" class="form-input" rows="8"
                        placeholder="Апартамент № | Собственик (три имена, ЕГН/ЕИК) | Нотариален акт (№, том, рег.№, дело №, нотариус, дата) | Пълномощно (ако има — три имена на пълномощника, ЕГН, №/дата на пълномощното)&#10;&#10;Пример:&#10;Ап. №1 | Иван Петров Георгиев, ЕГН 7501011234 | НА №12, том I, рег.№234, дело №56, нот. Мария Иванова, 15.03.2023 | —&#10;Ап. №2 | „Примерна ЕООД", ЕИК 123456789, представлявано от Петър Стоянов | НА №34, том II, рег.№567, дело №89, нот. Георги Петров, 20.04.2023 | Пълн. Стоян Петров Иванов, ЕГН 8002021234, пълн. №78/10.01.2024"
                        style="font-size:13px;resize:vertical"></textarea>
                </div>
            </div>

            <div class="card" style="margin-bottom:16px">
                <div class="card-header">
                    <div class="card-title">📎 Прикачи документи (PDF)</div>
                    <div class="card-subtitle">Разрешение за строеж, одобрен проект, актове и протоколи от строителството</div>
                </div>
                <div style="border:2px dashed var(--border);border-radius:var(--r-sm);padding:20px;text-align:center;cursor:pointer;transition:var(--transition)"
                     onclick="document.getElementById('akt15-file-input').click()"
                     ondragover="event.preventDefault();this.style.borderColor='var(--gold)'"
                     ondragleave="this.style.borderColor='var(--border)'"
                     ondrop="handleAkt15Drop(event)">
                    <div style="font-size:24px;margin-bottom:8px">📁</div>
                    <div style="font-weight:600;font-size:14px">Кликни или плъзни PDF файлове тук</div>
                    <div style="font-size:12px;color:var(--muted);margin-top:4px">PDF — максимум 10MB на файл</div>
                </div>
                <input type="file" id="akt15-file-input" multiple accept=".pdf" style="display:none" onchange="handleAkt15Files(this.files)">
                <div id="akt15-files-list" style="margin-top:12px"></div>
            </div>

            <div style="display:flex;gap:12px;align-items:center">
                <button class="btn btn-primary" onclick="showAkt15Form()" id="run-akt15-btn" style="font-size:15px;padding:12px 28px">
                    🏢 Генерирай Акт 15
                </button>
                <div id="akt15-status" style="font-size:13px;color:var(--muted)"></div>
            </div>
        </div>

        <!-- Акт 15 резултат -->
        <div id="akt15-result-section" style="display:none">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">📄 Акт 15 — генериран текст</div>
                    <div style="display:flex;gap:8px">
                        <button class="btn btn-success btn-sm" onclick="copyAkt15Result()">📥 Копирай текста</button>
                        <button class="btn btn-ghost btn-sm" onclick="clearAkt15()">🗑 Изчисти</button>
                    </div>
                </div>
                <div id="akt15-result-body" style="border:1px solid var(--border);border-radius:var(--r-sm);min-height:200px"></div>
            </div>
        </div>

        <!-- Резултат + Чат -->
        <div id="ai-result-section" style="display:none">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">📄 Резултат от AI</div>
                    <div style="display:flex;gap:8px">
                        <button class="btn btn-secondary btn-sm" onclick="copyAiResult()">📋 Копирай</button>
                        <button class="btn btn-ghost btn-sm" onclick="clearAiSession()">🗑 Изчисти</button>
                    </div>
                </div>
                <!-- История на разговора -->
                <div id="ai-chat-history" style="margin-bottom:16px"></div>
                <!-- Последен резултат -->
                <div id="ai-result-body" style="white-space:pre-wrap;font-family:monospace;font-size:13px;line-height:1.7;background:var(--surface);padding:16px;border-radius:var(--r-sm);max-height:500px;overflow-y:auto;border:1px solid var(--border)"></div>
                <!-- Чат поле -->
                <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:16px">
                    <div style="font-weight:600;font-size:13px;margin-bottom:8px;color:var(--slate)">
                        💬 Отговори на AI или задай допълнителен въпрос:
                    </div>
                    <div style="display:flex;gap:10px;align-items:flex-end">
                        <textarea id="ai-chat-input" class="form-input" rows="3"
                            placeholder="Напр: Датата на РС е 26.04.2024, продължи с генерирането на протокола..."
                            style="flex:1;resize:vertical;font-size:13px"></textarea>
                        <button class="btn btn-primary" onclick="sendChatMessage()" style="white-space:nowrap;padding:10px 20px">
                            ➤ Изпрати
                        </button>
                    </div>
                    <div id="ai-chat-status" style="font-size:12px;color:var(--muted);margin-top:6px"></div>
                </div>
            </div>
        </div>`;

    // State
    // Запазваме сесията между навигациите
    if (!window.aiSession) {
        window.aiSession = {
            selectedProtocol: null,
            attachedDocs: [],
            conversationHistory: [],
            lastResult: null,
            extraFields: {}
        };
    }
    window.selectedProtocol = window.aiSession.selectedProtocol;
    window.attachedDocs = window.aiSession.attachedDocs || [];
}

function selectProtocol(key) {
    window.selectedProtocol = key;
    const proto = AI_PROTOCOL_PROMPTS[key];

    // Highlight selected card
    Object.keys(AI_PROTOCOL_PROMPTS).forEach(k => {
        const card = document.getElementById(`proto-card-${k}`);
        if (card) card.style.borderColor = k === key ? 'var(--gold)' : 'var(--border)';
    });

    // Show form
    const section = document.getElementById('protocol-form-section');
    section.style.display = 'block';
    document.getElementById('proto-form-title').textContent = `${proto.icon} ${proto.label} — Допълнителни данни`;

    // Extra fields — с dropdown за възложител
    const fieldsEl = document.getElementById('proto-extra-fields');
    fieldsEl.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">` +
        proto.extraFields.map(f => {
            if (f.id === 'vozlagatel_pred') {
                return `<div class="form-group">${window._vozlagatelSelectHTML || `<label class="form-label">${f.label}</label><input type="text" id="extra-${f.id}" class="form-input" placeholder="${f.placeholder}">`}</div>`;
            }
            return `<div class="form-group">
                <label class="form-label">${f.label}</label>
                <input type="text" id="extra-${f.id}" class="form-input" placeholder="${f.placeholder}">
            </div>`;
        }).join('') +
        `</div>`;

    // Показваме/скриваме custom поле при промяна на dropdown
    const sel = document.getElementById('extra-vozlagatel_idx');
    if (sel) {
        sel.onchange = function() {
            const customInput = document.getElementById('extra-vozlagatel_pred');
            if (customInput) customInput.style.display = this.value === 'custom' ? 'block' : 'none';
        };
    }

    // Required docs list
    const docsEl = document.getElementById('required-docs-list');
    docsEl.innerHTML = `
        <div style="margin-bottom:8px;font-size:13px;font-weight:600">Задължителни документи:</div>
        ${proto.requiredDocs.map(d => `<div style="font-size:13px;padding:4px 0;color:var(--slate)">⚠️ ${d}</div>`).join('')}

    // Показваме секцията за представител за подписи
        ${proto.optionalDocs.length ? `<div style="margin-top:8px;font-size:13px;font-weight:600">Препоръчителни:</div>
        ${proto.optionalDocs.map(d => `<div style="font-size:13px;padding:4px 0;color:var(--muted)">💡 ${d}</div>`).join('')}` : ''}`;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Рендерираме dropdown за възложителя
    renderVozlagatelSelector(appData.currentProject);
}

function handleDocFiles(files) {
    Array.from(files).forEach(file => {
        if (file.size > 10 * 1024 * 1024) { showAlert('error', `Файлът ${file.name} е над 10MB`); return; }
        window.attachedDocs.push(file);
    });
    renderAttachedFiles();
}

function handleDocDrop(event) {
    event.preventDefault();
    event.currentTarget.style.borderColor = 'var(--border)';
    handleDocFiles(event.dataTransfer.files);
}

function renderAttachedFiles() {
    const el = document.getElementById('attached-files-list');
    if (!window.attachedDocs.length) { el.innerHTML = ''; return; }
    el.innerHTML = window.attachedDocs.map((f, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--surface-2);border-radius:var(--r-sm);margin-bottom:6px">
            <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:18px">${f.name.endsWith('.pdf') ? '📕' : '📘'}</span>
                <div>
                    <div style="font-weight:600;font-size:13px">${f.name}</div>
                    <div style="font-size:11px;color:var(--muted)">${(f.size/1024).toFixed(0)} KB</div>
                </div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="window.attachedDocs.splice(${i},1);renderAttachedFiles()">✕</button>
        </div>`).join('');
}

async function runAiProtocol() {
    if (!window.selectedProtocol) { showAlert('error', 'Избери тип протокол!'); return; }

    // ── Protokol2combined has its own dedicated flow ──
    if (window.selectedProtocol === 'protokol2combined') {
        return runAiProtocolCombined();
    }

    const proto = AI_PROTOCOL_PROMPTS[window.selectedProtocol];
    const project = appData.currentProject;
    const railwayUrl = (appData.apiUrl || '').replace(/\/$/, '');
    if (!railwayUrl) { showAlert('error', 'Railway URL не е въведен в Настройки!'); return; }

    const btn = document.getElementById('run-ai-btn');
    const status = document.getElementById('ai-run-status');
    btn.disabled = true;
    btn.textContent = '⏳ AI верифицира документите...';

    try {
        // Collect extra fields
        const extra = {};
        proto.extraFields.forEach(f => {
            extra[f.id] = document.getElementById('extra-' + f.id)?.value?.trim() || '';
        });

        // PDF файлове като base64
        const pdfFiles = [];
        for (const file of window.attachedDocs) {
            if (file.name.toLowerCase().endsWith('.pdf')) {
                const b64 = await fileToBase64(file);
                pdfFiles.push({ name: file.name, data: b64, media_type: 'application/pdf' });
            }
        }

        // ── СТЪПКА 1: AI верификация чрез /api/ai/chat ──
        status.textContent = 'Claude чете документите...';

        const consultant = appData.consultants.find(c => c.id === project?.consultant?.id);
        const prompt = proto.buildPrompt(project, consultant, extra);

        // Build messages array — PDFs as vision content blocks if present
        let userContent;
        if (pdfFiles.length > 0) {
            userContent = [
                ...pdfFiles.map(f => ({
                    type: 'document',
                    source: { type: 'base64', media_type: f.media_type, data: f.data },
                    title: f.name
                })),
                { type: 'text', text: prompt }
            ];
        } else {
            userContent = prompt;
        }

        const token = getToken();
        const chatResp = await fetch(railwayUrl + '/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: userContent }],
                max_tokens: 4000
            })
        });

        if (!chatResp.ok) {
            const err = await chatResp.json().catch(() => ({ error: 'HTTP ' + chatResp.status }));
            throw new Error(err.error || 'HTTP ' + chatResp.status);
        }

        const chatData = await chatResp.json();
        const verificationText = chatData.result || '';

        // Save state for step 2
        window.aiSession.lastResult = verificationText;
        window.aiSession.conversationHistory.push(
            { role: 'user', content: userContent },
            { role: 'assistant', content: verificationText }
        );
        window.aiSession._pendingExtra = extra;
        window.aiSession._pendingConsultant = consultant;

        // ── Показваме верификационния доклад ──
        document.getElementById('ai-result-section').style.display = 'block';
        document.getElementById('ai-result-body').textContent = verificationText;

        // Инжектираме бутон "Генерирай документ" след доклада
        let genBtn = document.getElementById('ai-generate-doc-btn');
        if (!genBtn) {
            genBtn = document.createElement('div');
            genBtn.id = 'ai-generate-doc-btn';
            genBtn.style.cssText = 'margin-top:16px;padding-top:16px;border-top:2px solid var(--border);display:flex;gap:12px;align-items:center;flex-wrap:wrap';
            document.getElementById('ai-result-body').after(genBtn);
        }
        genBtn.innerHTML =
            '<button class="btn btn-primary" onclick="generateDocFromVerification()" style="font-size:14px;padding:10px 24px">' +
            '📥 Генерирай ' + proto.label + ' (.docx)' +
            '</button>' +
            '<span style="font-size:12px;color:var(--muted)">Прегледай доклада по-горе, след това генерирай документа.</span>';

        renderChatHistory();
        document.getElementById('ai-result-section').scrollIntoView({ behavior: 'smooth' });
        showAlert('info', '✅ AI верификация завършена. Прегледай доклада и генерирай документа.');

    } catch (err) {
        showAlert('error', 'Грешка: ' + err.message);
        status.textContent = '';
    } finally {
        btn.disabled = false;
        btn.textContent = '🤖 Генерирай с AI верификация';
        status.textContent = '';
    }
}

async function generateDocFromVerification() {
    const docType = window.selectedProtocol;
    if (!docType) { showAlert('error', 'Няма избран тип протокол.'); return; }

    const proto = AI_PROTOCOL_PROMPTS[docType];
    const project = appData.currentProject;
    const railwayUrl = (appData.apiUrl || '').replace(/\/$/, '');
    const extra = window.aiSession._pendingExtra || {};
    const consultant = window.aiSession._pendingConsultant ||
        appData.consultants.find(c => c.id === project?.consultant?.id);

    const genBtn = document.getElementById('ai-generate-doc-btn');
    if (genBtn) genBtn.innerHTML = '<span style="font-size:13px;color:var(--muted)">⏳ Генериране на .docx...</span>';

    try {
        const passportRows = buildPassportRows(project, consultant, extra);
        const token = getToken();

        const response = await fetch(railwayUrl + '/api/generate/' + docType, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            },
            body: JSON.stringify({ passport: passportRows, pi: project.pi })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'HTTP ' + response.status }));
            throw new Error(err.error || 'HTTP ' + response.status);
        }

        const blob = await response.blob();
        const filename = docType + '_' + project.pi + '.docx';
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl; a.download = filename; a.click();
        URL.revokeObjectURL(dlUrl);

        if (genBtn) genBtn.innerHTML =
            '<span style="font-size:13px;color:var(--green)">✅ ' + proto.label + ' изтеглен успешно!</span>';

        addToHistory('generate', project.pi, proto.label + ' (AI верифициран + .docx)');
        showAlert('success', proto.label + ' генериран и изтеглен успешно!');

    } catch (err) {
        if (genBtn) {
            const proto2 = AI_PROTOCOL_PROMPTS[docType];
            genBtn.innerHTML =
                '<button class="btn btn-primary" onclick="generateDocFromVerification()" style="font-size:14px;padding:10px 24px">' +
                '📥 Генерирай ' + proto2.label + ' (.docx)' +
                '</button>' +
                '<span style="font-size:12px;color:var(--red)">❌ ' + err.message + '</span>';
        }
        showAlert('error', '❌ Грешка при генериране: ' + err.message);
    }
}

// ── Protokol2Combined: AI-extract → editable fields → generate .docx ──────────

async function runAiProtocolCombined() {
    const project = appData.currentProject;
    const railwayUrl = (appData.apiUrl || '').replace(/\/$/, '');
    if (!project) { showAlert('error', 'Избери активен проект!'); return; }
    if (!railwayUrl) { showAlert('error', 'Railway URL не е въведен в Настройки!'); return; }

    const proto = AI_PROTOCOL_PROMPTS['protokol2combined'];
    const btn = document.getElementById('run-ai-btn');
    const status = document.getElementById('ai-run-status');
    btn.disabled = true;
    btn.textContent = '⏳ AI извлича данни...';
    status.textContent = 'AI извлича данни от документите...';

    try {
        // Collect extra fields
        const extra = {};
        proto.extraFields.forEach(f => {
            extra[f.id] = document.getElementById('extra-' + f.id)?.value?.trim() || '';
        });

        // Encode PDFs
        const pdfFiles = [];
        for (const file of window.attachedDocs) {
            if (file.name.toLowerCase().endsWith('.pdf')) {
                const b64 = await fileToBase64(file);
                pdfFiles.push({ name: file.name, data: b64, media_type: 'application/pdf' });
            }
        }

        const token = getToken();
        const consultant = appData.consultants.find(c => c.id === project?.consultant?.id);

        // Step 1 — call extract endpoint (or skip if no PDFs)
        let extracted = {};
        if (pdfFiles.length > 0) {
            status.textContent = 'Claude чете PDF документите...';
            const extractResp = await fetch(railwayUrl + '/api/ai/extract-protokol2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': 'Bearer ' + token } : {}) },
                body: JSON.stringify({ pi: project.pi, passport: [], files: pdfFiles })
            });
            if (!extractResp.ok) {
                const err = await extractResp.json().catch(() => ({ error: 'HTTP ' + extractResp.status }));
                throw new Error(err.error || 'HTTP ' + extractResp.status);
            }
            const extractData = await extractResp.json();
            extracted = extractData.extracted || {};
        }

        // Save state
        window.aiSession._pendingExtra = extra;
        window.aiSession._pendingConsultant = consultant;
        window.aiSession._extractedCombined = extracted;

        // Step 2 — show editable review form
        showCombinedReviewForm(extracted, extra, project);

    } catch (err) {
        showAlert('error', 'Грешка при AI извличане: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '🤖 Генерирай с AI верификация';
        status.textContent = '';
    }
}

const SASTOYANIE_DEFAULT = 'пътните и тротоарни настилки по прилежащата улица са в добро състояние, съседните имоти няма да бъдат засягани от бъдещото строителство';

function showCombinedReviewForm(extracted, extra, project) {
    const section = document.getElementById('ai-result-section');
    section.style.display = 'block';

    const darv = extracted.Darvesenost;
    const hasDarv = darv && darv !== 'null' && darv !== '' && darv !== null;

    document.getElementById('ai-result-body').innerHTML = `
        <div style="font-weight:700;font-size:15px;margin-bottom:16px;color:var(--ink)">
            📋 Стъпка 2 — Прегледай и коригирай извлечените данни
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
            <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Описание на площадката</label>
                <textarea id="ai-field-opisanie" class="form-input" rows="4" style="resize:vertical">${extracted.Opisanie_Ploshtadka || ''}</textarea>
            </div>
            <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Описание на сградата</label>
                <textarea id="ai-field-opisanie-sgrada" class="form-input" rows="3" style="resize:vertical" placeholder="кратко описание на сградата (незадължително)">${extracted.Opisanie_Sgrada || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Кота изкоп</label>
                <input type="text" id="ai-field-izkop" class="form-input" value="${extracted.Kota_Izkop || ''}" placeholder="напр. -2.50">
            </div>
            <div class="form-group">
                <label class="form-label">Кота цокъл ±0.00</label>
                <input type="text" id="ai-field-cokul" class="form-input" value="${extracted.Kota_Cokul || ''}" placeholder="абс. кота напр. 142.50">
            </div>
            <div class="form-group">
                <label class="form-label">Кота корниз</label>
                <input type="text" id="ai-field-korniz" class="form-input" value="${extracted.Kota_Korniz || ''}" placeholder="напр. +9.80">
            </div>
            <div class="form-group">
                <label class="form-label">Кота било</label>
                <input type="text" id="ai-field-bilo" class="form-input" value="${extracted.Kota_Bilo || ''}" placeholder="напр. +12.40">
            </div>
            <div class="form-group">
                <label class="form-label">Репер номер</label>
                <input type="text" id="ai-field-reper-nomer" class="form-input" value="${extracted.Reper_Nomer || ''}" placeholder="напр. РП-23">
            </div>
            <div class="form-group">
                <label class="form-label">Репер кота (м)</label>
                <input type="text" id="ai-field-reper-kota" class="form-input" value="${extracted.Reper_Kota || ''}" placeholder="напр. 143.750">
            </div>
        </div>

        <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">Дървесност на площадката</label>
            <div style="display:flex;gap:20px;align-items:center;margin-bottom:8px">
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
                    <input type="radio" name="darvesenost-radio" value="няма" id="darv-nyama" ${!hasDarv ? 'checked' : ''} onchange="document.getElementById('darv-textarea-wrap').style.display='none'">
                    НЯМА
                </label>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
                    <input type="radio" name="darvesenost-radio" value="има" id="darv-ima" ${hasDarv ? 'checked' : ''} onchange="document.getElementById('darv-textarea-wrap').style.display='block'">
                    ИМА (опиши):
                </label>
            </div>
            <div id="darv-textarea-wrap" style="display:${hasDarv ? 'block' : 'none'}">
                <textarea id="ai-field-darvesenost" class="form-input" rows="2" placeholder="напр. 3 бр. дървета — ела за изкореняване">${hasDarv ? darv : ''}</textarea>
            </div>
        </div>

        <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">Кой подписва долу?</label>
            <div id="ai-signers"></div>
        </div>

        <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">Околно пространство</label>
            <div style="font-size:12px;color:var(--muted);margin-bottom:6px;padding:8px;background:var(--surface);border-radius:var(--r-sm);border:1px solid var(--border)">
                Стандартен текст: <em>${SASTOYANIE_DEFAULT}</em>
            </div>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin-bottom:8px">
                <input type="checkbox" id="sastoyanie-custom-check" onchange="document.getElementById('sastoyanie-custom-wrap').style.display=this.checked?'block':'none'">
                Има нещо различно — добави/замени текста
            </label>
            <div id="sastoyanie-custom-wrap" style="display:none">
                <textarea id="ai-field-sastoyanie" class="form-input" rows="2" placeholder="Опиши конкретното състояние на околното пространство"></textarea>
            </div>
        </div>`;

    // Inject generate button below the form
    let genBtn = document.getElementById('ai-generate-doc-btn');
    if (!genBtn) {
        genBtn = document.createElement('div');
        genBtn.id = 'ai-generate-doc-btn';
        genBtn.style.cssText = 'margin-top:16px;padding-top:16px;border-top:2px solid var(--border);display:flex;gap:12px;align-items:center;flex-wrap:wrap';
        document.getElementById('ai-result-body').after(genBtn);
    }
    genBtn.innerHTML =
        '<button class="btn btn-primary" onclick="generateDocCombined()" style="font-size:15px;padding:12px 28px">' +
        '📥 Генерирай официален Протокол 2 (.docx)' +
        '</button>' +
        '<span style="font-size:12px;color:var(--muted)">Прегледай и коригирай данните по-горе преди генериране.</span>';

    renderSignersChecklist('ai-signers', appData.currentProject);

    section.scrollIntoView({ behavior: 'smooth' });
    if (pdfFiles && pdfFiles.length === 0) {
        showAlert('info', 'Няма прикачени PDF — попълни полетата ръчно и генерирай.');
    } else {
        showAlert('info', '✅ AI извлече данните. Провери, коригирай ако е нужно, и генерирай.');
    }
}

async function generateDocCombined() {
    const project = appData.currentProject;
    const railwayUrl = (appData.apiUrl || '').replace(/\/$/, '');
    const extra = window.aiSession._pendingExtra || {};
    const consultant = window.aiSession._pendingConsultant ||
        appData.consultants.find(c => c.id === project?.consultant?.id);

    const genBtn = document.getElementById('ai-generate-doc-btn');
    if (genBtn) genBtn.innerHTML = '<span style="font-size:13px;color:var(--muted)">⏳ Генериране на .docx...</span>';

    try {
        // Collect edited field values from the review form
        const opisanie       = document.getElementById('ai-field-opisanie')?.value?.trim() || '';
        const opisanieSgrada = document.getElementById('ai-field-opisanie-sgrada')?.value?.trim() || '';
        const izkop     = document.getElementById('ai-field-izkop')?.value?.trim() || '';
        const cokul     = document.getElementById('ai-field-cokul')?.value?.trim() || '';
        const korniz    = document.getElementById('ai-field-korniz')?.value?.trim() || '';
        const bilo      = document.getElementById('ai-field-bilo')?.value?.trim() || '';
        const reperNom  = document.getElementById('ai-field-reper-nomer')?.value?.trim() || '';
        const reperKota = document.getElementById('ai-field-reper-kota')?.value?.trim() || '';

        const darvRadio = document.querySelector('input[name="darvesenost-radio"]:checked');
        const darvValue = (darvRadio?.value === 'има')
            ? (document.getElementById('ai-field-darvesenost')?.value?.trim() || '')
            : '';

        const sastoyanieCustom = document.getElementById('sastoyanie-custom-check')?.checked;
        const sastoyanieValue = sastoyanieCustom
            ? (document.getElementById('ai-field-sastoyanie')?.value?.trim() || SASTOYANIE_DEFAULT)
            : SASTOYANIE_DEFAULT;

        // Build passport rows and add AI-extracted extras
        const passportRows = buildPassportRows(project, consultant,
            { ...extra, signers: readSigners('ai-signers') });
        passportRows.push(
            ['Opisanie_Ploshtadka', opisanie],
            ['Opisanie_Sgrada',    opisanieSgrada],
            ['Kota_Izkop',   izkop],
            ['Kota_Cokul',   cokul],
            ['Kota_Korniz',  korniz],
            ['Kota_Bilo',    bilo],
            ['Reper_Nomer',  reperNom],
            ['Reper_Kota',   reperKota],
            ['Darvesenost',  darvValue],
            ['Sastoyanie_Okolo', sastoyanieValue],
        );

        const token = getToken();
        const response = await fetch(railwayUrl + '/api/generate/protokol2combined', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            },
            body: JSON.stringify({ passport: passportRows, pi: project.pi })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'HTTP ' + response.status }));
            throw new Error(err.error || 'HTTP ' + response.status);
        }

        const blob = await response.blob();
        const filename = 'protokol2combined_' + project.pi + '.docx';
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl; a.download = filename; a.click();
        URL.revokeObjectURL(dlUrl);

        if (genBtn) genBtn.innerHTML = '<span style="font-size:13px;color:var(--green)">✅ Протокол 2 изтеглен успешно!</span>';
        addToHistory('generate', project.pi, 'Протокол 2 Combined (AI + .docx)');
        showAlert('success', 'Протокол 2 (пълен) генериран и изтеглен успешно!');

    } catch (err) {
        if (genBtn) genBtn.innerHTML =
            '<button class="btn btn-primary" onclick="generateDocCombined()" style="font-size:15px;padding:12px 28px">📥 Генерирай официален Протокол 2 (.docx)</button>' +
            '<span style="font-size:12px;color:var(--red)">❌ ' + err.message + '</span>';
        showAlert('error', '❌ Грешка: ' + err.message);
    }
}

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