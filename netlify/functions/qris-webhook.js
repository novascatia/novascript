// netlify/functions/qris-webhook.js
// Webhook yang dipanggil Midtrans/Xendit saat pembayaran SUKSES.
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Service Role Key untuk operasi INSERT dan UPDATE yang aman
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- MOCKUP: Fungsi untuk membuat Key baru ---
async function createNewKey(userId, tierId) {
    // 1. Ambil detail durasi dari Tier Harga
    const { data: tier, error: tierError } = await supabase
        .from('pricing_tiers')
        .select('duration_seconds, name')
        .eq('id', tierId)
        .single();
        
    if (tierError || !tier) { throw new Error("Tier not found or Tier DB error."); }

    // 2. Generate Key - PERUBAHAN PREFIX
    const keyToInsert = `NOVA-${crypto.randomBytes(6).toString('hex').toUpperCase()}`; // Prefix diubah ke NOVA-
    
    const { data: newKey, error: keyError } = await supabase
        .from('script_keys')
        .insert({ 
            key_value: keyToInsert, 
            user_id: userId,
            duration: tier.duration_seconds,
            note: `QRIS Purchase: ${tier.name}`,
            is_active: true
        })
        .select('id')
        .single();

    if (keyError) { throw keyError; }
    return newKey.id;
}
// ---------------------------------------------

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const payload = JSON.parse(event.body);

        // 1. VERIFIKASI SIGNATURE (KRITIS UNTUK KEAMANAN)
        // --- MOCKUP START ---
        // Di implementasi nyata, Anda akan memverifikasi header X-Midtrans-Signature atau X-Callback-Token Xendit
        // Midtrans_Server_Key = process.env.MIDTRANS_SERVER_KEY;
        const isSignatureValid = true; // SIMULASI: Anggap valid
        
        if (!isSignatureValid) {
            return { statusCode: 401, body: 'Invalid Signature' };
        }

        // 2. IDENTIFIKASI TRANSAKSI SUKSES (Asumsi payload berisi ID transaksi dari Payment Gateway)
        const paymentGatewayId = payload.paymentGatewayId || payload.order_id; // Sesuaikan dengan payload PG
        const isPaymentSuccess = payload.status === 'success' || payload.transaction_status === 'settlement'; // Sesuaikan dengan payload PG
        
        // 3. UPDATE DATABASE & GENERATE KEY
        if (isPaymentSuccess) {
            // Ambil data transaksi Supabase yang terkait
            const { data: transaction, error: fetchError } = await supabase
                .from('transactions')
                .select('id, user_id, tier_id')
                .eq('payment_gateway_id', paymentGatewayId)
                .single();

            if (fetchError || !transaction) {
                 return { statusCode: 404, body: 'Transaction not found in database.' };
            }
            
            // Generate Key Baru
            const keyId = await createNewKey(transaction.user_id, transaction.tier_id);
            
            // Tandai Transaksi sebagai PAID dan catat Key ID yang dibuat
            const { error: updateError } = await supabase
                .from('transactions')
                .update({ status: 'PAID', key_generated_id: keyId })
                .eq('id', transaction.id);

            if (updateError) { throw updateError; }

            return { statusCode: 200, body: 'Success: Payment recorded and key generated.' };
            
        } else if (payload.transaction_status === 'expire' || payload.status === 'failure') {
             // Tandai Transaksi sebagai FAILED/EXPIRED
             await supabase.from('transactions').update({ status: 'EXPIRED' }).eq('payment_gateway_id', paymentGatewayId);
             return { statusCode: 200, body: 'Success: Transaction marked as EXPIRED/FAILED.' };
        }


        return { statusCode: 200, body: 'Success: Received webhook but no action taken.' };

    } catch (error) {
        console.error('Webhook processing error:', error);
        // Penting: Kembalikan 500 agar Midtrans/Xendit mencoba lagi (retry)
        return { statusCode: 500, body: `Server Error: ${error.message}` };
    }
};