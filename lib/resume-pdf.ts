/**
 * Generates a professional, ATS-friendly resume HTML document for PDF export.
 * Features: clean typography, color accents, proper sections, print-optimised.
 */
export function generateResumePdfHtml(opts: {
  tailoredResume: string
  atsScore: number
  matchedSkills: string[]
  missingSkills: string[]
  summary: string
  jobTitle?: string
  company?: string
}): string {
  const { tailoredResume, atsScore, matchedSkills, summary, jobTitle, company } = opts

  // Try to parse structured sections from the resume text
  const lines = tailoredResume.split('\n')
  let name = ''
  let contactLine = ''
  const sections: { heading: string; content: string[] }[] = []
  let currentSection: { heading: string; content: string[] } | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (currentSection && currentSection.content.length > 0) {
        currentSection.content.push('')
      }
      continue
    }

    // Detect name (first non-empty line, likely all-caps or title-case with no colon)
    if (!name && !trimmed.includes(':') && trimmed.length < 60) {
      name = trimmed.replace(/^#+\s*/, '')
      continue
    }

    // Detect contact info (email, phone patterns)
    if (!contactLine && (trimmed.includes('@') || /\d{10}|\+\d/.test(trimmed) || trimmed.toLowerCase().includes('email'))) {
      contactLine = trimmed
      continue
    }

    // Detect section headings (all-caps, starts with ##, or ends with :)
    const isHeading =
      /^#{1,3}\s/.test(trimmed) ||
      (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && trimmed.length < 50 && !trimmed.startsWith('-') && !trimmed.startsWith('•')) ||
      (/^[A-Z][A-Z &/]+:?$/.test(trimmed))

    if (isHeading) {
      if (currentSection) sections.push(currentSection)
      currentSection = { heading: trimmed.replace(/^#+\s*/, '').replace(/:$/, ''), content: [] }
    } else {
      if (!currentSection) {
        currentSection = { heading: '', content: [] }
      }
      currentSection.content.push(trimmed)
    }
  }
  if (currentSection) sections.push(currentSection)

  // If parsing found no clear sections, use the whole text as one block
  if (sections.length === 0) {
    sections.push({ heading: '', content: lines.filter(l => l.trim()) })
  }

  const skillBadges = matchedSkills.map(s =>
    `<span style="display:inline-block;padding:2px 10px;margin:2px 4px 2px 0;background:#e8eaf6;color:#283593;border-radius:12px;font-size:9pt;">${esc(s)}</span>`
  ).join('')

  function formatContent(content: string[]): string {
    return content.map(line => {
      if (!line) return '<div style="height:6px;"></div>'
      // Bullet points
      if (/^[-•*]\s/.test(line)) {
        return `<li style="margin-bottom:3px;">${esc(line.replace(/^[-•*]\s*/, ''))}</li>`
      }
      // Sub-items (indented bullets)
      if (/^\s{2,}[-•*]\s/.test(line)) {
        return `<li style="margin-left:16px;margin-bottom:2px;list-style-type:circle;">${esc(line.trim().replace(/^[-•*]\s*/, ''))}</li>`
      }
      return `<p style="margin:2px 0;">${esc(line)}</p>`
    }).join('\n')
  }

  function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  const sectionsHtml = sections.map(s => {
    const hasListItems = s.content.some(l => /^[-•*]\s/.test(l))
    const contentHtml = hasListItems
      ? `<ul style="padding-left:18px;margin:4px 0 0 0;">${formatContent(s.content)}</ul>`
      : `<div>${formatContent(s.content)}</div>`

    if (!s.heading) return contentHtml

    return `
      <div style="margin-bottom:14px;">
        <h2 style="font-size:12pt;font-weight:700;color:#1a237e;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;padding-bottom:3px;border-bottom:2px solid #c5cae9;">
          ${esc(s.heading)}
        </h2>
        ${contentHtml}
      </div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>${esc(name || 'Resume')}${jobTitle ? ' - ' + esc(jobTitle) : ''}</title>
<style>
  @page { margin: 0.6in 0.7in; size: letter; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.45;
    color: #212121;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
  }
  @media screen {
    body { max-width: 800px; margin: 20px auto; padding: 40px; background: #f5f5f5; }
    .page { background: white; padding: 48px; box-shadow: 0 2px 16px rgba(0,0,0,0.1); border-radius: 4px; }
  }
  a { color: #1a237e; text-decoration: none; }
  ul { list-style-type: disc; }
  li { font-size: 10.5pt; }
  p { margin: 0; }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div style="text-align:center;margin-bottom:16px;">
    <h1 style="font-size:22pt;font-weight:700;color:#1a237e;margin:0;letter-spacing:0.5px;">
      ${esc(name || 'Your Name')}
    </h1>
    ${contactLine ? `<p style="font-size:9.5pt;color:#555;margin-top:4px;">${esc(contactLine)}</p>` : ''}
    ${jobTitle ? `<p style="font-size:10pt;color:#37474f;margin-top:2px;font-style:italic;">Applying for: ${esc(jobTitle)}${company ? ' at ' + esc(company) : ''}</p>` : ''}
  </div>

  <!-- ATS Score Badge -->
  <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;margin-bottom:18px;background:linear-gradient(135deg,#e8eaf6,#f3e5f5);border-radius:8px;" class="no-print">
    <div style="width:48px;height:48px;border-radius:50%;background:${atsScore >= 80 ? '#4caf50' : atsScore >= 60 ? '#ff9800' : '#f44336'};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14pt;">
      ${atsScore}
    </div>
    <div>
      <div style="font-size:10pt;font-weight:600;color:#1a237e;">ATS Compatibility Score</div>
      <div style="font-size:8.5pt;color:#555;">${esc(summary)}</div>
    </div>
  </div>

  <!-- Skills -->
  ${matchedSkills.length > 0 ? `
  <div style="margin-bottom:14px;">
    <h2 style="font-size:12pt;font-weight:700;color:#1a237e;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;padding-bottom:3px;border-bottom:2px solid #c5cae9;">
      Key Skills
    </h2>
    <div style="margin-top:6px;">${skillBadges}</div>
  </div>` : ''}

  <!-- Resume Content -->
  ${sectionsHtml}
</div>

<script class="no-print">
  // Auto-trigger print dialog when opened
  window.onload = function() { setTimeout(function() { window.print(); }, 400); };
</script>
</body></html>`
}
