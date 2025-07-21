export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>AdGenius Creator - Test Page</h1>
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ color: '#666' }}>✅ Next.js is working</h2>
        <p>If you can see this page, the basic Next.js setup is working correctly.</p>
        
        <div style={{ marginTop: '20px' }}>
          <h3>Test Features:</h3>
          <ul>
            <li>✅ Page rendering</li>
            <li>✅ Basic styling</li>
            <li>✅ Vercel deployment</li>
          </ul>
        </div>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
          <strong>Next Step:</strong> Go back to the main page (/) to see the full AdGenius Creator dashboard.
        </div>
      </div>
    </div>
  )
}