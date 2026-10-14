// АКТ СИСТЕМ · 13-kraj.js
// помощни функции и пускането на приложението
//
// Отделен от app.js на 13.10.2026 (стъпка 2 от ПОДРЕЖДАНЕ.md).
// Файловете се включват по РЕД и споделят едно и също глобално
// пространство — точно както беше в единия скрипт.

//  UTILITIES
// ═══════════════════════════════════════════════════════════
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}


function formatDateTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return `${formatDate(d.toISOString().split('T')[0])} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════
// Set current date
document.getElementById('current-date').textContent = new Date().toLocaleDateString('bg-BG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });


// Кога е кодът, който браузърът наистина е заредил. Без този белег „обновено
// ли е“ е гадаене: операторът виждаше вчерашния екран, докато сървърът даваше
// новия файл, и нямаше как да се различи. (14.10.2026)
async function pokazhiKogaEKodat() {
    const kutiya = document.getElementById('kod-ot');
    if (!kutiya) return;
    try {
        const r = await fetch('js/13-kraj.js', { method: 'HEAD', cache: 'no-store' });
        const d = new Date(r.headers.get('last-modified') || Date.now());
        kutiya.textContent = 'код от ' + d.toLocaleDateString('bg-BG')
            + ' ' + d.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
        kutiya.title = 'Ако това не се мени след обновяване, браузърът дава стар файл.';
    } catch (e) {
        kutiya.textContent = '2026';
    }
}
pokazhiKogaEKodat();

// Load everything
loadData();
