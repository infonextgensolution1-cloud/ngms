import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
};

function getConfig(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const endpoint =
    process.env.R2_ENDPOINT ??
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  const missing = [
    ["R2_ACCOUNT_ID", accountId],
    ["R2_ACCESS_KEY_ID", accessKeyId],
    ["R2_SECRET_ACCESS_KEY", secretAccessKey],
    ["R2_BUCKET_NAME", bucketName],
    ["R2_ENDPOINT", endpoint],
  ].filter(([, value]) => !value).map(([key]) => key);

  if (missing.length) {
    throw new Error(`R2 is not configured. Missing: ${missing.join(", ")}`);
  }

  return {
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucketName: bucketName!,
    endpoint: endpoint!,
  };
}

function getClient(config = getConfig()): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function validateObjectKey(key: string): string {
  const normalized = key.replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((part) => part === "..")) {
    throw new Error("Invalid R2 object key.");
  }
  return normalized;
}

/**
 * Server-only R2 storage primitives. Call these only from authenticated,
 * authorization-checked server routes. Do not expose the S3 credentials to
 * browser code. Public media delivery/domain configuration is handled separately.
 */
export async function uploadR2Object(input: {
  key?: string;
  prefix: string;
  body: Buffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
}) {
  const config = getConfig();
  const client = getClient(config);
  const prefix = validateObjectKey(input.prefix).replace(/\/+$/, "");
  const key = validateObjectKey(input.key ?? `${prefix}/${randomUUID()}`);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl ?? "private, max-age=0, no-store",
    }),
  );

  return { key };
}

export async function listR2Objects(input?: {
  prefix?: string;
  continuationToken?: string;
  maxKeys?: number;
}) {
  const config = getConfig();
  const result = await getClient(config).send(
    new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: input?.prefix ? validateObjectKey(input.prefix) : undefined,
      ContinuationToken: input?.continuationToken,
      MaxKeys: Math.min(Math.max(input?.maxKeys ?? 50, 1), 1000),
    }),
  );

  return {
    objects: (result.Contents ?? []).map((object) => ({
      key: object.Key,
      size: object.Size,
      lastModified: object.LastModified?.toISOString(),
      etag: object.ETag,
    })),
    continuationToken: result.NextContinuationToken,
    isTruncated: Boolean(result.IsTruncated),
  };
}

export async function createR2DownloadUrl(key: string, expiresInSeconds = 300) {
  const config = getConfig();
  return getSignedUrl(
    getClient(config),
    new GetObjectCommand({ Bucket: config.bucketName, Key: validateObjectKey(key) }),
    { expiresIn: Math.min(Math.max(expiresInSeconds, 30), 900) },
  );
}

export async function deleteR2Object(key: string) {
  const config = getConfig();
  await getClient(config).send(
    new DeleteObjectCommand({ Bucket: config.bucketName, Key: validateObjectKey(key) }),
  );
  return { key };
}
