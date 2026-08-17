# [meteomonitoring.am bot](https://t.me/MeteomonitoringAmBot)

This is a telegram bot for getting forecast from [meteomonitoring.am](https://meteomonitoring.am) for Yerevan, Armenia.

The bot polls the `https://meteomonitoring.am/api/weather/ru/1` endpoint and sends the 6 day forecast as text to its subscribers whenever the forecast changes. Subscribe with `/subscribe`, unsubscribe with `/unsubscribe`.

### Installation

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
