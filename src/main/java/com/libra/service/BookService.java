package com.libra.service;

import com.libra.model.Book;
import com.libra.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BookService {
    @Autowired
    private BookRepository bookRepository;

    /* Filtreleme yapmak için fonksiyonlar buraya yazılacak */
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    // İlgi alanlarına göre listeleme
    public List<Book> getRecommendedBooks(List<String> categories) {
        if (categories == null || categories.isEmpty()) {
            return bookRepository.findAll(); // İlgi alanı yoksa hepsini getir
        }
        return bookRepository.findByCategoryIn(categories);
    }

    // Arama Çubuğu
    public List<Book> searchBooks(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return bookRepository.findAll();
        }
        return bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrCategoryContainingIgnoreCase(
                keyword, keyword, keyword);
    }

    public Book saveBook(Book book) {
        return bookRepository.save(book);
    }
}