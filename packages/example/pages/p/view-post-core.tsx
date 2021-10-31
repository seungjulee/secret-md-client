import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/markdown/markdown'
import 'codemirror/theme/monokai.css'
import { generateFromString } from 'generate-avatar'
import 'github-markdown-css/github-markdown.css'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

declare let window: any

function ViewPost(obj) {
  console.log('obj', obj)
  // store Post in local state
  const [title, settitleValue] = useState<string>('')
  const [content, setContentValue] = useState<string>('')
  const [author, setAuthorValue] = useState<string>('')
  const [createdOn, setCreatedOn] = useState<number>(0)
  const [canRead, setCanRead] = useState<boolean>(false)
  const [password, setPassword] = useState<string>('')

  // call the smart contract, read the current Post value
  async function fetchJournal() {}

  useEffect(() => {
    fetchJournal()
  }, [])

  if (content === '') {
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
                    src={`data:image/svg+xml;utf8,${generateFromString(
                      author
                    )}`}
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
                  <label className="inline-flex tracking-wide pr-4">
                    <span className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                      Encrypt with Password
                    </span>
                    <input
                      className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                      onChange={(e) => {
                        setPassword(e.target.value.trim())
                      }}
                    />
                  </label>
                  <button
                    onClick={() => {
                      // setHasEnteredPW(true)
                      fetchJournal()
                    }}
                    className="flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Enter
                  </button>
                </div>
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
