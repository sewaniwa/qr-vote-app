import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { createHmac, randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface QRTokenVerificationRequest {
  token: string;
  timestamp: string;
}

interface QRTokenVerificationResponse {
  isValid: boolean;
  voterId?: string;
  sessionToken?: string;
  error?: string;
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

    const { token, timestamp }: QRTokenVerificationRequest = JSON.parse(event.body);

    if (!token || !timestamp) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Token and timestamp are required' }),
      };
    }

    // QRトークンの検証
    const hashedToken = createTokenHash(token);
    
    // DynamoDBからトークンを検索
    const getParams = {
      TableName: process.env.VOTING_TOKENS_TABLE!,
      Key: {
        pk: hashedToken,
      },
    };

    const getResult = await docClient.send(new GetCommand(getParams));

    if (!getResult.Item) {
      const response: QRTokenVerificationResponse = {
        isValid: false,
        error: 'Invalid token',
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
      };
    }

    const tokenData = getResult.Item;

    // トークンが既に使用済みかチェック
    if (tokenData.isUsed) {
      const response: QRTokenVerificationResponse = {
        isValid: false,
        error: 'Token already used',
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
      };
    }

    // TTLチェック（期限切れ）
    if (tokenData.ttl && Date.now() / 1000 > tokenData.ttl) {
      const response: QRTokenVerificationResponse = {
        isValid: false,
        error: 'Token expired',
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
      };
    }

    // トークンを使用済みとしてマーク
    const updateParams = {
      TableName: process.env.VOTING_TOKENS_TABLE!,
      Key: {
        pk: hashedToken,
      },
      UpdateExpression: 'SET isUsed = :isUsed, usedAt = :usedAt',
      ExpressionAttributeValues: {
        ':isUsed': true,
        ':usedAt': new Date().toISOString(),
      },
      ConditionExpression: 'isUsed = :false',
      ExpressionAttributeValues: {
        ':isUsed': true,
        ':usedAt': new Date().toISOString(),
        ':false': false,
      },
    };

    try {
      await docClient.send(new UpdateCommand(updateParams));
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        const response: QRTokenVerificationResponse = {
          isValid: false,
          error: 'Token already used',
        };
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(response),
        };
      }
      throw error;
    }

    // セッショントークンを生成
    const sessionToken = generateSessionToken(tokenData.voterId);

    const response: QRTokenVerificationResponse = {
      isValid: true,
      voterId: tokenData.voterId,
      sessionToken,
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
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// ヘルパー関数
function createTokenHash(token: string): string {
  const secret = process.env.TOKEN_SECRET || 'default-secret';
  return createHmac('sha256', secret).update(token).digest('hex');
}

function generateSessionToken(voterId: string): string {
  const payload = {
    voterId,
    timestamp: Date.now(),
    nonce: randomUUID(),
  };
  
  const secret = process.env.SESSION_SECRET || 'default-session-secret';
  const signature = createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  
  return Buffer.from(JSON.stringify({ ...payload, signature })).toString('base64');
}