export default async function CreatorPost({
    params,
}: {
    params: Promise<{ creator: string, postId: string }>
}) {
    const { creator, postId } = await params
    return <div className="">
        <div>Creator Name: {creator}</div>
        <div>Post Id: {postId}</div>
    </div>
}