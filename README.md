# The Privy Council ／ 百官朝議 🏛️

**You are the sovereign. An entire AI court argues your decision out in front of you, then the chronicler writes it down.**

Ask one question. The counsellors rise one by one, each locked to a single perspective, and they argue with each other rather than politely agreeing with you. Two courts are available, each in its own language.

**The Royal Court (English).** A Tudor-style privy council. The Lord High Treasurer counts the coin and punctures your arithmetic. The Earl Marshal names the enemy. The Spymaster, in the mould of Walsingham, plays the adversary and tells you exactly where you would be struck. The Court Jester is the only soul in the realm licensed to tell you the truth and keep his head, so he mocks every counsellor by name. The Astronomer Royal reads your stars, strictly for amusement. From behind the arras, the Queen Mother rules, the Royal Favourite flatters, and the Lord Privy Seal quietly filters out everything you would rather not hear. At the last, the Royal Chronicler takes up the pen.

**明代朝堂（中文）.** A Ming dynasty imperial court. 內閣首輔開場定調、六部尚書各就本職奏對、東廠模擬敵人攻勢、錦衣衛佈防、都察院御史專門找碴彈劾。簾後太后垂簾聽政、貴妃講盡好話、司禮監掌印太監報喜不報憂。最後太史令執筆，寫成一卷可以帶走的《起居注實錄》。

Too tired to hold court? Press **"I am weary"** ／「朕乏了」and the Lord Protector rules in your stead.

## Features

- **Two courts, seventeen roles each.** Every office has its own persona and maps to a modern business function (CEO, CFO, CTO, red team, devil's advocate). The whole interface, including every word the court speaks, follows the court you choose.
- **Meddling from behind the arras.** The Queen Mother speaks last, after the Jester and before the Chronicler, and gives or withholds her blessing. The Consort, the Favourite and the Privy Seal slip notes into the chamber at unpredictable moments. How often they meddle is up to you. The censor (Jester ／ 御史) denounces them for it every single time.
- **Two systems of divination.** The Astronomer Royal ／ 欽天監正 reads either the Western zodiac or Chinese Bazi. Your sign is inferred from your date of birth. This is a joke and is labelled as one.
- **Tell the court who you are.** Your regnal name, your likeness, and who you are in the mortal world: your trade, your domain, what weighs on you. Every counsellor takes it into account. Fill this in. It makes the advice dramatically more specific.
- **Mix models freely.** Anthropic (Claude), OpenAI (GPT) and Google (Gemini). Set a default, or cast each role with a different model. Give the sharpest models to the offices that need judgement (Chancellor, Jester, Queen Mother, Chronicler) and let a cheap model play the Favourite, who only ever has to agree with you.
- **Streaming, with staging.** The speaking counsellor steps forward, grows, and catches the light. The rest recede into shadow. The Chronicle unrolls as a scroll.
- **Your API key never leaves your browser.** It lives in localStorage and goes straight to each provider. There is no server. There is nothing to trust us with.

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Push to GitHub.
2. On [vercel.com](https://vercel.com), choose **Add New → Project** and import the repository.
3. Vercel detects Vite on its own (build `vite build`, output `dist`). Press **Deploy**.
4. Every push after that redeploys itself.

## Cost

Every counsellor who speaks is one API call. The default cast is four counsellors plus the Chronicler, so five calls per session. A full court, all seventeen roles with constant meddling, runs closer to twenty. Adjust the cast under **Summon** ／「點將」.

## Adding a court or a role

Each court is one self-contained file: [`src/courts/west.js`](src/courts/west.js) and [`src/courts/east.js`](src/courts/east.js). Interface strings and prompt assembly live in [`src/courts/index.js`](src/courts/index.js).

To add a counsellor, copy an existing entry, write the persona, and add the id to that court's `speakOrder`. To add a whole new court (a Roman senate, a Norse thing, a corporate board), write one more file in `src/courts/` and register it in the index. The chooser screen picks it up by itself.

Portraits live in `public/avatars/`.

## Licence

MIT
