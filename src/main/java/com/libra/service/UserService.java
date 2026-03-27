package com.libra.service;

import com.libra.model.User;
import com.libra.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User registerUser(User newUser) throws Exception {
        if (userRepository.findByUsername(newUser.getUsername()) != null) {
            throw new Exception("Bu kullanıcı zaten kayıtlı!");
        }
        return userRepository.save(newUser);
    }
    public User updateUserProfile(Integer id, java.util.List<String> categories) throws Exception {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new Exception("Kullanıcı bulunamadı!"));
    
     // Listeyi "Yazılım,Roman" formatında String'e çevirip kaydediyoruz
        if (categories != null) {
            user.setCategories(String.join(",", categories));
        }
    
     return userRepository.save(user);
    }
    public User loginUser(String username, String password) throws Exception {
        User user = userRepository.findByUsername(username);
        if (user == null || !user.getPassword().equals(password)) {
            throw new Exception("Hatalı kullanıcı adı veya şifre!");
        }
        return user;
    }
}