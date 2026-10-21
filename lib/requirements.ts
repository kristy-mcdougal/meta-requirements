import { hygraph } from "@/lib/hygraph";
import type { Comment, Priority, Requirement } from "@/lib/types";

const REQUIREMENT_FIELDS = `
  id
  title
  body
  category
  sortOrder
  priority
  decidedBy
  addedBy
  updatedAt
  comments(first: 100) {
    id
    body
    authorName
    createdAt
  }
`;

type RequirementNode = Omit<Requirement, "comments"> & {
  comments: Comment[];
};

function sortComments(comments: Comment[]) {
  return [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function normalize(node: RequirementNode): Requirement {
  return {
    ...node,
    priority: node.priority ?? null,
    decidedBy: node.decidedBy ?? null,
    addedBy: node.addedBy ?? null,
    comments: sortComments(node.comments ?? []),
  };
}

export async function getRequirements(): Promise<Requirement[]> {
  const data = await hygraph<{ requirements: RequirementNode[] }>(
    `query Requirements {
      requirements(stage: PUBLISHED, first: 200, orderBy: sortOrder_ASC) {
        ${REQUIREMENT_FIELDS}
      }
    }`,
  );

  return data.requirements.map(normalize);
}

export async function nextSortOrder(): Promise<number> {
  const data = await hygraph<{ requirements: { sortOrder: number }[] }>(
    `query NextSort {
      requirements(stage: DRAFT, first: 1, orderBy: sortOrder_DESC) {
        sortOrder
      }
    }`,
  );

  return (data.requirements[0]?.sortOrder ?? 0) + 1;
}

export async function setRequirementPriority(
  id: string,
  priority: Priority | null,
  decidedBy: string | null,
) {
  const data = await hygraph<{
    update: RequirementNode;
  }>(
    `mutation SetPriority($id: ID!, $priority: RequirementPriority, $decidedBy: String) {
      update: updateRequirement(
        where: { id: $id }
        data: { priority: $priority, decidedBy: $decidedBy }
      ) {
        ${REQUIREMENT_FIELDS}
      }
      publish: publishRequirement(where: { id: $id }, to: PUBLISHED) { id }
    }`,
    { id, priority, decidedBy },
  );

  return normalize(data.update);
}

export async function createRequirement(input: {
  title: string;
  body: string;
  category: string;
  addedBy: string;
  priority: Priority | null;
}) {
  const sortOrder = await nextSortOrder();
  const data = await hygraph<{ create: RequirementNode }>(
    `mutation CreateRequirement(
      $title: String!
      $body: String!
      $category: String!
      $sortOrder: Int!
      $addedBy: String!
      $priority: RequirementPriority
      $decidedBy: String
    ) {
      create: createRequirement(
        data: {
          title: $title
          body: $body
          category: $category
          sortOrder: $sortOrder
          addedBy: $addedBy
          priority: $priority
          decidedBy: $decidedBy
        }
      ) {
        ${REQUIREMENT_FIELDS}
      }
    }`,
    {
      title: input.title,
      body: input.body,
      category: input.category,
      sortOrder,
      addedBy: input.addedBy,
      priority: input.priority,
      decidedBy: input.priority ? input.addedBy : null,
    },
  );

  await hygraph(
    `mutation PublishRequirement($id: ID!) {
      publishRequirement(where: { id: $id }, to: PUBLISHED) { id }
    }`,
    { id: data.create.id },
  );

  return normalize(data.create);
}

export async function addComment(requirementId: string, body: string, authorName: string) {
  const data = await hygraph<{ create: Comment }>(
    `mutation AddComment($requirementId: ID!, $body: String!, $authorName: String!) {
      create: createComment(
        data: {
          body: $body
          authorName: $authorName
          requirement: { connect: { id: $requirementId } }
        }
      ) {
        id
        body
        authorName
        createdAt
      }
    }`,
    { requirementId, body, authorName },
  );

  await hygraph(
    `mutation PublishComment($id: ID!, $requirementId: ID!) {
      publishRequirement(where: { id: $requirementId }, to: PUBLISHED) { id }
      publishComment(where: { id: $id }, to: PUBLISHED) { id }
    }`,
    { id: data.create.id, requirementId },
  );

  return data.create;
}
