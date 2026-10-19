import { parseCsv } from './csvParser.js';
import { computeDataQuality } from './dataQuality.js';
import { buildFeeExplainer, buildPulseReport, extractFeeEvidence, extractThemes, topThemes } from './analysis.js';
import { buildMcpActions, executeMcpActions, mockMcpExecutor, failingMockMcpExecutor } from './mcp.js';
import { verifySources } from './sources.js';
function expect(condition, detail) {
    return { passed: condition, detail };
}
const SAMPLE_CSV = `author,date,rating,title,body,source
Alice Johnson,2026-09-01,5,Amazing voice mode,"The voice mode is amazing, conversations feel so natural. Great for walking.",App Store
Bob Smith,2026-09-03,2,Too many fees,"I keep hitting the free tier limit and get pushed to upgrade. The fees for Plus feel expensive and not clearly disclosed up front.",App Store
Carla Nguyen,2026-09-04,4,Accurate transcription,"Speech recognition and transcription accuracy are impressive. It rarely mishears me. Love the dictation.",Google Play
David Lee,2026-09-05,1,Keeps crashing,"The app crashes and freezes constantly. Voice feature fails and disconnects. Very laggy and buggy.",App Store
Emma Brown,2026-09-06,3,Good but laggy,"Love the conversational voice mode but there is noticeable latency and lag during real-time chats.",Google Play
Frank Wright,2026-09-08,5,Game changer,"This is a game changer. Hands free voice while driving. Interrupt support is perfect. 5 star.",App Store
Grace Kim,2026-09-10,2,Subscription confusion,"The pricing page is confusing. I was charged for Plus without clear billing disclosure. Paywall everywhere.",Google Play
Henry Adams,2026-09-12,4,Helpful but mic permission,"Useful for dictation but I worry about privacy and microphone permission. It listens and stores recordings.",App Store`;
const CSV_MISSING_COLUMN = `author,date,rating,title,body
Alice,2026-09-01,5,Good,"Nice voice mode"`;
const CSV_MALFORMED_DATE = `author,date,rating,title,body,source
Alice,not-a-date,5,Good,"Nice voice mode",App Store
Bob,2026-09-03,4,Great,"Love it",App Store`;
const CSV_INVALID_RATING = `author,date,rating,title,body,source
Alice,2026-09-01,9,Bad rating,"Test",App Store`;
const CSV_DUPLICATE = `author,date,rating,title,body,source
Alice,2026-09-01,5,Good,"Nice voice mode",App Store
Alice,2026-09-02,5,Good,"Nice voice mode",App Store`;
const CSV_EMPTY = `author,date,rating,title,body,source`;
const CSV_UNSUPPORTED_CLAIM = `author,date,rating,title,body,source
Alice,2026-09-01,5,Great,"OpenAI stole all my data and sells it. Definitely illegal.",App Store`;
function parseSample() {
    const parsed = parseCsv(SAMPLE_CSV);
    const report = computeDataQuality(parsed.rows, parsed.errors, parsed.missingRequiredColumns);
    return { rows: parsed.rows, report };
}
const tests = [
    {
        name: 'Valid CSV upload — all required columns present and rows parsed',
        run: () => {
            const { rows, report } = parseSample();
            const ok = rows.length === 8 && report.validRows === 8 && report.missingRequired === 0;
            return expect(ok, `Parsed ${rows.length} rows (expected 8). validRows=${report.validRows}, missingRequired=${report.missingRequired}.`);
        },
    },
    {
        name: 'Missing/invalid columns — parser reports missing required columns',
        run: () => {
            const parsed = parseCsv(CSV_MISSING_COLUMN);
            const ok = parsed.missingRequiredColumns.includes('source') && parsed.rows.length === 0;
            return expect(ok, `missingRequiredColumns=${JSON.stringify(parsed.missingRequiredColumns)}. rows=${parsed.rows.length}.`);
        },
    },
    {
        name: 'Empty dataset — data quality reports zero valid rows',
        run: () => {
            const parsed = parseCsv(CSV_EMPTY);
            const report = computeDataQuality(parsed.rows, parsed.errors, parsed.missingRequiredColumns);
            const ok = report.validRows === 0;
            return expect(ok, `validRows=${report.validRows}.`);
        },
    },
    {
        name: 'Duplicate reviews — duplicates flagged and excluded from valid rows',
        run: () => {
            const parsed = parseCsv(CSV_DUPLICATE);
            const report = computeDataQuality(parsed.rows, parsed.errors, parsed.missingRequiredColumns);
            const ok = report.duplicateRows === 1 && report.validRows === 1;
            return expect(ok, `duplicateRows=${report.duplicateRows}, validRows=${report.validRows}.`);
        },
    },
    {
        name: 'Malformed dates — flagged and row excluded',
        run: () => {
            const parsed = parseCsv(CSV_MALFORMED_DATE);
            const report = computeDataQuality(parsed.rows, parsed.errors, parsed.missingRequiredColumns);
            const ok = report.malformedDates === 1 && report.validRows === 1;
            return expect(ok, `malformedDates=${report.malformedDates}, validRows=${report.validRows}.`);
        },
    },
    {
        name: 'European date format — DD-MM-YYYY parsed correctly (e.g. 25-09-2026)',
        run: () => {
            const csv = `author,date,rating,title,body,source
Alice,25-09-2026,5,Great,"Love the voice mode",App Store`;
            const parsed = parseCsv(csv);
            const ok = parsed.rows.length === 1 && parsed.rows[0].date === '2026-09-25';
            return expect(ok, `rows=${parsed.rows.length}, date=${parsed.rows[0]?.date} (expected 2026-09-25).`);
        },
    },
    {
        name: 'European slash format — DD/MM/YYYY inferred when day > 12',
        run: () => {
            const csv = `author,date,rating,title,body,source
Alice,25/09/2026,5,Great,"Love the voice mode",App Store`;
            const parsed = parseCsv(csv);
            const ok = parsed.rows.length === 1 && parsed.rows[0].date === '2026-09-25';
            return expect(ok, `rows=${parsed.rows.length}, date=${parsed.rows[0]?.date} (expected 2026-09-25).`);
        },
    },
    {
        name: 'Invalid ratings — flagged and row excluded',
        run: () => {
            const parsed = parseCsv(CSV_INVALID_RATING);
            const report = computeDataQuality(parsed.rows, parsed.errors, parsed.missingRequiredColumns);
            const ok = report.invalidRatings === 1 && report.validRows === 0;
            return expect(ok, `invalidRatings=${report.invalidRatings}, validRows=${report.validRows}.`);
        },
    },
    {
        name: 'Unknown / blank fields — rows with "Unknown" or blank rating/date/author/title/body are excluded',
        run: () => {
            const csv = `author,date,rating,title,body,source
Unknown,2026-09-01,5,Good,"Nice voice mode",App Store
Alice,2026-09-02,Unknown,Good,"Nice voice mode",App Store
Bob,2026-09-03,4,,"Nice voice mode",App Store
Carla,2026-09-04,4,Good,"",App Store
Dave,Unknown,4,Good,"Nice voice mode",App Store
Eve,2026-09-05,4,Good,"Nice voice mode",`;
            const parsed = parseCsv(csv);
            const report = computeDataQuality(parsed.rows, parsed.errors, parsed.missingRequiredColumns);
            const ok = report.validRows === 0;
            return expect(ok, `validRows=${report.validRows} (expected 0). missingRequired=${report.missingRequired}, invalidRatings=${report.invalidRatings}, malformedDates=${report.malformedDates}.`);
        },
    },
    {
        name: 'Theme counts — themes extracted with positive counts',
        run: () => {
            const { rows } = parseSample();
            const themes = extractThemes(rows);
            const ok = themes.length > 0 && themes.every((t) => t.count > 0);
            return expect(ok, `Extracted ${themes.length} themes: ${themes.map((t) => `${t.name}=${t.count}`).join(', ')}.`);
        },
    },
    {
        name: 'Top-3 ranking — exactly 3 themes returned in descending order',
        run: () => {
            const { rows } = parseSample();
            const top = topThemes(rows, 3);
            const sorted = top.every((t, i) => i === 0 || top[i - 1].count >= t.count);
            const ok = top.length === 3 && sorted;
            return expect(ok, `Top-3: ${top.map((t) => `${t.name}=${t.count}`).join(', ')}. Sorted=${sorted}.`);
        },
    },
    {
        name: 'Verbatim quote accuracy — representative quote exists verbatim in source rows',
        run: () => {
            const { rows } = parseSample();
            const themes = topThemes(rows, 3);
            const allVerbatim = themes.every((t) => rows.some((r) => r.body === t.representativeQuote));
            return expect(allVerbatim, `All ${themes.length} representative quotes found verbatim in source rows.`);
        },
    },
    {
        name: 'Insufficient fee evidence — flagged when fee mentions < 3',
        run: () => {
            const csv = `author,date,rating,title,body,source
Alice,2026-09-01,5,Great,"Love the voice mode",App Store
Bob,2026-09-02,4,Good,"Nice dictation",Google Play`;
            const parsed = parseCsv(csv);
            const fee = extractFeeEvidence(parsed.rows);
            const ok = fee.insufficient && fee.totalFeeMentions < 3;
            return expect(ok, `totalFeeMentions=${fee.totalFeeMentions}, insufficient=${fee.insufficient}.`);
        },
    },
    {
        name: 'Sufficient fee evidence — extracted from sample data',
        run: () => {
            const { rows } = parseSample();
            const fee = extractFeeEvidence(rows);
            const ok = !fee.insufficient && fee.totalFeeMentions >= 3;
            return expect(ok, `totalFeeMentions=${fee.totalFeeMentions}, insufficient=${fee.insufficient}.`);
        },
    },
    {
        name: 'Unsupported claims — review not flagged as verified fee evidence from official source',
        run: () => {
            const parsed = parseCsv(CSV_UNSUPPORTED_CLAIM);
            const fee = extractFeeEvidence(parsed.rows);
            const ok = fee.items.length === 0 || fee.items.every((i) => !i.quote.toLowerCase().includes('definitely illegal'));
            return expect(ok, `Unsupported-claim review processed; fee items relying on that claim = 0.`);
        },
    },
    {
        name: 'Pulse word limit — <= 250 words',
        run: () => {
            const { rows } = parseSample();
            const themes = topThemes(rows, 3);
            const fee = extractFeeEvidence(rows);
            const pulse = buildPulseReport(rows, themes, fee);
            const ok = !pulse.tooLong && pulse.wordCount <= 250;
            return expect(ok, `wordCount=${pulse.wordCount}, tooLong=${pulse.tooLong}.`);
        },
    },
    {
        name: 'Fee explainer bullet limit — <= 6 bullets',
        run: () => {
            const explainer = buildFeeExplainer();
            const ok = explainer.bulletsWithinLimit && explainer.bulletCount <= 6 && explainer.bulletCount >= 1;
            return expect(ok, `bulletCount=${explainer.bulletCount}, withinLimit=${explainer.bulletsWithinLimit}.`);
        },
    },
    {
        name: 'Source-link validation — 2 verified official sources',
        run: () => {
            const explainer = buildFeeExplainer();
            const verified = verifySources(explainer.sources);
            const allVerified = verified.every((s) => s.verified);
            const countOk = verified.length === 2;
            return expect(allVerified && countOk, `Sources=${verified.length}, allVerified=${allVerified}. Reasons: ${verified.map((s) => s.reason).join(' | ')}`);
        },
    },
    {
        name: 'Source-link validation — rejects non-official domain',
        run: () => {
            const verified = verifySources([{ title: 'Random blog', url: 'https://example.blogspot.com/article' }]);
            const ok = !verified[0].verified;
            return expect(ok, `Non-official domain rejected: ${verified[0].reason}`);
        },
    },
    {
        name: 'Approval gating — unapproved actions are NOT executed',
        run: async () => {
            const { rows } = parseSample();
            const themes = topThemes(rows, 3);
            const fee = extractFeeEvidence(rows);
            const pulse = buildPulseReport(rows, themes, fee);
            const explainer = buildFeeExplainer();
            const actions = buildMcpActions({
                pulseTitle: pulse.title,
                pulseBody: pulse.body,
                feeExplainerBullets: explainer.bullets,
                feeExplainerSources: explainer.sources.map((s) => ({ title: s.title, url: s.url })),
                topThemes: themes.map((t) => ({ name: t.name, count: t.count })),
            });
            const results = await executeMcpActions(actions, new Set(), mockMcpExecutor);
            const ok = results.length === 0;
            return expect(ok, `Executed ${results.length} actions without approval (expected 0).`);
        },
    },
    {
        name: 'Approval gating — only approved actions execute',
        run: async () => {
            const { rows } = parseSample();
            const themes = topThemes(rows, 3);
            const fee = extractFeeEvidence(rows);
            const pulse = buildPulseReport(rows, themes, fee);
            const explainer = buildFeeExplainer();
            const actions = buildMcpActions({
                pulseTitle: pulse.title,
                pulseBody: pulse.body,
                feeExplainerBullets: explainer.bullets,
                feeExplainerSources: explainer.sources.map((s) => ({ title: s.title, url: s.url })),
                topThemes: themes.map((t) => ({ name: t.name, count: t.count })),
            });
            const approved = new Set([actions[0].id]);
            const results = await executeMcpActions(actions, approved, mockMcpExecutor);
            const ok = results.length === 1 && results[0].success;
            return expect(ok, `Executed ${results.length} actions (expected 1). success=${results[0]?.success}.`);
        },
    },
    {
        name: 'Email never auto-sends — email-draft action only creates a draft (mock returns draft ref)',
        run: async () => {
            const { rows } = parseSample();
            const themes = topThemes(rows, 3);
            const fee = extractFeeEvidence(rows);
            const pulse = buildPulseReport(rows, themes, fee);
            const explainer = buildFeeExplainer();
            const actions = buildMcpActions({
                pulseTitle: pulse.title,
                pulseBody: pulse.body,
                feeExplainerBullets: explainer.bullets,
                feeExplainerSources: explainer.sources.map((s) => ({ title: s.title, url: s.url })),
                topThemes: themes.map((t) => ({ name: t.name, count: t.count })),
            });
            const emailAction = actions.find((a) => a.type === 'email-draft');
            const results = await executeMcpActions([emailAction], new Set([emailAction.id]), mockMcpExecutor);
            const ok = results.length === 1 && results[0].success && /mock-email-draft/.test(results[0].mockRef ?? '');
            return expect(ok, `Email draft action returned mockRef=${results[0]?.mockRef}. No send performed.`);
        },
    },
    {
        name: 'MCP failure — simulated failure is surfaced as failed result',
        run: async () => {
            const { rows } = parseSample();
            const themes = topThemes(rows, 3);
            const fee = extractFeeEvidence(rows);
            const pulse = buildPulseReport(rows, themes, fee);
            const explainer = buildFeeExplainer();
            const actions = buildMcpActions({
                pulseTitle: pulse.title,
                pulseBody: pulse.body,
                feeExplainerBullets: explainer.bullets,
                feeExplainerSources: explainer.sources.map((s) => ({ title: s.title, url: s.url })),
                topThemes: themes.map((t) => ({ name: t.name, count: t.count })),
            });
            const results = await executeMcpActions(actions, new Set(actions.map((a) => a.id)), failingMockMcpExecutor);
            const allFailed = results.every((r) => !r.success);
            const ok = results.length === actions.length && allFailed;
            return expect(ok, `All ${results.length} actions reported failure. allFailed=${allFailed}.`);
        },
    },
    {
        name: 'Partial action failures — mixed success/failure handled individually',
        run: async () => {
            const { rows } = parseSample();
            const themes = topThemes(rows, 3);
            const fee = extractFeeEvidence(rows);
            const pulse = buildPulseReport(rows, themes, fee);
            const explainer = buildFeeExplainer();
            const actions = buildMcpActions({
                pulseTitle: pulse.title,
                pulseBody: pulse.body,
                feeExplainerBullets: explainer.bullets,
                feeExplainerSources: explainer.sources.map((s) => ({ title: s.title, url: s.url })),
                topThemes: themes.map((t) => ({ name: t.name, count: t.count })),
            });
            const mixedExecutor = async (action) => {
                await new Promise((r) => setTimeout(r, 10));
                return action.type === 'notion'
                    ? { actionId: action.id, success: false, message: 'Simulated Notion failure.' }
                    : { actionId: action.id, success: true, message: 'Mock success.', mockRef: `mock-${action.type}-ok` };
            };
            const results = await executeMcpActions(actions, new Set(actions.map((a) => a.id)), mixedExecutor);
            const successes = results.filter((r) => r.success).length;
            const failures = results.filter((r) => !r.success).length;
            const ok = successes === 2 && failures === 1;
            return expect(ok, `successes=${successes}, failures=${failures} (expected 2 and 1).`);
        },
    },
];
export async function runValidationTests() {
    const results = [];
    for (const test of tests) {
        try {
            const result = await test.run();
            results.push({ ...result, name: test.name });
        }
        catch (err) {
            results.push({
                name: test.name,
                passed: false,
                detail: `Test threw: ${err instanceof Error ? err.message : 'unknown error'}`,
            });
        }
    }
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    return { totalTests: results.length, passed, failed, results };
}
export const TEST_COUNT = tests.length;
export { SAMPLE_CSV } from './sampleData.js';
