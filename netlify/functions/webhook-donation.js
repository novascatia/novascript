exports.handler = async (event) => {
    // 1. Ganti URL ini dengan Webhook ke channel discord PRIVATE (Admin Only)
    // Channel ini akan jadi "inbox" bot kamu.
    const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1464305331965268131/AyQzXd2PcuOFL5ZDsrenIP7xKjo2RJI8tnWOmkWDEbAK3Fz78596uZidEwdWS3qdZkMn";

    const query = event.queryStringParameters || {};
    const ign = query.ign;
    const amount = parseInt(query.amount);

    if (!ign || !amount) {
        return { statusCode: 400, body: "Missing Data" };
    }

    try {
        // Format Rahasia: ||SECRET|IGN|AMOUNT||
        // Bot Python akan membaca pola ini
        const payload = {
            content: `||SECRET|${ign}|${amount}||`
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
