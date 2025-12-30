import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Create supabase client inside function to avoid build-time errors
const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(url, key)
}

export async function POST(request) {
  try {
    const supabase = getSupabase()
    
    const formData = await request.formData()
    const file = formData.get('file')
    const eventId = formData.get('eventId')

    if (!file || !eventId) {
      return NextResponse.json({ error: 'File and eventId required' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (e) {
      // Directory might already exist
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `logo_${eventId}_${Date.now()}.${ext}`
    const filepath = path.join(uploadsDir, filename)

    // Write file
    await writeFile(filepath, buffer)

    // Return the public URL
    const logoUrl = `/uploads/${filename}`

    // Update event with logo URL
    const { error } = await supabase
      .from('events')
      .update({ billing_logo_url: logoUrl })
      .eq('id', eventId)

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      logoUrl 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
