'use client';

import { CandidateListProps } from '@/types/voting';
import Image from 'next/image';

export default function CandidateList({ 
  candidates, 
  selectedCandidate, 
  onCandidateSelect, 
  disabled 
}: CandidateListProps) {
  if (candidates.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">候補者が見つかりません</h3>
        <p className="text-gray-600">現在利用可能な候補者がいません。</p>
      </div>
    );
  }

  // Sort candidates by display order
  const sortedCandidates = [...candidates].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">候補者を選択してください</h2>
        <p className="text-gray-600">投票したい候補者を1人選択してください</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedCandidates.map((candidate) => (
          <div
            key={candidate.candidateId}
            className={`candidate-card ${selectedCandidate === candidate.candidateId ? 'selected' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onCandidateSelect(candidate.candidateId)}
          >
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id={candidate.candidateId}
                name="candidate"
                value={candidate.candidateId}
                checked={selectedCandidate === candidate.candidateId}
                onChange={() => !disabled && onCandidateSelect(candidate.candidateId)}
                disabled={disabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  {candidate.imageUrl && (
                    <div className="flex-shrink-0">
                      <Image
                        src={candidate.imageUrl}
                        alt={candidate.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <label 
                      htmlFor={candidate.candidateId}
                      className={`font-medium text-gray-900 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {candidate.name}
                    </label>
                    {candidate.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {candidate.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCandidate && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-800 font-medium">
              選択済み: {sortedCandidates.find(c => c.candidateId === selectedCandidate)?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}