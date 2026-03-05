-- Veritabanını oluşturma ve kullanma
CREATE DATABASE IF NOT EXISTS libra_db;
USE libra_db;

-- Roller Tablosu
CREATE TABLE roller (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- Kullanıcılar Tablosu
CREATE TABLE kullanicilar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roller(id) ON DELETE CASCADE
);

-- Kategoriler Tablosu
CREATE TABLE kategoriler (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
);

-- Kitaplar Tablosu
CREATE TABLE kitaplar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category_id INT,
    stock_sayisi INT DEFAULT 0,
    like_sayisi INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES kategoriler(id) ON DELETE SET NULL
);

-- Kullanıcıların tercih ettiği kategoriler
CREATE TABLE user_preferred_kategoriler (
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (user_id, category_id),
    FOREIGN KEY (user_id) REFERENCES kullanicilar(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES kategoriler(id) ON DELETE CASCADE
);

-- Kullanıcıların beğendiği kitaplar
CREATE TABLE liked_kitaplar (
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    PRIMARY KEY (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES kullanicilar(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES kitaplar(id) ON DELETE CASCADE
);

-- Bekleme kuyruğundaki kitaplar
CREATE TABLE waitlisted_kitaplar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES kullanicilar(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES kitaplar(id) ON DELETE CASCADE
);

-- Ödünç alınan Kitaplar ve işlem geçmişi
CREATE TABLE borrowed_kitaplar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    penalty_fee DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES kullanicilar(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES kitaplar(id) ON DELETE CASCADE
);

-- temel rolleri ekleme
INSERT INTO roller (role_name) VALUES ('Admin'), ('Member');