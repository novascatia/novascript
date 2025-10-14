// netlify/functions/create-qris-transaction.js
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch'); // Perlu node-fetch (pastikan di package.json)

// Service Role Key untuk menyimpan transaksi dengan aman
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Midtrans Environment Variables (Harus diatur di Netlify)
// GANTI nama environment variable sesuai yang Anda atur!
const MIDTRANS_SERVER_KEY_B64 = process.env.MIDTRANS_SERVER_KEY_B64; // Basic [Base64(Server_Key:)]
const MIDTRANS_API_BASE_URL = process.env.MIDTRANS_API_BASE_URL; // e.g., https://app.sandbox.midtrans.com/snap/v1

// --- PENGGANTI MOCKUP ---
function generatePaymentGatewayId() {
    return `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}
// -------------------------

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { tierId, userId, amount, tierName } = JSON.parse(event.body);
        if (!tierId || !userId || typeof amount !== 'number') {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields (tierId, userId, amount).' }) };
        }

        // 1. SIAPKAN TRANSAKSI DAN PANGGIL MIDTRANS SNAP
        const paymentGatewayId = generatePaymentGatewayId();

        const midtransOrderPayload = {
            transaction_details: {
                order_id: paymentGatewayId,
                gross_amount: amount,
            },
            item_details: [{
                id: tierId,
                price: amount,
                quantity: 1,
                name: tierName,
            }],
            customer_details: {
                // DI DUNIA NYATA, ISI DENGAN EMAIL USER DARI SUPABASE
                email: 'customer@example.com', 
                first_name: 'Nova',
            },
            credit_card: {
                secure: true
            },
        };
        
        const midtransResponse = await fetch(`${MIDTRANS_API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                // Authorization HARUS menggunakan Basic Auth Base64(ServerKey:)
                'Authorization': MIDTRANS_SERVER_KEY_B64, 
            },
            body: JSON.stringify(midtransOrderPayload)
        });

        const midtransResult = await midtransResponse.json();
        
        if (midtransResponse.status !== 201) {
            console.error('Midtrans API Error:', midtransResult);
            return { statusCode: 500, body: JSON.stringify({ error: `Midtrans Error: ${midtransResult.status_code || 'API'} - ${midtransResult.status_message || 'Failed to create Snap token.'}` }) };
        }
        
        const snapToken = midtransResult.token;

        // 2. SIMPAN TRANSAKSI KE SUPABASE
        const { data: transaction, error: insertError } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                tier_id: tierId,
                amount: amount,
                payment_gateway_id: paymentGatewayId, // ID Transaksi Midtrans
                status: 'PENDING',
            })
            .select('*')
            .single();

        if (insertError) {
            console.error('Supabase Insert Error:', insertError);
            return { statusCode: 500, body: JSON.stringify({ error: 'Failed to record transaction in database.' }) };
        }

        // 3. KIRIM RESPON KE FRONTEND (Snap Token)
        return {
            statusCode: 200,
            body: JSON.stringify({
                transactionId: transaction.id, 
                snapToken: snapToken, // Snap Token Midtrans
                message: 'Transaction created successfully. Ready for payment via Snap.'
            }),
        };

    } catch (error) {
        console.error('General Transaction Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};