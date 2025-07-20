import { defineFunction } from '@aws-amplify/backend';

// QRトークン検証関数
export const verifyQRToken = defineFunction({
  name: 'verify-qr-token',
  entry: './verify-qr-token/handler.ts',
  environment: {
    VOTING_TOKENS_TABLE: 'VotingToken',
  },
});

// 投票送信関数
export const castVote = defineFunction({
  name: 'cast-vote',
  entry: './cast-vote/handler.ts',
  environment: {
    VOTES_TABLE: 'Vote',
    VOTING_TOKENS_TABLE: 'VotingToken',
  },
});

// 候補者取得関数
export const getCandidates = defineFunction({
  name: 'get-candidates',
  entry: './get-candidates/handler.ts',
  environment: {
    CANDIDATES_TABLE: 'Candidate',
  },
});

// 投票期間チェック関数
export const checkVotingPeriod = defineFunction({
  name: 'check-voting-period',
  entry: './check-voting-period/handler.ts',
  environment: {
    VOTING_SESSIONS_TABLE: 'VotingSession',
  },
});

// QRコード生成関数（管理者用）
export const generateQRCodes = defineFunction({
  name: 'generate-qr-codes',
  entry: './generate-qr-codes/handler.ts',
  environment: {
    VOTING_TOKENS_TABLE: 'VotingToken',
  },
});

// 認証トリガー関数
export const preAuthTrigger = defineFunction({
  name: 'pre-auth-trigger',
  entry: './auth-triggers/pre-auth.ts',
});

export const createAuthChallenge = defineFunction({
  name: 'create-auth-challenge',
  entry: './auth-triggers/create-auth-challenge.ts',
});

export const defineAuthChallenge = defineFunction({
  name: 'define-auth-challenge',
  entry: './auth-triggers/define-auth-challenge.ts',
});

export const verifyAuthChallenge = defineFunction({
  name: 'verify-auth-challenge',
  entry: './auth-triggers/verify-auth-challenge.ts',
});

export const votingFunctions = {
  verifyQRToken,
  castVote,
  getCandidates,
  checkVotingPeriod,
  generateQRCodes,
  preAuthTrigger,
  createAuthChallenge,
  defineAuthChallenge,
  verifyAuthChallenge,
};