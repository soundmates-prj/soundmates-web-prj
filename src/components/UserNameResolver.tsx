import { useState, useEffect } from 'react';
import userService from '../services/userService';

interface UserNameResolverProps {
  userId: string;
}

// Simple cache to avoid duplicate requests for the same user ID
const userCache = new Map<string, string>();

export function UserNameResolver({ userId }: UserNameResolverProps) {
  const [name, setName] = useState<string>('Đang tải...');

  useEffect(() => {
    if (!userId) {
      setName('Unknown');
      return;
    }

    if (userCache.has(userId)) {
      setName(userCache.get(userId)!);
      return;
    }

    let isMounted = true;
    
    userService.getPublicProfile(userId).then(res => {
      if (!isMounted) return;
      if (res.success && res.data) {
        // Use first name / last name if available, fallback to username
        const fullName = [res.data.lastName, res.data.firstName].filter(Boolean).join(' ');
        const resolvedName = fullName || res.data.username || userId;
        userCache.set(userId, resolvedName);
        setName(resolvedName);
      } else {
        setName(userId);
      }
    }).catch(() => {
      if (!isMounted) return;
      setName(userId);
    });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return <>{name}</>;
}
