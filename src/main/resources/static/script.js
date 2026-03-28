/* =========================================
   TEK PARÇA SCRIPT (LibRA - Final & Fixed)
   ========================================= */

// --- GLOBAL DEĞİŞKENLER ---
let currentUser = null;

const DEFAULT_COVER_COUNT = 6;
let allBooks = [];
let loadingTimer = null;

// --- DOM ELEMENTLERİ ---
const views = {
    loading: document.getElementById("loadingOverlay"),
    auth: document.getElementById("auth"),
    category: document.getElementById("categoryPage"),
    app: document.getElementById("app"),
    profile: document.getElementById("profilePage"),
    bookDetail: document.getElementById("bookDetail"),
    bookList: document.getElementById("books")
};

// --- YARDIMCI FONKSİYONLAR ---
function toggleLoading(show) {
    if (!views.loading) return;
    if (show) {
        views.loading.style.display = "flex";
        clearTimeout(loadingTimer);
        loadingTimer = setTimeout(() => { views.loading.style.display = "none"; }, 2000);
    } else {
        views.loading.style.display = "none";
        clearTimeout(loadingTimer);
    }
}

function showView(viewName) {
    toggleLoading(false);

    views.auth.style.display = "none";
    views.category.style.display = "none";
    views.app.style.display = "none";
    views.profile.style.display = "none";

    if (viewName === 'auth') views.auth.style.display = "block";
    else if (viewName === 'category') views.category.style.display = "block";
    else if (viewName === 'app') {
        views.app.style.display = "block";
        views.bookList.style.display = "grid";
        views.bookDetail.style.display = "none";
    }
    else if (viewName === 'detail') {
        views.app.style.display = "block";
        views.bookList.style.display = "none";
        views.bookDetail.style.display = "block";
    }
    else if (viewName === 'profile') views.profile.style.display = "block";
}

// --- İŞ MANTIĞI ---

// 1. GİRİŞ YAP
document.getElementById("loginBtn").onclick = function () {
    const u = document.getElementById("loginUsername").value;
    const p = document.getElementById("loginPassword").value;

    toggleLoading(true);

    fetch('http://localhost:8080/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
    })
    .then(response => {
        toggleLoading(false);
        if (response.ok) return response.json();
        throw new Error("Hatalı kullanıcı adı veya şifre!");
    })
    .then(user => {
        currentUser = user;
        if(!currentUser.borrowedBooks) currentUser.borrowedBooks = [];
        if(!currentUser.favorites) currentUser.favorites = [];
        if(!currentUser.waitingBooks) currentUser.waitingBooks = [];
        initApp();
    })
    .catch(error => alert(error.message));
};

// --- KAYIT VE ŞİFRE FONKSİYONLARI ---
function toggleRegPassword() {
    const x = document.getElementById("regPassword");
    x.type = x.type === "password" ? "text" : "password";
}

document.getElementById("registerBtn").onclick = function () {
    const u = document.getElementById("regUsername").value;
    const p = document.getElementById("regPassword").value;

    if (!u.endsWith("@etu.edu.tr")) {
        alert("Sadece @etu.edu.tr uzantılı mail adresiyle kayıt olabilirsiniz.");
        return;
    }

    const errors = [];
    if (p.length < 8 || p.length > 16) errors.push("- Şifre 8 ile 16 karakter arasında olmalı.");
    if (!/[A-Z]/.test(p)) errors.push("- En az 1 büyük harf içermeli.");
    if (!/[a-z]/.test(p)) errors.push("- En az 1 küçük harf içermeli.");
    if (!/[0-9]/.test(p)) errors.push("- En az 1 rakam içermeli.");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(p)) errors.push("- En az 1 özel karakter (!@#$%^&*) içermeli.");

    if (errors.length > 0) {
        alert("Şifreniz yeterince güçlü değil:\n\n" + errors.join("\n"));
        return;
    }

    toggleLoading(true);

    fetch('http://localhost:8080/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p, role: "user" })
    })
    .then(response => {
        toggleLoading(false);
        if (response.ok) {
            alert("Kayıt Başarılı! Giriş yapabilirsiniz.");
            document.getElementById("regUsername").value = "";
            document.getElementById("regPassword").value = "";
            resetPasswordRules();
            document.getElementById("showLoginBtn").click();
        } else {
            response.text().then(text => alert(text));
        }
    })
    .catch(error => {
        toggleLoading(false);
        console.error('Hata:', error);
    });
};

document.getElementById("regPassword").addEventListener("input", function () {
    const val = this.value;
    const setRule = (id, valid) => {
        const el = document.getElementById(id);
        if (valid) {
            el.style.color = "green"; el.style.fontWeight = "bold";
            el.textContent = "✓ " + el.textContent.replace(/[✓✗]\s/, "");
        } else {
            el.style.color = "#d32f2f"; el.style.fontWeight = "normal";
            el.textContent = el.textContent.replace(/[✓✗]\s/, "");
        }
    };
    setRule("rule-length", val.length >= 8 && val.length <= 16);
    setRule("rule-upper", /[A-Z]/.test(val));
    setRule("rule-lower", /[a-z]/.test(val));
    setRule("rule-number", /[0-9]/.test(val));
    setRule("rule-special", /[!@#$%^&*(),.?":{}|<>]/.test(val));
});

function resetPasswordRules() {
    ["rule-length", "rule-upper", "rule-lower", "rule-number", "rule-special"].forEach(id => {
        const el = document.getElementById(id);
        el.style.color = "#666"; el.style.fontWeight = "normal";
        el.textContent = el.textContent.replace(/[✓✗]\s/, "");
    });
}

document.getElementById("showRegisterBtn").onclick = () => {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("registerBox").style.display = "block";
};
document.getElementById("showLoginBtn").onclick = () => {
    document.getElementById("registerBox").style.display = "none";
    document.getElementById("loginBox").style.display = "block";
};
document.getElementById("toggleLoginPass").onclick = () => {
    const x = document.getElementById("loginPassword");
    x.type = x.type === "password" ? "text" : "password";
};

// 3. UYGULAMAYI BAŞLAT
function initApp() {
    if (currentUser.role === 'user' && (!currentUser.categories || currentUser.categories.length === 0)) {
        showView('category');
    } else {
        let url = 'http://localhost:8080/api/books/recommended';
        if (currentUser.categories && currentUser.categories.length > 0) {
            url += '?categories=' + currentUser.categories.join(',');
        }

        toggleLoading(true);

        fetch(url)
        .then(res => res.json())
        .then(data => {
            toggleLoading(false);
            allBooks = data;
            renderBooks(allBooks);
            showView('app');
            updateUserUI();
        })
        .catch(err => {
            toggleLoading(false);
            console.error("Kitaplar yüklenemedi:", err);
            alert("Kitaplar sunucudan çekilirken hata oluştu!");
        });
    }
}

// --- ARAMA MOTORU ---
const searchInput = document.getElementById("searchInput");
const searchType = document.getElementById("searchType");

function performSearch() {
    const term = searchInput.value.trim();
    const type = searchType ? searchType.value : "TITLE"; 

    if (term === "") {
        initApp(); 
    } else {
        fetch(`http://localhost:8080/api/books/search?keyword=${encodeURIComponent(term)}&type=${type}`)
        .then(res => {
            if (!res.ok) throw new Error("Sunucu hatası: " + res.status);
            return res.json();
        })
        .then(data => {
            allBooks = data; 
            renderBooks(allBooks); 
        })
        .catch(err => console.error("Arama hatası:", err));
    }
}

if (searchInput) {
    searchInput.addEventListener("input", performSearch);
    if (searchType) searchType.addEventListener("change", performSearch);
}

function updateUserUI() {
    const adminTabBtn = document.getElementById("adminTabBtn");
    if (currentUser.role === 'admin') adminTabBtn.style.display = "block";
    else adminTabBtn.style.display = "none";

    document.getElementById("profileName").textContent = currentUser.username.split('@')[0];
    document.getElementById("p-username-input").value = currentUser.username;

    if(currentUser.categories) {
        document.querySelectorAll("#p-categories-edit input").forEach(cb => {
            cb.checked = currentUser.categories.includes(cb.value);
        });
    }
}

// 4. KİTAPLARI LİSTELE
function getDefaultCover(bookId) {
    const coverNum = (bookId % DEFAULT_COVER_COUNT) + 1;
    return `assets/default${coverNum}.png`;
}

function renderBooks(customList = null) {
    const container = document.getElementById("books");
    container.innerHTML = ""; 

    let listToDisplay = customList !== null ? customList : allBooks;

    if (listToDisplay.length === 0) {
        container.innerHTML = `<p style="text-align:center; width:100%; color:#888;">Bu kriterlere uygun kitap bulunamadı.</p>`;
        return;
    }

    listToDisplay.forEach(book => {
        const isOut = book.stockCount < 1; 
        const div = document.createElement("div");
        div.className = `book-card ${isOut ? 'out-of-stock-card' : ''}`;

        const fallbackImg = getDefaultCover(book.id);
        const imgSrc = book.coverUrl ? book.coverUrl : fallbackImg;

        // --- KATEGORİ GÖSTERİMİ (FIX: categoryName kullanıldı) ---
        const categoryDisplay = (book.category && book.category.categoryName) ? book.category.categoryName : "Kategori Yok";

        div.innerHTML = `
            <div style="cursor:pointer">
                <img src="${imgSrc}" onerror="this.onerror=null; this.src='${fallbackImg}';">
                <span class="category-tag">${categoryDisplay}</span>
                <h4 class="book-title" style="margin:5px 0;">${book.title}</h4>
                <small class="book-author">${book.author}</small>
                <div style="margin:8px 0;">
                    <span class="badge-stock ${isOut ? 'out' : ''}">
                        ${isOut ? 'Tükendi' : 'Stok: ' + book.stockCount}
                    </span>
                </div>
            </div>`;

        div.querySelector("div").onclick = () => openBookDetail(book.id);
        container.appendChild(div);
    });
}

// 5. KİTAP DETAYI
function openBookDetail(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    const fallbackImg = getDefaultCover(book.id);
    const detailImg = document.getElementById("d-img");

    detailImg.src = book.coverUrl ? book.coverUrl : fallbackImg;
    
    document.getElementById("d-title").textContent = book.title;
    document.getElementById("d-author").textContent = book.author;
    document.getElementById("d-desc").textContent = book.desc || "Açıklama bulunmuyor.";
    document.getElementById("d-page").textContent = book.pages || 0;
    document.getElementById("d-stock-count").textContent = book.stockCount; 

    const btnDiv = document.getElementById("d-buttons");
    btnDiv.innerHTML = "";

    if (currentUser.role === 'admin') {
        const coverDiv = document.createElement("div");
        coverDiv.style.marginBottom = "20px";
        coverDiv.style.display = "flex";
        coverDiv.style.gap = "10px";

        coverDiv.innerHTML = `
            <input type="text" id="coverUrlInput" placeholder="Kapak URL..." value="${book.coverUrl || ''}" style="margin:0; flex:1;">
            <button id="saveCoverBtn" style="background:#1976d2; width:auto; padding:0 15px;">Kaydet</button>
        `;
        btnDiv.appendChild(coverDiv);

        document.getElementById("saveCoverBtn").onclick = () => {
            const newUrl = document.getElementById("coverUrlInput").value.trim();
            fetch(`http://localhost:8080/api/books/${book.id}/cover`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coverUrl: newUrl })
            })
            .then(res => res.json())
            .then(updated => {
                alert("Kapak güncellendi!");
                book.coverUrl = updated.coverUrl;
                openBookDetail(book.id);
            });
        };

        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️ Kitabı Sil";
        delBtn.style.background = "#d32f2f";
        delBtn.onclick = () => {
            if (confirm("Silinsin mi?")) {
                fetch(`http://localhost:8080/api/books/${book.id}`, { method: 'DELETE' })
                    .then(res => { if(res.ok) initApp(); });
            }
        };
        btnDiv.appendChild(delBtn);
    }
    showView('detail');
}

// 6. PROFİL VE KATEGORİ KAYDETME
document.getElementById("saveCategoriesBtn").onclick = () => {
    const selected = [...document.querySelectorAll("#initialCategoryList input:checked")].map(i => i.value);
    if (selected.length === 0) return alert("Seçim yapınız!");
    currentUser.categories = selected;
    initApp();
};

document.getElementById("updateProfileBtn").onclick = () => {
    const selected = [...document.querySelectorAll("#p-categories-edit input:checked")].map(i => i.value);
    const newPass = document.getElementById("p-new-password").value;
    if (selected.length === 0) return alert("Seçim yapınız!");
    currentUser.categories = selected;
    if (newPass) currentUser.password = newPass;
    initApp();
    alert("Profil güncellendi.");
};

// 8. ADMIN KİTAP EKLEME (FIX: categoryName kullanıldı)
document.getElementById("adminAddBookBtn").onclick = () => {
    const title = document.getElementById("adminBookTitle").value.trim();
    const author = document.getElementById("adminBookAuthor").value.trim();
    const stock = document.getElementById("adminBookStock").value;
    const catName = document.getElementById("adminBookCat").value;
    const coverUrl = document.getElementById("adminBookCover").value.trim(); 

    if (!title || !stock) return alert("Zorunlu alanları doldurun!");

    const newBook = {
        title: title,
        author: author,
        category: { categoryName: catName }, 
        stockCount: parseInt(stock), 
        coverUrl: coverUrl || null, 
        likeCount: 0
    };

    fetch('http://localhost:8080/api/books/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
    })
    .then(res => res.json())
    .then(() => {
        alert("Kitap eklendi!");
        initApp();
    });
};

// 9. NAVİGASYON
document.getElementById("navHomeBtn").onclick = () => {
    if (searchInput) searchInput.value = "";
    initApp();
};
document.getElementById("closeDetailBtn").onclick = () => showView('app');
document.getElementById("navProfileBtn").onclick = () => {
    showView('profile');
    renderProfileLists();
    updateUserUI(); 
};
document.getElementById("backHomeProfileBtn").onclick = () => showView('app');
document.getElementById("logoutBtn").onclick = () => location.reload();

function renderProfileLists() {
    // Favoriler
    const favDiv = document.getElementById("list-favorites");
    favDiv.innerHTML = "";
    if (!currentUser.favorites || currentUser.favorites.length === 0) favDiv.innerHTML = "<p>Favori yok.</p>";
    else {
        currentUser.favorites.forEach(fid => {
            const book = allBooks.find(b => b.id === fid);
            if (book) {
                favDiv.innerHTML += `<div onclick="openBookDetail(${book.id})" class="book-card" style="padding:10px; cursor:pointer;"><p>${book.title}</p></div>`;
            }
        });
    }

    // Ödünç Alınanlar
    const borDiv = document.getElementById("list-borrowed");
    borDiv.innerHTML = "";
    if (!currentUser.borrowedBooks || currentUser.borrowedBooks.length === 0) borDiv.innerHTML = "<p>Ödünç kitap yok.</p>";
    else {
        currentUser.borrowedBooks.forEach(bb => {
            borDiv.innerHTML += `<div onclick="openBookDetail(${bb.bookId})" class="book-card" style="padding:10px; cursor:pointer;"><p>${bb.title}</p></div>`;
        });
    }

    // Bekleme Listesi
    const waitDiv = document.getElementById("list-waiting");
    if (waitDiv) {
        waitDiv.innerHTML = "";
        if (!currentUser.waitingBooks || currentUser.waitingBooks.length === 0) waitDiv.innerHTML = "<p>Sırada beklediğiniz kitap yok.</p>";
        else {
            currentUser.waitingBooks.forEach(wid => {
                const book = allBooks.find(b => b.id === wid);
                if (book) {
                    waitDiv.innerHTML += `<div onclick="openBookDetail(${book.id})" class="book-card" style="padding:10px; border:1px solid #ff9800;"><p>${book.title}</p></div>`;
                }
            });
        }
    }
}