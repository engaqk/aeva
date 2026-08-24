const apiKey = 'AIzaSyCMta6NKqxDmbJzg6X9zBuyGgn0XqRElg8';
const projectId = 'aeva-9411f';

async function test() {
  console.log('Authenticating...');
  const authRes = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@aeva.com', password: 'admin53', returnSecureToken: true })
  });
  const authData = await authRes.json();
  if (authData.error) {
    console.error('Auth Error:', authData.error);
    return;
  }
  
  const token = authData.idToken;
  console.log('Authenticated! uid:', authData.localId);
  
  console.log('Querying Firestore...');
  const dbRes = await fetch('https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/users', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  
  const dbData = await dbRes.json();
  console.log('Firestore Response:', JSON.stringify(dbData, null, 2));
}

test();
