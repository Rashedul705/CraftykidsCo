'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Palette,
  Type,
  Layers,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Phone,
  MessageCircle,
  Truck,
  Eye,
  Trash2,
  Undo2,
  Check,
  Search,
  Filter,
} from 'lucide-react';

import { BRAND_NAME, BRAND_CONFIG } from '@/lib/brand';
import { Button } from '@/components/ui/Button';
import { StatusPill, Pill } from '@/components/ui/Pill';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input, Textarea, Select, FormField } from '@/components/ui/Input';
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { SidePanel } from '@/components/ui/SidePanel';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, Spinner, TableSkeletonRows, CardSkeleton } from '@/components/ui/LoadingState';
import { formatBDT, toBanglaDigits } from '@/lib/utils';

export default function StyleGuidePage() {
  const { toast, success, error, warning, info } = useToast();

  // Interactive component demo state
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [undoStatus, setUndoStatus] = useState<string | null>(null);

  // Form inputs demo state
  const [inputVal, setInputVal] = useState('01712345678');
  const [inputError, setInputError] = useState('');

  const triggerUndoToast = () => {
    setUndoStatus(null);
    toast({
      type: 'warning',
      title: 'Order ORD-849 cancelled',
      message: 'The order status was updated to cancelled.',
      duration: 10000,
      undoLabel: 'Undo cancel',
      undoAction: () => {
        setUndoStatus('Cancellation was undone! Order ORD-849 restored to Confirmed.');
        success('Order ORD-849 restored successfully.');
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B2B2B] py-8 px-4 sm:px-6 lg:px-10">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#EFE9E0]">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-[10px] bg-[#D6403B] text-white flex items-center justify-center font-bold text-sm">
              CK
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-fredoka text-[#2B2B2B]">
              {BRAND_NAME} Design Tokens & Shared Components
            </h1>
          </div>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Build Order Step 1 • Interactive Style Guide for Storefront & Admin Usability
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin"
            className="px-3.5 py-2 rounded-[12px] bg-white border border-[#EFE9E0] text-xs sm:text-sm font-semibold hover:border-[#D6403B] transition-colors inline-flex items-center gap-1.5"
          >
            Go to Admin <ExternalLink className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </Link>
          <Link
            href="/"
            className="px-3.5 py-2 rounded-[12px] bg-[#D6403B] text-white text-xs sm:text-sm font-semibold hover:bg-[#BF3430] transition-colors inline-flex items-center gap-1.5"
          >
            Go to Storefront <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-8 space-y-12">
        {/* BRAND & CORE RULES NOTICE */}
        <div className="bg-white border border-[#EFE9E0] rounded-[16px] p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#D6403B] mb-1">
            0. Global Brand & Token Rules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm text-[#2B2B2B]">
            <div className="p-3 bg-[#FAF7F2] rounded-[12px] border border-[#EFE9E0]">
              <span className="font-semibold block text-[#D6403B]">Central Brand Value</span>
              <p className="text-xs text-[#6B6B6B] mt-1">
                Name: <strong className="text-[#2B2B2B]">{BRAND_NAME}</strong> (stored centrally in{' '}
                <code className="text-xs font-mono bg-white px-1 py-0.5 rounded border border-[#EFE9E0]">
                  src/lib/brand.ts
                </code>
                , never hardcoded across components).
              </p>
            </div>
            <div className="p-3 bg-[#FAF7F2] rounded-[12px] border border-[#EFE9E0]">
              <span className="font-semibold block text-[#D6403B]">Radii & Shadows</span>
              <p className="text-xs text-[#6B6B6B] mt-1">
                Cards: <strong>16px</strong> • Buttons & Inputs: <strong>12px</strong> • Pills:{' '}
                <strong>fully round</strong>. No heavy shadows, no gradients.
              </p>
            </div>
            <div className="p-3 bg-[#FAF7F2] rounded-[12px] border border-[#EFE9E0]">
              <span className="font-semibold block text-[#D6403B]">Language & Numbers</span>
              <p className="text-xs text-[#6B6B6B] mt-1">
                Storefront: Hind Siliguri (Bangla default with toggle) • Admin: English with Fredoka
                for headings & numbers • Integers with ৳.
              </p>
            </div>
          </div>
        </div>

        {/* 1. COLOR TOKENS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#D6403B]" />
            <h2 className="text-xl font-bold font-fredoka text-[#2B2B2B]">
              1. Color Tokens & Palette
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {/* Page Background */}
            <div className="bg-[#FAF7F2] border border-[#EFE9E0] rounded-[16px] p-4 flex flex-col justify-between h-28">
              <div>
                <span className="text-xs font-bold text-[#2B2B2B] block">Page Background</span>
                <span className="text-[11px] text-[#6B6B6B]">Off-white surface</span>
              </div>
              <code className="text-xs font-mono font-bold text-[#2B2B2B]">#FAF7F2</code>
            </div>

            {/* Card Background */}
            <div className="bg-white border border-[#EFE9E0] rounded-[16px] p-4 flex flex-col justify-between h-28">
              <div>
                <span className="text-xs font-bold text-[#2B2B2B] block">Card Background</span>
                <span className="text-[11px] text-[#6B6B6B]">1px border #EFE9E0</span>
              </div>
              <code className="text-xs font-mono font-bold text-[#2B2B2B]">#FFFFFF</code>
            </div>

            {/* Text Primary */}
            <div className="bg-[#2B2B2B] text-white rounded-[16px] p-4 flex flex-col justify-between h-28">
              <div>
                <span className="text-xs font-bold block">Text Primary</span>
                <span className="text-[11px] text-gray-300">Body & headers</span>
              </div>
              <code className="text-xs font-mono font-bold text-gray-200">#2B2B2B</code>
            </div>

            {/* Text Secondary */}
            <div className="bg-[#6B6B6B] text-white rounded-[16px] p-4 flex flex-col justify-between h-28">
              <div>
                <span className="text-xs font-bold block">Text Secondary</span>
                <span className="text-[11px] text-gray-200">Subtitles & helper</span>
              </div>
              <code className="text-xs font-mono font-bold text-gray-100">#6B6B6B</code>
            </div>

            {/* Primary Action */}
            <div className="bg-[#D6403B] text-white rounded-[16px] p-4 flex flex-col justify-between h-28">
              <div>
                <span className="text-xs font-bold block">Primary Action</span>
                <span className="text-[11px] text-red-100">Buttons, active tabs</span>
              </div>
              <code className="text-xs font-mono font-bold text-white">#D6403B</code>
            </div>

            {/* Price & Link Red */}
            <div className="bg-[#C23631] text-white rounded-[16px] p-4 flex flex-col justify-between h-28">
              <div>
                <span className="text-xs font-bold block">Price / Link Red</span>
                <span className="text-[11px] text-red-100">Red on white</span>
              </div>
              <code className="text-xs font-mono font-bold text-white">#C23631</code>
            </div>

            {/* Yellow Accent */}
            <div className="bg-[#FFC93C] text-[#2B2B2B] rounded-[16px] p-4 flex flex-col justify-between h-28">
              <div>
                <span className="text-xs font-bold block">Accent Yellow</span>
                <span className="text-[11px] text-[#2B2B2B]/80">Small amounts only</span>
              </div>
              <code className="text-xs font-mono font-bold text-[#2B2B2B]">#FFC93C</code>
            </div>

            {/* Sky Blue Accent */}
            <div className="bg-[#5BC0EB] text-[#2B2B2B] rounded-[16px] p-4 flex flex-col justify-between h-28">
              <div>
                <span className="text-xs font-bold block">Accent Sky Blue</span>
                <span className="text-[11px] text-[#2B2B2B]/80">Age badges, info</span>
              </div>
              <code className="text-xs font-mono font-bold text-[#2B2B2B]">#5BC0EB</code>
            </div>

            {/* Green Accent */}
            <div className="bg-[#4CAF7A] text-white rounded-[16px] p-4 flex flex-col justify-between h-28">
              <div>
                <span className="text-xs font-bold block">Accent Green</span>
                <span className="text-[11px] text-white/90">Safety, success</span>
              </div>
              <code className="text-xs font-mono font-bold text-white">#4CAF7A</code>
            </div>
          </div>
        </section>

        {/* 2. STATUS PILLS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D6403B]" />
              <h2 className="text-xl font-bold font-fredoka text-[#2B2B2B]">
                2. Status Pills (Soft Backgrounds, Dark Text)
              </h2>
            </div>
            <span className="text-xs text-[#6B6B6B] hidden sm:inline">
              Rule: Never solid bright colors • Fully round radius
            </span>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Yellow Pill */}
                <div className="p-3.5 rounded-[12px] border border-[#EFE9E0] bg-[#FAF7F2] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B6B6B]">Yellow Pill</span>
                    <span className="text-[11px] font-mono text-[#7A4E00]">#FFF3CC</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <StatusPill variant="yellow" dot>
                      Pending (9)
                    </StatusPill>
                    <StatusPill variant="yellow">Processing</StatusPill>
                  </div>
                </div>

                {/* Blue Pill */}
                <div className="p-3.5 rounded-[12px] border border-[#EFE9E0] bg-[#FAF7F2] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B6B6B]">Blue Pill</span>
                    <span className="text-[11px] font-mono text-[#0B5F85]">#DDF1FB</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <StatusPill variant="blue" dot>
                      Shipped (24)
                    </StatusPill>
                    <StatusPill variant="blue">In Transit</StatusPill>
                  </div>
                </div>

                {/* Green Pill */}
                <div className="p-3.5 rounded-[12px] border border-[#EFE9E0] bg-[#FAF7F2] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B6B6B]">Green Pill</span>
                    <span className="text-[11px] font-mono text-[#1F6B43]">#DDF3E6</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <StatusPill variant="green" dot>
                      Delivered (151)
                    </StatusPill>
                    <StatusPill variant="green">স্টকে আছে</StatusPill>
                  </div>
                </div>

                {/* Red Pill */}
                <div className="p-3.5 rounded-[12px] border border-[#EFE9E0] bg-[#FAF7F2] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B6B6B]">Red Pill</span>
                    <span className="text-[11px] font-mono text-[#9B2420]">#FDE3E1</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <StatusPill variant="red" dot>
                      Returned (9)
                    </StatusPill>
                    <StatusPill variant="red">স্টক শেষ</StatusPill>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3. BUTTONS SHOWCASE */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D6403B]" />
              <h2 className="text-xl font-bold font-fredoka text-[#2B2B2B]">
                3. Buttons (12px Radius, Visible Labels)
              </h2>
            </div>
            <span className="text-xs text-[#6B6B6B] hidden sm:inline">
              Touch target &ge; 44px • No heavy shadows
            </span>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Main Actions */}
              <div>
                <h3 className="text-xs font-bold uppercase text-[#6B6B6B] mb-3">
                  Storefront Main Purchase Actions
                </h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="primary">
                    এখনই অর্ডার করুন (Primary Solid #D6403B)
                  </Button>
                  <Button variant="outline">
                    কার্টে যোগ করুন (Outlined Primary)
                  </Button>
                  <Button variant="whatsapp" icon={<MessageCircle className="w-4 h-4" />}>
                    WhatsApp
                  </Button>
                  <Button variant="secondary" icon={<Phone className="w-4 h-4" />}>
                    কল করুন
                  </Button>
                  <Button variant="destructive" icon={<Trash2 className="w-4 h-4" />}>
                    Cancel order
                  </Button>
                  <Button variant="ghost">Secondary Ghost</Button>
                </div>
              </div>

              {/* Sizes and States */}
              <div className="pt-4 border-t border-[#EFE9E0]">
                <h3 className="text-xs font-bold uppercase text-[#6B6B6B] mb-3">
                  Sizes, Loading & Disabled States
                </h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button size="sm" variant="primary">
                    Small (36px)
                  </Button>
                  <Button size="md" variant="primary">
                    Medium (44px)
                  </Button>
                  <Button size="lg" variant="primary">
                    Large (48px)
                  </Button>

                  <Button
                    variant="primary"
                    isLoading={btnLoading}
                    onClick={() => {
                      setBtnLoading(true);
                      setTimeout(() => setBtnLoading(false), 1500);
                    }}
                  >
                    {btnLoading ? 'Processing...' : 'Click to test loading'}
                  </Button>

                  <Button variant="primary" disabled>
                    Disabled Button
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 4. FORM FIELDS & INPUTS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#D6403B]" />
            <h2 className="text-xl font-bold font-fredoka text-[#2B2B2B]">
              4. Form Fields & Inputs
            </h2>
          </div>

          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-[#6B6B6B] mb-4">
                Rules: Every field has a visible label above it • Plain language error messages next
                to the field • 12px radius • Min 16px font size on mobile to prevent zoom.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Standard Input */}
                <Input
                  id="demo-name"
                  label="Customer full name"
                  placeholder="e.g., Ayesha Rahman"
                  helperText="Enter real name for courier delivery verification"
                  required
                />

                {/* Input with live validation / error */}
                <div>
                  <Input
                    id="demo-phone"
                    label="Mobile number (BD 11 digits)"
                    value={inputVal}
                    onChange={(e) => {
                      setInputVal(e.target.value);
                      if (e.target.value.length < 11) {
                        setInputError('Please enter a valid 11-digit number starting with 01');
                      } else {
                        setInputError('');
                      }
                    }}
                    error={inputError}
                    helperText={!inputError ? 'Valid 11-digit mobile number' : undefined}
                    required
                  />
                  <button
                    onClick={() => setInputError('Phone number must start with 01 and have 11 digits')}
                    className="text-[11px] text-[#D6403B] underline mt-1.5 cursor-pointer block"
                  >
                    Simulate error state
                  </button>
                </div>

                {/* Select Dropdown */}
                <Select
                  id="demo-district"
                  label="Delivery district"
                  helperText="Delivery charge updates automatically"
                  required
                >
                  <option value="dhaka">Dhaka City (৳৬০ - ২৪ থেকে ৪৮ ঘণ্টা)</option>
                  <option value="chittagong">Chittagong (৳১২০ - ২ থেকে ৩ দিন)</option>
                  <option value="sylhet">Sylhet (৳১২০ - ২ থেকে ৩ দিন)</option>
                  <option value="rajshahi">Rajshahi (৳১২০ - ২ থেকে ৩ দিন)</option>
                  <option value="other">Outside Dhaka (৳১২০)</option>
                </Select>
              </div>

              {/* Textarea */}
              <div className="mt-5">
                <Textarea
                  id="demo-address"
                  label="Full delivery address"
                  placeholder="House number, road number, area, landmark..."
                  helperText="Clear address ensures 99% successful first-attempt delivery"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 5. DATA TABLES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-[#D6403B]" />
              <h2 className="text-xl font-bold font-fredoka text-[#2B2B2B]">
                5. Data Tables (16px Card, Sentence Case, Horizontal Scroll)
              </h2>
            </div>
            <span className="text-xs text-[#6B6B6B] hidden sm:inline">
              Click row to open details in side panel
            </span>
          </div>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      aria-label="Select all orders"
                      className="rounded accent-[#D6403B] cursor-pointer"
                    />
                  </TableHead>
                  <TableHead>Order number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  className="cursor-pointer"
                  onClick={() => setIsSidePanelOpen(true)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label="Select order ORD-5021"
                      className="rounded accent-[#D6403B] cursor-pointer"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-[#2B2B2B] block">#ORD-5021</span>
                    <span className="text-xs text-[#6B6B6B]">12 mins ago</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-[#2B2B2B] block">Nusrat Jahan</span>
                    <span className="text-xs text-[#6B6B6B]">01712-345678</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-[#2B2B2B] block">Dhaka (Dhanmondi)</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-[#C23631]">৳১,০৫৯</span>
                    <span className="text-[11px] block text-[#6B6B6B]">COD</span>
                  </TableCell>
                  <TableCell>
                    <StatusPill variant="yellow" dot>
                      Pending
                    </StatusPill>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-[#6B6B6B]">Steadfast pending</span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        success('Order #ORD-5021 confirmed successfully');
                      }}
                    >
                      Confirm
                    </Button>
                  </TableCell>
                </TableRow>

                <TableRow
                  className="cursor-pointer"
                  onClick={() => setIsSidePanelOpen(true)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label="Select order ORD-5020"
                      className="rounded accent-[#D6403B] cursor-pointer"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-[#2B2B2B] block">#ORD-5020</span>
                    <span className="text-xs text-[#6B6B6B]">1 hour ago</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-[#2B2B2B] block">Tanvir Ahmed</span>
                    <span className="text-xs text-[#6B6B6B]">01890-123456</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-[#2B2B2B] block">Chittagong</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-[#2B2B2B]">৳১,৮২০</span>
                    <span className="text-[11px] block text-[#1F6B43] font-semibold">bKash Paid</span>
                  </TableCell>
                  <TableCell>
                    <StatusPill variant="blue" dot>
                      Shipped
                    </StatusPill>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-[#0B5F85]">SF-904812</span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => info('Opening Steadfast tracking for SF-904812')}
                    >
                      Track
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </section>

        {/* 6. INTERACTIVE SIDE PANEL, MODALS & TOASTS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D6403B]" />
            <h2 className="text-xl font-bold font-fredoka text-[#2B2B2B]">
              6. Interactive Side Panel, Modals & 10-Second Undo Toasts
            </h2>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-[#6B6B6B]">
                Click the buttons below to test the side panel, destructive confirmation modal
                (stating affected count), and the 10-second reversible undo toast notification.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setIsSidePanelOpen(true)}>
                  <Eye className="w-4 h-4 text-[#D6403B]" />
                  Open order detail side panel
                </Button>

                <Button variant="secondary" onClick={() => setIsConfirmOpen(true)}>
                  Open confirmation dialog (3 items affected)
                </Button>

                <Button variant="destructive" onClick={triggerUndoToast}>
                  Trigger 10s undo toast
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => success('12 orders sent to Steadfast, 0 failed.')}
                >
                  Test success toast
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => error('Phone number must have 11 digits to send to Steadfast.')}
                >
                  Test error toast
                </Button>
              </div>

              {undoStatus && (
                <div className="p-3 bg-[#DDF3E6] border border-[#BDE7CC] text-[#1F6B43] rounded-[12px] text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {undoStatus}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* 7. EMPTY STATES & LOADING SKELETONS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D6403B]" />
            <h2 className="text-xl font-bold font-fredoka text-[#2B2B2B]">
              7. Empty States & Loading Skeletons
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Empty State */}
            <EmptyState
              title="No orders found"
              description="No orders match your selected filter criteria. Try clearing search keywords or changing the date filter."
              actionLabel="Clear all filters"
              onAction={() => info('Filters cleared')}
            />

            {/* Skeleton Loading Demo */}
            <div className="space-y-4 bg-white border border-[#EFE9E0] rounded-[16px] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#6B6B6B]">
                  Pulsing Skeletons & Spinner
                </span>
                <Spinner size="sm" />
              </div>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="pt-2 flex gap-3">
                <Skeleton className="h-10 w-28 rounded-[12px]" />
                <Skeleton className="h-10 w-28 rounded-[12px]" />
              </div>
            </div>
          </div>
        </section>

        {/* 8. BILINGUAL TYPOGRAPHY & INT BDT */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-[#D6403B]" />
            <h2 className="text-xl font-bold font-fredoka text-[#2B2B2B]">
              8. Typography & Currency Formatting
            </h2>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#FAF7F2] rounded-[12px] border border-[#EFE9E0] space-y-1">
                  <span className="text-xs font-bold text-[#6B6B6B]">
                    Bangla Storefront Heading & Body (Hind Siliguri)
                  </span>
                  <h3 className="text-xl font-bold text-[#2B2B2B]">
                    বাচ্চাদের সৃজনশীল কল্পনায় নিরাপদ মোমের রঙ
                  </h3>
                  <p className="text-base text-[#6B6B6B] leading-relaxed">
                    ১০০% ফুড-গ্রেড মোম ও প্রাকৃতিক উপাদানে তৈরি। শিশুর কোমল ত্বকে সম্পূর্ণ নিরাপদ।
                  </p>
                </div>

                <div className="p-4 bg-[#FAF7F2] rounded-[12px] border border-[#EFE9E0] space-y-1">
                  <span className="text-xs font-bold text-[#6B6B6B]">
                    Admin English Heading (Fredoka) & Integer Currency
                  </span>
                  <h3 className="text-xl font-bold font-fredoka text-[#2B2B2B]">
                    Daily Revenue & Order Velocity
                  </h3>
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-2xl font-bold text-[#C23631]">
                      {formatBDT(999, { locale: 'bn' })}
                    </span>
                    <span className="text-base line-through text-[#6B6B6B]">
                      {formatBDT(1299, { locale: 'bn' })}
                    </span>
                    <StatusPill variant="green">সাশ্রয় ৳৩০০</StatusPill>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* SAMPLE SIDE PANEL (DRAWER) */}
      <SidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        title="Order #ORD-5021 Details"
        subtitle="Placed 12 minutes ago from Facebook Store"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setIsSidePanelOpen(false);
                triggerUndoToast();
              }}
            >
              Cancel order
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  info('Printing invoice...');
                }}
              >
                Print invoice
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsSidePanelOpen(false);
                  success('Order #ORD-5021 sent to Steadfast successfully!');
                }}
              >
                Send to Steadfast
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Status and Customer Risk Badge */}
          <div className="flex items-center justify-between p-3.5 bg-[#FAF7F2] rounded-[12px] border border-[#EFE9E0]">
            <div>
              <span className="text-xs text-[#6B6B6B] block">Current order status</span>
              <StatusPill variant="yellow" dot className="mt-1">
                Pending confirmation
              </StatusPill>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#6B6B6B] block">Customer delivery rate</span>
              <StatusPill variant="green" className="mt-1">
                94% success (16/17 delivered)
              </StatusPill>
            </div>
          </div>

          {/* Customer & Phone Contact Strip */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-[#6B6B6B]">Customer Information</h4>
            <div className="p-3.5 bg-white border border-[#EFE9E0] rounded-[12px] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#2B2B2B] block">Nusrat Jahan</span>
                  <span className="text-xs text-[#6B6B6B]">01712-345678</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="tel:01712345678"
                    className="p-2 rounded-[10px] border border-[#EFE9E0] hover:bg-[#FAF7F2] text-[#2B2B2B] transition-colors"
                    aria-label="Call customer"
                  >
                    <Phone className="w-4 h-4 text-[#D6403B]" />
                  </a>
                  <a
                    href="https://wa.me/8801712345678"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-[10px] bg-[#25D366] text-white hover:bg-[#20BA5A] transition-colors"
                    aria-label="WhatsApp customer"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="text-xs text-[#6B6B6B] pt-2 border-t border-[#EFE9E0]">
                <strong className="text-[#2B2B2B]">Address:</strong> House 14, Road 5, Dhanmondi,
                Dhaka.
              </div>
            </div>
          </div>

          {/* Items & Money Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-[#6B6B6B]">Order Items</h4>
            <div className="border border-[#EFE9E0] rounded-[12px] overflow-hidden bg-white text-sm">
              <div className="p-3 border-b border-[#EFE9E0] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#2B2B2B] block">কার পেইন্টিং কিট</span>
                  <span className="text-xs text-[#6B6B6B]">১২ পিস সেট &times; ১</span>
                </div>
                <span className="font-bold text-[#2B2B2B]">৳৯৯৯</span>
              </div>
              <div className="p-3 bg-[#FAF7F2] space-y-1 text-xs">
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Subtotal:</span>
                  <span>৳৯৯৯</span>
                </div>
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Delivery charge (Dhaka):</span>
                  <span>৳৬০</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#2B2B2B] pt-1 border-t border-[#EFE9E0]">
                  <span>Amount to collect (COD):</span>
                  <span className="text-[#C23631]">৳১,০৫৯</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidePanel>

      {/* SAMPLE CONFIRMATION MODAL */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          success('3 orders sent to Steadfast successfully.');
        }}
        title="Send orders to Steadfast"
        message="Are you sure you want to dispatch these consignments to Steadfast courier? Tracking codes will be automatically generated."
        itemCount={3}
        confirmLabel="Send to Steadfast"
        cancelLabel="Review later"
        isDestructive={false}
      />
    </div>
  );
}
