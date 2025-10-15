exports.handler = async function(event, context) {
    // 1. Ambil username dan password yang dikirim dari halaman login
    const { username, password } = JSON.parse(event.body);

    // 2. Ambil username dan password yang benar dari Netlify Environment Variables
    const correctUsername = process.env.ADMIN_USERNAME;
    const correctPassword = process.env.ADMIN_PASSWORD;

    // 3. Periksa apakah data yang dimasukkan cocok
    if (username === correctUsername && password === correctPassword) {
        // Jika cocok, kirim respon sukses
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } else {
        // Jika tidak cocok, kirim respon gagal
        return {
            statusCode: 401, // 401 Unauthorized
            body: JSON.stringify({ success: false, message: 'Invalid credentials' })
        };
    }
};