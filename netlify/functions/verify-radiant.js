exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { username, password } = JSON.parse(event.body);
        
        const envUser = process.env.RADIANTNAME;
        const envPass = process.env.RADIANTPASS;
        const envToken = process.env.RADIANT_TOKEN; // Ambil token rahasia

        if (username === envUser && password === envPass) {
            // Kirim token ke frontend jika sukses
            return { statusCode: 200, body: JSON.stringify({ success: true, token: envToken }) };
        } else {
            return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Kredensial tidak valid!' }) };
        }
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ success: false, message: err.message }) };
    }
};
