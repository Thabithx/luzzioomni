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
  getFinancialSummary,

//payment reconsiliation
createPaymentReconciliation,
getPaymentReconciliations,
updatePaymentReconciliation,
deletePaymentReconciliation,

// Accounts Payable / Receivable
createAccountRecord,
getAccountRecords,
updateAccountRecord,
deleteAccountRecord,

// Refund / Payout
createRefundPayout,
getRefundPayouts,
updateRefundPayout,
deleteRefundPayout

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

// Payment Reconciliation routes
router.post('/reconciliations', createPaymentReconciliation);
router.get('/reconciliations', getPaymentReconciliations);
router.put('/reconciliations/:id', updatePaymentReconciliation);
router.delete('/reconciliations/:id', deletePaymentReconciliation);

// Accounts Payable / Receivable routes
router.post('/accounts', createAccountRecord);
router.get('/accounts', getAccountRecords);
router.put('/accounts/:id', updateAccountRecord);
router.delete('/accounts/:id', deleteAccountRecord);

module.exports = router;