import { z } from 'zod';

// Data Model Interfaces based on design specification

export interface VotingToken {
  pk: string;               // PK: votingSessionId#tokenId (ホットパーティション回避)
  hashedToken: string;      // QRコードのハッシュ値（AES-GCM 256 + HMAC署名）
  isUsed: boolean;         // 使用済みフラグ
  voterId: string;         // 投票者ID（匿名化）
  createdAt: string;       // 作成日時
  usedAt?: string;         // 使用日時
  ttl: number;             // TTL属性（期限切れ自動削除）
  votingSessionId: string; // GSI PK
}

export interface Vote {
  pk: string;               // PK: votingSessionId#voteId
  sk: string;               // SK: candidateId#timestamp (LSI用)
  candidateId: string;      // GSI PK（開票時の集計用）
  voterHash: string;        // 投票者の匿名ハッシュ
  timestamp: string;        // 投票日時
  votingSessionId: string;  // 投票セッションID
}

export interface Candidate {
  candidateId: string;      // PK
  name: string;            // 候補者名
  description?: string;     // 説明
  imageUrl?: string;       // 画像URL
  votingSessionId: string; // GSI PK
  displayOrder: number;    // 表示順序
}

export type VotingSessionStatus = 'PENDING' | 'ACTIVE' | 'CLOSED';

export interface VotingSession {
  sessionId: string;        // PK
  title: string;           // 投票タイトル
  description?: string;     // 説明
  startTime: string;       // 開始時刻
  endTime: string;         // 終了時刻
  status: VotingSessionStatus;
  createdAt: string;
  updatedAt: string;
}

// Error handling types
export enum VotingErrorType {
  INVALID_QR_CODE = 'INVALID_QR_CODE',
  ALREADY_VOTED = 'ALREADY_VOTED',
  VOTING_CLOSED = 'VOTING_CLOSED',
  VOTING_NOT_STARTED = 'VOTING_NOT_STARTED',
  INVALID_CANDIDATE = 'INVALID_CANDIDATE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

export interface VotingError {
  type: VotingErrorType;
  message: string;
  retryable: boolean;
  timestamp: string;
}

// API Request/Response types
export interface QRTokenVerificationRequest {
  token: string;
  timestamp: string;
}

export interface QRTokenVerificationResponse {
  isValid: boolean;
  voterId: string;
  sessionToken: string;
}

export interface CastVoteRequest {
  candidateId: string;
  voterToken: string;
}

export interface CastVoteResponse {
  success: boolean;
  message: string;
  voteId?: string;
}

// Component prop interfaces
export interface QRScannerProps {
  onScanSuccess: (token: string) => void;
  onScanError: (error: string) => void;
}

export interface CandidateListProps {
  candidates: Candidate[];
  selectedCandidate: string | null;
  onCandidateSelect: (candidateId: string) => void;
  disabled: boolean;
}

export interface VoteConfirmationProps {
  candidate: Candidate;
  onConfirm: () => void;
  onCancel: () => void;
}

// Zod validation schemas
export const VotingTokenSchema = z.object({
  pk: z.string(),
  hashedToken: z.string(),
  isUsed: z.boolean(),
  voterId: z.string(),
  createdAt: z.string(),
  usedAt: z.string().optional(),
  ttl: z.number(),
  votingSessionId: z.string(),
});

export const VoteSchema = z.object({
  pk: z.string(),
  sk: z.string(),
  candidateId: z.string(),
  voterHash: z.string(),
  timestamp: z.string(),
  votingSessionId: z.string(),
});

export const CandidateSchema = z.object({
  candidateId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  votingSessionId: z.string(),
  displayOrder: z.number(),
});

export const VotingSessionSchema = z.object({
  sessionId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum(['PENDING', 'ACTIVE', 'CLOSED']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const QRTokenVerificationRequestSchema = z.object({
  token: z.string(),
  timestamp: z.string(),
});

export const CastVoteRequestSchema = z.object({
  candidateId: z.string(),
  voterToken: z.string(),
});

// Utility types for state management
export interface VotingState {
  currentSession: VotingSession | null;
  candidates: Candidate[];
  selectedCandidate: string | null;
  voterToken: string | null;
  hasVoted: boolean;
  loading: boolean;
  error: VotingError | null;
}

export type VotingAction = 
  | { type: 'SET_SESSION'; payload: VotingSession | null }
  | { type: 'SET_CANDIDATES'; payload: Candidate[] }
  | { type: 'SELECT_CANDIDATE'; payload: string }
  | { type: 'SET_VOTER_TOKEN'; payload: string }
  | { type: 'SET_HAS_VOTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: VotingError | null }
  | { type: 'RESET_STATE' };