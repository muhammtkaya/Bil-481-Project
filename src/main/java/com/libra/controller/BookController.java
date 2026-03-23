package com.libra.controller;

import com.libra.model.Book;
import com.libra.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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

    @GetMapping("/search")
    public List<Book> searchBooks(@RequestParam("keyword") String keyword) {
        return bookService.searchBooks(keyword);
    }
}