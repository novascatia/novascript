// netlify/functions/create-qris-transaction.js
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid'); // Perlu library uuid

// Service Role Key untuk menyimpan transaksi dengan aman
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- MOCKUP: ID Midtrans/Xendit ---
function generatePaymentGatewayId() {
    return `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}
// ------------------------------------

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { tierId, userId, amount, tierName } = JSON.parse(event.body);
        if (!tierId || !userId || typeof amount !== 'number') {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields (tierId, userId, amount).' }) };
        }

        // 1. PANGGIL API PAYMENT GATEWAY (MIDTRANS/XENDIT)
        // --- MOCKUP START ---
        const paymentGatewayId = generatePaymentGatewayId();
        const qrisImageBase64 = 'https://placehold.co/300x300/1e3a8a/ffffff?text=QRIS+Mockup';
        // --- MOCKUP END ---

        // 2. SIMPAN TRANSAKSI KE SUPABASE
        const { data: transaction, error: insertError } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                tier_id: tierId,
                amount: amount,
                payment_gateway_id: paymentGatewayId, // ID dari PG
                status: 'PENDING',
                // Simpan data QRIS atau token Midtrans Snap di sini jika perlu
            })
            .select('*')
            .single();

        if (insertError) {
            console.error('Supabase Insert Error:', insertError);
            return { statusCode: 500, body: JSON.stringify({ error: 'Failed to record transaction in database.' }) };
        }

        // 3. KIRIM RESPON KE FRONTEND
        return {
            statusCode: 200,
            body: JSON.stringify({
                transactionId: transaction.id, // ID transaksi Supabase
                paymentGatewayId: paymentGatewayId,
                amount: amount,
                qrisImage: qrisImageBase64, // URL gambar QRIS
                message: 'Transaction created successfully. Awaiting payment.'
            }),
        };

    } catch (error) {
        console.error('General Transaction Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
