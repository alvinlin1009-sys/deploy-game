import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const { name, creator, campaignData } = req.body || {};

        if (!name || !campaignData || !Array.isArray(campaignData) || campaignData.length === 0) {
            return res.status(400).json({ error: '關卡包資料不完整！必須包含名稱以及至少一個關卡。' });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        // 使用 ANON_KEY 即可，因為這是一般社群上傳 (如果設定了 RLS 允許 Insert)
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return res.status(500).json({ error: 'Vercel 伺服器尚未設定 Supabase 環境變數！' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase.from('community_campaigns').insert([
            {
                name: name.trim(),
                creator: (creator || '神秘旅人').trim(),
                levels: campaignData
            }
        ]).select();

        if (error) {
            console.error("Supabase 寫入關卡包錯誤:", error);
            const errorMsg = error.message || error.details || error.hint || "未知的 Supabase 錯誤";
            return res.status(500).json({ error: `Supabase 寫入失敗: ${errorMsg}` });
        }

        return res.status(200).json({ success: true, data: data[0] });

    } catch (err) {
        console.error("Serverless Function 頂層捕捉到未預期錯誤:", err);
        return res.status(500).json({ error: `伺服器內部發生未預期崩潰: ${err.message || String(err)}` });
    }
}
