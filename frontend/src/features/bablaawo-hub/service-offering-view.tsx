import React, { useState } from 'react';
import { Plus, Edit, Trash2, Clock, Tag, Users, AlertTriangle } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  maxParticipants?: number;
  isActive: boolean;
}

const ServiceOfferingView: React.FC = () => {
  const [services, setServices] = useState<Service[]>([
    {
      id: '1',
      title: 'Divination (Dafa)',
      description: 'Traditional Ifa divination ceremony using sacred palm nuts',
      price: 15000,
      duration: 60,
      category: 'Divination',
      isActive: true
    },
    {
      id: '2',
      title: 'Spiritual Cleansing',
      description: 'Ritual cleansing to remove negative energies and obstacles',
      price: 10000,
      duration: 90,
      category: 'Cleansing',
      isActive: true
    },
    {
      id: '3',
      title: 'Naming Ceremony',
      description: 'Traditional Yoruba naming ceremony for newborns',
      price: 25000,
      duration: 120,
      category: 'Ceremony',
      maxParticipants: 10,
      isActive: true
    },
    {
      id: '4',
      title: 'Marriage Blessing',
      description: 'Traditional Ifa marriage blessing ritual',
      price: 30000,
      duration: 180,
      category: 'Ceremony',
      maxParticipants: 2,
      isActive: false
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  const [formData, setFormData] = useState<Omit<Service, 'id'>>({
    title: '',
    description: '',
    price: 0,
    duration: 30,
    category: '',
    isActive: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(val) : val
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingService) {
      // Update existing service
      setServices(prev => prev.map(service => 
        service.id === editingService.id ? { ...formData, id: editingService.id } : service
      ));
      setEditingService(null);
    } else {
      // Add new service
      const newService: Service = {
        ...formData,
        id: Date.now().toString()
      };
      setServices(prev => [...prev, newService]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: 0,
      duration: 30,
      category: '',
      isActive: true
    });
    setShowAddForm(false);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      isActive: service.isActive,
      maxParticipants: service.maxParticipants
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      setServices(prev => prev.filter(service => service.id !== id));
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">
            Service Offerings
          </h1>
          <p className="text-stone-600">
            Manage your spiritual services and offerings
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingService(null);
            resetForm();
            setShowAddForm(true);
          }}
          className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-green-800 transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Add Service
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Total Services</p>
              <h3 className="text-2xl font-bold text-stone-900">{services.length}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Tag size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Active Services</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {services.filter(s => s.isActive).length}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-xl text-green-700">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-600 text-sm">Avg. Price</p>
              <h3 className="text-2xl font-bold text-stone-900">
                {formatCurrency(services.reduce((sum, service) => sum + service.price, 0) / services.length || 0)}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
              <Tag size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {services.length > 0 ? (
          services.map((service) => (
            <div 
              key={service.id} 
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                service.isActive ? 'border-stone-200' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg text-stone-900">{service.title}</h3>
                      {!service.isActive && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-stone-600 mt-1">{service.description}</p>
                    
                    <div className="flex flex-wrap gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm text-stone-600">
                        <Tag size={14} /> {formatCurrency(service.price)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-stone-600">
                        <Clock size={14} /> {service.duration} min
                      </div>
                      <div className="flex items-center gap-1 text-sm text-stone-600">
                        <Tag size={14} /> {service.category}
                      </div>
                      {service.maxParticipants && (
                        <div className="flex items-center gap-1 text-sm text-stone-600">
                          <Users size={14} /> Max {service.maxParticipants} people
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(service)}
                      className="p-2 bg-stone-100 rounded-xl hover:bg-stone-200 text-stone-700"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(service.id)}
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
            <Tag size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-2">No services offered</h3>
            <p className="text-stone-600 max-w-md mx-auto">
              Start adding your spiritual services to offer to seekers
            </p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-800 transition-colors"
            >
              Add Your First Service
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Service Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-stone-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
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
                <label className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
                  placeholder="Service title"
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
                  placeholder="Describe your service"
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
                  <label className="block text-sm font-medium text-stone-700 mb-1">Duration (minutes) *</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    min="15"
                    step="15"
                    className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
                    placeholder="30"
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
                    placeholder="e.g. Divination, Cleansing, Ceremony"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Max Participants</label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants || ''}
                    onChange={handleChange}
                    min="1"
                    className="w-full p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-highlight focus:border-transparent"
                    placeholder="Leave blank for 1-on-1 services"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-highlight focus:ring-highlight border-stone-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-stone-900">
                  Service is active
                </label>
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
                  {editingService ? 'Update Service' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOfferingView;