/* =========================================
   TEK PARÇA SCRIPT (Unified - Clean Version)
   ========================================= */

// --- VERİTABANI (MOCK DATA) ---
/*
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
*/

// --- GLOBAL DEĞİŞKENLER ---
let currentUser = null;

const DEFAULT_COVER_COUNT = 7;
//let allBooks = [...DB.books];
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
// 1. GİRİŞ YAP (Gerçek API Bağlantısı)
document.getElementById("loginBtn").onclick = function () {
    const u = document.getElementById("loginUsername").value;
    const p = document.getElementById("loginPassword").value;

    toggleLoading(true);

    fetch('http://localhost:8080/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }) // Veriyi JSON'a çevirip Java'ya yolluyoruz
    })
        .then(response => {
            toggleLoading(false);
            if (response.ok) return response.json();
            throw new Error("Hatalı kullanıcı adı veya şifre!");
        })
        .then(user => {
            currentUser = user;
            currentUser.categories = []; // Şimdilik boş dizi atayalım, ileride DB'den çekeceğiz
            currentUser.borrowedBooks = [];
            currentUser.favorites = [];
            currentUser.waitingBooks = [];
            initApp(); // Arayüzü başlat
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

// 3. UYGULAMAYI BAŞLAT (Backend Bağlantılı)
function initApp() {
    // Eğer kullanıcıysa ve henüz kategori seçmediyse kategori ekranına yolla
    if (currentUser.role === 'user' && (!currentUser.categories || currentUser.categories.length === 0)) {
        showView('category');
    } else {
        // Seçilen kategorileri virgülle ayırarak backend'e gönder
        let url = 'http://localhost:8080/api/books/recommended';
        if (currentUser.categories && currentUser.categories.length > 0) {
            url += '?categories=' + currentUser.categories.join(',');
        }

        toggleLoading(true);

        // Backend'e İstek At
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
if (searchInput) {
    searchInput.addEventListener("input", function (e) {
        const term = e.target.value.trim();

        if (term === "") {
            initApp(); // Arama çubuğu silinirse varsayılan listeye dön
        } else {
            // DİKKAT: Parametre adı 'keyword' olarak sabitlendi
            fetch(`http://localhost:8080/api/books/search?keyword=${term}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error("Sunucu hatası: " + res.status);
                    }
                    return res.json();
                })
                .then(data => {
                    allBooks = data; // Gelen veriyi global listeye kaydet
                    renderBooks(allBooks); // Ekrana çiz
                })
                .catch(err => {
                    console.error("Arama hatası:", err);
                });
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

// 4. KİTAPLARI LİSTELE

// Rastgele kitap kapağı görüntülemek için yardımcı fonksiyon
function getDefaultCover(bookId) {
    const randInt = Math.floor(Math.random() * DEFAULT_COVER_COUNT * 100);
    const coverNum = (bookId % DEFAULT_COVER_COUNT) + 1;
    return `assets/default${coverNum}.png`;
}

function renderBooks(customList = null) {
    const container = document.getElementById("books");
    container.innerHTML = ""; // Önceki kitapları temizle

    let listToDisplay;

    // 1. Hangi listenin gösterileceğine karar ver (Arama mı, İlgi alanı mı?)
    if (customList !== null) {
        listToDisplay = customList;
    } else {
        if (currentUser && currentUser.categories && currentUser.categories.length > 0) {
            // Sadece kullanıcının ilgi alanlarına uyanları filtrele
            listToDisplay = allBooks.filter(book =>
                currentUser.categories.includes(book.category)
            );
        } else {
            listToDisplay = allBooks;
        }
    }

    // 2. Liste boşsa kullanıcıya bilgi ver
    if (listToDisplay.length === 0) {
        container.innerHTML = `<p style="text-align:center; width:100%; color:#888;">Bu kriterlere uygun kitap bulunamadı.</p>`;
        return;
    }

    // Kitapları Rastgele sırala
    listToDisplay.sort((book1, book2) => {
        if (book1.coverUrl && !book2.coverUrl) {
            return -1
        }
        if (!book1.coverUrl && book2.coverUrl) {
            return 1
        }
        return Math.random() - 0.5
    });

    // 3. Kitapları ekrana çiz
    listToDisplay.forEach(book => {
        const isOut = book.stock < 1;
        const div = document.createElement("div");
        div.className = `book-card ${isOut ? 'out-of-stock-card' : ''}`;

        // Kapak resmi kontrolü: Veritabanında URL var mı? Yoksa varsayılanı (default) getir.
        const fallbackImg = getDefaultCover(book.id);
        const imgSrc = book.coverUrl ? book.coverUrl : fallbackImg;

        div.innerHTML = `
            <div style="cursor:pointer">
                <img src="${imgSrc}" onerror="this.onerror=null; this.src='${fallbackImg}';">
                <span class="category-tag">${book.category}</span>
                <h4 class="book-title" style="margin:5px 0;">${book.title}</h4>
                <small class="book-author">${book.author}</small>
                <div style="margin:8px 0;">
                    <span class="badge-stock ${isOut ? 'out' : ''}">
                        ${isOut ? 'Tükendi' : 'Stok: ' + book.stock}
                    </span>
                </div>
            </div>`;

        // Karta tıklanınca detay sayfasını aç
        div.querySelector("div").onclick = () => openBookDetail(book.id);

        // Kartı sayfaya (container içine) ekle
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
    detailImg.onerror = function () {
        this.onerror = null;
        this.src = fallbackImg;
    };

    // 2. Metin Atamaları
    document.getElementById("d-title").textContent = book.title;
    document.getElementById("d-author").textContent = book.author;
    document.getElementById("d-desc").textContent = book.desc || "Açıklama bulunmuyor.";
    document.getElementById("d-page").textContent = book.pages || 0;
    document.getElementById("d-stock-count").textContent = book.stock;

    // 3. Butonlar
    const btnDiv = document.getElementById("d-buttons");
    btnDiv.innerHTML = "";

    if (currentUser.role === 'admin') {
        const coverDiv = document.createElement("div");
        coverDiv.style.marginBottom = "20px";
        coverDiv.style.display = "flex";
        coverDiv.style.gap = "10px";

        coverDiv.innerHTML = `
            <input type="text" id="coverUrlInput" placeholder="İnternetten Resim URL'si girin..." value="${book.coverUrl || ''}" style="margin:0; flex:1;">
            <button id="saveCoverBtn" style="background:#1976d2; width:auto; padding:0 15px;">Kapağı Kaydet</button>
        `;
        btnDiv.appendChild(coverDiv);

        // Kapağı Kaydetme İşlemi
        document.getElementById("saveCoverBtn").onclick = () => {
            const newUrl = document.getElementById("coverUrlInput").value.trim();

            fetch(`http://localhost:8080/api/books/${book.id}/cover`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coverUrl: newUrl })
            })
                .then(res => {
                    if (!res.ok) throw new Error("Sunucu hatası");
                    return res.json();
                })
                .then(updatedBook => {
                    alert("Kapak URL'si başarıyla güncellendi!");
                    book.coverUrl = updatedBook.coverUrl;
                    openBookDetail(book.id);
                })
                .catch(err => alert("Kapak güncellenirken hata oluştu."));
        };

        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️ Kitabı Sil (Admin)";
        delBtn.style.background = "#d32f2f";
        delBtn.style.marginBottom = "15px";

        delBtn.onclick = () => {
            if (confirm(`"${book.title}" adlı kitabı veritabanından tamamen silmek istediğinize emin misiniz?`)) {

                fetch(`http://localhost:8080/api/books/${book.id}`, {
                    method: 'DELETE'
                })
                    .then(res => {
                        if (res.ok) {
                            alert("Kitap sistemden silindi.");
                            initApp();
                        } else {
                            throw new Error("Silme başarısız.");
                        }
                    })
                    .catch(err => alert("Kitap silinirken bir hata oluştu."));
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

    initApp();
    alert("İlgi alanlarınız güncellendi! Anasayfa listesi yenilendi.");
    document.getElementById("p-new-password").value = "";
};

// 8. ADMIN KİTAP EKLEME
// 8. ADMIN YENİ KİTAP EKLEME (Gerçek DB Bağlantısı)
document.getElementById("adminAddBookBtn").onclick = () => {
    const title = document.getElementById("adminBookTitle").value.trim();
    const author = document.getElementById("adminBookAuthor").value.trim();
    const stock = document.getElementById("adminBookStock").value;
    const cat = document.getElementById("adminBookCat").value;
    const coverUrl = document.getElementById("adminBookCover").value.trim(); // Yeni alan

    if (!title || !stock) {
        alert("Lütfen Kitap Adı ve Stok Adedi alanlarını doldurun!");
        return;
    }

    const newBook = {
        title: title,
        author: author,
        category: cat,
        stock: parseInt(stock),
        coverUrl: coverUrl !== "" ? coverUrl : null, // Boşsa null gönder, Java/JS varsayılanı halletsin
        likeSayisi: 0
    };

    fetch('http://localhost:8080/api/books/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
    })
        .then(res => res.json())
        .then(savedBook => {
            alert("Kitap veritabanına başarıyla eklendi!");
            // Inputları temizle
            document.getElementById("adminBookTitle").value = "";
            document.getElementById("adminBookAuthor").value = "";
            document.getElementById("adminBookStock").value = "";
            document.getElementById("adminBookCover").value = "";
            // Listeyi yenilemek için initApp'i çağır
            initApp();
        })
        .catch(err => alert("Kitap eklenirken hata oluştu."));
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