package com.libra.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.libra.model.Book;
import com.libra.model.BorrowedBook;
import com.libra.model.User;
import com.libra.model.Waitlist;
import com.libra.repository.BookRepository;
import com.libra.repository.BorrowingRepository;
import com.libra.repository.UserRepository;

@Service
public class BorrowingService {
    private final BorrowingRepository borrowingRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final WaitlistService waitlistService; //

    public BorrowingService(BorrowingRepository borrowingRepository, 
                            BookRepository bookRepository,
                            UserRepository userRepository,
                            WaitlistService waitlistService) {
        this.borrowingRepository = borrowingRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.waitlistService = waitlistService;
    }

    @Transactional
    public Object borrowBook(Integer userId, Integer bookId) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> new RuntimeException("Kitap bulunamadı"));
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        // Zaten ödünç alınmış mı kontrolü
        boolean alreadyBorrowed = borrowingRepository.findByUser_Id(userId).stream()
                .anyMatch(b -> b.getBook().getId().equals(bookId) && "BORROWED".equals(b.getStatus()));

        if (alreadyBorrowed) throw new RuntimeException("Bu kitabı zaten ödünç aldınız.");

        // KRİTİK DEĞİŞİKLİK: Stok varsa ödünç kaydı döndürür
        if (book.getStockCount() > 0) {
            book.setStockCount(book.getStockCount() - 1);
            bookRepository.save(book);
            return createBorrowRecord(user, book);
        }

        // Stok yoksa Waitlist'e ekler ve artık HATA FIRLATMAZ, düz bir mesaj döndürür
        waitlistService.addToWaitlist(user, book);
        return "WAITLISTED"; 
    }

    @Transactional
    public BorrowedBook returnBook(Integer recordId) {
        BorrowedBook record = borrowingRepository.findById(recordId).orElseThrow(() -> new RuntimeException("Kayıt bulunamadı"));
        if ("RETURNED".equals(record.getStatus())) throw new RuntimeException("Kitap zaten iade edilmiş.");

        record.setStatus("RETURNED");
        record.setReturnDate(LocalDate.now());
        borrowingRepository.save(record);

        Book book = record.getBook();
        
        // Bekleme listesindeki ilk kişiyi kontrol et
        Optional<Waitlist> nextInLine = waitlistService.getNextInQueue(book.getId());

        if (nextInLine.isPresent()) {
            Waitlist waitEntry = nextInLine.get();
            // Kitabı doğrudan sıradakine ata (Stok artmaz, doğrudan yeni kayıt açılır)
            createBorrowRecord(waitEntry.getUser(), book);
            waitlistService.updateWaitlistStatus(waitEntry, "ASSIGNED");
        } else {
            // Sırada kimse yoksa stoğu artır
            book.setStockCount(book.getStockCount() + 1);
            bookRepository.save(book);
        }
        return record;
    }

    private BorrowedBook createBorrowRecord(User user, Book book) {
        BorrowedBook record = new BorrowedBook();
        record.setUser(user);
        record.setBook(book);
        record.setBorrowDate(LocalDate.now());
        record.setDueDate(LocalDate.now().plusDays(15));
        record.setStatus("BORROWED");
        return borrowingRepository.save(record);
    }

    public List<BorrowedBook> getBorrowingsByUserId(Integer userId) {
        return borrowingRepository.findByUser_Id(userId);
    }

    public List<BorrowedBook> getOverdueBorrowings() {
        return borrowingRepository.findByStatusAndDueDateBefore("BORROWED", LocalDate.now());
    }
}