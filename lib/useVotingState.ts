'use client';

import { useReducer, useCallback } from 'react';
import { VotingState, VotingAction, VotingError, VotingErrorType, VotingSession } from '@/types/voting';

const initialState: VotingState = {
  currentSession: null,
  candidates: [],
  selectedCandidate: null,
  voterToken: null,
  hasVoted: false,
  loading: false,
  error: null,
};

function votingReducer(state: VotingState, action: VotingAction): VotingState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, currentSession: action.payload };
    case 'SET_CANDIDATES':
      return { ...state, candidates: action.payload };
    case 'SELECT_CANDIDATE':
      return { ...state, selectedCandidate: action.payload };
    case 'SET_VOTER_TOKEN':
      return { ...state, voterToken: action.payload };
    case 'SET_HAS_VOTED':
      return { ...state, hasVoted: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

export function useVotingState() {
  const [state, dispatch] = useReducer(votingReducer, initialState);

  const setSession = useCallback((session: VotingSession | null) => {
    dispatch({ type: 'SET_SESSION', payload: session });
  }, []);

  const setCandidates = useCallback((candidates: VotingState['candidates']) => {
    dispatch({ type: 'SET_CANDIDATES', payload: candidates });
  }, []);

  const selectCandidate = useCallback((candidateId: string) => {
    dispatch({ type: 'SELECT_CANDIDATE', payload: candidateId });
  }, []);

  const setVoterToken = useCallback((token: string) => {
    dispatch({ type: 'SET_VOTER_TOKEN', payload: token });
  }, []);

  const setHasVoted = useCallback((hasVoted: boolean) => {
    dispatch({ type: 'SET_HAS_VOTED', payload: hasVoted });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: VotingError | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const createError = useCallback((type: VotingErrorType, message: string, retryable = false): VotingError => {
    return {
      type,
      message,
      retryable,
      timestamp: new Date().toISOString(),
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    state,
    actions: {
      setSession,
      setCandidates,
      selectCandidate,
      setVoterToken,
      setHasVoted,
      setLoading,
      setError,
      resetState,
      createError,
      clearError,
    },
  };
}