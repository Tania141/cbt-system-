// АКТ СИСТЕМ · 11-dokumenti.js
// генериране на документи през сървъра
//
// Отделен от app.js на 13.10.2026 (стъпка 2 от ПОДРЕЖДАНЕ.md).
// Файловете се включват по РЕД и споделят едно и също глобално
// пространство — точно както беше в единия скрипт.

//  ГЕНЕРИРАНЕ
// ═══════════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════════
//  GENERATE DOCUMENTS — via Python REST API (.docx)
// ═══════════════════════════════════════════════════════════
const DOC_CONFIG = [
    // ── По време на строителството ──────────────────────────
    { id: 'protokol1',    label: 'Протокол 1 (предаване на проект и РС)', apiType: 'protokol1', group: 'construction' },
    // Генерира се само от регистъра (операторът, 11.09.2026) — затова тук
    // няма отметка. Описанието остава, за да се чете историята.
    { id: 'zapovedna',    label: 'Заповедна книга',            apiType: 'zapovedna',    group: 'construction', drugade: 'zk' },
    { id: 'protokol2',    label: 'Протокол 2',                 apiType: 'protokol2combined', group: 'construction' },
    { id: 'protokol2a',   label: 'Протокол 2а (линейни)',      apiType: 'protokol2a',   group: 'construction' },
    { id: 'obrazec3',     label: 'Образец 3',                  apiType: 'obrazec3',     group: 'construction' },
    { id: 'akt5',         label: 'Акт 5 (репери и нива)',      apiType: 'akt5',         group: 'construction' },
    { id: 'akt6',         label: 'Акт 6 (земна основа)',       apiType: 'akt6',         group: 'construction' },
    { id: 'akt7',         label: 'Акт 7',                      apiType: 'akt7',         group: 'construction' },
    { id: 'akt8',         label: 'Акт 8 (армировка)',          apiType: 'akt8',         group: 'construction' },
    { id: 'akt9',         label: 'Акт 9 (машини и съоръжения)', apiType: 'akt9',       group: 'construction' },
    { id: 'akt10',        label: 'Акт 10 (спиране)',           apiType: 'akt10',        group: 'construction' },
    { id: 'akt11',        label: 'Акт 11 (продължаване)',      apiType: 'akt11',        group: 'construction' },
    { id: 'akt12',        label: 'Акт 12 (скрити работи)',     apiType: 'akt12',        group: 'construction' },
    { id: 'akt14',        label: 'Акт 14',                     apiType: 'akt14',        group: 'construction' },
    // ── Въвеждане в експлоатация ────────────────────────────
    { id: 'akt15',        label: 'Акт 15',                     apiType: 'akt15',        group: 'completion'   },
    { id: 'doklad',       label: 'Окончателен доклад',         apiType: 'doklad',       group: 'completion'   },
    // Генерира се само от „Оценка на съответствието“ (операторът, 11.09.2026).
    { id: 'osip',         label: 'ОСИП (комплексен доклад)',   apiType: 'osip',         group: 'start',        drugade: 'osip' },
    { id: 'protokol17',   label: 'Протокол 17 (72-часова проба)', apiType: 'protokol17', group: 'completion'   },
    { id: 'akt16',        label: 'Акт 16 (ДПК)',               apiType: 'akt16',        group: 'completion'   },
];

// Търсенето на консултант е с `==`, не с `===`, на ВСИЧКИТЕ места.
//
// Номерът му се ражда като число (`Date.now()`), но мине ли паспортът през
// сървъра като JSON, се връща като текст. Седем места в кода отдавна търсеха
// с `==`; пет бяха изключение и се чупеха мълчаливо — цялата секция
// „Съставяне на актове и протоколи“ изчезваше зад „⚠️ Консултантът не е
// намерен“, при положение че консултантът си беше в списъка и беше избран.
//
// Излезе наяве на 23.10.2026, когато новото ПВА почна да записва
// `currentProject` направо в браузъра — без изглаждането, което `loadData`
// прави на обектите, дошли от сървъра. (Операторът: „това е консултанта не е“.)
function _renderGenerateSectionOsnova() {
    const content = document.getElementById('generate-content');

    if (!appData.currentProject) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <div class="empty-title">Изберете проект</div>
                <div class="empty-text">Изберете обекта, за който ще се генерират актове и протоколи</div>
                ${izborObektHtml('nadzor')}
            </div>`;
        return;
    }

    const project = appData.currentProject;
    const consultant = appData.consultants.find(c => c.id == project.consultant?.id);
    if (!consultant) { content.innerHTML = `<div class="alert alert-error">⚠️ Консултантът не е намерен!</div>`; return; }

    const docs = project.generatedDocs || [];
    const hasApi = !!appData.apiUrl;

    content.innerHTML = `
        <!-- Проект -->
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">📋 Активен проект</div>
                    <div class="card-subtitle">ПИ: ${project.pi}${project.stroej ? ' — ' + project.stroej : ''}</div>
                </div>
                <div style="display:flex;gap:8px">
                    ${izborObektHtml('nadzor')}
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;margin-bottom:12px">
                <div><strong>Консултант:</strong> ${consultant.name}</div>
                <div><strong>Строеж:</strong> ${project.stroej || '—'}</div>
                <div><strong>Адрес:</strong> ${project.address || '—'}</div>
                <div><strong>Строител:</strong> ${project.builder?.company || '—'}</div>
            </div>
            ${!hasApi ? `
                <div class="alert alert-error" style="margin-bottom:0">
                    ❌ Python API не е конфигуриран! 
                    <button class="btn btn-secondary btn-sm" onclick="navigateTo('settings')" style="margin-left:8px">⚙️ Настройки</button>
                </div>` : `
                <div class="alert alert-success" style="margin-bottom:0">
                    ✅ Python API: <strong>${appData.apiUrl}</strong>
                </div>`}
        </div>

        <!-- Заповедната книга на обекта — само за сведение: актовете я цитират.
             Самата книга се генерира от регистъра. Червената лампа остава тук,
             защото предупреждава за актовете, не за книгата. -->
        <div class="card">
            <div class="card-title" style="margin-bottom:8px">📕 Заповедна книга на обекта</div>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-size:13px">
                ${(project?.zk||{}).number
                    ? `<span>№ <strong>${project.zk.number}</strong>${project.zk.date ? ' / ' + project.zk.date : ''}</span>`
                    : '<span style="color:var(--muted)">Още няма — генерира се от регистъра.</span>'}
                <button class="btn btn-secondary btn-sm" onclick="navigateTo('zk')">📓 Регистър</button>
            </div>
            <!-- Свети червено, ако книгата е заменена, анулирана или има бележка -->
            <div id="zk-preduprezhdenie"></div>
        </div>


        <!-- Части за Акт 12 -->
        <div class="card">
            <div class="card-title" style="margin-bottom:8px">🧱 Акт 12 — по кои части?</div>
            <p style="font-size:12px;color:var(--muted);margin-bottom:12px">
                Актът за скрити работи се съставя по видове работи, по части. Отбележи частите —
                за всяка излиза отделен документ със своя проектант и свой СН.
                Показват се само частите, за които има вписано лице.
            </p>
            <div id="gen-akt12-parts"></div>
        </div>

        <!-- Кой подписва долу -->
        <div class="card">
            <div class="card-title" style="margin-bottom:12px">✍️ Кой подписва долу?</div>
            <div id="gen-signers"></div>
        </div>

        <!-- СЪСТАВЕНИ ДОКУМЕНТИ — датите, на които се позовават следващите актове -->
        <div class="card">
            <div class="card-title" style="margin-bottom:8px">📅 Съставени документи</div>
            <p style="font-size:12px;color:var(--muted);margin-bottom:12px">
                Датата, <strong>написана в документа</strong> — не датата на генериране. Вписва се,
                когато документът се върне подписан или заверен. Добавяй само каквото е съставено;
                липсващият ред не е грешка.
            </p>
            <div id="fp-dd-rows"></div>
            <button type="button" class="btn btn-secondary btn-sm" style="margin-top:10px"
                    onclick="addDocDateRow()">+ Добави документ</button>
        </div>
        <div style="margin:-8px 0 16px">
            <button class="btn btn-success btn-sm" onclick="zapishiDatiDokumenti()">💾 Запази датите</button>
        </div>

        <!-- Избор на документи -->
        <div class="card">
            <div class="card-header">
                <div class="card-title">📄 Документи за генериране (.docx)</div>
                <div style="font-size:12px;color:var(--muted)">Ще се свалят като .docx файлове</div>
            </div>
            <div id="doc-results-list">
                <!-- Група 0: Преди строителството — ОСИП се генерира от своята страница -->
                <div style="font-size:13px;color:var(--muted);margin-bottom:12px">
                    📐 ОСИП се генерира от
                    <a href="#" onclick="navigateTo('osip');return false" style="color:var(--blue)">Оценка на съответствието →</a>
                </div>

                <!-- Група 1: По време на строителството -->
                <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;padding:8px 0 4px">
                    По време на строителството
                </div>
                ${DOC_CONFIG.filter(d => d.group === 'construction' && !d.drugade).map(doc => {
                    const existing = docs.filter(d => d.type === doc.label);
                    const last = existing[existing.length - 1];
                    return `
                    <div class="doc-gen-row" id="row-${doc.id}" style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-light)">
                        <div style="display:flex;align-items:center;gap:12px">
                            <input type="checkbox" id="doc-${doc.id}" style="width:16px;height:16px;accent-color:var(--gold)">
                            <div>
                                <div style="font-weight:700;font-size:14px">${doc.label}</div>
                                ${last ? `<div style="font-size:11px;color:var(--green)">✅ Последно: ${formatDateTime(last.date)}${last.url ? ` · <a href="${last.url}" target="_blank" style="color:var(--blue)">⬇ Свали</a>` : ''}</div>`
                                       : `<div style="font-size:11px;color:var(--muted)">Не е генериран</div>`}
                            </div>
                        </div>
                        <div id="status-${doc.id}" style="min-width:120px;text-align:right"></div>
                    </div>`;
                }).join('')}

                <!-- Група 2: Въвеждане в експлоатация -->
                <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;padding:16px 0 4px">
                    Въвеждане в експлоатация
                </div>
                ${DOC_CONFIG.filter(d => d.group === 'completion' && !d.drugade).map(doc => {
                    const existing = docs.filter(d => d.type === doc.label);
                    const last = existing[existing.length - 1];
                    return `
                    <div class="doc-gen-row" id="row-${doc.id}" style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-light)">
                        <div style="display:flex;align-items:center;gap:12px">
                            <input type="checkbox" id="doc-${doc.id}" style="width:16px;height:16px;accent-color:var(--gold)">
                            <div>
                                <div style="font-weight:700;font-size:14px">${doc.label}</div>
                                ${last ? `<div style="font-size:11px;color:var(--green)">✅ Последно: ${formatDateTime(last.date)}${last.url ? ` · <a href="${last.url}" target="_blank" style="color:var(--blue)">⬇ Свали</a>` : ''}</div>`
                                       : `<div style="font-size:11px;color:var(--muted)">Не е генериран</div>`}
                            </div>
                        </div>
                        <div id="status-${doc.id}" style="min-width:120px;text-align:right"></div>
                    </div>`;
                }).join('')}
            </div>
        </div>

        <!-- Генерирай бутон -->
        <button class="btn btn-success btn-lg" id="generate-btn"
                onclick="generateDocumentsViaApi()"
                style="width:100%;margin-bottom:24px"
                ${!hasApi ? 'disabled title="Конфигурирайте API URL в Настройки"' : ''}>
            🚀 Генерирай .docx чрез Python API
        </button>

        <!-- AI документи -->
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;padding:8px 0 12px">
            AI генерирани документи
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-bottom:40px">
          <div class="doc-card" id="card-akt15-sgrada">
            <div class="doc-card-icon">🏛️</div>
            <div class="doc-card-title">Акт 15 (сграда)</div>
            <div class="doc-card-desc">Констативен акт за установяване годността за приемане на строежа</div>
            <button class="btn btn-primary" style="margin-top:4px" onclick="showAkt15Form()">Генерирай</button>
          </div>
          <div class="doc-card" id="card-protokol2-sgrada">
            <div class="doc-card-icon">📐</div>
            <div class="doc-card-title">Протокол 2 — ръчно въвеждане</div>
            <div class="doc-card-desc">Протокол за определяне на строителна линия и ниво и за заверяване на нивата на строежа</div>
            <button class="btn btn-primary" style="margin-top:4px" onclick="showProtokol2Form()">Генерирай</button>
          </div>
        </div>
    `;

    renderSignersChecklist('gen-signers', appData.currentProject);
    renderAkt12Parts('gen-akt12-parts', appData.currentProject,
                     appData.consultants.find(c => c.id == appData.currentProject?.consultant?.id));
    // Регистърът има думата: заменена или анулирана книга значи, че номерът
    // в паспорта вече не е верният за документите, които се съставят сега.
    proveriZK((project?.zk || {}).number);
}

async function generateDocumentsViaApi() {
    if (!appData.apiUrl) {
        showAlert('error', 'Моля конфигурирайте API URL в Настройки!');
        return;
    }

    const project = appData.currentProject;
    const consultant = appData.consultants.find(c => c.id == project.consultant?.id);
    if (!project || !consultant) return;

    const btn = document.getElementById('generate-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Генериране...';

    // Събери паспортните данни
    const passportRows = buildPassportRows(project, consultant, { signers: readSigners('gen-signers') });

    // Допълнителни параметри
    // Празно означава „ползвай паспорта“ — не се подменя с подразбираща се стойност.

    const selected = DOC_CONFIG.filter(doc => document.getElementById(`doc-${doc.id}`)?.checked);
    if (selected.length === 0) {
        showAlert('error', 'Изберете поне един документ!');
        btn.disabled = false;
        btn.innerHTML = '🚀 Генерирай .docx чрез Python API';
        return;
    }


    const results = [];
    const today = new Date().toISOString();

    // Акт 12 се съставя по части — една задача за всяка отметната част.
    const akt12Parts = readAkt12Parts('gen-akt12-parts');
    const jobs = [];
    for (const doc of selected) {
        if (doc.apiType === 'akt12') {
            if (!akt12Parts.length) {
                showAlert('error', 'Акт 12: отбележи поне една част.');
                btn.disabled = false;
                btn.innerHTML = '🚀 Генерирай .docx чрез Python API';
                return;
            }
            akt12Parts.forEach(p => jobs.push({ doc, akt12: p }));
        } else {
            jobs.push({ doc });
        }
    }

    const akt12Done = [];

    for (const job of jobs) {
        const doc = job.doc;
        const statusEl = document.getElementById(`status-${doc.id}`);
        const tag = job.akt12 ? ` ${job.akt12.chast}` : '';
        if (statusEl) statusEl.innerHTML = `<span class="badge badge-gray">⏳ Изпращане${tag}...</span>`;

        try {
            const body = {
                passport: passportRows,
                pi: project.pi,
            };
            if (job.akt12) {
                body.chast = job.akt12.chast;
                body.akt12_number = job.akt12.number;
            }

            const apiUrl = (appData.apiUrl || '').replace(/\/$/, '');
            const token = getToken();
            const r = await fetch(`${apiUrl}/api/generate/${doc.apiType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: JSON.stringify(body)
            });
            if (!r.ok) {
                const err = await r.json().catch(() => ({ error: r.statusText }));
                throw new Error(err.error || `HTTP ${r.status}`);
            }
            const blob = await r.blob();
            const filename = job.akt12
                ? `akt12_${job.akt12.number}_${project.pi}.docx`
                : `${doc.apiType}_${project.pi}.docx`;
            const dlUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = dlUrl; a.download = filename; a.click();
            URL.revokeObjectURL(dlUrl);

            if (statusEl) statusEl.innerHTML = `<span class="badge badge-green">✅ Изтеглен${tag}</span>`;
            if (job.akt12) akt12Done.push(job.akt12);

            results.push({
                type: job.akt12 ? `${doc.label} (${job.akt12.number})` : doc.label,
                date: today,
                url: '',
                path: ''
            });

        } catch(e) {
            if (statusEl) statusEl.innerHTML = `<span class="badge" style="background:var(--red-light);color:var(--red)">❌ ${e.message.slice(0,30)}</span>`;
            showAlert('error', `❌ ${doc.label}: ${e.message}`);
        }
    }

    // Запази резултатите в паспорта
    if (results.length > 0) {
        const idx = appData.projects.findIndex(p => p.id === project.id);
        if (idx >= 0) {
            // Броячите на Акт 12 — за да предложи следващия свободен номер по част.
            if (akt12Done.length) {
                if (!appData.projects[idx].akt12) appData.projects[idx].akt12 = {};
                akt12Done.forEach(({ chast, number }) => {
                    const n = parseInt(String(number).split('-').pop(), 10);
                    const cur = appData.projects[idx].akt12[chast] || 0;
                    if (!isNaN(n) && n > cur) appData.projects[idx].akt12[chast] = n;
                });
            }
            if (!appData.projects[idx].generatedDocs) appData.projects[idx].generatedDocs = [];
            results.forEach(nd => {
                const existing = appData.projects[idx].generatedDocs.findIndex(d => d.type === nd.type);
                if (existing >= 0) appData.projects[idx].generatedDocs[existing] = nd;
                else appData.projects[idx].generatedDocs.push(nd);
            });
            appData.currentProject = appData.projects[idx];
        }
        addHistory('generate', project.pi, `Генерирани .docx: ${results.map(d=>d.type).join(', ')}`);
        saveData();
        showAlert('success', `✅ ${results.length} документа са генерирани.`);
    }

    btn.disabled = false;
    btn.innerHTML = '🚀 Генерирай .docx чрез Python API';
}

// ═══════════════════════════════════════════════════════════