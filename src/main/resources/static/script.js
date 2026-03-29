let currentUser = null;
const DEFAULT_COVER_COUNT = 6;
let allBooks = [];
let loadingTimer = null;
let stompClient = null;

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

// --- WEBSOCKET BAĞLANTISI ---
function connectWebSocket(userId) {
    if (stompClient && stompClient.connected) return;

    const socket = new SockJS('http://localhost:8080/ws');
    stompClient = Stomp.over(socket);
    stompClient.debug = null; 

    stompClient.connect({}, function (frame) {
        console.log('LibRA Canlı Bağlantı Hazır: ' + frame);

        stompClient.subscribe('/topic/user-' + userId, function (notification) {
            setTimeout(() => { syncUserAndRefresh(notification.body); }, 300);
        });

        stompClient.subscribe('/topic/books', function () {
            setTimeout(() => { initApp(true); }, 300);
        });

    }, function (error) {
        console.log('Bağlantı koptu, tekrar denenecek...');
        setTimeout(() => connectWebSocket(userId), 5000);
    });
}

// --- SAYFAYI YENİLEMEDEN VERİLERİ GÜNCELLEME ---
function syncUserAndRefresh(message) {
    const isSilent = !!message;
    if (!isSilent) toggleLoading(true);

    const pBorrowings = fetch(`http://localhost:8080/api/borrowings/user/${currentUser.id}`).then(res => res.json());
    const pWaitlist = fetch(`http://localhost:8080/api/waitlist/user/${currentUser.id}`).then(res => res.json());

    Promise.all([pBorrowings, pWaitlist])
        .then(([borrowings, waitlist]) => {
            const activeBorrowings = borrowings.filter(b => b.status === "BORROWED");
            currentUser.borrowedBooks = activeBorrowings.map(record => ({
                recordId: record.id,
                bookId: record.book.id,
                title: record.book.title
            }));

            currentUser.waitingList = waitlist.map(waitEntry => ({
                waitId: waitEntry.id,
                bookId: waitEntry.book.id,
                title: waitEntry.book.title
            }));

            updateUserUI();
            renderProfileLists();
            
            if (message) alert(message);

            initApp(isSilent); 
        })
        .catch(err => {
            toggleLoading(false);
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
            currentUser.password = p; 
            
            connectWebSocket(user.id);

            if (!currentUser.categories) currentUser.categories = [];
            if (!currentUser.borrowedBooks) currentUser.borrowedBooks = [];
            if (!currentUser.favorites) currentUser.favorites = [];
            if (!currentUser.waitingList) currentUser.waitingList = [];
            syncUserAndRefresh(); 
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
function initApp(silent = false) {
    if (currentUser.role === 'user' && (!currentUser.categories || currentUser.categories.length === 0)) {
        showView('category');
    } else {
        let url = 'http://localhost:8080/api/books/recommended';
        if (currentUser.categories && currentUser.categories.length > 0) {
            url += '?categories=' + currentUser.categories.join(',');
        }

        if (!silent) toggleLoading(true);

        fetch(url)
            .then(res => res.json())
            .then(data => {
                allBooks = data;
                renderBooks(allBooks);
                
                if (views.bookDetail.style.display === "block") {
                    const currentBookId = document.getElementById("d-buttons").getAttribute("data-current-book");
                    if (currentBookId) {
                        refreshBookDetailUI(parseInt(currentBookId));
                    }
                } else if (!silent) {
                    showView('app');
                }

                if (!silent) toggleLoading(false);
                updateUserUI();
                renderProfileLists();
            })
            .catch(err => {
                if (!silent) toggleLoading(false);
                console.error("Kitaplar yüklenemedi:", err);
            });
    }
}

function refreshBookDetailUI(bookId) {
    fetch(`http://localhost:8080/api/books/${bookId}`)
        .then(res => res.json())
        .then(freshBook => {
            const stockVal = (freshBook.stockCount !== undefined) ? freshBook.stockCount : 
                             (freshBook.stock !== undefined) ? freshBook.stock : 0;
            
            freshBook.stockCount = stockVal; 
            document.getElementById("d-stock-count").textContent = stockVal;
            renderActionButtons(freshBook);
        })
        .catch(err => console.error("Detay tazeleme hatası:", err));
}

// --- ARAMA MOTORU ---
const searchInput = document.getElementById("searchInput");
const searchBtn = document.querySelector(".search-btn");
const searchFilter = document.getElementById("searchFilter");

function performSearch() {
    const term = searchInput.value.trim();
    // Not: filterValue'yu backend API yapına göre search url'ine ekleyebilirsin.
    // Şimdilik sistemini bozmamak adına orijinal keyword parametreni kullanıyoruz.
    // Örn: fetch(`http://localhost:8080/api/books/search?type=${filterValue}&keyword=${term}`)
    const filterValue = searchFilter.value; 

    if (term === "") {
        initApp(); 
        showView('app'); 
    } else {
        fetch(`http://localhost:8080/api/books/search?keyword=${term}`)
            .then(res => {
                if (!res.ok) throw new Error("Sunucu hatası: " + res.status);
                return res.json();
            })
            .then(data => {
                allBooks = data;
                renderBooks(allBooks);
                showView('app'); 
            })
            .catch(err => console.error("Arama hatası:", err));
    }
}

if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", performSearch);
    searchInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            performSearch();
        }
    });
}

function updateUserUI() {
    const adminTabBtn = document.getElementById("adminTabBtn");
    const roleValue = (currentUser.role || currentUser.roleName || "").toLowerCase();

    if (roleValue === 'admin') {
        adminTabBtn.style.display = "block";
    } else {
        adminTabBtn.style.display = "none";
    }

    const namePart = currentUser.username.split('@')[0];
    document.getElementById("profileName").textContent = namePart;

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
    const coverNum = (bookId % DEFAULT_COVER_COUNT) + 1;
    return `assets/default${coverNum}.png`;
}

function renderBooks(customList = null) {
    const container = document.getElementById("books");
    container.innerHTML = "";

    let listToDisplay = customList || allBooks;

    if (listToDisplay.length === 0) {
        container.innerHTML = `<p style="text-align:center; width:100%; color:#888;">Kitap bulunamadı.</p>`;
        return;
    }

    listToDisplay.forEach(book => {
        const stock = (book.stockCount !== undefined) ? book.stockCount : (book.stock || 0);
        const isOut = stock < 1; 
        const div = document.createElement("div");
        div.className = `book-card ${isOut ? 'out-of-stock-card' : ''}`;

        const fallbackImg = getDefaultCover(book.id);
        const imgSrc = book.coverUrl ? book.coverUrl : fallbackImg;

        div.innerHTML = `
            <div style="cursor:pointer">
                <img src="${imgSrc}" onerror="this.onerror=null; this.src='${fallbackImg}';">
                <span class="category-tag">${book.category || 'Genel'}</span>
                <h4 class="book-title" style="margin:5px 0;">${book.title}</h4>
                <small class="book-author">${book.author}</small>
                <div style="margin:8px 0;">
                    <span class="badge-stock ${isOut ? 'out' : ''}">
                        ${isOut ? 'Tükendi - Sıraya Gir' : 'Stok: ' + stock}
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
    detailImg.onerror = function () { this.src = fallbackImg; };
    
    document.getElementById("d-title").textContent = book.title;
    document.getElementById("d-author").textContent = book.author;
    
    const stock = (book.stockCount !== undefined) ? book.stockCount : (book.stock || 0);
    document.getElementById("d-stock-count").textContent = stock;
    
    document.getElementById("d-buttons").setAttribute("data-current-book", book.id);

    renderActionButtons(book); 
    showView('detail');
}

// --- YENİ: BUTONLARI MERKEZİ OLARAK GÖRÜNÜR KILAN FONKSİYON (HTML DOM KULLANIR) ---
function renderActionButtons(book) {
    const isFavorite = currentUser.favorites && currentUser.favorites.includes(book.id);
    const borrowedRecord = currentUser.borrowedBooks?.find(b => Number(b.bookId) === Number(book.id));
    const isBorrowed = !!borrowedRecord;
    const isWaiting = currentUser.waitingList?.some(w => Number(w.bookId) === Number(book.id));
    const stock = (book.stockCount !== undefined) ? book.stockCount : (book.stock || 0);
    const isOut = stock < 1;

    // HTML'deki Butonları Yakala
    const btnReturn = document.getElementById("btn-return");
    const btnWaitlist = document.getElementById("btn-waitlist");
    const btnWaitingStatus = document.getElementById("btn-waiting-status");
    const btnBorrow = document.getElementById("btn-borrow");
    const btnFavorite = document.getElementById("btn-favorite");
    const adminDiv = document.getElementById("admin-actions-div");

    // Temiz Başlangıç: Önce hepsini gizle
    btnReturn.style.display = "none";
    btnWaitlist.style.display = "none";
    btnWaitingStatus.style.display = "none";
    btnBorrow.style.display = "none";
    adminDiv.style.display = "none";

    // Duruma Göre Göster ve İşlev Ata
    if (isBorrowed) {
        btnReturn.style.display = "block";
        btnReturn.onclick = () => handleReturnAction(borrowedRecord.recordId);
    } else if (isOut) {
        if (isWaiting) {
            btnWaitingStatus.style.display = "block";
        } else {
            btnWaitlist.style.display = "block";
            btnWaitlist.onclick = () => handleBorrowAction(book.id);
        }
    } else {
        btnBorrow.style.display = "block";
        btnBorrow.onclick = () => handleBorrowAction(book.id);
    }

    // Favori Butonu
    btnFavorite.style.display = "block";
    btnFavorite.textContent = isFavorite ? "❤️ Favorilerden Çıkar" : "🤍 Favorilere Ekle";
    btnFavorite.style.background = isFavorite ? "#d32f2f" : "#9e9e9e";
    btnFavorite.style.color = "white";
    btnFavorite.onclick = () => {
        fetch(`http://localhost:8080/api/users/${currentUser.id}/favorite/${book.id}`, { method: 'POST' })
            .then(res => { if (res.ok) syncUserAndRefresh(); });
    };

    // Admin Kontrolü
    if (currentUser.role === 'admin') {
        adminDiv.style.display = "block";
        document.getElementById("coverUrlInput").value = book.coverUrl || '';

        document.getElementById("saveCoverBtn").onclick = () => {
            const newUrl = document.getElementById("coverUrlInput").value.trim();
            fetch(`http://localhost:8080/api/books/${book.id}/cover`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coverUrl: newUrl })
            }).then(() => initApp());
        };

        document.getElementById("btn-delete-book").onclick = () => {
            if(confirm(`"${book.title}" adlı kitabı tamamen silmek istediğinize emin misiniz?`)) {
                fetch(`http://localhost:8080/api/books/${book.id}`, { method: 'DELETE' })
                .then(res => {
                    if(res.ok) {
                        alert("Kitap başarıyla silindi.");
                        showView('app');
                        initApp();
                    } else {
                        alert("Kitap silinirken hata oluştu.");
                    }
                })
                .catch(err => console.error("Silme hatası:", err));
            }
        };
    }
}

// --- MERKEZİ İŞLEM FONKSİYONLARI ---
function handleBorrowAction(bookId) {
    fetch(`http://localhost:8080/api/borrowings/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, bookId: bookId })
    })
    .then(res => res.json())
    .then(data => {
        syncUserAndRefresh(data.message || "İşlem başarılı!");
    });
}

function handleReturnAction(recordId) {
    fetch(`http://localhost:8080/api/borrowings/return/${recordId}`, { method: 'POST' })
    .then(res => { if (res.ok) syncUserAndRefresh("Kitap iade edildi."); });
}

// 6. İLK KAYITTA KATEGORİ KAYDETME
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
        .catch(() => toggleLoading(false));
};

// 7. PROFİL GÜNCELLEME
document.getElementById("updateProfileBtn").onclick = () => {
    const selected = [...document.querySelectorAll("#p-categories-edit input:checked")].map(i => i.value);
    const newPass = document.getElementById("p-new-password").value;

    if (selected.length === 0) return alert("Lütfen alan seçiniz!");

    toggleLoading(true);
    fetch(`http://localhost:8080/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: selected, password: newPass })
    })
        .then(res => res.json())
        .then(() => {
            if (newPass && newPass.trim() !== "") currentUser.password = newPass;
            syncUserAndRefresh("Profil güncellendi!");
            document.getElementById("p-new-password").value = "";
        })
        .catch(() => toggleLoading(false));
};

// 8. ADMIN KİTAP EKLEME
document.getElementById("adminAddBookBtn").onclick = () => {
    const title = document.getElementById("adminBookTitle").value.trim();
    const author = document.getElementById("adminBookAuthor").value.trim();
    const stock = parseInt(document.getElementById("adminBookStock").value);
    const cat = document.getElementById("adminBookCat").value;
    const coverUrl = document.getElementById("adminBookCover").value.trim();

    if (!title || !author || isNaN(stock)) return alert("Tüm alanları doldurun!");

    const newBook = { title, author, category: cat, stockCount: stock, coverUrl, likeCount: 0 };

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

document.getElementById("navHomeBtn").onclick = () => {
    if (searchInput) searchInput.value = "";
    showView('app');
    initApp();
};

document.getElementById("closeDetailBtn").onclick = () => showView('app');

document.getElementById("navProfileBtn").onclick = () => {
    showView('profile');
    renderProfileLists();
    updateUserUI();
};

document.getElementById("backHomeProfileBtn").onclick = () => {
    if (searchInput) searchInput.value = "";
    showView('app');
    initApp();
};

document.getElementById("logoutBtn").onclick = () => {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    location.reload();
};

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
    const favDiv = document.getElementById("list-favorites");
    if (!favDiv) return;
    favDiv.innerHTML = "";
    if (!currentUser.favorites || currentUser.favorites.length === 0) {
        favDiv.innerHTML = "<p>Favori bulunmuyor.</p>";
    } else {
        currentUser.favorites.forEach(fid => {
            const book = allBooks.find(b => b.id === fid);
            if (book) {
                favDiv.innerHTML += `
                <div onclick="openBookDetail(${book.id})" class="book-card" style="padding:10px; cursor:pointer;">
                    <p style="font-weight:bold; color:#333;">${book.title}</p> <small>Detay için tıkla ➡️</small>
                </div>`;
            }
        });
    }

    const borDiv = document.getElementById("list-borrowed");
    if (!borDiv) return;
    borDiv.innerHTML = "";
    if (!currentUser.borrowedBooks || currentUser.borrowedBooks.length === 0) {
        borDiv.innerHTML = "<p>Ödünç alınan kitap yok.</p>";
    } else {
        currentUser.borrowedBooks.forEach(bb => {
            borDiv.innerHTML += `
             <div onclick="openBookDetail(${bb.bookId})" class="book-card" style="padding:10px; cursor:pointer; border:1px solid #8d6e63; background:#efebe9;">
                <p style="font-weight:bold; color:#4e342e;">${bb.title}</p> <small style="color:#d32f2f;">İade Et ↩️</small>
             </div>`;
        });
    }

    const waitDiv = document.getElementById("list-waiting");
    if (waitDiv) {
        waitDiv.innerHTML = "";
        if (!currentUser.waitingList || currentUser.waitingList.length === 0) {
            waitDiv.innerHTML = "<p>Sırada beklediğiniz kitap yok.</p>";
        } else {
            currentUser.waitingList.forEach(w => {
                waitDiv.innerHTML += `
                <div onclick="openBookDetail(${w.bookId})" class="book-card" style="padding:10px; border:1px solid #ffa000; cursor:pointer; background:#fff3e0;">
                    <p style="font-weight:bold; color:#e65100;">⏳ ${w.title}</p> <small>Sıradaki Yeriniz Korunuyor</small>
                </div>`;
            });
        }
    }
}