# Weather icon codes

The `https://meteomonitoring.am/api/weather/{lang}/{region}` endpoint reports the expected
weather only as an icon file name. Every day carries three of them:

```json
{
  "afternoon_icon": "2.png",
  "evening_icon": "2.png",
  "night_icon": "15.png"
}
```

Each name resolves to `https://meteomonitoring.am/img/whether/whether-api-icons/N.png`, where
`N` runs from **1 to 34**. `35.png` and above return 404.

The API carries no textual condition, and neither does the site: `app.js` renders every one of
these icons as `<img alt="">` and holds no condition dictionary. The icon number is the only
description of the weather that exists, so the tables below were recovered by decoding the images
themselves.

> [!IMPORTANT]
> **Every icon shown in this file is hot-linked to meteomonitoring.am.** None of the artwork is
> committed to this repository, so the pictures in the tables below are served live from
> `https://meteomonitoring.am/img/whether/whether-api-icons/`. If that path is renamed, the set
> is renumbered, or the artwork is redrawn, these tables break — and a renumbering would break
> them silently, showing a picture that no longer matches the condition its row claims. The
> **numbers** are the durable part of this document. Treat the images as a convenience borrowed
> from an upstream that owes us no stability, and re-check them against the source before
> trusting the table after any upstream change.

## How the icons encode the weather

The set is built on two independent axes.

**Colour encodes the time of day.** Day icons draw their clouds in blue (`#4a90c2`) with an
orange sun; night icons draw the same clouds in grey (`#8c8c8c`) with a yellow crescent moon.
The two families are otherwise identical in layout.

**The glyph decides the condition.** What sits under the cloud gives the precipitation type,
and the cloud arrangement gives the cloud amount:

| Glyph under the cloud | Condition | Example |
| --- | --- | :---: |
| nothing | dry | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/4.png" width="40" alt="icon 4"><br>`4.png` |
| slanted streaks or dashes | rain | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/5.png" width="40" alt="icon 5"><br>`5.png` |
| bolt with streaks | thunderstorm with rain | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/27.png" width="40" alt="icon 27"><br>`27.png` |
| bolt alone | thunderstorm, no rain | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/10.png" width="40" alt="icon 10"><br>`10.png` |
| snowflakes, sparse | light snow | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/11.png" width="40" alt="icon 11"><br>`11.png` |
| snowflakes, dense | snow | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/12.png" width="40" alt="icon 12"><br>`12.png` |
| snowflakes mixed with streaks | sleet | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/13.png" width="40" alt="icon 13"><br>`13.png` |
| wavy horizontal lines | fog | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/29.png" width="40" alt="icon 29"><br>`29.png` |
| straight horizontal dashes | mist / haze | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/31.png" width="40" alt="icon 31"><br>`31.png` |

| Cloud arrangement | Cloud amount | Example |
| --- | --- | :---: |
| sun or moon alone | clear | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/1.png" width="40" alt="icon 1"><br>`1.png` |
| sun or moon behind one cloud | partly cloudy | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/2.png" width="40" alt="icon 2"><br>`2.png` |
| sun or moon behind a cloud cluster | partly cloudy, broken | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/3.png" width="40" alt="icon 3"><br>`3.png` |
| cloud cluster, no sun or moon | cloudy | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/4.png" width="40" alt="icon 4"><br>`4.png` |
| one large cloud filling the frame | overcast | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/5.png" width="40" alt="icon 5"><br>`5.png` |

Every example above is a day icon; the night family draws the same shapes in grey. Each example
isolates one axis, so the other axis is still present in the picture and should be ignored when
reading that row. The large single cloud in particular never appears on its own — it always
carries a precipitation glyph — which is why the example for `overcast` also shows rain, and why
the example for `dry` had to be the cloud cluster instead.

## The table

Rows pair a day icon with the night icon drawing the same condition. The numbering runs out of
order past 24 because the last icons were added to the set after the original pairs.

| Day | Night | Weather |
| :---: | :---: | --- |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/1.png" width="40" alt="day icon 1"><br>`1.png`<br>☀️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/14.png" width="40" alt="night icon 14"><br>`14.png`<br>🌙 | clear |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/2.png" width="40" alt="day icon 2"><br>`2.png`<br>🌤️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/15.png" width="40" alt="night icon 15"><br>`15.png`<br>🌙☁️ | partly cloudy |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/3.png" width="40" alt="day icon 3"><br>`3.png`<br>⛅ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/16.png" width="40" alt="night icon 16"><br>`16.png`<br>🌙☁️ | partly cloudy, broken cloud |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/4.png" width="40" alt="day icon 4"><br>`4.png`<br>☁️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/17.png" width="40" alt="night icon 17"><br>`17.png`<br>☁️ | cloudy / overcast |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/5.png" width="40" alt="day icon 5"><br>`5.png`<br>🌧️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/18.png" width="40" alt="night icon 18"><br>`18.png`<br>🌧️ | rain, overcast |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/6.png" width="40" alt="day icon 6"><br>`6.png`<br>🌦️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/19.png" width="40" alt="night icon 19"><br>`19.png`<br>🌙🌧️ | rain, partly cloudy |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/7.png" width="40" alt="day icon 7"><br>`7.png`<br>🌧️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/20.png" width="40" alt="night icon 20"><br>`20.png`<br>🌧️ | rain, cloudy |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/8.png" width="40" alt="day icon 8"><br>`8.png`<br>⛈️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/21.png" width="40" alt="night icon 21"><br>`21.png`<br>🌙⛈️ | thunderstorm with rain, partly cloudy |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/9.png" width="40" alt="day icon 9"><br>`9.png`<br>⛈️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/22.png" width="40" alt="night icon 22"><br>`22.png`<br>⛈️ | thunderstorm with rain, cloudy |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/10.png" width="40" alt="day icon 10"><br>`10.png`<br>🌩️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/23.png" width="40" alt="night icon 23"><br>`23.png`<br>🌩️ | thunderstorm, no rain |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/11.png" width="40" alt="day icon 11"><br>`11.png`<br>🌨️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/30.png" width="40" alt="night icon 30"><br>`30.png`<br>🌨️ | light snow |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/12.png" width="40" alt="day icon 12"><br>`12.png`<br>❄️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/26.png" width="40" alt="night icon 26"><br>`26.png`<br>❄️ | snow |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/13.png" width="40" alt="day icon 13"><br>`13.png`<br>🌧️❄️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/24.png" width="40" alt="night icon 24"><br>`24.png`<br>🌧️❄️ | sleet, mixed rain and snow |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/27.png" width="40" alt="day icon 27"><br>`27.png`<br>⛈️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/28.png" width="40" alt="night icon 28"><br>`28.png`<br>⛈️ | thunderstorm with rain, overcast |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/29.png" width="40" alt="day icon 29"><br>`29.png`<br>🌫️ | <img src="https://meteomonitoring.am/img/whether/whether-api-icons/25.png" width="40" alt="night icon 25"><br>`25.png`<br>🌫️ | fog |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/31.png" width="40" alt="day icon 31"><br>`31.png`<br>🌫️ | &mdash; | mist / haze |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/32.png" width="40" alt="day icon 32"><br>`32.png`<br>🌩️ | &mdash; | thunderstorm without rain, partly cloudy |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/33.png" width="40" alt="day icon 33"><br>`33.png`<br>🌦️ | &mdash; | rain, sun and broken cloud |
| <img src="https://meteomonitoring.am/img/whether/whether-api-icons/34.png" width="40" alt="day icon 34"><br>`34.png`<br>⛈️ | &mdash; | thunderstorm with rain, sun and broken cloud |

Icons 31 to 34 exist only in the day colours. A forecast that needs a night icon for mist or
for a dry thunderstorm has nothing to fall back on, so those conditions presumably reuse a
neighbouring code at night.

### The emoji

The third line of each cell is the emoji to print for that icon, chosen as luminary plus
precipitation: the single standard emoji that comes closest to the artwork, and where no single
emoji covers the combination, the moon followed by the precipitation.

Emoji already read as daytime by default — ⛈️ is a lit storm cloud, not a nocturnal one — so a
🌙 prefix appears only on night rows where the moon is actually drawn in the icon. Night rows
whose artwork has no moon (`17`, `18`, `20`, `22`, `23`, `24`, `25`, `26`, `28`, `30`) therefore
carry exactly the same emoji as their day counterpart, which is correct: those icons genuinely
differ only in cloud colour, and nothing in them says day or night.

**The emoji vocabulary is coarser than the icon set, so it collides.** The 19 day icons map onto
only 12 distinct emoji and the 15 night icons onto 12, for 16 distinct emoji across all 34 codes.
`5`/`7` both give 🌧️, all four rain-bearing thunderstorms give ⛈️, fog and mist both give 🌫️,
and `15`/`16` share 🌙☁️ because Unicode has no moon-behind-cloud glyph to distinguish one cloud
from a cluster. The consequence for the bot: **map from the icon number, never from the emoji.**
The emoji is a display detail with no inverse — seeing ⛈️ in a message does not tell you which of
`8`, `9`, `27` or `34` produced it.

Four entries are multi-emoji sequences (🌙☁️, 🌙🌧️, 🌙⛈️, 🌧️❄️), and every emoji except 🌙 and
⛅ carries a U+FE0F variation selector that forces emoji rather than text presentation. Keep the
selector when copying these into source — dropping it makes some clients render a flat monochrome
glyph instead.

### Keeping this file and the code in step

[`src/icons.ts`](src/icons.ts) holds the machine readable half of the table above: one entry per
icon file name, carrying the emoji the bot prints and the **sha256 of the icon as it was when
this document was written**. The bot verifies the hash of every icon a forecast refers to, at
most once every 12 hours per icon, and marks the line with a `(!)` linking here when an icon no
longer matches. An icon code that is not in the table at all gets the same `(!)` with no emoji,
which is what would happen if the set ever grew past 34.

A failed request is not treated as a change — there is no signal in a request that did not
complete, and marking one would cry wolf on every network blip.

Because the marker lands in the message text, and the bot detects a new forecast by hashing that
text, an icon changing upstream also pushes a message to subscribers. That is intentional: it is
the loudest channel this bot has.

If a row above is corrected, or the artwork upstream legitimately changes, the emoji **and** the
hash in `src/icons.ts` both have to be updated, or the bot will keep flagging a row this file
says is fine.

## Which column applies

`afternoon_icon` and `evening_icon` both draw from the **day** column, `night_icon` from the
**night** column. Evening is not a separate family, despite the name.

`evening_icon` is only populated for region 1, Yerevan. Other regions return an empty string
for it, the same way they return empty strings for parts of the day that have no data.

## How the table was verified

Two checks back the mapping.

The images were decoded and inspected directly. All 34 files are 80x80 8-bit RGBA PNGs, all
34 are distinct, and their palettes split cleanly into the blue-and-orange day family and the
grey-and-yellow night family described above.

The day and night split was then confirmed against live data, independently of the images, by
tallying which icon numbers appear in which field across regions 1 to 12. Codes 2, 8 and 27
appear only in `afternoon_icon` and `evening_icon`; codes 15, 16 and 21 appear only in
`night_icon`. No code was ever seen in both a day field and a night field.

The time of day and the precipitation type are solid. The **cloud amount wording is
interpretive** — the icons genuinely differ in cloud arrangement and the difference is
consistent, but the choice of the words "overcast", "cloudy" and "partly cloudy" for those
arrangements is a reading of the artwork, not something the API states.

Recovered 2026-08-18 against the icon set live at that date. The set is versionless, so a
redraw upstream would not announce itself.
