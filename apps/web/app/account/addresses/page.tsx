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
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

interface LocationItem {
  id: number;
  name: string;
  bnName?: string | null;
  divisionId?: number;
  districtId?: number;
}

interface UserAddress {
  id: string;
  label?: string | null;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state?: string | null;
  thana?: string | null;
  divisionId?: number | null;
  districtId?: number | null;
  thanaId?: number | null;
  postalCode: string;
  country: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
  division?: { id: number; name: string; bnName?: string | null } | null;
  district?: { id: number; name: string; bnName?: string | null } | null;
  thanaRel?: { id: number; name: string; bnName?: string | null } | null;
}

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Location Data State
  const [divisions, setDivisions] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [thanas, setThanas] = useState<LocationItem[]>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingThanas, setIsLoadingThanas] = useState(false);

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [addressToDelete, setAddressToDelete] = useState<UserAddress | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [label, setLabel] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | ''>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>('');
  const [selectedThanaId, setSelectedThanaId] = useState<number | ''>('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Bangladesh');
  const [isDefaultShipping, setIsDefaultShipping] = useState(false);
  const [isDefaultBilling, setIsDefaultBilling] = useState(false);

  // Fetch initial addresses
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

  // Fetch divisions once on mount
  useEffect(() => {
    fetchAddresses();
    apiClient
      .get<LocationItem[]>('/locations/divisions')
      .then((data) => {
        if (Array.isArray(data)) setDivisions(data);
      })
      .catch((err) => {
        console.error('Failed to load divisions:', err);
      });
  }, [fetchAddresses]);

  // Load districts when selectedDivisionId changes
  const loadDistrictsForDivision = useCallback(async (divId: number, targetDistrictId?: number) => {
    setIsLoadingDistricts(true);
    try {
      const data = await apiClient.get<LocationItem[]>(`/locations/districts?divisionId=${divId}`);
      const districtList = Array.isArray(data) ? data : [];
      setDistricts(districtList);

      if (targetDistrictId && districtList.some((d) => d.id === targetDistrictId)) {
        setSelectedDistrictId(targetDistrictId);
      } else if (districtList.length > 0 && districtList[0]) {
        setSelectedDistrictId(districtList[0].id);
      } else {
        setSelectedDistrictId('');
      }
    } catch (err) {
      console.error('Failed to load districts:', err);
      setDistricts([]);
      setSelectedDistrictId('');
    } finally {
      setIsLoadingDistricts(false);
    }
  }, []);

  // Load thanas when selectedDistrictId changes
  const loadThanasForDistrict = useCallback(async (distId: number, targetThanaId?: number) => {
    setIsLoadingThanas(true);
    try {
      const data = await apiClient.get<LocationItem[]>(`/locations/thanas?districtId=${distId}`);
      const thanaList = Array.isArray(data) ? data : [];
      setThanas(thanaList);

      if (targetThanaId && thanaList.some((t) => t.id === targetThanaId)) {
        setSelectedThanaId(targetThanaId);
      } else if (thanaList.length > 0 && thanaList[0]) {
        setSelectedThanaId(thanaList[0].id);
      } else {
        setSelectedThanaId('');
      }
    } catch (err) {
      console.error('Failed to load thanas:', err);
      setThanas([]);
      setSelectedThanaId('');
    } finally {
      setIsLoadingThanas(false);
    }
  }, []);

  // Handle Division Selection in Form
  const handleDivisionChange = (divId: number) => {
    setSelectedDivisionId(divId);
    setSelectedDistrictId('');
    setSelectedThanaId('');
    setThanas([]);
    loadDistrictsForDivision(divId);
  };

  // Handle District Selection in Form
  const handleDistrictChange = (distId: number) => {
    setSelectedDistrictId(distId);
    setSelectedThanaId('');
    loadThanasForDistrict(distId);
  };

  // Handle Escape key for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (addressToDelete) setAddressToDelete(null);
        else if (isModalOpen) setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addressToDelete, isModalOpen]);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const openCreateModal = async () => {
    setEditingAddress(null);
    setLabel('Home');
    setRecipientName('');
    setPhone('');
    setStreetAddress('');
    setPostalCode('');
    setCountry('Bangladesh');
    setIsDefaultShipping(addresses.length === 0);
    setIsDefaultBilling(addresses.length === 0);
    setModalError(null);

    // Default to Dhaka division if available
    const dhakaDiv = divisions.find((d) => d.name.toLowerCase().includes('dhaka')) || divisions[0];
    if (dhakaDiv) {
      setSelectedDivisionId(dhakaDiv.id);
      setIsModalOpen(true);
      await loadDistrictsForDivision(dhakaDiv.id);
    } else {
      setSelectedDivisionId('');
      setSelectedDistrictId('');
      setSelectedThanaId('');
      setIsModalOpen(true);
    }
  };

  const openEditModal = async (addr: UserAddress) => {
    setEditingAddress(addr);
    setLabel(addr.label || '');
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setStreetAddress(addr.streetAddress);
    setPostalCode(addr.postalCode);
    setCountry(addr.country || 'Bangladesh');
    setIsDefaultShipping(addr.isDefaultShipping);
    setIsDefaultBilling(addr.isDefaultBilling);
    setModalError(null);

    // Resolve Division
    const divId =
      addr.divisionId ||
      divisions.find((d) => addr.state && d.name.toLowerCase() === addr.state.toLowerCase())?.id ||
      divisions[0]?.id ||
      '';

    setSelectedDivisionId(divId);
    setIsModalOpen(true);

    if (divId) {
      setIsLoadingDistricts(true);
      try {
        const distData = await apiClient.get<LocationItem[]>(`/locations/districts?divisionId=${divId}`);
        const distList = Array.isArray(distData) ? distData : [];
        setDistricts(distList);

        const distId =
          addr.districtId ||
          distList.find((d) => addr.city && d.name.toLowerCase() === addr.city.toLowerCase())?.id ||
          distList[0]?.id ||
          '';

        setSelectedDistrictId(distId);

        if (distId) {
          setIsLoadingThanas(true);
          const thanaData = await apiClient.get<LocationItem[]>(`/locations/thanas?districtId=${distId}`);
          const thanaList = Array.isArray(thanaData) ? thanaData : [];
          setThanas(thanaList);

          const thId =
            addr.thanaId ||
            thanaList.find((t) => addr.thana && t.name.toLowerCase() === addr.thana.toLowerCase())?.id ||
            thanaList[0]?.id ||
            '';

          setSelectedThanaId(thId);
        }
      } catch (err) {
        console.error('Error prefilling locations:', err);
      } finally {
        setIsLoadingDistricts(false);
        setIsLoadingThanas(false);
      }
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!recipientName.trim() || !phone.trim() || !streetAddress.trim() || !postalCode.trim()) {
      setModalError('Please fill in all required fields marked with *');
      return;
    }

    if (!selectedDivisionId || !selectedDistrictId) {
      setModalError('Please select your Division and District.');
      return;
    }

    const divisionObj = divisions.find((d) => d.id === selectedDivisionId);
    const districtObj = districts.find((d) => d.id === selectedDistrictId);
    const thanaObj = thanas.find((t) => t.id === selectedThanaId);

    try {
      setModalSubmitting(true);
      const payload = {
        label: label.trim() || undefined,
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        streetAddress: streetAddress.trim(),
        divisionId: Number(selectedDivisionId),
        districtId: Number(selectedDistrictId),
        thanaId: selectedThanaId ? Number(selectedThanaId) : undefined,
        city: districtObj?.name || 'Dhaka',
        state: divisionObj?.name || 'Dhaka',
        thana: thanaObj?.name || undefined,
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

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;

    try {
      setIsDeleting(true);
      await apiClient.delete(`/account/addresses/${addressToDelete.id}`);
      showNotification('Address deleted successfully');
      setAddressToDelete(null);
      await fetchAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete address.');
    } finally {
      setIsDeleting(false);
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
      <div className="surface-3d rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Saved Delivery Addresses
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Manage your delivery destinations with Division, District, and Thana selection
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-[background-color,transform] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Address Cards List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">Loading saved addresses…</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="surface-3d rounded-3xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Addresses Saved</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            You don't have any saved delivery destinations yet. Add your address with Division,
            District, and Thana to speed up order checkout.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Plus className="w-4 h-4" /> <span>Add Address Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => {
            const displayThana = addr.thanaRel?.name || addr.thana;
            const displayDistrict = addr.district?.name || addr.city;
            const displayDivision = addr.division?.name || addr.state;

            return (
              <div
                key={addr.id}
                className={`surface-3d rounded-3xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                  addr.isDefaultShipping
                    ? 'border-blue-600 shadow-md shadow-blue-600/10 ring-2 ring-blue-50'
                    : 'border-slate-200/90 shadow-sm hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-700">
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
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                          Default Shipping
                        </span>
                      )}
                      {addr.isDefaultBilling && (
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                          Default Billing
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 mt-3">
                    <p className="font-bold text-slate-900 text-sm">{addr.recipientName}</p>
                    <p className="font-mono text-slate-500">{addr.phone}</p>
                    <p className="text-slate-700 mt-2 font-medium leading-relaxed">{addr.streetAddress}</p>
                    <p className="text-slate-800 font-semibold">
                      {displayThana ? `${displayThana}, ` : ''}
                      {displayDistrict}
                      {displayDivision && displayDivision !== displayDistrict ? `, ${displayDivision}` : ''} -{' '}
                      <span className="font-mono">{addr.postalCode}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-semibold">{addr.country}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(addr)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressToDelete(addr)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> <span>Delete</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {!addr.isDefaultShipping && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultShipping(addr.id)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xs"
                      >
                        Set Shipping
                      </button>
                    )}
                    {!addr.isDefaultBilling && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultBilling(addr.id)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-xs"
                      >
                        Set Billing
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {addressToDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overscroll-contain"
        >
          <div className="surface-3d rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900">
                  Delete Address?
                </h3>
                <p id="delete-dialog-desc" className="text-xs text-slate-500">
                  Are you sure you want to remove this delivery address?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 mb-5 border border-slate-100">
              <p className="font-semibold text-slate-900">{addressToDelete.recipientName}</p>
              <p className="text-slate-500">{addressToDelete.streetAddress}, {addressToDelete.city}</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAddressToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAddress}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <span>Delete Address</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Address Modal Dialog */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="address-form-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overscroll-contain animate-fade-in"
        >
          <div className="surface-3d rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h2 id="address-form-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                {editingAddress ? 'Edit Address Destination' : 'Add New Delivery Address'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-label="Close address form dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address-label-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Label
                  </label>
                  <input
                    id="address-label-input"
                    name="addressLabel"
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Home, Office, etc…"
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="recipient-name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Recipient Name *
                  </label>
                  <input
                    id="recipient-name-input"
                    name="recipientName"
                    type="text"
                    required
                    autoComplete="name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="recipient-phone-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Contact Phone Number *
                </label>
                <input
                  id="recipient-phone-input"
                  name="recipientPhone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+8801700000000"
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors font-mono"
                />
              </div>

              <div>
                <label htmlFor="street-address-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Street Address *
                </label>
                <textarea
                  id="street-address-input"
                  name="streetAddress"
                  required
                  rows={2}
                  autoComplete="street-address"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="House 12, Road 4, Sector 3, Uttara"
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white resize-none transition-colors"
                />
              </div>

              {/* Cascading Location Selects: Division -> District -> Thana */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="division-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Division *
                  </label>
                  <select
                    id="division-select"
                    name="division"
                    required
                    value={selectedDivisionId}
                    onChange={(e) => handleDivisionChange(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer transition-colors"
                  >
                    <option value="" disabled>
                      Select Division
                    </option>
                    {divisions.map((div) => (
                      <option key={div.id} value={div.id}>
                        {div.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="district-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>District *</span>
                    {isLoadingDistricts && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
                  </label>
                  <select
                    id="district-select"
                    name="district"
                    required
                    disabled={!selectedDivisionId || isLoadingDistricts}
                    value={selectedDistrictId}
                    onChange={(e) => handleDistrictChange(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <option value="" disabled>
                      {isLoadingDistricts ? 'Loading...' : 'Select District'}
                    </option>
                    {districts.map((dist) => (
                      <option key={dist.id} value={dist.id}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="thana-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Thana</span>
                    {isLoadingThanas && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
                  </label>
                  <select
                    id="thana-select"
                    name="thana"
                    disabled={!selectedDistrictId || isLoadingThanas}
                    value={selectedThanaId}
                    onChange={(e) => setSelectedThanaId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <option value="">Select Thana (Optional)</option>
                    {thanas.map((th) => (
                      <option key={th.id} value={th.id}>
                        {th.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="postal-code-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Postal Code *
                  </label>
                  <input
                    id="postal-code-input"
                    name="postalCode"
                    type="text"
                    required
                    autoComplete="postal-code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="1230"
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="country-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Country
                  </label>
                  <input
                    id="country-input"
                    name="country"
                    type="text"
                    autoComplete="country-name"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Bangladesh"
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-colors"
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
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-70 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
