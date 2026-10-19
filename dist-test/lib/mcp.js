let actionCounter = 0;
export function makeActionId() {
    actionCounter += 1;
    return `act-${Date.now()}-${actionCounter}`;
}
export function buildMcpActions(params) {
    const { pulseTitle, pulseBody, feeExplainerBullets, feeExplainerSources, topThemes, recipient } = params;
    const googleDocs = {
        id: makeActionId(),
        type: 'google-docs',
        title: 'Create Google Doc — Weekly Product Pulse',
        summary: 'Create a Google Doc containing the Weekly Product Pulse (<=250 words) and the neutral fee explainer.',
        payload: {
            docTitle: pulseTitle,
            sections: [
                { heading: 'Weekly Product Pulse', content: pulseBody },
                { heading: 'Neutral Fee Explainer', content: feeExplainerBullets.map((b, i) => `${i + 1}. ${b}`).join('\n') },
                { heading: 'Verified Sources', content: feeExplainerSources.map((s) => `${s.title} — ${s.url}`).join('\n') },
            ],
        },
    };
    const notion = {
        id: makeActionId(),
        type: 'notion',
        title: 'Create Notion page — Top 3 Themes + Fee Evidence',
        summary: 'Create a Notion page listing the top 3 themes, representative quotes, and fee-related evidence items.',
        payload: {
            pageTitle: 'ChatGPT Voice Mode — Weekly Review Synthesis',
            topThemes,
        },
    };
    const emailDraft = {
        id: makeActionId(),
        type: 'email-draft',
        title: 'Create Email Draft (DO NOT SEND) — Pulse summary',
        summary: 'Create a DRAFT email summarizing the pulse. No email is sent. A human must approve and send manually.',
        payload: {
            to: recipient ?? 'product-team@example.com',
            subject: pulseTitle,
            body: `${pulseBody}\n\nFee explainer:\n${feeExplainerBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}`,
        },
    };
    return [googleDocs, notion, emailDraft];
}
export const mockMcpExecutor = async (action) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const ref = `mock-${action.type}-${Math.floor(Math.random() * 100000)}`;
    return {
        actionId: action.id,
        success: true,
        message: `Mock write succeeded for ${action.type}. No real external system was contacted.`,
        mockRef: ref,
    };
};
export const failingMockMcpExecutor = async (action) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
        actionId: action.id,
        success: false,
        message: `Mock ${action.type} write failed (simulated). No real external system was contacted.`,
    };
};
export async function executeMcpActions(actions, approvedIds, executor) {
    const approved = actions.filter((a) => approvedIds.has(a.id));
    const results = [];
    for (const action of approved) {
        try {
            const result = await executor(action);
            results.push(result);
        }
        catch (err) {
            results.push({
                actionId: action.id,
                success: false,
                message: `Unexpected error: ${err instanceof Error ? err.message : 'unknown error'}`,
            });
        }
    }
    return results;
}
export function actionTypeLabel(type) {
    switch (type) {
        case 'google-docs': return 'Google Docs';
        case 'notion': return 'Notion';
        case 'email-draft': return 'Email Draft';
    }
}
