import React, { useCallback, useContext } from 'react';
import useAppRoot from '../components/context/useAppRoot';
import { get, ref } from 'firebase/database';
import { DayRow, default_twitter } from '../components/state/interfaces';
import { PublicKey } from '@solana/web3.js';
import { uInt32ToLEBytes, uInt8ToLEBytes } from '../components/blog/apps/common';
import { PROGRAM } from '../components/state/constants';


export const useGetDaysWinners = () => {
    const { database, entryList, userIDs, leaderboardList, twitterList } = useAppRoot();
  
    return useCallback(async (date: number, setDayRows: React.Dispatch<React.SetStateAction<DayRow[]>>) => {
      if (database === null || entryList === null || twitterList === null || userIDs === null || leaderboardList === null) {
        setDayRows([]);
        return;
      }
  
      // get the listings
        const entries_db = await get(ref(database, "BlinkBash/entries/0/" + date));
        let entries = entries_db.val();
        if (entries === null) {
            setDayRows([]);
            return;
        }
        let leaderboard_account = PublicKey.findProgramAddressSync(
            [uInt8ToLEBytes(0), uInt32ToLEBytes(date), Buffer.from("Leaderboard")],
            PROGRAM,
        )[0];

        let leaderboard = leaderboardList.get(leaderboard_account.toString());

        if (leaderboard === undefined) {
            setDayRows([]);
            return;
        }

        if (leaderboard.scores.length === 0) {
            setDayRows([]);
            return;
        }

        const prompt_db = await get(ref(database, "BlinkBash/prompts/0/" + date));
        let prompt_val = prompt_db.val();

        if (prompt_val === null) {
            setDayRows([]);
            return;
        }
        let json = JSON.parse(prompt_val.toString());
        let prompt_url = json["url"];
        // Sort the indices based on scores (in descending order)
        const indices = Array.from(leaderboard.scores.keys());

        // Sort the indices based on scores (in descending order)
        indices.sort((a, b) => leaderboard.scores[b] - leaderboard.scores[a]);

        // Use the sorted indices to reorder the entrants
        const sortedEntrants = indices.map((i) => leaderboard.entrants[i]);

        let day_rows: DayRow[] = [];

        let max_index = Math.min(3, sortedEntrants.length);
        for (let i = 0; i < max_index; i++) {
            let key = userIDs.get(sortedEntrants[i]);
            let json = JSON.parse(entries[key].toString());

            let creator = new PublicKey(key);
            let entry_account = PublicKey.findProgramAddressSync([creator.toBytes(), uInt8ToLEBytes(0), uInt32ToLEBytes(date)], PROGRAM)[0];
            let entry = entryList.get(entry_account.toString());
            console.log("entry in get winners", entry_account.toString(), entry, creator.toString(), date)
            let twitter = twitterList.get(key);
            if (entry === null) {
                return;
            }

            if (twitter === undefined) {
                twitter = default_twitter;
            }

            if (entry.positive_votes + entry.negative_votes === 0) {
                // skip if no votes
                continue;
            }

            let row: DayRow = {
                key: key,
                twitter: twitter,
                score: entry.positive_votes - entry.negative_votes,
                link: "https://blinkbash.daoplays.org/api/blink?creator=" + key + "&game=0&date=" + date,
                entry: json.entry,
                prompt: prompt_url,
                claimed: entry.reward_claimed === 1,
            };

            day_rows.push(row);
        }
        //console.log(day_rows);
        setDayRows(day_rows);
    }, [database, entryList, userIDs, leaderboardList, twitterList]); // Dependencies from context
  };