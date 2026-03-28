Veritabanı ile uygulama arasındaki doğrudan veri transferini sağlayan interfaceler olarak kurgulanmalıdır.

Karmaşık SQL sorguları yazmak yerine, Spring Data JPA üzerinden temel işlemlerin yürütülmesi hedeflenmelidir.

JpaRepository arayüzü extend edilmeli ve ilgili model sınıfı ile ilişkilendirilmelidir.

Örnek (BookRepository.java):

public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByTitleContaining(String title);
}