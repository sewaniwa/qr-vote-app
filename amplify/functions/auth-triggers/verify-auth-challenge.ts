import { VerifyAuthChallengeResponseTriggerEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { createHmac } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: VerifyAuthChallengeResponseTriggerEvent) => {
  console.log('Verify auth challenge trigger:', JSON.stringify(event, null, 2));

  try {
    const { request, response } = event;

    if (request.privateChallengeParameters?.challengeType === 'QR_TOKEN_VALIDATION') {
      const qrToken = request.challengeAnswer;
      
      if (!qrToken) {
        response.answerCorrect = false;
        return event;
      }

      // QRトークンの検証
      const isValid = await validateQRToken(qrToken);
      response.answerCorrect = isValid;

      if (isValid) {
        console.log('QR token validation successful');
      } else {
        console.log('QR token validation failed');
      }
    } else {
      // 他のチャレンジタイプの場合はfalse
      response.answerCorrect = false;
    }

    return event;

  } catch (error) {
    console.error('Verify auth challenge error:', error);
    response.answerCorrect = false;
    return event;
  }
};

async function validateQRToken(token: string): Promise<boolean> {
  try {
    if (!token.startsWith('VOTE_')) {
      return false;
    }

    const hashedToken = createTokenHash(token);
    
    // DynamoDBからトークンを検索
    const getParams = {
      TableName: process.env.VOTING_TOKENS_TABLE || 'VotingToken',
      Key: {
        pk: hashedToken,
      },
    };

    const getResult = await docClient.send(new GetCommand(getParams));

    if (!getResult.Item) {
      return false;
    }

    const tokenData = getResult.Item;

    // トークンが既に使用済みかチェック
    if (tokenData.isUsed) {
      return false;
    }

    // TTLチェック（期限切れ）
    if (tokenData.ttl && Date.now() / 1000 > tokenData.ttl) {
      return false;
    }

    return true;

  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

function createTokenHash(token: string): string {
  const secret = process.env.TOKEN_SECRET || 'default-secret';
  return createHmac('sha256', secret).update(token).digest('hex');
}