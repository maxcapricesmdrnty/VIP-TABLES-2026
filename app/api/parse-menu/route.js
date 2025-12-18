import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

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

// Parse menu items using Claude AI
async function parseMenuWithClaude(text) {
  const prompt = `Tu es un assistant spécialisé dans l'extraction de données de menus de boissons.

Analyse le texte suivant qui provient d'une carte des boissons et extrait TOUS les articles.

Pour chaque article, identifie:
- name: nom du produit (ex: "Dom Pérignon", "Heineken")
- price: prix en nombre uniquement (ex: 800, 8, 1700) - enlève les devises et symboles
- category: une des catégories suivantes UNIQUEMENT: champagne, aperitif, biere, energy, spiritueux, vin, soft
- format: format du produit (ex: "Bouteille", "Magnum", "Jeroboam", "Canette", "Verre")
- volume: volume si disponible (ex: "75cl", "70cl", "33cl", "25cl")

RÈGLES IMPORTANTES:
- Les catégories VODKA, GIN, WHISKY, RHUM, TEQUILA, MEZCAL doivent être mappées vers "spiritueux"
- Les catégories BIÈRES doivent être mappées vers "biere"
- Les catégories ENERGY DRINKS doivent être mappées vers "energy"
- Les catégories APÉRITIFS doivent être mappées vers "aperitif"
- Prix comme "CHF 1'700.-" doit devenir 1700
- Prix comme "CHF 8.-" doit devenir 8

Retourne UNIQUEMENT un tableau JSON valide, sans aucun texte avant ou après.

Texte du menu:
${text}

JSON:`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = response.content[0].text.trim()
    console.log('Claude response preview:', content.substring(0, 200))
    
    // Try to extract JSON from the response
    let jsonStr = content
    
    // Handle markdown code blocks
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0].trim()
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0].trim()
    }
    
    // Parse JSON
    const items = JSON.parse(jsonStr)
    
    // Validate and clean items
    return items.map((item, index) => ({
      id: `temp_${index}_${Date.now()}`,
      name: item.name || 'Sans nom',
      price: parseFloat(item.price) || 0,
      category: item.category || 'soft',
      format: item.format || 'Bouteille',
      volume: item.volume || '',
      description: item.description || '',
      available: true
    }))
  } catch (error) {
    console.error('Error parsing with Claude:', error)
    throw new Error(`Erreur lors de l'analyse IA: ${error.message}`)
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
    console.log('Preview:', extractedText.substring(0, 500))

    // Parse menu with Claude AI
    const menuItems = await parseMenuWithClaude(extractedText)

    if (menuItems.length === 0) {
      return NextResponse.json({ 
        error: 'Aucun article trouvé dans le document.' 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      items: menuItems,
      message: `${menuItems.length} articles détectés par l'IA`
    })

  } catch (error) {
    console.error('Error processing file:', error)
    return NextResponse.json({ 
      error: error.message || 'Erreur lors du traitement du fichier' 
    }, { status: 500 })
  }
}
