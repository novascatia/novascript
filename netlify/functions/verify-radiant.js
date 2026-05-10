exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { username, password } = JSON.parse(event.body);
        
        // Mengambil secret dari Environment Variables Netlify
        const envUser = process.env.RADIANTNAME;
        const envPass = process.env.RADIANTPASS;

        if (username === envUser && password === envPass) {
            return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Access Granted' }) };
        } else {
            return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Kredensial Radiant tidak valid!' }) };
        }
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ success: false, message: err.message }) };
    }
};
