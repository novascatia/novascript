const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    const { productId, customerEmail } = JSON.parse(event.body);
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // 1. Ambil data produk
    const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();

    // 2. Buat kode unik (3 digit terakhir acak)
    const uniqueCode = Math.floor(Math.random() * 900) + 100;
    const finalAmount = parseInt(product.price) + uniqueCode;
    const orderId = `ORDER-${Date.now()}`;

    // 3. Simpan pesanan sebagai 'pending'
    await supabase.from('orders').insert([{
        order_id: orderId,
        product_id: productId,
        customer_email: customerEmail,
        amount: finalAmount,
        status: 'pending'
    }]);

    return {
        statusCode: 200,
        body: JSON.stringify({ 
            orderId, 
            finalAmount, 
            qrisUrl: "URL_GAMBAR_QRIS_DANA_BISNIS_KAMU" 
        })
    };
};
