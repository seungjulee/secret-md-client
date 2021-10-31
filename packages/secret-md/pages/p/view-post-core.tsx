import {
    CertificateData,
    create as createPhala,
    PhalaInstance,
    randomHex,
    signCertificate
} from '@phala/sdk'
import type { ApiPromise } from '@polkadot/api'
import { hexAddPrefix, numberToHex } from '@polkadot/util'
import accountAtom from 'atoms/account'
import { Block } from 'baseui/block'
import { Button } from 'baseui/button'
import { StyledSpinnerNext } from 'baseui/spinner'
import { toaster } from 'baseui/toast'
import { LabelXSmall, ParagraphMedium } from 'baseui/typography'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/markdown/markdown'
import 'codemirror/theme/monokai.css'
import { generateFromString } from 'generate-avatar'
import 'github-markdown-css/github-markdown.css'
import { useAtom } from 'jotai'
import { createApi } from 'lib/polkadotApi'
import { getSigner } from 'lib/polkadotExtension'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Pastebin } from '../../contracts/Pastebin'
import { baseURL, CONTRACT_ID, PastebinABI } from '../../contracts/Pastebin'

declare let window: any

function ViewPost() {
  const router = useRouter()
  const {slug: postId} = router.query
  // store Post in local state
  const [title, setTitleValue] = useState<string>('')
  const [content, setContentValue] = useState<string>('')
  const [author, setAuthorValue] = useState<string>('')
  const [createdOn, setCreatedOn] = useState<number>(0)
  const [canRead, setCanRead] = useState<boolean>(false)
  const [isSigned, setIsSigned] = useState<boolean>(false)

  const [guessLoading, setGuessLoading] = useState(false)

  // call the smart contract, read the current Post value
  async function fetchJournal() {}

  useEffect(() => {
    if (!postId) return

    fetchJournal()
  }, [postId])

  const [api, setApi] = useState<ApiPromise>()
  const [phala, setPhala] = useState<PhalaInstance>()
  const unsubscribe = useRef<() => void>()
  const [certificateData, setCertificateData] = useState<CertificateData>()
  const [signCertificateLoading, setSignCertificateLoading] = useState(false)
  const [account] = useAtom(accountAtom)
  const [hasAccess, setHasAccess] = useState<boolean>(true)

  useEffect(() => {
    const _unsubscribe = unsubscribe.current
    return () => {
      api?.disconnect()
      _unsubscribe?.()
    }
  }, [api])

  useEffect(() => {
    if (!api && !phala) {
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
    }

    onView()
  }, [postId, certificateData])

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
        setIsSigned(true)
      } catch (err) {
        toaster.negative((err as Error).message, {})
      }
      setSignCertificateLoading(false)
    }
  }, [api, account])

  const onView = async function () {
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
          const result: Pastebin = ok.post
          console.log(result)

          toaster.update(toastKey, {
            children: `Successfully fetched the post`,
            autoHideDuration: 3000,
          })
          setTitleValue(result.title)
          setContentValue(result.content)
          setCreatedOn(result.created_on)
          setAuthorValue(result.owner)
        }

        if (err) {
          throw new Error(err)
        }
      })
      .catch((err: Error) => {
        if (
          err.message.includes('NotAuthorized') ||
          err.message.includes('NotFound')
        ) {
          setHasAccess(false)
        }
        toaster.negative(err.message, {})
      })
      .finally(() => {
        setGuessLoading(false)
      })
  }

  if (!postId || !api || !phala || (isSigned && !content)) {
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

  if (!isSigned) {
    return (
      <div className="bg-gray-50 antialiased">
        <div className="max-w-6xl mx-auto bg-white my-2 mb-8">
          <div className="w-full prose max-w-none max-h-screen prose-indigo leading-6 rounded-b-md border border-gray-300 py-3 px-5 bg-white overflow-y-auto">
            <div>
              {title && (
                <p className="flex mx-auto my-2 text-3xl md:text-4xl text-gray-700 placeholder-gray-600 font-bold hover:text-gray-600 my-2">
                  {title}
                </p>
              )}
              <div className="markdown-body my-4">
                {/* <button
                  onClick={onSignCertificate}
                  className="flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Sign Certificate
                </button> */}
                <ParagraphMedium>
                  Sign a certificate to view the post.
                </ParagraphMedium>
                <Button
                  isLoading={signCertificateLoading}
                  onClick={onSignCertificate}
                  disabled={!account}
                >
                  Sign Certificate
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="bg-gray-50 antialiased">
        <div className="max-w-6xl mx-auto bg-white my-2 mb-8">
          <div className="w-full prose max-w-none max-h-screen prose-indigo leading-6 rounded-b-md border border-gray-300 py-3 px-5 bg-white overflow-y-auto">
            <div className="markdown-body my-4">
              {`🥷 Sorry! The file doesn't exist or you don't have permission.`}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 antialiased">
      <div className="max-w-6xl mx-auto bg-white my-2 mb-8">
        <div className="w-full prose max-w-none max-h-screen prose-indigo leading-6 rounded-b-md border border-gray-300 py-3 px-5 bg-white overflow-y-auto">
          <div className="divide-y divide-grey-900 divide-y-8">
            <div className="flex items-center py-1 bg-white border-gray-200 dark:bg-gray-800 mb-2">
              <div className="p-3 mr-4 rounded-full">
                <img
                  width={24}
                  height={24}
                  src={`data:image/svg+xml;utf8,${generateFromString(author)}`}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-900">
                  {author}
                </p>
                <p className="text-sm font-normal text-gray-800">
                  {new Date(createdOn * 1000).toString()}
                </p>
              </div>
            </div>
            <div>
              {title && (
                <p className="flex mx-auto my-2 text-3xl md:text-4xl text-gray-700 placeholder-gray-600 font-bold hover:text-gray-600 my-2">
                  {title}
                </p>
              )}
              <div className="markdown-body my-4">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewPost
