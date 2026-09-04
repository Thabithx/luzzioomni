const RevenueTransaction = require('../models/RevenueTransaction');
const Expense = require('../models/Expense');

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