package com.libra.repository;

import com.libra.model.BorrowedBook;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BorrowingRepository extends JpaRepository<BorrowedBook, Integer> {
    // Kullanıcının kayıtlarını getirmek için
    List<BorrowedBook> findByUser_Id(Integer userId);

    // Gecikmiş kitapları bulmak için
    List<BorrowedBook> findByStatusAndDueDateBefore(String status, LocalDate date);
}
