'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAcademicYear } from '@/lib/academicYearContext';
import { AcademicYear } from '@/lib/types';
import { Plus, Trash2, Edit2, X, CheckCircle2 } from 'lucide-react';

export default function AcademicYearManagement() {
  const { academicYears, addAcademicYear, updateAcademicYear, deleteAcademicYear } = useAcademicYear();
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('Hapus Tahun Ajaran ini? Jika dihapus, Anda tidak bisa lagi mengakses data transaksi/siswa di tahun ajaran ini.')) {
      await deleteAcademicYear(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Daftar Tahun Ajaran</h2>
        <button
          onClick={() => {
            setEditingYear(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-5 h-5" />
          Tambah Tahun Ajaran
        </button>
      </div>

      <Card>
        <CardContent className="p-5">
          {academicYears.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Belum ada tahun ajaran.</p>
          ) : (
            <div className="space-y-3">
              {academicYears.map((ay) => (
                <div key={ay.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{ay.name}</p>
                      {ay.isActive && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">
                          Sedang Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(ay.startDate).toLocaleDateString('id-ID')} - {new Date(ay.endDate).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingYear(ay);
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-gray-200 rounded transition"
                    >
                      <Edit2 className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(ay.id)}
                      className="p-2 hover:bg-red-100 rounded transition"
                      disabled={ay.isActive}
                      title={ay.isActive ? "Tidak dapat menghapus tahun ajaran yang sedang aktif" : "Hapus tahun ajaran"}
                    >
                      <Trash2 className={`w-4 h-4 ${ay.isActive ? 'text-gray-400' : 'text-red-600'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <AcademicYearModal
          academicYear={editingYear}
          onSave={async (data) => {
            if (editingYear) {
              await updateAcademicYear(editingYear.id, data);
            } else {
              await addAcademicYear(data);
            }
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

interface AcademicYearModalProps {
  academicYear: AcademicYear | null;
  onSave: (data: Omit<AcademicYear, 'id' | 'isActive'>) => void;
  onClose: () => void;
}

function AcademicYearModal({ academicYear, onSave, onClose }: AcademicYearModalProps) {
  const [name, setName] = useState(academicYear?.name || '');
  const [startDate, setStartDate] = useState(academicYear?.startDate || '');
  const [endDate, setEndDate] = useState(academicYear?.endDate || '');
  const [error, setError] = useState('');
  const { academicYears } = useAcademicYear();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) {
      setError('Semua field wajib diisi.');
      return;
    }
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    
    if (newStart > newEnd) {
      setError('Tanggal mulai tidak boleh lebih dari tanggal selesai.');
      return;
    }

    // Check for overlaps with other academic years
    const hasOverlap = academicYears.some((ay) => {
      // Ignore the one we are currently editing
      if (academicYear && ay.id === academicYear.id) return false;
      
      const existingStart = new Date(ay.startDate);
      const existingEnd = new Date(ay.endDate);
      
      // Overlap condition: newStart <= existingEnd AND newEnd >= existingStart
      return newStart <= existingEnd && newEnd >= existingStart;
    });

    if (hasOverlap) {
      setError('Rentang tanggal bertabrakan dengan Tahun Ajaran lain.');
      return;
    }

    onSave({ name, startDate, endDate });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {academicYear ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Tahun Ajaran</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Contoh: 2025/2026 Ganjil"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
                  style={{ colorScheme: 'light' }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
                  style={{ colorScheme: 'light' }}
                  required
                />
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex gap-2 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                Batal
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                Simpan
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
