// АКТ СИСТЕМ · новото ПВА · sobstvenost.js
// ЕКРАН 5. СОБСТВЕНОСТТА
//
// Заданието е кратко и ясно: „Както е сега — лица, обекти, актове — защото
// работи и защото е единственото място, където се доказва кой е възложител.
// Едно допълнение: горе да казва с едно изречение какво липсва.“
//
// Затова тук НЕ се смята нищо. Сметките с идеалните части идват от
// `js/07-sobstvenost.js` през `most.js`; този файл само ги показва.
//
// Собствеността виси на ИМОТА, не на строежа — при три разрешения за строеж
// в един имот тя е една. Затова екранът не носи номер на строеж в заглавието
// си и не се мени при превключване между строежите.

'use strict';

let sobstvenostId = null;

function sobstvenostOtvori(id, i) {
    sobstvenostId = id;
    const p = aktObekt(id);
    if (!p) {
        document.getElementById('sobstvenost-telo').innerHTML =
            '<div class="pusto"><div class="pusto-ime">Този обект го няма</div></div>';
        return;
    }
    aktZapomniObekt(p, i);
    sobstvenostRisuvai();
}

function sobstvenostRisuvai() {
    const p = aktObekt(sobstvenostId);
    if (!p) return;
    document.getElementById('sobstvenost-telo').innerHTML =
        sobstvenostIzrechenieHtml(p)
        + sobstvenostVazlozhiteliHtml(p)
        + sobstvenostNahodkiHtml(p)
        + sobstvenostRegistarHtml(p);
    // Изборът на четец се помни — както в старото `renderSobstvenostPage`.
    try {
        const el = document.getElementById('sb-chetec');
        if (el) el.value = localStorage.getItem('sb_chetec') || 'mistral';
    } catch (e) {}
}

// ── Едно изречение: какво липсва ─────────────────────────────────────────────
// Допълнението, което заданието иска. Кухнята вече го смята — `_sbSastoyanie`
// връща или „веригата връзва“, или първата находка, която я къса.

function sobstvenostIzrechenieHtml(p) {
    const s = _sbSastoyanie(p);
    return `
    <div class="izrechenie izrechenie-${s.gotovo ? 'dobre' : 'lipsva'}">
        <span class="izrechenie-znak">${s.gotovo ? '✓' : '⚠'}</span>
        <span>${_e(s.tekst)}</span>
    </div>`;
}

// ── Възложителите: кой какво държи днес ──────────────────────────────────────
// „Възложител“ не се въвежда — извежда се. Възложител е онзи, който към датата
// държи право в който и да е обект на имота — и без вписан дял.
//
// Операторът, 04.11.2026: с ДВЕТЕ ИМЕНА и какво притежава — „Иван Петров —
// собственик на 100% от земята; Мария Йорданова — собственик на АП3 и гараж
// 4“. Трите имена стоят в подсказката: те отиват в Акт 15.
//
// Тук се пренесоха и мебелите от старата карта: датата („към кога“),
// представителят за Протокол 2 и кой подписва Акт 15.

// Как се казва обектът в изречение. Само показване — не смята.
function _sobImeObekt(s, id) {
    const o = (s.obekti || []).find(x => x.id === id) || {};
    if (o.vid === 'земя') return 'земята';
    return o.opisanie || o.identifikator || '(обект)';
}

function _sobPritezhava(s, prava) {
    const pravo = [], sobst = [];
    for (const x of prava) {
        const o = (s.obekti || []).find(y => y.id === x.obekt) || {};
        const ime = _sobImeObekt(s, x.obekt);
        const t = x.posochen ? `${_e(ime)} <span class="lipsva-dyal">(посочен в акта за право на строеж — неговият акт не е качен)</span>`
            : x.bezDyal ? `${_e(ime)} <span class="lipsva-dyal">(дялът не е вписан)</span>`
            : _drEdno(x.dyal) ? _e(ime)
            : `<strong>${_e(_drTekst(x.dyal))}</strong> от ${_e(ime)}`;
        (/право на строеж/i.test(o.vid || '') ? pravo : sobst).push(t);
    }
    const sp = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' и ' + a[a.length - 1] : a[0];
    return [sobst.length ? 'собственик на ' + sp(sobst) : '',
            pravo.length ? 'с право на строеж — ' + sp(pravo) : ''].filter(Boolean).join('; ');
}

function sobstvenostVazlozhiteliHtml(p) {
    const s = _sbDanni(p);
    const data = p._sb_data || _sbDnes();
    const vaz = _sbVazlozhiteli(p, data);
    const glava = `
        <div class="redica">
            <div class="nadpis" style="flex:1">Възложители${vaz.length ? ' · ' + vaz.length : ''}</div>
            <label class="tiho">към <input type="text" class="vh-data" value="${_e(data)}"
                placeholder="дд.мм.гггг" onchange="sbData(this.value)"></label>
        </div>`;
    if (!vaz.length) {
        // Регистърът е празен, но паспортът може да носи писаното на ръка — и
        // документите ТОГАВА ВЗИМАТ НЕГО (`vazlozhiteli` в 03-obshti). Казва се,
        // за да не излиза в акта нещо, което на този екран го няма.
        const rachni = (p.clients || (p.client ? [p.client] : [])).filter(c => c && c.name);
        return `<div class="kutiya-razdel">${glava}
            <p>${s.obekti.length ? `Към ${_e(data)} никой не държи право — виж какво не връзва.`
                : 'Още никой — регистърът е празен. Качи акта, с който е придобит имотът.'}</p>
            ${rachni.length ? `<p class="tiho">Докато регистърът е празен, документите взимат
                писаното на ръка в паспорта: <strong>${rachni.map(c => _e(c.name)).join(', ')}</strong>.</p>` : ''}
        </div>`;
    }
    const pod = _sbPodpisi(p, data);
    const chuzhdi = pod.redove.filter(r => !r.sam);
    return `
    <div class="kutiya-razdel">${glava}
        <p class="poyasnenie">Не се въвеждат — извеждат се. Възложител е всеки, който към
           датата държи право в имота, и без дял от земята.</p>
        ${vaz.map(v => {
            const l = _sbLice(s, v.lice) || {};
            const pr = l.predstavitel;
            const izbran = s.predstavitel === v.lice || (!s.predstavitel && v === vaz[0]);
            return `
            <div class="vaz-red">
                <div class="vaz-ime"><span title="${_e(v.ime)}">${_e(_sbDveImena(v.ime))}</span>${
                    l.vid === 'юридическо' ? '<span class="otkade">юридическо лице</span>' : ''}
                    ${v.lice ? `<label class="otkade vaz-pred"><input type="radio" name="sb-pred" ${izbran ? 'checked' : ''}
                        onchange="sbPredstavitel('${_e(v.lice)}')"> представител в Протокол 2</label>` : ''}
                </div>
                <div class="vaz-prava">${_sobPritezhava(s, v.prava)}</div>
                ${pr ? `<div class="otkade">подписва ${_e(pr.ime)}${
                    pr.nomer ? ', пълномощно рег. № ' + _e(pr.nomer) : ''}${
                    pr.data ? ' от ' + _e(pr.data) + ' г.' : ''}</div>` : ''}
            </div>`;
        }).join('')}
        <p class="tiho" style="margin-top:8px"><strong>Акт 15 подписват ${pod.broj}</strong>${chuzhdi.length
            ? ' · ' + chuzhdi.map(r => `${_e(r.podpisva)} за ${_e(_sbDveImena(r.ime))}${
                r.osnovanie ? ' (пълномощно ' + _e(r.osnovanie) + ')' : ''}`).join(' · ')
            : ' — всички лично'}</p>
        ${pod.lipsvat.map(x => `<p class="greshka">⚠ ${_e(x)}</p>`).join('')}
    </div>`;
}

// ── Находките: само каквото не връзва ────────────────────────────────────────
// Кодът съди, но само за това, което има значение. От сто акта обикновено три.

const SOBSTVENOST_VID = {
    prazno: 'няма събитие', nepalno: 'непълна верига', nadvishava: 'повече от цялото', posocheni: 'само посочени', pravo_varhu_zemya: 'право на строеж върху земята', dyal: 'дял', minus: 'прехвърлено повече',
    pochinal: 'починал собственик', prazen_akt: 'акт без номер',
};

function sobstvenostNahodkiHtml(p) {
    const nah = _sbNahodki(p);
    if (!nah.length) return '';
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Какво не връзва · ${nah.length}</div>
        ${nah.map(n => `
            <div class="nahodka">
                <span class="nahodka-vid">${_e(SOBSTVENOST_VID[n.vid] || n.vid)}</span>
                <span>${_e(n.tekst)}</span>
                ${n.vid === 'pravo_varhu_zemya' ? `<button class="bt" onclick="sbOtdeliPravo('${_e(n.sabitie)}')">
                    Отдели правото на строеж</button>` : ''}
            </div>`).join('')}
    </div>`;
}

// ── Регистърът: лица, обекти, актове и четенето ─────────────────────────────
// Преместен ЦЯЛ от старото ПВА (04.11.2026): четенето на нотариален акт,
// прочетеното за поправка и приемане, трите таблици с добавяне и махане. Не е
// преписан — рисуват го същите функции на кухнята, със същите бутони.
// Затова тук няма вече връзка „поправи в старото“: стаята е цяла.
//
// Отделната „Веригата“ отпадна: таблицата с актовете е същият списък, но с
// бутоните за поправка. Два списъка на едно и също се разминават.

function sobstvenostRegistarHtml(p) {
    return `
    <div class="kutiya-razdel sb-registar">
        <div class="nadpis">Регистърът</div>
        ${_sbChetenoHtml(p)}
        ${_sbCheteneHtml()}
        ${_sbTablici(p)}
    </div>`;
}
