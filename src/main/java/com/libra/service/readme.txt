Projenin iş mantığının yürütüldüğü merkez katman olarak yapılandırılmalıdır.

Ödünç alma şartlarının kontrolü, gecikme cezası hesaplamaları ve kitap tavsiyesi gibi fonksiyonel gereksinimler burada işlenmelidir.

Sınıf başına @Service notasyonu eklenmeli ve veri işlemleri için Repository katmanı çağrılmalıdır.

Örnek (BookService.java):

@Service
public class BookService {
    @Autowired
    private BookRepository bookRepository;

    public void borrowBook(Long bookId) {
	
    }
}