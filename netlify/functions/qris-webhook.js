// netlify/functions/qris-webhook.js
// Webhook yang dipanggil Midtrans/Xendit saat pembayaran SUKSES.
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Service Role Key untuk operasi INSERT dan UPDATE yang aman
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Midtrans Server Key (Diperlukan untuk verifikasi signature)
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY; 

// --- FUNGSI: Untuk membuat Key baru (PREFIX NOVA-) ---
async function createNewKey(userId, tierId) {
    // 1. Ambil detail durasi dari Tier Harga
    const { data: tier, error: tierError } = await supabase
        .from('pricing_tiers')
        .select('duration_seconds, name')
        .eq('id', tierId)
        .single();
        
    if (tierError || !tier) { throw new Error("Tier not found or Tier DB error."); }

    // 2. Generate Key - PERUBAHAN PREFIX (NOVA-)
    const keyToInsert = `NOVA-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    
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

        // 1. VERIFIKASI SIGNATURE (GANTI MOCKUP)
        const midtransSignature = event.headers['x-midtrans-signature']; 
        const { order_id, status_code, gross_amount } = payload;
        
        // Logika verifikasi Midtrans
        const signatureString = order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY;
        const expectedSignature = crypto.createHash('sha512').update(signatureString).digest('hex');

        if (midtransSignature !== expectedSignature) {
            console.error('Invalid Midtrans Signature:', midtransSignature);
            return { statusCode: 401, body: 'Invalid Signature' };
        }
        
        // 2. IDENTIFIKASI STATUS MIDTRANS
        const paymentGatewayId = payload.order_id;
        const transactionStatus = payload.transaction_status;
        const fraudStatus = payload.fraud_status;
        
        // 3. UPDATE DATABASE & GENERATE KEY
        if (transactionStatus === 'settlement' && fraudStatus === 'accept') {
            // Ambil data transaksi Supabase yang terkait
            const { data: transaction, error: fetchError } = await supabase
                .from('transactions')
                .select('id, user_id, tier_id, status')
                .eq('payment_gateway_id', paymentGatewayId)
                .single();

            if (fetchError || !transaction) {
                 return { statusCode: 404, body: 'Transaction not found in database.' };
            }
            
            // CEK DOUBLE WEBHOOKS (Idempotency)
            if (transaction.status === 'PAID') {
                return { statusCode: 200, body: 'Success: Already processed.' };
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
            
        } else if (transactionStatus === 'expire' || transactionStatus === 'cancel' || transactionStatus === 'deny') {
             // Tandai Transaksi sebagai FAILED/EXPIRED
             await supabase.from('transactions').update({ status: transactionStatus.toUpperCase() }).eq('payment_gateway_id', paymentGatewayId);
             return { statusCode: 200, body: `Success: Transaction marked as ${transactionStatus.toUpperCase()}.` };
        }


        return { statusCode: 200, body: 'Success: Received webhook but no action taken.' };

    } catch (error) {
        console.error('Webhook processing error:', error);
        return { statusCode: 500, body: `Server Error: ${error.message}` };
    }
};