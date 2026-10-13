// АКТ СИСТЕМ · 10-obekti.js
// списъкът с обекти, паспортът, обект=имот · строеж=РС
//
// Отделен от app.js на 13.10.2026 (стъпка 2 от ПОДРЕЖДАНЕ.md).
// Файловете се включват по РЕД и споделят едно и също глобално
// пространство — точно както беше в единия скрипт.

//  DASHBOARD
// ═══════════════════════════════════════════════════════════

function historyActionLabel(h) {
    const icons = {create:'🆕', edit:'✏️', export:'📊', generate:'📄', delete:'🗑️', migrate:'🔄'};
    const labels = {create:'Нов паспорт', edit:'Редакция', export:'Excel експорт', generate:'Генериране', delete:'Изтриване', migrate:'Миграция'};
    return `${icons[h.type]||'•'} ${labels[h.type]||h.type}${h.pi ? ` — ПИ: ${h.pi}` : ''}`;
}

// ═══════════════════════════════════════════════════════════
//  PASSPORTS LIST + SEARCH + FILTER
// ═══════════════════════════════════════════════════════════
function populateFilterDropdowns() {
    const consultantSelect = document.getElementById('filter-consultant');
    const currentVal = consultantSelect.value;
    consultantSelect.innerHTML = '<option value="">Всички консултанти</option>';
    appData.consultants.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        if (c.id == currentVal) opt.selected = true;
        consultantSelect.appendChild(opt);
    });
}

function filterPassports() {
    const search = (document.getElementById('search-pi')?.value || '').toLowerCase();
    const consultantFilter = document.getElementById('filter-consultant')?.value || '';
    const statusFilter = document.getElementById('filter-status')?.value || '';

    let filtered = appData.projects;

    if (search) {
        // Търси се и по ник, и по име на КОЙТО И ДА Е строеж в имота: „ХХХХХ“
        // показва всичките му строежи, „канал“ — само него. (02.10.2026)
        filtered = filtered.filter(p =>
            p.pi?.toLowerCase().includes(search) ||
            p.nik?.toLowerCase().includes(search) ||
            p.address?.toLowerCase().includes(search) ||
            p.client?.name?.toLowerCase().includes(search) ||
            _stroezhi(p).some(st => (st.stroej || '').toLowerCase().includes(search))
        );
    }

    if (consultantFilter) {
        filtered = filtered.filter(p => p.consultant?.id == consultantFilter);
    }

    if (statusFilter === 'with-docs') {
        filtered = filtered.filter(p => p.generatedDocs?.length > 0);
    }

    // Sort by newest first
    filtered = [...filtered].sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));

    renderPassportsList(filtered);
}

// Списъкът е по СТРОЕЖИ, не по имоти. Операторът, 02.10.2026: „ако търся да
// работя по Строеж — Канал от имот ХХХХХ, не е ли редно, когато напиша ХХХХХ, да
// ми се покажат колкото строежа има в този имот“. Тя не мисли „отвори имот, после
// избери строеж“ — мисли „работя по канала“. Клик → право в строежа.
function renderPassportsList(projects) {
    const container = document.getElementById('passports-list');
    if (!container) return;

    if (projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <div class="empty-title">Няма намерени строежи</div>
                <div class="empty-text">Опитайте с различни филтри или добавете нов обект</div>
                <button class="btn btn-primary" onclick="navigateTo('new-passport')">➕ Нов обект</button>
            </div>`;
        return;
    }

    const esc = _s2esc;
    // Търсене по ПИ, ник или адрес → всички строежи в имота.
    // Търсене по име на строеж → само той. (Операторът, 02.10.2026)
    const tarsene = (document.getElementById('search-pi')?.value || '').trim().toLowerCase();
    const imotatSavpada = p => !tarsene || [p.pi, p.nik, p.address, p.client?.name]
        .some(x => (x || '').toLowerCase().includes(tarsene));

    container.innerHTML = projects.map(p => {
        const vsichki = _stroezhi(p);
        const mnogo = vsichki.length > 1;
        const poImot = imotatSavpada(p);
        const spisak = vsichki
            .map((st, i) => ({ st, i }))
            .filter(({ st }) => poImot || (st.stroej || '').toLowerCase().includes(tarsene));
        return spisak.map(({ st, i }) => {
            const aktiven = appData.currentProject?.id === p.id && _indeksStroezh(p) === i;
            const docs = st.generatedDocs || [];
            const rs = st.permit || {};
            return `
        <div class="passport-card ${aktiven ? 'selected' : ''}" onclick="otvoriStroezh('${esc(p.id)}', ${i})">
            <div>
                <div class="passport-pi-label">${p.nik ? esc(p.nik) : 'ПИ'}</div>
                <div class="passport-pi">${esc(p.pi || '—')}</div>
                ${mnogo ? `<div style="font-size:10.5px;color:var(--muted);margin-top:3px">строеж ${i + 1} от ${vsichki.length}</div>` : ''}
            </div>
            <div class="passport-meta">
                <div class="passport-name">${esc(_imeStroezh(st, i))}</div>
                <div class="passport-details">
                    ${esc(p.address || '')}
                    ${st.kategoria ? ` · ${esc(st.kategoria)} категория` : ''}
                    ${rs.number ? ` · РС № ${esc(rs.number)}` : ''}
                    ${st.consultant?.name ? ' · ' + esc(st.consultant.name) : ''}
                </div>
                <div class="passport-docs">
                    ${docs.map(d => `<span class="badge badge-blue">${esc(d.type)}</span>`).join('')}
                </div>
            </div>
            <div class="passport-actions">
                <span style="font-size:12px;color:var(--muted)">${formatDate(p.date)}</span>
                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();otvoriImot('${esc(p.id)}')"
                        title="Имотът — общото за всички строежи в него">🗺️</button>
                ${i === 0 ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();editPassport('${esc(p.id)}')">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deletePassport('${esc(p.id)}')">🗑️</button>` : ''}
            </div>
        </div>`;
        }).join('');
    }).join('');
}

// Клик върху строеж → право в проверките му, без междинна спирка.
function otvoriStroezh(id, i) {
    const p = appData.projects.find(x => String(x.id) === String(id));
    if (!p) return;
    p.tekusht_stroezh = Number(i);
    appData.currentProject = p;
    saveData();
    navigateTo('kakav');
}

function updateNavBadge() {
    const badge = document.getElementById('nav-passports-count');
    if (badge) badge.textContent = appData.projects.length;
}

// ═══════════════════════════════════════════════════════════
//  PASSPORT MODAL
// ═══════════════════════════════════════════════════════════
// Модалът с преглед на паспорта е махнат (02.10.2026): клик върху обект влиза
// в „Имотът“, а редактирането и триенето са си на картата.


function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

// ═══════════════════════════════════════════════════════════
//  PASSPORT FORM (new + edit)
// ═══════════════════════════════════════════════════════════
let editingProjectId = null;
let tempProjectants = [];
let tempClients = [];

function renderPassportForm(projectId) {
    editingProjectId = projectId;
    const isEdit = projectId !== null;
    const project = isEdit ? appData.projects.find(p => p.id === projectId) : null;

    document.getElementById('form-page-title').textContent = isEdit ? `Редакция: ПИ ${project?.pi}` : 'Нов обект';
    document.getElementById('form-page-subtitle').textContent = isEdit ? 'Актуализирайте данните за проекта' : 'Въведете данните за новия проект';

    if (appData.consultants.length === 0) {
        document.getElementById('new-passport-content').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏢</div>
                <div class="empty-title">Няма консултанти</div>
                <div class="empty-text">Добавете поне един консултант преди да създадете паспорт</div>
                <button class="btn btn-primary" onclick="navigateTo('consultants')">⚙️ Управление на консултанти</button>
            </div>
        `;
        return;
    }

    tempProjectants = project?.projectants ? JSON.parse(JSON.stringify(project.projectants)) : [];
    // Инициализираме tempClients - от project.clients или от legacy project.client
    if (project?.clients && project.clients.length > 0) {
        tempClients = JSON.parse(JSON.stringify(project.clients));
    } else if (project?.client) {
        tempClients = [JSON.parse(JSON.stringify(project.client))];
    } else {
        tempClients = [{ type: 'ФЛ', name: '' }];
    }

    const p = project || {};
    const permit = p.permit || {};
    const client = p.client || {};
    const builder = p.builder || {};

    // Фазата се извежда от наличието на разрешение за строеж, ако не е избирана.
    // ОСИП предхожда РС — той е основанието, върху което РС се издава.
    const faza = p.faza || (permit.number ? 'stroitelstvo' : 'osip');

    document.getElementById('new-passport-content').innerHTML = `
        <!-- ФАЗА -->
        <div class="card" style="padding:12px 16px">
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                <span style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Фаза</span>
                <div style="display:flex;gap:6px">
                    <button type="button" class="btn btn-sm faza-btn" data-f="osip"
                            onclick="setFaza('osip')">📐 Проектна (ОСИП)</button>
                    <button type="button" class="btn btn-sm faza-btn" data-f="stroitelstvo"
                            onclick="setFaza('stroitelstvo')">🏗️ Строителство</button>
                </div>
                <span id="faza-hint" style="font-size:12px;color:var(--muted);flex:1"></span>
            </div>
            <input type="hidden" id="fp-faza" value="${faza}">
        </div>

        <!-- BASIC INFO -->
        <div class="card">
            <div class="card-title" style="margin-bottom:16px">📋 Основна информация</div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label required">ПИ Номер</label>
                    <input type="text" id="fp-pi" class="form-input" placeholder="00000.000.0000" value="${p.pi||''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Дата</label>
                    <input type="text" id="fp-date" class="form-input" placeholder="дд.мм.гггг" value="${p.date||''}" oninput="formatDateInput(this)">
                </div>
                <div class="form-group form-grid-full">
                    <label class="form-label">Строеж</label>
                    <input type="text" id="fp-stroej" class="form-input" placeholder="Жилищна сграда с ..." value="${p.stroej||''}">
                </div>
                <div class="form-group form-grid-full">
                    <label class="form-label">Адрес / Местонахождение</label>
                    <input type="text" id="fp-address" class="form-input" placeholder="гр. София, ул. ... №..." value="${p.address||''}">
                </div>
                <div class="form-group">
                    <label class="form-label required">Консултант</label>
                    <select id="fp-consultant" class="form-select"
                            onchange="renderTeam(null, this.value)">
                        <option value="">— Изберете —</option>
                        ${appData.consultants.map((c, i) => `<option value="${c.id}" ${(p.consultant?.id==c.id || (!p.consultant?.id && i===0))?'selected':''}>${c.name}</option>`).join('')}
                    </select>
                </div>
            </div>
        </div>

        <!-- ЕКИП НА НАДЗОРА ЗА ТОЗИ ОБЕКТ -->
        <div class="card">
            <div class="card-title" style="margin-bottom:8px">👷 Екип на надзора за този обект</div>
            <p style="font-size:12px;color:var(--muted);margin-bottom:12px">
                На всеки обект участват различни хора, а не целият заверен списък.
                Отметни само тези, които наистина работят по този строеж — те влизат в
                документите и в подписните таблици.
            </p>
            <div id="fp-team"></div>
        </div>

        <!-- ПРЕХОД КЪМ СТРОИТЕЛСТВО -->
        <div class="card" data-faza="osip" style="border-left:3px solid var(--gold)">
            <div class="card-title" style="margin-bottom:8px">➡️ Проектът е одобрен и има разрешение за строеж</div>
            <p style="font-size:12px;color:var(--muted);margin-bottom:12px">
                Обектът минава в строителство. <strong>Нищо не се въвежда наново</strong> —
                строежът, възложителите, проектантите и екипът остават същите.
                Добавя се разрешението за строеж, а с него започват сроковете:
                Протокол 2 в тригодишния срок от влизането му в сила.
            </p>
            <button type="button" class="btn btn-primary" onclick="kamStroitelstvo()">
                🏗️ Премини към строителство
            </button>
        </div>

        <!-- ОЦЕНКАТА И ДОКУМЕНТИТЕ — НА СВОИТЕ СТРАНИЦИ -->
        <div class="card" data-faza="osip">
            <div class="card-title" style="margin-bottom:8px">📐 Оценка и изходни данни</div>
            <p style="font-size:12px;color:var(--muted);margin-bottom:12px">
                Водят се на своите страници, за да не натежава паспортът.
            </p>
            ${isEdit ? `<div style="display:flex;gap:8px;flex-wrap:wrap">
                <button type="button" class="btn btn-secondary btn-sm" onclick="kamStranica('${project.id}','osip')">📐 Оценка на съответствието →</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="kamStranica('${project.id}','dokumentite')">📎 Изходни данни, съгласувания и РС →</button>
            </div>` : `<p style="font-size:12px;color:var(--muted);margin:0">Първо запази паспорта — после изходните данни и оценката се водят за него.</p>`}
        </div>

        <!-- ВЪЗЛОЖИТЕЛИ -->
        <div class="card">
            <div class="card-header" style="margin-bottom:16px">
                <div class="card-title">👤 Възложители</div>
                <button class="btn btn-secondary btn-sm" onclick="addClientRow()">➕ Добави възложител</button>
            </div>
            <div id="clients-container">
                ${tempClients.map((cl,ci) => clientRowHTML(cl,ci)).join('')}
            </div>
            <p style="font-size:11px;color:var(--muted);margin-top:8px">
                За ФЛ: само две имена. За ЮЛ: фирма, ЕИК, адрес, управител.
            </p>
            <div style="margin-top:14px">
                <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px">УПЪЛНОМОЩЕН ПРЕДСТАВИТЕЛ (по избор)</div>
                <input type="text" id="fp-upalnomoshten" class="form-input"
                       placeholder="остави празно = всички възложители подписват"
                       value="${p.upalnomoshten_predstavitel||''}">
                <p style="font-size:11px;color:var(--muted);margin-top:4px">Ако е попълнено — само това лице ще фигурира в реда за подписи на Б. Възложителя.</p>
            </div>
        </div>

        <!-- СТРОИТЕЛ -->
        <div class="card" data-faza="stroitelstvo">
            <div class="card-title" style="margin-bottom:16px">🏗️ Строител</div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Фирма</label>
                    <input type="text" id="fp-builder-company" class="form-input" placeholder="Строителна фирма ООД" value="${builder.company||''}">
                </div>
                <div class="form-group">
                    <label class="form-label">ЕИК</label>
                    <input type="text" id="fp-builder-eik" class="form-input" value="${builder.eik||''}">
                </div>
                <div class="form-group form-grid-full">
                    <label class="form-label">Адрес</label>
                    <input type="text" id="fp-builder-address" class="form-input" value="${builder.address||''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Управител</label>
                    <div style="display:flex;gap:8px">
                        <input type="text" id="fp-builder-manager-title" class="form-input" list="titles-list"
                               placeholder="титла" style="flex:0 0 90px" value="${builder.managerTitle||''}">
                        <input type="text" id="fp-builder-manager" class="form-input" placeholder="Иван Петров Иванов" style="flex:1" value="${builder.manager||''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Технически ръководител</label>
                    <div style="display:flex;gap:8px">
                        <input type="text" id="fp-builder-tech-title" class="form-input" list="titles-list"
                               placeholder="титла" style="flex:0 0 90px" value="${builder.techTitle||''}">
                        <input type="text" id="fp-builder-tech" class="form-input" placeholder="Петър Петров Петров" style="flex:1" value="${builder.tech||''}">
                    </div>
                </div>
            </div>
        </div>

        <!-- ПРОЕКТАНТИ -->
        <div class="card">
            <div class="card-header">
                <div class="card-title">📐 Проектанти</div>
                <button class="btn btn-secondary btn-sm" onclick="addProjectantRow()">➕ Добави</button>
            </div>
            <div id="projectants-container">
                ${tempProjectants.map((pp, i) => projectantRowHTML(pp, i)).join('')}
            </div>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:40px">
            <button class="btn btn-success btn-lg" onclick="savePassport()">
                💾 ${isEdit ? 'Запази промените' : 'Запази паспорт'}
            </button>
            <button class="btn btn-secondary" onclick="navigateTo('passports')">Отказ</button>
        </div>
    `;

    // Рисуват се след вмъкването на формата — съдържанието им е динамично.
    renderTeam(p, document.getElementById('fp-consultant')?.value);
    setFaza(faza);
}

function clientRowHTML(cl, i) {
    const isYL = (cl && cl.type === 'ЮЛ');
    return `
    <div class="dynamic-row" id="client-row-${i}" style="border:1px solid var(--border-light);border-radius:var(--r-sm);padding:14px;margin-bottom:10px;background:var(--surface)">
        <div style="display:flex;gap:10px;margin-bottom:8px;align-items:center">
            <div style="background:var(--gold);color:var(--ink);font-weight:700;font-size:12px;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i+1}</div>
            <select class="form-select" style="flex:0 0 150px" onchange="updateClient(${i},'type',this.value);rerenderClientRow(${i})">
                <option value="ФЛ" ${!isYL?'selected':''}>Физическо лице</option>
                <option value="ЮЛ" ${isYL?'selected':''}>Юридическо лице</option>
            </select>
            ${!isYL ? `
            <input type="text" class="form-input" list="titles-list" placeholder="титла" data-field="nameTitle"
                   value="${(cl&&cl.nameTitle)||''}" onchange="updateClient(${i},'nameTitle',this.value)" style="flex:0 0 90px">
            <input type="text" class="form-input" placeholder="Две имена (напр. Иван Иванов)" data-field="name"
                   value="${(cl&&cl.name)||''}" onchange="updateClient(${i},'name',this.value)" style="flex:1">
            ` : `
            <input type="text" class="form-input" placeholder="Фирма ООД" data-field="name"
                   value="${(cl&&cl.name)||''}" onchange="updateClient(${i},'name',this.value)" style="flex:2">
            <input type="text" class="form-input" placeholder="ЕИК" data-field="eik"
                   value="${(cl&&cl.eik)||''}" onchange="updateClient(${i},'eik',this.value)" style="flex:0 0 110px">
            `}
            <button class="btn btn-danger btn-sm" onclick="removeClientRow(${i})" ${i===0?'style="display:none"':''}>✕</button>
        </div>
        ${isYL ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px">
            <div>
                <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px">УПРАВИТЕЛ</div>
                <div style="display:flex;gap:8px">
                    <input type="text" class="form-input" list="titles-list" placeholder="титла" data-field="repTitle"
                           value="${(cl&&cl.repTitle)||''}" onchange="updateClient(${i},'repTitle',this.value)" style="flex:0 0 80px">
                    <input type="text" class="form-input" placeholder="Иван Петров" data-field="rep"
                           value="${(cl&&cl.rep)||''}" onchange="updateClient(${i},'rep',this.value)" style="flex:1">
                </div>
            </div>
            <div>
                <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px">АДРЕС</div>
                <input type="text" class="form-input" placeholder="гр. София, ул. ..." data-field="address"
                       value="${(cl&&cl.address)||''}" onchange="updateClient(${i},'address',this.value)">
            </div>
        </div>` : ''}
        <div style="margin-top:8px">
            <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px">ПОДПИСВА (три имена)</div>
            <div style="display:flex;gap:8px">
                <input type="text" class="form-input" list="titles-list" placeholder="титла" data-field="podpisvaTitle"
                       value="${(cl&&cl.podpisvaTitle)||''}" onchange="updateClient(${i},'podpisvaTitle',this.value)" style="flex:0 0 80px">
                <input type="text" class="form-input" placeholder="………" data-field="podpisva"
                       value="${(cl&&cl.podpisva)||''}" onchange="updateClient(${i},'podpisva',this.value)" style="flex:1">
            </div>
        </div>
    </div>`;
}

function updateClient(i, field, val) {
    if (!window.tempClients) window.tempClients = [{}];
    while (window.tempClients.length <= i) window.tempClients.push({ type: 'ФЛ', name: '' });
    window.tempClients[i][field] = val;
}

function rerenderClientRow(i) {
    const el = document.getElementById('client-row-' + i);
    if (el && window.tempClients && window.tempClients[i]) {
        el.outerHTML = clientRowHTML(window.tempClients[i], i);
    }
}

function addClientRow() {
    if (!window.tempClients) window.tempClients = [{}];
    window.tempClients.push({ type: 'ФЛ', name: '' });
    const container = document.getElementById('clients-container');
    if (container) {
        const i = window.tempClients.length - 1;
        container.insertAdjacentHTML('beforeend', clientRowHTML(window.tempClients[i], i));
    }
}

function removeClientRow(i) {
    if (!window.tempClients || window.tempClients.length <= 1) return;
    window.tempClients.splice(i, 1);
    const container = document.getElementById('clients-container');
    if (container) container.innerHTML = window.tempClients.map((cl,ci) => clientRowHTML(cl,ci)).join('');
}

function projectantRowHTML(pp, i) {
    const hasCompany = pp.company || pp.companyEik || pp.companyManager || pp.companyAddress;
    return `
    <div class="dynamic-row" id="proj-row-${i}" style="flex-direction:column;align-items:stretch;border:1px solid var(--border-light);border-radius:var(--r-sm);padding:14px;margin-bottom:10px;background:var(--surface)">
        <div style="display:flex;gap:10px;margin-bottom:8px;align-items:center">
            <div style="background:var(--gold);color:var(--ink);font-weight:700;font-size:12px;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i+1}</div>
            <input type="text" class="form-input" list="titles-list" placeholder="титла" style="flex:0 0 90px" data-field="title"
                   value="${pp.title===undefined?'инж.':pp.title}" onchange="updateProjectant(${i},'title',this.value)">
            <div style="flex:3;position:relative">
                <input type="text" class="form-input kiip-search-input" placeholder="Три имена или ППП № (търси в КИИП)" 
                       value="${pp.name||''}" 
                       oninput="kiipSearch(${i}, this.value)"
                       onchange="updateProjectant(${i},'name',this.value)" 
                       style="width:100%">
                <div id="kiip-dropdown-${i}" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--gold);border-radius:var(--r-sm);z-index:999;max-height:200px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,0.2)"></div>
            </div>
            <input type="text" class="form-input" placeholder="ППП №" 
                   id="ppp-input-${i}"
                   value="${pp.ppp||''}" onchange="updateProjectant(${i},'ppp',this.value)" style="flex:1;min-width:80px">
            <select class="form-select" onchange="updateProjectant(${i},'specialization',this.value)" style="flex:2">
                ${specializations.map(s=>`<option value="${s}" ${pp.specialization===s?'selected':''}>${s}</option>`).join('')}
            </select>
            <button class="btn btn-danger btn-sm" onclick="removeProjectantRow(${i})">✕</button>
        </div>
        <div style="margin-top:4px">
            <button type="button" onclick="toggleCompany(${i})" 
                    style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:2px 0">
                ${hasCompany ? '▼ Фирма (попълнена)' : '▶ + Добави фирма (по желание)'}
            </button>
        </div>
        <div id="company-${i}" style="display:${hasCompany ? 'grid' : 'none'};grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
            <div>
                <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Проектантска фирма</div>
                <input type="text" class="form-input" placeholder="Архитектурно бюро ООД" 
                       value="${pp.company||''}" onchange="updateProjectant(${i},'company',this.value)">
            </div>
            <div>
                <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">ЕИК на фирмата</div>
                <input type="text" class="form-input" placeholder="123456789" 
                       value="${pp.companyEik||''}" onchange="updateProjectant(${i},'companyEik',this.value)">
            </div>
            <div>
                <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Управител на фирмата</div>
                <input type="text" class="form-input" placeholder="инж. Иван Петров" 
                       value="${pp.companyManager||''}" onchange="updateProjectant(${i},'companyManager',this.value)">
            </div>
            <div>
                <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Адрес на фирмата</div>
                <input type="text" class="form-input" placeholder="гр. София, ул. ..." 
                       value="${pp.companyAddress||''}" onchange="updateProjectant(${i},'companyAddress',this.value)">
            </div>
        </div>
    </div>`;
}

function toggleCompany(i) {
    const el = document.getElementById('company-' + i);
    const btn = el.previousElementSibling.querySelector('button');
    if (el.style.display === 'none') {
        el.style.display = 'grid';
        btn.textContent = '▼ Скрий фирма';
    } else {
        el.style.display = 'none';
        btn.textContent = '▶ + Добави фирма (по желание)';
    }
}

function addProjectantRow() {
    const newPP = { id: Date.now(), name: '', ppp: '', specialization: 'Архитектура', title: 'инж.', company: '', companyEik: '', companyManager: '', companyAddress: '' };
    tempProjectants.push(newPP);
    const container = document.getElementById('projectants-container');
    const div = document.createElement('div');
    div.innerHTML = projectantRowHTML(newPP, tempProjectants.length - 1);
    container.appendChild(div.firstElementChild);
}

function removeProjectantRow(i) {
    tempProjectants.splice(i, 1);
    const container = document.getElementById('projectants-container');
    container.innerHTML = tempProjectants.map((pp, idx) => projectantRowHTML(pp, idx)).join('');
}

function updateProjectant(i, field, value) {
    if (tempProjectants[i]) tempProjectants[i][field] = value;
}

function savePassport() {
    const pi = document.getElementById('fp-pi').value.trim();
    const consultantId = document.getElementById('fp-consultant').value;

    if (!pi) { showAlert('error', 'Моля, въведете ПИ номер!'); return; }
    if (!consultantId) { showAlert('error', 'Моля, изберете консултант!'); return; }

    // Sync projectants from DOM
    document.querySelectorAll('[id^="proj-row-"]').forEach((row, i) => {
        const titleEl = row.querySelector('input[data-field="title"]');
        const inputs = [...row.querySelectorAll('input')].filter(el => el !== titleEl);
        const selects = row.querySelectorAll('select');
        if (tempProjectants[i]) {
            if (inputs[0]) tempProjectants[i].name = inputs[0].value.trim();
            if (inputs[1]) tempProjectants[i].ppp = inputs[1].value.trim();
            if (titleEl) tempProjectants[i].title = titleEl.value.trim();
            if (selects[0]) tempProjectants[i].specialization = selects[0].value;
        }
    });

    // Sync clients from DOM — четем всички input полета от client rows
    document.querySelectorAll('[id^="client-row-"]').forEach((row, i) => {
        if (!tempClients[i]) tempClients[i] = {};
        const select = row.querySelector('select');
        if (select) tempClients[i].type = select.value;
        const isYL = tempClients[i].type === 'ЮЛ';
        // Четем по data-field, не по позиция — иначе добавено поле разминава всичко
        const val = f => {
            const el = row.querySelector(`input[data-field="${f}"]`);
            return el ? el.value.trim() : '';
        };
        tempClients[i].name          = val('name');
        tempClients[i].nameTitle     = isYL ? '' : val('nameTitle');
        tempClients[i].eik           = isYL ? val('eik')     : '';
        tempClients[i].rep           = isYL ? val('rep')     : '';
        tempClients[i].repTitle      = isYL ? val('repTitle'): '';
        tempClients[i].address       = isYL ? val('address') : '';
        tempClients[i].podpisva      = val('podpisva');
        tempClients[i].podpisvaTitle = val('podpisvaTitle');
    });

    const consultant = appData.consultants.find(c => c.id == consultantId);

    const projectData = {
        pi,
        date: document.getElementById('fp-date').value,
        stroej: document.getElementById('fp-stroej').value,
        address: document.getElementById('fp-address').value,
        consultant: { id: consultant.id, name: consultant.name },
        employees: readTeam(consultantId),
        faza: document.getElementById('fp-faza')?.value || 'osip',
        client: tempClients[0] || { type: 'ФЛ', name: '' },
        clients: tempClients.filter(c => c.name),
        upalnomoshten_predstavitel: document.getElementById('fp-upalnomoshten')?.value.trim() || '',
        builder: {
            company: document.getElementById('fp-builder-company').value,
            eik: document.getElementById('fp-builder-eik').value,
            address: document.getElementById('fp-builder-address').value,
            manager: document.getElementById('fp-builder-manager').value,
            managerTitle: document.getElementById('fp-builder-manager-title')?.value.trim() || '',
            tech: document.getElementById('fp-builder-tech').value,
            techTitle: document.getElementById('fp-builder-tech-title')?.value.trim() || ''
        },
        projectants: tempProjectants.filter(pp => pp.name || pp.ppp)
    };

    if (editingProjectId !== null) {
        // Edit existing
        const idx = appData.projects.findIndex(p => p.id === editingProjectId);
        if (idx >= 0) {
            const oldProject = appData.projects[idx];
            appData.projects[idx] = {
                ...oldProject,
                ...projectData,
                updatedAt: new Date().toISOString(),
            };
            addHistory('edit', pi, `Редактирани данни за паспорт ПИ ${pi}`);
            showAlert('success', '✅ Паспортът е актуализиран!');
        }
    } else {
        // New project
        const newProject = {
            id: Date.now(),
            ...projectData,
            generatedDocs: [],
            createdAt: new Date().toISOString()
        };
        appData.projects.push(newProject);
        appData.currentProject = newProject;
        addHistory('create', pi, `Създаден нов паспорт за "${projectData.stroej}"`);
        showAlert('success', '✅ Паспортът е създаден успешно!');
    }

    saveData();
    updateNavBadge();
    navigateTo('passports');

    // Async sync to API — does not block navigation
    const piForSync = projectData.pi;
    // Към сървъра — СЛЕТИЯТ обект, не само полетата от формата: save_passport
    // подменя паспорта изцяло, а оценката и документите вече се пишат от
    // своите страници — без това всяко запазване на паспорта би ги изтривало.
    // Без `id`: при зареждане сървърът го връща като ПИ и строгите сравнения
    // в „Редактирай“/„Изтрий“ разчитат на това.
    const slyat = appData.projects.find(p => p.pi === piForSync) || projectData;
    const { id: _bezId, ...zaSarvara } = slyat;
    const payloadForSync = { passport: zaSarvara, pi: piForSync };
    if (appData.apiUrl) {
        apiCall(`/api/passports/${piForSync}`, 'POST', payloadForSync)
            .then(r => {
                showAlert('success', `☁️ Паспорт ПИ-${piForSync} запазен в базата данни.`
                    + (r && r.zk_vpisana
                       ? ` Заповедна книга № ${r.zk_vpisana} е вписана в регистъра.` : ''));
                // Номер, който регистърът не прие, не бива да мълчи.
                if (r && r.zk_greshka) showAlert('error', `📓 ${r.zk_greshka}`);
            })
            .catch(e => showAlert('error', `⚠️ Локално запазен, но API грешка: ${e.message}`));
    }
}

// Бутонът НЕ генерира на място: отваря „Актове и протоколи“ с избран този
// обект. Генерирането остава там, където стоят подробностите за всеки образец.
// Предишният бутон объркваше точно защото изглеждаше, че документът се прави
// от паспорта.
// Преки пътища от паспорта към страница за този обект. Не генерират и не пишат
// нищо на място — само избират обекта и отварят страницата.
function kamStranica(id, stranica) {
    const project = appData.projects.find(p => String(p.id) === String(id));
    if (!project) return;
    appData.currentProject = project;
    navigateTo(stranica);
    saveData();
}

// ── Страниците „Оценка на съответствието“ и „Изходни документи“ ─────────────
// Всяка пише САМО своята част от обекта и праща към сървъра целия обект:
// save_passport подменя паспорта изцяло, така че част от него би изтрила
// останалото. По същата причина паспортът вече не пише тези две части.

// currentProject е снимка (при зареждане от браузъра — копие); работи се
// върху живия запис в appData.projects.
// ═══════════════════════════════════════════════════════════
//  ОБЕКТ = ИМОТ · СТРОЕЖ = ЕДНО РАЗРЕШЕНИЕ ЗА СТРОЕЖ
//  Стъпка 1 от преустройството (02.10.2026)
// ═══════════════════════════════════════════════════════════
// Операторът: „КТП и улица и пр. всеки е отделен обект с отделно РС, но понякога
// съм надзор на такъв сложен проект с 3 или 4 РС“ — и „за него се пише 1 акт 16“.
// Тоест един имот може да носи няколко строежа.
//
// БЕЗ ДУБЛИРАНЕ: строеж №1 живее В САМИЯ ОБЕКТ — полетата му са там от самото
// начало и десетки места в кода ги четат оттам. Няма смисъл да ги местя и да
// държа две копия. Следващите строежи живеят в `p.stroezhi_dop[]`, а помощникът
// по-долу скрива разликата: и за двата се работи еднакво.
//
// Какво е на ИМОТА (и затова НЕ се копира в строежа): pi, ник, адрес, УПИ,
// скица, градоустройство, собствеността, и Акт 16 — един за всички строежи.

// Полетата, които принадлежат на СТРОЕЖА, не на имота.
const _STROEZH_POLETA = [
    'stroej', 'kategoria', 'vid', 'permit', 'zk', 'consultant',
    'prednaznachenie', 'povod', 'imaMashini', 'metalnaKonstrukcia', 'spo',
    'zapiski', 'fakti', 'sloy2', 'docDates', 'generatedDocs', 'neotnasya',
    'tehnichesko_opisanie',
];

function _stroezhi(p) {
    if (!p) return [];
    // Първият е самият обект; останалите — допълнителните.
    return [p, ...(p.stroezhi_dop || [])];
}

function _brojStroezhi(p) {
    return 1 + (p?.stroezhi_dop || []).length;
}

// Кой строеж се работи в момента. Индекс 0 = първият (самият обект).
function _indeksStroezh(p) {
    const i = Number(p?.tekusht_stroezh || 0);
    return i >= 0 && i < _brojStroezhi(p) ? i : 0;
}

// Връща ОБЕКТА, върху който да се пише — за строеж №1 това е самият обект.
function _stroezh(p) {
    return _stroezhi(p)[_indeksStroezh(p)] || p;
}

function _imeStroezh(s, i) {
    return (s && s.stroej) || (i === 0 ? 'Строеж 1' : `Строеж ${i + 1}`);
}

function dobaviStroezh() {
    const p = _zhivObekt();
    if (!p) return;
    const ime = prompt('Наименование на новия строеж в този имот:\n\n'
        + 'напр. „Външно електрозахранване с нови кабели НН 1 kV“');
    if (ime === null) return;
    (p.stroezhi_dop = p.stroezhi_dop || []).push({ stroej: ime.trim() });
    p.tekusht_stroezh = _brojStroezhi(p) - 1;
    _zapishiObekt(p, `Нов строеж в имота: ${ime.trim() || 'без име'}`);
    _prerisuvai();
}

function smeniStroezh(i) {
    const p = _zhivObekt();
    if (!p) return;
    p.tekusht_stroezh = Number(i);
    _zapishiTiho_ilisave(p);
    _prerisuvai();
}

function _zapishiTiho_ilisave(p) {
    appData.currentProject = p;
    saveData();
}

function _prerisuvai() {
    const stranica = [...document.querySelectorAll('.page')].find(x => x.classList.contains('active'));
    const id = (stranica && stranica.id || '').replace('page-', '');
    ({ kakav: renderKakavPage,
       osip: renderOsipPage, proekt: renderProektPage,
       imot: renderImotPage, sobstvenost: renderSobstvenostPage,
       dokumentite: renderDokumentitePage, nadzor: renderNadzorPage }[id] || (() => {}))();
}

// Лентата със строежите — показва се там, където работата е НА СТРОЕЖ.
function _lentaStroezhi(p) {
    const spisak = _stroezhi(p), tekusht = _indeksStroezh(p);
    const edin = spisak.length === 1;
    return `
        <div class="card" style="margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                <div style="font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--muted)">
                    ${edin ? 'Строеж' : `Строежи в имота · ${spisak.length}`}
                </div>
                ${spisak.map((s, i) => `
                    <button type="button" class="btn ${i === tekusht ? 'btn-primary' : 'btn-secondary'} btn-sm"
                            onclick="smeniStroezh(${i})" title="${_s2esc(_imeStroezh(s, i))}">
                        ${_s2esc(_imeStroezh(s, i))}
                    </button>`).join('')}
                <button type="button" class="btn btn-ghost btn-sm" onclick="dobaviStroezh()">+ строеж</button>
            </div>
            ${edin ? `<p style="font-size:11.5px;color:var(--muted);margin:8px 0 0">
                Един имот може да носи няколко строежа — всеки със свое разрешение, своя категория
                и своя заповедна книга. Общи са имотът, собствеността и Акт 16.</p>` : ''}
        </div>`;
}

function _zhivObekt() {
    const c = appData.currentProject;
    return c ? appData.projects.find(x => String(x.id) === String(c.id)) || null : null;
}

function _obektIliIzbor(kutiyaId, stranica, podkana) {
    const p = _zhivObekt();
    if (!p) {
        document.getElementById(kutiyaId).innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <div class="empty-title">Изберете обект</div>
                <div class="empty-text">${podkana}</div>
                ${izborObektHtml(stranica)}
            </div>`;
    }
    return p;
}

// Лентата е за ИМОТА. Името на строежа беше тук — махнато е (02.10.2026):
// един имот може да носи няколко строежа и смесването на двете в един ред
// беше точно подредбата, която изоставяме. Строежът е в своята лента.
function _lentaObekt(p, stranica) {
    const nik = (p.nik || '').trim();
    return `
        <div class="card" style="margin-bottom:16px">
            <div class="card-header">
                <div>
                    <div class="card-title">📋 ${nik ? _s2esc(nik) : 'Имот'}</div>
                    <div class="card-subtitle">
                        ПИ ${_s2esc(p.pi || '—')}${p.address ? ' · ' + _s2esc(p.address) : ''}
                        <button type="button" class="btn btn-ghost btn-sm" style="margin-left:6px"
                                onclick="smeniNik()">${nik ? 'смени ника' : '+ ник'}</button>
                    </div>
                </div>
                ${izborObektHtml(stranica)}
            </div>
        </div>`;
}

// Номерът е верният ключ, никът е нейният. „ПИ 68134.209.689“ не казва нищо на
// окото; „Бъкстон“ казва всичко. (Операторът, 01.10.2026)
function smeniNik() {
    const p = _zhivObekt();
    if (!p) return;
    const nov = prompt('Ник на имота — както ти го наричаш:' + String.fromCharCode(10,10) + 'напр. „Бъкстон“, „Обеля“', p.nik || '');

    if (nov === null) return;
    p.nik = nov.trim();
    _zapishiObekt(p, p.nik ? `Ник на имота: ${p.nik}` : 'Никът на имота е махнат');
    _prerisuvai();
}

function _zapishiObekt(p, saobshtenie) {
    p.updatedAt = new Date().toISOString();
    appData.currentProject = p;
    // „✅ запазено“ се казва само ако НАИСТИНА е запазено — поне на едното
    // място. Ако браузърът откаже, saveData вече е казала защо. (29.09.2026)
    const vBrauzara = saveData();
    addHistory('edit', p.pi, saobshtenie);
    if (!appData.apiUrl) {
        if (vBrauzara) showAlert('success', `✅ ${saobshtenie}.`);
        else showAlert('error', `⛔ „${saobshtenie}“ НЕ е запазено — нито в браузъра, нито в базата (няма връзка със сървъра).`);
        return;
    }
    const { id: _bezId, ...zaSarvara } = p;
    apiCall(`/api/passports/${p.pi}`, 'POST', { passport: zaSarvara, pi: p.pi })
        .then(() => showAlert('success', vBrauzara
            ? `✅ ${saobshtenie} · ☁️ ПИ-${p.pi} запазен в базата данни.`
            : `☁️ ПИ-${p.pi} запазен в базата данни (в браузъра НЕ можа — виж горното съобщение).`))
        .catch(e => showAlert('error', vBrauzara
            ? `⚠️ Локално запазен, но API грешка: ${e.message}`
            : `⛔ „${saobshtenie}“ НЕ Е ЗАПАЗЕНО НИКЪДЕ — браузърът отказа и базата данни също: ${e.message}`));
}

async function renderOsipPage() {
    const p = _obektIliIzbor('osip-content', 'osip',
        'Изберете обекта, чиято оценка на съответствието се попълва');
    if (!p) return;
    _renderOsipOsnova(p);
    _osipDokumenti(p);
}

// Документите, които се събират ДО разрешението за строеж — 37 реда, по същия
// изглед като надзора. РС е превключвателят: оттам нататък е другата фаза.
// (09.10.2026)
async function _osipDokumenti(p) {
    const st = _stroezh(p);
    const kutiya = document.createElement('div');
    kutiya.id = 'osip-dokumenti';
    // Над формата, веднага под лентата с имота: първото, което се вижда, е
    // какво се иска СЕГА, а не полетата на доклада.
    const dom = document.getElementById('osip-content');
    dom.insertBefore(kutiya, dom.children[1] || null);
    kutiya.innerHTML = '<div class="card"><div style="color:var(--muted);font-size:13px">Подреждам документите за ОСИП…</div></div>';
    try {
        const r = await apiCall('/api/nadzor', 'POST', {
            pi: p.pi, faza: 'osip',
            nalichni: _nadzorNalichni(st),
            tekusht: 'ОСИП',
            priznaci: _nadzorPriznaci(p, st),
            izklyucheni: st.izklyucheni_momenti || [],
        });
        if (r.greshka) throw new Error(r.greshka);
        _sbPodmeniCheklist(p, r);
        kutiya.innerHTML = _nadzorHtml({ ...st, tekusht_moment: 'ОСИП' }, r, true);
    } catch (e) {
        kutiya.innerHTML = `<div class="alert alert-error">${_s2esc(e.message)}</div>`;
    }
}

function _renderOsipOsnova(p) {
    // Картата „Обектът — вид и признаци“ е махната оттук (13.10.2026):
    // тя живее в „Проверки“ и две копия означаваха два различни отговора.
    document.getElementById('osip-content').innerHTML = _lentaObekt(p, 'osip') + `
        <div class="card">
            <div class="card-title" style="margin-bottom:8px">📐 Оценка на съответствието (ОСИП)</div>
            <p style="font-size:12px;color:var(--muted);margin-bottom:12px">
                Данни за комплексния доклад. Категорията се изписва изцяло, с правното основание —
                тя влиза дословно в раздел А.
            </p>
            <div class="form-grid">
                <div class="form-group form-grid-full">
                    <label class="form-label">Категория — правно основание, дословно за раздел А</label>
                    <input type="text" id="fp-osip-kategoria" class="form-input"
                           placeholder="пета КАТЕГОРИЯ, съгласно чл. 10, ал. 1, буква „а“ от Наредба № 1/30.07.2003 г. за номенклатурата на видовете строежи и чл. 137, ал. 1, т. 5 от ЗУТ"
                           value="${(p.osip||{}).kategoria||''}">
                    <p style="font-size:11px;color:var(--muted);margin-top:4px">
                        Самата категория се избира горе, при вида на строежа. Тук се пише цитатът,
                        който влиза дословно в изречението на раздел А.
                    </p>
                    <div style="margin-top:10px">
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-proveri-kat"
                                onclick="proveriKategoria()">
                            🔍 Провери цитата срещу наредбата
                        </button>
                        <span style="font-size:11px;color:var(--muted);margin-left:8px">
                            намира разпоредбата и сверява описанието на строежа с нея
                        </span>
                    </div>
                    <div id="kat-rezultat" style="margin-top:10px"></div>
                </div>
                <div class="form-group">
                    <label class="form-label">Изх. № на доклада</label>
                    <input type="text" id="fp-osip-izh-nomer" class="form-input" placeholder="1281"
                           value="${(p.osip||{}).izh_nomer||''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Дата на доклада</label>
                    <input type="text" id="fp-osip-izh-data" class="form-input" placeholder="дд.мм.гггг"
                           value="${(p.osip||{}).izh_data||''}" oninput="formatDateInput(this)">
                    <p style="font-size:11px;color:var(--muted);margin-top:4px">
                        Трябва да предхожда разрешението за строеж — тя е основанието за издаването му.
                    </p>
                </div>
                <div class="form-group">
                    <label class="form-label">Фаза на проекта</label>
                    <input type="text" id="fp-osip-faza" class="form-input" list="osip-faza-list"
                           placeholder="Технически проект (ТП)" value="${(p.osip||{}).faza||''}">
                    <datalist id="osip-faza-list">
                        <option value="Технически проект (ТП)"></option>
                        <option value="Работен проект (РП)"></option>
                        <option value="Идеен проект (ИП)"></option>
                    </datalist>
                </div>
                <div class="form-group">
                    <label class="form-label">Одобряващ орган</label>
                    <input type="text" id="fp-osip-organ" class="form-input"
                           placeholder="Главния архитект на Столична община" value="${(p.osip||{}).organ||''}">
                </div>
                <div class="form-group form-grid-full">
                    <label class="form-label">Договор за надзор</label>
                    <input type="text" id="fp-osip-dogovor" class="form-input"
                           placeholder="сключен Договор за упражняване на строителен надзор между Възложителя и Консултанта"
                           value="${(p.osip||{}).dogovor||''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Технически контрол „Конструктивна“</label>
                    <input type="text" id="fp-osip-tk" class="form-input" placeholder="инж. Маргарита Янкова Йорданова"
                           value="${(p.osip||{}).tk||''}">
                </div>
                <div class="form-group">
                    <label class="form-label">ТК — рег. №</label>
                    <input type="text" id="fp-osip-tk-reg" class="form-input" placeholder="0319"
                           value="${(p.osip||{}).tkReg||''}">
                </div>
            </div>
        </div>
        <div style="display:flex;gap:12px;margin:16px 0 40px;flex-wrap:wrap">
            <button class="btn btn-success btn-lg" onclick="zapishiOsip()">💾 Запази оценката</button>
            <button class="btn btn-primary btn-lg" id="btn-gen-osip" onclick="generiraiOsip()">📄 Запази и генерирай ОСИП (.docx)</button>
        </div>`;
    // Присъди, записани преди повредата да се различава от находка, остават в
    // паспортите. Разпознават се по обосновката и се изхвърлят при отваряне —
    // иначе показват „не може да се прецени“ вечно.
    const zapisana = (p.osip || {}).ai_kategoria || null;
    const povreda = zapisana && zapisana.otgovor === 'ne_moga' &&
        (zapisana.vid === 'sistemna' ||
         /не е намерена|не съвпада|отпечат|заключен/i.test(zapisana.obosnovka || ''));
    _aiKategoria = povreda ? null : zapisana;
    renderKatRezultat(_aiKategoria);
}

function zapishiOsip() {
    const p = _zhivObekt();
    if (!p) return;
    const v = id => document.getElementById(id)?.value || '';
    p.osip = {
        ...(p.osip || {}),
        izh_nomer: v('fp-osip-izh-nomer'),
        izh_data:  v('fp-osip-izh-data'),
        kategoria: v('fp-osip-kategoria'),
        ai_kategoria: _aiKategoria || undefined,
        faza:      v('fp-osip-faza'),
        organ:     v('fp-osip-organ'),
        dogovor:   v('fp-osip-dogovor'),
        tk:        v('fp-osip-tk'),
        tkReg:     v('fp-osip-tk-reg'),
    };
    _zapishiObekt(p, 'Оценката на съответствието е запазена');
}

function renderDokumentiPage() {
    const p = _obektIliIzbor('dokumenti-content', 'dokumentite',
        'Изберете обекта, чиито изходни данни се вписват');
    if (!p) return;
    // Тук полетата се пишат — затова резюмето само за четене не се показва.
    const permit = p.permit || {};
    document.getElementById('dokumenti-content').innerHTML = `
        <div class="card">
            <div class="card-title" style="margin-bottom:8px">📎 Изходни данни и съгласувания</div>
            <p style="font-size:12px;color:var(--muted);margin-bottom:12px">
                Кои документи се изискват за този обект решава чеклистът —
                файл, който редактираш ти, не кодът. Впиши каквото е налице;
                останалото излиза като <strong>не е доказано</strong>, не се премълчава.
                Каквото зависи от обстоятелства, които паспортът не знае, излиза
                <strong>за преценка</strong> — впиши го или го отбележи „не се отнася“.
            </p>
            <div id="fp-dok-rows"></div>
            <div style="display:flex;gap:8px;margin-top:10px">
                <button type="button" class="btn btn-secondary btn-sm" onclick="addDokRow()">
                    + Добави документ
                </button>
                <!-- Двата раздела на чеклиста (операторът, 11.09.2026) -->
                <button type="button" class="btn btn-primary btn-sm" onclick="proveriDokumenti('osip')">
                    🔍 Провери — за ОСИП
                </button>
                <button type="button" class="btn btn-primary btn-sm" onclick="proveriDokumenti('od')">
                    🔍 Провери — за Акт 15 / ОД
                </button>
            </div>
            <div id="fp-dok-rezultat" style="margin-top:12px"></div>
        </div>
        <div class="card">
            <div class="card-title" style="margin-bottom:8px">📜 Разрешение за строеж</div>
            <p style="font-size:12px;color:#8a6400;background:#fffbef;border-left:3px solid #d99a00;
                      padding:7px 10px;border-radius:0 6px 6px 0;margin-bottom:14px">
                <strong>Номерът и датата се преписват на ръка от самото разрешение.</strong>
                Те влизат в акт 7, акт 14, акт 15 и окончателния доклад — сбъркана цифра
                не личи никъде и излиза чак при приемателната комисия.
            </p>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Номер</label>
                    <input type="text" id="fp-permit-num" class="form-input" placeholder="№ 123" value="${permit.number||''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Дата на издаване</label>
                    <input type="text" id="fp-permit-date" class="form-input" placeholder="дд.мм.гггг" value="${permit.date||''}" oninput="formatDateInput(this)">
                </div>
                <div class="form-group form-grid-full">
                    <label class="form-label">Издател</label>
                    <input type="text" id="fp-permit-issuer" class="form-input" placeholder="Главен архитект на Столична Община" value="${permit.issuer||''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Влязло в сила на</label>
                    <input type="text" id="fp-permit-effective" class="form-input" placeholder="дд.мм.гггг" value="${permit.effective||''}" oninput="formatDateInput(this)">
                </div>
            </div>
        </div>
        <div style="display:flex;gap:12px;margin:16px 0 40px">
            <button class="btn btn-success btn-lg" onclick="zapishiDokumenti()">💾 Запази изходните данни</button>
        </div>`;
    renderDokumenti(p);
    try { const s = localStorage.getItem('s2_chetec'); if (s) document.getElementById('s2-chetec').value = s; } catch (e) {}
    if (p.sloy2?.od?.dokumenti?.length) sloy2Sravni();
}

// „Актове и протоколи“ рисува и датите на съставените документи. Обвивката е
// тук, за да ги напълни след рисуването — всички пътища (меню, смяна на обект,
// бутонът в паспорта) минават през нея.
function renderGenerateSection() {
    _renderGenerateSectionOsnova();
    const p = _zhivObekt() || appData.currentProject;
    renderDocDates(p);
    // Червената лампа: книгата, която актовете цитират, заменена ли е.
    if (p?.zk?.number) proveriZK(p.zk.number);
}

// Генериране на един документ — общото на ОСИП (от оценката) и ЗК (от
// регистъра). Същото като в цикъла на „Актове и протоколи“: заявка, сваляне,
// запис в историята на обекта.
async function _generirai(p, apiType, dopalnitelno, etiket, ime) {
    const consultant = appData.consultants.find(c => c.id == p.consultant?.id);
    const body = { passport: buildPassportRows(p, consultant, {}), pi: p.pi, ...dopalnitelno };
    const token = getToken();
    const r = await fetch(`${(appData.apiUrl || '').replace(/\/$/, '')}/api/generate/${apiType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
    });
    if (!r.ok) {
        const err = await r.json().catch(() => ({ error: r.statusText }));
        throw new Error(err.error || `HTTP ${r.status}`);
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = ime; a.click();
    URL.revokeObjectURL(url);

    const nd = { type: etiket, date: new Date().toISOString(), url: '', path: '' };
    p.generatedDocs = p.generatedDocs || [];
    const i = p.generatedDocs.findIndex(d => d.type === etiket);
    if (i >= 0) p.generatedDocs[i] = nd; else p.generatedDocs.push(nd);
    addHistory('generate', p.pi, `Генериран .docx: ${etiket}`);
    saveData();
}

// ОСИП — само оттук. Първо се записва оценката: докладът трябва да излезе
// с това, което е на екрана, а изх. № и датата се пишат на едно място.
async function generiraiOsip() {
    const p = _zhivObekt();
    if (!p) return;
    zapishiOsip();
    const btn = document.getElementById('btn-gen-osip');
    const staro = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Генериране…'; }
    try {
        await _generirai(p, 'osip',
            { osip_number: p.osip?.izh_nomer || '', osip_date: p.osip?.izh_data || '' },
            'ОСИП (комплексен доклад)', `osip_${p.pi}.docx`);
        showAlert('success', '✅ ОСИП е генериран.');
    } catch (e) {
        showAlert('error', `❌ ОСИП: ${e.message}`);
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = staro; }
    }
}

// Генерирането на ЗК в регистъра: избор на обект, дата, бутон. Номерът се
// взима от регистъра; повторно генериране за същия обект връща неговия.
function renderZkGen() {
    const k = document.getElementById('zk-gen-kutiya');
    if (!k) return;
    const p = _zhivObekt();
    k.innerHTML = `
        <div class="card-header">
            <div>
                <div class="card-title">📄 Генерирай заповедна книга</div>
                <div class="card-subtitle">Номерът идва от регистъра; всички данни — от паспорта на обекта.</div>
            </div>
            ${izborObektHtml('zk')}
        </div>
        ${p ? `
        <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
            <div class="form-group" style="margin:0">
                <label class="form-label">Дата на книгата</label>
                <input type="text" id="zk-gen-data" class="form-input" style="width:160px"
                       placeholder="дд.мм.гггг" value="${(p.zk || {}).date || ''}" oninput="formatDateInput(this)">
            </div>
            <button class="btn btn-primary" id="btn-gen-zk" onclick="generiraiZK()">📄 Генерирай .docx</button>
            <span style="font-size:13px;color:var(--muted)">
                ${(p.zk || {}).number
                    ? `Обектът има книга № <strong>${p.zk.number}</strong> — ново генериране дава същия номер.`
                    : 'Обектът ще получи следващия номер от регистъра.'}
            </span>
        </div>` : ''}`;
}

async function generiraiZK() {
    const p = _zhivObekt();
    if (!p) return;
    const data = document.getElementById('zk-gen-data')?.value.trim() || '';
    const btn = document.getElementById('btn-gen-zk');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Генериране…'; }
    try {
        const z = await apiCall('/api/zk/zaemi', 'POST', {
            pi: p.pi,
            obekt: [p.stroej, p.address].filter(Boolean).join(', '),
            data,
        });
        const nomer = String(z.nomer);
        // Номерът остава в обекта — актовете го цитират.
        if ((p.zk || {}).number !== nomer || (p.zk || {}).date !== data) {
            p.zk = { number: nomer, date: data };
            _zapishiObekt(p, z.nov ? `Заповедна книга № ${nomer} е взета от регистъра`
                                   : `Заповедна книга № ${nomer} — вече е на този обект`);
        }
        await _generirai(p, 'zapovedna', { zapovedna_number: nomer, zapovedna_date: data },
                         'Заповедна книга', `zapovedna_${nomer}_${p.pi}.docx`);
        showAlert('success', `✅ Заповедна книга № ${nomer} е генерирана.`);
        renderZK();
    } catch (e) {
        showAlert('error', `❌ Заповедна книга: ${e.message}`);
        if (btn) { btn.disabled = false; btn.innerHTML = '📄 Генерирай .docx'; }
    }
}

// Сметката на постигнатите показатели беше тук, за живото показване в
// картата, която вече я няма (02.10.2026). Същата сметка прави правило G1
// на сървъра — там ѝ е мястото.


function zapishiDatiDokumenti() {
    const p = _zhivObekt();
    if (!p) return;
    p.docDates = readDocDates();
    _zapishiObekt(p, 'Датите на съставените документи са запазени');
}

function zapishiDokumenti() {
    const p = _zhivObekt();
    if (!p) return;
    const v  = id => document.getElementById(id)?.value || '';
    const ch = id => !!document.getElementById(id)?.checked;
    // Същите полета и същият вид като в паспорта досега — изнесени са, не
    // променени. Паспортът вече не ги пише (иначе би писал празно върху тях).
    Object.assign(p, {
        // Признаците на строежа са в „Проверки“, а тези на имота — в „Имотът“
        // (09.10.2026). Тук вече НЕ се пишат: страница без тези полета би
        // записала празно върху истинските стойности.
        // Градоустройството се премести в „Имотът“ (02.10.2026) — тук вече НЕ се
        // пише, иначе страницата, която няма тези полета, би записала празно.
        permit: {
            number: v('fp-permit-num'), date: v('fp-permit-date'),
            issuer: v('fp-permit-issuer'), effective: v('fp-permit-effective'),
        },
        dokumenti: readDokumenti(),
    });
    _zapishiObekt(p, 'Изходните данни са запазени');
}

function editPassport(id) {
    navigateTo('new-passport');
    renderPassportForm(id);
}

function deletePassport(id) {
    const project = appData.projects.find(p => p.id === id);
    if (!project) return;
    if (!confirm(`Изтрий паспорт ПИ: ${project.pi}?`)) return;

    appData.projects = appData.projects.filter(p => p.id !== id);
    if (appData.currentProject?.id === id) appData.currentProject = null;
    addHistory('delete', project.pi, `Изтрит паспорт "${project.stroej}"`);
    saveData();
    filterPassports();
    updateNavBadge();
    showAlert('success', 'Паспортът е изтрит.');
}

// ═══════════════════════════════════════════════════════════