import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export async function POST(request) {
  try {
    const { table, event, consolidated, tables: allTables } = await request.json()
    
    const doc = new jsPDF()
    const currency = event?.currency || 'CHF'
    const tablesToProcess = consolidated ? allTables : [table]
    
    // Format Swiss helper
    const formatSwiss = (amount) => {
      return (amount || 0).toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    
    // Calculate total
    const calculateTotal = (t) => {
      const base = t.sold_price || t.standard_price || 0
      const additional = (t.additional_persons || 0) * (t.additional_person_price || 0)
      const onsite = t.on_site_additional_revenue || 0
      return base + additional + onsite
    }
    
    // Header
    doc.setFontSize(24)
    doc.setTextColor(218, 165, 32)
    doc.text(consolidated ? 'FACTURE CONSOLIDÉE' : 'FACTURE', 105, 25, { align: 'center' })
    
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(event?.name || 'Événement', 105, 35, { align: 'center' })
    
    // Invoice info
    doc.setFontSize(10)
    const invoiceNum = consolidated 
      ? `CONS-${(table.client_email || 'X').slice(0, 6)}-${format(new Date(), 'yyyyMMdd')}`.toUpperCase()
      : `INV-${(table.id || '').slice(0, 8).toUpperCase()}`
    doc.text(`Facture N°: ${invoiceNum}`, 20, 55)
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 62)
    
    // Client info
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('Client:', 20, 80)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    doc.text(table.client_name || 'N/A', 20, 88)
    doc.text(table.client_email || '', 20, 95)
    doc.text(table.client_phone || '', 20, 102)
    
    // Table header
    let yPos = 120
    doc.setFillColor(218, 165, 32)
    doc.rect(20, yPos, 170, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, 'bold')
    doc.text('Description', 25, yPos + 6)
    doc.text('Montant', 175, yPos + 6, { align: 'right' })
    
    // Rows
    yPos += 12
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, 'normal')
    
    let grandTotal = 0
    tablesToProcess.forEach((t) => {
      const total = calculateTotal(t)
      grandTotal += total
      doc.text(`Table ${t.table_number} - Réservation VIP`, 25, yPos)
      doc.text(`${formatSwiss(total)} ${currency}`, 175, yPos, { align: 'right' })
      yPos += 8
    })
    
    // Total
    yPos += 5
    doc.setDrawColor(218, 165, 32)
    doc.line(20, yPos, 190, yPos)
    yPos += 10
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('TOTAL', 25, yPos)
    doc.text(`${formatSwiss(grandTotal)} ${currency}`, 175, yPos, { align: 'right' })
    
    // Footer
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text('Merci de votre confiance!', 105, 265, { align: 'center' })
    doc.setFontSize(8)
    doc.text('vip@caprices.ch', 105, 272, { align: 'center' })
    
    // Output as base64
    const pdfBase64 = doc.output('datauristring')
    
    const fileName = consolidated 
      ? `Facture_Consolidee_${(table.client_name || 'Client').replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`
      : `Facture_${table.table_number}_${format(new Date(), 'yyyyMMdd')}.pdf`
    
    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      fileName
    })
    
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
