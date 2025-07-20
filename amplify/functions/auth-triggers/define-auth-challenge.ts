import { DefineAuthChallengeTriggerEvent } from 'aws-lambda';

export const handler = async (event: DefineAuthChallengeTriggerEvent) => {
  console.log('Define auth challenge trigger:', JSON.stringify(event, null, 2));

  try {
    const { request, response } = event;

    // QRトークンベース認証の場合
    if (request.userAttributes && 
        request.userAttributes.email && 
        request.userAttributes.email.startsWith('qr_')) {
      
      if (request.session.length === 0) {
        // 最初のチャレンジ：QRトークン検証
        response.challengeName = 'CUSTOM_CHALLENGE';
        response.issueTokens = false;
      } else if (request.session.length === 1 && 
                 request.session[0].challengeName === 'CUSTOM_CHALLENGE' && 
                 request.session[0].challengeResult === true) {
        // QRトークン検証成功：認証完了
        response.challengeName = '';
        response.issueTokens = true;
      } else {
        // 失敗
        response.challengeName = '';
        response.issueTokens = false;
      }
    } else {
      // 通常のユーザーの場合は標準的な認証フロー
      if (request.session.length === 0) {
        response.challengeName = 'SRP_A';
        response.issueTokens = false;
      } else if (request.session.length === 1 && 
                 request.session[0].challengeName === 'SRP_A') {
        response.challengeName = 'PASSWORD_VERIFIER';
        response.issueTokens = false;
      } else if (request.session.length === 2 && 
                 request.session[1].challengeName === 'PASSWORD_VERIFIER' && 
                 request.session[1].challengeResult === true) {
        response.challengeName = '';
        response.issueTokens = true;
      } else {
        response.challengeName = '';
        response.issueTokens = false;
      }
    }

    return event;

  } catch (error) {
    console.error('Define auth challenge error:', error);
    throw new Error('Define auth challenge failed');
  }
};