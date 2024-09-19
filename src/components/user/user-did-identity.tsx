import { Text, TextProps, Tooltip } from "@chakra-ui/react";

import useUserMetadata from "../../hooks/use-user-metadata";
import UserDIDIdentityIcon from "./user-did-identity-icon";

export default function UserDIDIdentity({
  pubkey,
  onlyIcon,
  ...props
}: { pubkey: string; onlyIcon?: boolean } & Omit<TextProps, "children">) {
  const metadata = useUserMetadata(pubkey);
  if (!metadata?.nip05x) return null;

  if (onlyIcon) {
    return (
      <Tooltip label={metadata.nip05x}>
        <UserDIDIdentityIcon pubkey={pubkey} />
      </Tooltip>
    );
  }
  return (
    <Text as="span" whiteSpace="nowrap" {...props}>
      {metadata.nip05x.startsWith("_@") ? metadata.nip05x.substr(2) : metadata.nip05x}{" "}
      <UserDIDIdentityIcon pubkey={pubkey} />
    </Text>
  );
}
