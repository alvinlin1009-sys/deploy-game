import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const { level_id, password } = req.body || {};

        // 1. 驗證管理員密碼
        const adminPassword = process.env.ADMIN_PASSWORD || "alvin1234";

        if (!password || password !== adminPassword) {
            return res.status(401).json({ error: '管理員密碼錯誤！您無權刪除社群關卡。' });
        }

        if (!level_id) {
            return res.status(400).json({ error: '缺少關卡 ID 參數！' });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        // 優先使用 SERVICE_ROLE_KEY 以繞過 RLS 權限限制執行刪除，若無則降級使用 ANON_KEY
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return res.status(500).json({ error: 'Vercel 伺服器尚未設定 Supabase 環境變數！' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase.from('levels').delete().eq('id', parseInt(level_id)).select();

        if (error) {
            console.error("Supabase 刪除操作返回錯誤:", error);
            // 直接回傳字串，不再拋出異常，確保不會產生 Unhandled Rejection
            const errorMsg = error.message || error.details || error.hint || "未知的 Supabase 錯誤";
            return res.status(500).json({ error: `Supabase 刪除失敗: ${errorMsg}。請確認資料庫是否允許 DELETE 操作 (RLS)。` });
        }

        return res.status(200).json({ success: true, deleted: data });

    } catch (err) {
        console.error("Serverless Function 頂層捕捉到未預期錯誤:", err);
        return res.status(500).json({ error: `伺服器內部發生未預期崩潰: ${err.message || String(err)}` });
    }
}
