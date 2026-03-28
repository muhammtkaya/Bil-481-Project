package com.libra.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.libra.model.Waitlist;
import com.libra.service.WaitlistService;

@RestController
@RequestMapping("/api/waitlist")
public class WaitlistController {

    @Autowired
    private WaitlistService waitlistService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Waitlist>> getUserWaitlist(@PathVariable Integer userId) {
        return ResponseEntity.ok(waitlistService.getWaitlistByUserId(userId));
    }
}