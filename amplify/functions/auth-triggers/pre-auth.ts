import { PreAuthenticationTriggerEvent } from 'aws-lambda';

export const handler = async (event: PreAuthenticationTriggerEvent) => {
  console.log('Pre-authentication trigger:', JSON.stringify(event, null, 2));

  try {
    // QRトークンベースの認証の場合、ユーザー名チェックをスキップ
    if (event.request.userAttributes && 
        event.request.userAttributes.email && 
        event.request.userAttributes.email.startsWith('qr_')) {
      // QRトークンユーザーの場合は認証を許可
      return event;
    }

    // 通常のユーザーの場合は標準的な事前認証処理
    return event;

  } catch (error) {
    console.error('Pre-authentication error:', error);
    throw new Error('Pre-authentication failed');
  }
};