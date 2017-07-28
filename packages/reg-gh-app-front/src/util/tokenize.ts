import * as zlib from "zlib";

export interface TokenizeParams {
  repositoryId: number;
  installationId: number;
  ownerName: string;
  repositoryName: string;
}

export function tokenize({ repositoryId, installationId, ownerName, repositoryName }: TokenizeParams) {
  const token = `${repositoryId}/${repositoryName}/${installationId}/${ownerName}`;
  const x = zlib.deflateRawSync(token);
  const clientId = btoa(String.fromCharCode.apply(null, x));
  return clientId;
}
