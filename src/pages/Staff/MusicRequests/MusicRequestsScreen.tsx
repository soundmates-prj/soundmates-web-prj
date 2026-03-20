import { useState } from 'react';
import { Music, Search, CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react';
import './MusicRequestsScreen.css';

const musicRequests = [
  { id: 1, title: 'Bohemian Rhapsody', artist: 'Queen', user: 'User123', requestedAt: '2024-01-15 10:30', status: 'pending', genre: 'Rock', duration: '5:55' },
  { id: 2, title: 'Imagine', artist: 'John Lennon', user: 'MusicLover', requestedAt: '2024-01-15 11:15', status: 'pending', genre: 'Pop', duration: '3:03' },
  { id: 3, title: 'Hotel California', artist: 'Eagles', user: 'RockFan99', requestedAt: '2024-01-15 12:00', status: 'approved', genre: 'Rock', duration: '6:30' },
  { id: 4, title: 'Billie Jean', artist: 'Michael Jackson', user: 'PopKing', requestedAt: '2024-01-15 13:45', status: 'approved', genre: 'Pop', duration: '4:54' },
  { id: 5, title: 'Stairway to Heaven', artist: 'Led Zeppelin', user: 'ClassicRock', requestedAt: '2024-01-15 14:20', status: 'rejected', genre: 'Rock', duration: '8:02' },
  { id: 6, title: 'Sweet Child O Mine', artist: 'Guns N Roses', user: 'GnRFan', requestedAt: '2024-01-15 15:10', status: 'pending', genre: 'Rock', duration: '5:56' },
];

export function MusicRequestsScreen() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRequests = musicRequests.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: musicRequests.length,
    pending: musicRequests.filter(r => r.status === 'pending').length,
    approved: musicRequests.filter(r => r.status === 'approved').length,
    rejected: musicRequests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="music-requests-screen">
      <div className="requests-header">
        <div>
          <h1 className="requests-title">Music Requests</h1>
          <p className="requests-subtitle">Review and manage music requests from users</p>
        </div>
      </div>

      <div className="requests-stats">
        <div className="stat-item">
          <Music size={20} />
          <div>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Requests</span>
          </div>
        </div>
        <div className="stat-item pending">
          <Clock size={20} />
          <div>
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-item approved">
          <CheckCircle size={20} />
          <div>
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
        </div>
        <div className="stat-item rejected">
          <XCircle size={20} />
          <div>
            <span className="stat-value">{stats.rejected}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
      </div>

      <div className="requests-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by title or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button
            className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({stats.approved})
          </button>
          <button
            className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({stats.rejected})
          </button>
        </div>
      </div>

      <div className="requests-table-card">
        <table className="requests-table">
          <thead>
            <tr>
              <th>Song</th>
              <th>Artist</th>
              <th>Genre</th>
              <th>Duration</th>
              <th>Requested By</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => (
              <tr key={request.id}>
                <td>
                  <div className="song-cell">
                    <div className="song-icon">
                      <Music size={16} />
                    </div>
                    <span className="song-title">{request.title}</span>
                  </div>
                </td>
                <td>{request.artist}</td>
                <td>
                  <span className="genre-badge">{request.genre}</span>
                </td>
                <td>{request.duration}</td>
                <td>
                  <div className="user-cell">
                    <User size={14} />
                    {request.user}
                  </div>
                </td>
                <td>
                  <div className="date-cell">
                    <Calendar size={14} />
                    {new Date(request.requestedAt).toLocaleDateString('vi-VN')}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${request.status}`}>
                    {request.status === 'approved' && <CheckCircle size={14} />}
                    {request.status === 'rejected' && <XCircle size={14} />}
                    {request.status === 'pending' && <Clock size={14} />}
                    {request.status}
                  </span>
                </td>
                <td>
                  {request.status === 'pending' && (
                    <div className="action-buttons">
                      <button className="action-btn approve">
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button className="action-btn reject">
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
