'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface FormData {
  name: string;
  price: string;
  duration_minutes: string;
}

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({ 
    name: '', 
    price: '', 
    duration_minutes: '' 
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching services:', error);
        setError(error.message);
      } else {
        setServices(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDelete = async (serviceId: string) => {
    if (confirm(`Are you sure you want to delete this service?`)) {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      try {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', serviceId);

        if (error) {
          setError('Failed to delete service. It may be in use by appointments.');
          console.error('Error deleting service:', error);
        } else {
          setSuccessMessage('Service deleted successfully');
          await fetchServices();
        }
      } catch (err: any) {
        console.error('Unexpected error deleting service:', err);
        setError(err?.message || 'An unexpected error occurred while deleting');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEdit = (service: Service) => {
    setEditingServiceId(service.id);
    setFormData({
      name: service.name,
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString()
    });
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const { name, price, duration_minutes } = formData;
      const priceNumber = parseFloat(price);
      const durationNumber = parseInt(duration_minutes);

      if (isNaN(priceNumber)) {
        setError('Please enter a valid price');
        setIsSubmitting(false);
        return;
      }

      if (isNaN(durationNumber) || durationNumber <= 0) {
        setError('Please enter a valid duration');
        setIsSubmitting(false);
        return;
      }

      const serviceData = {
        name,
        price: priceNumber,
        duration_minutes: durationNumber,
      };

      if (editingServiceId) {
        const { error: supabaseError } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingServiceId);

        if (supabaseError) {
          setError(supabaseError.message || 'Failed to update service');
        } else {
          setSuccessMessage('Service updated successfully');
          setFormData({ name: '', price: '', duration_minutes: '' });
          setEditingServiceId(null);
          await fetchServices();
        }
      } else {
        const { error: supabaseError } = await supabase
          .from('services')
          .insert([serviceData]);

        if (supabaseError) {
          setError(supabaseError.message || 'Failed to create service');
        } else {
          setSuccessMessage('Service created successfully');
          setFormData({ name: '', price: '', duration_minutes: '' });
          await fetchServices();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditingServiceId(null);
    setFormData({ name: '', price: '', duration_minutes: '' });
    setError(null);
    setSuccessMessage(null);
  };

  // Filter services based on search term
  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar component with built-in mobile responsiveness */}
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 p-3 sm:p-4 md:p-6 w-full md:ml-20 lg:ml-80">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-4 sm:mb-6 md:mb-8 pt-16 md:pt-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-800 mb-2">
              {editingServiceId ? 'Edit Service' : 'Service Management'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {editingServiceId 
                ? 'Update your existing service details' 
                : 'Create and manage your service offerings'
              }
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 sm:mb-6 bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-md shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 sm:mb-6 bg-green-50 border-l-4 border-green-500 p-3 sm:p-4 rounded-md shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm font-medium text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Service Form Card - Improved responsiveness */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4 sm:mb-6 md:mb-8">
            <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-pink-500 to-pink-600 border-b">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {editingServiceId ? 'Update Service Details' : 'Create New Service'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6">
              {/* Responsive form grid - stacked on mobile, side-by-side on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Service Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Hair Cut, Manicure"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full py-2 px-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Price (RM)
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="e.g. 45.00"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="w-full py-2 px-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
                    step="0.01"
                    min="0"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration_minutes"
                    placeholder="e.g. 30"
                    value={formData.duration_minutes}
                    onChange={handleChange}
                    required
                    className="w-full py-2 px-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
                    min="1"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button 
                    type="submit" 
                    className="py-2 px-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-md hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : editingServiceId ? (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Update Service
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Add Service
                      </>
                    )}
                  </button>
                  {editingServiceId && (
                    <button 
                      type="button" 
                      onClick={cancelEdit}
                      className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all font-medium flex items-center justify-center w-full sm:w-auto"
                      disabled={isSubmitting}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      Cancel
                    </button>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setFormData({ name: '', price: '', duration_minutes: '' });
                    setEditingServiceId(null);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center justify-center focus:outline-none text-sm font-medium mt-2 sm:mt-0"
                  hidden={editingServiceId !== null || (formData.name === '' && formData.price === '' && formData.duration_minutes === '')}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Clear Form
                </button>
              </div>
            </form>
          </div>

          {/* Services List Card - Improved responsiveness */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-purple-500 to-indigo-600 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Your Services
              </h2>
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-3 py-2 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                />
                <div className="absolute left-3 top-2.5">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48 sm:h-64">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 border-3 sm:border-4 border-gray-200 border-t-3 sm:border-t-4 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-sm sm:text-base text-gray-500">Loading services...</p>
                </div>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 sm:h-64 p-4 sm:p-6 text-center">
                {searchTerm ? (
                  <>
                    <svg className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">No matching services</h3>
                    <p className="text-sm text-gray-500 mb-4">Try a different search term or clear the search</p>
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="px-4 py-2 text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <svg className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">No services yet</h3>
                    <p className="text-sm text-gray-500 mb-3 sm:mb-4">Create your first service using the form above</p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop Table View - hidden on small screens */}
                <div className="hidden sm:block">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        <th className="px-3 md:px-6 py-3">Service</th>
                        <th className="px-3 md:px-6 py-3">Price</th>
                        <th className="px-3 md:px-6 py-3">Duration</th>
                        <th className="px-3 md:px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredServices.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50 transition">
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900 text-sm md:text-base">{service.name}</div>
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900 font-medium text-sm md:text-base">RM {service.price.toFixed(2)}</div>
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {service.duration_minutes} minutes
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(service)}
                                className="text-blue-600 hover:text-blue-900 flex items-center text-xs md:text-sm"
                                disabled={isSubmitting}
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(service.id)}
                                className="text-red-600 hover:text-red-900 flex items-center text-xs md:text-sm"
                                disabled={isSubmitting}
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View - improved styling */}
                <div className="sm:hidden">
                  {filteredServices.map((service) => (
                    <div key={service.id} className="border-b border-gray-200 p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 text-base">{service.name}</h3>
                        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {service.duration_minutes} min
                        </div>
                      </div>
                      <p className="text-gray-900 font-medium mb-3 text-sm">RM {service.price.toFixed(2)}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="py-2 px-3 bg-blue-50 text-blue-700 rounded-md font-medium text-xs flex items-center justify-center"
                          disabled={isSubmitting}
                        >
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="py-2 px-3 bg-red-50 text-red-700 rounded-md font-medium text-xs flex items-center justify-center"
                          disabled={isSubmitting}
                        >
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}