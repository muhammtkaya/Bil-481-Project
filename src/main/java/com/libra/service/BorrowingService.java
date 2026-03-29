package com.libra.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    private final WaitlistService waitlistService;
    private final SimpMessagingTemplate messagingTemplate;

    public BorrowingService(BorrowingRepository borrowingRepository, 
                            BookRepository bookRepository,
                            UserRepository userRepository,
                            WaitlistService waitlistService,
                            SimpMessagingTemplate messagingTemplate) {
        this.borrowingRepository = borrowingRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.waitlistService = waitlistService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public Object borrowBook(Integer userId, Integer bookId) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> new RuntimeException("Kitap bulunamadı"));
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        boolean alreadyBorrowed = borrowingRepository.findByUser_Id(userId).stream()
                .anyMatch(b -> b.getBook().getId().equals(bookId) && "BORROWED".equals(b.getStatus()));

        if (alreadyBorrowed) throw new RuntimeException("Bu kitabı zaten ödünç aldınız.");

        if (book.getStockCount() > 0) {
            book.setStockCount(book.getStockCount() - 1);
            bookRepository.save(book);
            
            // GLOBAL BİLDİRİM: Stok azaldı, herkes görsün!
            messagingTemplate.convertAndSend("/topic/books", "BOOK_UPDATED");
            
            return createBorrowRecord(user, book);
        }

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
        Optional<Waitlist> nextInLine = waitlistService.getNextInQueue(book.getId());

        if (nextInLine.isPresent()) {
            Waitlist waitEntry = nextInLine.get();
            createBorrowRecord(waitEntry.getUser(), book);
            waitlistService.updateWaitlistStatus(waitEntry, "ASSIGNED");

            // KİŞİSEL BİLDİRİM: Sadece sıradaki kullanıcıya
            messagingTemplate.convertAndSend("/topic/user-" + waitEntry.getUser().getId(), 
                "Sıradaki '" + book.getTitle() + "' kitabı artık sizin! Profilinizden kontrol edebilirsiniz.");
        } else {
            book.setStockCount(book.getStockCount() + 1);
            bookRepository.save(book);
        }

        // GLOBAL BİLDİRİM: İade sonrası stok değişti, tüm istemciler güncellensin!
        messagingTemplate.convertAndSend("/topic/books", "BOOK_UPDATED");
        
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