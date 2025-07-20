import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'QR投票アプリ - 認証コード',
      verificationEmailBody: (createCode) =>
        `認証コード: ${createCode()}`,
    },
  },
  userAttributes: {
    email: {
      required: true,
    },
  },
  // カスタム認証フロー（QRトークンベース）の設定
  triggers: {
    preAuthentication: 'pre-auth-trigger',
    createAuthChallenge: 'create-auth-challenge',
    defineAuthChallenge: 'define-auth-challenge',
    verifyAuthChallengeResponse: 'verify-auth-challenge',
  },
});