import { useState } from "react";
import { Button, Card, CardProps, Flex, FormControl, FormLabel, Image, Input, Text, useToast } from "@chakra-ui/react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useDebounce } from "react-use";

import dnsIdentityService, { DnsIdentity } from "../../../services/dns-identity";
import { CheckIcon } from "../../../components/icons";
import nostrConnectService from "../../../services/nostr-connect";
import accountService from "../../../services/account";
import { COMMON_CONTACT_RELAY } from "../../../const";
import { safeRelayUrls } from "../../../helpers/relay";
import { getMatchSimpleEmail } from "../../../helpers/regexp";

export default function LoginNostrAddressView() {
  const navigate = useNavigate();
  const toast = useToast();

  const [address, setAddress] = useState("");

  const [nip05, setNip05] = useState<DnsIdentity | null>();
  const [rootNip05, setRootNip05] = useState<DnsIdentity | null>();
  useDebounce(
    async () => {
      if (!address) return setNip05(undefined);
      if (!getMatchSimpleEmail().test(address)) return setNip05(undefined);
      let [name, domain] = address.split("@");
      if (!name || !domain) return setNip05(undefined);
      setNip05((await dnsIdentityService.fetchIdentity(address)) ?? null);
      setRootNip05((await dnsIdentityService.fetchIdentity(`_@${domain}`)) ?? null);
    },
    300,
    [address],
  );

  const [loading, setLoading] = useState<string | undefined>();
  const connect: React.FormEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    if (!nip05) return;

    try {
      if (nip05.hasNip46) {
        setLoading("Connecting...");
        const relays = safeRelayUrls(nip05.nip46Relays || rootNip05?.nip46Relays || rootNip05?.relays || nip05.relays);
        const client = nostrConnectService.fromHostedBunker(nip05.pubkey, relays, rootNip05?.pubkey);
        await client.connect();

        nostrConnectService.saveClient(client);
        accountService.addFromNostrConnect(client);
        accountService.switchAccount(client.pubkey);
      } else {
        accountService.addAccount({
          type: "pubkey",
          pubkey: nip05.pubkey,
          relays: [...nip05.relays, COMMON_CONTACT_RELAY],
          readonly: true,
        });
        accountService.switchAccount(nip05.pubkey);
      }
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
    setLoading(undefined);
  };

  const renderStatus = () => {
    if (!address) return null;

    const cardProps: CardProps = {
      variant: "outline",
      p: "2",
      flexDirection: "row",
      gap: "2",
      alignItems: "center",
      flexWrap: "wrap",
    };

    if (nip05) {
      if (nip05.hasNip46) {
        return (
          <Card {...cardProps}>
            <Image w="7" h="7" src={`//${nip05.domain}/favicon.ico`} />
            <Text fontWeight="bold">{address}</Text>
            <Text color="green.500" ml="auto">
              Found provider <CheckIcon boxSize={5} />
            </Text>
          </Card>
        );
      } else
        return (
          <Card {...cardProps}>
            <Text fontWeight="bold">{address}</Text>
            <Text color="yellow.500" ml="auto">
              Read-only
            </Text>
          </Card>
        );
    } else if (nip05 === null) {
      return (
        <Card {...cardProps}>
          <Text fontWeight="bold">{address}</Text>
          <Text color="red.500" ml="auto">
            Cant find identity
          </Text>
        </Card>
      );
    }

    return null;
  };

  return (
    <Flex as="form" direction="column" gap="2" onSubmit={connect} w="full">
      {loading && <Text fontSize="lg">{loading}</Text>}
      {!loading && (
        <>
          <FormControl>
            <FormLabel htmlFor="address">Nostr Address</FormLabel>
            <Flex gap="2">
              <Input
                id="address"
                type="email"
                isRequired
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="off"
              />
            </Flex>
          </FormControl>
          {renderStatus()}
        </>
      )}
      <Flex gap="2" mt="2">
        <Button variant="link" onClick={() => navigate("../")} mr="auto">
          Back
        </Button>
        {!loading && (
          <Button colorScheme="primary" as={RouterLink} to="/signin/address/create" variant="link" p="2">
            Find Provider
          </Button>
        )}
        <Button colorScheme="primary" type="submit" isLoading={!!loading} isDisabled={!nip05}>
          Connect
        </Button>
      </Flex>
    </Flex>
  );
}
