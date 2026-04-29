# AI Engineering Academy Dataset v1

Bu paket, React Native + Supabase tabanlı AI Engineering Academy uygulaması için kapsamlı başlangıç veri setidir.

## İçerik sayıları

- Öğrenme yolu: 4
- Kurs: 14
- Modül: 42
- Ders: 126
- Ders içerik bloğu: 420
- Ders kaynağı: 252
- Assessment/quiz: 57
- Soru: 208
- Cevap seçeneği: 832
- Mini lab: 42
- Lab parametresi: 126
- Lab test case: 84
- Glossary terimi: 30
- Embedding placeholder: 534
- Rozet: 9
- Sertifika şablonu: 2

## Kurulum sırası

1. Önce ana şema dosyasını çalıştır: `ai_engineering_academy_supabase_schema.sql`.
2. Sonra `sql/01_seed_content.sql` dosyasını Supabase SQL Editor içinde çalıştır.
3. En az bir kullanıcı kayıt olduktan sonra örnek dashboard/progress/mentor/lig verisi için `sql/02_seed_demo_for_existing_users.sql` dosyasını çalıştır.
4. `assets/course-media` içeriğini Supabase Storage'daki `course-media` bucket'ına, `assets/certificates` içeriğini `certificates` bucket'ına yükle.
5. CSV dosyalarını içerik editörü/operasyon paneli için kullanabilirsin.

## Dosya yapısı

- `sql/01_seed_content.sql`: Ana içerik seed dosyası. Idempotenttir.
- `sql/02_seed_demo_for_existing_users.sql`: Mevcut gerçek kullanıcılar üzerinde demo veri üretir; auth user oluşturmaz.
- `sql/99_reset_dataset_dev_only.sql`: Geliştirme ortamında seed içeriğini geri almak için yardımcı dosya.
- `data/json/catalog_full.json`: Tüm katalog verisinin JSON karşılığı.
- `data/csv/*.csv`: İçerik tablolarının CSV karşılıkları.
- `assets/`: Ders ve sertifika placeholder SVG dosyaları.

## Notlar

- Quiz doğru cevapları `assessment_options.is_correct` alanındadır. Mobil istemcide bu alanı doğrudan açmamak için daha önce hazırlanan safe view/RLS yaklaşımını koru.
- `labs.solution_code` servis/edge function tarafında kullanılmalıdır; mobil istemciye doğrudan döndürülmemelidir.
- `content_embeddings.embedding` alanları boş bırakılmıştır. İçerikler hazırlandıktan sonra embedding üretip aynı kayıtları güncelleyebilirsin.
- Harici kaynak linkleri ağırlıklı olarak resmi dokümantasyon sayfalarıdır; üretimde link kontrol cron'u eklemek iyi olur.
