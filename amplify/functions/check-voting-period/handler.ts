import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

type VotingSessionStatus = 'PENDING' | 'ACTIVE' | 'CLOSED';

interface VotingPeriodResponse {
  status: VotingSessionStatus;
  message: string;
  startTime?: string;
  endTime?: string;
  currentTime: string;
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
      'Access-Control-Allow-Methods': 'OPTIONS,GET',
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

    // 投票セッションIDを取得
    const sessionId = event.queryStringParameters?.sessionId || 'session-1';
    const currentTime = new Date().toISOString();

    // DynamoDBから投票セッション情報を取得
    const getParams = {
      TableName: process.env.VOTING_SESSIONS_TABLE!,
      Key: {
        sessionId,
      },
    };

    try {
      const getResult = await docClient.send(new GetCommand(getParams));

      if (!getResult.Item) {
        // セッションが見つからない場合のフォールバック
        const response: VotingPeriodResponse = {
          status: 'ACTIVE', // デモ用に常にアクティブ
          message: '投票が可能です（デモモード）',
          currentTime,
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(response),
        };
      }

      const session = getResult.Item;
      const startTime = new Date(session.startTime);
      const endTime = new Date(session.endTime);
      const now = new Date();

      let status: VotingSessionStatus;
      let message: string;

      if (now < startTime) {
        status = 'PENDING';
        message = `投票は ${startTime.toLocaleString('ja-JP')} に開始されます`;
      } else if (now > endTime) {
        status = 'CLOSED';
        message = `投票は ${endTime.toLocaleString('ja-JP')} に終了しました`;
      } else {
        status = 'ACTIVE';
        message = `投票期間中です（${endTime.toLocaleString('ja-JP')} まで）`;
      }

      const response: VotingPeriodResponse = {
        status,
        message,
        startTime: session.startTime,
        endTime: session.endTime,
        currentTime,
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
      };

    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // フォールバック：デモ用に常にアクティブ
      const response: VotingPeriodResponse = {
        status: 'ACTIVE',
        message: '投票が可能です（デモモード）',
        currentTime,
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
      };
    }

  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: '投票期間の確認に失敗しました',
        currentTime: new Date().toISOString(),
      }),
    };
  }
};