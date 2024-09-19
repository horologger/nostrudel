import { useMemo } from "react";
import dnsIdentityService from "../services/dns-identity";
import didIdentityService from "../services/did-identity";
import useSubject from "./use-subject";

export default function useDIDIdentity(address: string | undefined) {
  const subject = useMemo(() => {
    if (address) return didIdentityService.getIdentity(address);
  }, [address]);

  return useSubject(subject);
}
