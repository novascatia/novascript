exports.handler = async (event) => {
    // Masukkan URL Webhook Discord Channel PRIVATE kamu di sini
    const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1464305331965268131/AyQzXd2PcuOFL5ZDsrenIP7xKjo2RJI8tnWOmkWDEbAK3Fz78596uZidEwdWS3qdZkMn"; 

    const query = event.queryStringParameters || {};
    const code = query.code; // Membaca KODE (bukan IGN lagi)
    const amount = parseInt(query.amount);

    // Cek kelengkapan data
    if (!code || !amount) {
        return { 
            statusCode: 400, 
            body: "Error: Missing Code or Amount" 
        };
    }

    try {
        // Format Pesan ke Discord: ||TOKEN|KODE|JUMLAH||
        // Pesan ini nanti dibaca oleh Bot Python
        const payload = {
            content: `||TOKEN|${code}|${amount}||`
        };

        await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        return { statusCode: 200, body: "Success" };

    } catch (err) {
        return { statusCode: 500, body: err.message };
    }
};
