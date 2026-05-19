-- 刪除 S3 歷史｜課題10 冷戰的背景與成因｜短問答
-- 在 Supabase Dashboard > SQL Editor 執行

DELETE FROM questions
WHERE grade = 'S3'
  AND subject = '歷史'
  AND topic = '課題10 冷戰的背景與成因 - 短問答'
  AND type = 'ShortAnswer';

-- 檢查刪除後數量（應為 0）
SELECT topic, type, COUNT(*) AS total
FROM questions
WHERE grade = 'S3'
  AND subject = '歷史'
  AND topic = '課題10 冷戰的背景與成因 - 短問答'
GROUP BY topic, type;
