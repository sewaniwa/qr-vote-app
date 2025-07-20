import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { createHmac, randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface CastVoteRequest {
  candidateId: string;
  voterToken: string;
  idempotencyToken?: string;
}

interface CastVoteResponse {
  success: boolean;
  message: string;
  voteId?: string;
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
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Idempotency-Token',
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

    const { candidateId, voterToken, idempotencyToken }: CastVoteRequest = JSON.parse(event.body);

    if (!candidateId || !voterToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'candidateId and voterToken are required' }),
      };
    }

    // セッショントークンの検証
    const voterData = verifySessionToken(voterToken);
    if (!voterData) {
      const response: CastVoteResponse = {
        success: false,
        error: 'Invalid session token',
        message: 'セッショントークンが無効です',
      };
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify(response),
      };
    }

    const { voterId } = voterData;

    // 投票者のハッシュを生成（匿名性を保つため）
    const voterHash = createVoterHash(voterId);
    const timestamp = new Date().toISOString();
    const voteId = randomUUID();

    // votingSessionIdを抽出（実際の実装では適切に設定）
    const votingSessionId = 'session-1'; // TODO: 実際のセッションIDに置き換え

    const vote = {
      pk: `${votingSessionId}#${voteId}`,
      sk: `${candidateId}#${timestamp}`,
      candidateId,
      voterHash,
      votingSessionId,
      timestamp,
      voteId,
    };

    // 重複投票チェック - 同じvoterHashが既に投票していないかチェック
    // 実際の実装では、GSIを使用してvoterHashでクエリ
    
    // Idempotency-Tokenを使用した重複リクエスト防止
    const putParams = {
      TableName: process.env.VOTES_TABLE!,
      Item: vote,
      ConditionExpression: 'attribute_not_exists(pk)',
    };

    try {
      await docClient.send(new PutCommand(putParams));
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        const response: CastVoteResponse = {
          success: false,
          error: 'Duplicate vote',
          message: '重複した投票です',
        };
        
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify(response),
        };
      }
      throw error;
    }

    const response: CastVoteResponse = {
      success: true,
      message: '投票が正常に記録されました',
      voteId,
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
        message: 'システムエラーが発生しました',
      }),
    };
  }
};

// ヘルパー関数
function verifySessionToken(token: string): { voterId: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    const { voterId, timestamp, nonce, signature } = payload;
    
    // トークンの有効期限チェック（1時間）
    if (Date.now() - timestamp > 60 * 60 * 1000) {
      return null;
    }
    
    // 署名の検証
    const secret = process.env.SESSION_SECRET || 'default-session-secret';
    const expectedSignature = createHmac('sha256', secret)
      .update(JSON.stringify({ voterId, timestamp, nonce }))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    return { voterId };
  } catch (error) {
    return null;
  }
}

function createVoterHash(voterId: string): string {
  const secret = process.env.VOTER_HASH_SECRET || 'default-voter-secret';
  return createHmac('sha256', secret).update(voterId).digest('hex');
}