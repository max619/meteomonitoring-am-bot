import fetch from "node-fetch";
import { Agent } from "http";
import { createHash } from "crypto";
import { checkIcons, formatIcon, type IconStatus } from "./icons.js";

// Language and region of the forecast endpoint.
// Region 1 is Yerevan, the only region that returns a single entry per day.
const lang = "ru";
const regionId = 1;
const apiUrl = `https://meteomonitoring.am/api/weather/${lang}/${regionId}`;

// A single day as returned by the API. Temperatures come as a [min, max] pair,
// humidity as a string, and both may be empty when there is no data. The icons
// are bare file names, see icons.ts and WEATHER_ICONS.MD.
type ForecastDay = {
  date: string;
  fullDay: string;
  region_name: string;
  temperature_afternoon: number[];
  temperature_evening: number[];
  temperature_night: number[];
  humidity_afternoon: string;
  humidity_evening: string;
  humidity_night: string;
  afternoon_icon: string;
  evening_icon: string;
  night_icon: string;
};

// The endpoint returns days keyed by date. Regions other than Yerevan return an
// array of sub regions per date, so a day may come as either shape.
type ForecastResponse = Record<string, ForecastDay | ForecastDay[]>;

export type Forecast = {
  text: string;
  hash: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatTemperature(temperature: number[]): string | null {
  if (!temperature || temperature.length === 0) {
    return null;
  }

  const [min, max] = temperature;
  return max === undefined || max === min
    ? `${min} °C`
    : `${min}…${max} °C`;
}

function formatPartOfDay(
  label: string,
  temperature: number[],
  humidity: string,
  icon: string
): string | null {
  const formattedTemperature = formatTemperature(temperature);
  if (!formattedTemperature) {
    return null;
  }

  const weather = humidity
    ? `${label}: ${formattedTemperature}, влажность ${humidity}%`
    : `${label}: ${formattedTemperature}`;

  return icon ? `${icon} ${weather}` : weather;
}

function formatDay(
  day: ForecastDay,
  statuses: Map<string, IconStatus>
): string | null {
  const parts = [
    formatPartOfDay(
      "Днём",
      day.temperature_afternoon,
      day.humidity_afternoon,
      formatIcon(day.afternoon_icon, statuses)
    ),
    formatPartOfDay(
      "Вечером",
      day.temperature_evening,
      day.humidity_evening,
      formatIcon(day.evening_icon, statuses)
    ),
    formatPartOfDay(
      "Ночью",
      day.temperature_night,
      day.humidity_night,
      formatIcon(day.night_icon, statuses)
    ),
  ].filter((part) => part !== null);

  if (parts.length === 0) {
    return null;
  }

  return [`<b>${escapeHtml(day.fullDay)}</b>`, ...parts].join("\n");
}

function formatForecast(
  days: ForecastDay[],
  statuses: Map<string, IconStatus>
): string | null {
  const formattedDays = days
    .map((day) => formatDay(day, statuses))
    .filter((day) => day !== null);

  if (formattedDays.length === 0) {
    return null;
  }

  const header = `<b>Прогноз погоды в ${escapeHtml(days[0].region_name)}</b>`;
  return [header, ...formattedDays].join("\n\n");
}

// Flattens the response into a list of days sorted by date
function parseForecastDays(response: ForecastResponse): ForecastDay[] {
  return Object.keys(response)
    .sort()
    .flatMap((date) => {
      const day = response[date];
      return Array.isArray(day) ? day : [day];
    });
}

export async function fetchForecast(
  agent?: Agent
): Promise<Forecast | null> {
  try {
    const response = await fetch(apiUrl, { agent });
    if (!response.ok) {
      console.error(
        `Error fetching forecast: ${response.statusText}. From ${apiUrl}`
      );
      return null;
    }

    const days = parseForecastDays((await response.json()) as ForecastResponse);
    const statuses = await checkIcons(
      days.flatMap((day) => [
        day.afternoon_icon,
        day.evening_icon,
        day.night_icon,
      ]),
      agent
    );

    const text = formatForecast(days, statuses);
    if (!text) {
      console.error(`Fetched forecast has no data. From ${apiUrl}`);
      return null;
    }

    const hash = createHash("md5").update(text).digest("hex");
    console.log(`Fetched forecast for ${days.length} day(s), hash: ${hash}`);

    return { text, hash };
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return null;
  }
}
