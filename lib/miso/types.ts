// Shared types for MISO APIs

// Represents the structure of a knowledge segment to be displayed to the user
export interface KnowledgeSegment {
  id: string // Segment ID
  documentId?: string
  documentName?: string // Name of the document this segment belongs to
  content?: string
  answer?: string // Summary or direct answer from the segment
  keywords?: string[]
  // Add other fields you might want to display from MisoSegmentDetail
}

// Based on Source 3 (miso_api_guide_workflow.md)
export interface MisoWorkflowRunRequestBody {
  inputs: { [key: string]: any } // e.g., { "query": "user's question" }
  mode: "streaming" | "blocking"
  user: string // User identifier
  files?: Array<{
    // Optional file inputs
    type: string
    transfer_method: "remote_url" | "local_file"
    url?: string
    upload_file_id?: string
  }>
}

// Updated to match the provided log structure
export interface MisoWorkflowRunResponse {
  task_id: string
  workflow_run_id: string
  data: {
    id: string
    workflow_id: string
    status: string
    outputs: {
      result?: string // e.g., "[\"segment_id_1\", \"segment_id_2\"]"
    }
    error: string | null
    elapsed_time: number
    total_tokens: number
    total_steps: number
    created_at: number // Assuming timestamp
    finished_at: number // Assuming timestamp
  }
}

// Based on Source 2 (지식API.txt)
// For fetching segment details (Section 13, 15)
export interface MisoKnowledgeSegmentDetail {
  id: string
  document_id: string
  content: string
  answer: string | null
  keywords: string[]
  word_count: number
  tokens: number
  hit_count: number
  enabled: boolean
  status: string // e.g., "completed"
  created_at: number
  // ... other fields
}

export interface MisoKnowledgeDocSegmentsResponse {
  data: MisoKnowledgeSegmentDetail[]
  doc_form: string
}

// For fetching document list (Section 11)
export interface MisoKnowledgeDocListItem {
  id: string
  name: string
  document_count?: number // Present in dataset list, maybe in doc list too
  word_count?: number
  // ... other document properties
}

export interface MisoKnowledgeDocListResponse {
  data: MisoKnowledgeDocListItem[]
  has_more?: boolean
  limit?: number
  total?: number
  page?: number
}
