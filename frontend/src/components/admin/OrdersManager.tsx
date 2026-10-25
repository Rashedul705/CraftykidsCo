'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Plus,
  Download,
  Phone,
  MessageCircle,
  MessageSquare,
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
  Tag,
  Layers,
  Sparkles,
  Copy,
  Package,
} from 'lucide-react';
import { OrderRecord, getAllProducts } from '@/lib/store';
import { SampleProduct } from '@/lib/sample-data';
import { formatBDT } from '@/lib/utils';
import { calculateAmountToCollect, formatTaka } from '@/lib/order-calc';
import { getDistrictOptions, getThanasByDistrict } from '@/lib/bd-locations';
import { calculateDelivery } from '@/lib/delivery-store';
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
  const [mounted, setMounted] = useState(false);
  const [activeDropdownRowId, setActiveDropdownRowId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top?: number;
    bottom?: number;
    right: number;
  } | null>(null);

  // Sticker Print Modal State
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [stickerModalTargets, setStickerModalTargets] = useState<OrderRecord[]>([]);
  const [selectedStickerLayout, setSelectedStickerLayout] = useState<'100x150' | '75x50' | 'sheet4' | 'sheet8'>('100x150');
  const [stickerStartPos, setStickerStartPos] = useState<number>(1);

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
  const [newOrderThana, setNewOrderThana] = useState('');
  const [newOrderCustomThana, setNewOrderCustomThana] = useState('');
  const [newOrderPayment, setNewOrderPayment] = useState<'COD' | 'BKASH' | 'NAGAD'>('COD');
  const [newOrderSource, setNewOrderSource] = useState<'facebook' | 'whatsapp' | 'phone' | 'manual'>('facebook');

  // Product, Variant & Pricing for Manual Order Creation
  const [storeProducts, setStoreProducts] = useState<SampleProduct[]>(() => {
    try {
      return getAllProducts();
    } catch {
      return [];
    }
  });
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedVariantSku, setSelectedVariantSku] = useState<string>('');
  const [customProductName, setCustomProductName] = useState<string>('');
  const [customVariantName, setCustomVariantName] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(999);
  const [deliveryFee, setDeliveryFee] = useState<number>(60);
  const [newOrderAmount, setNewOrderAmount] = useState<number>(1059);
  const [isAmountManuallyOverridden, setIsAmountManuallyOverridden] = useState<boolean>(false);

  // Fetch live products from database on mount
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.products) && data.products.length > 0) {
          setStoreProducts(data.products);
        }
      })
      .catch(() => {});
  }, []);

  // Set initial product selection when products are loaded
  useEffect(() => {
    if (!selectedProductId && storeProducts.length > 0) {
      const firstProd = storeProducts[0];
      setSelectedProductId(firstProd.id);
      if (firstProd.variations && firstProd.variations.length > 0) {
        const firstVar = firstProd.variations[0];
        setSelectedVariantSku(firstVar.sku || firstVar.id || 'var-1');
        const p = firstVar.salePrice || firstVar.price || firstProd.baseSalePrice || firstProd.basePrice || 999;
        setItemUnitPrice(p);
        if (!isAmountManuallyOverridden) {
          setNewOrderAmount(p * itemQuantity + deliveryFee);
        }
      } else {
        setSelectedVariantSku('standard');
        const p = firstProd.baseSalePrice || firstProd.basePrice || firstProd.price || 999;
        setItemUnitPrice(p);
        if (!isAmountManuallyOverridden) {
          setNewOrderAmount(p * itemQuantity + deliveryFee);
        }
      }
    }
  }, [storeProducts]);

  const districtOptions = useMemo(() => getDistrictOptions(), []);
  const availableThanas = useMemo(() => getThanasByDistrict(newOrderDistrict), [newOrderDistrict]);

  const currentProduct = useMemo(() => {
    return storeProducts.find((p) => p.id === selectedProductId) || null;
  }, [storeProducts, selectedProductId]);

  const currentProductVariations = useMemo(() => {
    if (!currentProduct || !currentProduct.variations) return [];
    return currentProduct.variations;
  }, [currentProduct]);

  const handleDistrictChange = (districtName: string) => {
    setNewOrderDistrict(districtName);
    setNewOrderThana('');
    setNewOrderCustomThana('');
    let fee = 120;
    try {
      const calc = calculateDelivery(districtName, itemUnitPrice * itemQuantity);
      fee = calc.charge;
    } catch {
      fee = districtName.toLowerCase().includes('dhaka') ? 60 : 120;
    }
    setDeliveryFee(fee);
    if (!isAmountManuallyOverridden) {
      setNewOrderAmount(itemUnitPrice * itemQuantity + fee);
    }
  };

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    if (prodId === 'CUSTOM') {
      setSelectedVariantSku('');
      setCustomProductName('');
      setCustomVariantName('');
      return;
    }
    const prod = storeProducts.find((p) => p.id === prodId);
    if (prod) {
      if (prod.variations && prod.variations.length > 0) {
        const firstVar = prod.variations[0];
        setSelectedVariantSku(firstVar.sku || firstVar.id || '');
        const p = firstVar.salePrice || firstVar.price || prod.baseSalePrice || prod.basePrice || 0;
        setItemUnitPrice(p);
        if (!isAmountManuallyOverridden) {
          setNewOrderAmount(p * itemQuantity + deliveryFee);
        }
      } else {
        setSelectedVariantSku('standard');
        const p = prod.baseSalePrice || prod.basePrice || prod.price || 0;
        setItemUnitPrice(p);
        if (!isAmountManuallyOverridden) {
          setNewOrderAmount(p * itemQuantity + deliveryFee);
        }
      }
    }
  };

  const handleVariantChange = (skuOrId: string) => {
    setSelectedVariantSku(skuOrId);
    const prod = storeProducts.find((p) => p.id === selectedProductId);
    if (prod && prod.variations) {
      const v = prod.variations.find((item) => (item.sku || item.id) === skuOrId);
      if (v) {
        const p = v.salePrice || v.price || prod.baseSalePrice || prod.basePrice || 0;
        setItemUnitPrice(p);
        if (!isAmountManuallyOverridden) {
          setNewOrderAmount(p * itemQuantity + deliveryFee);
        }
      }
    }
  };

  const handleQuantityChange = (qty: number) => {
    const safeQty = Math.max(1, qty);
    setItemQuantity(safeQty);
    if (!isAmountManuallyOverridden) {
      setNewOrderAmount(itemUnitPrice * safeQty + deliveryFee);
    }
  };

  const handleUnitPriceChange = (price: number) => {
    const safePrice = Math.max(0, price);
    setItemUnitPrice(safePrice);
    if (!isAmountManuallyOverridden) {
      setNewOrderAmount(safePrice * itemQuantity + deliveryFee);
    }
  };

  const handleDeliveryFeeChange = (fee: number) => {
    const safeFee = Math.max(0, fee);
    setDeliveryFee(safeFee);
    if (!isAmountManuallyOverridden) {
      setNewOrderAmount(itemUnitPrice * itemQuantity + safeFee);
    }
  };

  const handleTotalAmountChange = (amt: number) => {
    setNewOrderAmount(amt);
    setIsAmountManuallyOverridden(true);
  };

  const handleRecalculateAmount = () => {
    setIsAmountManuallyOverridden(false);
    setNewOrderAmount(itemUnitPrice * itemQuantity + deliveryFee);
  };

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
    totalParcels?: number;
    hasHistory?: boolean;
    volumeRange?: string;
    volumeBand?: string;
    provider?: string;
    storeHistory?: {
      total: number;
      delivered: number;
      cancelled: number;
      pending: number;
      confirmed?: number;
    };
  } | null>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);

  // Active Selected Order
  const activeOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Custom Order Value State
  const [isCustomizingValue, setIsCustomizingValue] = useState(false);
  const [customSubtotal, setCustomSubtotal] = useState<number>(0);
  const [customDeliveryCharge, setCustomDeliveryCharge] = useState<number>(0);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [customTotalAmount, setCustomTotalAmount] = useState<number>(0);
  const [customValueReason, setCustomValueReason] = useState<string>('');
  const [isSavingCustomValue, setIsSavingCustomValue] = useState(false);

  useEffect(() => {
    if (activeOrder) {
      const fin = calculateAmountToCollect(activeOrder);
      setCustomSubtotal(fin.subtotal);
      setCustomDeliveryCharge(fin.deliveryCharge);
      setCustomDiscount(fin.discount);
      setCustomTotalAmount(activeOrder.totalAmount ?? fin.grossTotal);
      setCustomValueReason('');
      setIsCustomizingValue(false);
    }
  }, [activeOrder?.id, activeOrder?.totalAmount, activeOrder?.deliveryCharge, activeOrder?.discountAmount]);

  // Customer Store Stats (CraftyKidsCo orders for this specific customer)
  const customerStoreStats = useMemo(() => {
    if (!activeOrder?.customerPhone) {
      return { total: 0, delivered: 0, cancelled: 0, pending: 0, confirmed: 0, isFirstOrder: true };
    }
    const rawClean = activeOrder.customerPhone.replace(/\D/g, '');
    const suffix = rawClean.slice(-10);
    const matched = orders.filter((o) => {
      const p = (o.customerPhone || '').replace(/\D/g, '');
      return suffix ? p.includes(suffix) : false;
    });

    const delivered = matched.filter((o) => o.status === 'DELIVERED').length;
    const cancelled = matched.filter((o) => o.status === 'CANCELLED' || o.status === 'RETURNED').length;
    const pending = matched.filter((o) => o.status === 'PENDING').length;
    const confirmed = matched.filter((o) => ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)).length;
    const total = Math.max(matched.length, customerRisk?.storeHistory?.total || 0, 1);

    return {
      total,
      delivered,
      cancelled,
      pending,
      confirmed,
      isFirstOrder: total <= 1,
    };
  }, [activeOrder, orders, customerRisk]);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click, scroll, or resize
  useEffect(() => {
    const handleClose = () => {
      setActiveDropdownRowId(null);
      setDropdownPos(null);
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, []);

  // Handle ESC key and scroll locking for centered order detail modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidePanelOpen) {
        setIsSidePanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidePanelOpen]);

  useEffect(() => {
    if (isSidePanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidePanelOpen]);

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
      success(`Order #${order.orderNumber} dispatched to Steadfast.`, {
        title: 'স্টিডফাস্টে পার্সেল প্রস্তুত',
        actionLabel: 'Print Sticker',
        actionIcon: <Printer className="w-3.5 h-3.5" />,
        onAction: () => {
          handlePrintStickers([order], { size: '100x150' });
        },
        duration: 10000,
      });
      onRefresh();
    } catch (err: any) {
      error(err?.message || 'Failed to dispatch order to Steadfast.');
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  // Confirm Single Order directly
  const handleConfirmOrder = async (order: OrderRecord) => {
    try {
      await onStatusChange(order.id, 'CONFIRMED');
      success(`Order #${order.orderNumber} সফলভাবে কনফার্ম করা হয়েছে!`);
      onRefresh();
    } catch (err: any) {
      error(err?.message || 'অর্ডার কনফার্ম করতে সমস্যা হয়েছে');
    }
  };

  // Cancel Single Order with confirmation
  const handleCancelOrder = (order: OrderRecord) => {
    setConfirmDialogData({
      isOpen: true,
      title: `Cancel Order #${order.orderNumber}`,
      message: 'Are you sure you want to cancel this order?',
      itemCount: 1,
      isDestructive: true,
      confirmLabel: 'Cancel order',
      action: async () => {
        setConfirmDialogData((prev) => ({ ...prev, isOpen: false }));
        await onStatusChange(order.id, 'CANCELLED');
        warning(`Order #${order.orderNumber} cancelled.`);
        onRefresh();
      },
    });
  };

  // Mark Delivered
  const handleMarkDelivered = async (order: OrderRecord) => {
    try {
      await onStatusChange(order.id, 'DELIVERED');
      success(`Order #${order.orderNumber} marked as Delivered.`);
      onRefresh();
    } catch (err: any) {
      error(err?.message || 'Failed to update order to Delivered');
    }
  };

  // Mark Returned
  const handleMarkReturned = async (order: OrderRecord) => {
    setConfirmDialogData({
      isOpen: true,
      title: `Mark Order #${order.orderNumber} as Returned`,
      message: 'Are you sure you want to mark this order as Returned? Stock will be restored.',
      itemCount: 1,
      isDestructive: false,
      confirmLabel: 'Mark as Returned',
      action: async () => {
        setConfirmDialogData((prev) => ({ ...prev, isOpen: false }));
        await onStatusChange(order.id, 'RETURNED');
        warning(`Order #${order.orderNumber} marked as Returned.`);
        onRefresh();
      },
    });
  };

  // Direct Status Change from Select
  const handleDirectStatusChange = async (order: OrderRecord, newStatus: OrderRecord['status']) => {
    if (newStatus === order.status) return;
    if (newStatus === 'CANCELLED') {
      handleCancelOrder(order);
      return;
    }
    if (newStatus === 'RETURNED') {
      handleMarkReturned(order);
      return;
    }
    try {
      await onStatusChange(order.id, newStatus);
      success(`Order #${order.orderNumber} status updated to ${newStatus}.`);
      onRefresh();
    } catch (err: any) {
      error(err?.message || `Failed to update status to ${newStatus}`);
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

  // Print Invoices Helper via server PDF route
  const handlePrintInvoices = (targetList: OrderRecord[], options: { download?: boolean; formatHtml?: boolean } = {}) => {
    if (!targetList.length) {
      warning('প্রিন্ট করার জন্য কোনো অর্ডার নির্বাচন করা হয়নি।');
      return;
    }
    const ids = targetList.map((o) => o.orderNumber || o.id).join(',');
    const query = new URLSearchParams({ ids });
    if (options.download) query.set('download', '1');
    if (options.formatHtml) query.set('format', 'html');
    window.open(`/api/print/invoice?${query.toString()}`, '_blank');
  };

  // Open Sticker Print Modal for configuration (Thermal vs Sheet Layout)
  const openStickerPrintModal = (targetList: OrderRecord[]) => {
    if (!targetList.length) {
      warning('স্টিকার প্রিন্ট করার জন্য কোনো অর্ডার নির্বাচন করা হয়নি।');
      return;
    }
    setStickerModalTargets(targetList);
    setStickerStartPos(1);
    setIsStickerModalOpen(true);
  };

  // Print Stickers via server PDF route
  const handlePrintStickers = (
    targetList: OrderRecord[],
    options: {
      size?: '100x150' | '75x50';
      sheet?: '4' | '8';
      startPos?: number;
      download?: boolean;
      formatHtml?: boolean;
    } = {}
  ) => {
    if (!targetList.length) {
      warning('স্টিকার প্রিন্ট করার মতো কোনো অর্ডার নেই।');
      return;
    }

    const eligible = targetList.filter((o) => !!(o.consignmentId || o.trackingCode));
    const skipped = targetList.filter((o) => !(o.consignmentId || o.trackingCode));

    if (skipped.length > 0) {
      warning(
        `${skipped.length}টি অর্ডারের কনসাইনমেন্ট আইডি নেই বলে স্টিকার প্রিন্ট থেকে বাদ দেওয়া হয়েছে: ${skipped
          .map((o) => `#${o.orderNumber}`)
          .join(', ')}`
      );
    }

    if (eligible.length === 0) {
      error('নির্বাচিত কোনো অর্ডারের কনসাইনমেন্ট আইডি নেই। আগে স্টিডফাস্ট বা কুরিয়ারে পার্সেল পাঠান।');
      return;
    }

    const ids = eligible.map((o) => o.orderNumber || o.id).join(',');
    const query = new URLSearchParams({ ids });

    if (options.sheet) {
      query.set('sheet', options.sheet);
    } else {
      query.set('size', options.size || '100x150');
    }

    if (options.startPos && options.startPos > 1) {
      query.set('startPos', String(options.startPos));
    }
    if (options.download) query.set('download', '1');
    if (options.formatHtml) query.set('format', 'html');

    window.open(`/api/print/sticker?${query.toString()}`, '_blank');
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
      error('গ্রাহকের নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা আবশ্যক।');
      return;
    }
    if (!newOrderDistrict.trim()) {
      error('দয়া করে ডেলিভারি জেলা নির্বাচন করুন।');
      return;
    }

    const finalThana = newOrderThana === 'OTHER' ? newOrderCustomThana.trim() : newOrderThana.trim();
    if (!finalThana) {
      error('দয়া করে থানা / উপজেলা নির্বাচন বা উল্লেখ করুন।');
      return;
    }

    let productTitle = 'Manual Custom Item';
    let variantTitle = 'Standard';
    let variationSku = 'MANUAL-VAR';
    let productImage = 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg';
    let productId = 'manual-custom';

    if (selectedProductId === 'CUSTOM') {
      productTitle = customProductName.trim() || 'Custom Order Item';
      variantTitle = customVariantName.trim() || 'Standard';
      variationSku = 'CUSTOM-SKU';
    } else {
      const prod = storeProducts.find((p) => p.id === selectedProductId);
      if (prod) {
        productId = prod.id;
        productTitle = prod.titleBn || prod.titleEn;
        productImage = prod.imageUrl || productImage;
        if (prod.variations && prod.variations.length > 0) {
          const v = prod.variations.find((item) => (item.sku || item.id) === selectedVariantSku) || prod.variations[0];
          variantTitle = v.titleBn || v.titleEn || v.name || 'Standard';
          variationSku = v.sku || v.id || 'SKU-VAR';
          if (v.imageUrl) productImage = v.imageUrl;
        }
      }
    }

    try {
      const resp = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newOrderCustomer.trim(),
          customerPhone: newOrderPhone.trim(),
          fullAddress: `${newOrderAddress.trim()}, থানা: ${finalThana}, জেলা: ${newOrderDistrict}`,
          district: newOrderDistrict,
          thana: finalThana,
          paymentMethod: newOrderPayment,
          deliveryCharge: Number(deliveryFee),
          totalAmount: Number(newOrderAmount),
          source: newOrderSource,
          items: [
            {
              productId,
              title: productTitle,
              variationSku,
              variationTitle: variantTitle,
              variationTitleBn: variantTitle,
              quantity: Number(itemQuantity) || 1,
              price: Number(itemUnitPrice),
              imageUrl: productImage,
            },
          ],
        }),
      });

      const data = await resp.json();
      if (data.success) {
        success('ম্যানুয়াল অর্ডার সফলভাবে তৈরি হয়েছে! (Order created)');
        setIsCreateModalOpen(false);
        setNewOrderCustomer('');
        setNewOrderPhone('');
        setNewOrderAddress('');
        setNewOrderThana('');
        setNewOrderCustomThana('');
        setCustomProductName('');
        setCustomVariantName('');
        setItemQuantity(1);
        setIsAmountManuallyOverridden(false);
        onRefresh();
      } else {
        error(data.message || 'অর্ডার তৈরি করা সম্ভব হয়নি।');
      }
    } catch {
      error('সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।');
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

  // Save Custom Order Value
  const handleSaveCustomOrderValue = async () => {
    if (!activeOrder) return;
    setIsSavingCustomValue(true);
    try {
      const targetId = activeOrder.id || activeOrder.orderNumber;
      const res = await fetch(`/api/orders/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: customTotalAmount,
          deliveryCharge: customDeliveryCharge,
          discountAmount: customDiscount,
          subtotal: customSubtotal,
          note: `মোট বিল পরিবর্তন: ৳${activeOrder.totalAmount} -> ৳${customTotalAmount}${customValueReason.trim() ? ` (${customValueReason.trim()})` : ''}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        success(`অর্ডার ভ্যালু সফলভাবে পরিবর্তন করা হয়েছে: ৳${customTotalAmount.toLocaleString()}`);
        setIsCustomizingValue(false);
        onRefresh();
      } else {
        error(data.message || 'অর্ডার ভ্যালু পরিবর্তন ব্যর্থ হয়েছে');
      }
    } catch {
      error('কানেকশন এরর: অর্ডার ভ্যালু সেভ করা যায়নি');
    } finally {
      setIsSavingCustomValue(false);
    }
  };

  // Copy tracking ID
  const handleCopyTracking = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      success(`কুরিয়ার ট্র্যাকিং আইডি কপি করা হয়েছে: ${code}`);
    }).catch(() => {
      success(`কুরিয়ার ট্র্যাকিং আইডি: ${code}`);
    });
  };

  // Render Row Action Button based on status (shown only when relevant)
  const renderRowMainAction = (ord: OrderRecord) => {
    if (ord.status === 'PENDING') {
      return (
        <Button
          size="sm"
          variant="primary"
          className="px-3 py-1.5 text-xs whitespace-nowrap"
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
            className="px-3 py-1.5 text-xs whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                `https://steadfast.com.bd/t/${ord.trackingCode || ord.consignmentId}`,
                '_blank'
              );
            }}
          >
            <Truck className="w-3 h-3 mr-1 text-[#0B5F85]" />
            Track
          </Button>
        );
      }
      return (
        <Button
          size="sm"
          variant="primary"
          disabled={isSubmittingDispatch}
          className="px-2.5 py-1.5 text-xs whitespace-nowrap"
          onClick={(e) => {
            e.stopPropagation();
            handleDispatchOrder(ord);
          }}
        >
          <Truck className="w-3.5 h-3.5 mr-1" />
          Send to Steadfast
        </Button>
      );
    }

    if (ord.status === 'SHIPPED') {
      return (
        <Button
          size="sm"
          variant="secondary"
          className="px-3 py-1.5 text-xs whitespace-nowrap text-[#1F6B43] border-[#BDE7CC] hover:bg-[#DDF3E6]"
          onClick={(e) => {
            e.stopPropagation();
            handleMarkDelivered(ord);
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Delivered
        </Button>
      );
    }

    if (ord.status === 'DELIVERED') {
      return (
        <Button
          size="sm"
          variant="secondary"
          className="px-3 py-1.5 text-xs whitespace-nowrap"
          onClick={(e) => {
            e.stopPropagation();
            handlePrintInvoices([ord]);
          }}
        >
          <Printer className="w-3.5 h-3.5 mr-1" />
          Print
        </Button>
      );
    }

    // Cancelled / Returned: No primary action needed
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP TITLE, HELPER LINE & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-bold font-fredoka text-[#2B2B2B]">Orders</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2B2B] shadow-xs">
              <Layers className="w-3.5 h-3.5 text-[#D6403B]" />
              আমাদের স্টোরে মোট অর্ডার: {orders.length} টি
            </span>
          </div>
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
                openStickerPrintModal(targets);
              }}
            >
              <Tag className="w-3.5 h-3.5" />
              Print stickers
            </Button>
          </div>
        </div>
      )}

      {/* 6. ORDERS TABLE CARD */}
      <TableContainer>
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              {/* 1. Checkbox */}
              <TableHead className="w-[3.5%] py-3 px-2 text-center">
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
              {/* 2. Order ID and date */}
              <TableHead className="w-[13.5%] py-3 px-2.5 whitespace-nowrap">Order</TableHead>
              {/* 3. Customer name and phone */}
              <TableHead className="w-[17%] py-3 px-2.5">Customer</TableHead>
              {/* 4. District */}
              <TableHead className="w-[10%] py-3 px-2.5">District</TableHead>
              {/* 5. Items count only */}
              <TableHead className="w-[8%] py-3 px-2.5 whitespace-nowrap text-center">Items</TableHead>
              {/* 6. Total with payment badge */}
              <TableHead className="w-[14%] py-3 px-2.5 whitespace-nowrap">Total</TableHead>
              {/* 7. Status badge */}
              <TableHead className="w-[11%] py-3 px-2.5 whitespace-nowrap">Status</TableHead>
              {/* 8. One primary action button */}
              <TableHead className="w-[17%] py-3 px-2.5 text-center whitespace-nowrap">Action</TableHead>
              {/* 9. 3-dot menu */}
              <TableHead className="w-[6%] py-3 px-2 text-right whitespace-nowrap"></TableHead>
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
                const isChecked = selectedOrderIds.includes(ord.id);
                const totalItemCount = ord.items.reduce((acc, item) => acc + (item.quantity || 1), 0);

                return (
                  <TableRow
                    key={ord.id}
                    selected={isChecked}
                    onClick={() => handleOpenOrderDetail(ord)}
                    className="cursor-pointer"
                  >
                    {/* 1. Checkbox */}
                    <TableCell
                      className="py-3 px-2 text-center"
                      onClick={(e) => toggleSelectOrder(ord.id, e)}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select order ${ord.orderNumber}`}
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded-[4px] accent-[#D6403B] cursor-pointer"
                      />
                    </TableCell>

                    {/* 2. Order ID and date (no wrapping, whitespace: nowrap) */}
                    <TableCell className="py-3 px-2.5 whitespace-nowrap">
                      <span className="font-bold text-[#D6403B] block leading-tight whitespace-nowrap">
                        {ord.orderNumber}
                      </span>
                      <span className="text-xs text-[#6B6B6B] block mt-0.5 whitespace-nowrap">
                        {formatRelativeTime(ord.createdAt)}
                      </span>
                    </TableCell>

                    {/* 3. Customer name and phone */}
                    <TableCell className="py-3 px-2.5 min-w-0">
                      <span
                        className="font-semibold text-[#2B2B2B] block leading-tight truncate"
                        title={ord.customerName}
                      >
                        {ord.customerName}
                      </span>
                      <span className="text-xs text-[#6B6B6B] block mt-0.5 font-mono truncate">
                        {ord.customerPhone}
                      </span>
                    </TableCell>

                    {/* 4. District */}
                    <TableCell className="py-3 px-2.5 min-w-0">
                      <span
                        className="font-medium text-[#2B2B2B] block leading-tight truncate"
                        title={ord.district}
                      >
                        {ord.district || '—'}
                      </span>
                    </TableCell>

                    {/* 5. Items count only (e.g. "3 items") */}
                    <TableCell className="py-3 px-2.5 whitespace-nowrap text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-[#FAF7F2] text-[#6B6B6B] border border-[#EFE9E0]">
                        {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                      </span>
                    </TableCell>

                    {/* 6. Total with payment badge (COD or Paid) */}
                    <TableCell className="py-3 px-2.5 whitespace-nowrap">
                      {(() => {
                        const rowFin = calculateAmountToCollect(ord);
                        return (
                          <div>
                            <span className="font-bold text-xs sm:text-sm text-[#2B2B2B] block leading-tight">
                              {formatTaka(rowFin.grossTotal)}
                            </span>
                            {rowFin.isPaid ? (
                              <StatusPill variant="green" size="sm" className="mt-1">
                                {ord.paymentMethod === 'BKASH' ? 'bKash paid' : 'পেইড (Paid)'}
                              </StatusPill>
                            ) : (
                              <StatusPill variant="yellow" size="sm" className="mt-1">
                                COD: {rowFin.collectDisplayBn}
                              </StatusPill>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>

                    {/* 7. Status badge */}
                    <TableCell className="py-3 px-2.5 whitespace-nowrap">
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

                    {/* 8. One primary action button, shown only when relevant */}
                    <TableCell
                      className="py-3 px-2.5 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderRowMainAction(ord)}
                    </TableCell>

                    {/* 9. 3-dot menu at end of row */}
                    <TableCell
                      className="py-3 px-2 text-right relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeDropdownRowId === ord.id) {
                              setActiveDropdownRowId(null);
                              setDropdownPos(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const dropdownEstimatedHeight = 280;
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;
                              const openUpwards =
                                spaceBelow < dropdownEstimatedHeight && spaceAbove > spaceBelow;

                              setDropdownPos({
                                top: openUpwards ? undefined : rect.bottom + 4,
                                bottom: openUpwards
                                  ? window.innerHeight - rect.top + 4
                                  : undefined,
                                right: Math.max(8, window.innerWidth - rect.right),
                              });
                              setActiveDropdownRowId(ord.id);
                            }
                          }}
                          className="p-1.5 rounded-[8px] hover:bg-[#FAF7F2] text-[#6B6B6B] hover:text-[#2B2B2B] transition-colors cursor-pointer"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu Card (Rendered via Portal to break out of TableContainer overflow) */}
                        {mounted &&
                          activeDropdownRowId === ord.id &&
                          dropdownPos &&
                          typeof document !== 'undefined' &&
                          createPortal(
                            <div
                              style={{
                                position: 'fixed',
                                top:
                                  dropdownPos.top !== undefined
                                    ? `${dropdownPos.top}px`
                                    : undefined,
                                bottom:
                                  dropdownPos.bottom !== undefined
                                    ? `${dropdownPos.bottom}px`
                                    : undefined,
                                right: `${dropdownPos.right}px`,
                              }}
                              className="w-52 max-h-[85vh] overflow-y-auto bg-white border border-[#EFE9E0] rounded-[12px] shadow-2xl py-1 z-[9999] text-left text-xs divide-y divide-[#EFE9E0]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* 1. View details */}
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownRowId(null);
                                    setDropdownPos(null);
                                    handleOpenOrderDetail(ord);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-[#FAF7F2] text-[#2B2B2B] flex items-center gap-2 cursor-pointer font-medium"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#0B5F85]" />
                                  <span>View details</span>
                                </button>
                              </div>

                              {/* 2. Courier tracking ID (with a copy button) */}
                              <div className="p-2 bg-[#FAF7F2]/60">
                                <span className="text-[10px] text-[#6B6B6B] uppercase font-bold block mb-1">
                                  Courier Tracking ID
                                </span>
                                {ord.trackingCode || ord.consignmentId ? (
                                  <div className="flex items-center justify-between gap-1.5 bg-white px-2 py-1.5 rounded-[8px] border border-[#EFE9E0]">
                                    <span className="font-mono font-bold text-xs text-[#0B5F85] truncate">
                                      #{ord.trackingCode || ord.consignmentId}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) =>
                                        handleCopyTracking(
                                          ord.trackingCode || ord.consignmentId || '',
                                          e
                                        )
                                      }
                                      className="p-1 rounded hover:bg-black/5 text-[#6B6B6B] hover:text-[#2B2B2B] transition-colors shrink-0"
                                      title="Copy tracking ID"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-[#888] italic">
                                    No tracking ID yet
                                  </span>
                                )}
                              </div>

                              {/* 3. Full items list & 4. Customer note */}
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownRowId(null);
                                    setDropdownPos(null);
                                    handleOpenOrderDetail(ord);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-[#FAF7F2] text-[#2B2B2B] flex items-center gap-2 cursor-pointer"
                                >
                                  <Package className="w-3.5 h-3.5 text-[#6B6B6B]" />
                                  <span>Full items list ({ord.items.length})</span>
                                </button>

                                {ord.customerNote ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownRowId(null);
                                      setDropdownPos(null);
                                      handleOpenOrderDetail(ord);
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-[#FAF7F2] text-[#2B2B2B] flex items-start gap-2 cursor-pointer"
                                    title={ord.customerNote}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-[#B78103] shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                      <span className="block font-medium">Customer note</span>
                                      <span className="block text-[10px] text-[#6B6B6B] truncate max-w-[170px]">
                                        {ord.customerNote}
                                      </span>
                                    </div>
                                  </button>
                                ) : (
                                  <div className="px-3 py-1.5 text-[11px] text-[#888] flex items-center gap-2">
                                    <MessageSquare className="w-3.5 h-3.5 opacity-40 shrink-0" />
                                    <span>No customer note</span>
                                  </div>
                                )}
                              </div>

                              {/* 5. Edit address & 6. Print invoice */}
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownRowId(null);
                                    setDropdownPos(null);
                                    setSelectedOrderId(ord.id);
                                    setEditAddressText(ord.fullAddress);
                                    setIsEditAddressOpen(true);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-[#FAF7F2] text-[#2B2B2B] flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
                                  <span>Edit address</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownRowId(null);
                                    setDropdownPos(null);
                                    handlePrintInvoices([ord]);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-[#FAF7F2] text-[#2B2B2B] flex items-center gap-2 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-[#6B6B6B]" />
                                  <span>Print invoice</span>
                                </button>
                              </div>

                              {/* 7. Cancel order (styled in red, with confirmation step) */}
                              {ord.status !== 'CANCELLED' && (
                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownRowId(null);
                                      setDropdownPos(null);
                                      handleCancelOrder(ord);
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-[#FDE3E1] text-[#9B2420] flex items-center gap-2 cursor-pointer font-semibold"
                                  >
                                    <X className="w-3.5 h-3.5 text-[#9B2420]" />
                                    <span>Cancel order</span>
                                  </button>
                                </div>
                              )}
                            </div>,
                            document.body
                          )}
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

      {/* 8. CENTERED DETAIL POPUP MODAL FOR SELECTED ORDER */}
      {activeOrder && isSidePanelOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Dimmed Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-150"
            onClick={() => setIsSidePanelOpen(false)}
            aria-hidden="true"
          />

          {/* Centered Modal Card: max-width 720px, 90% on small screens, max-height 85vh */}
          <div className="relative w-[90%] sm:w-full max-w-[720px] max-h-[85vh] bg-white rounded-[20px] shadow-2xl flex flex-col border border-[#EFE9E0] overflow-hidden z-10 transition-all duration-150 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-[#EFE9E0] flex items-center justify-between shrink-0 bg-[#FAF7F2]">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold font-fredoka text-[#2B2B2B]">
                    Order #{activeOrder.orderNumber}
                  </h2>
                  {activeOrder.status === 'CONFIRMED' && (
                    <StatusPill variant="green" size="sm" dot>
                      Confirmed
                    </StatusPill>
                  )}
                  {activeOrder.status === 'PENDING' && (
                    <StatusPill variant="yellow" size="sm" dot>
                      Pending confirmation
                    </StatusPill>
                  )}
                  {activeOrder.status === 'SHIPPED' && (
                    <StatusPill variant="blue" size="sm" dot>
                      Shipped
                    </StatusPill>
                  )}
                  {activeOrder.status === 'DELIVERED' && (
                    <StatusPill variant="green" size="sm" dot>
                      Delivered
                    </StatusPill>
                  )}
                  {activeOrder.status === 'RETURNED' && (
                    <StatusPill variant="red" size="sm" dot>
                      Returned
                    </StatusPill>
                  )}
                  {activeOrder.status === 'CANCELLED' && (
                    <StatusPill variant="red" size="sm" dot>
                      Cancelled
                    </StatusPill>
                  )}
                </div>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Placed {formatRelativeTime(activeOrder.createdAt)} • Source: {activeOrder.source || 'Website'}
                </p>
              </div>

              <button
                onClick={() => setIsSidePanelOpen(false)}
                aria-label="Close popup"
                className="p-2 text-[#6B6B6B] hover:text-[#2B2B2B] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-[#2B2B2B]">
              {/* Top Quick Status & Action Bar */}
              <div className="p-3.5 bg-[#FAF7F2] rounded-[16px] border border-[#EFE9E0] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-[#6B6B6B] font-semibold">Status:</span>
                  <select
                    value={activeOrder.status}
                    onChange={(e) =>
                      handleDirectStatusChange(
                        activeOrder,
                        e.target.value as OrderRecord['status']
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-[#EFE9E0] text-[#2B2B2B] shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0B5F85]"
                  >
                    <option value="PENDING">PENDING (Pending Confirmation)</option>
                    <option value="CONFIRMED">CONFIRMED (Ready for Dispatch)</option>
                    <option value="PROCESSING">PROCESSING (Packaging)</option>
                    <option value="SHIPPED">SHIPPED (With Courier)</option>
                    <option value="DELIVERED">DELIVERED (Successfully Completed)</option>
                    <option value="RETURNED">RETURNED (Courier Return)</option>
                    <option value="CANCELLED">CANCELLED (Cancelled Order)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Confirm button if PENDING */}
                  {activeOrder.status === 'PENDING' && (
                    <button
                      onClick={() => handleConfirmOrder(activeOrder)}
                      className="px-3 py-1.5 bg-[#1F6B43] hover:bg-[#185334] text-white text-xs font-bold rounded-[8px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm order</span>
                    </button>
                  )}

                  {/* Mark Delivered if SHIPPED */}
                  {activeOrder.status === 'SHIPPED' && (
                    <button
                      onClick={() => handleMarkDelivered(activeOrder)}
                      className="px-3 py-1.5 bg-[#1F6B43] hover:bg-[#185334] text-white text-xs font-bold rounded-[8px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Delivered</span>
                    </button>
                  )}

                  {/* Mark Returned if SHIPPED or DELIVERED */}
                  {(activeOrder.status === 'SHIPPED' || activeOrder.status === 'DELIVERED') && (
                    <button
                      onClick={() => handleMarkReturned(activeOrder)}
                      className="px-3 py-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] border border-[#FFCC80] text-xs font-bold rounded-[8px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Mark Returned</span>
                    </button>
                  )}

                  {/* Cancel order if not CANCELLED and not DELIVERED */}
                  {activeOrder.status !== 'CANCELLED' && activeOrder.status !== 'DELIVERED' && (
                    <button
                      onClick={() => handleCancelOrder(activeOrder)}
                      className="px-3 py-1.5 bg-white border border-[#EFE9E0] hover:bg-[#FDE3E1] text-[#9B2420] text-xs font-bold rounded-[8px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel order</span>
                    </button>
                  )}

                  {/* Restore to Confirmed if CANCELLED or RETURNED */}
                  {(activeOrder.status === 'CANCELLED' || activeOrder.status === 'RETURNED') && (
                    <button
                      onClick={() => handleConfirmOrder(activeOrder)}
                      className="px-3 py-1.5 bg-[#1F6B43] hover:bg-[#185334] text-white text-xs font-bold rounded-[8px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore to Confirmed</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Courier & Store Intelligence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Steadfast Delivery Record (100% Authentic Live Steadfast API) */}
                <div className="p-4 bg-[#FAF7F2] rounded-[16px] border border-[#EFE9E0] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-[#D6403B]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                          স্টিডফাস্ট ডেলিভারি রিপোর্ট
                        </span>
                      </div>
                      {isLoadingRisk ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6B6B6B]" />
                      ) : customerRisk?.hasHistory ? (
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            (customerRisk.pastSuccessRate || 0) >= 80
                              ? 'bg-[#E3F5EB] text-[#1F6B43]'
                              : (customerRisk.pastSuccessRate || 0) >= 60
                              ? 'bg-[#FEF6E6] text-[#A86400]'
                              : 'bg-[#FDE3E1] text-[#C23631]'
                          }`}
                        >
                          {customerRisk.pastSuccessRate}% সাকসেস রেট
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#6B6B6B]">
                          নতুন কাস্টমার
                        </span>
                      )}
                    </div>

                    {isLoadingRisk ? (
                      <div className="py-4 text-center text-xs text-[#6B6B6B] flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#D6403B]" />
                        <span>স্টিডফাস্ট লাইভ ডাটা যাচাই করা হচ্ছে...</span>
                      </div>
                    ) : customerRisk?.hasHistory ? (
                      <div className="space-y-2.5 text-xs mt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white p-2.5 rounded-[12px] border border-[#EFE9E0]">
                            <span className="text-[#6B6B6B] block text-[11px]">সফল ডেলিভারি</span>
                            <span className="font-bold text-[#1F6B43] text-lg block">
                              {customerRisk.totalDeliveries !== undefined
                                ? `${customerRisk.totalDeliveries} টি`
                                : `${customerRisk.pastSuccessRate}%`}
                            </span>
                            <span className="text-[10px] text-[#6B6B6B] block">
                              {customerRisk.totalDeliveries !== undefined
                                ? 'সফল ডেলিভারি সংখ্যা'
                                : 'ডেলিভারি সাকসেস রেট'}
                            </span>
                          </div>
                          <div className="bg-white p-2.5 rounded-[12px] border border-[#EFE9E0]">
                            <span className="text-[#6B6B6B] block text-[11px]">বাতিল / রিটার্ন</span>
                            <span
                              className={`font-bold text-lg block ${
                                (customerRisk.returnRatio || 0) > 0 ? 'text-[#C23631]' : 'text-[#6B6B6B]'
                              }`}
                            >
                              {customerRisk.returnCount !== undefined
                                ? `${customerRisk.returnCount} টি`
                                : `${customerRisk.returnRatio || 0}%`}
                            </span>
                            <span className="text-[10px] text-[#6B6B6B] block">
                              {customerRisk.returnCount !== undefined
                                ? 'বাতিল পার্সেল সংখ্যা'
                                : 'রিটার্ন অনুপাত'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] px-0.5 pt-0.5">
                          <span>
                            পার্সেল ভলিউম:{' '}
                            <strong className="text-[#2B2B2B]">
                              {customerRisk.totalParcels
                                ? `${customerRisk.totalParcels} টি`
                                : customerRisk.volumeRange || customerRisk.volumeBand || 'সক্রিয়'}
                            </strong>
                          </span>
                          <span>
                            ফ্রড রিপোর্ট:{' '}
                            <strong className={(customerRisk.totalReports || 0) > 0 ? 'text-[#C23631]' : 'text-[#1F6B43]'}>
                              {customerRisk.totalReports || 0} টি
                            </strong>
                          </span>
                        </div>

                        {customerRisk.isRisky && (
                          <div className="p-2 bg-[#FDE3E1]/70 border border-[#F9C3BE] rounded-[8px] text-[11px] text-[#C23631] font-semibold flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span>উচ্চ রিটার্ন ঝুঁকি! কাস্টমারের রিটার্ন রেট {customerRisk.returnRatio}% এবং রিপোর্ট {customerRisk.totalReports || 0} টি।</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white p-3.5 rounded-[12px] border border-[#EFE9E0] text-xs text-[#6B6B6B] mt-2 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[#1F6B43] font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-[#1F6B43] shrink-0" />
                          <span>স্টিডফাস্টে কোনো ফ্রড বা অভিযোগ নেই</span>
                        </div>
                        <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                          স্টিডফাস্ট কুরিয়ার নেটওয়ার্কে এই নম্বরে পূর্বে কোনো পার্সেল হিস্ট্রি পাওয়া যায়নি (কাস্টমারের নতুন নম্বর)।
                        </p>
                        <div className="pt-1 border-t border-[#EFE9E0] flex items-center justify-between text-[10px] text-[#8C8C8C]">
                          <span>লাইভ ভেরিফিকেশন: সম্পন্ন</span>
                          <span className="text-[#1F6B43] font-medium">নিরাপদ কাস্টমার</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. CraftyKidsCo Store Orders Record */}
                <div className="p-4 bg-[#FAF7F2] rounded-[16px] border border-[#EFE9E0] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#D6403B]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                          আমাদের স্টোরের অর্ডার
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F1FD] text-[#0B5F85]">
                        মোট {customerStoreStats.total} টি অর্ডার
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs mt-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white p-2.5 rounded-[12px] border border-[#EFE9E0] text-center">
                          <span className="text-[#6B6B6B] block text-[10px]">ডেলিভার্ড</span>
                          <span className="font-bold text-[#1F6B43] text-base">
                            {customerStoreStats.delivered} <span className="text-[11px] font-normal">টি</span>
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-[12px] border border-[#EFE9E0] text-center">
                          <span className="text-[#6B6B6B] block text-[10px]">চলমান/পেন্ডিং</span>
                          <span className="font-bold text-[#0B5F85] text-base">
                            {customerStoreStats.pending + customerStoreStats.confirmed} <span className="text-[11px] font-normal">টি</span>
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-[12px] border border-[#EFE9E0] text-center">
                          <span className="text-[#6B6B6B] block text-[10px]">বাতিল</span>
                          <span
                            className={`font-bold text-base ${
                              customerStoreStats.cancelled > 0 ? 'text-[#C23631]' : 'text-[#6B6B6B]'
                            }`}
                          >
                            {customerStoreStats.cancelled} <span className="text-[11px] font-normal">টি</span>
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#6B6B6B] px-0.5">
                        {customerStoreStats.isFirstOrder
                          ? '🌟 আমাদের স্টোরে এটি এই কাস্টমারের ১ম অর্ডার!'
                          : `✨ পুরাতন কাস্টমার — পূর্বে ${customerStoreStats.total}টি অর্ডার করেছেন।`}
                      </p>
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

                  {/* Customer Note (বিশেষ নির্দেশনা বা নোট) */}
                  {activeOrder.customerNote && (
                    <div className="mt-3 p-3 rounded-[12px] bg-[#FFF8E7] border border-[#FFE082] text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-[#B78103] font-bold">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>গ্রাহকের বিশেষ নির্দেশনা বা নোট:</span>
                      </div>
                      <p className="text-[#4A3B18] font-medium leading-relaxed pl-5 bg-white/70 p-2 rounded-lg border border-[#FFE082]/60">
                        "{activeOrder.customerNote}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Courier Information with Tracking ID & Copy button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                    Courier Information
                  </h4>
                  {activeOrder.trackingCode || activeOrder.consignmentId ? (
                    <StatusPill variant="blue" size="sm">
                      {activeOrder.status === 'DELIVERED' ? 'Delivered' : 'Dispatched'}
                    </StatusPill>
                  ) : (
                    <span className="text-[11px] text-[#6B6B6B]">Not dispatched yet</span>
                  )}
                </div>

                <div className="p-3.5 bg-[#FAF7F2] border border-[#EFE9E0] rounded-[16px] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#0B5F85]" />
                      <span className="font-semibold text-[#2B2B2B]">
                        Courier Partner: <strong className="text-[#0B5F85]">Steadfast Courier</strong>
                      </span>
                    </div>
                  </div>

                  {activeOrder.trackingCode || activeOrder.consignmentId ? (
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-[12px] border border-[#EFE9E0] gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#6B6B6B] block">
                          Tracking ID / Consignment:
                        </span>
                        <span className="font-mono font-bold text-xs text-[#0B5F85] truncate block">
                          #{activeOrder.trackingCode || activeOrder.consignmentId}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyTracking(
                              activeOrder.trackingCode || activeOrder.consignmentId || ''
                            )
                          }
                          className="px-2.5 py-1 rounded-[8px] bg-[#FAF7F2] hover:bg-[#EFE9E0] text-[#2B2B2B] text-xs font-semibold inline-flex items-center gap-1 border border-[#EFE9E0] transition-colors cursor-pointer"
                          title="Copy tracking ID"
                        >
                          <Copy className="w-3 h-3 text-[#6B6B6B]" />
                          <span>Copy</span>
                        </button>
                        <a
                          href={`https://steadfast.com.bd/t/${
                            activeOrder.trackingCode || activeOrder.consignmentId
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-[8px] bg-[#0B5F85] hover:bg-[#084865] text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Track</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#6B6B6B]">
                      অর্ডারটি কনফার্ম হলে নিচের "Send to Steadfast" বাটনে ক্লিক করে এক ক্লিকেই কুরিয়ারে বুকিং দিন।
                    </p>
                  )}
                </div>
              </div>

              {/* Items & Money Breakdown with Amount to Collect */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                    Items & Payment Breakdown
                  </h4>
                  {!isCustomizingValue ? (
                    <button
                      type="button"
                      onClick={() => setIsCustomizingValue(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#0B5F85] bg-[#DDF1FB] hover:bg-[#BEE4F7] border border-[#BEE4F7] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit order total and delivery charge"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Value</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCustomizingValue(false)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#6B6B6B] hover:bg-[#FAF7F2] border border-[#EFE9E0] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="border border-[#EFE9E0] rounded-[16px] overflow-hidden bg-white text-xs sm:text-sm">
                  <div className="divide-y divide-[#EFE9E0]">
                    {activeOrder.items.map((item, idx) => {
                      const matchedProd = products.find(
                        (p) =>
                          p.id === item.productId ||
                          p.slug === item.productId ||
                          p.titleBn === item.title ||
                          p.titleEn === item.title
                      );
                      const matchedVar = matchedProd?.variations?.find(
                        (v) =>
                          (item.variationSku && v.sku === item.variationSku) ||
                          (item.variationTitle &&
                            (v.titleBn === item.variationTitle ||
                              v.name === item.variationTitle ||
                              v.titleEn === item.variationTitle))
                      );

                      const resolvedImage =
                        item.imageUrl ||
                        matchedVar?.imageUrl ||
                        matchedProd?.imageUrl;

                      const resolvedVarTitle =
                        item.variationTitle ||
                        (item as any).variationTitleBn ||
                        matchedVar?.titleBn ||
                        matchedVar?.name ||
                        '';

                      const resolvedSku = item.variationSku || matchedVar?.sku || '';

                      return (
                        <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded-[12px] bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-center shrink-0 overflow-hidden text-[10px] font-bold text-[#6B6B6B] shadow-2xs relative">
                              {resolvedImage ? (
                                <img
                                  src={resolvedImage}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>Item</span>
                              )}
                            </div>

                            {/* Details */}
                            <div className="min-w-0">
                              <span className="font-bold text-[#2B2B2B] block text-xs sm:text-sm leading-snug">
                                {item.title}
                              </span>

                              {/* Variation Pill */}
                              {resolvedVarTitle ? (
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FAF0E6] text-[#A04000] border border-[#F0D5BE]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D6403B]" />
                                    ভ্যারিয়েন্ট: {resolvedVarTitle}
                                  </span>
                                  {resolvedSku && (
                                    <span className="text-[10px] font-mono text-[#6B6B6B] bg-[#F5F5F5] px-1.5 py-0.5 rounded border border-[#E5E5E5]">
                                      SKU: {resolvedSku}
                                    </span>
                                  )}
                                </div>
                              ) : resolvedSku ? (
                                <span className="inline-block mt-0.5 text-[10px] font-mono text-[#6B6B6B] bg-[#F5F5F5] px-1.5 py-0.5 rounded border border-[#E5E5E5]">
                                  SKU: {resolvedSku}
                                </span>
                              ) : null}

                              <span className="text-xs text-[#6B6B6B] mt-0.5 block">
                                Qty: <strong className="text-[#2B2B2B]">{item.quantity}</strong> &times; ৳{item.price.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <span className="font-bold text-[#2B2B2B] whitespace-nowrap text-sm">
                            ৳{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {isCustomizingValue ? (
                    <div className="p-4 bg-[#FFF9F3] border-t-2 border-[#D6403B] space-y-3 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-[#EFE9E0]">
                        <span className="font-bold text-[#2B2B2B] text-sm flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5 text-[#D6403B]" />
                          Customize Order Value
                        </span>
                        <span className="text-[11px] text-[#6B6B6B]">
                          Subtotal: <strong>{formatTaka(customSubtotal)}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Delivery Charge */}
                        <div>
                          <label className="block text-[#6B6B6B] font-semibold mb-1">
                            Delivery Charge (৳):
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={customDeliveryCharge}
                            onChange={(e) => {
                              const d = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setCustomDeliveryCharge(d);
                              setCustomTotalAmount(Math.max(0, customSubtotal + d - customDiscount));
                            }}
                            className="text-xs font-semibold h-9"
                          />
                          <div className="flex gap-1.5 mt-1">
                            {[0, 60, 120].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => {
                                  setCustomDeliveryCharge(amt);
                                  setCustomTotalAmount(Math.max(0, customSubtotal + amt - customDiscount));
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                  customDeliveryCharge === amt
                                    ? 'bg-[#0B5F85] text-white border-[#0B5F85]'
                                    : 'bg-white text-[#6B6B6B] border-[#EFE9E0] hover:bg-[#FAF7F2]'
                                }`}
                              >
                                {amt === 0 ? 'Free (৳0)' : `৳${amt}`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Discount */}
                        <div>
                          <label className="block text-[#6B6B6B] font-semibold mb-1">
                            Additional Discount (৳):
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={customDiscount}
                            onChange={(e) => {
                              const disc = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setCustomDiscount(disc);
                              setCustomTotalAmount(Math.max(0, customSubtotal + customDeliveryCharge - disc));
                            }}
                            className="text-xs font-semibold h-9"
                          />
                        </div>
                      </div>

                      {/* Direct Custom Total */}
                      <div className="pt-2 border-t border-[#EFE9E0]">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-bold text-[#2B2B2B] text-xs">
                            Total / Amount to Collect (৳):
                          </label>
                          <span className="text-[10px] text-[#A04000] font-medium">
                            (Direct total entry auto-adjusts discount)
                          </span>
                        </div>
                        <Input
                          type="number"
                          min={0}
                          value={customTotalAmount}
                          onChange={(e) => {
                            const tot = Math.max(0, parseInt(e.target.value, 10) || 0);
                            setCustomTotalAmount(tot);
                            const impliedDisc = Math.max(0, customSubtotal + customDeliveryCharge - tot);
                            setCustomDiscount(impliedDisc);
                          }}
                          className="text-sm font-black text-[#C23631] h-10 border-[#D6403B]/40 focus:border-[#D6403B]"
                        />
                      </div>

                      {/* Optional reason / note */}
                      <div>
                        <label className="block text-[#6B6B6B] font-semibold mb-1">
                          Reason / Internal Note (optional):
                        </label>
                        <Input
                          type="text"
                          value={customValueReason}
                          onChange={(e) => setCustomValueReason(e.target.value)}
                          placeholder="e.g. Special phone discount of ৳100 agreed with customer"
                          className="text-xs h-9"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EFE9E0]">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isSavingCustomValue}
                          onClick={() => setIsCustomizingValue(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={isSavingCustomValue}
                          onClick={handleSaveCustomOrderValue}
                        >
                          {isSavingCustomValue ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const fin = calculateAmountToCollect(activeOrder);
                      return (
                        <div className="p-4 bg-[#FAF7F2] border-t border-[#EFE9E0] space-y-1.5 text-xs text-[#6B6B6B]">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-semibold text-[#2B2B2B]">{formatTaka(fin.subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Delivery charge ({activeOrder.district || 'Standard'}):</span>
                            <span className="font-semibold text-[#2B2B2B]">
                              {fin.deliveryCharge === 0 ? 'Free (৳0)' : formatTaka(fin.deliveryCharge)}
                            </span>
                          </div>
                          {fin.discount > 0 && (
                            <div className="flex justify-between text-[#1F6B43] font-semibold">
                              <span>Coupon / Manual discount:</span>
                              <span>- {formatTaka(fin.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-sm text-[#2B2B2B] pt-2 border-t border-[#EFE9E0]">
                            <div className="flex items-center gap-1.5">
                              <span>Amount to collect ({activeOrder.paymentMethod || 'COD'}):</span>
                              <button
                                type="button"
                                onClick={() => setIsCustomizingValue(true)}
                                className="text-[11px] text-[#0B5F85] hover:underline flex items-center gap-0.5 ml-1 font-semibold cursor-pointer"
                                title="Edit order total"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                                <span>Edit</span>
                              </button>
                            </div>
                            <span className={fin.isPaid ? 'text-[#1F6B43]' : 'text-[#C23631]'}>
                              {fin.collectDisplayBn}
                            </span>
                          </div>
                          {fin.isPaid && (
                            <span className="text-[11px] text-[#1F6B43] font-bold block text-right">
                              ✓ পেইড (অগ্রিম পরিশোধিত)
                            </span>
                          )}
                        </div>
                      );
                    })()
                  )}
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

            {/* Fixed Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-[#EFE9E0] bg-[#FAF7F2] shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
                {/* Left side actions: Cancel or Reopen */}
                <div className="flex items-center gap-2">
                  {activeOrder.status !== 'CANCELLED' ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelOrder(activeOrder)}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel order</span>
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleConfirmOrder(activeOrder)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#1F6B43]" />
                      <span>Reopen / Confirm</span>
                    </Button>
                  )}
                </div>

                {/* Right side actions: Confirm, Print, Send to Steadfast */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePrintInvoices([activeOrder])}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print invoice</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!(activeOrder.consignmentId || activeOrder.trackingCode)}
                    onClick={() => openStickerPrintModal([activeOrder])}
                    title={!(activeOrder.consignmentId || activeOrder.trackingCode) ? 'আগে কুরিয়ারে পাঠান' : 'Print parcel sticker'}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Print sticker</span>
                  </Button>

                  {/* Primary Confirm button if order is PENDING */}
                  {activeOrder.status === 'PENDING' && (
                    <button
                      onClick={() => handleConfirmOrder(activeOrder)}
                      className="px-4 py-2 bg-[#1F6B43] hover:bg-[#185334] text-white text-xs sm:text-sm font-bold rounded-[10px] shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm order</span>
                    </button>
                  )}

                  {/* Send to Steadfast if order is CONFIRMED */}
                  {activeOrder.status === 'CONFIRMED' && (
                    activeOrder.consignmentId || activeOrder.trackingCode ? (
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
                        <span>Track Steadfast</span>
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isSubmittingDispatch}
                        onClick={() => handleDispatchOrder(activeOrder)}
                      >
                        <Truck className="w-4 h-4" />
                        <span>Send to Steadfast</span>
                      </Button>
                    )
                  )}

                  {/* Mark Delivered / Returned if order is SHIPPED */}
                  {activeOrder.status === 'SHIPPED' && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkReturned(activeOrder)}
                        className="text-[#E65100] border-[#FFCC80] hover:bg-[#FFF3E0]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Mark Returned</span>
                      </Button>
                      <button
                        onClick={() => handleMarkDelivered(activeOrder)}
                        className="px-4 py-2 bg-[#1F6B43] hover:bg-[#185334] text-white text-xs sm:text-sm font-bold rounded-[10px] shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Delivered</span>
                      </button>
                    </>
                  )}

                  {/* Mark Returned if order is DELIVERED */}
                  {activeOrder.status === 'DELIVERED' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleMarkReturned(activeOrder)}
                      className="text-[#E65100] border-[#FFCC80] hover:bg-[#FFF3E0]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Mark Returned</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. MANUAL ORDER CREATION MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#D6403B]" />
            <span className="font-heading font-black text-lg text-[#2B2B2B]">
              Create Order Manually (ম্যানুয়াল অর্ডার তৈরি)
            </span>
          </div>
        }
        description="ফেসবুক, হোয়াটসঅ্যাপ বা ফোনে আসা অর্ডার সরাসরি এডমিন প্যানেল থেকে সিস্টেমে যুক্ত করুন"
        maxWidth="2xl"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
            <div className="text-xs text-[#6B6B6B]">
              <span>সর্বমোট প্রদেয় বিল: </span>
              <strong className="text-sm font-black text-[#D6403B]">৳{newOrderAmount}</strong>
              <span className="text-[11px] text-[#6B6B6B] ml-1">
                ({newOrderPayment === 'COD' ? 'ক্যাশ অন ডেলিভারি' : newOrderPayment})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                বাতিল (Cancel)
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateManualOrder}>
                অর্ডার নিশ্চিত করুন (Create Order)
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleCreateManualOrder} className="space-y-4 text-xs text-[#2B2B2B]">
          {/* Section 1: Customer & Address Information */}
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EFE9E0] space-y-3">
            <h5 className="font-heading font-bold text-xs text-[#2B2B2B] uppercase tracking-wider text-[#6B6B6B]">
              ১. গ্রাহক ও ডেলিভারি তথ্য (Customer &amp; Address)
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Customer Name (গ্রাহকের নাম)"
                value={newOrderCustomer}
                onChange={(e) => setNewOrderCustomer(e.target.value)}
                placeholder="যেমন: আয়েশা রহমান"
                required
              />

              <Input
                label="Phone Number (মোবাইল নম্বর)"
                value={newOrderPhone}
                onChange={(e) => setNewOrderPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="District (জেলা)"
                value={newOrderDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
              >
                {districtOptions.map((d) => (
                  <option key={d.nameEn} value={d.nameEn}>
                    {d.nameEn} ({d.nameBn})
                  </option>
                ))}
              </Select>

              <Select
                label="Thana / Upazila (থানা / উপজেলা)"
                value={newOrderThana}
                onChange={(e) => setNewOrderThana(e.target.value)}
                required
              >
                <option value="">-- থানা নির্বাচন করুন --</option>
                {availableThanas.map((th) => (
                  <option key={th.nameEn} value={th.nameEn}>
                    {th.nameBn} ({th.nameEn})
                  </option>
                ))}
                <option value="OTHER">অন্যান্য / ম্যানুয়াল থানা লিখুন (Other)</option>
              </Select>
            </div>

            {newOrderThana === 'OTHER' && (
              <Input
                label="Custom Thana Name (থানার নাম)"
                value={newOrderCustomThana}
                onChange={(e) => setNewOrderCustomThana(e.target.value)}
                placeholder="থানার নাম লিখুন"
                required
              />
            )}

            <Textarea
              label="Delivery Address (বাসা, রোড ও এলাকার বিস্তারিত ঠিকানা)"
              value={newOrderAddress}
              onChange={(e) => setNewOrderAddress(e.target.value)}
              placeholder="যেমন: বাসা নং ১২, রোড নং ৪, সেক্টর ৩..."
              rows={2}
              required
            />
          </div>

          {/* Section 2: Product Name + Variant & Quantity */}
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EFE9E0] space-y-3">
            <h5 className="font-heading font-bold text-xs text-[#2B2B2B] uppercase tracking-wider text-[#6B6B6B]">
              ২. পণ্য, ভ্যারিয়েন্ট ও পরিমাণ (Product Name, Variant &amp; Quantity)
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Product Name (পণ্য নির্বাচন করুন)"
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
              >
                {storeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titleBn || p.titleEn} (৳{p.baseSalePrice || p.basePrice || p.price})
                  </option>
                ))}
                <option value="CUSTOM">+ কাস্টম পণ্য (Custom / Other Item)</option>
              </Select>

              {selectedProductId === 'CUSTOM' ? (
                <Input
                  label="Custom Product Title (পণ্যের নাম)"
                  value={customProductName}
                  onChange={(e) => setCustomProductName(e.target.value)}
                  placeholder="যেমন: স্পেশাল আর্ট কিট"
                  required
                />
              ) : (
                <Select
                  label="Variant (ভ্যারিয়েন্ট নির্বাচন করুন)"
                  value={selectedVariantSku}
                  onChange={(e) => handleVariantChange(e.target.value)}
                  disabled={!currentProductVariations || currentProductVariations.length === 0}
                >
                  {currentProductVariations && currentProductVariations.length > 0 ? (
                    currentProductVariations.map((v) => (
                      <option key={v.sku || v.id} value={v.sku || v.id}>
                        {v.titleBn || v.titleEn || v.name} — ৳{v.salePrice || v.price}
                      </option>
                    ))
                  ) : (
                    <option value="standard">স্ট্যান্ডার্ড ভ্যারিয়েন্ট (Standard)</option>
                  )}
                </Select>
              )}
            </div>

            {selectedProductId === 'CUSTOM' && (
              <Input
                label="Custom Variant (ভ্যারিয়েন্টের নাম/সাইজ)"
                value={customVariantName}
                onChange={(e) => setCustomVariantName(e.target.value)}
                placeholder="যেমন: ১২ পিস সেট / সাইজ L"
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                type="number"
                min={1}
                label="Quantity (পরিমাণ / সংখ্যা)"
                value={itemQuantity}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                required
              />

              <Input
                type="number"
                min={0}
                label="Unit Price (প্রতিটির মূল্য ৳)"
                value={itemUnitPrice}
                onChange={(e) => handleUnitPriceChange(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Section 3: Delivery Fee, Total Amount & Payment */}
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EFE9E0] space-y-3">
            <h5 className="font-heading font-bold text-xs text-[#2B2B2B] uppercase tracking-wider text-[#6B6B6B]">
              ৩. বিল ও পেমেন্ট বিবরণ (Pricing &amp; Payment)
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Input
                  type="number"
                  min={0}
                  label="Delivery Charge (ডেলিভারি চার্জ ৳)"
                  value={deliveryFee}
                  onChange={(e) => handleDeliveryFeeChange(Number(e.target.value))}
                  required
                />
                <span className="text-[11px] text-[#6B6B6B] block mt-0.5">
                  {newOrderDistrict.toLowerCase().includes('dhaka') ? 'ঢাকা সিটি (স্বয়ংক্রিয় ৳৬০)' : 'ঢাকার বাইরে (স্বয়ংক্রিয় ৳১২০)'}
                </span>
              </div>

              <div>
                <Input
                  type="number"
                  min={0}
                  label="Total Amount (সর্বমোট প্রদেয় টাকা ৳)"
                  value={newOrderAmount}
                  onChange={(e) => handleTotalAmountChange(Number(e.target.value))}
                  required
                />
                <div className="flex items-center justify-between text-[11px] mt-0.5">
                  <span className="text-[#6B6B6B]">
                    আইটেম: ৳{itemUnitPrice * itemQuantity} + ডেলিভারি: ৳{deliveryFee}
                  </span>
                  {isAmountManuallyOverridden && (
                    <button
                      type="button"
                      onClick={handleRecalculateAmount}
                      className="text-[#D6403B] font-bold hover:underline cursor-pointer"
                    >
                      স্বয়ংক্রিয় হিসাব
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Select
                label="Payment Method (পেমেন্ট পদ্ধতি)"
                value={newOrderPayment}
                onChange={(e) => setNewOrderPayment(e.target.value as any)}
              >
                <option value="COD">Cash on delivery (ক্যাশ অন ডেলিভারি)</option>
                <option value="BKASH">bKash (বিকাশ প্রিপেইড)</option>
                <option value="NAGAD">Nagad (নগদ প্রিপেইড)</option>
              </Select>

              <Select
                label="Order Source (অর্ডার সোর্স / চ্যানেল)"
                value={newOrderSource}
                onChange={(e) => setNewOrderSource(e.target.value as any)}
              >
                <option value="facebook">Facebook Message (ফেসবুক)</option>
                <option value="whatsapp">WhatsApp Chat (হোয়াটসঅ্যাপ)</option>
                <option value="phone">Phone Call (সরাসরি ফোন কল)</option>
                <option value="manual">Manual Admin Entry (অন্যান্য)</option>
              </Select>
            </div>
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

      {/* 12. STICKER PRINT MODAL (THERMAL & SHEET LAYOUTS) */}
      <Modal
        isOpen={isStickerModalOpen}
        onClose={() => setIsStickerModalOpen(false)}
        title="পার্সেল স্টিকার প্রিন্ট করুন (Print Parcel Stickers)"
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <a
                href={`/api/print/sticker?test=1&sheet=${selectedStickerLayout === 'sheet4' ? '4' : selectedStickerLayout === 'sheet8' ? '8' : ''}&size=${selectedStickerLayout === '75x50' ? '75x50' : '100x150'}&startPos=${stickerStartPos}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl border border-[#EFE9E0] hover:bg-[#FAF7F2] text-xs font-semibold text-[#6B6B6B] inline-flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D6403B]" />
                Test print (Alignment)
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsStickerModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const opts: any = {};
                  if (selectedStickerLayout === 'sheet4') opts.sheet = '4';
                  else if (selectedStickerLayout === 'sheet8') opts.sheet = '8';
                  else opts.size = selectedStickerLayout;

                  if (stickerStartPos > 1) opts.startPos = stickerStartPos;

                  handlePrintStickers(stickerModalTargets, opts);
                  setIsStickerModalOpen(false);
                }}
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print Stickers PDF
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 text-xs text-[#2B2B2B]">
          {/* Order Summary & Eligibility */}
          {(() => {
            const eligible = stickerModalTargets.filter((o) => !!(o.consignmentId || o.trackingCode));
            const skipped = stickerModalTargets.filter((o) => !(o.consignmentId || o.trackingCode));

            return (
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2B2B2B]">
                    নির্বাচিত অর্ডার: {stickerModalTargets.length}টি
                  </span>
                  <span className="font-bold text-[#1F6B43]">
                    প্রিন্টযোগ্য (কুরিয়ার আইডি যুক্ত): {eligible.length}টি
                  </span>
                </div>

                {skipped.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-[#FFF3CC] border border-[#FFE28A] text-[#7A4E00] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        {skipped.length}টি অর্ডারে কুরিয়ার কনসাইনমেন্ট আইডি নেই (বাদ দেওয়া হবে):
                      </span>
                      <span className="text-[11px] block mt-0.5">
                        {skipped.map((o) => `#${o.orderNumber}`).join(', ')} — স্টিকারের জন্য আগে কুরিয়ারে পাঠান।
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 1. Layout & Printer Format Selection */}
          <div className="space-y-2">
            <label className="font-bold text-xs text-[#2B2B2B] block">
              প্রিন্টার টাইপ ও স্টিকার সাইজ নির্বাচন করুন:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  selectedStickerLayout === '100x150'
                    ? 'border-[#D6403B] bg-[#FFF6F5] text-[#D6403B]'
                    : 'border-[#EFE9E0] bg-white text-[#2B2B2B] hover:bg-[#FAF7F2]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm">100 x 150 mm Thermal Label</span>
                  <input
                    type="radio"
                    name="modalStickerLayout"
                    value="100x150"
                    checked={selectedStickerLayout === '100x150'}
                    onChange={() => setSelectedStickerLayout('100x150')}
                    className="accent-[#D6403B]"
                  />
                </div>
                <span className="text-[11px] text-[#6B6B6B] leading-relaxed">
                  থার্মাল লেবেল প্রিন্টারের জন্য আদর্শ সাইজ (Single sticker per 100x150mm page, pure B&amp;W).
                </span>
              </label>

              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  selectedStickerLayout === 'sheet4'
                    ? 'border-[#D6403B] bg-[#FFF6F5] text-[#D6403B]'
                    : 'border-[#EFE9E0] bg-white text-[#2B2B2B] hover:bg-[#FAF7F2]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm">A4 Sheet: 4 Stickers (2 &times; 2)</span>
                  <input
                    type="radio"
                    name="modalStickerLayout"
                    value="sheet4"
                    checked={selectedStickerLayout === 'sheet4'}
                    onChange={() => setSelectedStickerLayout('sheet4')}
                    className="accent-[#D6403B]"
                  />
                </div>
                <span className="text-[11px] text-[#6B6B6B] leading-relaxed">
                  সাধারণ লেজার বা ইঙ্কজেট প্রিন্টারে A4 পেপার বা A6 স্টিকার শিটে ৪টি করে প্রিন্ট করুন। কাটার জন্য ড্যাশড লাইন থাকবে।
                </span>
              </label>

              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  selectedStickerLayout === 'sheet8'
                    ? 'border-[#D6403B] bg-[#FFF6F5] text-[#D6403B]'
                    : 'border-[#EFE9E0] bg-white text-[#2B2B2B] hover:bg-[#FAF7F2]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm">A4 Sheet: 8 Stickers (2 &times; 4)</span>
                  <input
                    type="radio"
                    name="modalStickerLayout"
                    value="sheet8"
                    checked={selectedStickerLayout === 'sheet8'}
                    onChange={() => setSelectedStickerLayout('sheet8')}
                    className="accent-[#D6403B]"
                  />
                </div>
                <span className="text-[11px] text-[#6B6B6B] leading-relaxed">
                  কমপ্যাক্ট লেবেল — প্রতি A4 পাতায় ৮টি করে স্টিকার প্রিন্ট করুন।
                </span>
              </label>

              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-colors ${
                  selectedStickerLayout === '75x50'
                    ? 'border-[#D6403B] bg-[#FFF6F5] text-[#D6403B]'
                    : 'border-[#EFE9E0] bg-white text-[#2B2B2B] hover:bg-[#FAF7F2]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm">75 x 50 mm Compact Thermal</span>
                  <input
                    type="radio"
                    name="modalStickerLayout"
                    value="75x50"
                    checked={selectedStickerLayout === '75x50'}
                    onChange={() => setSelectedStickerLayout('75x50')}
                    className="accent-[#D6403B]"
                  />
                </div>
                <span className="text-[11px] text-[#6B6B6B] leading-relaxed">
                  ছোট পার্সেল বক্সের জন্য মিনি থার্মাল লেবেল।
                </span>
              </label>
            </div>
          </div>

          {/* 2. Sheet Start Position (for partially used sheets) */}
          {(selectedStickerLayout === 'sheet4' || selectedStickerLayout === 'sheet8') && (
            <div className="p-4 rounded-2xl bg-white border border-[#EFE9E0] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#2B2B2B] block">
                    কাগজের শুরু করার অবস্থান (Start Position on Sheet):
                  </span>
                  <span className="text-[11px] text-[#6B6B6B]">
                    আগের ব্যবহৃত স্টিকার শিট পুনরায় ব্যবহারের জন্য খালি পজিশন বেছে নিন।
                  </span>
                </div>
                <span className="font-bold text-xs text-[#D6403B] bg-[#FFF6F5] px-2.5 py-1 rounded-lg border border-[#F8BEBA]">
                  পজিশন #{stickerStartPos} থেকে শুরু
                </span>
              </div>

              {selectedStickerLayout === 'sheet4' ? (
                <div className="grid grid-cols-2 gap-2 max-w-[240px] mx-auto text-center font-bold">
                  {[1, 2, 3, 4].map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setStickerStartPos(pos)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        stickerStartPos === pos
                          ? 'border-[#D6403B] bg-[#D6403B] text-white shadow-xs'
                          : 'border-[#EFE9E0] bg-[#FAF7F2] text-[#2B2B2B] hover:bg-[#EFE9E0]'
                      }`}
                    >
                      পজিশন {pos}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-w-[240px] mx-auto text-center font-bold">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setStickerStartPos(pos)}
                      className={`p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                        stickerStartPos === pos
                          ? 'border-[#D6403B] bg-[#D6403B] text-white shadow-xs'
                          : 'border-[#EFE9E0] bg-[#FAF7F2] text-[#2B2B2B] hover:bg-[#EFE9E0]'
                      }`}
                    >
                      #{pos}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Thermal Printer Settings Tip */}
          <div className="text-[11px] text-[#6B6B6B] bg-[#FAF7F2] p-3 rounded-xl border border-[#EFE9E0] leading-relaxed">
            <strong>প্রিন্ট টিপস:</strong> ব্রাউজারের প্রিন্ট ডায়ালগে <em>&quot;Headers and footers&quot;</em> বন্ধ রাখুন এবং Scale <em>100% (Actual size)</em> রাখুন। থার্মাল প্রিন্টারে পেপারের মাপ ১০০ &times; ১৫০ মিমি সেট করুন।
          </div>
        </div>
      </Modal>

      {/* 13. CONFIRM DIALOG FOR DESTRUCTIVE / BULK ACTIONS */}
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
