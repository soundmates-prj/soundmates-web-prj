export interface User {
  id: string;
  username: string;
  email: string;

  firstName: string;
  lastName: string;

  profileImageUrl: string | null;
  backgroundImageUrl: string | null;

  bio: string | null;

  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;

  location: string | null;
  website: string | null;

  createdAt: string;
  updatedAt: string;
}
