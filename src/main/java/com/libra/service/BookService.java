package com.libra.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.libra.model.Book;
import com.libra.repository.BookRepository;
import com.libra.strategy.ISearchStrategy;

@Service
public class BookService {
    
    private final BookRepository bookRepository;
    
    // UML Diyagramındaki özellik: -searchStrategies: Map<String, ISearchStrategy>
    private final Map<String, ISearchStrategy> searchStrategies = new HashMap<>();

    @Autowired
    public BookService(BookRepository bookRepository, List<ISearchStrategy> strategies) {
        this.bookRepository = bookRepository;
        // Sistemdeki tüm stratejileri alıp Map içine (Örn: "TITLE" -> TitleSearchStrategy) yerleştiriyoruz.
        for (ISearchStrategy strategy : strategies) {
            searchStrategies.put(strategy.getStrategyName(), strategy);
        }
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    // İlgi alanlarına göre listeleme
    public List<Book> getRecommendedBooks(List<String> categories) {
        if (categories == null || categories.isEmpty()) {
            return bookRepository.findAll();
        }
        return bookRepository.findByCategory_CategoryNameIn(categories);
    }

    // UML Diyagramındaki metod: +searchBooks(keyword: String, searchType: String): List<Book>
    public List<Book> searchBooks(String keyword, String searchType) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return bookRepository.findAll();
        }

        // Eğer frontend'den searchType boş veya hatalı gelirse, varsayılan olarak GENERAL kullan
        if (searchType == null || !searchStrategies.containsKey(searchType.toUpperCase())) {
            searchType = "GENERAL";
        }

        // Map üzerinden ilgili stratejiyi bul ve aramayı ona devret (Strategy Pattern büyüsü!)
        ISearchStrategy strategy = searchStrategies.get(searchType.toUpperCase());
        return strategy.search(keyword);
    }

    public Book updateCoverUrl(Integer bookId, String coverUrl) throws Exception {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new Exception("Kitap bulunamadı!"));
        book.setCoverUrl(coverUrl);
        return bookRepository.save(book);
    }

    public Book addBook(Book newBook) {
        return bookRepository.save(newBook);
    }

    public void deleteBook(Integer bookId) {
        bookRepository.deleteById(bookId);
    }

    public Book saveBook(Book book) {
        return bookRepository.save(book);
    }
}