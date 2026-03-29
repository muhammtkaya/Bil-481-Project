package com.libra.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.libra.model.BorrowedBook;
import com.libra.service.BorrowingService;

@RestController
@RequestMapping("/api/borrowings")
public class BorrowingController {

    @Autowired
    private BorrowingService borrowingService;

    @PostMapping("/borrow")
    public ResponseEntity<?> borrowBook(@RequestBody Map<String, Integer> payload) {
        try {
            Integer userId = payload.get("userId");
            Integer bookId = payload.get("bookId");

            Object result = borrowingService.borrowBook(userId, bookId);

            // Eğer sonuç "WAITLISTED" ise 200 OK ile mesaj dönüyoruz (Artık hata değil!)
            if (result instanceof String && "WAITLISTED".equals(result)) {
                return ResponseEntity.ok(Map.of("message", "Stokta yok, bekleme listesine başarıyla eklendiniz."));
            }

            // Normal ödünç alma işlemi
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            // Gerçek hataları (örn: zaten ödünç almış olması) 400 Bad Request ile dönüyoruz
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/return/{id}")
    public ResponseEntity<?> returnBook(@PathVariable Integer id) {
        try {
            BorrowedBook updatedRecord = borrowingService.returnBook(id);
            return ResponseEntity.ok(updatedRecord);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserBorrowings(@PathVariable Integer userId) {
        try {
            return ResponseEntity.ok(borrowingService.getBorrowingsByUserId(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}