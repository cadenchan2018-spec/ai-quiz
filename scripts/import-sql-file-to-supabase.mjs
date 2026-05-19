import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error('用法: node scripts/import-sql-file-to-supabase.mjs <sql-file-path>');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 環境變數');
  process.exit(1);
}

function sanitizeUrl(u) {
  return String(u || '').trim().replace(/\/+$/, '');
}

function explainFetchError(err, stage) {
  const msg = err?.message || String(err);
  const cause = err?.cause ? ` | cause: ${err.cause.message || String(err.cause)}` : '';
  console.error(`${stage} 失敗: ${msg}${cause}`);
}

const normalizedUrl = sanitizeUrl(url);

async function connectivityCheck() {
  const endpoint = `${normalizedUrl}/rest/v1/`;
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    if (!res.ok && res.status !== 404) {
      const body = await res.text();
      console.error(`連線檢查異常: HTTP ${res.status} ${body.slice(0, 200)}`);
      process.exit(1);
    }
    console.log(`連線檢查通過: ${endpoint}`);
  } catch (err) {
    explainFetchError(err, '連線檢查');
    console.error('請檢查：1) SUPABASE_URL 是否正確 2) 網絡/代理/VPN 3) 防火牆');
    process.exit(1);
  }
}

const sql = readFileSync(sqlPath, 'utf8');
const valuesIdx = sql.indexOf('VALUES');
if (valuesIdx === -1) {
  console.error('SQL 檔找不到 VALUES 區段');
  process.exit(1);
}

function unquoteSqlString(s) {
  if (s === 'NULL') return null;
  if (s.length >= 2 && s[0] === "'" && s[s.length - 1] === "'") {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  return s;
}

function splitTopLevelByComma(content) {
  const parts = [];
  let buf = '';
  let inStr = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === "'") {
      if (inStr && content[i + 1] === "'") {
        buf += "''";
        i++;
        continue;
      }
      inStr = !inStr;
      buf += ch;
      continue;
    }
    if (ch === ',' && !inStr) {
      parts.push(buf.trim());
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

function parseTuples(valuesText) {
  const tuples = [];
  let i = 0;
  while (i < valuesText.length) {
    if (valuesText[i] !== '(') {
      i++;
      continue;
    }
    let depth = 0;
    let inStr = false;
    let start = i;
    let end = -1;
    for (; i < valuesText.length; i++) {
      const ch = valuesText[i];
      if (ch === "'") {
        if (inStr && valuesText[i + 1] === "'") {
          i++;
          continue;
        }
        inStr = !inStr;
      }
      if (!inStr) {
        if (ch === '(') depth++;
        if (ch === ')') {
          depth--;
          if (depth === 0) {
            end = i;
            i++;
            break;
          }
        }
      }
    }
    if (end !== -1) tuples.push(valuesText.slice(start + 1, end));
  }
  return tuples;
}

const valuesText = sql.slice(valuesIdx + 'VALUES'.length);
const tupleTexts = parseTuples(valuesText);
const rows = tupleTexts.map((tupleText) => {
  const cols = splitTopLevelByComma(tupleText);
  if (cols.length < 8) {
    throw new Error(`欄位數不足: ${tupleText.slice(0, 80)}...`);
  }
  const [grade, subject, topic, type, question_text, options, answer, explanation] = cols;
  return {
    grade: unquoteSqlString(grade),
    subject: unquoteSqlString(subject),
    topic: unquoteSqlString(topic),
    type: unquoteSqlString(type),
    question_text: unquoteSqlString(question_text),
    options: unquoteSqlString(options),
    answer: unquoteSqlString(answer),
    explanation: unquoteSqlString(explanation),
  };
});

await connectivityCheck();

const db = createClient(normalizedUrl, key);

function rowKey(r) {
  return [r.grade, r.subject, r.topic, r.type, r.question_text].join('||');
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// 防重複策略：同一 grade+subject+topic+type+question_text 視為同一題
const existingKeySet = new Set();
const byScope = new Map();
for (const r of rows) {
  const scope = [r.grade, r.subject, r.topic, r.type].join('||');
  if (!byScope.has(scope)) byScope.set(scope, new Set());
  byScope.get(scope).add(r.question_text);
}

for (const [scope, questionTextSet] of byScope.entries()) {
  const [grade, subject, topic, type] = scope.split('||');
  const { data, error } = await db
    .from('questions')
    .select('grade, subject, topic, type, question_text')
    .eq('grade', grade)
    .eq('subject', subject)
    .eq('topic', topic)
    .eq('type', type)
    .limit(5000);
  if (error) {
    explainFetchError(error, '查重');
    process.exit(1);
  }
  for (const x of data || []) existingKeySet.add(rowKey(x));
}

const uniqueRows = [];
const seenInBatch = new Set();
for (const r of rows) {
  const k = rowKey(r);
  if (existingKeySet.has(k)) continue;
  if (seenInBatch.has(k)) continue;
  seenInBatch.add(k);
  uniqueRows.push(r);
}

if (uniqueRows.length === 0) {
  console.log(`全部題目已存在，跳過插入。總題數 ${rows.length}，重複 ${rows.length}`);
  process.exit(0);
}

const { data, error } = await db.from('questions').insert(uniqueRows).select('id');
if (error) {
  explainFetchError(error, '插入');
  process.exit(1);
}

const inserted = data?.length || uniqueRows.length;
const duplicated = rows.length - uniqueRows.length;
console.log(`成功插入 ${inserted} 題；跳過重複 ${duplicated} 題`);
