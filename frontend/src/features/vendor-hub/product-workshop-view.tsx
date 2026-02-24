import React, { useState } from 'react';
import { Package, Image, Hash, Tag, Calendar, Edit, Trash2, Plus, BarChart3 } from 'lucide-react';

interface ProductDraft {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  status: 'draft' | 'published' | 'archived';
  lastModified: string;
  views: number;
  sales: number;
}

const ProductWorkshopView: React.FC = () => {
  const [drafts, setDrafts] = useState<ProductDraft[]>([
    {
      id: 'd1',
      name: 'Ifa Oracle Pendant',
      description: 'Sacred pendant representing the Ifa oracle',
      category: 'Jewelry',
      price: 12000,
      stock: 15,
      status: 'published',
      lastModified: '2024-02-15',
      views: 124,
      sales: 8
    },
    {
      id: 'd2',
      name: 'Traditional Adire Fabric',
      description: 'Handmade Adire fabric for ceremonial wear',
      category: 'Clothing',
      price: 8000,
      stock: 25,
      status: 'draft',
      lastModified: '2024-02-18',
      views: 42,
      sales: 0
    },
    {
      id: 'd3',
      name: 'Sacred Palm Nut Set',
      description: 'Complete set of palm nuts for Ifa divination',
      category: 'Ritual Items',
      price: 15000,
      stock: 0,
      status: 'published',
      lastModified: '2024-02-10',
      views: 87,
      sales: 12
    }
  ]);

  const [activeTab, setActiveTab] = useState<'workshop' | 'analytics' | 'templates'>('workshop');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDraft | null>(null);

  const [formData, setFormData] = useState<Omit<ProductDraft, 'id' | 'lastModified' | 'views' | 'sales'>>({
    name: '',
    description: '',
    category: '',
    price: 0,
    stock: 0,
    status: 'draft'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      // Update existing product
      setDrafts(prev => prev.map(draft => 
        draft.id === editingProduct.id 
          ? { ...formData, id: editingProduct.id, lastModified: new Date().toISOString().split('T')[0], views: draft.views, sales: draft.sales } 
          : draft
      ));
      setEditingProduct(null);
    } else {
      // Add new product
      const newDraft: ProductDraft = {
        ...formData,
        id: `d${Date.now()}`,
        lastModified: new Date().toISOString().split('T')[0],
        views: 0,
        sales: 0
      };
      setDrafts(prev => [...prev, newDraft]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: 0,
      stock: 0,
      status: 'draft'
    });
    setShowCreateForm(false);
  };

  const handleEdit = (draft: ProductDraft) => {
    setEditingProduct(draft);
    setFormData({
      name: draft.name,
      description: draft.description,
      category: draft.category,
      price: draft.price,
      stock: draft.stock,
      status: draft.status
    });
    setShowCreateForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product draft?')) {
      setDrafts(prev => prev.filter(draft => draft.id !== id));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-stone-100 text-stone-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            Product Workshop
          </h1>
          <p className="text-stone-600">
            Create and manage your cultural and spiritual products
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setShowCreateForm(true);
          }}
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-green-800 transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Create Product
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => setActiveTab('workshop')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'workshop'
                ? 'text-highlight border-b-2 border-highlight'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package size={18} className="mx-auto mb-1" /> Workshop
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'analytics'
                ? 'text-highlight border-b-2 border-highlight'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BarChart3 size={18} className="mx-auto mb-1" /> Analytics
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'templates'
                ? 'text-highlight border-b-2 border-highlight'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Hash size={18} className="mx-auto mb-1" /> Templates
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'workshop' && (
          <div className="space-y-4">
            {drafts.length > 0 ? (
              drafts.map((draft) => (
                <div 
                  key={draft.id} 
                  className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg text-stone-900">{draft.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(draft.status)}`}>
                            {draft.status}
                          </span>
                        </div>
                        <p className="text-stone-600 mt-1 text-sm line-clamp-2">{draft.description}</p>
                        
                        <div className="flex flex-wrap gap-4 mt-3">
                          <div className="flex items-center gap-1 text-sm text-stone-600">
                            <Tag size={14} /> {draft.category}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-stone-600">
                            <Hash size={14} /> {formatCurrency(draft.price)}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-stone-600">
                            <Package size={14} /> {draft.stock} in stock
                          </div>
                          <div className="flex items-center gap-1 text-sm text-stone-600">
                            <Calendar size={14} /> {draft.lastModified}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4 md:mt-0">
                        <div className="text-center">
                          <p className="text-xs text-stone-500">Views</p>
                          <p className="font-bold">{draft.views}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-stone-500">Sales</p>
                          <p className="font-bold">{draft.sales}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-stone-500">Value</p>
                          <p className="font-bold">{formatCurrency(draft.price * draft.sales)}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(draft)}
                          className="p-2 bg-stone-100 rounded-xl hover:bg-stone-200 text-stone-700"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(draft.id)}
                          className="p-2 bg-red-100 rounded-xl hover:bg-red-200 text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-12 text-center">
                <Package size={48} className="mx-auto text-stone-300 mb-4" />
                <h3 className="text-lg font-bold text-stone-900 mb-2">No products in workshop</h3>
                <p className="text-stone-600 max-w-md mx-auto">
                  Start creating your cultural and spiritual products
                </p>
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-800 transition-colors"
                >
                  Create Your First Product
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-stone-900 mb-6">Product Performance Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-stone-50 p-4 rounded-xl">
                <p className="text-stone-600 text-sm">Total Views</p>
                <p className="text-2xl font-bold text-stone-900">
                  {drafts.reduce((sum, draft) => sum + draft.views, 0)}
                </p>
              </div>
              <div className="bg-stone-50 p-4 rounded-xl">
                <p className="text-stone-600 text-sm">Total Sales</p>
                <p className="text-2xl font-bold text-stone-900">
                  {drafts.reduce((sum, draft) => sum + draft.sales, 0)}
                </p>
              </div>
              <div className="bg-stone-50 p-4 rounded-xl">
                <p className="text-stone-600 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-stone-900">
                  {formatCurrency(drafts.reduce((sum, draft) => sum + (draft.price * draft.sales), 0))}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-bold text-stone-800">Top Performing Products</h3>
              {drafts
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 3)
                .map((draft) => (
                  <div key={draft.id} className="flex justify-between items-center p-4 border border-stone-200 rounded-xl">
                    <div>
                      <h4 className="font-bold text-stone-900">{draft.name}</h4>
                      <p className="text-stone-600 text-sm">{draft.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{draft.sales} sales</p>
                      <p className="text-stone-600 text-sm">{formatCurrency(draft.price * draft.sales)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-stone-900 mb-6">Product Templates</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-stone-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package size={20} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-stone-900">Ritual Items</h3>
                </div>
                <p className="text-stone-600 text-sm mb-4">
                  Template for sacred objects, divination tools, and spiritual artifacts
                </p>
                <button className="w-full py-2 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200">
                  Use Template
                </button>
              </div>
              
              <div className="border border-stone-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Image size={20} className="text-green-700" />
                  </div>
                  <h3 className="font-bold text-stone-900">Clothing & Textiles</h3>
                </div>
                <p className="text-stone-600 text-sm mb-4">
                  Template for traditional garments, fabrics, and ceremonial attire
                </p>
                <button className="w-full py-2 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200">
                  Use Template
                </button>
              </div>
              
              <div className="border border-stone-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Hash size={20} className="text-amber-700" />
                  </div>
                  <h3 className="font-bold text-stone-900">Jewelry & Accessories</h3>
                </div>
                <p className="text-stone-600 text-sm mb-4">
                  Template for spiritual jewelry, ornaments, and sacred accessories
                </p>
                <button className="w-full py-2 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200">
                  Use Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Product Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-stone-900">
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h3>
              <button 
                onClick={resetForm}
                className="text-stone-500 hover:text-stone-700"
              >
                <Trash2 size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
                  placeholder="Product name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
                  placeholder="Describe your product"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Category *</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
                    placeholder="e.g. Ritual Items, Clothing, Jewelry"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Price (NGN) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
                    placeholder="Quantity in stock"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 border border-stone-300 text-stone-700 rounded-xl font-bold hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-green-800 transition-colors"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductWorkshopView;