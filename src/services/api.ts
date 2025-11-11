import { env } from "~/env";
import { config } from "./config";

// Types
interface Podcast {
	title: string;
	description: string;
	source_file_uri: string;
	created_at: string;
}

interface Channel {
	id: string;
	name: string;
	description: string;
	cover_image_uri: string;
	profile_image_uri: string;
}

interface SuiObjectResponse {
	asMoveObject: {
		address: string;
		contents: {
			json: Record<string, any>;
		};
	};
}

interface GraphQLResponse<T> {
	data: T;
}

interface ObjectsQueryData {
	objects: {
		nodes: Array<{
			asMoveObject: {
				address: string;
				contents: {
					json: Record<string, any>;
				};
			};
		}>;
	};
}

interface DynamicFieldsQueryData {
	address: {
		dynamicFields: {
			nodes: Array<{
				contents: {
					json: {
						value: Record<string, string>;
					};
					type: {
						repr: string;
					};
				};
			}>;
		};
		address: string;
	};
}

// Channel functions
export async function getChannelId(address: string) {
	const result = await getObjectFromAddress(
		address,
		`${config.packageId}::channel::ChannelCap`,
	);

	if (result.data.objects.nodes.length === 0) {
		return null;
	}

	const node = result.data.objects.nodes[0];
	const channelCapId = node.asMoveObject.address;
	const channelId = node.asMoveObject.contents.json.channel;

	return { channelCapId, channelId };
}

export async function getChannelDetails(channelId: string) {
	const result = await getObjectById(channelId);
	return result.asMoveObject.contents.json as Channel;
}

export async function getAllChannels() {
	const result = await getSharedObjectsByType(
		`${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::channel::Channel`,
	);

	const channels: any[] = result.data.objects.nodes.map((node: any) => {
		const channel = node.asMoveObject.contents.json;

		return {
			id: node.asMoveObject.address,
			name: channel.name || "",
			description: channel.description || "",
			cover_image_uri: channel.cover_image_uri || "",
			profile_image_uri: channel.profile_image_uri || "",
		};
	});

	return channels;
}

// Podcast functions
export async function getPodcastsByChannel(channelId: string) {
	const result = await getDynamicFieldsFromId(channelId);

	const podcasts: Podcast[] = result.data.address.dynamicFields.nodes.map(
		(node: any) => {
			const podcast = node.contents.json.value;

			return {
				title: podcast.title || "",
				description: podcast.description || "",
				source_file_uri: podcast.source_file_uri || "",
				created_at: podcast.created_at || "",
			};
		},
	);

	return podcasts;
}

export async function getPodcastDetails(podcastId: string) {
	const result = await getObjectById(podcastId);
	return result.asMoveObject.contents.json as Podcast;
}

export async function getAllPodcasts() {
	const result = await getSharedObjectsByType(
		`${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::podcast::Podcast`,
	);

	const podcasts: Podcast[] = result.data.objects.nodes.map((node: any) => {
		const podcast = node.asMoveObject.contents.json;

		return {
			title: podcast.title || "",
			description: podcast.description || "",
			source_file_uri: podcast.source_file_uri || "",
			created_at: podcast.created_at || "",
		};
	});

	return podcasts;
}

// GraphQL query functions
async function getDynamicFieldsFromId(parentId: string) {
	const query = `query getDynamicFields($id: SuiAddress!) {
		address(address: $id) {
			dynamicFields {
				nodes {
					contents {
						json
						type {
							repr
						}
					}
				}
			}
			address
		}
	}`;

	const variables = { id: parentId };
	return fetchQuery(query, variables);
}

async function getObjectFromAddress(address: string, objectType: string) {
	const query = `query getObjectByType($owner: SuiAddress!, $objectType: String!) {
		objects(filter: { type: $objectType, owner: $owner }) {
			nodes {
				asMoveObject {
					address
					contents {
						json
					}
				}
			}
		}
	}`;

	const variables = { objectType, owner: address };
	return fetchQuery(query, variables);
}

async function getSharedObjectsByType(objectType: string) {
	const query = `query getSharedObjectByType($objectType: String!) {
		objects(filter: { type: $objectType }) {
			nodes {
				address
				asMoveObject {
					address
					contents {
						json
					}
				}
			}
		}
	}`;

	const variables = { objectType };
	return fetchQuery(query, variables);
}

async function getObjectById(id: string) {
	const query = `query Object($id: SuiAddress!) {
		object(address: $id) {
			asMoveObject {
				address
				contents {
					json
				}
			}
		}
	}`;

	const variables = { id };

	const response = await fetch(env.NEXT_PUBLIC_SUI_GRAPHQL_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query, variables }),
	});

	if (!response.ok) {
		throw new Error(
			`Network error: ${response.status} ${response.statusText}`,
		);
	}

	const result = await response.json();
	return result.data?.object as SuiObjectResponse;
}

async function fetchQuery(query: string, variables: Record<string, string>) {
	const response = await fetch(env.NEXT_PUBLIC_SUI_GRAPHQL_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query, variables }),
	});

	if (!response.ok) {
		throw new Error(
			`Network error: ${response.status} ${response.statusText}`,
		);
	}

	const result = await response.json();
	return result;
}
