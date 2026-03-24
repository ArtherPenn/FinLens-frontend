const CLIENT_ID = '4tdnmotae00n844o7d76phpd61';
const REGION = 'ap-south-1';
const COGNITO_URL = `https://cognito-idp.${REGION}.amazonaws.com/`;
const API_URL = 'https://qs1ubycqtd.execute-api.ap-south-1.amazonaws.com/prod';

async function cognitoRequest(target, body) {
  const res = await fetch(COGNITO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export async function signUp(email, password) {
  return cognitoRequest('SignUp', {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }],
  });
}

export async function confirmSignUp(email, code) {
  return cognitoRequest('ConfirmSignUp', {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
}

export async function signIn(email, password) {
  const data = await cognitoRequest('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  return data.AuthenticationResult;
}

// Expense API calls
export async function getExpenses(token, month = null) {
  const url = month ? `${API_URL}/expenses?month=${month}` : `${API_URL}/expenses`;
  const res = await fetch(url, { headers: { Authorization: token } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch');
  return data;
}

export async function addExpense(token, expense) {
  const res = await fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add');
  return data;
}

export async function deleteExpense(token, expenseId) {
  const res = await fetch(`${API_URL}/expenses/${expenseId}`, {
    method: 'DELETE',
    headers: { Authorization: token },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete');
  return data;
}
