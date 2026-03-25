package com.libra.repository;

import com.libra.model.Book;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookRepository extends JpaRepository<Book, Integer> {
    // Kategorilere göre çoklu arama yapar
    List<Book> findByCategoryIn(List<String> categories);

    // Başlık, Yazar veya Kategoride kelime arar
    List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrCategoryContainingIgnoreCase(
            String title, String author, String category);
}