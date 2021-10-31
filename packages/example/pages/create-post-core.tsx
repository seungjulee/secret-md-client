import {
    CertificateData,
    create as createPhala,
    PhalaInstance,
    randomHex,
    signCertificate
} from '@phala/sdk'
import type { ApiPromise } from '@polkadot/api'
import { hexAddPrefix, numberToHex } from '@polkadot/util'
// import { decodeAddress } from '@polkadot/util-crypto'
import accountAtom from 'atoms/account'
import { Block } from 'baseui/block'
import { Checkbox, LABEL_PLACEMENT } from 'baseui/checkbox'
import { StyledSpinnerNext } from 'baseui/spinner'
import { toaster } from 'baseui/toast'
import { LabelXSmall } from 'baseui/typography'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/markdown/markdown'
import 'codemirror/theme/monokai.css'
import 'github-markdown-css/github-markdown.css'
import { useAtom } from 'jotai'
import { createApi } from 'lib/polkadotApi'
import { getSigner } from 'lib/polkadotExtension'
import { useCallback, useEffect, useRef, useState } from 'react'
import { UnControlled as CodeMirror } from 'react-codemirror2'
import ReactMarkdown from 'react-markdown'
import { baseURL, CONTRACT_ID, PastebinABI } from '../contracts/Pastebin'

// import { Link } from 'react-router-dom'

declare let window: any
interface UIState {
  isPreview: boolean
  isCompressed: boolean
}

function CreatePostCore() {
  //   const [account] = useAtom(accountAtom)
  // store Post in local state
  const [title, setTitleValue] = useState<string>('')
  const [post, setPostValue] = useState<string>('')
  const [publishedAddress, setPublishedAddress] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [uiState, setUIState] = useState<UIState>({
    isPreview: false,
    isCompressed: true,
  })
  const [isPrivate, setIsPrivate] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState('0')

  const postId = randomHex(12)

  const [api, setApi] = useState<ApiPromise>()
  const [phala, setPhala] = useState<PhalaInstance>()
  const unsubscribe = useRef<() => void>()

  useEffect(() => {
    const _unsubscribe = unsubscribe.current
    return () => {
      api?.disconnect()
      _unsubscribe?.()
    }
  }, [api])

  const [account] = useAtom(accountAtom)
  const [number, setNumber] = useState('')
  const [certificateData, setCertificateData] = useState<CertificateData>()
  const [signCertificateLoading, setSignCertificateLoading] = useState(false)
  const [guessLoading, setGuessLoading] = useState(false)
  const [owner, setOwner] = useState('')

  useEffect(() => {
    createApi(PastebinABI)
      .then((api) => {
        setApi(api)
        return createPhala({api, baseURL}).then((phala) => {
          setPhala(() => phala)
        })
      })
      .catch((err) => {
        toaster.negative((err as Error).message, {})
      })
  }, [])

  // call the smart contract, send an update
  async function createPost() {
    if (!post) return
    console.log(title, post)
  }

  const onSignCertificate = useCallback(async () => {
    if (account && api) {
      setSignCertificateLoading(true)
      try {
        const signer = await getSigner(account)
        setCertificateData(
          await signCertificate({
            api,
            account,
            signer,
          })
        )
        toaster.positive('Certificate signed', {})
      } catch (err) {
        toaster.negative((err as Error).message, {})
      }
      setSignCertificateLoading(false)
    }
  }, [api, account])

  const onPublish = useCallback(async () => {
    if (!api || !phala || !account || !post) return
    const toastKey = toaster.info('Setting…', {autoHideDuration: 0})
    const signer = await getSigner(account)
    const owner = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
    const poorBob = '5G96fAtHjVgTmosV7B5tLP7M8R62Fihu3EyPCViBWrgcXjaJ'
    const notAllowedPaul = '5HNEg9bZZV4w9jTeemHWwRLHGp7BxV8K3YN65iGvEYcxg5vb'
    try {
      const _unsubscribe = await phala.command({
        account,
        contractId: CONTRACT_ID,
        payload: api
          .createType('PastebinCommand', {
            CreatePost: {
              id: postId,
              owner: owner,
              readable_by: owner,
              content: post,
            },
          })
          .toHex(),
        signer,
        onStatus: (status) => {
          if (status.isFinalized) {
            toaster.update(toastKey, {
              kind: 'positive',
              children: 'Command Sent',
              autoHideDuration: 3000,
            })
            //   setOwner('')
          }
        },
      })

      if (_unsubscribe) {
        unsubscribe.current = _unsubscribe
      }
      toaster.update(toastKey, {
        kind: 'positive',
        children: `${postId} published`,
        autoHideDuration: 5000,
      })
    } catch (err) {
      toaster.update(toastKey, {
        kind: 'negative',
        children: (err as Error).message,
        autoHideDuration: 3000,
      })
    }
  }, [phala, api, account, post, postId])

  const onView = useCallback(
    async (e) => {
      if (!certificateData || !api || !phala) return
      setGuessLoading(true)
      const encodedQuery = api
        .createType('PastebinRequest', {
          head: {
            id: numberToHex(CONTRACT_ID, 256),
            nonce: hexAddPrefix(randomHex(32)),
          },
          data: {
            queryPost: {
              id: '594b3150dca54e2a994333bf',
              //   id: '594b3150dca54e2a994333bf',
            },
          },
        })
        .toHex()
      const toastKey = toaster.info('Querying…', {autoHideDuration: 0})

      phala
        .query(encodedQuery, certificateData)
        .then((data) => {
          const {
            result: {ok, err},
          } = api
            .createType('PastebinResponse', hexAddPrefix(data))
            .toJSON() as any

          if (ok) {
            const result = ok.post
            console.log(result)
            toaster.update(toastKey, {
              children: `Resp ${JSON.stringify(result)}`,
              autoHideDuration: 3000,
            })
          }

          if (err) {
            throw new Error(err)
          }
        })
        .catch((err) => {
          console.log(err)
          toaster.negative((err as Error).message, {})
        })
        .finally(() => {
          setGuessLoading(false)
        })
    },
    [phala, api, certificateData]
  )

  if (!api || !phala) {
    return (
      <Block
        display="flex"
        flexDirection="column"
        alignItems="center"
        height="280px"
        justifyContent="center"
      >
        <StyledSpinnerNext />
        <LabelXSmall marginTop="20px">Initializing</LabelXSmall>
      </Block>
    )
  }

  return (
    <div className="App">
      <div className="bg-gray-50 antialiased">
        <div className="px-4 max-w-6xl mx-auto min-h-screen">
          <div className="">
            <input
              className="w-full h-10 px-3 mb-2 text-base text-gray-700 placeholder-gray-600 border rounded-lg focus:shadow-outline"
              type="text"
              placeholder=""
              onChange={(e) => {
                setTitleValue(e.target.value.trim())
              }}
            />
            <div className="bg-gray-50 border border-b-0 border-gray-300 top-0 left-0 right-0 block rounded-t-md">
              <button
                onClick={() =>
                  setUIState((prevState: UIState) => ({
                    ...prevState,
                    isPreview: false,
                  }))
                }
                type="button"
                className="py-2 px-4 inline-block text-gray-400 font-semibold"
              >
                Write
              </button>
              <button
                onClick={() =>
                  setUIState((prevState: UIState) => ({
                    ...prevState,
                    isPreview: true,
                  }))
                }
                type="button"
                className="py-2 px-4 inline-block text-gray-400 font-semibold"
              >
                Preview
              </button>
            </div>
            {!uiState.isPreview && (
              <CodeMirror
                className="w-full prose max-w-none max-h-screen prose-indigo leading-6 rounded-b-md shadow-sm border border-gray-300 bg-white overflow-y-auto"
                value={post}
                options={{
                  mode: 'markdown',
                  theme: 'default',
                  lineNumbers: true,
                }}
                onChange={(editor, data, value) => {
                  setPostValue(value.trim())
                }}
              />
            )}
            {uiState.isPreview && (
              <article className="markdown-body px-8 w-full prose max-w-none max-h-screen prose-indigo leading-6 rounded-b-md shadow-sm border border-gray-300 bg-white overflow-y-auto">
                <ReactMarkdown>{post}</ReactMarkdown>
              </article>
            )}
          </div>
          <div className="py-4">
            <div className="flex flex-wrap -mx-3 mb-6">
              <div className="w-full px-3">
                <button
                  onClick={onSignCertificate}
                  className="flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Sign
                </button>
                <button
                  onClick={onPublish}
                  className="flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Publish
                </button>
                <button
                  onClick={onView}
                  className="flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  View
                </button>
                {/* {publishedAddress && (
                  <Link to={`/p/${publishedAddress}`}>{publishedAddress}</Link>
                )} */}
              </div>
            </div>
            <Checkbox
              checked={isPrivate}
              onChange={(e) => setIsPrivate((value) => !value)}
              labelPlacement={LABEL_PLACEMENT.right}
            >
              Make it private
            </Checkbox>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePostCore
