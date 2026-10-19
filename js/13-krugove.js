// АКТ СИСТЕМ · 13-krugove.js
// Кръговете на оценката: първоначалната по чл. 142 и измененията по чл. 154
//
// Операторът, 19.10.2026: „Чл. 154 е същото като ОСИП“ — и е така. Затова не
// се прави втори вид документ, а ВТОРИ КРЪГ върху същия строеж: свои записки,
// свои текстови блокове, свой изходящ номер, същият шаблон.
//
// Разликата е в две неща:
//   · раздел А сочи чл. 154, ал. 5 и кой доклад се изменя;
//   · кръгът РАЗКАЗВА какво се променя („ап. 4 се разделя на ап. 4 и ап. 4а“).
//     Този разказ не идва от записка — пише се веднъж и после влиза и в
//     заповедта, и в Акт 15, и в окончателния доклад.
//
// „Зависи какви са измененията, понякога са в целия проект, понякога само по
// части“ (операторът). Затова кръгът тръгва ПРАЗЕН и всяка част се избира:
// изменена (нова записка) или непроменена (по предишния доклад).

const _KRUG_IZMENENA = 'izmenena';
const _KRUG_NEPROMENENA = 'nepromenena';

// Носителите: кръг 1 е САМИЯТ строеж — записките и блоковете му стоят там,
// където са били досега. Нищо не се мести.
function _krugove(p) {
    return p ? [p, ...(p.krugove_dop || [])] : [];
}

function _brojKrugove(p) {
    return 1 + ((p && p.krugove_dop) || []).length;
}

function _indeksKrug(p) {
    const i = Number((p && p.tekusht_krug) || 0);
    return i >= 0 && i < _brojKrugove(p) ? i : 0;
}

// Кръгът, по който се работи. Върху него се пишат записките и блоковете.
function _krug(p) {
    return _krugove(p)[_indeksKrug(p)] || p;
}

const _krugPoChl154 = (p, i) => i > 0;

function _imeKrug(p, i) {
    if (i === 0) return 'Оценка по чл. 142';
    const k = _krugove(p)[i] || {};
    return 'Изменение по чл. 154' + (k.nomer ? ' · № ' + k.nomer : ' № ' + (i + 1));
}

// Частите на проекта — същият списък и същият ред както в доклада.
// Имената идват от сървъра (rules/zapiski.py: CHASTI); тук стоят, защото
// изборът „изменена / непроменена“ се прави преди каквото и да е четене.
const _KRUG_CHASTI = [
    ['ARH', 'Архитектура'], ['KONSTR', 'Конструкции'], ['EL', 'Електро'],
    ['VIK', 'ВиК'], ['OVK', 'ОВК'], ['GEO', 'Геодезия'],
    ['OZELEN', 'Озеленяване'], ['PB', 'Пожарна безопасност'],
    ['EE', 'Енергийна ефективност'], ['PBZ', 'ПБЗ'], ['TRANSP', 'Транспортна'],
];

function _krugChasti(k) {
    return (k.chasti = k.chasti || {});
}

function dobaviKrug() {
    const obekt = _zhivObekt(); if (!obekt) return;
    const p = _stroezh(obekt);
    const predmet = (prompt('Какво се изменя? Напиши го, както ще го прочете главният архитект:'
        + String.fromCharCode(10, 10)
        + 'напр. „Апартамент № 4 се разделя на апартамент № 4 и апартамент № 4а“') || '').trim();
    if (!predmet) return;
    (p.krugove_dop = p.krugove_dop || []).push({
        id: 'k' + Date.now().toString(36), povod: '154', predmet,
        nomer: '', data: '', chasti: {}, zapiski: { chasti: [] }, blokove: {},
    });
    p.tekusht_krug = p.krugove_dop.length;
    _zapishiObekt(obekt, `Чл. 154: нов кръг на оценката — ${predmet}`);
    _prerisuvai();
}

function smeniKrug(i) {
    const obekt = _zhivObekt(); if (!obekt) return;
    _stroezh(obekt).tekusht_krug = Number(i) || 0;
    _zapishiTiho_ilisave(obekt);
    _prerisuvai();
}

function mahniKrug(i) {
    const obekt = _zhivObekt(); if (!obekt) return;
    const p = _stroezh(obekt);
    const k = (p.krugove_dop || [])[Number(i) - 1];
    if (!k) return;
    if (!confirm(`Да махна ли „${_imeKrug(p, Number(i))}“?`
        + String.fromCharCode(10, 10) + 'Записките и текстовете в този кръг се губят.')) return;
    p.krugove_dop.splice(Number(i) - 1, 1);
    p.tekusht_krug = 0;
    _zapishiObekt(obekt, 'Чл. 154: махнат кръг на оценката');
    _prerisuvai();
}

function krugPole(klyuch, stoynost) {
    const obekt = _zhivObekt(); if (!obekt) return;
    const p = _stroezh(obekt), i = _indeksKrug(p);
    if (!i) return;                       // кръг 1 си има полетата в паспорта
    _krug(p)[klyuch] = String(stoynost || '').trim();
    _zapishiTiho_ilisave(obekt);
}

function krugChast(kod, sastoyanie) {
    const obekt = _zhivObekt(); if (!obekt) return;
    const p = _stroezh(obekt), k = _krug(p);
    if (k === p) return;
    const ch = _krugChasti(k);
    if (sastoyanie) ch[kod] = sastoyanie; else delete ch[kod];
    _zapishiObekt(obekt, `Чл. 154: ${_KRUG_CHASTI.find(x => x[0] === kod)?.[1] || kod} — ${
        sastoyanie === _KRUG_IZMENENA ? 'изменена' : sastoyanie === _KRUG_NEPROMENENA
            ? 'непроменена' : 'не е посочена'}`);
    _prerisuvai();
}

// ── какво влиза в доклада ──────────────────────────────────────────────────
// Непроменената част не се преписва и не се потвърждава втори път: сочи се
// предишният доклад. Текстът му е на кръг 1 и си остава там.
function _krugNepromeneni(p) {
    const k = _krug(p);
    if (k === p) return [];
    const ch = _krugChasti(k);
    return _KRUG_CHASTI.filter(([kod]) => ch[kod] === _KRUG_NEPROMENENA)
        .map(([, ime]) => ime);
}

function _krugRedove(p, add) {
    const k = _krug(p), i = _indeksKrug(p);
    if (!i) return;
    add('ОСИП_Повод', 'чл. 154');
    add('ОСИП_Предмет_Изменение', k.predmet || '');
    add('ОСИП_Изменя_Доклад', [k.izmenya_nomer && '№ ' + k.izmenya_nomer,
                               k.izmenya_data && 'от ' + k.izmenya_data].filter(Boolean).join(' '));
    const nepromeneni = _krugNepromeneni(p);
    if (nepromeneni.length) {
        add('ОСИП_Непроменени_Части', 'Частите ' + nepromeneni.join(', ')
            + ' не се изменят — оценката за тях е по'
            + (k.izmenya_nomer ? ' комплексен доклад № ' + k.izmenya_nomer : ' предишния доклад')
            + (k.izmenya_data ? ' от ' + k.izmenya_data : '') + '.');
    }
}

// ── лентата ────────────────────────────────────────────────────────────────
function _krugLenta(obekt) {
    const p = _stroezh(obekt), spisak = _krugove(p), tekusht = _indeksKrug(p);
    const esc = _s2esc;
    const k = _krug(p);
    const ch = tekusht ? _krugChasti(k) : {};
    const chakat = tekusht
        ? _KRUG_CHASTI.filter(([kod]) => !ch[kod]).length : 0;

    return `
        <div class="card" style="margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                <div style="font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--muted)">
                    ${spisak.length === 1 ? 'Оценка' : `Кръгове на оценката · ${spisak.length}`}
                </div>
                ${spisak.map((x, i) => `
                    <button type="button" class="btn ${i === tekusht ? 'btn-primary' : 'btn-secondary'} btn-sm"
                            onclick="smeniKrug(${i})">${esc(_imeKrug(p, i))}</button>`).join('')}
                <button type="button" class="btn btn-ghost btn-sm" onclick="dobaviKrug()">+ изменение по чл. 154</button>
            </div>
            ${tekusht ? `
                <div style="margin-top:12px;border-top:1px solid var(--border-light);padding-top:12px">
                    <div style="font-size:13px;margin-bottom:8px">
                        <strong>Предмет на изменението</strong>
                        <div style="color:var(--muted);font-size:12px">
                            Разказът какво се променя. Влиза в доклада, в заповедта по чл. 154
                            и после в Акт 15 и окончателния доклад.</div>
                    </div>
                    <textarea class="form-input" rows="2" style="font-size:13px;margin-bottom:10px"
                              onchange="krugPole('predmet', this.value)">${esc(k.predmet || '')}</textarea>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:12px">
                        <label style="font-size:11.5px;color:var(--muted)">Изх. № на този доклад
                            <input type="text" class="form-input" style="font-size:13px"
                                   value="${esc(k.nomer || '')}" onchange="krugPole('nomer', this.value)"></label>
                        <label style="font-size:11.5px;color:var(--muted)">Дата
                            <input type="text" class="form-input" style="font-size:13px" placeholder="дд.мм.гггг"
                                   value="${esc(k.data || '')}" onchange="krugPole('data', this.value)"></label>
                        <label style="font-size:11.5px;color:var(--muted)">Изменя доклад №
                            <input type="text" class="form-input" style="font-size:13px"
                                   value="${esc(k.izmenya_nomer || '')}" onchange="krugPole('izmenya_nomer', this.value)"></label>
                        <label style="font-size:11.5px;color:var(--muted)">от дата
                            <input type="text" class="form-input" style="font-size:13px" placeholder="дд.мм.гггг"
                                   value="${esc(k.izmenya_data || '')}" onchange="krugPole('izmenya_data', this.value)"></label>
                    </div>
                    <div style="font-size:13px;margin-bottom:6px"><strong>Кои части се изменят</strong>
                        <span style="color:var(--muted);font-size:12px">${chakat
                            ? `· ${chakat} още не са посочени` : '· всички са посочени'}</span></div>
                    <div style="font-size:12.5px;line-height:2">
                        ${_KRUG_CHASTI.map(([kod, ime]) => `
                            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                                <span style="min-width:170px">${esc(ime)}</span>
                                <label style="cursor:pointer"><input type="radio" name="kr-${kod}"
                                    ${ch[kod] === _KRUG_IZMENENA ? 'checked' : ''}
                                    onchange="krugChast('${kod}', '${_KRUG_IZMENENA}')"> изменена</label>
                                <label style="cursor:pointer"><input type="radio" name="kr-${kod}"
                                    ${ch[kod] === _KRUG_NEPROMENENA ? 'checked' : ''}
                                    onchange="krugChast('${kod}', '${_KRUG_NEPROMENENA}')"> непроменена</label>
                                ${ch[kod] ? `<button type="button" class="btn btn-ghost btn-sm"
                                    onclick="krugChast('${kod}', '')">×</button>` : ''}
                            </div>`).join('')}
                    </div>
                    <p style="font-size:11.5px;color:var(--muted);margin:10px 0 0">
                        За изменената част подай новата записка — текстът се чете и потвърждава както при
                        първия доклад. За непроменената не се пише нищо: в доклада влиза ред, който сочи
                        предишния.
                    </p>
                    <button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px"
                            onclick="mahniKrug(${tekusht})">Махни този кръг</button>
                </div>` : ''}
        </div>`;
}
