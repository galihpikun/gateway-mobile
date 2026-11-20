# Gateway Mobile

Aplikasi Expo untuk menjelajahi konser, memesan tiket, mengelola konser, dan memeriksa tiket di gerbang. Mobile menggunakan database dan API yang sama dengan Gateway Web melalui `gateway-be`.

## Menjalankan secara lokal

1. Jalankan `npm run dev` dari direktori `gateway-be` setelah menyiapkan database dan konfigurasi backend. Backend lokal memakai port `3001` secara default.
2. Dari direktori `gateway-mobile`, jalankan `npm ci`, lalu salin `.env.example` ke `.env`.
3. Jalankan `npx expo start`. Tekan `w` untuk web, `a` untuk Android emulator, atau pindai QR dari perangkat yang dapat mengakses Metro dan backend di jaringan lokal.

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3001
```

Dengan nilai di atas, web lokal dan iOS Simulator memakai `localhost`, Android Emulator standar memakai `10.0.2.2`, dan perangkat fisik di mode LAN memakai alamat komputer dari Expo Metro. Jika menggunakan tunnel Metro atau Metro berjalan di komputer berbeda dari backend, masukkan langsung alamat yang dapat dijangkau perangkat, misalnya `http://192.168.1.10:3001` untuk jaringan lokal. Bila gagal tersambung dari ponsel, buka `http://<IP-komputer>:3001/api/events` di browser ponsel dan periksa koneksi Wi-Fi serta aturan firewall untuk port `3001`.

Untuk distribusi aplikasi, isi variabel dengan URL HTTPS backend sebelum bundling. `EXPO_PUBLIC_API_URL` ikut masuk ke bundle aplikasi. Kredensial database, Xendit, Cloudinary, dan Resend ditempatkan di `gateway-be`.

## Alur berdasarkan peran

- **Pembeli** membuka konser, memilih jumlah tiket, mengisi data pembeli, lalu melanjutkan pembayaran di Xendit. Status diperbarui di Pesanan Saya dan QR muncul di Tiket Saya ketika backend mengonfirmasi pembayaran.
- **Organizer** membuat konser di Studio Organizer, memilih denah dan zona tiket, lalu mengunggah video preview serta background tiket. Organizer yang disetujui tidak dapat memesan tiket.
- **Admin** membuka Panel Admin dari Profil untuk meninjau konser, organizer dan dokumennya, refund, serta pengguna. Scanner Gerbang juga tersedia untuk admin.
- **Staf** membuka Scanner Gerbang dari Profil, memilih konser penugasan, memindai QR atau memasukkan kode, lalu mengonfirmasi check-in.

Jalankan `npm run lint`, `npx tsc --noEmit`, dan `npx expo export --platform all` untuk memeriksa proyek.
