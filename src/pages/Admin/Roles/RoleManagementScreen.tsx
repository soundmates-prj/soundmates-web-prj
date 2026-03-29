import { useState } from 'react';
import { ShieldCheck, Plus, Pencil, Trash2, X, CheckCircle } from 'lucide-react';
import { showSuccess, showError } from '../../../components/common/toastUtils';
import './RoleManagementScreen.css';

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
}

const PERMISSIONS = [
  'Xem lịch trình',
  'Quản lý lịch trình',
  'Tạo phiên phát sóng',
  'Quản lý phiên phát sóng',
  'Quản lý yêu cầu nhạc',
  'Quản lý đài phát',
  'Quản lý playlist',
  'Kiểm duyệt chat',
  'Quản lý kịch bản AI',
  'Quản lý người dùng',
  'Quản lý vai trò',
  'Quản lý bài viết',
  'Quản lý cấu hình',
  'Xem báo cáo',
];

const mockRoles: Role[] = [
  { id: '1', name: 'ADMIN', description: 'Quản trị viên toàn hệ thống', userCount: 2, permissions: PERMISSIONS },
  { id: '2', name: 'STAFF', description: 'Nhân viên vận hành', userCount: 5, permissions: ['Xem lịch trình', 'Quản lý lịch trình', 'Tạo phiên phát sóng', 'Quản lý phiên phát sóng', 'Quản lý yêu cầu nhạc', 'Quản lý đài phát', 'Quản lý playlist', 'Kiểm duyệt chat', 'Quản lý kịch bản AI', 'Quản lý kịch bản AI', 'Xem báo cáo'] },
  { id: '3', name: 'HOST', description: 'MC / Host dẫn phát sóng', userCount: 12, permissions: ['Xem lịch trình', 'Quản lý phiên phát sóng', 'Quản lý yêu cầu nhạc'] },
  { id: '4', name: 'MEMBER', description: 'Thành viên thường', userCount: 2847, permissions: [] },
];

export function RoleManagementScreen() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState<Partial<Role> | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  const openCreate = () => {
    setEditRole({ name: '', description: '' });
    setEditPermissions([]);
    setShowModal(true);
  };

  const openEdit = (role: Role) => {
    setEditRole(role);
    setEditPermissions(role.permissions);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editRole?.name?.trim()) { showError("Lỗi", "Vui lòng nhập tên vai trò"); return; }
    // TODO: call API
    await new Promise(r => setTimeout(r, 500));
    showSuccess("Thành công", `Vai trò "${editRole.name}" đã được lưu`);
    setShowModal(false);
  };

  const handleDelete = async (role: Role) => {
    if (role.userCount > 0) {
      showError("Không thể xoá", "Vai trò đang có người dùng. Cần reassign trước.");
      return;
    }
    if (!window.confirm(`Xoá vai trò "${role.name}"?`)) return;
    // TODO: call API
    setRoles(prev => prev.filter(r => r.id !== role.id));
    showSuccess("Đã xoá", `Vai trò "${role.name}" đã được xoá`);
  };

  const togglePermission = (perm: string) => {
    setEditPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="role-mgmt-page">
      <div className="role-mgmt-header">
        <div>
          <h1 className="role-mgmt-title">
            <ShieldCheck size={24} />
            Vai trò & Quyền hạn
          </h1>
          <p className="role-mgmt-subtitle">Quản lý vai trò và phân quyền truy cập cho người dùng hệ thống</p>
        </div>
        <button className="lm-btn lm-btn--primary" onClick={openCreate}>
          <Plus size={15} />
          Tạo vai trò
        </button>
      </div>

      <div className="role-mgmt-table-card">
        <table className="role-mgmt-table">
          <thead>
            <tr>
              <th>Tên vai trò</th>
              <th>Mô tả</th>
              <th>Số người dùng</th>
              <th>Số quyền</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td>
                  <div className="role-name-cell">
                    <ShieldCheck size={16} className="role-icon" />
                    <strong>{role.name}</strong>
                  </div>
                </td>
                <td className="role-desc-cell">{role.description}</td>
                <td>
                  <span className="role-user-count">{role.userCount}</span>
                </td>
                <td>{role.permissions.length}</td>
                <td>
                  <div className="role-actions">
                    <button className="role-action-btn" onClick={() => openEdit(role)} title="Chỉnh sửa">
                      <Pencil size={14} />
                    </button>
                    {role.userCount === 0 && (
                      <button className="role-action-btn role-action-btn--delete" onClick={() => handleDelete(role)} title="Xoá">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="role-mgmt-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="role-mgmt-modal" onClick={e => e.stopPropagation()}>
            <div className="role-mgmt-modal-header">
              <h3>{editRole?.id ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="role-mgmt-modal-body">
              <div className="role-mgmt-field">
                <label>Tên vai trò *</label>
                <input
                  type="text"
                  value={editRole?.name || ''}
                  onChange={e => setEditRole(prev => ({ ...prev!, name: e.target.value }))}
                  placeholder="VD: MODERATOR"
                />
              </div>
              <div className="role-mgmt-field">
                <label>Mô tả</label>
                <input
                  type="text"
                  value={editRole?.description || ''}
                  onChange={e => setEditRole(prev => ({ ...prev!, description: e.target.value }))}
                  placeholder="Mô tả ngắn về vai trò..."
                />
              </div>

              <div className="role-mgmt-permissions">
                <div className="role-mgmt-permissions-header">
                  <label>Quyền hạn</label>
                  <button
                    className="role-mgmt-select-all"
                    onClick={() => setEditPermissions(
                      editPermissions.length === PERMISSIONS.length ? [] : [...PERMISSIONS]
                    )}
                  >
                    {editPermissions.length === PERMISSIONS.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                <div className="role-mgmt-permission-grid">
                  {PERMISSIONS.map(perm => (
                    <label key={perm} className={`role-perm-item ${editPermissions.includes(perm) ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={editPermissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                      />
                      <CheckCircle size={14} />
                      <span>{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="role-mgmt-modal-footer">
              <button className="lm-btn lm-btn--outline" onClick={() => setShowModal(false)}>Huỷ</button>
              <button className="lm-btn lm-btn--primary" onClick={handleSave}>
                {editRole?.id ? 'Lưu thay đổi' : 'Tạo vai trò'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
