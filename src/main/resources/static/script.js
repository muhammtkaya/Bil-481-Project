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

// --- SAYFAYI YENİLEMEDEN VERİLERİ GÜNCELLEME ---
function syncUserAndRefresh(message) {
    toggleLoading(true);

    fetch('http://localhost:8080/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, password: currentUser.password })
    })
        .then(res => {
            if (!res.ok) throw new Error("Kullanıcı doğrulaması başarısız.");
            return res.json();
        })
        .then(user => {
            const currentPass = currentUser.password;
            currentUser = user;
            currentUser.password = currentPass;

            // Ödünç alma kayıtlarını getir
            return fetch(`http://localhost:8080/api/borrowings/user/${currentUser.id}`);
        })
        .then(res => {
            if (!res.ok) throw new Error("Ödünç alma kayıtları sunucudan çekilemedi. (Backend hatası)");
            return res.json();
        })
        .then(borrowings => {
            // Sadece "BORROWED" durumunda olan (aktif) kayıtları al
            const activeBorrowings = borrowings.filter(b => b.status === "BORROWED");

            currentUser.borrowedBooks = activeBorrowings.map(record => ({
                recordId: record.id,
                bookId: record.book.id,
                title: record.book.title
            }));

            // İşlem başarılıysa mesajı göster
            if (message) alert(message);

            // Ekranı ve profil sayfalarını tazele
            initApp();
        })
        .catch(err => {
            toggleLoading(false);
            alert("İşlem sırasında bir sorun oluştu:\n" + err.message);
            console.error("Senkronizasyon hatası:", err);
        });
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
            currentUser.password = p; // Şifreyi hafızada tut (Sync için lazım)
            // Eğer listeler null gelirse boş dizi yap
            if (!currentUser.categories) currentUser.categories = [];
            if (!currentUser.borrowedBooks) currentUser.borrowedBooks = [];
            if (!currentUser.favorites) currentUser.favorites = [];
            if (!currentUser.waitingBooks) currentUser.waitingBooks = [];
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
                // Eğer detay sayfasındaysak listeye dönmemesi için kontrol
                if (views.bookDetail.style.display !== "block") {
                    showView('app');
                } else {
                    // Detay sayfasındayken kitap güncellendiyse (ödünç alma vb.) ekranı tazele
                    const currentBookId = document.getElementById("d-buttons").getAttribute("data-current-book");
                    if (currentBookId) openBookDetail(parseInt(currentBookId));
                }
                updateUserUI();
                renderProfileLists(); // Profil listelerini de arka planda tazele
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
            initApp();
        } else {
            fetch(`http://localhost:8080/api/books/search?keyword=${term}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error("Sunucu hatası: " + res.status);
                    }
                    return res.json();
                })
                .then(data => {
                    allBooks = data;
                    renderBooks(allBooks);
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

    // 1. İsmi yazdır
    const namePart = currentUser.username.split('@')[0];
    document.getElementById("profileName").textContent = namePart;

    // 2. Avatar harflerini hesapla
    let initials = "";
    const nameArray = namePart.split('.');
    if (nameArray.length > 1) {
        initials = (nameArray[0][0] + nameArray[1][0]).toUpperCase();
    } else {
        initials = namePart.substring(0, 2).toUpperCase();
    }
    document.getElementById("profileAvatar").textContent = initials;

    document.getElementById("p-username-input").value = currentUser.username;

    document.querySelectorAll("#p-categories-edit input").forEach(cb => {
        cb.checked = currentUser.categories.includes(cb.value);
    });
}

// 4. KİTAPLARI LİSTELE
function getDefaultCover(bookId) {
    const randInt = Math.floor(Math.random() * DEFAULT_COVER_COUNT * 100);
    const coverNum = (bookId % DEFAULT_COVER_COUNT) + 1;
    return `assets/default${coverNum}.png`;
}

function renderBooks(customList = null) {
    const container = document.getElementById("books");
    container.innerHTML = "";

    let listToDisplay;

    if (customList !== null) {
        listToDisplay = customList;
    } else {
        if (currentUser && currentUser.categories && currentUser.categories.length > 0) {
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

    listToDisplay.sort((book1, book2) => {
        if (book1.coverUrl && !book2.coverUrl) return -1
        if (!book1.coverUrl && book2.coverUrl) return 1
        return Math.random() - 0.5
    });

    listToDisplay.forEach(book => {
        const isOut = book.stockCount < 1;
        const div = document.createElement("div");
        div.className = `book-card ${isOut ? 'out-of-stock-card' : ''}`;

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
                        ${isOut ? 'Tükendi' : 'Stok: ' + book.stockCount}
                    </span>
                </div>
            </div>`;

        div.querySelector("div").onclick = () => openBookDetail(book.id);
        container.appendChild(div);
    });
}

// 5. KİTAP DETAYI VE BUTONLAR (TAMAMEN API'YE BAĞLI)
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

    document.getElementById("d-title").textContent = book.title;
    document.getElementById("d-author").textContent = book.author;
    document.getElementById("d-stock-count").textContent = book.stockCount;

    const btnDiv = document.getElementById("d-buttons");
    btnDiv.innerHTML = "";
    btnDiv.setAttribute("data-current-book", book.id); // Yenileme sırasında hangi kitapta olduğumuzu bilmek için

    // --- KULLANICI BUTONLARI ---
    const isFavorite = currentUser.favorites && currentUser.favorites.includes(book.id);
    const borrowedRecord = currentUser.borrowedBooks?.find(b => b.bookId === book.id);
    const isBorrowed = !!borrowedRecord; // borrowedRecord doluysa true, yoksa false
    const isWaiting = currentUser.waitingBooks && currentUser.waitingBooks.includes(book.id);
    const isOut = book.stockCount < 1;

    const actionBtn = document.createElement("button");
    actionBtn.style.marginBottom = "10px";

    if (isBorrowed) {
        actionBtn.textContent = "↩️ İade Et";
        actionBtn.style.background = "#8d6e63";
        actionBtn.onclick = () => {
            // YENİ İADE ENDPOINT'İ (Kitap ID yerine Record ID gönderiyoruz)
            fetch(`http://localhost:8080/api/borrowings/return/${borrowedRecord.recordId}`, {
                method: 'POST'
            })
                .then(res => {
                    if (res.ok) syncUserAndRefresh("Kitap başarıyla iade edildi.");
                    else alert("İade başarısız.");
                });
        };
    } else if (isOut) {
        if (isWaiting) {
            actionBtn.textContent = "⏳ Sıradasınız (Çıkış Yap)";
            actionBtn.style.background = "#ff9800";
            actionBtn.onclick = () => {
                fetch(`http://localhost:8080/api/users/${currentUser.id}/waitlist/${book.id}`, { method: 'POST' })
                    .then(res => { if (res.ok) syncUserAndRefresh("Sıradan çıkıldı."); });
            };
        } else {
            actionBtn.textContent = "📝 Sıraya Gir (Stok Yok)";
            actionBtn.style.background = "#e65100";
            actionBtn.onclick = () => {
                fetch(`http://localhost:8080/api/users/${currentUser.id}/waitlist/${book.id}`, { method: 'POST' })
                    .then(res => { if (res.ok) syncUserAndRefresh("Sıraya girildi! Stok gelince bilgilendirileceksiniz."); });
            };
        }
    } else {
        actionBtn.textContent = "📖 Ödünç Al";
        actionBtn.style.background = "#4caf50";
        actionBtn.onclick = () => {
            // YENİ ÖDÜNÇ ALMA ENDPOINT'İ (URL yerine JSON Body ile yolluyoruz)
            fetch(`http://localhost:8080/api/borrowings/borrow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, bookId: book.id })
            })
                .then(res => {
                    if (res.ok) syncUserAndRefresh("Kitap başarıyla ödünç alındı!");
                    else res.text().then(t => alert(t));
                });
        };
    }

    const favBtn = document.createElement("button");
    favBtn.textContent = isFavorite ? "❤️ Favorilerden Çıkar" : "🤍 Favorilere Ekle";
    favBtn.style.background = isFavorite ? "#d32f2f" : "#9e9e9e";
    favBtn.style.marginBottom = "20px";
    favBtn.onclick = () => {
        fetch(`http://localhost:8080/api/users/${currentUser.id}/favorite/${book.id}`, { method: 'POST' })
            .then(res => { if (res.ok) syncUserAndRefresh("Favoriler güncellendi!"); else alert("Favori işlemi başarısız."); });
    };

    btnDiv.appendChild(actionBtn);
    btnDiv.appendChild(favBtn);

    // --- ADMİN BUTONLARI ---
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
                    initApp(); // Sayfayı tazelemek için initApp çağırıyoruz
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
                            document.getElementById("closeDetailBtn").click(); // Listeye dön
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

// 6. İLK KAYITTA KATEGORİ KAYDETME (API BAĞLI)
document.getElementById("saveCategoriesBtn").onclick = () => {

    const selected = [...document.querySelectorAll("#initialCategoryList input:checked")].map(i => i.value);
    if (selected.length === 0) return alert("Seçim yapınız!");

    toggleLoading(true);
    fetch(`http://localhost:8080/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: selected })
    })
        .then(res => res.json())
        .then(updatedUser => {
            currentUser.categories = updatedUser.categories;
            initApp();
        })
        .catch(err => {
            toggleLoading(false);
            alert("Kategoriler kaydedilirken hata oluştu!");
        });
    initApp();
};

// 7. PROFİL GÜNCELLEME (API BAĞLI)
document.getElementById("updateProfileBtn").onclick = () => {
    const selected = [...document.querySelectorAll("#p-categories-edit input:checked")].map(i => i.value);
    const newPass = document.getElementById("p-new-password").value;

    if (selected.length === 0) {
        alert("Lütfen en az bir ilgi alanı seçiniz!");
        return;
    }

    toggleLoading(true);
    fetch(`http://localhost:8080/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: selected, password: newPass })
    })
        .then(res => {
            if (!res.ok) throw new Error("Güncelleme başarısız!");
            return res.json();
        })
        .then(updatedUser => {
            // Şifre değiştiyse JS hafızasındakini de güncelle
            if (newPass && newPass.trim() !== "") {
                currentUser.password = newPass;
            }
            syncUserAndRefresh("Profiliniz başarıyla güncellendi!");
            document.getElementById("p-new-password").value = "";
        })
        .catch(err => {
            toggleLoading(false);
            alert(err.message);
        });
};

// 8. ADMIN KİTAP EKLEME (GÜNCELLENMİŞ)
document.getElementById("adminAddBookBtn").onclick = () => {
    const title = document.getElementById("adminBookTitle").value.trim();
    const author = document.getElementById("adminBookAuthor").value.trim();
    const stock = document.getElementById("adminBookStock").value;
    const cat = document.getElementById("adminBookCat").value;
    const coverUrl = document.getElementById("adminBookCover").value.trim();

    // 1. Boş Satır Kontrolü
    if (!title || !author || !stock || !cat || !coverUrl) {
        alert("Lütfen tüm alanları doldurunuz! (Kapak URL dahil)");
        return;
    }

    // 2. Karakter Sınırı Kontrolü (50 Karakter)
    if (title.length > 50) {
        alert("Kitap adı 50 karakterden uzun olamaz!");
        return;
    }
    if (author.length > 50) {
        alert("Yazar adı 50 karakterden uzun olamaz!");
        return;
    }

    // 3. Negatif Stok Kontrolü
    const stockInt = parseInt(stock);
    if (isNaN(stockInt) || stockInt < 0) {
        alert("Stok adedi negatif olamaz!");
        return;
    }

    const newBook = {
        title: title,
        author: author,
        category: cat,
        stockCount: stockInt,
        coverUrl: coverUrl,
        likeCount: 0
    };

    fetch('http://localhost:8080/api/books/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
    })
        .then(res => res.json())
        .then(savedBook => {
            alert("Kitap veritabanına başarıyla eklendi!");
            // Formu temizle
            document.getElementById("adminBookTitle").value = "";
            document.getElementById("adminBookAuthor").value = "";
            document.getElementById("adminBookStock").value = "";
            document.getElementById("adminBookCover").value = "";
            initApp();
        })
        .catch(err => alert("Kitap eklenirken hata oluştu."));
};


document.getElementById("navHomeBtn").onclick = () => {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = ""; // Arama kutusunu temizle
    showView('app'); // Uygulama ana görünümünü göster
    initApp(); // Kitapları ve önerileri tazeleyerek getir
};

document.getElementById("closeDetailBtn").onclick = () => {
    showView('app');
};

document.getElementById("navProfileBtn").onclick = () => {
    showView('profile');
    renderProfileLists();
    updateUserUI();
};

document.getElementById("backHomeProfileBtn").onclick = () => {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";
    showView('app');
    initApp();
};

document.getElementById("logoutBtn").onclick = () => location.reload();

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
    if (!currentUser.favorites || currentUser.favorites.length === 0) {
        favDiv.innerHTML = "<p>Favori kitabınız bulunmuyor.</p>";
    } else {
        currentUser.favorites.forEach(fid => {
            const book = allBooks.find(b => b.id === fid);
            if (book) {
                favDiv.innerHTML += `
                <div onclick="openBookDetail(${book.id})" class="book-card" style="padding:10px; cursor:pointer;">
                    <p style="font-weight:bold; color:#333;">${book.title}</p> <small style="color:#666;">Detay için tıkla ➡️</small>
                </div>`;
            }
        });
    }

    // Ödünç Aldıklarım (renderProfileLists fonksiyonu içindeki kısım)
    const borDiv = document.getElementById("list-borrowed");
    borDiv.innerHTML = "";
    if (!currentUser.borrowedBooks || currentUser.borrowedBooks.length === 0) {
        borDiv.innerHTML = "<p>Ödünç aldığınız kitap yok.</p>";
    } else {
        currentUser.borrowedBooks.forEach(bb => {
            borDiv.innerHTML += `
             <div onclick="openBookDetail(${bb.bookId})" class="book-card" style="padding:10px; cursor:pointer; border:1px solid #8d6e63; background:#efebe9;">
                <p style="font-weight:bold; color:#4e342e;">${bb.title}</p> <small style="color:#d32f2f;">Detaylara git ve İade Et ↩️</small>
             </div>`;
        });
    }

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
                    <div onclick="openBookDetail(${book.id})" class="book-card" style="padding:10px; border:1px solid #ff9800; cursor:pointer; background:#fff3e0;">
                        <p style="font-weight:bold; color:#e65100;">${book.title}</p> <small style="color:#d84315;">Sıradan çıkmak için tıkla ⏳</small>
                    </div>`;
                }
            });
        }
    }
}