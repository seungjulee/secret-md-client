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
import { Button } from 'baseui/button'
import { Checkbox, LABEL_PLACEMENT } from 'baseui/checkbox'
import { Input } from 'baseui/input'
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

const postId = randomHex(12)

function CreatePostCore() {
  const [title, setTitleValue] = useState<string>('')
  const [post, setPostValue] = useState<string>('')
  const [isPrivate, setIsPrivate] = useState<boolean>(false)
  const [allowReadAccess, setAllowReadAccess] = useState<boolean>(false)
  const [isPreview, setIsPreview] = useState(false)

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
  const [readableBy, setReadableBy] = useState('')

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
    console.log('isprivate', isPrivate)
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
              is_private: isPrivate,
              title: title,
            },
          })
          .toHex(),
        signer,
        onStatus: (status) => {
          if (status.isFinalized) {
            toaster.update(toastKey, {
              kind: 'positive',
              children: `Command Sent ${postId}`,
              autoHideDuration: 3000,
            })
            console.log(postId)
            //   setOwner('')
          }
        },
      })

      if (_unsubscribe) {
        unsubscribe.current = _unsubscribe
      }
    } catch (err) {
      toaster.update(toastKey, {
        kind: 'negative',
        children: (err as Error).message,
        autoHideDuration: 3000,
      })
    }
  }, [phala, api, account, post, postId, title, isPrivate])

  const onView = useCallback(
    async (e) => {
      if (!certificateData || !api || !phala) return
      setGuessLoading(true)
      console.log(postId)
      const encodedQuery = api
        .createType('PastebinRequest', {
          head: {
            id: numberToHex(CONTRACT_ID, 256),
            nonce: hexAddPrefix(randomHex(32)),
          },
          data: {
            queryPost: {
              id: postId,
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
          toaster.negative((err as Error).message, {})
        })
        .finally(() => {
          setGuessLoading(false)
        })
    },
    [phala, api, certificateData, postId]
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
      <div className="antialiased">
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
            <div className="border border-b-0 border-gray-300 top-0 left-0 right-0 block rounded-t-md">
              <button
                onClick={() => setIsPreview(false)}
                type="button"
                className={`py-2 px-4 inline-block ${
                  !isPreview ? 'font-bold' : 'text-gray-400 font-semibold'
                }`}
              >
                Write
              </button>
              <button
                onClick={() => setIsPreview(true)}
                type="button"
                className={`py-2 px-4 inline-block ${
                  isPreview ? 'font-bold' : 'text-gray-400 font-semibold'
                }`}
              >
                Preview
              </button>
            </div>
            {!isPreview && (
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
            {isPreview && (
              <article className="markdown-body px-8 w-full prose max-w-none max-h-screen prose-indigo leading-6 rounded-b-md shadow-sm border border-gray-300 bg-white overflow-y-auto">
                <ReactMarkdown>{post}</ReactMarkdown>
              </article>
            )}
          </div>
          <div className="py-4">
            <div className="pb-4">
              <Checkbox
                checked={isPrivate}
                onChange={(e) => setIsPrivate((value) => !value)}
                labelPlacement={LABEL_PLACEMENT.right}
              >
                Make it private
              </Checkbox>
            </div>
            {isPrivate && (
              <div className="pb-4">
                <Checkbox
                  checked={allowReadAccess}
                  onChange={(e) => setAllowReadAccess((value) => !value)}
                  labelPlacement={LABEL_PLACEMENT.right}
                >
                  Allow read access to others
                </Checkbox>
                {allowReadAccess && (
                  <Input
                    value={readableBy}
                    onChange={(e) =>
                      setReadableBy(e.currentTarget.value.trim())
                    }
                    overrides={{Root: {style: {width: '500px'}}}}
                  >
                    Accounts:
                  </Input>
                )}
              </div>
            )}
            <Button onClick={onSignCertificate}>Sign</Button>
            <Button onClick={onPublish}>Publish</Button>
            <Button onClick={onView}>View</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePostCore
