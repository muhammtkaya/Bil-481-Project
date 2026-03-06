package com.libra.controller;

import com.libra.model.Book;
import com.libra.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
}