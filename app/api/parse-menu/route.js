import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

// Category mapping for common terms
const categoryMapping = {
  'champagne': 'champagne',
  'champ': 'champagne',
  'aperitif': 'aperitif',
  'apéritif': 'aperitif',
  'apero': 'aperitif',
  'biere': 'biere',
  'bière': 'biere',
  'beer': 'biere',
  'energy': 'energy',
  'redbull': 'energy',
  'red bull': 'energy',
  'spiritueux': 'spiritueux',
  'spirits': 'spiritueux',
  'vodka': 'spiritueux',
  'whisky': 'spiritueux',
  'gin': 'spiritueux',
  'rum': 'spiritueux',
  'rhum': 'spiritueux',
  'vin': 'vin',
  'wine': 'vin',
  'soft': 'soft',
  'soda': 'soft',
  'jus': 'soft',
  'juice': 'soft',
  'eau': 'soft',
  'water': 'soft'
}

function detectCategory(text) {
  const lowerText = text.toLowerCase().trim()
  
  // First, check for exact match
  const validCategories = ['champagne', 'aperitif', 'biere', 'energy', 'spiritueux', 'vin', 'soft']
  if (validCategories.includes(lowerText)) {
    return lowerText
  }
  
  // Then check for keyword matches
  for (const [keyword, category] of Object.entries(categoryMapping)) {
    if (lowerText.includes(keyword)) {
      return category
    }
  }
  return 'soft' // default
}

function detectFormat(text) {
  const lowerText = text.toLowerCase()
  if (lowerText.includes('magnum')) return 'Magnum'
  if (lowerText.includes('jeroboam')) return 'Jeroboam'
  if (lowerText.includes('canette') || lowerText.includes('can')) return 'Canette'
  if (lowerText.includes('verre') || lowerText.includes('glass')) return 'Verre'
  return 'Bouteille'
}

function detectVolume(text) {
  // Match patterns like 75cl, 1L, 33cl, 150cl, etc.
  const match = text.match(/(\d+(?:\.\d+)?)\s*(cl|l|ml)/i)
  if (match) {
    return `${match[1]}${match[2].toLowerCase()}`
  }
  return ''
}

function extractPrice(text) {
  // Extract numeric price from text
  const cleaned = text.toString().replace(/[^\d.,]/g, '').replace(',', '.')
  const price = parseFloat(cleaned)
  return isNaN(price) ? 0 : price
}

// Parse CSV/Excel data intelligently
function parseStructuredData(text) {
  const lines = text.split('\n').filter(line => line.trim())
  const items = []
  
  // Try to detect header row
  let headerIndex = -1
  let nameCol = -1, priceCol = -1, categoryCol = -1, formatCol = -1, volumeCol = -1
  
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const cols = lines[i].split(',').map(c => c.trim().toLowerCase())
    const hasName = cols.some(c => c.includes('nom') || c.includes('name') || c.includes('produit') || c.includes('article'))
    const hasPrice = cols.some(c => c.includes('prix') || c.includes('price') || c.includes('tarif'))
    
    if (hasName || hasPrice) {
      headerIndex = i
      cols.forEach((col, idx) => {
        if (col.includes('nom') || col.includes('name') || col.includes('produit') || col.includes('article')) nameCol = idx
        if (col.includes('prix') || col.includes('price') || col.includes('tarif')) priceCol = idx
        if (col.includes('categ') || col.includes('type')) categoryCol = idx
        if (col.includes('format') || col.includes('taille')) formatCol = idx
        if (col.includes('volume') || col.includes('contenance') || col.includes('cl') || col.includes('ml')) volumeCol = idx
      })
      break
    }
  }
  
  // Parse data rows
  const startRow = headerIndex >= 0 ? headerIndex + 1 : 0
  
  for (let i = startRow; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim())
    if (cols.length < 2) continue
    
    let name, price, category, format, volume
    
    if (nameCol >= 0 && priceCol >= 0) {
      // Use detected columns
      name = cols[nameCol] || ''
      price = extractPrice(cols[priceCol] || '0')
      category = categoryCol >= 0 ? detectCategory(cols[categoryCol]) : detectCategory(name)
      format = formatCol >= 0 ? cols[formatCol] || detectFormat(name) : detectFormat(name)
      volume = volumeCol >= 0 ? cols[volumeCol] || detectVolume(name) : detectVolume(name)
    } else {
      // Assume first col is name, second is price
      name = cols[0] || ''
      price = extractPrice(cols[1] || '0')
      category = cols[2] ? detectCategory(cols[2]) : detectCategory(name)
      format = cols[3] || detectFormat(name)
      volume = cols[4] || detectVolume(name)
    }
    
    // Skip if no valid name or price
    if (!name || name.length < 2) continue
    
    items.push({
      id: `temp_${i}_${Date.now()}`,
      name: name,
      price: price,
      category: category,
      format: format || 'Bouteille',
      volume: volume || '',
      description: '',
      available: true
    })
  }
  
  return items
}

// Extract text from different file types
async function extractTextFromFile(buffer, fileType) {
  try {
    if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      let text = ''
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName]
        const csv = XLSX.utils.sheet_to_csv(sheet)
        text += csv + '\n'
      })
      return text
    } else if (fileType === 'csv') {
      return buffer.toString('utf-8')
    }
    throw new Error('Format de fichier non supporté')
  } catch (error) {
    console.error('Error extracting text:', error)
    throw new Error(`Erreur lors de l'extraction du texte: ${error.message}`)
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Get file extension
    const fileName = file.name.toLowerCase()
    let fileType = ''
    if (fileName.endsWith('.docx')) fileType = 'docx'
    else if (fileName.endsWith('.xlsx')) fileType = 'xlsx'
    else if (fileName.endsWith('.xls')) fileType = 'xls'
    else if (fileName.endsWith('.csv')) fileType = 'csv'
    else {
      return NextResponse.json({ 
        error: 'Format non supporté. Utilisez DOCX, XLSX ou CSV.' 
      }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Extract text from file
    console.log(`Extracting text from ${fileType} file: ${fileName}`)
    const extractedText = await extractTextFromFile(buffer, fileType)
    
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Impossible d\'extraire le texte du fichier. Vérifiez que le fichier contient du texte.' 
      }, { status: 400 })
    }

    console.log('Text extracted successfully, length:', extractedText.length)

    // Parse menu items from structured data
    const menuItems = parseStructuredData(extractedText)

    if (menuItems.length === 0) {
      return NextResponse.json({ 
        error: 'Aucun article trouvé. Assurez-vous que le fichier contient des colonnes: Nom, Prix (et optionnellement Catégorie, Format, Volume)' 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      items: menuItems,
      message: `${menuItems.length} articles détectés`
    })

  } catch (error) {
    console.error('Error processing file:', error)
    return NextResponse.json({ 
      error: error.message || 'Erreur lors du traitement du fichier' 
    }, { status: 500 })
  }
}
