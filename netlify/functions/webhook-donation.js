// Hapus dependency supabase, kita pakai fetch bawaan (Node 18+)
exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    const query = event.queryStringParameters || {};
    const ign = query.ign;
    const amount = parseInt(query.amount);
    
    // GANTI INI DENGAN URL WEBHOOK DISCORD KAMU (Channel khusus logs/topup)
    const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL; 

    if (!ign || !amount) {
        return { statusCode: 400, headers, body: "Missing Data" };
    }

    try {
        // Kirim data ke Discord Webhook
        // Kita kirim format teks tersembunyi agar mudah diparsing bot: ||IGN:nama|AMOUNT:100||
        const payload = {
            username: "NovaScript Gateway",
            // Pesan ini yang akan dibaca oleh Bot Python
            content: `||DATA_PACKET|${ign}|${amount}||`, 
            embeds: [{
                title: "💸 Incoming Donation",
                description: `**IGN:** ${ign}\n**Amount:** ${amount} BGL`,
                color: 5763719,
                timestamp: new Date().toISOString()
            }]
        };

        await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status: "Sent to Discord" })
        };

    } catch (err) {
        return { statusCode: 500, headers, body: err.message };
    }
};
