'use client';

import { useEffect, useState } from 'react';

interface DatabaseStatus {
  success: boolean;
  tables: Record<string, boolean>;
  stats: {
    profiles: number;
    courses: number;
    enrollments: number;
  };
}

export function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/db-test')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-gray-500">Checking database...</div>;
  }

  if (!status?.success) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
        Database connection failed
      </div>
    );
  }

  const allTablesReady = Object.values(status.tables).every(ready => ready);

  return (
    <div className={`border px-4 py-3 rounded ${allTablesReady ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <h3 className="font-semibold mb-2">Database Status</h3>
      
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        {Object.entries(status.tables).map(([table, ready]) => (
          <div key={table} className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${ready ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="capitalize">{table}</span>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <div>Profiles: {status.stats.profiles}</div>
        <div>Courses: {status.stats.courses}</div>
        <div>Enrollments: {status.stats.enrollments}</div>
      </div>
    </div>
  );
}