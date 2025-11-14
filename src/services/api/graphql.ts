import { env } from "~/env";

// Shared GraphQL-related types
export interface SuiObjectResponse {
  asMoveObject: {
    address: string;
    contents: {
      json: Record<string, any>;
    };
  };
}

export interface GraphQLResponse<T> { data: T }

export interface ObjectsQueryData {
  objects: {
    nodes: Array<{
      asMoveObject: {
        address: string;
        contents: { json: Record<string, any> };
      };
    }>;
  };
}

export interface DynamicFieldsQueryData {
  address: {
    dynamicFields: {
      nodes: Array<{
        contents: {
          json: { value: Record<string, string>; id?: string };
          type: { repr: string };
        };
      }>;
    };
    address: string;
  };
}

// Core fetch helper
export async function fetchQuery(query: string, variables: Record<string, any>) {
  const response = await fetch(env.NEXT_PUBLIC_SUI_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Network error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getDynamicFieldsFromId(parentId: string) {
  const query = `query getDynamicFields($id: SuiAddress!) {
    address(address: $id) {
      dynamicFields {
        nodes {
          contents { json type { repr } }
        }
      }
      address
    }
  }`;
  return fetchQuery(query, { id: parentId });
}

export async function getObjectFromAddress(address: string, objectType: string) {
  const query = `query getObjectByType($owner: SuiAddress!, $objectType: String!) {
    objects(filter: { type: $objectType, owner: $owner }) {
      nodes { asMoveObject { address contents { json } } }
    }
  }`;
  return fetchQuery(query, { objectType, owner: address });
}

export async function getSharedObjectsByType(objectType: string) {
  const query = `query getSharedObjectByType($objectType: String!) {
    objects(filter: { type: $objectType }) {
      nodes { address asMoveObject { address contents { json } } }
    }
  }`;
  return fetchQuery(query, { objectType });
}

export async function getObjectById(id: string) {
  const query = `query Object($id: SuiAddress!) {
    object(address: $id) { asMoveObject { address contents { json } } }
  }`;
  const response = await fetch(env.NEXT_PUBLIC_SUI_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { id } }),
  });
  if (!response.ok) {
    throw new Error(`Network error: ${response.status} ${response.statusText}`);
  }
  const result = await response.json();
  return result.data?.object as SuiObjectResponse;
}
