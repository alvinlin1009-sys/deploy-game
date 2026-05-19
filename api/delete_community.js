const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
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
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Vercel 伺服器尚未設定 Supabase 環境變數！' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data, error } = await supabase.from('levels').delete().eq('id', parseInt(level_id)).select();

        if (error) {
            console.error("Supabase 刪除操作返回錯誤:", error);
            throw error;
        }

        return res.status(200).json({ success: true, deleted: data });
    } catch (error) {
        console.error("刪除社群關卡失敗:", error);
        const safeErrorMessage = error.message || error.details || error.hint || String(error) || "未知的資料庫錯誤";
        return res.status(500).json({ error: `資料庫刪除失敗 (${safeErrorMessage})。請確認 Supabase 中 levels 資料表是否允許 DELETE 操作或配置了正確的 RLS 策略。` });
    }
};
