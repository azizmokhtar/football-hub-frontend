// src/types/index.ts

// ===================
// USER & AUTH
// ===================
export type UserRole = 'PLAYER' | 'COACH' | 'STAFF' | 'ADMIN';
export type UserPosition = 'GK' | 'DF' | 'MF' | 'FW';

export interface CustomUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  team: number | null; // ID of the team
  team_name: string | null;
  date_of_birth: string | null; // ISO date string
  jersey_number: number | null;
  position: UserPosition | null;
  profile_picture: string | null; // URL to the image
}

// From UserLoginView
export interface AuthResponse {
  access: string;
  refresh: string;
  user: CustomUser;
}

// For UserTeamListSerializer
export interface TeamMember {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  jersey_number: number | null;
  position: UserPosition | null;
  profile_picture: string | null;
}

// ===================
// TEAMS
// ===================
export interface Team {
  id: number;
  name: string;
  club_crest: string | null; // URL
  head_coach: number | null; // ID of the coach
  head_coach_name: string;
  head_coach_email: string;
  established_date: string | null; // ISO date string
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamSquad {
  id: number;
  name: string;
  players: TeamMember[];
}

export interface TeamStaff {
  id: number;
  name: string;
  staff: TeamMember[];
}

// ===================
// DOCUMENTS
// ===================
export interface Document {
  id: number;
  title: string;
  file: string; // URL
  uploaded_by: number;
  uploaded_by_name: string;
  team: number | null;
  team_name: string | null;
  shared_with_players: number[]; // Array of player IDs
  description: string | null;
  file_type: string;
  uploaded_at: string;
}

// ===================
// COMMUNICATION
// ===================
export interface Message {
  id: number;
  conversation: number;
  sender: number;
  sender_name: string;
  sender_email: string;
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: number;
  name: string | null;
  is_group_chat: boolean;
  participants: number[]; // Array of user IDs
  participants_details: CustomUser[]; // Full user objects
  created_at: string;
  updated_at: string;
  last_message: Message | null;
}

export interface Announcement {
  id: number;
  sender: number | null;
  sender_name: string;
  team: number;
  team_name: string;
  title: string;
  content: string;
  timestamp: string;
  is_urgent: boolean;
  read_by: number[]; // Array of user IDs
  read_by_count: number;
}

// ===================
// CALENDAR & EVENTS
// ===================
export type EventType = 'TRAINING' | 'MATCH' | 'MEETING' | 'TRAVEL' | 'RECOVERY' | 'OTHER';

export interface Event {
  id: number;
  title: string;
  description: string | null;
  team: number;
  team_name: string;
  event_type: EventType;
  start_time: string; // ISO datetime string
  end_time: string; // ISO datetime string
  location: string | null;
  created_by: number | null;
  created_by_name: string;
  is_mandatory: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'INJURED' | 'EXCUSED' | 'PENDING_CONFIRMATION';

export interface Attendance {
  id: number;
  event: number;
  event_title: string;
  player: number;
  player_name: string;
  player_position: UserPosition | null;
  status: AttendanceStatus;
  notes: string | null;
  reported_by: number | null;
  reported_by_name: string;
  timestamp: string;
}