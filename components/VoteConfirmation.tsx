'use client';

import { VoteConfirmationProps } from '@/types/voting';
import Image from 'next/image';

export default function VoteConfirmation({ candidate, onConfirm, onCancel }: VoteConfirmationProps) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">投票確認</h2>
        <p className="text-gray-600">以下の候補者に投票しますか？</p>
      </div>

      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-4">
          {candidate.imageUrl && (
            <div className="flex-shrink-0">
              <Image
                src={candidate.imageUrl}
                alt={candidate.name}
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-gray-900">{candidate.name}</h3>
            {candidate.description && (
              <p className="text-gray-600 mt-1">{candidate.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-yellow-800 font-medium">重要</h4>
            <p className="text-yellow-700 text-sm mt-1">
              投票は一度のみ行うことができます。投票後の変更はできません。
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          戻る
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 vote-button"
        >
          投票する
        </button>
      </div>
    </div>
  );
}