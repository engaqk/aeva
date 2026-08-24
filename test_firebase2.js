const apiKey = 'AIzaSyCMta6NKqxDmbJzg6X9zBuyGgn0XqRElg8';
const projectId = 'aeva-9411f';

async function test() {
  const authRes = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@aeva.com', password: 'admin53', returnSecureToken: true })
  });
  const authData = await authRes.json();
  const token = authData.idToken;
  
  const queries = ['users', 'registrations', 'logins'];
  for (const q of queries) {
    const res = await fetch('https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/' + q, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    console.log(q + ' status:', data.error ? data.error.status : 'OK');
  }
}

test();
