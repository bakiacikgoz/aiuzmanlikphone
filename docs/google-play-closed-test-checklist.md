# Google Play Kapalı Test Kontrol Listesi

Son güncelleme: 2 Mayıs 2026

## Repo İçi Hazırlık

- `mobile/app.json` içinde Android package: `com.bakiacikgoz.aiengineeringacademy`
- Privacy policy: `/privacy.html`
- Account deletion: `/account-deletion.html`
- Terms: `/terms.html`
- AI mentor report flow: uygulama içi `Rapor et`
- Account deletion flow: profil > `Hesabımı Sil`
- Subscription flow: profil > `Abonelik`, paywall ve RevenueCat fallback

## Play Console Harici İşler

- RevenueCat dashboard içinde `pro` entitlement oluştur.
- Google Play subscription ürünleri oluştur:
  - `ai_academy_pro_monthly`
  - `ai_academy_pro_yearly`
- Supabase Edge Function secretleri:
  - `DEEPSEEK_API_KEY`
  - `DEEPSEEK_MODEL=deepseek-chat`
  - `REVENUECAT_WEBHOOK_SECRET`
- RevenueCat webhook URL:
  - `https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook`
- Data Safety formunda hesap, öğrenme ilerlemesi, AI mentor mesajları, ödeme/abonelik durumu ve rapor kayıtları beyan edilmeli.
- Kişisel Play hesabı için en az 12 tester 14 gün kapalı testte opt-in kalmalı.

## Manuel Kabul Akışı

1. Email/password ile giriş yap.
2. Dashboard > path > course detail > lesson player akışında ilk dersi tamamla.
3. Quiz ve mini lab akışını çalıştır.
4. AI Mentor'a soru sor; yanıtı `Rapor et`.
5. Free mentor kotası dolduğunda paywall'a yönlendirme gör.
6. Profile > Abonelik ekranında RevenueCat fallback crash etmeden çalışsın.
7. Profile > Gizlilik Politikası, Kullanım Şartları, Hesabımı Sil linkleri açılsın.
8. Hesap silme talebi oluştur ve Supabase `account_deletion_requests` kaydını doğrula.
9. Development build üzerinde RevenueCat gerçek satın alma ve restore akışını test et.
