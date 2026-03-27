async function testExtraction() {
  const url = 'http://localhost:3000/api/extract';
  const body = {
    type: 'url',
    url: 'https://example.com'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    console.log('Extraction Result:', data);
  } catch (err) {
    console.error('Extraction Test Failed:', err.message);
  }
}

testExtraction();
