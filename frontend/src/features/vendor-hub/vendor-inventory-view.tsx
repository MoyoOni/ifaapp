import React, { useState } from 'react';
import { Plus, Edit, Trash2, ShoppingCart, Tag, DollarSign, Package, AlertTriangle, CheckCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  status: 'active' | 'out-of-stock' | 'archived';
  images?: string[];
  tags: string[];
}

const VendorInventoryView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Ifa Divination Chain',
      description: 'Sacred chain used for Ifa divination rituals',
      price: 25000,
      stock: 12,
      category: 'Ritual Items',
      status: 'active',
      tags: ['sacred', 'divination', 'traditional']
    },
    {
      id: '2',
      name: 'Palm Nut Divination Set',
      description: 'Complete set of palm nuts for Ifa divination',
      price: 15000,
      stock: 0,
      category: 'Divination Tools',
      status: 'out-of-stock',
      tags: ['palm nuts', 'divination', 'ritual']
    },
    {
      id: '3',
      name: 'Traditional Adire Fabric',
      description: 'Handmade Adire fabric for ceremonial wear',
      price: 8000,
      stock: 25,
      category: 'Clothing',
      status: 'active',
      tags: ['clothing', 'ceremony', 'traditional']
    },
    {
      id: '4',
      name: 'Ifa Oracle Pendant',
      description: 'Ornamental pendant representing the Ifa oracle',
      price: 12000,
      stock: 8,
      category: 'Jewelry',
      status: 'active',
      tags: ['ornamental', 'jewelry', 'spiritual']
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    status: 'active',
    tags: []
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }));
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      // Update existing product
      setProducts(prev => prev.map(product => 
        product.id === editingProduct.id ? { ...formData, id: editingProduct.id } : product
      ));
      setEditingProduct(null);
    } else {
      // Add new product
      const newProduct: Product = {
        ...formData,
        id: Date.now().toString(),
        images: []
      };
      setProducts(prev => [...prev, newProduct]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: '',
      status: 'active',
      tags: []
    });
    setShowAddForm(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      status: product.status,
      tags: product.tags
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      setProducts(prev => prev.filter(product => product.id !== id));
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
      case 'active': return 'bg-green-100 text-green-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-stone-100 text-stone-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            Inventory Management
          </h1>
          <p className="text-stone-600">
            Manage your cultural and spiritual products
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setShowAddForm(true);
          }}
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-green-800 transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Total Products</p>
              <h3 className="text-2xl font-bold text-stone-900">{products.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Package size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">In Stock</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {products.filter(p => p.status === 'active').length}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-xl text-green-700">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Out of Stock</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {products.filter(p => p.status === 'out-of-stock').length}
              </h3>
            </div>
            <div className="p-3 bg-red-100 rounded-xl text-red-700">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Avg. Price</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {formatCurrency(products.reduce((sum, product) => sum + product.price, 0) / products.length || 0)}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {products.length > 0 ? (
          products.map((product) => (
            <div 
              key={product.id} 
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                product.status === 'active' ? 'border-stone-200' : 
                product.status === 'out-of-stock' ? 'border-red-200 bg-red-50' : 
                'border-stone-200 bg-stone-50'
              }`}
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg text-stone-900">{product.name}</h3>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(product.status)}`}>
                        {product.status.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-stone-600 mt-1">{product.description}</p>
                    
                    <div className="flex flex-wrap gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm text-stone-600">
                        <DollarSign size={14} /> {formatCurrency(product.price)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-stone-600">
                        <Package size={14} /> {product.stock} in stock
                      </div>
                      <div className="flex items-center gap-1 text-sm text-stone-600">
                        <Tag size={14} /> {product.category}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="p-2 bg-stone-100 rounded-xl hover:bg-stone-200 text-stone-700"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
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
            <ShoppingCart size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">No products in inventory</h3>
            <p className="text-stone-600 max-w-md mx-auto">
              Start adding your cultural and spiritual products to sell
            </p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-800 transition-colors"
            >
              Add Your First Product
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-stone-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
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
                  <label className="block text-sm font-medium text-stone-700 mb-1">Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="out-of-stock">Out of Stock</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags.join(',')}
                  onChange={handleTagChange}
                  className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
                  placeholder="e.g. sacred, traditional, divination"
                />
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
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInventoryView;