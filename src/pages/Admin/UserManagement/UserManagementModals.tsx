import {
  X,
  Upload,
  Save,
  Check,
  AlertCircle,
  Loader2,

  Mail,
  Shield,
  Ban,


  Activity,
  MessageSquare,
  UserPlus,

} from 'lucide-react';
import { useState, useEffect } from 'react';
import './UserManagement.css';
import userService from '../../../services/userService';
import roleService, { type RoleDto } from '../../../services/roleService';
import { showSuccess, showError } from '../../../components/common/toastUtils';

// Modal Base Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

function Modal({ isOpen, onClose, title, children, size = 'medium' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${size}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} style={{ color: '#64748b' }} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
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

// Add User Modal
interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: '',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ username: '', firstName: '', lastName: '', email: '', password: '', roleId: '' });
      setSubmitting(false);
      // Load roles
      setLoadingRoles(true);
      roleService.getRoles().then(res => {
        if (res.success && res.data) setRoles(res.data);
        setLoadingRoles(false);
      }).catch(() => setLoadingRoles(false));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.username.trim()) {
      showError('Lỗi', 'Username không được để trống');
      return;
    }
    if (!formData.email.trim()) {
      showError('Lỗi', 'Email không được để trống');
      return;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      showError('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setSubmitting(true);
    const res = await userService.createUser({
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      firstName: formData.firstName.trim() || undefined,
      lastName: formData.lastName.trim() || undefined,
      roleId: formData.roleId || undefined,
    });
    setSubmitting(false);

    if (res.success) {
      showSuccess('Thành công', res.message || 'Người dùng đã được tạo thành công!');
      onSuccess();
      onClose();
    } else {
      showError('Thất bại', res.message || 'Không thể tạo người dùng');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm người dùng mới">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Username *</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="form-input"
            placeholder="vd: johndoe"
            required
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Họ</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="form-input"
              placeholder="vd: Nguyễn"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tên</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="form-input"
              placeholder="vd: Văn A"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="form-input"
            placeholder="example@email.com"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mật Khẩu *</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="form-input"
            placeholder="Ít nhất 6 ký tự"
            required
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Vai trò</label>
          {loadingRoles ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 9, color: 'var(--neutral-500)' }}>
              <Loader2 size={14} className="spinner" /> Đang tải vai trò...
            </div>
          ) : (
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              className="form-select"
            >
              <option value="">— Mặc định: MEMBER —</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="alert-box info" style={{ marginBottom: 16 }}>
          <Mail size={16} style={{ color: '#1a9fd4', flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: 13 }}>
            Tài khoản sẽ được tự động xác minh email và kích hoạt ngay sau khi tạo.
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? (
              <><Loader2 size={14} className="spinner" /> Đang tạo...</>
            ) : (
              <><UserPlus size={14} /> Thêm người dùng</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Edit User Modal
export function EditUserModal({ 
  isOpen, 
  onClose, 
  user 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: any 
}) {
  if (!user) return null;

  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'user',
    status: user.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Updating user:', formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh Sửa User">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Họ và Tên *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="form-input"
            required
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Vai Trò *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="form-select"
              required
            >
              <option value="user">User</option>
              <option value="mentor">Mentor</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Trạng Thái *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="form-select"
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} />
            Lưu Thay Đổi
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Delete User Modal
export function DeleteUserModal({ 
  isOpen, 
  onClose, 
  count,
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  count: number;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác Nhận Xóa User" size="small">
      <div className="alert-box">
        <div className="alert-icon-wrapper">
          <AlertCircle size={24} className="alert-icon" />
        </div>
        <div className="alert-text">
          <p className="alert-title">
            Bạn có chắc chắn muốn xóa {count} user{count > 1 ? 's' : ''} đã chọn?
          </p>
          <p className="alert-description">
            Hành động này không thể hoàn tác. Tất cả dữ liệu của user bao gồm broadcasts, playlists và hoạt động sẽ bị xóa vĩnh viễn.
          </p>
        </div>
      </div>

      <div className="modal-footer">
        <button onClick={onClose} className="btn btn-secondary">
          Hủy
        </button>
        <button onClick={onConfirm} className="btn btn-danger">
          Xóa User
        </button>
      </div>
    </Modal>
  );
}

// Ban User Modal
export function BanUserModal({ 
  isOpen, 
  onClose, 
  user 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: any;
}) {
  if (!user) return null;

  const [formData, setFormData] = useState({
    reason: '',
    duration: '7days',
    customDuration: '',
    notifyUser: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Banning user:', formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ban User" size="medium">
      <div className="user-details-header">
        <div className="user-avatar large">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            getInitials(user.name)
          )}
        </div>
        <div className="user-details-info">
          <h4 className="user-details-name">{user.name}</h4>
          <p className="user-details-email">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Thời Gian Ban</label>
          <div className="ban-duration-options">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, duration: '7days' })}
              className={`ban-duration-btn ${formData.duration === '7days' ? 'selected' : ''}`}
            >
              7 Ngày
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, duration: '30days' })}
              className={`ban-duration-btn ${formData.duration === '30days' ? 'selected' : ''}`}
            >
              30 Ngày
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, duration: 'permanent' })}
              className={`ban-duration-btn ${formData.duration === 'permanent' ? 'selected' : ''}`}
            >
              Vĩnh Viễn
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Lý Do Ban *</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="form-textarea"
            rows={4}
            placeholder="Nhập lý do ban user này..."
            required
          />
        </div>

        <div className="form-checkbox-wrapper">
          <input
            type="checkbox"
            id="notifyUser"
            checked={formData.notifyUser}
            onChange={(e) => setFormData({ ...formData, notifyUser: e.target.checked })}
            className="form-checkbox"
          />
          <label htmlFor="notifyUser" className="form-checkbox-label">
            Gửi thông báo đến user
          </label>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Hủy
          </button>
          <button type="submit" className="btn btn-danger">
            <Ban size={16} />
            Ban User
          </button>
        </div>
      </form>
    </Modal>
  );
}

// View User Details Modal
export function ViewUserModal({ 
  isOpen, 
  onClose, 
  user 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: any;
}) {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi Tiết User" size="large">
      <div className="user-details-header">
        <div className="user-avatar large">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            getInitials(user.name)
          )}
        </div>
        <div className="user-details-info">
          <h4 className="user-details-name">{user.name}</h4>
          <p className="user-details-email">{user.email}</p>
          <div className="user-details-badges">
            <span className={`role-badge ${user.role}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
            <span className={`status-badge ${user.status}`}>
              <span className={`status-dot ${user.status}`}></span>
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="user-details-section">
        <h4 className="card-title" style={{ marginBottom: '16px' }}>Thông Tin Cơ Bản</h4>
        <div className="user-details-grid">
          <div className="user-detail-item">
            <span className="user-detail-label">Ngày Tham Gia</span>
            <span className="user-detail-value">{user.joinDate}</span>
          </div>
          <div className="user-detail-item">
            <span className="user-detail-label">Hoạt Động Cuối</span>
            <span className="user-detail-value">{user.lastActive}</span>
          </div>
          <div className="user-detail-item">
            <span className="user-detail-label">Tổng Lượt Nghe</span>
            <span className="user-detail-value">{user.totalListens.toLocaleString()}</span>
          </div>
          <div className="user-detail-item">
            <span className="user-detail-label">Tổng Broadcasts</span>
            <span className="user-detail-value">{user.totalBroadcasts.toLocaleString()}</span>
          </div>
          <div className="user-detail-item">
            <span className="user-detail-label">Followers</span>
            <span className="user-detail-value">{user.followers.toLocaleString()}</span>
          </div>
          <div className="user-detail-item">
            <span className="user-detail-label">Following</span>
            <span className="user-detail-value">342</span>
          </div>
        </div>
      </div>

      <div className="user-details-section">
        <h4 className="card-title" style={{ marginBottom: '16px' }}>Hoạt Động Gần Đây</h4>
        <div className="activity-timeline">
          <div className="activity-item">
            <div className="activity-icon-wrapper primary">
              <Activity size={16} style={{ color: '#55c5f1' }} />
            </div>
            <div className="activity-content">
              <p className="activity-title">Bắt đầu broadcast "Đêm Nhạc Acoustic"</p>
              <p className="activity-time">2 giờ trước</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon-wrapper success">
              <Check size={16} style={{ color: '#22C55E' }} />
            </div>
            <div className="activity-content">
              <p className="activity-title">Đã hoàn thành broadcast</p>
              <p className="activity-time">5 giờ trước</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon-wrapper primary">
              <MessageSquare size={16} style={{ color: '#55c5f1' }} />
            </div>
            <div className="activity-content">
              <p className="activity-title">Đăng 3 bình luận mới</p>
              <p className="activity-time">1 ngày trước</p>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button onClick={onClose} className="btn btn-secondary">
          Đóng
        </button>
      </div>
    </Modal>
  );
}

// Role Management Modal
export function RoleManagementModal({ 
  isOpen, 
  onClose, 
  user 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: any;
}) {
  if (!user) return null;

  const [selectedRole, setSelectedRole] = useState(user.role || 'user');

  const roles = [
    { 
      id: 'user', 
      name: 'User', 
      description: 'Quyền cơ bản: nghe nhạc, tạo playlist, theo dõi broadcasts'
    },
    { 
      id: 'mentor', 
      name: 'Mentor', 
      description: 'Quyền User + tạo broadcasts, quản lý nội dung cá nhân'
    },
    { 
      id: 'moderator', 
      name: 'Moderator', 
      description: 'Quyền Mentor + kiểm duyệt nội dung, quản lý bình luận'
    },
    { 
      id: 'admin', 
      name: 'Admin', 
      description: 'Toàn quyền quản trị hệ thống'
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Changing role to:', selectedRole);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quản Lý Vai Trò" size="medium">
      <div className="user-details-header">
        <div className="user-avatar large">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            getInitials(user.name)
          )}
        </div>
        <div className="user-details-info">
          <h4 className="user-details-name">{user.name}</h4>
          <p className="user-details-email">{user.email}</p>
          <div className="user-details-badges">
            <span className={`role-badge ${user.role}`}>
              Vai trò hiện tại: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Chọn Vai Trò Mới</label>
          <div className="role-selection-grid">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`role-selection-item ${selectedRole === role.id ? 'selected' : ''}`}
              >
                <div className="role-selection-header">
                  <span className="role-selection-title">{role.name}</span>
                  {selectedRole === role.id && (
                    <Check size={16} className="role-selection-check" />
                  )}
                </div>
                <p className="role-selection-description">{role.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            <Shield size={16} />
            Cập Nhật Vai Trò
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Import Users Modal
export function ImportUsersModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = () => {
    if (file) {
      setImporting(true);
      setTimeout(() => {
        setImporting(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Users" size="medium">
      <div className="upload-area" style={{ marginBottom: '24px' }}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="upload-input"
          id="csvFile"
        />
        <label htmlFor="csvFile" style={{ cursor: 'pointer' }}>
          <Upload size={48} className="upload-area-icon" />
          <p className="upload-area-title" style={{ fontSize: '16px' }}>
            {file ? file.name : 'Kéo thả hoặc click để tải file CSV'}
          </p>
          <p className="upload-area-subtitle">
            File CSV phải có các cột: Name, Email, Role
          </p>
        </label>
      </div>

      <div className="warning-box">
        <p className="warning-title">Lưu ý quan trọng:</p>
        <ul className="warning-list">
          <li>Đảm bảo file CSV có đúng định dạng</li>
          <li>Email trùng lặp sẽ được bỏ qua</li>
          <li>Mật khẩu tạm thời sẽ được gửi qua email</li>
          <li>Vai trò mặc định là "user" nếu không chỉ định</li>
        </ul>
      </div>

      <div className="modal-footer">
        <button onClick={onClose} disabled={importing} className="btn btn-secondary">
          Hủy
        </button>
        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="btn btn-primary"
        >
          {importing ? (
            <>
              <div className="spinner" />
              Đang Import...
            </>
          ) : (
            <>
              <Upload size={16} />
              Import Users
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

// Send Message Modal
export function SendMessageModal({ 
  isOpen, 
  onClose, 
  users 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  users: any[];
}) {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    sendEmail: true,
    sendNotification: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sending message to users:', users, formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gửi Tin Nhắn" size="medium">
      <div style={{ marginBottom: '16px' }}>
        <label className="form-label">Người Nhận ({users.length})</label>
        <div className="message-recipients">
          {users.slice(0, 5).map((user) => (
            <div key={user.id} className="recipient-tag">
              <span>{user.name}</span>
            </div>
          ))}
          {users.length > 5 && (
            <div className="recipient-tag">
              <span>+{users.length - 5} khác</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Tiêu Đề *</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="form-input"
            placeholder="Nhập tiêu đề tin nhắn"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nội Dung *</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="form-textarea"
            rows={6}
            placeholder="Nhập nội dung tin nhắn..."
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-checkbox-wrapper">
            <input
              type="checkbox"
              id="sendEmail"
              checked={formData.sendEmail}
              onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
              className="form-checkbox"
            />
            <label htmlFor="sendEmail" className="form-checkbox-label">
              Gửi qua Email
            </label>
          </div>

          <div className="form-checkbox-wrapper">
            <input
              type="checkbox"
              id="sendNotification"
              checked={formData.sendNotification}
              onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
              className="form-checkbox"
            />
            <label htmlFor="sendNotification" className="form-checkbox-label">
              Gửi thông báo trong app
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            <Mail size={16} />
            Gửi Tin Nhắn
          </button>
        </div>
      </form>
    </Modal>
  );
}