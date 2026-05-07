import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zasjttnsvqebepszpfua.supabase.co';
// 你需要用 service_role key 才有寫入權限，在 Supabase Dashboard > Settings > API 找到
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE';

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 把 Gemini 生成的題目放這裡
const questions = [
  {
    grade: 'P5',
    subject: '中文',
    topic: '標點符號',
    type: 'FillBlank',
    question_text: '今天天氣真好　我們一起去公園玩吧',
    answer: '今天天氣真好！我們一起去公園玩吧。',
    explanation: '感嘆句用驚嘆號，陳述句用句號'
  },
  {
    grade: 'P5',
    subject: '中文',
    topic: '標點符號',
    type: 'FillBlank',
    question_text: '你喜歡吃蘋果　還是橙',
    answer: '你喜歡吃蘋果，還是橙？',
    explanation: '選擇問句用逗號分隔，結尾用問號'
  },
  // 繼續加更多題目...
];

async function importQuestions() {
  console.log(`準備匯入 ${questions.length} 題...`);
  
  const { data, error } = await db
    .from('questions')
    .insert(questions)
    .select();
  
  if (error) {
    console.error('匯入失敗:', error);
    process.exit(1);
  }
  
  console.log(`✅ 成功匯入 ${data.length} 題`);
  console.log('題目 ID:', data.map(q => q.id).join(', '));
}

importQuestions();
