import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { createHmac, randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface GenerateQRCodesRequest {
  count: number;
  votingSessionId: string;
  expirationHours?: number;
}

interface GeneratedToken {
  tokenId: string;
  token: string;
  qrCodeData: string;
  voterId: string;
}

interface GenerateQRCodesResponse {
  success: boolean;
  message: string;
  tokens?: GeneratedToken[];
  count?: number;
  sessionId?: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'OPTIONS,POST',
      'Content-Type': 'application/json',
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { count, votingSessionId, expirationHours = 24 }: GenerateQRCodesRequest = JSON.parse(event.body);

    if (!count || !votingSessionId || count <= 0 || count > 1000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid parameters',
          message: 'count must be between 1 and 1000, and votingSessionId is required'
        }),
      };
    }

    // 管理者権限の確認（実際の実装では適切な認証を実装）
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Unauthorized',
          message: '管理者権限が必要です'
        }),
      };
    }

    const generatedTokens: GeneratedToken[] = [];
    const ttl = Math.floor(Date.now() / 1000) + (expirationHours * 60 * 60);

    // トークンを生成
    for (let i = 0; i < count; i++) {
      const tokenId = randomUUID();
      const voterId = `voter_${randomUUID()}`;
      const token = `VOTE_${tokenId}_${votingSessionId}`;
      const hashedToken = createTokenHash(token);
      
      const tokenData = {
        pk: `${votingSessionId}#${tokenId}`,
        hashedToken,
        isUsed: false,
        voterId,
        votingSessionId,
        createdAt: new Date().toISOString(),
        ttl,
      };

      // DynamoDBに保存
      const putParams = {
        TableName: process.env.VOTING_TOKENS_TABLE!,
        Item: tokenData,
      };

      await docClient.send(new PutCommand(putParams));

      generatedTokens.push({
        tokenId,
        token,
        qrCodeData: token, // QRコードに埋め込むデータ
        voterId,
      });
    }

    const response: GenerateQRCodesResponse = {
      success: true,
      message: `${count}個のQRコードトークンを生成しました`,
      tokens: generatedTokens,
      count,
      sessionId: votingSessionId,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: 'QRコードの生成に失敗しました',
      }),
    };
  }
};

// ヘルパー関数
function createTokenHash(token: string): string {
  const secret = process.env.TOKEN_SECRET || 'default-secret';
  return createHmac('sha256', secret).update(token).digest('hex');
}