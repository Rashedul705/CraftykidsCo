'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Clock,
  Send,
  Smartphone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Check,
  X,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  ShieldCheck,
  Upload,
  Percent,
  FileSpreadsheet,
  AlertTriangle,
  Loader2,
  Tag,
} from 'lucide-react';
import {
  SmsCampaignRecord,
  AUDIENCE_SEGMENTS,
  CAMPAIGN_TEMPLATES,
  AudienceSegmentKey,
  calculateSmsParts,
} from '@/lib/campaigns-store';
import { StatusPill } from '@/components/ui/Pill';

export function SmsCampaignsManager() {
  // Campaign Form State
  const [campaignName, setCampaignName] = useState('উইকেন্ড স্পেশাল ক্রাফট অফার');
  const [messageText, setMessageText] = useState(
    'প্রিয় {name}, CraftyKidsCo-তে শুরু হয়েছে বিশেষ উইকেন্ড সেল! আজই অর্ডার করুন এবং {coupon} ব্যবহারে পান ১৫% অতিরিক্ত ছাড়: {link}'
  );
  const [couponCode, setCouponCode] = useState('CRAFTY15');
  const [selectedSegment, setSelectedSegment] = useState<AudienceSegmentKey>('ordered_30d');
  const [sendTiming, setSendTiming] = useState<'now' | 'schedule'>('now');
  const [scheduledDateTime, setScheduledDateTime] = useState('2026-10-22T10:00');

  // Opt-out and Fatigue Protection Ticks
  const [skipOptOut, setSkipOptOut] = useState(true);
  const [skipRecentMarketing7d, setSkipRecentMarketing7d] = useState(true);
  const [skipOpenOrders, setSkipOpenOrders] = useState(true);

  // Test SMS State
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Review & Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  // Gateway and Campaigns Data
  const [balance, setBalance] = useState<number>(2450.0);
  const [campaigns, setCampaigns] = useState<SmsCampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Fetch campaigns and balance
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success) {
        if (typeof data.balance === 'number') setBalance(data.balance);
        if (data.campaigns) setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live Bangla / Unicode character and SMS counter
  const smsStats = useMemo(() => {
    return calculateSmsParts(messageText);
  }, [messageText]);

  // Selected Segment Details
  const activeSegment = useMemo(() => {
    return AUDIENCE_SEGMENTS.find((s) => s.key === selectedSegment) || AUDIENCE_SEGMENTS[0];
  }, [selectedSegment]);

  // Calculate estimated recipients after protection filters
  const estimatedRecipients = useMemo(() => {
    let count = activeSegment.count;
    if (skipOptOut) count = Math.round(count * 0.98); // ~2% opted out
    if (skipRecentMarketing7d) count = Math.round(count * 0.88); // ~12% contacted in last 7 days
    if (skipOpenOrders) count = Math.round(count * 0.94); // ~6% open orders
    return Math.max(1, count);
  }, [activeSegment, skipOptOut, skipRecentMarketing7d, skipOpenOrders]);

  // Total SMS calculation
  const totalSmsCount = estimatedRecipients * (smsStats.smsCount || 1);
  const costPerSms = 0.35;
  const estimatedCost = Math.round(totalSmsCount * costPerSms * 100) / 100;
  const balanceAfterSending = Math.max(0, Math.round((balance - estimatedCost) * 100) / 100);

  // Insert Variable at cursor position
  const handleInsertVariable = (variable: '{name}' | '{coupon}' | '{link}') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = messageText;
    const newText = text.substring(0, start) + variable + text.substring(end);
    setMessageText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 50);
  };

  // Select Template
  const handleSelectTemplate = (templateText: string) => {
    setMessageText(templateText);
  };

  // Send Test SMS
  const handleSendTestSms = async () => {
    if (!testPhoneNumber.trim()) {
      setTestResult({ success: false, message: 'Please enter a valid phone number.' });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-test',
          phone: testPhoneNumber.trim(),
          message: messageText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: 'Test SMS sent to ' + testPhoneNumber });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send test SMS.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Network error.' });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Launch Campaign
  const handleLaunchCampaign = async () => {
    setIsLaunching(true);
    try {
      const payload = {
        name: campaignName,
        message: messageText,
        audienceSegment: selectedSegment,
        audienceLabel: activeSegment.label,
        recipientCount: estimatedRecipients,
        sendNow: sendTiming === 'now',
        scheduledFor: sendTiming === 'schedule' ? scheduledDateTime : undefined,
        couponCode: couponCode || undefined,
        skipOptOut,
        skipRecentMarketing7d,
        skipOpenOrders,
      };

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setShowConfirmModal(false);
        fetchData();
      } else {
        showToast(data.error || 'Failed to launch campaign', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error launching campaign', 'error');
    } finally {
      setIsLaunching(false);
    }
  };

  // Formatted preview text for phone screen
  const simulatedMessage = useMemo(() => {
    return messageText
      .replace(/{name}/g, 'আরিয়ান')
      .replace(/{coupon}/g, couponCode || 'CRAFTY15')
      .replace(/{link}/g, 'craftykidsco.com/deals');
  }, [messageText, couponCode]);

  return (
    <div className="space-y-8">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border text-sm font-semibold ${
            feedback.type === 'success'
              ? 'bg-[#DDF3E6] text-[#1F6B43] border-[#1F6B43]/20'
              : 'bg-[#FDE3E1] text-[#9B2420] border-[#9B2420]/20'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header & Balance Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-fredoka text-[#2B2B2B] flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#D6403B]" />
            SMS Campaigns & Marketing
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            BulkSMSBD gateway integration with live Bangla character counting and opt-out protection.
          </p>
        </div>

        {/* Live Balance Card */}
        <div className="bg-white px-4 py-2.5 rounded-2xl border border-[#EFE9E0] flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#DDF1FB] text-[#0B5F85] flex items-center justify-center font-bold text-xs">
            ৳
          </div>
          <div>
            <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block">
              Gateway Balance
            </span>
            <span className="text-base font-black font-fredoka text-[#2B2B2B]">
              ৳{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Campaign Builder (Order per Spec B7: 1. Write message -> 2. Choose customers -> 3. Choose when -> Sticky Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 Columns): 1. Message, 2. Audience, 3. Timing */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: WRITE THE MESSAGE */}
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-sm text-[#2B2B2B] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#D6403B] text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Write the Message
              </h3>

              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#EFE9E0] text-[#6B6B6B]">
                Sender: <strong>CraftyKids</strong>
              </span>
            </div>

            {/* Campaign Name & Coupon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                  Campaign Title (Internal Reference)
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="যেমন: উইকেন্ড স্পেশাল ক্রাফট অফার"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                  Attached Coupon
                </label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="CRAFTY15"
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] uppercase focus:outline-none focus:border-[#D6403B]"
                />
              </div>
            </div>

            {/* Template Buttons */}
            <div>
              <span className="text-[11px] font-bold text-[#6B6B6B] block mb-1.5">
                Quick Template Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CAMPAIGN_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl.text)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#FAF7F2] hover:bg-[#EFE9E0] text-[#2B2B2B] border border-[#EFE9E0] transition-colors cursor-pointer"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Box with live Character & Bangla SMS count */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#2B2B2B]">
                  SMS Content (Supports Bangla Unicode)
                </label>
                {/* Variable Buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#6B6B6B] mr-1">Insert Variable:</span>
                  {(['{name}', '{coupon}', '{link}'] as const).map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => handleInsertVariable(variable)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#DDF1FB] text-[#0B5F85] hover:bg-[#BAE6FD] transition-colors"
                      title={`Click to insert ${variable}`}
                    >
                      +{variable}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                ref={textareaRef}
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B] leading-relaxed resize-none"
                placeholder="আপনার ক্যাম্পেইন বার্তা লিখুন..."
              />

              {/* Live Character & SMS Counter Strip */}
              <div className="flex items-center justify-between text-xs pt-1 px-1 text-[#6B6B6B]">
                <div className="flex items-center gap-3">
                  <span>
                    Characters:{' '}
                    <strong className="text-[#2B2B2B] font-mono">
                      {smsStats.charCount}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Encoding:{' '}
                    <span
                      className={`font-semibold ${
                        smsStats.isUnicode ? 'text-[#D6403B]' : 'text-[#1F6B43]'
                      }`}
                    >
                      {smsStats.isUnicode ? 'Bangla (Unicode)' : 'English (GSM)'}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px]">
                    Remaining in part: {smsStats.remainingInCurrentPart}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-[#DDF3E6] text-[#1F6B43]">
                    {smsStats.smsCount} SMS / recipient
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: CHOOSE CUSTOMERS */}
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
            <h3 className="font-heading font-black text-sm text-[#2B2B2B] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#D6403B] text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              Choose Customers & Audience
            </h3>

            {/* Audience Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#2B2B2B]">
                Select Target Segment:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AUDIENCE_SEGMENTS.map((seg) => {
                  const isSelected = selectedSegment === seg.key;
                  return (
                    <div
                      key={seg.key}
                      onClick={() => setSelectedSegment(seg.key)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#D6403B] bg-[#FDE3E1]/20 shadow-2xs ring-1 ring-[#D6403B]/30'
                          : 'border-[#EFE9E0] bg-[#FAF7F2] hover:bg-white'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-[#2B2B2B] block">
                          {seg.label}
                        </span>
                        <span className="text-[10px] text-[#6B6B6B]">
                          {seg.description}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white border border-[#EFE9E0] text-[#2B2B2B] shrink-0">
                        {seg.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Opt-out and Fatigue Protection Checkboxes */}
            <div className="pt-3 border-t border-[#EFE9E0] space-y-2.5">
              <span className="text-xs font-bold text-[#2B2B2B] block">
                Audience Protection & Fatigue Rules:
              </span>
              <div className="space-y-2 text-xs text-[#2B2B2B]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipOptOut}
                    onChange={(e) => setSkipOptOut(e.target.checked)}
                    className="rounded text-[#D6403B] focus:ring-[#D6403B]"
                  />
                  <span>Skip customers who opted out of promotional SMS</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipRecentMarketing7d}
                    onChange={(e) => setSkipRecentMarketing7d(e.target.checked)}
                    className="rounded text-[#D6403B] focus:ring-[#D6403B]"
                  />
                  <span>Skip customers who received any marketing SMS in the last 7 days</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipOpenOrders}
                    onChange={(e) => setSkipOpenOrders(e.target.checked)}
                    className="rounded text-[#D6403B] focus:ring-[#D6403B]"
                  />
                  <span>Skip customers who currently have an active / open order</span>
                </label>
              </div>
            </div>
          </div>

          {/* STEP 3: CHOOSE WHEN TO SEND */}
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
            <h3 className="font-heading font-black text-sm text-[#2B2B2B] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#D6403B] text-white text-xs flex items-center justify-center font-bold">
                3
              </span>
              Delivery Timing
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSendTiming('now')}
                className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  sendTiming === 'now'
                    ? 'bg-[#2B2B2B] text-white border-[#2B2B2B] shadow-xs'
                    : 'bg-[#FAF7F2] text-[#6B6B6B] border-[#EFE9E0] hover:text-[#2B2B2B]'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Send Immediately</span>
              </button>

              <button
                type="button"
                onClick={() => setSendTiming('schedule')}
                className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  sendTiming === 'schedule'
                    ? 'bg-[#2B2B2B] text-white border-[#2B2B2B] shadow-xs'
                    : 'bg-[#FAF7F2] text-[#6B6B6B] border-[#EFE9E0] hover:text-[#2B2B2B]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Schedule for Later</span>
              </button>
            </div>

            {sendTiming === 'schedule' && (
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EFE9E0] space-y-1.5 animate-in fade-in">
                <label className="block text-xs font-semibold text-[#2B2B2B]">
                  Select Date & Time for Dispatch
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-[#EFE9E0]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 Columns): STICKY PHONE-STYLE PREVIEW PANEL */}
        <div className="lg:col-span-5 sticky top-6 space-y-6">
          <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-5">
            <h3 className="font-heading font-black text-sm text-[#2B2B2B] flex items-center justify-between">
              <span>Sticky Live Preview</span>
              <span className="text-[10px] text-[#6B6B6B] font-mono">Mobile View</span>
            </h3>

            {/* Realistic Smartphone Screen Mockup */}
            <div className="mx-auto max-w-[280px] bg-[#1A1A1A] rounded-[38px] p-3 shadow-2xl border-4 border-[#2B2B2B]">
              <div className="bg-[#FAF7F2] rounded-[28px] overflow-hidden flex flex-col h-[380px] border border-[#EFEAE2]">
                {/* Phone Speaker/Camera Notch */}
                <div className="bg-white py-2 px-4 border-b border-[#EFEAE2] flex items-center justify-center relative">
                  <div className="w-14 h-3.5 bg-[#1A1A1A] rounded-full" />
                </div>

                {/* Chat Top Bar */}
                <div className="bg-white px-3 py-2 border-b border-[#EFEAE2] flex items-center gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#D6403B] text-white flex items-center justify-center font-bold text-[10px]">
                    CK
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2B2B2B] block leading-tight">
                      CraftyKids
                    </span>
                    <span className="text-[9px] text-[#1F6B43] flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1F6B43]" />
                      Verified Sender ID
                    </span>
                  </div>
                </div>

                {/* Chat Bubble Body */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2 flex flex-col justify-end">
                  <div className="bg-[#FFFFFF] p-3 rounded-2xl rounded-bl-xs border border-[#EFE9E0] shadow-xs text-xs text-[#2B2B2B] leading-relaxed break-words">
                    <p className="whitespace-pre-wrap">{simulatedMessage}</p>
                    <span className="text-[9px] text-[#8A8A8A] block text-right mt-1.5 font-mono">
                      Just now • 1 SMS
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Metrics Breakdown */}
            <div className="space-y-2.5 pt-3 border-t border-[#EFE9E0] text-xs">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Selected Audience:</span>
                <span className="font-bold text-[#2B2B2B]">
                  {estimatedRecipients} customers
                </span>
              </div>
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Message Length:</span>
                <span className="font-bold text-[#2B2B2B]">
                  {smsStats.smsCount} SMS ({smsStats.isUnicode ? 'Bangla' : 'English'})
                </span>
              </div>
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Total Messages to Send:</span>
                <span className="font-mono font-bold text-[#2B2B2B]">
                  {totalSmsCount.toLocaleString()} SMS
                </span>
              </div>
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Estimated Cost (৳0.35/SMS):</span>
                <span className="font-mono font-bold text-[#D6403B]">
                  ৳{estimatedCost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[#6B6B6B] pt-2 border-t border-[#EFE9E0]">
                <span>Balance after Sending:</span>
                <span className="font-mono font-bold text-[#1F6B43]">
                  ৳{balanceAfterSending.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Test Number Field & Send Test Button */}
            <div className="pt-2 border-t border-[#EFE9E0] space-y-2">
              <label className="text-[11px] font-bold text-[#2B2B2B] block">
                Send Test SMS (to verify on physical phone):
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] focus:outline-none focus:border-[#D6403B]"
                />
                <button
                  type="button"
                  disabled={isSendingTest}
                  onClick={handleSendTestSms}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE9E0] text-[#2B2B2B] text-xs font-bold border border-[#EFE9E0] transition-colors shrink-0"
                >
                  {isSendingTest ? 'Sending...' : 'Send test'}
                </button>
              </div>

              {testResult && (
                <div
                  className={`text-[11px] p-2 rounded-lg font-semibold ${
                    testResult.success
                      ? 'bg-[#DDF3E6] text-[#1F6B43]'
                      : 'bg-[#FDE3E1] text-[#9B2420]'
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>

            {/* Review & Send Button (Always shows modal confirmation) */}
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-3 rounded-xl bg-[#D6403B] hover:bg-[#C23631] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Review and send campaign</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RECENT CAMPAIGNS TABLE (SENT, DELIVERED, FAILED, COUPON USES)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#EFE9E0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#EFE9E0]">
          <div>
            <h3 className="font-heading font-black text-base text-[#2B2B2B]">
              Recent Campaigns History
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Track past campaign delivery, failures, and coupon conversions
            </p>
          </div>
          <span className="text-xs font-mono text-[#6B6B6B]">
            Total: {campaigns.length} campaigns
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-[#EFE9E0] text-[#6B6B6B] uppercase font-semibold text-[11px] tracking-wider bg-[#FAF7F2]/50">
                <th className="py-2.5 px-3">Campaign</th>
                <th className="py-2.5 px-3">Audience</th>
                <th className="py-2.5 px-3">Timing</th>
                <th className="py-2.5 px-3">Sent</th>
                <th className="py-2.5 px-3">Delivered</th>
                <th className="py-2.5 px-3">Failed</th>
                <th className="py-2.5 px-3">Coupon Uses</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0]">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-[#2B2B2B] block">{camp.name}</span>
                    <span className="text-[11px] text-[#6B6B6B] line-clamp-1 max-w-[220px]">
                      {camp.message}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#2B2B2B] font-medium">
                    {camp.audienceLabel}
                  </td>
                  <td className="py-3 px-3 text-[#6B6B6B] text-[11px]">
                    {camp.scheduledFor ? `Scheduled: ${camp.scheduledFor}` : 'Sent now'}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#2B2B2B]">
                    {camp.sentCount}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#1F6B43]">
                    {camp.deliveredCount}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#9B2420]">
                    {camp.failedCount}
                  </td>
                  <td className="py-3 px-3">
                    {camp.couponCode ? (
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-[#0B5F85]">
                        <Tag className="w-3 h-3" />
                        {camp.couponUses} ({camp.couponCode})
                      </span>
                    ) : (
                      <span className="text-[#8A8A8A]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {camp.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DDF3E6] text-[#1F6B43]">
                        Completed
                      </span>
                    ) : camp.status === 'scheduled' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DDF1FB] text-[#0B5F85]">
                        Scheduled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF3CC] text-[#7A4E00]">
                        Draft
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          FINAL CONFIRMATION MODAL (SPEC B7: ALWAYS SHOWS EXACT NUMBERS)
         ========================================================================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-[#EFE9E0] animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FDE3E1] text-[#D6403B] flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-[#2B2B2B]">
                  Confirm Campaign Dispatch
                </h3>
                <span className="text-xs text-[#6B6B6B]">
                  Please review the exact campaign parameters
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Campaign Name:</span>
                <span className="font-bold text-[#2B2B2B]">{campaignName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Audience Segment:</span>
                <span className="font-bold text-[#2B2B2B]">{activeSegment.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Filtered Recipients:</span>
                <span className="font-mono font-bold text-[#2B2B2B]">
                  {estimatedRecipients} customers
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Total SMS Parts:</span>
                <span className="font-mono font-bold text-[#2B2B2B]">
                  {totalSmsCount.toLocaleString()} SMS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Dispatch Timing:</span>
                <span className="font-bold text-[#2B2B2B]">
                  {sendTiming === 'now' ? 'Immediately in background queue' : scheduledDateTime}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#EFE9E0]">
                <span className="font-bold text-[#2B2B2B]">Total Gateway Cost:</span>
                <span className="font-mono font-black text-[#D6403B] text-sm">
                  ৳{estimatedCost.toFixed(2)} BDT
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
              SMS will be sent in small batches via BulkSMSBD background queue without slowing down the storefront.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EFE9E0]">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isLaunching}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6B6B] hover:text-[#2B2B2B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchCampaign}
                disabled={isLaunching}
                className="px-5 py-2 rounded-xl bg-[#D6403B] hover:bg-[#C23631] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                {isLaunching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{sendTiming === 'now' ? 'Dispatch Now' : 'Confirm Schedule'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
