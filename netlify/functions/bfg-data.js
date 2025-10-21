// This function acts as the bridge between your in-game script and your Supabase database.
import { createClient } from '@supabase/supabase-js';

exports.handler = async function(event, context) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the world name from the URL (e.g., ?world=MYBFGWORLD)
    const world = event.queryStringParameters.world;

    if (!world) {
        return { statusCode: 400, body: JSON.stringify({ message: 'World name is required.' }) };
    }

    // --- HANDLE POST REQUEST (SAVING DATA FROM GAME TO WEBSITE) ---
    if (event.httpMethod === 'POST') {
        try {
            const slotsData = JSON.parse(event.body);
            
            // Prepare data for upserting (update if exists, insert if not)
            const dataToUpsert = slotsData.map((slot, index) => ({
                world_name: world,
                slot_id: index + 1, // Slot numbers are 1-based
                renter_name: slot.name,
                renter_userid: slot.userid,
                end_time: slot.endTime ? new Date(slot.endTime * 1000).toISOString() : null,
                is_offline: slot.isOffline,
                remaining_time_on_exit: slot.remainingTimeOnExit,
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('bfg_slots')
                .upsert(dataToUpsert, { onConflict: 'world_name, slot_id' });

            if (error) { throw error; }

            return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Data saved.' }) };

        } catch (error) {
            return { statusCode: 500, body: JSON.stringify({ success: false, message: error.message }) };
        }
    }

    // --- HANDLE GET REQUEST (LOADING DATA FROM WEBSITE TO GAME) ---
    if (event.httpMethod === 'GET') {
        try {
            const { data, error } = await supabase
                .from('bfg_slots')
                .select('*')
                .eq('world_name', world)
                .order('slot_id', { ascending: true });

            if (error) { throw error; }

            return { statusCode: 200, body: JSON.stringify({ success: true, slots: data }) };

        } catch (error) {
            return { statusCode: 500, body: JSON.stringify({ success: false, message: error.message }) };
        }
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
};
