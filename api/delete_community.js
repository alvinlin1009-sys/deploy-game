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
    // 優先使用 SERVICE_ROLE_KEY 以繞過 RLS 權限限制執行刪除，若無則降級使用 ANON_KEY
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
        // 安全提取錯誤訊息，避免 JSON.stringify(error) 發生循環參考崩潰導致 Vercel 回傳 500 純文字
        const safeErrorMessage = error.message || error.details || error.hint || String(error) || "未知的資料庫錯誤";
        return res.status(500).json({ error: `資料庫刪除失敗 (${safeErrorMessage})。請確認 Supabase 中 levels 資料表是否允許 DELETE 操作或配置了正確的 RLS 策略。` });
    }
}
