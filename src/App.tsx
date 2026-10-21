/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ApprovalRecord,
  ApprovalStatus,
  DataQualityReport,
  FeeEvidenceItem,
  McpActionResult,
  McpDestinationConfig,
  NeutralFeeExplainer,
  ReviewRow,
  Theme,
  WeeklyProductPulse,
} from './types';
import { processReviewsCSV } from './utils/csvParser';
import { extractFeeEvidence, extractTopThemes } from './utils/analyzer';
import {
  generateNeutralFeeExplainer,
  generateWeeklyProductPulse,
} from './utils/pulseGenerator';
import { HEALTHY_VOICE_REVIEWS_CSV } from './utils/sampleData';
import { generateContentHash } from './utils/sanitizer';
import { buildMcpPayload, executeMcpActions, formatEntryForGoogleDoc } from './services/mcpClient';

import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { DataQualityCard } from './components/DataQualityCard';
import { ThemesAndEvidenceView } from './components/ThemesAndEvidenceView';
import { WeeklyPulseCard } from './components/WeeklyPulseCard';
import { HumanApprovalGate } from './components/HumanApprovalGate';
import { McpDispatchDrawer } from './components/McpDispatchDrawer';
import { EditPulseModal } from './components/EditPulseModal';
import { GoogleDocAppendModal } from './components/GoogleDocAppendModal';

export default function App() {
  const currentDate = '2026-10-21';

  // --- CSV Ingestion State ---
  const [rawCSV, setRawCSV] = useState<string>(HEALTHY_VOICE_REVIEWS_CSV);
  const [activeDatasetName, setActiveDatasetName] = useState<string>('Genuine Reviews (Healthy)');

  // --- Parsed Data & Analysis ---
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [topThemes, setTopThemes] = useState<Theme[]>([]);
  const [feeEvidence, setFeeEvidence] = useState<{
    items: FeeEvidenceItem[];
    hasSufficientEvidence: boolean;
    unsupportedClaims: string[];
  }>({ items: [], hasSufficientEvidence: false, unsupportedClaims: [] });

  // --- Generated Pulse & Fee Explainer ---
  const [pulse, setPulse] = useState<WeeklyProductPulse | null>(null);
  const [explainer, setExplainer] = useState<NeutralFeeExplainer | null>(null);

  // --- Human Approval State Machine ---
  const [approvalRecord, setApprovalRecord] = useState<ApprovalRecord>({
    status: 'PENDING_REVIEW',
    contentHash: '',
    approvedDestinations: { google_docs: true, notion: true, gmail_draft: true },
  });
  const [approvalInvalidatedNotice, setApprovalInvalidatedNotice] = useState<string | undefined>(undefined);

  // --- Target MCP Destinations ---
  const [destinations, setDestinations] = useState<McpDestinationConfig>({
    google_docs: true,
    notion: true,
    gmail_draft: true,
    google_docs_url: '',
  });

  // --- MCP Simulation & Execution State ---
  const [simulationConfig, setSimulationConfig] = useState({
    simulateAuthError: false,
    simulateTimeout: false,
    simulatePartialFailure: false,
  });
  const [isExecutingMcp, setIsExecutingMcp] = useState(false);
  const [mcpResults, setMcpResults] = useState<McpActionResult[]>([]);

  // --- Modals State ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // --- Process CSV on rawCSV change ---
  useEffect(() => {
    const { reviews: parsedReviews, report } = processReviewsCSV(rawCSV);
    setReviews(parsedReviews);
    setQualityReport(report);

    const themes = extractTopThemes(parsedReviews);
    setTopThemes(themes);

    const fee = extractFeeEvidence(parsedReviews);
    setFeeEvidence(fee);

    const newPulse = generateWeeklyProductPulse(currentDate, themes, fee.hasSufficientEvidence);
    setPulse(newPulse);

    const newExplainer = generateNeutralFeeExplainer(fee.hasSufficientEvidence);
    setExplainer(newExplainer);

    // Compute initial content hash and reset approval to PENDING
    const initialHash = generateContentHash(newPulse.fullPulseText + newExplainer.bullets.join(''));
    setApprovalRecord({
      status: 'PENDING_REVIEW',
      contentHash: initialHash,
      approvedDestinations: { google_docs: true, notion: true, gmail_draft: true },
    });
    setApprovalInvalidatedNotice(undefined);
    setMcpResults([]);
  }, [rawCSV]);

  // Current Content Hash dynamically computed based on active text
  const currentContentHash = useMemo(() => {
    if (!pulse || !explainer) return '';
    return generateContentHash(pulse.fullPulseText + explainer.bullets.join(''));
  }, [pulse, explainer]);

  // Handle Loading a Dataset
  const handleLoadCSV = (content: string, name: string) => {
    setRawCSV(content);
    setActiveDatasetName(name);
  };

  // Reset back to healthy benchmark
  const handleResetToHealthy = () => {
    setRawCSV(HEALTHY_VOICE_REVIEWS_CSV);
    setActiveDatasetName('Genuine Reviews (Healthy)');
    setSimulationConfig({
      simulateAuthError: false,
      simulateTimeout: false,
      simulatePartialFailure: false,
    });
  };

  // Human Approval Actions
  const handleApprove = () => {
    if (!pulse || !explainer) return;
    setApprovalRecord({
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      approvedBy: 'Product Lead (HITL Sign-off)',
      contentHash: currentContentHash,
      approvedDestinations: { ...destinations },
    });
    setApprovalInvalidatedNotice(undefined);
  };

  const handleReject = () => {
    setApprovalRecord(prev => ({
      ...prev,
      status: 'REJECTED',
      rejectionReason: 'Rejected during human review: requires copy revision.',
    }));
    setApprovalInvalidatedNotice(undefined);
  };

  // Save Edits - Critical Rule: Any edit invalidates previous approval!
  const handleSaveEdits = (updatedPulse: WeeklyProductPulse, updatedExplainer: NeutralFeeExplainer) => {
    setPulse(updatedPulse);
    setExplainer(updatedExplainer);
    setIsEditModalOpen(false);

    const newHash = generateContentHash(updatedPulse.fullPulseText + updatedExplainer.bullets.join(''));

    // Invalidate approval state
    setApprovalRecord({
      status: 'PENDING_REVIEW',
      contentHash: newHash,
      approvedDestinations: { ...destinations },
      invalidatedNotice: 'Content was modified; previous approval was invalidated. Please review and approve again before dispatching.',
    });

    setApprovalInvalidatedNotice(
      'Content was modified; previous approval has been automatically invalidated. Please review and re-approve before dispatching.'
    );
  };

  // Toggle MCP destination checkbox
  const handleToggleDestination = (key: keyof McpDestinationConfig) => {
    setDestinations(prev => {
      const next = { ...prev, [key]: !prev[key] };
      // If approval was already granted, changing destinations also invalidates approval
      if (approvalRecord.status === 'APPROVED') {
        setApprovalRecord(r => ({
          ...r,
          status: 'PENDING_REVIEW',
        }));
        setApprovalInvalidatedNotice('Target MCP destinations changed; previous approval invalidated. Please re-approve.');
      }
      return next;
    });
  };

  // Update Google Doc URL from user input
  const handleUpdateGoogleDocsUrl = (url: string) => {
    setDestinations(prev => ({
      ...prev,
      google_docs_url: url,
    }));
    if (approvalRecord.status === 'APPROVED') {
      setApprovalRecord(r => ({
        ...r,
        status: 'PENDING_REVIEW',
      }));
      setApprovalInvalidatedNotice('Target Google Doc URL changed; previous approval invalidated. Please re-approve.');
    }
  };

  const handleUpdateGoogleDocsWebhook = (webhookUrl: string) => {
    setDestinations(prev => ({
      ...prev,
      google_docs_webhook_url: webhookUrl,
    }));
  };

  const handleUpdateGoogleDocsBearerToken = (token: string) => {
    setDestinations(prev => ({
      ...prev,
      google_docs_bearer_token: token,
    }));
  };

  const handleUpdateGoogleDocsMode = (mode: 'live_webhook' | 'live_oauth' | 'clipboard_assistant') => {
    setDestinations(prev => ({
      ...prev,
      google_docs_mode: mode,
    }));
  };

  // Toggle failure simulation flags
  const handleToggleSimulation = (key: 'simulateAuthError' | 'simulateTimeout' | 'simulatePartialFailure') => {
    setSimulationConfig(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Execute Approved MCP Dispatch
  const handleExecuteMcp = async () => {
    if (!pulse || !explainer) return;

    setIsExecutingMcp(true);
    try {
      const payload = buildMcpPayload(
        pulse,
        explainer,
        topThemes,
        feeEvidence.hasSufficientEvidence
          ? 'Customer confusion regarding Plus $20/month daily voice quota vs unmetered expectations'
          : 'Insufficient fee evidence to substantiate systemic billing issues'
      );

      const results = await executeMcpActions(payload, {
        destinations,
        approvalRecord,
        currentContentHash,
        simulateAuthError: simulationConfig.simulateAuthError,
        simulateTimeout: simulationConfig.simulateTimeout,
        simulatePartialFailure: simulationConfig.simulatePartialFailure,
      });

      setMcpResults(results);

      // If Google Docs destination was executed in clipboard assist mode,
      // auto-open the helper modal with direct copy and open buttons
      const gdocResult = results.find(r => r.tool.includes('google_docs'));
      if (gdocResult && gdocResult.status === 'SUCCESS' && gdocResult.deliveryMode === 'CLIPBOARD_ASSIST') {
        setIsDocModalOpen(true);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExecutingMcp(false);
    }
  };

  // Retry failed MCP actions (uses existing idempotency key to prevent duplicates)
  const handleRetryFailed = async () => {
    // Re-run execution with partial failure simulation turned off to allow success
    setSimulationConfig(prev => ({
      ...prev,
      simulatePartialFailure: false,
      simulateAuthError: false,
      simulateTimeout: false,
    }));
    await handleExecuteMcp();
  };

  const formattedDocPreview = pulse && explainer ? formatEntryForGoogleDoc(
    buildMcpPayload(
      pulse,
      explainer,
      topThemes,
      feeEvidence.hasSufficientEvidence
        ? 'Customer confusion regarding Plus $20/month daily voice quota vs unmetered expectations'
        : 'Insufficient fee evidence to substantiate systemic billing issues'
    )
  ) : '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top App Header */}
      <Header
        approvalStatus={approvalRecord.status}
        onResetToHealthy={handleResetToHealthy}
        datasetName={activeDatasetName}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Section 1: Ingestion & Upload */}
        <UploadSection
          onLoadCSV={handleLoadCSV}
          activeDatasetName={activeDatasetName}
        />

        {/* Section 2: Data Quality & Hygiene Card */}
        {qualityReport && <DataQualityCard report={qualityReport} />}

        {/* Section 3: Top 3 Themes & Fee-Related Evidence */}
        <ThemesAndEvidenceView
          topThemes={topThemes}
          feeEvidence={feeEvidence}
        />

        {/* Section 4: Weekly Product Pulse (≤250 words) & Neutral Fee Explainer (≤6 bullets) */}
        {pulse && explainer && (
          <WeeklyPulseCard
            pulse={pulse}
            explainer={explainer}
            approvalStatus={approvalRecord.status}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={() => setIsEditModalOpen(true)}
            approvalInvalidatedNotice={approvalInvalidatedNotice}
          />
        )}

        {/* Section 5: Human Approval Gate & MCP Destination Checkboxes */}
        <HumanApprovalGate
          approvalRecord={approvalRecord}
          currentContentHash={currentContentHash}
          destinations={destinations}
          onToggleDestination={handleToggleDestination}
          onUpdateGoogleDocsUrl={handleUpdateGoogleDocsUrl}
          onUpdateGoogleDocsWebhook={handleUpdateGoogleDocsWebhook}
          onUpdateGoogleDocsBearerToken={handleUpdateGoogleDocsBearerToken}
          onUpdateGoogleDocsMode={handleUpdateGoogleDocsMode}
          onExecuteMcp={handleExecuteMcp}
          isExecuting={isExecutingMcp}
          simulationConfig={simulationConfig}
          onToggleSimulation={handleToggleSimulation}
          onOpenDocModal={() => setIsDocModalOpen(true)}
        />

        {/* Section 6: MCP Action Results & Protocol Inspector Drawer */}
        <McpDispatchDrawer
          results={mcpResults}
          onRetryFailed={handleRetryFailed}
          isRetrying={isExecutingMcp}
          onOpenDocModal={() => setIsDocModalOpen(true)}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        ChatGPT Voice Pulse &amp; HITL MCP Dispatcher • Safe Sandbox Mode Active • Draft-only Gmail integration
      </footer>

      {/* Edit Pulse & Explainer Modal */}
      {pulse && explainer && (
        <EditPulseModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          pulse={pulse}
          explainer={explainer}
          onSave={handleSaveEdits}
        />
      )}

      {/* Google Doc Append Helper Modal */}
      {pulse && explainer && (
        <GoogleDocAppendModal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          formattedText={formattedDocPreview}
          targetDocUrl={destinations.google_docs_url || ''}
          date={pulse.date}
        />
      )}
    </div>
  );
}
