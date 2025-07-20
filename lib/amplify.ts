import { Amplify } from 'aws-amplify';
import type { ResourcesConfig } from 'aws-amplify';

// Amplify設定（実際のデプロイ後に自動生成される設定ファイルを想定）
const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || 'us-east-1_XXXXXXXXX',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
      identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || 'us-east-1:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
      loginWith: {
        email: true,
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'https://XXXXXXXXXXXXXXXXXXXXXXXXXX.appsync-api.us-east-1.amazonaws.com/graphql',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      defaultAuthMode: 'apiKey',
      apiKey: process.env.NEXT_PUBLIC_API_KEY || 'da2-XXXXXXXXXXXXXXXXXXXXXXXXXX',
    },
  },
  Storage: {
    S3: {
      bucket: process.env.NEXT_PUBLIC_S3_BUCKET || 'amplify-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    },
  },
};

// カスタムAPI設定
export const customApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod',
  endpoints: {
    verifyQRToken: '/verify-qr-token',
    castVote: '/cast-vote', 
    getCandidates: '/get-candidates',
    checkVotingPeriod: '/check-voting-period',
    generateQRCodes: '/generate-qr-codes',
  },
};

// 開発環境用のモック設定
export const mockApiConfig = {
  baseUrl: 'http://localhost:3000/api',
  endpoints: {
    verifyQRToken: '/verify-qr-token',
    castVote: '/cast-vote',
    getCandidates: '/get-candidates', 
    checkVotingPeriod: '/check-voting-period',
    generateQRCodes: '/generate-qr-codes',
  },
};

// Amplifyの初期化
export function configureAmplify() {
  try {
    Amplify.configure(amplifyConfig);
    console.log('Amplify configured successfully');
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
  }
}

// 環境に応じた設定を取得
export function getApiConfig() {
  if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_API_BASE_URL) {
    return mockApiConfig;
  }
  return customApiConfig;
}