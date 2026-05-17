# Supabase OTP Kodlu Giriş Ayarı

Şifremi unuttum / kodla giriş akışının gerçekten kod göndermesi için Supabase varsayılan Magic Link e-postasını değiştirmek gerekir.

## Nereden Ayarlanır

1. Supabase panelini aç.
2. Harman projesine gir.
3. Authentication > Email Templates bölümüne gir.
4. Magic Link şablonunu aç.
5. Konu başlığını örneğin `Harman giriş kodunuz` yap.
6. HTML gövdesine `supabase/otp-login-email-template.html` dosyasındaki içeriği yapıştır.
7. Kaydet.

## Önemli

Şablonda mutlaka şu değişken bulunmalı:

```txt
{{ .Token }}
```

Supabase tek kullanımlık kodu bu değişkenle e-postaya basar. Şablonda sadece `{{ .ConfirmationURL }}` veya buton varsa kullanıcı kod görmez; yalnızca magic link görür.
