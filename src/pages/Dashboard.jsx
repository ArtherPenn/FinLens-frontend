import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Button, IconButton, Avatar,
  Card, CardContent, Grid, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  Alert, Snackbar, Tooltip, Skeleton, Select, FormControl, InputLabel,
  LinearProgress, Tab, Tabs, Badge, Divider, Paper, Stack
} from '@mui/material';
import {
  Add, Delete, Logout, TrendingUp, Receipt, Category,
  Refresh, BarChart, Dashboard as DashboardIcon,
  AttachMoney, BugReport, AutoAwesome, AccountBalanceWallet,
  UploadFile, SmartToy, Warning, CreditCard, PhoneAndroid,
  AccountBalance, Wallet, Money, KeyboardArrowUp, KeyboardArrowDown,
  Circle
} from '@mui/icons-material';
import { getExpenses, addExpense, deleteExpense } from '../api';
import Chatbot from './Chatbot';

// ─── Color palette ────────────────────────────────────────────────────────────
const PALETTE = {
  bg: '#0e0f1a',
  surface: '#161728',
  surfaceAlt: '#1c1e30',
  border: '#252740',
  accent: '#7c6ff7',
  accentSoft: 'rgba(124,111,247,0.15)',
  accentGlow: 'rgba(124,111,247,0.3)',
  green: '#4ade80',
  red: '#f87171',
  yellow: '#fbbf24',
  cyan: '#22d3ee',
  pink: '#f472b6',
  orange: '#fb923c',
  textPrimary: '#e8e9f5',
  textSecondary: '#8b8fa8',
  textMuted: '#555873',
};

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Utilities', 'Other'];
const SOURCES = ['Cash', 'Credit Card', 'Debit Card', 'UPI / Paytm', 'Net Banking'];

const CAT_COLORS = {
  Food: PALETTE.green,
  Transport: PALETTE.cyan,
  Shopping: PALETTE.pink,
  Health: PALETTE.red,
  Entertainment: PALETTE.yellow,
  Utilities: PALETTE.orange,
  Other: PALETTE.accent,
};

const SOURCE_ICONS = {
  'Credit Card': <CreditCard sx={{ fontSize: 16 }} />,
  'UPI / Paytm': <PhoneAndroid sx={{ fontSize: 16 }} />,
  'Net Banking': <AccountBalance sx={{ fontSize: 16 }} />,
  'Debit Card': <Wallet sx={{ fontSize: 16 }} />,
  Cash: <Money sx={{ fontSize: 16 }} />,
};

// ─── Mini sparkline SVG ───────────────────────────────────────────────────────
function Sparkline({ data = [], color = PALETTE.accent, width = 80, height = 30 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Bar chart (simple SVG) ───────────────────────────────────────────────────
function BarChartSVG({ data, labels, color = PALETTE.accent, color2 = PALETTE.red, width = '100%', height = 180 }) {
  const maxVal = Math.max(...data.flat(), 1);
  const barW = 14;
  const gap = 8;
  const groupW = data[0]?.length === 2 ? barW * 2 + gap : barW;
  const totalGroups = labels.length;
  const svgW = totalGroups * (groupW + 24);

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <svg width={svgW} height={height} style={{ display: 'block' }}>
        {labels.map((label, gi) => {
          const groupX = gi * (groupW + 24) + 12;
          return (
            <g key={gi}>
              {data.map((series, si) => {
                const val = series[gi] || 0;
                const bh = (val / maxVal) * (height - 40);
                const x = groupX + si * (barW + gap / 2);
                const y = height - bh - 24;
                const c = si === 0 ? color : color2;
                return (
                  <g key={si}>
                    <rect x={x} y={y} width={barW} height={bh} rx={3} fill={c} opacity={0.85} />
                  </g>
                );
              })}
              <text x={groupX + groupW / 2} y={height - 6} textAnchor="middle"
                fill={PALETTE.textMuted} fontSize={10} fontFamily="monospace">
                {label}
              </text>
            </g>
          );
        })}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = (height - 24) * (1 - pct) + 2;
          const val = Math.round(maxVal * pct);
          return (
            <g key={pct}>
              <line x1={0} y1={y} x2={svgW} y2={y} stroke={PALETTE.border} strokeWidth={1} />
              <text x={2} y={y - 3} fill={PALETTE.textMuted} fontSize={9} fontFamily="monospace">
                ₹{val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
}

// ─── Donut chart ─────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 140 }) {
  const r = size / 2 - 16;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size}>
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const gap = circ - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth={18}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity={0.9}
          />
        );
        offset += dash;
        return el;
      })}
      <circle cx={cx} cy={cy} r={r - 10} fill={PALETTE.surface} />
    </svg>
  );
}

// ─── Line chart ──────────────────────────────────────────────────────────────
function LineChartSVG({ series, labels, height = 200 }) {
  const allVals = series.flatMap(s => s.data);
  const max = Math.max(...allVals, 1);
  const W = 480, H = height - 30;

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <svg width={W} height={height} style={{ display: 'block', width: '100%' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = H * (1 - pct) + 4;
          return (
            <g key={pct}>
              <line x1={36} y1={y} x2={W} y2={y} stroke={PALETTE.border} strokeWidth={1} />
              <text x={0} y={y + 4} fill={PALETTE.textMuted} fontSize={9} fontFamily="monospace">
                ₹{Math.round(max * pct) >= 1000 ? `${(Math.round(max * pct) / 1000).toFixed(0)}k` : Math.round(max * pct)}
              </text>
            </g>
          );
        })}
        {labels.map((label, i) => {
          const x = 36 + (i / (labels.length - 1 || 1)) * (W - 40);
          return (
            <text key={i} x={x} y={height - 2} textAnchor="middle" fill={PALETTE.textMuted} fontSize={9} fontFamily="monospace">
              {label}
            </text>
          );
        })}
        {series.map((s, si) => {
          const pts = s.data.map((v, i) => {
            const x = 36 + (i / (s.data.length - 1 || 1)) * (W - 40);
            const y = 4 + H * (1 - v / max);
            return `${x},${y}`;
          }).join(' ');
          return (
            <g key={si}>
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.5}
                strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
              {s.data.map((v, i) => {
                if (v === 0) return null;
                const x = 36 + (i / (s.data.length - 1 || 1)) * (W - 40);
                const y = 4 + H * (1 - v / max);
                return <circle key={i} cx={x} cy={y} r={3} fill={s.color} />;
              })}
            </g>
          );
        })}
      </svg>
    </Box>
  );
}

// ─── Shared card shell ────────────────────────────────────────────────────────
function DarkCard({ children, sx = {}, ...props }) {
  return (
    <Card elevation={0} sx={{
      bgcolor: PALETTE.surface,
      border: `1px solid ${PALETTE.border}`,
      borderRadius: 2,
      ...sx
    }} {...props}>
      {children}
    </Card>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = PALETTE.accent, loading, trend }) {
  return (
    <DarkCard>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography variant="caption" sx={{ color: PALETTE.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontSize: 10, fontFamily: 'monospace' }}>
          {label}
        </Typography>
        {loading
          ? <Skeleton sx={{ bgcolor: PALETTE.surfaceAlt, mt: 1, mb: 0.5 }} width={100} height={36} />
          : <Typography variant="h4" sx={{ color, fontWeight: 800, fontFamily: 'monospace', mt: 0.5, mb: 0.25 }}>
              {value}
            </Typography>
        }
        <Typography variant="caption" sx={{ color: PALETTE.textMuted, fontSize: 11 }}>{sub}</Typography>
      </CardContent>
    </DarkCard>
  );
}

// ─── Nav pill ─────────────────────────────────────────────────────────────────
function NavTab({ icon, label, active, onClick }) {
  return (
    <Box onClick={onClick} sx={{
      display: 'flex', alignItems: 'center', gap: 0.8,
      px: 1.8, py: 0.8, borderRadius: 1.5, cursor: 'pointer',
      bgcolor: active ? PALETTE.accentSoft : 'transparent',
      borderBottom: active ? `2px solid ${PALETTE.accent}` : '2px solid transparent',
      color: active ? PALETTE.accent : PALETTE.textSecondary,
      '&:hover': { bgcolor: PALETTE.accentSoft, color: PALETTE.accent },
      transition: 'all 0.15s',
      userSelect: 'none',
    }}>
      {icon && <Box sx={{ fontSize: 16, display: 'flex', alignItems: 'center' }}>{icon}</Box>}
      <Typography variant="body2" sx={{ fontWeight: active ? 700 : 400, fontSize: 13, whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── Dashboard tab ────────────────────────────────────────────────────────────
function DashboardTab({ expenses, loading, onAdd }) {
  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const dailyAvg = expenses.length ? total / 30 : 0;
  const topCatEntry = useMemo(() => {
    const acc = {};
    expenses.forEach(e => { acc[e.category] = (acc[e.category] || 0) + e.amount; });
    const sorted = Object.entries(acc).sort((a, b) => b[1] - a[1]);
    return sorted[0];
  }, [expenses]);

  const anomalies = useMemo(() => {
    const bycat = {};
    expenses.forEach(e => {
      if (!bycat[e.category]) bycat[e.category] = [];
      bycat[e.category].push(e.amount);
    });
    const found = [];
    expenses.forEach(e => {
      const arr = bycat[e.category] || [];
      if (arr.length < 2) return;
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const std = Math.sqrt(arr.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / arr.length);
      const z = std > 0 ? Math.abs(e.amount - mean) / std : 0;
      if (z > 1.8) found.push({ ...e, z: z.toFixed(1), mean: Math.round(mean) });
    });
    return found.slice(0, 3);
  }, [expenses]);

  // Monthly spend data (last 6 months simulated from current)
  const monthlyData = useMemo(() => {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const byMonth = {};
    expenses.forEach(e => {
      if (!e.date) return;
      const m = e.date.substring(0, 7);
      byMonth[m] = (byMonth[m] || 0) + e.amount;
    });
    const vals = months.map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return byMonth[key] || 0;
    });
    return { months, vals };
  }, [expenses]);

  const catData = useMemo(() => {
    const acc = {};
    expenses.forEach(e => { acc[e.category] = (acc[e.category] || 0) + e.amount; });
    return Object.entries(acc).map(([k, v]) => ({ label: k, value: v, color: CAT_COLORS[k] || PALETTE.accent }));
  }, [expenses]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ color: PALETTE.textPrimary, fontWeight: 700, letterSpacing: '-0.3px' }}>
            Overview
          </Typography>
          <Typography variant="caption" sx={{ color: PALETTE.textSecondary }}>
            March 2025 · Personal Finance Dashboard
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={onAdd}
          sx={{ bgcolor: PALETTE.accent, borderRadius: 1.5, fontWeight: 700, '&:hover': { bgcolor: '#6c5ee0' } }}>
          + Add Expense
        </Button>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard label="This Month" value={`₹${total.toLocaleString('en-IN')}`} sub="↓ 0% vs last month" color={PALETTE.accent} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Daily Average" value={`₹${Math.round(dailyAvg).toLocaleString('en-IN')}`} sub={`${expenses.length} transactions`} color={PALETTE.cyan} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Top Category" value={topCatEntry?.[0] || '—'} sub={topCatEntry ? `₹${topCatEntry[1].toLocaleString('en-IN')}` : '—'} color={PALETTE.green} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Anomalies" value={anomalies.length || '1'} sub="unusual transactions" color={PALETTE.red} loading={loading} />
        </Grid>
      </Grid>

      {/* Charts row */}
      <Grid container spacing={2} mb={2}>
        {/* Monthly spending */}
        <Grid item xs={12} md={7}>
          <DarkCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: PALETTE.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontSize: 10, fontFamily: 'monospace' }}>
                Monthly Spending
              </Typography>
              <Box sx={{ mt: 2 }}>
                {loading
                  ? <Skeleton sx={{ bgcolor: PALETTE.surfaceAlt }} height={200} />
                  : <LineChartSVG
                      series={[{ data: monthlyData.vals, color: PALETTE.accent }]}
                      labels={monthlyData.months}
                      height={200}
                    />
                }
              </Box>
            </CardContent>
          </DarkCard>
        </Grid>
        {/* By category donut */}
        <Grid item xs={12} md={5}>
          <DarkCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: PALETTE.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontSize: 10, fontFamily: 'monospace' }}>
                By Category
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                {loading ? <Skeleton sx={{ bgcolor: PALETTE.surfaceAlt }} width={140} height={140} variant="circular" /> :
                  catData.length > 0
                    ? <DonutChart segments={catData} size={140} />
                    : <Box sx={{ width: 140, height: 140, borderRadius: '50%', bgcolor: PALETTE.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: PALETTE.textMuted, fontSize: 11 }}>No data</Typography>
                      </Box>
                }
                <Box sx={{ flex: 1 }}>
                  {CATEGORIES.map(c => (
                    <Box key={c} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Circle sx={{ fontSize: 8, color: CAT_COLORS[c] }} />
                      <Typography sx={{ color: PALETTE.textSecondary, fontSize: 12, flex: 1 }}>{c}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </DarkCard>
        </Grid>
      </Grid>

      {/* Bottom row */}
      <Grid container spacing={2}>
        {/* Recent transactions */}
        <Grid item xs={12} md={7}>
          <DarkCard>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: PALETTE.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontSize: 10, fontFamily: 'monospace', display: 'block', mb: 2 }}>
                Recent Transactions
              </Typography>
              {loading ? [...Array(4)].map((_, i) => <Skeleton key={i} sx={{ bgcolor: PALETTE.surfaceAlt, mb: 1 }} height={36} />) :
                expenses.slice(0, 6).map(e => (
                  <Box key={e.expenseId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${PALETTE.border}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: CAT_COLORS[e.category] || PALETTE.accent, flexShrink: 0 }} />
                      <Box>
                        <Typography sx={{ color: PALETTE.textPrimary, fontSize: 13, fontWeight: 500 }}>{e.description || e.category}</Typography>
                        <Typography sx={{ color: PALETTE.textMuted, fontSize: 11 }}>{e.date}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip label={e.category} size="small" sx={{ bgcolor: `${CAT_COLORS[e.category]}22`, color: CAT_COLORS[e.category], border: `1px solid ${CAT_COLORS[e.category]}44`, height: 20, fontSize: 10, fontWeight: 700 }} />
                      <Typography sx={{ color: PALETTE.textPrimary, fontSize: 13, fontWeight: 700, mt: 0.3 }}>₹{Number(e.amount).toLocaleString('en-IN')}</Typography>
                    </Box>
                  </Box>
                ))
              }
            </CardContent>
          </DarkCard>
        </Grid>
        {/* Anomaly alerts */}
        <Grid item xs={12} md={5}>
          <DarkCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: PALETTE.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontSize: 10, fontFamily: 'monospace', display: 'block', mb: 2 }}>
                Anomaly Alerts
              </Typography>
              {anomalies.length === 0 && !loading && (
                <Typography sx={{ color: PALETTE.textMuted, fontSize: 12 }}>No anomalies detected</Typography>
              )}
              {anomalies.map((a, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2, p: 1.5, bgcolor: `${PALETTE.red}11`, border: `1px solid ${PALETTE.red}33`, borderRadius: 2 }}>
                  <Warning sx={{ color: PALETTE.red, fontSize: 20, mt: 0.2, flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: PALETTE.textPrimary, fontSize: 13, fontWeight: 600 }}>{a.description || a.category} · {a.date}</Typography>
                    <Typography sx={{ color: PALETTE.textMuted, fontSize: 11 }}>
                      {a.category} · ₹{Number(a.amount).toLocaleString('en-IN')} vs avg ₹{a.mean.toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: PALETTE.red, fontSize: 12, fontWeight: 700, fontFamily: 'monospace', flexShrink: 0 }}>z={a.z}</Typography>
                </Box>
              ))}
            </CardContent>
          </DarkCard>
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Expenses tab ─────────────────────────────────────────────────────────────
function ExpensesTab({ expenses, loading, onAdd, onDelete, deleting }) {
  const [filterCat, setFilterCat] = useState('All Categories');

  const filtered = filterCat === 'All Categories' ? expenses : expenses.filter(e => e.category === filterCat);

  function handleExportCSV() {
    const rows = [['date', 'amount', 'category', 'source', 'description'], ...filtered.map(e => [e.date, e.amount, e.category, e.source, e.description || ''])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'expenses.csv'; a.click();
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: PALETTE.textPrimary, fontWeight: 700, letterSpacing: '-0.3px' }}>Expense Manager</Typography>
        <Typography variant="caption" sx={{ color: PALETTE.textSecondary }}>Add manually or import from file</Typography>
      </Box>
      <Grid container spacing={2} mb={3}>
        {/* Add form */}
        <Grid item xs={12} md={6}>
          <DarkCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: PALETTE.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontSize: 10, fontFamily: 'monospace', display: 'block', mb: 2 }}>
                Add Expense Manually
              </Typography>
              <AddExpenseInline onAdd={onAdd} />
            </CardContent>
          </DarkCard>
        </Grid>
        {/* CSV import mock */}
        <Grid item xs={12} md={6}>
          <DarkCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: PALETTE.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontSize: 10, fontFamily: 'monospace', display: 'block', mb: 2 }}>
                Import from File
              </Typography>
              <Box sx={{ border: `2px dashed ${PALETTE.border}`, borderRadius: 2, p: 4, textAlign: 'center', mb: 2, cursor: 'pointer', '&:hover': { borderColor: PALETTE.accent } }}>
                <UploadFile sx={{ color: PALETTE.yellow, fontSize: 40, mb: 1 }} />
                <Typography sx={{ color: PALETTE.textSecondary, fontSize: 13 }}>Drop CSV or Excel file here</Typography>
                <Typography sx={{ color: PALETTE.textMuted, fontSize: 11 }}>Supports .csv, .xlsx from Paytm, PayPal exports</Typography>
              </Box>
              <Box sx={{ bgcolor: PALETTE.surfaceAlt, p: 1.5, borderRadius: 1.5 }}>
                <Typography variant="caption" sx={{ color: PALETTE.textMuted, fontFamily: 'monospace', fontSize: 10, display: 'block', mb: 0.5, letterSpacing: 1, textTransform: 'uppercase' }}>Expected CSV format</Typography>
                <Typography sx={{ color: PALETTE.accent, fontSize: 11, fontFamily: 'monospace' }}>
                  date,amount,category,source,description
                </Typography>
                <Typography sx={{ color: PALETTE.textMuted, fontSize: 11, fontFamily: 'monospace' }}>
                  2025-03-01,450,Food,UPI / Paytm,Lunch at cafe
                </Typography>
              </Box>
            </CardContent>
          </DarkCard>
        </Grid>
      </Grid>

      {/* Table */}
      <DarkCard>
        <CardContent sx={{ p: 2.5, pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" sx={{ color: PALETTE.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontSize: 10, fontFamily: 'monospace' }}>
              All Transactions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Select size="small" value={filterCat} onChange={e => setFilterCat(e.target.value)}
                sx={{ fontSize: 12, color: PALETTE.textSecondary, bgcolor: PALETTE.surfaceAlt, border: `1px solid ${PALETTE.border}`, borderRadius: 1.5, height: 32,
                  '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '.MuiSelect-icon': { color: PALETTE.textMuted },
                }}>
                <MenuItem value="All Categories">All Categories</MenuItem>
                {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
              <Button size="small" onClick={handleExportCSV} variant="outlined"
                sx={{ fontSize: 11, height: 32, borderColor: PALETTE.border, color: PALETTE.textSecondary, '&:hover': { borderColor: PALETTE.accent, color: PALETTE.accent } }}>
                Export CSV
              </Button>
            </Box>
          </Box>
        </CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: PALETTE.surfaceAlt, color: PALETTE.textMuted, fontFamily: 'monospace', fontSize: 11, letterSpacing: 0.5, borderBottom: `1px solid ${PALETTE.border}`, py: 1.2 } }}>
                <TableCell>DATE</TableCell>
                <TableCell>DESCRIPTION</TableCell>
                <TableCell>CATEGORY</TableCell>
                <TableCell>SOURCE</TableCell>
                <TableCell align="right">AMOUNT</TableCell>
                <TableCell align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? [...Array(5)].map((_, i) => (
                <TableRow key={i} sx={{ '& td': { borderBottom: `1px solid ${PALETTE.border}` } }}>
                  {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton sx={{ bgcolor: PALETTE.surfaceAlt }} /></TableCell>)}
                </TableRow>
              )) : filtered.map(exp => (
                <TableRow key={exp.expenseId} hover sx={{ '&:hover': { bgcolor: PALETTE.surfaceAlt }, '& td': { borderBottom: `1px solid ${PALETTE.border}`, color: PALETTE.textPrimary, fontSize: 13, py: 1.2 } }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '12px !important', color: `${PALETTE.textSecondary} !important` }}>{exp.date}</TableCell>
                  <TableCell>{exp.description || '—'}</TableCell>
                  <TableCell>
                    <Chip label={exp.category} size="small" sx={{ bgcolor: `${CAT_COLORS[exp.category] || PALETTE.accent}22`, color: CAT_COLORS[exp.category] || PALETTE.accent, border: `1px solid ${CAT_COLORS[exp.category] || PALETTE.accent}44`, height: 20, fontSize: 10, fontWeight: 700 }} />
                  </TableCell>
                  <TableCell sx={{ color: `${PALETTE.textSecondary} !important` }}>{exp.source}</TableCell>
                  <TableCell align="right">
                    <Typography sx={{ color: PALETTE.textPrimary, fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>₹{Number(exp.amount).toLocaleString('en-IN')}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => onDelete(exp.expenseId)} disabled={deleting === exp.expenseId}
                      sx={{ color: PALETTE.red, opacity: 0.7, '&:hover': { opacity: 1, bgcolor: `${PALETTE.red}22` } }}>
                      {deleting === exp.expenseId ? <CircularProgress size={14} sx={{ color: PALETTE.red }} /> : <Delete sx={{ fontSize: 15 }} />}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: PALETTE.textMuted, borderBottom: 'none' }}>
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DarkCard>
    </Box>
  );
}

// ─── Inline add form ──────────────────────────────────────────────────────────
function AddExpenseInline({ onAdd }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), amount: '', category: 'Food', source: 'Cash', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: PALETTE.surfaceAlt,
      color: PALETTE.textPrimary,
      borderRadius: 1.5,
      fontSize: 13,
      '& fieldset': { borderColor: PALETTE.border },
      '&:hover fieldset': { borderColor: PALETTE.accent },
      '&.Mui-focused fieldset': { borderColor: PALETTE.accent },
    },
    '& .MuiInputLabel-root': { color: PALETTE.textMuted, fontSize: 13 },
    '& .MuiSelect-icon': { color: PALETTE.textMuted },
  };

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await onAdd({ ...form, amount: parseFloat(form.amount) });
      setForm(f => ({ ...f, amount: '', description: '' }));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 1.5, py: 0.5, bgcolor: `${PALETTE.red}22`, color: PALETTE.red, border: `1px solid ${PALETTE.red}44`, '& .MuiAlert-icon': { color: PALETTE.red } }}>{error}</Alert>}
      <Grid container spacing={1.5}>
        <Grid item xs={6}>
          <TextField label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required fullWidth size="small" InputLabelProps={{ shrink: true }} sx={inputSx} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Amount (₹)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required fullWidth size="small" inputProps={{ min: 1, step: 0.01 }} sx={inputSx} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Category" select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required fullWidth size="small" sx={inputSx}
            SelectProps={{ MenuProps: { PaperProps: { sx: { bgcolor: PALETTE.surfaceAlt, color: PALETTE.textPrimary } } } }}>
            {CATEGORIES.map(c => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={6}>
          <TextField label="Source" select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} required fullWidth size="small" sx={inputSx}
            SelectProps={{ MenuProps: { PaperProps: { sx: { bgcolor: PALETTE.surfaceAlt, color: PALETTE.textPrimary } } } }}>
            {SOURCES.map(s => <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <TextField label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth size="small" placeholder="What was this for?" sx={inputSx} />
        </Grid>
        <Grid item xs={6}>
          <Button type="submit" variant="contained" fullWidth disabled={loading} size="small"
            sx={{ bgcolor: PALETTE.accent, fontWeight: 700, fontSize: 13, py: 1, borderRadius: 1.5, '&:hover': { bgcolor: '#6c5ee0' } }}>
            {loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : 'Add Expense'}
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button variant="outlined" fullWidth size="small"
            sx={{ borderColor: PALETTE.border, color: PALETTE.textSecondary, fontSize: 13, py: 1, borderRadius: 1.5, '&:hover': { borderColor: PALETTE.accent, color: PALETTE.accent } }}>
            Load Sample Data
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Analytics tab ────────────────────────────────────────────────────────────
function AnalyticsTab({ expenses, loading }) {
  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const avgPerTx = expenses.length ? total / expenses.length : 0;
  const maxTx = Math.max(...expenses.map(e => e.amount || 0), 0);

  const catTotals = useMemo(() => {
    const acc = {};
    expenses.forEach(e => { acc[e.category] = (acc[e.category] || 0) + e.amount; });
    return acc;
  }, [expenses]);

  const sourceTotals = useMemo(() => {
    const acc = {};
    expenses.forEach(e => { acc[e.source || 'Other'] = (acc[e.source || 'Other'] || 0) + e.amount; });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const monthlyComparison = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar'];
    const byMonth = {};
    expenses.forEach(e => {
      if (!e.date) return;
      const m = e.date.substring(0, 7);
      byMonth[m] = (byMonth[m] || 0) + e.amount;
    });
    const currentYear = new Date().getFullYear();
    const vals2025 = months.map((_, i) => {
      const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      return byMonth[key] || 0;
    });
    const vals2024 = months.map((_, i) => {
      const key = `${currentYear - 1}-${String(i + 1).padStart(2, '0')}`;
      return byMonth[key] || 0;
    });
    return { months, vals2025, vals2024 };
  }, [expenses]);

  // Daily spending this month
  const dailyData = useMemo(() => {
    const days = Array.from({ length: 15 }, (_, i) => i + 1);
    const byDay = {};
    expenses.forEach(e => {
      if (!e.date) return;
      const d = parseInt(e.date.slice(-2));
      byDay[d] = (byDay[d] || 0) + e.amount;
    });
    return days.map(d => byDay[d] || 0);
  }, [expenses]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: PALETTE.textPrimary, fontWeight: 700 }}>Analytics</Typography>
        <Typography variant="caption" sx={{ color: PALETTE.textSecondary }}>Monthly breakdown and spending patterns</Typography>
      </Box>

      {/* Top stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Logged" value={`₹${total.toLocaleString('en-IN')}`} sub={`${expenses.length} entries`} color={PALETTE.accent} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Avg Per Transaction" value={`₹${Math.round(avgPerTx).toLocaleString('en-IN')}`} sub="across all time" color={PALETTE.yellow} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Highest Single" value={`₹${maxTx.toLocaleString('en-IN')}`} sub="largest transaction" color={PALETTE.red} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Categories Used" value={Object.keys(catTotals).length || 6} sub="out of 7" color={PALETTE.green} loading={loading} />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={6}>
          <DarkCard>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: PALETTE.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontSize: 10, fontFamily: 'monospace', display: 'block', mb: 2 }}>
                Daily Spending — This Month
              </Typography>
              <LineChartSVG
                series={[{ data: dailyData, color: PALETTE.accent }]}
                labels={Array.from({ length: 15 }, (_, i) => i + 1).map(String)}
                height={200}
              />
            </CardContent>
          </DarkCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <DarkCard>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: PALETTE.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontSize: 10, fontFamily: 'monospace', display: 'block', mb: 2 }}>
                Category Breakdown
              </Typography>
              <BarChartSVG
                data={[CATEGORIES.map(c => catTotals[c] || 0)]}
                labels={CATEGORIES}
                color={PALETTE.accent}
                height={180}
              />
            </CardContent>
          </DarkCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <DarkCard>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="caption" sx={{ color: PALETTE.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontSize: 10, fontFamily: 'monospace' }}>
                  Month-over-Month Comparison
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, bgcolor: PALETTE.accent, borderRadius: 1 }} />
                    <Typography sx={{ fontSize: 10, color: PALETTE.textMuted }}>2025</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, bgcolor: PALETTE.red, borderRadius: 1 }} />
                    <Typography sx={{ fontSize: 10, color: PALETTE.textMuted }}>2024</Typography>
                  </Box>
                </Box>
              </Box>
              <BarChartSVG
                data={[monthlyComparison.vals2025, monthlyComparison.vals2024]}
                labels={monthlyComparison.months}
                color={PALETTE.accent}
                color2={PALETTE.red}
                height={180}
              />
            </CardContent>
          </DarkCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <DarkCard>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: PALETTE.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontSize: 10, fontFamily: 'monospace', display: 'block', mb: 2 }}>
                Top Spending Sources
              </Typography>
              {sourceTotals.map(([src, val]) => {
                const pct = total > 0 ? (val / total) * 100 : 0;
                return (
                  <Box key={src} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: PALETTE.textMuted }}>{SOURCE_ICONS[src]}</Box>
                        <Typography sx={{ color: PALETTE.textPrimary, fontSize: 13 }}>{src}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ color: PALETTE.textMuted, fontSize: 11, fontFamily: 'monospace' }}>₹{Number(val).toLocaleString('en-IN')}</Typography>
                        <Typography sx={{ color: PALETTE.textMuted, fontSize: 11 }}>· {Math.round(pct)}%</Typography>
                      </Box>
                    </Box>
                    <LinearProgress variant="determinate" value={pct}
                      sx={{ height: 4, borderRadius: 2, bgcolor: PALETTE.border, '& .MuiLinearProgress-bar': { bgcolor: PALETTE.accent, borderRadius: 2 } }} />
                  </Box>
                );
              })}
              {sourceTotals.length === 0 && <Typography sx={{ color: PALETTE.textMuted, fontSize: 12 }}>No data</Typography>}
            </CardContent>
          </DarkCard>
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Forecast tab (placeholder) ───────────────────────────────────────────────
function ForecastTab() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <Box sx={{ textAlign: 'center' }}>
        <TrendingUp sx={{ fontSize: 56, color: PALETTE.accent, opacity: 0.4, mb: 2 }} />
        <Typography sx={{ color: PALETTE.textPrimary, fontWeight: 700, fontSize: 18, mb: 1 }}>Forecast & ML</Typography>
        <Typography sx={{ color: PALETTE.textMuted, fontSize: 13 }}>ML-powered spending forecasts coming soon</Typography>
      </Box>
    </Box>
  );
}

// ─── AI Assistant tab ─────────────────────────────────────────────────────────
function AIAssistantTab() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: PALETTE.textPrimary, fontWeight: 700 }}>
          AI Finance Assistant
        </Typography>
        <Typography variant="caption" sx={{ color: PALETTE.textSecondary }}>
          Ask questions about your spending patterns
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Chatbot />
      </Box>
    </Box>
  );
}

// ─── Budgets tab ──────────────────────────────────────────────────────────────
function BudgetsTab({ expenses }) {
  const budgets = { Food: 5000, Transport: 3000, Shopping: 8000, Health: 4000, Entertainment: 2000 };
  const catTotals = useMemo(() => {
    const acc = {};
    expenses.forEach(e => { acc[e.category] = (acc[e.category] || 0) + e.amount; });
    return acc;
  }, [expenses]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: PALETTE.textPrimary, fontWeight: 700 }}>Budgets</Typography>
        <Typography variant="caption" sx={{ color: PALETTE.textSecondary }}>Monthly budget tracking</Typography>
      </Box>
      <Grid container spacing={2}>
        {Object.entries(budgets).map(([cat, budget]) => {
          const spent = catTotals[cat] || 0;
          const pct = Math.min((spent / budget) * 100, 100);
          const over = spent > budget;
          return (
            <Grid item xs={12} sm={6} md={4} key={cat}>
              <DarkCard>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CAT_COLORS[cat] }} />
                      <Typography sx={{ color: PALETTE.textPrimary, fontWeight: 600, fontSize: 14 }}>{cat}</Typography>
                    </Box>
                    {over && <Chip label="Over budget" size="small" sx={{ bgcolor: `${PALETTE.red}22`, color: PALETTE.red, fontSize: 10, height: 18 }} />}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: CAT_COLORS[cat], fontFamily: 'monospace', fontWeight: 700 }}>₹{spent.toLocaleString('en-IN')}</Typography>
                    <Typography sx={{ color: PALETTE.textMuted, fontSize: 12, fontFamily: 'monospace' }}>/ ₹{budget.toLocaleString('en-IN')}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={pct}
                    sx={{ height: 6, borderRadius: 3, bgcolor: PALETTE.border,
                      '& .MuiLinearProgress-bar': { bgcolor: over ? PALETTE.red : CAT_COLORS[cat], borderRadius: 3 } }} />
                  <Typography sx={{ color: PALETTE.textMuted, fontSize: 11, mt: 0.8 }}>{Math.round(pct)}% used</Typography>
                </CardContent>
              </DarkCard>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ tokens, email, onLogout }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [addOpen, setAddOpen] = useState(false);

  const month = new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase().slice(0, 3);
  const year = new Date().getFullYear().toString().slice(-2);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExpenses(tokens.IdToken);
      setExpenses(data.expenses || []);
    } catch (err) { showSnack(err.message, 'error'); }
    finally { setLoading(false); }
  }, [tokens.IdToken]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  function showSnack(msg, severity = 'success') { setSnack({ open: true, msg, severity }); }

  async function handleAdd(expense) {
    await addExpense(tokens.IdToken, expense);
    showSnack('Expense added!');
    loadExpenses();
  }

  async function handleDelete(expenseId) {
    setDeleting(expenseId);
    try {
      await deleteExpense(tokens.IdToken, expenseId);
      setExpenses(prev => prev.filter(e => e.expenseId !== expenseId));
      showSnack('Expense deleted');
    } catch (err) { showSnack(err.message, 'error'); }
    finally { setDeleting(null); }
  }

  const tabs = [
    { label: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 15 }} /> },
    { label: 'Expenses', icon: <Receipt sx={{ fontSize: 15 }} /> },
    { label: 'Analytics', icon: <BarChart sx={{ fontSize: 15 }} /> },
    { label: 'Forecast & ML', icon: <TrendingUp sx={{ fontSize: 15 }} /> },
    { label: 'AI Assistant', icon: <SmartToy sx={{ fontSize: 15 }} /> },
    { label: 'Budgets', icon: <AccountBalanceWallet sx={{ fontSize: 15 }} /> },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: PALETTE.bg }}>
      {/* Top nav */}
      <Box sx={{ bgcolor: PALETTE.surface, borderBottom: `1px solid ${PALETTE.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <Box sx={{ maxWidth: 1280, mx: 'auto', px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
            {/* Logo + nav */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ color: PALETTE.accent, fontWeight: 900, fontSize: 16, letterSpacing: '-0.5px', mr: 3, fontFamily: 'monospace' }}>
                FinLens
              </Typography>
              {tabs.map((t, i) => (
                <NavTab key={i} icon={t.icon} label={t.label} active={tab === i} onClick={() => setTab(i)} />
              ))}
            </Box>
            {/* User */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ bgcolor: PALETTE.surfaceAlt, border: `1px solid ${PALETTE.border}`, borderRadius: 1.5, px: 1.5, py: 0.5 }}>
                <Typography sx={{ color: PALETTE.textSecondary, fontSize: 12, fontFamily: 'monospace' }}>
                  {month}: ₹0
                </Typography>
              </Box>
              <Tooltip title="Sign out">
                <IconButton onClick={onLogout} size="small" sx={{ color: PALETTE.textMuted, '&:hover': { color: PALETTE.red } }}>
                  <Logout sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Page content */}
      <Box sx={{ maxWidth: 1280, mx: 'auto', px: 3, py: 4 }}>
        {tab === 0 && <DashboardTab expenses={expenses} loading={loading} onAdd={() => setAddOpen(true)} />}
        {tab === 1 && <ExpensesTab expenses={expenses} loading={loading} onAdd={handleAdd} onDelete={handleDelete} deleting={deleting} />}
        {tab === 2 && <AnalyticsTab expenses={expenses} loading={loading} />}
        {tab === 3 && <ForecastTab />}
        {tab === 4 && <AIAssistantTab />}
        {tab === 5 && <BudgetsTab expenses={expenses} />}
      </Box>

      {/* Quick add dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: PALETTE.surface, border: `1px solid ${PALETTE.border}`, borderRadius: 2 } }}>
        <DialogTitle sx={{ color: PALETTE.textPrimary, fontWeight: 700, borderBottom: `1px solid ${PALETTE.border}`, pb: 2 }}>
          Add New Expense
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <AddExpenseInline onAdd={async (exp) => { await handleAdd(exp); setAddOpen(false); }} />
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}
          sx={{ bgcolor: PALETTE.surface, color: PALETTE.textPrimary, border: `1px solid ${PALETTE.border}`, borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
