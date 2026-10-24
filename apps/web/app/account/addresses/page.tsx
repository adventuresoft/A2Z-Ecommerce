'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Building,
  Home,
  Check,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

interface UserAddress {
  id: string;
  label?: string | null;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
}

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [label, setLabel] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Bangladesh');
  const [isDefaultShipping, setIsDefaultShipping] = useState(false);
  const [isDefaultBilling, setIsDefaultBilling] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<UserAddress[]>('/account/addresses');
      setAddresses(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load addresses.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const openCreateModal = () => {
    setEditingAddress(null);
    setLabel('Home');
    setRecipientName('');
    setPhone('');
    setStreetAddress('');
    setCity('Dhaka');
    setState('');
    setPostalCode('');
    setCountry('Bangladesh');
    setIsDefaultShipping(addresses.length === 0);
    setIsDefaultBilling(addresses.length === 0);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: UserAddress) => {
    setEditingAddress(addr);
    setLabel(addr.label || '');
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setStreetAddress(addr.streetAddress);
    setCity(addr.city);
    setState(addr.state || '');
    setPostalCode(addr.postalCode);
    setCountry(addr.country || 'Bangladesh');
    setIsDefaultShipping(addr.isDefaultShipping);
    setIsDefaultBilling(addr.isDefaultBilling);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!recipientName.trim() || !phone.trim() || !streetAddress.trim() || !city.trim() || !postalCode.trim()) {
      setModalError('Please fill in all required fields marked with *');
      return;
    }

    try {
      setModalSubmitting(true);
      const payload = {
        label: label.trim() || undefined,
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        streetAddress: streetAddress.trim(),
        city: city.trim(),
        state: state.trim() || undefined,
        postalCode: postalCode.trim(),
        country: country.trim() || 'Bangladesh',
        isDefaultShipping,
        isDefaultBilling,
      };

      if (editingAddress) {
        await apiClient.patch(`/account/addresses/${editingAddress.id}`, payload);
        showNotification('Address updated successfully');
      } else {
        await apiClient.post('/account/addresses', payload);
        showNotification('New address added successfully');
      }

      setIsModalOpen(false);
      await fetchAddresses();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save address.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      await apiClient.delete(`/account/addresses/${id}`);
      showNotification('Address deleted successfully');
      await fetchAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete address.');
    }
  };

  const handleSetDefaultShipping = async (id: string) => {
    try {
      await apiClient.put(`/account/addresses/${id}/default-shipping`);
      showNotification('Default shipping address updated');
      await fetchAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to update default shipping address.');
    }
  };

  const handleSetDefaultBilling = async (id: string) => {
    try {
      await apiClient.put(`/account/addresses/${id}/default-billing`);
      showNotification('Default billing address updated');
      await fetchAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to update default billing address.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Saved Delivery Addresses
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your delivery and billing locations for seamless, instant checkout
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Address
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Address Cards List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading saved addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Addresses Saved</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            You don't have any saved delivery destinations yet. Add your home or
            work address to speed up your order checkout.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Address Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                addr.isDefaultShipping
                  ? 'border-blue-600 shadow-md shadow-blue-500/5 ring-2 ring-blue-50'
                  : 'border-slate-200/80 shadow-sm hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700">
                      {addr.label?.toLowerCase().includes('office') ||
                      addr.label?.toLowerCase().includes('work') ? (
                        <Building className="w-4 h-4" />
                      ) : (
                        <Home className="w-4 h-4" />
                      )}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {addr.label || 'Delivery Address'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {addr.isDefaultShipping && (
                      <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Default Shipping
                      </span>
                    )}
                    {addr.isDefaultBilling && (
                      <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        Default Billing
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-sm text-slate-600 mt-2">
                  <p className="font-semibold text-slate-900">{addr.recipientName}</p>
                  <p className="text-xs text-slate-500">{addr.phone}</p>
                  <p className="text-slate-700 mt-2">{addr.streetAddress}</p>
                  <p className="text-slate-700">
                    {addr.city}
                    {addr.state ? `, ${addr.state}` : ''} - {addr.postalCode}
                  </p>
                  <p className="text-xs text-slate-400">{addr.country}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(addr)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!addr.isDefaultShipping && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultShipping(addr.id)}
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 cursor-pointer"
                    >
                      Set Shipping
                    </button>
                  )}
                  {!addr.isDefaultBilling && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultBilling(addr.id)}
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2 cursor-pointer"
                    >
                      Set Billing
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Label
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Home, Office, etc."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+8801700000000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Street Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="House 12, Road 4, Sector 3, Uttara"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Dhaka"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="1230"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    State / Division
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Dhaka Division"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Bangladesh"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={isDefaultShipping}
                    onChange={(e) => setIsDefaultShipping(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span>Designate as primary default shipping address</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={isDefaultBilling}
                    onChange={(e) => setIsDefaultBilling(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span>Designate as primary default billing address</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 cursor-pointer"
                >
                  {modalSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : editingAddress ? (
                    'Update Address'
                  ) : (
                    'Save Address'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
