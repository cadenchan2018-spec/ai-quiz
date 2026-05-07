# 本機版題庫使用說明

## 方法 1：直接編輯 JSON 檔案

最簡單的方法，直接打開 `data/questions.json` 用文字編輯器加入題目：

```json
[
  {
    "id": 1,
    "grade": "P5",
    "subject": "中文",
    "topic": "標點符號",
    "type": "FillBlank",
    "question_text": "題目內容",
    "options": null,
    "answer": "答案",
    "explanation": "解析"
  }
]
```

## 方法 2：用 Script 批量加入

1. 打開 `scripts/add-questions-local.mjs`
2. 把 Gemini 生成的題目填入 `newQuestions` 陣列
3. 執行：
   ```powershell
   node scripts/add-questions-local.mjs
   ```

## 題目格式

### 填充題 (FillBlank)
```javascript
{
  grade: 'P5',
  subject: '中文',
  topic: '標點符號',
  type: 'FillBlank',
  question_text: '今天天氣真好　我們一起去公園玩吧',
  options: null,
  answer: '今天天氣真好！我們一起去公園玩吧。',
  explanation: '感嘆句用驚嘆號'
}
```

### 選擇題 (MC)
```javascript
{
  grade: 'P5',
  subject: '中文',
  topic: '詞語辨析',
  type: 'MC',
  question_text: '下列哪個詞語的意思是「非常高興」？',
  options: ['興高采烈', '垂頭喪氣', '心灰意冷', '愁眉苦臉'],
  answer: 'A',
  explanation: '興高采烈形容非常高興的樣子'
}
```

### 重組句子 (Rearrange)
```javascript
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
```

## 注意事項

- `id` 必須唯一，用 script 會自動分配
- `options` 如果不需要就填 `null`
- 重組句子必須有 8 個或以上詞語才會被抽入試卷
- 直接編輯 JSON 要注意格式正確（逗號、引號）

## S3 中史課題結構

- 已加入：`data/s3-chinese-history-topic-map.json`
- 書名：`歷史旅程 新課題系列 3上`
- 可配合：`scripts/insert-s3-chinese-history.sql` 逐個 TOPIC 匯入題目
