package com.example.library_management.service;

import com.example.library_management.entity.Stock;
import java.util.List;

public interface StockService {
    Stock addBook(Stock stock);
    Stock getBookById(Long id);
    List<Stock> getAllBooks();
    List<Stock> getBooksByUserId(Long userId);
    Stock updateBook(Long id, Stock stock);
    void deleteBook(Long id);
}

