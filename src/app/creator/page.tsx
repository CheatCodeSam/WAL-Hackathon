export default async function Creator({
    params,
}: {
    params: Promise<{ creator: string }>
}) {
    const { creator } = await params
    return <div>Creator Name: {creator}</div>
}