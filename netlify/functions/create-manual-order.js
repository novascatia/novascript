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
            qrisUrl: "https://media.discordapp.net/attachments/1408185563944718438/1453987119780462683/qr_ID1025376739336_26.12.25_176672247_1766722476960.jpg?ex=696f1687&is=696dc507&hm=ebfef12a286f2ae9b01df0917257524d54626302054d232ac5d8f88bf3d560ea&=&format=webp&width=639&height=900" 
        })
    };
};
