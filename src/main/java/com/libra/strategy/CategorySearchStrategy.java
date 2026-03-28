package com.libra.strategy;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.libra.model.Book;
import com.libra.repository.BookRepository;

@Component
public class CategorySearchStrategy implements ISearchStrategy {
    @Autowired
    private BookRepository bookRepository;

    @Override
    public List<Book> search(String keyword) {
        return bookRepository.findByCategory_CategoryNameContainingIgnoreCase(keyword);
    }

    @Override
    public String getStrategyName() {
        return "CATEGORY";
    }
}
