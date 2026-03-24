import { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Link, Stepper, Step, StepLabel,
  InputAdornment, IconButton, Divider
} from '@mui/material';
import { Visibility, VisibilityOff, AccountBalanceWallet, MarkEmailRead } from '@mui/icons-material';
import { signUp, confirmSignUp } from '../api';

const steps = ['Create account', 'Verify email'];

export default function SignUp({ onSwitch, onSuccess }) {
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    setLoading(true);
    try {
      await signUp(email, password);
      setActiveStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmSignUp(email, code);
      onSuccess('Account confirmed! Please sign in.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f4f8', p: 2 }}>
      <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <CardContent sx={{ p: 4 }}>

          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <AccountBalanceWallet sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">FinLens</Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          {/* Step 1 — Sign Up */}
          {activeStep === 0 && (
            <>
              <Typography variant="h5" fontWeight={700} mb={0.5}>Create account</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Start tracking your expenses securely
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box component="form" onSubmit={handleSignUp} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required fullWidth autoComplete="email"
                />

                <TextField
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required fullWidth
                  helperText="Min 8 chars, uppercase, number, symbol"
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

                <TextField
                  label="Confirm password"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required fullWidth
                />

                <Button
                  type="submit" variant="contained" fullWidth size="large"
                  disabled={loading}
                  sx={{ mt: 1, py: 1.4, borderRadius: 2, fontWeight: 700, fontSize: '1rem' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Create account'}
                </Button>
              </Box>

              <Typography variant="body2" color="text.secondary" align="center" mt={3}>
                Already have an account?{' '}
                <Link component="button" onClick={onSwitch} fontWeight={600} underline="hover">
                  Sign in
                </Link>
              </Typography>
            </>
          )}

          {/* Step 2 — Verify */}
          {activeStep === 1 && (
            <>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <MarkEmailRead sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" fontWeight={700} mb={0.5}>Check your email</Typography>
                <Typography variant="body2" color="text.secondary">
                  We sent a 6-digit code to <strong>{email}</strong>
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Box component="form" onSubmit={handleConfirm} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Verification code"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required fullWidth autoFocus
                  inputProps={{ maxLength: 6, style: { letterSpacing: '0.3em', fontSize: '1.4rem', textAlign: 'center' } }}
                  placeholder="• • • • • •"
                />

                <Button
                  type="submit" variant="contained" fullWidth size="large"
                  disabled={loading || code.length < 6}
                  sx={{ mt: 1, py: 1.4, borderRadius: 2, fontWeight: 700, fontSize: '1rem' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm account'}
                </Button>

                <Button
                  variant="text" fullWidth
                  onClick={() => { setActiveStep(0); setError(''); setCode(''); }}
                >
                  ← Back to sign up
                </Button>
              </Box>
            </>
          )}

        </CardContent>
      </Card>
    </Box>
  );
}
