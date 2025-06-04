import type { MisoWorkflowRunRequestBody, MisoWorkflowRunResponse } from "./types"

const WORKFLOW_API_ENDPOINT = process.env.MISO_WORKFLOW_API_ENDPOINT
const WORKFLOW_API_KEY = process.env.MISO_WORKFLOW_API_KEY
const WORKFLOW_APP_ID = process.env.MISO_WORKFLOW_APP_ID

/**
 * Runs a MISO workflow.
 * @param query The user's search query.
 * @returns A promise that resolves to the workflow response.
 * @throws If API credentials are not configured or if the API request fails.
 */
export async function runMisoWorkflow(query: string): Promise<MisoWorkflowRunResponse> {
  if (!WORKFLOW_API_ENDPOINT || !WORKFLOW_API_KEY || !WORKFLOW_APP_ID) {
    console.error("MISO Workflow API environment variables are not fully configured.")
    throw new Error("Workflow API is not configured. Please check server logs.")
  }

  const requestUrl = `${WORKFLOW_API_ENDPOINT}/workflows/run` // As per Source 3

  const requestBody: MisoWorkflowRunRequestBody = {
    inputs: { query: query }, // Assuming 'query' is the input variable name in your workflow
    mode: "blocking", // Using blocking mode for simplicity, as per Source 3
    user: `miso-knowledge-manager-app-user-${WORKFLOW_APP_ID}`, // A unique user identifier for this app
  }

  console.log(`Calling MISO Workflow API: POST ${requestUrl}`)
  console.log(`Workflow API Request Body:`, JSON.stringify(requestBody, null, 2))

  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WORKFLOW_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`MISO Workflow API Error (${response.status}) for ${requestUrl}: ${errorBody}`)
    throw new Error(
      `Workflow API request failed: ${response.status} ${response.statusText}. Check server logs for details.`,
    )
  }

  // It's possible a 204 No Content or other successful non-JSON responses could occur.
  // For now, assuming JSON response based on typical API patterns and the 'result' field.
  const responseData = await response.json()
  console.log("MISO Workflow API Raw Response Data:", responseData)
  return responseData as MisoWorkflowRunResponse
}
