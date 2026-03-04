/**
 * generate-scam-db.mjs
 * Uses Ollama (qwen2.5-coder:14b) to generate realistic Indian scam records,
 * then writes them directly into src/services/supabase.ts as LOCAL_SCAM_DB.
 *
 * Run: node scripts/generate-scam-db.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OLLAMA_URL = process.env.VITE_OLLAMA_URL || 'http://localhost:11434'
const MODEL = process.env.VITE_OLLAMA_MODEL || 'qwen2.5-coder:14b'
const OUT_FILE = path.resolve(__dirname, '../src/services/supabase.ts')

const PROMPT = `You are a cybersecurity database generator for India. Generate 30 realistic scam records.
Each record is a reported scam phone number or UPI ID from India.

Output ONLY a JSON array. No markdown, no explanation.

Rules:
- phone numbers must be Indian format: +91XXXXXXXXXX (use random but plausible numbers)
- upi_id must follow pattern name@bank (e.g. refund.sbi@ybl, kyc.hdfc@okaxis)
- Each record has EITHER phone OR upi_id (not both), the other is null
- scam_type must be one of: fake_bank_call | upi_phishing | investment_fraud | lottery_scam | qr_scam | job_fraud | aadhaar_fraud | insurance_fraud | electricity_scam | customs_scam
- description: 1-2 sentences, realistic, specific (mention bank name, amount, method)
- reports_count: random between 50 and 5000
- confidence_score: 85-99
- is_verified: true if reports_count > 500, else false
- reported_by: "community" | "ncrp" | "trai" | "cybercrime.gov.in"
- dates: between 2024-01-01 and 2026-03-01

Return this exact structure (array of 30 objects):
[
  {
    "id": "g1",
    "phone": "+91XXXXXXXXXX or null",
    "upi_id": "name@bank or null",
    "vpa": "same as upi_id or null",
    "scam_type": "...",
    "description": "...",
    "reports_count": 123,
    "confidence_score": 95,
    "first_reported": "YYYY-MM-DD",
    "last_reported": "YYYY-MM-DD",
    "is_verified": true,
    "reported_by": "community"
  }
]`

async function callOllama(prompt) {
  console.log(`Calling Ollama (${MODEL}) — this may take 30–60 seconds…`)
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.7, num_ctx: 8000, num_predict: 4000 },
    }),
  })
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)
  const json = await res.json()
  return json.response.trim()
}

function extractJSON(raw) {
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array found in Ollama response')
  return JSON.parse(match[0])
}

function sanitizeRecords(records) {
  return records.map((r, i) => ({
    id: `g${i + 1}`,
    phone: r.phone && r.phone !== 'null' ? r.phone : null,
    upi_id: r.upi_id && r.upi_id !== 'null' ? r.upi_id : null,
    vpa: r.vpa && r.vpa !== 'null' ? r.vpa : null,
    scam_type: r.scam_type || 'other',
    description: r.description || 'Reported scam.',
    reports_count: Number(r.reports_count) || 100,
    confidence_score: Number(r.confidence_score) || 90,
    first_reported: r.first_reported || '2025-01-01',
    last_reported: r.last_reported || '2026-03-01',
    is_verified: Boolean(r.is_verified),
    reported_by: r.reported_by || 'community',
  }))
}

function recordsToTS(records) {
  return records
    .map((r) => `  {
    id: '${r.id}',
    phone: ${r.phone ? `'${r.phone}'` : 'null'},
    upi_id: ${r.upi_id ? `'${r.upi_id}'` : 'null'},
    vpa: ${r.vpa ? `'${r.vpa}'` : 'null'},
    scam_type: '${r.scam_type}',
    description: '${r.description.replace(/'/g, "\\'")}',
    reports_count: ${r.reports_count},
    confidence_score: ${r.confidence_score},
    first_reported: '${r.first_reported}',
    last_reported: '${r.last_reported}',
    is_verified: ${r.is_verified},
    reported_by: '${r.reported_by}',
  }`)
    .join(',\n')
}

async function main() {
  // 1. Call Ollama
  const raw = await callOllama(PROMPT)
  console.log('Raw response received, parsing…')

  // 2. Parse and sanitize
  const records = sanitizeRecords(extractJSON(raw))
  console.log(`Generated ${records.length} scam records.`)

  // 3. Read current supabase.ts
  let source = fs.readFileSync(OUT_FILE, 'utf-8')

  // 4. Replace LOCAL_SCAM_DB content
  const newBlock = `export const LOCAL_SCAM_DB: ScamRecord[] = [\n${recordsToTS(records)},\n]`
  const replaced = source.replace(
    /export const LOCAL_SCAM_DB: ScamRecord\[\] = \[[\s\S]*?\n\]/,
    newBlock,
  )

  if (replaced === source) {
    console.error('Could not find LOCAL_SCAM_DB in supabase.ts — writing to scam-db-output.json instead')
    fs.writeFileSync('scam-db-output.json', JSON.stringify(records, null, 2))
    console.log('Saved to scam-db-output.json')
    return
  }

  // 5. Write back
  fs.writeFileSync(OUT_FILE, replaced, 'utf-8')
  console.log(`✓ Updated LOCAL_SCAM_DB in src/services/supabase.ts with ${records.length} records.`)

  // 6. Print SQL inserts for Supabase
  const sqlInserts = records
    .map((r) => {
      const phone = r.phone ? `'${r.phone}'` : 'NULL'
      const upi = r.upi_id ? `'${r.upi_id}'` : 'NULL'
      return `INSERT INTO scam_reports (phone, upi_id, scam_type, description, reports_count, confidence_score, first_reported, last_reported, is_verified, reported_by)
VALUES (${phone}, ${upi}, '${r.scam_type}', '${r.description.replace(/'/g, "''")}', ${r.reports_count}, ${r.confidence_score}, '${r.first_reported}', '${r.last_reported}', ${r.is_verified}, '${r.reported_by}')
ON CONFLICT DO NOTHING;`
    })
    .join('\n')

  const sqlFile = path.resolve(__dirname, '../scam-seed-generated.sql')
  fs.writeFileSync(sqlFile, sqlInserts)
  console.log(`✓ SQL inserts saved to scam-seed-generated.sql — run this in Supabase SQL Editor.`)
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
