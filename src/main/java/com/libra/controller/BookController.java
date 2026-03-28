package com.libra.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.libra.model.Book;
import com.libra.service.BookService;

@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookService bookService;

    /* Tarayıcıdan http://localhost:8080/api/books adresine gidildiğinde çalışır */
    @GetMapping
    public List<Book> getAllBooks() {
        return bookService.getAllBooks();
    }

    @GetMapping("/recommended")
    public List<Book> getRecommendedBooks(@RequestParam(required = false) List<String> categories) {
        return bookService.getRecommendedBooks(categories);
    }

    /* GÜNCELLENEN KISIM: Strategy Pattern için "type" parametresi eklendi.
       required = false yaptık, eğer frontend type göndermezse backend'de otomatik GENERAL çalışacak. */
    @GetMapping("/search")
    public List<Book> searchBooks(
            @RequestParam("keyword") String keyword,
            @RequestParam(value = "type", required = false) String searchType) {
        
        return bookService.searchBooks(keyword, searchType);
    }

    @PostMapping("/add")
    public ResponseEntity<Book> addBook(@RequestBody Book newBook) {
        // Yeni kitap eklerken varsayılan değerleri kontrol edebiliriz
        if (newBook.getStockCount() == null)
            newBook.setStockCount(1);
        Book savedBook = bookService.addBook(newBook);
        return ResponseEntity.ok(savedBook);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable Integer id) {
        try {
            bookService.deleteBook(id);
            return ResponseEntity.ok("Kitap başarıyla silindi.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Kitap silinirken hata oluştu.");
        }
    }

    // MAP te hata vardı kısmı: Şimdilik sorunsuz çalışacaktır.
    @PutMapping("/{id}/cover")
    public ResponseEntity<?> updateCover(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        try {
            String newUrl = payload.get("coverUrl");
            Book updatedBook = bookService.updateCoverUrl(id, newUrl);
            return ResponseEntity.ok(updatedBook);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}