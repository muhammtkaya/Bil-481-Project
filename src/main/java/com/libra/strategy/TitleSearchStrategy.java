package com.libra.strategy;

import com.libra.model.Book;
import com.libra.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class TitleSearchStrategy implements ISearchStrategy {
    @Autowired
    private BookRepository bookRepository;

    @Override
    public List<Book> search(String keyword) {
        return bookRepository.findByTitleContainingIgnoreCase(keyword);
    }

    @Override
    public String getStrategyName() {
        return "TITLE";
    }
}
