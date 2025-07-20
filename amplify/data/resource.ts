import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // 投票セッション
  VotingSession: a
    .model({
      sessionId: a.id().required(),
      title: a.string().required(),
      description: a.string(),
      startTime: a.datetime().required(),
      endTime: a.datetime().required(),
      status: a.enum(['PENDING', 'ACTIVE', 'CLOSED']).required(),
    })
    .authorization(allow => [
      allow.publicApiKey(),
      allow.authenticated(),
    ]),

  // 候補者
  Candidate: a
    .model({
      candidateId: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      imageUrl: a.url(),
      votingSessionId: a.id().required(),
      displayOrder: a.integer().required(),
    })
    .authorization(allow => [
      allow.publicApiKey(),
      allow.authenticated(),
    ]),

  // 投票トークン
  VotingToken: a
    .model({
      pk: a.id().required(), // votingSessionId#tokenId
      hashedToken: a.string().required(),
      isUsed: a.boolean().required().default(false),
      voterId: a.string().required(),
      votingSessionId: a.id().required(),
      usedAt: a.datetime(),
      ttl: a.integer(), // TTL for auto-deletion
    })
    .authorization(allow => [
      allow.authenticated(),
    ]),

  // 投票記録
  Vote: a
    .model({
      pk: a.id().required(), // votingSessionId#voteId
      sk: a.string().required(), // candidateId#timestamp
      candidateId: a.id().required(),
      voterHash: a.string().required(),
      votingSessionId: a.id().required(),
      timestamp: a.datetime().required(),
    })
    .authorization(allow => [
      allow.authenticated(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});