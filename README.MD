# [meteomonitoring.am bot](https://t.me/MeteomonitoringAmBot)

This is a telegram bot for getting forecast from [meteomonitoring.am](https://meteomonitoring.am) for Yerevan, Armenia.

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
