type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export async function hygraph<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const endpoint = process.env.HYGRAPH_ENDPOINT;
  const token = process.env.HYGRAPH_TOKEN;

  if (!endpoint || !token) {
    throw new Error("Hygraph is not configured. Set HYGRAPH_ENDPOINT and HYGRAPH_TOKEN.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  let payload: GraphQLResponse<T>;
  try {
    payload = (await response.json()) as GraphQLResponse<T>;
  } catch {
    throw new Error(`Hygraph returned a non-JSON response (${response.status}).`);
  }

  if (!response.ok || payload.errors?.length || !payload.data) {
    const message = payload.errors?.map((error) => error.message).join(" ");
    throw new Error(message || `Hygraph request failed (${response.status}).`);
  }

  return payload.data;
}
