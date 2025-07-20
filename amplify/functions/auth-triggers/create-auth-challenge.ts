import { CreateAuthChallengeTriggerEvent } from 'aws-lambda';

export const handler = async (event: CreateAuthChallengeTriggerEvent) => {
  console.log('Create auth challenge trigger:', JSON.stringify(event, null, 2));

  try {
    const { request, response } = event;

    if (request.challengeName === 'CUSTOM_CHALLENGE') {
      // QRトークンチャレンジを作成
      response.publicChallengeParameters = {
        challengeType: 'QR_TOKEN_VALIDATION',
        message: 'QRコードトークンを提供してください',
      };

      response.privateChallengeParameters = {
        challengeType: 'QR_TOKEN_VALIDATION',
        timestamp: Date.now().toString(),
      };

      response.challengeMetadata = 'QR_TOKEN_CHALLENGE';
    }

    return event;

  } catch (error) {
    console.error('Create auth challenge error:', error);
    throw new Error('Create auth challenge failed');
  }
};