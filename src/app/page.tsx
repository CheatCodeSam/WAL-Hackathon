import { HydrateClient } from "~/trpc/server";

export default async function Home() {
	return (
		<HydrateClient>
			<main>
				Fundsui! Funds for <b>u</b> and <b>i</b>!
			</main>
		</HydrateClient>
	);
}
