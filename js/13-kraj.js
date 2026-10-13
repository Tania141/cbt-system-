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


// Load everything
loadData();
