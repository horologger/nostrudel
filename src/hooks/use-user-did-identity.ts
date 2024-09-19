import useDIDIdentity from "./use-did-identity";
import useUserMetadata from "./use-user-metadata";

export function useUserDIDIdentity(pubkey?: string) {
  const metadata = useUserMetadata(pubkey);
  return useDIDIdentity(metadata?.nip05x);
}
