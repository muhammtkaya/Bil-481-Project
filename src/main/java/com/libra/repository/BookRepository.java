package com.libra.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.libra.model.Book;

@Repository
public interface BookRepository extends JpaRepository<Book, Integer> {
    
    // HATA DÜZELTİLDİ: Category nesnesinin içindeki categoryName alanına göre arama yapar
    // Tavsiye sistemi (User Story 6) için kullanıcının seçtiği yaylım, roman gibi metinleri buraya yollayabilirsin.
    List<Book> findByCategory_CategoryNameIn(List<String> categoryNames);

    // Başlığa göre büyük/küçük harf duyarsız arama
    List<Book> findByTitleContainingIgnoreCase(String title);
    
    // Yazara göre büyük/küçük harf duyarsız arama
    List<Book> findByAuthorContainingIgnoreCase(String author);
    
    // Kategori ismine göre arama (Strategy Pattern - CategorySearchStrategy için)
    // Book -> Category -> categoryName yolunu izler
    List<Book> findByCategory_CategoryNameContainingIgnoreCase(String categoryName);
    
    // Genel arama (Hem yazar hem başlık içinde arar)
    List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(String title, String author);

    // İLERİDE LAZIM OLACAK: ISBN eklediğinde bunu kullanabilirsin
    // List<Book> findByIsbn(String isbn);
}