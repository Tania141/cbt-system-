// АКТ СИСТЕМ · 04-vhodni-dokumenti.js
// какво е налице срещу какво се изисква; слой 2
//
// Отделен от app.js на 13.10.2026 (стъпка 2 от ПОДРЕЖДАНЕ.md).
// Файловете се включват по РЕД и споделят едно и също глобално
// пространство — точно както беше в единия скрипт.

//  ВХОДНИ ДОКУМЕНТИ — какво е налице срещу какво се изисква
// ═══════════════════════════════════════════════════════════
// Списъкът с изисквани документи и условията за приложимост идват от чеклиста
// на оператора. Тук се вписва само какво е налице.

function dokRowHtml(ime, nomer) {
    return `<div class="dok-row" style="display:grid;grid-template-columns:2fr 1fr auto;gap:8px;margin-bottom:6px">
        <input type="text" class="form-input dok-ime" placeholder="Виза за проектиране"
               value="${(ime || '').replace(/"/g, '&quot;')}">
        <input type="text" class="form-input dok-nomer" placeholder="№ и дата"
               value="${(nomer || '').replace(/"/g, '&quot;')}">
        <button type="button" class="btn btn-ghost btn-sm"
                onclick="this.parentElement.remove()">✕</button>
    </div>`;
}

function addDokRow(ime, nomer) {
    const box = document.getElementById('fp-dok-rows');
    if (box) box.insertAdjacentHTML('beforeend', dokRowHtml(ime, nomer));
}

// Липсващият документ се вписва с бутон, не с преписване на ръка: съвпадението
// е по име, а имената в чеклиста са дълги („Становище от РСПБЗН за съответствие
// с нормите за пожарна безопасност“). Една буква разлика и редът мълчи.
function vpishiLipsvasht(ime64) {
    const ime = decodeURIComponent(ime64);
    let red = [...document.querySelectorAll('#fp-dok-rows .dok-row')]
        .find(r => (r.querySelector('.dok-ime')?.value || '').trim().toLowerCase()
                   === ime.toLowerCase());
    if (!red) {
        addDokRow(ime, '');
        red = document.querySelector('#fp-dok-rows .dok-row:last-child');
    }
    const nomer = red.querySelector('.dok-nomer');
    red.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nomer.focus();
}

// СВЕРЕНО И ЧЕКНАТО ЗНАЧИ ВПИСАНО.
// Операторът, 20.10.2026: „това го е прочел четецът, аз съм го чекнала и
// одобрила — защо не се е вписало?“. Дотук имаше три жеста за едно нещо:
// чекваш фактите, после „Впиши“, после „Запази“. Сега документът, чиито
// факти са сверени и който доказва ред от чеклиста, влиза сам — в обекта, не
// само в полето на екрана.
function _dokVpishi(p, ime, nomer, cheklistRed) {
    const k = x => String(x || '').trim().toLowerCase();
    if (!k(ime)) return false;
    const spisak = (p.dokumenti = p.dokumenti || []);
    // Намира се по две неща: по самото име, и по реда, който доказва. Второто
    // е заради старите записи — до 27.10.2026 тук се вписваше ИМЕТО НА РЕДА, а
    // не наименованието на документа. Без него същият документ влизаше втори
    // път и описът го показваше двойно.
    let red = spisak.find(d => k(d.ime) === k(ime));
    if (!red && k(cheklistRed))
        red = spisak.find(d => k(d.red || '') === k(cheklistRed)
                            || k(d.ime) === k(cheklistRed));
    if (!red) {
        spisak.push({ ime: String(ime).trim(), nomer: String(nomer || '').trim(),
                      red: String(cheklistRed || '').trim() });
        return true;
    }
    let pipnato = false;
    // Наименованието бие името на реда: описът сочи документа, не рубриката.
    if (k(red.ime) !== k(ime)) { red.ime = String(ime).trim(); pipnato = true; }
    if (!String(red.nomer || '').trim() && nomer) { red.nomer = String(nomer).trim(); pipnato = true; }
    if (!String(red.red || '').trim() && cheklistRed) { red.red = String(cheklistRed).trim(); pipnato = true; }
    return pipnato;
}

// Вписан ли е вече ред от чеклиста. Търси се по ДВЕТЕ: по името (както беше
// до 27.10.2026) и по реда, който документът доказва. Иначе всеки документ,
// вписан с истинското си наименование, изглеждаше невписан.
function _dokVpisanRed(p, red) {
    const k = x => String(x || '').trim().toLowerCase();
    if (!k(red)) return false;
    return (p.dokumenti || []).some(d => k(d.ime) === k(red) || k(d.red) === k(red));
}

// Какво име носи документът в описа. По ред: потвърденото наименование,
// късото заглавие от четеца, и чак накрая редът от чеклиста.
function _dokIme(d, potv) {
    // Потвърденото бие прочетеното: операторът може да е поправил наименованието
    // от хартията, а и да го е написал, когато четецът е върнал празно.
    const svereno = (potv || {})[`${_s2Id(d)}::naimenovanie`];
    if (svereno && String(svereno.stoynost || '').trim()) return String(svereno.stoynost).trim();
    const nai = String((d.naimenovanie || {}).stoynost || '').trim();
    if (nai && potv[`${_s2Id(d)}::naimenovanie`]) return nai;
    const vid = String(d.vid || '').trim();
    return vid || nai || String(d.cheklist_red || '').trim();
}

// Кои прочетени документи са сверени докрай.
// Кои факти НАИСТИНА се предлагат за сверяване на екрана: колоните на таблицата
// за този вид плюс „Общо за обекта“ (УПИ и идентификатор).
function _s2KlPoKoloni(d, koloni) {
    const fakti = new Map(_s2Fakti(d).map(x => [x.k, x]));
    const kl = [];
    for (const [, pole] of koloni) {
        const poleta = pole === '#razpr' ? [...fakti.keys()].filter(k => /^r\d+\./.test(k))
                     : Array.isArray(pole) ? pole : (String(pole).startsWith('#') ? [] : [pole]);
        for (const k of poleta) if (fakti.has(k)) kl.push(k);
    }
    return kl;
}

function _s2SverimiKl(d) {
    const t = _S2_TABLICI.find(x => (x.kodove ? x.kodove.includes(d.vid_kod) : true));
    const fakti = new Map(_s2Fakti(d).map(x => [x.k, x]));
    const kl = t ? _s2KlPoKoloni(d, t.koloni) : [];
    for (const k of ['obekt.upi', 'obekt.identifikator']) if (fakti.has(k)) kl.push(k);
    return [...new Set(kl)];
}

// Сверен = потвърдено е всичко, което екранът предлага за потвърждаване.
//
// Дотук се искаха ВСИЧКИ факти на документа. Но таблиците показват по 3–4
// колони; наименование, издател, позовавания и участници седят само в
// „Подробно“ и нямат бутон. Тоест сверен документ беше невъзможен: на 29.10.2026
// обект с 35 прочетени документа и 93 потвърдени факта даде 0 сверени, разделите
// 1.1–1.5 излязоха на точки, а броячът горе пишеше, че всичко е сверено.
function _s2Sveren(d, potv) {
    const kl = _s2SverimiKl(d);
    return kl.length > 0 && kl.every(k => potv[`${_s2Id(d)}::${k}`]);
}

function _dokVpishiSverenite(obekt, p, dokumenti, potv) {
    let n = 0;
    for (const d of dokumenti) {
        // ПРЕГРАДАТА Е ПОТВЪРЖДЕНИЕТО, НЕ ЧЕКЛИСТЪТ.
        // Операторът, 27.10.2026: „прочита документа, съобщава какъв е, ако
        // операторът го потвърди — този потвърден факт се записва в акт 15,
        // ОСИП, ОД или където системата иска“.
        //
        // Дотук се искаше и ред в чеклиста. Но чеклистът отговаря на „какво
        // липсва“, а описът — на „какво имам“. Минаваше ли второто през
        // първото, всеки документ без ред изчезваше тихо от акта. А чеклистът
        // тепърва се учи от оператора и е нарочно малък — малък чеклист плюс
        // преграда значи изгубени документи.
        if (!_s2Sveren(d, potv)) continue;
        const nomer = [d.nomer && d.nomer.stoynost ? '№ ' + d.nomer.stoynost : '',
                       d.data && d.data.stoynost ? 'от ' + d.data.stoynost : '']
            .filter(Boolean).join(' ');
        if (_dokVpishi(p, _dokIme(d, potv), nomer, d.cheklist_red)) n++;
    }
    if (n) {
        renderDokumenti(p);
        _s2ZapishiTiho(obekt, `Изходни данни: вписани ${n} сверени документа`);
    }
    return n;
}

function renderDokumenti(project) {
    const box = document.getElementById('fp-dok-rows');
    if (!box) return;
    box.innerHTML = '';
    ((project && project.dokumenti) || []).forEach(d => addDokRow(d.ime, d.nomer));
}

function readDokumenti() {
    return [...document.querySelectorAll('#fp-dok-rows .dok-row')]
        .map(r => ({ ime:   r.querySelector('.dok-ime')?.value.trim() || '',
                     nomer: r.querySelector('.dok-nomer')?.value.trim() || '' }))
        .filter(d => d.ime);
}

// Коя фаза е показана последно — за да се пречертае същата след „не се отнася“.
let _dokFaza = 'osip';

async function proveriDokumenti(faza) {
    _dokFaza = faza || _dokFaza || 'osip';
    const kutiya = document.getElementById('fp-dok-rezultat');
    kutiya.innerHTML = '<p style="font-size:13px;color:var(--muted)">Проверявам…</p>';
    const dok = readDokumenti();
    const p = _zhivObekt() || {};
    const rows = _cheklistRows(p, dok);
    try {
        if (typeof kandZaredi === 'function') await kandZaredi();
        const r = await apiCall('/api/cheklist', 'POST',
                                { passport: rows, faza: _dokFaza, neotnasya: p.neotnasya || [],
                                  sobstveni: typeof kandSobstveni === 'function' ? kandSobstveni() : [] });
        if (r.greshka) { kutiya.innerHTML = `<div class="alert alert-warning" style="margin:0">⚠️ ${r.greshka}</div>`; return; }
        const po = st => r.redove.filter(x => x.sastoyanie === st);
        const lipsvat = po('не е доказано'), precenka = po('за преценка'),
              nalice = po('налице'), neot = po('не се отнася');
        const ime = x => encodeURIComponent(x.dokument);
        const red = (znak, x, obyasnenie, butoni) => `
            <div style="font-size:13px;padding:3px 0;display:flex;gap:8px;align-items:baseline">
                <span style="flex:1">${znak} <strong>${x.dokument}</strong>
                    <span style="color:var(--muted)">${obyasnenie}</span></span>${butoni}
            </div>`;
        const bVpishi = x => `<button type="button" class="btn btn-ghost btn-sm"
                onclick="vpishiLipsvasht('${ime(x)}')">Впиши</button>`;
        const bNeOt = x => `<button type="button" class="btn btn-ghost btn-sm"
                onclick="neSeOtnasya('${ime(x)}', true)">Не се отнася</button>`;
        const zaglavie = _dokFaza === 'od' ? 'за Акт 15 / окончателен доклад' : 'за ОСИП';
        kutiya.innerHTML = `
            <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;
                        letter-spacing:1px;margin-bottom:6px">Чеклист ${zaglavie}</div>
            <div class="alert ${lipsvat.length ? 'alert-warning' : 'alert-success'}" style="margin:0 0 10px">
                ${lipsvat.length ? `⏳ Липсват ${lipsvat.length} от ${r.iziskvani} изисквани документа.`
                                 : `✅ Всички ${r.iziskvani} изисквани документа са налице.`}
                ${precenka.length ? ` · ❔ ${precenka.length} за преценка.` : ''}
            </div>
            ${lipsvat.map(x => red(x.lipsva_nomer ? '№' : '⏳', x,
                '— ' + (x.lipsva_nomer ? 'вписан е, но без ' + x.dokazva_se
                        : x.uslovie + (x.dokazva_se ? ' · доказва се с ' + x.dokazva_se : '')),
                bVpishi(x) + (x.precenka ? bNeOt(x) : ''))).join('')}
            ${precenka.length ? `<div style="font-size:12px;color:var(--muted);margin:10px 0 4px">
                Зависи от обстоятелства, които паспортът не знае — впиши или отбележи:</div>` : ''}
            ${precenka.map(x => red('❔', x, x.dokazva_se ? '— доказва се с ' + x.dokazva_se : '',
                bVpishi(x) + bNeOt(x))).join('')}
            ${nalice.map(x => `<div style="font-size:13px;padding:3px 0;color:var(--green)">✓ ${x.dokument}</div>`).join('')}
            ${neot.map(x => red('<span style="color:var(--muted)">—</span>', x,
                '<span style="color:var(--muted)">— не се отнася за обекта</span>',
                `<button type="button" class="btn btn-ghost btn-sm"
                    onclick="neSeOtnasya('${ime(x)}', false)">Върни</button>`)).join('')}`;
    } catch (e) {
        kutiya.innerHTML = `<div class="alert alert-error" style="margin:0">❌ ${e.message}</div>`;
    }
}

// „Не се отнася“ — отбелязва се веднъж и се пази в обекта, за да не пита пак.
function neSeOtnasya(ime64, da) {
    const p = _zhivObekt();
    if (!p) return;
    const ime = decodeURIComponent(ime64);
    const spisak = new Set(p.neotnasya || []);
    if (da) spisak.add(ime); else spisak.delete(ime);
    p.neotnasya = [...spisak];
    _zapishiObekt(p, da ? `„${ime}“ — не се отнася за обекта` : `„${ime}“ — върнат за преценка`);
    proveriDokumenti(_dokFaza);
}

// Признаците за чеклиста — едни и същи за ръчната проверка и за слой 2.
// Живеят в паспорта, а проверката е на своя страница — затова се четат от
// ЗАПИСАНИЯ обект: промяна в паспорта важи, след като се запази.
function _cheklistRows(p, dok) {
    return [
        ['Категория_Номер', p.kategoria || ''],
        ['Предназначение', p.prednaznachenie || ''],
        ['Вид', p.vid || ''],
        ['Повод', p.povod || ''],
        ['СПО', (p.spo || []).join('; ')],
        ['Паметник', p.pametnik ? 'да' : 'не'],
        ['Защитена_Зона', p.zashtitena ? 'да' : 'не'],
        ['Опасни_Вещества', p.opasni ? 'да' : 'не'],
        ['Води', p.vodi ? 'да' : 'не'],
        ['Документи_Брой', dok.length],
        ...dok.flatMap((d, i) => [[`Документ_${i+1}_Име`, d.ime],
                                  [`Документ_${i+1}_Номер`, d.nomer]]),
    ];
}

// ── Слой 2: АИ-то чете документите, кодът ги сравнява ────────────────────────
// Файл по файл — сканът на 15 страници се чете до минута. Пазят се само
// фактите (p.sloy2.od.dokumenti), не файловете; сравнението е само код и се
// пуска наново без ново четене.
const _s2esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// „1-4, 20“ → множество от страници; празно → null (целият файл).
function _s2Obhvat(txt) {
    txt = String(txt || '').trim();
    if (!txt) return null;
    const s = new Set();
    for (const ch of txt.split(/[,;\s]+/)) {
        const m = ch.match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
        if (!m) continue;
        const a = +m[1], b = +(m[2] || m[1]);
        for (let k = Math.min(a, b); k <= Math.max(a, b); k++) s.add(k);
    }
    return s.size ? s : null;
}

// Първата страница на документ от файл: „файл#стр.7“ → 7; цял файл → 1.
function _s2PurvaStr(d) {
    const m = String(d.id || '').match(/#стр\.(\d+)/);
    return m ? +m[1] : (d.stranica_ot || 1);
}

async function sloy2Cheti() {
    const obekt = _zhivObekt();
    if (!obekt) { showAlert('error', 'Първо избери обект.'); return; }
    const p = _stroezh(obekt);          // досието е на СТРОЕЖА
    const fajlove = [...(document.getElementById('s2-fajlove')?.files || [])];
    if (!fajlove.length) { showAlert('error', 'Избери файловете на обекта.'); return; }
    const hod = document.getElementById('s2-hod');
    const s2 = ((p.sloy2 = p.sloy2 || {}).od = p.sloy2.od || { dokumenti: [] });
    const redove = fajlove.map(f => `<div id="s2-f-${fajlove.indexOf(f)}">· ${_s2esc(f.name)}</div>`);
    hod.innerHTML = redove.join('');
    const znak = (i, t) => { const e = document.getElementById('s2-f-' + i); if (e) e.innerHTML = t; };
    let procheteni = 0, rezervenKazan = false;
    for (let i = 0; i < fajlove.length; i++) {
        const f = fajlove[i], ime = _s2esc(f.name);
        if (/\.doc$/i.test(f.name)) { znak(i, `⚠️ ${ime} — стар .doc, запиши го като PDF или .docx`); continue; }
        // С избрани страници към четеца отива само изрязаното — тогава се приема
        // и големият файл (нотариалните актове са 27 MB).
        const izbrani = (document.getElementById('s2-stranici')?.value || '').trim();
        const granica = izbrani ? 60 : 25;
        if (f.size > granica * 1024 * 1024) {
            znak(i, `⚠️ ${ime} — над ${granica} MB${izbrani ? '' : ' — раздели го или избери страници'}`); continue;
        }
        znak(i, `⏳ ${ime} — чета…`);
        try {
            const data = await fileToBase64(f);
            const osnova = { agenda: 'od', pi: p.pi, chetec: document.getElementById('s2-chetec')?.value || 'auto',
                             fajl: { ime: f.name, media_type: f.type, data } };
            // PDF: първо само разделяне на документи, после всеки с отделна заявка —
            // иначе дълъг файл е една заявка над 5 мин. и връзката пада (16.09.2026).
            let chasti = null;
            if (/\.pdf$/i.test(f.name)) {
                znak(i, `⏳ ${ime} — разделям на документи…`);
                const rz = await apiCall('/api/sloy2/razdeli', 'POST', { ...osnova, stranici: izbrani });
                if (rz.greshka) { znak(i, `⚠️ ${ime} — ${_s2esc(rz.greshka)}`); continue; }
                if ((rz.chasti || []).length > 1) chasti = rz.chasti;
            }
            let novi = [];
            const problemi = [];
            if (!chasti) {
                znak(i, `⏳ ${ime} — чета…`);
                // с избрани страници — като част, за да има ключ по страница
                const r = await apiCall('/api/sloy2/chete', 'POST', { ...osnova, stranici: izbrani, edin: !!izbrani });
                if (r.greshka) { znak(i, `⚠️ ${ime} — ${_s2esc(r.greshka)}`); continue; }
                novi = r.dokumenti || [r.dokument];
            } else {
                for (let k = 0; k < chasti.length; k++) {
                    znak(i, `⏳ ${ime} — чета документ ${k + 1} от ${chasti.length} (стр. ${_s2esc(chasti[k].stranici)})…`);
                    try {
                        const r = await apiCall('/api/sloy2/chete', 'POST',
                            { ...osnova, stranici: chasti[k].stranici, edin: true });
                        if (r.greshka) problemi.push(`стр. ${chasti[k].stranici}: ${r.greshka}`);
                        else novi.push(...(r.dokumenti || [r.dokument]));
                    } catch (e) {
                        problemi.push(`стр. ${chasti[k].stranici}: ${e.message}`);
                    }
                }
                if (!novi.length) { znak(i, `❌ ${ime} — ${_s2esc(problemi.join('; '))}`); continue; }
            }
            // Заменя се прочетеното от ТЕЗИ страници — четене на части (1-15, после
            // 16-30) трупа документите, вместо да изтрие предишните.
            const obhvat = _s2Obhvat(izbrani);
            const zamenen = d => d.fajl === f.name && (!obhvat || obhvat.has(_s2PurvaStr(d)));
            const stari = new Set(s2.dokumenti.filter(zamenen).map(_s2Id));
            s2.dokumenti = s2.dokumenti.filter(d => !zamenen(d));
            s2.dokumenti.push(...novi);
            // Ново четене — старите потвърждения са за друго прочетено и не важат.
            for (const kl of Object.keys(s2.potvardeni || {}))
                if (stari.has(kl.split('::')[0])) delete s2.potvardeni[kl];
            procheteni++;
            const d = novi[0];
            znak(i, `✓ ${ime} — ${novi.length > 1 ? `<strong>${novi.length} документа</strong> (${_s2esc(d.vid || '?')}…)` : _s2esc(d.vid || '?')}${d.sken ? ' <span style="color:var(--muted)">(скан)</span>' : ''}`
                    + (problemi.length ? ` <strong style="color:#d97706">· не прочетени: ${_s2esc(problemi.join('; '))}</strong>` : '')
                    + ` <span style="color:var(--muted)">· ${_s2esc(d.chetec || '')}</span>`
                    + (d.rakopis_nenadezhden ? ` <strong style="color:#d97706">· резервен четец — не отбелязва ръкопис, провери всяка стойност</strong>` : '')
                    + (d.belezhka ? ` <span style="color:var(--muted)">· ${_s2esc(d.belezhka)}</span>` : ''));
            // Основният не е могъл — кажи го веднъж, високо: резервът е предпазна мрежа, не нормата.
            if (d.zashto_rezerven && !rezervenKazan) {
                rezervenKazan = true;
                showAlert('error', `⚠️ Основният четец не може да чете (${d.zashto_rezerven.slice(0, 120)}). Чете резервният — провери кредита.`);
            }
        } catch (e) {
            znak(i, `❌ ${ime} — ${_s2esc(e.message)}`);
        }
    }
    if (procheteni) {
        s2.koga = new Date().toISOString();
        _zapishiObekt(obekt, `Слой 2: прочетени ${procheteni} файла`);
    }
    sloy2Sravni();
}

function sloy2Izchisti() {
    const obekt = _zhivObekt();
    const p = obekt && _stroezh(obekt);
    if (!p || !p.sloy2?.od) return;
    if (!confirm('Да изчистя прочетеното за този строеж? Файловете ще трябва да се прочетат наново.')) return;
    delete p.sloy2.od;
    _zapishiObekt(obekt, 'Слой 2: прочетеното е изчистено');
    document.getElementById('s2-rezultat').innerHTML = '';
    document.getElementById('s2-hod').innerHTML = '';
}

async function sloy2Sravni() {
    const p = _stroezh(_zhivObekt());
    const kutiya = document.getElementById('s2-rezultat');
    if (!p || !kutiya) return;
    const procheteni = p.sloy2?.od?.dokumenti || [];
    if (!procheteni.length) {
        kutiya.innerHTML = '<p style="font-size:13px;color:var(--muted)">Още няма прочетени документи.</p>';
        return;
    }
    // Сравнява се сверенето с хартията, където го има — не прочетеното.
    const dokumenti = _s2Prilozhi(procheteni, p.sloy2.od.potvardeni || {});
    kutiya.innerHTML = '<p style="font-size:13px;color:var(--muted)">Сравнявам…</p>';
    const cl = (p.clients && p.clients.length ? p.clients : [p.client || {}]);
    const pasport = {
        identifikator: p.pi || '',
        rs_nomer: p.permit?.number || '', rs_data: p.permit?.date || '',
        rs_v_sila: p.permit?.effective || '',
        zk_nomer: p.zk?.number || '',
        // датите на съставяне — Протокол 2, ЗК, Акт 14, Акт 15 участват в хронологията
        docDates: p.docDates || {},
        vazlozhiteli: cl.filter(c => c.name).map(c => ({ ime: c.name, eik: c.eik || '', predstavlyavan_ot: c.rep || '' })),
        stroitel: { ime: p.builder?.company || '', eik: p.builder?.eik || '', predstavlyavan_ot: p.builder?.manager || '' },
    };
    try {
        const r = await apiCall('/api/sloy2/sravni', 'POST', {
            agenda: 'od', dokumenti, pasport,
            passport: _cheklistRows(p, readDokumenti()), neotnasya: p.neotnasya || [] });
        if (r.greshka) { kutiya.innerHTML = `<div class="alert alert-warning" style="margin:0">⚠️ ${_s2esc(r.greshka)}</div>`; return; }
        // Сверените документи влизат в изходните данни сами — без „Впиши“ и
        // без „Запази“. (Операторът, 20.10.2026.)
        // Изходните данни са на ОБЕКТА (имота), а прочетеното — на строежа.
        const obekt = _zhivObekt();
        const vpisani = _dokVpishiSverenite(obekt, obekt, dokumenti,
                                            p.sloy2.od.potvardeni || {});
        kutiya.innerHTML = _sloy2Html(r, procheteni, p.sloy2.od.potvardeni || {});
        if (vpisani) {
            showAlert('success', `${vpisani} сверени документа влязоха в изходните данни.`);
            if (document.getElementById('fp-dok-rezultat')) proveriDokumenti(_dokFaza);
        }
        // Прочетеното без ред в чеклиста се запомня като кандидат. Нищо не
        // влиза само — трупа се и чака. (Операторът, 20.10.2026.)
        if (typeof kandZabelezhi === 'function') {
            // Кандидатът се брои по ВИД на документа, както го е прочел
            // четецът — не по име на файл.
            const nepasnali = dokumenti
                .filter(d => !String(d.cheklist_red || '').trim())
                .map(d => ({ ime: String(d.vid || d.fajl || '').trim(), fajl: d.fajl || '' }));
            await kandZabelezhi(p, nepasnali);
            const kut = document.getElementById('s2-kandidati');
            if (kut) kut.innerHTML = _kandHtml();
        }
    } catch (e) {
        kutiya.innerHTML = `<div class="alert alert-error" style="margin:0">❌ ${_s2esc(e.message)}</div>`;
    }
}

function _sloy2Izvor(i) {
    const kade = [i.fajl, i.stranica ? 'стр. ' + i.stranica : ''].filter(Boolean).join(', ');
    const sv = i.sverka === 'потвърдено от оператора' ? '<strong style="color:var(--green)">✔ сверено с хартията</strong>'
             : i.sverka === 'сверено с текста' ? '<span style="color:var(--green)">сверено</span>'
             : `<span style="color:var(--muted)">${_s2esc(i.sverka)}</span>`;
    return `<div style="font-size:12px;padding-left:14px">${_s2esc(kade)}${i.broy > 1 ? ` <strong>(${i.broy} документа)</strong>` : ''}${i.rol === 'позоваване' ? ' · позоваване' : ''}
            ${i.citat ? ` — „${_s2esc(i.citat)}“` : ''}${i.rakopisno ? ' · на ръка' : ''} · ${sv}</div>`;
}

function _sloy2Html(r, dokumenti, potvardeni) {
    const zagl = t => `<div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;
                         letter-spacing:1px;margin:14px 0 6px">${t}</div>`;
    const razm = r.razminavania || [];
    const tvardi = razm.filter(x => x.tezhest === 'разминаване');
    let h = `<div class="alert ${tvardi.length ? 'alert-warning' : 'alert-success'}" style="margin:0 0 6px">
        Прочетени ${r.dokumenti} документа${r.ot_skan ? ` (${r.ot_skan} от скан — стойностите са за потвърждение)` : ''}.
        ${dokumenti.filter(d => d.rakopis_nenadezhden).length ? `<br><strong style="color:#d97706">
            ${dokumenti.filter(d => d.rakopis_nenadezhden).length} прочетени от резервния четец — той не отбелязва ръкопис;
            провери всяка стойност в тях.</strong>` : ''}
        ${tvardi.length ? `⚠️ ${tvardi.length} разминавания между документите.` : '✅ Не намирам разминавания между документите.'}
        ${razm.length - tvardi.length ? ` · ❔ ${razm.length - tvardi.length} за проверка.` : ''}
        ${(r.drug_stroezh || []).length ? `<br><span style="color:var(--muted)">Не се сравняват със сградата — за друг
            строеж: ${r.drug_stroezh.map(_s2esc).join(' · ')}</span>` : ''}</div>`;

    // Сверяването — по вид документ, в таблици, само нужното (16.09.2026).
    h += _s2SverkaHtml(r, dokumenti, potvardeni || {});

    if (razm.length) {
        h += zagl('Разминавания между документите');
        h += razm.map(x => `
            <div style="border-left:3px solid ${x.tezhest === 'разминаване' ? 'var(--orange, #d97706)' : 'var(--border, #ccc)'};
                        padding:4px 0 6px 10px;margin-bottom:8px">
                <div style="font-size:13px"><strong>${x.tezhest === 'разминаване' ? '⚠️' : '❔'} ${_s2esc(x.kakvo)}</strong>
                    ${x.obyasnenie ? `<span style="color:var(--muted)"> — ${_s2esc(x.obyasnenie)}</span>` : ''}</div>
                ${x.stoynosti.map(s => `<div style="font-size:13px;margin-top:4px"><strong>${_s2esc(s.stoynost)}</strong></div>
                    ${s.izvori.map(_sloy2Izvor).join('')}`).join('')}
            </div>`).join('');
    }

    if ((r.hronologia || []).length) {
        h += zagl('Хронология и срокове');
        h += r.hronologia.map(x => `<div style="font-size:13px;padding:2px 0">${x.status === 'ok' ? '✓' : x.status === 'unknown' ? '❔' : '⚠️'} ${_s2esc(x.tekst)}</div>`).join('');
    }

    if ((r.predlozhenie || []).length) {
        h += zagl('За чеклиста — кои редове доказват прочетените файлове');
        h += r.predlozhenie.map(e => {
            const vpisan = _dokVpisanRed(_zhivObekt() || appData.currentProject || {}, e.dokument);
            // Един ред може да е доказан от няколко документа — всеки със своя
            // номер. Дотук се показваше номерът на първия до името на
            // последния файл и изглеждаше разменено. (Операторът, 20.10.2026)
            const ot = e.dokazano_ot && e.dokazano_ot.length ? e.dokazano_ot
                : (e.fajlove || []).map(f => ({ fajl: f, nomer: e.nomer, sken: e.sken }));
            return `<div style="font-size:13px;padding:3px 0;display:flex;gap:8px;align-items:baseline">
                <span style="flex:1">${vpisan ? '✓' : '＋'} <strong>${_s2esc(e.dokument)}</strong>
                    ${ot.map(x => `<div style="margin-left:18px;color:var(--muted)">${
                        x.nomer ? _s2esc(x.nomer) + ' · ' : ''}${_s2esc(x.fajl)}${
                        x.sken ? ' · от скан' : ''}</div>`).join('')}</span>
                ${vpisan ? '' : `<button type="button" class="btn btn-ghost btn-sm"
                    onclick="sloy2Vpishi('${encodeURIComponent(e.dokument)}','${encodeURIComponent(e.nomer || '')}')">Впиши</button>`}
            </div>`; }).join('');
        h += `<p style="font-size:12px;color:var(--muted);margin-top:6px">Вписаното влиза в „Изходни данни и
              съгласувания“ горе; запази и натисни „Провери — за Акт 15 / ОД“.</p>`;
    }
    const c = r.cheklist;
    if (c && !c.greshka) {
        const lipsvat = (c.redove || []).filter(x => x.sastoyanie === 'не е доказано');
        if (lipsvat.length) {
            h += zagl(`Не е намерено сред прочетените — ${lipsvat.length} от ${c.iziskvani}`);
            h += lipsvat.map(x => `<div style="font-size:13px;padding:1px 0">⏳ ${_s2esc(x.dokument)}</div>`).join('');
        }
    }
    if ((r.bez_red || []).length) {
        h += zagl('Прочетени, без ред в чеклиста');
        h += `<div style="font-size:13px">${r.bez_red.map(_s2esc).join(' · ')}</div>`;
    }
    h += '<div id="s2-kandidati"></div>';

    h += `<details style="margin-top:16px"><summary style="font-size:13px;cursor:pointer;color:var(--muted)">
            Подробно — всички прочетени полета по документ</summary>
            ${_s2PotvardiHtml(dokumenti, potvardeni || {})}</details>`;
    return h;
}

// ── Потвърждение по факт ──────────────────────────────────────────────────────
// Решение на оператора (16.09.2026): АИ-то констатира и предлага, човекът
// верифицира — с хартията. Пробата от 15.09 показа защо по факт, не по документ:
// два модела прочетоха еднакво грешно една и съща ръкописна дата.
// Пази се в p.sloy2.od.potvardeni["файл::поле"] = {stoynost, prochetena, koy, koga}.

let _s2Otvoreni = new Set();   // кои документи са разгънати — да не се свиват при всяко „✔“

// Ключът на документа: „файл“, а в серия — „файл#стр.3“ (от сървъра). Старите
// четения нямат id — за тях е името на файла, затова старите потвърждения важат.
const _s2Id = d => d.id || d.fajl;

function _s2Fakti(d) {
    const out = [];
    const f = (k, etiket, obj) => { if (obj && String(obj.stoynost ?? '').trim()) out.push({ k, etiket, obj }); };
    // Наименованието е ПЪРВИЯТ факт: то казва кой е този документ. Потвърдиш
    // ли го, точно то влиза в описа на Акт 15 — не редът от чеклиста.
    f('naimenovanie', 'наименование', d.naimenovanie);
    f('nomer', 'номер', d.nomer); f('data', 'дата', d.data); f('izdatel', 'издател', d.izdatel);
    f('material', 'материал/изделие', d.material); f('proizvoditel', 'производител/доставчик', d.proizvoditel);
    f('sadarzhanie', 'какво е прието', d.sadarzhanie);
    // нотариален акт — за таблицата на собствениците
    [['nt_tom', 'нот. акт — том'], ['nt_reg', 'нот. акт — рег. №'], ['nt_delo', 'нот. акт — дело'],
     ['nt_notarius', 'нотариус'], ['nt_nk', 'нотариус — № в регистъра на НК'], ['vp_vh_reg', 'вписване — вх. рег. №'], ['vp_akt', 'вписване — акт №'],
     ['vp_tom', 'вписване — том'], ['vp_delo', 'вписване — дело']].forEach(([k, et]) => f(k, et, d[k]));
    (d.razpredelenie || []).forEach((r, i) => {
        f(`r${i}.obekti`, `обекти (група ${i + 1})`, r.obekti);
        f(`r${i}.sobstvenici`, `собственици (група ${i + 1})`, r.sobstvenici);
    });
    const o = d.obekt || {};
    f('obekt.upi', 'УПИ', o.upi); f('obekt.identifikator', 'идентификатор', o.identifikator); f('obekt.adres', 'адрес', o.adres);
    (d.uchastnici || []).forEach((u, i) => {
        const r = u.rolya || 'участник';
        f(`u${i}.ime`, r, u.ime); f(`u${i}.eik`, `${r} — ЕИК`, u.eik);
        f(`u${i}.predstavlyavan_ot`, `${r} — представляван от`, u.predstavlyavan_ot);
        f(`u${i}.adres`, `${r} — адрес`, u.adres);
    });
    (d.pozovavania || []).forEach((p, i) => {
        const et = p.opisanie || p.vid_kod || 'документ';
        const sint = pole => ({ stoynost: p[pole], stranica: p.stranica, citat: p.citat, sverka: p.sverka });
        f(`p${i}.nomer`, `позоваване на ${et} — номер`, sint('nomer'));
        f(`p${i}.data`, `позоваване на ${et} — дата`, sint('data'));
    });
    return out;
}

function _s2Prilozhi(dokumenti, potv) {
    return JSON.parse(JSON.stringify(dokumenti)).map(d => {
        for (const [kl, v] of Object.entries(potv || {})) {
            const i = kl.indexOf('::');
            if (kl.slice(0, i) !== _s2Id(d)) continue;
            const k = kl.slice(i + 2), m = k.match(/^([upr])(\d+)\.(\w+)$/);
            if (m && m[1] === 'p') {
                const p = (d.pozovavania || [])[+m[2]];
                if (p) { p[m[3]] = v.stoynost; p.sverka = 'потвърдено от оператора'; }
                continue;
            }
            const obj = m ? ((m[1] === 'r' ? d.razpredelenie : d.uchastnici) || [])[+m[2]]?.[m[3]]
                      : k.startsWith('obekt.') ? (d.obekt || {})[k.slice(6)] : d[k];
            if (obj && typeof obj === 'object') { obj.stoynost = v.stoynost; obj.sverka = 'потвърдено от оператора'; }
        }
        return d;
    });
}

function _s2PotvardiHtml(dokumenti, potv) {
    let vsichki = 0, gotovi = 0;
    const blokove = dokumenti.map(d => {
        const fakti = _s2Fakti(d);
        const tuk = fakti.filter(x => potv[`${_s2Id(d)}::${x.k}`]).length;
        vsichki += fakti.length; gotovi += tuk;
        const redove = fakti.map(x => {
            const kl = `${_s2Id(d)}::${x.k}`, v = potv[kl], k64 = encodeURIComponent(kl);
            const vazhno = x.obj.rakopisno || d.rakopis_nenadezhden;
            return `<div style="font-size:12px;padding:4px 0;display:flex;gap:8px;align-items:baseline;border-bottom:1px dotted var(--border,#e5e5e5)">
                <span style="flex:1">
                    ${v ? '<span style="color:var(--green)">✔</span>' : vazhno ? '<span style="color:#d97706" title="на ръка или от резервния четец">✍</span>' : '·'}
                    <span style="color:var(--muted)">${_s2esc(x.etiket)}:</span>
                    <strong>${_s2esc(v ? v.stoynost : x.obj.stoynost)}</strong>
                    ${v && v.stoynost !== v.prochetena ? `<span style="color:#d97706"> (прочетено: ${_s2esc(v.prochetena)})</span>` : ''}
                    <span style="color:var(--muted)">${x.obj.stranica ? ' · стр. ' + _s2esc(x.obj.stranica) : ''}${x.obj.citat ? ` · „${_s2esc(x.obj.citat)}“` : ''}${x.obj.rakopisno ? ' · на ръка' : ''}</span>
                    ${v ? `<span style="color:var(--green)"> · сверено с хартията — ${_s2esc(v.koy)}, ${_s2esc(new Date(v.koga).toLocaleString('bg-BG'))}</span>` : ''}
                </span>
                ${v ? `<button type="button" class="btn btn-ghost btn-sm" onclick="s2Otmeni('${k64}')">Отмени</button>`
                    : `<button type="button" class="btn btn-ghost btn-sm" onclick="s2Potvardi('${k64}')">✔ Сверено</button>
                       <button type="button" class="btn btn-ghost btn-sm" onclick="s2Popravi('${k64}')">✎ Поправи</button>`}
            </div>`;
        }).join('');
        const f64 = encodeURIComponent(_s2Id(d));
        const stranici = d.stranica_ot ? ` · стр. ${_s2esc(d.stranica_ot)}${d.stranica_do && d.stranica_do !== d.stranica_ot ? '–' + _s2esc(d.stranica_do) : ''}` : '';
        return `<details data-fajl="${f64}" ontoggle="_s2Tog(this)" ${_s2Otvoreni.has(_s2Id(d)) ? 'open' : ''}
                         style="padding:6px 0;border-bottom:1px solid var(--border,#eee)">
            <summary style="font-size:13px;cursor:pointer">
                <strong>${_s2esc(d.fajl)}</strong>${stranici} — ${_s2esc(d.vid || '?')}
                <span style="color:${d.rakopis_nenadezhden ? '#d97706' : 'var(--muted)'}"> · чел: ${_s2esc(d.chetec || 'Claude')}</span>
                <span style="color:${tuk === fakti.length ? 'var(--green)' : 'var(--muted)'}"> · сверени ${tuk} от ${fakti.length}</span>
            </summary>
            ${d.zabelezhki ? `<div style="font-size:12px;color:var(--muted);padding:4px 0">бележка на четеца: ${_s2esc(d.zabelezhki)}</div>` : ''}
            ${redove || '<div style="font-size:12px;color:var(--muted)">няма прочетени стойности</div>'}
        </details>`;
    });
    const zagl = `<div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;
                             letter-spacing:1px;margin:14px 0 6px">Свери с хартията — ${gotovi} от ${vsichki} стойности</div>
        <p style="font-size:12px;color:var(--muted);margin:0 0 6px">АИ-то само предлага. ✍ = на ръка или от резервния
        четец — там грешките са най-чести. „✔ Сверено“ записва, че си я видяла на хартията; „✎ Поправи“ — вярната
        стойност, която влиза в сравнението вместо прочетената.</p>`;
    return zagl + blokove.join('');
}

// ── Сверяване в таблици ───────────────────────────────────────────────────────
// Решение на оператора (16.09.2026): „за да чекна акт 7 трябва да отворя всеки
// акт да прочета 50 неща и не разбирам кое да верифицирам — операторът ще
// полудее“. Общото (УПИ, идентификатор) — веднъж за обекта; по вид документ —
// таблица само с колоните за ОД; брояч с ред ⚠️ → ✍ → други; клик поправя;
// „✔ Свери всички редове“ — с изрично потвърждение.

const _S2_TABLICI = [
    { kodove: ['AKT7', 'AKT12'], ime: 'Актове обр. 7 и обр. 12',
      koloni: [['стр.', '#str'], ['вид', '#vid'], ['дата', 'data'], ['какво е прието', 'sadarzhanie']] },
    // За ОД от нотариалния акт трябват САМО собствениците и обектите (операторът,
    // 17.09.2026) — номер, том, дело, нотариус не се сверяват тук (са в „Подробно“).
    { kodove: ['NOT_AKT'], ime: 'Нотариални актове — собственици',
      koloni: [['стр.', '#str'], ['обект (апартамент, гараж, паркомясто) → собственици', '#razpr']] },
    { kodove: ['DEKLARACIA'], ime: 'Декларации за материали',
      koloni: [['материал/изделие', 'material'], ['производител', 'proizvoditel'], ['№', 'nomer'], ['дата', 'data']] },
    // Наименованието е колона, а не само в „Подробно“: то казва КОЙ е документът
    // и точно то влиза в изречението на Акт 15. (Операторът, 28.10.2026.)
    { kodove: ['STANOVISHTE', 'PRISAEDINYAVANE', 'ENERGIEN', 'IZMERVANE'], ime: 'Становища, договори с дружества, измервания',
      koloni: [['вид', '#vid'], ['наименование', 'naimenovanie'], ['№', 'nomer'], ['дата', 'data'], ['издател', 'izdatel']] },
    { kodove: null, ime: 'Протоколи, актове, разрешения и други',
      koloni: [['вид', '#vid'], ['наименование', 'naimenovanie'], ['№', 'nomer'], ['дата', 'data']] },
];

function _s2SverkaHtml(r, dokumenti, potv) {
    if (!dokumenti.length) return '';
    const fakti = new Map(dokumenti.map(d => [_s2Id(d), new Map(_s2Fakti(d).map(x => [x.k, x]))]));
    // Спорните стойности — от разминаванията (по файл и цитат) и от хронологията.
    const sporni = new Set();
    // Спорно е малцинството — сървърът подрежда стойностите по брой, първата е мнозинството.
    for (const x of (r.razminavania || [])) for (const s of x.stoynosti.slice(1)) for (const i of s.izvori) {
        for (const d of dokumenti) {
            if (!(_s2Id(d) === i.fajl || _s2Id(d).startsWith(i.fajl + '#') || d.fajl === i.fajl)) continue;
            for (const [k, f] of fakti.get(_s2Id(d))) if (i.citat && f.obj.citat === i.citat) sporni.add(`${_s2Id(d)}::${k}`);
        }
    }
    for (const hx of (r.hronologia || [])) if (hx.status === 'warn') {
        for (const d of dokumenti) if (hx.tekst.includes(_s2Id(d) + ':') || hx.tekst.includes(_s2Id(d) + ' '))
            sporni.add(`${_s2Id(d)}::data`);
    }
    const vsichkiKl = new Set();
    const kletka = (d, k) => {
        const f = fakti.get(_s2Id(d)).get(k);
        if (!f) return '<span style="color:var(--muted)">—</span>';
        const kl = `${_s2Id(d)}::${k}`, v = potv[kl];
        vsichkiKl.add(kl);
        const spor = sporni.has(kl), rak = !v && (f.obj.rakopisno || d.rakopis_nenadezhden);
        const fon = v ? '#e8f5e9' : spor ? '#fdecea' : rak ? '#fff4e0' : 'transparent';
        const znak = v ? '✔ ' : spor ? '⚠️ ' : rak ? '✍ ' : '';
        const podskazka = `стр. ${f.obj.stranica || '?'}${f.obj.citat ? ' — „' + f.obj.citat + '“' : ''}`
            + (v ? ` · сверено: ${v.koy}` + (v.stoynost !== v.prochetena ? ` · прочетено: ${v.prochetena}` : '') : '')
            + ' · клик — поправи';
        return `<span title="${_s2esc(podskazka)}" onclick="s2Popravi('${encodeURIComponent(kl)}')"
                      style="cursor:pointer;background:${fon};border-radius:3px;padding:0 3px">${znak}${_s2esc(v ? v.stoynost : f.obj.stoynost)}</span>`;
    };
    // Същият списък, който „сверен ли е“ гледа — за да не се разминат.
    const redKl = (d, koloni) => _s2KlPoKoloni(d, koloni).map(k => `${_s2Id(d)}::${k}`);
    const bKl = (kl, pitai, tekst) => `<button type="button" class="btn btn-ghost btn-sm"
        onclick="s2PotvardiMnogo('${encodeURIComponent(JSON.stringify(kl))}', ${pitai})">${tekst}</button>`;

    // ── Общо за обекта ──
    const normUpi = s => String(s || '').toUpperCase().replace(/Х/g, 'X').replace(/І/g, 'I').replace(/С/g, 'C')
        .replace(/М/g, 'M').replace(/УПИ|\s|„|“|"/g, '').replace(/[–—]/g, '-').match(/[IVXLCM]+-?\d+/)?.[0]?.replace(/([IVXLCM]+)-?/, '$1-') || '';
    const normId = s => (String(s || '').match(/\d{5}\.\d{1,5}\.\d{1,5}/) || [''])[0];
    const drugi = new Set((r.drug_stroezh || []).map(x => String(x).split(' — ')[0]));
    let obshto = '';
    for (const [pole, ime, norm] of [['obekt.upi', 'УПИ', normUpi], ['obekt.identifikator', 'Идентификатор', normId]]) {
        const grupi = new Map();
        for (const d of dokumenti) {
            if (drugi.has(d.fajl)) continue;
            const f = fakti.get(_s2Id(d)).get(pole);
            if (!f) continue;
            const kl = `${_s2Id(d)}::${pole}`, st = potv[kl]?.stoynost ?? f.obj.stoynost, n = norm(st);
            if (!n) continue;
            if (!grupi.has(n)) grupi.set(n, { st, kl: [], dok: [] });
            grupi.get(n).kl.push(kl); grupi.get(n).dok.push(d.fajl);
        }
        const mnogo = grupi.size > 1;
        // спорна е малцинствената стойност — мнозинството е съгласно помежду си
        const podredeni = [...grupi].sort((a, b) => b[1].kl.length - a[1].kl.length);
        for (const [n, g] of podredeni) {
            g.kl.forEach(k => vsichkiKl.add(k));
            if (mnogo && n !== podredeni[0][0]) g.kl.forEach(k => sporni.add(k));
            const nesv = g.kl.filter(k => !potv[k]);
            const dok = [...new Set(g.dok)];
            obshto += `<div style="font-size:13px;padding:4px 0;display:flex;gap:8px;align-items:baseline;border-bottom:1px dotted var(--border,#e5e5e5)">
                <span style="flex:1">${!nesv.length ? '✔' : mnogo && n !== podredeni[0][0] ? '⚠️' : '·'} <span style="color:var(--muted)">${ime}:</span>
                    <strong>${_s2esc(g.st)}</strong>
                    <span style="color:var(--muted)"> — ${mnogo && g.kl.length < 3 ? _s2esc(dok.join(', ')) : `еднакво в ${g.kl.length} документа`}</span></span>
                ${nesv.length ? bKl(nesv, false, '✔ Сверено') : ''}
            </div>`;
        }
    }

    // ── Таблиците ──
    let tablici = '';
    const vzeti = new Set();
    for (const t of _S2_TABLICI) {
        const docs = dokumenti.filter(d => t.kodove ? t.kodove.includes(d.vid_kod) : !vzeti.has(_s2Id(d)));
        docs.forEach(d => vzeti.add(_s2Id(d)));
        if (!docs.length) continue;
        docs.sort((a, b) => (a.fajl || '').localeCompare(b.fajl || '') || _s2PurvaStr(a) - _s2PurvaStr(b));
        const redove = docs.map(d => {
            const kl = redKl(d, t.koloni), nesv = kl.filter(k => !potv[k]);
            const kletki = t.koloni.map(([, pole]) => {
                if (pole === '#str') return `${_s2esc(d.fajl)}${_s2PurvaStr(d) > 1 || /#/.test(_s2Id(d)) ? ' · ' + _s2PurvaStr(d) : ''}`;
                if (pole === '#vid') return _s2esc(d.vid || '?');
                if (pole === '#razpr') return (d.razpredelenie || []).map((x, i) =>
                    `<div>${kletka(d, `r${i}.obekti`)} → ${kletka(d, `r${i}.sobstvenici`)}</div>`).join('') || '<span style="color:var(--muted)">—</span>';
                if (Array.isArray(pole)) return pole.map(k => kletka(d, k)).join(' · ');
                return kletka(d, pole);
            });
            return `<tr>${kletki.map(c => `<td style="padding:4px 6px;border-bottom:1px solid var(--border,#eee);vertical-align:top">${c}</td>`).join('')}
                <td style="padding:4px 6px;border-bottom:1px solid var(--border,#eee);white-space:nowrap">${nesv.length ? bKl(nesv, false, '✔') : '<span style="color:var(--green)">✔</span>'}</td></tr>`;
        });
        const vsKl = docs.flatMap(d => redKl(d, t.koloni)).filter(k => !potv[k]);
        tablici += `<div style="margin:14px 0 4px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <strong style="font-size:13px">${_s2esc(t.ime)}</strong>
                <span style="font-size:12px;color:var(--muted)">${docs.length} документа</span>
                ${vsKl.length ? bKl(vsKl, true, `✔ Свери всички редове (${vsKl.length})`) : '<span style="font-size:12px;color:var(--green)">✔ всичко сверено</span>'}
            </div>
            <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
                <tr>${t.koloni.map(([ime]) => `<th style="text-align:left;padding:4px 6px;border-bottom:2px solid var(--border,#ddd);color:var(--muted)">${_s2esc(ime)}</th>`).join('')}<th></th></tr>
                ${redove.join('')}
            </table></div>`;
    }

    // ── Броячът ──
    const ostavat = [...vsichkiKl].filter(k => !potv[k]);
    const nSpor = ostavat.filter(k => sporni.has(k)).length;
    const nRak = ostavat.filter(k => {
        const [id, pole] = [k.slice(0, k.indexOf('::')), k.slice(k.indexOf('::') + 2)];
        const d = dokumenti.find(x => _s2Id(x) === id), f = fakti.get(id)?.get(pole);
        return !sporni.has(k) && f && (f.obj.rakopisno || d?.rakopis_nenadezhden);
    }).length;
    return `<div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin:14px 0 6px">Свери с хартията</div>
        <div class="alert ${ostavat.length ? 'alert-warning' : 'alert-success'}" style="margin:0 0 8px">
            ${ostavat.length ? `Остават <strong>${ostavat.length}</strong> за сверяване:
                ⚠️ ${nSpor} разминавания · ✍ ${nRak} ръкописни · ${ostavat.length - nSpor - nRak} други.
                Започни от ⚠️, после ✍.` : '✅ Всичко е сверено с хартията.'}
            <div style="font-size:12px;margin-top:4px;color:var(--muted)">Зелено — сверено · червено — разминаване ·
                оранжево — на ръка или от резервния четец. Посочи клетка — страница и цитат; клик — поправи.</div>
        </div>
        ${obshto ? `<div style="margin:8px 0"><strong style="font-size:13px">Общо за обекта</strong>${obshto}</div>` : ''}
        ${tablici}`;
}

async function s2PotvardiMnogo(kl64, pitai) {
    const p = _stroezh(_zhivObekt());
    if (!p?.sloy2?.od) return;
    const kluchove = JSON.parse(decodeURIComponent(kl64));
    if (pitai && !confirm(`Сверяваш ${kluchove.length} стойности наведнъж.\n\nВсички ли си проверила на хартия?`)) return;
    const potv = (p.sloy2.od.potvardeni = p.sloy2.od.potvardeni || {});
    let n = 0;
    for (const kl of kluchove) {
        if (potv[kl]) continue;
        const { fakt } = _s2Namer(encodeURIComponent(kl));
        if (!fakt) continue;
        const st = String(fakt.obj.stoynost);
        potv[kl] = { stoynost: st, prochetena: st, koy: _s2Koy(), koga: new Date().toISOString() };
        n++;
    }
    if (n) _s2ZapishiTiho(p, `Слой 2: сверени с хартията наведнъж — ${n} стойности`);
}

function _s2Tog(el) {
    const f = decodeURIComponent(el.dataset.fajl);
    if (el.open) _s2Otvoreni.add(f); else _s2Otvoreni.delete(f);
}

function _s2Namer(k64) {
    const p = _stroezh(_zhivObekt()), kl = decodeURIComponent(k64), i = kl.indexOf('::');
    const d = (p?.sloy2?.od?.dokumenti || []).find(x => _s2Id(x) === kl.slice(0, i));
    const pole = kl.slice(i + 2);
    let fakt = d ? _s2Fakti(d).find(x => x.k === pole) : null;
    // Наименованието се пише и когато четецът е върнал празно — то казва кой е
    // документът и влиза в описа на акта. Без този изход празното наименование
    // не можеше да се поправи от никъде. (28.10.2026)
    if (!fakt && d && pole === 'naimenovanie')
        fakt = { k: pole, etiket: 'наименование', obj: d.naimenovanie || { stoynost: '' } };
    return { p, kl, fakt };
}

function _s2Koy() {
    try { return JSON.parse(localStorage.getItem('akt_user') || '{}').email || 'оператор'; }
    catch (e) { return 'оператор'; }
}

// Тихо: кликовете са десетки, а _zapishiObekt вдига по две съобщения на всеки.
function _s2ZapishiTiho(p, opis) {
    p.updatedAt = new Date().toISOString();
    appData.currentProject = p;
    saveData();
    addHistory('edit', p.pi, opis);
    if (appData.apiUrl) {
        const { id: _bezId, ...zaSarvara } = p;
        apiCall(`/api/passports/${p.pi}`, 'POST', { passport: zaSarvara, pi: p.pi })
            .catch(e => showAlert('error', `⚠️ Потвърждението е само в браузъра — API грешка: ${e.message}`));
    }
    sloy2Sravni();
}

function s2Potvardi(k64) {
    const { p, kl, fakt } = _s2Namer(k64);
    if (!fakt) return;
    const st = String(fakt.obj.stoynost);
    (p.sloy2.od.potvardeni = p.sloy2.od.potvardeni || {})[kl] =
        { stoynost: st, prochetena: st, koy: _s2Koy(), koga: new Date().toISOString() };
    _s2ZapishiTiho(p, `Слой 2: сверено с хартията — ${fakt.etiket} „${st}“ (${kl.split('::')[0]})`);
}

function s2Popravi(k64) {
    const { p, kl, fakt } = _s2Namer(k64);
    if (!fakt) return;
    const st = String(fakt.obj.stoynost);
    const nova = prompt(`${fakt.etiket}\nПрочетено: ${st}\n\nВярната стойност от хартията:`, st);
    if (nova === null || !nova.trim()) return;
    (p.sloy2.od.potvardeni = p.sloy2.od.potvardeni || {})[kl] =
        { stoynost: nova.trim(), prochetena: st, koy: _s2Koy(), koga: new Date().toISOString() };
    _s2ZapishiTiho(p, `Слой 2: поправено от хартията — ${fakt.etiket} „${st}“ → „${nova.trim()}“ (${kl.split('::')[0]})`);
}

function s2Otmeni(k64) {
    const { p, kl, fakt } = _s2Namer(k64);
    if (!p?.sloy2?.od?.potvardeni?.[kl]) return;
    delete p.sloy2.od.potvardeni[kl];
    _s2ZapishiTiho(p, `Слой 2: отменено потвърждение — ${fakt ? fakt.etiket : kl}`);
}

// ── Окончателен доклад с АИ (слой 2) ─────────────────────────────────────────
// ОТДЕЛНА опция (операторът, 16.09.2026). Обикновеният доклад в „Актове и
// протоколи“ — само паспорт и {{…}} — не се пипа. Тук същият шаблон, а отгоре
// потвърденото с хартията; при разлика с паспорта редът остава с точки.
// ═══════════════════════════════════════════════════════════