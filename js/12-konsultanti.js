// АКТ СИСТЕМ · 12-konsultanti.js
// история, консултанти, внос/износ, HTML генератори
//
// Отделен от app.js на 13.10.2026 (стъпка 2 от ПОДРЕЖДАНЕ.md).
// Файловете се включват по РЕД и споделят едно и също глобално
// пространство — точно както беше в единия скрипт.

//  HISTORY
// ═══════════════════════════════════════════════════════════
function renderHistory() {
    const typeFilter = document.getElementById('history-filter-type')?.value || '';
    const piFilter = (document.getElementById('history-filter-pi')?.value || '').toLowerCase();

    let items = appData.history;
    if (typeFilter) items = items.filter(h => h.type === typeFilter);
    if (piFilter) items = items.filter(h => h.pi?.toLowerCase().includes(piFilter) || h.detail?.toLowerCase().includes(piFilter));

    const container = document.getElementById('history-timeline');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">🕐</div><div class="empty-title">Няма история</div></div>`;
        return;
    }

    container.innerHTML = items.map(h => `
        <div class="timeline-item">
            <div class="timeline-dot ${h.type}"></div>
            <div class="timeline-content">
                <div class="timeline-action">${historyActionLabel(h)}</div>
                <div class="timeline-date">${formatDateTime(h.date)}</div>
                ${h.detail ? `<div class="timeline-detail">${h.detail}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// ═══════════════════════════════════════════════════════════
//  CONSULTANTS
// ═══════════════════════════════════════════════════════════
let editingConsultantId = null;
let tempEmployees = [];

function addEmployeeRow() {
    const emp = { id: Date.now(), name: '', specialization: 'Архитектура', title: 'инж.' };
    tempEmployees.push(emp);
    const container = document.getElementById('employees-container');
    const div = document.createElement('div');
    div.innerHTML = employeeRowHTML(emp, tempEmployees.length - 1);
    container.appendChild(div.firstElementChild);
}

function employeeRowHTML(emp, i) {
    return `
    <div class="dynamic-row" id="emp-row-${i}">
        <input type="text" class="form-input" list="titles-list" placeholder="титла" style="flex:0 0 80px" data-field="title"
               value="${emp.title===undefined?'инж.':emp.title}" onchange="updateEmployee(${i},'title',this.value)">
        <input type="text" class="form-input" placeholder="Им Презиме Фамилия" 
               value="${emp.name||''}" onchange="updateEmployee(${i},'name',this.value)" style="flex:3">
        <select class="form-select" onchange="updateEmployee(${i},'specialization',this.value)" style="flex:2">
            ${specializations.map(s=>`<option value="${s}" ${emp.specialization===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <button class="btn btn-danger btn-sm" onclick="removeEmployeeRow(${i})">✕</button>
    </div>`;
}

function removeEmployeeRow(i) {
    tempEmployees.splice(i, 1);
    document.getElementById('employees-container').innerHTML = tempEmployees.map((e, idx) => employeeRowHTML(e, idx)).join('');
}

function updateEmployee(i, field, value) {
    if (tempEmployees[i]) tempEmployees[i][field] = value;
}

function saveConsultant() {
    // Read employees from DOM
    document.querySelectorAll('[id^="emp-row-"]').forEach((row, i) => {
        const selects = row.querySelectorAll('select');
        const titleEl = row.querySelector('input[data-field="title"]');
        const inp = [...row.querySelectorAll('input')].find(el => el !== titleEl);
        if (tempEmployees[i]) {
            if (inp) tempEmployees[i].name = inp.value.trim();
            if (titleEl) tempEmployees[i].title = titleEl.value.trim();
            if (selects[0]) tempEmployees[i].specialization = selects[0].value;
        }
    });

    const name = document.getElementById('consultant-name').value.trim();
    if (!name) { showAlert('error', 'Въведете фирма!'); return; }

    const validEmployees = tempEmployees.filter(e => e.name);
    if (validEmployees.length === 0) { showAlert('error', 'Добавете поне един служител!'); return; }

    const data = {
        name,
        eik: document.getElementById('consultant-eik').value.trim(),
        manager: document.getElementById('consultant-manager').value.trim(),
        managerTitle: document.getElementById('consultant-manager-title')?.value.trim() || '',
        address: document.getElementById('consultant-address').value.trim(),
        cert: document.getElementById('consultant-cert').value.trim(),
        employees: validEmployees
    };

    if (editingConsultantId !== null) {
        const idx = appData.consultants.findIndex(c => c.id === editingConsultantId);
        if (idx >= 0) appData.consultants[idx] = { ...appData.consultants[idx], ...data };
        showAlert('success', 'Консултантът е актуализиран!');
    } else {
        if (appData.consultants.length >= 4) { showAlert('error', 'Максимум 4 консултанта!'); return; }
        appData.consultants.push({ id: Date.now(), ...data });
        showAlert('success', 'Консултантът е добавен!');
    }

    saveData();
    kachiKonsultanti();
    renderConsultants();
    resetConsultantForm();
}

function editConsultant(id) {
    const c = appData.consultants.find(c => c.id === id);
    if (!c) return;

    editingConsultantId = id;
    tempEmployees = JSON.parse(JSON.stringify(c.employees || []));

    document.getElementById('consultant-form-title').textContent = 'Редактирай консултант';
    document.getElementById('consultant-name').value = c.name || '';
    document.getElementById('consultant-eik').value = c.eik || '';
    document.getElementById('consultant-manager').value = c.manager || '';
    document.getElementById('consultant-manager-title').value = c.managerTitle || '';
    document.getElementById('consultant-address').value = c.address || '';
    document.getElementById('consultant-cert').value = c.cert || '';
    document.getElementById('consultant-save-btn').textContent = '💾 Запази промените';
    document.getElementById('consultant-cancel-btn').style.display = 'inline-flex';

    document.getElementById('employees-container').innerHTML = tempEmployees.map((e, i) => employeeRowHTML(e, i)).join('');
}

function cancelConsultantEdit() {
    editingConsultantId = null;
    resetConsultantForm();
}

function resetConsultantForm() {
    editingConsultantId = null;
    tempEmployees = [];
    document.getElementById('consultant-form-title').textContent = 'Добави консултант';
    document.getElementById('consultant-name').value = '';
    document.getElementById('consultant-eik').value = '';
    document.getElementById('consultant-manager').value = '';
    document.getElementById('consultant-manager-title').value = '';
    document.getElementById('consultant-address').value = '';
    document.getElementById('consultant-cert').value = '';
    document.getElementById('employees-container').innerHTML = '';
    document.getElementById('consultant-save-btn').textContent = '💾 Запази';
    document.getElementById('consultant-cancel-btn').style.display = 'none';
}

function deleteConsultant(id) {
    if (!confirm('Изтрий консултанта?')) return;
    appData.consultants = appData.consultants.filter(c => c.id !== id);
    saveData();
    kachiKonsultanti();
    renderConsultants();
    showAlert('success', 'Консултантът е изтрит.');
}

// ═══════════════════════════════════════════════════════════
//  КОНСУЛТАНТЪТ СРЕЩУ РЕГИСТЪРА НА ДНСК (14.10.2026)
// ═══════════════════════════════════════════════════════════
// Удостоверението по чл. 166 е СРОЧНО. Изтекло удостоверение прави надзора
// неправоспособен, а това не личи никъде в документа.
//
// Операторът: ако фирмата не се намери — бележка, не спиране. Регистърът може
// да изостава (нова фирма, скорошна промяна), документът не чака.

async function sveriKonsultant(konsultant, data) {
    const reg = await registar('dnsk');
    if (!reg || !reg.redove) return { sastoyanie: 'nyama-registar' };
    const ime = _regZn(konsultant && konsultant.name);
    if (!ime) return { sastoyanie: 'nyama-ime' };
    const red = reg.redove.find(r => _regZn(r.ime) === ime)
        || reg.redove.find(r => _regZn(r.ime).includes(ime) || ime.includes(_regZn(r.ime)));
    if (!red) return { sastoyanie: 'ne-e-nameren', izvedeno: reg.izvedeno_na };
    const do_ = _regData(red.validen_do);
    const kam = _regData(data) || new Date();
    return {
        sastoyanie: !do_ ? 'bez-srok' : (do_ >= kam ? 'validno' : 'izteklo'),
        red, izvedeno: reg.izvedeno_na, kam: data || '',
    };
}

function sveriKonsultantHtml(r) {
    const esc = _s2esc;
    const malko = 'font-size:11.5px;margin-top:4px';
    if (r.sastoyanie === 'nyama-registar')
        return `<div style="${malko};color:var(--muted)">Регистърът на ДНСК не е зареден.</div>`;
    if (r.sastoyanie === 'nyama-ime') return '';
    if (r.sastoyanie === 'ne-e-nameren')
        return `<div style="${malko};color:#8a6400">⚠️ Не е намерен в регистъра на ДНСК
            (изведен на ${esc(r.izvedeno)}) — провери; регистърът може да изостава.</div>`;
    const u = r.red;
    if (r.sastoyanie === 'izteklo')
        return `<div style="${malko};color:var(--red)">⚠️ Удостоверение ${esc(u.nomer)} е
            <strong>изтекло на ${esc(u.validen_do)}</strong>${r.kam ? ' — към ' + esc(r.kam) : ''}.</div>`;
    return `<div style="${malko};color:#2e6b32">✓ ДНСК ${esc(u.nomer)} · валидно до
        ${esc(u.validen_do)}${u.upravitel ? ' · управител ' + esc(u.upravitel) : ''}</div>`;
}

// Рисува бележката там, където я поиска екранът — след като регистърът слезе.
async function pokazhiSverkaDNSK(kutiyaId, konsultant, data) {
    const kutiya = document.getElementById(kutiyaId);
    if (!kutiya) return;
    kutiya.innerHTML = sveriKonsultantHtml(await sveriKonsultant(konsultant, data));
}

function renderConsultants() {
    const container = document.getElementById('consultants-list');
    if (!container) return;

    if (appData.consultants.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏢</div><div class="empty-text">Няма добавени консултанти</div></div>`;
        return;
    }

    container.innerHTML = appData.consultants.map(c => `
        <div class="consultant-card">
            <div class="consultant-card-header">
                <div>
                    <div class="consultant-card-name">${c.name}</div>
                    ${c.eik ? `<div class="consultant-card-eik">ЕИК: ${c.eik}</div>` : ''}
                </div>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-secondary btn-sm" onclick="editConsultant(${c.id})">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteConsultant(${c.id})">🗑️</button>
                </div>
            </div>
            <div class="consultant-card-body">
                ${c.manager ? `<div style="font-size:12px;color:var(--slate);margin-bottom:8px">Управител: <strong>${c.manager}</strong></div>` : ''}
                <div id="dnsk-${c.id}"></div>
                <div>${(c.employees||[]).map(e => `<span class="emp-chip">${e.name} <span class="spec">· ${e.specialization}</span></span>`).join('')}</div>
            </div>
        </div>
    `).join('');

    // Сверката е отделна: регистърът слиза по мрежата и не бива да бави списъка.
    for (const c of appData.consultants) pokazhiSverkaDNSK('dnsk-' + c.id, c, '');
}






// ═══════════════════════════════════════════════════════════
//  DATA IMPORT / EXPORT
// ═══════════════════════════════════════════════════════════
function exportAllData() {
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `akt-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData() {
    document.getElementById('import-file').click();
}

function doImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const data = JSON.parse(evt.target.result);
            if (confirm('Това ще замени всички текущи данни. Продължи?')) {
                appData = { ...appData, ...data };
                saveData();
                loadData();
                showAlert('success', 'Данните са импортирани успешно!');
            }
        } catch(err) {
            showAlert('error', 'Невалиден JSON файл!');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    localStorage.removeItem('akt_v5');
    location.reload();
}

// ═══════════════════════════════════════════════════════════