package com.libra.websocket; 

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // İstemcilerin (Frontend) dinleyeceği adreslerin ön eki
        config.enableSimpleBroker("/topic");
        
        // İstemcilerden sunucuya (Backend) gönderilecek mesajların ön eki
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Frontend'in SockJS ile bağlanacağı ana kapı
        // setAllowedOrigins içine frontend'in çalıştığı adresi tam olarak yazmalısın
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:5500", "http://127.0.0.1:5500") 
                .withSockJS();
    }
}
