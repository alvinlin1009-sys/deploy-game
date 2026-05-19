import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { level_id, password } = req.body;

    // 1. 驗證管理員密碼
    const adminPassword = process.env.ADMIN_PASSWORD || "alvin1234";

    if (!password || password !== adminPassword) {
        return res.status(401).json({ error: '管理員密碼錯誤！您無權刪除社群關卡。' });
    }

    if (!level_id) {
        return res.status(400).json({ error: '缺少關卡 ID 參數！' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Vercel 伺服器尚未設定 Supabase 環境變數！' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data, error } = await supabase.from('levels').delete().eq('id', parseInt(level_id)).select();

        if (error) throw error;

        return res.status(200).json({ success: true, deleted: data });
    } catch (error) {
        console.error("刪除社群關卡失敗:", error);
        return res.status(500).json({ error: '刪除資料庫紀錄失敗: ' + (error.message || JSON.stringify(error)) });
    }
}
