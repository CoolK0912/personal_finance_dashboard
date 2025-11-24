import React, { useState, useEffect } from 'react';

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/budgets/')
      .then(res => res.json())
      .then(data => {
        setBudgets(data.results || data);
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
      <h1 className="text-3xl font-bold mb-6">My Budgets</h1>
      
      {budgets.length === 0 ? (
        <p className="text-gray-500">No budgets yet.</p>
      ) : (
        <div className="space-y-4">
          {budgets.map(budget => (
            <div key={budget.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-lg">{budget.name}</h3>
              <div className="mt-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Spent: ${budget.spent_amount}</span>
                  <span>Total: ${budget.total_amount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{width: `${(budget.spent_amount / budget.total_amount) * 100}%`}}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Budgets;