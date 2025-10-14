// netlify/functions/check-credentials.js
// Memverifikasi username dan password admin dari ENV vars
exports.handler = async (event) => {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: JSON.stringify({ message: "Method Not Allowed" }) };
    }
    
    try {
        const { username, password } = JSON.parse(event.body);

        if (username === adminUsername && password === adminPassword) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Login successful!" }),
            };
        } else {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Invalid credentials." }),
            };
        }
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ message: "Invalid request body." }) };
    }
};
