Frontend (arayüz) biriminden gelen HTTP isteklerinin karşılandığı ve yanıtlandığı API uç noktaları (Endpoints) olarak tanımlanmalıdır.

Web sayfasından gelen kullanıcı taleplerinin Service katmanına iletilmesi ve sonucun JSON formatında arayüze geri döndürülmesi sağlanmalıdır.

@RestController anotasyonu kullanılmalı ve metodlar @GetMapping, @PostMapping gibi HTTP fiilleriyle işaretlenmelidir.

Örnek (BookController.java):

@RestController
@RequestMapping("/api/books")
public class BookController {
    @Autowired
    private BookService bookService;

    @GetMapping("/search")
    public List<Book> searchBooks(@RequestParam String title) {
        return bookService.searchByTitle(title); // [cite: 20]
    }
}