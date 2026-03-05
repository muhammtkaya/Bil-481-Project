/* =========================================
   TEK PARÇA SCRIPT (Unified - Clean Version)
   ========================================= */

// --- VERİTABANI (MOCK DATA) ---
const DB = {
    books: [
        { id: 1, title: "Clean Code", author: "Robert C. Martin", category: "Yazılım", stock: 3, img: "assets/clean_code.png", pages: 464, desc: "Temiz kod yazma sanatı." },
        { id: 2, title: "Sefiller", author: "Victor Hugo", category: "Roman", stock: 5, img: "assets/sefiller.png", pages: 1400, desc: "Fransız devrimi döneminde geçen başyapıt." },
        { id: 3, title: "1984", author: "George Orwell", category: "Roman", stock: 0, img: "assets/1984.png", pages: 328, desc: "Distopik bir gelecek." }
    ],
    users: [
        {
            id: 101, username: "muhammet@etu.edu.tr", password: "Password123!", role: "user",
            categories: ["Yazılım"], borrowedBooks: [], favorites: [], waitingBooks: []
        },
        {
            id: 999, username: "admin@etu.edu.tr", password: "AdminPassword1!", role: "admin",
            categories: [], borrowedBooks: [], favorites: [], waitingBooks: []
        }
    ]
};

// --- GLOBAL DEĞİŞKENLER ---
let currentUser = null;
let allBooks = [...DB.books];
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
    setTimeout(() => {
        const user = DB.users.find(user => user.username === u && user.password === p);
        toggleLoading(false);

        if (user) {
            currentUser = user;
            initApp();
        } else {
            alert("Hatalı kullanıcı adı veya şifre!");
        }
    }, 500);
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
    setTimeout(() => {
        if (DB.users.find(user => user.username === u)) {
            toggleLoading(false);
            alert("Bu kullanıcı zaten kayıtlı!");
            return;
        }

        const newUser = {
            id: Date.now(), username: u, password: p, role: "user",
            categories: [], borrowedBooks: [], favorites: [], waitingBooks: []
        };
        DB.users.push(newUser);
        toggleLoading(false);
        alert("Kayıt Başarılı! Giriş yapabilirsiniz.");

        document.getElementById("regUsername").value = "";
        document.getElementById("regPassword").value = "";
        resetPasswordRules();
        document.getElementById("showLoginBtn").click();
    }, 500);
};

// Şifre Kuralları Görsel Kontrol
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

// Auth Ekran Geçişleri
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
    if (currentUser.role === 'user' && currentUser.categories.length === 0) {
        showView('category');
    } else {
        renderBooks(null); // İlgi alanına göre aç
        showView('app');
        updateUserUI();
    }
}

// --- ARAMA MOTORU ---
const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("input", function (e) {
        const term = e.target.value.toLowerCase().trim();
        if (term === "") {
            renderBooks(null);
        } else {
            const filteredBooks = allBooks.filter(book =>
                book.title.toLowerCase().includes(term) ||
                book.author.toLowerCase().includes(term)
            );
            renderBooks(filteredBooks);
        }
    });
}

function updateUserUI() {
    const adminTabBtn = document.getElementById("adminTabBtn");
    if (currentUser.role === 'admin') adminTabBtn.style.display = "block";
    else adminTabBtn.style.display = "none";

    document.getElementById("profileName").textContent = currentUser.username.split('@')[0];
    document.getElementById("p-username-input").value = currentUser.username;

    document.querySelectorAll("#p-categories-edit input").forEach(cb => {
        cb.checked = currentUser.categories.includes(cb.value);
    });
}

// 4. KİTAPLARI LİSTELE (MANTIK DÜZELTİLDİ)
function renderBooks(customList = null) {
    const container = document.getElementById("books");
    container.innerHTML = "";

    let listToDisplay;

    if (customList !== null) {
        listToDisplay = customList;
    } else {
        if (currentUser) {
            listToDisplay = allBooks.filter(book =>
                currentUser.categories.includes(book.category)
            );
        } else {
            listToDisplay = allBooks;
        }
    }

    if (listToDisplay.length === 0) {
        container.innerHTML = `<p style="text-align:center; width:100%; color:#888;">Bu kriterlere uygun kitap bulunamadı.</p>`;
        return;
    }

    listToDisplay.forEach(book => {
        const isOut = book.stock < 1;
        const div = document.createElement("div");
        div.className = `book-card ${isOut ? 'out-of-stock-card' : ''}`;

        div.innerHTML = `
            <div style="cursor:pointer">
                <img src="${book.img}" onerror="this.src='assets/logo.png'">
                <span class="category-tag">${book.category}</span>
                <h4 class="book-title" style="margin:5px 0;">${book.title}</h4>
                <small class="book-author">${book.author}</small>
                <div style="margin:8px 0;">
                    <span class="badge-stock ${isOut ? 'out' : ''}">
                        ${isOut ? 'Tükendi' : 'Stok: ' + book.stock}
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

    document.getElementById("d-img").src = book.img;
    document.getElementById("d-title").textContent = book.title;
    document.getElementById("d-author").textContent = book.author;
    document.getElementById("d-desc").textContent = book.desc;
    document.getElementById("d-page").textContent = book.pages;
    document.getElementById("d-stock-count").textContent = book.stock;

    const btnDiv = document.getElementById("d-buttons");
    btnDiv.innerHTML = "";

    // ADMIN BUTONU
    if (currentUser.role === 'admin') {
        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️ Kitabı Sil (Admin)";
        delBtn.style.background = "#d32f2f";
        delBtn.style.marginBottom = "15px";
        delBtn.onclick = () => {
            if (confirm("Bu kitabı sistemden tamamen silmek istediğinize emin misiniz?")) {
                allBooks = allBooks.filter(b => b.id !== bookId);
                alert("Kitap silindi.");
                renderBooks(null);
                showView('app');
            }
        };
        btnDiv.appendChild(delBtn);
    }

    // FAVORİ BUTONU
    const isFav = currentUser.favorites.includes(bookId);
    const favBtn = document.createElement("button");
    favBtn.textContent = isFav ? "❤️ Favorilerde" : "🤍 Favorilere Ekle";
    favBtn.style.background = isFav ? "#ef5350" : "#bdbdbd";
    favBtn.style.marginRight = "10px"; favBtn.style.width = "auto";
    favBtn.onclick = () => {
        if (isFav) currentUser.favorites = currentUser.favorites.filter(id => id !== bookId);
        else currentUser.favorites.push(bookId);
        openBookDetail(bookId);
    };
    btnDiv.appendChild(favBtn);

    // ÖDÜNÇ/İADE BUTONLARI
    const isBorrowed = currentUser.borrowedBooks.some(b => b.bookId === bookId);

    if (isBorrowed) {
        const btn = document.createElement("button");
        btn.textContent = "↩️ İade Et";
        btn.style.background = "#2e7d32"; btn.style.width = "auto";
        btn.onclick = () => {
            if (!confirm("Kitabı iade etmek istiyor musunuz?")) return;
            currentUser.borrowedBooks = currentUser.borrowedBooks.filter(b => b.bookId !== bookId);
            book.stock++;
            alert("Kitap iade edildi.");
            renderBooks(null);
            openBookDetail(bookId);
        };
        btnDiv.appendChild(btn);

    } else if (book.stock > 0) {
        const btn = document.createElement("button");
        btn.textContent = "📖 Ödünç Al";
        btn.style.background = "#ff9800"; btn.style.width = "auto";
        btn.onclick = () => {
            book.stock--;
            currentUser.borrowedBooks.push({ bookId: book.id, title: book.title });
            alert("Kitap ödünç alındı! İyi okumalar.");
            renderBooks(null);
            openBookDetail(bookId);
        };
        btnDiv.appendChild(btn);
    } else {
        const isWaiting = currentUser.waitingBooks.includes(bookId);
        const wBtn = document.createElement("button");
        wBtn.textContent = isWaiting ? "🚫 Sıradan Çık" : "⏳ Stok Yok - Sıraya Gir";
        wBtn.style.background = isWaiting ? "#5d4037" : "#795548"; wBtn.style.width = "auto";
        wBtn.onclick = () => {
            if (isWaiting) {
                currentUser.waitingBooks = currentUser.waitingBooks.filter(id => id !== bookId);
                alert("Sıradan çıkıldı.");
            } else {
                currentUser.waitingBooks.push(bookId);
                alert("Sıraya girildi! Stok gelince bildirim alacaksınız.");
            }
            openBookDetail(bookId);
        };
        btnDiv.appendChild(wBtn);
    }
    showView('detail');
}

// 6. PROFİL VE KATEGORİ KAYDETME (İLK GİRİŞ)
document.getElementById("saveCategoriesBtn").onclick = () => {
    const selected = [...document.querySelectorAll("#initialCategoryList input:checked")].map(i => i.value);
    if (selected.length === 0) return alert("Seçim yapınız!");
    currentUser.categories = selected;
    renderBooks(null);
    showView('app');
    updateUserUI();
};

// 7. PROFİL GÜNCELLEME (HATA DÜZELTİLDİ: Sadece Alert verir)
document.getElementById("updateProfileBtn").onclick = () => {
    const selected = [...document.querySelectorAll("#p-categories-edit input:checked")].map(i => i.value);
    const newPass = document.getElementById("p-new-password").value;

    if (selected.length === 0) {
        alert("Lütfen en az bir ilgi alanı seçiniz!");
        return;
    }

    currentUser.categories = selected;
    if (newPass) currentUser.password = newPass;

    renderBooks(null); // Arka planda listeyi güncelle
    alert("İlgi alanlarınız güncellendi! Anasayfa listesi yenilendi.");
    document.getElementById("p-new-password").value = "";
};

// 8. ADMIN KİTAP EKLEME
document.getElementById("adminAddBookBtn").onclick = () => {
    const title = document.getElementById("adminBookTitle").value;
    const author = document.getElementById("adminBookAuthor").value;
    const stock = document.getElementById("adminBookStock").value;
    const cat = document.getElementById("adminBookCat").value;

    if (title && stock) {
        allBooks.push({
            id: Date.now(), title, author, category: cat, stock: parseInt(stock),
            img: "assets/logo.png", pages: 300, desc: "Yeni kitap"
        });
        alert("Eklendi.");
        renderBooks(null);
        document.getElementById("adminBookTitle").value = "";
    }
};

// 9. NAVİGASYON (HATA DÜZELTİLDİ: Anasayfa butonu aramayı temizler)
document.getElementById("navHomeBtn").onclick = () => {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";
    renderBooks(null);
    showView('app');
};

document.getElementById("closeDetailBtn").onclick = () => { renderBooks(null); showView('app'); };

document.getElementById("navProfileBtn").onclick = () => {
    showView('profile');
    renderProfileLists();
    updateUserUI(); // Checkboxları güncelle
};

document.getElementById("backHomeProfileBtn").onclick = () => {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";
    renderBooks(null);
    showView('app');
};

document.getElementById("logoutBtn").onclick = () => location.reload();

// Profil Tabları
document.querySelectorAll(".profile-menu .menu-btn[data-tab]").forEach(btn => {
    btn.onclick = (e) => {
        document.querySelectorAll(".tab-content").forEach(t => t.style.display = "none");
        document.querySelectorAll(".profile-menu .menu-btn").forEach(b => b.classList.remove("active"));
        const t = e.target.getAttribute("data-tab");
        document.getElementById(`tab-${t}`).style.display = "block";
        e.target.classList.add("active");
    };
});

function renderProfileLists() {
    // Favoriler
    const favDiv = document.getElementById("list-favorites");
    favDiv.innerHTML = "";
    if (currentUser.favorites.length === 0) favDiv.innerHTML = "<p>Favori yok.</p>";
    currentUser.favorites.forEach(fid => {
        const book = allBooks.find(b => b.id === fid);
        if (book) {
            favDiv.innerHTML += `
            <div onclick="openBookDetail(${book.id})" class="book-card" style="padding:10px; cursor:pointer;">
                <p>${book.title}</p> <small>Detay için tıkla ➡️</small>
            </div>`;
        }
    });

    // Ödünç
    const borDiv = document.getElementById("list-borrowed");
    borDiv.innerHTML = "";
    if (currentUser.borrowedBooks.length === 0) borDiv.innerHTML = "<p>Ödünç kitap yok.</p>";
    currentUser.borrowedBooks.forEach(bb => {
        borDiv.innerHTML += `
         <div onclick="openBookDetail(${bb.bookId})" class="book-card" style="padding:10px; cursor:pointer; border:1px solid #8d6e63;">
            <p>${bb.title}</p> <small>İade etmek için tıkla ↩️</small>
         </div>`;
    });

    // Beklenenler
    const waitDiv = document.getElementById("list-waiting");
    if (waitDiv) {
        waitDiv.innerHTML = "";
        if (!currentUser.waitingBooks || currentUser.waitingBooks.length === 0) {
            waitDiv.innerHTML = "<p>Sırada beklediğiniz kitap yok.</p>";
        } else {
            currentUser.waitingBooks.forEach(wid => {
                const book = allBooks.find(b => b.id === wid);
                if (book) {
                    waitDiv.innerHTML += `
                    <div onclick="openBookDetail(${book.id})" class="book-card" style="padding:10px; border:1px solid #ff9800; cursor:pointer;">
                        <p>${book.title}</p> <small style="color:#e65100">Sıradan çıkmak için tıkla ⏳</small>
                    </div>`;
                }
            });
        }
    }
}