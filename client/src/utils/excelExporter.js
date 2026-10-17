import * as XLSX from 'xlsx';

/**
 * LUZZIO ENTERPRISE MULTI-SHEET EXCEL EXPORT SUITE
 * 
 * Provides detailed, perfectly aligned multi-sheet Excel (.xlsx) workbooks
 * formatted for clean viewing across Microsoft Excel, Apple Numbers, and Google Sheets.
 */

// ============================================================================
// 1. OMNICOMMERCE EXECUTIVE & POS COMPREHENSIVE WORKBOOK
// ============================================================================
export const exportMultiSheetExcelReport = ({
   summaryData = {},
   inventoryData = [],
   posSalesData = [],
   filename = `Luzzio_Executive_Comprehensive_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
}) => {
   const wb = XLSX.utils.book_new();

   // --- Sheet 1: Dashboard / Executive Summary ---
   const summaryRows = [
      ['LUZZIO OMNICOMMERCE ENTERPRISE PLATFORM - EXECUTIVE KPI & AUDIT SUMMARY'],
      ['Brand & Enterprise:', 'LUZZIO Luxury Apparel & Footwear'],
      ['Report Classification:', 'Consolidated Management & Operations Audit'],
      ['Generated On:', new Date().toLocaleString()],
      ['System Environment:', 'OmniCore v2.4 Enterprise Production'],
      [],
      ['SECTION 1: INVENTORY & STOCK VALUATION METRICS'],
      ['Metric Name', 'Metric Value', 'Unit / Currency'],
      ['Total Catalog Products Registered', summaryData.totalProducts ?? 0, 'Unique SKUs'],
      ['Total Physical Stock In-Warehouse', summaryData.totalStockUnits ?? 0, 'Units'],
      ['Total Inventory Asset Valuation', Number(summaryData.totalInventoryValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), 'LKR'],
      ['Low-Stock Warning Products (<= Threshold)', summaryData.lowStockProducts ?? 0, 'SKUs'],
      ['Out-of-Stock Products (0 Units Remaining)', summaryData.outOfStockProducts ?? 0, 'SKUs'],
      [],
      ['SECTION 2: POINT OF SALE (POS) & SALES PERFORMANCE'],
      ['Metric Name', 'Metric Value', 'Unit / Currency'],
      ['Total POS Revenue (In-Store)', Number(summaryData.totalPOSSales ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), 'LKR'],
      ['Total POS Orders / Transactions', summaryData.numberPOSOrders ?? 0, 'Transactions'],
      ['Total Physical Items Sold (All Channels)', summaryData.totalItemsSold ?? 0, 'Units'],
      ['Total Discounts Issued to Customers', Number(summaryData.totalDiscounts ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), 'LKR'],
      ['Total Tax Collected', Number(summaryData.totalTax ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), 'LKR'],
      [],
      ['SECTION 3: REVENUE BREAKDOWN BY PAYMENT METHOD'],
      ['Payment Method', 'Total Revenue (LKR)', 'Transactions Count']
   ];

   if (summaryData.salesByPaymentMethod && Array.isArray(summaryData.salesByPaymentMethod) && summaryData.salesByPaymentMethod.length > 0) {
      summaryData.salesByPaymentMethod.forEach(pm => {
         summaryRows.push([
            pm.method || 'Standard Payment',
            Number(pm.totalSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
            pm.orderCount || 0
         ]);
      });
   } else {
      summaryRows.push(['No payment breakdown records available', '0.00', '0']);
   }

   summaryRows.push([]);
   summaryRows.push(['LUZZIO OMNICORE AUTOMATED AUDIT SYSTEM - CONFIDENTIAL EXECUTIVE REPORT']);

   const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
   wsSummary['!cols'] = [{ wch: 45 }, { wch: 24 }, { wch: 22 }];
   XLSX.utils.book_append_sheet(wb, wsSummary, 'Dashboard & Summary');

   // --- Sheet 2: Inventory Report ---
   const inventoryHeaders = [
      'SKU', 'Barcode', 'Product Name', 'Category', 'Unit Price (LKR)', 'Sale Price (LKR)', 'Current Stock (Units)', 'Stock Status', 'Inventory Value (LKR)'
   ];
   const inventoryRows = [
      ['LUZZIO CENTRALIZED INVENTORY & STOCK VALUATION AUDIT'],
      [`Generated On: ${new Date().toLocaleString()}`],
      [],
      inventoryHeaders
   ];

   let totalStockVal = 0;
   let totalStockUnitsCount = 0;

   inventoryData.forEach(item => {
      const val = item.inventoryValue || ((item.stock || 0) * (item.salePrice > 0 ? item.salePrice : (item.price || 0)));
      totalStockVal += Number(val || 0);
      totalStockUnitsCount += Number(item.stock || 0);

      inventoryRows.push([
         item.sku || 'N/A',
         item.barcode || 'N/A',
         item.name || 'Unnamed Product',
         item.category || 'Uncategorized',
         item.price || 0,
         item.salePrice || 0,
         item.stock || 0,
         item.stockStatus || (item.stock === 0 ? 'OUT OF STOCK' : item.stock <= 10 ? 'LOW STOCK' : 'IN STOCK'),
         val
      ]);
   });

   // Add Total Row
   inventoryRows.push([]);
   inventoryRows.push([
      'TOTALS:', '', `${inventoryData.length} Products`, '', '', '', totalStockUnitsCount, '', totalStockVal.toLocaleString('en-US', { minimumFractionDigits: 2 })
   ]);

   const wsInventory = XLSX.utils.aoa_to_sheet(inventoryRows);
   wsInventory['!cols'] = [
      { wch: 18 }, { wch: 18 }, { wch: 36 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 22 }
   ];
   XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventory Report');

   // --- Sheet 3: POS Sales ---
   const posHeaders = [
      'Date & Time', 'Order No.', 'Product Name', 'SKU', 'Size Variant', 'Qty Sold', 'Unit Price (LKR)', 'Discount (LKR)', 'Tax (LKR)', 'Total Amount (LKR)', 'Payment Method', 'Cashier / Terminal User', 'Customer Identification'
   ];
   const posRows = [
      ['LUZZIO POINT OF SALE (POS) SALES & CASHIER AUDIT REGISTER'],
      [`Generated On: ${new Date().toLocaleString()}`],
      [],
      posHeaders
   ];

   let posTotalRevenue = 0;
   let posTotalQty = 0;

   if (posSalesData && posSalesData.length > 0) {
      posSalesData.forEach(sale => {
         posTotalRevenue += Number(sale.total || 0);
         posTotalQty += Number(sale.qty || 1);

         posRows.push([
            sale.date || '',
            sale.orderNo || '',
            sale.product || '',
            sale.sku || 'N/A',
            sale.size || 'N/A',
            sale.qty || 1,
            sale.unitPrice || 0,
            sale.discount || 0,
            sale.tax || 0,
            sale.total || 0,
            sale.paymentMethod || 'CASH',
            sale.cashier || 'Staff Cashier',
            sale.customer || 'Walk-in Customer'
         ]);
      });

      // Add Total Row
      posRows.push([]);
      posRows.push([
         'TOTALS:', '', `${posSalesData.length} Transactions`, '', '', posTotalQty, '', '', '', posTotalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 }), '', '', ''
      ]);
   } else {
      posRows.push(['No POS transactions recorded in this period.', '', '', '', '', '', '', '', '', '', '', '', '']);
   }

   const wsPOS = XLSX.utils.aoa_to_sheet(posRows);
   wsPOS['!cols'] = [
      { wch: 20 }, { wch: 20 }, { wch: 32 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 26 }
   ];
   XLSX.utils.book_append_sheet(wb, wsPOS, 'POS Sales');

   XLSX.writeFile(wb, filename);
};


// ============================================================================
// 2. FINANCIAL PROFIT & LOSS (P&L) STATEMENT WORKBOOK
// ============================================================================
export const exportFinancePnlExcelReport = ({
   pnlData = {},
   expenses = [],
   filename = `Luzzio_Profit_Loss_Statement_${new Date().toISOString().slice(0, 10)}.xlsx`
}) => {
   const wb = XLSX.utils.book_new();

   // --- Sheet 1: Income Statement Summary ---
   const incomeRows = [
      ['LUZZIO EXECUTIVE PROFIT & LOSS (P&L) STATEMENT & CASH FLOW AUDIT'],
      ['Corporate Entity:', 'LUZZIO Luxury Apparel & Footwear'],
      ['Accounting Period:', 'All-Time Real-Time Ledger Summary'],
      ['Generated On:', new Date().toLocaleString()],
      [],
      ['INCOME STATEMENT SUMMARY'],
      ['Financial Line Item', 'Amount (LKR)', 'Margin / Percentage', 'Audit Classification'],
      ['1. Gross Sales Revenue (All Channels)', Number(pnlData.revenue?.grossRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), '100.0%', 'Primary Revenue Inflow'],
      ['2. Less: Cost of Goods Sold (COGS)', Number(pnlData.cogs?.totalCOGS || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), `${pnlData.cogs?.cogsPercent || 55}%`, 'Direct Cost of Inventory Sold'],
      ['= GROSS OPERATING PROFIT', Number(pnlData.cogs?.grossProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), `${pnlData.cogs?.grossMarginPercent || 45}%`, 'Gross Margin Yield'],
      [],
      ['3. Less: Operating Expenses (OPEX)', Number(pnlData.expenses?.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), `${pnlData.expenses?.expenseRatio || 0}%`, 'Operating Overhead'],
      ['= NET OPERATING PROFIT (EBITDA)', Number(pnlData.netIncome?.netProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), `${pnlData.netIncome?.netProfitMargin || 0}%`, 'Net Income Bottom Line'],
      [],
      ['LIQUIDITY & CASH FLOW ANALYSIS'],
      ['Cash Flow Line Item', 'Amount (LKR)', 'Metric Status', 'Notes'],
      ['Total Cash Inflow (Collected)', Number(pnlData.cashFlow?.inflow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), 'Cash & Digital Deposits', 'Settled payments'],
      ['Total Cash Outflow (Disbursed)', Number(pnlData.cashFlow?.outflow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), 'Operational Disbursements', 'Expenses & Vendor settlements'],
      ['= NET CASH FLOW BALANCE', Number(pnlData.cashFlow?.netCashFlow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), (pnlData.cashFlow?.netCashFlow || 0) >= 0 ? 'POSITIVE SURPLUS' : 'DEFICIT', 'Net operational treasury balance']
   ];

   const wsIncome = XLSX.utils.aoa_to_sheet(incomeRows);
   wsIncome['!cols'] = [{ wch: 45 }, { wch: 24 }, { wch: 22 }, { wch: 32 }];
   XLSX.utils.book_append_sheet(wb, wsIncome, 'P&L Statement');

   // --- Sheet 2: Operating Expenses Ledger ---
   const expenseHeaders = ['Date', 'Category', 'Description', 'Amount (LKR)', 'Payment Method', 'Reference Code', 'Notes'];
   const expenseRows = [
      ['LUZZIO OPERATING EXPENSE BREAKDOWN LEDGER'],
      [`Generated On: ${new Date().toLocaleString()}`],
      [],
      expenseHeaders
   ];

   let totalExp = 0;

   if (expenses && expenses.length > 0) {
      expenses.forEach(e => {
         const amt = Number(e.amount || 0);
         totalExp += amt;

         expenseRows.push([
            e.date ? new Date(e.date).toLocaleDateString() : 'N/A',
            e.category || 'General',
            e.description || 'Operating Expense',
            amt.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            e.paymentMethod || 'CASH',
            e.reference || 'N/A',
            e.notes || '—'
         ]);
      });

      // Total row
      expenseRows.push([]);
      expenseRows.push([
         'TOTAL OPERATING EXPENSES:', `${expenses.length} Records`, '', totalExp.toLocaleString('en-US', { minimumFractionDigits: 2 }), '', '', ''
      ]);
   } else {
      expenseRows.push(['No expense records found in this statement period.', '', '', '', '', '', '']);
   }

   const wsExpenses = XLSX.utils.aoa_to_sheet(expenseRows);
   wsExpenses['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 26 }];
   XLSX.utils.book_append_sheet(wb, wsExpenses, 'Operating Expenses');

   XLSX.writeFile(wb, filename);
};


// ============================================================================
// 3. SUPPLIER & PURCHASE ORDER PERFORMANCE WORKBOOK
// ============================================================================
export const exportSupplierPerformanceExcelReport = ({
   supplierData = [],
   posList = [],
   filename = `Luzzio_Supplier_Performance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
}) => {
   const wb = XLSX.utils.book_new();

   // --- Sheet 1: Supplier Summary ---
   const suppHeaders = [
      'Supplier / Vendor Name', 'Contact Person', 'Email Address', 'Phone', 'Address / Location', 'Total POs Issued', 'Completed POs', 'Total Procurement Spend (LKR)', 'Items Ordered', 'Items Received', 'Fulfillment Rate (%)'
   ];
   const suppRows = [
      ['LUZZIO VENDOR & SUPPLIER FULFILLMENT AUDIT'],
      [`Generated On: ${new Date().toLocaleString()}`],
      [],
      suppHeaders
   ];

   let totalSpendSum = 0;
   let totalPOsSum = 0;
   let totalCompletedPOsSum = 0;

   supplierData.forEach(s => {
      const spend = Number(s.totalSpend || 0);
      totalSpendSum += spend;
      totalPOsSum += (s.totalPOs || 0);
      totalCompletedPOsSum += (s.completedPOs || 0);

      suppRows.push([
         s.supplierName || 'Unknown Supplier',
         s.contactPerson || 'N/A',
         s.email || 'N/A',
         s.phone || 'N/A',
         s.address || 'N/A',
         s.totalPOs || 0,
         s.completedPOs || 0,
         spend.toLocaleString('en-US', { minimumFractionDigits: 2 }),
         s.itemsOrdered || 0,
         s.itemsReceived || 0,
         `${s.fulfillmentRate ?? 100}%`
      ]);
   });

   // Total Row
   suppRows.push([]);
   suppRows.push([
      'TOTALS:', `${supplierData.length} Vendors`, '', '', '', totalPOsSum, totalCompletedPOsSum, totalSpendSum.toLocaleString('en-US', { minimumFractionDigits: 2 }), '', '', ''
   ]);

   const wsSupp = XLSX.utils.aoa_to_sheet(suppRows);
   wsSupp['!cols'] = [
      { wch: 28 }, { wch: 20 }, { wch: 24 }, { wch: 16 }, { wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 20 }
   ];
   XLSX.utils.book_append_sheet(wb, wsSupp, 'Supplier Performance');

   // --- Sheet 2: Purchase Orders Log ---
   const poHeaders = [
      'PO Number', 'Supplier', 'Order Date', 'Expected Date', 'Status', 'Total Cost (LKR)', 'Items Count', 'Received Items', 'Audit Notes'
   ];
   const poRows = [
      ['LUZZIO PURCHASE ORDERS (PO) PROCUREMENT REGISTER'],
      [`Generated On: ${new Date().toLocaleString()}`],
      [],
      poHeaders
   ];

   let totalPOCostSum = 0;

   if (posList && posList.length > 0) {
      posList.forEach(po => {
         const totalOrdered = (po.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
         const totalRcvd = (po.items || []).reduce((acc, i) => acc + (i.receivedQuantity || 0), 0);
         const cost = Number(po.totalCost || 0);
         totalPOCostSum += cost;

         poRows.push([
            po.poNumber || `PO-${po._id.slice(-6).toUpperCase()}`,
            po.supplier?.supplierName || 'Vendor',
            po.orderDate ? new Date(po.orderDate).toLocaleDateString() : 'N/A',
            po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'N/A',
            po.status || 'DRAFT',
            cost.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            totalOrdered,
            totalRcvd,
            po.notes || '—'
         ]);
      });

      // Total Row
      poRows.push([]);
      poRows.push([
         'TOTALS:', `${posList.length} Orders`, '', '', '', totalPOCostSum.toLocaleString('en-US', { minimumFractionDigits: 2 }), '', '', ''
      ]);
   } else {
      poRows.push(['No purchase orders logged in this cycle.', '', '', '', '', '', '', '', '']);
   }

   const wsPO = XLSX.utils.aoa_to_sheet(poRows);
   wsPO['!cols'] = [
      { wch: 20 }, { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 30 }
   ];
   XLSX.utils.book_append_sheet(wb, wsPO, 'Purchase Orders Register');

   XLSX.writeFile(wb, filename);
};


// ============================================================================
// 4. RETURNS & REVERSE LOGISTICS ANALYTICS WORKBOOK
// ============================================================================
export const exportReturnsAnalyticsExcelReport = ({
   summary = {},
   byReason = {},
   byCondition = {},
   byProduct = {},
   returnsList = [],
   filename = `Luzzio_Returns_Logistics_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
}) => {
   const wb = XLSX.utils.book_new();

   // --- Sheet 1: Returns Summary & Reasons ---
   const summaryRows = [
      ['LUZZIO REVERSE LOGISTICS, RETURNS & QUALITY AUDIT REPORT'],
      ['Generated On:', new Date().toLocaleString()],
      [],
      ['RETURN KPI METRICS'],
      ['Metric Name', 'Metric Value', 'Classification'],
      ['Total Return Requests Submitted', summary.totalRequests || 0, 'Return Inbound'],
      ['Approved Return Requests', summary.approvedCount || 0, 'Validated Claims'],
      ['Rejected Return Requests', summary.rejectedCount || 0, 'Rejected Ineligible'],
      ['Total Refund Value Disbursed', Number(summary.totalRefundedValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' LKR', 'Financial Impact'],
      ['Overall Return Rate Percentage', `${summary.returnRatePercent || 0}%`, 'Quality Benchmark'],
      [],
      ['RETURN REASONS BREAKDOWN'],
      ['Reason Category', 'Incidents Count', 'Percentage of Total']
   ];

   const totalReqs = summary.totalRequests || 1;
   Object.entries(byReason).forEach(([reason, count]) => {
      summaryRows.push([
         reason,
         count,
         `${((count / totalReqs) * 100).toFixed(1)}%`
      ]);
   });

   summaryRows.push([]);
   summaryRows.push(['ITEM INTAKE CONDITION BREAKDOWN']);
   summaryRows.push(['Condition State', 'Incidents Count', 'Inventory Action']);
   Object.entries(byCondition).forEach(([cond, count]) => {
      summaryRows.push([
         cond,
         count,
         cond === 'RESELLABLE' ? 'Restocked to Inventory' : 'Damaged / Written Off'
      ]);
   });

   const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
   wsSummary['!cols'] = [{ wch: 42 }, { wch: 24 }, { wch: 26 }];
   XLSX.utils.book_append_sheet(wb, wsSummary, 'Returns KPI & Reasons');

   // --- Sheet 2: Return Claims Register ---
   const claimHeaders = ['Return #', 'Order #', 'Customer Email', 'Type', 'Status', 'Refund (LKR)', 'Reason', 'Date'];
   const claimRows = [
      ['LUZZIO RETURN CLAIMS DETAILED REGISTER'],
      [`Generated On: ${new Date().toLocaleString()}`],
      [],
      claimHeaders
   ];

   let totalRefundSum = 0;

   if (returnsList && returnsList.length > 0) {
      returnsList.forEach(r => {
         const refAmt = Number(r.refundAmount || 0);
         totalRefundSum += refAmt;

         claimRows.push([
            r.returnNumber || `RET-${r._id.slice(-6).toUpperCase()}`,
            r.originalOrder?.orderNumber || (r.originalOrder ? `ORD-${r.originalOrder._id.slice(-6).toUpperCase()}` : 'N/A'),
            r.customerEmail || r.customer?.email || 'N/A',
            r.requestType || 'RETURN',
            r.status || 'PENDING',
            refAmt.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            r.reason || 'General Return',
            r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'
         ]);
      });

      // Total Row
      claimRows.push([]);
      claimRows.push([
         'TOTALS:', `${returnsList.length} Claims`, '', '', '', totalRefundSum.toLocaleString('en-US', { minimumFractionDigits: 2 }), '', ''
      ]);
   }

   const wsClaims = XLSX.utils.aoa_to_sheet(claimRows);
   wsClaims['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 26 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 25 }, { wch: 16 }];
   XLSX.utils.book_append_sheet(wb, wsClaims, 'Return Claims Register');

   XLSX.writeFile(wb, filename);
};


// ============================================================================
// 5. COMMUNITY REVIEWS & FAQ ENGAGEMENT WORKBOOK
// ============================================================================
export const exportEngagementExcelReport = ({
   reportData = {},
   reviewsList = [],
   faqsList = [],
   filename = `Luzzio_Engagement_KnowledgeBase_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
}) => {
   const wb = XLSX.utils.book_new();

   // --- Sheet 1: Executive Engagement Summary ---
   const summaryRows = [
      ['LUZZIO COMMUNITY ENGAGEMENT, MODERATION & KNOWLEDGE BASE AUDIT'],
      ['Generated On:', new Date().toLocaleString()],
      [],
      ['COMMUNITY & MODERATION METRICS'],
      ['Metric Name', 'Metric Value', 'Notes'],
      ['Total Registered Customers', reportData.users?.customers || 0, 'Active Client Accounts'],
      ['Total Authorized Staff Users', reportData.users?.staffUsers || 0, 'Admin / Sales / Warehouse Staff'],
      ['Total Product Reviews Submitted', reportData.reviews?.totalReviews || 0, 'Customer Submissions'],
      ['Approved Reviews (Storefront Visible)', reportData.reviews?.approvedReviews || 0, 'Published Content'],
      ['Pending / Hidden Reviews', reportData.reviews?.rejectedReviews || 0, 'Moderated / Quarantined'],
      ['Review Approval Quality Rate', `${reportData.reviews?.approvalRate || 0}%`, 'Storefront Moderation Benchmark'],
      ['Global Average Storefront Rating', `${reportData.reviews?.avgGlobalRating || '5.0'} / 5.0 Stars`, 'Customer Satisfaction'],
      ['Total FAQ Knowledge Base Articles', reportData.faqs?.totalFAQs || 0, 'Support Articles'],
      ['Published Live FAQ Articles', reportData.faqs?.publishedFAQs || 0, 'Client-facing Help Articles']
   ];

   const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
   wsSummary['!cols'] = [{ wch: 42 }, { wch: 22 }, { wch: 32 }];
   XLSX.utils.book_append_sheet(wb, wsSummary, 'Community & Moderation KPIs');

   // --- Sheet 2: Reviews Log ---
   const reviewHeaders = ['Product Name', 'Author', 'Email', 'Rating (1-5)', 'Status', 'Review Comment', 'Date'];
   const reviewRows = [
      ['LUZZIO PRODUCT REVIEWS MODERATION LEDGER'],
      [`Generated On: ${new Date().toLocaleString()}`],
      [],
      reviewHeaders
   ];

   if (reviewsList && reviewsList.length > 0) {
      reviewsList.forEach(r => {
         reviewRows.push([
            r.productName || r.product?.name || 'Product',
            r.authorName || r.user?.name || r.name || 'Anonymous Client',
            r.userEmail || r.user?.email || r.email || 'N/A',
            r.rating ? `${r.rating} / 5` : '5 / 5',
            r.isApproved ? 'APPROVED' : 'PENDING/HIDDEN',
            r.comment || '',
            r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'
         ]);
      });

      // Total Row
      reviewRows.push([]);
      reviewRows.push([
         'TOTAL REVIEWS:', `${reviewsList.length} Entries`, '', `Avg Rating: ${reportData.reviews?.avgGlobalRating || '5.0'} / 5`, '', '', ''
      ]);
   }

   const wsReviews = XLSX.utils.aoa_to_sheet(reviewRows);
   wsReviews['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 40 }, { wch: 16 }];
   XLSX.utils.book_append_sheet(wb, wsReviews, 'Reviews Moderation Log');

   XLSX.writeFile(wb, filename);
};
