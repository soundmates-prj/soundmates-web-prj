import { 
  Users, 
  Search, 
  Plus, 
  RefreshCw,
  MoreVertical,
  UserCheck,
  UserX,
  Clock,
  Edit,
  Trash2,
  Eye,
  Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';
import './UserManagement.css';
import userService, { type UserDto } from '../../../services/userService';

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapUserDtoToUser(dto: UserDto): User {
  const fullName = [dto.firstName, dto.lastName].filter(Boolean).join(' ') || dto.username;
  
  return {
    id: dto.id,
    name: fullName,
    email: dto.email,
    username: dto.username,
    roleName: dto.roleName || 'USER',
    isActive: dto.isActive,
    createdAt: dto.createdAt || '',
    updatedAt: dto.updatedAt || '',
  };
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: { value: string; positive: boolean };
}

function StatCard({ icon, label, value, trend }: StatCardProps) {
  return (
    <div className="lm-stat-card">
      <div className="lm-stat-icon">
        {icon}
      </div>
      <div className="lm-stat-content">
        <span className="lm-stat-label">{label}</span>
        <span className="lm-stat-value">{value}</span>
        {trend && (
          <div className={`lm-stat-change ${trend.positive ? 'positive' : 'negative'}`}>
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentPage, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getUsers({
        q: searchQuery || undefined,
        page: currentPage,
        pageSize: pageSize,
      });

      if (response.success && response.data) {
        const mappedUsers = response.data.items.map(mapUserDtoToUser);
        setUsers(mappedUsers);
        setTotalItems(response.data.totalItems);
        setTotalPages(response.data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    const r = role.toUpperCase();
    return <span className={`lm-role-badge lm-role-${r.toLowerCase()}`}>{r}</span>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`lm-status-badge ${isActive ? 'active' : 'inactive'}`}>
        <span className={`lm-status-dot ${isActive ? 'active' : 'inactive'}`}></span>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  // Calculate stats from actual data
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;

  return (
    <div className="lm-page">
      {/* Header */}
      <div className="lm-header">
        <div className="lm-header-left">
          <h1>Quản lý người dùng</h1>
          <p>Quản lý người dùng, phân quyền và hoạt động</p>
        </div>
        <div className="lm-header-actions">
          <button className="lm-btn lm-btn--outline" onClick={fetchUsers}>
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button className="lm-btn lm-btn--primary">
            <Plus size={15} />
            Thêm User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="lm-stats-grid">
        <StatCard
          icon={<Users size={20} />}
          label="Tổng Users"
          value={totalItems.toLocaleString()}
        />
        <StatCard
          icon={<UserCheck size={20} />}
          label="Active Users"
          value={activeUsers.toLocaleString()}
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Inactive Users"
          value={inactiveUsers.toLocaleString()}
        />
        <StatCard
          icon={<UserX size={20} />}
          label="Trang hiện tại"
          value={`${currentPage}/${totalPages}`}
        />
      </div>

      {/* Users Table */}
      <div className="lm-card">
        <div className="lm-card-header">
          <h3 className="lm-card-title">Danh Sách Users</h3>
        </div>

        {/* Search */}
        <div className="lm-search-bar">
          <div className="lm-search-wrapper">
            <Search size={18} className="lm-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, username..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="lm-search-input"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="lm-loading">
            <RefreshCw size={28} className="lm-spin" />
            <p>Đang tải danh sách người dùng...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && users.length === 0 && (
          <div className="lm-empty">
            <Users size={48} />
            <p>Không tìm thấy người dùng nào</p>
          </div>
        )}

        {/* Table */}
        {!loading && users.length > 0 && (
          <div className="lm-table-wrapper">
            <table className="lm-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th className="center">Vai Trò</th>
                  <th className="center">Trạng Thái</th>
                  <th className="center">Ngày Tham Gia</th>
                  <th className="center">Cập Nhật Cuối</th>
                  <th style={{ width: '48px' }}></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="lm-user-cell">
                        <div className="lm-user-avatar">
                          {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="lm-user-info">
                          <p className="lm-user-name">{user.name}</p>
                          <p className="lm-user-email">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="center">
                      {getRoleBadge(user.roleName)}
                    </td>
                    <td className="center">
                      {getStatusBadge(user.isActive)}
                    </td>
                    <td className="center">
                      <span className="lm-text-small">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="center">
                      <span className="lm-text-small">{formatDate(user.updatedAt)}</span>
                    </td>
                    <td>
                      <div className="lm-action-menu-wrapper">
                        <button 
                          onClick={() => setActiveActionMenu(activeActionMenu === user.id ? null : user.id)}
                          className="lm-action-btn"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeActionMenu === user.id && (
                          <div className="lm-action-dropdown">
                            <button className="lm-action-item">
                              <Eye size={16} />
                              <span>Xem Chi Tiết</span>
                            </button>
                            <button className="lm-action-item">
                              <Edit size={16} />
                              <span>Chỉnh sửa</span>
                            </button>
                            <button className="lm-action-item">
                              <Shield size={16} />
                              <span>Đổi Vai Trò</span>
                            </button>
                            <div className="lm-action-divider"></div>
                            <button className="lm-action-item danger">
                              <Trash2 size={16} />
                              <span>Xóa</span>
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
        )}

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="lm-pagination">
            <p className="lm-pagination-info">
              Hiển thị {users.length} trên tổng {totalItems.toLocaleString()} users
            </p>
            <div className="lm-pagination-buttons">
              <button 
                className="lm-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button 
                    key={pageNum}
                    className={`lm-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button 
                className="lm-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
