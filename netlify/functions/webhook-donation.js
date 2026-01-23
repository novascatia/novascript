// File: netlify/functions/webhook.js
exports.handler = async (event) => {
    const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1464305331965268131/AyQzXd2PcuOFL5ZDsrenIP7xKjo2RJI8tnWOmkWDEbAK3Fz78596uZidEwdWS3qdZkMn"; // Ganti ini

    const query = event.queryStringParameters || {};
    const code = query.code; // Kode unik dari user (misal: A1B2C)
    const amount = parseInt(query.amount);

    if (!code || !amount) {
        return { statusCode: 400, body: "Missing Code or Amount" };
    }

    try {
        // Format Rahasia ke Discord: ||TOKEN|KODE|JUMLAH||
        const payload = {
            content: `||TOKEN|${code}|${amount}||`
        };

        await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        return { statusCode: 200, body: "Sent" };

    } catch (err) {
        return { statusCode: 500, body: err.message };
    }
};
