package com.libra.service;

import com.libra.model.Book;
import com.libra.model.BorrowedBook;
import com.libra.model.User;
import com.libra.repository.BookRepository;
import com.libra.repository.BorrowingRepository;
import com.libra.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class BorrowingService {
    private final BorrowingRepository borrowingRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    public BorrowingService(BorrowingRepository borrowingRepository, BookRepository bookRepository,
            UserRepository userRepository) {
        this.borrowingRepository = borrowingRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }

    public BorrowedBook borrowBook(Integer userId, Integer bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<BorrowedBook> userBorrowings = borrowingRepository.findByUser_Id(userId);
        boolean alreadyBorrowed = userBorrowings.stream()
                .anyMatch(b -> b.getBook().getId().equals(bookId) && "BORROWED".equals(b.getStatus()));

        if (alreadyBorrowed) {
            throw new RuntimeException("Bu kitabı zaten ödünç aldınız ve henüz iade etmediniz.");
        }

        if (book.getStockCount() > 0) {
            book.setStockCount(book.getStockCount() - 1);
            bookRepository.save(book);

            BorrowedBook record = new BorrowedBook();
            record.setUser(user);
            record.setBook(book);
            record.setBorrowDate(LocalDate.now());
            record.setReturnDate(null);
            record.setDueDate(LocalDate.now().plusDays(15));
            record.setStatus("BORROWED");

            return borrowingRepository.save(record);
        }
        throw new RuntimeException("Out of Stock");
    }

    // METOT 1: Kitap İade Etme İşlemi
    public BorrowedBook returnBook(Integer recordId) {
        BorrowedBook record = borrowingRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Borrowing record not found"));

        if ("RETURNED".equals(record.getStatus())) {
            throw new RuntimeException("Book is already returned");
        }

        // Kitabın stok sayısını 1 artır
        Book book = record.getBook();
        book.setStockCount(book.getStockCount() + 1);
        bookRepository.save(book);

        // Kaydı güncelle
        record.setStatus("RETURNED");
        record.setReturnDate(LocalDate.now());

        return borrowingRepository.save(record);
    }

    // METOT 2: Kullanıcının Ödünç Aldığı Kitapları Listeleme (Profil sayfası
    // için)
    public List<BorrowedBook> getBorrowingsByUserId(Integer userId) {
        return borrowingRepository.findByUser_Id(userId);
    }

    // METOT 3: İade Tarihi Geçmiş (Gecikmiş) Kitapları Listeleme
    public List<BorrowedBook> getOverdueBorrowings() {
        // Durumu BORROWED olan ve dueDate (son teslim tarihi) bugünden önce olanları
        // getirir
        return borrowingRepository.findByStatusAndDueDateBefore("BORROWED", LocalDate.now());
    }
}