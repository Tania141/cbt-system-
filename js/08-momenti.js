// АКТ СИСТЕМ · 08-momenti.js
// питането, надзорът по моменти и ОСИП
//
// Отделен от app.js на 13.10.2026 (стъпка 2 от ПОДРЕЖДАНЕ.md).
// Файловете се включват по РЕД и споделят едно и също глобално
// пространство — точно както беше в единия скрипт.

//  ПИТАНЕТО — един документ наведнъж (09.10.2026)
// ═══════════════════════════════════════════════════════════
// Операторът: „системата трябва да ги ИЗИСКВА, а не да ги изброява, защото PWA
// става тромаво“. Редът е по МОМЕНТА: ОСИП отначало докрай, после Протокол 1…
//
// Три отговора, не два: „няма го“ е различно от „не се отнася“ — първото е
// работа по събиране, второто приключва реда завинаги.
//
// Качването тук е по-добро от накуп, защото системата ЗНАЕ кой е документът —
// четецът не гадае вида, а това беше най-честата му грешка. Накуп си остава в
// „Документите“: един PDF с 24 нотариални акта отговаря на десет въпроса.

function _pitaneOpashka(st, r, obekt) {
    const otmetnati = new Set(st.nadzor_otmetnati || []);
    const nyama = new Set(st.nadzor_lipsvat || []);
    // Наученото също не се пита — иначе въпросът пак излиза, макар системата
    // вече да знае отговора от други обекти със същите съставки.
    const neotnasya = new Set(_nadzorNeotnasya(obekt || _zhivObekt(), st));
    const out = [];
    for (const g of r.grupi) {
        for (const d of g.dokumenti) {
            if (d.sastoyanie === 'не му е времето') continue;
            if (d.ot_registara && d.sastoyanie === 'налично') continue;
            const ime = d.dokument;
            if (otmetnati.has(ime) || nyama.has(ime) || neotnasya.has(ime)) continue;
            out.push({ ...d, moment: g.moment });
        }
    }
    const propusnati = new Set(_pitanePropusnati);
    return [...out.filter(x => !propusnati.has(x.dokument)),
            ...out.filter(x => propusnati.has(x.dokument))];
}

function _pitaneHtml(st, r) {
    const esc = _s2esc;
    const opashka = _pitaneOpashka(st, r);
    const nyama = (st.nadzor_lipsvat || []).length;
    if (!opashka.length) {
        return `<div class="card" style="margin-bottom:16px">
            <div style="font-size:14px">✅ Няма повече въпроси за сега.</div>
            ${nyama ? `<div style="font-size:12.5px;color:#b45309;margin-top:6px">
                ${nyama} ${nyama === 1 ? 'документ липсва' : 'документа липсват'} — виж списъка долу.</div>` : ''}
        </div>`;
    }
    const d = opashka[0];
    const k = encodeURIComponent(d.dokument);
    // Собствеността не се отговаря с „имам го“ — тя има свой екран и своя
    // сметка. Тук само се казва докъде е стигнала.
    if (d.ot_registara) return `
        <div class="card" style="margin-bottom:16px;border-color:var(--gold)">
            <div style="font-size:11.5px;color:var(--muted);letter-spacing:.5px;text-transform:uppercase">
                ${esc(d.moment)} · остават ${opashka.length}
            </div>
            <div style="font-size:19px;font-weight:700;margin:6px 0 2px">${esc(d.dokument)}</div>
            <div style="font-size:13px;color:var(--slate);margin-top:4px">${esc(d.podskazka || '')}</div>
            <button class="btn btn-primary" style="margin-top:12px"
                    onclick="navigateTo('sobstvenost')">Отвори „Собственост“</button>
        </div>`;
    return `
        <div class="card" style="margin-bottom:16px;border-color:var(--gold)">
            <div style="font-size:11.5px;color:var(--muted);letter-spacing:.5px;text-transform:uppercase">
                ${esc(d.moment)} · остават ${opashka.length}
            </div>
            <div style="font-size:19px;font-weight:700;margin:6px 0 2px">${esc(d.dokument)}</div>
            ${d.uslovie && d.uslovie !== 'винаги'
                ? `<div style="font-size:12.5px;color:var(--muted)">иска се когато: ${esc(d.uslovie)}</div>` : ''}
            ${(d.vliza_v || []).length
                ? `<div style="font-size:12px;color:var(--muted);margin-top:3px">влиза в: ${d.vliza_v.map(esc).join(', ')}</div>` : ''}
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
                <button class="btn btn-primary" onclick="pitaneOtgovor('${k}', 'ima')">Имам го</button>
                <button class="btn btn-secondary" onclick="pitaneOtgovor('${k}', 'nyama')">Няма го</button>
                <button class="btn btn-ghost" onclick="pitaneOtgovor('${k}', 'neotnasya')">Не се отнася</button>
                <button class="btn btn-ghost" onclick="pitanePropusni('${k}')">Пропусни</button>
            </div>
            <div style="margin-top:12px;padding-top:11px;border-top:1px solid var(--border-light)">
                <label class="form-label" style="font-size:11.5px">…или качи файла и системата ще го прочете</label>
                <input type="file" id="pitane-fajl" class="form-input" style="font-size:13px"
                       accept=".pdf,.docx,.jpg,.jpeg,.png,.webp,.tif,.tiff"
                       onchange="pitaneKachi('${k}')">
                <div id="pitane-hod" style="font-size:12px;color:var(--muted);margin-top:6px"></div>
            </div>
        </div>`;
}

function _pitaneSpisak(st) {
    const esc = _s2esc;
    const nyama = st.nadzor_lipsvat || [];
    if (!nyama.length) return '';
    return `<div class="alert alert-warning" style="margin:0 0 16px"><div>
        <strong>Какво липсва (${nyama.length})</strong>
        <div style="font-size:12.5px;margin-top:5px;line-height:1.7">
            ${nyama.map(x => `<div>· ${esc(x)}
                <button type="button" class="btn btn-ghost btn-sm" style="margin-left:4px"
                        onclick="pitaneOtgovor('${encodeURIComponent(x)}', 'ima')">намерих го</button></div>`).join('')}
        </div>
    </div></div>`;
}

function pitaneOtgovor(ime64, kak) {
    const obekt = _zhivObekt();
    if (!obekt) return;
    const st = _stroezh(obekt);
    const ime = decodeURIComponent(ime64);
    const mahni = (pole) => { st[pole] = (st[pole] || []).filter(x => x !== ime); };
    mahni('nadzor_otmetnati'); mahni('nadzor_lipsvat'); mahni('neotnasya');
    const pole = { ima: 'nadzor_otmetnati', nyama: 'nadzor_lipsvat', neotnasya: 'neotnasya' }[kak];
    if (pole) st[pole] = [...(st[pole] || []), ime];
    const dumi = { ima: 'налично', nyama: 'липсва', neotnasya: 'не се отнася' }[kak] || kak;
    _s2ZapishiTiho(obekt, `${ime} — ${dumi}`);
    _prerisuvai();
    // „Не се отнася“ е УРОК за типа строеж, не само за обекта
    // (`js/12c-naucheno.js`). Пази се и тук, за да учи системата и когато се
    // работи в старото ПВА — иначе наученото зависи от кой екран е казано.
    if (kak === 'neotnasya' && typeof nauchZapomni === 'function')
        nauchZapomni(obekt, st, ime).then(_prerisuvai).catch(() => {});
}

// Какво този строеж няма да пита: казаното тук плюс наученото за профила.
// Същото стои и в `aktNeotnasya` (`akt/yadro.js`) — двете ПВА трябва да
// махат едни и същи редове.
function _nadzorNeotnasya(obekt, st) {
    const svoi = (st && st.neotnasya) || [];
    const nauch = typeof nauchNeotnasya === 'function' ? nauchNeotnasya(obekt, st) : [];
    return [...new Set([...svoi, ...nauch])];
}

// „Пропусни“ не е отговор: само мести въпроса назад за този път.
let _pitanePropusnati = [];
function pitanePropusni(ime64) {
    _pitanePropusnati.push(decodeURIComponent(ime64));
    _prerisuvai();
}

async function pitaneKachi(ime64) {
    const obekt = _zhivObekt();
    const vhod = document.getElementById('pitane-fajl');
    const hod = document.getElementById('pitane-hod');
    const f = vhod && vhod.files && vhod.files[0];
    if (!obekt || !f) return;
    const st = _stroezh(obekt);
    const ime = decodeURIComponent(ime64);
    if (/\.doc$/i.test(f.name)) { hod.textContent = 'Стар .doc — запиши го като .docx или PDF.'; return; }
    hod.textContent = `Чета „${f.name}“…`;
    try {
        const r = await apiCall('/api/sloy2/chete', 'POST', {
            agenda: 'od', pi: obekt.pi, edin: true,
            chetec: localStorage.getItem('s2_chetec') || 'auto',
            fajl: { ime: f.name, media_type: f.type, data: await fileToBase64(f) },
        });
        if (r.greshka) { hod.textContent = `⚠️ ${r.greshka}`; return; }
        const novi = r.dokumenti || [r.dokument];
        const s2 = ((st.sloy2 = st.sloy2 || {}).od = st.sloy2.od || { dokumenti: [] });
        s2.dokumenti = s2.dokumenti.filter(x => x.fajl !== f.name).concat(novi);
        s2.koga = new Date().toISOString();
        // Отговорът на ТОЗИ въпрос е „имам го“ — файлът е пред нас.
        st.nadzor_otmetnati = [...new Set([...(st.nadzor_otmetnati || []), ime])];
        st.nadzor_lipsvat = (st.nadzor_lipsvat || []).filter(x => x !== ime);
        _zapishiObekt(obekt, `${ime} — прочетен от „${f.name}“`);
        _prerisuvai();
    } catch (e) {
        hod.textContent = `❌ ${e.message}`;
    }
}

// Надзорът: протоколите по ред, всеки със своя чеклист. Операторът, 01.10.2026:
// „за всеки протокол имаме чек лист… така в процеса на работа по документите ще
// получим пълния списък за акт 15 и за ОД“. Чеклистът спира да е списък от 86
// реда и става ИЗГЛЕД — всеки момент показва само своето парче.
async function renderNadzorPage() {
    const obekt = _obektIliIzbor('nadzor-content', 'nadzor', 'Изберете обекта');
    if (!obekt) return;
    const st = _stroezh(obekt);
    const kutiya = document.getElementById('nadzor-content');
    const glava = _lentaObekt(obekt, 'nadzor') + _lentaStroezhi(obekt);
    kutiya.innerHTML = glava + '<div class="card"><div style="color:var(--muted);font-size:13px">Подреждам по моменти…</div></div>';
    try {
        const r = await apiCall('/api/nadzor', 'POST', {
            pi: obekt.pi, faza: 'nadzor',
            nalichni: _nadzorNalichni(st),
            tekusht: st.tekusht_moment || '',
            priznaci: _nadzorPriznaci(obekt, st),
            izklyucheni: st.izklyucheni_momenti || [],
        });
        if (r.greshka) throw new Error(r.greshka);
        _sbPodmeniCheklist(obekt, r);
        kutiya.innerHTML = glava + _nadzorHtml(st, r) + _nadzorSastavyaneHtml();
        renderGenerateSection();
    } catch (e) {
        kutiya.innerHTML = glava + `<div class="alert alert-error">${_s2esc(e.message)}</div>`;
    }
}

// Съставянето на документи живее тук (13.10.2026): надзорът казва КОЙ документ
// е на ред, а дотук се ходеше в отделна страница, за да се състави. Прибрано, за
// да не се тича по менюто.
function _nadzorSastavyaneHtml() {
    return `
        <details class="card" style="margin-top:16px">
            <summary style="cursor:pointer;font-weight:600;font-size:14px">📄 Съставяне на актове и протоколи</summary>
            <div id="generate-content" style="margin-top:12px"></div>
        </details>
        <details class="card" style="margin-top:12px">
            <summary style="cursor:pointer;font-weight:600;font-size:14px">🤖 Окончателен доклад с АИ</summary>
            <div style="margin-top:12px"><div id="od-ai-karta"></div></div>
        </details>`;
}

// По тези признаци системата решава кои актове изобщо се съставят — операторът
// не ги цъка. Акт 5 и 6 са за 1–3 категория, Акт 9 — при машини, Акт 16 — само
// при назначена ДПК. (Операторът, 09.10.2026: „сега операторът тича по екрана“.)
function _nadzorPriznaci(obekt, st) {
    const pr = {
        kategoria: st.kategoria || '',
        imaMashini: !!st.imaMashini,
        metalnaKonstrukcia: !!st.metalnaKonstrukcia,
        dpk: !!st.dpk_naznachena,
        po_poiskvane: !!st.protokol17_poiskan,
        // Видът дотук НЕ се подаваше, а редовете, добавени от оператора,
        // носеха условие „вид = линеен“. Тоест никога не ставаха приложими —
        // научен ред, който мълчи. (Намерено на 27.10.2026.)
        // И двете изписвания, защото старите условия са на кирилица.
        vid: st.vid || '',
        'вид': st.vid || '',
    };
    // Съставките като признаци: `sast_shtp`, `sast_kabel_srn`… Така условието
    // на научен ред може да каже точно при какъв строеж важи, с думите на
    // самите съставки, вместо с грубото „вид = линеен“.
    for (const s of (typeof _kesSastavkiNa === 'function' ? _kesSastavkiNa(obekt) : []))
        if (s && s.kod) pr['sast_' + s.kod] = true;
    return pr;
}

// Какво вече е събрано: от прочетените документи и от отметнатото на ръка.
function _nadzorNalichni(st) {
    const otChetene = (st.sloy2?.od?.dokumenti || [])
        .map(d => (d.cheklist_red || '').trim()).filter(Boolean);
    return [...new Set([...(st.nadzor_otmetnati || []), ...otChetene])];
}

const _NADZOR_CVYAT = { 'налично': 'var(--green,#2e7d32)', 'очаква се': 'var(--ink)',
                        'не му е времето': 'var(--muted)' };

function _nadzorGrupaHtml(g, tekusht, izklyucheni, poIzborSpisak) {
    const esc = _s2esc;
    const poIzbor = (poIzborSpisak || []).includes(g.moment);
    // Системата е решила; отметката само позволява изключение.
    const reshenoOtSistemata = g.po_podrazbirane;
    const seSastavya = izklyucheni.includes('+' + g.moment) ? true
        : izklyucheni.includes(g.moment) ? false
        : (reshenoOtSistemata === undefined ? true : reshenoOtSistemata);
    const vidimi = g.dokumenti.filter(d => d.sastoyanie !== 'не му е времето');
    const skriti = g.dokumenti.length - vidimi.length;
    const redove = vidimi.map(d => `
        <label style="display:flex;gap:9px;align-items:flex-start;padding:5px 0;border-bottom:1px solid var(--border-light);cursor:pointer">
            <input type="checkbox" style="margin-top:3px;width:15px;height:15px"
                   ${d.sastoyanie === 'налично' ? 'checked' : ''}
                   onchange="nadzorOtmetni('${encodeURIComponent(d.dokument)}', this.checked)">
            <span style="flex:1;font-size:13.5px;color:${_NADZOR_CVYAT[d.sastoyanie]}">
                ${esc(d.dokument)}
                ${d.uslovie && d.uslovie !== 'винаги' ? `<span style="color:var(--muted);font-size:11.5px"> · ${esc(d.uslovie)}</span>` : ''}
                ${(d.vliza_v || []).length ? `<div style="font-size:11px;color:var(--muted);margin-top:1px">влиза в: ${d.vliza_v.map(esc).join(', ')}</div>` : ''}
            </span>
        </label>`).join('');
    return `
    <div class="card" style="margin-bottom:12px;${g.moment === tekusht ? 'border-color:var(--gold)' : ''}">
        <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
            <div style="font-size:16px;font-weight:700">${esc(g.moment)}</div>
            <div style="font-size:12px;color:var(--muted)">
                ${g.gotovi || 0} от ${g.dokumenti.length}${g.lipsvat ? ` · остават ${g.lipsvat}` : ''}
            </div>
            ${poIzbor ? `<label style="margin-left:auto;font-size:11.5px;color:var(--muted);display:flex;align-items:center;gap:6px;cursor:pointer"
                    title="Системата го реши по категорията и признаците — пипни само ако е друго">
                <input type="checkbox" ${seSastavya ? 'checked' : ''}
                       onchange="nadzorSastavya('${encodeURIComponent(g.moment)}', this.checked)">
                съставя се</label>` : ''}
        </div>
        ${!seSastavya ? `<p style="font-size:12px;color:var(--muted);margin:8px 0 0">
            Не се съставя за този строеж — документите му падат на следващия момент.</p>` : `
        <div style="margin-top:10px">
            ${redove || '<div style="font-size:12.5px;color:var(--muted)">нищо за сега</div>'}
            ${skriti ? `<div style="font-size:11.5px;color:var(--muted);margin-top:7px">${skriti} още — не им е времето</div>` : ''}
        </div>`}
    </div>`;
}

function _nadzorHtml(st, r, bezIzbor) {
    const esc = _s2esc;
    const tekusht = st.tekusht_moment || '';
    const izklyucheni = st.izklyucheni_momenti || [];
    // Кой момент идва след текущия — от тези, които наистина се съставят.
    const sledvashti = r.grupi.map(g => g.moment);
    const i = sledvashti.indexOf(tekusht);
    const sled = tekusht ? (sledvashti[i + 1] || '') : (sledvashti[0] || '');
    const obshto = r.grupi.reduce((a, g) => a + g.dokumenti.length, 0);
    const gotovi = r.grupi.reduce((a, g) => a + (g.gotovi || 0), 0);
    const chakat = r.grupi.reduce((a, g) => a + (g.lipsvat || 0), 0);
    // При ОСИП няма „докъде си стигнала“ — моментът е един.
    const izbor = bezIzbor ? '' : `
        <div class="card" style="margin-bottom:16px">
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
                <label class="form-label" style="margin:0">Докъде си стигнала</label>
                <select class="form-input" style="width:auto" onchange="nadzorMoment(this.value)">
                    <option value="">— още не е започнало —</option>
                    ${(r.red || []).map(m => `<option value="${esc(m)}" ${m === tekusht ? 'selected' : ''}>${esc(m)}</option>`).join('')}
                </select>
                ${sled ? `<span style="font-size:12px;color:var(--slate)">следва: <strong>${esc(sled)}</strong></span>` : ''}
            </div>
        </div>`;
    return izbor + _pitaneHtml(st, r) + _pitaneSpisak(st) + `
        <div class="card" style="margin-bottom:16px;font-size:13px">
            <strong style="color:#2e6b32">${gotovi}</strong> събрани ·
            <strong style="color:#8a6522">${chakat}</strong> чакат сега ·
            <strong>${obshto - gotovi - chakat}</strong> още не им е времето
            <div style="font-size:11.5px;color:var(--muted);margin-top:4px">
                Документ, събран веднъж, се носи напред — „влиза в“ показва къде ще го срещнеш пак.
            </div>
        </div>
        <details style="margin-top:4px">
            <summary style="cursor:pointer;font-size:13px;font-weight:600;padding:10px 14px;
                            background:var(--surface);border:1px solid var(--border-light);border-radius:9px">
                Целият списък по моменти (${obshto} документа)
            </summary>
            <div style="margin-top:12px">
                ${r.grupi.map(g => _nadzorGrupaHtml(g, tekusht, izklyucheni, r.po_izbor)).join('')}
            </div>
        </details>`;
}

function nadzorMoment(m) {
    const obekt = _zhivObekt();
    if (!obekt) return;
    _stroezh(obekt).tekusht_moment = m;
    _s2ZapishiTiho(obekt, `Надзор: докъде — ${m || 'не е започнало'}`);
    renderNadzorPage();
}

// Пази се ИЗКЛЮЧЕНИЕТО, не целият списък: „Акт 5“ значи „въпреки решеното, не
// се съставя“, а „+Акт 16“ — „въпреки решеното, съставя се“. Така промяна в
// признаците веднага се отразява, без да влачи стари отметки.
function nadzorSastavya(moment64, da) {
    const obekt = _zhivObekt();
    if (!obekt) return;
    const moment = decodeURIComponent(moment64);
    const st = _stroezh(obekt);
    const spisak = new Set(st.izklyucheni_momenti || []);
    spisak.delete(moment);
    spisak.delete('+' + moment);
    spisak.add(da ? '+' + moment : moment);
    st.izklyucheni_momenti = [...spisak];
    _s2ZapishiTiho(obekt, `Надзор: ${moment} ${da ? 'се съставя' : 'не се съставя'}`);
    renderNadzorPage();
}

function nadzorOtmetni(ime64, da) {
    const obekt = _zhivObekt();
    if (!obekt) return;
    const st = _stroezh(obekt);
    const ime = decodeURIComponent(ime64);
    const spisak = new Set(st.nadzor_otmetnati || []);
    if (da) spisak.add(ime); else spisak.delete(ime);
    st.nadzor_otmetnati = [...spisak];
    _s2ZapishiTiho(obekt, `Надзор: ${ime} — ${da ? 'налично' : 'отметката е махната'}`);
    renderNadzorPage();
}

async function renderKakavPage() {
    const p = _obektIliIzbor('kakav-content', 'kakav',
        'Изберете обекта, чиито проверки се водят');
    if (!p) return;
    const kutiya = document.getElementById('kakav-content');
    // Записките и фактите са НА СТРОЕЖА — един имот може да носи няколко.
    const st = _stroezh(p);
    const chasti = st.zapiski?.chasti || [];
    if (!chasti.length) {
        kutiya.innerHTML = _lentaObekt(p, 'kakav') + _lentaStroezhi(p) + `
            <div class="card">
                <div class="card-title" style="margin-bottom:8px">✔️ Проверки</div>
                <p style="font-size:13px;color:var(--muted);line-height:1.6">
                    Полетата тук се пълнят от <strong>обяснителните записки по частите на проекта</strong>.
                    Още няма прочетени записки за този обект.
                </p>
                <button class="btn btn-primary btn-sm" style="margin-top:10px"
                        onclick="navigateTo('proekt')">📐 Към четенето на записките</button>
            </div>`;
        return;
    }
    kutiya.innerHTML = _lentaObekt(p, 'kakav') + _lentaStroezhi(p)
        + '<div class="card"><div style="color:var(--muted);font-size:13px">Сглобявам от записките…</div></div>';
    try {
        const r = await apiCall('/api/zapiski/rezyume', 'POST',
            { zapiski: chasti, vid: st.vid === 'lineen' ? 'lineen' : 'sgrada',
              ime_na_stroezha: st.stroej || '',
              stari_identifikatori: _nashiteIdent(p) });
        if (r.greshka) throw new Error(r.greshka);
        const novi = _kesSleej(st, _kesPredlozheni(r));
        if (novi) _s2ZapishiTiho(p, `Проверки: ${novi} нови предложения от проекта`);
        kutiya.innerHTML = _lentaObekt(p, 'kakav') + _lentaStroezhi(p) + _kesHtml(st, r);
    } catch (e) {
        kutiya.innerHTML = _lentaObekt(p, 'kakav') + _lentaStroezhi(p)
            + `<div class="alert alert-error">${_s2esc(e.message)}</div>`;
    }
}

function _kesIztochnik(f) {
    const i = f.iztochnik || {};
    const kade = [i.chast, i.stranica ? `стр. ${i.stranica}` : ''].filter(Boolean).join(', ');
    if (!i.citat && !kade) return '';
    return `<div style="margin-top:3px;font-size:11.5px;color:var(--muted);line-height:1.45">`
        + (i.citat ? `„${_s2esc(i.citat)}“` : '')
        + (kade ? ` <span style="white-space:nowrap">— ${_s2esc(kade)}</span>` : '') + '</div>';
}

function _kesDokazHtml(klyuch, f) {
    const d = _KES_DOKAZ[klyuch];
    if (!d) return '';
    const [s_chego, zashto] = d;
    // Прочетено от записките — тогава още НЕ е доказано, колкото и да е ясно.
    const otProekta = f && f.iztochnik && f.iztochnik.chast;
    return `<div style="margin-top:3px;font-size:11.5px;color:${otProekta ? '#b45309' : 'var(--muted)'}">`
        + `${otProekta ? '⚠️ от проекта — ' : ''}доказва се с <strong>${_s2esc(s_chego)}</strong>. ${_s2esc(zashto)}</div>`;
}

function _kesPoleHtml(klyuch, f) {
    const esc = _s2esc, ime = esc(_KES_IME[klyuch] || klyuch);
    const podsk = _KES_PODSKAZKA[klyuch]
        ? `<div style="margin-top:3px;font-size:11.5px;color:var(--muted)">${esc(_KES_PODSKAZKA[klyuch])}</div>` : '';
    const k64 = encodeURIComponent(klyuch);

    if (!f || !f.sastoyanie) {
        const naraka = _KES_NARAKA[klyuch];
        return `<div style="border-left:3px solid ${naraka ? '#d99a00' : 'var(--border)'};padding:3px 0 3px 12px;margin-bottom:11px">
            <div style="font-size:11.5px;color:var(--muted)">${ime}</div>
            <div style="font-size:14.5px;color:${naraka ? '#8a6400' : 'var(--muted)'};font-weight:${naraka ? '700' : '400'}">
                ${naraka ? '[___] вписва се на ръка' : '[ празно ]'}</div>
            ${naraka ? `<div style="margin-top:3px;font-size:11.5px;color:var(--muted)">${esc(naraka)}</div>` : ''}
            ${podsk}${_kesDokazHtml(klyuch, f)}
            <button class="btn btn-ghost btn-sm" style="margin-top:5px" onclick="kesPoprav('${k64}')">Впиши на ръка</button>
        </div>`;
    }

    if (f.sastoyanie === 'sporno') {
        const butoni = (f.varianti || []).map((v, i) => `
            <button class="btn btn-secondary btn-sm" style="margin:3px 5px 0 0"
                    onclick="kesIzberiVariant('${k64}', ${i})">
                ${esc(v.stoynost) || '(празно)'} <span style="opacity:.7">· ${(v.chasti || []).map(esc).join(', ')}</span>
            </button>`).join('');
        return `<div style="border-left:3px solid var(--red,#b33030);background:#fdf4f4;border-radius:0 8px 8px 0;padding:9px 12px;margin-bottom:11px">
            <div style="font-size:11.5px;color:var(--muted)">${ime}</div>
            <div style="font-size:14px;font-weight:700;color:#a02828">остава празно — частите не се връзват</div>
            <div style="margin-top:4px;font-size:12px;color:var(--slate);line-height:1.55">
                ${(f.varianti || []).map(v => `<div><strong>${(v.chasti || []).map(esc).join(', ')}:</strong> ${esc(v.stoynost) || '(няма стойност)'}</div>`).join('')}
            </div>
            <div style="margin-top:6px">${butoni}
                <button class="btn btn-ghost btn-sm" style="margin-top:3px" onclick="kesPoprav('${k64}')">Друга стойност…</button>
            </div>
        </div>`;
    }

    // За ръчните полета предложението е само справка — вписва се на ръка.
    if (f.sastoyanie === 'predlozheno' && _KES_NARAKA[klyuch]) {
        return `<div style="border-left:3px solid #d99a00;background:#fffbef;border-radius:0 8px 8px 0;padding:9px 12px;margin-bottom:11px">
            <div style="font-size:11.5px;color:var(--muted)">${ime}</div>
            <div style="font-size:14.5px;font-weight:700;color:#8a6400">[___] вписва се на ръка</div>
            <div style="margin-top:4px;font-size:12.5px;color:var(--slate)">
                АИ-то прочете: <strong>${esc(f.stoynost) || '(нищо)'}</strong>${_kesIztochnik(f)}
            </div>
            <div style="margin-top:3px;font-size:11.5px;color:var(--muted)">${esc(_KES_NARAKA[klyuch])}</div>
            <button class="btn btn-primary btn-sm" style="margin-top:7px" onclick="kesPoprav('${k64}')">Впиши на ръка</button>
        </div>`;
    }

    if (f.sastoyanie === 'predlozheno') {
        const predishna = f.predishna
            ? `<div style="margin-top:3px;font-size:11.5px;color:#b45309">Ново четене дава друго. Преди беше: ${esc(f.predishna)}</div>` : '';
        return `<div style="border-left:3px solid #d8cfb8;background:var(--surface);border-radius:0 8px 8px 0;padding:9px 12px;margin-bottom:11px">
            <div style="display:flex;align-items:flex-start;gap:10px">
                <div style="flex:1;min-width:0">
                    <div style="font-size:11.5px;color:var(--muted)">${ime}</div>
                    <div style="font-size:14.5px;font-weight:600;color:var(--slate)">${esc(f.stoynost) || '—'}</div>
                    ${_kesIztochnik(f)}${predishna}${podsk}${_kesDokazHtml(klyuch, f)}
                </div>
                <button class="btn btn-primary btn-sm" style="flex-shrink:0;min-width:44px"
                        title="Потвърди" onclick="kesPotvardi('${k64}')">✔</button>
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-top:4px" onclick="kesPoprav('${k64}')">Поправи</button>
        </div>`;
    }

    // потвърдено или поправено
    const znak = _KES_NARAKA[klyuch] ? '✍ вписано на ръка'
        : f.sastoyanie === 'popraveno' ? '✍ поправено' : '✓ потвърдено';
    const koga = f.koga ? new Date(f.koga).toLocaleDateString('bg-BG') : '';
    const bilo = (f.sastoyanie === 'popraveno' && f.prochetena && _kesZn(f.prochetena) !== _kesZn(f.stoynost))
        ? ` <span style="color:var(--muted)">· прочетено беше: ${esc(f.prochetena)}</span>` : '';
    const oshte = (f.varianti || []).length > 1
        ? `<div style="margin-top:3px;font-size:11.5px;color:#b45309">Частите още дават различно — ти избра тази стойност.</div>` : '';
    return `<div style="border-left:3px solid var(--green,#2e7d32);padding:3px 0 3px 12px;margin-bottom:11px">
        <div style="font-size:11.5px;color:var(--muted)">${ime}</div>
        <div style="font-size:14.5px;font-weight:600">${esc(f.stoynost) || '—'}</div>${oshte}
        ${_kesDokazHtml(klyuch, null)}
        <div style="margin-top:2px;font-size:11.5px;color:#2e6b32">${znak}${koga ? ' · ' + esc(koga) : ''}${esc(f.koy ? ' · ' + f.koy : '')}${bilo}</div>
        <div style="margin-top:4px">
            <button class="btn btn-ghost btn-sm" onclick="kesPoprav('${k64}')">Поправи</button>
            <button class="btn btn-ghost btn-sm" onclick="kesOtmeni('${k64}')">Отмени</button>
        </div>
    </div>`;
}

// Независимата проверка: визата казва колко е допустимо, проектът — колко е
// постигнато, КОДЪТ ги сравнява. Това беше смисълът на полетата от самото начало
// (операторът си го спомни, 02.10.2026) и не бива да се губи, като ги четем.
const _SRAVNENIA = [
    ['plytnost_dop', 'plytnost_post', 'Плътност на застрояване', '%', 'maks'],
    ['kint_dop',     'kint_post',     'Коефициент на интензивност', '', 'maks'],
    ['ozelen_dop',   'ozelen_post',   'Озеленяване', '%', 'min'],
    ['korniz_dop',   'korniz_post',   'Кота корниз', 'м', 'maks'],
];

function _chisloOtTekst(v) {
    const m = String(v ?? '').replace(/\s/g, '').match(/-?\d+(?:[.,]\d+)?/);
    return m ? parseFloat(m[0].replace(',', '.')) : null;
}

// Постигнатите плътност и Кинт често не са изписани — смятат се от ЗП и РЗП.
// И НЕ се вярва на пряка стойност, която всъщност е ПЛОЩ: четецът слага „2828,4 м²“
// в „плътност“, а то е застроената площ, не процентът. (Операторът, 02.10.2026)
const _GORNA_GRANICA = { plytnost_post: 100, ozelen_post: 100, kint_post: 20 };

function _postignatoChislo(f, klyuch) {
    const surovo = (f[klyuch] || {}).stoynost;
    const pryako = _chisloOtTekst(surovo);
    const plosht = /м\s*2|м²|m\s*2|m²|кв\.?\s*м/i.test(String(surovo || ''));
    const nadGranica = pryako !== null && _GORNA_GRANICA[klyuch] && pryako > _GORNA_GRANICA[klyuch];
    if (pryako !== null && !plosht && !nadGranica) return { st: pryako, kak: '' };
    const imot = _chisloOtTekst((f.plosht_upi || {}).stoynost);
    if (!imot) return { st: null, kak: '' };
    // Озеленяването в м² се превръща в % от имота; плътността — от ЗП; Кинт — от РЗП.
    const ot = klyuch === 'plytnost_post' ? 'zp'
             : klyuch === 'kint_post' ? 'rzp'
             : klyuch === 'ozelen_post' ? 'ozelen_post' : null;
    const v = ot ? _chisloOtTekst((f[ot] || {}).stoynost) : null;
    if (!v) return { st: null, kak: '' };
    if (klyuch === 'kint_post') return { st: v / imot, kak: `от РЗП ${v} ÷ ${imot} м²` };
    const ime = klyuch === 'plytnost_post' ? 'ЗП' : 'озеленена площ';
    return { st: v / imot * 100, kak: `от ${ime} ${v} м² ÷ ${imot} м²` };
}

function _kesSravneniaHtml(f) {
    const esc = _s2esc, redove = [];
    for (const [kd, kp, ime, merna, posoka] of _SRAVNENIA) {
        const dop = _chisloOtTekst((f[kd] || {}).stoynost);
        const { st: post, kak } = _postignatoChislo(f, kp);
        if (dop === null || post === null) continue;
        const naredno = posoka === 'min' ? post >= dop : post <= dop;
        // „На ръба“: разликата е под 1% — тогава си струва да се погледне чертежът.
        const naRaba = Math.abs(post - dop) < Math.max(Math.abs(dop) * 0.01, 0.01);
        const znak = !naredno ? '⛔' : naRaba ? '⚠️' : '✅';
        const cvyat = !naredno ? '#a02828' : naRaba ? '#b45309' : '#2e6b32';
        redove.push(`<div style="display:flex;gap:10px;align-items:baseline;padding:4px 0;border-bottom:1px solid var(--border-light)">
            <span>${znak}</span>
            <span style="flex:1"><strong>${esc(ime)}</strong>
                <span style="color:var(--muted)">· ${posoka === 'min' ? 'минимум' : 'максимум'} ${dop}${esc(merna)}</span></span>
            <span style="color:${cvyat};font-weight:600">постигнато ${Number(post.toFixed(2))}${esc(merna)}</span>
            ${kak ? `<span style="color:var(--muted);font-size:11.5px">${esc(kak)}</span>` : ''}
            ${naRaba && naredno ? '<span style="color:#b45309;font-size:11.5px">на ръба</span>' : ''}
        </div>`);
    }
    if (!redove.length) return '';
    return `<div class="card" style="margin:0 0 16px">
        <div class="card-title" style="margin-bottom:4px;font-size:13px">📊 Допустимо срещу постигнато</div>
        <p style="font-size:11.5px;color:var(--muted);margin-bottom:8px">
            Визата казва колко е допустимо, проектът — колко е постигнато. Сравнява кодът, не АИ-то.
            „На ръба“ значи разлика под 1% — тогава си струва да се погледне чертежът.
        </p>
        ${redove.join('')}
    </div>`;
}

// ── съставките на строежа ─────────────────────────────────────────────────
// Четат се от заглавието; операторът може да добави или махне. Ръчно
// махнатата не се връща при следващото четене — иначе поправката е напразна.
// Три извора, в ред на доказателствена сила: заглавието на строежа, самите
// записки и потвърдените признаци. Всяка съставка помни ОТКЪДЕ е — иначе
// после няма как да се каже защо системата пита това, което пита.
// (Операторът, 19.10.2026: „асансьорът го има в записката, не в заглавието“.)
function _kesSastavkiNa(p) {
    const r = p.sastavki || {};
    const ot = [
        ..._sastavki([p.stroej, p.name].filter(Boolean).join(' · '), 'заглавието'),
        ..._sastavki(_tekstZapiski(p), 'записките'),
        ..._sastavkiOtPriznaci(p),
        ...(r.dobaveni || []).map(k => {
            const s = _SASTAVKI.find(x => x.kod === k);
            return s && { ...s, ot: 'вписана на ръка' };
        }).filter(Boolean),
    ];
    const vidyani = new Set();
    return ot
        .filter(s => !(r.mahnati || []).includes(s.kod))
        .filter(s => !vidyani.has(s.kod) && vidyani.add(s.kod))
        // Каже ли някой извор какъв е трафопостът, неясният отпада.
        .filter(s => s.kod !== 'tp_neyasen'
            || !ot.some(x => ['shtp', 'bktp', 'zru'].includes(x.kod)));
}

function _kesSastavkiHtml(p, sast) {
    const esc = _s2esc;
    const r = p.sastavki || {};
    const pitat = sast.filter(s => s.pita);
    return `
        <div class="card" style="margin:0 0 16px">
            <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:4px">
                <div class="card-title" style="margin:0;font-size:13px">\u{1F9F1} От какво е съставен строежът</div>
                <span style="font-size:11.5px;color:var(--muted)">${sast.length
                    ? sast.length + ' съставки — прочетени от заглавието'
                    : 'заглавието не казва — питат се всички полета'}</span>
            </div>
            <p style="font-size:11.5px;color:var(--muted);margin-bottom:10px">
                От тях зависи кое изобщо се пита. Шахтов трафопост не носи кота било и виза;
                надземен БКТП ги носи. Сбърка ли, поправи тук.
            </p>
            <div style="font-size:12.5px;line-height:2">
                ${sast.map(s => `<span style="display:inline-block;border:1px solid var(--border);
                        border-radius:12px;padding:1px 10px;margin:0 6px 6px 0"
                        title="от ${esc(s.ot || '')}">${esc(s.ime)}
                    <span style="color:var(--muted);font-size:11px">· ${esc(s.ot || '')}</span>
                    <button class="btn btn-ghost btn-sm" style="padding:0 4px"
                            onclick="kesMahniSastavka('${s.kod}')">×</button></span>`).join('')
                || '<span style="color:var(--muted)">няма разпозната съставка</span>'}
            </div>
            ${pitat.length ? `<div class="alert alert-warning" style="margin:8px 0 0"><div>
                ${pitat.map(s => `<div><strong>${esc(s.ime)}</strong> — ${esc(s.pita)}
                    <button class="btn btn-secondary btn-sm" onclick="kesDobaviSastavka('bktp')">надземен</button>
                    <button class="btn btn-secondary btn-sm" onclick="kesDobaviSastavka('shtp')">подземен</button>
                </div>`).join('')}
            </div></div>` : ''}
            <button class="btn btn-ghost btn-sm" style="margin-top:8px"
                    onclick="kesDobaviSastavka('')">+ добави съставка</button>
            ${(r.mahnati || []).length ? `<div style="font-size:11px;color:var(--muted);margin-top:6px">
                махнати на ръка: ${(r.mahnati || []).map(k =>
                    esc((_SASTAVKI.find(x => x.kod === k) || {}).ime || k)).join(' · ')}</div>` : ''}
        </div>`;
}

function _kesSastavkiZapis(p) {
    return (p.sastavki = p.sastavki || { dobaveni: [], mahnati: [] });
}

function kesMahniSastavka(kod) {
    const obekt = _zhivObekt(); if (!obekt) return;
    const p = _stroezh(obekt), r = _kesSastavkiZapis(p);
    r.dobaveni = (r.dobaveni || []).filter(x => x !== kod);
    if (!(r.mahnati || []).includes(kod)) (r.mahnati = r.mahnati || []).push(kod);
    _s2ZapishiTiho(obekt, `Проверки: махната съставка „${
        (_SASTAVKI.find(x => x.kod === kod) || {}).ime || kod}“`);
    renderKakavPage();
}

function kesDobaviSastavka(kod) {
    const obekt = _zhivObekt(); if (!obekt) return;
    const p = _stroezh(obekt), r = _kesSastavkiZapis(p);
    if (!kod) {
        const spisak = _SASTAVKI.map((s, i) => `${i + 1}. ${s.ime}`).join(String.fromCharCode(10));
        const o = prompt('Коя съставка да добавя?' + String.fromCharCode(10, 10) + spisak);
        if (o === null) return;
        const i = parseInt(o, 10) - 1;
        if (!_SASTAVKI[i]) return;
        kod = _SASTAVKI[i].kod;
    }
    r.mahnati = (r.mahnati || []).filter(x => x !== kod);
    if (!(r.dobaveni || []).includes(kod)) (r.dobaveni = r.dobaveni || []).push(kod);
    // Казано ли е какъв е трафопостът, неясният отпада.
    if (kod === 'bktp' || kod === 'shtp') {
        if (!r.mahnati.includes('tp_neyasen')) r.mahnati.push('tp_neyasen');
    }
    _s2ZapishiTiho(obekt, `Проверки: добавена съставка „${
        (_SASTAVKI.find(x => x.kod === kod) || {}).ime || kod}“`);
    renderKakavPage();
}

// Разминаванията между потвърденото и паспорта. Не се решават тихо: виждаш
// двете стойности и избираш. (Операторът, 19.10.2026.)
function _kesRazminavaniaHtml(p) {
    const esc = _s2esc;
    const spisak = Object.values((p && p.razminavania) || {});
    if (!spisak.length) return '';
    return `
        <div class="alert alert-warning" style="margin:0 0 16px"><div>
            <strong>Потвърденото се разминава с паспорта на ${spisak.length}
                ${spisak.length === 1 ? 'място' : 'места'}</strong>
            <div style="font-size:12.5px;margin-top:8px;line-height:1.9">
                ${spisak.map(r => `<div style="padding:4px 0;border-bottom:1px solid var(--border-light)">
                    <strong>${esc(r.ime || r.pole)}</strong><br>
                    от проекта: <strong>${esc(r.ot_proekt)}</strong> ·
                    в паспорта: <strong>${esc(r.v_pasporta)}</strong>
                    ${r.samo_sverka ? `<span style="color:var(--muted);font-size:11.5px">
                        — само се сверява; това поле се пипа на своето място</span>`
                    : `<button class="btn btn-secondary btn-sm" style="margin-left:8px"
                            onclick="kesVzemiOtProekta('${encodeURIComponent(r.pole)}')">вземи от проекта</button>
                       <button class="btn btn-ghost btn-sm"
                            onclick="kesOstaviPasporta('${encodeURIComponent(r.pole)}')">остави паспорта</button>`}
                </div>`).join('')}
            </div>
        </div></div>`;
}

function _kesRazminavane(pole64) {
    const obekt = _zhivObekt();
    if (!obekt) return {};
    const p = _stroezh(obekt);
    const pole = decodeURIComponent(pole64);
    return { obekt, p, pole, r: ((p.razminavania || {})[pole]) };
}

function kesVzemiOtProekta(pole64) {
    const { obekt, p, pole, r } = _kesRazminavane(pole64);
    if (!r || r.samo_sverka) return;
    const nosach = r.kade === 'stroezh' ? p
        : r.kade === 'osip' ? (obekt.osip = obekt.osip || {}) : obekt;
    nosach[pole] = r.ot_proekt;
    delete p.razminavania[pole];
    _s2ZapishiTiho(obekt, `Проверки: „${r.ime || pole}“ — взето от проекта`);
    renderKakavPage();
}

function kesOstaviPasporta(pole64) {
    const { obekt, p, pole, r } = _kesRazminavane(pole64);
    if (!r) return;
    delete p.razminavania[pole];
    _s2ZapishiTiho(obekt, `Проверки: „${r.ime || pole}“ — остава както е в паспорта`);
    renderKakavPage();
}

function _kesHtml(p, r) {
    const f = p.fakti || {};
    const broi = v => _KES_POLETA.filter(([k]) => (f[k]?.sastoyanie || 'prazno') === v).length;
    const potv = broi('potvardeno') + broi('popraveno');
    const predl = broi('predlozheno'), sporni = broi('sporno');
    // Броят е от ПРИЛОЖИМИТЕ за този строеж — иначе „31 празни“ казва само,
    // че обектът не е сграда. (19.10.2026)
    // Съставките се четат от ЗАГЛАВИЕТО на строежа — безплатно и веднага.
    // Операторът може да ги поправи; поправените бият прочетените.
    const sast = _kesSastavkiNa(p);
    const vsichki = _KES_POLETA.filter(([k]) => f[k] || _kesPriloshim(k, p.vid || '', sast)).length;
    const prazni = Math.max(0, vsichki - potv - predl - sporni);
    const zaPotvarzhdavane = _KES_POLETA.filter(([k]) => f[k]?.sastoyanie === 'predlozheno').map(([k]) => k);

    // Двете групи бяха една до друга в равни колони, а са 36 срещу 10 полета:
    // дясната свършваше веднага и се губеше, макар да е по-важната — от нея
    // зависи кои актове изобщо се съставят. Сега са една под друга, всяка на
    // цялата ширина, с толкова стълба, колкото се събират. (14.10.2026)
    // Неприложимите за този вид строеж не се питат — но ако четецът ВСЕ ПАК е
    // намерил стойност, полето се показва: това е най-интересният случай,
    // значи нещо не се връзва. (Операторът, 19.10.2026: „десет полета са
    // несъстоятелни за външно кабелно захранване“.)
    const vidStroezh = p.vid || '';
    const grupa = (ime, zaglavie, poyasnenie) => {
        const vsichki2 = _KES_POLETA.filter(([, , g]) => g === ime);
        const poleta = vsichki2.filter(([k]) => f[k] || _kesPriloshim(k, vidStroezh, sast));
        const nepriloshimi = vsichki2.filter(([k]) => !f[k] && !_kesPriloshim(k, vidStroezh, sast));
        const chakat = poleta.filter(([k]) => f[k]?.sastoyanie === 'predlozheno').length;
        return `
        <div class="card" style="margin:0 0 16px">
            <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:4px">
                <div class="card-title" style="margin:0;font-size:13px">${zaglavie}</div>
                <span style="font-size:11.5px;color:var(--muted)">${poleta.length} полета${
                    chakat ? ` · <strong style="color:#8a6522">${chakat} чакат ✔</strong>` : ''}</span>
            </div>
            <p style="font-size:11.5px;color:var(--muted);margin-bottom:12px">${poyasnenie}</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
                        gap:0 20px;align-items:start">
                ${poleta.map(([k]) => _kesPoleHtml(k, f[k])).join('')}
            </div>
            ${nepriloshimi.length ? `
            <details style="margin-top:10px">
                <summary style="cursor:pointer;font-size:11.5px;color:var(--muted)">
                    не се отнасят за този строеж · ${nepriloshimi.length}</summary>
                <div style="font-size:11.5px;color:var(--muted);margin-top:6px;line-height:1.8">
                    ${nepriloshimi.map(([, i]) => _s2esc(i)).join(' · ')}
                    <div style="margin-top:4px">Появи ли се стойност за някое от тях, полето се
                        връща горе — значи нещо не се връзва.</div>
                </div>
            </details>` : ''}
        </div>`;
    };

    return `
        <div class="card" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
            <div style="font-size:13px;color:var(--slate)">
                <strong style="color:#2e6b32">${potv}</strong> потвърдени ·
                <strong style="color:#8a6522">${predl}</strong> чакат твоето ✔ ·
                <strong style="color:#b33030">${sporni}</strong> спорни ·
                <strong>${prazni}</strong> празни
            </div>
            ${predl ? `<button class="btn btn-primary btn-sm" style="margin-left:auto"
                onclick="kesPotvardiVsichki('${encodeURIComponent(JSON.stringify(zaPotvarzhdavane))}')">
                ✔ Потвърди всички ${predl}</button>` : ''}
        </div>
        ${_kesSastavkiHtml(p, sast)}
        ${_kesSravneniaHtml(f)}
        ${_kesRazminavaniaHtml(p)}
        ${(r.razminavania || []).length ? `<div class="alert alert-warning">
            Записките не се връзват на ${r.razminavania.length}
            ${r.razminavania.length === 1 ? 'място' : 'места'} — спорните полета по-долу остават празни,
            докато не избереш коя част е права.</div>` : ''}
        ${grupa('drugo', '📄 От документите и на ръка',
            'Проектът не ги казва — идват от разрешението, от нотариалния акт или от теб. От тях зависи кои актове се съставят.')}
        ${grupa('proekt', '📐 От проекта',
            'Прочетено от записките по частите. Всяка стойност носи цитата си.')}
        <p style="font-size:12px;color:var(--muted);margin-top:12px">
            Сивото чака теб: клик на ✔ го прави твое и то влиза в документите.
            Поправката бие всичко, а прочетеното се помни.
        </p>`;
}

// ── Действията ──────────────────────────────────────────────
function _kesFakt(k64) {
    const obekt = _zhivObekt();
    const k = decodeURIComponent(k64);
    if (!obekt) return {};
    const p = _stroezh(obekt);          // фактите са на строежа
    p.fakti = p.fakti || {};
    return { p, obekt, k, f: p.fakti[k] };
}

function _kesZapishi(p, opis) {
    // Записва се ОБЕКТЪТ — строежът живее в него.
    const obekt = _zhivObekt() || p;
    _pokazateliKamGrad(obekt, p);
    _priznaciKamPoleta(p);
    // Потвърденото тече и към паспорта — празното се попълва, различното се
    // показва като разминаване и не се подменя тихо. (19.10.2026)
    _priznaciKamPasport(obekt, p);
    _vazlozhitelKamPasport(obekt, p);
    _s2ZapishiTiho(obekt, opis);
    renderKakavPage();
}

function kesPotvardi(k64) {
    const { p, k, f } = _kesFakt(k64);
    if (!p || !f) return;
    // Втора ключалка: и да се извика отнякъде, ръчното поле не се потвърждава.
    if (_KES_NARAKA[k]) return kesPoprav(k64);
    p.fakti[k] = { ...f, sastoyanie: 'potvardeno', koy: _s2Koy(), koga: new Date().toISOString() };
    _kesZapishi(p, `Проверки: потвърдено „${_KES_IME[k] || k}“`);
}

function kesPoprav(k64) {
    const { p, k, f } = _kesFakt(k64);
    if (!p) return;
    const izbor = _KES_IZBOR[k];
    const podkana = izbor
        ? `${_KES_IME[k] || k}:` + String.fromCharCode(10, 10)
          + izbor.map((x, i) => `${i + 1}. ${x}`).join(String.fromCharCode(10))
          + String.fromCharCode(10, 10) + 'Номер или текст:'
        : `${_KES_IME[k] || k}:`;
    let nova = prompt(podkana, (f && f.stoynost) || '');
    if (nova === null) return;
    // „2“ при списък значи втората възможност.
    if (izbor && /^\d+$/.test(nova.trim())) {
        const n = Number(nova.trim()) - 1;
        if (n >= 0 && n < izbor.length) nova = izbor[n];
    }
    p.fakti[k] = { ...(f || {}), sastoyanie: 'popraveno', stoynost: nova.trim(),
                   prochetena: (f && f.prochetena) || '', varianti: null,
                   koy: _s2Koy(), koga: new Date().toISOString() };
    _kesZapishi(p, `Проверки: поправено „${_KES_IME[k] || k}“`);
}

function kesIzberiVariant(k64, i) {
    const { p, k, f } = _kesFakt(k64);
    if (!p || !f) return;
    const v = (f.varianti || [])[i];
    if (!v) return;
    p.fakti[k] = { ...f, sastoyanie: 'popraveno', stoynost: v.stoynost, prochetena: '',
                   iztochnik: { chast: (v.chasti || []).join(', '), citat: '' },
                   varianti: f.varianti, koy: _s2Koy(), koga: new Date().toISOString() };
    _kesZapishi(p, `Проверки: избрано „${_KES_IME[k] || k}“ по ${(v.chasti || []).join(', ')}`);
}

function kesOtmeni(k64) {
    const { p, k, f } = _kesFakt(k64);
    if (!p || !f) return;
    // Връща се към прочетеното; ако няма такова — полето изчезва.
    if (f.prochetena) p.fakti[k] = { ...f, sastoyanie: 'predlozheno', stoynost: f.prochetena, koy: '', koga: '' };
    else delete p.fakti[k];
    _kesZapishi(p, `Проверки: отменено „${_KES_IME[k] || k}“`);
}

function kesPotvardiVsichki(spisak64) {
    const obekt = _zhivObekt();
    if (!obekt) return;
    const p = _stroezh(obekt);
    const kluchove = JSON.parse(decodeURIComponent(spisak64));
    if (!confirm(`Потвърждаваш ${kluchove.length} стойности наведнъж.\n\nВсички ли си проверила?`)) return;
    const koy = _s2Koy(), koga = new Date().toISOString();
    let n = 0;
    for (const k of kluchove) {
        const f = (p.fakti || {})[k];
        if (!f || f.sastoyanie !== 'predlozheno') continue;
        if (_KES_NARAKA[k]) continue;        // ръчните не минават накуп
        p.fakti[k] = { ...f, sastoyanie: 'potvardeno', koy, koga };
        n++;
    }
    _kesZapishi(p, `Проверки: потвърдени ${n} стойности`);
}

function renderZapiskiKarta() {
    const box = document.getElementById('zapiski-karta');
    if (!box) return;
    const obekt = _zhivObekt();
    if (!obekt) { box.innerHTML = ''; return; }
    const p = _krug(_stroezh(obekt));   // записките са в КРЪГА на оценката
    const z = p.zapiski || {};
    const chasti = z.chasti || [];
    box.innerHTML = _lentaStroezhi(obekt) + _krugLenta(obekt) + `
        <div class="card" style="margin-bottom:16px">
            <div class="card-title" style="margin-bottom:8px">📐 Прочети записките по частите на проекта</div>
            <p style="font-size:12px;color:var(--muted);margin-bottom:10px">
                Проектът знае това, което системата иначе пита теб: има ли газ, гараж, асансьор,
                колко етажа, какви материали се влагат. Качи обяснителните записки —
                кодът вади признаците, материалите и числата, и показва къде частите
                <strong>не се връзват помежду си</strong>.
                <br><strong>Записка на .docx или текстов PDF се чете безплатно</strong> — само сканите минават през АИ.
                Стар <code>.doc</code> не се чете: запиши го като .docx.
            </p>
            <div class="form-grid" style="margin-bottom:10px">
                <div class="form-group">
                    <label class="form-label">Файлове с записките</label>
                    <input type="file" id="zp-fajlove" class="form-input" multiple
                           accept=".pdf,.docx,.md,.txt,.jpg,.jpeg,.png,.webp,.tif,.tiff">
                </div>
                <div class="form-group">
                    <label class="form-label">Четец</label>
                    <select id="zp-chetec" class="form-input">
                        <option value="auto">Автоматично (основен, с резервен)</option>
                        <option value="claude">Само Claude</option>
                        <option value="mistral">Само Mistral</option>
                    </select>
                </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button type="button" class="btn btn-primary btn-sm" onclick="zapiskiCheti()">📖 Прочети записките</button>
                ${chasti.length ? `<button type="button" class="btn btn-secondary btn-sm" onclick="zapiskiRezyume()">🔁 Сглоби пак</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="zapiskiIzchisti()">Изчисти</button>` : ''}
            </div>
            <div id="zp-hod" style="font-size:12px;color:var(--muted);margin-top:10px"></div>
            <div id="zp-rezultat" style="margin-top:12px"></div>
        </div>`;
    if (chasti.length) zapiskiRezyume();
}

async function zapiskiCheti() {
    const obekt = _zhivObekt();
    if (!obekt) { showAlert('error', 'Първо избери обект.'); return; }
    const p = _krug(_stroezh(obekt));     // записките са в КРЪГА на оценката
    const fajlove = [...(document.getElementById('zp-fajlove')?.files || [])];
    if (!fajlove.length) { showAlert('error', 'Избери записките.'); return; }
    const hod = document.getElementById('zp-hod');
    const z = (p.zapiski = p.zapiski || { chasti: [] });
    hod.innerHTML = fajlove.map((f, i) => `<div id="zp-f-${i}">· ${_s2esc(f.name)}</div>`).join('');
    const znak = (i, t) => { const e = document.getElementById('zp-f-' + i); if (e) e.innerHTML = t; };
    let prochetiniJs = 0;
    for (let i = 0; i < fajlove.length; i++) {
        const f = fajlove[i], ime = _s2esc(f.name);
        if (/\.doc$/i.test(f.name)) { znak(i, `⚠️ ${ime} — стар .doc, запиши го като .docx`); continue; }
        if (f.size > 25 * 1024 * 1024) { znak(i, `⚠️ ${ime} — над 25 MB`); continue; }
        znak(i, `⏳ ${ime} — чета…`);
        try {
            const r = await apiCall('/api/zapiski/chete', 'POST', {
                pi: obekt.pi, chetec: document.getElementById('zp-chetec')?.value || 'auto',
                fajl: { ime: f.name, media_type: f.type, data: await fileToBase64(f) },
            });
            if (r.greshka) { znak(i, `⚠️ ${ime} — ${_s2esc(r.greshka)}`); continue; }
            const zap = r.zapiska;
            // Ново четене на същата част заменя старото ѝ четене.
            z.chasti = z.chasti.filter(x => x.fajl !== f.name);
            z.chasti.push(zap);
            prochetiniJs++;
            znak(i, `✓ ${ime} — <strong>${_s2esc(zap.chast_ime || zap.chast_kod || '?')}</strong>`
                + ` · ${(zap.priznaci || []).length} признака · ${(zap.materiali || []).length} материала`
                + (zap.ot_tekst ? ' <span style="color:var(--green,#2e7d32)">· от текст (безплатно)</span>'
                               : zap.sken ? ' <span style="color:var(--muted)">· скан</span>' : '')
                + ` <span style="color:var(--muted)">· ${_s2esc(zap.chetec || '')}</span>`
                // Защо не е чел основният — иначе „резервен“ стои без причина и
                // при следващия отказ няма от какво да се тръгне. (19.10.2026)
                + (zap.zashto_rezerven
                    ? `<div style="font-size:11px;color:#8a6400;margin-left:14px">основният не можа: ${
                        _s2esc(String(zap.zashto_rezerven).slice(0, 160))}</div>` : ''));
        } catch (e) {
            znak(i, `❌ ${ime} — ${_s2esc(e.message)}`);
        }
    }
    if (prochetiniJs) {
        z.koga = new Date().toISOString();
        _zapishiObekt(obekt, `Записки: прочетени ${prochetiniJs} части`);
    }
    zapiskiRezyume();
}

// Премества една записка към друг строеж в същия имот. Операторът, 02.10.2026:
// „ако сме му казали канал, а му предлагам архитектура, редно е да ги различава“.
// Различаването без местене би било половин работа.
// Всички номера на ТОЗИ имот: текущият плюс предишните. Виж `stari_identifikatori`.
function _nashiteIdent(obekt) {
    return [obekt?.pi, ...(obekt?.stari_identifikatori || [])].filter(Boolean);
}

// Операторът познава имота си: един клик и старият номер влиза в списъка.
function priemiStarIdent(spisak64) {
    const p = _zhivObekt();
    if (!p) return;
    let novi;
    try { novi = JSON.parse(decodeURIComponent(spisak64)); } catch (e) { novi = [decodeURIComponent(spisak64)]; }
    novi = (Array.isArray(novi) ? novi : [novi]).map(x => String(x).trim()).filter(Boolean);
    if (!novi.length) return;
    const spisak = p.stari_identifikatori || [];
    for (const x of novi) if (!spisak.includes(x)) spisak.push(x);
    p.stari_identifikatori = spisak;
    _zapishiObekt(p, `Стари идентификатори на имота: ${novi.join(', ')}`);
    _prerisuvai();
}

function zapiskiPremesti(fajl64) {
    const obekt = _zhivObekt();
    if (!obekt) return;
    const fajl = decodeURIComponent(fajl64);
    const ot = _stroezh(obekt);
    const spisak = _stroezhi(obekt), tekusht = _indeksStroezh(obekt);
    const drugi = spisak.map((st, i) => ({ st, i })).filter(x => x.i !== tekusht);

    let kam;
    if (!drugi.length) {
        if (!confirm('В имота има само един строеж.' + String.fromCharCode(10) + String.fromCharCode(10) + 'Да създам нов за „' + fajl + '“?')) return;
        const ime = prompt('Наименование на новия строеж:', '');
        if (ime === null) return;
        (obekt.stroezhi_dop = obekt.stroezhi_dop || []).push({ stroej: ime.trim() });
        kam = _stroezhi(obekt)[_brojStroezhi(obekt) - 1];
    } else if (drugi.length === 1) {
        kam = drugi[0].st;
        if (!confirm(`Да преместя „${fajl}“ в „${_imeStroezh(kam, drugi[0].i)}“?`)) return;
    } else {
        const red = drugi.map((x, n) => (n + 1) + '. ' + _imeStroezh(x.st, x.i)).join(String.fromCharCode(10));
        const izbor = prompt('Към кой строеж да преместя „' + fajl + '“?' + String.fromCharCode(10) + String.fromCharCode(10) + red + String.fromCharCode(10) + String.fromCharCode(10) + 'Номер:', '1');
        if (izbor === null) return;
        const n = Number(izbor) - 1;
        if (!(n >= 0 && n < drugi.length)) { showAlert('error', 'Няма такъв номер.'); return; }
        kam = drugi[n].st;
    }

    const chasti = (ot.zapiski && ot.zapiski.chasti) || [];
    const mestim = chasti.filter(z => z.fajl === fajl);
    if (!mestim.length) { showAlert('error', 'Не намирам тази записка.'); return; }
    ot.zapiski.chasti = chasti.filter(z => z.fajl !== fajl);
    const kamZ = (kam.zapiski = kam.zapiski || { chasti: [] });
    kamZ.chasti = (kamZ.chasti || []).filter(z => z.fajl !== fajl).concat(mestim);
    kamZ.koga = new Date().toISOString();
    _zapishiObekt(obekt, `Записка „${fajl}“ → друг строеж`);
    _prerisuvai();
}

function zapiskiIzchisti() {
    const obekt = _zhivObekt();
    const p = obekt && _krug(_stroezh(obekt));
    if (!p || !p.zapiski) return;
    if (!confirm('Да изчистя прочетените записки за този строеж?')) return;
    delete p.zapiski;
    _zapishiObekt(obekt, 'Записки: прочетеното е изчистено');
    renderZapiskiKarta();
}

async function zapiskiRezyume() {
    const obekt = _zhivObekt();
    const p = obekt && _krug(_stroezh(obekt));
    const kutiya = document.getElementById('zp-rezultat');
    if (!p || !kutiya) return;
    const chasti = p.zapiski?.chasti || [];
    if (!chasti.length) { kutiya.innerHTML = ''; return; }
    kutiya.innerHTML = '<div style="color:var(--muted);font-size:12px">Сглобявам…</div>';
    try {
        const r = await apiCall('/api/zapiski/rezyume', 'POST',
            { zapiski: chasti, vid: p.vid === 'lineen' ? 'lineen' : 'sgrada',
              ime_na_stroezha: p.stroej || '',
              stari_identifikatori: _nashiteIdent(obekt) });
        if (r.greshka) { kutiya.innerHTML = `<div class="alert alert-error">${_s2esc(r.greshka)}</div>`; return; }
        const stroezh = _krug(_stroezh(obekt));
        _blSleej(stroezh, r);
        kutiya.innerHTML = _blHtml(stroezh) + _zapiskiHtml(r);
    } catch (e) {
        kutiya.innerHTML = `<div class="alert alert-error">${_s2esc(e.message)}</div>`;
    }
}

// Три почти еднакви изречения по 200 знака са нечетими — не се вижда КЪДЕ се
// различават. Реже се общото начало и общият край, показва се само разликата,
// с малко контекст. (01.10.2026, след първото четене на истински записки)
function _zpRazliki(varianti) {
    const tekst = varianti.map(v => String(v.stoynost ?? ''));
    if (tekst.length < 2 || tekst.some(t => t.length < 40)) return null;

    // Първо по ДУМИ: дългите наименования се различават на две-три места
    // наведнъж („VIII“ срещу „VНI“ И „Sofia“ срещу „София“), а рязането на общо
    // начало и край тогава връща почти целия текст.
    const dumi = tekst.map(t => t.split(/\s+/));
    if (dumi.every(d => d.length === dumi[0].length) && dumi[0].length > 6) {
        const razlichni = [];
        for (let i = 0; i < dumi[0].length; i++)
            if (dumi.some(d => d[i] !== dumi[0][i])) razlichni.push(i);
        if (razlichni.length && razlichni.length <= dumi[0].length / 3)
            return dumi.map(d => ({ samo_dumi: razlichni.map(i => d[i]) }));
    }

    // Иначе: общото начало и краят се режат, показва се средата с малко контекст.
    let nach = 0;
    const naiKratak = Math.min(...tekst.map(t => t.length));
    while (nach < naiKratak && tekst.every(t => t[nach] === tekst[0][nach])) nach++;
    let kraj = 0;
    while (kraj < naiKratak - nach
           && tekst.every(t => t[t.length - 1 - kraj] === tekst[0][tekst[0].length - 1 - kraj])) kraj++;
    if (nach + kraj < 30) return null;
    const K = 22;
    return tekst.map(t => ({
        predi: (nach > K ? '…' : '') + t.slice(Math.max(0, nach - K), nach),
        razlika: t.slice(nach, t.length - kraj),
        sled: t.slice(t.length - kraj, t.length - kraj + K) + (kraj > K ? '…' : ''),
    }));
}

// Дума с латиница И кирилица наведнъж почти винаги идва от разчитането на скан
// (ABBYY), не от проекта: „VНI-503“ е „VIII-503“ с кирилско Н. Казва се, не се
// поправя — поправката е на човека. (01.10.2026, казано от оператора)
function _zpOcr(v) {
    const belezhki = [];
    if ((v.smesena || []).length)
        belezhki.push(['в думата има и латиница, и кирилица', v.smesena]);
    // Номерът на УПИ е римско число. „VHI“ не е — ABBYY е прочел двете „II“
    // като едно „H“, при това латинско, тоест нищо не се смесва.
    // Операторът, 01.10.2026: „ако не е римско число, не е УПИ“ — това е
    // правило, не предположение. Затова се казва направо.
    if ((v.nevalidno || []).length)
        belezhki.push(['номерът на УПИ е римско число — това не е', v.nevalidno]);
    if (!belezhki.length) return '';
    return belezhki.map(([zashto, dumi]) =>
        ` <span style="color:#b45309;font-size:11px" title="Най-често идва от разчитането на скан">`
        + `⚠️ ${_s2esc(zashto)}: ${dumi.map(_s2esc).join(', ')}`
        + ` <span style="color:var(--muted)">(най-често от разчитането на скан)</span></span>`).join('');
}

function _zpVariantiHtml(x) {
    const esc = _s2esc;
    const chasti = v => (v.chasti || []).map(esc).join(', ');
    const razliki = _zpRazliki(x.varianti || []);
    if (!razliki) {
        return (x.varianti || []).map(v => `<div style="margin-left:14px">
            ${esc(v.stoynost)} <span style="color:var(--muted)">— ${chasti(v)}</span>${_zpOcr(v)}</div>`).join('');
    }
    return razliki.map((r, i) => `<div style="margin-left:14px">
        ${r.samo_dumi
            ? r.samo_dumi.map(d => `<mark style="background:#fde68a;padding:0 2px">${esc(d)}</mark>`).join(' <span style="color:var(--muted)">…</span> ')
            : `<span style="color:var(--muted)">${esc(r.predi)}</span><mark style="background:#fde68a;padding:0 2px">${esc(r.razlika) || '(нищо)'}</mark><span style="color:var(--muted)">${esc(r.sled)}</span>`}
        <span style="color:var(--muted)">— ${chasti(x.varianti[i])}</span>${_zpOcr(x.varianti[i])}</div>`).join('');
}

function _zpRed(x) {
    const str = x.stranica ? ` <span style="color:var(--muted)">стр. ${x.stranica}</span>` : '';
    const chast = x.chast ? ` <span style="color:var(--muted)">· ${_s2esc(x.chast)}</span>` : '';
    const citat = x.citat ? `<div style="color:var(--muted);font-size:11px;margin-left:14px">„${_s2esc(x.citat)}“${str}</div>` : '';
    const glava = [x.kakvo, x.material, x.ime, x.akt].find(v => v) || '';
    const opis = [x.opisanie, x.kade, x.chlen, x.zashto].filter(v => v).join(' · ');
    const chislo = x.stoynost ? ` — <strong>${_s2esc(x.stoynost)}${x.merna ? ' ' + _s2esc(x.merna) : ''}</strong>` : '';
    return `<div style="padding:4px 0;border-bottom:1px solid var(--border-light)">
        ${_s2esc(glava)}${chislo}${opis ? ` <span style="color:var(--muted)">(${_s2esc(opis)})</span>` : ''}${chast}
        ${citat}</div>`;
}

// ═══════════════════════════════════════════════════════════
//  ТЕКСТОВИТЕ БЛОКОВЕ ОТ ЗАПИСКИТЕ (15.10.2026)
// ═══════════════════════════════════════════════════════════
// Измерено от истински обект: окончателният доклад е 93 % преписан текст,
// Акт 15 — 88 %. Описанията идват от записките и после се копират между
// четирите документа на ръка.
//
// Блокът се пази на СТРОЕЖА, с ключ част + подзаглавие, за да преживее ново
// четене. Състоянията са същите като при полетата: предложено → потвърдено
// или поправено. Само потвърденото влиза в документ.

const _BL_SASTOYANIA = { predlozheno: '', potvardeno: '\u2713 потвърден',
                         popraveno: '\u270d поправен' };

const _blKlyuch = (chast, podzaglavie) =>
    (chast || '') + ' · ' + String(podzaglavie || '').trim().toLowerCase();

function _blVzemi(p) { return (p.blokove = p.blokove || {}); }

// Прочетеното се слива със запазеното: потвърденият текст НЕ се подменя от
// ново четене — казва се, че записката вече дава друго.
function _blSleej(p, r) {
    const pazeni = _blVzemi(p);
    for (const chast of r.blokove || []) {
        for (const razdel of chast.razdeli || []) {
            const k = _blKlyuch(chast.chast, razdel.podzaglavie);
            const b = pazeni[k];
            if (!b) {
                pazeni[k] = { chast: chast.chast, chast_kod: chast.chast_kod || '',
                              podzaglavie: razdel.podzaglavie,
                              tekst: razdel.tekst, prochetan: razdel.tekst,
                              fajl: chast.fajl, stranica: razdel.stranica,
                              // Ролята и поредността идват от четеца: по тях се
                              // решава кое влиза в доклада и в какъв ред.
                              rolya: razdel.rolya || 'описание', red: razdel.red || 0,
                              sastoyanie: 'predlozheno' };
                continue;
            }
            // Кодът на частта допълва вече пазените блокове — той определя
            // реда в доклада.
            if (!b.chast_kod && chast.chast_kod) b.chast_kod = chast.chast_kod;
            if (!b.rolya && razdel.rolya) b.rolya = razdel.rolya;
            if (!b.red && razdel.red) b.red = razdel.red;
            if (b.prochetan !== razdel.tekst) {
                b.prochetan = razdel.tekst;
                b.novo_chetene = b.sastoyanie === 'predlozheno' ? '' : razdel.tekst;
                if (b.sastoyanie === 'predlozheno') b.tekst = razdel.tekst;
            }
        }
    }
    return pazeni;
}

function _blHtml(p) {
    const esc = _s2esc;
    const vsichki = Object.entries(_blVzemi(p));
    if (!vsichki.length) return '';
    const poChasti = {};
    for (const [k, b] of vsichki) (poChasti[b.chast || 'Друга част'] ||= []).push([k, b]);
    const chakat = vsichki.filter(([, b]) => b.sastoyanie === 'predlozheno').length;

    return `
        <div class="card" style="margin-bottom:16px">
            <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:4px">
                <div class="card-title" style="margin:0">\u{1F4DD} Текстът за документите</div>
                <span style="font-size:11.5px;color:var(--muted)">${vsichki.length} блока${
                    chakat ? ` \u00b7 <strong style="color:#8a6522">${chakat} чакат \u2713</strong>` : ''}</span>
            </div>
            <p style="font-size:11.5px;color:var(--muted);margin-bottom:12px">
                Това е описателният текст от записките. Влиза дословно в комплексния доклад,
                а после — обърнат в сегашно време — в Акт 15, окончателния доклад и техническия
                паспорт. Потвърденото не се преписва повече на ръка.
            </p>
            ${Object.entries(poChasti).sort((a, b) =>
                _blRedChast(a[0], (a[1][0] || [])[1]?.chast_kod)
                - _blRedChast(b[0], (b[1][0] || [])[1]?.chast_kod)
                || a[0].localeCompare(b[0], 'bg')).map(([chast, spisak]) => `
                <details class="card" style="margin:0 0 10px" ${
                    spisak.some(([, b]) => b.sastoyanie === 'predlozheno') ? 'open' : ''}>
                    <summary style="cursor:pointer;font-weight:600;font-size:13px">
                        ${esc(chast)} <span style="font-weight:400;color:var(--muted)">\u00b7 ${spisak.length}</span>
                    </summary>
                    <div style="margin-top:10px">${spisak.map(([k, b]) => _blRedHtml(k, b)).join('')}</div>
                </details>`).join('')}
        </div>`;
}

function _blRedHtml(k, b) {
    const esc = _s2esc, k64 = encodeURIComponent(k);
    const potv = b.sastoyanie !== 'predlozheno';
    const znak = _BL_SASTOYANIA[b.sastoyanie] || '';
    return `
        <div style="border-left:3px solid ${potv ? 'var(--green,#2e7d32)' : '#d8cfb8'};
                    padding:7px 0 7px 12px;margin-bottom:10px">
            <div style="font-size:11.5px;color:var(--muted)">
                ${esc(b.podzaglavie || '(без заглавие)')}
                ${b.fajl ? ` \u00b7 ${esc(b.fajl)}` : ''}${b.stranica ? `, стр. ${b.stranica}` : ''}
                ${znak ? ` \u00b7 <span style="color:#2e6b32">${znak}</span>` : ''}
                ${_BL_VLIZA(b) ? '' : ` \u00b7 <span style="color:#8a6400">${
                    esc(b.rolya)} \u2014 \u043d\u0435 \u0432\u043b\u0438\u0437\u0430 \u0432 \u0434\u043e\u043a\u043b\u0430\u0434\u0430</span>`}
            </div>
            <div style="font-size:13px;line-height:1.65;white-space:pre-wrap;margin-top:3px">${esc(b.tekst)}</div>
            ${b.novo_chetene ? `<div style="font-size:11.5px;color:#b45309;margin-top:4px">
                \u26a0\ufe0f Ново четене дава друг текст. Виж го и реши.
                <button class="btn btn-ghost btn-sm" onclick="blVzemiNovoto('${k64}')">Вземи новото</button>
                <button class="btn btn-ghost btn-sm" onclick="blOstaviMoeto('${k64}')">Остави моето</button>
            </div>` : ''}
            <div style="margin-top:5px">
                ${potv ? '' : `<button class="btn btn-primary btn-sm" onclick="blPotvardi('${k64}')">\u2713 Потвърди</button>`}
                <button class="btn btn-ghost btn-sm" onclick="blPoprav('${k64}')">Поправи</button>
                ${potv ? `<button class="btn btn-ghost btn-sm" onclick="blOtmeni('${k64}')">Отмени</button>` : ''}
            </div>
        </div>`;
}

// Текстът за раздел В на комплексния доклад: целите записки, по части.
// Операторът, 15.10.2026: „по-добре е да се излива целият текст, както е по
// записка, в съответния раздел — не винаги има разделението, което посочваш“.
//
// Влиза САМО потвърденото. Непотвърден текст не бива да стига до документ,
// който операторът подписва.
// Новият ред в PDF не е нов абзац. Записката е набрана с твърди преноси по
// ширината на листа; шаблонът прави по един абзац на ред и описанието излиза
// накъсано на парчета по две думи. Сървърът вече сглобява прочетеното, но
// вече прочетените блокове стоят накъсани в браузъра — минават и оттук, за да
// не се четат пак. (Операторът, 16.10.2026)
const _BL_ZATVARYA = '.:;!?»“';
const _BL_NOV_RED = /^(?:[-–—•·●■*]|\d+(?:\.\d+)*[.)]|[a-zA-Zа-я][.)]\s)/;

function _blIzgladi(tekst) {
    const izhod = [];
    for (const red of String(tekst || '').replace(/\r/g, '\n').split('\n').map(x => x.trim())) {
        if (!red) { if (izhod.length && izhod[izhod.length - 1]) izhod.push(''); continue; }
        if (izhod.length && izhod[izhod.length - 1] === '') { izhod[izhod.length - 1] = red; continue; }
        const pred = izhod.length ? izhod[izhod.length - 1] : '';
        if (pred && !_BL_ZATVARYA.includes(pred.slice(-1)) && !_BL_NOV_RED.test(red)) {
            izhod[izhod.length - 1] = pred.endsWith('-') ? pred.slice(0, -1) + red : pred + ' ' + red;
        } else izhod.push(red);
    }
    return izhod.join(String.fromCharCode(10)).trim();
}

// Редът на частите в доклада е по проектантската практика, не по реда, в който
// са прочетени записките. (Операторът, 19.10.2026: „Архитектура; конструкции;
// ел; ВиК, ОВК, геодезия; озеленяване, ПБ“.) Част извън списъка влиза накрая.
const _BL_RED_CHASTI = ['ARH', 'KONSTR', 'EL', 'VIK', 'OVK', 'GEO', 'OZELEN', 'PB',
                        'EE', 'PBZ', 'TRANSP', 'SITUACIA', 'VIZA', 'DRUGA'];
// Старите блокове са пазени само с името на частта — то също трябва да се
// познава, за да не чака операторът ново четене.
const _BL_IME_KOD = [[/архитект/i, 'ARH'], [/конструк/i, 'KONSTR'],
    [/електро|^ел\b/i, 'EL'], [/вик|водоснаб|канализ/i, 'VIK'],
    [/овк|отоплен|вентилац|климат/i, 'OVK'], [/геодез/i, 'GEO'],
    [/озелен|паркоустр/i, 'OZELEN'], [/пожарн|^пб\b/i, 'PB'],
    [/енергийна/i, 'EE'], [/пбз|безопасност и здраве/i, 'PBZ'],
    [/транспорт|пътна/i, 'TRANSP'], [/ситуац|вертикална/i, 'SITUACIA'],
    [/виза/i, 'VIZA']];

function _blKodChast(chast, kod) {
    if (kod && _BL_RED_CHASTI.includes(kod)) return kod;
    const ime = String(chast || '');
    for (const [kak, k] of _BL_IME_KOD) if (kak.test(ime)) return k;
    return '';
}

function _blRedChast(chast, kod) {
    const i = _BL_RED_CHASTI.indexOf(_blKodChast(chast, kod));
    return i < 0 ? _BL_RED_CHASTI.length : i;
}

// В доклада на НАДЗОРА влиза само описанието. Указанията на проектанта към
// изпълнителя („за всички въпроси да се търси решението на проектанта“),
// изчисленията и съдържанието са негови раздели, не наша оценка.
// (Операторът, 20.10.2026, след първия истински доклад с текст.)
const _BL_VLIZA = b => !b.rolya || b.rolya === 'описание';

// Един и същи пасаж го има в две записки (ШТП и кабели) и влизаше два пъти.
// Сравнява се самият текст, без интервали и главни букви.
const _blOtpechatak = t => String(t || '').toLowerCase()
    .replace(/[^0-9a-zа-я]+/g, ' ').trim();

function _blZaDokument(p) {
    const vsichki = Object.values(_blVzemi(p))
        .filter(b => b.sastoyanie === 'potvardeno' || b.sastoyanie === 'popraveno')
        .filter(_BL_VLIZA);
    if (!vsichki.length) return '';
    const poChasti = {};
    const vidyani = new Set();
    for (const b of vsichki) {
        const o = _blOtpechatak(b.tekst);
        if (!o || vidyani.has(o)) continue;
        vidyani.add(o);
        (poChasti[b.chast || 'Друга част'] ||= []).push(b);
    }
    // В реда на записката: поредността, която четецът е дал, после страницата.
    for (const spisak of Object.values(poChasti)) {
        spisak.sort((a, b) => (a.fajl || '').localeCompare(b.fajl || '', 'bg')
            || (a.red || 0) - (b.red || 0)
            || (a.stranica || 0) - (b.stranica || 0));
    }
    const podredeni = Object.entries(poChasti).sort((a, b) =>
        _blRedChast(a[0], (a[1][0] || {}).chast_kod) - _blRedChast(b[0], (b[1][0] || {}).chast_kod)
        || a[0].localeCompare(b[0], 'bg'));
    const redove = [];
    for (const [chast, spisak] of podredeni) {
        redove.push('Част ' + chast);
        for (const b of spisak) {
            const zagl = String(b.podzaglavie || '').trim();
            if (zagl) redove.push(zagl);
            redove.push(_blIzgladi(b.tekst));
        }
        redove.push('');
    }
    return redove.join(String.fromCharCode(10)).trim();
}

// Колко чакат потвърждение — за да се каже, преди да се генерира документ.
function _blChakat(p) {
    return Object.values(_blVzemi(p))
        .filter(b => b.sastoyanie === 'predlozheno' && _BL_VLIZA(b)).length;
}

function _blFakt(k64) {
    const obekt = _zhivObekt();
    if (!obekt) return {};
    const p = _krug(_stroezh(obekt));
    const k = decodeURIComponent(k64);
    return { obekt, p, k, b: _blVzemi(p)[k] };
}

function blPotvardi(k64) {
    const { obekt, p, b } = _blFakt(k64);
    if (!b) return;
    b.sastoyanie = 'potvardeno';
    b.koy = _s2Koy(); b.koga = new Date().toISOString();
    _s2ZapishiTiho(obekt, `Текст: потвърден „${b.podzaglavie}“`);
    _prerisuvai();
}

function blPoprav(k64) {
    const { obekt, b } = _blFakt(k64);
    if (!b) return;
    const nov = prompt(`${b.podzaglavie}:`, b.tekst);
    if (nov === null) return;
    b.tekst = nov.trim();
    b.sastoyanie = 'popraveno';
    b.koy = _s2Koy(); b.koga = new Date().toISOString();
    b.novo_chetene = '';
    _s2ZapishiTiho(obekt, `Текст: поправен „${b.podzaglavie}“`);
    _prerisuvai();
}

function blOtmeni(k64) {
    const { obekt, b } = _blFakt(k64);
    if (!b) return;
    b.sastoyanie = 'predlozheno';
    b.tekst = b.prochetan || b.tekst;
    _s2ZapishiTiho(obekt, `Текст: отменен „${b.podzaglavie}“`);
    _prerisuvai();
}

function blVzemiNovoto(k64) {
    const { obekt, b } = _blFakt(k64);
    // Без предложение няма какво да се взима: иначе бутонът изтрива текста.
    // (Пробата го намери, 15.10.2026.)
    if (!b || !String(b.novo_chetene || '').trim()) return;
    b.tekst = b.novo_chetene; b.novo_chetene = ''; b.sastoyanie = 'predlozheno';
    _s2ZapishiTiho(obekt, `Текст: взето новото за „${b.podzaglavie}“`);
    _prerisuvai();
}

function blOstaviMoeto(k64) {
    const { obekt, b } = _blFakt(k64);
    if (!b) return;
    b.novo_chetene = '';
    _s2ZapishiTiho(obekt, `Текст: оставено моето за „${b.podzaglavie}“`);
    _prerisuvai();
}

function _zapiskiHtml(r) {
    const esc = _s2esc;
    const prochetiniJs = (r.chasti_prochetini || []).map(c => esc(c.ime)).join(' · ');
    const lipsvat = (r.chasti_lipsvat || []).map(c => esc(c.ime)).join(' · ');

    const razmin = (r.razminavania || []).map(x => `
        <div style="padding:6px 0;border-bottom:1px solid var(--border-light)">
            <strong>${esc(x.kakvo)}</strong>
            ${_zpVariantiHtml(x)}
        </div>`).join('');

    const priznaci = (r.priznaci || []).map(v => {
        const t = v.tvardenia[0] || {};
        return `<div style="padding:4px 0;border-bottom:1px solid var(--border-light)">
            ${v.edinno ? '✅' : '⚠️'} <strong>${esc(v.ime || v.priznak)}</strong>
            — ${v.edinno ? esc(v.stoynost)
                         : v.tvardenia.map(x => `${esc(x.stoynost)} <span style="color:var(--muted)">(${esc(x.chast)})</span>`).join(' срещу ')}
            ${t.citat ? `<div style="color:var(--muted);font-size:11px;margin-left:18px">„${esc(t.citat)}“${t.stranica ? ` стр. ${t.stranica}` : ''}</div>` : ''}
        </div>`;
    }).join('');

    const proektanti = (r.proektanti || []).map(p => `
        <div style="padding:3px 0">${esc(p.ime)}
            <span style="color:var(--muted)">— ${(p.chasti || []).map(esc).join(', ') || '?'}</span>
            ${p.registraciya ? `<span style="color:var(--muted);font-size:11px"> · ${esc(p.registraciya)}</span>` : ''}
        </div>`).join('');

    const razdeli = _ZP_RAZDELI.filter(([k]) => k !== 'priznaci' && (r[k] || []).length)
        .map(([k, ime]) => `
            <details style="margin-top:8px">
                <summary style="cursor:pointer;font-weight:600;font-size:13px">${ime} (${r[k].length})</summary>
                <div style="margin-top:6px">${r[k].map(_zpRed).join('')}</div>
            </details>`).join('');

    // Записка за ДРУГ имот не е разминаване — тя изобщо не е тук. Казва се
    // ПЪРВО и най-високо, преди каквото и да било друго. (02.10.2026)
    const chuzhdi = (r.chuzhdi_zapiski || []).length ? `
        <div class="alert alert-error" style="margin:0 0 12px"><div>
            <strong>⛔ ${r.chuzhdi_zapiski.length}
            ${r.chuzhdi_zapiski.length === 1 ? 'записка е за ДРУГ имот' : 'записки са за ДРУГ имот'}
            — не влизат в нищо по-долу</strong>
            <div style="font-size:12px;margin-top:5px;line-height:1.6">
                ${r.chuzhdi_zapiski.map(c => {
                    // Визата на обединен имот носи НЯКОЛКО стари номера — приемат се
                    // наведнъж, операторът познава имота си. (02.10.2026)
                    const ident = c.identifikatori || [];
                    return `<div><strong>${esc(c.chast)}</strong>${c.fajl ? ` <span style="opacity:.75">(${esc(c.fajl)})</span>` : ''} → ${esc(c.imot)}
                    ${ident.length ? `<button type="button" class="btn btn-secondary btn-sm" style="margin-left:6px"
                        onclick="priemiStarIdent('${encodeURIComponent(JSON.stringify(ident))}')"
                        title="Добавя ${esc(ident.join(', '))} към предишните номера на имота">
                        ${ident.length === 1 ? 'това е стар номер на имота' : `това са стари номера на имота (${ident.length})`}</button>` : ''}</div>`;
                }).join('')}
                ${r.nash_imot ? `<div style="margin-top:5px;opacity:.8">Останалите са за: ${esc(r.nash_imot)}</div>` : ''}
            </div>
            <div style="font-size:12px;margin-top:6px">Провери дали файлът не е сбъркан, или дали не е за друг обект в папката.</div>
        </div></div>` : '';

    // Записка за ДРУГ СТРОЕЖ в същия имот — тук ѝ е мястото в папката, но не на
    // този строеж. Операторът може да я премести с едно натискане. (02.10.2026)
    const drugSt = (r.drug_stroezh_zapiski || []).length ? `
        <div class="alert alert-warning" style="margin:0 0 12px"><div>
            <strong>↪ ${r.drug_stroezh_zapiski.length}
            ${r.drug_stroezh_zapiski.length === 1 ? 'записка е за ДРУГ строеж' : 'записки са за ДРУГИ строежи'}
            в този имот — не влизат в нищо по-долу</strong>
            <div style="font-size:12px;margin-top:5px;line-height:1.7">
                ${r.drug_stroezh_zapiski.map(c => `<div>
                    <strong>${esc(c.chast)}</strong> → ${esc(c.obekt)}
                    <span style="opacity:.75">(${esc(c.vid)})</span>
                    ${c.fajl ? `<button type="button" class="btn btn-secondary btn-sm" style="margin-left:6px"
                        onclick="zapiskiPremesti('${encodeURIComponent(c.fajl)}')">премести</button>` : ''}
                </div>`).join('')}
                ${r.nash_vid_stroezh ? `<div style="margin-top:5px;opacity:.8">Този строеж е <strong>${esc(r.nash_vid_stroezh)}</strong>.</div>` : ''}
            </div>
        </div></div>` : '';

    const neyasno = r.imotat_e_neyasen ? `
        <div class="alert alert-warning" style="margin:0 0 12px"><div>
            <strong>⚠️ Записките сочат към различни имота — не мога да реша кой е този строеж</strong>
            <div style="font-size:12px;margin-top:5px;line-height:1.6">
                ${(r.imoti_v_papkata || []).map(x => `<div>· ${esc(x)}</div>`).join('')}
            </div>
            <div style="font-size:12px;margin-top:6px">Нищо не е изключено — махни чуждите файлове и прочети пак.</div>
        </div></div>` : '';

    return `
        <div style="font-size:13px">
            ${chuzhdi}${drugSt}${neyasno}
            <div style="margin-bottom:10px">
                <strong>Прочетени части:</strong> ${prochetiniJs || '—'}
                ${lipsvat ? `<div style="color:var(--muted);margin-top:3px"><strong>Липсват:</strong> ${lipsvat}</div>` : ''}
            </div>
            ${(r.shapka || []).length ? `<div style="margin-bottom:10px">${
                r.shapka.map(s => `<div style="padding:2px 0">${s.edinno ? '✅' : '⚠️'} ${esc(s.kakvo)}:
                    ${s.edinno ? esc(s.stoynost) : ''}
                    ${s.edinno ? '' : _zpVariantiHtml(s)}
                </div>`).join('')}</div>` : ''}
            ${r.mahnati_chuzhdi ? `<div style="font-size:11px;color:var(--muted);margin:6px 0">
                ℹ️ ${r.mahnati_chuzhdi} признака са отхвърлени — прочетени са от името на
                <strong>захранвания</strong> обект, а не от самия строеж.
                (Кабелната линия няма гаражи и етажи — те са на сградата, която захранва.)
            </div>` : ''}
            ${razmin ? `<div class="alert alert-warning" style="margin:10px 0">
                <div><strong>⚠️ Частите не се връзват (${(r.razminavania || []).length})</strong>
                <div style="font-size:12px;margin-top:4px">${razmin}</div></div>
            </div>` : `<div class="alert alert-success" style="margin:10px 0">
                ✅ Частите не си противоречат по това, което казват.</div>`}
            ${priznaci ? `<details open style="margin-top:8px">
                <summary style="cursor:pointer;font-weight:600;font-size:13px">🔑 Признаци — отговорени от проекта (${r.priznaci.length})</summary>
                <div style="margin-top:6px">${priznaci}</div></details>` : ''}
            ${razdeli}
            ${proektanti ? `<details style="margin-top:8px">
                <summary style="cursor:pointer;font-weight:600;font-size:13px">👷 Проектанти (${r.proektanti.length})</summary>
                <div style="margin-top:6px">${proektanti}</div>
                <p style="font-size:11px;color:var(--muted);margin-top:6px">
                    За всеки се искат пълна проектантска правоспособност и застраховка професионална отговорност.</p>
            </details>` : ''}
        </div>`;
}

function renderOdAiKarta() {
    const box = document.getElementById('od-ai-karta');
    if (!box) return;
    const obekt = _zhivObekt();
    if (!obekt) { box.innerHTML = ''; return; }
    const p = _stroezh(obekt);          // документите и описанието са на строежа
    const docs = p.sloy2?.od?.dokumenti || [];
    const potv = p.sloy2?.od?.potvardeni || {};
    const vsichki = docs.reduce((s, d) => s + _s2Fakti(d).length, 0);
    const gotovi = Object.keys(potv).length;
    box.innerHTML = `
        <div class="card" style="margin-bottom:16px">
            <div class="card-title" style="margin-bottom:8px">📄 Окончателен доклад с АИ</div>
            <p style="font-size:12px;color:var(--muted);margin-bottom:10px">
                Същият доклад като в „Актове и протоколи“, а отгоре — <strong>само потвърденото с хартията</strong>
                от прочетените документи: Г 1.1 (Протокол 2, обр. 3, ЗК, актове обр. 7, Акт 14, Акт 15),
                т. 3 (лаборатории, декларации) и раздел В (становища и документи от дружествата).
                Непотвърденото остава с точки. Ако паспортът и документите дават различни стойности,
                редът остава празен, докато не ги изравниш.
            </p>
            <div style="font-size:13px;margin-bottom:10px">
                ${docs.length
                    ? `Прочетени документи: <strong>${docs.length}</strong> · сверени с хартията:
                       <strong>${gotovi}</strong> от ${vsichki} стойности`
                    : `<span style="color:var(--muted)">Още няма прочетени документи — чети ги в
                       „Изходни данни, съгласувания и РС“. Докладът ще излезе само с паспорта.</span>`}
            </div>
            <div style="border-top:1px solid var(--border,#eee);padding-top:12px;margin:12px 0">
                <div style="font-size:13px;font-weight:700;margin-bottom:4px">Техническо описание на строежа</div>
                <p style="font-size:12px;color:var(--muted);margin-bottom:8px">
                    Едно за обекта — от „По изпълнението на строежа“ до състоянието на околното пространство.
                    Акт 15 се мени, докато пишеш ОД, но описанието не — затова се пази тук и докладът го взима
                    оттук, а не се копира. Документите не са тук: те идват от прочетеното и сверено.
                </p>
                <textarea id="od-ai-tehn" class="form-input" rows="8" style="width:100%;font-size:13px"
                          placeholder="Постави описанието или го вземи от Акт 15 с бутоните отдолу">${_s2esc(p.tehnichesko_opisanie?.tekst || '')}</textarea>
                <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px">
                    <button type="button" class="btn btn-success btn-sm" onclick="zapishiTehnichesko()">💾 Запази описанието</button>
                    <label class="btn btn-secondary btn-sm" style="cursor:pointer;margin:0">
                        📄 Вземи от Акт 15 (.docx / PDF с текст)
                        <input type="file" accept=".docx,.pdf" style="display:none" onchange="tehnOtAkt15Fajl(this)">
                    </label>
                    ${window._akt15LastData?.result ? `<button type="button" class="btn btn-secondary btn-sm"
                        onclick="tehnOtAiAkt15()">🤖 Вземи от генерирания с АИ Акт 15</button>` : ''}
                    <span id="od-ai-tehn-status" style="font-size:12px;color:var(--muted)">
                        ${p.tehnichesko_opisanie?.koga ? `записано — ${_s2esc(p.tehnichesko_opisanie.koy || '')},
                          ${_s2esc(new Date(p.tehnichesko_opisanie.koga).toLocaleString('bg-BG'))}` : 'не е записано'}</span>
                </div>
            </div>
            <button type="button" class="btn btn-primary" id="btn-od-ai" onclick="generiraiOdAi()">📥 Генерирай ОД с АИ</button>
            <div id="od-ai-belezhki" style="margin-top:12px"></div>
        </div>`;
}

function zapishiTehnichesko() {
    const obekt = _zhivObekt();
    const p = obekt && _stroezh(obekt);   // описанието е на строежа
    const el = document.getElementById('od-ai-tehn');
    if (!p || !el) return;
    const tekst = el.value.replace(/\s+$/, '');
    if ((p.tehnichesko_opisanie?.tekst || '') === tekst) { showAlert('info', 'Описанието не е променено.'); return; }
    p.tehnichesko_opisanie = { tekst, koy: _s2Koy(), koga: new Date().toISOString() };
    _zapishiObekt(obekt, 'Техническото описание на строежа е записано');
    renderOdAiKarta();
}

// Изрязването е на сървъра — едно място за файла и за генерирания текст.
async function _tehnIzrezhi(body) {
    const st = document.getElementById('od-ai-tehn-status');
    if (st) st.textContent = 'Изрязвам…';
    try {
        const r = await apiCall('/api/tehnichesko-ot-akt15', 'POST', body);
        if (r.greshka) { if (st) st.textContent = '⚠️ ' + r.greshka; return; }
        const el = document.getElementById('od-ai-tehn');
        if (el.value.trim() && !confirm('В полето вече има текст. Да го заменя с изрязаното от Акт 15?')) {
            if (st) st.textContent = 'не е заменено'; return;
        }
        el.value = r.tekst;
        if (st) st.textContent = 'изрязано — прегледай и натисни „Запази описанието“';
    } catch (e) {
        if (st) st.textContent = '❌ ' + e.message;
    }
}

async function tehnOtAkt15Fajl(input) {
    const f = input.files?.[0];
    if (!f) return;
    await _tehnIzrezhi({ fajl: { ime: f.name, data: await fileToBase64(f) } });
    input.value = '';
}

function tehnOtAiAkt15() {
    const t = window._akt15LastData?.result;
    if (t) _tehnIzrezhi({ tekst: t });
}

async function generiraiOdAi() {
    const obekt = _zhivObekt();
    if (!obekt) return;
    const p = _stroezh(obekt);          // документите и описанието са на строежа
    const btn = document.getElementById('btn-od-ai');
    const kutiya = document.getElementById('od-ai-belezhki');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Генериране…'; }
    kutiya.innerHTML = '';
    try {
        const consultant = appData.consultants.find(c => c.id == p.consultant?.id);
        const body = {
            passport: buildPassportRows(p, consultant, {}), pi: p.pi,
            sloy2: { dokumenti: _s2Prilozhi(p.sloy2?.od?.dokumenti || [], p.sloy2?.od?.potvardeni || {}),
                     docDates: p.docDates || {}, zk: p.zk || {} },
            tehnichesko: p.tehnichesko_opisanie?.tekst || '',
        };
        // Незаписан текст в полето не влиза — докладът е от записаното.
        const pole = document.getElementById('od-ai-tehn');
        if (pole && pole.value.replace(/\s+$/, '') !== (p.tehnichesko_opisanie?.tekst || '')
            && !confirm('Техническото описание в полето не е записано. Да генерирам с последното записано?')) {
            return;
        }
        const token = getToken();
        const r = await fetch(`${(appData.apiUrl || '').replace(/\/$/, '')}/api/generate-od-ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(body),
        });
        if (!r.ok) {
            const err = await r.json().catch(() => ({ error: r.statusText }));
            throw new Error(err.error || `HTTP ${r.status}`);
        }
        let bel = { prichini: [], popalneni: [], spisatsi: {} };
        try { bel = JSON.parse(decodeURIComponent(r.headers.get('X-Doklad-Belezhki') || '')) || bel; } catch (e) {}
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `doklad_AI_${p.pi}.docx`; a.click();
        URL.revokeObjectURL(url);
        addHistory('generate', p.pi, 'Генериран .docx: Окончателен доклад с АИ');
        saveData();
        const sp = bel.spisatsi || {};
        kutiya.innerHTML = `
            <div class="alert ${bel.prichini?.length ? 'alert-warning' : 'alert-success'}" style="margin:0 0 8px">
                ✅ Докладът е генериран. Попълнено от проверени данни в Г 1.1:
                ${(bel.popalneni || []).length ? bel.popalneni.map(_s2esc).join(', ') : 'нищо'}.
                Списъци: лаборатории ${sp.laboratorii || 0}, декларации ${sp.deklaracii || 0},
                актове ${sp.aktove || 0}, становища ${sp.stanovishta || 0}.
            </div>
            ${(bel.prichini || []).length ? `<div style="font-size:13px;font-weight:600;margin:8px 0 4px">
                Празно остана — не влиза в доклада, само за теб:</div>
                ${bel.prichini.map(x => `<div style="font-size:13px;padding:2px 0">⚠️ ${_s2esc(x)}</div>`).join('')}` : ''}`;
    } catch (e) {
        kutiya.innerHTML = `<div class="alert alert-error" style="margin:0">❌ ${_s2esc(e.message)}</div>`;
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '📥 Генерирай ОД с АИ'; }
    }
}

// „Впиши“ пише в ОБЕКТА, не само в полето на екрана. Дотук искаше втори жест
// („запази изходните данни“) и при забравяне вписването изчезваше.
// (Операторът, 20.10.2026.)
function sloy2Vpishi(ime64, nomer64) {
    const ime = decodeURIComponent(ime64), nomer = decodeURIComponent(nomer64);
    const obekt = _zhivObekt();
    if (!obekt) return;
    // Изходните данни са на ОБЕКТА — там ги чете и „Запази изходните данни“.
    if (_dokVpishi(obekt, ime, nomer)) {
        renderDokumenti(obekt);
        _s2ZapishiTiho(obekt, `Изходни данни: вписан „${ime}“`);
    }
    showAlert('success', `„${ime}“ е вписан.`);
    sloy2Sravni();
}

// Отговорът трябва да идва от сървъра, не от тази машина: наредбите се четат
// от папка, която локално я има, а на Railway — не. Точно това счупи проверката
// на категорията („Наредба № 1 не е намерена до хранилището“).
async function proveriIzvori() {
    const k = document.getElementById('izvori-rezultat');
    k.innerHTML = 'Питам сървъра…';
    try {
        const r = await apiCall('/api/izvori', 'GET');
        k.innerHTML = `
            <div class="alert ${r.vsichki_nalice ? 'alert-success' : 'alert-warning'}" style="margin:0 0 10px">
                ${r.vsichki_nalice ? '✅ Сървърът вижда всички източници.'
                                   : `⚠️ Сървърът не намира: ${r.lipsvat.join(', ')}.`}
            </div>
            ${r.izvori.map(x => `<div style="padding:3px 0">
                ${!x.namereno ? '❌' : (x.zaklyucheno ? '✅' : '⚠️')}
                <strong>${x.iztochnik}</strong>
                <span style="color:var(--muted)">— ${!x.namereno ? 'не е намерен'
                    : (x.zaklyucheno ? 'намерен и заключен' : 'намерен, но НЕ съвпада с отпечатъка')}</span>
                ${x.papka ? `<div style="color:var(--muted);font-size:11px;margin-left:20px">${x.papka}</div>` : ''}
            </div>`).join('')}`;
    } catch (e) {
        k.innerHTML = `<div class="alert alert-error" style="margin:0">❌ ${e.message}</div>`;
    }
}

function renderDocDates(project) {
    const box = document.getElementById('fp-dd-rows');
    if (!box) return;
    const dd = (project && project.docDates) || {};
    box.innerHTML = '';
    DOC_DATE_ITEMS.forEach(it => {
        const v = dd[it.id];
        if (!v) return;
        if (it.byPart) {
            Object.keys(v).forEach(ch => addDocDateRow(it.id, ch, v[ch]));
        } else {
            addDocDateRow(it.id, null, v);
        }
    });
    if (!box.children.length) addDocDateRow('protokol2');
}

function readDocDates() {
    const out = {};
    document.querySelectorAll('#fp-dd-rows .dd-row').forEach(row => {
        const id = row.querySelector('.dd-doc')?.value;
        if (!id) return;
        const it = ddItem(id);
        if (it.period) {
            const rec = {
                br: row.querySelector('.dd-br')?.value.trim() || '',
                ot: row.querySelector('.dd-ot')?.value.trim() || '',
                do: row.querySelector('.dd-do')?.value.trim() || ''
            };
            if (!rec.br && !rec.ot && !rec.do) return;
            if (it.byPart) {
                const ch = row.querySelector('.dd-chast')?.value || '';
                if (!ch) return;
                out[id] = out[id] || {};
                out[id][ch] = rec;
            } else {
                out[id] = rec;
            }
        } else {
            const d = row.querySelector('.dd-date')?.value.trim();
            if (d) out[id] = d;
        }
    });
    return out;
}

// ── Акт 12: части ────────────────────────────────────────────────────────────
// Актът за скрити работи се съставя по видове работи, по части. Проектантът и
// СН се менят с частта; строителят и техн. ръководител са постоянни.
// Всяка част води собствена поредица: Арх-1, Арх-2, ВиК-1.
const AKT12_PREFIX = {
    'Архитектура': 'Арх', 'Конструктивна': 'Констр', 'ВиК': 'ВиК', 'Електро': 'Ел',
    'ОВК и ЕЕ': 'ОВК', 'Геодезия': 'Геод', 'Инженерна геология и хидрогеология': 'Геол',
    'Паркоустройство и Благоустройство': 'Парк', 'Газоснабдяване': 'Газ',
    'ПБ': 'ПБ', 'СХИ': 'СХИ', 'Пътна': 'Пътна'
};

// Същият ред на изтегляне като в buildPassportRows — първо проекта, после консултанта.
function akt12People(project, consultant) {
    return {
        pj: project?.projectants || consultant?.projectants || [],
        sn: project?.employees   || consultant?.employees   || []
    };
}

function akt12AvailableParts(project, consultant) {
    // Само частите, за които реално има вписано лице — празен избор е капан.
    const { pj, sn } = akt12People(project, consultant);
    const have = new Set();
    [...pj, ...sn].forEach(x => x.specialization && have.add(x.specialization));
    return specializations.filter(s => have.has(s));
}

function akt12NextNumber(project, chast) {
    const used = (project?.akt12 || {})[chast] || 0;
    return `${AKT12_PREFIX[chast] || chast}-${used + 1}`;
}

function renderAkt12Parts(containerId, project, consultant) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const parts = akt12AvailableParts(project, consultant);
    if (!parts.length) {
        el.innerHTML = '<p style="font-size:12px;color:var(--muted)">Няма вписани проектанти или специалисти по части.</p>';
        return;
    }
    const people = akt12People(project, consultant);
    el.innerHTML = parts.map(s => {
        const pj = people.pj.find(p => p.specialization === s);
        const sn = people.sn.find(e => e.specialization === s);
        return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;font-size:13px">
            <input type="checkbox" data-akt12-part="${s}" style="width:16px;height:16px;flex-shrink:0">
            <span style="flex:1"><strong>${s}</strong>
                <span style="color:var(--muted)"> — проектант: ${pj?.name || '—'} · СН: ${sn?.name || '—'}</span></span>
            <input type="text" data-akt12-num="${s}" class="form-input" style="width:110px;padding:4px 8px;font-size:12px"
                   value="${akt12NextNumber(project, s)}">
        </div>`;
    }).join('');
}

function readAkt12Parts(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return [];
    return [...el.querySelectorAll('input[data-akt12-part]')]
        .filter(b => b.checked)
        .map(b => ({
            chast: b.dataset.akt12Part,
            number: el.querySelector(`input[data-akt12-num="${b.dataset.akt12Part}"]`)?.value.trim() || ''
        }));
}

function renderSignersChecklist(containerId, project) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const v = typeof vazlozhiteli === 'function' ? vazlozhiteli(project) : { spisak: clientsOf(project), otkade: 'pasport' };
    const clients = v.spisak;
    if (!clients.length) {
        el.innerHTML = `<p style="font-size:12px;color:var(--muted)">
            Няма възложители — впиши нотариалния акт в „Собственост“ или ги въведи в паспорта.</p>`;
        return;
    }
    const upalnom = (project.upalnomoshten_predstavitel || '').trim();
    el.innerHTML = clients.map((c, idx) => {
        const podp = [c.podpisvaTitle, c.podpisva].filter(Boolean).join(' ').trim();
        return `<label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;cursor:pointer">
            <input type="checkbox" data-signer="${idx + 1}" checked style="width:16px;height:16px;flex-shrink:0">
            <span><strong>${c.name || '—'}</strong>${podp ? ` — подписва: ${podp}` : ' <span style="color:var(--muted)">(няма посочено лице)</span>'}</span>
        </label>`;
    }).join('') + (upalnom
        ? `<p style="font-size:11px;color:var(--gold);margin-top:8px">⚠ В паспорта е зададен упълномощен представител (<strong>${upalnom}</strong>) — той подписва вместо всички и изборът по-горе се пренебрегва.</p>`
        : `<p style="font-size:11px;color:var(--muted);margin-top:8px">
             Горе в документа винаги се изписват всички възложители. Тук избираш само кой подписва.
             ${v.otkade === 'registar' ? ' Списъкът е от регистъра на собствеността.' : ''}</p>`);
}

function readSigners(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return undefined;                      // няма чеклист → всички подписват
    const boxes = el.querySelectorAll('input[data-signer]');
    if (!boxes.length) return undefined;
    return [...boxes].filter(b => b.checked).map(b => Number(b.dataset.signer));
}

// Последната врата: нищо с вид на ЕГН не тръгва към сървъра и към документа.
// Шаблоните нямат такова поле, но това не пази от случайност — стойност,
// въведена на грешен ред, минава тихо. (Операторът, 15.10.2026)
function _bezEGN(redove) {
    const mahnati = [];
    const chisti = redove.map(([klyuch, stoynost]) => {
        if (typeof eEGN === 'function' && eEGN(stoynost)) {
            mahnati.push(klyuch);
            return [klyuch, ''];
        }
        return [klyuch, stoynost];
    });
    if (mahnati.length) {
        console.warn('ЕГН не се подава в документа:', mahnati.join(', '));
        showAlert('warning', `Лично данно (ЕГН) не влиза в документа — провери „${
            mahnati.slice(0, 3).join('“, „')}“.`);
    }
    return chisti;
}

// ── Акт 15: тялото ───────────────────────────────────────────────────────────
// Шаблонът получи тяло (22.10.2026) и сега то иска данни. Те НЕ се въвеждат
// наново: всяко поле идва от място, където вече е потвърдено веднъж.
//
//   вписаните документи → договорът, одобрените проекти
//   датите на документите → Протокол 2 (или 2а), Образец 3
//   блоковете от записките → „по изпълнение“
//   остатъкът на Екран 3 → онова, което само операторът знае
//
// Липсва ли нещо, полето просто не се праща и сървърът оставя [___] или точки.

// Вписан документ по име. Имената в чеклиста са дълги, затова се търси по
// израз, не по съвпадение.
// ВПИСАНИТЕ ДОКУМЕНТИ СА НА ОБЕКТА, не на строежа — `dokumenti` го няма в
// `_STROEZH_POLETA`, а `_dokVpishi` пише в обекта. При един строеж двете
// съвпадат и разликата не личи; при два — вторият строеж би се оказал без
// изходни данни. (26.10.2026)
function _a15Vpisan(p, kak) {
    // Търси се и по ИМЕТО, и по реда от чеклиста, който документът доказва.
    // Откакто в описа влиза истинското наименование („Протокол за откриване на
    // строителна площадка и за определяне на строителна линия и ниво“), само
    // името не стига — а редът го знае. (28.10.2026)
    const red = (p.dokumenti || []).find(d => kak.test(String(d.ime || ''))
                                           || kak.test(String(d.red || '')));
    return red ? String(red.nomer || '').trim() : '';
}

// ДАТАТА СЕ ТЪРСИ НАВСЯКЪДЕ, КЪДЕТО Е ЗНАЙНА.
//
// Операторът, 29.10.2026: „когато генерирам 15 с питон, там не се записва
// датата пр. 2, а има поле и има дата в системата“.
//
// Беше вярно: Протокол 2 и обр. 3 се вземаха САМО от ръчно попълненото поле
// „Дати на съставените документи“. Не го ли напълниш, в акта излиза [___] —
// макар датата да стои в сверения документ.
//
// Другите полета на акта (одобрените проекти, договорът) отдавна се търсят във
// вписаните документи. Тук Протокол 2 и обр. 3 влизат в същия ред:
//   1) ръчно попълненото — то е твое и бие всичко;
//   2) датата на СВЕРЕНИЯ документ — в `p.dokumenti` влиза само потвърдено.
function _a15DataNaDokument(project, dati, klyuch, kak) {
    const naraka = String((dati || {})[klyuch] || '').trim();
    if (naraka) return naraka;
    return _a15NomerData(_a15Vpisan(project, kak)).data || '';
}

// Протокол 2 и 2а се различават: „2а“ не бива да мине за „2“.
const _A15_PROTOKOL_2 = /протокол\s*(обр\.?|образец)?\s*№?\s*2(?![\dа-я])|откриване на строителна площадка/i;
const _A15_PROTOKOL_2A = /протокол\s*(обр\.?|образец)?\s*№?\s*2\s*а/i;
const _A15_OBRAZEC_3 = /(констативен\s+)?акт\s*(обр\.?|образец)?\s*№?\s*3(?![\dа-я])/i;

// „№ 12 от 01.03.2026 г.“ → { nomer: '12', data: '01.03.2026' }
function _a15NomerData(tekst) {
    const t = String(tekst || '');
    const n = t.match(/№\s*([^\s,;]+)/);
    const d = t.match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/);
    return { nomer: n ? n[1] : '', data: d ? d[1] : '' };
}

// Описанието на изпълненото — от потвърдените блокове с роля „изпълнение“.
// Операторът, измерено на Петракиев: Акт 15 носи 12 % свой текст, а този блок
// се повтаря после в окончателния доклад, в Акт 16 и в паспорта. Пише се
// веднъж тук.
function _a15PoIzpalnenie(st) {
    const blokove = Object.values(st.blokove || {})
        .filter(b => /изпълнен/i.test(String(b.rolya || '')))
        .filter(b => b.sastoyanie === 'potvardeno' || b.sastoyanie === 'popraveno');
    return blokove.map(b => String(b.tekst || '').trim()).filter(Boolean).join('\n');
}

// Описът на приложенията — точка 4: „копия от документите съгласно описа на
// цялата строителна документация… а именно“.
//
// Два извора, не един. Отметнатото в чеклиста казва КОЕ е налице, но номерът
// и датата са във ВПИСАНИТЕ документи — списъкът, който операторът пълни на
// страницата с документите. Четеше ли се само отметнатото, описът излизаше
// празен при обект с цяла страница събрани документи. (26.10.2026)
//
// Вписаните вървят първи: те носят номер и дата, тоест са по-пълни.
function _a15Prilozhenia(p, st) {
    const klyuch = x => String(x || '').trim().toLowerCase();
    const redove = [], vidyani = new Set();
    for (const d of p.dokumenti || []) {
        const ime = String(d.ime || '').trim();
        if (!ime || vidyani.has(klyuch(ime))) continue;
        vidyani.add(klyuch(ime));
        redove.push(ime + (d.nomer ? ' — ' + String(d.nomer).trim() : ''));
    }
    for (const ime of st.nadzor_otmetnati || []) {
        if (!ime || vidyani.has(klyuch(ime))) continue;
        vidyani.add(klyuch(ime));
        redove.push(ime);
    }
    return redove;
}

// Онова, което само операторът знае — пише се в остатъка на Екран 3.
function _a15Ostatak(st) {
    return st.ostatak || {};
}

function _a15Redove(project, st) {
    const o = _a15Ostatak(st);
    const dati = st.docDates || {};
    // Договорът за строителство: изразът е широк нарочно. В чеклиста няма
    // такъв ред (проверено на 26.10.2026) — вписва се на ръка и операторът го
    // кръщава както му дойде: „Договор за СМР“, „Договор за строителство“,
    // „Договор строително-монтажни работи“. Тесният израз не го хващаше и
    // точка 3 на акта излизаше [___].
    const DOGOVOR = /договор.*(смр|строите|монтаж)/i;
    const dogovor = _a15NomerData(_a15Vpisan(project, DOGOVOR));
    // Протокол 2 при сграда, 2а при линеен — датата е една и съща в чеклиста,
    // а шаблонът има два реда и вторият изчезва, когато не му е мястото.
    const lineen = String(st.vid || '') === 'lineen';
    const redove = [
        ['Дата_Акт', o.data_akt],
        ['Проекти_Одобрени', _a15NomerData(_a15Vpisan(project, /одобрен.*проект|проект.*одобрен/i)).data],
        ['Договори_Списък', _a15Vpisan(project, DOGOVOR)],
        ['Договор_СМР_Номер', dogovor.nomer],
        ['Договор_СМР_Дата', dogovor.data],
        [lineen ? 'Протокол_2а_Дата' : 'Протокол_2_Дата',
         _a15DataNaDokument(project, dati, 'protokol2',
                            lineen ? _A15_PROTOKOL_2A : _A15_PROTOKOL_2)],
        ['Образец_3_Дата',
         _a15DataNaDokument(project, dati, 'obrazec3', _A15_OBRAZEC_3)],
        ['Строеж_Представлява', st.stroej],
        ['Техническо_Описание', (st.tehnichesko_opisanie || {}).tekst],
        ['По_Изпълнение', _a15PoIzpalnenie(st)],
        ['Недостатъци_Отстранява', o.nedostatuci_otstranyava],
        ['Недостатъци_Срок', o.nedostatuci_srok],
        ['Временно_Премахва', o.vremenno_premahva],
        ['Временно_Срок', o.vremenno_srok],
    ].filter(([, v]) => String(v || '').trim());
    const pril = _a15Prilozhenia(project, st);
    if (pril.length) {
        redove.push(['Приложения_Брой', String(pril.length)]);
        pril.forEach((x, i) => redove.push(['Приложение_' + (i + 1), x]));
    }
    return redove;
}

function buildPassportRows(project, consultant, extra) {
    // Конвертира project обекта в масив от редове за API-я
    const rows = [];
    const add = (k, v) => rows.push([k, v || '']);

    add('Строеж', project.stroej);
    add('Адрес', project.address);
    add('РС_Номер', project.permit?.number);
    add('РС_Дата', project.permit?.date);
    add('РС_Издател', project.permit?.issuer);
    add('РС_ВСила', project.permit?.effective);
    add('ЗК_Номер', project.zk?.number);
    add('ЗК_Дата', project.zk?.date);
    add('Категория', project.osip?.kategoria);
    // Цифрата — отделно: „Категория“ е дословният цитат за раздел А и първият
    // му знак е „т“, не „3“. Без това „категория ∈ 1,2,3“ не се изпълнява.
    add('Категория_Номер', project.kategoria);
    add('Фаза', project.osip?.faza);
    // Оценката по чл. 142, ал. 5, т. 1 сочи с какво е одобрен планът — това е
    // данна на обекта, не шаблонен текст, затова идва оттук.
    add('ПУП_Одобрен', project.gradoustroystvo?.pup);
    add('Кадастрална_Карта', project.gradoustroystvo?.kadastr);
    // Признаци, от които се сглобяват оценките в комплексния доклад
    add('Вид', project.vid);
    add('Предназначение', project.prednaznachenie);
    add('Повод', project.povod);
    add('СПО', (project.spo || []).join('; '));
    add('РСПБЗН', project.rspbzn);
    add('Защитена_Зона', project.zashtitena ? 'да' : 'не');
    add('Паметник', project.pametnik ? 'да' : 'не');
    add('Опасни_Вещества', project.opasni ? 'да' : 'не');
    add('Води', project.vodi ? 'да' : 'не');
    add('Одобряващ_Орган', project.osip?.organ);
    add('Договор_Надзор', project.osip?.dogovor);
    add('ТехКонтрол', project.osip?.tk);
    add('ТехКонтрол_Рег', project.osip?.tkReg);

    // Консултант
    if (consultant) {
        add('Консултант_Фирма', consultant.name);
        add('Консултант_ЕИК', consultant.eik);
        add('Консултант_Адрес', consultant.address);
        add('Консултант_Управител', consultant.manager);
        add('Консултант_Управител_Титла', consultant.managerTitle);
        add('Консултант_Удостоверение', consultant.cert);
    }

    // Строител
    add('Строител_Фирма', project.builder?.company);
    add('Строител_ЕИК', project.builder?.eik);
    add('Строител_Адрес', project.builder?.address);
    add('Строител_Управител', project.builder?.manager);
    add('Строител_Управител_Титла', project.builder?.managerTitle);
    add('Строител_ТехРък', project.builder?.tech || extra.teh_rukovoditel);
    add('Строител_ТехРък_Титла', project.builder?.techTitle);

    // Възложител — списъчен контракт (backend Стъпка 1).
    // Регистърът на собствеността бие писаното на ръка: той знае КОЙ към КОЯ
    // дата държи вещно право, а всяко вещно право е възложител по ЗУТ.
    // Празен регистър значи „още не е пълнен“ — тогава си върви старото.
    const otRegistar = (typeof _sbKlienti === 'function' && project.sobstvenost)
        ? _sbKlienti(project, extra.data_dokument || '') : [];
    const clients = otRegistar.length ? otRegistar
        : (project.clients || (project.client ? [project.client] : []));
    add('Възложители_Брой', clients.length);
    clients.forEach((c, idx) => {
        const i = idx + 1;
        add(`Възложител_${i}_Тип`,  c.type || 'ФЛ');
        add(`Възложител_${i}_Фирма`, c.name || '');
        if (c.type === 'ЮЛ') {
            add(`Възложител_${i}_ЕИК`,               c.eik      || '');
            add(`Възложител_${i}_Адрес`,              c.address  || '');
            add(`Възложител_${i}_Представител`,       c.rep      || '');
            add(`Възложител_${i}_Представител_Титла`, c.repTitle || '');
        } else {
            add(`Възложител_${i}_Титла`, c.nameTitle || '');
        }
        add(`Възложител_${i}_2имена`, c.dveImena || _sbDveImena(c.name || ''));
        add(`Възложител_${i}_Подписва`,       c.podpisva      || '');
        add(`Възложител_${i}_Подписва_Титла`, c.podpisvaTitle || '');
        // Кой подписва долу — избор в момента на генериране.
        // extra.signers липсва → всички подписват (обратна съвместимост).
        if (Array.isArray(extra.signers)) {
            add(`Възложител_${i}_Подписва_Да`, extra.signers.includes(i) ? '1' : '0');
        }
    });
    add('Възложител_Упълномощен_Представител', project.upalnomoshten_predstavitel || '');

    // Правното основание: с кой акт възложителите държат правата си. Досега в
    // ОСИП стояха точки, а актът го имаше в регистъра. Непопълнен регистър
    // връща празно и точките остават. (Операторът, 16.10.2026.)
    if (typeof _sbPravnoOsnovanie === 'function' && project.sobstvenost) {
        const osn = _sbPravnoOsnovanie(project, extra.data_dokument || '');
        if (osn) add('Правно_Основание', osn);
    }

    // Акт 15 иска повече от реда на ОСИП: под всеки възложител — имотите му,
    // актът с вписването и пълномощното на подписващия. Един и същ блок влиза
    // после в раздел А на окончателния доклад и в Акт 16. (22.10.2026)
    if (typeof _sbOsnovaniaBlok === 'function' && project.sobstvenost) {
        const blok = _sbOsnovaniaBlok(project, extra.data_dokument || '');
        if (blok) add('Възложители_Основания', blok);
    }

    // Тялото на Акт 15 — вж. _a15Redove. Полетата са на СТРОЕЖА.
    for (const [k, v] of _a15Redove(project, _stroezh(project))) add(k, v);

    // Раздел В на комплексния доклад — описанията от записките, по части.
    // Само потвърденото; непотвърдено не влиза в документ за подпис.
    if (typeof _blZaDokument === 'function') {
        const stroezh = typeof _krug === 'function' ? _krug(_stroezh(project))
            : (typeof _stroezh === 'function' ? _stroezh(project) : project);
        const tekst = _blZaDokument(stroezh);
        if (tekst) add('ОСИП_В_Части', tekst);
        // Кръг по чл. 154: предметът на изменението, кой доклад се изменя и
        // кои части НЕ се изменят. При кръг 1 не добавя нищо.
        if (typeof _krugRedove === 'function') _krugRedove(_stroezh(project), add);
        // Мълчанието тук беше лошо: операторът виждаше прочетените блокове в
        // „Проектът“ и чакаше да се появят в доклада, а те не влизат без ✔.
        // (15.10.2026 — „има си ги прочетени, но не се наливат в ОСИП“.)
        const chakat = _blChakat(stroezh);
        if (chakat && typeof showAlert === 'function') {
            showAlert(tekst ? 'warning' : 'error', tekst
                ? `${chakat} текстови блока още чакат ✔ в „Проектът“ — те НЕ влизат в доклада.`
                : `Нито един текстов блок не е потвърден — раздел В остава [___]. `
                  + `Отвори „Проектът“ и натисни ✔ на блоковете.`);
        }
    }

    // Представител на Възложителя за подписи. В протокол 2 се пише само ЕДНО
    // име — избраният представител. Дотук имаше и поле в екрана „АИ протоколи“;
    // той отпадна (14.10.2026) и остана единственият извор — регистърът.
    const vozPodpis = otRegistar.length
        ? _sbPredstavitel(project, extra.data_dokument || '') : '';
    add('Възложител_1и3', vozPodpis);
    add('Възложител_2имена', vozPodpis);

    // Временно захранване
    add('Вода', extra.voda || 'водоноска');
    add('Канализация', extra.kanalizacia || 'химически WC');
    add('Ел_Захранване', extra.el || 'преносим дизелов агрегат');

    // Служители надзор
    const consultantLocal = appData.consultants?.find(c => c.id == project?.consultant?.id);
    const employees = project.employees || consultantLocal?.employees || [];
    add('Служители_Брой', employees.length);
    employees.forEach((e, i) => {
        add('Служител_' + (i+1) + '_Име', e.name);
        add('Служител_' + (i+1) + '_Специализация', e.specialization);
        add('Служител_' + (i+1) + '_Титла', e.title ?? 'инж.');
    });

    // Геодезист — от extra полето или от служителите на консултанта
    const geoFromEmployees = employees.find(e => e.specialization === 'Геодезия')?.name || '';
    add('Геодезист', extra?.geodezist || geoFromEmployees);

    // Проектанти
    const projectants = project.projectants || consultantLocal?.projectants || [];
    add('Проектанти_Брой', projectants.length);
    projectants.forEach((p, i) => {
        add('Проектант_' + (i+1) + '_Име', p.name);
        add('Проектант_' + (i+1) + '_Специализация', p.specialization);
        add('Проектант_' + (i+1) + '_Титла', p.title ?? 'инж.');
        add('Проектант_' + (i+1) + '_ППП', p.ppp);
    });

    return _bezEGN(rows);
}

function fileToBase64(file) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = () => rej(new Error('Грешка при четене на файл'));
        r.readAsDataURL(file);
    });
}

// ═══════════════════════════════════════════════════════════