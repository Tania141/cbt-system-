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
                <div>${(c.employees||[]).map(e => `<span class="emp-chip">${e.name} <span class="spec">· ${e.specialization}</span></span>`).join('')}</div>
            </div>
        </div>
    `).join('');
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
//  HTML GENERATORS (preserved from v4)
// ═══════════════════════════════════════════════════════════
function formatConsultantSpecs(employees) {
    return employees.map(e => {
        if (e.name.includes('Надя') && e.name.includes('Спасова') && e.specialization === 'Конструктивна') return e.name;
        return `${e.name} (${e.specialization})`;
    }).join('; ');
}

function createProtokol2HTML(project, consultant, employees, geodesist) {
    const consultantSpecs = formatConsultantSpecs(employees);
    const firstConsultantName = consultantSpecs.split(';')[0].trim().split('(')[0].trim();

    return `<!DOCTYPE html><html lang="bg"><head><meta charset="UTF-8"><title>Протокол 2</title>
    <style>@page{size:A4;margin:2.5cm}body{font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.3;color:#000;background:white}.center{text-align:center;margin:6pt 0}.right{text-align:right;margin:6pt 0}.bold{font-weight:bold}p{margin:6pt 0;text-align:justify}.section-title{font-weight:bold;margin-top:12pt;margin-bottom:6pt}</style></head><body>
    <p class="right">Образец 2 (ДВ, бр. 72 / 2003 г., изм. ДВ, бр. 29/2006 г.; бр. 98/2012 г.; изм. И доп., ДВ, бр. 65/2016 г.)</p>
    <p class="right bold">Приложение № 2 към чл. 7, ал. 3, т. 2 на Наредба № 3</p><p>&nbsp;</p>
    <p class="bold">Строеж: ${project.stroej}</p>
    <p class="bold">Местонахождение: ${project.address}</p>
    <p class="bold">Възложител: ${project.client?.name}</p>
    <p class="bold">Консултант: ${consultant.name}, ${consultantSpecs}</p>
    <p class="bold">Техн. ръководител: ${project.builder?.tech}</p>
    <p class="bold">Строител: ${project.builder?.company}</p><p>&nbsp;</p><p>&nbsp;</p>
    <p class="center bold">ПРОТОКОЛ</p>
    <p class="center">ЗА ОТКРИВАНЕ НА СТРОИТЕЛНА ПЛОЩАДКА</p>
    <p class="center">И ОПРЕДЕЛЯНЕ НА СТРОИТЕЛНА ЛИНИЯ И НИВО НА СТРОЕЖА</p><p>&nbsp;</p>
    <p class="section-title">I. Откриване на строителна площадка:</p><p>&nbsp;</p>
    <p>Днес, _______________${new Date().getFullYear()} г, долуподписаният:</p><p>&nbsp;</p>
    <p>А. Консултанта (Строителен надзор): ${consultantSpecs}</p>
    <p>Технически ръководител: ${project.builder?.tech}</p>
    <p>в присъствието на:</p>
    <p>Б. Възложителя: ${project.client?.name}</p>
    <p>В. Строителя: ${project.builder?.company}, представлявано от ${project.builder?.manager}</p><p>&nbsp;</p>
    <p>Г. Служител по чл. 223, ал. 2 от ЗУТ: ___________________________________________________</p>
    <p class="center">(трите имена по документ за самоличност и длъжност)</p>
    <p>съставих този протокол, с който удостоверявам:</p><p>&nbsp;</p>
    <p>1. Налице са следните разрешения и документи:</p>
    <p>1.1. Разрешение за строеж № ${project.permit?.number} от ${formatDate(project.permit?.date)} г., издадено от ${project.permit?.issuer}, заверено, че е влязло в сила на ${formatDate(project.permit?.effective)}.</p>
    <p>1.2. За заемане на тротоар (част от него и/или част от уличното платно): ______________________________________________</p>
    <p>1.3. За преминаване на строителна и транспортна техника: ______________________________________________</p>
    <p>1.4. За ограждане на строителна площадка: ______________________________________________</p>
    <p>1.5. За извозване на хумус: ______________________________________________</p>
    <p>1.6. За извозване на земни маси: ______________________________________________</p>
    <p>1.7. За извозване на строителни отпадъци: ______________________________________________</p>
    <p>1.8. За изкореняване (отсичане) на съществуващи дървета и др.: ______________________________________________</p>
    <p>2. Изходните точки на външните връзки:</p>
    <p>2.1. За временен водопровод: ______________________________________________</p>
    <p>2.2. За временна канализация: ______________________________________________</p>
    <p>2.3. За временно електрозахранване: ______________________________________________</p><p>&nbsp;</p>
    <p>3. Описание на строителната площадка:</p>
    <p>3.1. __________________________________________________________________________________</p>
    <p>3.2. __________________________________________________________________________________</p>
    <p>3.3. Достъпа до строителната площадка: __________________________________________________________________________________</p><p>&nbsp;</p>
    <p>4. Състоянието на околното пространство е: __________________________________________________________________________________</p><p>&nbsp;</p>
    <p>5. Предвидени мерки по Плана за безопасност и здраве: __________________________________________________________________________________</p>
    <p>Забележка при съставяне на раздел I: няма</p><p>&nbsp;</p><p>&nbsp;</p>
    <p class="bold">СЪСТАВИЛ:</p><p>&nbsp;</p>
    <p>А. ...............................(инж. ${getTwoNames(firstConsultantName)}) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Т. Р. ...............................( ${getTwoNames(project.builder?.tech)} )</p><p>&nbsp;</p>
    <p class="bold">ПРИСЪСТВАЛИ:</p><p>&nbsp;</p>
    <p>Б. ...........................(${getTwoNames(project.client?.name)}) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;В. .....................(${getTwoNames(project.builder?.manager)}) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Г.________________</p>
    <div style="page-break-before:always"></div>
    <p class="section-title">II. Определяне на строителна линия и ниво на строежа:</p><p>&nbsp;</p>
    <p>Днес, _______________${new Date().getFullYear()} г, долуподписаният:</p><p>&nbsp;</p>
    <p>А. Консултанта (Строителен надзор): ${consultantSpecs}</p>
    <p>Технически ръководител: ${project.builder?.tech}</p>
    <p>в присъствието на:</p>
    <p>Б. Възложителя: ${project.client?.name}</p>
    <p>В. Строителя: ${project.builder?.company}, представлявано от ${project.builder?.manager}</p>
    <p>Г. Техническо правоспособно физическо лице по част "Геодезия": ${geodesist?.name} - По част "Геодезия"</p><p>&nbsp;</p>
    <p>Д. Служител по чл. 223, ал. 2 от ЗУТ: ___________________________________________________</p>
    <p class="bold">съставих този протокол, с който удостоверявам, че определих строителна линия и ниво на строежа ${project.stroej} с местонахождение: ${project.address}</p><p>&nbsp;</p>
    <p>1. Окомерна скица:</p><p>&nbsp;</p>
    <p>2. Основни репери:</p><p>&nbsp;</p>
    <p>3. Нива на строежа по одобрения проект:</p>
    <p>3.1. Кота изкоп ________________ м</p>
    <p>3.2. Кота цокъл +/-0,00=________________ м</p>
    <p>3.3. Кота корниз (стреха) + ________________ м</p>
    <p>3.4. Кота било + ________________ м</p><p>&nbsp;</p>
    <p class="bold">СЪСТАВИЛ:</p><p>&nbsp;</p>
    <p>А. ...............................(инж. ${getTwoNames(firstConsultantName)}) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Т. Р. ...............................( ${getTwoNames(project.builder?.tech)} )</p><p>&nbsp;</p>
    <p class="bold">ПРИСЪСТВАЛИ:</p><p>&nbsp;</p>
    <p>Б. ...........................(${getTwoNames(project.client?.name)}) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;В. .....................(${getTwoNames(project.builder?.manager)})</p><p>&nbsp;</p>
    <p>Г. .................. инж. ${getTwoNames(geodesist?.name)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Д._________________________</p>
    
</body></html>`;
}

function createAkt7HTML(project, consultant, employees, constructor) {
    const consultantSpecs = formatConsultantSpecs(employees);
    return `<!DOCTYPE html><html lang="bg"><head><meta charset="UTF-8"><title>Акт 7</title>
    <style>@page{size:A4;margin:2.5cm}body{font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.15;color:#000;background:white}.center{text-align:center;margin:6pt 0}.right{text-align:right;margin:6pt 0}.bold{font-weight:bold}p{margin:6pt 0;text-align:justify}</style></head><body>
    <p class="center">Приложение № 7</p><p class="right">(Образец 7)</p><p>&nbsp;</p>
    <p class="bold">Строеж: ${project.stroej}</p>
    <p class="bold">Местонахождение: ${project.address}</p>
    <p class="bold">Възложител: ${project.client?.name}</p>
    <p class="bold">Консултант: ${consultant.name}</p>
    <p class="bold">Тех. ръководител: ${project.builder?.tech}</p>
    <p class="bold">Строител: ${project.builder?.company}</p><p>&nbsp;</p>
    <p class="center bold">АКТ</p>
    <p class="center bold">за приемане на СМР по нива и етапи</p><p>&nbsp;</p>
    <p>Днес, ....................год, долуподписаните:</p><p>&nbsp;</p>
    <p>А. Строителя: инж. ${project.builder?.tech} – технически ръководител;</p>
    <p>Б. Проектанта на конструктивната част: инж. ${constructor?.name};</p>
    <p>В. Консултанта: ${consultantSpecs}</p><p>&nbsp;</p>
    <p>съставихме настоящия акт, с който удостоверяваме, че са извършени следните строителни работи по нива и етапи:</p><p>&nbsp;</p>
    <p>1. Вид на строителните работи и строителни продукти: __________________________________________________________________________________</p><p>&nbsp;</p>
    <p>2. Подробно описание с данни за изпълнение: __________________________________________________________________________________</p><p>&nbsp;</p>
    <p>3. Видове и количества на вложените строителни продукти и съоръжения: __________________________________________________________________________________</p><p>&nbsp;</p>
    <p>4. Документи, удостоверяващи качеството на вложените строителни продукти: __________________________________________________________________________________</p><p>&nbsp;</p>
    <p>5. Отклонения от одобрените инвестиционни проекти: __________________________________________________________________________________</p><p>&nbsp;</p>
    <p>А. ..............................</p>
    <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(${getTwoNames(project.builder?.tech)})</p><p>&nbsp;</p>
    <p>Б. ....................................&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;..............................................&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;В. .....................................</p>
    <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(${getTwoNames(consultantSpecs.split(';')[0].split('(')[0].trim())})&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(${getTwoNames(project.builder?.tech)})&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(${getTwoNames(project.builder?.manager)})</p>
    
</body></html>`;
}

function createAkt14HTML(project, consultant, employees, snKonstruktivna, projektantKonstruktivna) {
    const consultantSpecs = formatConsultantSpecs(employees);
    return `<!DOCTYPE html><html lang="bg"><head><meta charset="UTF-8"><title>Акт 14</title>
    <style>@page{size:A4;margin:2.5cm}body{font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.15;color:#000;background:white}.center{text-align:center;margin:6pt 0}.right{text-align:right;margin:6pt 0}.bold{font-weight:bold}p{margin:6pt 0;text-align:justify}</style></head><body>
    <p class="center">Приложение № 14</p><p class="right">(Образец 14)</p><p>&nbsp;</p>
    <p class="bold">Строеж: ${project.stroej}</p>
    <p class="bold">Местонахождение: ${project.address}</p>
    <p class="bold">Възложител: ${project.client?.name}</p>
    <p class="bold">Консултант: ${consultant.name}</p>
    <p class="bold">Строител: ${project.builder?.company}</p><p>&nbsp;</p>
    <p class="center bold">АКТ ЗА ПРИЕМАНЕ НА КОНСТРУКЦИЯТА</p><p>&nbsp;</p>
    <p>Днес, ....................год, долуподписаните:</p><p>&nbsp;</p>
    <p>А. Проектанта на конструктивната част: инж. ${projektantKonstruktivna?.name}, рег. № ${projektantKonstruktivna?.ppp};</p>
    <p>Б. СН по конструктивна: ${snKonstruktivna?.name};</p>
    <p>В. Консултанта (строителен надзор): ${consultantSpecs}</p>
    <p>Г. Строителя: ${project.builder?.company}, представлявано от ${project.builder?.manager}</p><p>&nbsp;</p>
    <p>съставихме настоящия акт за приемане на конструкцията.</p><p>&nbsp;</p>
    <p>Строителните работи са извършени в съответствие с одобрените проекти ............................................</p>
    <p>Отклонения от одобрените инвестиционни проекти: ________________________________________</p><p>&nbsp;</p>
    <p>А. ..............................&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Б. ..............................&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;В. ..............................&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Г. ..............................</p>
    
</body></html>`;
}

function createObrazec3HTML(project, consultant, employees) {
    const consultantSpecs = formatConsultantSpecs(employees);
    return `<!DOCTYPE html><html lang="bg"><head><meta charset="UTF-8"><title>Образец 3</title>
    <style>@page{size:A4;margin:2.5cm}body{font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.3;color:#000;background:white}.center{text-align:center;margin:6pt 0}.bold{font-weight:bold}p{margin:6pt 0;text-align:justify}</style></head><body>
    <p class="center bold">КОНСТАТИВЕН АКТ</p>
    <p class="center">(Образец 3)</p><p>&nbsp;</p>
    <p class="bold">Строеж: ${project.stroej}</p>
    <p class="bold">Местонахождение: ${project.address}</p>
    <p class="bold">Консултант: ${consultant.name}</p><p>&nbsp;</p>
    <p>Долуподписаните, лица упражняващи строителен надзор:</p>
    <p>${consultantSpecs}</p><p>&nbsp;</p>
    <p>извършихме проверка на строежа и удостоверяваме следното:</p><p>&nbsp;</p>
    <p>1. Разрешение за строеж: № ${project.permit?.number} / ${formatDate(project.permit?.date)} г., издадено от ${project.permit?.issuer}</p>
    <p>2. Строежът отговаря/не отговаря на издадените строителни книжа</p>
    <p>3. Допуснати отклонения: ______________________________________________________</p><p>&nbsp;</p>
    <p>${consultantSpecs.split(';').map(s => `${s.trim()}: ............................`).join('<br>')}</p>
    
</body></html>`;
}

function createZapovednaKnigaHTML(project, consultant, employees, zapovednaNumber, zapovednaDate) {
    const consultantSpecs = formatConsultantSpecs(employees);
    const bySpec = {};
    employees.forEach(e => {
        if (!bySpec[e.specialization]) bySpec[e.specialization] = [];
        bySpec[e.specialization].push(e.name);
    });
    const specialistsList = specializations.map(spec => {
        const names = bySpec[spec];
        return names ? `<p>Част ${spec}: ${names.join(', ')}</p>` : '';
    }).filter(Boolean).join('\n');

    const projectantsList = (project.projectants||[]).map(pp => {
        const kamara = (pp.specialization === 'Архитектура' || pp.specialization === 'Паркоустройство и Благоустройство') ? 'КАБ' : 'КИИП';
        return `<p>инж. ${getTwoNames(pp.name)}, рег. №${pp.ppp} на ${kamara} – част „${pp.specialization}"</p>`;
    }).join('\n');

    return `<!DOCTYPE html><html lang="bg"><head><meta charset="UTF-8">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#E8647A">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="АКТ СИСТЕМ">
    <link rel="apple-touch-icon" href="icon-192.png"><title>Заповедна книга</title>
    <style>@page{size:A4;margin:2.5cm}body{font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.15;color:#000;background:white}.center{text-align:center;margin:6pt 0}.bold{font-weight:bold}p{margin:6pt 0;text-align:justify}.pb{page-break-before:always}</style></head><body>
    <p class="center bold">заповедна книга</p><p>&nbsp;</p>
    <p class="center bold">№ ${zapovednaNumber}/${zapovednaDate}</p><p>&nbsp;</p>
    <p class="bold">Строеж: ${project.stroej}</p><p>&nbsp;</p>
    <p class="bold">Местонахождение: ${project.address}</p><p>&nbsp;</p>
    <p class="bold">Възложител: ${project.client?.name}</p>
    ${Array(12).fill('<p>&nbsp;</p>').join('')}
    <p>заверявам:................................................................</p>
    <p class="center">/${getTwoNames(consultantSpecs.split(';')[0].split('(')[0].trim())} - Управител/</p>
    <div class="pb"></div>
    <p class="center bold">заповедна книга</p><p>&nbsp;</p>
    <p class="bold">Строеж: ${project.stroej}</p><p>&nbsp;</p>
    <p class="bold">Местонахождение: ${project.address}</p><p>&nbsp;</p>
    <p class="bold">Разрешение за строеж: ${project.permit?.number} / ${formatDate(project.permit?.date)}, от ${project.permit?.issuer}, заверено, че е влязло в сила на ${formatDate(project.permit?.effective)}</p><p>&nbsp;</p>
    <p class="bold">Възложители:</p>
    <p>${project.client?.name}</p><p>&nbsp;</p>
    <p class="bold">Строителен надзор: ${consultant.name}, ЕИК ${consultant.eik||'[ЕИК]'}, с адрес на управление ${consultant.address||'[АДРЕС]'}, притежаващо удостоверение ${consultant.cert||'[НОМЕР]'}</p><p>&nbsp;</p>
    <p>Списък на специалистите упражняващи строителен надзор:</p>
    ${specialistsList}<p>&nbsp;</p>
    <p class="bold">Строител: ${project.builder?.company}, ЕИК ${project.builder?.eik||'[ЕИК]'}, адрес ${project.builder?.address||'[АДРЕС]'}, представлявано от ${project.builder?.manager}</p><p>&nbsp;</p>
    <p>Технически ръководител: ${getTwoNames(project.builder?.tech)}</p><p>&nbsp;</p>
    <p class="bold">Проектанти на строежа:</p>
    ${projectantsList}
    
</body></html>`;
}

// ═══════════════════════════════════════════════════════════