package com.libra.strategy;

import java.util.List;

import com.libra.model.Book;

public interface ISearchStrategy {
    List<Book> search(String keyword);
    String getStrategyName();
}
