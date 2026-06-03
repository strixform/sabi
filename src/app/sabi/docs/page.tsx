export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto prose prose-invert">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-4">API Documentation</h1>
        <p className="text-xl text-slate-300">
          Complete guide to integrating Sabi into your application
        </p>
      </div>

      {/* Authentication */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Authentication</h2>
        <p className="text-slate-300 mb-4">
          All API requests require authentication. Include your API key in the Authorization header:
        </p>
        <div className="bg-slate-900 p-4 rounded-lg mb-4 overflow-auto">
          <code className="text-sm text-slate-200">
            Authorization: Bearer sabi_[keyId]_[token]
          </code>
        </div>
      </div>

      {/* Endpoints */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">API Endpoints</h2>

        {/* Auth Endpoints */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Authentication</h3>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mb-4">
            <div className="font-mono text-blue-400 font-bold mb-2">POST /api/sabi/auth/register</div>
            <p className="text-slate-400 text-sm mb-3">Register a new account</p>
            <div className="text-xs">
              <div className="font-bold text-slate-300 mb-2">Request:</div>
              <code className="block bg-slate-900 p-2 rounded mb-2">
                {`{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "businessName": "My Brand"
}`}
              </code>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mb-4">
            <div className="font-mono text-blue-400 font-bold mb-2">POST /api/sabi/auth/login</div>
            <p className="text-slate-400 text-sm mb-3">Login to your account</p>
            <div className="text-xs">
              <div className="font-bold text-slate-300 mb-2">Request:</div>
              <code className="block bg-slate-900 p-2 rounded">
                {`{
  "email": "user@example.com",
  "password": "securepassword"
}`}
              </code>
            </div>
          </div>
        </div>

        {/* Order Endpoints */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Orders</h3>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mb-4">
            <div className="font-mono text-blue-400 font-bold mb-2">POST /api/sabi/orders</div>
            <p className="text-slate-400 text-sm mb-3">Create a new order</p>
            <div className="text-xs">
              <div className="font-bold text-slate-300 mb-2">Request:</div>
              <code className="block bg-slate-900 p-2 rounded">
                {`{
  "serviceId": "instagram_followers",
  "quantity": 500,
  "targetUrl": "https://instagram.com/yourprofile",
  "paymentMethod": "flutterwave"
}`}
              </code>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <div className="font-mono text-blue-400 font-bold mb-2">GET /api/sabi/orders</div>
            <p className="text-slate-400 text-sm mb-3">Get all orders for authenticated user</p>
          </div>
        </div>

        {/* Services */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Services</h3>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <div className="font-mono text-blue-400 font-bold mb-2">GET /api/sabi/services</div>
            <p className="text-slate-400 text-sm mb-3">
              Get all available services with pricing and details
            </p>
          </div>
        </div>

        {/* Wallet */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Wallet</h3>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mb-4">
            <div className="font-mono text-blue-400 font-bold mb-2">POST /api/sabi/wallet/fund</div>
            <p className="text-slate-400 text-sm mb-3">Initialize a payment to fund your wallet</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <div className="font-mono text-blue-400 font-bold mb-2">GET /api/sabi/wallet</div>
            <p className="text-slate-400 text-sm mb-3">
              Get wallet balance and transaction history
            </p>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Code Examples</h2>

        <div className="mb-8">
          <h3 className="text-lg font-bold mb-3">JavaScript</h3>
          <div className="bg-slate-900 p-4 rounded-lg overflow-auto">
            <code className="text-xs text-slate-200 whitespace-pre">{`const apiKey = 'sabi_[keyId]_[token]';

// Create an order
const response = await fetch('https://sability.io/api/sabi/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${apiKey}\`
  },
  body: JSON.stringify({
    serviceId: 'instagram_followers',
    quantity: 500,
    targetUrl: 'https://instagram.com/yourprofile',
    paymentMethod: 'wallet'
  })
});

const data = await response.json();
console.log(data);`}</code>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold mb-3">Python</h3>
          <div className="bg-slate-900 p-4 rounded-lg overflow-auto">
            <code className="text-xs text-slate-200 whitespace-pre">{`import requests

api_key = 'sabi_[keyId]_[token]'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# Create an order
response = requests.post(
    'https://sability.io/api/sabi/orders',
    headers=headers,
    json={
        'serviceId': 'instagram_followers',
        'quantity': 500,
        'targetUrl': 'https://instagram.com/yourprofile',
        'paymentMethod': 'wallet'
    }
)

print(response.json())`}</code>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold mb-3">cURL</h3>
          <div className="bg-slate-900 p-4 rounded-lg overflow-auto">
            <code className="text-xs text-slate-200 whitespace-pre">{`curl -X POST https://sability.io/api/sabi/orders \\
  -H "Authorization: Bearer sabi_[keyId]_[token]" \\
  -H "Content-Type: application/json" \\
  -d '{
    "serviceId": "instagram_followers",
    "quantity": 500,
    "targetUrl": "https://instagram.com/yourprofile",
    "paymentMethod": "wallet"
  }'`}</code>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-2">Need Help?</h3>
        <p className="text-slate-400">
          Check our FAQ or contact support at support@sabi.io
        </p>
      </div>
    </div>
  );
}
