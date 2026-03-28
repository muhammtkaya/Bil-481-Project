package com.libra.model;

import jakarta.persistence.*;

@Entity
@Table(name = "kullanicilar")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(name = "categories", length = 1000)
    private String categories;

    public java.util.List<String> getCategories() {
        if (this.categories == null || this.categories.isEmpty())
            return new java.util.ArrayList<>();
        return java.util.Arrays.asList(this.categories.split(","));
    }

    public void setCategories(String categories) {
        this.categories = categories;
    }

    @Column(name = "password_hash", nullable = false)
    private String password;

    @Column(name = "role", nullable = false)
    private String role;

    public User() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}