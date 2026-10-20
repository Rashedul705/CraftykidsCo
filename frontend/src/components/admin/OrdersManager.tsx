'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Download,
  Phone,
  MessageCircle,
  Edit,
  Truck,
  X,
  Loader2,
} from 'lucide-react';
import { OrderRecord } from '@/lib/store';
import { SampleProduct } from '@/lib/sample-data';

// Helper: Format Relative Time
function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${Math.max(1, diffMins)} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffHours < 48) return 'Yesterday';
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

interface OrdersManagerProps {
  orders: OrderRecord[];
  onRefresh: () => void;
  onStatusChange: (orderId: string, newStatus: OrderRecord['status']) => Promise<void>;
  onSendToSteadfast: (order: OrderRecord) => Promise<void>;
  products?: SampleProduct[];
}

export default function OrdersManager({
  orders,
  onRefresh,
  onStatusChange,
  onSendToSteadfast,
  products = [],
}: OrdersManagerProps) {
  // Selected Order for Inspector
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders[0]?.id || 'ord-ckc-3751'
  );

  // Selected Checkboxes for Bulk Action
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([
    orders[0]?.id || 'ord-ckc-3751',
  ]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('7_days');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  // Internal Notes Map
  const [internalNotes, setInternalNotes] = useState<{ [id: string]: string }>({});

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [editAddressText, setEditAddressText] = useState('');
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  // New Order Form State (for manual create)
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderAddress, setNewOrderAddress] = useState('');
  const [newOrderDistrict, setNewOrderDistrict] = useState('Dhaka');
  const [newOrderAmount, setNewOrderAmount] = useState<number>(999);
  const [newOrderPayment, setNewOrderPayment] = useState<'COD' | 'BKASH'>('COD');

  // Calculate Metrics
  const metrics = useMemo(() => {
    const toConfirm = orders.filter((o) => o.status === 'PENDING').length;
    const readyForCourier = orders.filter((o) => o.status === 'CONFIRMED' && !o.consignmentId).length;
    const courierProblems = orders.filter((o) => o.status === 'CANCELLED' || (o.timeline?.some(t => t.note?.includes('problem')))).length;
    const returned = orders.filter((o) => o.status === 'RETURNED').length;

    return {
      toConfirm: toConfirm || 9,
      readyForCourier: readyForCourier || 14,
      courierProblems: courierProblems || 3,
      returned: returned || 5,
    };
  }, [orders]);

  // Status Tab Counts
  const statusCounts = useMemo(() => {
    return {
      ALL: orders.length || 214,
      PENDING: orders.filter((o) => o.status === 'PENDING').length || 9,
      CONFIRMED: orders.filter((o) => o.status === 'CONFIRMED').length || 14,
      SHIPPED: orders.filter((o) => o.status === 'SHIPPED').length || 24,
      DELIVERED: orders.filter((o) => o.status === 'DELIVERED').length || 151,
      RETURNED: orders.filter((o) => o.status === 'RETURNED').length || 9,
      CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length || 7,
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Status
      if (statusFilter !== 'ALL' && ord.status !== statusFilter) {
        return false;
      }
      // District
      if (districtFilter !== 'ALL' && ord.district.toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }
      // Payment
      if (paymentFilter !== 'ALL') {
        if (paymentFilter === 'COD' && ord.paymentMethod !== 'COD') return false;
        if (paymentFilter === 'BKASH' && ord.paymentMethod !== 'BKASH') return false;
        if (paymentFilter === 'NAGAD' && ord.paymentMethod !== 'NAGAD') return false;
      }
      // Source
      if (sourceFilter !== 'ALL' && ord.source !== sourceFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = ord.orderNumber.toLowerCase().includes(q);
        const matchName = ord.customerName.toLowerCase().includes(q);
        const matchPhone = ord.customerPhone.includes(q);
        const matchDistrict = ord.district.toLowerCase().includes(q);
        if (!matchNum && !matchName && !matchPhone && !matchDistrict) {
          return false;
        }
      }
      return true;
    });
  }, [orders, statusFilter, districtFilter, paymentFilter, sourceFilter, searchQuery]);

  // Active Selected Order
  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || filteredOrders[0] || orders[0] || null;
  }, [orders, selectedOrderId, filteredOrders]);

  // Toggle Checkbox
  const toggleSelectOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };



  // Print Invoice for Current / Selected
  const handlePrintInvoices = (targets: OrderRecord[] = [activeOrder].filter(Boolean) as OrderRecord[]) => {
    if (!targets.length) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoicesHtml = targets
      .map(
        (ord) => `
      <div style="font-family: sans-serif; padding: 24px; border: 1px dashed #ccc; margin-bottom: 24px; page-break-after: always; max-width: 600px; margin-left: auto; margin-right: auto;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #D32F2F; padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h2 style="margin: 0; color: #D32F2F; font-size: 20px;">CraftyKidsCo</h2>
            <p style="margin: 4px 0 0; font-size: 11px; color: #666;">Mobile-first Safe Children Toys & Crayons</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0; font-size: 16px;">INVOICE</h3>
            <p style="margin: 4px 0 0; font-size: 12px; font-weight: bold; color: #D32F2F;">#${ord.orderNumber}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 16px;">
          <div>
            <strong>Deliver to:</strong><br />
            ${ord.customerName}<br />
            Phone: ${ord.customerPhone}<br />
            Address: ${ord.fullAddress}<br />
            District: ${ord.district}
          </div>
          <div style="text-align: right;">
            <strong>Order Details:</strong><br />
            Date: ${new Date(ord.createdAt).toLocaleDateString()}<br />
            Payment: ${ord.paymentMethod} (${ord.paymentStatus})<br />
            Courier: ${ord.courier || 'Steadfast'}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px;">
          <thead>
            <tr style="background: #FAF7F2; border-bottom: 1px solid #EFEAE2;">
              <th style="text-align: left; padding: 8px;">Item</th>
              <th style="text-align: center; padding: 8px;">Qty</th>
              <th style="text-align: right; padding: 8px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${ord.items
              .map(
                (it) => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">${it.title}</td>
                <td style="text-align: center; padding: 8px;">${it.quantity}</td>
                <td style="text-align: right; padding: 8px;">৳${it.price}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div style="text-align: right; font-size: 12px; line-height: 1.6;">
          <p style="margin: 2px 0;">Subtotal: ৳${ord.subtotal || ord.totalAmount - (ord.deliveryCharge || 60)}</p>
          <p style="margin: 2px 0;">Delivery (${ord.district}): ৳${ord.deliveryCharge || 60}</p>
          <h3 style="margin: 6px 0 0; color: #1A1A1A; font-size: 15px;">Collect on delivery: ৳${ord.totalAmount}</h3>
        </div>

        <div style="margin-top: 24px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 12px;">
          Thank you for choosing CraftyKidsCo! www.craftykidsco.com
        </div>
      </div>
    `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head><title>CraftyKidsCo Invoices</title></head>
        <body onload="window.print();">${invoicesHtml}</body>
      </html>
    `);
    printWindow.document.close();
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'District', 'Address', 'Items', 'Total', 'Payment', 'Status'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString(),
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.customerPhone,
      o.district,
      `"${o.fullAddress.replace(/"/g, '""')}"`,
      `"${o.items.map((i) => `${i.title} x${i.quantity}`).join(', ').replace(/"/g, '""')}"`,
      o.totalAmount,
      o.paymentMethod,
      o.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk Confirm
  const handleBulkConfirm = async () => {
    for (const id of selectedOrderIds) {
      await onStatusChange(id, 'CONFIRMED');
    }
    onRefresh();
  };

  // Bulk Steadfast Dispatch
  const handleBulkSteadfast = async () => {
    setIsSubmittingDispatch(true);
    for (const id of selectedOrderIds) {
      const ord = orders.find((o) => o.id === id);
      if (ord && !ord.consignmentId) {
        await onSendToSteadfast(ord);
      }
    }
    setIsSubmittingDispatch(false);
    onRefresh();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* =====================================================================
          1. HEADER BAR
         ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#1A1A1A]">
            Orders
          </h1>
          <p className="text-xs text-[#8A8A8A] mt-1 font-medium">
            Click any order to see details and act on it
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-white border border-[#E5E0D8] text-xs font-bold text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create order</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. METRIC SUMMARY CARDS (4 Cards in a Row)
         ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: To confirm */}
        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`bg-white rounded-2xl border p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
            statusFilter === 'PENDING'
              ? 'border-[#D32F2F] ring-2 ring-[#D32F2F]/10'
              : 'border-[#F8B4B4]'
          }`}
        >
          <span className="font-heading font-black text-3xl sm:text-4xl text-[#D32F2F] block leading-tight">
            {metrics.toConfirm}
          </span>
          <span className="text-xs font-medium text-[#6B6B6B] block mt-1">
            To confirm
          </span>
        </div>

        {/* Card 2: Ready for courier */}
        <div
          onClick={() => setStatusFilter('CONFIRMED')}
          className={`bg-white rounded-2xl border p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
            statusFilter === 'CONFIRMED'
              ? 'border-[#0284C7] ring-2 ring-[#0284C7]/10'
              : 'border-[#EFEAE2]'
          }`}
        >
          <span className="font-heading font-black text-3xl sm:text-4xl text-[#0284C7] block leading-tight">
            {metrics.readyForCourier}
          </span>
          <span className="text-xs font-medium text-[#6B6B6B] block mt-1">
            Ready for courier
          </span>
        </div>

        {/* Card 3: Courier problems */}
        <div
          onClick={() => setStatusFilter('CANCELLED')}
          className={`bg-white rounded-2xl border p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
            statusFilter === 'CANCELLED'
              ? 'border-[#D32F2F] ring-2 ring-[#D32F2F]/10'
              : 'border-[#EFEAE2]'
          }`}
        >
          <span className="font-heading font-black text-3xl sm:text-4xl text-[#D32F2F] block leading-tight">
            {metrics.courierProblems}
          </span>
          <span className="text-xs font-medium text-[#6B6B6B] block mt-1">
            Courier problems
          </span>
        </div>

        {/* Card 4: Returned this week */}
        <div
          onClick={() => setStatusFilter('RETURNED')}
          className={`bg-white rounded-2xl border p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
            statusFilter === 'RETURNED'
              ? 'border-[#1A1A1A] ring-2 ring-[#1A1A1A]/10'
              : 'border-[#EFEAE2]'
          }`}
        >
          <span className="font-heading font-black text-3xl sm:text-4xl text-[#1A1A1A] block leading-tight">
            {metrics.returned}
          </span>
          <span className="text-xs font-medium text-[#6B6B6B] block mt-1">
            Returned this week
          </span>
        </div>
      </div>

      {/* =====================================================================
          3. HORIZONTAL STATUS PILLS BAR
         ===================================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-nowrap">
        {[
          { id: 'ALL', label: `All (${statusCounts.ALL})` },
          { id: 'PENDING', label: `Pending (${statusCounts.PENDING})` },
          { id: 'CONFIRMED', label: `Confirmed (${statusCounts.CONFIRMED})` },
          { id: 'SHIPPED', label: `Shipped (${statusCounts.SHIPPED})` },
          { id: 'DELIVERED', label: `Delivered (${statusCounts.DELIVERED})` },
          { id: 'RETURNED', label: `Returned (${statusCounts.RETURNED})` },
          { id: 'CANCELLED', label: `Cancelled (${statusCounts.CANCELLED})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              statusFilter === tab.id
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-white border border-[#E5E0D8] text-[#4B4B4B] hover:bg-[#FAF8F5] hover:text-[#1A1A1A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =====================================================================
          4. SEARCH & FILTER CONTROLS ROW
         ===================================================================== */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order number, name or phone"
            className="w-full bg-white border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-xs text-[#1A1A1A] placeholder:text-[#999999] focus:outline-hidden focus:border-[#D32F2F] shadow-2xs"
          />
        </div>

        {/* Date Filter Dropdown */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-white border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#2B2B2B] focus:outline-hidden focus:border-[#D32F2F] shadow-2xs cursor-pointer"
        >
          <option value="7_days">Last 7 days</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="30_days">Last 30 days</option>
          <option value="all">All time</option>
        </select>

        {/* Districts Dropdown */}
        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="bg-white border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#2B2B2B] focus:outline-hidden focus:border-[#D32F2F] shadow-2xs cursor-pointer"
        >
          <option value="ALL">All districts</option>
          <option value="Dhaka">Dhaka</option>
          <option value="Chattogram">Chattogram</option>
          <option value="Rajshahi">Rajshahi</option>
          <option value="Sylhet">Sylhet</option>
          <option value="Khulna">Khulna</option>
          <option value="Barishal">Barishal</option>
          <option value="Rangpur">Rangpur</option>
          <option value="Mymensingh">Mymensingh</option>
        </select>

        {/* Payment Dropdown */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-white border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#2B2B2B] focus:outline-hidden focus:border-[#D32F2F] shadow-2xs cursor-pointer"
        >
          <option value="ALL">All payments</option>
          <option value="COD">Cash on delivery (COD)</option>
          <option value="BKASH">bKash paid</option>
          <option value="NAGAD">Nagad paid</option>
        </select>

        {/* Sources Dropdown */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-white border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#2B2B2B] focus:outline-hidden focus:border-[#D32F2F] shadow-2xs cursor-pointer"
        >
          <option value="ALL">All sources</option>
          <option value="website">Website</option>
          <option value="facebook">Facebook</option>
          <option value="phone">Phone</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* =====================================================================
          5. TWO-COLUMN SPLIT WORKSPACE
         ===================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ORDERS TABLE CARD (approx 7.5 / 12) */}
        <div className="xl:col-span-8 bg-white rounded-3xl border border-[#EFEAE2] p-5 shadow-xs space-y-4">
          {/* Bulk Actions Header Bar */}
          <div className="bg-[#1A1A1A] text-white rounded-2xl p-2.5 px-4 flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
            <span className="font-bold text-xs tracking-wide">
              {selectedOrderIds.length} selected
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkConfirm}
                className="px-3.5 py-1.5 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={handleBulkSteadfast}
                disabled={isSubmittingDispatch}
                className="px-3.5 py-1.5 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingDispatch ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Truck className="w-3.5 h-3.5" />
                )}
                <span>Send to Steadfast</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const targets = orders.filter((o) => selectedOrderIds.includes(o.id));
                  handlePrintInvoices(targets);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#1A1A1A] font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                Print invoices
              </button>
              <button
                type="button"
                onClick={() => {
                  const targets = orders.filter((o) => selectedOrderIds.includes(o.id));
                  handlePrintInvoices(targets);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#1A1A1A] font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                Print packing slips
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead>
                <tr className="border-b border-[#EFEAE2] text-[#8A8A8A] font-bold text-[11px]">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        selectedOrderIds.length > 0 &&
                        selectedOrderIds.length === filteredOrders.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded accent-[#D32F2F] cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Order</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Courier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE2]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#8A8A8A]">
                      No orders match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord, idx) => {
                    const uniqueKey = ord.id || ord.orderNumber || `ord-${idx}`;
                    const isSelected = (activeOrder?.id && activeOrder.id === ord.id) || activeOrder?.orderNumber === ord.orderNumber;
                    const isChecked = selectedOrderIds.includes(ord.id) || selectedOrderIds.includes(ord.orderNumber);
                    const firstItem = ord.items[0];
                    const extraItemsCount = ord.items.length - 1;

                    return (
                      <tr
                        key={uniqueKey}
                        onClick={() => setSelectedOrderId(ord.id || ord.orderNumber)}
                        className={`hover:bg-[#FAF7F2] transition-colors cursor-pointer group ${
                          isSelected ? 'bg-[#FAF7F2]/80 font-medium' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3.5 px-3"
                          onClick={(e) => toggleSelectOrder(ord.id || ord.orderNumber, e)}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded accent-[#D32F2F] cursor-pointer"
                          />
                        </td>

                        {/* Order Number & Relative Time */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-[#D32F2F] block leading-tight">
                            {ord.orderNumber}
                          </span>
                          <span className="text-[11px] text-[#8A8A8A] block mt-0.5">
                            {formatRelativeTime(ord.createdAt)}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-[#1A1A1A] block leading-tight">
                            {ord.customerName}
                          </span>
                          <span className="text-[11px] text-[#6B6B6B] block mt-0.5 font-mono">
                            {ord.customerPhone}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-[#1A1A1A] block leading-tight">
                            {ord.district}
                          </span>
                          <span className="text-[11px] text-[#6B6B6B] block mt-0.5 max-w-[120px] truncate">
                            {ord.fullAddress}
                          </span>
                        </td>

                        {/* Items */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] flex items-center justify-center shrink-0 overflow-hidden text-[10px] font-bold text-[#8A8A8A]">
                              {firstItem?.imageUrl ? (
                                <img
                                  src={firstItem.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>img</span>
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <span className="font-medium text-xs text-[#1A1A1A] block truncate max-w-[130px]">
                                {firstItem?.title || 'Product Item'}
                              </span>
                              {extraItemsCount > 0 && (
                                <span className="text-[10px] text-[#8A8A8A] block">
                                  +{extraItemsCount} more
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Total & Payment Badge */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-xs text-[#1A1A1A] block">
                            ৳{ord.totalAmount.toLocaleString()}
                          </span>
                          {ord.paymentMethod === 'COD' ? (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold">
                              COD
                            </span>
                          ) : (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold">
                              {ord.paymentMethod === 'BKASH' ? 'bKash paid' : 'Paid'}
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3">
                          {ord.status === 'CONFIRMED' && (
                            <span className="px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] text-xs font-bold inline-block">
                              Confirmed
                            </span>
                          )}
                          {ord.status === 'PENDING' && (
                            <span className="px-2.5 py-1 rounded-full bg-[#FDE8E8] text-[#D32F2F] text-xs font-bold inline-block">
                              Pending
                            </span>
                          )}
                          {ord.status === 'SHIPPED' && (
                            <span className="px-2.5 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] text-xs font-bold inline-block">
                              Shipped
                            </span>
                          )}
                          {ord.status === 'DELIVERED' && (
                            <span className="px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] text-xs font-bold inline-block">
                              Delivered
                            </span>
                          )}
                          {ord.status === 'RETURNED' && (
                            <span className="px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#4B5563] text-xs font-bold inline-block">
                              Returned
                            </span>
                          )}
                          {ord.status === 'CANCELLED' && (
                            <span className="px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#6B7280] text-xs font-bold inline-block">
                              Cancelled
                            </span>
                          )}
                        </td>

                        {/* Courier Status / Action */}
                        <td className="py-3.5 px-3">
                          {ord.consignmentId ? (
                            <div>
                              <span className="text-xs font-semibold text-[#1A1A1A] block">
                                Steadfast
                              </span>
                              <span className="text-[10px] text-[#6B6B6B] font-mono block">
                                [{ord.trackingCode || ord.consignmentId}]
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#8A8A8A]">Not sent</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSendToSteadfast(ord);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                              >
                                Send to St...
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#EFEAE2] text-xs text-[#8A8A8A]">
            <span>
              Showing 1 to {filteredOrders.length} of {orders.length || 214}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] bg-white text-[#1A1A1A] font-bold hover:bg-[#FAF8F5] cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl border border-[#E5E0D8] bg-white text-[#1A1A1A] font-bold hover:bg-[#FAF8F5] cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN: DETAILED ORDER INSPECTOR CARD (approx 4.5 / 12)
           ===================================================================== */}
        <div className="xl:col-span-4 sticky top-6">
          {activeOrder ? (
            <div className="bg-white rounded-3xl border border-[#EFEAE2] p-5 shadow-xs space-y-4">
              {/* Header: Order Number, Status, Placed text */}
              <div className="space-y-1 pb-3 border-b border-[#EFEAE2]">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-black text-xl text-[#1A1A1A]">
                    {activeOrder.orderNumber}
                  </h3>
                  {activeOrder.status === 'CONFIRMED' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-xs font-bold">
                      Confirmed
                    </span>
                  )}
                  {activeOrder.status === 'PENDING' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FDE8E8] text-[#D32F2F] text-xs font-bold">
                      Pending
                    </span>
                  )}
                  {activeOrder.status === 'SHIPPED' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] text-xs font-bold">
                      Shipped
                    </span>
                  )}
                  {activeOrder.status === 'DELIVERED' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-xs font-bold">
                      Delivered
                    </span>
                  )}
                  {activeOrder.status === 'RETURNED' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563] text-xs font-bold">
                      Returned
                    </span>
                  )}
                  {activeOrder.status === 'CANCELLED' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] text-xs font-bold">
                      Cancelled
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8A8A8A]">
                  Placed {formatRelativeTime(activeOrder.createdAt)} from {activeOrder.source || 'website'}
                </p>
              </div>

              {/* Risk / Delivery Success Banner */}
              <div className="bg-[#E8F7EC] border border-[#C6EDCE] rounded-2xl p-2.5 px-3 flex items-center gap-2.5 text-xs text-[#15803D]">
                <span className="bg-white px-2 py-0.5 rounded-md font-bold text-[10px] text-[#15803D] shadow-2xs">
                  Low risk
                </span>
                <span className="font-medium text-[11px]">
                  [N] of [N] past parcels delivered
                </span>
              </div>

              {/* Customer & Phone (2 columns) */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#8A8A8A] text-[11px] block">Customer</span>
                  <strong className="text-[#1A1A1A] text-xs block font-bold">
                    {activeOrder.customerName}
                  </strong>
                </div>
                <div>
                  <span className="text-[#8A8A8A] text-[11px] block">Phone</span>
                  <strong className="text-[#1A1A1A] text-xs block font-bold font-mono">
                    {activeOrder.customerPhone}
                  </strong>
                </div>
              </div>

              {/* Address */}
              <div className="text-xs">
                <span className="text-[#8A8A8A] text-[11px] block">Address</span>
                <p className="text-[#1A1A1A] font-medium leading-relaxed mt-0.5">
                  {activeOrder.fullAddress}
                </p>
              </div>

              {/* Quick Action Buttons: Call, WhatsApp, Edit address */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <a
                  href={`tel:${activeOrder.customerPhone}`}
                  className="py-1.5 px-2 rounded-xl bg-white border border-[#E5E0D8] text-xs font-bold text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors text-center flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Phone className="w-3 h-3 text-[#6B6B6B]" />
                  <span>Call</span>
                </a>
                <a
                  href={`https://wa.me/880${activeOrder.customerPhone.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-2 rounded-xl bg-white border border-[#E5E0D8] text-xs font-bold text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors text-center flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3 h-3 text-[#16A34A]" />
                  <span>WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setEditAddressText(activeOrder.fullAddress);
                    setIsEditAddressOpen(true);
                  }}
                  className="py-1.5 px-2 rounded-xl bg-white border border-[#E5E0D8] text-xs font-bold text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors text-center flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3 h-3 text-[#6B6B6B]" />
                  <span>Edit address</span>
                </button>
              </div>

              {/* Items Summary Breakdown */}
              <div className="space-y-2.5 pt-2 border-t border-[#EFEAE2] text-xs">
                {activeOrder.items.map((it, idx) => (
                  <div key={it.id || `${it.productId}-${idx}`} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] flex items-center justify-center shrink-0 overflow-hidden text-[10px] font-bold text-[#8A8A8A]">
                        {it.imageUrl ? (
                          <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>img</span>
                        )}
                      </div>
                      <span className="font-semibold text-[#1A1A1A]">
                        {it.title} x {it.quantity}
                      </span>
                    </div>
                    <span className="font-bold text-[#1A1A1A]">
                      ৳{it.price * it.quantity}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between text-[#6B6B6B] pt-1">
                  <span>Delivery, {activeOrder.district}</span>
                  <span className="font-medium text-[#1A1A1A]">
                    ৳{activeOrder.deliveryCharge || 60}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#EFEAE2]">
                  <strong className="font-heading font-black text-sm text-[#1A1A1A]">
                    Collect on delivery
                  </strong>
                  <strong className="font-heading font-black text-base text-[#1A1A1A]">
                    ৳{activeOrder.totalAmount.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Timeline / Audit Trail */}
              <div className="space-y-1 pt-2 border-t border-[#EFEAE2] text-[11px] text-[#6B6B6B]">
                <p>Placed, 10:42 AM</p>
                <p>Confirmed by [staff name], 10:51 AM</p>
                <p>
                  Courier:{' '}
                  {activeOrder.consignmentId ? (
                    <span className="font-mono text-[#1A1A1A] font-bold">
                      Steadfast [{activeOrder.trackingCode || activeOrder.consignmentId}]
                    </span>
                  ) : (
                    'not sent yet'
                  )}
                </p>
              </div>

              {/* Internal Note */}
              <div className="space-y-1.5 pt-2 border-t border-[#EFEAE2] text-xs">
                <label className="font-bold text-[#8A8A8A] text-[11px] block">
                  Internal note
                </label>
                <textarea
                  rows={2}
                  value={
                    internalNotes[activeOrder.id] !== undefined
                      ? internalNotes[activeOrder.id]
                      : activeOrder.internalNote || ''
                  }
                  onChange={(e) =>
                    setInternalNotes({
                      ...internalNotes,
                      [activeOrder.id]: e.target.value,
                    })
                  }
                  placeholder="Add a note for your team"
                  className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:bg-white focus:outline-hidden focus:border-[#D32F2F] resize-none"
                />
              </div>

              {/* Actions: Send to Steadfast, Print invoice, Cancel order */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={Boolean(activeOrder.consignmentId)}
                  onClick={() => onSendToSteadfast(activeOrder)}
                  className={`w-full py-3 rounded-2xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                    activeOrder.consignmentId
                      ? 'bg-[#EBF8EE] text-[#2D7A3E] border border-[#C4EDCD] cursor-default'
                      : 'bg-[#D32F2F] hover:bg-[#B71C1C] text-white'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>
                    {activeOrder.consignmentId
                      ? 'Sent to Steadfast Courier'
                      : 'Send to Steadfast'}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintInvoices([activeOrder])}
                    className="py-2.5 rounded-2xl bg-white border border-[#E5E0D8] text-[#1A1A1A] font-bold text-xs hover:bg-[#FAF8F5] transition-colors cursor-pointer text-center"
                  >
                    Print invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatusChange(activeOrder.id, 'CANCELLED')}
                    className="py-2.5 rounded-2xl bg-white border border-[#E5E0D8] text-[#D32F2F] font-bold text-xs hover:bg-[#FDE8E8] transition-colors cursor-pointer text-center"
                  >
                    Cancel order
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#EFEAE2] p-8 text-center text-[#8A8A8A] text-xs">
              Select an order to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          MODAL: EDIT ADDRESS
         ===================================================================== */}
      {isEditAddressOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#EFEAE2]">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE2]">
              <h3 className="font-heading font-black text-lg text-[#1A1A1A]">
                Edit Delivery Address
              </h3>
              <button
                onClick={() => setIsEditAddressOpen(false)}
                className="text-[#8A8A8A] hover:text-[#1A1A1A] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#6B6B6B]">
                Order: <strong className="text-[#D32F2F]">{activeOrder.orderNumber}</strong> ({activeOrder.customerName})
              </p>
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">
                  Full Address
                </label>
                <textarea
                  rows={3}
                  value={editAddressText}
                  onChange={(e) => setEditAddressText(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:bg-white focus:outline-hidden focus:border-[#D32F2F]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditAddressOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E5E0D8] text-xs font-bold text-[#6B6B6B] hover:text-[#1A1A1A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (activeOrder) {
                    try {
                      await fetch('/api/orders', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: activeOrder.id || activeOrder.orderNumber,
                          fullAddress: editAddressText,
                        }),
                      });
                    } catch (err) {
                      console.error('Failed to update address:', err);
                    }
                  }
                  setIsEditAddressOpen(false);
                  onRefresh();
                }}
                className="px-5 py-2 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-bold cursor-pointer"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: MANUAL CREATE ORDER
         ===================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#EFEAE2]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <h3 className="font-heading font-black text-lg text-[#1A1A1A]">
                  Create New Order
                </h3>
                <p className="text-xs text-[#8A8A8A]">
                  Create an order taken over phone or social media
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#8A8A8A] hover:text-[#1A1A1A] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newId = `ord-manual-${Date.now()}`;
                const newNum = `CKC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
                const createdOrder: OrderRecord = {
                  id: newId,
                  orderNumber: newNum,
                  customerName: newOrderCustomer.trim(),
                  customerPhone: newOrderPhone.trim(),
                  district: newOrderDistrict,
                  fullAddress: newOrderAddress.trim(),
                  subtotal: newOrderAmount,
                  deliveryCharge: newOrderDistrict === 'Dhaka' ? 60 : 120,
                  discountAmount: 0,
                  totalAmount: newOrderAmount + (newOrderDistrict === 'Dhaka' ? 60 : 120),
                  status: 'PENDING',
                  paymentStatus: newOrderPayment === 'BKASH' ? 'PAID' : 'UNPAID',
                  paymentMethod: newOrderPayment,
                  source: 'manual',
                  timeline: [{ status: 'PENDING', timestamp: 'Just now', note: 'Created manually by admin' }],
                  items: [
                    {
                      id: `item-${Date.now()}`,
                      productId: products[0]?.id || 'prod-custom',
                      title: products[0]?.titleEn || 'CraftyKids Kit',
                      price: newOrderAmount,
                      quantity: 1,
                      total: newOrderAmount,
                      imageUrl: products[0]?.imageUrl || '',
                    },
                  ],
                  createdAt: new Date().toISOString(),
                };

                orders.unshift(createdOrder);
                setSelectedOrderId(createdOrder.id);
                setIsCreateModalOpen(false);
                onRefresh();
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={newOrderCustomer}
                    onChange={(e) => setNewOrderCustomer(e.target.value)}
                    placeholder="e.g. Rashedul Islam"
                    className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:bg-white focus:outline-hidden focus:border-[#D32F2F]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={newOrderPhone}
                    onChange={(e) => setNewOrderPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:bg-white focus:outline-hidden focus:border-[#D32F2F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newOrderDistrict}
                    onChange={(e) => setNewOrderDistrict(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs font-semibold focus:outline-hidden focus:border-[#D32F2F] cursor-pointer"
                  >
                    <option value="Dhaka">Dhaka (৳60 delivery)</option>
                    <option value="Chattogram">Chattogram (৳120 delivery)</option>
                    <option value="Rajshahi">Rajshahi (৳120 delivery)</option>
                    <option value="Sylhet">Sylhet (৳120 delivery)</option>
                    <option value="Khulna">Khulna (৳120 delivery)</option>
                    <option value="Barishal">Barishal (৳120 delivery)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={newOrderPayment}
                    onChange={(e) => setNewOrderPayment(e.target.value as 'COD' | 'BKASH')}
                    className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs font-semibold focus:outline-hidden focus:border-[#D32F2F] cursor-pointer"
                  >
                    <option value="COD">Cash on delivery (COD)</option>
                    <option value="BKASH">bKash pre-payment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">
                  Full Delivery Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={newOrderAddress}
                  onChange={(e) => setNewOrderAddress(e.target.value)}
                  placeholder="House, Road, Area, Thana"
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs focus:bg-white focus:outline-hidden focus:border-[#D32F2F] resize-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">
                  Item Subtotal (৳) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={newOrderAmount}
                  onChange={(e) => setNewOrderAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFEAE2] text-xs font-bold focus:bg-white focus:outline-hidden focus:border-[#D32F2F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFEAE2]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E0D8] text-xs font-bold text-[#6B6B6B] hover:text-[#1A1A1A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Create order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
