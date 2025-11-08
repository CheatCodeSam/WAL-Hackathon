import { config } from "./config";

interface QueryResponse {
  data: {
    objects: {
      nodes: {
        asMoveObject: {
          address: string,
          contents:
          Record<string, string>
        }
      }[]
    }
  }
}

interface SuiObjectResponse {
  asMoveObject: {
    address: string,
    contents:
    Record<string, string>
  }
}


export async function getChannelId(address: string) {
  // if (import.meta.env.DEV) {
    return { channelCapId: "channelCapId", channelId: "channelId" }
  // }

  const result = await getObjectsFromAddress(address, `${config.packageId}::channel::ChannelCap`)


  if (result.data.objects.nodes.length === 0) {
    return null
  }

  // const channelCapId = result.data.objects.nodes[0].asMoveObject.address;
  // const channelId = result.data.objects.nodes[0].asMoveObject.contents["channel"]
  // return channels.data[0].data.objectI

  // return { channelCapId, channelId }
}

// Channels
export async function getChannelDetails(channelId: string) {
  const result = await getObjectById(channelId);

  return result.asMoveObject.contents;
}

// Podcasts
export async function getPodcastDetails(podcastId: string) {
  const result = await getObjectById(podcastId);

  return result.asMoveObject.contents
}

export async function getAllPodcasts() {
  const result = await getSharedObjectsByType(`${config.packageId}::channel::Podcast`);

  const podcasts = result.data.objects.nodes.map(podcastInfo => podcastInfo);

  if (podcasts.length == 0) {
    return null
  }

  return podcasts
}


export async function getObjectsFromAddress(address: string, objectType: string) {
  const query = `query getSharedObjectByType($owner: SuiAddress!, $objectType: String!) {
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

  const variables = { objectType, address };

  return fetchQuery(query, variables)
}

export async function getSharedObjectsByType(objectType: string) {
  const query = `query getSharedObjectByType($owner: SuiAddress!, $objectType: String!) {
    objects(filter: { type: $objectType, owner: $owner }) {
        nodes {
          address
          asMoveObject {
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

export async function getObjectById(id: string) {
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

  try {
    const response = await fetch('https://graphql.mainnet.sui.io/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // return the GraphQL data field if present, otherwise the full response
    return result.data?.object as SuiObjectResponse;
  } catch (error) {
    console.error('Error fetching objects', error);
    throw error;
  }
}

async function fetchQuery(query: string, variables: Record<string, string>): Promise<QueryResponse> {
  try {
    const response = await fetch('https://graphql.mainnet.sui.io/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // return the GraphQL data field if present, otherwise the full response
    return result;
  } catch (error) {
    console.error('Error fetching objects', error);
    throw error;
  }
}