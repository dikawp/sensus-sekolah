'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getAllUsers,
  saveUser,
  deleteUser,
  getAllBudgets,
  saveBudget,
  getAllCategories,
  saveCategory,
  deleteCategory,
} from '@/lib/storage';
import { User, UserRole, BudgetAllocation, Category } from '@/lib/types';
import { Plus, Trash2, Edit2, X, CheckCircle2, CalendarDays } from 'lucide-react';
import BOSPManagement from './BOSPManagement';
import AcademicYearManagement from './AcademicYearManagement';
import { formatCurrency, unformatCurrency } from '@/lib/formatter';
import CurrencyInput from '@/components/ui/CurrencyInput';

export default function SettingsContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [budgets, setBudgets] = useState<BudgetAllocation[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingBudget, setEditingBudget] = useState<BudgetAllocation | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'categories' | 'bosp' | 'academic_years'>('users');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [allUsers, allBudgets, allCategories] = await Promise.all([
      getAllUsers(),
      getAllBudgets(),
      getAllCategories()
    ]);
    setUsers(allUsers.filter((u) => u.role === UserRole.ADMIN));
    setBudgets(allBudgets);
    setCategories(allCategories);
  };

  const handleSaveUser = async (formData: { email: string; name: string; password?: string }) => {
    try {
      if (editingUser) {
        await saveUser({ ...editingUser, name: formData.name }); // Only update name to avoid auth email conflicts
      } else {
        if (!formData.password) {
          alert('Password wajib diisi untuk admin baru');
          return;
        }
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/signup`;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            data: {
              name: formData.name,
              role: 'admin',
              school_name: 'TK/PAUD Likawati'
            }
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || errorData.message || 'Gagal mendaftar admin baru');
        }
      }
      setShowUserModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menyimpan admin');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Hapus akun admin ini?')) {
      await deleteUser(userId);
      loadData();
    }
  };

  const handleSaveBudget = async (budget: BudgetAllocation) => {
    await saveBudget(budget);
    setEditingBudget(null);
    setShowBudgetModal(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan Sistem</h1>
        <p className="text-gray-600 mt-1">
          Kelola akun admin dan konfigurasi anggaran
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 font-medium ${
            activeTab === 'users'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Manajemen Admin
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-3 font-medium ${
            activeTab === 'categories'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Manajemen Kategori
        </button>
        <button
          onClick={() => setActiveTab('bosp')}
          className={`px-4 py-3 font-medium ${
            activeTab === 'bosp'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Manajemen dana BOSP
        </button>
        <button
          onClick={() => setActiveTab('academic_years')}
          className={`px-4 py-3 font-medium ${
            activeTab === 'academic_years'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Manajemen Tahun Ajaran
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* User Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Daftar Admin</h2>
          <button
            onClick={() => {
              setEditingUser(null);
              setShowUserModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-5 h-5" />
            Tambah Admin
          </button>
        </div>

        <Card>
          <CardContent className="p-5">
            {users.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Belum ada admin lainnya
              </p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Terdaftar: {new Date(user.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          user.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowUserModal(true);
                        }}
                        className="p-2 hover:bg-gray-200 rounded transition"
                      >
                        <Edit2 className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 hover:bg-red-100 rounded transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Configuration Removed */}
      </>
      ) : activeTab === 'categories' ? (
      <>
        {/* Category Management */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Kategori</h2>
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Plus className="w-5 h-5" />
              Tambah Kategori
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kategori Pemasukan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.filter(c => c.type === 'income').map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        {cat.isPerStudent && (
                          <p className="text-xs text-green-600 font-medium mt-1">Per Siswa</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }} className="p-2 hover:bg-gray-200 rounded text-green-600">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={async () => {
                          if (confirm('Hapus kategori ini? (Catatan: Transaksi yang sudah menggunakan kategori ini tidak akan berubah)')) {
                            await deleteCategory(cat.id);
                            loadData();
                          }
                        }} className="p-2 hover:bg-red-100 rounded text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kategori Pengeluaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.filter(c => c.type === 'expense').map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{cat.name}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }} className="p-2 hover:bg-gray-200 rounded text-green-600">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={async () => {
                          if (confirm('Hapus kategori ini?')) {
                            await deleteCategory(cat.id);
                            loadData();
                          }
                        }} className="p-2 hover:bg-red-100 rounded text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
      ) : activeTab === 'bosp' ? (
        <BOSPManagement />
      ) : (
        <AcademicYearManagement />
      )}

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}


      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onSave={async (catData) => {
            if (editingCategory) {
              await saveCategory({ ...editingCategory, ...catData });
            } else {
              await saveCategory({
                id: Math.random().toString(36).substring(2, 11),
                ...catData
              });
            }
            setShowCategoryModal(false);
            setEditingCategory(null);
            loadData();
          }}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}

interface UserModalProps {
  user: User | null;
  onSave: (data: { email: string; name: string; password?: string }) => void;
  onClose: () => void;
}

function UserModal({ user, onSave, onClose }: UserModalProps) {
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !name) {
      setError('Nama dan Email harus diisi');
      return;
    }

    if (!user && !password) {
      setError('Password harus diisi untuk admin baru');
      return;
    }

    onSave({ email, name, password });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {user ? 'Edit Admin' : 'Tambah Admin Baru'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Nama admin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                disabled={!!user} // Disable email editing for existing users
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${!!user ? 'bg-gray-100 text-gray-500' : ''}`}
                placeholder="admin@sekolah.id"
                required
              />
            </div>

            {!user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Minimal 6 karakter"
                  required
                />
              </div>
            )}

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



interface CategoryModalProps {
  category: Category | null;
  onSave: (data: Omit<Category, 'id'>) => void;
  onClose: () => void;
}

function CategoryModal({ category, onSave, onClose }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || '');
  const [type, setType] = useState<'income'|'expense'>(category?.type || 'income');
  const [isPerStudent, setIsPerStudent] = useState(category?.isPerStudent || false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Nama kategori harus diisi');
      return;
    }
    onSave({ name, type, isPerStudent: type === 'income' ? isPerStudent : false });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {category ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={type === 'income'} onChange={() => setType('income')} disabled={!!category} />
                  <span>Pemasukan</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={type === 'expense'} onChange={() => setType('expense')} disabled={!!category} />
                  <span>Pengeluaran</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Kategori</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Contoh: Uang Seragam"
                required
              />
            </div>

            {type === 'income' && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPerStudent}
                  onChange={(e) => setIsPerStudent(e.target.checked)}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Berlaku Per Siswa (Dibuat tab khusus)</span>
              </label>
            )}

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
