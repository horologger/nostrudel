import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";
import { Kind } from "nostr-tools";
import { useSearchParams } from "react-router-dom";

import { useCurrentAccount } from "../hooks/use-current-account";
import { getPubkeysFromList } from "../helpers/nostr/lists";
import useReplaceableEvent from "../hooks/use-replaceable-event";
import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { searchParamsToJson } from "../helpers/url";

export type ListId = "following" | "global" | string;
export type Person = { pubkey: string; relay?: string };

export type PeopleListContextType = {
  selected: ListId;
  listId?: string;
  listEvent?: NostrEvent;
  people: Person[] | undefined;
  setSelected: (list: ListId) => void;
  filter: NostrQuery | undefined;
};
const PeopleListContext = createContext<PeopleListContextType>({
  setSelected: () => {},
  people: undefined,
  selected: "global",
  filter: undefined,
});

export function usePeopleListContext() {
  return useContext(PeopleListContext);
}

function useListCoordinate(listId: ListId) {
  const account = useCurrentAccount();

  return useMemo(() => {
    if (listId === "following") return account ? `${Kind.Contacts}:${account.pubkey}` : undefined;
    if (listId === "global") return undefined;
    return listId;
  }, [listId, account]);
}

export type PeopleListProviderProps = PropsWithChildren & {
  initList?: ListId;
};
export default function PeopleListProvider({ children, initList = "following" }: PeopleListProviderProps) {
  const [params, setParams] = useSearchParams({
    people: initList,
  });

  const selected = params.get("people") as ListId;
  const setSelected = useCallback(
    (value: ListId) => {
      setParams((p) => ({ ...searchParamsToJson(p), people: value }));
    },
    [setParams],
  );

  const listId = useListCoordinate(selected);
  const listEvent = useReplaceableEvent(listId, [], true);

  const people = listEvent && getPubkeysFromList(listEvent);

  const filter = useMemo<NostrQuery | undefined>(() => {
    if (selected === "global") return {};
    return people && { authors: people.map((p) => p.pubkey) };
  }, [people, selected]);

  const context = useMemo(
    () => ({
      people,
      selected,
      listId,
      listEvent,
      setSelected,
      filter,
    }),
    [selected, setSelected, people, listEvent],
  );

  return <PeopleListContext.Provider value={context}>{children}</PeopleListContext.Provider>;
}
