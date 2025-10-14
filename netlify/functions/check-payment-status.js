// netlify/functions/check-payment-status.js
// Endpoint ini hanya membaca status transaksi dari database.
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

        // TIDAK ADA LOGIKA MOCKUP DI SINI, HANYA KEMBALIKAN STATUS DATABASE
        return {
            statusCode: 200,
            body: JSON.stringify({ status: transaction.status }),
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};