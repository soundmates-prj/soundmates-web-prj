import {
  Users,
  Search,
  RefreshCw,
  MoreVertical,
  Eye,
  Trash2,
  UserCog,
  XCircle,
  CheckCircle,
  MailCheck,
  AlertTriangle,
  Loader2,
  Plus,
  UserX,
  UserCheck,
  Power,
  PowerOff,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './UserManagement.css';
import userService, {
  type UserDto,
  AccountStatusEnum,
} from '../../../services/userService';
import { showSuccess, showError } from '../../../components/common/toastUtils';
import { AddUserModal } from './UserManagementModals';

// ── Enum helpers ────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: AccountStatusEnum.Active, label: 'Hoạt động', color: '#16a34a' },
  { value: AccountStatusEnum.Deactivated, label: 'Đã vô hiệu hóa', color: '#94a3b8' },
  { value: AccountStatusEnum.Suspended, label: 'Tạm khóa', color: '#dc2626' },
  { value: 4, label: 'Chờ xóa', color: '#f59e0b' },
] as const;

type StatusOption = typeof STATUS_OPTIONS[number];

const getStatusOption = (status: number): StatusOption =>
  STATUS_OPTIONS.find(o => o.value === status) ?? STATUS_OPTIONS[1];

const normalizeRole = (roleName?: string): string =>
  (roleName || '').trim().toUpperCase();

const isAdminRole = (roleName?: string): boolean => {
  const role = normalizeRole(roleName);
  return role === 'ADMIN' || role === 'ROLE_ADMIN';
};

const getCurrentUserIdFromStorage = (): string => {
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { id?: string | number };
    if (parsed?.id === undefined || parsed?.id === null) return '';
    return String(parsed.id);
  } catch {
    return '';
  }
};

const getDeleteBlockedReason = (targetUser: User | null, currentUserId: string): string | null => {
  if (!targetUser) return null;
  if (currentUserId && targetUser.id === currentUserId) {
    return 'Không thể xóa tài khoản của chính bạn.';
  }
  if (isAdminRole(targetUser.roleName)) {
    return 'Không thể xóa tài khoản Admin.';
  }
  return null;
};

// ── Types ─────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  roleName: string;
  isActive: boolean;
  isVerified: boolean;
  accountStatus: number;     // 1=Active 2=Deactivated 3=Suspended 4=DeletionPending
  deletionRequestedAt?: string | null;
  deletionScheduledAt?: string | null;
  deactivatedAt?: string | null;
  deactivationReason?: string | null;
  bannedAt?: string | null;
  banReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapUserDtoToUser(dto: UserDto): User {
  const fullName = [dto.lastName, dto.firstName].filter(Boolean).join(' ') || dto.username || '';
  // accountStatus is the canonical source of truth; fallback to legacy isActive/isBanned
  const accountStatus = dto.accountStatus ?? (dto.isActive ? 1 : 3);
  return {
    id: dto.id ?? '',
    name: fullName,
    email: dto.email ?? '',
    username: dto.username ?? '',
    roleName: dto.roleName || 'USER',
    isActive: dto.isActive ?? false,
    isVerified: dto.isVerified ?? false,
    accountStatus,
    deletionRequestedAt: dto.deletionRequestedAt ?? null,
    deletionScheduledAt: dto.deletionScheduledAt ?? null,
    deactivatedAt: dto.deactivatedAt ?? null,
    deactivationReason: dto.deactivationReason ?? null,
    bannedAt: dto.bannedAt ?? null,
    banReason: dto.banReason ?? null,
    createdAt: dto.createdAt || '',
    updatedAt: dto.updatedAt || '',
  };
}

// ── Modal Base ───────────────────────────────────────────────
function ModalBase({
  isOpen, onClose, title, children, size = 'medium', className,
}: {
  isOpen: boolean; onClose: () => void; title: string;
  children: React.ReactNode; size?: 'small' | 'medium' | 'large'; className?: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${size}${className ? ` ${className}` : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="modal-close-btn">
            <XCircle size={20} style={{ color: '#64748b' }} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function UserAvatar({ name }: { name?: string }) {
  const initials = (name || '')
    .split(' ')
    .map(w => w?.[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  return <div className="user-avatar large">{initials}</div>;
}

// ── 1. View Details Modal ─────────────────────────────────────
function ViewDetailsModal({
  isOpen, onClose, user,
}: { isOpen: boolean; onClose: () => void; user: User | null }) {
  if (!isOpen || !user) return null;
  const fmt = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleString('vi-VN') : '—';
  const statusOpt = getStatusOption(user.accountStatus);
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết người dùng"
      size="large"
      className="view-details-modal"
    >
      <div className="view-details-header">
        <UserAvatar name={user.name} />
        <div className="user-details-info">
          <h4 className="user-details-name view-details-name">{user.name}</h4>
          <p className="user-details-email view-details-email">{user.email}</p>
          <div className="user-details-badges view-details-badges">
            <span className={`lm-role-badge lm-role-${user.roleName?.toLowerCase()}`}>
              {user.roleName?.toUpperCase() || 'USER'}
            </span>
            <span className="lm-status-badge active">
              <CheckCircle size={12} /> {user.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
            </span>
            <span
              className="lm-status-badge"
              style={{ color: statusOpt.color, borderColor: `${statusOpt.color}33`, background: `${statusOpt.color}11` }}
            >
              {statusOpt.label}
            </span>
          </div>
        </div>
      </div>

      <div className="view-details-grid">
        <DetailField label="Username" value={user.username} />
        <DetailField label="Email" value={user.email} />
        <DetailField label="Vai trò" value={user.roleName} />
        <DetailField label="Trạng thái" value={statusOpt.label} />
        <DetailField label="Xác minh email" value={user.isVerified ? 'Đã xác minh' : 'Chưa xác minh'} />
        <DetailField label="Lý do" value={user.banReason || '—'} />
        <DetailField label="Ngày tạo" value={fmt(user.createdAt)} />
        <DetailField label="Cập nhật cuối" value={fmt(user.updatedAt)} />
        <DetailField label="Ngày khóa" value={fmt(user.bannedAt)} />
        <DetailField label="Ngày vô hiệu hóa" value={fmt(user.deactivatedAt)} />
      </div>

      <div className="modal-footer view-details-footer">
        <button onClick={onClose} className="btn btn-secondary">Đóng</button>
      </div>
    </ModalBase>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="view-detail-card">
      <div className="view-detail-label">{label}</div>
      <div className="view-detail-value">{value}</div>
    </div>
  );
}

// ── 2. Update Status Modal (unified) ─────────────────────────
function UpdateStatusModal({
  isOpen, onClose, user, onSuccess,
}: {
  isOpen: boolean; onClose: () => void; user: User | null; onSuccess: (userId: string, newStatus: number) => void;
}) {
  // Canonical status from accountStatus field (defaults to isActive for legacy)
  const currentStatus: number = user?.accountStatus
    ?? (user?.isActive ? AccountStatusEnum.Active : AccountStatusEnum.Deactivated);

  const [selected, setSelected] = useState<number>(currentStatus);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setSelected(user.accountStatus ?? (user.isActive ? AccountStatusEnum.Active : AccountStatusEnum.Deactivated));
      setReason('');
    }
  }, [isOpen, user]);

  const handle = async () => {
    if (!user || submitting) return;
    // Idempotent — no-op if same status
    if (selected === currentStatus) { onClose(); return; }
    setSubmitting(true);
    const res = await userService.updateAccountStatus(user.id, {
      status: selected as AccountStatusEnum,
      reason: reason || undefined,
    });
    if (res.success) {
      showSuccess('Đã cập nhật', 'Trạng thái tài khoản đã được cập nhật.');
      onSuccess(user.id, selected); onClose();
    } else {
      showError('Thất bại', 'Không thể cập nhật trạng thái tài khoản. Vui lòng thử lại.');
    }
    setSubmitting(false);
  };

  if (!isOpen || !user) return null;
  const currentOpt = getStatusOption(currentStatus);
  const selectedOpt = getStatusOption(selected);
  const isSame = selected === currentStatus;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Cập nhật trạng thái"
      size="small"
      className="update-status-modal"
    >
      <div className="update-status-user">
        <UserAvatar name={user.name} />
        <div className="update-status-user-info">
          <h4 className="user-details-name update-status-name">{user.name}</h4>
          <p className="user-details-email update-status-email">{user.email}</p>
          <div className="update-status-meta">
            <span
              className="lm-status-badge"
              style={{ color: currentOpt.color, borderColor: `${currentOpt.color}33`, background: `${currentOpt.color}11` }}
            >
              Hiện tại: {currentOpt.label}
            </span>
            <span
              className="lm-status-badge"
              style={{ color: selectedOpt.color, borderColor: `${selectedOpt.color}33`, background: `${selectedOpt.color}11` }}
            >
              Sắp cập nhật: {selectedOpt.label}
            </span>
          </div>
        </div>
      </div>

      {/* Status picker */}
      <div className="update-status-picker">
        <label className="form-label update-status-picker-label">Chọn trạng thái mới</label>
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelected(opt.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              border: `2px solid ${selected === opt.value ? opt.color : 'var(--neutral-200)'}`,
              borderRadius: 10,
              background: selected === opt.value ? `${opt.color}11` : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
            className="status-picker-btn"
            data-selected={selected === opt.value}
            data-color={opt.color}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: `2px solid ${selected === opt.value ? opt.color : 'var(--neutral-300)'}`,
              background: selected === opt.value ? opt.color : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }} className="sp-icon">
              {selected === opt.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} className="sp-icon-dot" />}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: opt.color }} className="sp-label">
              {opt.value === AccountStatusEnum.Active && <Power size={15} style={{ marginRight: 6, display: 'inline' }} />}
              {opt.value === AccountStatusEnum.Deactivated && <PowerOff size={15} style={{ marginRight: 6, display: 'inline' }} />}
              {opt.value === AccountStatusEnum.Suspended && <AlertTriangle size={15} style={{ marginRight: 6, display: 'inline', color: opt.color }} />}
              {opt.label}
            </span>
          </button>
        ))}
      </div>

      {/* Reason */}
      <div className="form-group">
        <label className="form-label">
          Lý do
          {selected !== currentStatus && selected !== AccountStatusEnum.Active && ' *'}
        </label>
        <textarea
          className="form-textarea"
          rows={3}
          placeholder="Nhập lý do thay đổi trạng thái..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          required={selected !== currentStatus && selected !== AccountStatusEnum.Active}
        />
      </div>

      <div className="modal-footer modal-footer--actions update-status-footer">
        <button onClick={onClose} className="btn btn-secondary update-status-btn update-status-btn--cancel" disabled={submitting}>Hủy</button>
        <button
          onClick={handle}
          className={`update-status-btn update-status-btn--confirm ${isSame ? 'btn btn-secondary' : 'btn btn-primary'}`}
          disabled={submitting || (!isSame && selected !== AccountStatusEnum.Active && !reason.trim())}
        >
          {submitting ? (
            <><Loader2 size={14} className="spinner" /> Đang xử lý...</>
          ) : isSame ? (
            'Không thay đổi'
          ) : (
            <><CheckCircle size={14} /> Cập nhật</>
          )}
        </button>
      </div>
    </ModalBase>
  );
}

// ── 3. Verify Email Modal ───────────────────────────────────────
function VerifyEmailModal({
  isOpen, onClose, user, onSuccess,
}: {
  isOpen: boolean; onClose: () => void; user: User | null; onSuccess: (userId: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const handle = async () => {
    if (!user) return;
    setSubmitting(true);
    const res = await userService.verifyEmail(user.id);
    if (res.success) {
      showSuccess('Đã xác minh', `Email của "${user.name}" đã được xác minh và tài khoản kích hoạt.`);
      onSuccess(user.id); onClose();
    } else {
      showError('Thất bại', 'Không thể xác minh email. Vui lòng thử lại.');
    }
    setSubmitting(false);
  };
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Xác minh email người dùng"
      size="small"
      className="verify-email-modal"
    >
      <div className="verify-email-user">
        <UserAvatar name={user?.name || ''} />
        <div className="verify-email-user-info">
          <h4 className="user-details-name verify-email-name">{user?.name}</h4>
          <p className="user-details-email verify-email-address">{user?.email}</p>
        </div>
      </div>
      <div className="alert-box info verify-email-note">
        <MailCheck size={20} style={{ color: '#1a9fd4', flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 13 }}>Email sẽ được xác minh và tài khoản kích hoạt mà không cần OTP.</p>
      </div>
      <div className="modal-footer modal-footer--actions verify-email-footer">
        <button onClick={onClose} className="btn btn-secondary verify-email-btn verify-email-btn--cancel" disabled={submitting}>Hủy</button>
        <button onClick={handle} className="btn btn-primary verify-email-btn verify-email-btn--confirm" disabled={submitting}>
          {submitting ? <><Loader2 size={14} className="spinner" /> Đang xử lý...</> : <><MailCheck size={14} /> Xác minh email</>}
        </button>
      </div>
    </ModalBase>
  );
}

// ── 4. Delete Confirmation Modal ──────────────────────────────────
function DeleteModal({
  isOpen, onClose, user, onSuccess, currentUserId,
}: {
  isOpen: boolean; onClose: () => void; user: User | null; onSuccess: (userId: string) => void; currentUserId: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const deleteBlockedReason = getDeleteBlockedReason(user, currentUserId);
  const isDeleteBlocked = !!deleteBlockedReason;

  const handle = async () => {
    if (!user) return;
    if (isDeleteBlocked) {
      showError('Không thể xóa', deleteBlockedReason || 'Tài khoản này không thể bị xóa.');
      return;
    }
    setSubmitting(true);
    const res = await userService.deleteUser(user.id);
    if (res.success) {
      showSuccess('Đã xóa', `Tài khoản "${user.name}" đã bị xóa vĩnh viễn.`);
      onSuccess(user.id); onClose();
    } else {
      showError('Thất bại', 'Không thể xóa tài khoản. Vui lòng thử lại.');
    }
    setSubmitting(false);
  };
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Xác nhận xóa người dùng" size="small">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <UserAvatar name={user?.name || ''} />
        <div>
          <h4 style={{ margin: 0 }}>{user?.name}</h4>
          <p style={{ margin: 0, color: 'var(--neutral-500)', fontSize: 13 }}>{user?.email}</p>
        </div>
      </div>
      <div className={`alert-box ${isDeleteBlocked ? 'info' : 'danger'}`}>
        <AlertTriangle size={20} style={{ color: isDeleteBlocked ? '#f59e0b' : '#dc2626', flexShrink: 0 }} />
        <div>
          {isDeleteBlocked ? (
            <>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>Tài khoản được bảo vệ</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--neutral-500)' }}>{deleteBlockedReason}</p>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#dc2626' }}>Hành động này không thể hoàn tác!</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--neutral-500)' }}>Tài khoản sẽ bị xóa vĩnh viễn cùng với tất cả dữ liệu liên quan.</p>
            </>
          )}
        </div>
      </div>
      <div className="modal-footer" style={{ marginTop: 16 }}>
        <button onClick={onClose} className="btn btn-secondary" disabled={submitting}>Hủy</button>
        <button onClick={handle} className="btn btn-danger" disabled={submitting || isDeleteBlocked}>
          {isDeleteBlocked
            ? <><XCircle size={14} /> Không thể xóa</>
            : submitting
              ? <><Loader2 size={14} className="spinner" /> Đang xóa...</>
              : <><Trash2 size={14} /> Xóa vĩnh viễn</>}
        </button>
      </div>
    </ModalBase>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="lm-stat-card">
      <div className="lm-stat-icon">{icon}</div>
      <div className="lm-stat-content">
        <span className="lm-stat-label">{label}</span>
        <span className="lm-stat-value">{value}</span>
      </div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────
export function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // Modal states
  const [viewModal, setViewModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [addUserModal, setAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');

  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  const closeActionMenu = () => {
    setActiveActionMenu(null);
    setActionMenuPosition(null);
  };

  const positionActionMenu = (userId: string) => {
    const wrapper = rowRefs.current.get(userId);
    const trigger = wrapper?.querySelector<HTMLButtonElement>('.lm-action-btn');
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 8;
    const menuEl = actionMenuRef.current;
    const menuWidth = menuEl?.offsetWidth ?? 192;
    const menuHeight = menuEl?.offsetHeight ?? 0;

    let left = rect.right - menuWidth;
    left = Math.max(
      viewportPadding,
      Math.min(left, window.innerWidth - menuWidth - viewportPadding),
    );

    let top = rect.bottom + 6;
    if (menuHeight > 0 && top + menuHeight > window.innerHeight - viewportPadding) {
      top = rect.top - menuHeight - 6;
    }

    if (menuHeight > 0) {
      top = Math.max(
        viewportPadding,
        Math.min(top, window.innerHeight - menuHeight - viewportPadding),
      );
    }

    setActionMenuPosition(prev => {
      if (prev && Math.abs(prev.top - top) < 0.5 && Math.abs(prev.left - left) < 0.5) {
        return prev;
      }
      return { top, left };
    });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!activeActionMenu) return;
      const target = e.target as Node;
      const triggerWrapper = rowRefs.current.get(activeActionMenu);
      if (triggerWrapper?.contains(target) || actionMenuRef.current?.contains(target)) return;
      closeActionMenu();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeActionMenu]);

  useEffect(() => {
    if (!activeActionMenu) return;

    const syncPosition = () => positionActionMenu(activeActionMenu);
    syncPosition();

    window.addEventListener('resize', syncPosition);
    window.addEventListener('scroll', syncPosition, true);

    return () => {
      window.removeEventListener('resize', syncPosition);
      window.removeEventListener('scroll', syncPosition, true);
    };
  }, [activeActionMenu]);

  useEffect(() => {
    const syncCurrentUser = () => setCurrentUserId(getCurrentUserIdFromStorage());
    syncCurrentUser();
    window.addEventListener('authChange', syncCurrentUser);
    window.addEventListener('storage', syncCurrentUser);
    return () => {
      window.removeEventListener('authChange', syncCurrentUser);
      window.removeEventListener('storage', syncCurrentUser);
    };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => fetchUsers(), 500);
    return () => clearTimeout(id);
  }, [currentPage, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers({ q: searchQuery || undefined, page: currentPage, pageSize });
      if (res.success && res.data?.items) {
        setUsers(res.data.items.map(mapUserDtoToUser));
        setTotalItems(res.data.totalItems || 0);
        setTotalPages(res.data.totalPages || 0);
      } else {
        setUsers([]); setTotalItems(0); setTotalPages(0);
      }
    } catch (err) {
      console.error('[UserManagement] fetchUsers error:', err);
      setUsers([]); setTotalItems(0); setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (setter: React.Dispatch<React.SetStateAction<boolean>>, user: User) => {
    setSelectedUser(user);
    setter(true);
    closeActionMenu();
  };

  // Reset to page 1 + clear search after any mutation so the table always shows valid data
  const resetAndRefresh = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchUsers();
  };

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

  // Stats — derive from canonical accountStatus field
  const activeCount = users.filter(u => u.accountStatus === AccountStatusEnum.Active).length;
  const inactiveCount = users.filter(u => u.accountStatus !== AccountStatusEnum.Active).length;
  const verifiedCount = users.filter(u => u.isVerified).length;
  const activeActionUser = users.find(u => u.id === activeActionMenu) ?? null;
  const activeDeleteBlockedReason = getDeleteBlockedReason(activeActionUser, currentUserId);
  const activeIsDeleteBlocked = !!activeDeleteBlockedReason;
  const activeDeleteActionLabel = activeIsDeleteBlocked
    ? (activeActionUser && currentUserId && activeActionUser.id === currentUserId ? 'Không thể xóa bản thân' : 'Không thể xóa Admin')
    : 'Xóa vĩnh viễn';

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
            <RefreshCw size={15} /> Làm mới
          </button>
          <button className="lm-btn lm-btn--primary" onClick={() => setAddUserModal(true)}>
            <Plus size={15} /> Thêm người dùng
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="lm-stats-grid">
        <StatCard icon={<Users size={20} />} label="Tổng Users" value={totalItems.toLocaleString()} />
        <StatCard icon={<UserCheck size={20} />} label="Hoạt động" value={activeCount.toLocaleString()} />
        <StatCard icon={<UserX size={20} />} label="Không hoạt động" value={inactiveCount.toLocaleString()} />
        <StatCard icon={<MailCheck size={20} />} label="Đã xác minh" value={verifiedCount.toLocaleString()} />
      </div>

      {/* Table Card */}
      <div className="lm-card">
        <div className="lm-card-header">
          <h3 className="lm-card-title">Danh sách người dùng</h3>
        </div>

        {/* Search */}
        <div className="lm-search-bar">
          <div className="lm-search-wrapper">
            <Search size={18} className="lm-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, username..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
          <div className="lm-empty"><Users size={48} /><p>Không tìm thấy người dùng nào</p></div>
        )}

        {/* Table */}
        {!loading && users.length > 0 && (
          <div className="lm-table-wrapper">
            <table className="lm-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th className="center">Vai Trò</th>
                  <th className="center">Xác minh</th>
                  <th className="center">Trạng Thái</th>
                  <th className="center">Ngày tạo</th>
                  <th style={{ width: 48 }}></th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const statusOpt = getStatusOption(user.accountStatus);
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="lm-user-cell">
                          <div className="lm-user-avatar">
                            {(user.name || '').split(' ').map(w => w?.[0] || '').join('').toUpperCase().slice(0, 2) || '?'}
                          </div>
                          <div className="lm-user-info">
                            <p className="lm-user-name">{user.name}</p>
                            <p className="lm-user-email">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="center">
                        <span className={`lm-role-badge lm-role-${user.roleName?.toLowerCase()}`}>
                          {user.roleName?.toUpperCase() || 'USER'}
                        </span>
                      </td>

                      <td className="center">
                        {user.isVerified ? (
                          <span className="lm-status-badge active"><CheckCircle size={12} /> Đã xác minh</span>
                        ) : (
                          <span className="lm-status-badge inactive"><XCircle size={12} /> Chưa xác minh</span>
                        )}
                      </td>

                      <td className="center">
                        <span
                          className="lm-status-badge"
                          style={{ color: statusOpt.color, borderColor: `${statusOpt.color}33`, background: `${statusOpt.color}11` }}
                        >
                          {statusOpt.label}
                        </span>
                      </td>

                      <td className="center">
                        <span className="lm-text-small">{fmt(user.createdAt)}</span>
                      </td>

                      <td className="lm-action-cell">
                        <div
                          className="lm-action-menu-wrapper"
                          ref={el => {
                            if (el) rowRefs.current.set(user.id, el);
                            else rowRefs.current.delete(user.id);
                          }}
                        >
                          <button
                            onClick={() => {
                              if (activeActionMenu === user.id) {
                                closeActionMenu();
                                return;
                              }
                              setActiveActionMenu(user.id);
                              positionActionMenu(user.id);
                            }}
                            className="lm-action-btn"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="lm-pagination">
            <p className="lm-pagination-info">
              Hiển thị {users.length} trên tổng {totalItems.toLocaleString()} người dùng
            </p>
            <div className="lm-pagination-buttons">
              <button className="lm-pagination-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}>Trước</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button key={pageNum}
                    className={`lm-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}>{pageNum}</button>
                );
              })}
              <button className="lm-pagination-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}>Sau</button>
            </div>
          </div>
        )}
      </div>

      {activeActionUser && actionMenuPosition && createPortal(
        <div
          ref={actionMenuRef}
          className="lm-action-dropdown lm-action-dropdown--floating"
          style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
        >
          {/* View */}
          <button className="lm-action-item"
            onClick={() => openModal(setViewModal, activeActionUser)}>
            <Eye size={16} /><span>Xem chi tiết</span>
          </button>

          <div className="lm-action-divider" />

          {/* Verify Email — only if not verified */}
          {!activeActionUser.isVerified && (
            <button className="lm-action-item"
              onClick={() => openModal(setVerifyModal, activeActionUser)}>
              <MailCheck size={16} /><span>Xác minh email</span>
            </button>
          )}

          {/* Update Status */}
          <button className="lm-action-item"
            onClick={() => openModal(setStatusModal, activeActionUser)}>
            <UserCog size={16} /><span>Cập nhật trạng thái</span>
          </button>

          <div className="lm-action-divider" />

          {/* Delete */}
          <button
            className="lm-action-item danger"
            onClick={() => {
              if (activeIsDeleteBlocked) return;
              openModal(setDeleteModal, activeActionUser);
            }}
            disabled={activeIsDeleteBlocked}
            title={activeDeleteBlockedReason || undefined}
          >
            <Trash2 size={16} /><span>{activeDeleteActionLabel}</span>
          </button>
        </div>,
        document.body,
      )}

      {/* Modals */}
      <ViewDetailsModal isOpen={viewModal} onClose={() => setViewModal(false)} user={selectedUser} />
      <UpdateStatusModal
        isOpen={statusModal}
        onClose={() => setStatusModal(false)}
        user={selectedUser}
        onSuccess={(userId, newStatus) => {
          // Optimistic update: update local state immediately — no need to wait for event sync
          setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, accountStatus: newStatus } : u
          ));
        }}
      />
      <VerifyEmailModal
        isOpen={verifyModal}
        onClose={() => setVerifyModal(false)}
        user={selectedUser}
        onSuccess={(userId) => {
          // Optimistic: mark verified + active locally
          setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, isVerified: true, accountStatus: AccountStatusEnum.Active } : u
          ));
        }}
      />
      <DeleteModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        user={selectedUser}
        currentUserId={currentUserId}
        onSuccess={(userId) => {
          // Optimistic: remove deleted user from local list
          setUsers(prev => prev.filter(u => u.id !== userId));
          setTotalItems(prev => Math.max(0, prev - 1));
        }}
      />
      <AddUserModal
        isOpen={addUserModal}
        onClose={() => setAddUserModal(false)}
        onSuccess={() => { setAddUserModal(false); resetAndRefresh(); }}
      />
    </div>
  );
}
