import React from 'react';
import { Avatar, Badge, Button } from '../common';
import './UserProfileCard.css';

interface UserProfileCardProps {
    name: string;
    email: string;
    avatarUrl?: string;
    role?: string;
    onMyAccountClick?: () => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({
    name,
    email,
    avatarUrl,
    role,
    onMyAccountClick,
}) => {
    return (
        <div className="user-profile-card">
            <div className="user-profile-card-content">
                <Avatar
                    src={avatarUrl}
                    name={name}
                    size="lg"
                />
                <div className="user-profile-card-info">
                    <h3 className="user-profile-card-name">{name}</h3>
                    <p className="user-profile-card-email">{email}</p>
                    {role && (
                        <Badge variant="primary" className="user-profile-card-badge">
                            {role}
                        </Badge>
                    )}
                </div>
            </div>
            <div className="user-profile-card-actions">
                <Button
                    variant="secondary"
                    leftIcon="user"
                    onClick={onMyAccountClick}
                >
                    MY ACCOUNT
                </Button>
            </div>
        </div>
    );
};

export default UserProfileCard;
