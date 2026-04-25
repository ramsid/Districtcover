import { NextRequest, NextResponse } from "next/server"

// Mock API route for supporting documents upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock response for supporting document
    const documentTypes = [
      "Loss Run Report",
      "Financial Statement",
      "Driver List",
      "Certificate of Insurance",
      "Prior Policy Declaration",
    ]

    const randomType =
      documentTypes[Math.floor(Math.random() * documentTypes.length)]

    const response = {
      document_id: `DOC-${Date.now()}`,
      file_name: file.name,
      file_size: file.size,
      document_type: randomType,
      upload_date: new Date().toISOString(),
      status: "Processed",
      validation: {
        is_valid: true,
        confidence: 0.94,
        extracted_fields: Math.floor(Math.random() * 10) + 5,
      },
      notes: "Document successfully processed and linked to application.",
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error processing document:", error)
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    )
  }
}
