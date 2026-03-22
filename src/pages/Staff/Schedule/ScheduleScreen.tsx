import { useState } from 'react';
import { Calendar, Plus, Clock, Radio, User, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import './ScheduleScreen.css';

const scheduledSessions = [
  { id: 1, title: 'Morning Jazz', date: '2024-01-15', time: '08:00 - 10:00', host: 'Sarah Lee', station: 'Jazz Station', status: 'confirmed' },
  { id: 2, title: 'Chill Night Radio', date: '2024-01-15', time: '20:00 - 22:00', host: 'DJ Minh', station: 'Chill Station', status: 'confirmed' },
  { id: 3, title: 'Acoustic Session', date: '2024-01-16', time: '15:00 - 17:00', host: 'John Doe', station: 'Acoustic Station', status: 'pending' },
  { id: 4, title: 'EDM Night', date: '2024-01-17', time: '21:00 - 23:00', host: 'DJ Alex', station: 'EDM Station', status: 'confirmed' },
  { id: 5, title: 'Classical Evening', date: '2024-01-18', time: '19:00 - 21:00', host: 'Maria Chen', station: 'Classical Station', status: 'pending' },
];

export function ScheduleScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate] = useState(new Date());

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div className="schedule-screen">
      <div className="schedule-header">
        <div>
          <h1 className="schedule-title">Schedule Management</h1>
          <p className="schedule-subtitle">Plan and manage your live session schedule</p>
        </div>
        <button className="schedule-create-btn" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          Schedule Session
        </button>
      </div>

      <div className="schedule-calendar-card">
        <div className="calendar-header">
          <h3 className="calendar-title">
            <Calendar size={20} />
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="calendar-nav">
            <button className="calendar-nav-btn">
              <ChevronLeft size={20} />
            </button>
            <button className="calendar-nav-btn">Today</button>
            <button className="calendar-nav-btn">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="schedule-list">
          {scheduledSessions.map((session) => (
            <div key={session.id} className="schedule-item">
              <div className="schedule-item-date">
                <span className="schedule-date-day">{formatDate(session.date).split(' ')[0]}</span>
                <span className="schedule-date-num">{formatDate(session.date).split(' ')[1]}</span>
              </div>
              
              <div className="schedule-item-content">
                <div className="schedule-item-header">
                  <h4 className="schedule-item-title">{session.title}</h4>
                  <span className={`schedule-status-badge ${session.status}`}>
                    {session.status}
                  </span>
                </div>
                
                <div className="schedule-item-details">
                  <div className="schedule-detail">
                    <Clock size={14} />
                    <span>{session.time}</span>
                  </div>
                  <div className="schedule-detail">
                    <User size={14} />
                    <span>{session.host}</span>
                  </div>
                  <div className="schedule-detail">
                    <Radio size={14} />
                    <span>{session.station}</span>
                  </div>
                </div>
              </div>

              <div className="schedule-item-actions">
                <button className="schedule-action-btn edit">
                  <Edit size={16} />
                </button>
                <button className="schedule-action-btn delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <div className="schedule-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <h3>Schedule New Session</h3>
              <button className="schedule-modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            
            <div className="schedule-modal-body">
              <div className="schedule-form-group">
                <label>Session Title</label>
                <input type="text" placeholder="Enter session title" className="schedule-input" />
              </div>

              <div className="schedule-form-row">
                <div className="schedule-form-group">
                  <label>Date</label>
                  <input type="date" className="schedule-input" />
                </div>
                <div className="schedule-form-group">
                  <label>Start Time</label>
                  <input type="time" className="schedule-input" />
                </div>
                <div className="schedule-form-group">
                  <label>End Time</label>
                  <input type="time" className="schedule-input" />
                </div>
              </div>

              <div className="schedule-form-group">
                <label>Host</label>
                <select className="schedule-input">
                  <option>Select host</option>
                  <option>DJ Minh</option>
                  <option>Sarah Lee</option>
                  <option>John Doe</option>
                </select>
              </div>

              <div className="schedule-form-group">
                <label>Station</label>
                <select className="schedule-input">
                  <option>Select station</option>
                  <option>Jazz Station</option>
                  <option>Chill Station</option>
                  <option>EDM Station</option>
                </select>
              </div>

              <div className="schedule-form-group">
                <label>Description</label>
                <textarea className="schedule-textarea" rows={3} placeholder="Session description..."></textarea>
              </div>
            </div>

            <div className="schedule-modal-footer">
              <button className="schedule-btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="schedule-btn-primary">
                Schedule Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
