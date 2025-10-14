// netlify/functions/check-payment-status.js
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event) => {
    const transactionId = event.queryStringParameters.id;

    if (!transactionId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Transaction ID is required.' }) };
    }

    try {
        const { data: transaction, error } = await supabase
            .from('transactions')
            .select('status')
            .eq('id', transactionId)
            .single();

        if (error || !transaction) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Transaction not found.' }) };
        }

        // --- MOCKUP LOGIC: Simulasikan pembayaran sukses setelah 15 detik ---
        // DI IMPLEMENTASI NYATA, HANYA KEMBALIKAN STATUS DARI DATABASE!
        if (transaction.status === 'PENDING') {
            const timeElapsed = (Date.now() - new Date(transaction.created_at).getTime()) / 1000;
            if (timeElapsed > 15 && transaction.payment_gateway_id === 'simulated_paid') { // Contoh kondisi simulasi
                 // Ini harus ditangani oleh Webhook, tapi ini hanya untuk demo
                 // Di sini seharusnya: return { status: 'PENDING' };
                 // Kita akan kembalikan PAID jika Webhook berhasil dijalankan
            }
        }
        // --- END MOCKUP LOGIC ---

        return {
            statusCode: 200,
            body: JSON.stringify({ status: transaction.status }),
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
