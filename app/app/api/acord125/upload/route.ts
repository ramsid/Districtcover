import { NextRequest, NextResponse } from "next/server"

// Mock API route for ACORD 125 form upload
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
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock extracted data from ACORD 125 form
    const extractedData = {
      insured_name: "ABC Logistics LLC",
      business_type: "Commercial Trucking",
      policy_type: "General Liability",
      effective_date: "2026-05-01",
      locations: 3,
      vehicles: 12,
      employees: 48,
      risk_score: "Medium",
      missing_fields: ["FEIN", "Prior Carrier"],
      summary:
        "Application appears mostly complete but requires additional underwriting review.",
    }

    return NextResponse.json(extractedData)
  } catch (error) {
    console.error("Error processing ACORD 125:", error)
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    )
  }
}
