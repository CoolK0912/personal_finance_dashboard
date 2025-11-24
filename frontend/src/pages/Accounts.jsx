import React, { useState, useEffect } from 'react';

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/accounts/')
      .then(res => res.json())
      .then(data => {
        setAccounts(data.results || data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Accounts</h1>
      
      {accounts.length === 0 ? (
        <p className="text-gray-500">No accounts yet.</p>
      ) : (
        <div className="space-y-4">
          {accounts.map(account => (
            <div key={account.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-lg">{account.name_account}</h3>
              <p className="text-2xl font-bold text-blue-600">${account.balance}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Accounts;