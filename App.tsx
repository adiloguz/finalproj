import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MemoryRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  Settings, 
  Search, 
  Filter, 
  Moon, 
  Sun, 
  ScanLine, 
  Camera, 
  Trash2, 
  Edit, 
  AlertTriangle,
  Download,
  Upload,
  AlertCircle,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Product, Category, SortOption, Stats } from './types';
import { getStoredProducts, saveProducts, exportData, compressImage } from './services/storage';
import Scanner from './components/Scanner';

// --- Constants ---
const CATEGORIES: Category[] = [
  'Süt ve Kahvaltılık', 'Et ve Tavuk', 'Meyve ve Sebze', 
  'İçecekler', 'Atıştırmalık', 'Temizlik', 'Diğer'
];

// --- Components ---

// 1. Sidebar / Navigation
const Navbar = ({ toggleTheme, isDark, toggleSidebar }: { toggleTheme: () => void, isDark: boolean, toggleSidebar: () => void }) => {
  return (
    <nav className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="md:hidden p-2 text-gray-600 dark:text-gray-300">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <ScanLine size={28} />
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">MarketTakip</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
  );
};

const Sidebar = ({ isOpen, close, currentPath }: { isOpen: boolean, close: () => void, currentPath: string }) => {
  const links = [
    { path: '/', icon: LayoutDashboard, label: 'Panel' },
    { path: '/products', icon: Package, label: 'Envanter' },
    { path: '/notifications', icon: AlertCircle, label: 'Bildirimler' },
    { path: '/add', icon: PlusCircle, label: 'Ürün Ekle' },
    { path: '/settings', icon: Settings, label: 'Ayarlar' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={close}></div>
      )}
      
      <aside className={`
        fixed top-16 left-0 bottom-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => { if(window.innerWidth < 768) close(); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${currentPath === link.path 
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
              `}
            >
              <link.icon size={20} />
              {link.label}
            </Link>
          ))}
        </div>
        
        <div className="absolute bottom-4 left-4 right-4">
           <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl border border-brand-100 dark:border-brand-900/50">
             <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mb-1">Pro Sürüm</p>
             <p className="text-xs text-gray-500 dark:text-gray-400">Bulut senkronizasyonu için yükseltin.</p>
           </div>
        </div>
      </aside>
    </>
  );
};

// 2. Dashboard Page
const Dashboard = ({ stats, data }: { stats: Stats, data: Product[] }) => {
  // Prepare chart data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Genel Bakış</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Toplam Ürün" 
          value={stats.totalProducts} 
          icon={Package} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Kritik (3 Gün)" 
          value={stats.criticalCount} 
          icon={AlertTriangle} 
          color="bg-red-500" 
        />
        <StatCard 
          title="Yaklaşan (7 Gün)" 
          value={stats.warningCount} 
          icon={AlertCircle} 
          color="bg-orange-500" 
        />
        <StatCard 
          title="Stok Miktarı" 
          value={stats.totalQuantity} 
          icon={LayoutDashboard} 
          color="bg-green-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">Kategori Dağılımı</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" hide />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Son Eklenenler</h3>
            <Link to="/products" className="text-sm text-brand-600 hover:text-brand-500">Tümünü Gör</Link>
          </div>
          <div className="space-y-4">
            {data.slice(0, 5).map(product => (
              <div key={product.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                  {product.image ? (
                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                </div>
                <div className="text-right">
                   <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.quantity} Adet</p>
                </div>
              </div>
            ))}
            {data.length === 0 && <p className="text-gray-500 text-center py-4">Henüz ürün eklenmedi.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
      <Icon className={`text-${color.split('-')[1]}-500`} size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

// 3. Products List Page
const ProductList = ({ products, onDelete }: { products: Product[], onDelete: (id: string) => void }) => {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.ExpiryAsc);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => 
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)) &&
      (filterCat === 'all' || p.category === filterCat)
    );

    switch (sortOption) {
      case SortOption.ExpiryAsc:
        result.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
        break;
      case SortOption.ExpiryDesc:
        result.sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime());
        break;
      case SortOption.NameAsc:
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case SortOption.QuantityDesc:
        result.sort((a, b) => b.quantity - a.quantity);
        break;
    }
    return result;
  }, [products, search, filterCat, sortOption]);

  const getDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Stok Envanteri</h2>
        <Link to="/add" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-md transition-colors">
          <PlusCircle size={18} />
          Yeni Ürün
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="İsim veya barkod ile ara..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="md:col-span-4 relative">
          <select 
            className="w-full pl-4 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg appearance-none focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="all">Tüm Kategoriler</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>

        <div className="md:col-span-3 relative">
          <select 
             className="w-full pl-4 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg appearance-none focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white"
             value={sortOption}
             onChange={(e) => setSortOption(e.target.value as SortOption)}
          >
            <option value={SortOption.ExpiryAsc}>SKT (Önce Yakın)</option>
            <option value={SortOption.ExpiryDesc}>SKT (Önce Uzak)</option>
            <option value={SortOption.NameAsc}>İsim (A-Z)</option>
            <option value={SortOption.QuantityDesc}>Miktar (Azalan)</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.map(product => {
          const days = getDaysRemaining(product.expiryDate);
          let statusColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
          if (days < 0) statusColor = "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
          else if (days <= 3) statusColor = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
          else if (days <= 7) statusColor = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";

          return (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="relative h-48 bg-gray-100 dark:bg-gray-900">
                {product.image ? (
                   <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package size={48} opacity={0.5} />
                  </div>
                )}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${statusColor}`}>
                   {days < 0 ? 'SÜRESİ DOLDU' : `${days} Gün Kaldı`}
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                  </div>
                </div>
                
                <div className="mt-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Barkod:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-200">{product.barcode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">SKT:</span>
                    <span className="text-gray-700 dark:text-gray-200">{new Date(product.expiryDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Adet:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{product.quantity}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => onDelete(product.id)} className="flex-1 py-2 flex items-center justify-center gap-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm transition-colors">
                    <Trash2 size={16} /> Sil
                  </button>
                  {/* Edit button could go here */}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <p>Kriterlere uygun ürün bulunamadı.</p>
        </div>
      )}
    </div>
  );
};

// 4. Add Product Page
const AddProduct = ({ onAdd }: { onAdd: (p: Product) => void }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    barcode: '',
    category: 'Diğer',
    quantity: 1,
    expiryDate: '',
  });
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.barcode || !formData.expiryDate) return;

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: formData.name,
      barcode: formData.barcode,
      category: formData.category as Category,
      expiryDate: formData.expiryDate,
      quantity: formData.quantity || 1,
      image: image || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAdd(newProduct);
    navigate('/products');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setImage(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {scanning && (
        <Scanner 
          onScan={(code) => {
            setFormData(prev => ({ ...prev, barcode: code }));
            setScanning(false);
          }}
          onClose={() => setScanning(false)}
        />
      )}

      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Yeni Ürün Ekle</h2>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
        
        {/* Barcode Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Barkod</label>
          <div className="flex gap-2">
            <input 
              required
              type="text" 
              className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
              value={formData.barcode}
              onChange={e => setFormData({...formData, barcode: e.target.value})}
              placeholder="00000000"
            />
            <button 
              type="button"
              onClick={() => setScanning(true)}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <ScanLine size={18} /> Tara
            </button>
          </div>
        </div>

        {/* Image Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ürün Fotoğrafı</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
              {image ? (
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera size={32} className="text-gray-400" />
              )}
            </div>
            <div className="flex flex-col gap-2">
               {/* Mobile Camera Capture */}
               <input 
                 type="file" 
                 accept="image/*" 
                 capture="environment"
                 className="hidden" 
                 ref={cameraInputRef}
                 onChange={handleImageUpload}
               />
               <button 
                 type="button"
                 onClick={() => cameraInputRef.current?.click()}
                 className="px-4 py-2 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-lg text-sm font-medium hover:bg-brand-200 dark:hover:bg-brand-900/50 transition-colors"
               >
                 Fotoğraf Çek
               </button>
               
               {/* Gallery Upload */}
               <input 
                 type="file" 
                 accept="image/*" 
                 className="hidden" 
                 ref={fileInputRef}
                 onChange={handleImageUpload}
               />
               <button 
                 type="button"
                 onClick={() => fileInputRef.current?.click()}
                 className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
               >
                 Galeriden Seç
               </button>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ürün Adı</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
            <select 
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value as Category})}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Son Kullanma Tarihi</label>
            <input 
              required
              type="date" 
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
              value={formData.expiryDate}
              onChange={e => setFormData({...formData, expiryDate: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adet</label>
            <input 
              type="number" 
              min="1"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
            />
          </div>
        </div>

        <div className="pt-4 flex gap-4">
           <button 
             type="button" 
             onClick={() => navigate('/products')}
             className="flex-1 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
           >
             İptal
           </button>
           <button 
             type="submit" 
             className="flex-1 py-3 text-white bg-brand-600 rounded-xl font-medium hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all transform hover:scale-[1.02]"
           >
             Ürünü Kaydet
           </button>
        </div>
      </form>
    </div>
  );
};

// 5. Notifications Page
const Notifications = ({ products }: { products: Product[] }) => {
  const expiringProducts = products
    .filter(p => {
      const days = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return days <= 7;
    })
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bildirim Merkezi</h2>
      
      {expiringProducts.length === 0 ? (
        <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-xl text-center border border-green-100 dark:border-green-900">
           <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-200 mb-4">
             <Package size={32} />
           </div>
           <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Her şey yolunda!</h3>
           <p className="text-green-600 dark:text-green-300 mt-2">Önümüzdeki 7 gün içinde süresi dolacak ürün yok.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {expiringProducts.map(p => {
             const days = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
             const isExpired = days < 0;
             const isCritical = days >= 0 && days <= 3;
             
             return (
               <div key={p.id} className={`p-4 rounded-xl border flex items-center gap-4 shadow-sm
                  ${isExpired 
                    ? 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 opacity-75' 
                    : isCritical 
                      ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/50'
                      : 'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/50'
                  }
               `}>
                 <div className={`p-2 rounded-lg 
                   ${isExpired ? 'bg-gray-200 text-gray-600' : isCritical ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}
                 `}>
                   <AlertTriangle size={24} />
                 </div>
                 <div className="flex-1">
                   <h4 className="font-semibold text-gray-900 dark:text-white">{p.name}</h4>
                   <p className="text-sm text-gray-600 dark:text-gray-300">
                     {isExpired ? `Süresi ${Math.abs(days)} gün önce doldu!` : `${days} gün kaldı`}
                   </p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKT</p>
                    <p className="font-mono font-medium text-gray-700 dark:text-gray-200">
                      {new Date(p.expiryDate).toLocaleDateString('tr-TR')}
                    </p>
                 </div>
               </div>
             )
          })}
        </div>
      )}
    </div>
  );
};

// 6. Settings Page
const SettingsPage = ({ onImport }: { onImport: (file: File) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onImport(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Ayarlar</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Veri Yönetimi</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Verilerinizi yedekleyin veya başka bir cihazdan aktarın.</p>
          
          <div className="flex gap-4 flex-col sm:flex-row">
            <button 
              onClick={() => exportData(getStoredProducts())}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Download size={20} /> Yedekle (Dışa Aktar)
            </button>
            
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImport} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <Upload size={20} /> Geri Yükle (İçe Aktar)
            </button>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Uygulama Hakkında</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>Sürüm: 1.0.0 (Pro)</p>
            <p>Geliştirici Modu: Kapalı</p>
            <p>Yerel Depolama Kullanımı: {(JSON.stringify(getStoredProducts()).length / 1024).toFixed(2)} KB</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main App Component ---

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize
  useEffect(() => {
    const stored = getStoredProducts();
    setProducts(stored);

    // Check system preference for theme
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Theme Toggle
  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  // Add Product
  const handleAddProduct = (product: Product) => {
    const updated = [...products, product];
    setProducts(updated);
    saveProducts(updated);
  };

  // Delete Product
  const handleDeleteProduct = (id: string) => {
    if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      saveProducts(updated);
    }
  };

  // Import Data
  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          setProducts(data);
          saveProducts(data);
          alert('Veriler başarıyla yüklendi.');
        }
      } catch (err) {
        alert('Dosya formatı hatalı.');
      }
    };
    reader.readAsText(file);
  };

  // Stats
  const stats: Stats = useMemo(() => {
    const now = new Date().getTime();
    return {
      totalProducts: products.length,
      totalQuantity: products.reduce((acc, p) => acc + p.quantity, 0),
      expiredCount: products.filter(p => new Date(p.expiryDate).getTime() < now).length,
      criticalCount: products.filter(p => {
        const diff = new Date(p.expiryDate).getTime() - now;
        const days = diff / (1000 * 3600 * 24);
        return days >= 0 && days <= 3;
      }).length,
      warningCount: products.filter(p => {
        const diff = new Date(p.expiryDate).getTime() - now;
        const days = diff / (1000 * 3600 * 24);
        return days > 3 && days <= 7;
      }).length,
    };
  }, [products]);

  // Router wrapper to pass location to sidebar
  const LayoutContent = () => {
    const location = useLocation();
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 font-inter">
        <Navbar toggleTheme={toggleTheme} isDark={isDark} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Sidebar isOpen={isSidebarOpen} close={() => setIsSidebarOpen(false)} currentPath={location.pathname} />
        
        <main className="md:ml-64 p-4 md:p-8 pt-6 min-h-[calc(100vh-4rem)]">
          <Routes>
            <Route path="/" element={<Dashboard stats={stats} data={products} />} />
            <Route path="/products" element={<ProductList products={products} onDelete={handleDeleteProduct} />} />
            <Route path="/add" element={<AddProduct onAdd={handleAddProduct} />} />
            <Route path="/notifications" element={<Notifications products={products} />} />
            <Route path="/settings" element={<SettingsPage onImport={handleImportData} />} />
          </Routes>
        </main>
      </div>
    );
  };

  return (
    <MemoryRouter>
      <LayoutContent />
    </MemoryRouter>
  );
};

export default App;