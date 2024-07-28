import { create } from "zustand";
import { get, ref } from "firebase/database";
import { PublicKey } from "@solana/web3.js";
import { uInt32ToLEBytes, uInt8ToLEBytes } from "../components/blog/apps/common";
import { default_twitter } from "../components/state/interfaces";
import { PROGRAM } from "../components/state/constants";

type DayRow = {
    key: string;
    twitter: any;
    score: number;
    link: string;
    entry: any;
    prompt: string;
    claimed: boolean;
};

interface DayEntriesState {
    dayEntries: DayRow[];
    getDayEntries: (database: any, entry_data: Map<string, any>, twitter_db: Map<string, any>, date: number) => void;
}

const useDayEntriesStore = create<DayEntriesState>((set) => ({
    dayEntries: [],
    getDayEntries: async (database, entry_data, twitter_db, date) => {
        if (!database || !entry_data || !twitter_db) {
            set({ dayEntries: [] });
            return;
        }

        try {
            const entriesDb = await get(ref(database, "BlinkBash/entries/0/" + date));
            const entries = entriesDb.val();

            if (!entries) {
                set({ dayEntries: [] });
                return;
            }

            const promptDb = await get(ref(database, "BlinkBash/prompts/0/" + date));
            const promptVal = promptDb.val();

            if (!promptVal) {
                set({ dayEntries: [] });
                return;
            }

            let promptUrl = "";
            try {
                const json = JSON.parse(promptVal.toString());
                promptUrl = json.url;
            } catch (error) {
                console.error("Error parsing prompt JSON:", error);
                set({ dayEntries: [] });
                return;
            }

            const dayRows = await Promise.all(
                Object.entries(entries).map(async ([key, value]) => {
                    try {
                        const json = JSON.parse(value.toString());
                        const creator = new PublicKey(key);
                        const entryAccount = PublicKey.findProgramAddressSync(
                            [creator.toBytes(), uInt8ToLEBytes(0), uInt32ToLEBytes(date)],
                            PROGRAM,
                        )[0];

                        const entry = entry_data.get(entryAccount.toString());
                        const twitter = twitter_db.get(key) || default_twitter;

                        if (!entry) return null;

                        return {
                            key,
                            twitter,
                            score: entry.positive_votes - entry.negative_votes,
                            link: `https://blinkbash.daoplays.org/api/blink?creator=${key}&game=0&date=${date}`,
                            entry: json.entry,
                            prompt: promptUrl,
                            claimed: entry.reward_claimed === 1,
                        };
                    } catch (error) {
                        console.error("Error processing entry:", error);
                        return null;
                    }
                }),
            );

            const filteredRows = dayRows.filter((row) => row !== null) as DayRow[];
            set({ dayEntries: filteredRows.sort((a, b) => b.score - a.score) });
        } catch (error) {
            console.error("Error fetching day entries:", error);
            set({ dayEntries: [] });
        }
    },
}));

export default useDayEntriesStore;
