const express = require('express');
const router = express.Router();

const {
  createRevenue,
  getRevenues,
  updateRevenue,
  deleteRevenue,
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getFinancialSummary
} = require('../controllers/financeController');

// Revenue routes
router.post('/revenues', createRevenue);
router.get('/revenues', getRevenues);
router.put('/revenues/:id', updateRevenue);
router.delete('/revenues/:id', deleteRevenue);

// Expense routes
router.post('/expenses', createExpense);
router.get('/expenses', getExpenses);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

// Financial summary
router.get('/summary', getFinancialSummary);

module.exports = router;