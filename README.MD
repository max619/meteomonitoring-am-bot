# [meteomonitoring.am bot](https://t.me/MeteomonitoringAmBot)

This is a telegram bot for getting forecast from [meteomonitoring.am](https://meteomonitoring.am) for Yerevan, Armenia.

The bot polls the `https://meteomonitoring.am/api/weather/ru/1` endpoint and sends the 6 day forecast as text to its subscribers whenever the forecast changes. Subscribe with `/subscribe`, unsubscribe with `/unsubscribe`.

Each part of the day is prefixed with an emoji for the expected weather. The api reports the weather only as an icon file name with no textual condition anywhere, so [WEATHER_ICONS.MD](WEATHER_ICONS.MD) documents what each of the 34 icons means and which emoji stands in for it. The icon set is versionless, so the bot also stores a hash of every icon and prefixes the line with a `(!)` linking to that document when an icon has been redrawn upstream and its emoji can no longer be trusted.

### Installation with Docker

1. Clone the repository and create a `data` dir holding the `config.json`, see the config format in the step 4 of the systemd installation below

```sh
git clone https://github.com/max619/meteomonitoring-am-bot.git
cd meteomonitoring-am-bot
mkdir -p data
cp config.template.json data/config.json
```

2. Give the dir to uid 1000, the `node` user the container runs as, so the bot can create its database

```sh
sudo chown -R 1000:1000 data
```

3. Build the image and start the bot

```sh
docker compose up -d --build
```

The container runs with `/data` as its working directory, so the whole state of the bot is the `data` dir, holding the `config.json` you created and the `subscribers.db` the bot creates next to it. Both survive a rebuild.

Follow the logs with `docker compose logs -f` and stop the bot with `docker compose down`.

To run the image without compose, mount the same dir yourself:

```sh
docker build -t meteomonitoring-am-bot .
docker run -d --name meteomonitoring-am-bot --restart unless-stopped \
  -v "$PWD/data:/data" \
  meteomonitoring-am-bot
```

Mount the dir, never the `config.json` alone. Docker silently creates a directory in the place of any bind mount source that does not exist yet, and a `config.json` directory makes the container fail to start with `not a directory`.

A `proxy` pointing at `127.0.0.1` resolves to the container itself, not to the host. Point it at `host.docker.internal` for a proxy running on the host, or at the service name when the proxy is another container on the same network.

### Installation with systemd

1. Clone the repository into `/opt/meteomonitoring-am-bot`

```sh
git clone https://github.com/max619/meteomonitoring-am-bot.git /opt/meteomonitoring-am-bot
```

2. Go to the cloned repository dir, download dependences and build

```sh
cd /opt/meteomonitoring-am-bot
yarn
yarn build
```

3. Install a service

```sh
ln -s /opt/meteomonitoring-am-bot/meteomonitoring.service /lib/systemd/system/meteomonitoring.service
```

4. Create a `config.json` file in the root of the project. Add your Telegram bot token to the `config.json` file

```json
{
  "token": "<token>",
  "checkTimeout": "120"
}
```

Optionally add a `proxy` field to route both the Telegram API and the forecast requests through a SOCKS5 proxy. Only the `socks5://` and `socks5h://` schemes are supported, `socks5h://` resolves the host names on the proxy side. Credentials are optional. Without the field the requests are made directly.

```json
{
  "token": "<token>",
  "checkTimeout": "120",
  "proxy": "socks5h://user:password@127.0.0.1:1080"
}
```

5. Add user meteomontoring and update files permissions

```sh
useradd meteomonitoring
chown meteomonitoring:meteomonitoring config.json
chmod 660 config.json
chmod 664 meteomonitoring.service
```

6. Enable and start the service

```sh
systemctl enable meteomonitoring
systemctl start meteomonitoring
```

### PS

That bot was created using [Cursor AI](https://www.cursor.com/) just to try it out.
