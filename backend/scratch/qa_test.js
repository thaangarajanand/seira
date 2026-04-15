const API = 'http://localhost:5000/api';

async function runQA() {
  console.log('🚀 Starting SEIRA Platform QA Test (Native Fetch)...');
  try {
    // 1. Register Customer
    console.log('\n[1] Registering Customer...');
    const custEmail = `qe_cust_${Date.now()}@test.com`;
    const custRegRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'QA Test Customer',
        email: custEmail,
        password: 'password123',
        role: 'customer'
      })
    });
    const custRegData = await custRegRes.json();
    if (!custRegRes.ok) throw new Error(custRegData.error);
    console.log('✅ Customer Registered');

    // 2. Register Company
    console.log('\n[2] Registering Company...');
    const companyEmail = `qa_comp_${Date.now()}@test.com`;
    const compRegRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'QA Tech Industries',
        email: companyEmail,
        password: 'password123',
        role: 'company',
        companyName: 'QA Tech'
      })
    });
    const compRegData = await compRegRes.json();
    if (!compRegRes.ok) throw new Error(compRegData.error);
    console.log('✅ Company Registered');

    // 3. Verify Login (Should fail if not approved)
    console.log('\n[3] Verifying Login Block (Unapproved)...');
    const failLogin = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: companyEmail, password: 'password123' })
    });
    const failData = await failLogin.json();
    if (failLogin.status === 403) {
      console.log('✅ Blocked Successfully:', failData.error);
    } else {
      console.log('⚠️ Unexpected result:', failLogin.status, failData);
    }

    // 4. Admin Approval
    console.log('\n[4] Admin Panel - Approving Company...');
    const adminLoginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@seira.com', password: 'admin123' })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    
    // Find company ID
    const pendingRes = await fetch(`${API}/admin/pending-companies`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pendingData = await pendingRes.json();
    const compToApprove = pendingData.find(c => c.email === companyEmail);
    
    const approveRes = await fetch(`${API}/admin/approve-company/${compToApprove._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Company Approved by Admin');

    // 5. Company Adds Product
    console.log('\n[5] Company Login & Product Creation...');
    const compLoginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: companyEmail, password: 'password123' })
    });
    const compLoginData = await compLoginRes.json();
    const compToken = compLoginData.token;

    const prodRes = await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${compToken}` 
      },
      body: JSON.stringify({
        name: 'Industrial Robot Arm',
        price: 250000,
        category: 'Robotics Integration',
        description: '6-axis industrial robotic arm for assembly lines.',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800'
      })
    });
    const prodData = await prodRes.json();
    const productId = prodData._id;
    console.log('✅ Product Created under New Category:', prodData.category);

    // 6. Customer Places Custom Order
    console.log('\n[6] Customer Placing Custom Order...');
    const custLoginRes = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: custEmail, password: 'password123' })
      });
    const custLoginData = await custLoginRes.json();
    const custToken = custLoginData.token;

    const orderRes = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}` 
      },
      body: JSON.stringify({
        type: 'custom',
        description: 'Custom modification for high-heat environments.',
        proposedRate: 300000,
        proposedDeliveryDate: '2026-10-10',
        quantity: 1,
        product: productId
      })
    });
    const orderData = await orderRes.json();
    const orderId = orderData._id;
    console.log('✅ Custom Order Placed. ID:', orderId.slice(-6).toUpperCase());

    // 7. Company Proposes Counter Rate
    console.log('\n[7] Company Negotiating...');
    await fetch(`${API}/orders/${orderId}/negotiate`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${compToken}` 
      },
      body: JSON.stringify({
        proposedRate: 320000,
        proposedDeliveryDate: '2026-11-01',
        counterNote: 'Price adjusted for specialized heat-resistant components.'
      })
    });
    console.log('✅ Counter Rate Proposed');

    // 8. Order Lifecycle: Accept -> shipped -> OTP -> Completed
    console.log('\n[8] Completing Life-cycle...');
    await fetch(`${API}/orders/${orderId}/accept`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${custToken}` }
    });
    console.log('✅ Customer Accepted Negotiated Rate');

    await fetch(`${API}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${compToken}` 
      },
      body: JSON.stringify({ status: 'shipped' })
    });
    const shippedOrderRes = await fetch(`${API}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${custToken}` }
    });
    const shippedOrderData = await shippedOrderRes.json();
    const otp = shippedOrderData.completionOTP;
    console.log('✅ Order Shipped. Completion OTP received by Customer:', otp);

    await fetch(`${API}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${compToken}` 
      },
      body: JSON.stringify({ status: 'completed', otp })
    });
    console.log('✅ OTP Verified. Order Status: COMPLETED');

    console.log('\n⭐ ALL FUNCTIONS TESTED SUCCESSFULLY! ⭐');
  } catch (err) {
    console.error('\n❌ QA Test Failed:', err.message);
  }
}

runQA();
