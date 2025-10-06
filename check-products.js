async function checkProducts() {
  try {
    // Primero hacer login
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nexopos.com',
        password: 'admin123'
      })
    });

    const { access_token } = await loginRes.json();

    // Obtener productos
    const productsRes = await fetch('http://localhost:3000/api/products', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const products = await productsRes.json();

    console.log('Products type:', typeof products);
    console.log('Is array?:', Array.isArray(products));
    if (!Array.isArray(products)) {
      console.log('Products response:', JSON.stringify(products, null, 2));
      return;
    }

    // Buscar Agua Cristal
    const aguaCristal = products.find(p => p.name && p.name.includes('Agua Cristal'));
    console.log('\n========== AGUA CRISTAL 600ML (FUNCIONA) ==========');
    console.log(JSON.stringify(aguaCristal, null, 2));

    // Buscar Salchicha
    const salchicha = products.find(p => p.name.toLowerCase().includes('salchicha'));
    console.log('\n========== SALCHICHA (NO FUNCIONA) ==========');
    console.log(JSON.stringify(salchicha, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

checkProducts();
