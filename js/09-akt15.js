// Стандартният текст за състоянието около строежа. Операторът, 14.10.2026:
// дървесността и състоянието имат готови формулировки — пишат се само когато
// случаят е различен. Стоеше в „АИ протоколи“; премести се тук, когато онзи
// екран отпадна.
const SASTOYANIE_DEFAULT = 'пътните и тротоарни настилки по прилежащата улица са в добро състояние, съседните имоти няма да бъдат засягани от бъдещото строителство';

// АКТ СИСТЕМ · 09-akt15.js
// Акт 15 за сграда; търсачката в КИИП
//
// Отделен от app.js на 13.10.2026 (стъпка 2 от ПОДРЕЖДАНЕ.md).
// Файловете се включват по РЕД и споделят едно и също глобално
// пространство — точно както беше в единия скрипт.

//  АКТ 15 (СГРАДА)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
//  КОТИТЕ ИДВАТ ОТ ПОТВЪРДЕНОТО (14.10.2026)
// ═══════════════════════════════════════════════════════════
// Дотук котите се въвеждаха на ръка на три места — тук, в Протокол 2 и в АИ
// протоколите. Разминат ли се, документите си противоречат и никой не вижда.
// Сега се четат от проекта и се потвърждават ВЕДНЪЖ, в „Проверки“.
//
// Полето остава: операторът го вижда и може да го промени за този документ.
// Променено тук, то НЕ се връща назад — потвърденото се пипа само в Проверки.

// Кое поле на модала от кой признак се пълни.
const _KOTI_POLETA = {
    'p2-kota-izkop': 'kota_izkop', 'p2-kota-cokul': 'kota_cokul',
    'p2-kota-korniz': 'korniz_post', 'p2-kota-bilo': 'kota_bilo',
    'p2-reper-nomer': 'reper_nomer', 'p2-reper-kota': 'reper_kota',
};
// В Акт 15 „a15-kota-*“ НЕ са коти, а ДАТИ на заверка на нивата
// („Ниво изкоп — заверен на дд.мм.гггг“). Одитът беше сбъркал реда; те
// отиват при датите, които системата знае и пита. (14.10.2026)

// Само ПОТВЪРДЕНОТО влиза в документ. Предложено, но непотвърдено, не се слага
// — иначе операторът подписва нещо, което не е виждал.
function _kotaPotvardena(klyuch) {
    const obekt = _zhivObekt();
    if (!obekt) return null;
    const f = (_stroezh(obekt).fakti || {})[klyuch];
    if (!f || !['potvardeno', 'popraveno'].includes(f.sastoyanie)) return null;
    const v = String(f.stoynost || '').trim();
    return v || null;
}

// Пълни празните полета на отворения модал. Не пипа вече написаното.
function _napalniKoti(prefiks) {
    let napalneni = 0, lipsvat = [];
    for (const [id, klyuch] of Object.entries(_KOTI_POLETA)) {
        if (!id.startsWith(prefiks)) continue;
        const el = document.getElementById(id);
        if (!el) continue;
        const v = _kotaPotvardena(klyuch);
        if (v && !el.value.trim()) { el.value = v; napalneni++; }
        else if (!v) lipsvat.push(_KES_IME[klyuch] || klyuch);
    }
    return { napalneni, lipsvat };
}

// Ред под полетата: откъде са дошли и какво още липсва.
function _kotiBelejka(kutiyaId, r) {
    const kutiya = document.getElementById(kutiyaId);
    if (!kutiya) return;
    if (!r.napalneni && !r.lipsvat.length) { kutiya.innerHTML = ''; return; }
    kutiya.innerHTML = `
        ${r.napalneni ? `<div style="font-size:12px;color:#2e6b32">
            ✓ ${r.napalneni} ${r.napalneni === 1 ? 'стойност е взета' : 'стойности са взети'}
            от потвърденото в „Проверки“ — промяната тук важи само за този документ.</div>` : ''}
        ${r.lipsvat.length ? `<div style="font-size:12px;color:#8a6400;margin-top:3px">
            [___] Непотвърдено в „Проверки“: ${r.lipsvat.map(_s2esc).join(', ')} —
            впиши тук или го потвърди там, за да важи навсякъде.</div>` : ''}`;
}

// ═══════════════════════════════════════════════════════════
//  ДАТИТЕ В АКТ 15 — СИСТЕМАТА ГИ ЗНАЕ, НО ПИТА (14.10.2026)
// ═══════════════════════════════════════════════════════════
// Операторът: „Системата може да знае кога е съставен даден документ, но
// понякога датите се променят, затова е необходимо да пита за дата.“
//
// Затова нищо не се попълва мълчаливо: полето идва попълнено, до него пише
// откъде е, и операторът го вижда преди да подпише. Промяна ТУК важи само за
// този документ — досието се пипа в паспорта.

// Откъде се пълни всяко поле на модала.
//   dd      — docDates на обекта (датите на съставените документи)
//   zk      — регистърът на заповедните книги
//   registar— регистърът на собствеността
const _A15_IZVORI = [
    ['a15-prot2-date',  'dd', 'protokol2',  'Протокол 2'],
    ['a15-obr3-date',   'dd', 'obrazec3',   'Констативен акт обр. 3'],
    ['a15-akt14-date',  'dd', 'akt14',      'Акт 14'],
    ['a15-zk-number',   'zk', 'number',     'регистъра на заповедните книги'],
    ['a15-zk-date',     'dd', 'zk_zaverka', 'заверката на заповедната книга'],
    ['a15-akt7-br',     'dd', 'akt7.br',    'Актовете обр. 7'],
    ['a15-akt7-ot',     'dd', 'akt7.ot',    'Актовете обр. 7'],
    ['a15-akt7-do',     'dd', 'akt7.do',    'Актовете обр. 7'],
    ['a15-upulnomoshnik', 'registar', '',   'регистъра на собствеността'],
];

// Актовете обр. 12 са по части: полето „арх“ иска частта „Архитектура“.
const _A15_AKT12 = { arh: 'Архитектура', vik: 'ВиК', el: 'Електро', ovk: 'ОВК и ЕЕ' };

function _a15Stoynost(obekt, vid, klyuch) {
    const p = _stroezh(obekt);
    if (vid === 'zk') return String((p.zk || obekt.zk || {})[klyuch] || '').trim();
    if (vid === 'registar') {
        return (typeof _sbPredstavitel === 'function' && (obekt.sobstvenost || p.sobstvenost))
            ? _sbPredstavitel(obekt.sobstvenost ? obekt : p, '') : '';
    }
    const dd = p.docDates || obekt.docDates || {};
    const [ime, pole] = klyuch.split('.');
    const v = dd[ime];
    if (v === undefined || v === null) return '';
    return String(pole ? (v[pole] ?? '') : v).trim();
}

// Пълни празните полета. Не пипа написаното на ръка.
function _a15Napalni() {
    const obekt = _zhivObekt();
    if (!obekt) return { vzeti: [], lipsvat: [] };
    const p = _stroezh(obekt);
    const vzeti = [], lipsvat = [];

    for (const [id, vid, klyuch, otkade] of _A15_IZVORI) {
        const el = document.getElementById(id);
        if (!el) continue;
        const v = _a15Stoynost(obekt, vid, klyuch);
        if (v && !el.value.trim()) { el.value = v; vzeti.push(otkade); }
        else if (!v && !el.value.trim()) lipsvat.push(otkade);
    }

    const akt12 = (p.docDates || {}).akt12 || {};
    for (const [kratko, chast] of Object.entries(_A15_AKT12)) {
        const rec = akt12[chast] || {};
        for (const pole of ['br', 'ot', 'do']) {
            const el = document.getElementById(`a15-akt12-${kratko}-${pole}`);
            if (!el || el.value.trim()) continue;
            const v = String(rec[pole] || '').trim();
            if (v) { el.value = v; vzeti.push('Акт 12 ' + chast); }
        }
    }
    return { vzeti: [...new Set(vzeti)], lipsvat: [...new Set(lipsvat)] };
}

function _a15Belejka(r) {
    const kutiya = document.getElementById('a15-dati-belejka');
    if (!kutiya) return;
    kutiya.innerHTML = `
        ${r.vzeti.length ? `<div style="font-size:12px;color:#2e6b32">
            ✓ Попълнено от досието: ${r.vzeti.map(_s2esc).join(', ')}.
            <strong>Провери датите</strong> — понякога се променят; промяна тук важи само за този документ.</div>` : ''}
        ${r.lipsvat.length ? `<div style="font-size:12px;color:#8a6400;margin-top:3px">
            [___] Няма в досието: ${r.lipsvat.map(_s2esc).join(', ')} — впиши тук или ги впиши в паспорта.</div>` : ''}`;
}

function showAkt15Form() {
    if (!appData.currentProject) {
        showAlert('error', 'Изберете активен проект преди да генерирате Акт 15!');
        return;
    }
    // Reset result area
    document.getElementById('akt15-modal-result').style.display = 'none';
    document.getElementById('akt15-modal-result-body').innerHTML = '';
    document.getElementById('akt15-modal-loading').style.display = 'none';
    document.getElementById('modal-akt15').classList.add('open');
    _a15Belejka(_a15Napalni());
}

function showProtokol2Form() {
    if (!appData.currentProject) {
        showAlert('error', 'Изберете активен проект преди да генерирате Протокол 2!');
        return;
    }
    document.getElementById('p2-modal-status').innerHTML = '';
    _kotiBelejka('p2-koti-belejka', _napalniKoti('p2-'));
    const btn = document.getElementById('p2-generate-btn');
    btn.disabled = false;
    btn.textContent = '📥 Генерирай Протокол 2 (.docx)';

    // Wire up radio buttons for дървесност
    document.querySelectorAll('input[name="p2-darv-radio"]').forEach(r => {
        r.onchange = () => {
            const ta = document.getElementById('p2-darvesenost');
            ta.style.display = (r.value === 'има' && r.checked) ? 'block' : 'none';
        };
    });
    // Wire up custom состояние checkbox
    document.getElementById('p2-sastoyanie-custom').onchange = function() {
        document.getElementById('p2-sastoyanie').style.display = this.checked ? 'block' : 'none';
    };

    renderSignersChecklist('p2-signers', appData.currentProject);
    document.getElementById('modal-protokol2').classList.add('open');
}

async function runProtokol2Modal() {
    const project = appData.currentProject;
    const railwayUrl = (appData.apiUrl || '').replace(/\/$/, '');
    const extra = window.aiSession?._pendingExtra || {};
    const consultant = window.aiSession?._pendingConsultant ||
        appData.consultants.find(c => c.id === project?.consultant?.id);

    const btn = document.getElementById('p2-generate-btn');
    const status = document.getElementById('p2-modal-status');
    btn.disabled = true;
    btn.textContent = '⏳ Генериране...';
    status.innerHTML = '';

    try {
        const izkop    = document.getElementById('p2-kota-izkop')?.value?.trim() || '';
        const cokul    = document.getElementById('p2-kota-cokul')?.value?.trim() || '';
        const korniz   = document.getElementById('p2-kota-korniz')?.value?.trim() || '';
        const bilo     = document.getElementById('p2-kota-bilo')?.value?.trim() || '';
        const reperNom = document.getElementById('p2-reper-nomer')?.value?.trim() || '';
        const reperKota = document.getElementById('p2-reper-kota')?.value?.trim() || '';
        const opisanie = document.getElementById('p2-opisanie-ploshtadka')?.value?.trim() || '';

        const darvRadio = document.querySelector('input[name="p2-darv-radio"]:checked');
        const darvValue = (darvRadio?.value === 'има')
            ? (document.getElementById('p2-darvesenost')?.value?.trim() || '')
            : '';

        const sastoyanieCustom = document.getElementById('p2-sastoyanie-custom')?.checked;
        const sastoyanieValue = sastoyanieCustom
            ? (document.getElementById('p2-sastoyanie')?.value?.trim() || SASTOYANIE_DEFAULT)
            : SASTOYANIE_DEFAULT;

        const passportRows = buildPassportRows(project, consultant,
            { ...extra, signers: readSigners('p2-signers') });
        passportRows.push(
            ['Opisanie_Ploshtadka',  opisanie],
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
        const filename = 'protokol2_' + project.pi + '.docx';
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl; a.download = filename; a.click();
        URL.revokeObjectURL(dlUrl);

        btn.disabled = false;
        btn.textContent = '📥 Генерирай Протокол 2 (.docx)';
        status.innerHTML = '<span style="color:var(--green)">✅ Протокол 2 изтеглен успешно!</span>';
        addToHistory('generate', project.pi, 'Протокол 2 Combined (.docx)');

    } catch (err) {
        btn.disabled = false;
        btn.textContent = '📥 Генерирай Протокол 2 (.docx)';
        status.innerHTML = '<span style="color:var(--red)">❌ ' + err.message + '</span>';
        showAlert('error', '❌ Грешка: ' + err.message);
    }
}

function buildAkt15Prompt(d, m) {
    const akt12row = (label, r) =>
        r && r.br ? `  ${label}: ${r.br} бр., от ${r.ot || '—'} до ${r.do || '—'}` : `  ${label}: —`;

    return `Ти си опитен строителен надзорник с 20 години практика в България.
Съставяш Констативен акт образец 15 за установяване годността за приемане на строежа, съгласно Наредба №3 от 31.07.2003 г., чл.7, ал.3, т.15.

## СТЪПКА 0 — ПРОВЕРКА ПРЕДИ ГЕНЕРИРАНЕ
Преди да генерираш акта, провери дали всички задължителни полета са попълнени.
Ако някое липсва — СПРИ и изведи списък с липсващото. НЕ генерирай акта с [???] полета.

## ВХОДНИ ДАННИ ОТ СИСТЕМАТА
Строеж: ${d.stroej || '—'}
Местонахождение: ${d.address || '—'}
Консултант (СН): ${d.consultant || '—'}
Договор за консултантска дейност: ${d.dogovor_sn || '—'}
Строител: ${d.builder || '—'}
Технически ръководител: ${d.tech || '—'}
Проектантски колектив:
${d.projectants || '—'}
Екип СН по части:
${d.employees || '—'}

## РЪЧНО ВЪВЕДЕНИ ДАННИ ОТ ОПЕРАТОРА
РС Номер: ${d.rs_number || '—'}, Дата: ${d.rs_date || '—'}, Издател: ${d.rs_issuer || '—'}, В сила от: ${d.rs_in_force || '—'}
Одобрен проект дата: ${d.project_date || '—'}
Протокол 2 дата: ${m.prot2_date || '—'}
  - Ниво изкоп заверен на: ${m.kota_izkop || '—'}
  - Ниво цокъл заверен на: ${m.kota_cokul || '—'}
  - Ниво корниз заверен на: ${m.kota_korniz || '—'}
  - Ниво bilo заверен на: ${m.kota_bilo || '—'}
Образец 3 дата: ${m.obr3_date || '—'}
Заповедна книга №: ${m.zk_number || '—'}, дата: ${m.zk_date || '—'}
Актове обр.7: ${m.akt7_br || '—'} броя, от ${m.akt7_ot || '—'} до ${m.akt7_do || '—'}
Акт обр.14 дата: ${m.akt14_date || '—'}
Актове обр.12:
${akt12row('Архитектура', m.akt12_arh)}
${akt12row('ВиК', m.akt12_vik)}
${akt12row('Електро', m.akt12_el)}
${akt12row('ОВК', m.akt12_ovk)}
Скица на сграда №: ${m.skica_number || '—'}, дата: ${m.skica_date || '—'}
Договор ВиК: ${m.vik_dogovor || '—'}
Договор Ел.: ${m.el_dogovor || '—'}
Упълномощен представител: ${m.upulnomoshnik || '—'}
Заповед по чл.154 ЗУТ: ${m.zap154 || 'няма'}

## ПРИКАЧЕНИ ДОКУМЕНТИ — ИНСТРУКЦИИ ЗА ОБРАБОТКА

### ДОКУМЕНТ: Виза за проектиране (PDF)
Извлечи: номер, дата, издател, устройствена зона, всички показатели, пълното описание.
Използвай за раздел 2.1 „Градоустройство" — пълен технически текст в сегашно време.

### ДОКУМЕНТ: Одобрен проект (.docx)
За всяка намерена обяснителна записка → ПРЕФОРМАТИРАЙ в сегашно време.
Запази ВСИЧКИ технически данни: диаметри, напори, мощности, класове, нормативни препратки.
Части: 2.2 Архитектура, 2.3 Конструктивна, 2.4 Електротехническа, 2.5 ВиК, 2.6 ОВ, 2.7 ПБЗ, 2.8 Паркоустройство.
Технически показатели → таблица след 2.2.
НЕ съкращавай — минимален обем 200-400 думи на значима част.

### ДОКУМЕНТ: Скица на сграда (PDF)
Извлечи: номер и дата → за т.1.4

### ДОКУМЕНТ: Договор ВиК (PDF)
Извлечи: номер, дата, наименование → за т.1.5

### ДОКУМЕНТ: Договор Ел. (PDF)
Извлечи: номер/SAP, дата, наименование → за т.1.5

### ДОКУМЕНТИ: НА на апартаменти (PDF)
За всеки НА извлечи: собственик, №, том, рег., дело, дата, нотариус, пълномощник ако има.

### ДОКУМЕНТ: Заповед по чл.154 ЗУТ (PDF, ако е приложена)
Ако липсва → използвай стандартния текст за т.3.

## ПРАВИЛА ЗА РАЗДЕЛ 2
- Пълен технически текст, не резюме
- Запази всички числа, диаметри, мощности, нормативни препратки
- Преформатирай в сегашно време ("предвижда се" → "е изпълнено")
- Структурирай с подзаглавия (напр. ВиК: Водопровод / Канализация / Противопожарни)

## СТАНДАРТНИ ТЕКСТОВЕ

### Т.3 — Без отклонения:
"В процеса на строителство не са настъпили съществени отклонения по смисъла на чл. 154, ал. 2 ЗУТ спрямо одобрените проекти."

### Т.3 — При заповед по чл.154:
"В процеса на строителство са настъпили изменения, за които е издадена Заповед №[номер]/[дата] по чл.154, ал.5 от ЗУТ от [издател]."

### Т.4:
"Строителната площадка е напълно разчистена — премахнати са оградите и постройките от временното строителство и са извозени строителните отпадъци."

### Т.5:
"По време на строителството са взети необходимите мерки за запазване от повреди на околното пространство /проводи, съоръжения, тротоари, бордюри, настилки, стълбове, зелени площи, декоративни дървета, огради и др./. Околното пространство е възстановено напълно — тротоарна настилка, бордюри, улично платно до състоянието преди откриване на строителната площадка."

### РЕШЕНИЕ т.1-6:
"1. Приемаме, че строежът е изпълнен съгласно одобрените инвестиционни проекти и изискванията към строежите по чл. 169, ал. 1 и 3 ЗУТ, условията на договора за строителство и че наличната строителна документация в достатъчна степен характеризира изпълненото строителство.
2. Всички СМР са изпълнени без недостатъци и забележки.
3. Всички обекти от временното строителство са премахнати.
4. Неразделна част от този акт са копия от документите съгласно описа на цялата строителна документация за строежа и протоколите от извършените изпитвания и измервания.
5. Упълномощаваме от името на всички възложители да ни представлява като единствен участник в процедурата по издаване на разрешение за ползване — ${m.upulnomoshnik || '[попълни]'}
6. Този акт е основание за съставяне на окончателен доклад от лицето, упражняващо строителен надзор. С този акт се извършва предаване на строежа от Строителя на Възложителя."

## ФОРМАТ НА ИЗХОДА
Генерирай пълния текст на Акт 15:
ПРИЛОЖЕНИЕ №15 → Заглавна част → А.Възложители (с НА данни) → Б.Проектанти → В.Строители → Г.СН → се събрахме... → След като прегледахме... → УСТАНОВИХМЕ т.1.1-1.5 → т.2.1-2.8 → т.3 → т.4 → т.5 → РЕШИХМЕ т.1-6 → СЪСТАВИЛИ (подписи А/Б/В/Г)

В края: БЕЛЕЖКИ ЗА ОПЕРАТОРА с всички незапълнени полета и предупреждения.

## ПРАВИЛА ЗА ФОРМАТИРАНЕ
- Датата на акта: оставя се празна "................ г."
- ЕГН: НЕ се включва никъде
- Ниво bilo (не "було")
- НЕ добавяй markdown в тялото на акта
- При ФЛ Възложител: само две имена, без ЕГН
- Пълномощници: ако има пълномощно → пълномощникът подписва; ако няма → собственикът лично`;
}

async function runAkt15Modal() {
    const project = appData.currentProject;
    if (!project) { showAlert('error', 'Няма активен проект!'); return; }

    const v = id => document.getElementById(id)?.value?.trim() || '';

    const manualData = {
        prot2_date:    v('a15-prot2-date'),
        kota_izkop:   v('a15-kota-izkop'),
        kota_cokul:   v('a15-kota-cokul'),
        kota_korniz:  v('a15-kota-korniz'),
        kota_bilo:    v('a15-kota-bilo'),
        obr3_date:    v('a15-obr3-date'),
        zk_number:        v('a15-zk-number'),
        zk_date:          v('a15-zk-date'),
        akt7_br:          v('a15-akt7-br'),
        akt7_ot:          v('a15-akt7-ot'),
        akt7_do:          v('a15-akt7-do'),
        akt14_date:       v('a15-akt14-date'),
        akt12_arh:  { br: v('a15-akt12-arh-br'), ot: v('a15-akt12-arh-ot'), do: v('a15-akt12-arh-do') },
        akt12_vik:  { br: v('a15-akt12-vik-br'), ot: v('a15-akt12-vik-ot'), do: v('a15-akt12-vik-do') },
        akt12_el:   { br: v('a15-akt12-el-br'),  ot: v('a15-akt12-el-ot'),  do: v('a15-akt12-el-do') },
        akt12_ovk:  { br: v('a15-akt12-ovk-br'), ot: v('a15-akt12-ovk-ot'), do: v('a15-akt12-ovk-do') },
        upulnomoshnik: v('a15-upulnomoshnik'),
    };

    // Collect files
    const fileInputIds = ['a15-file-project','a15-file-viza','a15-file-skica','a15-file-vik','a15-file-el','a15-file-na','a15-file-zap154'];
    const allFiles = [];
    for (const fid of fileInputIds) {
        const input = document.getElementById(fid);
        if (input?.files) Array.from(input.files).forEach(f => allFiles.push(f));
    }

    const loading = document.getElementById('akt15-modal-loading');
    const resultSection = document.getElementById('akt15-modal-result');
    const resultBody = document.getElementById('akt15-modal-result-body');
    loading.style.display = 'block';
    resultSection.style.display = 'none';

    try {
        const consultant = appData.consultants?.find(c => c.id === project.consultant?.id) || {};
        const cl = project.client || {};
        const b  = project.builder || {};
        const projectants = (project.projectants || []).map(p => `Част ${p.specialization}: ${p.title || ''} ${p.name || ''}, рег. № ${p.ppp || '—'}`.trim()).join('\n') || '—';
        const employees   = (project.employees || consultant.employees || []).map(e => `Част ${e.specialization}: ${e.title || ''} ${e.name || ''}`.trim()).join('\n') || '—';
        const d = {
            stroej:      project.stroej || '—',
            address:     project.address || '—',
            vozlagatel:  `${cl.name || '—'}${cl.eik ? ', ЕИК ' + cl.eik : ''}${cl.rep ? ', представлявано от ' + cl.rep : ''}`,
            rs_number:   project.permit?.number || '—',
            rs_date:     project.permit?.date   || '—',
            rs_issuer:   project.permit?.issuer || '—',
            rs_in_force: project.permit?.effective || '—',
            project_date: project.project_date || project.permit?.project_date || '—',
            dogovor_sn:  project.dogovor_sn || consultant.dogovor_sn || '—',
            consultant:  `${consultant.name || '—'}${consultant.eik ? ', ЕИК ' + consultant.eik : ''}${consultant.address ? ', ' + consultant.address : ''}, управител: ${consultant.manager || '—'}`,
            builder:     `${b.company || '—'}${b.eik ? ', ЕИК ' + b.eik : ''}${b.manager ? ', представлявано от ' + b.manager : ''}`,
            tech:        b.tech || '—',
            projectants,
            employees,
        };
        const prompt = buildAkt15Prompt(d, manualData);

        const manualForValidation = {
            ...manualData,
            rs_number:   d.rs_number,
            rs_date:     d.rs_date,
            rs_issuer:   d.rs_issuer,
            rs_in_force: d.rs_in_force,
        };

        const files = await Promise.all(allFiles.map(f => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve({
                name: f.name,
                media_type: f.type || 'application/octet-stream',
                data: e.target.result.split(',')[1]
            });
            reader.onerror = reject;
            reader.readAsDataURL(f);
        })));

        console.log('Prompt:', prompt?.substring(0, 100));

        const token = getToken();
        const apiUrl = (appData.apiUrl || '').replace(/\/$/, '');
        if (!apiUrl) throw new Error('API URL не е конфигуриран');

        const testMode = document.getElementById('a15-test-mode')?.checked || false;

        const response = await fetch(apiUrl + '/api/ai/generate-akt15-sgrada', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            },
            body: JSON.stringify({
                pi: project.pi,
                prompt: prompt,
                files: files,
                manual: manualForValidation,
                apartments: project.apartments || [],
                test_mode: testMode
            })
        });

        if (response.status === 401) { localStorage.removeItem('akt_token'); showLoginScreen(); throw new Error('Сесията е изтекла.'); }
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'HTTP ' + response.status }));
            throw new Error(err.error || 'HTTP ' + response.status);
        }

        const data = await response.json();
        window._akt15LastData = data;
        loading.style.display = 'none';

        // Генерирай .docx от текста и свали
        console.log('docx:', typeof docx, typeof window.docx);
        if (data.result) {
            const { Document, Packer, Paragraph, TextRun, AlignmentType } = docx;

            const paragraphs = data.result.split('\n').map(line =>
                new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [new TextRun({
                        text: line,
                        size: 22,
                        font: "Times New Roman"
                    })]
                })
            );

            const doc = new Document({
                sections: [{
                    properties: {
                        page: {
                            size: { width: 11906, height: 16838 },
                            margin: { top: 1134, right: 850, bottom: 1134, left: 1701 }
                        }
                    },
                    children: paragraphs
                }]
            });

            Packer.toBlob(doc).then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Akt_15_PI-${project.pi}.docx`;
                a.click();
                URL.revokeObjectURL(url);
            });

            showAlert('success', '✅ Акт 15 е генериран — файлът се сваля!');
        }

        const v = data.validation;
        let validationHTML = '';
        if (v) {
            const statusConfig = {
                green:  { icon: '✅', color: '#2d7d52', bg: '#e6f4ec', label: 'Готов за преглед' },
                yellow: { icon: '⚠️', color: '#c9952a', bg: '#fdf3dc', label: 'Има предупреждения' },
                red:    { icon: '❌', color: '#b33030', bg: '#fce8e8', label: 'Липсват данни' }
            };
            const cfg = statusConfig[v.status] || statusConfig.yellow;

            const errorsList = (v.errors || []).map(e => `<li style="margin-bottom:4px">${e.message}</li>`).join('');
            const warningsList = (v.warnings || []).map(w => `<li style="margin-bottom:4px">${w.message}</li>`).join('');

            validationHTML = `
            <div style="margin-top:16px;padding:14px 16px;border-radius:8px;background:${cfg.bg};border:1px solid ${cfg.color}33">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                    <span style="font-size:18px">${cfg.icon}</span>
                    <span style="font-weight:700;color:${cfg.color}">Валидация — ${cfg.label}</span>
                </div>
                <div style="font-size:12px;color:#666;margin-bottom:8px">${v.summary}</div>
                ${errorsList ? `<div style="margin-top:8px"><strong style="font-size:12px;color:${statusConfig.red.color}">Липсващи задължителни полета:</strong><ul style="margin:4px 0 0 18px;font-size:12px">${errorsList}</ul></div>` : ''}
                ${warningsList ? `<div style="margin-top:8px"><strong style="font-size:12px;color:${statusConfig.yellow.color}">Предупреждения:</strong><ul style="margin:4px 0 0 18px;font-size:12px">${warningsList}</ul></div>` : ''}
            </div>`;
        }

        resultBody.innerHTML = `
            <div style="padding:12px 0">
                <div style="font-size:32px;margin-bottom:6px">✅</div>
                <div style="font-weight:700;font-size:15px;margin-bottom:8px">Акт 15 е генериран!</div>
                <button class="btn btn-secondary" onclick="navigator.clipboard.writeText(window._akt15LastData?.result||'').then(()=>showAlert('success','Копирано!'))">📋 Копирай текст</button>
                <hr style="margin:14px 0">
                <div style="white-space:pre-wrap;font-size:12px;max-height:400px;overflow-y:auto;background:#f8f9fa;padding:12px;border-radius:6px">${(data.result || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                ${data.input_tokens ? `<div style="font-size:11px;color:#888;margin-top:8px">Токени: ${data.input_tokens.toLocaleString()} вх. / ${data.output_tokens.toLocaleString()} изх.</div>` : ''}
                ${validationHTML}
            </div>`;
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
        resultBody.innerHTML = `<div class="alert alert-error">❌ ${err.message}</div>`;
        resultSection.style.display = 'block';
        showAlert('error', 'Грешка: ' + err.message);
    } finally {
        loading.style.display = 'none';
    }
}

function addToHistory(type, pi, description) {
    if (!appData.history) appData.history = [];
    appData.history.unshift({ type, pi, description, date: new Date().toISOString() });
    saveData();
    kachiIstoriaSledMalko();
}

function formatDateInput(input) {
    // Автоматично форматира дата при въвеждане: 26042024 → 26.04.2024
    let v = input.value.replace(/\D/g, ''); // само цифри
    if (v.length >= 2) v = v.slice(0,2) + '.' + v.slice(2);
    if (v.length >= 5) v = v.slice(0,5) + '.' + v.slice(5);
    if (v.length > 10) v = v.slice(0,10);
    input.value = v;
}

// ═══════════════════════════════════════════════════════════
//  КИИП ТЪРСАЧКА
// ═══════════════════════════════════════════════════════════
let kiipData = null;
let kiipLoading = false;

async function loadKiipData() {
    if (kiipData) return kiipData;
    if (kiipLoading) return null;
    kiipLoading = true;
    try {
        const res = await fetch('https://tania141.github.io/cbt-system-/kiip.json');
        kiipData = await res.json();
        console.log('КИИП регистър зареден:', kiipData.length, 'записа');
    } catch(e) {
        console.warn('КИИП не е зареден:', e.message);
        kiipData = [];
    }
    kiipLoading = false;
    return kiipData;
}

async function kiipSearch(i, query) {
    query = query.trim().toUpperCase();
    const dropdown = document.getElementById('kiip-dropdown-' + i);
    if (!dropdown) return;

    if (query.length < 2) { dropdown.style.display = 'none'; return; }

    const data = await loadKiipData();
    if (!data || !data.length) {
        dropdown.innerHTML = '<div style="padding:8px;font-size:12px;color:var(--muted)">КИИП регистърът не е зареден</div>';
        dropdown.style.display = 'block';
        return;
    }

    // Търсим по номер или по части от името
    const isNum = /^\d+$/.test(query);
    let results = [];
    if (isNum) {
        results = data.filter(e => e.ppp.startsWith(query)).slice(0, 10);
    } else {
        const words = query.split(/\s+/).filter(w => w.length >= 2);
        results = data.filter(e => words.every(w => e.name.includes(w))).slice(0, 10);
    }

    if (!results.length) {
        dropdown.innerHTML = '<div style="padding:8px;font-size:12px;color:var(--muted)">Няма намерени проектанти</div>';
        dropdown.style.display = 'block';
        return;
    }

    dropdown.innerHTML = results.map(r => `
        <div onclick="selectKiipEntry(${i}, '${r.ppp}', '${r.name.replace(/'/g, "\\'")}', this)"
             style="padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border)"
             onmouseenter="this.style.background='var(--surface-2)'"
             onmouseleave="this.style.background=''">
            <span style="font-weight:700;color:var(--gold)">${r.ppp}</span>
            <span style="margin-left:8px">${r.name}</span>
        </div>`).join('');
    dropdown.style.display = 'block';
}

function selectKiipEntry(i, ppp, name, el) {
    // Попълваме полетата
    const nameInput = el.closest('[style*="position:relative"]')?.querySelector('input');
    const pppInput = document.getElementById('ppp-input-' + i);
    if (nameInput) {
        nameInput.value = name.charAt(0) + name.slice(1).toLowerCase();
        updateProjectant(i, 'name', nameInput.value);
    }
    if (pppInput) {
        pppInput.value = ppp;
        updateProjectant(i, 'ppp', ppp);
    }
    // Затваряме dropdown
    const dropdown = document.getElementById('kiip-dropdown-' + i);
    if (dropdown) dropdown.style.display = 'none';
}

// Затваряме dropdowns при клик извън
document.addEventListener('click', function(e) {
    if (!e.target.classList.contains('kiip-search-input')) {
        document.querySelectorAll('[id^="kiip-dropdown-"]').forEach(d => d.style.display = 'none');
    }
});

// ═══════════════════════════════════════════════════════════