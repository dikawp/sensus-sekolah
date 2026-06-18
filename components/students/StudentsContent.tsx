'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllStudents, saveStudent, deleteStudent } from '@/lib/storage';
import { Student } from '@/lib/types';
import { Plus, Trash2, Edit2, X, Search } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';

export default function StudentsContent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getAllStudents();
    setStudents(data);
  };

  const handleSave = async (data: Omit<Student, 'id' | 'registeredAt'>) => {
    if (editingStudent) {
      await saveStudent({
        ...editingStudent,
        ...data,
      });
    } else {
      await saveStudent({
        id: Math.random().toString(36).substring(2, 11),
        registeredAt: new Date().toISOString(),
        ...data,
      });
    }
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus data murid ini?')) {
      await deleteStudent(id);
      loadData();
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'all' || s.class === filterClass;
    return matchesSearch && matchesClass;
  });

  const columns: Column<Student>[] = [
    { header: 'NIS', accessor: 'studentId', sortable: true },
    { header: 'Nama Siswa', accessor: 'name', sortable: true },
    { header: 'Kelas', accessor: 'class', sortable: true, hideOnMobile: true, cell: (student) => (<span className="inline-flex px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{student.class}</span>) },
    { header: 'Nama Orang Tua', accessor: 'parentName', sortable: true, hideOnMobile: true },
    { header: 'No. HP', accessor: 'parentPhone', hideOnMobile: true },
    { header: 'Status', accessor: 'active', sortable: true, hideOnMobile: true, cell: (student) => (<span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${student.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{student.active ? 'Aktif' : 'Nonaktif'}</span>) },
    {
      header: 'Aksi',
      accessor: 'id',
      cell: (student) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingStudent(student);
              setShowModal(true);
            }}
            className="p-1.5 text-green-600 hover:bg-green-100 rounded transition"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(student.id)}
            className="p-1.5 text-red-600 hover:bg-red-100 rounded transition"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Murid</h1>
          <p className="text-gray-600 mt-1">
            Kelola data murid dan kelas
          </p>
        </div>
        <button
          onClick={() => {
            setEditingStudent(null);
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-5 h-5" />
          Tambah Murid
        </button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Daftar Murid</CardTitle>
            <div className="flex gap-3 w-full sm:w-auto">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
              >
                <option value="all">Semua Kelas</option>
                <option value="TK A">TK A</option>
                <option value="TK B">TK B</option>
              </select>
              <div className="relative flex-1 sm:w-64">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau NIS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none w-full"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredStudents}
            keyField="id"
            pagination={true}
            rowsPerPage={10}
            emptyMessage="Tidak ada data murid yang ditemukan"
          />
        </CardContent>
      </Card>

      {showModal && (
        <StudentModal
          student={editingStudent}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingStudent(null);
          }}
        />
      )}
    </div>
  );
}

interface StudentModalProps {
  student: Student | null;
  onSave: (data: Omit<Student, 'id' | 'registeredAt'>) => void;
  onClose: () => void;
}

function StudentModal({ student, onSave, onClose }: StudentModalProps) {
  const [studentId, setStudentId] = useState(student?.studentId || '');
  const [name, setName] = useState(student?.name || '');
  const [studentClass, setStudentClass] = useState(student?.class || 'TK A');
  const [parentName, setParentName] = useState(student?.parentName || '');
  const [parentPhone, setParentPhone] = useState(student?.parentPhone || '');
  const [active, setActive] = useState(student ? student.active : true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !name || !studentClass || !parentName || !parentPhone) {
      setError('Semua field wajib diisi');
      return;
    }
    onSave({
      studentId,
      name,
      class: studentClass,
      parentName,
      parentPhone,
      active,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {student ? 'Edit Data Murid' : 'Tambah Murid Baru'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NIS (Nomor Induk Siswa)</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Contoh: A-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap Siswa</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Nama lengkap"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
              <select
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                <option value="TK A">TK A</option>
                <option value="TK B">TK B</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Orang Tua/Wali</label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Nama orang tua"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nomor HP/WhatsApp</label>
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Contoh: 08123456789"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activeStatus"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
              />
              <label htmlFor="activeStatus" className="text-sm font-medium text-gray-700">
                Siswa Aktif
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
