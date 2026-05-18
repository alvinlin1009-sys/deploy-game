import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { level_num, name, world, obstacles, password } = req.body;

    // 1. 驗證管理員密碼 (預設密碼為 alvin1234，或由 Vercel 環境變數 ADMIN_PASSWORD 設定)
    const adminPassword = process.env.ADMIN_PASSWORD || "alvin1234";

    if (!password || password !== adminPassword) {
        return res.status(401).json({ error: '管理員密碼錯誤！您無權發布官方主線關卡。' });
    }

    if (level_num === undefined || !name || !world || !obstacles) {
        return res.status(400).json({ error: '關卡參數不完整！' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Vercel 伺服器尚未設定 Supabase 環境變數！' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 使用 upsert 寫入或覆蓋主線關卡
        const { data, error } = await supabase.from('official_levels').upsert([
            { 
                level_num: parseInt(level_num), 
                name: name.trim(), 
                world, 
                obstacles,
                updated_at: new Date().toISOString()
            }
        ], { onConflict: 'level_num' }).select();

        if (error) throw error;

        return res.status(200).json({ success: true, data: data[0] });
    } catch (error) {
        console.error("發布主線關卡失敗:", error);
        return res.status(500).json({ error: '寫入資料庫失敗: ' + (error.message || JSON.stringify(error)) });
    }
}
