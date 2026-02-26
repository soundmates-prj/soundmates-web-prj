import { 
  Users, 
  Search, 
  Plus, 
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Download,
  Upload,
  List,
  Grid,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Ban,
  Key,
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { useState } from 'react';
import './UserManagement.css';
import {
  AddUserModal,
  EditUserModal,
  DeleteUserModal,
  BanUserModal,
  ViewUserModal,
  RoleManagementModal,
  ImportUsersModal,
  SendMessageModal
} from './UserManagementModals';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'mentor' | 'user';
  status: 'active' | 'inactive' | 'banned' | 'pending';
  joinDate: string;
  lastActive: string;
  totalListens: number;
  totalBroadcasts: number;
  followers: number;
}

const mockUsers: User[] = [
  { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', role: 'admin', status: 'active', joinDate: '15/01/2025', lastActive: '2 giờ trước', totalListens: 1245, totalBroadcasts: 42, followers: 856 },
  { id: 2, name: 'Trần Thị B', email: 'tranthib@example.com', role: 'moderator', status: 'active', joinDate: '20/01/2025', lastActive: '5 phút trước', totalListens: 987, totalBroadcasts: 28, followers: 642 },
  { id: 3, name: 'Lê Văn C', email: 'levanc@example.com', role: 'mentor', status: 'active', joinDate: '22/01/2025', lastActive: '1 ngày trước', totalListens: 2341, totalBroadcasts: 67, followers: 1234 },
  { id: 4, name: 'Phạm Thị D', email: 'phamthid@example.com', role: 'user', status: 'inactive', joinDate: '25/01/2025', lastActive: '3 ngày trước', totalListens: 456, totalBroadcasts: 12, followers: 234 },
  { id: 5, name: 'Hoàng Văn E', email: 'hoangvane@example.com', role: 'user', status: 'banned', joinDate: '28/01/2025', lastActive: '1 tuần trước', totalListens: 123, totalBroadcasts: 5, followers: 89 },
  { id: 6, name: 'Đỗ Thị F', email: 'dothif@example.com', role: 'user', status: 'pending', joinDate: '01/02/2026', lastActive: 'Chưa từng', totalListens: 0, totalBroadcasts: 0, followers: 0 },
  { id: 7, name: 'Vũ Văn G', email: 'vuvang@example.com', role: 'mentor', status: 'active', joinDate: '03/02/2026', lastActive: '30 phút trước', totalListens: 1876, totalBroadcasts: 45, followers: 923 },
  { id: 8, name: 'Bùi Thị H', email: 'buithih@example.com', role: 'user', status: 'active', joinDate: '04/02/2026', lastActive: '1 giờ trước', totalListens: 678, totalBroadcasts: 19, followers: 412 },
];

const roles = ['Tất cả', 'Admin', 'Moderator', 'Mentor', 'User'];
const statuses = ['Tất cả', 'Active', 'Inactive', 'Banned', 'Pending'];

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: { value: string; positive: boolean };
  colorClass: string;
}

function StatCard({ icon, label, value, trend, colorClass }: StatCardProps) {
  return (
    <div className="stats-card">
      <div className={`stats-card-icon ${colorClass}`}>
        {icon}
      </div>
      <div className="stats-card-content">
        <p className="stats-card-label">{label}</p>
        <p className="stats-card-value">{value}</p>
        {trend && (
          <div className={`stats-card-trend ${trend.positive ? 'positive' : 'negative'}`}>
            {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function UserManagementScreen() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedRole, setSelectedRole] = useState('Tất cả');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  
  // Action menu state
  const [activeActionMenu, setActiveActionMenu] = useState<number | null>(null);
  
  // Edit user data
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Sort state
  const [sortBy, setSortBy] = useState<'name' | 'joinDate' | 'lastActive'>('joinDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredUsers = mockUsers.filter(user => {
    const matchesRole = selectedRole === 'Tất cả' || user.role.toLowerCase() === selectedRole.toLowerCase();
    const matchesStatus = selectedStatus === 'Tất cả' || user.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesStatus && matchesSearch;
  }).sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'name':
        return order * a.name.localeCompare(b.name);
      case 'joinDate':
        return order * (new Date(a.joinDate.split('/').reverse().join('-')).getTime() - 
                       new Date(b.joinDate.split('/').reverse().join('-')).getTime());
      default:
        return 0;
    }
  });

  const toggleUserSelection = (id: number) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
    setActiveActionMenu(null);
  };

  const handleView = (user: User) => {
    setEditingUser(user);
    setShowViewModal(true);
    setActiveActionMenu(null);
  };

  const handleBan = (user: User) => {
    setEditingUser(user);
    setShowBanModal(true);
    setActiveActionMenu(null);
  };

  const handleDelete = (userId: number) => {
    setSelectedUsers([userId]);
    setShowDeleteModal(true);
    setActiveActionMenu(null);
  };

  const handleBulkDelete = () => {
    setShowDeleteModal(true);
  };

  const handleChangeRole = (user: User) => {
    setEditingUser(user);
    setShowRoleModal(true);
    setActiveActionMenu(null);
  };

  const handleSendMessage = () => {
    setShowMessageModal(true);
  };

  const handleExport = () => {
    const csvContent = filteredUsers
      .filter(u => selectedUsers.length === 0 || selectedUsers.includes(u.id))
      .map(u => `${u.name},${u.email},${u.role},${u.status},${u.joinDate},${u.lastActive}`)
      .join('\n');
    
    const blob = new Blob([`Name,Email,Role,Status,Join Date,Last Active\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
  };

  return (
    <div className="music-catalog-container">
      {/* Header */}
      <div className="music-catalog-header">
        <div className="music-catalog-header-content">
          <div>
            <h2 className="music-catalog-title">User Management</h2>
            <p className="music-catalog-subtitle">
              Quản lý người dùng, phân quyền và hoạt động
            </p>
          </div>
          <div className="music-catalog-header-actions">
            <button 
              onClick={() => setShowImportModal(true)}
              className="btn btn-secondary"
            >
              <Upload size={16} />
              Import Users
            </button>
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              Thêm User
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-card-grid">
        <StatCard
          icon={<Users size={20} style={{ color: '#55c5f1' }} />}
          label="Tổng Users"
          value="12,847"
          trend={{ value: '+12.5%', positive: true }}
          colorClass="primary"
        />
        <StatCard
          icon={<UserCheck size={20} style={{ color: '#22C55E' }} />}
          label="Active Users"
          value="9,234"
          trend={{ value: '+8.2%', positive: true }}
          colorClass="success"
        />
        <StatCard
          icon={<Clock size={20} style={{ color: '#F59E0B' }} />}
          label="Pending"
          value="156"
          trend={{ value: '-2.4%', positive: false }}
          colorClass="warning"
        />
        <StatCard
          icon={<UserX size={20} style={{ color: '#FB2C36' }} />}
          label="Banned"
          value="89"
          trend={{ value: '+3.1%', positive: false }}
          colorClass="danger"
        />
      </div>

      {/* Users Table/Grid */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Danh Sách Users</h3>
          <div className="view-toggle">
            <button 
              onClick={() => setViewMode('list')}
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            >
              <Grid size={16} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-filters-bar">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn btn-secondary">
            <Filter size={16} />
            Lọc Nâng Cao
          </button>
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary"
          >
            <ArrowUpDown size={16} />
            Sắp Xếp
          </button>
        </div>

        {/* Role and Status Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Vai Trò</label>
            <div className="genre-filters">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`genre-filter-btn ${selectedRole === role ? 'active' : ''}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label">Trạng Thái</label>
            <div className="genre-filters">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`genre-filter-btn ${selectedStatus === status ? 'active' : ''}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Actions */}
        {selectedUsers.length > 0 && (
          <div className="bulk-action-panel">
            <span className="bulk-action-count">
              Đã chọn {selectedUsers.length} users
            </span>
            <div className="bulk-action-buttons">
              <button 
                onClick={handleSendMessage}
                className="bulk-action-btn light"
              >
                <Mail size={14} />
                Gửi Tin Nhắn
              </button>
              <button 
                onClick={handleExport}
                className="bulk-action-btn light"
              >
                <Download size={14} />
                Xuất
              </button>
              <button 
                onClick={handleBulkDelete}
                className="bulk-action-btn danger"
              >
                <Trash2 size={14} />
                Xóa
              </button>
            </div>
          </div>
        )}

        {/* Users List/Grid */}
        {viewMode === 'list' ? (
          <div className="music-table-wrapper">
            <table className="music-table">
              <thead>
                <tr>
                  <th style={{ width: '48px' }}>
                    <input 
                      type="checkbox" 
                      className="form-checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    />
                  </th>
                  <th>User</th>
                  <th className="center">Vai Trò</th>
                  <th className="center">Trạng Thái</th>
                  <th className="center">Ngày Tham Gia</th>
                  <th className="center">Hoạt Động Cuối</th>
                  <th className="center">Lượt Nghe</th>
                  <th className="center">Followers</th>
                  <th style={{ width: '48px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="form-checkbox"
                      />
                    </td>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                          ) : (
                            getInitials(user.name)
                          )}
                        </div>
                        <div className="user-info-details">
                          <p className="user-info-name">{user.name}</p>
                          <p className="user-info-email">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="center">
                      <span className={`role-badge ${user.role}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="center">
                      <span className={`status-badge ${user.status}`}>
                        <span className={`status-dot ${user.status}`}></span>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="center">
                      <span className="track-text-small">{user.joinDate}</span>
                    </td>
                    <td className="center">
                      <span className="track-text-small">{user.lastActive}</span>
                    </td>
                    <td className="center">
                      <span className="stat-cell-value">{user.totalListens.toLocaleString()}</span>
                    </td>
                    <td className="center">
                      <span className="stat-cell-value">{user.followers.toLocaleString()}</span>
                    </td>
                    <td>
                      <div className="action-menu-wrapper">
                        <button 
                          onClick={() => setActiveActionMenu(activeActionMenu === user.id ? null : user.id)}
                          className="btn-icon btn-secondary"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeActionMenu === user.id && (
                          <div className="action-menu-dropdown">
                            <button onClick={() => handleView(user)} className="action-menu-item">
                              <Eye size={16} className="action-menu-item-icon" />
                              <span className="action-menu-item-text">Xem Chi Tiết</span>
                            </button>
                            <button onClick={() => handleEdit(user)} className="action-menu-item">
                              <Edit size={16} className="action-menu-item-icon" />
                              <span className="action-menu-item-text">Chỉnh sửa</span>
                            </button>
                            <button onClick={() => handleChangeRole(user)} className="action-menu-item">
                              <Shield size={16} className="action-menu-item-icon" />
                              <span className="action-menu-item-text">Đổi Vai Trò</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                handleSendMessage();
                              }}
                              className="action-menu-item"
                            >
                              <Mail size={16} className="action-menu-item-icon" />
                              <span className="action-menu-item-text">Gửi Tin Nhắn</span>
                            </button>
                            <div className="action-menu-divider"></div>
                            {user.status !== 'banned' && (
                              <button onClick={() => handleBan(user)} className="action-menu-item">
                                <Ban size={16} className="action-menu-item-icon" />
                                <span className="action-menu-item-text">Ban User</span>
                              </button>
                            )}
                            <button onClick={() => handleDelete(user.id)} className="action-menu-item danger">
                              <Trash2 size={16} className="action-menu-item-icon" />
                              <span className="action-menu-item-text">Xóa</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="users-grid">
            {filteredUsers.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-card-header">
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="user-card-checkbox"
                  />
                  <div className="user-avatar large user-card-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  <button
                    onClick={() => setActiveActionMenu(activeActionMenu === user.id ? null : user.id)}
                    className="user-card-menu-btn"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
                
                <h4 className="user-card-name">{user.name}</h4>
                <p className="user-card-email">{user.email}</p>
                
                <div className="user-card-badges">
                  <span className={`role-badge ${user.role}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <span className={`status-badge ${user.status}`}>
                    <span className={`status-dot ${user.status}`}></span>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </div>
                
                <div className="user-card-stats">
                  <div className="user-card-stat">
                    <div className="user-card-stat-value">{user.totalListens}</div>
                    <div className="user-card-stat-label">Lượt Nghe</div>
                  </div>
                  <div className="user-card-stat">
                    <div className="user-card-stat-value">{user.totalBroadcasts}</div>
                    <div className="user-card-stat-label">Phát Sóng</div>
                  </div>
                  <div className="user-card-stat">
                    <div className="user-card-stat-value">{user.followers}</div>
                    <div className="user-card-stat-label">Followers</div>
                  </div>
                </div>
                
                {activeActionMenu === user.id && (
                  <div className="action-menu-dropdown">
                    <button onClick={() => handleView(user)} className="action-menu-item">
                      <Eye size={16} className="action-menu-item-icon" />
                      <span className="action-menu-item-text">Xem Chi Tiết</span>
                    </button>
                    <button onClick={() => handleEdit(user)} className="action-menu-item">
                      <Edit size={16} className="action-menu-item-icon" />
                      <span className="action-menu-item-text">Chỉnh sửa</span>
                    </button>
                    <button onClick={() => handleChangeRole(user)} className="action-menu-item">
                      <Shield size={16} className="action-menu-item-icon" />
                      <span className="action-menu-item-text">Đổi Vai Trò</span>
                    </button>
                    <div className="action-menu-divider"></div>
                    {user.status !== 'banned' && (
                      <button onClick={() => handleBan(user)} className="action-menu-item">
                        <Ban size={16} className="action-menu-item-icon" />
                        <span className="action-menu-item-text">Ban User</span>
                      </button>
                    )}
                    <button onClick={() => handleDelete(user.id)} className="action-menu-item danger">
                      <Trash2 size={16} className="action-menu-item-icon" />
                      <span className="action-menu-item-text">Xóa</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="pagination-wrapper">
          <p className="pagination-info">
            Hiển thị {filteredUsers.length} trên tổng 12,847 users
          </p>
          <div className="pagination-buttons">
            <button className="pagination-btn">Trước</button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">3</button>
            <button className="pagination-btn">Sau</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddUserModal 
        isOpen={showAddUserModal} 
        onClose={() => setShowAddUserModal(false)} 
      />
      
      <EditUserModal 
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        user={editingUser}
      />
      
      <DeleteUserModal 
        isOpen={showDeleteModal} 
        onClose={() => {
          setShowDeleteModal(false);
          if (selectedUsers.length === 1) setSelectedUsers([]);
        }}
        count={selectedUsers.length}
        onConfirm={() => {
          setShowDeleteModal(false);
          setSelectedUsers([]);
        }}
      />
      
      <BanUserModal 
        isOpen={showBanModal} 
        onClose={() => {
          setShowBanModal(false);
          setEditingUser(null);
        }}
        user={editingUser}
      />
      
      <ViewUserModal 
        isOpen={showViewModal} 
        onClose={() => {
          setShowViewModal(false);
          setEditingUser(null);
        }}
        user={editingUser}
      />
      
      <RoleManagementModal 
        isOpen={showRoleModal} 
        onClose={() => {
          setShowRoleModal(false);
          setEditingUser(null);
        }}
        user={editingUser}
      />
      
      <ImportUsersModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
      />
      
      <SendMessageModal 
        isOpen={showMessageModal} 
        onClose={() => {
          setShowMessageModal(false);
          setEditingUser(null);
        }}
        users={selectedUsers.length > 0 
          ? filteredUsers.filter(u => selectedUsers.includes(u.id)) 
          : editingUser ? [editingUser] : []
        }
      />
    </div>
  );
}