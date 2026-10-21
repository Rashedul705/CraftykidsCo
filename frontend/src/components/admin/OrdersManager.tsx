'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Download,
  Phone,
  MessageCircle,
  Truck,
  Printer,
  FileText,
  X,
  Loader2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ChevronDown,
  MoreVertical,
  Edit2,
  Check,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Eye,
  Calendar,
} from 'lucide-react';
import { OrderRecord } from '@/lib/store';
import { SampleProduct } from '@/lib/sample-data';
import { formatBDT } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/Pill';
import { Card, CardContent } from '@/components/ui/Card';
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
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';

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
  const { success, error, warning, info } = useToast();

  // Selected Order for Right-Side Detail Panel
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // Selected Checkboxes for Bulk Action
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [todoFilter, setTodoFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('7_days');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [editAddressText, setEditAddressText] = useState('');
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);
  const [activeDropdownRowId, setActiveDropdownRowId] = useState<string | null>(null);

  // Internal Notes Map (orderId -> note)
  const [internalNotes, setInternalNotes] = useState<{ [id: string]: string }>({});
  const [currentNoteInput, setCurrentNoteInput] = useState('');

  // Confirmation Modal
  const [confirmDialogData, setConfirmDialogData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemCount?: number;
    action: () => void;
    isDestructive?: boolean;
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  // Manual Order Creation Form State
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderPhone, setNewOrderPhone] = useState('');
  const [newOrderAddress, setNewOrderAddress] = useState('');
  const [newOrderDistrict, setNewOrderDistrict] = useState('Dhaka');
  const [newOrderAmount, setNewOrderAmount] = useState<number>(999);
  const [newOrderPayment, setNewOrderPayment] = useState<'COD' | 'BKASH'>('COD');
  const [newOrderSource, setNewOrderSource] = useState<'facebook' | 'whatsapp' | 'phone'>('facebook');

  // Live Customer Delivery Fraud Check Cache
  const [customerRisk, setCustomerRisk] = useState<{
    deliveryRatio?: number;
    returnRatio?: number;
    cancellationRatio?: number;
    isRisky?: boolean;
    totalReports?: number;
    pastSuccessRate?: number;
    totalDeliveries?: number;
    returnCount?: number;
  } | null>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);

  // Active Selected Order
  const activeOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Load customer risk whenever active order changes
  useEffect(() => {
    if (activeOrder?.customerPhone) {
      setIsLoadingRisk(true);
      fetch(`/api/courier/fraud-check?phone=${encodeURIComponent(activeOrder.customerPhone)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCustomerRisk(data);
          } else {
            setCustomerRisk(null);
          }
        })
        .catch(() => setCustomerRisk(null))
        .finally(() => setIsLoadingRisk(false));
    } else {
      setCustomerRisk(null);
    }
  }, [activeOrder?.customerPhone]);

  // Sync internal note input when active order changes
  useEffect(() => {
    if (activeOrder) {
      setCurrentNoteInput(internalNotes[activeOrder.id] || activeOrder.internalNote || '');
    }
  }, [activeOrder, internalNotes]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = () => setActiveDropdownRowId(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  // 1. Metric Summary Counts for the 4 "To do" Cards
  const metrics = useMemo(() => {
    const toConfirm = orders.filter((o) => o.status === 'PENDING').length;
    const readyForCourier = orders.filter(
      (o) => o.status === 'CONFIRMED' && !o.consignmentId && !o.trackingCode
    ).length;
    const courierProblems = orders.filter(
      (o) => o.status === 'CANCELLED' || o.timeline?.some((t) => t.note?.toLowerCase().includes('problem'))
    ).length;
    const returned = orders.filter((o) => o.status === 'RETURNED').length;

    return {
      toConfirm,
      readyForCourier,
      courierProblems,
      returned,
    };
  }, [orders]);

  // 2. Status Counts in Sentence Case
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      confirmed: orders.filter((o) => o.status === 'CONFIRMED').length,
      shipped: orders.filter((o) => o.status === 'SHIPPED').length,
      delivered: orders.filter((o) => o.status === 'DELIVERED').length,
      returned: orders.filter((o) => o.status === 'RETURNED').length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
    };
  }, [orders]);

  // 3. Filtered Orders List
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Todo Card Shortcut filter
      if (todoFilter === 'TO_CONFIRM' && ord.status !== 'PENDING') return false;
      if (todoFilter === 'READY_COURIER' && (ord.status !== 'CONFIRMED' || ord.consignmentId)) return false;
      if (todoFilter === 'COURIER_PROBLEMS' && ord.status !== 'CANCELLED') return false;
      if (todoFilter === 'RETURNED' && ord.status !== 'RETURNED') return false;

      // Status tab filter
      if (!todoFilter && statusFilter !== 'ALL' && ord.status !== statusFilter) {
        return false;
      }

      // District filter
      if (districtFilter !== 'ALL' && ord.district.toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      // Payment filter
      if (paymentFilter !== 'ALL') {
        if (paymentFilter === 'COD' && ord.paymentMethod !== 'COD') return false;
        if (paymentFilter === 'BKASH' && ord.paymentMethod !== 'BKASH') return false;
        if (paymentFilter === 'NAGAD' && ord.paymentMethod !== 'NAGAD') return false;
      }

      // Source filter
      if (sourceFilter !== 'ALL' && ord.source !== sourceFilter) {
        return false;
      }

      // Partial text, order number, and phone search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = ord.orderNumber.toLowerCase().includes(q);
        const matchName = ord.customerName.toLowerCase().includes(q);
        const matchPhone = ord.customerPhone.replace(/\D/g, '').includes(q.replace(/\D/g, ''));
        const matchDistrict = ord.district.toLowerCase().includes(q);
        const matchAddress = ord.fullAddress.toLowerCase().includes(q);
        if (!matchNum && !matchName && !matchPhone && !matchDistrict && !matchAddress) {
          return false;
        }
      }

      return true;
    });
  }, [orders, todoFilter, statusFilter, districtFilter, paymentFilter, sourceFilter, searchQuery]);

  // Paginated Orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  // Handle Todo Card Click
  const handleTodoCardClick = (type: string) => {
    if (todoFilter === type) {
      setTodoFilter(null);
    } else {
      setTodoFilter(type);
      setStatusFilter('ALL');
    }
    setCurrentPage(1);
  };

  // Handle Status Tab Click
  const handleStatusTabClick = (status: string) => {
    setStatusFilter(status);
    setTodoFilter(null);
    setCurrentPage(1);
  };

  // Toggle Single Checkbox
  const toggleSelectOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle Select All
  const toggleSelectAll = () => {
    if (selectedOrderIds.length === paginatedOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(paginatedOrders.map((o) => o.id));
    }
  };

  // Open Order Detail in Side Panel
  const handleOpenOrderDetail = (order: OrderRecord) => {
    setSelectedOrderId(order.id);
    setIsSidePanelOpen(true);
  };

  // Single Order Dispatch to Steadfast
  const handleDispatchOrder = async (order: OrderRecord) => {
    if (order.consignmentId || order.trackingCode) {
      warning(`Order #${order.orderNumber} already has tracking #${order.trackingCode}`);
      return;
    }

    try {
      setIsSubmittingDispatch(true);
      await onSendToSteadfast(order);
      success(`Order #${order.orderNumber} dispatched to Steadfast.`);
    } catch (err: any) {
      error(err?.message || 'Failed to dispatch order to Steadfast.');
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  // Bulk Confirm
  const handleBulkConfirm = () => {
    const targetOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
    setConfirmDialogData({
      isOpen: true,
      title: 'Confirm Selected Orders',
      message: 'Are you sure you want to mark these orders as confirmed?',
      itemCount: targetOrders.length,
      confirmLabel: 'Confirm all',
      isDestructive: false,
      action: async () => {
        setConfirmDialogData((prev) => ({ ...prev, isOpen: false }));
        for (const ord of targetOrders) {
          if (ord.status === 'PENDING') {
            await onStatusChange(ord.id, 'CONFIRMED');
          }
        }
        success(`${targetOrders.length} orders confirmed successfully.`);
        setSelectedOrderIds([]);
        onRefresh();
      },
    });
  };

  // Bulk Steadfast Dispatch
  const handleBulkSteadfast = () => {
    const targetOrders = orders.filter(
      (o) => selectedOrderIds.includes(o.id) && !o.consignmentId
    );

    if (targetOrders.length === 0) {
      warning('None of the selected orders are eligible for courier dispatch.');
      return;
    }

    setConfirmDialogData({
      isOpen: true,
      title: 'Send Orders to Steadfast',
      message: 'Ready to dispatch these consignments to Steadfast Courier? Tracking codes will be generated automatically.',
      itemCount: targetOrders.length,
      confirmLabel: 'Send to Steadfast',
      isDestructive: false,
      action: async () => {
        setConfirmDialogData((prev) => ({ ...prev, isOpen: false }));
        setIsSubmittingDispatch(true);
        let successCount = 0;
        let failCount = 0;

        for (const ord of targetOrders) {
          try {
            await onSendToSteadfast(ord);
            successCount++;
          } catch {
            failCount++;
          }
        }

        setIsSubmittingDispatch(false);
        setSelectedOrderIds([]);
        onRefresh();

        if (failCount === 0) {
          success(`${successCount} orders sent to Steadfast successfully.`);
        } else {
          warning(`${successCount} orders sent to Steadfast, ${failCount} failed.`);
        }
      },
    });
  };

  // Print Invoices Helper
  const handlePrintInvoices = (targetList: OrderRecord[]) => {
    if (!targetList.length) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoicesHtml = targetList
      .map(
        (ord) => `
      <div style="font-family: sans-serif; padding: 24px; border: 1px dashed #ccc; margin-bottom: 24px; page-break-after: always; max-width: 600px; margin: 0 auto 24px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #D6403B; padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h2 style="margin: 0; color: #D6403B; font-size: 22px;">CraftyKidsCo</h2>
            <p style="margin: 4px 0 0; font-size: 11px; color: #666;">Child-safe Natural Crayons & Educational Toys</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0; font-size: 16px;">INVOICE</h3>
            <p style="margin: 4px 0 0; font-size: 13px; font-weight: bold; color: #D6403B;">#${ord.orderNumber}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 16px;">
          <div>
            <strong>Ship to:</strong><br />
            ${ord.customerName}<br />
            Phone: ${ord.customerPhone}<br />
            Address: ${ord.fullAddress}<br />
            District: ${ord.district}
          </div>
          <div style="text-align: right;">
            <strong>Order Details:</strong><br />
            Date: ${new Date(ord.createdAt).toLocaleDateString()}<br />
            Payment: ${ord.paymentMethod} (${ord.paymentStatus})<br />
            ${ord.trackingCode ? `Tracking: <strong>${ord.trackingCode}</strong>` : ''}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px;">
          <thead>
            <tr style="background: #FAF7F2; border-bottom: 1px solid #ddd;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
              <th style="padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${ord.items
              .map(
                (item) => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">${item.title}</td>
                <td style="padding: 8px; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; text-align: right;">৳${item.price}</td>
                <td style="padding: 8px; text-align: right;">৳${item.price * item.quantity}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div style="text-align: right; font-size: 12px; line-height: 1.6;">
          <p style="margin: 2px 0;">Subtotal: ৳${ord.subtotal || ord.totalAmount}</p>
          <p style="margin: 2px 0;">Delivery: ৳${ord.deliveryCharge || (ord.district === 'Dhaka' ? 60 : 120)}</p>
          <h3 style="margin: 8px 0 0; font-size: 16px; color: #D6403B;">Amount to Collect: ৳${ord.totalAmount}</h3>
        </div>
      </div>
    `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head><title>Print Invoices - CraftyKidsCo</title></head>
        <body onload="window.print()">${invoicesHtml}</body>
      </html>
    `);
    printWindow.document.close();
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const csvHeader = 'Order Number,Customer Name,Phone,District,Address,Items,Total,Payment,Status,Tracking\n';
    const csvRows = filteredOrders.map((o) => {
      const itemsStr = o.items.map((i) => `${i.title} (x${i.quantity})`).join('; ');
      return `"${o.orderNumber}","${o.customerName}","${o.customerPhone}","${o.district}","${o.fullAddress.replace(/"/g, '""')}","${itemsStr}",${o.totalAmount},"${o.paymentMethod}","${o.status}","${o.trackingCode || ''}"`;
    });

    const blob = new Blob([csvHeader + csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `craftykidsco-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success('Orders exported to CSV.');
  };

  // Manual Order Submission
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderCustomer.trim() || !newOrderPhone.trim() || !newOrderAddress.trim()) {
      error('Please fill in customer name, phone number, and address.');
      return;
    }

    try {
      const resp = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newOrderCustomer.trim(),
          customerPhone: newOrderPhone.trim(),
          fullAddress: newOrderAddress.trim(),
          district: newOrderDistrict,
          paymentMethod: newOrderPayment,
          totalAmount: Number(newOrderAmount),
          source: newOrderSource,
          items: [
            {
              title: 'Manual Custom Kit',
              quantity: 1,
              price: Number(newOrderAmount),
              imageUrl: 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
            },
          ],
        }),
      });

      const data = await resp.json();
      if (data.success) {
        success('Order created successfully.');
        setIsCreateModalOpen(false);
        setNewOrderCustomer('');
        setNewOrderPhone('');
        setNewOrderAddress('');
        onRefresh();
      } else {
        error(data.message || 'Failed to create order.');
      }
    } catch {
      error('Server connection error while creating order.');
    }
  };

  // Save Internal Note
  const handleSaveInternalNote = () => {
    if (!activeOrder) return;
    setInternalNotes((prev) => ({ ...prev, [activeOrder.id]: currentNoteInput }));
    success('Internal note saved.');
  };

  // Save Edited Address
  const handleSaveEditedAddress = async () => {
    if (!activeOrder || !editAddressText.trim()) return;
    try {
      const res = await fetch(`/api/orders/${activeOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullAddress: editAddressText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditAddressOpen(false);
        success('Delivery address updated successfully.');
        onRefresh();
      } else {
        error(data.message || 'Failed to update address.');
      }
    } catch {
      error('Could not update address.');
    }
  };

  // Render Row Action Button based on status
  const renderRowMainAction = (ord: OrderRecord) => {
    if (ord.status === 'PENDING') {
      return (
        <Button
          size="sm"
          variant="primary"
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(ord.id, 'CONFIRMED');
            success(`Order #${ord.orderNumber} confirmed.`);
          }}
        >
          Confirm
        </Button>
      );
    }

    if (ord.status === 'CONFIRMED') {
      if (ord.consignmentId || ord.trackingCode) {
        return (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenOrderDetail(ord);
            }}
          >
            Track
          </Button>
        );
      }
      return (
        <Button
          size="sm"
          variant="primary"
          disabled={isSubmittingDispatch}
          onClick={(e) => {
            e.stopPropagation();
            handleDispatchOrder(ord);
          }}
        >
          Send to Steadfast
        </Button>
      );
    }

    if (ord.status === 'SHIPPED') {
      return (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            if (ord.trackingCode) {
              window.open(`https://steadfast.com.bd/t/${ord.trackingCode}`, '_blank');
            } else {
              handleOpenOrderDetail(ord);
            }
          }}
        >
          Track
        </Button>
      );
    }

    if (ord.status === 'DELIVERED') {
      return (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            handlePrintInvoices([ord]);
          }}
        >
          Print
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenOrderDetail(ord);
        }}
      >
        View
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP TITLE, HELPER LINE & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-fredoka text-[#2B2B2B]">Orders</h2>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
            Click any order to see details and act on it
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Create order</span>
          </Button>
        </div>
      </div>

      {/* 2. FOUR CLICKABLE "TO DO" CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: To confirm */}
        <div
          onClick={() => handleTodoCardClick('TO_CONFIRM')}
          className={`bg-white rounded-[16px] border p-4.5 transition-all cursor-pointer ${
            todoFilter === 'TO_CONFIRM'
              ? 'border-[#D6403B] ring-2 ring-[#D6403B]/20 bg-[#FDE3E1]/20'
              : 'border-[#EFE9E0] hover:border-[#D6403B]/40'
          }`}
        >
          <span className="font-fredoka font-bold text-3xl sm:text-4xl text-[#D6403B] block leading-tight">
            {metrics.toConfirm}
          </span>
          <span className="text-xs sm:text-sm font-medium text-[#6B6B6B] block mt-1">
            To confirm
          </span>
        </div>

        {/* Card 2: Ready for courier */}
        <div
          onClick={() => handleTodoCardClick('READY_COURIER')}
          className={`bg-white rounded-[16px] border p-4.5 transition-all cursor-pointer ${
            todoFilter === 'READY_COURIER'
              ? 'border-[#0B5F85] ring-2 ring-[#0B5F85]/20 bg-[#DDF1FB]/20'
              : 'border-[#EFE9E0] hover:border-[#0B5F85]/40'
          }`}
        >
          <span className="font-fredoka font-bold text-3xl sm:text-4xl text-[#0B5F85] block leading-tight">
            {metrics.readyForCourier}
          </span>
          <span className="text-xs sm:text-sm font-medium text-[#6B6B6B] block mt-1">
            Ready for courier
          </span>
        </div>

        {/* Card 3: Courier problems */}
        <div
          onClick={() => handleTodoCardClick('COURIER_PROBLEMS')}
          className={`bg-white rounded-[16px] border p-4.5 transition-all cursor-pointer ${
            todoFilter === 'COURIER_PROBLEMS'
              ? 'border-[#9B2420] ring-2 ring-[#9B2420]/20 bg-[#FDE3E1]/20'
              : 'border-[#EFE9E0] hover:border-[#9B2420]/40'
          }`}
        >
          <span className="font-fredoka font-bold text-3xl sm:text-4xl text-[#9B2420] block leading-tight">
            {metrics.courierProblems}
          </span>
          <span className="text-xs sm:text-sm font-medium text-[#6B6B6B] block mt-1">
            Courier problems
          </span>
        </div>

        {/* Card 4: Returned this week */}
        <div
          onClick={() => handleTodoCardClick('RETURNED')}
          className={`bg-white rounded-[16px] border p-4.5 transition-all cursor-pointer ${
            todoFilter === 'RETURNED'
              ? 'border-[#7A4E00] ring-2 ring-[#7A4E00]/20 bg-[#FFF3CC]/20'
              : 'border-[#EFE9E0] hover:border-[#7A4E00]/40'
          }`}
        >
          <span className="font-fredoka font-bold text-3xl sm:text-4xl text-[#7A4E00] block leading-tight">
            {metrics.returned}
          </span>
          <span className="text-xs sm:text-sm font-medium text-[#6B6B6B] block mt-1">
            Returned this week
          </span>
        </div>
      </div>

      {/* 3. STATUS TABS WITH COUNTS IN SENTENCE CASE */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-nowrap">
        {[
          { id: 'ALL', label: `All (${statusCounts.all})` },
          { id: 'PENDING', label: `Pending (${statusCounts.pending})` },
          { id: 'CONFIRMED', label: `Confirmed (${statusCounts.confirmed})` },
          { id: 'SHIPPED', label: `Shipped (${statusCounts.shipped})` },
          { id: 'DELIVERED', label: `Delivered (${statusCounts.delivered})` },
          { id: 'RETURNED', label: `Returned (${statusCounts.returned})` },
          { id: 'CANCELLED', label: `Cancelled (${statusCounts.cancelled})` },
        ].map((tab) => {
          const isActive = !todoFilter && statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleStatusTabClick(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#2B2B2B] text-white'
                  : 'bg-white border border-[#EFE9E0] text-[#6B6B6B] hover:bg-[#FAF7F2] hover:text-[#2B2B2B]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. FILTER ROW */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search order number, customer name, phone or address"
            className="w-full bg-white border border-[#EFE9E0] rounded-[12px] pl-9 pr-8 py-2.5 text-xs sm:text-sm text-[#2B2B2B] placeholder:text-[#6B6B6B]/60 focus:border-[#D6403B] focus:ring-1 focus:ring-[#D6403B] outline-none min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#2B2B2B]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-white border border-[#EFE9E0] text-[#2B2B2B] text-xs sm:text-sm rounded-[12px] px-3.5 py-2.5 outline-none focus:border-[#D6403B] min-h-[44px] cursor-pointer"
        >
          <option value="7_days">Last 7 days</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="30_days">Last 30 days</option>
          <option value="all">All time</option>
        </select>

        {/* District Filter */}
        <select
          value={districtFilter}
          onChange={(e) => {
            setDistrictFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white border border-[#EFE9E0] text-[#2B2B2B] text-xs sm:text-sm rounded-[12px] px-3.5 py-2.5 outline-none focus:border-[#D6403B] min-h-[44px] cursor-pointer"
        >
          <option value="ALL">All districts</option>
          <option value="Dhaka">Dhaka (ঢাকা)</option>
          <option value="Chattogram">Chattogram (চট্টগ্রাম)</option>
          <option value="Rajshahi">Rajshahi (রাজশাহী)</option>
          <option value="Sylhet">Sylhet (সিলেট)</option>
          <option value="Khulna">Khulna (খুলনা)</option>
          <option value="Barishal">Barishal (বরিশাল)</option>
          <option value="Rangpur">Rangpur (রংপুর)</option>
          <option value="Mymensingh">Mymensingh (ময়মনসিংহ)</option>
        </select>

        {/* Payment Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white border border-[#EFE9E0] text-[#2B2B2B] text-xs sm:text-sm rounded-[12px] px-3.5 py-2.5 outline-none focus:border-[#D6403B] min-h-[44px] cursor-pointer"
        >
          <option value="ALL">All payments</option>
          <option value="COD">Cash on delivery (COD)</option>
          <option value="BKASH">bKash paid</option>
          <option value="NAGAD">Nagad paid</option>
        </select>

        {/* Source Filter */}
        <select
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white border border-[#EFE9E0] text-[#2B2B2B] text-xs sm:text-sm rounded-[12px] px-3.5 py-2.5 outline-none focus:border-[#D6403B] min-h-[44px] cursor-pointer"
        >
          <option value="ALL">All sources</option>
          <option value="website">Website</option>
          <option value="facebook">Facebook</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="phone">Phone</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* 5. STICKY DARK BULK ACTION BAR (When Rows are Selected) */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-[#1A1A1A] text-white rounded-[14px] p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-xs sm:text-sm">
              {selectedOrderIds.length} orders selected
            </span>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
            >
              Deselect all
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={handleBulkConfirm}>
              Confirm
            </Button>
            <Button
              size="sm"
              variant="primary"
              isLoading={isSubmittingDispatch}
              onClick={handleBulkSteadfast}
            >
              Send to Steadfast
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const targets = orders.filter((o) => selectedOrderIds.includes(o.id));
                handlePrintInvoices(targets);
              }}
            >
              Print invoices
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const targets = orders.filter((o) => selectedOrderIds.includes(o.id));
                handlePrintInvoices(targets);
              }}
            >
              Print packing slips
            </Button>
          </div>
        </div>
      )}

      {/* 6. ORDERS TABLE CARD */}
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="Select all orders"
                  checked={
                    paginatedOrders.length > 0 &&
                    selectedOrderIds.length === paginatedOrders.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded-[4px] accent-[#D6403B] cursor-pointer"
                />
              </TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>District & area</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Courier</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12">
                  <EmptyState
                    title="No orders found"
                    description="No orders match your current filter settings. Try clearing the search or switching status tabs."
                    actionLabel="Reset filters"
                    onAction={() => {
                      setStatusFilter('ALL');
                      setTodoFilter(null);
                      setSearchQuery('');
                      setDistrictFilter('ALL');
                      setPaymentFilter('ALL');
                      setSourceFilter('ALL');
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((ord) => {
                const isSelected = selectedOrderId === ord.id;
                const isChecked = selectedOrderIds.includes(ord.id);
                const firstItem = ord.items[0];
                const extraCount = ord.items.length - 1;

                return (
                  <TableRow
                    key={ord.id}
                    selected={isChecked}
                    onClick={() => handleOpenOrderDetail(ord)}
                    className="cursor-pointer"
                  >
                    {/* Checkbox */}
                    <TableCell onClick={(e) => toggleSelectOrder(ord.id, e)}>
                      <input
                        type="checkbox"
                        aria-label={`Select order ${ord.orderNumber}`}
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded-[4px] accent-[#D6403B] cursor-pointer"
                      />
                    </TableCell>

                    {/* Order Number & Relative Time */}
                    <TableCell>
                      <span className="font-bold text-[#D6403B] block leading-tight">
                        {ord.orderNumber}
                      </span>
                      <span className="text-xs text-[#6B6B6B] block mt-0.5">
                        {formatRelativeTime(ord.createdAt)}
                      </span>
                    </TableCell>

                    {/* Customer Name & Phone */}
                    <TableCell>
                      <span className="font-semibold text-[#2B2B2B] block leading-tight">
                        {ord.customerName}
                      </span>
                      <span className="text-xs text-[#6B6B6B] block mt-0.5 font-mono">
                        {ord.customerPhone}
                      </span>
                    </TableCell>

                    {/* District and Area */}
                    <TableCell>
                      <span className="font-medium text-[#2B2B2B] block leading-tight">
                        {ord.district}
                      </span>
                      <span className="text-xs text-[#6B6B6B] block mt-0.5 max-w-[140px] truncate">
                        {ord.fullAddress}
                      </span>
                    </TableCell>

                    {/* First Item with Thumbnail & +N more */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-[10px] bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-center shrink-0 overflow-hidden text-[10px] font-bold text-[#6B6B6B]">
                          {firstItem?.imageUrl ? (
                            <img
                              src={firstItem.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>Item</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-[#2B2B2B] block truncate max-w-[130px]">
                            {firstItem?.title || 'Natural Crayons'}
                          </span>
                          {extraCount > 0 && (
                            <span className="text-[11px] text-[#6B6B6B] block">
                              +{extraCount} more
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Total with COD or Paid Pill */}
                    <TableCell>
                      <span className="font-bold text-xs sm:text-sm text-[#2B2B2B] block">
                        ৳{ord.totalAmount.toLocaleString()}
                      </span>
                      {ord.paymentMethod === 'COD' ? (
                        <StatusPill variant="yellow" size="sm" className="mt-1">
                          COD
                        </StatusPill>
                      ) : (
                        <StatusPill variant="green" size="sm" className="mt-1">
                          {ord.paymentMethod === 'BKASH' ? 'bKash paid' : 'Paid'}
                        </StatusPill>
                      )}
                    </TableCell>

                    {/* Status Pill */}
                    <TableCell>
                      {ord.status === 'CONFIRMED' && (
                        <StatusPill variant="yellow" dot>
                          Confirmed
                        </StatusPill>
                      )}
                      {ord.status === 'PENDING' && (
                        <StatusPill variant="yellow" dot>
                          Pending
                        </StatusPill>
                      )}
                      {ord.status === 'SHIPPED' && (
                        <StatusPill variant="blue" dot>
                          Shipped
                        </StatusPill>
                      )}
                      {ord.status === 'DELIVERED' && (
                        <StatusPill variant="green" dot>
                          Delivered
                        </StatusPill>
                      )}
                      {ord.status === 'RETURNED' && (
                        <StatusPill variant="red" dot>
                          Returned
                        </StatusPill>
                      )}
                      {ord.status === 'CANCELLED' && (
                        <StatusPill variant="red" dot>
                          Cancelled
                        </StatusPill>
                      )}
                    </TableCell>

                    {/* Courier Name & Tracking ID */}
                    <TableCell>
                      {ord.consignmentId || ord.trackingCode ? (
                        <div>
                          <span className="text-xs font-semibold text-[#2B2B2B] block">
                            Steadfast
                          </span>
                          <a
                            href={`https://steadfast.com.bd/t/${ord.trackingCode || ord.consignmentId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-[#0B5F85] hover:underline font-mono font-bold inline-flex items-center gap-1"
                          >
                            <span>#{ord.trackingCode || ord.consignmentId}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-[#6B6B6B]">Not dispatched</span>
                      )}
                    </TableCell>

                    {/* Dynamic Action Button & "..." Menu */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5 justify-end relative">
                        {renderRowMainAction(ord)}

                        {/* "..." Dropdown Toggle */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownRowId(
                                activeDropdownRowId === ord.id ? null : ord.id
                              );
                            }}
                            className="p-1.5 rounded-[8px] hover:bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#2B2B2B] transition-colors cursor-pointer"
                            aria-label="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* "..." Dropdown Menu */}
                          {activeDropdownRowId === ord.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#EFE9E0] rounded-[12px] shadow-xl py-1 z-30 text-left text-xs">
                              <button
                                onClick={() => {
                                  setActiveDropdownRowId(null);
                                  handleOpenOrderDetail(ord);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-[#FAF7F2] text-[#2B2B2B] flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#6B6B6B]" />
                                <span>View details</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDropdownRowId(null);
                                  handlePrintInvoices([ord]);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-[#FAF7F2] text-[#2B2B2B] flex items-center gap-2 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5 text-[#6B6B6B]" />
                                <span>Print invoice</span>
                              </button>
                              {ord.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => {
                                    setActiveDropdownRowId(null);
                                    setConfirmDialogData({
                                      isOpen: true,
                                      title: `Cancel Order #${ord.orderNumber}`,
                                      message: 'Are you sure you want to cancel this order?',
                                      itemCount: 1,
                                      isDestructive: true,
                                      confirmLabel: 'Cancel order',
                                      action: async () => {
                                        setConfirmDialogData((prev) => ({ ...prev, isOpen: false }));
                                        await onStatusChange(ord.id, 'CANCELLED');
                                        warning(`Order #${ord.orderNumber} was cancelled.`);
                                        onRefresh();
                                      },
                                    });
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-[#FDE3E1] text-[#9B2420] flex items-center gap-2 border-t border-[#EFE9E0] cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Cancel order</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 7. PAGINATION & SHOWING COUNT */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs sm:text-sm text-[#6B6B6B]">
        <span>
          Showing {filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length}
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs font-semibold px-2 text-[#2B2B2B]">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* 8. RIGHT SIDE DETAIL PANEL FOR SELECTED ORDER */}
      {activeOrder && (
        <SidePanel
          isOpen={isSidePanelOpen}
          onClose={() => setIsSidePanelOpen(false)}
          title={`Order #${activeOrder.orderNumber}`}
          subtitle={`Placed ${formatRelativeTime(activeOrder.createdAt)} • Source: ${activeOrder.source || 'Website'}`}
          width="lg"
          footer={
            <div className="flex items-center justify-between gap-3 w-full">
              {activeOrder.status !== 'CANCELLED' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setConfirmDialogData({
                      isOpen: true,
                      title: `Cancel Order #${activeOrder.orderNumber}`,
                      message: 'Are you sure you want to cancel this order?',
                      itemCount: 1,
                      isDestructive: true,
                      confirmLabel: 'Cancel order',
                      action: async () => {
                        setConfirmDialogData((prev) => ({ ...prev, isOpen: false }));
                        await onStatusChange(activeOrder.id, 'CANCELLED');
                        warning(`Order #${activeOrder.orderNumber} cancelled.`);
                        setIsSidePanelOpen(false);
                        onRefresh();
                      },
                    });
                  }}
                >
                  Cancel order
                </Button>
              ) : (
                <span className="text-xs text-[#9B2420] font-semibold">Cancelled</span>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePrintInvoices([activeOrder])}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print invoice
                </Button>

                {/* Big Send to Steadfast Button */}
                {activeOrder.consignmentId || activeOrder.trackingCode ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      window.open(
                        `https://steadfast.com.bd/t/${activeOrder.trackingCode || activeOrder.consignmentId}`,
                        '_blank'
                      );
                    }}
                  >
                    <Truck className="w-3.5 h-3.5 text-[#0B5F85]" />
                    Track Steadfast
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isSubmittingDispatch}
                    onClick={() => handleDispatchOrder(activeOrder)}
                  >
                    <Truck className="w-4 h-4" />
                    Send to Steadfast
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Status & Customer Risk Badge */}
            <div className="p-4 bg-[#FAF7F2] rounded-[16px] border border-[#EFE9E0] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#6B6B6B] block">Status</span>
                  <div className="mt-1">
                    {activeOrder.status === 'CONFIRMED' && (
                      <StatusPill variant="yellow" dot>
                        Confirmed
                      </StatusPill>
                    )}
                    {activeOrder.status === 'PENDING' && (
                      <StatusPill variant="yellow" dot>
                        Pending confirmation
                      </StatusPill>
                    )}
                    {activeOrder.status === 'SHIPPED' && (
                      <StatusPill variant="blue" dot>
                        Shipped
                      </StatusPill>
                    )}
                    {activeOrder.status === 'DELIVERED' && (
                      <StatusPill variant="green" dot>
                        Delivered
                      </StatusPill>
                    )}
                    {activeOrder.status === 'RETURNED' && (
                      <StatusPill variant="red" dot>
                        Returned
                      </StatusPill>
                    )}
                    {activeOrder.status === 'CANCELLED' && (
                      <StatusPill variant="red" dot>
                        Cancelled
                      </StatusPill>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#6B6B6B] block">Delivery Success Rate</span>
                  <div className="mt-1">
                    {isLoadingRisk ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#6B6B6B] inline-block" />
                    ) : customerRisk ? (
                      <StatusPill
                        variant={customerRisk.isRisky ? 'red' : 'green'}
                        icon={
                          customerRisk.isRisky ? (
                            <ShieldAlert className="w-3.5 h-3.5" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {customerRisk.deliveryRatio || 95}% past delivery rate
                      </StatusPill>
                    ) : (
                      <StatusPill variant="green" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                        96% Verified Customer
                      </StatusPill>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Contact & Editable Address */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                  Customer & Shipping
                </h4>
                <button
                  onClick={() => {
                    setEditAddressText(activeOrder.fullAddress);
                    setIsEditAddressOpen(true);
                  }}
                  className="text-xs text-[#D6403B] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit address
                </button>
              </div>

              <div className="p-4 bg-white border border-[#EFE9E0] rounded-[16px] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#2B2B2B] text-base block">
                      {activeOrder.customerName}
                    </span>
                    <span className="text-xs font-mono text-[#6B6B6B]">
                      {activeOrder.customerPhone}
                    </span>
                  </div>

                  {/* Call & WhatsApp Shortcuts */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${activeOrder.customerPhone}`}
                      className="px-3 py-1.5 rounded-[10px] border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5 transition-colors"
                      aria-label="Call customer"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#D6403B]" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${activeOrder.customerPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-[10px] bg-[#25D366] hover:bg-[#20BA5A] text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors"
                      aria-label="WhatsApp customer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div className="text-xs text-[#2B2B2B] pt-2 border-t border-[#EFE9E0] leading-relaxed">
                  <span className="text-[#6B6B6B] block">Delivery address:</span>
                  <p className="font-medium mt-0.5">{activeOrder.fullAddress}</p>
                  <p className="text-[#6B6B6B] mt-0.5">District: {activeOrder.district}</p>
                </div>
              </div>
            </div>

            {/* Courier Dispatch Status */}
            {activeOrder.trackingCode && (
              <div className="p-3.5 bg-[#DDF1FB] border border-[#BEE4F7] rounded-[16px] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B5F85]">Steadfast Consignment Dispatched</span>
                  <StatusPill variant="blue" size="sm">
                    In Transit
                  </StatusPill>
                </div>
                <p className="text-[#0B5F85]">
                  Tracking Code: <strong>{activeOrder.trackingCode}</strong>
                </p>
                {activeOrder.consignmentId && (
                  <p className="text-[#0B5F85] text-[11px]">
                    Consignment ID: #{activeOrder.consignmentId}
                  </p>
                )}
              </div>
            )}

            {/* Items & Money Breakdown with Amount to Collect */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                Items & Payment Breakdown
              </h4>
              <div className="border border-[#EFE9E0] rounded-[16px] overflow-hidden bg-white text-xs sm:text-sm">
                <div className="divide-y divide-[#EFE9E0]">
                  {activeOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-center shrink-0 overflow-hidden text-[10px] font-bold text-[#6B6B6B]">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>Item</span>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-[#2B2B2B] block">{item.title}</span>
                          <span className="text-xs text-[#6B6B6B]">
                            Qty: {item.quantity} &times; ৳{item.price}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-[#2B2B2B]">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-[#FAF7F2] border-t border-[#EFE9E0] space-y-1.5 text-xs text-[#6B6B6B]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>৳{(activeOrder.subtotal || activeOrder.totalAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery charge ({activeOrder.district}):</span>
                    <span>৳{activeOrder.deliveryCharge || (activeOrder.district === 'Dhaka' ? 60 : 120)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#2B2B2B] pt-2 border-t border-[#EFE9E0]">
                    <span>Amount to collect ({activeOrder.paymentMethod}):</span>
                    <span className="text-[#C23631]">৳{activeOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                Order Timeline
              </h4>
              <div className="p-4 bg-white border border-[#EFE9E0] rounded-[16px] space-y-3 text-xs">
                {activeOrder.timeline && activeOrder.timeline.length > 0 ? (
                  activeOrder.timeline.map((evt, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#D6403B] mt-1 shrink-0" />
                      <div>
                        <span className="font-semibold text-[#2B2B2B] block">{evt.status}</span>
                        {evt.note && <p className="text-[#6B6B6B] text-[11px]">{evt.note}</p>}
                        <span className="text-[10px] text-[#6B6B6B] block">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#D6403B] mt-1 shrink-0" />
                    <div>
                      <span className="font-semibold text-[#2B2B2B] block">Order Placed</span>
                      <span className="text-[10px] text-[#6B6B6B] block">
                        {new Date(activeOrder.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Internal Note */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                Internal Staff Note
              </h4>
              <Textarea
                value={currentNoteInput}
                onChange={(e) => setCurrentNoteInput(e.target.value)}
                placeholder="Private staff notes (e.g., customer requested delivery after 4 PM)"
                rows={2}
              />
              <div className="flex justify-end">
                <Button size="sm" variant="secondary" onClick={handleSaveInternalNote}>
                  Save note
                </Button>
              </div>
            </div>
          </div>
        </SidePanel>
      )}

      {/* 9. MANUAL ORDER CREATION MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Order Manually"
        description="For orders that arrive via Facebook message, WhatsApp, or phone call"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateManualOrder}>
              Create order
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateManualOrder} className="space-y-4">
          <Input
            label="Customer Name"
            value={newOrderCustomer}
            onChange={(e) => setNewOrderCustomer(e.target.value)}
            placeholder="Ayesha Rahman"
            required
          />

          <Input
            label="Phone Number"
            value={newOrderPhone}
            onChange={(e) => setNewOrderPhone(e.target.value)}
            placeholder="01712345678"
            required
          />

          <Textarea
            label="Delivery Address"
            value={newOrderAddress}
            onChange={(e) => setNewOrderAddress(e.target.value)}
            placeholder="House, road, area..."
            rows={2}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="District"
              value={newOrderDistrict}
              onChange={(e) => setNewOrderDistrict(e.target.value)}
            >
              <option value="Dhaka">Dhaka (৳৬০)</option>
              <option value="Chattogram">Chattogram (৳১২০)</option>
              <option value="Rajshahi">Rajshahi (৳১২০)</option>
              <option value="Sylhet">Sylhet (৳১২০)</option>
              <option value="Other">Other District (৳১২০)</option>
            </Select>

            <Select
              label="Payment Method"
              value={newOrderPayment}
              onChange={(e) => setNewOrderPayment(e.target.value as any)}
            >
              <option value="COD">Cash on delivery (COD)</option>
              <option value="BKASH">bKash (Prepaid)</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Total Amount (৳)"
              value={newOrderAmount}
              onChange={(e) => setNewOrderAmount(Number(e.target.value))}
              required
            />

            <Select
              label="Order Source"
              value={newOrderSource}
              onChange={(e) => setNewOrderSource(e.target.value as any)}
            >
              <option value="facebook">Facebook Message</option>
              <option value="whatsapp">WhatsApp Chat</option>
              <option value="phone">Phone Call</option>
            </Select>
          </div>
        </form>
      </Modal>

      {/* 10. EDIT ADDRESS MODAL */}
      <Modal
        isOpen={isEditAddressOpen}
        onClose={() => setIsEditAddressOpen(false)}
        title="Edit Delivery Address"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsEditAddressOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEditedAddress}>
              Save address
            </Button>
          </>
        }
      >
        <Textarea
          label="Updated Full Address"
          value={editAddressText}
          onChange={(e) => setEditAddressText(e.target.value)}
          rows={3}
          required
        />
      </Modal>

      {/* 11. CONFIRM DIALOG FOR DESTRUCTIVE / BULK ACTIONS */}
      <ConfirmDialog
        isOpen={confirmDialogData.isOpen}
        onClose={() => setConfirmDialogData((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialogData.action}
        title={confirmDialogData.title}
        message={confirmDialogData.message}
        itemCount={confirmDialogData.itemCount}
        isDestructive={confirmDialogData.isDestructive}
        confirmLabel={confirmDialogData.confirmLabel}
      />
    </div>
  );
}
