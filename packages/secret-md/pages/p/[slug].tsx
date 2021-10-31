import dynamic from 'next/dynamic'

const DynamicComponentWithNoSSR = dynamic(() => import('./view-post-core'), {
  ssr: false,
})

function ViewPost(obj) {
  return <DynamicComponentWithNoSSR />
}

ViewPost.title = 'View Post'

export default ViewPost
