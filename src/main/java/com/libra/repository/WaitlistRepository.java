package com.libra.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.libra.model.Waitlist;

@Repository
public interface WaitlistRepository extends JpaRepository<Waitlist, Integer> {
    // Belirli bir kitap için bekleyenleri sırayla getirir
    List<Waitlist> findByBook_IdAndStatusOrderByRequestDateAsc(Integer bookId, String status);

    // Kullanıcının bekleme listesini profil sayfasında göstermek için
    List<Waitlist> findByUser_IdAndStatus(Integer userId, String status);

    // Mükerrer (aynı kitap için iki kez) sıraya girmeyi engellemek için
    boolean existsByUser_IdAndBook_IdAndStatus(Integer userId, Integer bookId, String status);
}
