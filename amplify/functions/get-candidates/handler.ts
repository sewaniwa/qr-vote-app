import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface Candidate {
  candidateId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  votingSessionId: string;
  displayOrder: number;
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

    // 投票セッションIDを取得（クエリパラメータまたはパスパラメータから）
    const votingSessionId = event.queryStringParameters?.sessionId || 'session-1'; // デフォルトセッション

    // DynamoDBから候補者を取得
    // 実際の実装では、GSIを使用してvotingSessionIdでクエリ
    const queryParams = {
      TableName: process.env.CANDIDATES_TABLE!,
      IndexName: 'GSI1', // votingSessionId用のGSI
      KeyConditionExpression: 'votingSessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': votingSessionId,
      },
    };

    try {
      const queryResult = await docClient.send(new QueryCommand(queryParams));
      
      const candidates: Candidate[] = (queryResult.Items || [])
        .map(item => ({
          candidateId: item.candidateId,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          votingSessionId: item.votingSessionId,
          displayOrder: item.displayOrder || 0,
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          candidates,
          sessionId: votingSessionId,
        }),
      };

    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // フォールバック：モックデータを返す
      const mockCandidates: Candidate[] = [
        {
          candidateId: '1',
          name: '田中太郎',
          description: '経験豊富なリーダーとして、組織の改革を推進します。',
          votingSessionId: 'session-1',
          displayOrder: 1,
        },
        {
          candidateId: '2',
          name: '佐藤花子',
          description: '新しいアイデアで組織に革新をもたらします。',
          votingSessionId: 'session-1',
          displayOrder: 2,
        },
        {
          candidateId: '3',
          name: '山田次郎',
          description: '安定した運営と着実な発展を目指します。',
          votingSessionId: 'session-1',
          displayOrder: 3,
        },
      ];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          candidates: mockCandidates,
          sessionId: votingSessionId,
          isMockData: true,
        }),
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
        message: '候補者情報の取得に失敗しました',
      }),
    };
  }
};