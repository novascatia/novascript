// netlify/functions/create-qris-transaction.js
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

// Service Role Key untuk menyimpan transaksi dengan aman
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Midtrans Environment Variables
const MIDTRANS_SERVER_KEY_B64 = process.env.MIDTRANS_SERVER_KEY_B64; 
const MIDTRANS_API_BASE_URL = process.env.MIDTRANS_API_BASE_URL;

function generatePaymentGatewayId() {
    return `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { tierId, userId, amount, tierName } = JSON.parse(event.body);
        if (!tierId || !userId || typeof amount !== 'number') {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields (tierId, userId, amount).' }) };
        }
        
        // Dapatkan detail user dari Supabase Auth
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        
        const userEmail = user ? user.email : 'customer-mock@novascripts.com';
        const userName = user ? user.email.split('@')[0] : 'Nova Customer';


        // 1. PANGGIL MIDTRANS SNAP
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
                email: userEmail, // MENGGUNAKAN EMAIL USER
                first_name: userName, // MENGGUNAKAN NAMA USER
            },
            credit_card: {
                secure: true
            },
        };

        // Debugging Midtrans Call (HARAP PERIKSA LOG INI DI NETLIFY)
        console.log('Midtrans Payload:', midtransOrderPayload);
        
        const midtransResponse = await fetch(`${MIDTRANS_API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': MIDTRANS_SERVER_KEY_B64, 
            },
            body: JSON.stringify(midtransOrderPayload)
        });

        const midtransResult = await midtransResponse.json();
        
        if (midtransResponse.status !== 201) {
            // MENGEMBALIKAN ERROR MIDTRANS YANG LEBIH JELAS
            const midtransError = `Midtrans Error: ${midtransResponse.status} - ${midtransResult.status_message || midtransResult.error_messages.join(', ')}`;
            console.error(midtransError, midtransResult); 
            
            return { statusCode: 500, body: JSON.stringify({ error: midtransError }) };
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
            return { statusCode: 500, body: JSON.stringify({ error: 'Failed to record transaction in database: ' + insertError.message }) };
        }

        // 3. KIRIM RESPON KE FRONTEND
        return {
            statusCode: 200,
            body: JSON.stringify({
                transactionId: transaction.id, 
                snapToken: snapToken, 
                message: 'Transaction created successfully. Ready for payment via Snap.'
            }),
        };

    } catch (error) {
        console.error('General Transaction Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: `General Error: ${error.message}` }) };
    }
};