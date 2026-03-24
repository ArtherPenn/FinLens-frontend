import { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Link, InputAdornment, IconButton, Divider
} from '@mui/material';
import { Visibility, VisibilityOff, AccountBalanceWallet } from '@mui/icons-material';
import { signIn } from '../api';

export default function Login({ onSwitch, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await signIn(email, password);
      onLogin(tokens, email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f4f8', p: 2 }}>
      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <CardContent sx={{ p: 4 }}>

          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <AccountBalanceWallet sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">
              FinLens
            </Typography>
          </Box>

          <Typography variant="h5" fontWeight={700} mb={0.5}>Welcome back</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Sign in to your expense dashboard
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
              size="medium"
            />

            <TextField
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(p => !p)} edge="end">
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 1, py: 1.4, borderRadius: 2, fontWeight: 700, fontSize: '1rem' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" align="center" mt={3}>
            Don't have an account?{' '}
            <Link component="button" onClick={onSwitch} fontWeight={600} underline="hover">
              Create one
            </Link>
          </Typography>

        </CardContent>
      </Card>
    </Box>
  );
}
