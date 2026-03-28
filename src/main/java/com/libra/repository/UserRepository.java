package com.libra.repository;

import com.libra.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    // Spring Boot fonksiyonu adından anlıyor. Metot tanımına gerek yok
    User findByUsername(String username);
}