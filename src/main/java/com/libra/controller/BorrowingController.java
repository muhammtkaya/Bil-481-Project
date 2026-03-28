package com.libra.controller;

import com.libra.model.BorrowedBook;
import com.libra.service.BorrowingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/borrowings")
public class BorrowingController {

    @Autowired
    private BorrowingService borrowingService;

    /**
     * Bir kitabın ödünç alınmasını sağlar. Kullanıcı ID'si ve Kitap ID'si içeren
     * bir
     * JSON payload bekler.
     */
    @PostMapping("/borrow")
    public ResponseEntity<?> borrowBook(@RequestBody Map<String, Integer> payload) {
        try {
            Integer userId = payload.get("userId");
            Integer bookId = payload.get("bookId");

            BorrowedBook record = borrowingService.borrowBook(userId, bookId);
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * Ödünç alınan kitabın iade edilmesini sağlar (Kayıt ID'si üzerinden).
     */
    @PostMapping("/return/{id}")
    public ResponseEntity<?> returnBook(@PathVariable Integer id) {
        try {
            BorrowedBook updatedRecord = borrowingService.returnBook(id);
            return ResponseEntity.ok(updatedRecord);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * Profil sayfası için belirli bir kullanıcının geçmiş ve aktif tüm ödünç alma
     * kayıtlarını getirir.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserBorrowings(@PathVariable Integer userId) {
        try {
            List<BorrowedBook> records = borrowingService.getBorrowingsByUserId(userId);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Ödünç alma kayıtları getirilirken hata oluştu: " + e.getMessage());
        }
    }

    /**
     * İade tarihi geçmiş ve ceza uygulanması gereken kitapları listelemek (Admin
     * için)
     */
    @GetMapping("/overdue")
    public ResponseEntity<?> getOverdueBorrowings() {
        try {
            List<BorrowedBook> overdueRecords = borrowingService.getOverdueBorrowings();
            return ResponseEntity.ok(overdueRecords);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}
