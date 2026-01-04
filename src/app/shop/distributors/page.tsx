'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Distributor = {
  id: string;
  name: string;
  logo: string;
  rating: number;
  deliveryTime: string;
  minOrder: number;
  shippingCost: number;
  accountNumber?: string;
};

type DistributorPrice = {
  distributorId: string;
  price: number;
  stock: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Backordered';
  delivery: string;
};

type PartListing = {
  partName: string;
  partNumber: string;
  category: string;
  manufacturer: string;
  fitmentInfo: string;
  myStock: number;
  reorderLevel: number;
  prices: DistributorPrice[];
};

export default function DistributorManagement() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [selectedPart, setSelectedPart] = useState<PartListing | null>(null);
  const [cart, setCart] = useState<{distributorId: string, partName: string, quantity: number, price: number, partNumber: string}[]>([]);
  const [showDistributorModal, setShowDistributorModal] = useState(false);
  const [partNumberSearch, setPartNumberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PartListing[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState({ year: '', make: '', model: '', engine: '' });
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [searchType, setSearchType] = useState<'part' | 'vehicle'>('part');
  const [showPartTypeModal, setShowPartTypeModal] = useState(false);
  const [selectedPartType, setSelectedPartType] = useState('');

  // Part categories for vehicle lookup
  const partCategories = [
    { name: 'Oil Filter', keywords: ['oil', 'filter', 'oil filter'] },
    { name: 'Air Filter', keywords: ['air', 'filter', 'air filter'] },
    { name: 'Cabin Air Filter', keywords: ['cabin', 'air', 'filter', 'cabin filter'] },
    { name: 'Brake Pads', keywords: ['brake', 'pads', 'brake pads', 'brakes'] },
    { name: 'Spark Plugs', keywords: ['spark', 'plugs', 'spark plugs', 'ignition'] },
    { name: 'Wiper Blades', keywords: ['wiper', 'blades', 'windshield'] },
    { name: 'Battery', keywords: ['battery', 'batteries'] },
    { name: 'Transmission Filter', keywords: ['transmission', 'filter', 'trans filter'] },
    { name: 'Fuel Filter', keywords: ['fuel', 'filter'] },
    { name: 'Serpentine Belt', keywords: ['belt', 'serpentine'] },
  ];

  // Real automotive parts distributors
  const distributors: Distributor[] = [
    { id: 'napa', name: 'NAPA Auto Parts', logo: '🔧', rating: 4.7, deliveryTime: '1-2 days', minOrder: 50, shippingCost: 15, accountNumber: 'NAPA-12345' },
    { id: 'autozone', name: 'AutoZone Commercial', logo: '🚗', rating: 4.5, deliveryTime: 'Same Day', minOrder: 0, shippingCost: 0, accountNumber: 'AZ-COM-789' },
    { id: 'oreilly', name: "O'Reilly Auto Parts", logo: '⚙️', rating: 4.6, deliveryTime: '1-2 days', minOrder: 25, shippingCost: 12 },
    { id: 'worldpac', name: 'WORLDPAC', logo: '🌍', rating: 4.8, deliveryTime: 'Next Day', minOrder: 100, shippingCost: 20, accountNumber: 'WP-5678' },
    { id: 'carquest', name: 'CARQUEST', logo: '🔩', rating: 4.4, deliveryTime: '1-3 days', minOrder: 50, shippingCost: 15 },
  ];

  const partListings: PartListing[] = [];

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    if (role !== 'shop') {
      router.push('/auth/login');
      return;
    }
    if (name) setUserName(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDistributor = (id: string) => distributors.find(d => d.id === id);

  const getBestPrice = (prices: DistributorPrice[]) => {
    const available = prices.filter(p => p.stock === 'In Stock');
    if (available.length === 0) return prices[0];
    return available.reduce((min, curr) => curr.price < min.price ? curr : min);
  };

  const handleAddToCart = (distributorId: string, partName: string, price: number, partNumber: string) => {
    const existing = cart.find(item => item.distributorId === distributorId && item.partNumber === partNumber);
    if (existing) {
      setCart(cart.map(item => 
        item.distributorId === distributorId && item.partNumber === partNumber
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { distributorId, partName, quantity: 1, price, partNumber }]);
    }
  };

  const handlePartNumberSearch = () => {
    const searchTerm = partNumberSearch.trim();
    
    if (!searchTerm) {
      alert('⚠️ Please enter a part number or part name to search');
      return;
    }

    // Search by exact part number or partial match
    const results = partListings.filter(part => {
      const partNumMatch = part.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const nameMatch = part.partName.toLowerCase().includes(searchTerm.toLowerCase());
      const mfgMatch = part.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
      return partNumMatch || nameMatch || mfgMatch;
    });

    if (results.length === 0) {
      alert(`❌ No parts found for "${searchTerm}"\n\n💡 Search Tips:\n` +
            `• Use exact part numbers: PF48, BKR5EIX-11, 17D1367CH\n` +
            `• Search by part name: "oil filter", "brake pads"\n` +
            `• Search by manufacturer: "AC Delco", "NGK", "Raybestos"\n\n` +
            `📋 Try the Vehicle Lookup instead for guaranteed compatibility`);
      setSearchResults([]);
    } else {
      setSearchResults(results);
      setSearchType('part');
      setShowResultsModal(true);
    }
  };

  const handleVehicleLookup = () => {
    if (!vehicleInfo.year || !vehicleInfo.make || !vehicleInfo.model) {
      alert('⚠️ Required fields missing!\n\nPlease enter:\n• Year\n• Make\n• Model\n\nEngine is optional but recommended for accuracy.');
      return;
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(vehicleInfo.year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      alert(`⚠️ Invalid year: ${vehicleInfo.year}\n\nPlease enter a valid year between 1900 and ${currentYear + 1}`);
      return;
    }

    // Show part type selection modal
    setShowVehicleModal(false);
    setShowPartTypeModal(true);
  };

  const handlePartTypeSelection = (partType: string) => {
    setSelectedPartType(partType);
    
    // Filter parts by vehicle fitment info AND part type
    const results = partListings.filter(part => {
      const fitment = part.fitmentInfo.toLowerCase();
      const makeMatch = fitment.includes(vehicleInfo.make.toLowerCase());
      const yearMatch = fitment.includes(vehicleInfo.year);
      
      // Match the part type
      const partCategory = partCategories.find(cat => cat.name === partType);
      const partTypeMatch = partCategory?.keywords.some(keyword => 
        part.partName.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // If we have engine info, try to match that too
      let vehicleMatch = makeMatch || yearMatch;
      if (vehicleInfo.engine) {
        const engineMatch = fitment.includes(vehicleInfo.engine.toLowerCase());
        vehicleMatch = vehicleMatch || engineMatch;
      }
      
      return vehicleMatch && partTypeMatch;
    });

    if (results.length === 0) {
      // No exact matches - try broader search
      const broaderResults = partListings.filter(part => {
        const partCategory = partCategories.find(cat => cat.name === partType);
        return partCategory?.keywords.some(keyword => 
          part.partName.toLowerCase().includes(keyword.toLowerCase())
        );
      });
      
      if (broaderResults.length > 0) {
        alert(`⚠️ No exact fitment match for ${partType} on:\n${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}\n\nShowing all ${partType} parts.\n⚠️ Verify compatibility before ordering!`);
        setSearchResults(broaderResults);
      } else {
        alert(`❌ No ${partType} found in inventory.\n\nTry searching by part number instead.`);
        setShowPartTypeModal(false);
        return;
      }
    } else {
      setSearchResults(results);
    }
    
    setSearchType('vehicle');
    setShowPartTypeModal(false);
    setShowResultsModal(true);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    const ordersByDistributor = cart.reduce((acc, item) => {
      if (!acc[item.distributorId]) acc[item.distributorId] = [];
      acc[item.distributorId].push(item);
      return acc;
    }, {} as Record<string, typeof cart>);

    let orderSummary = '📦 ORDER CONFIRMATION\n\n';
    let totalCost = 0;

      Object.entries(ordersByDistributor).forEach(([distId, items]) => {
      const dist = getDistributor(distId);
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      totalCost += subtotal + (dist?.shippingCost || 0);

      orderSummary += `${dist?.name}\n`;
      orderSummary += `Account: ${dist?.accountNumber || 'Not Set'}\n`;
      items.forEach(item => {
        orderSummary += `  • ${item.partName}\n    Part #: ${item.partNumber}\n    Qty: ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}\n`;
      });
      orderSummary += `  Subtotal: $${subtotal.toFixed(2)}\n`;
      orderSummary += `  Shipping: $${dist?.shippingCost || 0}\n`;
      orderSummary += `  Delivery: ${dist?.deliveryTime}\n\n`;
    });    orderSummary += `TOTAL: $${totalCost.toFixed(2)}\n\n`;
    orderSummary += 'Orders will be placed with your distributor accounts.';

    if (confirm(orderSummary)) {
      alert('✅ Orders placed successfully!\n\nYou will receive confirmation emails from each distributor.');
      setCart([]);
    }
  };

  const getStockBadge = (stock: string) => {
    const colors: Record<string, {bg: string, text: string}> = {
      'In Stock': {bg: 'rgba(34,197,94,0.2)', text: '#22c55e'},
      'Low Stock': {bg: 'rgba(245,158,11,0.2)', text: '#f59e0b'},
      'Out of Stock': {bg: 'rgba(229,51,42,0.2)', text: '#e5332a'},
      'Backordered': {bg: 'rgba(139,92,246,0.2)', text: '#8b5cf6'},
    };
    const color = colors[stock] || colors['In Stock'];
    return { background: color.bg, color: color.text };
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)'}}>
      <div style={{background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(245,158,11,0.3)', padding:'20px 32px'}}>
        <div style={{maxWidth:1600, margin:'0 auto'}}>
          <Link href="/shop/home" style={{color:'#3b82f6', textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16, display:'inline-block'}}>
            ← Back to Shop Dashboard
          </Link>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <h1 style={{fontSize:28, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>🏢 Parts Distributor Network</h1>
              <p style={{fontSize:14, color:'#9aa3b2'}}>Compare prices across major automotive parts suppliers</p>
            </div>
            <div style={{display:'flex', gap:12}}>
              <button onClick={() => setShowDistributorModal(true)} style={{padding:'10px 20px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}>
                Manage Distributors
              </button>
              {cartCount > 0 && (
                <button onClick={handleCheckout} style={{padding:'10px 20px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', position:'relative'}}>
                  🛒 Checkout ({cartCount}) - ${cartTotal.toFixed(2)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1600, margin:'0 auto', padding:32}}>
        {/* Distributor Overview */}
        <div style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:24, marginBottom:32}}>
          <h2 style={{fontSize:18, fontWeight:700, color:'#e5e7eb', marginBottom:16}}>Active Distributors</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:16}}>
            {distributors.map(dist => {
              const distributorUrls: Record<string, string> = {
                'napa': 'https://www.napaonline.com',
                'autozone': 'https://www.autozone.com/commercial',
                'oreilly': 'https://www.oreillyauto.com',
                'worldpac': 'https://www.worldpac.com',
                'carquest': 'https://www.carquest.com'
              };
              
              return (
                <a 
                  key={dist.id} 
                  href={distributorUrls[dist.id]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display:'block',
                    background:'rgba(255,255,255,0.05)', 
                    border:'1px solid rgba(255,255,255,0.1)', 
                    borderRadius:8, 
                    padding:16,
                    textDecoration:'none',
                    transition:'all 0.2s',
                    cursor:'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
                    <span style={{fontSize:32}}>{dist.logo}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14, fontWeight:700, color:'#e5e7eb'}}>{dist.name}</div>
                      <div style={{fontSize:11, color:'#9aa3b2'}}>⭐ {dist.rating} • {dist.deliveryTime}</div>
                    </div>
                  </div>
                  <div style={{fontSize:11, color:'#6b7280', marginBottom:8}}>
                    {dist.accountNumber ? `Account: ${dist.accountNumber}` : 'No account linked'}
                  </div>
                  <div style={{fontSize:11, color:'#3b82f6', fontWeight:600}}>
                    Visit Website →
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Distributor Management Modal */}
      {showDistributorModal && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:600, width:'90%', maxHeight:'80vh', overflow:'auto'}}>
            <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:24}}>Manage Distributor Accounts</h2>
            
            {distributors.map(dist => (
              <div key={dist.id} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:20, marginBottom:16}}>
                <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
                  <span style={{fontSize:32}}>{dist.logo}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:16, fontWeight:700, color:'#e5e7eb'}}>{dist.name}</div>
                    <div style={{fontSize:12, color:'#9aa3b2'}}>⭐ {dist.rating} rating</div>
                  </div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12, fontSize:12, color:'#9aa3b2'}}>
                  <div>Delivery: {dist.deliveryTime}</div>
                  <div>Min Order: ${dist.minOrder}</div>
                  <div>Shipping: ${dist.shippingCost}</div>
                  <div>Account: {dist.accountNumber || 'Not Set'}</div>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <button style={{flex:1, padding:'8px', background:'rgba(59,130,246,0.2)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>
                    {dist.accountNumber ? 'Edit Account' : 'Link Account'}
                  </button>
                  <button style={{padding:'8px 16px', background:'rgba(34,197,94,0.2)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>
                    View Catalog
                  </button>
                </div>
              </div>
            ))}

            <button onClick={() => setShowDistributorModal(false)} style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', marginTop:16}}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Vehicle Lookup Modal */}
      {showVehicleModal && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:500, width:'90%'}}>
            <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>🚗 Vehicle Lookup</h2>
            <p style={{fontSize:13, color:'#9aa3b2', marginBottom:24}}>Enter vehicle details to find compatible parts</p>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Year *</label>
              <input 
                type="text" 
                value={vehicleInfo.year} 
                onChange={(e) => setVehicleInfo({...vehicleInfo, year: e.target.value})} 
                placeholder="e.g., 2019" 
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}} 
              />
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Make *</label>
              <input 
                type="text" 
                value={vehicleInfo.make} 
                onChange={(e) => setVehicleInfo({...vehicleInfo, make: e.target.value})} 
                placeholder="e.g., Honda, Toyota, Ford" 
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}} 
              />
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Model *</label>
              <input 
                type="text" 
                value={vehicleInfo.model} 
                onChange={(e) => setVehicleInfo({...vehicleInfo, model: e.target.value})} 
                placeholder="e.g., Civic, Camry, F-150" 
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}} 
              />
            </div>

            <div style={{marginBottom:24}}>
              <label style={{display:'block', fontSize:13, color:'#9aa3b2', marginBottom:8}}>Engine (Optional)</label>
              <input 
                type="text" 
                value={vehicleInfo.engine} 
                onChange={(e) => setVehicleInfo({...vehicleInfo, engine: e.target.value})} 
                placeholder="e.g., 2.0L Turbo, 3.5L V6" 
                style={{width:'100%', padding:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e5e7eb', fontSize:14}} 
              />
            </div>

            <div style={{display:'flex', gap:12}}>
              <button 
                onClick={() => {
                  setShowVehicleModal(false);
                  setVehicleInfo({ year: '', make: '', model: '', engine: '' });
                }} 
                style={{flex:1, padding:'12px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                Cancel
              </button>
              <button 
                onClick={handleVehicleLookup}
                disabled={!vehicleInfo.year || !vehicleInfo.make || !vehicleInfo.model}
                style={{flex:1, padding:'12px', background:(!vehicleInfo.year || !vehicleInfo.make || !vehicleInfo.model) ? 'rgba(34,197,94,0.3)' : '#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:(!vehicleInfo.year || !vehicleInfo.make || !vehicleInfo.model) ? 'not-allowed' : 'pointer'}}
              >
                Next: Select Part Type →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Part Type Selection Modal */}
      {showPartTypeModal && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:600, width:'90%', maxHeight:'80vh', overflowY:'auto'}}>
            <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>🔧 What part do you need?</h2>
            <p style={{fontSize:14, color:'#22c55e', fontWeight:600, marginBottom:4}}>
              {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model} {vehicleInfo.engine}
            </p>
            <p style={{fontSize:13, color:'#9aa3b2', marginBottom:24}}>Select the type of part you're looking for</p>

            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12, marginBottom:24}}>
              {partCategories.map((category, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePartTypeSelection(category.name)}
                  style={{
                    padding:'16px',
                    background:'rgba(59,130,246,0.1)',
                    border:'1px solid rgba(59,130,246,0.3)',
                    borderRadius:8,
                    color:'#3b82f6',
                    fontSize:14,
                    fontWeight:600,
                    cursor:'pointer',
                    textAlign:'left',
                    transition:'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.2)';
                    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <button 
              onClick={() => {
                setShowPartTypeModal(false);
                setShowVehicleModal(true);
              }} 
              style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
            >
              ← Back to Vehicle Info
            </button>
          </div>
        </div>
      )}

      {/* Search Results Modal */}
      {showResultsModal && searchResults.length > 0 && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, overflowY:'auto'}}>
          <div style={{background:'linear-gradient(135deg, #3d3d3d 0%, #4a4a4a 50%, #525252 100%)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:16, padding:32, maxWidth:1200, width:'100%', maxHeight:'90vh', overflowY:'auto'}}>
            {/* Header */}
            <div style={{marginBottom:24, borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:20}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                  <h2 style={{fontSize:24, fontWeight:700, color:'#e5e7eb', marginBottom:8}}>
                    {searchType === 'vehicle' ? `🚗 ${selectedPartType} Results` : '🔍 Part Search Results'}
                  </h2>
                  {searchType === 'vehicle' && vehicleInfo.year && (
                    <p style={{fontSize:14, color:'#22c55e', fontWeight:600}}>
                      {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model} {vehicleInfo.engine}
                    </p>
                  )}
                  <p style={{fontSize:13, color:'#9aa3b2', marginTop:4}}>
                    Found {searchResults.length} matching part{searchResults.length > 1 ? 's' : ''} • Compare prices from all vendors
                  </p>
                </div>
                <button 
                  onClick={() => setShowResultsModal(false)} 
                  style={{padding:'8px 16px', background:'rgba(229,51,42,0.2)', color:'#e5332a', border:'1px solid rgba(229,51,42,0.3)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Parts List */}
            <div style={{display:'flex', flexDirection:'column', gap:20}}>
              {searchResults.map((part, idx) => {
                const bestPrice = getBestPrice(part.prices);
                const needsReorder = part.myStock <= part.reorderLevel;

                return (
                  <div key={idx} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:20}}>
                    {/* Part Info */}
                    <div style={{marginBottom:16}}>
                      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:8}}>
                        <h3 style={{fontSize:18, fontWeight:700, color:'#e5e7eb'}}>{part.partName}</h3>
                        {needsReorder && (
                          <span style={{padding:'4px 10px', background:'rgba(229,51,42,0.2)', color:'#e5332a', borderRadius:6, fontSize:11, fontWeight:700}}>
                            ⚠️ LOW STOCK
                          </span>
                        )}
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'auto auto auto auto', gap:16, fontSize:12, color:'#9aa3b2', marginBottom:8}}>
                        <div><strong style={{color:'#3b82f6'}}>Part #:</strong> {part.partNumber}</div>
                        <div><strong style={{color:'#22c55e'}}>Mfg:</strong> {part.manufacturer}</div>
                        <div><strong style={{color:'#f59e0b'}}>Category:</strong> {part.category}</div>
                        <div>My Stock: <strong style={{color: part.myStock <= part.reorderLevel ? '#e5332a' : '#22c55e'}}>{part.myStock}</strong></div>
                      </div>
                      <div style={{fontSize:12, color:'#8b5cf6', fontWeight:600}}>
                        📋 {part.fitmentInfo}
                      </div>
                    </div>

                    {/* Vendor Prices */}
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12}}>
                      {part.prices.map((price, pidx) => {
                        const dist = getDistributor(price.distributorId);
                        const isBest = price === bestPrice;
                        
                        return (
                          <div 
                            key={pidx} 
                            style={{
                              background: isBest ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', 
                              border: isBest ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.1)', 
                              borderRadius:8, 
                              padding:12,
                              position:'relative'
                            }}
                          >
                            {isBest && (
                              <div style={{position:'absolute', top:-10, right:8, background:'#22c55e', color:'white', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700}}>
                                BEST PRICE
                              </div>
                            )}
                            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
                              <span style={{fontSize:20}}>{dist?.logo}</span>
                              <div style={{flex:1}}>
                                <div style={{fontSize:11, fontWeight:700, color:'#e5e7eb'}}>{dist?.name}</div>
                              </div>
                            </div>
                            <div style={{fontSize:20, fontWeight:700, color:'#22c55e', marginBottom:8}}>
                              ${price.price.toFixed(2)}
                            </div>
                            <div style={{fontSize:11, marginBottom:8}}>
                              <span style={{...getStockBadge(price.stock), padding:'3px 8px', borderRadius:4, fontWeight:600}}>
                                {price.stock}
                              </span>
                            </div>
                            <div style={{fontSize:10, color:'#9aa3b2', marginBottom:12}}>
                              🚚 {price.delivery}
                            </div>
                            <button 
                              onClick={() => {
                                handleAddToCart(price.distributorId, part.partName, price.price, part.partNumber);
                              }}
                              disabled={price.stock === 'Out of Stock'}
                              style={{
                                width:'100%', 
                                padding:'8px', 
                                background: price.stock === 'Out of Stock' ? 'rgba(255,255,255,0.1)' : '#3b82f6', 
                                color: price.stock === 'Out of Stock' ? '#6b7280' : 'white', 
                                border:'none', 
                                borderRadius:6, 
                                fontSize:12, 
                                fontWeight:600, 
                                cursor: price.stock === 'Out of Stock' ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {price.stock === 'Out of Stock' ? 'Not Available' : '🛒 Add to Cart'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div style={{marginTop:24, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.1)', display:'flex', gap:12, justifyContent:'space-between'}}>
              <button 
                onClick={() => setShowResultsModal(false)} 
                style={{flex:1, padding:'12px', background:'rgba(255,255,255,0.1)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
              >
                Continue Shopping
              </button>
              {cartCount > 0 && (
                <button 
                  onClick={() => {
                    setShowResultsModal(false);
                    handleCheckout();
                  }} 
                  style={{flex:1, padding:'12px', background:'#22c55e', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer'}}
                >
                  🛒 Checkout ({cartCount} items) - ${cartTotal.toFixed(2)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
