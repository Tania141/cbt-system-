// ЕКРАН: ДОКУМЕНТИТЕ НА МОМЕНТА.
//
// Първата стая, която се мести от старото ПВА (решено 03.11.2026). Докато
// генерирането беше само там, старото оставаше задължително.
//
// Екранът не знае как се прави документ — това е в кухнята
// (`js/11b-generirane.js`). Тук е само: какво се предлага, какво е избрано,
// какво се случи.

let dokId = null, dokI = 0, dokMoment = '';
let dokIzbrani = new Set();
let dokSastoyanie = {};     // apiType → 'chaka' | 'gotov' | текст на грешката
let dokRaboti = false;

function dokumentiOtvori(id, i, moment) {
    dokId = id; dokI = +i || 0; dokMoment = moment || '';
    dokIzbrani = new Set();
    dokSastoyanie = {};
    const p = aktObekt(dokId);
    if (!p) { document.getElementById('dokumenti-telo').innerHTML = '<p>Няма такъв обект.</p>'; return; }
    aktZapomniObekt(p, dokI);
    // Документът на момента е избран предварително — най-честото е едно.
    const vidove = dokumentiVidove();
    if (vidove.length === 1) dokIzbrani.add(vidove[0].apiType);
    dokumentiRisuvai();
}

function dokumentiVidove() {
    return typeof genVidoveZaMoment === 'function' ? genVidoveZaMoment(dokMoment) : [];
}

function dokumentiZhiv() {
    const p = aktObekt(dokId);
    if (!p) return null;
    return { p, st: aktStroezh(p, dokI) };
}

function dokumentiRisuvai() {
    const z = dokumentiZhiv();
    if (!z) return;
    const vidove = dokumentiVidove();
    const konsultant = (aktDanni.consultants || []).find(c => c.id == (z.p.consultant || {}).id);

    const red = v => {
        const s = dokSastoyanie[v.apiType];
        const znak = s === 'gotov' ? '<span class="gotov">✔ изтеглен</span>'
                   : s === 'chaka' ? '<span class="tiho">⏳ изпраща се…</span>'
                   : s ? `<span class="greshka">✗ ${_e(s)}</span>` : '';
        return `<label class="dok-red">
            <input type="checkbox" ${dokIzbrani.has(v.apiType) ? 'checked' : ''}
                   onchange="dokumentiMarkirai('${_e(v.apiType)}', this.checked)">
            <span class="dok-ime">${_e(v.label)}</span>
            ${znak}</label>`;
    };

    document.getElementById('dokumenti-telo').innerHTML = `
    <div class="kutiya-razdel">
        <div class="nadpis">${_e(dokMoment || 'Документите')}</div>
        ${!konsultant ? `<p class="greshka">Обектът няма избран консултант —
            документът не може да се състави.</p>` : ''}
        ${vidove.length ? vidove.map(red).join('') :
            '<p class="tiho">За този момент няма описан документ.</p>'}
        <div class="redica" style="margin-top:12px">
            <button class="bt bt-glaven" onclick="dokumentiSastavi()"
                    ${dokRaboti || !konsultant ? 'disabled' : ''}>
                ${dokRaboti ? 'Съставя се…' : 'Съставѝ'}</button>
            <span class="tiho">Файлът се сваля веднага; следата остава в обекта.</span>
        </div>
    </div>
    ${dokumentiPodpisvashtiHtml()}
    ${dokumentiAkt12Html()}
    ${dokumentiP2Html()}
    ${dokumentiKakvoVlizaHtml(z)}`;

    // Двете кутии се пълнят от кухнята — СЪЩИТЕ функции, които ползва и старият
    // екран. Преместване значи пренасяне, не преписване.
    if (typeof renderSignersChecklist === 'function')
        renderSignersChecklist('dok-signers', z.p);
    if (dokumentiIma('akt12') && typeof renderAkt12Parts === 'function')
        renderAkt12Parts('dok-akt12', z.p, konsultant);
    // Котите се взимат от потвърденото в „Проверки“, както в стария прозорец.
    if (dokumentiIma('protokol2combined') && typeof _napalniKoti === 'function')
        _kotiBelejka('dok-koti-belejka', _napalniKoti('p2-'));
}

function dokumentiIma(apiType) {
    return dokIzbrani.has(apiType) && dokumentiVidove().some(v => v.apiType === apiType);
}

// Кой подписва долу. Горе в документа винаги се изписват всички възложители —
// тук се избира само кой слага подпис. Без този избор системата приемаше, че
// подписват всички, а това не е избор на оператора. (04.11.2026)
function dokumentiPodpisvashtiHtml() {
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Кой подписва долу</div>
        <div id="dok-signers"></div>
    </div>`;
}

function dokumentiAkt12Html() {
    if (!dokumentiIma('akt12')) return '';
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Акт 12 — по кои части</div>
        <div id="dok-akt12"></div>
        <p class="tiho">Акт 12 се съставя по части: по един документ за всяка отметната.</p>
    </div>`;
}

// Котите и стандартните текстове на Протокол 2. Същите полета (`p2-…`) като в
// стария прозорец, за да работят същите помощници от кухнята.
function dokumentiP2Html() {
    if (!dokumentiIma('protokol2combined')) return '';
    const pole = (id, etiket, mysto) => `
        <label class="p2-pole"><span>${etiket}</span>
            <input type="text" id="${id}" placeholder="${mysto || ''}"></label>`;
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Протокол 2 — коти и репер</div>
        <div class="p2-mrezha">
            ${pole('p2-kota-izkop', 'Кота изкоп')}
            ${pole('p2-kota-cokul', 'Кота цокъл')}
            ${pole('p2-kota-korniz', 'Кота корниз')}
            ${pole('p2-kota-bilo', 'Кота било')}
            ${pole('p2-reper-nomer', 'Репер №')}
            ${pole('p2-reper-kota', 'Кота на репера')}
        </div>
        <div id="dok-koti-belejka"></div>
        ${pole('p2-opisanie-ploshtadka', 'Описание на площадката')}
        <label class="p2-chek"><input type="checkbox" id="p2-darv-ima"
            onchange="dokumentiRisuvaiZapazi()"> Има дървесност за изкореняване</label>
        ${dokP2Darv ? pole('p2-darvesenost', 'Каква дървесност') : ''}
        <label class="p2-chek"><input type="checkbox" id="p2-sastoyanie-custom"
            onchange="dokumentiRisuvaiZapazi()"> Състоянието наоколо е различно от обичайното</label>
        ${dokP2Sast ? pole('p2-sastoyanie', 'Какво е състоянието') : ''}
        <p class="tiho">Празното значи стандартния текст, не празен ред в протокола.</p>
    </div>`;
}

// Отметките на Протокол 2 отварят поле — затова екранът се прерисува, а
// въведеното дотогава се пази.
let dokP2Darv = false, dokP2Sast = false;

function dokumentiRisuvaiZapazi() {
    const v = dokumentiChetiP2();
    dokP2Darv = v.imaDarvesenost;
    dokP2Sast = v.svoeSastoyanie;
    dokumentiRisuvai();
    for (const [id, st] of Object.entries(v.poleta)) {
        const el = document.getElementById(id);
        if (el && st) el.value = st;
    }
}

function dokumentiChetiP2() {
    const v = id => (document.getElementById(id) || {}).value || '';
    const chek = id => !!(document.getElementById(id) || {}).checked;
    const poleta = {};
    for (const id of ['p2-kota-izkop', 'p2-kota-cokul', 'p2-kota-korniz', 'p2-kota-bilo',
                      'p2-reper-nomer', 'p2-reper-kota', 'p2-opisanie-ploshtadka',
                      'p2-darvesenost', 'p2-sastoyanie'])
        poleta[id] = v(id);
    return {
        izkop: poleta['p2-kota-izkop'], cokul: poleta['p2-kota-cokul'],
        korniz: poleta['p2-kota-korniz'], bilo: poleta['p2-kota-bilo'],
        reperNomer: poleta['p2-reper-nomer'], reperKota: poleta['p2-reper-kota'],
        opisanie: poleta['p2-opisanie-ploshtadka'],
        imaDarvesenost: chek('p2-darv-ima'), darvesenost: poleta['p2-darvesenost'],
        svoeSastoyanie: chek('p2-sastoyanie-custom'), sastoyanie: poleta['p2-sastoyanie'],
        poleta,
    };
}

// КАКВО ЩЕ ВЛЕЗЕ — преди да се натисне, не след като се разпечата.
//
// Операторът, 29.10.2026, научи какво е влязло чак от свалените .docx. Затова
// тук стои кратко: колко документа влизат в акта и кое още чака сверяване.
function dokumentiKakvoVlizaHtml(z) {
    if (typeof dokTetradka !== 'function') return '';
    const redove = dokTetradka(z.p, z.st);
    if (!redove.length) return '';
    const vlizat = redove.filter(r => r.sveren);
    const chakat = redove.length - vlizat.length;
    return `
    <div class="kutiya-razdel">
        <div class="nadpis">Какво ще влезе</div>
        <p class="tiho"><strong>${vlizat.length}</strong> сверени документа влизат в текста${
            chakat ? `; <strong>${chakat}</strong> още чакат сверяване и НЕ влизат` : ''}.</p>
        ${chakat ? `<p class="tiho">Нечекнатото не е недовършено — то е оставено отвън нарочно.
            Досието е мястото, където се чекне.</p>` : ''}
    </div>`;
}

function dokumentiMarkirai(apiType, da) {
    if (da) dokIzbrani.add(apiType); else dokIzbrani.delete(apiType);
    // Отметката решава кои мебели се показват — частите на Акт 12, котите на
    // Протокол 2.
    dokumentiRisuvai();
}

async function dokumentiSastavi() {
    const z = dokumentiZhiv();
    if (!z || dokRaboti) return;
    const konsultant = (aktDanni.consultants || []).find(c => c.id == (z.p.consultant || {}).id);
    if (!konsultant) return;
    const vidove = dokumentiVidove().filter(v => dokIzbrani.has(v.apiType));
    if (!vidove.length) { alert('Избери поне един документ.'); return; }

    // Мебелите се четат ПРЕДИ рисуването — иначе прерисуването ги изтрива.
    const podpisvashti = typeof readSigners === 'function' ? readSigners('dok-signers') : undefined;
    const chasti = (dokumentiIma('akt12') && typeof readAkt12Parts === 'function')
        ? readAkt12Parts('dok-akt12') : [];
    const p2 = dokumentiIma('protokol2combined') ? dokumentiChetiP2() : null;
    if (dokumentiIma('akt12') && !chasti.length) { alert('Акт 12: отбележи поне една част.'); return; }

    dokRaboti = true;
    dokumentiRisuvai();
    const rezultati = [];
    for (const zadacha of genZadachi(vidove, chasti)) {
        const v = zadacha.vid;
        dokSastoyanie[v.apiType] = 'chaka';
        dokumentiRisuvai();
        try {
            const { ime, sadarzhanie } = await genDokument(z.p, konsultant, v.apiType, {
                ...zadacha,
                passportExtra: { signers: podpisvashti },
                p2: v.apiType === 'protokol2combined' ? p2 : null,
            });
            genSvali(ime, sadarzhanie);
            dokSastoyanie[v.apiType] = 'gotov';
            rezultati.push({ type: zadacha.chast ? `${v.label} (${zadacha.akt12_number})` : v.label,
                             date: new Date().toISOString(), url: '', path: '' });
        } catch (e) {
            dokSastoyanie[v.apiType] = e.message;
        }
        dokumentiRisuvai();
    }
    if (rezultati.length) { genZapishi(z.p, rezultati); aktZapishi(); }
    dokRaboti = false;
    dokumentiRisuvai();
}
