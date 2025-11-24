import React, { useState, useEffect } from 'react';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/transactions/')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched data:', data);
        setTransactions(data.results || data);
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
      <h1 className="text-3xl font-bold mb-6">My Transactions</h1>
      
      {transactions.length === 0 ? (
        <p className="text-gray-500">No transactions yet.</p>
      ) : (
        <div className="space-y-4">
          {transactions.map(transaction => (
            <div key={transaction.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{transaction.description}</h3>
                  <p className="text-gray-500 text-sm">{transaction.date}</p>
                </div>
                <div className={`text-xl font-bold ${
                  transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Transactions;