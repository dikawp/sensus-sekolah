'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllStudents, saveStudent, deleteStudent, saveStudents } from '@/lib/storage';
import { Student } from '@/lib/types';
import { Plus, Trash2, Edit2, X, Search, Download, Upload } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import * as XLSX from 'xlsx-js-style';

export default function StudentsContent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
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

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'NIS': 'A-001',
        'Nama Lengkap': 'Ahmad Budi',
        'Kelas': 'TK A',
        'Nama Orang Tua': 'Budi Santoso',
        'Nomor HP': '081234567890',
        'Status': 'Aktif'
      }
    ]);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // NIS
      { wch: 25 }, // Nama Lengkap
      { wch: 10 }, // Kelas
      { wch: 25 }, // Nama Orang Tua
      { wch: 15 }, // Nomor HP
      { wch: 10 }, // Status
    ];

    // Define styles
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "16A34A" } }, // Tailwind green-600
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    const dataStyle = {
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    // Apply styles
    const range = XLSX.utils.decode_range(ws['!ref'] || "A1:F2");
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = R === 0 ? headerStyle : dataStyle;
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Murid');
    XLSX.writeFile(wb, 'Template_Import_Murid.xlsx');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const newStudents: Student[] = data.map((row: any) => ({
          id: Math.random().toString(36).substring(2, 11),
          registeredAt: new Date().toISOString(),
          studentId: String(row['NIS'] || ''),
          name: String(row['Nama Lengkap'] || ''),
          class: String(row['Kelas'] || 'TK A'),
          parentName: String(row['Nama Orang Tua'] || ''),
          parentPhone: String(row['Nomor HP'] || ''),
          active: row['Status'] === 'Nonaktif' ? false : true,
        })).filter((s) => s.studentId && s.name);

        if (newStudents.length > 0) {
          await saveStudents(newStudents);
          loadData();
          alert(`${newStudents.length} murid berhasil diimport!`);
        } else {
          alert('Data tidak valid atau kosong. Pastikan format sesuai template.');
        }
      } catch (error) {
        console.error('Error importing:', error);
        alert('Terjadi kesalahan saat mengimport file.');
      }
      
      if (e.target) {
         e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

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
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import Murid</span>
          </button>
          <button
            onClick={() => {
              setEditingStudent(null);
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Murid
          </button>
        </div>
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

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Import Data Murid</h2>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="font-medium text-blue-900 mb-2">1. Unduh Template</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Gunakan template Excel yang disediakan untuk memastikan format data sesuai.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <h3 className="font-medium text-purple-900 mb-2">2. Upload File</h3>
                  <p className="text-sm text-purple-700 mb-3">
                    Upload file Excel yang sudah diisi dengan data murid.
                  </p>
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Pilih File Excel
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => {
                      handleImport(e);
                      setShowImportModal(false);
                    }} />
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </div>
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
