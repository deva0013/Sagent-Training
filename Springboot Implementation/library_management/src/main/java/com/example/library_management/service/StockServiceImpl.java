package com.example.library_management.service;

import com.example.library_management.entity.Stock;
import com.example.library_management.repository.StockRepository;
import com.example.library_management.service.StockService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StockServiceImpl implements StockService {

    private final StockRepository stockRepository;

    public StockServiceImpl(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    @Override
    public Stock addBook(Stock stock) {
        return stockRepository.save(stock);
    }

    @Override
    public Stock getBookById(Long id) {
        return stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
    }

    @Override
    public List<Stock> getAllBooks() {
        return stockRepository.findAll();
    }

    @Override
    public List<Stock> getBooksByUserId(Long userId) {
        return stockRepository.findByUserUserId(userId);
    }

    @Override
    public Stock updateBook(Long id, Stock stock) {
        Stock existing = getBookById(id);
        existing.setTitle(stock.getTitle());
        existing.setAuthor(stock.getAuthor());
        existing.setSubject(stock.getSubject());
        existing.setTotalQuantity(stock.getTotalQuantity());
        existing.setAvailableQuantity(stock.getAvailableQuantity());
        existing.setStatus(stock.getStatus());
        existing.setUser(stock.getUser()); // because stock has FK user_id
        return stockRepository.save(existing);
    }

    @Override
    public void deleteBook(Long id) {
        Stock existing = getBookById(id);
        stockRepository.delete(existing);
    }
}

