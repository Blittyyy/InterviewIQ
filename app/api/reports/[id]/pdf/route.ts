import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { requireAuth } from "@/lib/requireAuth"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { user } = await requireAuth(supabase)

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reportId = params.id

    // Fetch the report
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Parse the report content
    let parsed = null
    try {
      const data = typeof report.data === 'string' ? JSON.parse(report.data) : report.data
      if (data && typeof data === 'object') {
        parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content
      }
    } catch (e) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 })
    }

    if (!parsed) {
      return NextResponse.json({ error: "No report content found" }, { status: 400 })
    }

    // Get user notes from localStorage (we'll need to pass this from frontend)
    const url = new URL(request.url)
    const notes = url.searchParams.get('notes') || ''

    // Test if scraping service is running
    console.log('Testing scraping service connection...');
    try {
      const testResponse = await fetch('http://localhost:3005/', { 
        method: 'GET'
      });
      console.log('Scraping service test response:', testResponse.status);
    } catch (testError) {
      console.error('Scraping service not available:', testError);
      throw new Error('Scraping service is not running. Please start the scraping service.');
    }

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${report.company_name || 'Company Report'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4B6EF5;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 28px;
            color: #222;
            margin: 0 0 10px 0;
          }
          .header p {
            font-size: 14px;
            color: #666;
            margin: 0;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section h2 {
            font-size: 20px;
            color: #222;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
          .section p {
            margin-bottom: 10px;
          }
          .section ul {
            margin-left: 20px;
          }
          .section li {
            margin-bottom: 8px;
          }
          .basics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          .basic-item {
            margin-bottom: 10px;
          }
          .basic-item dt {
            font-weight: 600;
            color: #555;
            font-size: 14px;
          }
          .basic-item dd {
            margin: 5px 0 0 0;
            color: #333;
          }
          .news-item {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .news-item:last-child {
            border-bottom: none;
          }
          .news-title {
            font-weight: 600;
            color: #222;
            margin-bottom: 5px;
          }
          .news-meta {
            font-size: 14px;
            color: #666;
          }
          .culture-item {
            margin-bottom: 10px;
          }
          .culture-label {
            font-weight: 600;
            color: #555;
          }
          .culture-value {
            margin-left: 10px;
          }
          .quote {
            font-style: italic;
            margin: 5px 0;
            padding-left: 10px;
            border-left: 3px solid #4B6EF5;
          }
          .talking-point {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .talking-point:last-child {
            border-bottom: none;
          }
          .notes {
            margin-top: 30px;
            padding: 15px;
            background: #f9f9f9;
            border-left: 4px solid #4B6EF5;
          }
          .notes h3 {
            margin-top: 0;
            color: #222;
          }
          @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${report.company_name || 'Company Report'}</h1>
          <p>Report generated on ${new Date(report.created_at).toLocaleDateString()}</p>
        </div>
        
        ${parsed.companyOverview ? `
          <div class="section">
            <h2>Company Overview</h2>
            <p>${parsed.companyOverview}</p>
          </div>
        ` : ''}
        
        ${parsed.companyBasics && parsed.companyBasics.companyName ? `
          <div class="section">
            <h2>Company Basics</h2>
            <div class="basics-grid">
              <div class="basic-item">
                <dt>Founded</dt>
                <dd>${parsed.companyBasics.foundingYear || 'No data found'}</dd>
              </div>
              <div class="basic-item">
                <dt>Headquarters</dt>
                <dd>${parsed.companyBasics.headquarters || 'No data found'}</dd>
              </div>
              <div class="basic-item">
                <dt>CEO</dt>
                <dd>${parsed.companyBasics.ceoName || 'No data found'}</dd>
              </div>
              <div class="basic-item">
                <dt>Size</dt>
                <dd>${parsed.companyBasics.companySize || 'No data found'}</dd>
              </div>
            </div>
            <div class="basic-item">
              <dt>Mission</dt>
              <dd>${parsed.companyBasics.missionStatement || 'No data found'}</dd>
            </div>
          </div>
        ` : ''}
        
        ${parsed.productsServices && parsed.productsServices.length > 0 ? `
          <div class="section">
            <h2>Products & Services</h2>
            <ul>
              ${parsed.productsServices.map((item: string) => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${parsed.recentNews && parsed.recentNews.length > 0 ? `
          <div class="section">
            <h2>Recent News & Press</h2>
            ${parsed.recentNews.map((news: any) => `
              <div class="news-item">
                <div class="news-title">${news.title}</div>
                <div class="news-meta">${news.source} • ${news.publishDate}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${parsed.cultureValues ? `
          <div class="section">
            <h2>Culture & Values</h2>
            <div class="culture-item">
              <span class="culture-label">Workplace:</span>
              <span class="culture-value">${parsed.cultureValues.workplaceDescriptors && parsed.cultureValues.workplaceDescriptors.length > 0 ? parsed.cultureValues.workplaceDescriptors.join(', ') : 'No data found'}</span>
            </div>
            <div class="culture-item">
              <span class="culture-label">Core Values:</span>
              <span class="culture-value">${parsed.cultureValues.coreValues && parsed.cultureValues.coreValues.length > 0 ? parsed.cultureValues.coreValues.join(', ') : 'No data found'}</span>
            </div>
            <div class="culture-item">
              <span class="culture-label">Perks:</span>
              <span class="culture-value">${parsed.cultureValues.perks && parsed.cultureValues.perks.length > 0 ? parsed.cultureValues.perks.join(', ') : 'No data found'}</span>
            </div>
            ${parsed.cultureValues.employeeQuotes && parsed.cultureValues.employeeQuotes.length > 0 ? `
              <div class="culture-item">
                <span class="culture-label">Employee Quotes:</span>
                ${parsed.cultureValues.employeeQuotes.map((q: string) => `<div class="quote">"${q}"</div>`).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        ${parsed.talkingPoints && parsed.talkingPoints.length > 0 ? `
          <div class="section">
            <h2>Strategic Interview Questions</h2>
            ${parsed.talkingPoints.map((tp: string) => `
              <div class="talking-point">
                <p>${tp}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${notes ? `
          <div class="notes">
            <h3>Your Notes</h3>
            <div>${notes.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}
      </body>
      </html>
    `

    // Call the scraping service to generate PDF using Puppeteer
    console.log('Calling scraping service for PDF generation...');
    const pdfResponse = await fetch('http://localhost:3005/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        filename: `${report.company_name || 'Company'}-Report.pdf`
      })
    })

    console.log('PDF response status:', pdfResponse.status);
    
    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('PDF generation failed:', errorText);
      throw new Error(`Failed to generate PDF: ${pdfResponse.status} ${errorText}`)
    }

    // Get the PDF buffer
    const pdfBuffer = await pdfResponse.arrayBuffer()
    console.log('PDF buffer size:', pdfBuffer.byteLength);

    // Return the PDF file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.company_name || 'Company'}-Report.pdf"`,
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
} 