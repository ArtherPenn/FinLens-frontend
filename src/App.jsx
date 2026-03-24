import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Alert, Snackbar } from '@mui/material';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    background: { default: '#f0f4f8' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
    },
  },
});

export default function App() {
  const [page, setPage] = useState('login');       // 'login' | 'signup'
  const [tokens, setTokens] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  function handleLogin(tokens, email) {
    setTokens(tokens);
    setUserEmail(email);
  }

  function handleLogout() {
    setTokens(null);
    setUserEmail('');
    setPage('login');
  }

  function handleSignUpSuccess(msg) {
    setSuccessMsg(msg);
    setPage('login');
  }

  if (tokens) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Dashboard tokens={tokens} email={userEmail} onLogout={handleLogout} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Snackbar
        open={!!successMsg}
        autoHideDuration={5000}
        onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMsg('')} sx={{ borderRadius: 2 }}>
          {successMsg}
        </Alert>
      </Snackbar>

      {page === 'login' ? (
        <Login
          onSwitch={() => setPage('signup')}
          onLogin={handleLogin}
        />
      ) : (
        <SignUp
          onSwitch={() => setPage('login')}
          onSuccess={handleSignUpSuccess}
        />
      )}
    </ThemeProvider>
  );
}
