import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api/finance';

function AdminFinance() {
  const [revenues, setRevenues] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashFlow: 0
  });

  const [revenueForm, setRevenueForm] = useState({
    amount: '',
    source: '',
    channel: 'online',
    description: '',
    date: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: 'rent',
    description: '',
    payee: '',
    date: ''
  });

  const [editingRevenueId, setEditingRevenueId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const loadFinanceData = async () => {
    try {
      const [revenueRes, expenseRes, summaryRes] = await Promise.all([
        axios.get(`${API_BASE}/revenues`),
        axios.get(`${API_BASE}/expenses`),
        axios.get(`${API_BASE}/summary`)
      ]);

      setRevenues(revenueRes.data.data || []);
      setExpenses(expenseRes.data.data || []);
      setSummary(summaryRes.data.data || {});
    } catch (error) {
      console.error('Failed to load finance data:', error);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const handleRevenueChange = (e) => {
    setRevenueForm({
      ...revenueForm,
      [e.target.name]: e.target.value
    });
  };

  const handleExpenseChange = (e) => {
    setExpenseForm({
      ...expenseForm,
      [e.target.name]: e.target.value
    });
  };

  const submitRevenue = async (e) => {
    e.preventDefault();

    try {
      if (editingRevenueId) {
        await axios.put(
          `${API_BASE}/revenues/${editingRevenueId}`,
          revenueForm
        );
      } else {
        await axios.post(`${API_BASE}/revenues`, revenueForm);
      }

      setRevenueForm({
        amount: '',
        source: '',
        channel: 'online',
        description: '',
        date: ''
      });

      setEditingRevenueId(null);
      loadFinanceData();
    } catch (error) {
      console.error('Revenue save failed:', error);
    }
  };

  const submitExpense = async (e) => {
    e.preventDefault();

    try {
      if (editingExpenseId) {
        await axios.put(
          `${API_BASE}/expenses/${editingExpenseId}`,
          expenseForm
        );
      } else {
        await axios.post(`${API_BASE}/expenses`, expenseForm);
      }

      setExpenseForm({
        amount: '',
        category: 'rent',
        description: '',
        payee: '',
        date: ''
      });

      setEditingExpenseId(null);
      loadFinanceData();
    } catch (error) {
      console.error('Expense save failed:', error);
    }
  };

  const editRevenue = (item) => {
    setEditingRevenueId(item._id);

    setRevenueForm({
      amount: item.amount,
      source: item.source,
      channel: item.channel,
      description: item.description || '',
      date: item.date ? item.date.substring(0, 10) : ''
    });
  };

  const editExpense = (item) => {
    setEditingExpenseId(item._id);

    setExpenseForm({
      amount: item.amount,
      category: item.category,
      description: item.description || '',
      payee: item.payee || '',
      date: item.date ? item.date.substring(0, 10) : ''
    });
  };

  const deleteRevenue = async (id) => {
    if (!window.confirm('Delete this revenue transaction?')) return;

    try {
      await axios.delete(`${API_BASE}/revenues/${id}`);
      loadFinanceData();
    } catch (error) {
      console.error('Revenue delete failed:', error);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;

    try {
      await axios.delete(`${API_BASE}/expenses/${id}`);
      loadFinanceData();
    } catch (error) {
      console.error('Expense delete failed:', error);
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Financial Management</h1>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div>
          <h3>Total Revenue</h3>
          <p>LKR {summary.totalRevenue || 0}</p>
        </div>

        <div>
          <h3>Total Expenses</h3>
          <p>LKR {summary.totalExpenses || 0}</p>
        </div>

        <div>
          <h3>Net Profit</h3>
          <p>LKR {summary.netProfit || 0}</p>
        </div>

        <div>
          <h3>Cash Flow</h3>
          <p>LKR {summary.cashFlow || 0}</p>
        </div>
      </div>

      <hr />

      <h2>Revenue Management</h2>

      <form onSubmit={submitRevenue}>
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={revenueForm.amount}
          onChange={handleRevenueChange}
          required
        />

        <input
          type="text"
          name="source"
          placeholder="Revenue source"
          value={revenueForm.source}
          onChange={handleRevenueChange}
          required
        />

        <select
          name="channel"
          value={revenueForm.channel}
          onChange={handleRevenueChange}
        >
          <option value="online">Online</option>
          <option value="in-store">In-store</option>
        </select>

        <input
          type="text"
          name="description"
          placeholder="Description"
          value={revenueForm.description}
          onChange={handleRevenueChange}
        />

        <input
          type="date"
          name="date"
          value={revenueForm.date}
          onChange={handleRevenueChange}
        />

        <button type="submit">
          {editingRevenueId ? 'Update Revenue' : 'Add Revenue'}
        </button>
      </form>

      <table border="1" cellPadding="8" style={{ marginTop: '15px' }}>
        <thead>
          <tr>
            <th>Amount</th>
            <th>Source</th>
            <th>Channel</th>
            <th>Description</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {revenues.map((item) => (
            <tr key={item._id}>
              <td>LKR {item.amount}</td>
              <td>{item.source}</td>
              <td>{item.channel}</td>
              <td>{item.description}</td>
              <td>{new Date(item.date).toLocaleDateString()}</td>
              <td>
                <button onClick={() => editRevenue(item)}>Edit</button>
                <button onClick={() => deleteRevenue(item._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr style={{ marginTop: '30px' }} />

      <h2>Expense Management</h2>

      <form onSubmit={submitExpense}>
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={expenseForm.amount}
          onChange={handleExpenseChange}
          required
        />

        <select
          name="category"
          value={expenseForm.category}
          onChange={handleExpenseChange}
        >
          <option value="rent">Rent</option>
          <option value="salary">Salary</option>
          <option value="utilities">Utilities</option>
          <option value="supplier-payment">Supplier Payment</option>
          <option value="marketing">Marketing</option>
          <option value="maintenance">Maintenance</option>
          <option value="other">Other</option>
        </select>

        <input
          type="text"
          name="payee"
          placeholder="Payee"
          value={expenseForm.payee}
          onChange={handleExpenseChange}
        />

        <input
          type="text"
          name="description"
          placeholder="Description"
          value={expenseForm.description}
          onChange={handleExpenseChange}
        />

        <input
          type="date"
          name="date"
          value={expenseForm.date}
          onChange={handleExpenseChange}
        />

        <button type="submit">
          {editingExpenseId ? 'Update Expense' : 'Add Expense'}
        </button>
      </form>

      <table border="1" cellPadding="8" style={{ marginTop: '15px' }}>
        <thead>
          <tr>
            <th>Amount</th>
            <th>Category</th>
            <th>Payee</th>
            <th>Description</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {expenses.map((item) => (
            <tr key={item._id}>
              <td>LKR {item.amount}</td>
              <td>{item.category}</td>
              <td>{item.payee}</td>
              <td>{item.description}</td>
              <td>{new Date(item.date).toLocaleDateString()}</td>
              <td>
                <button onClick={() => editExpense(item)}>Edit</button>
                <button onClick={() => deleteExpense(item._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminFinance;