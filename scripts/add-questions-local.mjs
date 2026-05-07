// 本機加入題目到 questions.json
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const questionsPath = join(__dirname, '../data/questions.json');

// 把 Gemini 生成的題目放這裡
const newQuestions = [
  {
    grade: 'P5',
    subject: '中文',
    topic: '標點符號',
    type: 'FillBlank',
    question_text: '媽媽問我　你今天功課做完了嗎',
    options: null,
    answer: '媽媽問我：「你今天功課做完了嗎？」',
    explanation: '引述別人說話用冒號和引號，問句用問號'
  },
  {
    grade: 'P5',
    subject: '中文',
    topic: '重組句子',
    type: 'Rearrange',
    question_text: '請將以下詞語重組成通順的句子。',
    options: ['雖然', '下雨了', '但是', '我們', '還是', '要', '準時', '出發'],
    answer: '雖然下雨了，但是我們還是要準時出發。',
    explanation: '關聯詞「雖然...但是...」表示轉折關係'
  }
  // 繼續加更多題目...
];

function addQuestions() {
  try {
    // 讀取現有題目
    let existingQuestions = [];
    try {
      const content = readFileSync(questionsPath, 'utf-8');
      existingQuestions = JSON.parse(content);
    } catch (err) {
      console.log('⚠️  questions.json 不存在或為空，將建立新檔案');
    }

    // 找出最大 ID
    const maxId = existingQuestions.length > 0 
      ? Math.max(...existingQuestions.map(q => q.id || 0))
      : 0;

    // 為新題目分配 ID
    const questionsWithId = newQuestions.map((q, index) => ({
      id: maxId + index + 1,
      ...q
    }));

    // 合併並寫入
    const allQuestions = [...existingQuestions, ...questionsWithId];
    writeFileSync(questionsPath, JSON.stringify(allQuestions, null, 2), 'utf-8');

    console.log(`✅ 成功加入 ${questionsWithId.length} 題`);
    console.log(`📊 目前總共有 ${allQuestions.length} 題`);
    console.log(`🆔 新題目 ID: ${questionsWithId.map(q => q.id).join(', ')}`);
    
  } catch (error) {
    console.error('❌ 加入題目失敗:', error.message);
    process.exit(1);
  }
}

addQuestions();
