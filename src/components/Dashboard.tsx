import React, { useState, useEffect, useRef } from 'react';
import { Upload, Plus, Search, FileSpreadsheet } from 'lucide-react';
import { GponRecord } from '../types';
import { parseExcelData } from '../utils/excel';
import { generateId } from '../utils/id';
import GponTable from './GponTable';
import AddEditModal from './AddEditModal';

import { supabase } from '../utils/supabase';

const Dashboard: React.FC = () => {
  const [records, setRecords] = useState<GponRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GponRecord | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to map data to lowercase for Supabase if needed
  const mapToLowercase = (item: any) => ({
    id: item.id,
    oltname: item.oltName,
    oltnumber: item.oltNumber,
    portnumber: item.portNumber,
    location: item.location,
    status: item.status
  });

  const checkEnv = () => {
    if (import.meta.env.VITE_SUPABASE_URL === undefined) {
      alert("ERROR: Missing VITE_SUPABASE_URL in Vercel Environment Variables. Please add it and redeploy!");
      return false;
    }
    return true;
  }

  // Load from Supabase on mount
  useEffect(() => {
    const localData = localStorage.getItem('gpon_data_records');
    if (localData) {
      try {
        setRecords(JSON.parse(localData));
      } catch (e) {
        console.error('Failed to parse local storage');
      }
    }

    if (!checkEnv()) return;

    const loadData = async () => {
      let { data, error } = await supabase.from('gpon_records').select('*');
      if (error) {
        console.error('Failed to fetch records:', error);
      } else if (data && data.length > 0) {
        // If data has lowercase keys (oltname), map it back to camelCase for the frontend
        const mappedData = data.map((item: any) => ({
          id: item.id,
          oltName: item.oltName || item.oltname || '',
          oltNumber: item.oltNumber || item.oltnumber || '',
          portNumber: item.portNumber || item.portnumber || '',
          location: item.location || '',
          status: item.status || 'Pending'
        }));
        setRecords(mappedData as GponRecord[]);
        // Optionally sync it back to local storage
        saveToLocalStorage(mappedData);
      }
    };
    loadData();
  }, []);

  const saveToLocalStorage = (data: GponRecord[]) => {
    try {
      localStorage.setItem('gpon_data_records', JSON.stringify(data));
    } catch (e) {
      console.error('Local storage full or disabled');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelData(file);
      const newRecords = [...data, ...records];
      
      if (!checkEnv()) {
         // Fallback immediately to local storage
         setRecords(newRecords);
         saveToLocalStorage(newRecords);
         if (fileInputRef.current) fileInputRef.current.value = '';
         return;
      }
      
      // Try normal insert
      let { error } = await supabase.from('gpon_records').insert(data);
      
      // Fallback: If it failed due to column names, try inserting with lowercase column names
      if (error && error.message?.includes('does not exist')) {
        const lowercaseData = data.map(mapToLowercase);
        const retry = await supabase.from('gpon_records').insert(lowercaseData);
        error = retry.error;
      }

      if (error) {
        console.error('Supabase insert error:', error);
        alert(`Cloud save failed (${error.message}). Saving locally instead!`);
        setRecords(newRecords);
        saveToLocalStorage(newRecords);
      } else {
        setRecords(newRecords);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading excel:', error);
      alert('Failed to parse Excel file. Make sure the format is correct.');
    }
  };

  const handleDelete = async (id: string) => {
    const newRecords = records.filter(r => r.id !== id);
    if (window.confirm('Are you sure you want to delete this record?')) {
      if (!checkEnv()) {
        setRecords(newRecords);
        saveToLocalStorage(newRecords);
        return;
      }
      const { error } = await supabase.from('gpon_records').delete().eq('id', id);
      if (!error) {
        setRecords(newRecords);
      } else {
        alert(`Cloud delete failed (${error.message}). Deleting locally instead!`);
        setRecords(newRecords);
        saveToLocalStorage(newRecords);
      }
    }
  };

  const handleEdit = (record: GponRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleSave = async (record: GponRecord) => {
    if (editingRecord) {
      const newRecords = records.map(r => r.id === record.id ? record : r);
      
      if (!checkEnv()) {
        setRecords(newRecords);
        saveToLocalStorage(newRecords);
        setIsModalOpen(false);
        setEditingRecord(undefined);
        return;
      }
      
      let { error } = await supabase.from('gpon_records').update(record).eq('id', record.id);
      if (error && error.message?.includes('does not exist')) {
        const retry = await supabase.from('gpon_records').update(mapToLowercase(record)).eq('id', record.id);
        error = retry.error;
      }

      if (!error) {
        setRecords(newRecords);
      } else {
        alert(`Cloud update failed (${error.message}). Saving locally instead!`);
        setRecords(newRecords);
        saveToLocalStorage(newRecords);
      }
    } else {
      const newRecord = { ...record, id: generateId() };
      const newRecords = [newRecord, ...records];
      
      if (!checkEnv()) {
        setRecords(newRecords);
        saveToLocalStorage(newRecords);
        setIsModalOpen(false);
        setEditingRecord(undefined);
        return;
      }
      
      let { error } = await supabase.from('gpon_records').insert([newRecord]);
      if (error && error.message?.includes('does not exist')) {
        const retry = await supabase.from('gpon_records').insert([mapToLowercase(newRecord)]);
        error = retry.error;
      }

      if (!error) {
        setRecords(newRecords);
      } else {
        alert(`Cloud add failed (${error.message}). Saving locally instead!`);
        setRecords(newRecords);
        saveToLocalStorage(newRecords);
      }
    }
    setIsModalOpen(false);
    setEditingRecord(undefined);
  };

  const filteredRecords = records.filter(record => {
    const query = searchQuery.toLowerCase();
    return (
      (record.oltName || '').toLowerCase().includes(query) ||
      (record.oltNumber || '').toLowerCase().includes(query) ||
      (record.portNumber || '').toLowerCase().includes(query) ||
      (record.location || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search by OLT, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <input
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Excel
          </button>

          <button
            onClick={() => {
              setEditingRecord(undefined);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {records.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No records</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new record or uploading an Excel file.
              </p>
            </div>
          ) : (
            <GponTable
              records={filteredRecords}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {isModalOpen && (
        <AddEditModal
          record={editingRecord}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRecord(undefined);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
