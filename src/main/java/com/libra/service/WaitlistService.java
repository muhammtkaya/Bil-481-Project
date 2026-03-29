package com.libra.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.libra.model.Book;
import com.libra.model.User;
import com.libra.model.Waitlist;
import com.libra.repository.WaitlistRepository;

@Service
public class WaitlistService {
    private final WaitlistRepository waitlistRepository;

    public WaitlistService(WaitlistRepository waitlistRepository) {
        this.waitlistRepository = waitlistRepository;
    }

    public void addToWaitlist(User user, Book book) {
        if (waitlistRepository.existsByUser_IdAndBook_IdAndStatus(user.getId(), book.getId(), "WAITING")) {
            throw new RuntimeException("Zaten bu kitabın bekleme listesindesiniz.");
        }
        Waitlist waitEntry = new Waitlist();
        waitEntry.setUser(user);
        waitEntry.setBook(book);
        waitEntry.setRequestDate(LocalDateTime.now());
        waitEntry.setStatus("WAITING");
        waitlistRepository.save(waitEntry);
    }

    public Optional<Waitlist> getNextInQueue(Integer bookId) {
        List<Waitlist> queue = waitlistRepository.findByBook_IdAndStatusOrderByRequestDateAsc(bookId, "WAITING");
        return queue.isEmpty() ? Optional.empty() : Optional.of(queue.get(0));
    }

    public void updateWaitlistStatus(Waitlist entry, String newStatus) {
        entry.setStatus(newStatus);
        waitlistRepository.save(entry);
    }

    public List<Waitlist> getWaitlistByUserId(Integer userId) {
        return waitlistRepository.findByUser_IdAndStatus(userId, "WAITING");
    }
}
