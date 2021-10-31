import dynamic from 'next/dynamic'

const DynamicComponentWithNoSSR = dynamic(() => import('./create-post-core'), {
  ssr: false,
})

function CreatePost() {
  return <DynamicComponentWithNoSSR />
}

CreatePost.title = 'Create Post'

export default CreatePost
