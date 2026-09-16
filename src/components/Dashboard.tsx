import React, { useState, useEffect, useRef } from 'react';
import { Upload, Plus, Search, FileSpreadsheet } from 'lucide-react';
import { GponRecord } from '../types';
import { parseExcelData } from '../utils/excel';
import GponTable from './GponTable';
import AddEditModal from './AddEditModal';

import { supabase } from '../utils/supabase';

const Dashboard: React.FC = () => {
  const [records, setRecords] = useState<GponRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GponRecord | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      const { data, error } = await supabase.from('gpon_records').select('*');
      if (error) {
        console.error('Failed to fetch records:', error);
      } else if (data) {
        setRecords(data as GponRecord[]);
      }
    };
    loadData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelData(file);
      const { error } = await supabase.from('gpon_records').insert(data);
      if (error) {
        console.error('Supabase insert error:', error);
        alert('Failed to save Excel data to database.');
        return;
      }
      
      setRecords(prev => [...data, ...prev]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading excel:', error);
      alert('Failed to parse Excel file. Make sure the format is correct.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      const { error } = await supabase.from('gpon_records').delete().eq('id', id);
      if (!error) {
        setRecords(prev => prev.filter(r => r.id !== id));
      } else {
        console.error(error);
        alert('Failed to delete record.');
      }
    }
  };

  const handleEdit = (record: GponRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleSave = async (record: GponRecord) => {
    if (editingRecord) {
      const { error } = await supabase.from('gpon_records').update(record).eq('id', record.id);
      if (!error) {
        setRecords(prev => prev.map(r => r.id === record.id ? record : r));
      } else {
        console.error(error);
        alert('Failed to update record.');
      }
    } else {
      const newRecord = { ...record, id: crypto.randomUUID() };
      const { error } = await supabase.from('gpon_records').insert([newRecord]);
      if (!error) {
        setRecords(prev => [newRecord, ...prev]);
      } else {
        console.error(error);
        alert('Failed to add record.');
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
