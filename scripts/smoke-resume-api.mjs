const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function buildPdfBuffer() {
  const stream = ['BT', '/F1 18 Tf', '72 96 Td', '(Resume Smoke Test) Tj', 'ET'].join('\n')

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += object
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += 'xref\n'
  pdf += `0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }

  pdf += 'trailer\n'
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdf += 'startxref\n'
  pdf += `${xrefOffset}\n`
  pdf += '%%EOF'

  return Buffer.from(pdf, 'utf8')
}

async function smokeTailor() {
  const response = await fetch(`${baseUrl}/api/resume/tailor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText: 'Ayaan built user-facing web apps, improved product metrics, and shipped React and Next.js features.',
      jobTitle: 'Frontend Engineer',
      company: 'Catalyst',
      jobDescription: 'Looking for a frontend engineer with React, Next.js, TypeScript, and product thinking.',
    }),
  })

  const raw = await response.text()
  // #region agent log
  fetch('http://127.0.0.1:7911/ingest/7eddeae9-2d54-42cf-b0ee-90c4a8dac34b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8553cd'},body:JSON.stringify({sessionId:'8553cd',runId:'gemini-key-check',hypothesisId:'H5',location:'scripts/smoke-resume-api.mjs:61',message:'Smoke tailor response',data:{status:response.status,contentType:response.headers.get('content-type'),aiModel:response.headers.get('x-ai-model'),bodySnippet:raw.slice(0,200)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const payload = JSON.parse(raw)
  assert(response.ok, `Resume tailor failed: ${JSON.stringify(payload)}`)
  assert(typeof payload.tailoredResume === 'string' && payload.tailoredResume.length > 0, 'Tailor response missing tailoredResume')
  assert(['gemma-4-31b-it', 'gemma-4-26b-a4b-it'].includes(response.headers.get('x-ai-model') || ''), 'Tailor response did not use an approved Gemma model')

  console.log('Tailor smoke passed with model:', response.headers.get('x-ai-model'))
}

async function smokePdfParse() {
  const formData = new FormData()
  formData.append(
    'file',
    new Blob([buildPdfBuffer()], { type: 'application/pdf' }),
    'smoke-test-resume.pdf'
  )

  const response = await fetch(`${baseUrl}/api/resume/parse-pdf`, {
    method: 'POST',
    body: formData,
  })

  const raw = await response.text()
  // #region agent log
  fetch('http://127.0.0.1:7911/ingest/7eddeae9-2d54-42cf-b0ee-90c4a8dac34b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8553cd'},body:JSON.stringify({sessionId:'8553cd',runId:'gemini-key-check',hypothesisId:'H5',location:'scripts/smoke-resume-api.mjs:85',message:'Smoke pdf response',data:{status:response.status,contentType:response.headers.get('content-type'),aiModel:response.headers.get('x-ai-model'),bodySnippet:raw.slice(0,200)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const payload = JSON.parse(raw)
  assert(response.ok, `Resume PDF parse failed: ${JSON.stringify(payload)}`)
  assert(typeof payload.text === 'string' && payload.text.trim().length > 0, 'PDF parse response missing extracted text')
  assert(['gemma-4-31b-it', 'gemma-4-26b-a4b-it'].includes(response.headers.get('x-ai-model') || ''), 'PDF parse response did not use an approved Gemma model')

  console.log('PDF smoke passed with model:', response.headers.get('x-ai-model'))
}

async function main() {
  console.log(`Running resume API smoke checks against ${baseUrl}`)
  await smokeTailor()
  await smokePdfParse()
  console.log('Resume API smoke checks passed.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
