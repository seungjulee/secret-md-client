export type Pastebin = {
  id: string
  content: string
  owner: string
  readable_by: string
  created_on: number
  is_private: boolean
  title: string
}

const PastebinABI = {
  endpoint: process.env.NEXT_PUBLIC_WS_ENDPOINT as string,
  types: {
    PostId: 'String',
    PostContent: 'String',
    PostTitle: 'String',
    CreateOn: 'u64',

    CreatePostRequest: {
      id: 'String',
      owner: 'AccountId',
      is_private: 'bool',
      readable_by: 'AccountId',
      content: 'String',
      title: 'String',
    },

    Post: {
      id: 'PostId',
      content: 'PostContent',
      owner: 'AccountId',
      is_private: 'bool',
      readable_by: 'AccountId',
      created_on: 'CreateOn',
      title: 'PostTitle',
    },

    GuessError: {
      _enum: ['OriginUnavailable', 'NotAuthorized', 'NotFound'],
    },
    PastebinRequestData: {
      _enum: {
        QueryPost: {
          id: 'PostId',
        },
      },
    },
    PastebinResponseData: {
      _enum: {
        Post: 'Post',
      },
    },
    PastebinRequest: {
      head: 'ContractQueryHead',
      data: 'PastebinRequestData',
    },
    PastebinResponse: {
      nonce: '[u8; 32]',
      result: 'Result<PastebinResponseData, GuessError>',
    },
    PastebinCommand: {
      _enum: {
        CreatePost: 'CreatePostRequest',
      },
    },
  },
}

const baseURL = '/'
const CONTRACT_ID = 420

export { PastebinABI, baseURL, CONTRACT_ID }

