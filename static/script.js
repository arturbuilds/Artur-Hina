let currentPage = 1;

loadWords();

async function loadWords(){
    const searchQuery = document.getElementById("search").value;
    const statusFilter = document.getElementById("status-filter").value;

    const response = await fetch(`/words?page=${currentPage}&limit=5&search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`);
    const data = await response.json();
    
    const words = data.words;
    const container = document.getElementById("words");
    container.innerHTML = "";

    let total = data.total;
    let learned = 0;
    let learning = 0;
    let repeat = 0;

    words.forEach(word => {
        if (word.status === 'Learned') learned++;
        else if (word.status === 'Learning') learning++;
        else if (word.status === 'Repeat') repeat++;

        // Проверяем, активна ли звезда в базе данных, и подставляем нужный класс
        const favClass = word.is_favorite ? 'word-fav active' : 'word-fav';

        container.innerHTML += `
            <div class="word" id="word-${word.id}">
                <div class="word-left">
                    <div class="jp">${word.japanese}</div>
                    <div class="reading">${word.reading ? word.reading : ''}</div>
                </div>
            
                <div class="word-center">
                    <div class="tr">${word.translation}</div>
                </div>
            
                <div class="word-right">
                    <div class="status ${word.status}">${word.status}</div>
                    <!-- Передаем id слова в функцию клика -->
                    <button class="${favClass}" onclick="toggleFavorite(this, ${word.id})"><span class="star-icon"></span></button>
                    <div class="menu-container">
                        <button class="word-menu" onclick="toggleMenu(event, ${word.id})">⋮</button>
                        <div class="dropdown-menu" id="dropdown-${word.id}">
                            <button onclick="changeStatus(${word.id}, 'Learning')">⏳ Learning</button>
                            <button onclick="changeStatus(${word.id}, 'Learned')">✅ Learned</button>
                            <button onclick="changeStatus(${word.id}, 'Repeat')">🔄 Repeat</button>
                            <hr>
                            <button class="delete-btn" onclick="removeWord(${word.id})">🗑️ Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById("total-words").textContent = total;
    document.getElementById("learned").textContent = learned;
    document.getElementById("learning").textContent = learning;
    document.getElementById("repeat").textContent = repeat;

    renderPagination(data.total_pages);
}

function renderPagination(totalPages) {
    const pagContainer = document.getElementById("pagination");
    pagContainer.innerHTML = "";

    if (totalPages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "←";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { currentPage--; loadWords(); };
    pagContainer.appendChild(prevBtn);

    const pageInfo = document.createElement("span");
    pageInfo.textContent = ` Page ${currentPage} of ${totalPages} `;
    pagContainer.appendChild(pageInfo);

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "→";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { currentPage++; loadWords(); };
    pagContainer.appendChild(nextBtn);
}

async function addWord(){
    const japanese = document.getElementById("japanese").value;
    const reading = document.getElementById("reading").value; 
    const translation = document.getElementById("translation").value;

    await fetch(
        `/add?japanese=${encodeURIComponent(japanese)}&reading=${encodeURIComponent(reading)}&translation=${encodeURIComponent(translation)}`,
        { method: "POST" }
    );

    document.getElementById("japanese").value = "";
    document.getElementById("reading").value = "";
    document.getElementById("translation").value = "";

    loadWords();
}

// Измененная функция клика по звезде — сохраняет состояние в базу данных
async function toggleFavorite(el, id) {
    el.classList.toggle('active');
    const isFavoriteNow = el.classList.contains('active');
    
    // Отправляем запрос бэкенду
    await fetch(`/words/${id}/favorite?is_favorite=${isFavoriteNow}`, { method: 'PUT' });
}

function toggleMenu(event, id) {
    event.stopPropagation();
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if(menu.id !== `dropdown-${id}`) menu.classList.remove('show');
    });
    const currentMenu = document.getElementById(`dropdown-${id}`);
    currentMenu.classList.toggle('show');
}

document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
});

async function changeStatus(id, newStatus) {
    await fetch(`/words/${id}/status?status=${newStatus}`, { method: 'PUT' });
    loadWords();
}

async function removeWord(id) {
    if (confirm("Точно удалить это слово?")) {
        await fetch(`/words/${id}`, { method: 'DELETE' });
        loadWords();
    }
}

function filterWords() {
    currentPage = 1;
    loadWords();
}

const mobileAddBtn = document.querySelector('.mobile-add-btn');
if (mobileAddBtn) {
    mobileAddBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
