import type { McpAction, McpActionType, McpResult } from '@/types';

let actionCounter = 0;
export function makeActionId(): string {
  actionCounter += 1;
  return `act-${Date.now()}-${actionCounter}`;
}

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function buildMcpActions(params: {
  pulseTitle: string;
  pulseBody: string;
  feeExplainerBullets: string[];
  feeExplainerSources: { title: string; url: string }[];
  topThemes: { name: string; count: number }[];
  identifiedFeeIssue?: string;
  recipient?: string;
}): McpAction[] {
  const { pulseTitle, pulseBody, feeExplainerBullets, feeExplainerSources, topThemes, recipient } = params;
  const date = localDate();
  const sourceLinks = feeExplainerSources.map((source) => ({ title: source.title, url: source.url }));
  const feeIssue = params.identifiedFeeIssue ?? 'No specific fee issue was identified from the supplied review data.';
  const explanation = feeExplainerBullets.slice();
  const structuredEntry = {
    date,
    top_themes: topThemes,
    weekly_pulse: pulseBody,
    identified_fee_issue: feeIssue,
    explanation_bullets: explanation,
    source_links: sourceLinks,
  };

  const googleDocs: McpAction = {
    id: makeActionId(),
    type: 'google-docs',
    title: 'Append to Google Doc — Weekly Product Pulse',
    summary: 'Append one structured dated entry to the existing document. The server must use an idempotency key to avoid duplicate entries.',
    payload: { operation: 'append_entry', docTitle: pulseTitle, entry: structuredEntry },
  };

  const notion: McpAction = {
    id: makeActionId(),
    type: 'notion',
    title: 'Append to Notion — Weekly Product Pulse',
    summary: 'Append the structured dated entry to the configured Notion page; preserve existing content.',
    payload: { operation: 'append_entry', pageTitle: 'ChatGPT Voice Mode — Weekly Review Synthesis', entry: structuredEntry },
  };

  const emailDraft: McpAction = {
    id: makeActionId(),
    type: 'email-draft',
    title: 'Create Gmail Draft (DO NOT SEND)',
    summary: 'Create a Gmail draft only. This action must never send an email.',
    payload: {
      to: recipient ?? 'product-team@example.com',
      subject: `Weekly Product Pulse + Customer Clarification — ${date}`,
      body: [
        'Weekly Product Pulse',
        pulseBody,
        '',
        'Fee clarification',
        ...explanation.map((bullet, index) => `${index + 1}. ${bullet}`),
        '',
        'Official source links',
        ...sourceLinks.map((source) => `- ${source.title}: ${source.url}`),
      ].join('\n'),
    },
  };

  return [googleDocs, notion, emailDraft];
}

export type McpExecutor = (action: McpAction) => Promise<McpResult>;

/**
 * Sends only to a server-side integration endpoint. Provider credentials must never
 * be stored in VITE_* variables or sent to the browser. Missing configuration fails closed.
 */
export const configuredMcpExecutor: McpExecutor = async (action) => {
  const endpoint = import.meta.env.VITE_MCP_ACTIONS_ENDPOINT as string | undefined;
  if (!endpoint) {
    return {
      actionId: action.id,
      success: false,
      message: 'Integration is not configured. Set VITE_MCP_ACTIONS_ENDPOINT to your authenticated server-side MCP gateway; no external action was attempted.',
    };
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return { actionId: action.id, success: false, message: 'Integration endpoint timed out or could not be reached. Verify provider state before retrying.' };
  }

  if (!response.ok) {
    const message = response.status === 401 || response.status === 403
      ? 'Integration authentication/authorization failed. No success was recorded.'
      : `Integration endpoint returned HTTP ${response.status}. Verify provider state before retrying.`;
    return { actionId: action.id, success: false, message };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { actionId: action.id, success: false, message: 'Integration endpoint returned an invalid response; completion could not be confirmed.' };
  }

  if (!data || typeof data !== 'object' || !('success' in data) || (data as { success?: unknown }).success !== true) {
    return { actionId: action.id, success: false, message: 'The endpoint did not confirm success. Check provider state before retrying.' };
  }
  const result = data as { message?: unknown; reference?: unknown };
  return {
    actionId: action.id,
    success: true,
    message: typeof result.message === 'string' ? result.message : 'The integration endpoint confirmed completion.',
    ...(typeof result.reference === 'string' ? { mockRef: result.reference } : {}),
  };
};

// Test-only executors for the in-app validation suite. The production app never uses these.
export const mockMcpExecutor: McpExecutor = async (action) => ({
  actionId: action.id,
  success: true,
  message: `TEST ONLY: simulated ${action.type} success; no provider was contacted.`,
  mockRef: `test-only-${action.type}`,
});

export const failingMockMcpExecutor: McpExecutor = async (action) => ({
  actionId: action.id,
  success: false,
  message: `TEST ONLY: simulated ${action.type} failure; no provider was contacted.`,
});

export async function executeMcpActions(
  actions: McpAction[],
  approvedIds: Set<string>,
  executor: McpExecutor,
): Promise<McpResult[]> {
  const approved = actions.filter((action) => approvedIds.has(action.id));
  const results: McpResult[] = [];
  for (const action of approved) {
    try {
      results.push(await executor(action));
    } catch {
      results.push({ actionId: action.id, success: false, message: 'Unexpected integration error. Verify provider state before retrying.' });
    }
  }
  return results;
}

export function actionTypeLabel(type: McpActionType): string {
  switch (type) {
    case 'google-docs': return 'Google Docs';
    case 'notion': return 'Notion';
    case 'email-draft': return 'Gmail Draft';
  }
}
