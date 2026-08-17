import fetch from "node-fetch";
import { Agent } from "http";
import { createHash } from "crypto";

// The forecast api names the weather only by an icon file name, and neither the
// api nor the site carries a textual condition. WEATHER_ICONS.MD documents how
// each icon was decoded, and this table is the machine readable half of it.
const iconsDocUrl =
  "https://github.com/max619/meteomonitoring-am-bot/blob/main/WEATHER_ICONS.MD";

const iconBaseUrl = "https://meteomonitoring.am/img/whether/whether-api-icons";

// The emoji stands in for the icon in the message text. The hash is the safety
// net: the icon set is versionless, so a redraw upstream would silently leave
// every emoji below meaning something else.
type Icon = {
  emoji: string;
  sha256: string;
};

const icons: Record<string, Icon> = {
  "1.png": { emoji: "☀️", sha256: "a9fd5f0e5661b79f973c81b3209dd0e5f87f773a0e30e57bed101847c465ae27" },
  "2.png": { emoji: "🌤️", sha256: "21a3727464ec72131394020a8db87bc9e481a8e2ce8cd2dc84543b17d47241b5" },
  "3.png": { emoji: "⛅", sha256: "31e4aa8e2b3491496f8b8f6497aeffd627c60f5fc2356ccdcab9de5bfc419f43" },
  "4.png": { emoji: "☁️", sha256: "80f64a1b00470967eaf65044cdde9deed6bc0efd71844a4f1325a1a91aac9c5d" },
  "5.png": { emoji: "🌧️", sha256: "3037b654957c37b32f1d1d373ee9faaa87eb83f92acd0688200e70f868694534" },
  "6.png": { emoji: "🌦️", sha256: "a1a117d313ac733011b4c627e8791a676e36a7c02a47afa17de4282c8aaa4263" },
  "7.png": { emoji: "🌧️", sha256: "fd44f53f5d919d9cb166546bb25ab10d70e76b80dd786fdc3d9c7b7eb970bedb" },
  "8.png": { emoji: "⛈️", sha256: "a1407a537a724618f8bc0ba0b1821e57fab62880c2045ab1d9d4bfab49e58392" },
  "9.png": { emoji: "⛈️", sha256: "6d0955204a039db6869f5e31b3f198b810f63f7db807f0cc029d41ca4c260c5e" },
  "10.png": { emoji: "🌩️", sha256: "64c83e7a140fbf8ac5fc7fe1db3be4b563f4392ea0bb51c61ee30895c476a352" },
  "11.png": { emoji: "🌨️", sha256: "88b95db26b20c8b0cc1988777fba2d47a99bb673edbd86a25fa0e5324dd45769" },
  "12.png": { emoji: "❄️", sha256: "6a8f1fc819506824ef13936b3b110e7e0869ba1d931882be0b469106ed1b895d" },
  "13.png": { emoji: "🌧️❄️", sha256: "4bac1326c784f3a56b5f44f59b9d85eb0782f44a9fbaceae59c04dd8866c0ea5" },
  "14.png": { emoji: "🌙", sha256: "5b04303c969e4f321e5eebdacd1ac6cde5d24529f71a70fba96a7d092dbd2b14" },
  "15.png": { emoji: "🌙☁️", sha256: "13c082feb3808e930fb0078de890774723f6aa97159bb24a1e0a483a0caafed6" },
  "16.png": { emoji: "🌙☁️", sha256: "7dc0e48c1f40c3f8a4593ba69535abffffb124f1fd3a9c6eed5d48ded704edcb" },
  "17.png": { emoji: "☁️", sha256: "e8e6dffe0c4822df52a2fb926429a4bf46272bb59c69a6532ff7feea0e5315a1" },
  "18.png": { emoji: "🌧️", sha256: "166070fb48514a03d627bdd5854a3d5cdf663c6792ded107f1f1f3b1cff20771" },
  "19.png": { emoji: "🌙🌧️", sha256: "cf1e75d311a19261b89e4385b097ed28f3e9ea3181c3975c63c89b8064877c10" },
  "20.png": { emoji: "🌧️", sha256: "e087f4d7eb5b284c61e40f27fca139c07079f2a93df59137fafd483eee04ce64" },
  "21.png": { emoji: "🌙⛈️", sha256: "fe98832e4556252ec5a94e6909eb43c17c4179c9a610675bb19163bed7df1644" },
  "22.png": { emoji: "⛈️", sha256: "e008d7699ef2d873e87a9d9fe0c2f3765607f40fd1d97b656f347e25d15f487a" },
  "23.png": { emoji: "🌩️", sha256: "b586ddac57f009bc0c8f3d3b3518b2bab90e0f7919b255832df8b2eb62feaac4" },
  "24.png": { emoji: "🌧️❄️", sha256: "4803b58c82f470612617f11cb3be60cf875fd90eec0a96f0238be617aa5c013d" },
  "25.png": { emoji: "🌫️", sha256: "6dcd452dc71b9ce99e600f4e5d1b8bec513a6b3075f26ed819d76519124ded0a" },
  "26.png": { emoji: "❄️", sha256: "2ce0276cd6df4395dacb89c37275a7f3a247ac9c8ee300ec1f431b0c91b8e6aa" },
  "27.png": { emoji: "⛈️", sha256: "ea7e61a8f078e8edf9fb437e8d9cc33a0b4adae2264caaa96457f0c250116966" },
  "28.png": { emoji: "⛈️", sha256: "0a3b845787e43e55df70fdfb8fb17d3c89f2f86f4fd4152dda15f72eda4b2f9a" },
  "29.png": { emoji: "🌫️", sha256: "4c18c764b7b1d399bfc19cf6361ba899e9082356cbd7d4408fac545df5951cef" },
  "30.png": { emoji: "🌨️", sha256: "690cb656f82134dc18ae349fe5c6db785a0e30e399b84d88054a773f207002ad" },
  "31.png": { emoji: "🌫️", sha256: "0315a4952cec8cf7f2d2182d846d000980232e3b9b363bc3d8ab5ac68acae72d" },
  "32.png": { emoji: "🌩️", sha256: "b74b6dd377e7218366d2d7d1751a756d19661ee73fef1e22afedbb64f529dbb6" },
  "33.png": { emoji: "🌦️", sha256: "bae24e9ad1be15b4c58deacef7d6ab0a6eeecec90ae7eee80bfec4567fb593d3" },
  "34.png": { emoji: "⛈️", sha256: "4ad5e68986ba50c10a6e6246d962e5beccae50e6551308d3250a1f05dc4a8876" },
};

// Appended to the emoji when the icon behind it can no longer be trusted
const warning = `<a href="${iconsDocUrl}">(!)</a>`;

// How long a verified icon stays verified. The icons change about never, and
// the forecast is polled every few minutes, so re-reading them on every poll
// would be all cost and no signal.
const recheckAfterMs = 12 * 60 * 60 * 1000;

export type IconStatus =
  // The bytes still match the icon the emoji was chosen for
  | "known"
  // The icon still exists but has been redrawn, so the emoji may be wrong
  | "changed"
  // An icon the table has never seen, so there is no emoji for it at all
  | "unknown";

type CachedStatus = {
  status: IconStatus;
  checkedAt: number;
};

const cache = new Map<string, CachedStatus>();

async function fetchIconSha256(
  name: string,
  agent?: Agent
): Promise<string | null> {
  const url = `${iconBaseUrl}/${name}`;
  try {
    const response = await fetch(url, { agent });
    if (!response.ok) {
      console.error(
        `Error fetching icon: ${response.statusText}. From ${url}`
      );
      return null;
    }

    return createHash("sha256")
      .update(Buffer.from(await response.arrayBuffer()))
      .digest("hex");
  } catch (error) {
    console.error(`Error fetching icon from ${url}:`, error);
    return null;
  }
}

async function checkIcon(name: string, agent?: Agent): Promise<IconStatus> {
  const icon = icons[name];
  if (!icon) {
    return "unknown";
  }

  const cached = cache.get(name);
  if (cached && Date.now() - cached.checkedAt < recheckAfterMs) {
    return cached.status;
  }

  const sha256 = await fetchIconSha256(name, agent);
  if (sha256 === null) {
    // The icon could not be read, which says nothing about whether it changed.
    // Keep the last verdict rather than crying wolf over a failed request.
    return cached ? cached.status : "known";
  }

  const status: IconStatus = sha256 === icon.sha256 ? "known" : "changed";
  if (status === "changed") {
    console.error(
      `Icon ${name} has changed, expected sha256 ${icon.sha256}, got ${sha256}. ` +
        `The emoji for it may no longer match, see ${iconsDocUrl}`
    );
  }

  cache.set(name, { status, checkedAt: Date.now() });
  return status;
}

// Verifies every icon a forecast refers to. Icons repeat heavily across the
// days of one forecast, so they are deduplicated before being fetched.
export async function checkIcons(
  names: string[],
  agent?: Agent
): Promise<Map<string, IconStatus>> {
  // The api spells a part of the day with no icon as an empty string. Anything
  // else falsy would mean the field went missing altogether, which is not a
  // changed icon, so it is dropped here rather than reported as one.
  const distinct = [...new Set(names.filter((name) => name))];
  const statuses = await Promise.all(
    distinct.map((name) => checkIcon(name, agent))
  );

  return new Map(distinct.map((name, index) => [name, statuses[index]]));
}

// The emoji for an icon, followed by a link to WEATHER_ICONS.MD when the icon
// is no longer the one the emoji was chosen for. Returns an empty string for
// the parts of the day the api leaves without an icon.
export function formatIcon(
  name: string,
  statuses: Map<string, IconStatus>
): string {
  if (!name) {
    return "";
  }

  const status = statuses.get(name) ?? "unknown";
  if (status === "unknown") {
    return warning;
  }

  const emoji = icons[name].emoji;
  return status === "changed" ? `${emoji} ${warning}` : emoji;
}
