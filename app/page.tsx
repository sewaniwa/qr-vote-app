'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import QRScanner from '@/components/QRScanner';
import CandidateList from '@/components/CandidateList';
import VoteConfirmation from '@/components/VoteConfirmation';
import { useVotingState } from '@/lib/useVotingState';
import { Candidate, VotingErrorType, VotingSessionStatus } from '@/types/voting';
import { verifyQRToken, castVote, getCandidates, checkVotingPeriod, checkIfAlreadyVoted } from '@/lib/api';

// 仮のデータ（実際の実装ではAPIから取得）
const mockCandidates: Candidate[] = [
  {
    candidateId: '1',
    name: '田中太郎',
    description: '経験豊富なリーダーとして、組織の改革を推進します。',
    votingSessionId: 'session-1',
    displayOrder: 1,
  },
  {
    candidateId: '2',
    name: '佐藤花子',
    description: '新しいアイデアで組織に革新をもたらします。',
    votingSessionId: 'session-1',
    displayOrder: 2,
  },
  {
    candidateId: '3',
    name: '山田次郎',
    description: '安定した運営と着実な発展を目指します。',
    votingSessionId: 'session-1',
    displayOrder: 3,
  },
];

type VotingStep = 'qr-scan' | 'candidate-selection' | 'vote-confirmation' | 'vote-complete' | 'access-denied';

export default function VotingPage() {
  const { state, actions } = useVotingState();
  const [currentStep, setCurrentStep] = useState<VotingStep>('qr-scan');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Initialize with API data
    const loadCandidates = async () => {
      try {
        const { candidates } = await getCandidates();
        actions.setCandidates(candidates);
      } catch (error) {
        console.error('Failed to load candidates:', error);
        // Fallback to mock data
        actions.setCandidates(mockCandidates);
      }
    };
    
    loadCandidates();
  }, [actions]);

  const handleQRScanSuccess = async (token: string) => {
    try {
      actions.setLoading(true);
      actions.clearError();

      // QRトークンの検証（APIを呼び出し）
      const tokenResult = await verifyQRToken(token);
      
      if (tokenResult.isValid && tokenResult.sessionToken) {
        actions.setVoterToken(tokenResult.sessionToken);
        
        // 投票期間のチェック
        const periodResult = await checkVotingPeriod();
        
        if (periodResult.status === 'ACTIVE') {
          // 既に投票済みかチェック
          const hasAlreadyVoted = await checkIfAlreadyVoted(tokenResult.sessionToken);
          
          if (hasAlreadyVoted) {
            actions.setHasVoted(true);
            actions.setError(actions.createError(
              VotingErrorType.ALREADY_VOTED,
              'この投票権では既に投票が完了しています。',
              false
            ));
            setCurrentStep('access-denied');
          } else {
            setCurrentStep('candidate-selection');
            toast.success('認証が完了しました。候補者を選択してください。');
          }
        } else if (periodResult.status === 'PENDING') {
          actions.setError(actions.createError(
            VotingErrorType.VOTING_NOT_STARTED,
            periodResult.message || '投票はまだ開始されていません。',
            true
          ));
          setCurrentStep('access-denied');
        } else {
          actions.setError(actions.createError(
            VotingErrorType.VOTING_CLOSED,
            periodResult.message || '投票期間は終了しました。',
            false
          ));
          setCurrentStep('access-denied');
        }
      } else {
        actions.setError(actions.createError(
          VotingErrorType.INVALID_QR_CODE,
          '無効なQRコードです。正しいQRコードをスキャンしてください。',
          true
        ));
        toast.error('無効なQRコードです。');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      actions.setError(actions.createError(
        VotingErrorType.SYSTEM_ERROR,
        'システムエラーが発生しました。しばらく待ってから再試行してください。',
        true
      ));
      toast.error('システムエラーが発生しました。');
    } finally {
      actions.setLoading(false);
    }
  };

  const handleQRScanError = (error: string) => {
    actions.setError(actions.createError(
      VotingErrorType.SYSTEM_ERROR,
      error,
      true
    ));
    toast.error(error);
  };

  const handleCandidateSelect = (candidateId: string) => {
    actions.selectCandidate(candidateId);
  };

  const proceedToConfirmation = () => {
    if (state.selectedCandidate) {
      setCurrentStep('vote-confirmation');
    }
  };

  const handleVoteConfirm = async () => {
    if (!state.selectedCandidate || !state.voterToken) return;

    try {
      setIsSubmitting(true);
      
      // 投票の送信（APIを呼び出し）
      const result = await castVote(state.selectedCandidate, state.voterToken);
      
      if (result.success) {
        actions.setHasVoted(true);
        setCurrentStep('vote-complete');
        toast.success(result.message || '投票が完了しました。ありがとうございました。');
      } else {
        throw new Error(result.error || '投票の送信に失敗しました。');
      }
    } catch (error) {
      console.error('Vote submission error:', error);
      actions.setError(actions.createError(
        VotingErrorType.SYSTEM_ERROR,
        '投票の送信に失敗しました。再試行してください。',
        true
      ));
      toast.error('投票の送信に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteCancel = () => {
    setCurrentStep('candidate-selection');
  };

  const resetFlow = async () => {
    actions.resetState();
    setCurrentStep('qr-scan');
    
    // 候補者を再読み込み
    try {
      const { candidates } = await getCandidates();
      actions.setCandidates(candidates);
    } catch (error) {
      console.error('Failed to reload candidates:', error);
      actions.setCandidates(mockCandidates);
    }
  };

  const selectedCandidateData = state.selectedCandidate 
    ? state.candidates.find(c => c.candidateId === state.selectedCandidate)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">オンライン投票システム</h1>
          <p className="text-gray-600">QRコードを使った安全な投票</p>
        </div>

        {/* ステップインジケーター */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep === 'qr-scan' ? 'text-blue-600' : currentStep === 'access-denied' ? 'text-red-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${currentStep === 'qr-scan' ? 'bg-blue-600' : currentStep === 'access-denied' ? 'bg-red-600' : 'bg-green-600'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">QRスキャン</span>
            </div>
            <div className={`w-8 border-t-2 ${currentStep === 'candidate-selection' || currentStep === 'vote-confirmation' || currentStep === 'vote-complete' ? 'border-green-600' : 'border-gray-300'}`} />
            <div className={`flex items-center ${currentStep === 'candidate-selection' || currentStep === 'vote-confirmation' ? 'text-blue-600' : currentStep === 'vote-complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${currentStep === 'candidate-selection' || currentStep === 'vote-confirmation' ? 'bg-blue-600' : currentStep === 'vote-complete' ? 'bg-green-600' : 'bg-gray-400'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">候補者選択</span>
            </div>
            <div className={`w-8 border-t-2 ${currentStep === 'vote-complete' ? 'border-green-600' : 'border-gray-300'}`} />
            <div className={`flex items-center ${currentStep === 'vote-complete' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${currentStep === 'vote-complete' ? 'bg-green-600' : 'bg-gray-400'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">投票完了</span>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {currentStep === 'qr-scan' && (
            <QRScanner
              onScanSuccess={handleQRScanSuccess}
              onScanError={handleQRScanError}
            />
          )}

          {currentStep === 'candidate-selection' && (
            <div>
              <CandidateList
                candidates={state.candidates}
                selectedCandidate={state.selectedCandidate}
                onCandidateSelect={handleCandidateSelect}
                disabled={state.loading}
              />
              {state.selectedCandidate && (
                <div className="mt-6 text-center">
                  <button
                    onClick={proceedToConfirmation}
                    className="vote-button"
                    disabled={state.loading}
                  >
                    投票内容を確認する
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 'vote-confirmation' && selectedCandidateData && (
            <VoteConfirmation
              candidate={selectedCandidateData}
              onConfirm={handleVoteConfirm}
              onCancel={handleVoteCancel}
            />
          )}

          {currentStep === 'vote-complete' && (
            <div className="text-center p-8">
              <div className="mb-6">
                <svg className="w-20 h-20 mx-auto text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">投票完了</h2>
              <p className="text-gray-600 mb-6">
                投票が正常に記録されました。<br />
                ご協力ありがとうございました。
              </p>
              <div className="success-message">
                <p>あなたの投票は安全に保存されました。</p>
              </div>
            </div>
          )}

          {currentStep === 'access-denied' && (
            <div className="text-center p-8">
              <div className="mb-6">
                <svg className="w-20 h-20 mx-auto text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">アクセスできません</h2>
              {state.error && (
                <div className="error-message mb-6">
                  <p>{state.error.message}</p>
                </div>
              )}
              {state.error?.retryable && (
                <button
                  onClick={resetFlow}
                  className="vote-button"
                >
                  再試行
                </button>
              )}
            </div>
          )}

          {/* ローディング表示 */}
          {state.loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 text-center">
                <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">処理中...</p>
              </div>
            </div>
          )}

          {/* 投票送信中の表示 */}
          {isSubmitting && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 text-center">
                <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">投票を送信中...</p>
              </div>
            </div>
          )}
        </div>

        {/* デバッグ情報（開発時のみ） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold mb-2">Debug Info</h3>
            <p>Current Step: {currentStep}</p>
            <p>Selected Candidate: {state.selectedCandidate}</p>
            <p>Voter Token: {state.voterToken ? 'Present' : 'None'}</p>
            <p>Has Voted: {state.hasVoted ? 'Yes' : 'No'}</p>
            <button
              onClick={resetFlow}
              className="mt-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Reset Flow
            </button>
          </div>
        )}
      </div>
    </div>
  );
}