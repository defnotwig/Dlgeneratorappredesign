import { useState } from 'react';
import { Users, Search, Filter, UserPlus, Edit, Trash2, Lock } from 'lucide-react';

export function UserManagementLawFirm() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  const users = [
    {
      id: 1,
      email: 'admin@demand.com',
      name: 'Pangasinan, Francisco G.',
      accessLevel: 'Administrator',
      clients: ['All Clients'],
      branch: 'Main',
      dateAdded: 'Jan 1, 2026',
      status: 'Active',
    },
    {
      id: 2,
      email: 'user1@demand.com',
      name: 'Cruz, Maria S.',
      accessLevel: 'User',
      clients: ['BPI BANKO'],
      branch: 'QC',
      dateAdded: 'Jan 5, 2026',
      status: 'Active',
    },
    {
      id: 3,
      email: 'user2@demand.com',
      name: 'Santos, Pedro L.',
      accessLevel: 'User',
      clients: ['BPI', 'EON BANK'],
      branch: 'Makati',
      dateAdded: 'Jan 8, 2026',
      status: 'Active',
    },
    {
      id: 4,
      email: 'user3@demand.com',
      name: 'Reyes, Ana Marie T.',
      accessLevel: 'User',
      clients: ['USB PLC'],
      branch: 'BGC',
      dateAdded: 'Jan 10, 2026',
      status: 'Inactive',
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterLevel === 'all' || user.accessLevel === filterLevel;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1a2332] rounded-lg flex items-center justify-center">
              <Users className="text-[#D4AF37]" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a2332]">User Management</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Manage system users and access control</p>
            </div>
          </div>
          <button className="px-5 py-2 bg-[#1a2332] text-white rounded-lg font-semibold hover:bg-[#2a3342] transition-all flex items-center gap-2 self-start md:self-auto">
            <UserPlus size={18} />
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="text-gray-600" size={20} />
            <div className="flex gap-2">
              {['all', 'Administrator', 'User'].map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                    filterLevel === level
                      ? 'bg-[#D4AF37] text-[#1a2332]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level === 'all' ? 'All' : level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#1a2332]">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#1a2332]">Access Level</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#1a2332]">Clients</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#1a2332]">Branch</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#1a2332]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#1a2332]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-[#1a2332]">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">Added: {user.dateAdded}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.accessLevel === 'Administrator'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-200 text-stone-800'
                      }`}
                    >
                      {user.accessLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.clients.map((client, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-50 text-blue-800 rounded text-xs font-medium"
                        >
                          {client}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{user.branch}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                        <Edit size={16} className="text-blue-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Reset Password">
                        <Lock size={16} className="text-amber-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-[#1a2332]">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter((u) => u.status === 'Active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Administrators</p>
          <p className="text-2xl font-bold text-amber-600">
            {users.filter((u) => u.accessLevel === 'Administrator').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Users</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter((u) => u.accessLevel === 'User').length}
          </p>
        </div>
      </div>
    </div>
  );
}