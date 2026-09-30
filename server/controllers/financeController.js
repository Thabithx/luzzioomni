const RevenueTransaction = require('../models/RevenueTransaction');
const Expense = require('../models/Expense');
const PaymentReconciliation = require('../models/PaymentReconciliation');
const AccountRecord = require('../models/AccountRecord');
const RefundPayout = require('../models/RefundPayout');

// ==============================
// REVENUE CRUD
// ==============================

// Create Revenue
exports.createRevenue = async (req, res) => {
  try {
    const revenue = await RevenueTransaction.create(req.body);

    res.status(201).json({
      success: true,
      data: revenue
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Revenue
exports.getRevenues = async (req, res) => {
  try {
    const revenues = await RevenueTransaction.find().sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: revenues.length,
      data: revenues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Revenue
exports.updateRevenue = async (req, res) => {
  try {
    const revenue = await RevenueTransaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!revenue) {
      return res.status(404).json({
        success: false,
        message: 'Revenue transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: revenue
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Revenue
exports.deleteRevenue = async (req, res) => {
  try {
    const revenue = await RevenueTransaction.findByIdAndDelete(req.params.id);

    if (!revenue) {
      return res.status(404).json({
        success: false,
        message: 'Revenue transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Revenue transaction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==============================
// EXPENSE CRUD
// ==============================

// Create Expense
exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create(req.body);

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Expenses
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Expense
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==============================
// FINANCIAL SUMMARY
// ==============================

exports.getFinancialSummary = async (req, res) => {
  try {
    const revenues = await RevenueTransaction.find();
    const expenses = await Expense.find();

    const totalRevenue = revenues.reduce(
      (total, item) => total + item.amount,
      0
    );

    const totalExpenses = expenses.reduce(
      (total, item) => total + item.amount,
      0
    );

    const netProfit = totalRevenue - totalExpenses;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        cashFlow: netProfit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==============================
// PAYMENT RECONCILIATION CRUD
// ==============================

// Create Payment Reconciliation
exports.createPaymentReconciliation = async (req, res) => {
  try {
    const reconciliation = await PaymentReconciliation.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Payment reconciliation created successfully',
      data: reconciliation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Payment Reconciliations
exports.getPaymentReconciliations = async (req, res) => {
  try {
    const reconciliations = await PaymentReconciliation.find()
      .populate('order')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reconciliations.length,
      data: reconciliations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Payment Reconciliation
exports.updatePaymentReconciliation = async (req, res) => {
  try {
    const reconciliation = await PaymentReconciliation.findById(
      req.params.id
    );

    if (!reconciliation) {
      return res.status(404).json({
        success: false,
        message: 'Payment reconciliation not found'
      });
    }

    Object.assign(reconciliation, req.body);

    // Using save() makes sure the pre-save reconciliation
    // logic runs again after an update.
    await reconciliation.save();

    res.status(200).json({
      success: true,
      message: 'Payment reconciliation updated successfully',
      data: reconciliation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Payment Reconciliation
exports.deletePaymentReconciliation = async (req, res) => {
  try {
    const reconciliation =
      await PaymentReconciliation.findByIdAndDelete(req.params.id);

    if (!reconciliation) {
      return res.status(404).json({
        success: false,
        message: 'Payment reconciliation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment reconciliation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==============================
// ACCOUNTS PAYABLE / RECEIVABLE CRUD
// ==============================

// Create Account Record
exports.createAccountRecord = async (req, res) => {
  try {
    const accountRecord = await AccountRecord.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Account record created successfully',
      data: accountRecord
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Account Records
exports.getAccountRecords = async (req, res) => {
  try {
    const records = await AccountRecord.find().sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Account Record
exports.updateAccountRecord = async (req, res) => {
  try {
    const accountRecord = await AccountRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!accountRecord) {
      return res.status(404).json({
        success: false,
        message: 'Account record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account record updated successfully',
      data: accountRecord
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Account Record
exports.deleteAccountRecord = async (req, res) => {
  try {
    const accountRecord = await AccountRecord.findByIdAndDelete(req.params.id);

    if (!accountRecord) {
      return res.status(404).json({
        success: false,
        message: 'Account record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==============================
// REFUND / PAYOUT CRUD
// ==============================

// Create Refund or Payout
exports.createRefundPayout = async (req, res) => {
  try {
    const refundPayout = await RefundPayout.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Refund/Payout record created successfully',
      data: refundPayout
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Refunds and Payouts
exports.getRefundPayouts = async (req, res) => {
  try {
    const refundPayouts = await RefundPayout.find()
      .populate('order')
      .populate('returnRequest')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: refundPayouts.length,
      data: refundPayouts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Refund or Payout
exports.updateRefundPayout = async (req, res) => {
  try {
    const refundPayout = await RefundPayout.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!refundPayout) {
      return res.status(404).json({
        success: false,
        message: 'Refund/Payout record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: refundPayout
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Refund or Payout
exports.deleteRefundPayout = async (req, res) => {
  try {
    const refundPayout = await RefundPayout.findByIdAndDelete(req.params.id);

    if (!refundPayout) {
      return res.status(404).json({
        success: false,
        message: 'Refund/Payout record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Refund/Payout record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};