'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaCalendarAlt, FaUser, FaClock, FaPlus } from 'react-icons/fa';

interface ScheduleEntry {
  id: string;
  techName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

export default function ManagerSchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekDates = useCallback(() => {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/shop/team');
      if (res.ok) {
        const team = await res.json();
        const entries: ScheduleEntry[] = (Array.isArray(team) ? team : team.technicians ?? []).map(
          (t: { id: string; name?: string; firstName?: string; lastName?: string }) => ({
            id: t.id,
            techName: t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Technician',
            date: new Date().toISOString().split('T')[0],
            startTime: '08:00',
            endTime: '17:00',
            status: 'scheduled',
          })
        );
        setSchedules(entries);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const weekDates = getWeekDates();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Schedule</h1>
          <p className="text-gray-500">Manage technician schedules and shifts</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">&larr; Prev</button>
          <button onClick={() => setWeekOffset(0)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Today</button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Next &rarr;</button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
          <div className="px-4 py-3 text-sm font-medium text-gray-500">Technician</div>
          {weekDates.map((d, i) => (
            <div key={i} className="px-2 py-3 text-center">
              <p className="text-xs text-gray-500">{dayNames[i]}</p>
              <p className="text-sm font-medium text-gray-900">{d.getDate()}</p>
            </div>
          ))}
        </div>
        {schedules.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <FaCalendarAlt className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No team members found</p>
          </div>
        ) : (
          schedules.map(s => (
            <div key={s.id} className="grid grid-cols-8 border-b border-gray-100 hover:bg-gray-50">
              <div className="px-4 py-3 flex items-center gap-2">
                <FaUser className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900 truncate">{s.techName}</span>
              </div>
              {weekDates.map((d, i) => {
                const isToday = new Date().toDateString() === d.toDateString();
                return (
                  <div key={i} className={`px-2 py-3 text-center ${isToday ? 'bg-purple-50' : ''}`}>
                    <div className="flex items-center justify-center gap-1">
                      <FaClock className="w-3 h-3 text-gray-300" />
                      <span className="text-xs text-gray-500">{s.startTime}-{s.endTime}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
