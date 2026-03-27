Model klasöründeki dosyalar, veritabanındaki tabloların Java tarafındaki birebir kopyaları olarak tanımlanmalıdır.

SQL tablolarındaki her bir satır verinin Java nesnesi (Object) olarak bellekte tutulması ve işlenmesi sağlanmalıdır.

Sınıf başına @Entity anotasyonu eklenmeli ve veritabanı kolonları Java değişkenleri ile eşleştirilmelidir.

Örnek (Book.java):

@Entity
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String author;
    private boolean isAvailable;
}