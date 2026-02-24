import React, { useState } from 'react';
import { Edit, Plus, Trash2, Save, X } from 'lucide-react';

interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number; // in naira
  isActive: boolean;
  category: string;
  maxSessionsPerDay?: number;
}

const ServiceOfferingView: React.FC = () => {
  const [services, setServices] = useState<ServiceOffering[]>([
    {
      id: '1',
      name: 'Spiritual Consultation',
      description: 'One-on-one consultation to address your spiritual concerns and seek guidance',
      duration: 60,
      price: 15000,
      isActive: true,
      category: 'Consultation',
      maxSessionsPerDay: 3
    },
    {
      id: '2',
      name: 'Ancestral Healing',
      description: 'Specialized healing session connecting with ancestral wisdom',
      duration: 90,
      price: 25000,
      isActive: true,
      category: 'Healing',
      maxSessionsPerDay: 2
    },
    {
      id: '3',
      name: 'Cultural Education',
      description: 'Learn about Yoruba traditions, customs, and spiritual practices',
      duration: 45,
      price: 10000,
      isActive: false,
      category: 'Education'
    }
  ]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newService, setNewService] = useState<Omit<ServiceOffering, 'id'>>({
    name: '',
    description: '',
    duration: 30,
    price: 5000,
    isActive: true,
    category: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = (_id: string) => {
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewService({
      name: '',
      description: '',
      duration: 30,
      price: 5000,
      isActive: true,
      category: ''
    });
    setShowAddForm(false);
  };

  const handleAddService = () => {
    const serviceToAdd = {
      ...newService,
      id: `service-${Date.now()}`
    };
    setServices([...services, serviceToAdd]);
    handleCancel();
  };

  const handleDelete = (id: string) => {
    setServices(services.filter(service => service.id !== id));
  };

  const updateServiceField = (id: string, field: keyof ServiceOffering, value: any) => {
    setServices(services.map(service => 
      service.id === id ? { ...service, [field]: value } : service
    ));
  };

  const getServicePrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold brand-font text-stone-900">Service Offerings</h1>
          <p className="text-stone-600 text-lg mt-1">
            Manage your spiritual services and offerings
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-highlight text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Add New Service
        </button>
      </div>

      {/* Add New Service Form */}
      {showAddForm && (
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Add New Service</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
              <input
                type="text"
                value={newService.name}
                onChange={(e) => setNewService({...newService, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                placeholder="Enter service name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={newService.category}
                onChange={(e) => setNewService({...newService, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                placeholder="e.g., Consultation, Healing, Education"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={newService.duration}
                onChange={(e) => setNewService({...newService, duration: parseInt(e.target.value) || 30})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                min="15"
                step="15"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
              <input
                type="number"
                value={newService.price}
                onChange={(e) => setNewService({...newService, price: parseInt(e.target.value) || 5000})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                min="1000"
                step="1000"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newService.description}
                onChange={(e) => setNewService({...newService, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                rows={3}
                placeholder="Describe your service..."
              />
            </div>
            
            <div className="md:col-span-2 flex items-center">
              <input
                type="checkbox"
                id="isActiveNew"
                checked={newService.isActive}
                onChange={(e) => setNewService({...newService, isActive: e.target.checked})}
                className="h-4 w-4 text-highlight focus:ring-highlight border-gray-300 rounded"
              />
              <label htmlFor="isActiveNew" className="ml-2 block text-sm text-gray-700">
                Active Service
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <X size={16} /> Cancel
            </button>
            <button
              onClick={handleAddService}
              disabled={!newService.name || !newService.description}
              className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${
                !newService.name || !newService.description 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-highlight hover:bg-yellow-600'
              }`}
            >
              <Save size={16} /> Add Service
            </button>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="space-y-6">
        {services.map((service) => (
          <div key={service.id} className="border rounded-xl p-6 bg-white shadow-sm">
            {editingId === service.id ? (
              // Edit Mode
              <div>
                <h3 className="text-xl font-semibold mb-4">Edit Service</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => updateServiceField(service.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={service.category}
                      onChange={(e) => updateServiceField(service.id, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      value={service.duration}
                      onChange={(e) => updateServiceField(service.id, 'duration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                      min="15"
                      step="15"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                    <input
                      type="number"
                      value={service.price}
                      onChange={(e) => updateServiceField(service.id, 'price', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                      min="1000"
                      step="1000"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={service.description}
                      onChange={(e) => updateServiceField(service.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-highlight focus:border-highlight"
                      rows={3}
                    />
                  </div>
                  
                  <div className="md:col-span-2 flex items-center">
                    <input
                      type="checkbox"
                      id={`isActive-${service.id}`}
                      checked={service.isActive}
                      onChange={(e) => updateServiceField(service.id, 'isActive', e.target.checked)}
                      className="h-4 w-4 text-highlight focus:ring-highlight border-gray-300 rounded"
                    />
                    <label htmlFor={`isActive-${service.id}`} className="ml-2 block text-sm text-gray-700">
                      Active Service
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button
                    onClick={() => handleSave(service.id)}
                    className="px-4 py-2 bg-highlight text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{service.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(service.id)}
                      className="p-2 text-gray-500 hover:text-highlight hover:bg-gray-100 rounded-lg"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <p className="mt-4 text-gray-700">{service.description}</p>
                
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold">{service.duration} min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="font-semibold">{getServicePrice(service.price)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Sessions/Day</p>
                    <p className="font-semibold">{service.maxSessionsPerDay || 'Unlimited'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`font-semibold ${
                      service.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {service.isActive ? 'Available' : 'Hidden'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceOfferingView;