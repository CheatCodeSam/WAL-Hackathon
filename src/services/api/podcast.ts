import { env } from "~/env";
import { getDynamicFieldsFromId, getObjectById, getSharedObjectsByType } from "./graphql";

export interface Podcast {
  id?: string;
  title: string;
  description: string;
  source_file_blob_id: string;
  nouce: string;
  file_type?: string;
  created_at: string;
}

export async function getPodcastsByChannel(channelId: string) {
  const result = await getDynamicFieldsFromId(channelId);
  return result.data.address.dynamicFields.nodes.map((node: any) => {
    const podcast = node.contents.json.value;
    return {
      id: node.contents.json.id || "",
      title: podcast.title || "",
      description: podcast.description || "",
      source_file_blob_id: podcast.source_file_blob_id || "",
      file_type: podcast.file_type || "",
      nouce: podcast.nouce || "",
      created_at: podcast.created_at || "",
    } as Podcast;
  });
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
  return result.data.objects.nodes.map((node: any) => {
    const podcast = node.asMoveObject.contents.json;
    return {
      id: node.asMoveObject.address,
      title: podcast.title || "",
      description: podcast.description || "",
      source_file_blob_id: podcast.source_file_blob_id || "",
      nouce: podcast.nouce || "",
      created_at: podcast.created_at || "",
    } as Podcast;
  });
}
