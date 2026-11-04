import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Expense } from '@/models/Expense';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req, 'reports.view');
    if (!auth.authorized) {
      return auth.response;
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d'; // today, 7d, 30d, all

    // 1. Determine Date Filter
    const now = new Date();
    let startDate: Date | null = null;

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } // 'all' leaves startDate as null

    const orderFilter: any = {};
    const expenseFilter: any = {};
    if (startDate) {
      orderFilter.createdAt = { $gte: startDate };
      expenseFilter.date = { $gte: startDate };
    }

    // 2. Fetch Orders, Products & Operational Expenses
    const [orders, products, expenses] = await Promise.all([
      Order.find(orderFilter).sort({ createdAt: -1 }).lean(),
      Product.find({}).lean(),
      Expense.find(expenseFilter).sort({ date: -1 }).lean(),
    ]);

    // Build product cost lookup map
    const productCostMap: Record<string, { cost: number; title: string }> = {};
    for (const p of products) {
      const cost =
        typeof p.costPrice === 'number' && p.costPrice > 0
          ? p.costPrice
          : typeof p.costPerItem === 'number' && p.costPerItem > 0
          ? p.costPerItem
          : Math.round((p.salePrice || p.regularPrice || p.price || 1000) * 0.42);

      const title = p.titleBn || p.titleEn || p.title || 'Product';
      if (p.id) productCostMap[p.id] = { cost, title };
      if (p._id) productCostMap[p._id.toString()] = { cost, title };
      if (p.slug) productCostMap[p.slug] = { cost, title };
    }

    // 3. Operational Expenses Aggregation (Meta Ads, Packaging, Salaries, etc.)
    let totalExpenses = 0;
    const expenseBreakdown: Record<string, number> = {
      FB_ADS: 0,
      PACKAGING: 0,
      COURIER: 0,
      SALARY: 0,
      OFFICE_RENT: 0,
      SOFTWARE_SMS: 0,
      OTHER: 0,
    };

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      totalExpenses += amt;
      const cat = exp.category || 'OTHER';
      if (expenseBreakdown[cat] !== undefined) {
        expenseBreakdown[cat] += amt;
      } else {
        expenseBreakdown[cat] = amt;
      }
    }

    // 4. Aggregate Order Metrics
    let totalGrossRevenue = 0;
    let totalCogs = 0;
    let totalDeliveryCollected = 0;
    let totalDiscountsGiven = 0;

    let deliveredCount = 0;
    let deliveredRevenue = 0;

    let inTransitCount = 0;
    let inTransitAmount = 0;

    let pendingCount = 0;
    let pendingAmount = 0;

    let confirmedCount = 0;
    let confirmedAmount = 0;

    let returnedCount = 0;
    let returnedLoss = 0;

    let cancelledCount = 0;
    let cancelledAmount = 0;

    // Product performance map: productId -> stats
    const productStats: Record<
      string,
      { title: string; unitsSold: number; revenue: number; cost: number }
    > = {};

    // Daily revenue map: YYYY-MM-DD -> { revenue, count }
    const dailyMap: Record<string, { revenue: number; ordersCount: number }> = {};

    for (const ord of orders) {
      const isCancelled = ord.status === 'CANCELLED';
      const isReturned = ord.status === 'RETURNED';
      const isDelivered = ord.status === 'DELIVERED';
      const isShipped = ord.status === 'SHIPPED';
      const isPending = ord.status === 'PENDING';
      const isConfirmed = ord.status === 'CONFIRMED' || ord.status === 'PROCESSING';

      const orderTotal = Number(ord.totalAmount) || 0;
      const deliveryCharge = Number(ord.deliveryCharge) || 0;
      const discount = Number(ord.discountAmount) || 0;

      // Status breakdown
      if (isDelivered) {
        deliveredCount++;
        deliveredRevenue += orderTotal;
      } else if (isShipped) {
        inTransitCount++;
        inTransitAmount += orderTotal;
      } else if (isPending) {
        pendingCount++;
        pendingAmount += orderTotal;
      } else if (isConfirmed) {
        confirmedCount++;
        confirmedAmount += orderTotal;
      } else if (isReturned) {
        returnedCount++;
        returnedLoss += deliveryCharge; // Return freight cost loss
      } else if (isCancelled) {
        cancelledCount++;
        cancelledAmount += orderTotal;
      }

      // If order is not cancelled, include in financial revenue & COGS calculations
      if (!isCancelled) {
        totalGrossRevenue += orderTotal;
        totalDeliveryCollected += deliveryCharge;
        totalDiscountsGiven += discount;

        // Daily trend
        const orderDateStr = new Date(ord.createdAt || Date.now()).toISOString().split('T')[0];
        if (!dailyMap[orderDateStr]) {
          dailyMap[orderDateStr] = { revenue: 0, ordersCount: 0 };
        }
        dailyMap[orderDateStr].revenue += orderTotal;
        dailyMap[orderDateStr].ordersCount += 1;

        // Calculate item-level COGS
        if (Array.isArray(ord.items)) {
          for (const it of ord.items) {
            const qty = Number(it.quantity) || 1;
            const price = Number(it.price) || 0;
            const itemTotal = Number(it.total) || price * qty;

            const itemKey = (it.productId || it.id || '') as string;
            const pInfo = (itemKey && productCostMap[itemKey]) ? productCostMap[itemKey] : {
              cost: Math.round(price * 0.42),
              title: it.title || 'Product',
            };

            const unitCost = pInfo.cost;
            const totalCost = unitCost * qty;
            totalCogs += totalCost;

            // Product ranking
            const prodKey = it.productId || it.title || 'unknown';
            if (!productStats[prodKey]) {
              productStats[prodKey] = {
                title: it.title || pInfo.title,
                unitsSold: 0,
                revenue: 0,
                cost: 0,
              };
            }
            productStats[prodKey].unitsSold += qty;
            productStats[prodKey].revenue += itemTotal;
            productStats[prodKey].cost += totalCost;
          }
        }
      }
    }

    // P&L Net Profit Calculations:
    // Gross Profit = Gross Revenue minus Product Costs (COGS) and Return courier losses
    const grossProfit = Math.max(0, totalGrossRevenue - totalCogs - returnedLoss);
    // True Net Business Profit = Gross Profit minus all Operational Expenses (Ads, Salaries, Boxes, etc.)
    const trueNetProfit = grossProfit - totalExpenses;
    const profitMargin =
      totalGrossRevenue > 0 ? Number(((trueNetProfit / totalGrossRevenue) * 100).toFixed(1)) : 0;

    // Dispatched orders for return rate calculation
    const totalDispatched = deliveredCount + returnedCount + inTransitCount;
    const returnRate =
      totalDispatched > 0 ? Number(((returnedCount / totalDispatched) * 100).toFixed(1)) : 0;

    // Sort Top Products by Revenue
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((p) => {
        const profit = p.revenue - p.cost;
        const margin = p.revenue > 0 ? Number(((profit / p.revenue) * 100).toFixed(1)) : 0;
        return {
          title: p.title,
          unitsSold: p.unitsSold,
          revenue: p.revenue,
          cost: p.cost,
          profit,
          margin,
        };
      });

    // Format Daily Trend Array (sorted ascending)
    const dailyTrend = Object.keys(dailyMap)
      .sort()
      .map((dateStr) => {
        const d = new Date(dateStr);
        const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        return {
          date: dateStr,
          label,
          revenue: dailyMap[dateStr].revenue,
          ordersCount: dailyMap[dateStr].ordersCount,
        };
      });

    return NextResponse.json({
      success: true,
      range,
      totalOrders: orders.length,
      financials: {
        grossRevenue: totalGrossRevenue,
        cogs: totalCogs,
        deliveryCollected: totalDeliveryCollected,
        discountsGiven: totalDiscountsGiven,
        grossProfit,
        totalExpenses,
        expenseBreakdown,
        netProfit: trueNetProfit,
        profitMargin,
      },
      logistics: {
        deliveredCount,
        deliveredRevenue,
        inTransitCount,
        inTransitAmount,
        pendingCount,
        pendingAmount,
        confirmedCount,
        confirmedAmount,
        returnedCount,
        returnedLoss,
        cancelledCount,
        cancelledAmount,
        returnRate,
      },
      topProducts,
      dailyTrend,
      expensesCount: expenses.length,
    });
  } catch (error: any) {
    console.error('Reports Analytics Error:', error);
    return NextResponse.json(
      { success: false, message: 'রিপোর্ট তৈরি করতে ত্রুটি হয়েছে: ' + (error.message || '') },
      { status: 500 }
    );
  }
}
