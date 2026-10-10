# PyMotion Web — Prototype awal

PyMotion Web adalah prototipe website edukasi fisika dengan UI pastel pink–ungu, simulasi 3D browser, grafik posisi/kecepatan, ringkasan materi, dan latihan konsep.

## Isi prototipe
- `index.html` — struktur halaman
- `style.css` — desain responsif
- `app.js` — perhitungan gerak, Three.js 3D, grafik Chart.js, materi, dan kuis dasar

## Jalankan secara lokal
Karena proyek menggunakan JavaScript modules, jalankan melalui server lokal (jangan hanya membuka `index.html` dengan klik ganda).

1. Ekstrak ZIP.
2. Buka folder `PyMotion_Web` di VS Code.
3. Pasang ekstensi **Live Server**.
4. Klik kanan `index.html` → **Open with Live Server**.
5. Pastikan internet aktif agar Three.js, Chart.js, dan Google Fonts dapat dimuat dari CDN.

Alternatif jika Python tersedia:
```bash
python -m http.server 8000
```
Lalu buka `http://localhost:8000`.

## Publikasikan melalui GitHub Pages
1. Buat akun/login GitHub dan buat repository baru, misalnya `pymotion-web`.
2. Unggah `index.html`, `style.css`, `app.js`, dan `README.md` ke root repository.
3. Buka **Settings → Pages**.
4. Pada Build and deployment pilih **Deploy from a branch**.
5. Pilih branch `main`, folder `/(root)`, lalu Save.
6. Tunggu proses deployment selesai. URL website akan terlihat di halaman GitHub Pages.

## Batas prototipe yang perlu diketahui
Ini adalah versi web awal, bukan konversi otomatis seluruh program Tkinter. Fitur identitas siswa, eksperimen berulang virtual lab, tabel pengamatan, penyimpanan nilai, dan semua bank soal/pembahasan dari aplikasi desktop belum dipindahkan. Prototipe ini belum memiliki database atau autentikasi siswa.

Model gerak:
- GLB: `x = x0 + v0 t`, `a = 0`
- GLBB: `x = x0 + v0 t + 1/2 a t²`, `v = v0 + at`
- Gerak parabola: komponen horizontal `x = v0 cos(theta) t`; vertikal `y = y0 + v0 sin(theta)t - 1/2 gt²`, dengan `g = 9.8 m/s²` dan hambatan udara diabaikan.

## Catatan teknis
- Memerlukan browser modern dengan WebGL.
- Pustaka Three.js, Chart.js, dan font diambil dari CDN, sehingga browser perlu akses internet.
- Sebelum digunakan untuk penilaian resmi, uji semua kasus, terutama gerak GLBB dengan percepatan negatif dan gerak parabola.
