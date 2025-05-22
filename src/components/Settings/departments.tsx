import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface Department {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  is_active: boolean;
}

const DepartmentsSettings: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editDepartment, setEditDepartment] = useState<Department | null>(null);
  const [form, setForm] = useState<Partial<Department>>({ name: '', icon: '', color: '', is_active: true });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments/');
      if (Array.isArray(res.data)) {
        setDepartments(res.data);
      } else if (res.data && Array.isArray(res.data.results)) {
        setDepartments(res.data.results);
      } else {
        setDepartments([]);
      }
      setError(null);
    } catch {
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const openModal = (dept?: Department) => {
    setEditDepartment(dept || null);
    setForm(dept ? { ...dept } : { name: '', icon: '', color: '', is_active: true });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditDepartment(null);
    setForm({ name: '', icon: '', color: '', is_active: true });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editDepartment) {
        await api.put(`/departments/${editDepartment.id}/`, form);
      } else {
        await api.post('/departments/', form);
      }
      fetchDepartments();
      closeModal();
    } catch {
      setError('Failed to save department');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await api.delete(`/departments/${id}/`);
      fetchDepartments();
    } catch {
      setError('Failed to delete department');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Departments</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => openModal()}>Add Department</button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <table className="w-full text-sm border rounded mb-4">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="py-2 px-2 text-left">Name</th>
            <th className="py-2 px-2 text-left">Icon</th>
            <th className="py-2 px-2 text-left">Color</th>
            <th className="py-2 px-2 text-left">Active</th>
            <th className="py-2 px-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(departments) && departments.length > 0 ? departments.map(dept => (
            <tr key={dept.id} className="border-b last:border-0">
              <td className="py-2 px-2">{dept.name}</td>
              <td className="py-2 px-2">{dept.icon || ''}</td>
              <td className="py-2 px-2">{dept.color || ''}</td>
              <td className="py-2 px-2">{dept.is_active ? 'Yes' : 'No'}</td>
              <td className="py-2 px-2">
                <button className="text-blue-600 underline text-xs mr-2" onClick={() => openModal(dept)}>Edit</button>
                <button className="text-red-600 underline text-xs" onClick={() => handleDelete(dept.id)}>Delete</button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} className="text-center py-4 text-gray-400">No departments found.</td>
            </tr>
          )}
        </tbody>
      </table>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">{editDepartment ? 'Edit Department' : 'Add Department'}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="font-semibold">Name
                <input name="name" value={form.name || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full mt-1" required />
              </label>
              <label className="font-semibold">Icon
                <input name="icon" value={form.icon || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full mt-1" placeholder="e.g. 📁" />
              </label>
              <label className="font-semibold">Color
                <input name="color" value={form.color || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full mt-1" placeholder="#00FF00 or green" />
              </label>
              <label className="font-semibold flex items-center gap-2">
                <input type="checkbox" name="is_active" checked={form.is_active ?? true} onChange={handleChange} /> Active
              </label>
              <div className="flex gap-2 mt-4">
                <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={closeModal}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white">{editDepartment ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {loading && <div className="text-gray-400">Loading...</div>}
    </div>
  );
};

export default DepartmentsSettings; 