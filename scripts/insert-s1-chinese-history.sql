-- 加入 S1 中史題目到 Supabase（選擇題和填充題分開）
-- 在 Supabase Dashboard > SQL Editor 執行這段 SQL

INSERT INTO questions (grade, subject, topic, type, question_text, options, answer, explanation)
VALUES
  -- 春秋戰國 - 選擇題
  (
    'S1',
    '中史',
    '春秋戰國 - 選擇題',
    'MC',
    '「百家爭鳴」出現在哪個時期？',
    '["夏商周", "春秋戰國", "秦漢", "魏晉南北朝"]',
    'B',
    '春秋戰國時期思想活躍，出現百家爭鳴'
  ),
  (
    'S1',
    '中史',
    '春秋戰國 - 選擇題',
    'MC',
    '戰國七雄不包括以下哪個國家？',
    '["齊", "楚", "燕", "吳"]',
    'D',
    '戰國七雄是齊楚燕韓趙魏秦，不包括吳國'
  ),
  (
    'S1',
    '中史',
    '春秋戰國 - 選擇題',
    'MC',
    '商鞅變法發生在哪個國家？',
    '["齊國", "楚國", "秦國", "趙國"]',
    'C',
    '商鞅在秦國實行變法，使秦國強大'
  ),
  
  -- 春秋戰國 - 填充題
  (
    'S1',
    '中史',
    '春秋戰國 - 填充題',
    'FillBlank',
    '春秋五霸中，第一位稱霸的是（　　　）。',
    NULL,
    '齊桓公',
    '齊桓公是春秋五霸之首'
  ),
  (
    'S1',
    '中史',
    '春秋戰國 - 填充題',
    'FillBlank',
    '孔子是（　　　）學派的創始人。',
    NULL,
    '儒家',
    '孔子創立儒家學派'
  ),
  
  -- 秦漢 - 填充題
  (
    'S1',
    '中史',
    '秦漢 - 填充題',
    'FillBlank',
    '秦始皇統一中國後，統一了文字、貨幣和（　　　）。',
    NULL,
    '度量衡',
    '秦始皇統一了文字、貨幣和度量衡'
  );

-- 執行後可以用這句檢查
SELECT id, grade, subject, topic, type, question_text, answer
FROM questions
WHERE grade = 'S1' AND subject = '中史'
ORDER BY topic, id;
