import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET() {
  const supabase = getSupabaseClient()

  // Count total reports
  const { count: reportsCount } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })

  // Get all company names
  const { data: companiesData } = await supabase
    .from('reports')
    .select('company_name')

  // Count unique companies
  const uniqueCompanies = new Set(companiesData?.map(r => r.company_name))
  const companiesCount = uniqueCompanies.size

  return NextResponse.json({
    reports: reportsCount || 0,
    companies: companiesCount || 0,
  })
} 