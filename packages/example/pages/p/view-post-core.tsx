import {
    CertificateData,
    create as createPhala,
    PhalaInstance,
    signCertificate
} from '@phala/sdk'
import type { ApiPromise } from '@polkadot/api'
import accountAtom from 'atoms/account'
import { Block } from 'baseui/block'
import { StyledSpinnerNext } from 'baseui/spinner'
import { toaster } from 'baseui/toast'
import { LabelXSmall } from 'baseui/typography'
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
import { baseURL, PastebinABI } from '../../contracts/Pastebin'

declare let window: any

function ViewPost() {
  const router = useRouter()
  const {slug: postId} = router.query
  // store Post in local state
  const [title, settitleValue] = useState<string>('')
  const [content, setContentValue] = useState<string>('')
  const [author, setAuthorValue] = useState<string>('')
  const [createdOn, setCreatedOn] = useState<number>(0)
  const [canRead, setCanRead] = useState<boolean>(false)

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

  useEffect(() => {
    const _unsubscribe = unsubscribe.current
    return () => {
      api?.disconnect()
      _unsubscribe?.()
    }
  }, [api])

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

  if (!postId || !api || !phala) {
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

  if (content === '') {
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
                <button
                  onClick={onSignCertificate}
                  className="flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Sign
                </button>
              </div>
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
