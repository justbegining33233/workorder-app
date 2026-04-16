'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaStore, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaSave, FaCog } from 'react-icons/fa';
import Link from 'next/link';
import type { Route } from 'next';

interface ShopInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  hours: string;
  description: string;
}

export default function ShopProfilePage() {
  const { user } = useAuth();
  const [shop, setShop] = useState<ShopInfo>({ name: '', address: '', city: '', state: '', zip: '', phone: '', email: '', hours: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await fetch('/api/shop/profile');
        if (res.ok) {
          const data = await res.json();
          setShop({
            name: data.name || data.shopName || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            zip: data.zip || data.zipCode || '',
            phone: data.phone || '',
            email: data.email || '',
            hours: data.hours || data.businessHours || '',
            description: data.description || '',
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/shop/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shop),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Shop</h1>
          <p className="text-gray-500">Manage your shop information</p>
        </div>
        <Link href={"/shop/settings" as Route} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">
          <FaCog className="w-4 h-4" /> Settings
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
            <FaStore className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-bold">{shop.name || 'Your Shop'}</p>
            <p className="text-sm text-gray-500">{shop.city && shop.state ? `${shop.city}, ${shop.state}` : 'Location not set'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
            <input type="text" value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"><FaPhone className="inline w-3 h-3 mr-1" />Phone</label>
            <input type="tel" value={shop.phone} onChange={(e) => setShop({ ...shop, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"><FaEnvelope className="inline w-3 h-3 mr-1" />Email</label>
            <input type="email" value={shop.email} onChange={(e) => setShop({ ...shop, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1"><FaClock className="inline w-3 h-3 mr-1" />Business Hours</label>
            <input type="text" value={shop.hours} onChange={(e) => setShop({ ...shop, hours: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Mon-Fri 8am-6pm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1"><FaMapMarkerAlt className="inline w-3 h-3 mr-1" />Address</label>
          <input type="text" value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input type="text" value={shop.city} onChange={(e) => setShop({ ...shop, city: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input type="text" value={shop.state} onChange={(e) => setShop({ ...shop, state: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
            <input type="text" value={shop.zip} onChange={(e) => setShop({ ...shop, zip: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={shop.description} onChange={(e) => setShop({ ...shop, description: e.target.value })} rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Tell customers about your shop..." />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
            <FaSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-green-600 text-sm">Shop profile updated!</span>}
        </div>
      </div>
    </div>
  );
}
