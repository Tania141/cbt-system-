// АКТ СИСТЕМ · 02-zapovedni-knigi.js
// регистърът на заповедните книги; съобщенията
//
// Отделен от app.js на 13.10.2026 (стъпка 2 от ПОДРЕЖДАНЕ.md).
// Файловете се включват по РЕД и споделят едно и също глобално
// пространство — точно както беше в единия скрипт.

//  РЕГИСТЪР НА ЗАПОВЕДНИТЕ КНИГИ
// ═══════════════════════════════════════════════════════════
// Номерът на заповедната книга е официален и последователен за фирмата.
// Дотук се въвеждаше само в паспорта и никъде не се виждаше кой номер къде е
// отишъл. Регистърът пази и връзката „тази книга е заменена от онази“ — при
// смяна на надзора се издава нова и следващите документи се позовават на нея.

async function renderZK() {
    renderZkGen();
    const spisak = document.getElementById('zk-spisak');
    const kutiya = document.getElementById('zk-sledvasht-kutiya');
    spisak.innerHTML = '<div class="empty-text">Зареждане…</div>';
    let d;
    try {
        d = await apiCall('/api/zk');
    } catch (e) {
        spisak.innerHTML = `<div class="alert alert-error">❌ ${e.message}</div>`;
        kutiya.innerHTML = '';
        return;
    }

    document.getElementById('zk-nachalen').value = d.nachalen || '';
    kutiya.innerHTML = d.sledvasht
        ? `<div style="font-size:12px;color:var(--muted)">Следващ свободен номер</div>
           <div style="font-size:26px;font-weight:700;color:var(--accent)">${d.sledvasht}</div>`
        : `<div style="font-size:12px;color:var(--muted)">Задайте начален номер,<br>за да предлага следващия</div>`;

    document.getElementById('zk-prazniny').innerHTML = (d.prazniny || []).length
        ? `<div class="alert alert-warning" style="margin:0">
             ⚠️ Невписани номера в редицата: <strong>${d.prazniny.join(', ')}</strong>.
             Обикновено значи, че книгата не е вписана, а не че номерът е свободен.
           </div>`
        : '';

    if (!(d.redove || []).length) {
        spisak.innerHTML = `<div class="empty-text">Още няма вписани заповедни книги.</div>`;
        return;
    }

    const znak = { 'издадена': '', 'заменена': '🔴', 'анулирана': '🔴' };
    spisak.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
                <tr style="text-align:left;border-bottom:1px solid var(--border)">
                    <th style="padding:6px 8px">№</th>
                    <th style="padding:6px 8px">Дата</th>
                    <th style="padding:6px 8px">Обект</th>
                    <th style="padding:6px 8px">ПИ</th>
                    <th style="padding:6px 8px">Статус</th>
                    <th style="padding:6px 8px">Бележка</th>
                    <th style="padding:6px 8px"></th>
                </tr>
            </thead>
            <tbody>
            ${d.redove.map(r => `
                <tr style="border-bottom:1px solid var(--border);cursor:pointer"
                    onclick="popalniZK(${JSON.stringify(r).replace(/"/g, '&quot;')})">
                    <td style="padding:6px 8px;font-weight:600">${r.nomer}</td>
                    <td style="padding:6px 8px">${r.data || '—'}</td>
                    <td style="padding:6px 8px">${r.obekt || '—'}</td>
                    <td style="padding:6px 8px">${r.pi || '—'}</td>
                    <td style="padding:6px 8px">${znak[r.status] || ''} ${r.status}${
                        r.sledvashta ? ` → № ${r.sledvashta}` : ''}</td>
                    <td style="padding:6px 8px;color:var(--muted)">${r.belejka || ''}</td>
                    <td style="padding:6px 8px;text-align:right">${r.status === 'издадена'
                        ? `<button class="btn btn-ghost btn-sm" title="Грешно генерирана — анулира номера"
                              onclick="event.stopPropagation();anulirajZK(${JSON.stringify(r).replace(/"/g, '&quot;')})">Анулирай</button>`
                        : ''}</td>
                </tr>`).join('')}
            </tbody>
        </table>
        <p style="font-size:12px;color:var(--muted);margin-top:10px">
            Щракване върху ред го зарежда в полетата горе за поправка.
        </p>`;
}

function popalniZK(r) {
    document.getElementById('zk-nomer').value      = r.nomer || '';
    document.getElementById('zk-data').value       = r.data || '';
    document.getElementById('zk-obekt').value      = r.obekt || '';
    document.getElementById('zk-pi').value         = r.pi || '';
    document.getElementById('zk-status').value     = r.status || 'издадена';
    document.getElementById('zk-sledvashta').value = r.sledvashta || '';
    document.getElementById('zk-belejka').value    = r.belejka || '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Грешно генерирана книга се анулира, не се трие: номерът остава в поредицата.
// Ако след нея още няма издадена, регистърът ще го даде отново на следващото
// генериране — пробата не оставя дупка. Анулирана в средата остава завинаги.
async function anulirajZK(r) {
    if (!confirm(`Анулирай заповедна книга № ${r.nomer}?

` +
                 `Ако след нея няма издадена, номерът ще се даде отново при ` +
                 `следващото генериране. Иначе остава анулиран в поредицата.`)) return;
    try {
        await apiCall('/api/zk', 'POST', {
            ...r,
            status: 'анулирана',
            belejka: [r.belejka, `анулирана ${new Date().toLocaleDateString('bg-BG')}`]
                        .filter(Boolean).join('; '),
        });
        // Паспортът на обекта да не показва анулирания номер като свой.
        const p = appData.projects.find(x => x.pi && x.pi === r.pi && String((x.zk || {}).number) === String(r.nomer));
        if (p) {
            p.zk = { ...(p.zk || {}), number: '' };
            saveData();
        }
        showAlert('success', `Заповедна книга № ${r.nomer} е анулирана`);
        renderZK();
    } catch (e) {
        showAlert('error', e.message);
    }
}

async function zapishiZK() {
    const nomer = document.getElementById('zk-nomer').value.trim();
    if (!nomer) { showAlert('error', 'Номерът е задължителен'); return; }
    try {
        await apiCall('/api/zk', 'POST', {
            nomer,
            data:       document.getElementById('zk-data').value.trim(),
            obekt:      document.getElementById('zk-obekt').value.trim(),
            pi:         document.getElementById('zk-pi').value.trim(),
            status:     document.getElementById('zk-status').value,
            sledvashta: document.getElementById('zk-sledvashta').value.trim(),
            belejka:    document.getElementById('zk-belejka').value.trim(),
        });
        showAlert('success', `Заповедна книга № ${nomer} е вписана`);
        ['zk-nomer','zk-data','zk-obekt','zk-pi','zk-sledvashta','zk-belejka']
            .forEach(id => document.getElementById(id).value = '');
        document.getElementById('zk-status').value = 'издадена';
        renderZK();
    } catch (e) {
        showAlert('error', e.message);
    }
}

async function zapishiNachalen() {
    const n = document.getElementById('zk-nachalen').value.trim();
    if (!n) { showAlert('error', 'Въведете начален номер'); return; }
    try {
        await apiCall('/api/zk/nachalen', 'POST', { nachalen: n });
        showAlert('success', `Регистърът тръгва от № ${n}`);
        renderZK();
    } catch (e) {
        showAlert('error', e.message);
    }
}

async function proveriZK(nomer) {
    // Свети ли червено: книгата заменена ли е, анулирана ли е, има ли бележка.
    const kutiya = document.getElementById('zk-preduprezhdenie');
    if (!kutiya || !nomer) return;
    try {
        const d = await apiCall(`/api/zk/proverka?nomer=${encodeURIComponent(nomer)}`);
        if (d.cherveno) {
            kutiya.innerHTML = `<div class="alert alert-error" style="margin:12px 0 0">
                🔴 ${d.sabshtenie}</div>`;
        } else if (!d.vpisana) {
            kutiya.innerHTML = `<div class="alert alert-warning" style="margin:12px 0 0">
                ⚠️ ${d.sabshtenie}
                <button class="btn btn-secondary btn-sm" style="margin-left:8px"
                        onclick="navigateTo('zk')">📓 Регистър</button></div>`;
        } else {
            kutiya.innerHTML = '';
        }
    } catch (e) {
        kutiya.innerHTML = '';
    }
}

// ═══════════════════════════════════════════════════════════
//  ALERTS
// ═══════════════════════════════════════════════════════════
function showAlert(type, message, duration = 6000) {
    const container = document.getElementById('alerts-container');
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.innerHTML = `<span>` + (type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️') + `</span><span>${message}</span>`;
    container.prepend(div);
    setTimeout(() => div.remove(), duration);
}

// ═══════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════