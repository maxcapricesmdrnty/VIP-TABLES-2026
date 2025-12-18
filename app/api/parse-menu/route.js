import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

// Initialize OpenAI client with Emergent LLM key
const openai = new OpenAI({
  apiKey: process.env.EMERGENT_LLM_KEY,
  baseURL: 'https://emergentintegrations.ai/api/v1/openai'
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

// Parse menu items using OpenAI
async function parseMenuWithAI(text) {
  const prompt = `Tu es un assistant qui extrait les informations d'un menu de boissons/restaurant.

Analyse le texte suivant et extrait tous les articles du menu. Pour chaque article, identifie:
- name: nom du produit (obligatoire)
- price: prix en nombre (obligatoire, sans devise)
- category: catégorie parmi: champagne, aperitif, biere, energy, spiritueux, vin, soft (obligatoire)
- format: format/contenance (ex: "Bouteille", "Verre", "Canette", etc.)
- volume: volume si disponible (ex: "75cl", "33cl", "1L", etc.)

Retourne UNIQUEMENT un tableau JSON valide avec les articles extraits.
Si tu ne peux pas extraire d'articles, retourne un tableau vide [].

Exemple de sortie:
[
  {"name": "Dom Pérignon 2013", "price": 450, "category": "champagne", "format": "Bouteille", "volume": "75cl"},
  {"name": "Heineken", "price": 8, "category": "biere", "format": "Bouteille", "volume": "33cl"}
]

Texte du menu à analyser:
${text.substring(0, 8000)}

Tableau JSON des articles:`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant spécialisé dans l\'extraction de données de menus. Tu retournes uniquement du JSON valide, sans commentaires ni explications.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    })

    const content = response.choices[0].message.content.trim()
    
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
    console.error('Error parsing with AI:', error)
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
    console.log('Preview:', extractedText.substring(0, 300))

    // Parse menu with AI
    const menuItems = await parseMenuWithAI(extractedText)

    return NextResponse.json({
      success: true,
      items: menuItems,
      extractedText: extractedText.substring(0, 500)
    })

  } catch (error) {
    console.error('Error processing file:', error)
    return NextResponse.json({ 
      error: error.message || 'Erreur lors du traitement du fichier' 
    }, { status: 500 })
  }
}
