import { env } from "~/env";

// Types
export interface Podcast {
	id?: string;
	title: string;
	description: string;
	source_file_blob_id: string;
	nouce: string;
	file_type: string;
	created_at: string;
}

interface Channel {
	id: string;
	name: string;
	description: string;
	cover_image_uri: string;
	profile_image_uri: string;
	subscription_price_in_mist: string;
	max_subscription_duration_in_months: number;
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
		`${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::channel::ChannelCap`,
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
	const json = result.asMoveObject.contents.json;
	
	return {
		id: result.asMoveObject.address,
		name: json.display_name,
		description: json.description,
		tag_line: json.tag_line,
		cover_image_uri: json.cover_image_uri,
		profile_image_uri: json.profile_image_uri,
		subscription_price_in_mist: json.subscription_price_in_mist,
		max_subscription_duration_in_months: json.max_subscription_duration_in_months,
	} as Channel;
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
			subscription_price_in_mist: channel.subscription_price_in_mist || "",
			max_subscription_duration_in_months: channel.max_subscription_duration_in_months || "",
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
				source_file_blob_id: podcast.source_file_blob_id || "",
				file_type: podcast.file_type || "",
				nouce: podcast.nouce || "",
				created_at: podcast.created_at || "",
			};
		},
	);

	return podcasts;
}

export async function getPodcastDetails(podcastId: string) {
	const result = await getObjectById(podcastId);
	const json = result.asMoveObject.contents.json as Record<string, any>;
	
	return {
		id: podcastId,
		title: json.value.title || "",
		description: json.value.description || "",
		source_file_blob_id: json.value.source_file_blob_id || "",
		nouce: json.value.nouce || "",
		created_at: json.value.created_at || "",
		file_type: json.value.file_type || "",
	} as Podcast;
}

export async function getAllPodcasts() {
	const result = await getSharedObjectsByType(

		`0x2::dynamic_field::Field<0x1::string::String, ${env.NEXT_PUBLIC_CONTRACT_ADDRESS}::podcast::Podcast>`,
	);

	const podcasts: Podcast[] = result.data.objects.nodes.map((node: any) => {
		const podcast = node.asMoveObject.contents.json;

		return {
			id: node.asMoveObject.address,
			title: podcast.title || "",
			description: podcast.description || "",
			source_file_blob_id: podcast.source_file_blob_id || "",
			nouce: podcast.nouce || "",
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
