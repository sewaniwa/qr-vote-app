import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { votingFunctions } from './functions/resource';

export const backend = defineBackend({
  auth,
  data,
  votingFunctions,
});

// Additional backend configuration can be added here