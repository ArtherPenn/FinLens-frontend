import { useState, useEffect, useCallback } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Button, IconButton, Avatar,
  Card, CardContent, Grid, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress,
  Alert, Snackbar, Tooltip, Skeleton
} from '@mui/material';
import {
  AccountBalanceWallet, Add, Delete, Logout, TrendingUp,
  Receipt, Category, CalendarMonth, Refresh
} from '@mui/icons-material';
import { getExpenses, addExpense, deleteExpense } from '../api';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Bills', 'Other'];

const CATEGORY_COLORS = {
  Food: 'success', Transport: 'info', Shopping: 'secondary',
  Health: 'error', Entertainment: 'warning', Bills: 'default', Other: 'default'
};

function SummaryCard({ icon, label, value, color = 'primary.main', loading }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: `${color}15`, borderRadius: 2, p: 1, display: 'flex' }}>
            <Box sx={{ color }}>{icon}</Box>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
            {loading ? <Skeleton width={80} height={32} /> :
              <Typography variant="h5" fontWeight={800}>{value}</Typography>}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard({ tokens, email, onLogout }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [filterMonth, setFilterMonth] = useState('');
  const [form, setForm] = useState({ date: '', amount: '', category: 'Food', source: 'manual', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExpenses(tokens.IdToken, filterMonth || null);
      setExpenses(data.expenses || []);
    } catch (err) {
      showSnack(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [tokens.IdToken, filterMonth]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  function showSnack(msg, severity = 'success') {
    setSnack({ open: true, msg, severity });
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await addExpense(tokens.IdToken, { ...form, amount: parseFloat(form.amount) });
      setAddOpen(false);
      setForm({ date: '', amount: '', category: 'Food', source: 'manual', description: '' });
      showSnack('Expense added!');
      loadExpenses();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(expenseId) {
    setDeleting(expenseId);
    try {
      await deleteExpense(tokens.IdToken, expenseId);
      setExpenses(prev => prev.filter(e => e.expenseId !== expenseId));
      showSnack('Expense deleted');
    } catch (err) {
      showSnack(err.message, 'error');
    } finally {
      setDeleting(null);
    }
  }

  // Summary calculations
  const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const topCategory = expenses.length
    ? Object.entries(expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {}))
        .sort((a, b) => b[1] - a[1])[0]?.[0]
    : '—';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0f4f8' }}>
      {/* AppBar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet color="primary" />
            <Typography variant="h6" fontWeight={800} color="text.primary" letterSpacing="-0.5px">
              FinLens
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
              {email?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {email}
            </Typography>
            <Tooltip title="Sign out">
              <IconButton onClick={onLogout} size="small">
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} letterSpacing="-0.5px">Dashboard</Typography>
            <Typography variant="body2" color="text.secondary">Track and manage your expenses</Typography>
          </Box>
          <Button
            variant="contained" startIcon={<Add />} size="large"
            onClick={() => setAddOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
          >
            Add Expense
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={4}>
            <SummaryCard icon={<Receipt />} label="Total Expenses" value={`₹${total.toLocaleString('en-IN')}`} color="primary.main" loading={loading} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <SummaryCard icon={<Category />} label="Transactions" value={expenses.length} color="success.main" loading={loading} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <SummaryCard icon={<TrendingUp />} label="Top Category" value={topCategory} color="warning.main" loading={loading} />
          </Grid>
        </Grid>

        {/* Filter + Refresh */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <TextField
            label="Filter by month"
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            size="small"
            sx={{ bgcolor: 'white', borderRadius: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          {filterMonth && (
            <Button variant="outlined" size="small" onClick={() => setFilterMonth('')} sx={{ borderRadius: 2 }}>
              Clear
            </Button>
          )}
          <Tooltip title="Refresh">
            <IconButton onClick={loadExpenses} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Expenses Table */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Receipt sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">No expenses found. Add your first one!</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map(exp => (
                    <TableRow key={exp.expenseId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarMonth fontSize="small" color="disabled" />
                          {exp.date}
                        </Box>
                      </TableCell>
                      <TableCell>{exp.description || '—'}</TableCell>
                      <TableCell>
                        <Chip label={exp.category} size="small" color={CATEGORY_COLORS[exp.category] || 'default'} />
                      </TableCell>
                      <TableCell>{exp.source}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} color="primary.main">
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Delete">
                          <IconButton
                            size="small" color="error"
                            onClick={() => handleDelete(exp.expenseId)}
                            disabled={deleting === exp.expenseId}
                          >
                            {deleting === exp.expenseId
                              ? <CircularProgress size={16} />
                              : <Delete fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      {/* Add Expense Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Expense</DialogTitle>
        <Box component="form" onSubmit={handleAdd}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {formError && <Alert severity="error" sx={{ borderRadius: 2 }}>{formError}</Alert>}
            <TextField label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Amount (₹)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required fullWidth inputProps={{ min: 1, step: 0.01 }} />
            <TextField label="Category" select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required fullWidth>
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField label="Source" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} required fullWidth placeholder="manual, bank, upi..." />
            <TextField label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth placeholder="Optional note" />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={() => setAddOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formLoading} sx={{ borderRadius: 2, fontWeight: 700 }}>
              {formLoading ? <CircularProgress size={20} color="inherit" /> : 'Add Expense'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
