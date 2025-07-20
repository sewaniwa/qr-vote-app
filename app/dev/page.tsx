'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function DevPage() {
  const [qrTokens] = useState([
    'VOTE_TOKEN_001_SESSION_1',
    'VOTE_TOKEN_002_SESSION_1',
    'VOTE_TOKEN_003_SESSION_1',
    'INVALID_TOKEN_004',
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">開発用QRコード</h1>
          <p className="text-gray-600">テスト用のQRコードです</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {qrTokens.map((token, index) => (
            <div key={token} className="bg-white rounded-lg shadow-md p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {token.startsWith('VOTE_') ? `有効なトークン ${index + 1}` : '無効なトークン'}
              </h3>
              <div className="flex justify-center mb-4">
                <QRCodeSVG
                  value={token}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-gray-600 break-all">{token}</p>
              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  token.startsWith('VOTE_') 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {token.startsWith('VOTE_') ? '有効' : '無効'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-yellow-800 font-medium">開発用ページ</h4>
              <p className="text-yellow-700 text-sm mt-1">
                これは開発・テスト用のページです。本番環境では利用できません。<br />
                上記のQRコードをスキャンして投票機能をテストできます。
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            投票ページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}