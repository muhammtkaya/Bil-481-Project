package com.libra.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.libra.model.Book;

@Repository
public interface BookRepository extends JpaRepository<Book, Integer> {
    
    // Kategorilere göre çoklu arama yapar (Tavsiye sistemi için)
    List<Book> findByCategoryIn(List<String> categories);

    // Strateji Pattern için gerekli özel arama metotları
    List<Book> findByTitleContainingIgnoreCase(String title);
    
    List<Book> findByAuthorContainingIgnoreCase(String author);
    
    List<Book> findByCategory_CategoryNameContainingIgnoreCase(String categoryName);
    
    // Genel arama (Hem yazar hem başlık içinde arar)
    List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(String title, String author);
}