// netlify/functions/auth-callback.js
// Fungsi ini hanya menangani pengalihan (redirect) setelah Supabase Auth berhasil.

exports.handler = async (event) => {
    // Supabase SDK di client side (dashboard.html) yang akan 
    // mengambil token dari URL hash dan menetapkan sesi.
    
    // Kita redirect kembali ke dashboard, sambil memastikan parameter query string (jika ada) ikut terbawa.
    const destination = `/dashboard.html${event.rawQuery ? '?' + event.rawQuery : ''}`;

    return {
        statusCode: 302,
        headers: {
            'Location': destination,
            'Cache-Control': 'no-cache', // Penting untuk alur otentikasi
        },
    };
};