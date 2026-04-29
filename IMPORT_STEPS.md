
# Supabase Import Steps

```sql
-- 1) Ana şemayı çalıştırdıktan sonra:
-- Supabase SQL Editor > Open file > sql/01_seed_content.sql > Run

-- 2) Bir kullanıcı kayıt olduktan sonra:
-- Supabase SQL Editor > Open file > sql/02_seed_demo_for_existing_users.sql > Run
```

## Storage

Supabase Dashboard > Storage:

- `course-media` bucket'ına `assets/course-media/*` yükle.
- `certificates` bucket'ına `assets/certificates/*` yükle.

## Uygulama tarafında ilk okunacak view'lar

- `v_learning_path_catalog`
- `v_course_catalog`
- `v_my_dashboard`
- `v_current_leaderboard`

## İlk test akışı

1. Uygulamadan kullanıcı oluştur.
2. `02_seed_demo_for_existing_users.sql` dosyasını çalıştır.
3. Ana sayfa/dashboard ekranında aktif kurs, hedef, XP ve seri verilerini oku.
4. `Neural Networks 101` kurs detayına gir.
5. Mini Lab ve AI Mentor ekranlarını test et.
