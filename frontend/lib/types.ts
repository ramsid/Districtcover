export interface AcordExtractedData {
  insured_name: string
  business_type: string
  policy_type: string
  effective_date: string
  locations: number
  vehicles: number
  employees: number
  risk_score: "Low" | "Medium" | "High"
  missing_fields: string[]
  summary: string
}

export interface SupportingDocumentResponse {
  document_id: string
  file_name: string
  file_size: number
  document_type: string
  upload_date: string
  status: string
  validation: {
    is_valid: boolean
    confidence: number
    extracted_fields: number
  }
  notes: string
}
